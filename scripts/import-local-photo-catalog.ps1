param(
  [string]$Source = "G:\Drives compartilhados\CRIAÇÃO\Antigo\02 - Produtos\Fotos",
  [int]$Limit = 0,
  [int]$MaxImageSize = 1200,
  [long]$MaxSourceBytes = 52428800
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $root "assets\local-products"
$localOutput = Join-Path $root "products.local.json"
$mainOutput = Join-Path $root "products.json"
$siteOutput = Join-Path $root "products.elobrindes.json"

if (!(Test-Path -LiteralPath $Source)) {
  throw "Pasta de origem nao encontrada: $Source"
}

New-Item -ItemType Directory -Force -Path $assetDir | Out-Null
Add-Type -AssemblyName System.Drawing

$imageExtensions = @(".jpg", ".jpeg", ".png", ".webp")
$skipDirectoryNames = @("raw", "logos")

function Convert-ToSlug([string]$value) {
  $normalized = $value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object Text.StringBuilder
  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }
  return ($builder.ToString().ToLowerInvariant() -replace "[^a-z0-9]+", "-" -replace "^-|-$", "")
}

function Get-Category([string]$prefix) {
  $map = @{
    "CM" = "Canetas"
    "C" = "Canecas"
    "S" = "Squeezes"
    "BD" = "Bolsas"
    "BL" = "Bolsas"
    "BOL" = "Bolsas"
    "BTR" = "Bolsas"
    "MC" = "Mochilas"
    "NE" = "Necessaires"
    "CAD" = "Cadernos"
    "CH" = "Chaveiros"
    "CHV" = "Chaveiros"
    "KCH" = "Chaveiros"
    "KIT" = "Kits"
    "KITS" = "Kits"
    "CP" = "Copos"
  }
  if ($map.ContainsKey($prefix)) { return $map[$prefix] }
  return "Outros"
}

function Get-SafeArea([string]$category) {
  switch ($category) {
    "Canetas" { return @{ x = 360; y = 318; width = 480; height = 116 } }
    "Squeezes" { return @{ x = 420; y = 230; width = 360; height = 280 } }
    "Canecas" { return @{ x = 390; y = 235; width = 420; height = 260 } }
    "Cadernos" { return @{ x = 360; y = 210; width = 480; height = 360 } }
    "Bolsas" { return @{ x = 330; y = 260; width = 540; height = 260 } }
    default { return @{ x = 360; y = 220; width = 480; height = 320 } }
  }
}

function Get-ImageScore([System.IO.FileInfo]$file, [string]$code) {
  $path = $file.FullName.ToLowerInvariant()
  $name = $file.Name.ToLowerInvariant()
  $score = 0
  if ($path -match "\\renders?\\") { $score += 80 }
  if ($path -match "\\raw\\") { $score -= 60 }
  if ($path -match "\\logos?\\") { $score -= 50 }
  if ($name -like "$($code.ToLowerInvariant())*") { $score += 20 }
  if ($name -match "thumb|mini|baixa|pequena|recorte") { $score -= 35 }
  if ($name -match "frente|principal|01|1_4|cores") { $score += 12 }
  if ($file.Length -gt 20000 -and $file.Length -lt $MaxSourceBytes) { $score += 12 }
  if ($file.Extension.ToLowerInvariant() -in @(".jpg", ".jpeg")) { $score += 5 }
  return $score
}

function Save-OptimizedImage([string]$sourceFile, [string]$destinationFile, [int]$maxSize) {
  $image = [System.Drawing.Image]::FromFile($sourceFile)
  try {
    $ratio = [Math]::Min($maxSize / [double]$image.Width, $maxSize / [double]$image.Height)
    if ($ratio -gt 1) { $ratio = 1 }
    $width = [Math]::Max(1, [int][Math]::Round($image.Width * $ratio))
    $height = [Math]::Max(1, [int][Math]::Round($image.Height * $ratio))
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($image, 0, 0, $width, $height)
      } finally {
        $graphics.Dispose()
      }

      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
      $encoder = [System.Drawing.Imaging.Encoder]::Quality
      $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
      $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter $encoder, 84L
      $bitmap.Save($destinationFile, $codec, $encoderParams)
    } finally {
      $bitmap.Dispose()
    }
  } finally {
    $image.Dispose()
  }
}

$products = New-Object System.Collections.Generic.List[object]
$productDirs = New-Object System.Collections.Generic.List[object]
$seenLocalCodes = @{}
$seenLocalImages = @{}
foreach ($categoryDir in (Get-ChildItem -LiteralPath $Source -Directory -ErrorAction SilentlyContinue)) {
  try {
    foreach ($productDir in (Get-ChildItem -LiteralPath $categoryDir.FullName -Directory -ErrorAction SilentlyContinue)) {
      $productDirs.Add($productDir)
    }
  } catch {
    Write-Warning "Categoria ignorada $($categoryDir.FullName): $($_.Exception.Message)"
  }
}

foreach ($dir in $productDirs) {
  try {
    if ($Limit -gt 0 -and $products.Count -ge $Limit) { break }
    $code = $dir.Name.Trim()
    if ($code -notmatch "^[A-Za-z]{1,6}\d{1,5}[A-Za-z]?$") { continue }
    $codeKey = $code.ToUpperInvariant()
    if ($seenLocalCodes.ContainsKey($codeKey)) { continue }

    $files = Get-ChildItem -LiteralPath $dir.FullName -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object {
        $imageExtensions -contains $_.Extension.ToLowerInvariant() -and
        $_.Length -gt 8000 -and
        $_.Length -le $MaxSourceBytes -and
        $_.Name -notmatch "^Thumbs\.db$"
      }

    if (!$files) { continue }

    $best = $files | Sort-Object @{ Expression = { Get-ImageScore $_ $code }; Descending = $true }, Length -Descending | Select-Object -First 1
    if (!$best) { continue }

    $prefix = ([regex]::Match($code, "^[A-Za-z]+")).Value.ToUpperInvariant()
    $category = Get-Category $prefix
    $slug = Convert-ToSlug $code
    $destName = "$slug.jpg"
    if ($seenLocalImages.ContainsKey($destName.ToLowerInvariant())) { continue }
    $destPath = Join-Path $assetDir $destName

    Save-OptimizedImage $best.FullName $destPath $MaxImageSize
    $seenLocalCodes[$codeKey] = $true
    $seenLocalImages[$destName.ToLowerInvariant()] = $true
  } catch {
    Write-Warning "Produto ignorado $($dir.FullName): $($_.Exception.Message)"
    continue
  }

  $products.Add([ordered]@{
    code = $code
    name = "Produto $code"
    category = $category
    src = "assets/local-products/$destName"
    color = "A definir"
    techniques = @("Laser", "Serigrafia", "UV digital", "Tampografia")
    dimensions = "A definir"
    area = "Area sugerida no produto"
    minimumQuantity = "A definir"
    removePreviewBg = $true
    safeArea = Get-SafeArea $category
  })

  if ($products.Count % 50 -eq 0) {
    Write-Host "$($products.Count) produtos importados..."
  }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localOutput, (($products | ConvertTo-Json -Depth 8) + "`n"), $utf8NoBom)

$merged = New-Object System.Collections.Generic.List[object]
$seen = @{}
foreach ($product in $products) {
  $seen[$product.code.ToUpperInvariant()] = $true
  $merged.Add($product)
}

if (Test-Path -LiteralPath $siteOutput) {
  $siteProducts = Get-Content -Raw -LiteralPath $siteOutput | ConvertFrom-Json
  foreach ($product in $siteProducts) {
    $key = [string]$product.code
    if (!$seen.ContainsKey($key.ToUpperInvariant())) {
      $merged.Add($product)
    }
  }
}

[System.IO.File]::WriteAllText($mainOutput, (($merged | ConvertTo-Json -Depth 8) + "`n"), $utf8NoBom)

Write-Host ""
Write-Host "Catalogo local gerado: $localOutput"
Write-Host "Produtos locais importados: $($products.Count)"
Write-Host "products.json atualizado: $($merged.Count) produtos no total"
