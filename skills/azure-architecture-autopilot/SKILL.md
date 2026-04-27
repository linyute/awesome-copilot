---
name: azure-architecture-autopilot
description: >
  使用自然語言設計 Azure 基礎設施，或分析現有的 Azure 資源以自動產生架構圖，透過對話進行完善，並使用 Bicep 進行部署。

  何時使用此技能：
  - 「在 Azure 上建立 X」、「設定 RAG 架構」(新設計)
  - 「分析我目前的 Azure 基礎設施」、「為 rg-xxx 繪製架構圖」(現有分析)
  - 「Foundry 變慢了」、「我想要降低成本」、「強化安全性」(自然語言修改)
  - Azure 資源部署、Bicep 範本產生、IaC 程式碼產生
  - Microsoft Foundry, AI Search, OpenAI, Fabric, ADLS Gen2, Databricks 以及所有 Azure 服務
---

# Azure 架構建置代理 (Azure Architecture Builder)

一個使用自然語言設計 Azure 基礎設施，或分析現有資源以視覺化架構，並進行修改與部署的管線。

架構圖引擎已**內建於此技能中** (`scripts/` 資料夾)。
無須執行 `pip install` — 它直接使用隨附的 Python 腳本，配合 605 個以上的 Azure 官方圖示來產生互動式 HTML 架構圖。
無須網路存取或安裝套件，即可立即使用。

## 自動偵測使用者語言

**🚨 偵測使用者第一則訊息的語言，並以該語言提供後續所有回應。這是最高優先原則。**

- 若使用者以韓文撰寫 → 以韓文回應
- 若使用者以英文撰寫 → **以英文回應** (ask_user、進度更新、報告、Bicep 註釋 — 一律使用英文)
- 本文件中的說明與範例是以英文撰寫，**所有面向使用者的輸出必須符合使用者的語言**

**⚠️ 請勿將本文件中的範例原封不動地複製給使用者。**
僅將結構作為參考，並根據使用者的語言調整文字。

## 工具使用指南 (GHCP 環境)

| 功能 | 工具名稱 | 附註 |
|---------|-----------|-------|
| 獲取 URL 內容 | `web_fetch` | 用於查詢 MS 文件等 |
| 網頁搜尋 | `web_search` | 發現 URL |
| 詢問使用者 | `ask_user` | `choices` 必須是字串陣列 |
| 子代理 | `task` | 探索/任務/通用用途 |
| 執行 Shell 指令 | `powershell` | Windows PowerShell |

> 所有子代理 (探索/任務/通用用途) 皆無法使用 `web_fetch` 或 `web_search`。
> 需要查詢 MS 文件的事實核實必須**由主代理直接執行**。

## 外部工具路徑發現

`az`, `python`, `bicep` 等通常不在 PATH 中。
**在開始某個階段前發現一次路徑並快取結果。不要每次都重新發現。**

> **⚠️ 請勿使用 `Get-Command python`** — 會有選中 Windows Store 別名的風險。
> 應優先進行直接的檔案系統發現 (`$env:LOCALAPPDATA\Programs\Python`)。

az CLI 路徑發現：
```powershell
$azCmd = $null
if (Get-Command az -ErrorAction SilentlyContinue) { $azCmd = 'az' }
if (-not $azCmd) {
  $azExe = Get-ChildItem -Path "$env:ProgramFiles\Microsoft SDKs\Azure\CLI2\wbin", "$env:LOCALAPPDATA\Programs\Azure CLI\wbin" -Filter "az.cmd" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
  if ($azExe) { $azCmd = $azExe }
}
```

Python 路徑 + 內建架構圖引擎：請參閱 `references/phase1-advisor.md` 中的架構圖產生章節。

## 必須提供進度更新

使用「區塊引用 + 表情符號 + 粗體」格式：
```markdown
> **⏳ [行動]** — [原因]
> **✅ [完成]** — [結果]
> **⚠️ [警告]** — [詳情]
> **❌ [失敗]** — [原因]
```

## 平行預載原則

在透過 `ask_user` 等待使用者輸入時，平行預載下一步所需的資訊。

| ask_user 問題 | 同時進行的預載 |
|---|---|
| 專案名稱 / 掃描範圍 | 參考檔案、MS 文件、Python 路徑發現、**架構圖模組路徑驗證** |
| 模型/SKU 選取 | 擷取 MS 文件以供下一個問題的選項使用 |
| 架構確認 | `az account show/list`, `az group list` |
| 訂閱選取 | `az group list` |

---

## 路徑分支 — 根據使用者請求自動決定

### 路徑 A：新設計 (全新建置)

**觸發詞**：「建立」、「設定」、「部署」、「建構」等。
```
第 1 階段 (references/phase1-advisor.md) — 互動式架構設計 + 架構圖
    ↓
第 2 階段 (references/bicep-generator.md) — Bicep 程式碼產生
    ↓
第 3 階段 (references/bicep-reviewer.md) — 程式碼審查 + 編譯驗證
    ↓
第 4 階段 (references/phase4-deployer.md) — 驗證 (validate) → what-if → 部署
```

### 路徑 B：現有分析 + 修改 (分析與修改)

**觸發詞**：「分析」、「目前的資源」、「掃描」、「畫一張架構圖」、「顯示我的基礎設施」等。
```
第 0 階段 (references/phase0-scanner.md) — 現有資源掃描 + 關係推論 + 架構圖
    ↓
修改對話 — 「您想要在此處變更什麼？」(自然語言修改請求 → 追問詳細資訊)
    ↓
第 1 階段 (references/phase1-advisor.md) — 確認修改內容 + 更新架構圖
    ↓
第 2~4 階段 — 與上方相同
```

### 當路徑判定不明確時

直接詢問使用者：
```
ask_user({
  question: "您想要執行什麼操作？",
  choices: [
    "設計新的 Azure 架構 (推薦)",
    "分析並修改現有的 Azure 資源"
  ]
})
```

---

## 階段過渡規則

- 每個階段皆閱讀並遵循其對應 `references/*.md` 檔案中的說明
- 在階段過渡時，務必告知使用者下一步的操作
- 不要跳過任何階段 (特別是第 3 階段與第 4 階段之間的 what-if 驗證)
- **🚨 從第 1 階段過渡到第 2 階段的必要條件**：必須已使用內建架構圖引擎產生 `01_arch_diagram_draft.html` 並展示給使用者。**在未產生架構圖前，不得進行 Bicep 產生。** 僅完成規格收集並不代表第 1 階段已結束 — 第 1 階段包含架構圖產生與使用者確認。
- 部署後的修改請求 → 返回第 1 階段，而非第 0 階段 (差異確認規則)

## 服務涵蓋範圍與備援

### 已優化的服務
Microsoft Foundry, Azure OpenAI, AI Search, ADLS Gen2, Key Vault, Microsoft Fabric, Azure Data Factory, VNet/私人端點 (Private Endpoint), AML/AI 中樞 (AI Hub)

### 其他 Azure 服務
全數支援 — 自動查閱 MS 文件，以相同的品質標準產生。
**請勿發送如「超出範圍」或「盡力而為」等會引起使用者擔憂的訊息。**

### 穩定 vs. 動態資訊處理

| 類別 | 處理方法 | 範例 |
|----------|----------------|---------|
| **穩定資訊** | 優先參考檔案 | `isHnsEnabled: true`, PE 三件式組合 |
| **動態資訊** | **務必擷取 MS 文件** | API 版本、模型可用性、SKU、區域 |

## 快速參考

| 檔案 | 角色 |
|------|------|
| `references/phase0-scanner.md` | 現有資源掃描 + 關係推論 + 架構圖 |
| `references/phase1-advisor.md` | 互動式架構設計 + 事實核實 |
| `references/bicep-generator.md` | Bicep 程式碼產生規則 |
| `references/bicep-reviewer.md` | 程式碼審查檢核表 |
| `references/phase4-deployer.md` | 驗證 → what-if → 部署 |
| `references/service-gotchas.md` | 必要屬性、PE 對照 |
| `references/azure-dynamic-sources.md` | MS 文件 URL 註冊表 |
| `references/azure-common-patterns.md` | PE/安全性/命名模式 |
| `references/ai-data.md` | AI/資料服務指南 |
