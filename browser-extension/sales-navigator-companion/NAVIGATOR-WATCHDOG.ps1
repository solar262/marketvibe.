$ErrorActionPreference = "Stop"
$launcher = Join-Path $PSScriptRoot "START-DEDICATED-NAVIGATOR.ps1"
if (-not (Test-Path -LiteralPath $launcher)) {
  throw "Navigator launcher is missing: $launcher"
}

& $launcher

