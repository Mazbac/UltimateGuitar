param(
  [switch]$SkipNativeBuild,
  [switch]$SkipReleaseChecks
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $root
try {
  & (Join-Path $PSScriptRoot 'secret-scan.ps1')
  if ($LASTEXITCODE -ne 0) { throw 'Secret scan failed.' }

  python -m unittest discover -s tests/python -p 'test_*.py' -v
  if ($LASTEXITCODE -ne 0) { throw 'Python tests failed.' }

  if (-not $SkipNativeBuild) {
    & (Join-Path $PSScriptRoot 'build.ps1') -Configuration Debug -RunTests
    if ($LASTEXITCODE -ne 0) { throw 'Debug native verification failed.' }
    & (Join-Path $PSScriptRoot 'build.ps1') -Configuration Release -RunTests
    if ($LASTEXITCODE -ne 0) { throw 'Release native verification failed.' }
  }

  node .automation/validate.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Repository validation failed.' }
  node .automation/context-integrity.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Context integrity failed.' }
  node .automation/context-pack.mjs --scope all
  if ($LASTEXITCODE -ne 0) { throw 'Context pack generation failed.' }
  node .automation/context-pack.mjs --check
  if ($LASTEXITCODE -ne 0) { throw 'Context pack freshness failed.' }
  node .automation/self-test.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Repository self-test failed.' }

  if (-not $SkipReleaseChecks) {
    Write-Output 'Release-specific installer/host checks are not active before VERIFY; core verification completed.'
  }
  Write-Output 'UltimateGuitar verification complete.'
}
finally {
  Pop-Location
}
