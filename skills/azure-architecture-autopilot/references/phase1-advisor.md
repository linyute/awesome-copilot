# 第 1 階段：架構建議代理 (Architecture Advisor)

此檔案包含第 1 階段的詳細說明。當從 SKILL.md 進入第 1 階段時，請閱讀並遵循此檔案。
適用於路徑 A (新設計) 與路徑 B (第 0 階段掃描後的修改)。

---

## 當從路徑 B 進入時 (在現有資源分析之後)

在第 0 階段掃描出的目前架構圖 (00_arch_current.html) 已存在。
在這種情況下，請跳過 1-1 中的專案名稱/服務列表確認，直接進入修改對話：

1. 「您想要在此處進行什麼變更？」— 使用者的自然語言請求
2. 套用差異確認規則 (Delta Confirmation Rule) — 針對變更部分，確認尚未確定的必要欄位
3. 事實核實 (Fact-check) — 交叉驗證 MS 文件
4. 產生更新後的架構圖 (01_arch_diagram_draft.html)
5. 確認後過渡到第 2 階段

---

**此階段的目標**：準確識別使用者的需求，並共同將架構定案。

### 1-1. 架構圖準備 — 收集必要資訊

在繪製架構圖之前，請持續向使用者提問，直到確認下列所有項目。
**請務必在確認所有項目後才產生架構圖。**

**首先，確認專案名稱：**

透過 `ask_user` 提供一個推論出的預設值作為選項。若使用者直接按 Enter，則套用該預設值；他們也可以輸入自訂名稱。
預設值是根據使用者的請求推論而來 (例如：RAG 聊天機器人 → `rag-chatbot`, 資料平台 → `data-platform`)。

```
ask_user({
  question: "請選擇專案名稱。這將用於 Bicep 資料夾名稱、架構圖路徑以及部署名稱。",
  choices: ["<推論出的預設值>", "azure-project"]
})
```
專案名稱將用於 Bicep 輸出資料夾名稱、架構圖儲存路徑、部署名稱等。

**🔹 與專案名稱問題同步進行的平行預載 (必要)：**

在使用 `ask_user` 詢問專案名稱時，會有等待使用者回應的閒置時間。
請利用這段時間**平行預載後續問題與 Bicep 產生所需的資訊**。

**與 ask_user 同時呼叫的工具：**

```
// 在單一回應中同時呼叫 ask_user 與下列工具
[1] ask_user — 專案名稱問題

[2] view — 載入參考檔案 (預先獲取穩定 (Stable) 資訊)
    - references/service-gotchas.md
    - references/ai-data.md
    - references/azure-dynamic-sources.md
    - references/architecture-guidance-sources.md

[3] web_fetch — 預先擷取架構指引 (當識別出工作負載類型時)
    - 根據 architecture-guidance-sources.md 中的決策規則，執行最多 2 次針對性擷取

[4] web_fetch — 為使用者提到的服務擷取 MS 文件 (預先獲取動態 (Dynamic) 資訊)
    - 例如：Foundry → API 版本、模型可用性頁面
    - 例如：AI Search → SKU 列表頁面
    - 使用 azure-dynamic-sources.md 中的 URL 模式
```

**好處**：當使用者輸入專案名稱時，所有資訊都已載入完成，
因此可以在確認專案名稱後，立即呈現帶有精確選項的 SKU/區域問題。
與序列執行相比，等待時間大幅縮短。

**注意事項：**
- 預載目標僅限於與專案名稱無關的資訊 (不依賴於名稱的項目)
- 僅針對使用者初次請求中提到的服務執行 web_fetch (不靠猜測)
- 此時「不」執行 Azure CLI 檢查 (`az account show`) — 在架構定案時才預載

**🔹 利用架構指引 (調整問題深度)：**

從預載期間擷取的架構指引文件中擷取**設計決策點**，
並自然地將其融入後續向使用者的提問中。

**目的**：不只是問 SKU/區域等規格問題，
而是將官方架構指引建議的**設計決策點**反映在問題中。

**範例 — 當使用者要求「RAG 聊天機器人」時：**
- 擷取基準 Foundry 聊天架構 (A6)
- 從文件中擷取建議的設計決策點：
  → 網路隔離層級 (全私人 vs 混合？)
  → 身分驗證方法 (受控識別 vs API 金鑰？)
  → 資料擷取策略 (推送 vs 提取式索引？)
  → 監控範圍 (是否需要 Application Insights？)
- 將這些點自然地包含在使用者問題中

**注意事項：**
- 從架構指引中擷取的是**「要問的點」**，而非「答案」
- SKU/API 版本/區域等部署規格仍僅透過 `azure-dynamic-sources.md` 確定
- 擷取預算：最多 2 份文件。不進行全面遍歷

**必要確認項目：**
- [ ] 專案名稱 (預設：`azure-project`)
- [ ] 服務列表 (要使用的 Azure 服務)
- [ ] 每項服務的 SKU/層級
- [ ] 網路連接方式 (是否使用私人端點)
- [ ] 部署位置 (區域)

**提問原則：**
- 不要重複詢問使用者已提到的資訊
- 不要詢問未直接在架構圖中呈現的詳細實作細節 (如索引方法、查詢量等)
- 一次不要問太多問題；請簡潔地詢問關鍵的未定項目
- 對於有顯著預設值的項目 (例如：啟用 PE)，可以先假設並僅作確認。但「位置」務必與使用者確認
- **詢問 SKU、模型或服務選項時，請顯示從 MS 文件核實過的所有可用選項，並同時提供 MS 文件 URL。** 這能讓使用者參考並自行判斷。請勿僅顯示部分選項或隨意過濾

**🔹 VM/資源 SKU 選取 — 必須預先檢查區域可用性：**

在向使用者詢問 VM 或其他資源的 SKU **之前**，您「必須」先查詢該 SKU 在目標區域是否實際可用。
若某個 SKU 在特定區域因容量限制而被阻擋，部署將會失敗。

**VM SKU 核實方法：**
```powershell
# 僅查詢目標區域中可用且無限制的 VM SKU
az vm list-skus --location "<位置>" --size Standard_D2 --resource-type virtualMachines `
  --query "[?restrictions==``[]``].name" -o tsv
```

**原則：**
- 不要將未經核實的 SKU 包含在選項中
- 不要憑記憶推薦「常用的 SKU」 — 務必透過 az CLI 或 MS 文件進行核實
- 在 `ask_user` 選項中僅包含已核實的 SKU
- 即使是使用者提供的 SKU，在繼續執行前也需核實其可用性

**此原則同樣適用於所有受容量限制的資源 (如 Fabric 容量等)，而不僅限於 VM。**

**🔹 服務選項探索原則 — 禁止「憑記憶列出」：**

當使用者詢問服務類別 (例如：「有哪些 Spark 選項？」、「訊息佇列有哪些選擇？」)，或當您需要為特定功能探索服務時：

**絕不可執行下列操作：**
- 直接憑記憶擷取僅 2-3 個服務的 URL 並列出
- 斷定地表示「在 Azure 中，X 具有 A 和 B」

**務必執行下列操作：**
1. **透過 web_search 探索完整類別** — 執行類別級別的搜尋，如 `"Azure managed Spark options site:learn.microsoft.com"`，以先發現存在哪些服務
2. **與 v1 範圍進行交叉比對** — 無論搜尋結果如何，請檢查 v1 範圍服務 (Foundry, Fabric, AI Search, ADLS Gen2 等) 是否屬於該類別。例如：「Spark」 → Microsoft Fabric 的資料工程 (Data Engineering) 工作負載也提供 Spark
3. **針對發現的選項進行擷取** — 擷取搜尋發現的服務之 MS 文件，以收集準確的比較資訊
4. **向使用者呈現所有選項** — 以綜合比較表的形式呈現所有發現的選項，不予遺漏

**範例 — 當被問到「有哪些 Spark 執行個體可用？」時：**
```
錯誤做法：僅擷取 Databricks URL + Synapse URL → 僅比較兩者
正確做法：web_search("Azure managed Spark options") → 發現 Databricks, Synapse, Fabric Spark, HDInsight
            → v1 範圍檢查：Fabric 屬於 v1 範圍且提供 Spark → 必須包含
            → 針對每項服務的 MS 文件執行針對性擷取 → 呈現完整的比較表
```

此原則不僅適用於服務類別探索，也適用於使用者要求「替代方案」、「其他選項」、「比較」等所有情況。

**🔹 ask_user 工具 — 強制使用：**

對於帶有選項的問題，您「必須」使用 `ask_user` 工具。它允許使用者使用方向鍵選取，亦可輸入自訂內容。

**ask_user 使用規則：**
- 具有 2 個或更多選項的問題**務必**使用 ask_user (不要以文字形式列出)
- **`choices` 務必以字串陣列形式傳遞 (`["A", "B"]`)** — 以字串形式 (`"A, B"`) 傳遞會導致錯誤
- 若有推薦選項，請將其置於首位，並在末尾附加 `(推薦)`
- 在選項中包含參考資訊 — 例如：`"Standard S1 - 推薦用於生產環境。參考：https://..."`
- **每次呼叫僅限 1 個問題** — 若有多個項目需要詢問，請依序為每個項目呼叫 ask_user
- 選項上限為 4 個。若有 5 個或更多，僅包含最常用的 3-4 個 (使用者仍可輸入自訂內容)
- 若需要多選，請將其拆分為多個問題

**需要使用 ask_user 的項目：**
- 部署位置 (區域) 選取
- SKU/層級選取
- 模型選取 (對話模型、嵌入模型等)
- 網路連接方式選取
- 訂閱選取 (第 1 階段 步驟 2)
- 資源群組選取 (第 1 階段 步驟 3)
- 任何其他需要使用者選擇的問題

**使用範例：**
```
// 專案名稱為自由格式輸入，不使用 ask_user (以文字詢問)
// SKU、區域等帶有定義選項的項目則使用 ask_user：

// 1. SKU 問題
ask_user({
  question: "請為 AI Search 選取 SKU。參考：https://learn.microsoft.com/zh-tw/azure/search/search-sku-tier",
  choices: [
    "Standard S1 - 推薦用於生產環境 (推薦)",
    "Basic - 用於開發/測試，最多 15 個索引",
    "Standard S2 - 高流量生產環境",
    "Free - 免費試用，50MB 儲存空間"
  ]
})

// 2. 區域問題 (個別呼叫 — 每次呼叫僅 1 個問題)
ask_user({
  question: "請選取部署的 Azure 區域。參考：https://learn.microsoft.com/zh-tw/azure/ai-services/openai/concepts/models",
  choices: [
    "Korea Central - 韓國區域，支援大多數服務 (推薦)",
    "East US - 美國東部，支援所有 AI 模型",
    "Japan East - 日本東部，離台灣較近"
  ]
})
```

> **注意**：上述範例中的 SKU 與區域數值僅供說明。實際提問時，請透過 web_fetch 查詢 MS 文件，根據最新資訊動態組成選項。請勿硬編碼。

**範例 — 當使用者輸入資訊不足時：**
```
使用者：「我想要建構一個 RAG 聊天機器人。在 Foundry 中使用 GPT 模型，並使用 AI Search。」

→ 已確認：Microsoft Foundry, Azure AI Search
→ 尚未確定：專案名稱、具體模型名稱、嵌入模型、網路 (PE?)、SKU、部署位置

代理首先透過 ask_user 確認專案名稱 (預設：rag-chatbot)。
接著透過 ask_user 工具為每個未定項目提供選項。
在選項中包含 MS 文件 URL，以便使用者直接參考。
```

**🚨🚨🚨 [強制關卡] 規格收集完成 → 必須產生架構圖 🚨🚨🚨**

**在所有確認項目填寫完畢後，您「必須」依序執行下列步驟。跳過任何步驟皆視為第 1 階段未完成。**

1. 根據確認的服務列表組成 **services JSON + connections JSON**
2. 使用內建架構圖引擎產生 **`<專案名稱>/01_arch_diagram_draft.html`**
3. 透過 `Start-Process` 自動在瀏覽器中開啟該檔案
4. 以下方的**回報格式**向使用者展示架構圖 — 務必包含**詳細組態表**
5. 詢問使用者：**「您想要變更或增加任何內容嗎？」**
6. 若使用者無須變更 → 進入第 2 階段過渡步驟 (包含後續步驟指引的 ask_user)

**絕不可執行下列操作：**
- ❌ 未產生架構圖便詢問「架構已確認。是否進入下一步？」
- ❌ 將架構圖產生延後至第 2 階段或更晚
- ❌ 表示「我稍後再建立架構圖」
- ❌ 僅憑規格收集完成就宣佈「架構已確認」
- ❌ 產生了架構圖但「未」顯示組態表
- ❌ 跳過「是否有要變更？」的問題直接跳到第 2 階段

**驗證條件**：若尚未產生 `01_arch_diagram_draft.html` 檔案，則不允許進入第 2 階段。

**架構圖完成後的回報格式 (所有章節皆為強制性)：**
```
## 架構圖

[互動式架構圖連結 — 已在瀏覽器中自動開啟]

### 已確認的組態

| 服務 | 類型 | SKU/層級 | 詳細資訊 |
|---------|------|----------|---------|
| [服務名稱] | [Azure 資源類型] | [SKU] | [關鍵組態：模型、容量等] |
| ... | ... | ... | ... |

**網路連接**：[VNet + 私人端點 / 公用 / 等]
**位置**：[確認的區域]
```

**顯示報告後，立即使用 `ask_user` 提供選項：**
```
ask_user({
  question: "架構圖與組態已就緒。您想要執行什麼操作？",
  choices: [
    "看起來沒問題 — 進入 Bicep 程式碼產生階段 (推薦)",
    "我想要修改架構",
    "加入更多服務"
  ]
})
```

- 若選取「進入下一階段」 → 過渡至第 2 階段 (收集訂閱/RG 資訊)
- 若選取「修改」或「加入」 → 套用變更，重新產生架構圖，再次顯示報告

**🚨 組態表並非選配項。** 使用者需要視覺化地核實已確認的內容。沒有表格，使用者將無法驗證架構。

### 1-2. 互動式 HTML 架構圖產生

使用隨附在技能中的**架構圖引擎** (Python 腳本) 建立互動式 HTML 架構圖。
無須執行 `pip install`，因為腳本直接位於 `scripts/` 資料夾中，不需要網路連線或套件安裝。
內建 605 個以上的 Azure 官方圖示。

**架構圖檔案命名規範：**

所有架構圖皆產生於 Bicep 專案資料夾 (`<專案名稱>/`) 內。
檔案按階段加上數字前綴進行系統化管理，且絕不會覆蓋前一階段的檔案。

| 階段 | 檔案名稱 | 產生時機 |
|-------|-----------|----------------|
| 第 1 階段 設計草案 | `01_arch_diagram_draft.html` | 當架構設計確認時 |
| 第 4 階段 What-if 預覽 | `02_arch_diagram_preview.html` | 在 What-if 驗證之後 |
| 第 4 階段 部署結果 | `03_arch_diagram_result.html` | 在實際部署完成後 |

**內建模組路徑發現 + Python 路徑發現：**

**🚨 Python 路徑與內建模組路徑會在第 1 階段預載期間核實一次，並在後續的所有架構圖產生中重複使用。請勿每次都重新發現。**

```powershell
# ─── 步驟 1：Python 路徑發現 ───
# ⚠️ Get-Command python 可能會選中 Windows Store 的別名，因此優先執行檔案系統發現
$PythonCmd = $null

# 優先順序 1：直接發現實際安裝路徑 (最可靠)
$PythonExe = Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\Python" -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notlike '*WindowsApps*' } |
  Select-Object -First 1 -ExpandProperty FullName
if ($PythonExe) { $PythonCmd = $PythonExe }

# 優先順序 2：Program Files 發現
if (-not $PythonCmd) {
  $PythonExe = Get-ChildItem -Path "$env:ProgramFiles\Python*", "$env:ProgramFiles(x86)\Python*" -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
  if ($PythonExe) { $PythonCmd = $PythonExe }
}

# 優先順序 3：在 PATH 中尋找 (僅限非 Windows Store 別名)
if (-not $PythonCmd) {
  foreach ($cmd in @('python3', 'py')) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found -and $found.Source -notlike '*WindowsApps*') { $PythonCmd = $cmd; break }
  }
}

if (-not $PythonCmd) {
  Write-Host ""
  Write-Host "未安裝 Python 或在 PATH 中找不到。" -ForegroundColor Red
  Write-Host ""
  Write-Host "請使用下列其中一種方法安裝：" -ForegroundColor Yellow
  Write-Host "  1. winget install Python.Python.3.12"
  Write-Host "  2. 從 https://www.python.org/downloads/ 下載"
  Write-Host "  3. 在 Microsoft Store 搜尋 'Python 3.12' 並安裝"
  Write-Host ""
  Write-Host "安裝完成後，請重啟終端機並重試。"
  return
}

# ─── 步驟 2：內建腳本路徑發現 (無須 pip install) ───
# 優先順序 1：專案本地技能資料夾
$ScriptsDir = Get-ChildItem -Path ".github\skills\azure-architecture-autopilot" -Filter "cli.py" -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.Directory.Name -eq 'scripts' } |
  Select-Object -First 1 -ExpandProperty DirectoryName
# 優先順序 2：全域技能資料夾
if (-not $ScriptsDir) {
  $ScriptsDir = Get-ChildItem -Path "$env:USERPROFILE\.copilot\skills\azure-architecture-autopilot" -Filter "cli.py" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.Directory.Name -eq 'scripts' } |
    Select-Object -First 1 -ExpandProperty DirectoryName
}

# ─── 步驟 3：架構圖產生 (CLI 方法 — 直接執行腳本) ───
$OutputFile = "<專案名稱>\01_arch_diagram_draft.html"

& $PythonCmd "$ScriptsDir\cli.py" `
  --services '<服務_JSON>' `
  --connections '<連線_JSON>' `
  --title "架構標題" `
  --vnet-info "10.0.0.0/16 | pe-subnet: 10.0.1.0/24" `
  --output $OutputFile

# 產生後自動在瀏覽器中開啟
Start-Process $OutputFile
```

**Python API 方法亦可用 (替代方案)：**

當 JSON 極大時，您可以直接呼叫 Python API 以避免 CLI 引數長度限制。
將 scripts 資料夾加入 `sys.path` 以匯入內建模組：

```python
import sys, os
# 將 scripts 資料夾加入 Python 路徑 (無須 pip install 即可使用內建模組)
scripts_dir = r"<scripts 資料夾的絕對路徑>"  # 步驟 2 中找到的 $ScriptsDir 數值
sys.path.insert(0, scripts_dir)

from generator import generate_diagram

services = [...]   # 服務 JSON
connections = [...] # 連線 JSON

html = generate_diagram(
    services=services,
    connections=connections,
    title="架構標題",
    vnet_info="10.0.0.0/16 | pe-subnet: 10.0.1.0/24",
    hierarchy=None  # 僅用於多個訂閱/資源群組
)

with open("<專案名稱>/01_arch_diagram_draft.html", "w", encoding="utf-8") as f:
    f.write(html)
```

**🔹 CLI 與 Python API 選取標準：**

| 情境 | 方法 | 理由 |
|----------|--------|--------|
| 10 個或更少服務 | CLI (`python scripts/cli.py`) | 簡單且快速 |
| 超過 10 個服務或使用階層 | Python API (加入 sys.path) | 避免 CLI 引數長度限制 |
| 多訂閱/資源群組架構圖 | Python API + `hierarchy` 參數 | 呈現階層式結構 |

**支援服務類型的完整清單：**

可在技能內建的 `references/` 參考檔案中找到。
支援的服務類型數值列於下方的「服務 JSON 格式」章節。

> **架構圖產生順序**：(1) 核實 Python 路徑 → (2) 核實內建模組路徑 → (3) 組成服務/連線 JSON → (4) 執行。若未安裝 Python，請在組成 JSON 前引導使用者安裝。這可避免在發現缺少 Python 前浪費時間建構 JSON。

> **🚨 自動開啟架構圖 (無例外)**：當使用內建架構圖引擎產生 HTML 檔案時，「務必」在任何情況下都在瀏覽器中開啟它。無一例外，每當產生或重新產生架構圖時，請執行 `Start-Process` 指令。架構圖產生與瀏覽器開啟必須始終在單一 PowerShell 指令區塊中共同執行。
>
> **適用時機 (包含但不限於下列情況)：**
> - 第 1 階段 設計草案 (`01_arch_diagram_draft.html`)
> - 差異確認後的架構圖重新產生
> - 第 4 階段 What-if 預覽 (`02_arch_diagram_preview.html`)
> - 第 4 階段 部署結果 (`03_arch_diagram_result.html`)
> - 部署後的架構變更 (`04_arch_diagram_update_draft.html`)
> - 任何因故重新產生架構圖的情況

**服務 (services) JSON 格式：**

根據使用者確認的服務列表動態組成。以下是 JSON 結構說明。

```json
[
  {"id": "uniqueID", "name": "服務顯示名稱", "type": "圖示類型", "sku": "SKU", "private": true/false,
   "details": ["詳細資訊第 1 行", "詳細資訊第 2 行"]}
]
```

| 欄位 | 必要 | 類型 | 說明 |
|-------|----------|------|-------------|
| `id` | 是 | 字串 | 唯一識別碼 (kebab-case) |
| `name` | 是 | 字串 | 架構圖上顯示的名稱 |
| `type` | 是 | 字串 | 服務類型 (從下方列表中選取) |
| `sku` | | 字串 | SKU/層級資訊 |
| `private` | | 布林值 | 是否連接私人端點 (預設值：false) |
| `details` | | 字串陣列 | 側邊欄顯示的額外資訊 |
| `subscription` | | 字串 | 訂閱名稱 (使用階層時必要) |
| `resourceGroup` | | 字串 | 資源群組名稱 (使用階層時必要) |

**服務類型 — 權威參考：**

> ⚠️ **關鍵提醒**：務必使用下表中的**權威類型**。請勿使用 Azure ARM 資源名稱 (例如：`private_endpoints`, `storage_accounts`, `data_factories`)。產生器會正規化常見變體，但使用權威類型可確保正確渲染圖示、偵測 PE 並進行顏色編碼。

| 類別 | 權威類型 | Azure 資源 | 圖示 |
|----------|---------------|----------------|------|
| **AI** | `ai_foundry` | Microsoft.CognitiveServices/accounts (kind: AIServices) | AI Foundry |
| | `openai` | Microsoft.CognitiveServices/accounts (kind: OpenAI) | Azure OpenAI |
| | `ai_hub` | Foundry 專案 | AI Studio |
| | `search` | Microsoft.Search/searchServices | 認知搜尋 (Cognitive Search) |
| | `document_intelligence` | Microsoft.CognitiveServices/accounts (kind: FormRecognizer) | 表單辨識器 (Form Recognizer) |
| | `aml` | Microsoft.MachineLearningServices/workspaces | 機器學習 (Machine Learning) |
| **資料** | `fabric` | Microsoft.Fabric/capacities | Microsoft Fabric |
| | `adf` | Microsoft.DataFactory/factories | 資料處理中心 (Data Factory) |
| | `storage` | Microsoft.Storage/storageAccounts | 儲存體帳號 |
| | `adls` | ADLS Gen2 (具 HNS 的儲存體) | 資料湖 (Data Lake) |
| | `cosmos_db` | Microsoft.DocumentDB/databaseAccounts | Cosmos DB |
| | `sql_database` | Microsoft.Sql/servers/databases | SQL 資料庫 |
| | `sql_server` | Microsoft.Sql/servers | SQL 伺服器 |
| | `databricks` | Microsoft.Databricks/workspaces | Databricks |
| | `synapse` | Microsoft.Synapse/workspaces | Synapse Analytics |
| | `redis` | Microsoft.Cache/redis | Redis 快取 |
| | `stream_analytics` | Microsoft.StreamAnalytics/streamingjobs | 串流分析 (Stream Analytics) |
| | `postgresql` | Microsoft.DBforPostgreSQL/flexibleServers | PostgreSQL |
| | `mysql` | Microsoft.DBforMySQL/flexibleServers | MySQL |
| **安全性** | `keyvault` | Microsoft.KeyVault/vaults | Key Vault |
| | `sentinel` | Microsoft.SecurityInsights | Sentinel |
| **運算** | `appservice` | Microsoft.Web/sites | App Service |
| | `function_app` | Microsoft.Web/sites (kind: functionapp) | Function App |
| | `vm` | Microsoft.Compute/virtualMachines | 虛擬機器 |
| | `aks` | Microsoft.ContainerService/managedClusters | AKS |
| | `acr` | Microsoft.ContainerRegistry/registries | 容器登錄 |
| | `container_apps` | Microsoft.App/containerApps | Container Apps |
| | `static_web_app` | Microsoft.Web/staticSites | 靜態網頁應用程式 |
| | `spring_apps` | Microsoft.AppPlatform/Spring | Spring Apps |
| **網路** | `pe` | Microsoft.Network/privateEndpoints | 私人端點 (Private Endpoint) |
| | `vnet` | Microsoft.Network/virtualNetworks | VNet |
| | `nsg` | Microsoft.Network/networkSecurityGroups | NSG |
| | `firewall` | Microsoft.Network/azureFirewalls | 防火牆 |
| | `bastion` | Microsoft.Network/bastionHosts | Bastion |
| | `app_gateway` | Microsoft.Network/applicationGateways | 應用程式閘道 |
| | `front_door` | Microsoft.Cdn/profiles (Front Door) | Front Door |
| | `vpn` | Microsoft.Network/virtualNetworkGateways | VPN 閘道 |
| | `load_balancer` | Microsoft.Network/loadBalancers | 負載平衡器 |
| | `nat_gateway` | Microsoft.Network/natGateways | NAT 閘道 |
| | `cdn` | Microsoft.Cdn/profiles | CDN |
| **物聯網** | `iot_hub` | Microsoft.Devices/IotHubs | IoT Hub |
| | `digital_twins` | Microsoft.DigitalTwins/digitalTwinsInstances | Digital Twins |
| **整合** | `event_hub` | Microsoft.EventHub/namespaces | 事件中心 (Event Hub) |
| | `event_grid` | Microsoft.EventGrid/topics | 事件方格 (Event Grid) |
| | `apim` | Microsoft.ApiManagement/service | API 管理 |
| | `service_bus` | Microsoft.ServiceBus/namespaces | 服務匯流排 (Service Bus) |
| | `logic_apps` | Microsoft.Logic/workflows | Logic Apps |
| **監控** | `log_analytics` | Microsoft.OperationalInsights/workspaces | Log Analytics |
| | `appinsights` | Microsoft.Insights/components | App Insights |
| | `monitor` | Azure 監視器 | Monitor |
| **其他** | `jumpbox`, `user`, `devops` | — | 特殊類型 |

**使用私人端點時 — 必須加入 PE 節點：**

若架構包含私人端點，則「必須」在服務 JSON 中為每項服務加入一個 PE 節點，且連線中也必須包含 PE 連結，它們才會出現在架構圖中。

```json
// 為每項服務加入對應的 PE 節點
{"id": "pe_服務ID", "name": "PE: 服務名稱", "type": "pe", "details": ["groupId: 對應的 GroupID"]}

// 在連線中加入「服務 → PE」的連線
{"from": "服務ID", "to": "pe_服務ID", "label": "", "type": "private"}
```

**🚨🚨🚨 PE 連線與業務邏輯連線是分開的 — 兩者皆必須包含 🚨🚨🚨**

PE 連線 (`"type": "private"`) 代表網路隔離。但單靠此連線「無法」在圖中呈現服務間實際的**資料流/API 呼叫**。

**務必包含下列兩類連線：**

1. **業務邏輯連線** — 服務間實際的資料流 (類型：api, data, security)
2. **PE 連線** — 服務 ↔ PE 之間的網路隔離 (類型：private)

```json
// ✅ 正確範例 — Function App → Foundry
// 1) 業務邏輯：Function App 呼叫 Foundry 進行聊天/嵌入
{"from": "func_app", "to": "foundry", "label": "RAG 聊天 + 嵌入", "type": "api"}
// 2) PE 連線：Foundry 的私人端點
{"from": "foundry", "to": "pe_foundry", "label": "", "type": "private"}

// ❌ 錯誤範例 — 僅有 PE 連線，無業務邏輯連線
{"from": "foundry", "to": "pe_foundry", "label": "", "type": "private"}
// → 架構圖中 Function App 與 Foundry 之間無連線，導致看不到架構流程
```

**絕不可執行下列操作：**
- 僅建立 PE 連線而省略業務邏輯連線
- 將業務邏輯連線的 `from`/`to` 連接至 PE 節點 (應使用**實際的服務 ID**，而非 PE)
- 假設「PE 在那裡，連線就應該會出現」

各項服務的 PE groupId 不同。請參閱 `references/service-gotchas.md` 中的 PE groupId 與 DNS 區域對照表。

> **服務命名規範**：務必使用最新的 Azure 官方名稱。若不確定，請向 MS 文件核實。
> 各服務的資源類型與關鍵屬性，請參閱 `references/ai-data.md`。

**連線 (connections) JSON 格式：**
```json
[
  {"from": "服務A_ID", "to": "服務B_ID", "label": "連線說明", "type": "api|data|security|private"}
]
```

**連線類型 (Connection Types)：**

| 類型 (type) | 顏色 | 樣式 | 用途 |
|------|-------|-------|---------|
| `api` | 藍色 | 實線 | API 呼叫、查詢 |
| `data` | 綠色 | 實線 | 資料流、編製索引 |
| `security` | 橘色 | 虛線 | 機密、驗證 |
| `private` | 紫色 | 虛線 | 私人端點連線 |
| `network` | 灰色 | 實線 | 網路路由 |
| `default` | 灰色 | 實線 | 其他 |

**🔹 架構圖多語言原則：**
- 服務中的 `name` (名稱)、`details` (詳細資訊) 以及連線中的 `label` (標籤) 使用**使用者的語言**撰寫
- 範例：`"label": "RAG 搜尋"`, `"label": "資料擷取"`
- Azure 官方服務名稱 (Microsoft Foundry, AI Search 等) 一律使用英文，不論語言為何

**🔹 VNet 節點 — 請勿加入服務 JSON：**
- 當 PE 存在時，架構圖會自動將 VNet 顯示為**紫色虛線邊界**
- 在服務 JSON 中新增獨立的 VNet 節點會導致與邊界線重複，造成混淆
- 透過側邊欄的 VNet 邊界標籤，足以傳達 VNet 資訊 (CIDR、子網路)

向使用者提供產生的 HTML 檔案之完整路徑。

### 1-3. 透過對話定案架構

架構是透過與使用者的對話逐步定案的。當使用者要求變更時，不要從頭詢問所有內容；應**僅根據目前的已確認狀態反映所要求的變更**，並重新產生架構圖。

**⚠️ 差異確認規則 (Delta Confirmation Rule) — 服務新增/變更時的必要驗證：**

服務新增或變更並非「簡單更新」 — 這是一個**會重新開啟該服務未定必要欄位**的事件。

**流程：**
1. 比較目前已確認狀態與新請求的差異
2. 識別新加入服務的必要欄位 (參考 `domain-packs` 或 MS 文件)
3. 從 MS 文件擷取該服務的區域可用性/選項
4. 若有任何必要欄位尚未確定，**先透過 ask_user 詢問使用者**
5. **務必在確認完成後才重新產生架構圖**

**絕不可執行下列操作：**
- 在必要欄位仍未確定時就完成架構圖更新
- 隨意加入使用者未提到的子元件/工作負載 (例如：使用者要求 Fabric，卻自動加入 OneLake 與資料管線)
- 模糊地假設 SKU/模型 (例如在未確認的情況下假設為「F SKU」)

**不要重複詢問已確認服務的設定。** 僅需針對新加入/變更的服務確認未定項目。

---

**🚨🚨🚨 [最優先原則] 設計階段即時執行事實核實 🚨🚨🚨**

**第 1 階段的目的是確認一個「可行的架構」。**
**無論使用者提出什麼要求，在反映到架構圖之前，您「必須」透過 web_fetch 直接查詢 MS 文件，執行事實核實 (Fact-check) 以確認是否實際可行。**

**設計方向 vs. 部署規格 — 分離的資訊路徑：**

| 決策類型 | 參考路徑 | 範例 |
|--------------|----------------|----------|
| **設計方向** (架構模式、最佳實務、服務組合) | `references/architecture-guidance-sources.md` → 針對性擷取 | 「推薦的 RAG 結構是什麼？」、「企業基準？」 |
| **部署規格** (API 版本、SKU、區域、模型、PE 對照) | `references/azure-dynamic-sources.md` → MS 文件擷取 | 「API 版本是多少？」、「此模型在韓國中部可用嗎？」 |

- **設計方向源自架構指引，實際部署數值則源自動態來源。** 請勿混淆這兩條路徑。
- 請勿使用架構指引文件的內容來判斷 SKU/API 版本/區域。
- **請勿針對每個請求都遍歷所有架構中心子文件。** 根據觸發條件，執行最多 2 份相關文件的針對性擷取。
- 有關觸發條件/擷取預算/按問題類型劃分的決策規則，請參閱 `architecture-guidance-sources.md`。

**此原則無一例外地適用於所有請求：**
- 模型新增/變更 → 在 MS 文件中核實該模型是否存在，以及是否可部署於目標區域
- 服務新增/變更 → 在 MS 文件中核實該服務在目標區域是否可用
- SKU 變更 → 在 MS 文件中核實該 SKU 是否有效，以及是否支援所需功能
- 功能請求 → 在 MS 文件中核實該功能是否實際獲得支援
- 服務組合 → 在 MS 文件中核實服務間的整合是否可行
- **任何其他請求** → 透過 MS 文件進行事實核實

**MS 文件核實結果：**
- **可行** → 反映至架構圖
- **不可行** → 立即向使用者說明原因並建議可用的替代方案

**事實核實流程 — 必須執行交叉驗證：**

對於使用者的請求，不要僅查詢一次就結束。
**必須始終執行使用其他 MS 文件頁面/來源的交叉驗證。**

> **GHCP 環境限制**：子代理 (explore/task/general-purpose) 沒有 `web_fetch`/`web_search` 工具。
> 因此，需要查詢 MS 文件的核實工作 (如 API 版本核實、模型可用性檢查等) 必須**由主代理直接執行**。

```
[第 1 次核實] 主代理直接透過 web_fetch 查詢 MS 文件 (主頁面)
    ↓
[第 2 次核實] 主代理另外透過 web_fetch 擷取其他/相關的 MS 文件頁面進行交叉核對
    - 例如：模型可用性 → 第 1 次：模型頁面 / 第 2 次：區域可用性或定價頁面
    - 例如：API 版本 → 第 1 次：Bicep 參考頁面 / 第 2 次：REST API 參考頁面
    - 比較第 1 次與第 2 次結果，並標記任何不一致之處
    ↓
[彙整結果] 若兩次核實結果相符，則回應使用者
    - 若有不一致：透過額外查詢解決，或誠實告知使用者不確定的部分
```

**事實核實品質標準 — 必須透徹，不可草率：**
- 擷取 MS 文件頁面時，**務必無遺漏地檢查所有相關章節、標籤分頁與條件**
- 檢查模型可用性時：檢查 **所有部署類型**，包括 Global Standard, Standard, Provisioned, Data Zone 等。不可僅因其中一種部署類型不支援就斷定為「不支援」
- 檢查 SKU 時：**全面**核實該 SKU 支援的功能清單
- 若頁面內容過大，請**多次**擷取相關部分以確保準確性
- 若不確定，請查詢更多頁面。**絕不可憑猜測回答**

**絕不可執行下列操作：**
- 未經核實即加入架構圖
- 以「我會在產生 Bicep 時檢查」或「會在部署時驗證」為由延後核實
- 僅憑記憶回答「這應該可行」 — **務必直接查詢 MS 文件**
- 擷取了 MS 文件但僅閱讀部分內容就草率下結論
- 僅憑單次查詢即定案 — **務必使用另一個來源進行交叉驗證**

**🚫 子代理 (Sub-Agent) 使用規則：**

**GHCP 中的子代理 = `task` 工具：**
- `agent_type: "explore"` — 唯讀任務，如程式碼庫探索、檔案搜尋 (**不支援 web_fetch/web_search**)
- `agent_type: "task"` — 指令執行，如 az CLI, bicep build
- `agent_type: "general-purpose"` — 高階任務，如複雜的 Bicep 產生

> **⚠️ 子代理工具限制**：所有子代理 (explore/task/general-purpose) 皆「無法」使用 `web_fetch` 或 `web_search`。
> 需要查詢 MS 文件、核實 API 版本、檢查模型可用性等事實核實工作，務必由**主代理直接執行**。

**前景 vs 背景執行決策標準：**
- **若在進入下一步前需要結果 → `mode: "sync"` (預設值)**
  - 例如：查詢 SKU 列表後提供選項給使用者、核實模型可用性後反映至架構圖
  - 在此情況下於背景執行會讓使用者在等待結果時無事可做
- **若在等待結果期間有其他獨立工作可進行 → `mode: "background"`**
  - 例如：同時 web_fetch 多個 MS 文件頁面進行交叉驗證

**大多數事實核實應以前景模式 (`mode: "sync"`) 執行**，因為沒有結果就無法提出下一個問題。

**如何平行執行交叉驗證：**
```
// 同時執行第 1 次與第 2 次核實 (由主代理直接執行)
[同時] 透過 web_fetch 直接查詢主要 MS 文件頁面 (第 1 次)
[同時] 另外透過 web_fetch 查詢相關 MS 文件頁面 (第 2 次)
// 比較兩者結果以檢查是否有不一致
// 例如：模型可用性 → 平行擷取模型頁面 + 區域可用性頁面
```

**絕不可執行下列操作：**
- 在需要結果時卻以背景模式執行，導致在等待期間無所事事
- 將需要 web_fetch/web_search 的任務委派給子代理 (主代理必須直接執行)
- 嘗試直接讀取子代理內部的檔案

---

**⚠️ 重要提醒：在使用者明確核准進入下一步之前，請勿執行任何 Shell 指令。**
然而，為了上述事實核實而執行的 MS 文件 web_fetch 是例外允許的。

一旦架構定案 (使用者表示對架構圖無須變更)，請詢問使用者是否進入下一步。

**🚨 進入第 2 階段的前提條件 — 詢問此問題前必須滿足下列所有條件：**

1. 已使用內建架構圖引擎**產生** `01_arch_diagram_draft.html`
2. 已在**瀏覽器中開啟**架構圖，並以帶有**組態表**的回報格式**向使用者展示**
3. 已詢問使用者**「您想要變更或增加任何內容嗎？」**，且獲得**無須變更**的回應，或已反映修改並獲得**最終確認**

**若未滿足上述任一條件，請勿進入第 2 階段。**
若架構圖尚未存在，**請立即產生** — 遵循 1-2 節的程序。
若尚未顯示組態表，**請在詢問變更前立即顯示**。

**遵循平行預載原則，在提出 ask_user 的同時執行 `az account list` 與 `az group list`，以便預先準備好訂閱/資源群組 (RG) 的選項。**

```
// 在同一回應中同時呼叫：
[1] ask_user — 「架構已確認！我們是否要進入下一步？」
[2] powershell — az account show 2>&1              (預先檢查登入狀態)
[3] powershell — az account list --output json      (預先準備訂閱選項)
[4] powershell — az group list --output json        (預先準備資源群組選項)
```

ask_user 顯示格式：
```
架構已確認！我們是否要進入下一步？

✅ 已確認的架構：[摘要]

將執行下列步驟：
1. [Bicep 程式碼產生] — AI 自動編寫 IaC 程式碼
2. [程式碼審查] — 自動化安全性/最佳實務審查
3. [Azure 部署] — 實際建立資源 (選用)

是否繼續？ (若您僅需要程式碼而不進行部署，請告訴我)
```

一旦使用者核准，請按下列順序收集資訊。
**由於 `az account show` + `az account list` + `az group list` 已在預載期間完成，您可以立即呈現訂閱/RG 選項。**

**步驟 1：Azure 登入核實**

`az account show` 的結果已在預載時取得。無須再次呼叫。

- 若已登入 → 進入步驟 2
- 若未登入 → 引導使用者：
  ```
  需要登入 Azure CLI。請在您的終端機中執行下列指令：
  az login
  完成後請告知我。
  ```

**步驟 2：訂閱選取**

`az account list` 的結果已在預載時取得。無須再次呼叫。

從查詢結果中提供最多 4 個訂閱作為 `ask_user` 選項。
若有 5 個或更多，則包含 3-4 個最常用的訂閱作為選項 (使用者亦可輸入自訂內容)。
使用者選取後，執行 `az account set --subscription "<ID>"`。

**步驟 3：資源群組確認**

`az group list` 的結果已在預載時取得。無須再次呼叫。

從列表中提供最多 4 個現有的資源群組作為 `ask_user` 選項。
若使用者選取現有群組，則直接使用；若他們輸入新名稱作為自訂內容，則在第 4 階段部署期間建立該群組。

**必要確認項目：**
- [ ] 服務列表與 SKU
- [ ] 網路連接方式 (私人端點使用情況)
- [ ] 訂閱 ID (在步驟 2 確認)
- [ ] 資源群組名稱 (在步驟 3 確認)
- [ ] 位置 (與使用者確認 — 且已透過 MS 文件核實各服務的區域可用性)

---

## 🚨 第 1 階段完成檢核表 — 進入第 2 階段前必須核實

在離開第 1 階段前，請核實**所有**下列項目。若有任一項未完成，請勿進入第 2 階段。

| # | 項目 | 核實方法 |
|---|------|---------------------|
| 1 | 所有必要規格已確認 | 專案名稱、服務、SKU、區域及網路連接方式皆已確認 |
| 2 | 事實核實已完成 | 已執行 MS 文件交叉驗證 |
| 3 | **架構圖已產生** | 已使用內建架構圖引擎產生 `01_arch_diagram_draft.html` 檔案 |
| 4 | **已顯示組態表** | 已在報告格式中向使用者顯示包含服務/類型/SKU/詳細資訊的詳細表格 |
| 5 | **使用者已審閱架構圖** | 已自動開啟瀏覽器 + 顯示報告格式 + 詢問「是否有要變更？」 |
| 6 | 使用者最終核准 | 使用者確認無變更，並選取「進入下一步」 |

**⚠️ 當項目 3-5 尚未完成時，請勿詢問項目 6。** 流程必須為：架構圖 → 表格 → 詢問變更 → 確認 → 下一步。

---

## 第 2 階段交付：Bicep 產生代理 (Bicep Generation Agent)

一旦使用者同意繼續，請閱讀 `references/bicep-generator.md` 說明並產生 Bicep 範本。
或者，亦可將此工作委派給獨立的子代理。

**敏感資訊處理原則 (絕不可違反)：**
- 絕不可在對話中詢問 VM 密碼、API 金鑰或其他敏感值，且絕不可將其儲存在參數檔案中
- 在程式碼審查期間，若在 `main.bicepparam` 中發現純文字形式的敏感值，請立即將其移除

**🔹 使用者輸入的敏感值 (如 VM 密碼) — 必須執行複雜度驗證：**

當使用者輸入 VM 管理員密碼或類似內容時，在發送至 Azure 之前，務必先驗證是否符合複雜度要求。
Azure VM 必須同時滿足下列所有條件：
- 12 個字元以上
- 包含下列 4 類中的至少 3 類：大寫字母、小寫字母、數字、特殊字元

**若驗證失敗**：請勿嘗試部署；立即要求使用者重新輸入：
> **⚠️ 密碼不符合 Azure 複雜度要求。** 密碼必須長度至少 12 個字元，並包含大寫字母、小寫字母、數字與特殊字元中的至少三類。

**絕不可執行下列操作：**
- 僅警告「可能不符合要求」但仍嘗試部署 — **務必阻擋**
- 直接發送至 Azure 而未進行複雜度驗證，導致部署失敗

**🚨 `@secure()` 參數與 `.bicepparam` 相容性原則：**

當 `.bicepparam` 檔案具有 `using './main.bicep'` 指令時，無法與 `az deployment group what-if/create` 同時使用額外的 `--parameters` 旗標。
因此，`@secure()` 參數處理遵循下列規則：

1. **`@secure()` 參數「務必」具有預設值** — 使用 `newGuid()`, `uniqueString()` 等 Bicep 函式
   ```bicep
   @secure()
   param sqlAdminPassword string = newGuid()  // 在部署時自動產生，如有需要可儲存在 Key Vault 中
   ```
2. **若有需要使用者指定的 `@secure()` 參數數值：**
   - 請勿使用 `.bicepparam` 檔案；改用 `--template-file` + `--parameters` 的組合
   - 或者另外產生一個 JSON 參數檔案 (`main.parameters.json`)
   ```powershell
   # 當無法使用 .bicepparam 時 — 以 JSON 參數檔案替代
   az deployment group what-if `
     --template-file main.bicep `
     --parameters main.parameters.json `
     --parameters sqlAdminPassword='使用者輸入的值'
   ```
3. **請勿在部署指令中同時使用 `.bicepparam` 與 `--parameters`**
   ```
   ❌ az deployment group create --parameters main.bicepparam --parameters key=value
   ✅ az deployment group create --parameters main.bicepparam
   ✅ az deployment group create --template-file main.bicep --parameters main.parameters.json --parameters key=value
   ```

**決策準則：**
- 所有 `@secure()` 參數皆有預設值 (newGuid 等) → 可使用 `.bicepparam`
- 有任何 `@secure()` 參數需要使用者輸入 → 使用 JSON 參數檔案而非 `.bicepparam`

**當 MS 文件擷取失敗時：**
- 若 web_fetch 因速率限制等原因失敗，務必通知使用者：
  ```
  ⚠️ MS 文件 API 版本查詢失敗。將使用最後已知的穩定版本進行產生。
  建議在部署前手動核實實際的最新版本。
  是否繼續？
  ```
- 未經使用者核准，請勿默默繼續使用硬編碼的版本

**Bicep 產生前的參考檔案：**
- `references/service-gotchas.md` — 必要屬性、常見錯誤、PE groupId/DNS 區域對照
- `references/ai-data.md` — AI/資料服務組態指南 (v1 領域)
- `references/azure-common-patterns.md` — PE/安全性/命名常用模式
- `references/azure-dynamic-sources.md` — MS 文件 URL 註冊表 (用於 API 版本擷取)
- 對於未涵蓋在上述檔案中的服務，請直接擷取 MS 文件以核實資源類型、屬性與 PE 對照

**輸出結構：**
```
<專案名稱>/
├── main.bicep              # 主要協調模組
├── main.bicepparam         # 參數 (環境特定數值)
└── modules/
    ├── network.bicep       # VNet, 子網路 (包含私人端點子網路)
    ├── ai.bicep            # AI 服務 (按使用者需求設定)
    ├── storage.bicep       # ADLS Gen2 (isHnsEnabled: true)
    ├── fabric.bicep        # Microsoft Fabric (如需要)
    ├── keyvault.bicep      # Key Vault
    └── private-endpoints.bicep  # 所有 PE + DNS 區域
```

**Bicep 強制原則：**
- 將所有資源名稱參數化 — `param openAiName string = 'oai-${uniqueString(resourceGroup().id)}'`
- 私人服務「務必」設定 `publicNetworkAccess: 'Disabled'`
- 在 pe-subnet 上設定 `privateEndpointNetworkPolicies: 'Disabled'`
- 私人 DNS 區域 + VNet 連結 + DNS 區域群組 — 三者皆為必要
- 使用 Microsoft Foundry 時，**務必一併建立 Foundry 專案 (`accounts/projects`)** — 否則入口網站將無法使用
- ADLS Gen2 務必設定 `isHnsEnabled: true` (省略此項會建立一般的 Blob 儲存體)
- 將機密儲存在 Key Vault 中，並透過 `@secure()` 參數引用
- 加入英文註釋說明各個區段的目的

產生完成後立即過渡到第 3 階段。

---

## 第 3 階段交付：Bicep 審查代理 (Bicep Review Agent)

根據 `references/bicep-reviewer.md` 說明執行審查。

**⚠️ 關鍵提醒：請勿僅憑視覺檢查就宣佈「通過」。您「必須」執行 `az bicep build` 以核實實際的編譯結果。**

```powershell
az bicep build --file main.bicep 2>&1
```

1. 編譯錯誤/警告 → 修正
2. 檢核表審查 → 修正
3. 重新編譯以確認
4. 回報結果 (包含編譯結果)

詳細的檢核表與修正程序請參閱 `references/bicep-reviewer.md`。

審查完成後，在過渡到第 4 階段前向使用者展示結果，且**必須指引使用者進行後續步驟。**

**🚨 第 3 階段完成時的必要回報格式：**

```
## Bicep 程式碼審查完成

[審查結果摘要 — 符合 bicep-reviewer.md 步驟 6 格式]

---

**下一步：第 4 階段 (Azure 部署)**

審查已完成。將執行下列步驟：
1. **What-if 驗證** — 在不進行實際變更的情況下，預覽計劃建立的資源
2. **預覽圖** — 根據 What-if 結果進行架構視覺化 (02_arch_diagram_preview.html)
3. **實際部署** — 在使用者確認後，於 Azure 中建立資源

是否繼續執行部署？ (若您僅需要程式碼而不進行部署，請告訴我)
```

**絕不可執行下列操作：**
- 完成第 3 階段後僅提供 `az deployment group create` 指令而無後續指引
- 未經 What-if 驗證即直接部署，或要求使用者自行執行指令
- 跳過第 4 階段的步驟 (What-if → 預覽圖 → 部署)
