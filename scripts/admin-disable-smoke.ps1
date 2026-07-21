param(
  [string]$BaseUrl = 'http://127.0.0.1:3000',
  [string]$Account = 'owner@wuji.test',
  [string]$Password = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $Password) {
  $Password = ('mock' + '-owner-pass')
}

function Convert-ToJsonBody {
  param([Parameter(Mandatory = $true)]$Object)
  return ($Object | ConvertTo-Json -Depth 8 -Compress)
}

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [hashtable]$Body,
    [string]$Token,
    [switch]$AllowError
  )

  $headers = @{}
  if ($Token) {
    $headers['Authorization'] = "Bearer $Token"
  }

  $uri = "$BaseUrl$Path"

  try {
    $params = @{
      Uri         = $uri
      Method      = $Method
      Headers     = $headers
      ContentType = 'application/json'
    }

    if ($Body) {
      $params['Body'] = Convert-ToJsonBody -Object $Body
    }

    $result = Invoke-RestMethod @params
    return [pscustomobject]@{
      Ok      = $true
      Status  = 200
      Body    = $result
      Message = $null
    }
  } catch {
    $statusCode = 0
    $message = $_.Exception.Message

    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      try {
        $errObj = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($errObj.message) {
          if ($errObj.message -is [System.Array]) {
            $message = ($errObj.message -join '; ')
          } else {
            $message = [string]$errObj.message
          }
        }
      } catch {
      }
    }

    if (-not $AllowError) {
      throw "API $Method $Path failed ($statusCode): $message"
    }

    return [pscustomobject]@{
      Ok      = $false
      Status  = $statusCode
      Body    = $null
      Message = $message
    }
  }
}

Write-Host '[STEP 1] Login as owner' -ForegroundColor Cyan
$login = Invoke-Api -Method 'POST' -Path '/api/auth/login' -Body @{
  email    = $Account
  password = $Password
}

$token = $login.Body.accessToken
$actorId = $login.Body.admin.id
if (-not $token) {
  throw 'Login succeeded but accessToken is missing.'
}
if (-not $actorId) {
  throw 'Login succeeded but admin.id is missing.'
}
Write-Host "[PASS] Login OK as $actorId" -ForegroundColor Green

Write-Host '[STEP 2] Create temporary admin user' -ForegroundColor Cyan
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$tempEmail = "smoke-disable-$stamp@wuji.test"
$tempAdminPassword = ('smoke' + '-pass-12345')
$create = Invoke-Api -Method 'POST' -Path '/api/admin-users' -Token $token -Body @{
  email = $tempEmail
  displayName = 'SmokeDisable'
  password = $tempAdminPassword
  role = 'support'
  reason = 'smoke create admin for disable test'
}

$targetId = [string]$create.Body.id
if (-not $targetId) {
  throw 'Create admin succeeded but id is missing.'
}
Write-Host "[PASS] Created admin: $targetId ($tempEmail)" -ForegroundColor Green

Write-Host '[STEP 3] Disable with blank reason (expect failure)' -ForegroundColor Cyan
$blankDisable = Invoke-Api -Method 'PATCH' -Path "/api/admin-users/$targetId/disable" -Token $token -Body @{
  reason = '   '
} -AllowError

if ($blankDisable.Ok) {
  throw 'Expected disable to fail with blank reason, but it succeeded.'
}

if ($blankDisable.Message -notmatch '空白|必填|reason|required|at least') {
  throw "Disable failed for unexpected reason: $($blankDisable.Message)"
}
Write-Host "[PASS] Blank reason blocked: $($blankDisable.Message)" -ForegroundColor Green

Write-Host '[STEP 4] Disable with valid reason (expect success)' -ForegroundColor Cyan
$disable = Invoke-Api -Method 'PATCH' -Path "/api/admin-users/$targetId/disable" -Token $token -Body @{
  reason = 'smoke disable admin test'
}

if ($disable.Body.isActive -ne $false) {
  throw "Expected isActive=false after disable, got: $($disable.Body.isActive)"
}
Write-Host '[PASS] Disable succeeded and isActive=false' -ForegroundColor Green

Write-Host '[STEP 5] Disable same admin again (expect already disabled failure)' -ForegroundColor Cyan
$disableAgain = Invoke-Api -Method 'PATCH' -Path "/api/admin-users/$targetId/disable" -Token $token -Body @{
  reason = 'smoke disable again test'
} -AllowError

if ($disableAgain.Ok) {
  throw 'Expected second disable to fail, but it succeeded.'
}
if ($disableAgain.Message -notmatch '已停用|already') {
  throw "Second disable failed for unexpected reason: $($disableAgain.Message)"
}
Write-Host "[PASS] Second disable blocked: $($disableAgain.Message)" -ForegroundColor Green

Write-Host '[STEP 6] Self-disable guard (expect failure)' -ForegroundColor Cyan
$selfDisable = Invoke-Api -Method 'PATCH' -Path "/api/admin-users/$actorId/disable" -Token $token -Body @{
  reason = 'smoke self disable test'
} -AllowError

if ($selfDisable.Ok) {
  throw 'Expected self-disable to fail, but it succeeded.'
}
if ($selfDisable.Message -notmatch '不可停用目前登入帳號|self') {
  throw "Self-disable failed for unexpected reason: $($selfDisable.Message)"
}
Write-Host "[PASS] Self-disable blocked: $($selfDisable.Message)" -ForegroundColor Green

Write-Host '[DONE] Admin disable smoke test passed.' -ForegroundColor Green
