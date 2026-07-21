param(
  [int]$Port = 3000,
  [int]$MaxRestarts = 8,
  [int]$RestartWindowSeconds = 120,
  [int]$RestartDelaySeconds = 1,
  [int]$MaxRestartDelaySeconds = 8
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$controlScript = Join-Path $PSScriptRoot 'backend_control.ps1'
$mutexName = 'Global\Wujibackstage.StartDev'
$startupMutex = [System.Threading.Mutex]::new($false, $mutexName)
$hasMutex = $false
$maxRestarts = $MaxRestarts
$restartWindowSeconds = $RestartWindowSeconds
$restartDelaySeconds = $RestartDelaySeconds
$maxRestartDelaySeconds = $MaxRestartDelaySeconds

$logDirectory = Join-Path $projectRoot 'logs'
$crashLogPath = Join-Path $logDirectory 'start-dev-crash.log'
$runLogPath = Join-Path $logDirectory 'start-dev-last-run.log'

if (-not (Test-Path $logDirectory)) {
  New-Item -ItemType Directory -Path $logDirectory | Out-Null
}

function Write-RestartLog {
  param(
    [int]$ExitCode,
    [int]$Attempt,
    [int]$DelaySeconds
  )

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $escapedProjectRoot = [regex]::Escape($projectRoot)
  $projectNodeProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -eq 'node.exe' -and
      $_.CommandLine -match $escapedProjectRoot
    } |
    Select-Object ProcessId, ParentProcessId, CommandLine

  $lines = @()
  $lines += "[$timestamp] start:dev:raw exited with code $ExitCode"
  $lines += "  restartAttempt=$Attempt delaySeconds=$DelaySeconds"

  try {
    $listenerPids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.OwningProcess -gt 0 } |
      Select-Object -ExpandProperty OwningProcess -Unique
    $lines += "  port$Port listeners=" + ($(if ($listenerPids) { $listenerPids -join ',' } else { 'none' }))
  } catch {
    $lines += "  port$Port listeners=unknown"
  }

  if ($projectNodeProcesses) {
    $lines += '  project node processes:'
    $projectNodeProcesses | ForEach-Object {
      $lines += "    pid=$($_.ProcessId) ppid=$($_.ParentProcessId) cmd=$($_.CommandLine)"
    }
  } else {
    $lines += '  project node processes: none'
  }

  if (Test-Path $runLogPath) {
    $tailLines = Get-Content -Path $runLogPath -Tail 40 -ErrorAction SilentlyContinue
    if ($tailLines) {
      $lines += '  last run tail (40 lines):'
      $tailLines | ForEach-Object {
        $lines += "    $_"
      }
    }
  }

  Add-Content -Path $crashLogPath -Value $lines
}

function Stop-StaleProjectProcesses {
  $escapedProjectRoot = [regex]::Escape($projectRoot)
  $staleProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -eq 'node.exe' -and
      $_.CommandLine -match $escapedProjectRoot -and
      $_.CommandLine -match 'nest start --watch|dist/main.js|nodemon|concurrently'
    }

  foreach ($process in $staleProcesses) {
    & taskkill.exe /PID $process.ProcessId /T /F | Out-Null
  }
}

function Invoke-DevWatchWithRestart {
  $restartTimestamps = New-Object System.Collections.Generic.List[datetime]

  while ($true) {
    Push-Location $projectRoot
    try {
      if (Test-Path $runLogPath) {
        Remove-Item -Path $runLogPath -Force -ErrorAction SilentlyContinue
      }

      & npm run start:dev:raw *>&1 |
        Tee-Object -FilePath $runLogPath |
        Out-Host

      $exitCode = $LASTEXITCODE
    } finally {
      Pop-Location
    }

    if ($exitCode -eq 0) {
      return
    }

    $now = Get-Date
    $restartTimestamps.Add($now)
    $cutoff = $now.AddSeconds(-$restartWindowSeconds)
    $restartTimestamps = [System.Collections.Generic.List[datetime]]($restartTimestamps | Where-Object { $_ -ge $cutoff })

    $attempt = $restartTimestamps.Count
    $calculatedDelay = [math]::Min($restartDelaySeconds * [math]::Pow(2, [math]::Max(0, $attempt - 1)), $maxRestartDelaySeconds)
    $delaySeconds = [int][math]::Ceiling($calculatedDelay)

    Write-RestartLog -ExitCode $exitCode -Attempt $attempt -DelaySeconds $delaySeconds

    # In repeated crash scenarios, clear stale children before next boot.
    if ($attempt -ge 2) {
      Stop-StaleProjectProcesses
    }

    if ($restartTimestamps.Count -gt $maxRestarts) {
      throw "start:dev crashed more than $maxRestarts times within $restartWindowSeconds seconds. See $crashLogPath"
    }

    Write-Warning "start:dev:raw exited with code $exitCode. Restarting in $delaySeconds second(s)..."
    Start-Sleep -Seconds $delaySeconds
  }
}

try {
  if (-not $startupMutex.WaitOne(0)) {
    Write-Output "start:dev is already running or starting."
    exit 0
  }

  $hasMutex = $true

  & $controlScript -Action stop -Port $Port | Out-Host

  Stop-StaleProjectProcesses

  Invoke-DevWatchWithRestart
} finally {
  if ($hasMutex) {
    $startupMutex.ReleaseMutex() | Out-Null
  }

  $startupMutex.Dispose()
}
