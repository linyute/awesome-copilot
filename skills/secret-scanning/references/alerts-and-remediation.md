# 警示與修補參考 (Alerts and Remediation Reference)

秘密掃描警示類型、有效性檢查、修補工作流程及 API 存取的詳細參考。

## 警示類型 (Alert Types)

### 使用者警示 (User Alerts)

當秘密掃描在存放庫中偵測到支援的秘密時產生。

- 顯示在存放庫的**安全性 (Security)** 索引標籤中
- 針對提供者模式、非提供者模式、自訂模式及 AI 偵測到的秘密建立
- 掃描涵蓋所有分支上的整個 Git 歷程紀錄

### 推送保護警示 (Push Protection Alerts)

當參與者透過規避推送保護來推送秘密時產生。

- 顯示在安全性索引標籤中 (篩選條件：`bypassed: true`)
- 記錄參與者選擇的規避原因
- 包含推送秘密的提交和檔案

**規避原因及其警示行為：**

| 規避原因 | 警示狀態 |
|---|---|
| 用於測試 | 已關閉 (解析為「用於測試」) |
| 誤判 | 已關閉 (解析為「誤判」) |
| 稍後修正 | 開啟 |

### 夥伴警示 (Partner Alerts)

當 GitHub 偵測到洩漏的秘密符合夥伴的模式時產生。

- 直接發送給服務提供者 (例如：AWS、Stripe、GitHub)
- **不會**顯示在存放庫安全性索引標籤中
- 提供者可能會自動撤銷認證
- 存放庫擁有者無需採取任何行動

## 警示清單 (Alert Lists)

### 預設警示清單 (Default Alerts List)

主要檢視畫面，顯示以下警示：
- 支援的提供者模式 (例如：GitHub PAT、AWS 金鑰、Stripe 金鑰)
- 在存放庫/組織/企業層級定義的自訂模式

### 通用警示清單 (Generic Alerts List)

獨立檢視畫面 (從預設清單切換)，顯示：
- 非提供者模式 (私密金鑰、連線字串)
- AI 偵測到的通用秘密 (密碼)

**限制：**
- 每個存放庫最多 5,000 個警示 (開啟 + 已關閉)
- 對於非提供者模式，僅顯示前 5 個偵測到的位置
- 對於 AI 偵測到的秘密，僅顯示第一個偵測到的位置
- 不顯示在安全性總覽摘要檢視中

## 成對認證 (Paired Credentials)

當資源需要成對認證時 (例如：存取金鑰 + 秘密金鑰)：
- 僅當在同一個檔案中偵測到兩個部分時才會建立警示
- 防止部分洩漏造成的雜訊
- 減少誤判

## 有效性檢查 (Validity Checks)

有效性檢查會驗證偵測到的秘密是否仍然有效。

### 運作方式

1. 在存放庫/組織設定中啟用有效性檢查
2. GitHub 定期將秘密發送至發行者的 API
3. 驗證結果顯示在警示上

### 驗證狀態 (Validation Statuses)

| 狀態 | 意義 | 優先順序 |
|---|---|---|
| `Active` | 秘密已確認有效且可被利用 | 🔴 立即 |
| `Inactive` | 秘密已被撤銷或已過期 | 🟡 較低優先順序 |
| `Unknown` | GitHub 無法判斷有效性 | 🟠 調查 |

### 隨需驗證 (On-Demand Validation)

點擊個別警示上的驗證按鈕以觸發立即檢查。

### 隱私權 (Privacy)

GitHub 對侵入性最小的端點進行最少的 API 呼叫 (通常是 GET 請求)，選擇不會回傳個人資訊的端點。

## 延伸 Metadata 檢查 (Extended Metadata Checks)

在啟用有效性檢查時，提供有關偵測到之秘密的額外內容。

### 可用的 Metadata (Available Metadata)

取決於服務提供者分享的內容：
- 秘密擁有者資訊
- 秘密的範圍與權限
- 建立日期與到期日
- 關聯的帳戶或專案

### 優點

- **更深入的見解** — 了解誰擁有秘密
- **優先處理修補** — 了解範圍與影響
- **改善事件回應** — 快速識別負責團隊
- **強化合規性** — 確保秘密符合治理政策
- **減少誤判** — 額外的背景資訊有助於判斷是否需要採取行動

### 啟用 (Enabling)

- 必須先啟用有效性檢查
- 可以在存放庫、組織或企業層級啟用
- 可透過安全性組態進行大量啟用

## 修補工作流程 (Remediation Workflow)

### 優先順序：更換認證 (Rotate the Credential)

**務必先更換 (撤銷並重新發行) 洩漏的認證。** 這比從 Git 歷程紀錄中移除秘密更重要。

### 逐步修補 (Step-by-Step Remediation)

1. **收到警示** — 透過安全性索引標籤、電子郵件通知或 Webhook
2. **評估嚴重性** — 檢查有效性狀態 (active = 緊急)
3. **更換認證** — 撤銷舊認證並產生新認證
4. **更新參照** — 更新所有使用舊認證的程式碼/組態
5. **調查影響** — 檢查日誌中是否有曝光期間的未經授權使用
6. **關閉警示** — 標記為已解決並註明適當原因
7. **(選用) 清理 Git 歷程紀錄** — 從提交歷程紀錄中移除 (耗時)

### 從 Git 歷程紀錄中移除秘密

如果需要，請使用 `git filter-repo` (推薦) 或 `BFG Repo-Cleaner`：

```bash
# 安裝 git-filter-repo
pip install git-filter-repo

# 從所有歷程紀錄中移除特定檔案
git filter-repo --path secrets.env --invert-paths

# 強制推送清理後的歷程紀錄
git push --force --all
```

> **注意：** 重寫歷程紀錄具有破壞性 — 它會使現有的複製 (clone) 和 PR 失效。僅在絕對必要且更換認證後才執行此操作。

### 關閉警示 (Dismissing Alerts)

選擇適當的原因：

| 原因 | 何時使用 |
|---|---|
| **誤判** | 偵測到的字串並非真實秘密 |
| **已撤銷** | 認證已被撤銷/更換 |
| **用於測試** | 秘密僅存在於風險可接受的測試程式碼中 |

加入關閉評論以供稽核追蹤。

## 警示通知 (Alert Notifications)

警示透過以下方式產生通知：
- **電子郵件** — 發送給存放庫管理員、組織擁有者、安全性經理
- **Webhooks** — `secret_scanning_alert` 事件
- **GitHub Actions** — `secret_scanning_alert` 事件觸發器
- **安全性總覽** — 組織層級的彙整檢視

## REST API

### 列出警示 (List Alerts)

```
GET /repos/{owner}/{repo}/secret-scanning/alerts
```

查詢參數：`state` (open/resolved)、`secret_type`、`resolution`、`sort`、`direction`

### 取得警示詳細資料 (Get Alert Details)

```
GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}
```

回傳：秘密類型、秘密值 (如果允許)、位置、有效性、解決狀態、`dismissed_comment`

### 更新警示 (Update Alert)

```
PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}
```

本文：`state` (open/resolved)、`resolution` (false_positive/revoked/used_in_tests/wont_fix)、`resolution_comment`

### 列出警示位置 (List Alert Locations)

```
GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations
```

回傳：檔案路徑、行號、提交 SHA、blob SHA

### 組織層級端點 (Organization-Level Endpoints)

```
GET /orgs/{org}/secret-scanning/alerts
```

列出組織中所有存放庫的警示。

## Webhook 事件 (Webhook Events)

### `secret_scanning_alert`

當秘密掃描警示發生以下情況時觸發：
- 建立
- 已解決
- 重新開啟
- 已驗證 (有效性狀態變更)

酬載 (Payload) 包含：警示編號、秘密類型、解析度、提交 SHA 及位置詳細資料。

## 排除組態 (Exclusion Configuration)

### `secret_scanning.yml`

放置於 `.github/secret_scanning.yml` 以自動關閉特定路徑的警示：

```yaml
paths-ignore:
  - "docs/**"              # 包含範例秘密的文件
  - "test/fixtures/**"     # 測試固定裝置資料
  - "**/*.example"         # 範例組態檔案
  - "samples/credentials"  # 範例認證檔案
```

**限制：**
- 最多 1,000 個項目
- 檔案必須小於 1 MB
- 排除的路徑也會從推送保護中排除

**排除路徑的警示會被關閉，狀態為「依組態忽略 (ignored by configuration)」。**
