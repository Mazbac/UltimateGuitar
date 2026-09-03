param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$deps = Join-Path $root '.deps'
$iplug = Join-Path $deps 'iPlug2'
$vst3Relative = 'Dependencies/IPlug/VST3_SDK'
$vst3 = Join-Path $iplug 'Dependencies\IPlug\VST3_SDK'
$iplugSha = 'd54f69050f517e43b941d88c2a170f0a840b9ee4'
$vst3Sha = '3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96'
$iplugOrigin = 'https://github.com/iPlug2/iPlug2.git'
$vst3Origin = 'https://github.com/steinbergmedia/vst3sdk.git'

function Invoke-Git([string[]]$Arguments) {
  & git @Arguments
  if ($LASTEXITCODE -ne 0) { throw "git failed: git $($Arguments -join ' ')" }
}

function Assert-Origin([string]$Path, [string]$ExpectedOrigin) {
  $origin = (& git -C $Path remote get-url origin).Trim()
  if ($LASTEXITCODE -ne 0 -or $origin -ne $ExpectedOrigin) {
    throw "Unexpected dependency origin at $Path. Expected $ExpectedOrigin; got $origin"
  }
}
function Assert-CleanRepo([string]$Path) {
  $dirty = @(& git -C $Path status --porcelain)
  if ($LASTEXITCODE -ne 0) { throw "Unreadable dependency Git repository: $Path" }
  if ($dirty.Count -gt 0) { throw "Dependency tree contains local changes and will not be reset: $Path" }
}

function Assert-IPlugCleanOutsideSdk {
  $dirty = @(& git -C $iplug status --porcelain -- . ":(exclude)$vst3Relative/**")
  if ($LASTEXITCODE -ne 0) { throw "Unreadable iPlug2 dependency Git repository: $iplug" }
  if ($dirty.Count -gt 0) {
    throw "iPlug2 contains local changes outside the managed VST3 SDK subtree and will not be reset: $iplug"
  }
}

function Get-Head([string]$Path) {
  $head = (& git -C $Path rev-parse HEAD).Trim()
  if ($LASTEXITCODE -ne 0) { throw "Unable to read dependency HEAD: $Path" }
  return $head
}

New-Item -ItemType Directory -Force -Path $deps | Out-Null

if (-not (Test-Path (Join-Path $iplug '.git'))) {
  if (Test-Path $iplug) { throw "Dependency path exists but is not a Git checkout: $iplug" }
  Invoke-Git @('clone','--filter=blob:none',$iplugOrigin,$iplug)
}
Assert-Origin $iplug $iplugOrigin
Assert-IPlugCleanOutsideSdk
$hasNestedVst3 = Test-Path (Join-Path $vst3 '.git')
if ($hasNestedVst3) {
  Assert-Origin $vst3 $vst3Origin
  Assert-CleanRepo $vst3
}

if ((Get-Head $iplug) -ne $iplugSha) {
  $hold = Join-Path $deps 'VST3_SDK.hold'
  if (Test-Path $hold) { throw "Temporary dependency hold path already exists: $hold" }
  if ($hasNestedVst3) { Move-Item $vst3 $hold }
  try {
    Invoke-Git @('-C',$iplug,'restore','--source=HEAD','--worktree','--staged','--',$vst3Relative)
    Invoke-Git @('-C',$iplug,'fetch','--depth','1','origin',$iplugSha)
    Invoke-Git @('-C',$iplug,'checkout','--detach',$iplugSha)
  }
  finally {
    if (Test-Path $hold) {
      if (Test-Path $vst3) { Remove-Item $vst3 -Recurse -Force }
      Move-Item $hold $vst3
    }
  }
}

if (-not (Test-Path (Join-Path $vst3 '.git'))) {
  $managedStatus = @(& git -C $iplug status --porcelain -- $vst3Relative)
  if ($managedStatus.Count -gt 0) {
    throw "Managed VST3 SDK placeholder contains local changes and will not be replaced: $vst3"
  }
  if (Test-Path $vst3) { Remove-Item $vst3 -Recurse -Force }
  Invoke-Git @('clone','--filter=blob:none',$vst3Origin,$vst3)
}
Assert-Origin $vst3 $vst3Origin
Assert-CleanRepo $vst3
if ((Get-Head $vst3) -ne $vst3Sha) {
  Invoke-Git @('-C',$vst3,'fetch','--depth','1','origin',$vst3Sha)
  Invoke-Git @('-C',$vst3,'checkout','--detach',$vst3Sha)
}
Invoke-Git @('-C',$vst3,'submodule','sync','--recursive')
Invoke-Git @('-C',$vst3,'submodule','update','--init','--recursive','base','cmake','pluginterfaces','public.sdk')

Assert-IPlugCleanOutsideSdk
Assert-CleanRepo $vst3
$iplugHead = Get-Head $iplug
$vst3Head = Get-Head $vst3
if ($iplugHead -ne $iplugSha -or $vst3Head -ne $vst3Sha) {
  throw 'Dependency pin verification failed after restore.'
}

Write-Output "Dependencies ready: iPlug2 $iplugHead; VST3 SDK $vst3Head"
