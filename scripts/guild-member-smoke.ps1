param(
  [string]$BaseUrl = 'http://127.0.0.1:3000',
  [string]$Account = 'owner@wuji.test',
  [string]$Password = '',
  [string]$GuildId = 'mock_guild_001',
  [string]$PlayerId = 'mock_player_003'
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

Write-Host '[STEP 2] Add member with blank note (expect failure)' -ForegroundColor Cyan
$addBlank = Invoke-Api -Method 'POST' -Path "/api/guilds/$GuildId/members" -Token $token -Body @{
  playerId = $PlayerId
  role = 'member'
  note = '   '
} -AllowError
if ($addBlank.Ok) {
  throw 'Expected add member with blank note to fail, but it succeeded.'
}
Assert-ErrorMessageContains -Message $addBlank.Message -Keywords '空白|必填|note|required'
Write-Host "[PASS] Blank add note blocked: $($addBlank.Message)" -ForegroundColor Green

Write-Host '[STEP 3] Add member with valid note (expect success)' -ForegroundColor Cyan
$add = Invoke-Api -Method 'POST' -Path "/api/guilds/$GuildId/members" -Token $token -Body @{
  playerId = $PlayerId
  role = 'member'
  note = 'smoke add guild member'
}
$memberId = [string]$add.Body.id
if (-not $memberId) {
  throw 'Add member succeeded but member id is missing.'
}
if ([string]$add.Body.status -ne 'active') {
  throw "Expected new member status to be active, got: $($add.Body.status)"
}
Write-Host "[PASS] Added member: $memberId" -ForegroundColor Green

Write-Host '[STEP 4] Update role with blank note (expect failure)' -ForegroundColor Cyan
$updateBlank = Invoke-Api -Method 'PATCH' -Path "/api/guilds/$GuildId/members/$memberId/role" -Token $token -Body @{
  role = 'master'
  note = '   '
} -AllowError
if ($updateBlank.Ok) {
  throw 'Expected update role with blank note to fail, but it succeeded.'
}
Assert-ErrorMessageContains -Message $updateBlank.Message -Keywords '空白|必填|note|required'
Write-Host "[PASS] Blank update note blocked: $($updateBlank.Message)" -ForegroundColor Green

Write-Host '[STEP 5] Update role with valid note (expect success)' -ForegroundColor Cyan
$update = Invoke-Api -Method 'PATCH' -Path "/api/guilds/$GuildId/members/$memberId/role" -Token $token -Body @{
  role = 'master'
  note = 'smoke update guild member role'
}
if ([string]$update.Body.role -ne 'master') {
  throw "Expected role to become master, got: $($update.Body.role)"
}
Write-Host '[PASS] Role updated to master' -ForegroundColor Green

Write-Host '[STEP 6] Remove member with blank note (expect failure)' -ForegroundColor Cyan
$removeBlank = Invoke-Api -Method 'POST' -Path "/api/guilds/$GuildId/members/$memberId/remove" -Token $token -Body @{
  note = '   '
} -AllowError
if ($removeBlank.Ok) {
  throw 'Expected remove with blank note to fail, but it succeeded.'
}
Assert-ErrorMessageContains -Message $removeBlank.Message -Keywords '空白|必填|note|required'
Write-Host "[PASS] Blank remove note blocked: $($removeBlank.Message)" -ForegroundColor Green

Write-Host '[STEP 7] Remove member with valid note (expect success)' -ForegroundColor Cyan
$remove = Invoke-Api -Method 'POST' -Path "/api/guilds/$GuildId/members/$memberId/remove" -Token $token -Body @{
  note = 'smoke remove guild member'
}
if ([string]$remove.Body.status -ne 'removed') {
  throw "Expected removed status, got: $($remove.Body.status)"
}
Write-Host '[PASS] Member removed successfully' -ForegroundColor Green

Write-Host '[STEP 8] Verify member status from guild detail' -ForegroundColor Cyan
$guildDetail = Invoke-Api -Method 'GET' -Path "/api/guilds/$GuildId" -Token $token
$target = $null
foreach ($member in $guildDetail.Body.members) {
  if ([string]$member.id -eq $memberId) {
    $target = $member
    break
  }
}
if (-not $target) {
  throw "Member $memberId not found in guild detail"
}
if ([string]$target.status -ne 'removed') {
  throw "Expected member status removed in detail, got: $($target.status)"
}
Write-Host "[PASS] Guild detail confirms removed: $memberId" -ForegroundColor Green

Write-Host '[DONE] Guild member smoke test passed.' -ForegroundColor Green
