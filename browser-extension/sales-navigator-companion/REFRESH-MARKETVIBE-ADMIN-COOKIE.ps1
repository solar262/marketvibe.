[CmdletBinding()]
param(
  [int]$DebugPort = 9223,
  [switch]$VerifyAdmin
)

$ErrorActionPreference = "Stop"
$credentialTarget = "MarketVibe Navigator Admin Session"
$expectedEmail = "solardynamics592@gmail.com"

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MarketVibeCredentialStore {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public UInt32 Flags; public UInt32 Type; public IntPtr TargetName; public IntPtr Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public UInt32 CredentialBlobSize; public IntPtr CredentialBlob; public UInt32 Persist;
    public UInt32 AttributeCount; public IntPtr Attributes; public IntPtr TargetAlias; public IntPtr UserName;
  }
  [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, UInt32 type, UInt32 flags, out IntPtr credential);
  [DllImport("advapi32.dll", SetLastError = true)] public static extern void CredFree(IntPtr buffer);
}
'@

function Get-SessionCredential {
  $pointer = [IntPtr]::Zero
  if (-not [MarketVibeCredentialStore]::CredRead($credentialTarget, 1, 0, [ref]$pointer)) {
    throw "Navigator admin session credential is unavailable in Windows Credential Manager."
  }
  try {
    $credential = [Runtime.InteropServices.Marshal]::PtrToStructure($pointer, [type][MarketVibeCredentialStore+CREDENTIAL])
    $email = [Runtime.InteropServices.Marshal]::PtrToStringUni($credential.UserName)
    if ($email -ne $expectedEmail -or $credential.CredentialBlobSize -eq 0) {
      throw "Navigator admin session credential is invalid."
    }
    $bytes = New-Object byte[] $credential.CredentialBlobSize
    [Runtime.InteropServices.Marshal]::Copy($credential.CredentialBlob, $bytes, 0, $bytes.Length)
    try {
      return @{ Email = $email; SecretBytes = $bytes }
    } catch {
      [Array]::Clear($bytes, 0, $bytes.Length)
      throw
    }
  } finally {
    [MarketVibeCredentialStore]::CredFree($pointer)
  }
}

function Invoke-Cdp([string]$socketUrl, [int]$id, [string]$method, $params) {
  $socket = [System.Net.WebSockets.ClientWebSocket]::new()
  try {
    $socket.ConnectAsync([Uri]$socketUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Compress -Depth 8
    $outbound = [Text.Encoding]::UTF8.GetBytes($payload)
    $socket.SendAsync([ArraySegment[byte]]::new($outbound), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    $buffer = New-Object byte[] 65536
    do {
      $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
      $response = [Text.Encoding]::UTF8.GetString($buffer, 0, $received.Count) | ConvertFrom-Json
    } while ($response.id -ne $id)
    return $response
  } finally {
    if ($socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
      $socket.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "done", [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    }
    $socket.Dispose()
  }
}

function Get-CdpTargets([int]$port) {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/json/list" -TimeoutSec 2 -UseBasicParsing
  return ($response.Content | ConvertFrom-Json)
}

$session = Get-SessionCredential
try {
  $hmac = [Security.Cryptography.HMACSHA256]::new($session.SecretBytes)
  try {
    $payloadBytes = [Text.Encoding]::UTF8.GetBytes("marketvibe-admin:$($session.Email)")
    try { $cookieValue = ([BitConverter]::ToString($hmac.ComputeHash($payloadBytes))).Replace("-", "").ToLowerInvariant() }
    finally { [Array]::Clear($payloadBytes, 0, $payloadBytes.Length) }
  } finally { $hmac.Dispose() }

  $targets = $null
  for ($attempt = 0; $attempt -lt 30 -and -not $targets; $attempt++) {
    try { $targets = Get-CdpTargets $DebugPort } catch { Start-Sleep -Milliseconds 500 }
  }
  $target = @($targets | Where-Object { [string]$_.type -eq "page" })[0]
  if (-not $target.websocketDebuggerUrl) { throw "Navigator browser CDP endpoint is unavailable." }

  $setResult = Invoke-Cdp $target.websocketDebuggerUrl 1 "Network.setCookie" @{
    name = "marketvibe_admin"; value = $cookieValue; domain = "www.marketvibe1.com"; path = "/"
    secure = $true; httpOnly = $true; sameSite = "Lax"
  }
  if ($setResult.error -or -not $setResult.result.success) { throw "Navigator admin cookie injection was rejected by CDP." }

  if ($VerifyAdmin) {
    $adminTarget = $null
    for ($attempt = 0; $attempt -lt 30 -and -not $adminTarget; $attempt++) {
      $latestTargets = Get-CdpTargets $DebugPort
      $adminTarget = @($latestTargets | Where-Object { [string]$_.url -match "marketvibe1\.com" })[0]
      if (-not $adminTarget) { Start-Sleep -Milliseconds 500 }
    }
    if (-not $adminTarget.websocketDebuggerUrl) { throw "MarketVibe admin tab is unavailable for authentication verification." }
    $navigate = Invoke-Cdp $adminTarget.websocketDebuggerUrl 2 "Page.navigate" @{ url = "https://www.marketvibe1.com/admin/import" }
    if ($navigate.error) { throw "MarketVibe admin navigation failed." }
    Start-Sleep -Seconds 3
    $check = Invoke-Cdp $adminTarget.websocketDebuggerUrl 3 "Runtime.evaluate" @{ expression = "location.pathname + '|' + document.body.innerText.slice(0,2000)"; returnByValue = $true }
    $pageText = [string]$check.result.result.value
    if ($check.error -or $pageText -match "(?i)admin login|sign in|/login") { throw "MarketVibe admin cookie was not accepted." }
  }
  Write-Output "MarketVibe admin cookie refreshed."
} finally {
  if ($cookieValue) { $cookieValue = $null }
  if ($session -and $session.SecretBytes) { [Array]::Clear($session.SecretBytes, 0, $session.SecretBytes.Length) }
}
