$ErrorActionPreference = 'Stop'

$envPath = Join-Path $PWD '.env'
if (-not (Test-Path $envPath)) {
  Write-Host ".env not found at $envPath"
  exit 1
}

$keys = @(
  'JWT_SECRET',
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'BREVO_SENDER_NAME',
  'JOTFORM_API_KEY',
  'NEXT_PUBLIC_APP_NAME'
)

foreach ($k in $keys) {
  $match = Select-String -Path $envPath -Pattern ("^$([regex]::Escape($k))=") -ErrorAction SilentlyContinue
  if ($null -eq $match) {
    # Auto-provision missing values
    switch ($k) {
      'JWT_SECRET' { $val = ([guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')) }
      'NEXT_PUBLIC_APP_NAME' { $val = 'PBikeRescue Rails' }
      default {
        Write-Host "Skipping $k (not found in .env)"; continue
      }
    }
  } else {
    $line = $match.Line
    $val = $line.Substring($line.IndexOf('=') + 1)
  }
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    Set-Content -LiteralPath $tmp -Value $val -NoNewline -Encoding utf8
    Write-Host "Setting $k ..."
    & cmd /c "type `"$tmp`" | vercel env add $k production"
  } finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

Write-Host 'Done syncing .env to Vercel (production).'


