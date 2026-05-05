# acreadiness-cockpit

透過 Copilot 聊天視窗驅動 [Microsoft AgentRC](https://github.com/microsoft/agentrc)。將每次互動都納入 AgentRC 的 **測量 (Measure) → 建立 (Generate) → 維護 (Maintain)** 循環中。

## 外掛程式內容 (What's in the plugin)

### 自訂代理程式 (Custom agent)

| 代理程式 | 作用 |
|---|---|
| `@ai-readiness-reporter` | 執行 `agentrc readiness --json`，根據 9 支柱 / 5 等級模型解讀每個結果，然後從固定的 HTML/CSS 範本呈現一個獨立的 `reports/index.html`，使每位使用者都能獲得風格一致的儀表板。遵循政策（停用的標準、覆寫、通過率門檻）並分開呈現額外項目。 |

### 技能 (Skills)

| 技能 | 步驟 | 作用 |
|---|---|---|
| `/acreadiness-assess` | **測量** | 執行就緒掃描並移交給 `@ai-readiness-reporter` 以產出靜態 HTML 儀表板。接受 `--policy <path-or-pkg>` 和 `--per-area`。 |
| `/acreadiness-generate-instructions` | **建立** | 封裝 `agentrc instructions`。預設輸出為 `.github/copilot-instructions.md`（Copilot 原生）。詢問使用 `flat` (扁平) 還是 `nested` (巢狀)。對於 Monorepo，也會產出帶有 `applyTo` glob 的各區域專用 `.github/instructions/<area>.instructions.md` 檔案。 |
| `/acreadiness-policy` | **維護** | 選擇、支撐 (scaffold) 或套用 AgentRC 政策。瞭解其結構描述 (`criteria.disable`, `criteria.override`, `extras`, `thresholds`)、影響權重表，以及使用 `--fail-level` 的 CI 閘控。 |

## 產出物 (What gets produced)

`reports/index.html` — 一個由固定範本 (`skills/acreadiness-assess/report-template.html`) 呈現的單一獨立 HTML 檔案，使每位使用者都能獲得一致的觀感。內容包含：

- 成熟度徽章 (L1–L5) 與總分 / 等級 (A–F)
- 通過率 vs 門檻 (當政策有設定時)
- 成熟度進階表
- **作用中政策** 摘要 (停用/覆寫的標準、門檻)
- **存放庫健康狀況** 詳解 (8 個支柱)，每個都帶有 **AI 相關性** 徽章 (高/中/低)、*測量內容*、*對 AI 的重要性*、*目前狀態*、*建議*
- **AI 設定** 詳解 (AI 工具支柱)
- **額外項目** (僅供資訊參考 — agents-doc, pr-template, pre-commit, architecture-doc)
- **優先補救計畫** (🔴 優先修復 / 🟡 下步修復 / 🔵 計畫)
- 內嵌原始 AgentRC JSON 以供重複使用

## 先決條件 (Prerequisites)

- PATH 中需有 **Node.js 20+** (AgentRC 所需)
- 已啟用 Copilot 代理程式外掛程式的 VS Code

## 使用方式 (Usage)

在 Copilot 聊天視窗中：

```text
/acreadiness-assess                                 # 測量 → reports/index.html
/acreadiness-assess --policy ./policies/strict.json
/acreadiness-generate-instructions                  # 詢問扁平或巢狀
/acreadiness-generate-instructions --strategy flat
/acreadiness-generate-instructions --strategy nested
/acreadiness-generate-instructions --areas          # 各區域 applyTo 檔案
/acreadiness-policy new my-policy
@ai-readiness-reporter
```

### 扁平 vs 巢狀指令 (Flat vs nested instructions)

| | **扁平 (Flat)** *(預設)* | **巢狀 (Nested)** |
|---|---|---|
| 中心檔案 | `.github/copilot-instructions.md` | `.github/copilot-instructions.md` |
| 詳細檔案 | — | `.github/instructions/<topic>.instructions.md` (每個都帶有 `applyTo` glob) |
| 最適用於 | 小型 / 中型存放庫、單一堆疊 (single stack) | 大型或多堆疊 (multi-stack) 存放庫、Monorepo |
| Token 消耗 | 整個檔案一律載入 | VS Code 僅載入其 `applyTo` 相符的主題 |

當主要輸出為 `.github/copilot-instructions.md` 時，該技能會將 AgentRC 的巢狀輸出改寫為 VS Code 原生的 `.instructions.md` 配置（Copilot 會自動偵測）。若使用 `--output AGENTS.md`，巢狀結構會保留 AgentRC 預設的 `.agents/` 配置，以用於與代理程式無關的工具。

### 概念 (快速參考表) (Concepts (cheat sheet))

- **成熟度 (Maturity)**：L1 功能性 → L2 已編寫文件 → L3 標準化 → L4 最佳化 → L5 自主化
- **支柱 (Pillars)** (存放庫健康狀況)：風格 · 建構 · 測試 · 文件 · 開發環境 · 程式碼品質 · 可觀測性 · 安全性
- **支柱 (Pillars)** (AI 設定)：AI 工具
- **影響權重 (Impact weights)**：極高 (critical) 5 · 高 (high) 4 · 中 (medium) 3 · 低 (low) 2 · 資訊 (info) 0
- **等級 (Grades)**：A ≥ 0.9 · B ≥ 0.8 · C ≥ 0.7 · D ≥ 0.6 · F < 0.6

## 授權 (License)

MIT
