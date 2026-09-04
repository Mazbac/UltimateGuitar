param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path $Root).Path
$patterns = @(
  @{ Name = 'private key'; Regex = '-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----' },
  @{ Name = 'AWS access key'; Regex = 'AKIA[0-9A-Z]{16}' },
  @{ Name = 'GitHub token'; Regex = 'gh[pousr]_[A-Za-z0-9_]{36,}' },
  @{ Name = 'OpenAI-style secret'; Regex = 'sk-[A-Za-z0-9_-]{20,}' }
)
$binaryExtensions = @(
  '.exe','.dll','.lib','.obj','.pdb','.zip','.7z','.png','.jpg','.jpeg','.gif','.webp',
  '.wav','.mp3','.flac','.ttf','.otf','.woff','.woff2','.vst3','.pyc','.pyo'
)

$tracked = @(& git -C $Root ls-files)
$untracked = @(& git -C $Root ls-files --others --exclude-standard)
if ($LASTEXITCODE -ne 0) { throw "Secret scan root is not a readable Git worktree: $Root" }
$files = @($tracked + $untracked | Sort-Object -Unique)
$findings = New-Object System.Collections.Generic.List[string]
foreach ($relative in $files) {
  $normalized = $relative -replace '\\','/'
  if ($normalized -like '.deps/*' -or $normalized -like 'build/*') { continue }
  $extension = [IO.Path]::GetExtension($relative).ToLowerInvariant()
  if ($binaryExtensions -contains $extension) { continue }
  $path = Join-Path $Root $relative
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
  try { $content = Get-Content -LiteralPath $path -Raw -ErrorAction Stop }
  catch { continue }
  foreach ($pattern in $patterns) {
    if ($content -match $pattern.Regex) {
      $findings.Add("$relative [$($pattern.Name)]")
    }
  }
}

if ($findings.Count -gt 0) {
  Write-Error ("Secret scan failed:`n" + ($findings -join "`n"))
  exit 1
}

Write-Output "Secret scan OK ($($files.Count) candidate files considered)."
exit 0
