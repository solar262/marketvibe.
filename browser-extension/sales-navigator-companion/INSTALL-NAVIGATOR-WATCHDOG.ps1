[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$watchdog = Join-Path $PSScriptRoot "NAVIGATOR-WATCHDOG.ps1"
if (-not (Test-Path -LiteralPath $watchdog)) {
  throw "Navigator watchdog is missing: $watchdog"
}

$taskCommand = "powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watchdog`""

& schtasks.exe /Create /TN "MarketVibe Navigator - Startup" /SC ONLOGON /TR $taskCommand /RL LIMITED /F | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Could not create the Navigator startup task." }

& schtasks.exe /Create /TN "MarketVibe Navigator - Watchdog" /SC MINUTE /MO 5 /TR $taskCommand /RL LIMITED /F | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Could not create the Navigator watchdog task." }

Write-Output "Installed the isolated Navigator startup and five-minute watchdog tasks."
Write-Output "Run START-DEDICATED-NAVIGATOR.ps1 -Foreground once to complete the two account logins."

