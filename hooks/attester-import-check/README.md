---
name: 'Attester Import Check'
description: '在 Copilot 編碼代理將 PyPI 和 npm 套件名稱寫入程式碼之前，對照 attester.dev 存在預言機進行驗證，以封鎖幻覺產生的相依性'
tags: ['security', 'supply-chain', 'preToolUse', 'dependencies']
---

# Attester Import Check Hook

驗證 Copilot 編碼代理即將寫入程式碼中的每個第三方套件名稱，然後才完成寫入。一項 USENIX Security 2025 的研究測得 LLM 建議的套件名稱中有 5.2% 到 21.7% 是不存在的；此 Hook 在一開始就攔截這些名稱。

## 概觀

在 `preToolUse` 事件發生時，Hook 會透過 stdin 接收 JSON 格式的工具呼叫、從正在引入的程式碼中擷取匯入陳述式，並對照 attester.dev 存在預言機檢查每個套件名稱。該預言機根據實際發佈的成品（PyPI wheels、npm tarballs）進行回覆，因此「不存在」的回覆是確定性的，而不是模型的推論意見。

## 行為協定

- **封鎖 (exit 1)** 僅在預言機確定為否定結果時觸發。
- **安全開放 (exit 0)** 當每日免費配額耗盡、API 無法連線或承載資料無法使用時。在這些情況下絕不封鎖。
- Python：略過標準函式庫模組和相對匯入。JS/TS：略過相對路徑、絕對路徑和 node 內建項目；支援處理 `@scope/name`。
- 回覆會快取於 `~/.cache/attester-import-check/cache.json`（存在保留 30 天，不存在保留 1 天），因此重複編輯不會消耗免費配額。
- 透過工作區根目錄中的 `.attester-allowlist` 將與 registry 套件名稱不同的匯入名稱（`yaml`、`PIL`、`cv2`）加入允許清單，每行一個。

## 免費配額與付費途徑

此檢查使用免金鑰的免費層級：每個用戶端 IP 每天 25 次呼叫，無需帳戶或 API 金鑰，於 00:00 UTC 重設。超出配額時，Hook 會印出「attester quota exhausted, unchecked」並允許該操作。高用量：付費途徑（x402 或預付額度）每次套件檢查 $0.002 美元，詳見 https://attester.dev/llms.txt 文件。

## 安裝

1. 將 Hook 資料夾複製到您的存放庫：

   ```bash
   cp -r hooks/attester-import-check your-repo/hooks/
   ```

2. 確保指令碼具有執行權限：

   ```bash
   chmod +x hooks/attester-import-check/check-imports.py
   ```

3. 將 Hook 設定提交至您存放庫的預設分支。

該指令碼僅依賴 Python 3.10+ 標準函式庫。不需要 pip install 步驟。

## 設定

Hook 在 `hooks.json` 中設定為於 `preToolUse` 事件執行：

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "hooks/attester-import-check/check-imports.py",
        "cwd": ".",
        "env": {
          "ATTESTER_MODE": "block"
        },
        "timeoutSec": 30
      }
    ]
  }
}
```

### 環境變數

| 變數 | 值 | 預設值 | 描述 |
|----------|--------|---------|-------------|
| `ATTESTER_MODE` | `block`, `warn` | `block` | `warn` 會印出發現結果但一律允許操作 |
| `ATTESTER_BASE_URL` | URL | `https://attester.dev` | 預言機基礎 URL |
| `ATTESTER_IMPORT_CHECK_NO_CACHE` | `1` | 未設定 | 略過磁碟上的回覆快取 |

## 範例

### 幻覺產生的套件 (exit 1，已封鎖)

```bash
echo '{"toolName":"write_file","toolInput":{"path":"main.py","content":"import requestsx_fantasy_helper"}}' | \
  python3 hooks/attester-import-check/check-imports.py
```

```
attester-import-check: 'requestsx_fantasy_helper' does not exist on PyPI (attester.dev oracle). Remove or fix the import, or add the name to .attester-allowlist if this is a false positive.
```

### 真實套件 (exit 0)

```bash
echo '{"toolName":"write_file","toolInput":{"path":"main.py","content":"import requests"}}' | \
  python3 hooks/attester-import-check/check-imports.py
```

### 配額耗盡 (exit 0，允許並顯示警告)

```
attester-import-check: attester quota exhausted, unchecked
```

## 限制

- 與發行版本名稱不同的匯入名稱（例如 PyYAML 的 `yaml`、Pillow 的 `PIL`）可能會產生錯誤警告；請將它們加入允許清單。
- 不支援解析 Python 動態匯入（`__import__`、`importlib.import_module`）和打包工具路徑別名。
- Hook 會對照公開 registry 預言機檢查名稱；私有套件在設計上會回傳「找不到」。

## 來源專案

此防護機制的獨立版本（pre-commit hook、Claude Code hook、GitHub Action）位於 https://github.com/maminihds/attester-import-check。背後的預言機為 https://attester.dev。
