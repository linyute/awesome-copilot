# acreadiness-cockpit

從 Copilot 聊天介面驅動 [Microsoft AgentRC](https://github.com/microsoft/agentrc)。將每一次互動框架在 AgentRC 的 **Measure → Generate → Maintain** 循環中。

## 外掛程式包含的內容

### 自訂 Agent

| Agent | 功能說明 |
|---|---|
| `@ai-readiness-reporter` | 執行 `agentrc readiness --json`，根據 9 大支柱 / 5 個等級模型解讀每項結果，然後從固定的 HTML/CSS 範本轉譯出獨立完整的 `reports/index.html`，讓每位使用者都能獲得風格一致的儀表板。遵循原則（已停用的準則、覆寫設定、通過率閾值）並單獨呈現額外項目。 |

### 技能

| 技能 | 步驟 | 功能說明 |
|---|---|---|
| `/acreadiness-assess` | **Measure** | 執行整備度掃描並交接給 `@ai-readiness-reporter` 以產出靜態 HTML 儀表板。接受 `--policy <path-or-pkg>` 與 `--per-area`。 |
| `/acreadiness-generate-instructions` | **Generate** | 包裝 `agentrc instructions`。預設輸出為 `.github/copilot-instructions.md`（Copilot 原生）。詢問 `flat` 還是 `nested`。對於 monorepo，還會輸出帶有 `applyTo` glob 的個別區域 `.github/instructions/<area>.instructions.md` 檔案。 |
| `/acreadiness-policy` | **Maintain** | 選取、鷹架建立或套用 AgentRC 原則。瞭解結構描述（`criteria.disable`、`criteria.override`、`extras`、`thresholds`）、影響權重表，以及使用 `--fail-level` 進行的 CI 閘控。 |

## 產出內容

`reports/index.html` — 從固定範本（`skills/acreadiness-assess/report-template.html`）轉譯出的單一獨立 HTML 檔案，讓每位使用者都能獲得相同的外觀與風格。包含：

- 成熟度徽章（L1–L5）與整體評分 / 等級（A–F）
- 通過率與閾值比較（當原則有設定時）
- 成熟度進展表
- **使用中原則**摘要（已停用/已覆寫的準則、閾值）
- **儲存庫健康度**明細（8 大支柱），每一項都帶有 **AI 相關性**徽章（高/中/低）、*測量內容*、*對 AI 為何重要*、*目前狀態*、*建議事項*
- **AI 設定**明細（AI 工具支柱）
- **額外項目**（僅供資訊參考 — agents-doc、pr-template、pre-commit、architecture-doc）
- **優先順序補救計畫**（🔴 最先修復 / 🟡 接著修復 / 🔵 規劃）
- 內嵌原始 AgentRC JSON 以供重複使用

## 先決條件

- PATH 中需有 **Node.js 20+**（AgentRC 必要需求）
- 已啟用 Copilot agent 外掛程式的 VS Code

## 使用方式

在 Copilot 聊天介面中：

```text
/acreadiness-assess                                 # measure → reports/index.html
/acreadiness-assess --policy ./policies/strict.json
/acreadiness-generate-instructions                  # asks flat or nested
/acreadiness-generate-instructions --strategy flat
/acreadiness-generate-instructions --strategy nested
/acreadiness-generate-instructions --areas          # per-area applyTo files
/acreadiness-policy new my-policy
@ai-readiness-reporter
```

### Flat 與 Nested 指示比較

| | **Flat** *(預設)* | **Nested** |
|---|---|---|
| 核心樞紐檔案 | `.github/copilot-instructions.md` | `.github/copilot-instructions.md` |
| 詳細資訊檔案 | — | `.github/instructions/<topic>.instructions.md`（每個皆帶有 `applyTo` glob） |
| 適用場景 | 小型 / 中型儲存庫、單一技術堆疊 | 大型或多技術堆疊儲存庫、monorepos |
| Token 成本 | 總是載入完整檔案 | VS Code 僅載入符合 `applyTo` 的主題 |

當主要輸出為 `.github/copilot-instructions.md` 時，該技能會將 AgentRC 的巢狀輸出改寫為 VS Code 原生的 `.instructions.md` 配置（Copilot 會自動探索）。使用 `--output AGENTS.md` 時，巢狀配置會保留 AgentRC 預設的 `.agents/` 配置，以供與 agent 無關的工具使用。

### 概念（速查表）

- **成熟度**：L1 功能性 → L2 已記錄文件 → L3 標準化 → L4 已最佳化 → L5 自主運作
- **支柱**（儲存庫健康度）：風格 · 建構 · 測試 · 文件 · 開發環境 · 程式碼品質 · 可觀測性 · 安全性
- **支柱**（AI 設定）：AI 工具
- **影響權重**：嚴重 5 · 高 4 · 中 3 · 低 2 · 資訊 0
- **等級**：A ≥ 0.9 · B ≥ 0.8 · C ≥ 0.7 · D ≥ 0.6 · F < 0.6

## 授權條款

MIT
