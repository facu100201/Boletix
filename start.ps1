# Boletix — servidor local de desarrollo
# Uso:  .\start.ps1  [-Puerto 8080]

param([int]$Puerto = 8080)

$raiz = $PSScriptRoot
$url  = "http://localhost:$Puerto"

function Test-Comando($nombre) {
  return $null -ne (Get-Command $nombre -ErrorAction SilentlyContinue)
}

Set-Location $raiz

if (Test-Comando "node") {
  Start-Job -ScriptBlock { Start-Sleep -Seconds 2; Start-Process $using:url } | Out-Null
  node tools/server.js $Puerto
}
elseif (Test-Comando "python") {
  Start-Job -ScriptBlock { Start-Sleep -Seconds 2; Start-Process $using:url } | Out-Null
  Write-Host "  BOLETIX en $url" -ForegroundColor Cyan
  python -m http.server $Puerto
}
else {
  Write-Host "  No encontre Node ni Python para levantar un servidor." -ForegroundColor Yellow
  Write-Host "  Abro index.html directamente. Si tu navegador bloquea localStorage" -ForegroundColor Yellow
  Write-Host "  bajo file://, el sitio funcionara en memoria y se reiniciara al recargar." -ForegroundColor Yellow
  Start-Process (Join-Path $raiz "index.html")
}
