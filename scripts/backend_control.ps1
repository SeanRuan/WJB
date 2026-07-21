param(
  [ValidateSet('start','stop','restart','status')]
  [string]$Action = 'status',
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'

function Get-ListenerPids {
  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) { return @() }
  return $connections |
    Where-Object { $_.OwningProcess -gt 0 } |
    Select-Object -ExpandProperty OwningProcess -Unique
}

function Get-ChildProcessIds {
  param([int]$ParentProcessId)

  Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentProcessId" -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty ProcessId
}

function Stop-ProcessTree {
  param([int]$ProcessId)

  & taskkill.exe /PID $ProcessId /T /F | Out-Null

  if ($LASTEXITCODE -ne 0) {
    $childProcessIds = @(Get-ChildProcessIds -ParentProcessId $ProcessId)
    foreach ($childProcessId in $childProcessIds) {
      Stop-ProcessTree -ProcessId $childProcessId
    }

    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Wait-ForFreePort {
  for ($i = 0; $i -lt 30; $i++) {
    if (-not (Get-ListenerPids)) {
      return
    }

    Start-Sleep -Milliseconds 100
  }

  throw "Port $Port is still in use."
}

function Stop-Backend {
  $procIds = Get-ListenerPids
  foreach ($procId in $procIds) {
    Stop-ProcessTree -ProcessId $procId
  }

  Wait-ForFreePort
  Write-Output "Stopped. Port $Port is free."
}

function Start-Backend {
  if (Get-ListenerPids) {
    Write-Output "Port $Port already has a listener. Stopping it first..."
    Stop-Backend
  }

  if (-not (Test-Path (Join-Path $PSScriptRoot '..\\dist\\main.js'))) {
    Write-Output 'dist/main.js not found. Running npm run build...'
    Push-Location (Join-Path $PSScriptRoot '..')
    try {
      npm run build | Out-Host
    } finally {
      Pop-Location
    }
  }

  $workDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $nodeArgs = 'dist/main.js'
  Start-Process -FilePath 'node' -ArgumentList $nodeArgs -WorkingDirectory $workDir -WindowStyle Hidden | Out-Null

  for ($i = 0; $i -lt 25; $i++) {
    Start-Sleep -Milliseconds 200
    if (Get-ListenerPids) {
      $pids = Get-ListenerPids
      Write-Output ("Started. Port {0} PID(s): {1}" -f $Port, ($pids -join ','))
      return
    }
  }

  if (-not (Get-ListenerPids)) {
    throw "Backend did not start on port $Port."
  }

  $pids = Get-ListenerPids
  Write-Output ("Started. Port {0} PID(s): {1}" -f $Port, ($pids -join ','))
}

function Show-Status {
  $procIds = Get-ListenerPids
  if (-not $procIds) {
    Write-Output "DOWN (port $Port has no listener)"
    return
  }

  try {
    $health = Invoke-RestMethod -Uri "http://localhost:$Port/api/health" -Method Get -TimeoutSec 3
    Write-Output ("UP (PID: {0}) health={1}" -f ($procIds -join ','), $health.status)
  } catch {
    Write-Output ("LISTENING (PID: {0}) but /api/health check failed" -f ($procIds -join ','))
  }
}

switch ($Action) {
  'start' { Start-Backend; Show-Status }
  'stop' { Stop-Backend; Show-Status }
  'restart' { Stop-Backend; Start-Backend; Show-Status }
  'status' { Show-Status }
}
