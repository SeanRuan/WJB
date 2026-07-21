param(
  [string]$BaseUrl = 'http://127.0.0.1:3000',
  [string]$Account = 'owner@wuji.test',
  [string]$Password = '',
  [string]$PlayerId = 'mock_player_001'
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

Write-Host '[STEP 1] Login' -ForegroundColor Cyan
$login = Invoke-Api -Method 'POST' -Path '/api/auth/login' -Body @{
  email    = $Account
  password = $Password
}

$token = $login.Body.accessToken
if (-not $token) {
  throw 'Login succeeded but accessToken is missing.'
}
Write-Host '[PASS] Login OK' -ForegroundColor Green

Write-Host '[STEP 2] Create pending recharge order' -ForegroundColor Cyan
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$proof = "smoke-$stamp"
$create = Invoke-Api -Method 'POST' -Path '/api/recharge-orders' -Token $token -Body @{
  playerId       = $PlayerId
  amount         = 321
  roomCardAmount = 32
  proofNote      = $proof
  transferredAt  = (Get-Date).ToUniversalTime().ToString('o')
}

$orderId = [string]$create.Body.id
if (-not $orderId) {
  throw 'Create order succeeded but id is missing.'
}
Write-Host "[PASS] Created pending order: $orderId" -ForegroundColor Green

Write-Host '[STEP 3] Confirm with blank reviewNote (expect failure)' -ForegroundColor Cyan
$blankConfirm = Invoke-Api -Method 'POST' -Path "/api/recharge-orders/$orderId/confirm" -Token $token -Body @{
  reviewNote = '   '
} -AllowError

if ($blankConfirm.Ok) {
  throw 'Expected confirm to fail with blank reviewNote, but it succeeded.'
}

if ($blankConfirm.Message -notmatch '必填|required|empty|blank|空白') {
  throw "Confirm failed for unexpected reason: $($blankConfirm.Message)"
}
Write-Host "[PASS] Blank reviewNote blocked: $($blankConfirm.Message)" -ForegroundColor Green

Write-Host '[STEP 4] Reject with valid reviewNote (expect success)' -ForegroundColor Cyan
$validReject = Invoke-Api -Method 'POST' -Path "/api/recharge-orders/$orderId/reject" -Token $token -Body @{
  reviewNote = 'smoke reject: proof incomplete'
}

$rejectedStatus = [string]$validReject.Body.status
if ($rejectedStatus -ne 'rejected') {
  throw "Expected status 'rejected', got '$rejectedStatus'."
}
Write-Host '[PASS] Reject succeeded and status is rejected' -ForegroundColor Green

Write-Host '[STEP 5] Verify order status from list API' -ForegroundColor Cyan
$list = Invoke-Api -Method 'GET' -Path '/api/recharge-orders?status=rejected&take=50' -Token $token
$found = $false
foreach ($item in $list.Body) {
  if ([string]$item.id -eq $orderId) {
    $found = $true
    break
  }
}

if (-not $found) {
  throw "Rejected order $orderId not found in rejected list."
}

Write-Host "[PASS] Rejected order is visible in list: $orderId" -ForegroundColor Green
Write-Host '[DONE] Recharge review smoke test passed.' -ForegroundColor Green
