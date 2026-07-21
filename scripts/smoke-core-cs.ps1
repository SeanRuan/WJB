Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$steps = @(
  'smoke:recharge-review',
  'smoke:admin-disable',
  'smoke:guild-member',
  'smoke:guild-approval-review'
)

Write-Host '[CORE-CS] Start core customer-service smoke suite' -ForegroundColor Cyan

foreach ($step in $steps) {
  Write-Host "[CORE-CS] Running: npm run $step" -ForegroundColor Yellow
  & npm run $step

  if ($LASTEXITCODE -ne 0) {
    throw "[CORE-CS] Failed at: $step"
  }

  Write-Host "[CORE-CS] Passed: $step" -ForegroundColor Green
}

Write-Host '[CORE-CS] All core customer-service smoke tests passed.' -ForegroundColor Green
