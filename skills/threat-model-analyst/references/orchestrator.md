# Orchestrator — 威脅模型分析工作流

此檔案包含執行威脅模型分析的完整協作邏輯。
它是 `/threat-model-analyst` 技能的主要工作流文件。

## ⚡ 上下文預算 — 選擇性讀取檔案

**在工作階段開始時，請勿讀取所有 10 個技能檔案。** 僅讀取每個階段所需的內容。這可為實際的程式碼基礎分析保留上下文視窗。

**階段 1 (內容收集)：** 讀取此檔案 (`orchestrator.md`) + `analysis-principles.md` + `tmt-element-taxonomy.md`
**階段 2 (撰寫報告)：** 在撰寫每個檔案「之前」，先讀取 `skeletons/` 中相關的骨架。讀取 `output-formats.md` + `diagram-conventions.md` 以獲取規則 — 但請將骨架作為結構範本。
- 在 `0.1-architecture.md` 之前：讀取 `skeletons/skeleton-architecture.md`
- 在 `1.1-threatmodel.mmd` 之前：讀取 `skeletons/skeleton-dfd.md`
- 在 `1-threatmodel.md` 之前：讀取 `skeletons/skeleton-threatmodel.md`
- 在 `2-stride-analysis.md` 之前：讀取 `skeletons/skeleton-stride-analysis.md`
- 在 `3-findings.md` 之前：讀取 `skeletons/skeleton-findings.md`
- 在 `0-assessment.md` 之前：讀取 `skeletons/skeleton-assessment.md`
- 在 `threat-inventory.json` 之前：讀取 `skeletons/skeleton-inventory.md`
- 在 `incremental-comparison.html` 之前：讀取 `skeletons/skeleton-incremental-html.md`
**階段 3 (驗證)：** 委派給子代理程式，並在子代理程式提示字元中包含 `verification-checklist.md`。子代理程式會使用全新的上下文視窗讀取完整的檢查清單 — 父代理程式「不需要」讀取它。

**核心原則：** 子代理程式會獲得全新的上下文視窗。將驗證和 JSON 產生委派給子代理程式，而不是將所有內容保留在父代上下文中。

---

## ✅ 強制性規則 — 開始前必讀

這些是每個威脅模型報告的必要行為。請嚴格遵守每條規則：

1. 根據 **可利用性層級 (Exploitability Tier)** (Tier 1/2/3) 組織發現，絕不按嚴重性等級組織
2. 將每個元件的 STRIDE 表格拆分為 Tier 1、Tier 2、Tier 3 子章節
3. 每個發現都必須包含 `可利用性層級` 和 `補救心力 (Remediation Effort)` — 兩者皆為強制性
4. STRIDE 摘要表「必須」包含 T1、T2、T3 欄位
4b. **STRIDE + 濫用案例類別確切為：** **S**poofing (偽造), **T**ampering (竄改), **R**epudiation (否認性), **I**nformation Disclosure (資訊洩漏), **D**enial of Service (阻斷服務), **E**levation of Privilege (權限提升), **A**buse (濫用 — 商業邏輯濫用、工作流操縱、功能誤用 — 標準 STRIDE 的延伸，涵蓋合法功能的誤用)。A 始終是 "Abuse" (濫用) — 絕非 "AI Safety"、"Authorization" 或任何其他解釋。授權問題屬於 E (權限提升)。
5. `.md` 檔案：第 1 行以 `# 標題` 開始。`create_file` 工具寫入原始內容 — 無程式碼柵欄
6. `.mmd` 檔案：第 1 行以 `%%{init:` 開始。原始 Mermaid 原始碼，無柵欄
7. 章節標題「必須」確切為 `## 行動摘要`。包含 `### 快速成效 (Quick Wins)` 子章節，附帶 Tier 1 低心力發現表格
8. K8s 側車 (sidecars)：在主機容器標註 `<br/>+ Sidecar` — 絕不建立獨立的側車節點 (參閱 `diagram-conventions.md` 規則 1)
9. Pod 內部的 localhost 流量是隱含的 — 請勿在圖表繪製它們
10. 行動摘要「即為」建議 — 不設獨立的 `### 關鍵建議` 章節
11. 在執行摘要中包含 `> **威脅計數注意事項：**` 引言區塊
12. 每個發現「必須」具備 CVSS 4.0 (分數與完整向量字串)、CWE (附超連結) 及 OWASP (後置字串 `:2025`)
13. OWASP 後置字串始終為 `:2025` (例如：`A01:2025 – 存取控制缺失`)
14. 在 `3-findings.md` 末尾包含威脅涵蓋範圍驗證表，將每個威脅對應到發現
15. `0.1-architecture.md` 中的每個元件「必須」出現在 `2-stride-analysis.md` 中
16. `0.1-architecture.md` 中的前 3 個情境「必須」具有 Mermaid 循序圖
17. `0-assessment.md` 「必須」包含 `## 分析背景與假設`，以及 `### 待驗證` 和 `### 發現覆蓋 (Finding Overrides)` 表格
18. 行動摘要下方「必須」包含 `### 快速成效` 子章節 (若無則包含標題並註明)
19. `0-assessment.md` 中的所有 7 個章節皆為強制性：報告檔案、執行摘要、行動摘要、分析背景與假設、參考文獻、報告 Metadata、分類參考
20. **部署分類具有約束力。** 在 `0.1-architecture.md` 中，設定 `部署分類` 並填寫元件暴露表。若分類為 `LOCALHOST_DESKTOP` 或 `LOCALHOST_SERVICE`：Tier 1 發現數量為零、`Prerequisites = None` 數量為零、非監聽元件的 `AV:N` 數量為零。參閱 `analysis-principles.md` 部署背景表。
21. 發現 ID 「必須」由上而下循序排列：FIND-01, FIND-02, FIND-03... 排序後重新編號
22. CWE 「必須」包含超連結：`[CWE-306](https://cwe.mitre.org/data/definitions/306.html): Missing Authentication`
23. 在 STRIDE 之後，執行 `analysis-principles.md` 中的技術專屬安全性檢查清單。儲存庫中的每項技術至少需要一個發現或記錄在案的緩解措施
24. CVSS `AV:L` 或 `PR:H` → 發現「不能」是 Tier 1。降級為 T2/T3。參閱 `analysis-principles.md` 中的 CVSS 與層級一致性檢查
25. 僅使用 `Low` (低)/`Medium` (中)/`High` (高) 心力標籤。絕不產生時間估計、衝刺階段 or 排程。參閱 `output-formats.md` 中的禁止內容
26. 參考文獻：使用 `output-formats.md` 中確切的兩個子章節格式 — `### 安全性標準` (具完整 URL 的 3 欄表格) 和 `### 元件文件` (具 URL 的 3 欄表格)
27. 報告 Metadata：包含 `output-formats.md` 範本中的所有欄位 — Model, Analysis Started, Analysis Completed, Duration。在步驟 1 和撰寫 `0-assessment.md` 之前執行 `Get-Date -Format "yyyy-MM-dd HH:mm:ss" -AsUTC`
28. `2-stride-analysis.md` 中的 `## 摘要` 表格「必須」出現在頂部，緊接在 `## 可利用性層級` 之後，在個別元件章節之前
29. 相關威脅：每個威脅 ID 「必須」是連向 `2-stride-analysis.md#component-anchor` 的超連結。格式：`[T02.S](2-stride-analysis.md#component-name)`
30. 圖表顏色：逐字複製 `diagram-conventions.md` 中的 classDef 行。僅允許的填滿：`#6baed6` (程序), `#fdae61` (外部), `#74c476` (資料儲存)。僅允許的線條：`#2171b5`, `#d94701`, `#238b45`, `#e31a1c`。僅使用 `%%{init: {'theme': 'base', 'themeVariables': { 'background': '#ffffff', 'primaryColor': '#ffffff', 'lineColor': '#666666' }}}%%` — 不使用其他 themeVariables 鍵值
31. 摘要 DFD：在建立 `1.1-threatmodel.mmd` 之後，執行步驟 4 中的 POST-DFD 閘口。該閘口與 `skeleton-summary-dfd.md` 控制是否產生 `1.2-threatmodel-summary.mmd`。
32. `0-assessment.md` 中的報告檔案表：將 `0-assessment.md` (此文件) 列為第一行，其後依序為 0.1-architecture.md, 1-threatmodel.md 等。使用 `output-formats.md` 中確切的範本
33. 每次分析執行「必須」產生 `threat-inventory.json` (步驟 8b)。此檔案可用於未來的比較。參閱 `output-formats.md` 以了解結構定義 (schema)。
34. **絕不刪除、修改或移除儲存庫中任何現有的 `threat-model-*` 或 `threat-model-compare-*` 資料夾**。僅寫入您自己的時間戳記輸出資料夾。允許清理您建立的臨時 git 工作樹；嚴禁刪除其他報告資料夾。

### 規則優先順序 (當指引衝突時)

依此順序套用規則：
1. `skeletons/skeleton-*.md` 中的字面骨架 — 確切的章節/表格標題和屬性行
2. `orchestrator.md` 中的強制性規則 (此清單)
3. `output-formats.md` 中的範例 (範例僅供說明，若與字面骨架不同，不具權威性)

若偵測到任何衝突，請遵循優先順序最高的項目。

**產生後：** 驗證子代理程式將掃描您的輸出，以查找 `verification-checklist.md` 階段 0 中列出的所有已知偏離。在定稿前修復任何失敗項。

---

## 工作流

**排除項：** 跳過這些目錄：
- `threat-model-*` (先前的報告)
- `node_modules`, `.git`, `dist`, `build`, `vendor`, `__pycache__`

**前置作業：** 在撰寫任何輸出檔案之前，請掃描 `verification-checklist.md` 階段 1 (每檔案結構檢查) 和階段 2 (圖表渲染檢查)。這能將品質閘口內化，使輸出在第一次嘗試時即正確 — 防止昂貴的重新作業。尚未執行完整驗證；該步驟發生在步驟 10。

### ⛔ 子代理程式控管 (強制性 — 防止重複作業)

子代理程式是 **獨立的執行上下文** — 它們沒有父代理程式狀態、指令或其他子代理程式的記憶。若無嚴格控管，子代理程式將獨立執行「完整」分析，建立重複的報告資料夾並造成每次重複約 15 分鐘運算 + 10 萬 token 的浪費。

**規則 1 — 父代擁有「所有」檔案建立權。** 父代理程式是唯一對報告檔案 (0.1-architecture.md, stride-analysis.md, findings.md 等) 呼叫 `create_file` 的代理程式。子代理程式「絕不」寫入報告檔案。

**規則 2 — 子代理程式為唯讀輔助者。** 子代理程式可以：
- 在原始碼中搜尋特定模式 (例如：「尋找所有與認證相關的程式碼」)
- 讀取並分析檔案，然後將結構化資料傳回父代
- 執行驗證檢查並傳回 通過/失敗 (PASS/FAIL) 結果
- 執行終端機命令 (git diff, grep) 並傳回輸出

**規則 3 — 子代理程式提示字元必須狹窄且具體。** 絕不要求子代理程式「執行威脅模型分析」或「產生報告」。應改為：
- ✅ 「讀取這 5 個 Go 檔案，並列出每個處理認證的函式。傳回一個包含函式名稱、檔案、行號的表格。」
- ✅ 「針對 {folder} 中的檔案執行驗證檢查清單。傳回每個檢查項目的 通過/失敗 結果。」
- ✅ 「讀取 {path} 中的 threat-inventory.json 並驗證所有陣列長度是否與指標相符。傳回不一致處。」
- ❌ 「分析此程式碼基礎並撰寫威脅模型檔案。」
- ❌ 「為次元件產生 0.1-architecture.md 和 stride-analysis.md。」

**規則 4 — 輸出資料夾路徑。** 父代在步驟 1 建立具時間戳記的輸出資料夾，並在所有 `create_file` 呼叫中使用該確切路徑。若子代理程式需要讀取先前寫入的報告檔案，請在子代理程式提示字元中傳遞資料夾路徑。

**規則 5 — 唯一的例外** 是產生 `threat-inventory.json` (步驟 8b)，若資料量太大，父代「可以」委派子代理程式寫入 JSON。在此情況下，子代理程式提示字元「必須」包含：(a) 確切的輸出檔案路徑，(b) 要序列化的資料，以及 (c) 明確指令：「僅寫入此單一檔案。請勿建立任何其他檔案或資料夾。」

### 步驟

1. **記錄開始時間並收集背景資訊**
   - 執行 `Get-Date -Format "yyyy-MM-dd HH:mm:ss" -AsUTC` 並儲存為 `START_TIME`
   - 獲取 git 資訊：`git remote get-url origin`、`git branch --show-current`、`git rev-parse --short HEAD`、`git log -1 --format="%ai" HEAD` (提交日期 — 絕非今日日期)、`hostname`
   - 繪製系統地圖：識別元件、信任邊界、資料流
   - **參考：** `analysis-principles.md` 以獲取安全性基礎設施清點

   **⛔ 部署分類 (強制性 — 在分析程式碼威脅前執行)：**
   根據程式碼證據確定系統的部署類別 (參閱 `skeleton-architecture.md` 以獲取值)。
   記錄在 `0.1-architecture.md` → 部署模型章節。然後填寫 **元件暴露表** — 每個元件佔一行，顯示監聽位址、認證屏障、外部可達性及最低前提條件。
   此表是前提條件下限的 **單一事實來源**。任何威脅或發現的前提條件均不得低於暴露表對該元件所允許的條件。

   **⛔ 決定性命名 — 在撰寫任何檔案前套用：**
   
   在識別元件時，為每個元件分配一個規範的 PascalCase `id`。命名「必須」具決定性 — 在同一個程式碼基礎上進行的兩次獨立執行「必須」產生相同的元件 ID。

   **⛔ 絕對規則：每個元件 ID 必須錨定到真實的程式碼構件。**
   對於您識別的每個元件，您「必須」能夠指出程式碼基礎中作為該元件「錨點」的特定類別、檔案 or 清單 (manifest)。若不存在此類構件，則該元件不存在。

   **命名程序 (依序遵循 — 停在第一個匹配項)：**
   1. **主要類別名稱** — 使用原始碼中確切的類別名稱。請勿縮寫、擴展或重述它。
      - `TaskProcessor.cs` → `TaskProcessor` (而非 `TaskServer`，也非 `TaskService`)
      - `SessionStore.cs` → `SessionStore` (而非 `FileSessionStore`，也非 `SessionService`)
      - `TerminalUserInterface.cs` → `TerminalUserInterface` (而非 `TerminalUI`)
      - `PowerShellCommandExecutor.cs` → `PowerShellCommandExecutor` (而非 `PowerShellExecutor`)
      - `ResponsesAPIService.cs` → `ResponsesAPIService` (而非 `LLMService` — 那是另一個不同的類別)
      - `MCPHost.cs` → `MCPHost` (而非 `OrchestrationHost`)
   2. **主要腳本名稱** → `Import-Images.ps1` → `ImportImages`
   3. **主要組態/清單名稱** → `Dockerfile` → `DockerContainer`，`values.yaml` → `HelmChart`
   4. **目錄名稱** (若元件跨越多個檔案) → `src/ParquetParsing/` → `ParquetParser`
   5. **技術名稱** (針對外部服務/資料儲存) → "Azure OpenAI" → `AzureOpenAI`，"Redis" → `Redis`
   6. **外部參與者角色** → `Operator`, `EndUser` (絕不捨棄這些)

   **⛔ Helm/Kubernetes 部署命名 (對比較穩定性至關重要)：**
   當透過 Helm chart 或 Kubernetes 清單部署元件時，請使用 **Kubernetes 工作負載名稱** (來自 Deployment/StatefulSet 的 metadata.name) 作為元件 ID — 而非 Helm 範本檔名或目錄結構：
   - 檢視部署 YAML 中的 `metadata.name` → 將其用作元件 ID (標準化為 PascalCase)
   - 範例：`metadata.name: devportal` 在 `templates/knowledge/devportal-deployment.yml` → 元件 ID 為 `DevPortal`
   - 範例：`metadata.name: phi-model` 在 `templates/knowledge/phi-deployment.yml` → 元件 ID 為 `PhiModel`
   - **原因：** Helm 範本經常被重新組織 (例如：從 `templates/` 移動到 `templates/knowledge/`)，但 Kubernetes 工作負載名稱保持不變。使用工作負載名稱可確保元件 ID 在目錄重組中倖存。
   - `source_files` 「必須」包含部署 YAML 路徑及應用程式原始碼路徑 (例如：同時包含 `helmchart/myapp/templates/knowledge/devportal-deployment.yml` 與 `developer-portal/src/`)
   - `source_directories` 「必須」同時包含 Helm 範本目錄與原始碼目錄

   **外部服務錨定 (針對無儲存庫原始碼的元件)：**
   外部服務 (雲端 API、受控資料庫、SaaS 端點) 在儲存庫中沒有原始碼檔案。將它們錨定到程式碼基礎中的 **整合點**：
   - `source_files` → 定義連線的用戶端類別或組態檔案 (例如：用於 Azure OpenAI 連線組態的 `src/MCP/appsettings.json`，用於 Redis 端點組態的 `helmchart/values.yaml`)
   - `source_directories` → 包含整合程式碼的目錄 (例如：LLM 用戶端的 `src/MCP/Core/Services/LLM/`)
   - `class_names` → 您儲存庫中與服務對談的用戶端類別 (例如：`ResponsesAPIService`)，而非廠商的 SDK 類別 (例如：非 `OpenAIClient`)。若不存在專用的用戶端類別，請留空。
   - `namespace` → 留空 `""` (外部服務沒有儲存庫命名空間)
   - `config_keys` → 服務連線的環境變數/組態鍵值 (例如：`["AZURE_OPENAI_ENDPOINT", "RESPONSES_API_DEPLOYMENT"]`)。這些是外部服務最穩定的錨點。
   - `api_routes` → 留空 (外部服務公開其自己的路由，而非您的)
   - `dependencies` → 所使用的 SDK 套件 (例如：NuGet 的 `["Azure.AI.OpenAI"]`，pip 的 `["pymilvus"]`)
   
   **為什麼這很重要：** 外部服務在不同 LLM 執行間經常更改顯示名稱 (例如："Azure OpenAI" vs "GPT-4 Endpoint" vs "LLM Backend")。`config_keys` 和 `dependencies` 欄位是讓它們在不同執行間可匹配的原因。

   **⛔ 禁止的命名模式 — 絕不使用這些：**
   - 絕不發明與真實類別不對應的抽象名稱：`ConfigurationStore`, `LocalFileSystem`, `DataLayer`, `IngestionPipeline`, `BackendServer`
   - 絕不縮寫類別名稱：例如以 `TerminalUI` 代替 `TerminalUserInterface`，或以 `PSExecutor` 代替 `PowerShellCommandExecutor`
   - 絕不使用同義詞替換：例如以 `TaskServer` 代替 `TaskProcessor`，或以 `LLMService` 代替 `ResponsesAPIService`
   - 絕不將兩個獨立的類別合併為一個元件：`ResponsesAPIService` 和 `LLMService` 是兩個不同的類別 → 兩個不同的元件
   - 絕不為程式碼中不存在的事物建立元件：若無 Windows 登錄編輯程式存取程式碼，請勿建立 `WindowsRegistry` 元件
   - 絕不在執行間重新命名：若您在執行 1 中稱之為 `TaskProcessor`，則在執行 2 中它「必須」仍是 `TaskProcessor`

   **⛔ 元件錨點驗證 (強制性 — 在步驟 2 前執行)：**
   識別所有元件後，建立心智檢查清單：
   ```
   對於每個元件：
     問：錨定此元件的確切檔案名稱或類別為何？
     答：[必須引用真實檔案路徑，例如 "src/Core/TaskProcessor.cs"]
     若您無法引用真實檔案 → 從您的清單中刪除該元件
   ```
   此驗證可捕捉發明的元件，例如 `WindowsRegistry` (不存在登錄程式碼)、`ConfigurationStore` (無此類別)、`LocalFileSystem` (抽象概念，非類別)。

   **⛔ 元件選擇穩定性 (當存在多個相關類別時)：**
   許多系統具有相關類別叢集 (例如：`CredentialManager`, `AzureCredentialProvider`, `AzureAuthenticationHandler`)。為確保決定性選擇：
   - **挑選「擁有」安全性相關行為的類別** — 即做出信任決策、持有認證或處理資料的類別
   - **偏好在相依性注入 (dependency injection) 中註冊的類別**，而非輔助程式/公用程式
   - **偏好高階協作者 (orchestrator)**，而非其內部實作類別
   - **一旦挑選了某個類別，其替代方案即成為別名** — 將它們加入 `aliases` 陣列，而非作為獨立元件
   - **範例**：若 `CredentialManager` 協調認證查閱並在內部使用 `AzureCredentialProvider` 內部，則 `CredentialManager` 是元件，而 `AzureCredentialProvider` 是別名
   - **範例**：不要同時包含 `SessionStore` 和 `SessionFiles` — `SessionStore` 是類別，`SessionFiles` 是抽象概念
   - **計數規則**：在同一個程式碼基礎上的兩次執行「必須」產生相同數量的元件 (邊緣情況 ±1)。差異 ≥3 個元件表示未遵循選擇規則。

   **⛔ 穩定性錨點 (用於比較匹配)：**
   在 `threat-inventory.json` 中記錄每個元件時，`fingerprint` 欄位 `source_directories`、`class_names` 和 `namespace` 作為 **穩定性錨點** — 即使發生以下情況，這些不可變的識別碼仍會持續存在：
   - 類別重新命名 (目錄保持不變)
   - 檔案移動到不同目錄 (類別名稱保持不變)
   - 分析執行間元件 ID 發生變化 (命名空間保持不變)
   比較匹配演算法對這些錨點的依賴程度「高於」對元件 `id` 欄位的依賴。因此：
   - `source_directories` 「必須」填寫每個程序類型元件 (絕非空值 `[]`)
   - `class_names` 「必須」至少包含主要類別名稱
   - `namespace` 「必須」是實際的程式碼命名空間 (例如：`MyApp.Core.Servers.Health`)，而非虛構的群組
   - 這些欄位是讓元件在獨立分析執行中可被識別的原因，即使兩個 LLM 挑選了不同的顯示名稱

   **⛔ 元件資格 — 什麼算作威脅模型元件：**
   類別/服務僅在符合以下「所有」準則時，才成為威脅模型元件：
   1. **它跨越信任邊界，或處理安全性敏感資料** (認證、使用者輸入、網路 I/O、檔案 I/O、程序執行)
   2. **它是頂層服務**，而非內部輔助程式 (註冊在 DI 中，或是主要進入點，或是具有自身職責的代理程式)
   3. **它會出現在部署圖中** — 您可以指出它並說「這在這裡執行，與那個對談」

   **務必包含這些元件類型 (若程式碼中存在)：**
   - 所有代理程式類別 (HealthAgent, InfrastructureAgent, InvestigatorAgent, SupportabilityAgent 等)
   - 所有 MCP 伺服器類別 (HealthServer, InfrastructureServer 等)
   - 主要主機/協作者 (MCPHost 等)
   - 所有外部服務連線 (AzureOpenAI, AzureAD 等)
   - 所有認證/授權管理員
   - 使用者介面進入點
   - 所有工具執行服務 (PowerShellCommandExecutor 等)
   - 所有工作階段/狀態持續性服務
   - 所有 LLM 服務類別 (ResponsesAPIService, LLMService — 若它們是獨立類別，則為獨立元件)
   - 外部參與者 (Operator, EndUser)

   **絕不將這些列為獨立元件：**
   - 日誌記錄器 (LocalFileLogger, TelemetryLogger) — 這些是橫切關注點 (cross-cutting concerns)，而非威脅模型元件
   - 靜態輔助類別
   - 模型/DTO 類別
   - 組態建構器 (除非它們處理秘密)
   - 在執行階段不存在的基礎設施即程式碼 (Infrastructure-as-code) 類別 (AzureStackHCI 叢集參考、部署腳本)

   **目標：** 在同一個程式碼基礎上的每次執行都應識別出相同的 ~12-20 個元件集。若您包含了日誌記錄器或排除了一個代理程式，那就是做錯了。

   **邊界命名規則：**
   - 邊界 ID 「必須」為 PascalCase (絕不使用 `Layer`, `Zone`, `Group`, `Tier` 後置字串)
   - 衍生自部署拓撲，而非程式碼架構層
   - **部署拓撲決定邊界：**
     - 單一程序應用程式 → **確切為 2 個邊界**：`Application` (程序) + `External` (外部服務)。絕不使用 1 個邊界。絕不使用 3 個以上邊界。這對單一程序應用程式是強制性的。
     - 多容器應用程式 → 每個容器/Pod 一個邊界
     - K8s 部署 → `K8sCluster` + 相關的每個命名空間邊界
     - 用戶端-伺服器 → `Client` + `Server`
   - **K8s 多服務部署 (對微服務架構至關重要)：**
     當 K8s 命名空間包含多個具有「不同」安全性特性的 Deployment/StatefulSet 時，請根據工作負載類型建立子邊界：
     - `BackendServices` — 處理使用者請求的 API 服務 (FastAPI, Express 等)
     - `DataStorage` — 資料庫與持續性儲存 (Redis, Milvus, PostgreSQL, NFS) — 這些具有不同的存取控制、持續性及備份原則
     - `MLModels` — 執行於 GPU 節點上的 ML 模型伺服器 — 這些具有不同的運算資源、攻擊面 (對抗性輸入) 及擴充特性
     - `Agentic` — 代理程式執行階段/管理員服務 (若存在)
     - 外部 `K8sCluster` 包含這些子邊界
     - **這不是「程式碼層」** — 每個子邊界代表一個不同的 Kubernetes Deployment/StatefulSet，具有自己的安全性背景、資源限制及網路原則
     - **測試**：若兩個元件位於「不同」的 Kubernetes Deployment 中，且具有不同的服務帳戶、不同的網路暴露或不同的資源需求 → 它們「應」位於不同的子邊界中
   - **禁止的邊界方案 (僅針對單一程序應用程式)：**
     - 請勿根據程式碼層建立邊界：`PresentationBoundary`, `OrchestrationBoundary`, `AgentBoundary`, `ServiceBoundary` 是程式碼層，而非部署邊界。所有這些都在「同一個」程序中執行。
     - 請勿將單一程序拆分為 4 個以上邊界。若所有元件都在同一個 .exe 中執行，則它們都在「一個」邊界中。
   - **範例**：一個應用程式中 `TerminalUserInterface`, `MCPHost`, `HealthAgent`, `ResponsesAPIService` 全都在同一個程序中執行 → 它們全都在 `Application` 中。外部服務如 `AzureOpenAI` 則在 `External` 中。
   - 在同一個程式碼基礎上的兩次執行「必須」產生相同數量的邊界 (±1)。差異 ≥2 個邊界是錯誤的。
   - 絕不根據程式碼層 (呈現/商業/資料) 建立邊界 — 邊界代表「部署」信任邊界，而非程式碼架構

   **邊界數量鎖定：**
   - 識別邊界後，鎖定數量。在同一個程式碼基礎上的兩次執行「必須」產生相同數量的邊界 (若一次執行識別出另一次未識別出的邊緣邊界，則 ±1 是可接受的)
   - 在同一個程式碼基礎上的 4 邊界與 7 邊界差異是錯誤的，且表示未遵循命名規則

   **額外命名規則：**
   - 同一個元件「必須」獲得相同的 `id`，無論是由哪個 LLM 模型執行分析或執行多少次
   - 外部參與者 (`Operator`, `AzureDataStudio` 等) 「務必」包含 — 絕不捨棄它們
   - 代表不同儲存 (檔案、資料庫) 的資料儲存「務必」是獨立元件 — 絕不合併它們
   - 在步驟 2 之前鎖定元件清單。在後續「所有」檔案 (架構、DFD、STRIDE、發現、JSON) 中使用這些確切的 ID
   - 若兩個類別以獨立檔案存在 (例如：`ResponsesAPIService.cs` 與 `LLMService.cs`)，則它們是「兩個」元件，即使它們看起來相關

   **⛔ 資料流完整性 (強制性 — 確保不同執行間一致的流量列舉)：**
   資料流「必須」詳盡列舉。對同一個程式碼基礎的兩次獨立分析「必須」產生相同的流量集。為達成此目的：

   **⛔ 回傳流建模規則 (解決資料流數量 24% 的變異)：**
   - **請勿建立獨立的回傳流模型。** 一個請求-回應對是一個雙向流 (在 Mermaid 中使用 `<-->`)。
   - 範例：`DF01: Operator <--> TUI` (一個流量用於輸入與輸出)
   - 範例：`DF03: MCPHost <--> HealthAgent` (一個流量用於委派與結果)
   - **僅在兩個方向使用不同通訊協定或語意時 (例如：HTTP 請求 vs WebSocket 推播回傳)，才建立獨立的流量模型。**
   - **原因：** 當不同執行獨立決定每次互動是建立 1 個還是 2 個流量時，流量計數會有 20-30% 的變異。此規則消除了該變異。
   - **流量計數公式：** `流量數量 ≈ 唯一的元件對元件互動數量`。若元件 A 與元件 B 對談，那是 1 個流量，而非 2 個。

   **流量完整性檢查清單 (依上述回傳流規則使用 `<-->` 雙向流)：**
   1. **入口 (Ingress)/反向代理流量**：`DF_EndUser_to_NginxIngress` (雙向 `<-->`), `DF_NginxIngress_to_Backend` (雙向 `<-->`)。每個都是「一個」流量，而非兩個。
   2. **資料庫/資料儲存流量**：`DF_Service_to_Redis` (雙向 `<-->`)。每個服務-資料儲存對一個流量。
   3. **認證提供者流量**：`DF_Service_to_AzureAD` (雙向 `<-->`)。每個服務-認證對一個流量。
   4. **管理員存取流量**：`DF_Operator_to_Service` (雙向 `<-->`)。每個管理員互動一個。
   5. **流量數量鎖定**：列舉流量後，鎖定數量。在同一個程式碼基礎上的兩次執行「必須」產生相同數量的流量 (可接受 ±3)。差異 >5 個流量表示列舉不完整。

   **⛔ 外部實體包含規則 (解決建模哪些外部項目的變異)：**
   - 若程式碼從 Azure AD / Microsoft Entra ID 獲取權杖 (尋找 `ChainedTokenCredential`, `ManagedIdentityCredential`, `AzureCliCredential`, MSAL 或任何 OAuth2/OIDC 流)，**務必將 `AzureAD` (或 `EntraID`) 包含為外部實體**。
   - 若程式碼透過 PowerShell、REST 或 WMI 向外部基礎設施傳送命令，**務必將基礎設施目標 (例如：`OnPremInfra`, `HCICluster`) 包含為外部實體**。
   - 若程式碼呼叫雲端 LLM API，**務必包含 `AzureOpenAI`** (或同等 LLM 端點)。
   - 對於 CLI/TUI 工具、管理工具或操作員主控台，**務必包含 `Operator`** 作為外部參與者。
   - **經驗法則**：若程式碼具有服務的用戶端類別或組態，該服務即為外部實體。

   **⛔ TMT 類別規則 (解決執行間類別不一致的問題)：**
   - 公開可由代理程式呼叫之 API 的**工具伺服器** → `SE.P.TMCore.WebSvc` (而非 `SE.P.TMCore.NetApp`)
   - 處理連線/通訊端的**網路層級服務** → `SE.P.TMCore.NetApp`
   - **執行 OS 命令** (PowerShell, bash) 的服務 → `SE.P.TMCore.OSProcess`
   - **將資料儲存至磁碟**的服務 (SessionStore, FileLogger) → `SE.DS.TMCore.FS` (歸類為資料儲存，而非程序)
   - **規則**：若類別的主要目的是持續性資料，則它是資料儲存。若它執行運算或協作，則它是程序。絕不在執行間切換。

   **⛔ DFD 方向 (強制性 — 解決版面變異)：**
   - 所有 DFD 「必須」使用 `flowchart LR` (由左至右)。絕不使用 `flowchart TB`。
   - 所有摘要 DFD 也「必須」使用 `flowchart LR`。
   - 這是不可變的 — 請勿根據美感或圖表形狀進行更改。

   **PascalCase 的縮寫規則：**
   - 保留知名的縮寫為全大寫：`API`, `NFS`, `LLM`, `SQL`, `HCI`, `AD`, `UI`, `DB`
   - 範例：`IngestionAPI` (非 `IngestionApi`), `NFSServer` (非 `NfsServer`), `AzureAD` (非 `AzureAd`), `VectorDBAPI` (非 `VectorDbApi`)
   - 單一單字技術保持標準大小寫：`Redis`, `Milvus`, `PostgreSQL`, `Nginx`

   **常見技術命名 (對於知名的基礎設施，請確切使用這些 ID)：**
   - Redis 快取/狀態：`Redis` (絕非 `DaprStateStore`, `RedisCache`, `StateStore`)
   - Milvus 向量資料庫：`Milvus` (絕非 `MilvusVectorDb`, `VectorDB`)
   - NGINX 入口 (Ingress)：`NginxIngress` (絕非 `IngressNginx`)
   - Azure AD/Entra：`AzureAD` (絕非 `AzureAd`, `EntraID`)
   - PostgreSQL：`PostgreSQL` (絕非 `PostgresDb`, `Postgres`)
   - 使用者/維運人員：`Operator` 用於管理員使用者，`EndUser` 用於終端使用者
   - Azure OpenAI：`AzureOpenAI` (絕非 `OpenAIService`, `LLMEndpoint`)
   - NFS：`NFSServer` (絕非 `NfsServer`, `FileShare`)
   - 如果兩個 LLM 模型是分開部署的，請保持分開 (絕不將 `MistralLLM` + `PhiLLM` 合併為 `LocalLlm`)

   **但是：對於特定於應用程式的類別，請使用程式碼中確切的類別名稱，而非技術標籤：**
   - `ResponsesAPIService.cs` → `ResponsesAPIService` (非 `OpenAIService` — 該類別名稱即為 ResponsesAPIService)
   - `TaskProcessor.cs` → `TaskProcessor` (非 `LocalLLM` — 該類別名稱即為 TaskProcessor)
   - `SessionStore.cs` → `SessionStore` (非 `StatePersistence` — 該類別名稱即為 SessionStore)
   **元件細粒度規則 (對於穩定性至關重要)：**
   - 在**技術/服務層級**建立元件模型，而非腳本/檔案層級
   - 執行 Kusto 的 Docker 容器為 `KustoContainer` — 不分解為 `KustoService` + `IngestLogs` + `KustoDataDirectory`
   - Moby Docker 引擎為 `MobyDockerEngine` — 非 `InstallMoby` (安裝腳本是證據，而非元件)
   - 工具的安裝程式為 `SetupInstaller` — 不重新命名為 `InstallAzureEdgeDiagnosticTool` (腳本檔名)
   - 規則：如果一個元件具有一個主要功能 (例如，「執行 Kusto 查詢」)，則將其建模為一個元件，無論有多少腳本/檔案實作它
   - 腳本是元件的證據，而非元件本身
   - 在多次執行中保持相同的細粒度 — 絕不將單一元件拆分為子元件，也不在多次執行之間合併子元件

   **⛔ 元件 ID 格式 (強制性 — 解決大小寫差異)：**
   - 所有元件 ID 必須使用 PascalCase。絕不使用 kebab-case、snake_case 或 camelCase。
   - 範例：`HealthAgent` (非 `health-agent`), `AzureAD` (非 `azure-ad`), `MCPHost` (非 `mcp-host`)
   - 這適用於所有產出物：0.1-architecture.md, 1-threatmodel.md, DFD mermaid, STRIDE, 發現事項 (findings), JSON。

   **⛔ STRIDE 範圍規則 (解決外部實體分析差異)：**
   - `2-stride-analysis.md` 中的 STRIDE 分析必須包含元件表中除外部參與者 (Operator, EndUser) 之外的所有元素區段。
   - 外部服務 (AzureOpenAI, AzureAD, OnPremInfra) 確實需要 STRIDE 區段 — 從您系統的角度來看，它們是攻擊面。
   - 外部參與者 (人類使用者) 不需要 STRIDE 區段 — 他們是威脅來源，而非目標。
   - 這意味著：如果您總共有 20 個元素，其中 1 個是外部參與者，您需要撰寫 19 個 STRIDE 區段。

   **⛔ STRIDE 深度一致性 (解決威脅計數差異)：**
   - 每個元件必須分析所有 7 個 STRIDE-A 類別 (S, T, R, I, D, E, A)。
   - 每個元件的每個 STRIDE 類別必須明確處理：包含一個或多個具體威脅，或使用明確的 `N/A — {1 句話的理由}` 欄位說明為什麼該類別不適用於此特定元件。
   - 一個類別可能會產生 0, 1, 2, 3 或更多威脅 — 計數取決於元件的實際攻擊面。請勿將每個類別限制為 1 個威脅。具有豐富安全面的元件 (API 服務、身份驗證管理器、指令執行器、LLM 客戶端) 通常在每個相關 STRIDE 類別中應有 2-4 個威脅。只有簡單的元件 (靜態設定、唯讀資料儲存庫) 通常大部分為 0-1 個。
   - **預期分佈：** 對於一個 15 個元件的系統：大約 30% 的 STRIDE 單元格應為 0 (含 N/A)，大約 40% 應為 1，大約 25% 應為 2，大約 5% 應為 3+。如果所有單元格都是 0 或 1 (二進位模式) → 分析太淺。請返回並識別額外的威脅向量。
   - N/A 條目不計入摘要表中的威脅總數。僅計算具體的威脅列。
   - 摘要表 S/T/R/I/D/E/A 欄位顯示每個類別的具體威脅計數 (如果 N/A 合理，0 是有效的)。
   - 這確保了全面覆蓋，同時產生準確、非誇大的威脅計數。

2. **撰寫架構概觀** (`0.1-architecture.md`)
   - **先閱讀 `skeletons/skeleton-architecture.md`** — 複製骨架結構，填充 `[FILL]` 佔位符
   - 系統目的、關鍵元件、主要情境、技術堆疊、部署
   - **使用步驟 1 中鎖定的確切元件 ID** — 不要重新命名或合併元件
   - **參考：** `output-formats.md` 取得範本，`diagram-conventions.md` 取得架構圖樣式

3. **盤點安全基礎設施**
   - 在標記缺失之前，識別啟用安全的元件
   - **參考：** `analysis-principles.md` 安全基礎設施盤點表

4. **產生威脅模型 DFD** (`1.1-threatmodel.mmd`, `1.2-threatmodel-summary.mmd`, `1-threatmodel.md`)
   - **先閱讀 `skeletons/skeleton-dfd.md`, `skeletons/skeleton-summary-dfd.md` 和 `skeletons/skeleton-threatmodel.md`**
   - **參考：** `diagram-conventions.md` 取得 DFD 樣式，`tmt-element-taxonomy.md` 取得元素分類
   - ⚠️ **在完稿之前：** 執行 `diagram-conventions.md` 中的渲染前檢查清單

   ⛔ **DFD 後置閘口 — 在建立 `1.1-threatmodel.mmd` 後立即執行：**
   1. 計算 `1.1-threatmodel.mmd` 中的元素數量 (帶有 `((...))`, `[(...)`, `["..."]` 的節點)
   2. 計算邊界數量 (`subgraph` 列)
   3. 如果元素 > 15 或邊界 > 4：
      → 您現在必須使用 `skeleton-summary-dfd.md` 建立 `1.2-threatmodel-summary.mmd`
      → 在摘要檔案存在之前，請勿繼續執行 `1-threatmodel.md`
   4. 如果未達閾值 → 跳過摘要，繼續執行 `1-threatmodel.md`
   5. 建立 `1-threatmodel.md` (如果產生了摘要，請包含摘要檢視區段)

5. **列舉威脅** 每個元素和流程使用 STRIDE-A (`2-stride-analysis.md`)
   - **先閱讀 `skeletons/skeleton-stride-analysis.md`** — 使用摘要表和每個元件的結構
   - **參考：** `analysis-principles.md` 取得層級 (tier) 定義，`output-formats.md` 取得 STRIDE 範本
   - **⛔ 先決條件下限檢查 (每個威脅)：** 在為任何威脅分配先決條件之前，請在元件暴露表 (`0.1-architecture.md`) 中查閱該元件的 `Min Prerequisite` (最小先決條件) 和 `Derived Tier` (衍生層級)。威脅的先決條件必須 ≥ 元件的下限。威脅的層級必須 ≥ 元件的衍生層級 (例如，如果元件是 T2，則威脅不能是 T1)。使用 `analysis-principles.md` 中標準的先決條件→層級對照表。

6. **對於每個威脅：** 引用檔案/函式/端點，提出緩解措施，提供驗證步驟

7. **驗證發現事項** — 在記錄之前，根據實際設定確認每個發現事項
   - **參考：** `analysis-principles.md` 發現事項驗證檢查清單

7b. **技術掃描** — 執行 `analysis-principles.md` 中的技術特定安全檢查清單
   - 對於在儲存庫中找到的每一項技術 (Redis, Milvus, PostgreSQL, Docker, K8s, ML 模型, LLM, NFS, CI/CD 等)，確認您至少有一項發現事項或明確的緩解措施
   - 此步驟可捕捉元件層級 STRIDE 遺漏的差距 (例如，資料庫身份驗證預設值、容器強化、金鑰管理)
   - 在繼續執行步驟 8 之前，新增任何遺漏的發現事項

8. **編譯發現事項** (`3-findings.md`)
   - **參考：** `output-formats.md` 取得發現事項範本和相關威脅連結格式
   - **參考：** `skeletons/skeleton-findings.md` — 閱讀此骨架，逐字複製，為每個發現事項填寫 `[FILL]` 佔位符

   ⛔ **寫入前閘口 — 在為 `3-findings.md` 呼叫 `create_file` 之前進行驗證：**
   1. 發現事項 ID：`### FIND-01:`, `### FIND-02:` — 依序排列，`FIND-` 前綴 (非 `F01` 或 `F-01`)
   2. CVSS 前綴：每個向量都以 `CVSS:4.0/` 開頭 (非僅 `AV:N/AC:L/...`)
   3. 相關威脅：每個威脅 ID 都是一個單獨的超連結 `[TNN.X](2-stride-analysis.md#anchor)` (非純文字)
   4. 子區段：`#### Description`, `#### Evidence`, `#### Remediation`, `#### Verification` (非 `Recommendation`)
   5. 排序：在每個層級內 → Critical (關鍵) → Important (重要) → Moderate (中等) → Low (低) → CVSS 較高者優先
   6. 每個發現事項必須包含所有 10 個強制的屬性列
   7. **部署情境閘口 (失敗即關閉)：** 閱讀 `0.1-architecture.md` 的部署分類和元件暴露表。
      如果分類是 `LOCALHOST_DESKTOP` 或 `LOCALHOST_SERVICE`：
      - 發現事項的 `Exploitation Prerequisites` (利用先決條件) 不得為 `None` → 修正為 `Local Process Access` (T2) 或 `Host/OS Access` (T3)
      - 發現事項不得位於 `## Tier 1` → 根據先決條件降級為 T2/T3
      - CVSS 向量不得使用 `AV:N`，除非元件暴露表中的**特定元件**具有 `Reachability = External` (外部可達性) → 修正為 `AV:L`
      對於所有部署分類：
      - 對於每個發現事項，在暴露表中查找其元件。發現事項的先決條件必須 ≥ 元件的 `Min Prerequisite`。發現事項的層級必須 ≥ 元件的 `Derived Tier`。
      - 先決條件必須僅使用標準值：`None`, `Authenticated User`, `Privileged User`, `Internal Network`, `Local Process Access`, `Host/OS Access`, `Admin Credentials`, `Physical Access`, `{Component} Compromise`。⛔ 禁止使用 `Application Access` 和 `Host Access`。
      如果存在任何違規 → **請勿寫入檔案。** 先修正所有違規。

   ⛔ **快速失敗閘口：** 寫入後立即執行 `verification-checklist.md` 中針對 `3-findings.md` 的內嵌快速檢查。在繼續之前進行修正。

   ⛔ **強制性：所有 3 個層級區段都必須存在。** 即使某個層級沒有發現事項，也要包含標題並附上註解：
   - `## Tier 1 — Direct Exposure (No Prerequisites)` → `*此儲存庫未識別出 Tier 1 發現事項。*`
   - 這確保了用於比較對照和驗證的結構一致性。

   ⛔ **覆蓋範圍驗證回饋迴圈 (強制性)：**
   在 `3-findings.md` 末尾編寫威脅覆蓋範圍驗證表後：
   1. **掃描您剛寫好的表格。** 計算有多少威脅的狀態為 `✅ Covered`、`🔄 Mitigated by Platform`、`⚠️ Needs Review` 或 `⚠️ Accepted Risk`。
   2. **如果任何威脅為 `⚠️ Accepted Risk`** → 失敗。該工具無法接受風險。請返回並為每個威脅建立一個發現事項。
   3. **如果平台緩解 (Platform) 比例 > 20%** → 可疑。重新檢查每個 `🔄 Mitigated by Platform` 條目：該緩解措施是否確實來自另一個團隊管理的外部系統？如果緩解措施是儲存庫本身的程式碼 (身份驗證中間件、檔案權限、TLS 設定、localhost 綁定)，請重新分類為 `Open` 並建立一個發現事項。
   4. **如果 `2-stride-analysis.md` 中的任何 `Open` 威脅沒有對應的發現事項** → 現在建立發現事項。使用威脅的說明作為發現事項標題，將緩解措施列作為修復指引，並根據 STRIDE 類別分配嚴重程度。
   5. **使用新建立的發現事項更新 `3-findings.md`**。按順序重新編號。更新覆蓋範圍表，將每一項顯示為 `✅ Covered`。
   6. **這個迴圈是覆蓋範圍表的全部意義所在** — 它不是文件，而是一個強制全面覆蓋的自我檢查。如果您寫了表而不對差距採取行動，那麼您就白費力氣了。

8b. **產生威脅清單** (`threat-inventory.json`)
   - **先閱讀 `skeletons/skeleton-inventory.md`** — 使用確切的欄位名稱和結構定義 (schema) 結構
   - 在撰寫完所有 Markdown 報告後，編譯一個包含所有元件、邊界、資料流、威脅和發現事項的結構化 JSON 清單
   - 為元件使用標準的 PascalCase ID (衍生自類別/檔名)，並保持顯示標籤分離
   - 使用標準的流程 ID：`DF_{Source}_to_{Target}`
   - 在每個威脅和發現事項上包含識別金鑰 (identity keys)，以便將來進行匹配
   - 包含確定性的識別欄位，用於跨執行的元件和邊界匹配：
   - 元件：`aliases`, `boundary_kind`, `fingerprint`
   - 邊界：`kind`, `aliases`, `contains_fingerprint`
   - Build `fingerprint` from stable evidence (source files, endpoint neighbors, protocols, type) — never from prose wording
   - 將同義詞標準化為相同的標準元件 ID (範例：`SupportAgent` 和 `SupportabilityAgent` → `SupportabilityAgent`) 並將替代名稱儲存在 `aliases` 中
   - 在寫入 JSON 之前對陣列進行確定性排序：
   - `components` 依 `id` 排序
   - `boundaries` 依 `id` 排序
   - `flows` 依 `id` 排序
   - `threats` 依 `id` 然後是 `identity_key.component_id` 排序
   - `findings` 依 `id` 然後是 `identity_key.component_id` 排序
   - Extract metrics (總數、各層級計數、各 STRIDE 類別計數)
   - 包含 Git 中繼資料 (Metadata) (commit SHA, 分支, 日期) 和分析中繼資料 (模型, 時間戳記)
   - **參考：** `output-formats.md` 取得 `threat-inventory.json` 結構定義
   - **此檔案未在 0-assessment.md 中連結**，但始終存在於輸出資料夾中

   ⛔ **寫入前大小檢查 (強制性 — 在為 JSON 呼叫 `create_file` 之前)：**
   在寫入 `threat-inventory.json` 之前，計算您計劃包含的資料：
   - 計算來自 `2-stride-analysis.md` 的總威脅數 (grep `^\| T\d+\.`)
   - 計算來自 `3-findings.md` 的總發現事項數 (grep `### FIND-`)
   - 計算來自 `0.1-architecture.md` 的總元件數
   - **如果威脅 > 50 或發現事項 > 15：** 請勿使用單個 `create_file` 呼叫。
     相反，請使用以下方法之一：(a) 委派給子代理程式，(b) Python 擷取腳本，(c) 分段寫入策略。
   - **如果威脅 ≤ 50 且發現事項 ≤ 15：** 單個 `create_file` 是可以接受的，但請保持條目簡潔 (1 句話的說明/緩解欄位)。

   ⛔ **寫入後驗證 (強制性 — JSON 陣列完整性)：**
   在寫入 `threat-inventory.json` 後，立即驗證：
   - `threats.length == metrics.total_threats` — 如果不匹配，則威脅陣列在產生期間被截斷。透過重新閱讀 `2-stride-analysis.md` 並擷取每一列威脅來重建。
   - `findings.length == metrics.total_findings` — 如果不匹配，從 `3-findings.md` 重建。
   - `components.length == metrics.total_components` — 如果不匹配，從架構/元素表重建。

   ⛔ **跨檔案威脅計數驗證 (強制性 — 捕捉遺漏的威脅)：**
   JSON 的 `threats.length` 可能與 `metrics.total_threats` 匹配，但如果威脅在 JSON 產生期間被丟棄，則兩者都可能是錯誤的。為了捕捉這一點：
   - 計算 `2-stride-analysis.md` 中的威脅列數：grep 搜尋 `^\| T\d+\.` 並計算唯一的威脅 ID
   - 將此計數與 JSON 中的 `threats.length` 進行比較
   - 如果 Markdown 中的威脅數量多於 JSON → JSON 丟失了威脅。透過重新從 `2-stride-analysis.md` 擷取所有威脅來重建 JSON。
   - 這是測試中觀察到的第 2 大品質問題 (僅次於截斷)。大型儲存庫 (114+ 個威脅) 在子代理程式從記憶體編寫 JSON 而不是重新閱讀 STRIDE 檔案時，經常會遺失 1-3 個威脅。

   ⛔ **欄位名稱合規性閘口 (強制性 — 在陣列檢查後立即執行)：**
   讀取剛寫入的 JSON 中的第一個元件和第一個威脅，並驗證這些確切的欄位名稱：
   - `components[0]` 具有鍵值 `"display"` (非 `"display_name"`, 非 `"name"`) → 如果錯誤，尋找並替換所有出現之處
   - `threats[0]` 具有鍵值 `"stride_category"` (非 `"category"`) → 如果錯誤，尋找並替換所有出現之處
   - `threats[0].identity_key` 具有鍵值 `"component_id"` (威脅→元件連結必須位於 `identity_key` 內部，而非威脅上的頂層 `component_id` 欄位) → 如果錯誤，請重新調整結構
   - `threats[0]` 同時具有 `"title"` (短名稱，例如，「資訊洩漏 — Redis 未加密流量」) 和 `"description"` (較長的散文)。如果僅存在 `description` 而沒有 `title`，請根據 `description` 的第一句話建立 `title`。如果存在 `name` 或 `threat_name` 而非 `title`，請尋找並替換為 `title`
   - **為什麼這很重要：** 下游工具依賴這些確切的欄位名稱。錯誤的名稱會導致零值熱點圖、損壞的元件匹配以及比較報告中出現空白顯示標籤。
   - **如果任何欄位名稱錯誤：** 現在就在 JSON 檔案上使用尋找替換功能進行修正，然後再繼續。請勿留待驗證階段。

   - **這是測試中觀察到的第 1 大品質問題。** 大型儲存庫 (20+ 個元件，80+ 個威脅) 經常出現截斷的 JSON 陣列，因為模型耗盡了輸出 Token。如果任何陣列被截斷，您必須在繼續之前重建它。請勿在計數不匹配的情況下完稿。

   ⛔ **強制性閘口 — 截斷恢復 (強制性)：**
   如果寫入後驗證偵測到任何陣列不匹配：
   1. 立即**刪除**截斷的 `threat-inventory.json`
   2. **不要嘗試修補**截斷的檔案 — 部分 JSON 是不可靠的
   3. **使用以下策略之一重新產生** (按偏好順序)：
      a. **委派給子代理程式** — 將輸出資料夾路徑交給子代理程式，並指示其閱讀 `2-stride-analysis.md` 和 `3-findings.md`，然後寫入 `threat-inventory.json`。子代理程式擁有全新的內容視窗。
      b. **Python 擷取腳本** — 編寫一個 Python 腳本來閱讀 Markdown 檔案，透過正規表示式擷取威脅/發現事項，並寫入 JSON。透過終端機執行腳本。
      c. **分段寫入** — 使用下方的「大型儲存庫策略」。
   4. 重新產生後**重新驗證** — 如果仍然不匹配，請使用下一個策略重複執行
   5. **絕不可以在計數不匹配的情況下繼續執行步驟 9 (評估) 或步驟 10 (驗證)**

   ⛔ **大型儲存庫策略 (對於威脅數 >60 的儲存庫為強制性)：**
   對於產生超過約 60 個威脅的儲存庫，如果一次性產生， JSON 檔案可能會超過輸出 Token 限制。使用此分段方法：
   1. **先寫入中繼資料 + 元件 + 邊界 + 流程 + 指標** — 這些是小型陣列
   2. **分批附加威脅** — 每次附加操作寫入約 20 個威脅的陣列。使用 `replace_string_in_file` 將批次新增至現有檔案，而不是在單次 `create_file` 呼叫中寫入整個 JSON。
   3. **附加發現事項** — 如果發現事項 >15 個，同樣分批進行
   4. **最終驗證** — 閱讀完成的檔案並驗證所有陣列長度是否與指標匹配

   **替代方案：** 如果分段寫入不可行，請保持每個威脅/發現事項條目簡潔：
   - `description` 欄位：最多 1 句話 (非完整的散文段落)
   - `mitigation` 欄位：最多 1 句話
   - 移除與 Markdown 內容重複的多餘欄位
   - JSON 是為了匹配，而非閱讀 — 簡潔是關鍵

9. **撰寫評估** (`0-assessment.md`)
   - **參考：** `output-formats.md` 取得評估範本
   - **參考：** `skeletons/skeleton-assessment.md` — 閱讀此骨架，逐字複製，填寫 `[FILL]` 佔位符
   - ⚠️ **所有 7 個區段皆為強制性：** 報告檔案 (Report Files)、執行摘要 (Executive Summary)、行動摘要 (Action Summary，含 Quick Wins)、分析背景與假設 (Analysis Context & Assumptions，含 Needs Verification + Finding Overrides)、諮詢參考 (References Consulted)、報告中繼資料 (Report Metadata)、分類參考 (Classification Reference)
   - 請勿新增額外的區段，例如「嚴重程度分佈」、「架構風險區域」、「方法論說明」或「交付物」 — 這些不在範本中

   ⛔ **寫入前閘口 — 在為 `0-assessment.md` 呼叫 `create_file` 之前進行驗證：**
   1. 確切包含 7 個區段：Report Files, Executive Summary, Action Summary, Analysis Context & Assumptions (含 `&`), References Consulted, Report Metadata, Classification Reference
   2. 每對 `## ` 區段之間都有 `---` 水平線 (至少 6 條)
   3. `### Quick Wins`, `### Needs Verification`, `### Finding Overrides` 皆存在
   4. 參考資料：兩個子區段 (`### Security Standards` + `### Component Documentation`)，具有 3 欄表格和完整 URL
   5. 所有中繼資料值都用反引號包裹；所有欄位皆存在 (Model, Analysis Started, Analysis Completed, Duration)
   6. 元素/發現事項/威脅計數與其他檔案中的實際計數匹配

   ⛔ **快速失敗閘口：** 寫入後立即執行 `verification-checklist.md` 中針對 `0-assessment.md` 的內嵌快速檢查。在繼續之前進行修正。

10. **最終驗證** — 迭代修正迴圈

   此步驟循環執行驗證和修正，直到所有檢查通過。在仍有失敗的情況下，請勿完稿。

   **Pass 1 — 全面驗證：**
   - 委派給帶有 `verification-checklist.md` 內容 + 輸出資料夾路徑的驗證子代理程式
   - 子代理程式執行所有階段 0–5 的檢查，並報告通過/失敗以及證據
   - 如果任何檢查失敗：
     1. 使用可用的檔案編輯工具修正失敗的檔案
     2. 僅針對修正後的檔案重新執行失敗的檢查
     3. 重複執行，直到失敗的檢查通過

   **Pass 2 — 迴歸檢查 (如果 Pass 1 有修正)：**
   - 重新執行階段 3 (跨檔案一致性)，以確保修正未損壞其他檔案
   - 如果出現新的失敗，請修正並重新驗證

   **結束條件：** 所有階段均報告 0 個失敗。只有在那時才將分析標記為已完成。

   **子代理程式內容管理：**
   - 在子代理程式提示中包含 `verification-checklist.md` 相關階段的內容
   - 包含輸出資料夾路徑，以便子代理程式可以讀取檔案
   - 子代理程式輸出必須包含：階段名稱、檢查總數、通過、失敗，以及針對每個失敗項：檢查 ID、檔案、證據、確切的修正指令。在沒有計數的情況下，請勿回傳「看起來不錯」。

---

## 工具使用

### 進度追蹤 (todo)
- 在開始時為每個主要階段建立待辦事項 (todos)
- 在開始每個階段之前標記為進行中 (in-progress)
- 在完成每個階段後立即標記為已完成 (completed)

### 子任務委派 (agent)
將狹窄、唯讀的任務委派給子代理程式 (參見上方的「子代理程式治理」)。允許的委派事項：
- **內容收集：** 「在這些目錄中搜尋身份驗證模式並回傳摘要」
- **程式碼分析：** 「閱讀這些檔案並識別與安全相關的 API、憑證和信任邊界」
- **驗證：** 將 `verification-checklist.md` 的內容和輸出資料夾路徑交給驗證子代理程式。它讀取檔案並回傳通過/失敗結果。母代理程式修正任何失敗項。
- **JSON 產生 (例外)：** 對於大型儲存庫，委派寫入具備確切檔案路徑和預先計算資料的 `threat-inventory.json`

**絕不委派：** 「撰寫 0.1-architecture.md」、「產生 STRIDE 分析」、「執行威脅模型分析」或任何會導致子代理程式獨立產生報告檔案的提示。

---

## 驗證檢查清單 (最終步驟)

完整的驗證檢查清單位於 `verification-checklist.md`。它包含 9 個階段：

> **權威層級：** `orchestrator.md` 定義了撰寫規則 (撰寫報告時該做什麼)。`verification-checklist.md` 定義了檢查規則 (撰寫後要驗證什麼)。出於可見性考慮，某些規則在兩個檔案中都會出現 — 如果它們發生衝突，則以 `orchestrator.md` 的規則優先用於撰寫決策，而以 `verification-checklist.md` 優先用於通過/失敗標準。對於所有結構、圖表和一致性檢查的完整清單，請始終參考 `verification-checklist.md` — 它是品質閘口的唯一真理來源。

0. **階段 0 — 常見偏差掃描**：具有 錯誤→正確 範例的已知偏差模式
1. **階段 1 — 每個檔案的結構檢查**：區段順序、必要內容、格式化
2. **階段 2 — 圖表渲染檢查**：Mermaid 初始化區塊、類別定義 (classDef)、樣式、語法
3. **階段 3 — 跨檔案一致性檢查**：元件覆蓋率、資料流對應、威脅與發現事項的可追蹤性
4. **階段 4 — 證據品質檢查**：證據的具體性、在標記前驗證的合規性
5. **階段 5 — JSON 結構定義驗證**：結構定義欄位、陣列完整性、指標一致性
6. **階段 6 — 確定性身份**：元件 ID 穩定性、邊界命名、資料流 ID 一致性
7. **階段 7 — 基於證據的先決條件**：先決條件部署證據、覆蓋率完整性
8. **階段 8 — 比較 HTML** (僅限增量)：HTML 結構、變更註解、CSS

**內嵌快速檢查：** `verification-checklist.md` 也包含內嵌快速檢查，必須在撰寫每個檔案後立即執行 (在步驟 10 之前)。這些檢查可捕捉內容仍處於活動背景時的錯誤。

**兩階段用法：**
- **Before writing (Workflow pre-work):** Scan Phase 1 and Phase 2 to internalize structural and diagram quality gates. This prevents rework.
- **After writing (Step 10):** Run ALL Phase 0–4 checks comprehensively against the completed output. Phase 0 is the most critical — it catches the deviations that persist across runs. Fix any failures before finalizing.

**Delegation:** Hand the verification sub-agent the content of `verification-checklist.md` and the output folder. It will run all checks and produce a PASS/FAIL summary. Fix any failures before finalizing.

---

## 開始分析

如果未提供資料夾路徑，則從根目錄分析整個儲存庫。
