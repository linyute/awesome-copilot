# ax CLI — 疑難排解

僅當 `ax` 指令失敗時才參閱此文件。請勿主動執行這些檢查。

## 先檢查版本

若已安裝 `ax` (非「找不到指令」)，在進一步調查前請務必執行 `ax --version`。版本必須為 `0.8.0` 或更高 — 許多錯誤是由安裝版本過舊引起的。若版本太舊，請參閱下方的**版本太舊**章節。

## `ax: command not found` (找不到指令)

**macOS/Linux：**
1. 檢查常見位置：`~/.local/bin/ax`, `~/Library/Python/*/bin/ax`
2. 安裝：`uv tool install arize-ax-cli` (推薦), `pipx install arize-ax-cli`, 或 `pip install arize-ax-cli`
3. 若有需要，將其加入 PATH：`export PATH="$HOME/.local/bin:$PATH"`

**Windows (PowerShell)：**
1. 檢查：`Get-Command ax` 或 `where.exe ax`
2. 常見位置：`%APPDATA%\Python\Scripts\ax.exe`, `%LOCALAPPDATA%\Programs\Python\Python*\Scripts\ax.exe`
3. 安裝：`pip install arize-ax-cli`
4. 加入 PATH：`$env:PATH = "$env:APPDATA\Python\Scripts;$env:PATH"`

## 版本太舊 (低於 0.8.0)

升級：`uv tool install --force --reinstall arize-ax-cli`, `pipx upgrade arize-ax-cli`, 或 `pip install --upgrade arize-ax-cli`

## SSL/憑證錯誤

- macOS：`export SSL_CERT_FILE=/etc/ssl/cert.pem`
- Linux：`export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt`
- 備援方案：`export SSL_CERT_FILE=$(python -c "import certifi; print(certifi.where())")`

## 無法辨識子指令

升級 ax (見上方說明) 或使用最接近的可用替代方案。

## 仍持續失敗

停止操作並尋求使用者協助。
