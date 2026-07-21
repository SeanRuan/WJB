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

function Assert-ErrorMessageContains {
  param(
    [Parameter(Mandatory = $true)][string]$Message,
    [Parameter(Mandatory = $true)][string]$Keywords
  )

  if ($Message -notmatch $Keywords) {
    throw "Unexpected error message: $Message"
  }
}

function New-CreateGuildPayload {
  param([Parameter(Mandatory = $true)][string]$Name)

  return @{
    requestType = 'create_guild'
    payload = @{
      name = $Name
      selfTouchReferenceRate = 1
      selfTouchReferenceVisible = $true
      winReferenceRate = 2
      winReferenceVisible = $true
    }
  }
}

Write-Host '[STEP 1] Login as owner' -ForegroundColor Cyan
$login = Invoke-Api -Method 'POST' -Path '/api/auth/login' -Body @{
  email    = $Account
  password = $Password
}
$token = $login.Body.accessToken
if (-not $token) {
  throw 'Login succeeded but accessToken is missing.'
}
Write-Host '[PASS] Login OK' -ForegroundColor Green

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

Write-Host '[STEP 2] Create pending request for approve path' -ForegroundColor Cyan
$approveReqCreate = Invoke-Api -Method 'POST' -Path '/api/guild-approvals' -Token $token -Body (New-CreateGuildPayload -Name "煙測核准公會-$stamp")
$approveReqId = [string]$approveReqCreate.Body.id
if (-not $approveReqId) {
  throw 'Create approve-path request succeeded but id is missing.'
}
if ([string]$approveReqCreate.Body.status -ne 'pending') {
  throw "Expected pending status, got: $($approveReqCreate.Body.status)"
}
Write-Host "[PASS] Created approve-path request: $approveReqId" -ForegroundColor Green

Write-Host '[STEP 3] Approve with blank reviewNote (expect failure)' -ForegroundColor Cyan
$approveBlank = Invoke-Api -Method 'POST' -Path "/api/guild-approvals/$approveReqId/approve" -Token $token -Body @{
  reviewNote = '   '
} -AllowError
if ($approveBlank.Ok) {
  throw 'Expected approve with blank reviewNote to fail, but it succeeded.'
}
Assert-ErrorMessageContains -Message $approveBlank.Message -Keywords '空白|必填|reviewNote|required'
Write-Host "[PASS] Blank approve reviewNote blocked: $($approveBlank.Message)" -ForegroundColor Green

Write-Host '[STEP 4] Approve with valid reviewNote (expect success)' -ForegroundColor Cyan
$approve = Invoke-Api -Method 'POST' -Path "/api/guild-approvals/$approveReqId/approve" -Token $token -Body @{
  reviewNote = 'smoke approve guild request'
}
if ([string]$approve.Body.status -ne 'approved') {
  throw "Expected approved status, got: $($approve.Body.status)"
}
if (-not [string]$approve.Body.guildId) {
  throw 'Expected approved request to have guildId.'
}
Write-Host "[PASS] Approve succeeded with guildId: $($approve.Body.guildId)" -ForegroundColor Green

Write-Host '[STEP 5] Create pending request for reject path' -ForegroundColor Cyan
$rejectReqCreate = Invoke-Api -Method 'POST' -Path '/api/guild-approvals' -Token $token -Body (New-CreateGuildPayload -Name "煙測駁回公會-$stamp")
$rejectReqId = [string]$rejectReqCreate.Body.id
if (-not $rejectReqId) {
  throw 'Create reject-path request succeeded but id is missing.'
}
if ([string]$rejectReqCreate.Body.status -ne 'pending') {
  throw "Expected pending status, got: $($rejectReqCreate.Body.status)"
}
Write-Host "[PASS] Created reject-path request: $rejectReqId" -ForegroundColor Green

Write-Host '[STEP 6] Reject with blank reviewNote (expect failure)' -ForegroundColor Cyan
$rejectBlank = Invoke-Api -Method 'POST' -Path "/api/guild-approvals/$rejectReqId/reject" -Token $token -Body @{
  reviewNote = '   '
} -AllowError
if ($rejectBlank.Ok) {
  throw 'Expected reject with blank reviewNote to fail, but it succeeded.'
}
Assert-ErrorMessageContains -Message $rejectBlank.Message -Keywords '空白|必填|reviewNote|required'
Write-Host "[PASS] Blank reject reviewNote blocked: $($rejectBlank.Message)" -ForegroundColor Green

Write-Host '[STEP 7] Reject with valid reviewNote (expect success)' -ForegroundColor Cyan
$reject = Invoke-Api -Method 'POST' -Path "/api/guild-approvals/$rejectReqId/reject" -Token $token -Body @{
  reviewNote = 'smoke reject guild request'
}
if ([string]$reject.Body.status -ne 'rejected') {
  throw "Expected rejected status, got: $($reject.Body.status)"
}
Write-Host '[PASS] Reject succeeded' -ForegroundColor Green

Write-Host '[STEP 8] Verify approved/rejected requests are queryable' -ForegroundColor Cyan
$approvedList = Invoke-Api -Method 'GET' -Path '/api/guild-approvals?status=approved&take=100' -Token $token
$rejectedList = Invoke-Api -Method 'GET' -Path '/api/guild-approvals?status=rejected&take=100' -Token $token

$approvedFound = $false
foreach ($item in $approvedList.Body) {
  if ([string]$item.id -eq $approveReqId) {
    $approvedFound = $true
    break
  }
}

$rejectedFound = $false
foreach ($item in $rejectedList.Body) {
  if ([string]$item.id -eq $rejectReqId) {
    $rejectedFound = $true
    break
  }
}

if (-not $approvedFound) {
  throw "Approved request $approveReqId not found in approved list."
}
if (-not $rejectedFound) {
  throw "Rejected request $rejectReqId not found in rejected list."
}

Write-Host "[PASS] Approved request is listed: $approveReqId" -ForegroundColor Green
Write-Host "[PASS] Rejected request is listed: $rejectReqId" -ForegroundColor Green
Write-Host '[DONE] Guild approval review smoke test passed.' -ForegroundColor Green
