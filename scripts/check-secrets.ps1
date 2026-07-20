$ErrorActionPreference = 'Stop'

$trackedFiles = git ls-files
$allowedFiles = @('.env.example', 'scripts/check-secrets.ps1')
$patterns = @(
  '(?i)(^|/|\\)\.env($|\.)',
  '(?i)(secret|secrets|key|keys|pem|p12|pfx|cer|crt|jks|keystore|token|passwd|password|credentials|private[_-]?key)'
)

$matches = foreach ($file in $trackedFiles) {
  if ($allowedFiles -contains $file) {
    continue
  }

  foreach ($pattern in $patterns) {
    if ($file -match $pattern) {
      [PSCustomObject]@{ File = $file; Pattern = $pattern }
      break
    }
  }
}

if ($matches) {
  Write-Host 'Sensitive-looking tracked files were found:' -ForegroundColor Red
  $matches | Format-Table -AutoSize | Out-String | Write-Host
  exit 1
}

Write-Host 'No tracked secret-like filenames found.'
