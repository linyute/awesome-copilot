---
name: acreadiness-generate-instructions
description: '透過 AgentRC instructions 指令建立量身定制的 AI 代理程式指令檔案。產出 .github/copilot-instructions.md（預設，建議用於 VS Code 中的 Copilot），加上針對 Monorepo 的選填、帶有 applyTo glob 的各區域專用 .instructions.md 檔案。在執行 /acreadiness-assess 後使用，以彌補 AI 工具支柱中的差距。'
argument-hint: "[--output .github/copilot-instructions.md|AGENTS.md] [--strategy flat|nested] [--areas | --area <name>] [--apply-to <glob>] [--claude-md] [--dry-run]"
---

# /acreadiness-generate-instructions — 編寫 AI 代理程式指令

每當使用者想要 **建立 (create)**、**重新產生 (regenerate)** 或 **重新整理 (refresh)** 其用於 AI 編碼代理程式（Copilot, Claude 等）的自訂指令時，請使用此技能。這是 AgentRC 的 **測量 (Measure) → 建立 (Generate) → 維護 (Maintain)** 循環中的「建立」步驟，也是針對 **AI 工具 (AI Tooling)** 支柱最高槓桿的單一行動。

## 輸出選項 (Output options)

VS Code 可辨識多種指令檔案類型 — AgentRC 會產生最常見的幾種：

| 檔案 | 範圍 | 何時使用 |
|---|---|---|
| `.github/copilot-instructions.md` | 始終開啟，整個工作區 | **預設值** — VS Code Copilot 的原生指令檔案 |
| `AGENTS.md` | 始終開啟，整個工作區 | 多代理程式存放庫 (Copilot + Claude + 其他) |
| `.github/instructions/*.instructions.md` | 由 `applyTo` glob 限定範圍 | Monorepo 中的各區域 / 各語言規則 |
| `CLAUDE.md` | Claude 專用 | 透過 `--claude-md` 新增（僅限巢狀） |

## 策略 (Strategies)

- **`flat` (扁平)** *(預設)* — 在選定路徑產生單一的 `.github/copilot-instructions.md`。簡單且易於審閱。
- **`nested` (巢狀)** — 中心檔案位於 `.github/copilot-instructions.md` + 各主題詳細檔案位於 `.github/instructions/<topic>.instructions.md`，每個檔案都帶有 `applyTo` glob，因此 VS Code 僅在相關時才載入該主題。較適用於大型或多堆疊 (multi-stack) 存放庫。

> **為什麼是 `.github/instructions/` 而不是 `.agents/`？** AgentRC 的預設巢狀配置會寫入 `.agents/`，這對於 *與代理程式無關* 的存放庫（Copilot + Claude + Cursor 讀取 `AGENTS.md`）是正確的歸宿。針對 VS Code Copilot，原生位置是帶有 `applyTo` frontmatter 的 `.github/instructions/` — 這也是 Copilot 會自動偵測的位置。每當主要輸出為 `.github/copilot-instructions.md` 時，此技能會將 AgentRC 的巢狀輸出改寫為 VS Code 原生位置。如果您選擇了 `--output AGENTS.md`，巢狀結構則會保留 AgentRC 預設的 `.agents/` 配置。

對於 Monorepo，使用 `--areas`、`--area <name>` 或 `--areas-only` 建立 **區域限定範圍 (area-scoped)** 的指令。區域定義於 `agentrc.config.json` 中。各區域輸出會寫入為帶有 `applyTo` glob 的 VS Code `.instructions.md` 檔案（見下文）。

### 主題 vs 區域 `.instructions.md` 檔案 (Topic vs area .instructions.md files)

兩者最終都會放在 `.github/instructions/` 中，但它們回答不同的問題：

| 種類 | 檔名範例 | `applyTo` 範例 | 來源 |
|---|---|---|---|
| **主題 (Topic)** (巢狀) | `testing.instructions.md` | `**/*.{test,spec}.{ts,tsx,js}` | AgentRC `--strategy nested` 主題拆分 |
| **區域 (Area)** (monorepo) | `frontend.instructions.md` | `apps/frontend/**` | `agentrc.config.json` 區域 + `--areas` |

您可以同時擁有兩者：一組巢狀的主題檔案，加上用於 Monorepo 的各區域檔案。

## 帶有 `applyTo` 的區域專用檔案 (Per-area files with `applyTo`)

當使用者選擇使用區域時，在 `.github/instructions/<area>.instructions.md` 為每個區域發佈一個 VS Code 原生的 `.instructions.md` 檔案。每個檔案必須以宣告規則適用之 glob 的 frontmatter 開頭：

```markdown
---
applyTo: "apps/frontend/**"
---

# 前端區域指令 (Frontend area instructions)

…AgentRC 為此區域建立的內容…
```

工作流程：

1. **讀取 `agentrc.config.json`** 以發現宣告的區域及其 `paths` / glob。如果缺少 `paths`，請詢問使用者 glob（例如 `src/api/**`）。
2. **執行 `agentrc instructions --areas`**（或 `--area <name>`）以產出各區域的本文內容。
3. **將每個區域的內容包裝** 在 `.github/instructions/<area>.instructions.md` 中，並使用從該區域的 `paths` 取得的 `applyTo` frontmatter。如果使用者在單一區域呼叫中傳遞了 `--apply-to <glob>`，請逐字使用該 glob。
4. **不要更動主檔案** — 根目錄的 `.github/copilot-instructions.md` 仍作為始終開啟的指令；`.instructions.md` 檔案僅對相符的路徑生效。

命名方式：全小寫、kebab-case 的區域名稱。範例：`.github/instructions/frontend.instructions.md`, `.github/instructions/api.instructions.md`, `.github/instructions/infra.instructions.md`。

## 步驟 (Steps)

1. **挑選目標檔案**。**預設為 `.github/copilot-instructions.md`。** 僅在使用者提到多代理程式 / Claude / Cursor 支援時才切換到 `AGENTS.md`。
2. **務必詢問要使用哪種策略** — `flat` (扁平) 或 `nested` (巢狀) — 除非使用者已在訊息中或透過 `--strategy` 指定。簡要呈現權衡取捨：
   - **扁平 (Flat)** *(預設)* — 單一 `.github/copilot-instructions.md`。簡單，易於在單一 PR 中審閱。最適用於具有單一技術棧的小型/中型存放庫。
   - **巢狀 (Nested)** — 中心檔案 `.github/copilot-instructions.md` + 各主題 `.github/instructions/<topic>.instructions.md` 檔案（每個都帶有 `applyTo` glob，因此 VS Code 僅在相關時載入）。最適用於大型或多技術棧存放庫。加入 `--claude-md` 以同時發佈 `CLAUDE.md`。
   當存放庫擁有超過 5 個頂層目錄、多個技術棧，或已使用 Monorepo 工具 (turbo/nx/pnpm workspaces) 時，請主動建議使用 `nested`。
3. **透過讀取 `agentrc.config.json` 偵測 Monorepo 區域**。如果存在區域，請詢問使用者是否除了根檔案外，還想要 **帶有 `applyTo` 的各區域 `.instructions.md` 檔案**。當 `agentrc.config.json` 宣告了區域時，預設為「是」。
4. **先執行測試執行 (dry-run)**，以便使用者預覽：
   ```bash
   npx -y github:microsoft/agentrc instructions --output <file> --strategy <flat|nested> [--areas|--area <name>] [--claude-md] --dry-run
   ```
5. **顯示變更內容的簡短摘要** — 將建立或覆寫的檔案、區域數量及其 `applyTo` glob、所使用的模型（預設為 `claude-sonnet-4.6`）。
6. **確認後，執行不帶 `--dry-run` 的相同指令**（如果檔案已存在，可選填 `--force`）。
7. **針對 Copilot 輸出進行配置後處理**：
   - **如果 `--output` 以 `copilot-instructions.md` 結尾且策略為 `nested`**：移動/改寫 AgentRC 的 `.agents/<topic>.md` 檔案至 `.github/instructions/<topic>.instructions.md`。為每個檔案新增帶有適當 `applyTo` glob 的 frontmatter（見下文的「主題 applyTo 預設值」）。刪除目前已空的 `.agents/` 目錄。
   - **如果使用了 `--areas`**：也為每個區域寫入 `.github/instructions/<area>.instructions.md`，使用 `agentrc.config.json` 中各區域的 `paths` 作為 `applyTo` glob（針對單一區域呼叫，可使用 `--apply-to` 覆寫）。
   - **如果選擇了 `--output AGENTS.md`**：針對巢狀結構保留 AgentRC 原生的 `.agents/` 配置 — 與代理程式無關的讀取器期望在那裡找到它。
   若 `.github/instructions/` 目錄缺失則建立之。

### 主題 `applyTo` 預設值 (Topic `applyTo` defaults)

將 AgentRC 的巢狀主題檔案提升為 `.instructions.md` 時，除非使用者另有指定，否則請使用以下預設值：

| 主題 | 預設 `applyTo` |
|---|---|
| `testing` | `**/*.{test,spec}.{ts,tsx,js,jsx,mjs,cjs}` |
| `style` / `code-quality` / `formatting` | `**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,java,kt,cs}` |
| `build` / `ci` | `**/{package.json,turbo.json,nx.json,.github/workflows/**}` |
| `docs` | `**/*.md` |
| `security` | `**` |
| 其他任何項目 / 中心層級 | `**` |

8. **驗證 (Verify)**：讀回產生的檔案，並向使用者顯示一段大綱摘要：偵測到的技術棧、擷取的慣例、長度、`.instructions.md` 檔案清單及其 glob。
9. **建議下一步**：
   - 重新執行 `assess` 技能，以確認 AI 工具支柱的分數有所提升。
   - 如果使用者已同時擁有 `copilot-instructions.md` 與 `AGENTS.md`，建議整合為單一信任來源 (Single source of truth)（AgentRC 會在成熟度等級 2+ 時標記此問題）。

## 附註 (Notes)

- AgentRC 讀取您的 **實際程式碼** — 無範本。輸出反映偵測到的語言、框架與慣例。
- `--claude-md`（僅限巢狀策略）也會發佈 `CLAUDE.md`。
- 當作用中檔案與 `applyTo` 相符時，VS Code 會自動套用 `.instructions.md` 檔案。根目錄的 `.github/copilot-instructions.md` 始終會載入。
- 絕不要在 CI 中以非互動方式執行此技能；指令是存放庫的一部分，應透過 PR 導入。
