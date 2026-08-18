# 混合探索與排名 (Hybrid discovery and ranking)

首先使用高召回率搜尋，其次進行語意匹配，第三進行完整檔案驗證。

## 動態產生查詢家族

針對每項功能，產生：

- 直接查詢：領域或物件 + 所需操作 + Skill；
- 操作查詢：輸入 + 轉換 + 輸出；
- 支援查詢：所需品質或降低風險 + 操作；
- 整合查詢：相關系統 + CLI、MCP、API、連接器或瀏覽器自動化；
- 中文與英文形式；
- 同義詞、縮寫及所需產物名稱；
- 支援時針對 `SKILL.md` 的 GitHub 查詢。

請勿重複使用來自不同領域的查詢。潤飾類輔助工具是透過有關自然寫作、語氣、改寫或風格品質的查詢找到的，而不是透過主要領域名稱。

## 搜尋順序

1. 目前專案設定檔與本機 Skill 索引。
2. 尚未編入索引的已安裝與封存 Skills。
3. 註冊表，例如 skills.sh 與 agentskill.sh。
4. GitHub 存放庫與檔案搜尋。
5. OpenCLI 或一般 Web 搜尋以獲得更廣泛的召回率。
6. 僅在需要目前平台證據時才進行特定平台搜尋。

搜尋摘要僅用於探索候選項目；它們無法驗證項目。請從規範存放庫進行驗證。

循序執行由瀏覽器支援的 OpenCLI 搜尋。若導覽遭拒，請使用明確設定檔和追蹤重試一次，然後切換回其他唯讀來源。

## 依能力匹配

將每個候選項目與下列內容進行比較：

- 輸入相容性；
- 執行的操作；
- 預期輸出；
- 領域限制條件；
- 讀取/寫入邊界；
- 環境與相依性；
- 來自完整指示與指令碼的證據。

請勿僅根據標題相似性進行排名。

## 內部信任記錄

在內部保留此記錄。在白話模式下，將其轉譯為 `安全檢查通過`、`安全試跑通過` 與 `最近確認可用`。

```yaml
identity: canonical owner/repository:path@revision
source_url: canonical URL
license: value or unknown
capability: input -> operation -> output
covered_steps: []
evidence: []
dependencies: []
permissions: []
external_actions: []
community:
  installs: value or unknown
  stars: value or unknown
  feedback: value or unknown
  independent_usage: value or unknown
last_confirmed_working: YYYY-MM-DD or unknown
installation_safety_check: pass|fail|incomplete
safe_trial: pass|fail|not-run
local_status: absent|installed|duplicate|conflict
file_fingerprint: internal value
uncertainties: []
```

## 嚴格關卡

若下列任一項仍未解決，請勿建議安裝：

- 無法識別來源或確切版本；
- 不存在可讀取且可安裝的 Skill 結構；
- 完整內容不支援聲稱的功能；
- 必要執行階段、工具、帳戶或作業系統不相容；
- 關鍵安全行為未獲解釋；
- 唯一的測試將變更真實的外部系統；
- 預期用途會產生實質的授權或條款不確定性。

## 加權評分

僅在通過嚴格關卡後才評分。

| 維度 | 權重 | 高分意義 |
|---|---:|---|
| 工作流程符合度 | 30 | 精確符合所需的輸入、操作、輸出與邊界 |
| 社群採用率 | 25 | 可信的安裝量、星星數、回饋與獨立實際使用案例 |
| 安全性與控制 | 15 | 最小權限、明確核准、無未解釋的高風險行為 |
| 證據與安全試跑 | 15 | 完整檔案證據與可重現的非破壞性試跑 |
| 易用性 | 10 | 相依性可用、設定明確、輸出穩定、錯誤訊息有助益 |
| 維護與來源 | 5 | 規範來源、可識別的擁有者、近期有維護或刻意保持穩定 |

將 25 點社群分數細分以作為指引：

- 安裝或採用計數：最多 10 分；
- 相對於建立時間與領域定位的存放庫星星/分支 (fork) 數：最多 5 分；
- 具備足夠數量的評分與書面回饋：最多 5 分；
- 獨立範例、整合或重複使用：最多 5 分。

避免為每個小型 Skill 重複計算 monorepo 的星星數。在可能的情況下根據來源、建立時間和領域定位對數字進行正規化。最近發佈的小眾 Skill 可以標記為 `promising` 而非被視為不良，但如果沒有證據，它不應排在同樣符合且經過充分驗證的替代方案之前。

使用信賴標籤：

- **Confirmed**：通過嚴格關卡、完整檢查完畢、安全試跑通過。
- **Promising**：符合度良好但試跑或相依性驗證不完整。
- **Unconfirmed**：證據不足；排除於一鍵安裝之外。
- **Blocked**：嚴格關卡失敗或仍存在重大風險。

## 最小堆疊選取

選擇能涵蓋所有必要成功條件且數量最少、不重疊的 Skills。

偏好：

1. 現有已確認的本機 Skill；
2. 涵蓋多個必要功能且路由良好的單一 Skill；
3. 主要 Skill 加上範圍明確的輔助工具；
4. 僅針對真實缺口進行新安裝。

除非使用者需要替代方案，否則不要為同一步驟建議兩個主要 Skills。
