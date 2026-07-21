$ErrorActionPreference = "Stop"
$launcher = Join-Path $PSScriptRoot "START-DEDICATED-NAVIGATOR.ps1"
if (-not (Test-Path -LiteralPath $launcher)) {
  throw "Navigator launcher is missing: $launcher"
}

try {
  $online = Test-NetConnection -ComputerName "www.marketvibe1.com" -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
} catch {
  $online = $false
}
if (-not $online) {
  Write-Output "Navigator watchdog: network unavailable; preserving saved position for the next five-minute retry."
  exit 0
}

& $launcher

