param(
  [switch]$CheckOnly,
  [switch]$Json
)

$ErrorActionPreference = 'Stop'

function Get-CMakeVersion([string]$CMakePath) {
  $line = (& $CMakePath --version | Select-Object -First 1)
  if ($line -notmatch '(\d+)\.(\d+)\.(\d+)') { return $null }
  return [version]::new([int]$Matches[1], [int]$Matches[2], [int]$Matches[3])
}

function Find-SupportedToolchain {
  $programFilesX86 = [Environment]::GetFolderPath([Environment+SpecialFolder]::ProgramFilesX86)
  $roots = @(
    @{ Year = 2022; Path = "$env:ProgramFiles\Microsoft Visual Studio\2022\BuildTools" },
    @{ Year = 2022; Path = "$env:ProgramFiles\Microsoft Visual Studio\2022\Community" },
    @{ Year = 2019; Path = "$programFilesX86\Microsoft Visual Studio\2019\BuildTools" },
    @{ Year = 2019; Path = "$programFilesX86\Microsoft Visual Studio\2019\Community" }
  )
  $sdk = Get-ChildItem "$programFilesX86\Windows Kits\10\Lib" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
  foreach ($candidate in $roots) {
    $root = $candidate.Path
    if (-not (Test-Path $root)) { continue }
    $vsDevCmd = Join-Path $root 'Common7\Tools\VsDevCmd.bat'
    $cl = Get-ChildItem (Join-Path $root 'VC\Tools\MSVC') -Recurse -Filter cl.exe -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -like '*\bin\Hostx64\x64\cl.exe' } |
      Sort-Object FullName -Descending | Select-Object -First 1
    $cmake = Join-Path $root 'Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'
    $ninja = Join-Path $root 'Common7\IDE\CommonExtensions\Microsoft\CMake\Ninja\ninja.exe'
    if (-not (Test-Path $cmake)) {
      $cmakeCommand = Get-Command cmake.exe -ErrorAction SilentlyContinue
      if ($cmakeCommand) { $cmake = $cmakeCommand.Source }
    }
    if (-not (Test-Path $ninja)) {
      $ninjaCommand = Get-Command ninja.exe -ErrorAction SilentlyContinue
      if ($ninjaCommand) { $ninja = $ninjaCommand.Source }
    }
    if (-not $cl -or -not $sdk -or -not (Test-Path $vsDevCmd) -or -not (Test-Path $cmake) -or -not (Test-Path $ninja)) { continue }
    $cmakeVersion = Get-CMakeVersion $cmake
    if (-not $cmakeVersion -or $cmakeVersion -lt [version]'3.14.0') { continue }
    return [pscustomobject]@{
      supported = $true
      visualStudioYear = $candidate.Year
      root = $root
      vsDevCmd = $vsDevCmd
      cl = $cl.FullName
      cmake = $cmake
      cmakeVersion = $cmakeVersion.ToString()
      ninja = $ninja
      generator = 'Ninja'
      windowsSdk = $sdk.Name
    }
  }
  return $null
}
$toolchain = Find-SupportedToolchain
if (-not $toolchain -and -not $CheckOnly) {
  $installer = Join-Path $env:TEMP 'vs_BuildTools.exe'
  Invoke-WebRequest 'https://aka.ms/vs/17/release/vs_BuildTools.exe' -OutFile $installer
  $installPath = "$env:ProgramFiles\Microsoft Visual Studio\2022\BuildTools"
  $arguments = @(
    '--quiet', '--wait', '--norestart', '--nocache',
    '--installPath', $installPath,
    '--add', 'Microsoft.VisualStudio.Workload.VCTools',
    '--add', 'Microsoft.VisualStudio.Component.VC.CMake.Project',
    '--includeRecommended'
  )
  $process = Start-Process -FilePath $installer -ArgumentList $arguments -Wait -PassThru
  if ($process.ExitCode -notin 0, 3010) {
    throw "Visual Studio Build Tools installation failed with exit code $($process.ExitCode)."
  }
  $toolchain = Find-SupportedToolchain
}

if (-not $toolchain) {
  Write-Error 'No supported Visual Studio 2019/2022 C++ toolchain with CMake >= 3.14 was found.'
  exit 2
}

if ($Json) { $toolchain | ConvertTo-Json -Compress; exit 0 }
Write-Output "Visual Studio $($toolchain.visualStudioYear): $($toolchain.root)"
Write-Output "CMake $($toolchain.cmakeVersion): $($toolchain.cmake)"
Write-Output "Windows SDK: $($toolchain.windowsSdk)"
