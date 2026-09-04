param(
  [ValidateSet('Debug','Release')]
  [string]$Configuration = 'Debug',
  [switch]$RunTests
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$toolJson = & (Join-Path $PSScriptRoot 'bootstrap-toolchain.ps1') -CheckOnly -Json
if ($LASTEXITCODE -ne 0) { throw 'Supported Windows C++ toolchain is unavailable.' }
$tool = $toolJson | ConvertFrom-Json

function Import-VsDevEnvironment([string]$VsDevCmd) {
  $command = 'call "' + $VsDevCmd + '" -no_logo -arch=x64 >nul && set'
  $lines = & cmd.exe /d /s /c $command
  if ($LASTEXITCODE -ne 0) { throw 'VsDevCmd failed to prepare the x64 compiler environment.' }
  foreach ($line in $lines) {
    if ($line -match '^([^=]+)=(.*)$' -and -not $Matches[1].StartsWith('=')) {
      [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
  }
}

Import-VsDevEnvironment $tool.vsDevCmd
& (Join-Path $PSScriptRoot 'bootstrap.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Dependency bootstrap failed.' }
$build = Join-Path $root ("build\" + $Configuration.ToLowerInvariant())
$iplug = Join-Path $root '.deps\iPlug2'

& $tool.cmake -S $root -B $build -G $tool.generator `
  "-DCMAKE_BUILD_TYPE=$Configuration" `
  "-DCMAKE_MAKE_PROGRAM=$($tool.ninja)" `
  "-DIPLUG2_DIR=$iplug"
if ($LASTEXITCODE -ne 0) { throw 'CMake configure failed.' }

& $tool.cmake --build $build
if ($LASTEXITCODE -ne 0) { throw "CMake $Configuration build failed." }

if ($RunTests) {
  $ctest = Join-Path (Split-Path $tool.cmake -Parent) 'ctest.exe'
  if (-not (Test-Path $ctest)) { throw 'ctest.exe was not found next to the selected CMake.' }
  & $ctest --test-dir $build --output-on-failure
  if ($LASTEXITCODE -ne 0) { throw "CTest failed for $Configuration." }
}

Write-Output "UltimateGuitar native $Configuration build complete."
