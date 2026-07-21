[CmdletBinding()]
param(
  [switch]$Foreground
)

$ErrorActionPreference = "Stop"
$profileRoot = "C:\MarketVibe\Profiles\SalesNavigator"
$extensionRoot = $PSScriptRoot
$edgeCandidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $edge) { throw "Microsoft Edge is not installed." }

New-Item -ItemType Directory -Force -Path $profileRoot | Out-Null

$profilePattern = '--user-data-dir(?:=|\s+)"?' + [regex]::Escape($profileRoot)
$running = Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match $profilePattern } |
  Select-Object -First 1
if ($running) {
  & (Join-Path $PSScriptRoot "REFRESH-MARKETVIBE-ADMIN-COOKIE.ps1") -VerifyAdmin
  Write-Output "MarketVibe Navigator browser is already running (PID $($running.ProcessId))."
  exit 0
}

$arguments = @(
  "--user-data-dir=$profileRoot",
  "--profile-directory=Default",
  "--disable-extensions-except=$extensionRoot",
  "--load-extension=$extensionRoot",
  "--remote-debugging-port=9223",
  "--no-first-run",
  "--no-default-browser-check"
)
if (-not $Foreground) { $arguments += "--start-minimized" }
$arguments += @(
  "https://www.linkedin.com/sales/search/people",
  "https://www.marketvibe1.com/admin/import"
)

Start-Process -FilePath $edge -ArgumentList $arguments
Start-Sleep -Milliseconds 800
& (Join-Path $PSScriptRoot "REFRESH-MARKETVIBE-ADMIN-COOKIE.ps1") -VerifyAdmin
Write-Output "Started the isolated MarketVibe Navigator browser with an authenticated MarketVibe handoff."
