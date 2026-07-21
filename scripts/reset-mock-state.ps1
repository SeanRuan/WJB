param(
  [switch]$RestartServer
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$mockStateDir = Join-Path (Get-Location) '.cache\mock-state'

if (Test-Path -LiteralPath $mockStateDir) {
  Remove-Item -LiteralPath $mockStateDir -Recurse -Force
  Write-Host "[RESET] Removed: $mockStateDir" -ForegroundColor Green
} else {
  Write-Host "[RESET] No mock-state directory found: $mockStateDir" -ForegroundColor Yellow
}

if ($RestartServer) {
  Write-Host '[RESET] Restarting backend service on port 3000...' -ForegroundColor Cyan
  & pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/backend_control.ps1 -Action restart -Port 3000

  if ($LASTEXITCODE -ne 0) {
    throw '[RESET] Backend restart failed.'
  }
}

Write-Host '[RESET] Mock state reset completed.' -ForegroundColor Green
