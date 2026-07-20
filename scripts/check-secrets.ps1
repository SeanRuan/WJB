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

$contentFilePattern = '(?i)\.(env|ps1|json|ya?ml|ini|cfg|toml|conf|config)$'
$contentFiles = $trackedFiles | Where-Object {
  (
    ($_ -match $contentFilePattern) -and
    ($_ -notmatch '(^|/)README\.md$') -and
    ($_ -notmatch '(^|/)docs/') -and
    ($_ -ne 'scripts/check-secrets.ps1')
  )
}

$contentPatterns = @(
  '(?i)^[A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|KEY|PRIVATE[_-]?KEY)[A-Z0-9_]*\s*=\s*.+$',
  '(?i)(api[_-]?key|client[_-]?secret|refresh[_-]?token|private[_-]?key|password|passwd|token)\s*[:=]\s*[''"''][^''"'']{8,}[''"'']',
  '-----BEGIN (?:RSA )?PRIVATE KEY-----',
  '-----BEGIN CERTIFICATE-----'
)

$contentMatches = foreach ($file in $contentFiles) {
  foreach ($pattern in $contentPatterns) {
    $hits = Select-String -Path $file -Pattern $pattern -AllMatches -ErrorAction SilentlyContinue
    foreach ($hit in $hits) {
      [PSCustomObject]@{
        File = $hit.Path
        Line = $hit.LineNumber
        Pattern = $pattern
        Text = $hit.Line.Trim()
      }
    }
  }
}

if ($contentMatches) {
  Write-Host 'Sensitive-looking tracked content was found:' -ForegroundColor Red
  $contentMatches | Format-Table -AutoSize | Out-String | Write-Host
  exit 1
}

Write-Host 'No tracked secret-like filenames found.'
