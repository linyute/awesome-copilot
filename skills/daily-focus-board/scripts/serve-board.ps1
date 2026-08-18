# serve-board.ps1 — 提供產生的專注看板並輸出 URL。
# 用法：pwsh scripts/serve-board.ps1 [-Dir <資料夾>] [-File focus-board.html] [-Port 8799]
param(
  [string]$Dir  = (Get-Location).Path,
  [string]$File = "focus-board.html",
  [int]   $Port = 8799
)
$full = Join-Path $Dir $File
if (-not (Test-Path $full)) { Write-Error "找不到看板：$full"; exit 1 }
try {
  if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
    Write-Error "連接埠 $Port 已被使用 — 請使用 -Port 選擇另一個連接埠，或停止現有的伺服器。"; exit 1
  }
} catch { }  # Get-NetTCPConnection 在某些平台上可能無法使用；在該處略過預先檢查。
$proc = Start-Process -FilePath "python" -ArgumentList @("-m","http.server","$Port","--bind","127.0.0.1","--directory","`"$Dir`"") -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2
if ($proc.HasExited) {
  Write-Error "伺服器在啟動時結束（代碼 $($proc.ExitCode)）— 是否已安裝 Python 且連接埠未被佔用？"; exit 1
}
$url = "http://localhost:$Port/$File"
Write-Host "專注看板：$url"
Write-Host "伺服器 PID $($proc.Id) — 停止方式：Stop-Process -Id $($proc.Id)"
Start-Process $url   # 在預設瀏覽器中開啟；在 Copilot 應用程式工作階段中，請改為在此 URL 開啟瀏覽器畫布
