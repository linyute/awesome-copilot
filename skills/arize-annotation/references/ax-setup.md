# ax CLI — 疑難排解 (Troubleshooting)

僅在 `ax` 指令失敗時參考此文件。請勿主動執行這些檢查。

## 先檢查版本 (Check version first)

如果已安裝 `ax`（而非 `command not found`），在進一步調查前，請務必先執行 `ax --version`。版本必須為 `0.14.0` 或更高 — 許多錯誤是由於安裝版本過舊所引起的。如果版本太舊，請參閱下方的 **版本太舊**。

## `ax: command not found`

**macOS/Linux:**
1. 檢查常見位置：`~/.local/bin/ax`, `~/Library/Python/*/bin/ax`
2. 安裝：`uv tool install arize-ax-cli`（優先建議）、`pipx install arize-ax-cli` 或 `pip install arize-ax-cli`
3. 視需要加入 PATH：`export PATH="$HOME/.local/bin:$PATH"`

**Windows (PowerShell):**
1. 檢查：`Get-Command ax` 或 `where.exe ax`
2. 常見位置：`%APPDATA%\Python\Scripts\ax.exe`, `%LOCALAPPDATA%\Programs\Python\Python*\Scripts\ax.exe`
3. 安裝：`pip install arize-ax-cli`
4. 加入 PATH：`$env:PATH = "$env:APPDATA\Python\Scripts;$env:PATH"`

## 版本太舊 (低於 0.14.0) (Version too old (below 0.14.0))

升級：`uv tool install --force --reinstall arize-ax-cli`, `pipx upgrade arize-ax-cli` 或 `pip install --upgrade arize-ax-cli`

## SSL/憑證錯誤 (SSL/certificate error)

- macOS：`export SSL_CERT_FILE=/etc/ssl/cert.pem`
- Linux：`export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt`
- 備用方案：`export SSL_CERT_FILE=$(python -c "import certifi; print(certifi.where())")`

## 子指令無法辨識 (Subcommand not recognized)

升級 ax（見上方）或使用最接近的可用替代方案。

## 仍然失敗

停止並向使用者尋求協助。
