---
name: 'Secrets Scanner'
description: '掃描 Copilot 編碼代理程式工作階段中修改的檔案，尋找洩漏的機密、認證資訊和敏感資料'
tags: ['security', 'secrets', 'scanning', 'session-end']
---

# 機密掃描器掛鉤 (Secrets Scanner Hook)

在提交之前，掃描 GitHub Copilot 編碼代理程式工作階段期間修改的檔案，尋找意外洩漏的機密、認證資訊、API 金鑰和其他敏感資料。

## 概觀

AI 編碼代理程式會快速產生與修改程式碼，這增加了硬編碼機密溜進程式碼庫的風險。此掛鉤作為安全網，在工作階段結束時掃描所有修改過的檔案，尋找 20 多種類別的機密模式，包括：

- **雲端認證資訊**：AWS 存取金鑰、GCP 服務帳戶金鑰、Azure 用戶端機密
- **平台權杖 (Token)**：GitHub PAT、npm 權杖、Slack 權杖、Stripe 金鑰
- **私鑰**：RSA、EC、OpenSSH、PGP、DSA 私鑰區塊
- **連線字串**：資料庫 URI (PostgreSQL, MongoDB, MySQL, Redis, MSSQL)
- **通用機密**：API 金鑰、密碼、載體權杖 (Bearer Token)、JWT
- **內部基礎架構**：帶有連接埠的私有 IP 位址

## 功能

- **兩種掃描模式**：`warn` (僅記錄) 或 `block` (以非零值結束以防止提交)
- **兩種掃描範圍**：`diff` (修改過的檔案與 HEAD 比較) 或 `staged` (僅限 git 暫存的檔案)
- **智慧過濾**：跳過二進位檔案、鎖定檔案以及佔位符/範例值
- **允許列表 (Allowlist) 支援**：透過 `SECRETS_ALLOWLIST` 排除已知的誤判
- **結構化記錄**：JSON Lines 輸出，方便與監控工具整合
- **刪減後的輸出**：在記錄中會截斷發現的內容，以避免重新暴露機密
- **零相依項**：僅使用標準 Unix 工具 (`grep`, `file`, `git`)

## 安裝

1. 將掛鉤資料夾複製到您的儲存庫：

   ```bash
   cp -r hooks/secrets-scanner .github/hooks/
   ```

2. 確保腳本是可執行的：

   ```bash
   chmod +x .github/hooks/secrets-scanner/scan-secrets.sh
   ```

3. 建立記錄目錄並將其新增到 `.gitignore`：

   ```bash
   mkdir -p logs/copilot/secrets
   echo "logs/" >> .gitignore
   ```

4. 將掛鉤設定提交到儲存庫的預設分支。

## 設定

掛鉤在 `hooks.json` 中設定為在 `sessionEnd` 事件發生時執行：

```json
{
  "version": 1,
  "hooks": {
    "sessionEnd": [
      {
        "type": "command",
        "bash": ".github/hooks/secrets-scanner/scan-secrets.sh",
        "cwd": ".",
        "env": {
          "SCAN_MODE": "warn",
          "SCAN_SCOPE": "diff"
        },
        "timeoutSec": 30
      }
    ]
  }
}
```

### 環境變數

| 變數                | 值               | 預設值                 | 說明                                                    |
| ------------------- | ---------------- | ---------------------- | ------------------------------------------------------- |
| `SCAN_MODE`         | `warn`, `block`  | `warn`                 | `warn` 僅記錄發現；`block` 以非零值結束以防止自動提交   |
| `SCAN_SCOPE`        | `diff`, `staged` | `diff`                 | `diff` 掃描未提交的變更與 HEAD；`staged` 僅掃描暫存檔案 |
| `SKIP_SECRETS_SCAN` | `true`           | 未設定                 | 完全停用掃描器                                          |
| `SECRETS_LOG_DIR`   | 路徑             | `logs/copilot/secrets` | 掃描記錄寫入的目錄                                      |
| `SECRETS_ALLOWLIST` | 以逗號分隔       | 未設定                 | 要忽略的模式 (例如 `test_key_123,example.com`)          |

## 運作方式

1. 當 Copilot 編碼代理程式工作階段結束時，掛鉤會執行
2. 使用 `git diff` 收集所有修改過的檔案 (遵循設定的範圍)
3. 過濾掉二進位檔案和鎖定檔案
4. 對每個文字檔案逐行對比 20 多種正則表達式模式，尋找已知的機密格式
5. 跳過看起來像佔位符的匹配項 (例如包含 `example`, `changeme`, `your_` 的值)
6. 如果已設定，則根據允許列表檢查匹配項
7. 報告發現，包含檔案路徑、行號、模式名稱和嚴重程度
8. 為稽核目的寫入結構化的 JSON 記錄項目
9. 在 `block` 模式下，以非零值結束，向代理程式發送在提交前停止的訊號

## 偵測到的機密模式

| 模式                      | 嚴重程度        | 範例匹配                           |
| ------------------------- | --------------- | ---------------------------------- |
| `AWS_ACCESS_KEY`          | 緊急 (critical) | `AKIAIOSFODNN7EXAMPLE`             |
| `AWS_SECRET_KEY`          | 緊急 (critical) | `aws_secret_access_key = wJalr...` |
| `GCP_SERVICE_ACCOUNT`     | 緊急 (critical) | `"type": "service_account"`        |
| `GCP_API_KEY`             | 高 (high)       | `AIzaSyC...`                       |
| `AZURE_CLIENT_SECRET`     | 緊急 (critical) | `azure_client_secret = ...`        |
| `GITHUB_PAT`              | 緊急 (critical) | `ghp_xxxxxxxxxxxx...`              |
| `GITHUB_FINE_GRAINED_PAT` | 緊急 (critical) | `github_pat_...`                   |
| `PRIVATE_KEY`             | 緊急 (critical) | `-----BEGIN RSA PRIVATE KEY-----`  |
| `GENERIC_SECRET`          | 高 (high)       | `api_key = "sk-..."`               |
| `CONNECTION_STRING`       | 高 (high)       | `postgresql://user:pass@host/db`   |
| `SLACK_TOKEN`             | 高 (high)       | `xoxb-...`                         |
| `STRIPE_SECRET_KEY`       | 緊急 (critical) | `sk_live_...`                      |
| `NPM_TOKEN`               | 高 (high)       | `npm_...`                          |
| `JWT_TOKEN`               | 中 (medium)     | `eyJhbGci...`                      |
| `INTERNAL_IP_PORT`        | 中 (medium)     | `192.168.1.1:8080`                 |

請參閱 `scan-secrets.sh` 中的完整清單。

## 輸出範例

### 乾淨的掃描

```
🔍 正在掃描 5 個修改過的檔案以尋找機密...
✅ 在 5 個掃描的檔案中未偵測到機密
```

### 偵測到發現 (警告模式)

```
🔍 正在掃描 3 個修改過的檔案以尋找機密...

⚠️  在修改過的檔案中發現 2 個潛在機密：

  檔案                                     行號   模式                         嚴重程度
  ----                                     ----   -------                      --------
  src/config.ts                            12     GITHUB_PAT                   緊急 (critical)
  .env.local                               3      CONNECTION_STRING            高 (high)

💡 請檢視上述發現。將 SCAN_MODE 設定為 block 以防止提交含有機密。
```

### 偵測到發現 (阻擋模式)

```
🔍 正在掃描 3 個修改過的檔案以尋找機密...

⚠️  在修改過的檔案中發現 1 個潛在機密：

  檔案                                     行號   模式                         嚴重程度
  ----                                     ----   -------                      --------
  lib/auth.py                              45     AWS_ACCESS_KEY               緊急 (critical)

🚫 工作階段已阻擋：請在提交前解決上述發現。
   將 SCAN_MODE 設定為 warn 以進行記錄但不阻擋，或將模式新增至 SECRETS_ALLOWLIST。
```

## 記錄格式

掃描事件以 JSON Lines 格式寫入 `logs/copilot/secrets/scan.log`：

```json
{"timestamp":"2026-03-13T10:30:00Z","event":"secrets_found","mode":"warn","scope":"diff","files_scanned":3,"finding_count":2,"findings":[{"file":"src/config.ts","line":12,"pattern":"GITHUB_PAT","severity":"critical","match":"ghp_...xyz1"}]}
```

```json
{"timestamp":"2026-03-13T10:30:00Z","event":"scan_complete","mode":"warn","scope":"diff","status":"clean","files_scanned":5}
```

## 與其他掛鉤配合使用

此掛鉤與**工作階段自動提交 (Session Auto-Commit)** 掛鉤配合良好。當兩者都安裝時，請安排其順序，使 `secrets-scanner` 先執行：

1. 機密掃描器在 `sessionEnd` 時執行，擷取洩漏的機密
2. 自動提交在 `sessionEnd` 時執行，僅在前面的所有掛鉤都通過時才進行提交

將 `SCAN_MODE` 設定為 `block` 以在偵測到機密時防止自動提交。

## 自訂

- **新增自訂模式**：編輯 `scan-secrets.sh` 中的 `PATTERNS` 陣列，以新增專案特定的機密格式
- **調整靈敏度**：更改嚴重程度等級，或移除產生誤判的模式
- **將已知值加入允許列表**：對於測試固件 (test fixtures) 或已知安全模式，使用 `SECRETS_ALLOWLIST`
- **更改記錄位置**：設定 `SECRETS_LOG_DIR` 以將記錄導向您偏好的目錄

## 停用

若要暫時停用掃描器：

- 在掛鉤環境中設定 `SKIP_SECRETS_SCAN=true`
- 或從 `hooks.json` 中移除 `sessionEnd` 項目

## 限制

- 基於模式的偵測；不執行熵分析 (entropy analysis) 或上下文驗證 (contextual validation)
- 可能對測試固件或範例程式碼產生誤判 (請使用允許列表來抑制這些誤判)
- 僅掃描文字檔案；無法偵測到二進位機密 (金鑰庫、DER 格式的憑證)
- 執行環境中必須具備 `git`
