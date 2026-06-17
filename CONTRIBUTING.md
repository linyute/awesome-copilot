# 參與貢獻 Awesome GitHub Copilot (Contributing to Awesome GitHub Copilot)

感謝您有興趣為 Awesome GitHub Copilot 儲存庫做出貢獻！我們歡迎社群的貢獻，以協助擴展我們的自訂指令與技能集合。

## 目錄 (Table of Contents)

- [我們接受的內容](#我們接受的內容)
- [我們不接受的內容](#我們不接受的內容)
- [品質指引](#品質指引)
- [如何參與貢獻](#如何參與貢獻)
  - [新增指令](#新增指令)
  - [新增一個 Agent](#新增 Agent)
  - [新增技能](#新增技能)
  - [新增外掛程式](#新增外掛程式)
  - [新增 Hook](#新增 Hook)
  - [新增 Agentic Workflow](#新增 Agentic Workflow)
- [提交您的貢獻](#提交您的貢獻)
- [貢獻者認可](#貢獻者認可)
  - [貢獻類型](#貢獻類型)
- [行為準則](#行為準則)
- [授權條款](#授權條款)

## 我們接受的內容 (What We Accept)

我們歡迎涵蓋任何技術、框架或開發實作的貢獻，只要能協助開發者更有效地使用 GitHub Copilot。這包含：

- 程式語言與框架
- 開發方法論與最佳實作
- 架構模式與設計原則
- 測試策略與品質保證
- DevOps 與部署實作
- 無障礙環境與包容性設計
- 效能最佳化技術

如果您計畫貢獻涉及付費服務的內容，請參閱我們的[涉及付費服務的提交指引](https://github.com/github/awesome-copilot/discussions/968)。

## 我們不接受的內容 (What We Don't Accept)

為了維持一個安全、負責任且高訊號的集合，我們 **不會接受** 具備下列特性的貢獻：

- **違反負責任 AI 原則 (Violate Responsible AI Principles)**：試圖規避 Microsoft/GitHub 的負責任 AI 指引或推廣有害的 AI 使用方式的內容
- **損害安全性 (Compromise Security)**：旨在繞過安全性原則、利用弱點或削弱系統安全性的指令
- **啟用惡意活動 (Enable Malicious Activities)**：意圖傷害其他系統、使用者或組織的內容
- **利用弱點 (Exploit Weaknesses)**：利用其他平台或服務中的弱點的指令
- **推廣有害內容 (Promote Harmful Content)**：可能導致建立有害、歧視性或不適當內容的指引
- **規避平台原則 (Circumvent Platform Policies)**：試圖繞過 GitHub、Microsoft 或其他平台服務條款的行為
- **重複現有模型優勢且無實質提升 (Duplicate Existing Model Strengths Without Meaningful Uplift)**：主要要求 Copilot 執行前瞻模型 (frontier models) 已經處理得很好的工作（例如：通用的 TypeScript、HTML 或其他廣泛支援的編碼任務），且未解決明確的差距、專門工作流程或特定領域限制的提交內容。這些貢獻對使用者來說通常價值較低，且可能引入比模型預設行為更弱或衝突的指引。
- **未經審查的遠端來源外掛程式 (Unreviewed remote-source plugins)**：請勿開啟直接將第三方外掛加入 `plugins/external.json` 的 pull request。公開的外部外掛必須使用下方文件化的審查工作流程。在 v1 中，該工作流程僅接受託管於公開 GitHub 儲存庫的外掛；非 GitHub 的來源（例如一般的 git URL）不接受用於公開提交。

## 品質指引 (Quality Guidelines)

- **保持具體 (Be specific)**：通用的指令不如具體且具備行動力的指引有用
- **測試您的內容 (Test your content)**：確保您的指令或技能在 GitHub Copilot 中運作良好
- **遵循慣例 (Follow conventions)**：使用一致的格式與命名方式
- **保持專注 (Keep it focused)**：每個檔案應針對特定的技術、框架或使用案例
- **表達清晰 (Write clearly)**：使用簡單、直接的語言
- **推廣最佳實作 (Promote best practices)**：鼓勵安全、可維護且符合道德的開發實作

## 如何參與貢獻 (How to Contribute)

### 新增指令 (Adding Instructions)

指令有助於針對特定的技術、程式開發實作或領域自訂 GitHub Copilot 的行為。

1. **建立您的指令檔案**：在 `instructions/` 目錄中新增一個 `.md` 檔案
2. **遵循命名慣例**：使用具描述性、小寫且帶有連字號的檔名（例如：`python-django.instructions.md`）
3. **架構您的內容**：以清晰的標題開始，並邏輯地組織您的指令
4. **測試您的指令**：確保您的指令在 GitHub Copilot 中運作良好

#### 範例指令格式 (Example instruction format)

```markdown
---
description: "針對特定技術與實作自訂 GitHub Copilot 行為的指令"
---

# 您的技術/框架名稱 (Your Technology/Framework Name)

## 指令 (Instructions)

- 為 GitHub Copilot 提供清晰且具體的指引
- 包含最佳實作與慣例
- 使用項目符號以便閱讀

## 額外指引 (Additional Guidelines)

- 任何額外的背景資訊或範例
```

### 新增一個 Agent (Adding an Agent)

Agent 是專門的組態，可將 GitHub Copilot Chat 轉換為特定開發場景的領域特定助理或角色。

1. **建立您的 Agent 檔案**：在 `agents/` 目錄中新增一個 `.agent.md` 檔案
2. **遵循命名慣例**：使用具描述性、小寫且帶有連字號的檔名，並加上 `.agent.md` 副檔名（例如：`react-performance-expert.agent.md`）
3. **包含 Frontmatter**：在檔案頂端新增包含必要欄位的 Metadata
4. **定義角色**：為 Agent 建立清晰的身分與專業領域
5. **測試您的 Agent**：確保 Agent 在其領域中提供有用且準確的的回應

#### 範例 Agent 格式 (Example agent format)

```markdown
---
description: "Agent 及其用途的簡短描述"
model: "gpt-5"
tools: ["codebase", "terminalCommand"]
name: "我的 Agent 名稱"
---

您是一位在 [特定領域] 擁有深厚知識的專家 [領域/角色]。

## 您的專業知識 (Your Expertise)

- [特定技能 1]
- [特定技能 2]
- [特定技能 3]

## 您的做法 (Your Approach)

- [您如何協助使用者]
- [您的溝通風格]
- [您優先考慮的事項]

## 指引 (Guidelines)

- [回應的具體指令]
- [限制或侷限]
- [應遵循的最佳實作]
```

### 新增技能 (Adding Skills)

技能是 `skills/` 目錄中的獨立資料夾，包含一個 `SKILL.md` 檔案（具備 Front Matter）與選用的搭售資產。

1. **建立新的技能資料夾**：執行 `npm run skill:create -- --name <skill-name> --description "<skill description>"`
2. **編輯 `SKILL.md`**：確保 `name` 與資料夾名稱一致（小寫並使用連字號），且 `description` 清晰且不為空
3. **新增選用資產**：保持搭售資產大小合理（每個不超過 5MB），並在 `SKILL.md` 中引用它們
4. **驗證並更新文件**：執行 `npm run skill:validate` 然後執行 `npm run build` 以更新產生的 README 表格

### 新增外掛程式 (Adding Plugins)

外掛程式圍繞特定主題或工作流程分組相關的 Agent、指令與技能，讓使用者能透過 GitHub Copilot CLI 輕鬆安裝完整的工具包。

1. **建立您的外掛程式**：執行 `npm run plugin:create` 以建立新外掛程式的架構
2. **遵循命名慣例**：使用具描述性、小寫且帶有連字號的資料夾名稱（例如：`python-web-development`）
3. **定義您的內容**：使用 Claude Code 規格欄位在 `plugin.json` 中列出 Agent、指令與技能
4. **測試您的外掛程式**：執行 `npm run plugin:validate` 以驗證您的外掛程式結構

#### 建立外掛程式 (Creating a plugin)

```bash
npm run plugin:create -- --name my-plugin-id
```

#### 外掛程式結構 (Plugin structure)

```
plugins/my-plugin-id/
├── .github/plugin/plugin.json  # 外掛程式 Metadata (Claude Code 規格格式)
└── README.md                   # 外掛程式文件
```

> **注意：** 外掛程式內容是在 `plugin.json` 中使用 Claude Code 規格欄位 (`agents`, `commands`, `skills`) 宣告式地定義。原始檔案位於頂層目錄，並由 CI 實體化為外掛程式。

#### plugin.json 範例 (plugin.json example)

```json
{
  "name": "my-plugin-id",
  "description": "外掛程式描述",
  "version": "1.0.0",
  "keywords": [],
  "author": { "name": "Awesome Copilot Community" },
  "repository": "https://github.com/github/awesome-copilot",
  "license": "MIT",
  "agents": ["./agents/my-agent.md"],
  "commands": ["./commands/my-command.md"],
  "skills": ["./skills/my-skill/"]
}
```

#### 外掛程式指引 (Plugin Guidelines)

- **宣告式內容 (Declarative content)**：外掛程式內容透過 `plugin.json` 中的 `agents`、`commands` 與 `skills` 陣列指定 —— 原始檔案位於頂層目錄，並由 CI 實體化為外掛程式
- **有效引用 (Valid references)**：`plugin.json` 中引用的所有路徑必須指向儲存庫中現有的原始檔案
- **不包含指令 (Instructions excluded)**：指令是獨立資源，不屬於外掛程式的一部分
- **明確用途 (Clear purpose)**：外掛程式應解決特定的問題或工作流程
- **提交前驗證 (Validate before submitting)**：執行 `npm run plugin:validate` 以確保您的外掛程式有效

#### 新增外部外掛程式 (Adding External Plugins)

外部外掛程式是託管在此存放庫之外，並列在 `plugins/external.json` 中的外掛程式。公眾貢獻者**不應**直接開啟 PR 來編輯 `plugins/external.json`。相反地，請透過下方的公眾審核工作流程提交外部外掛程式。

> [!IMPORTANT]
> 公眾外部外掛程式提交在 v1 版本中僅支援 GitHub。提交的外掛程式必須位於公開的 GitHub 存放庫中，並使用 `source.source: "github"`。

##### 提交欄位

外部外掛程式 Issue 表單將收集以下欄位：

- 外掛程式名稱
- 簡短描述
- `owner/repo` 格式的 GitHub 存放庫
- 存放庫內的外掛程式路徑（若外掛程式位於存放庫根目錄則為選填）
- 供審查的參考（`ref`）：請使用 release 標籤或 tag 參考，而非分支
- 供審查的 Commit SHA（`sha`）：請使用完整 40 字元的 commit SHA
- 外掛程式版本
- 授權識別碼
- 作者姓名
- 作者 URL（選填）
- 首頁 URL（選填）
- 關鍵字/標籤
- 給審核者的補充說明（選填）
- 確認勾選方塊：存放庫是公開的、參考是不可變的、提交符合此存放庫的策略，且該外掛程式不是重複列出的項目

存放庫的標準驗證規則位於 `eng/external-plugin-validation.mjs`。建構指令碼會重用該模組中的 `marketplace` 策略，而 Issue 收錄自動化則使用更嚴格的 `publicSubmission` 策略，以確保 JSON 規範和工作流程檢查保持一致。

對於提交到 `plugins/external.json` 的項目，目前的市集驗證要求：

- `name`、`description` 和 `version`
- `author.name`
- `repository` 必須是 HTTPS GitHub URL
- `keywords` 必須是小寫且帶有連字號的標籤
- `source.source: "github"` 加上 `owner/repo` 格式的 `source.repo`
- 選填的 `source.path` 值，可使用 `/` 表示存放庫根目錄，或填寫相對於存放庫的資料夾路徑，該資料夾為外掛程式結構的起始位置（請勿直接指向 `plugin.json`）

公開提交政策在這些規則的基礎上，還要求包含 `license`，並至少提供一個不可變的來源定位器：`source.ref`、`source.sha`，或兩者皆有。

##### 審查工作流程

1. **開啟 Issue**：使用外部插件 Issue 表單。自動化會套用 `external-plugin` 和 `awaiting-review` 標籤。
2. **自動化收錄驗證**：檢查必要欄位是否存在，並正確格式化以符合 GitHub 託管的外掛程式。無效的提交會被標記為 `requires-submitter-fixes`，並附上評論說明維護者審查前需要修正的內容。
3. **自動化品質閘道**：在元資料驗證後執行：
   - 針對提交的插件路徑/ref/sha 執行 `skill-validator check --plugin`
   - 透過 Copilot CLI 針對從提交生成的臨時 Marketplace 條目執行安裝冒煙測試 (smoke test)
4. **準備維護者審查**：如果元資料驗證和品質閘道通過，自動化會移除 `awaiting-review` 並新增 `ready-for-review`。
5. **提交者修復阻擋**：如果元資料有效但品質閘道失敗，自動化會套用 `requires-submitter-fixes`，而不是進入人工審查。
6. **要求再次進行採納**：在更新 Issue 內容或原始外掛程式後，Issue 作者或維護者可以留言 `/rerun-intake` 以按需重新執行自動化採納和品質閘道。開啟的 Issue 會在編輯時自動重新觸發採納；已關閉的維護者拒絕 Issue 需要 `/rerun-intake`。當重新執行被接受時，自動化會以 👀 反應該指令留言，以顯示處理已開始。
7. **維護者覆蓋路徑**：具有寫入權限的維護者可以留言 `/mark-ready-for-review [可選原因]` 明確將 `requires-submitter-fixes` Issue 移動到 `ready-for-review`。
8. **維護者決定**：一旦進入 `ready-for-review`，具有寫入權限的維護者會進行人工審查，然後在 Issue 上留言 `/approve` 或 `/reject <原因>`。來自非維護者的指令會被忽略。
9. **核准路徑**：在 `/approve` 時，自動化會移除 `ready-for-review`，新增 `approved`，關閉 Issue，並開啟或更新針對 `staged` 分支的 PR，該 PR 會更新 `plugins/external.json` 和生成的 Marketplace 輸出。
10. **拒絕路徑**：在 `/reject <原因>` 時，自動化會移除 `ready-for-review`，新增 `rejected`，關閉 Issue，並在 Issue 留言中記錄原因。在處理回饋後，更新同一個 Issue 並使用 `/rerun-intake` 重新排隊採納。

##### 透過 PR 更新列出的外部插件

當拉取請求更新 `plugins/external.json` 時（例如，先前核准的列出版本更新），自動化會執行 PR 品質檢查，並將結果直接發布在 PR 上：

1. **偵測變更的項目**：自動化會識別 PR 中新增/更新的外部插件項目。
2. **執行品質閘道**：自動化會針對每個變更的插件來源 ref/SHA/path 執行安裝煙霧測試和 `skill-validator` 檢查。
3. **張貼來源連結**：自動化會更新機器人留言，包含每個插件的結果和直接連結到各插件來源位置的 GitHub 樹狀結構連結。
4. **同步 PR 上的工作流程狀態標籤**：
   - 當所有檢查通過時，套用 `ready-for-review`
   - 當品質檢查因插件問題而失敗時，套用 `requires-submitter-fixes`
   - 當檢查因基礎設施/暫時性錯誤而無法完成時，套用 `awaiting-review`

##### 維護者的審核責任

維護者負責確認提交項目：

- 明確符合 Awesome Copilot 集合，並在現有列表之外增加價值
- 使用公開的 GitHub 儲存庫，並提供可供可靠審查的不可變 ref 和/或 SHA
- 包含 `plugins/external.json` 所需的 Metadata（`name`、`description`、`version`、`author.name`、`repository`、`keywords` 和 `source`），以及任何提供的首頁/授權欄位
- 沒有明顯重複現有的市集條目
- 持續符合此存放庫的內容、安全性和負責任的 AI 策略

##### 審核頻率與標籤語義

- `external-plugin`：套用於每個公眾外部外掛程式提交，並保留在已核准的 Issue 上，以便排定的審核自動化程式稍後能找到它們
- `awaiting-review`：自動化程式完成驗證 Issue 之前的初始收錄狀態
- `ready-for-review`：Issue 已通過自動化收錄檢查，正在等待維護者的決定
- `requires-submitter-fixes`：自動化收錄程序發現元資料或品質閘道問題；需要提交者進行更新，然後才能進行人工審核
- `approved`：Issue 已獲核准並關閉，可作為每六個月重新審核的真實來源 (source of truth)
- `rejected`：Issue 被拒絕並關閉，且未新增至市集中
- `re-review-due`：已核准的 Issue 已達到六個月的審核門檻，正在等待維護者的重新審核決定
- `re-review-follow-up`：維護者審核了外掛程式，並在續訂或移除前要求更多後續行動
- `removed`：外掛程式在重新審核後已從 `plugins/external.json` 中移除，不應再被視為活動狀態

六個月的重新審核期從已核准的提交 Issue **關閉**時開始。每晚運行的工作流程會尋找標有 `external-plugin` 和 `approved` 且 `closed_at` 至少已過六個月的關閉 Issue，套用 `re-review-due` 標籤，並開啟或更新一個面向維護者的追蹤 Issue，其中連結了每個目前到期的外掛程式。

維護者在**原始核准提交的 Issue** 上使用以下其中一個 Issue 評論指令來完成重新審核：

- `/re-review-keep` — 透過重新開啟並重新關閉已核准的 Issue，將列表續訂六個月，這會重置 `closed_at` 審核錨點並移除到期標籤
- `/re-review-needs-changes` — 將列表保留在到期佇列中，同時新增 `re-review-follow-up`，以便維護者追蹤額外的調查或修復工作
- `/re-review-remove` — 針對 `staged` 分支開啟或更新 PR，將外掛程式從 `plugins/external.json` 中移除並重新產生市集輸出內容；在該移除操作正式生效前，Issue 會一直保留在到期佇列中

已核准的提交會根據 [Claude Code 外掛程式市集規格](https://code.claude.com/docs/en/plugin-marketplaces#plugin-entries) 轉換為 `plugins/external.json` 條目。典型的 GitHub 託管條目如下所示：

```json
[
  {
    "name": "my-external-plugin",
    "description": "外部外掛程式的描述",
    "version": "1.0.0",
    "author": {
      "name": "外掛程式作者",
      "url": "https://github.com/plugin-author"
    },
    "homepage": "https://github.com/owner/plugin-repo",
    "keywords": ["category", "workflow"],
    "license": "MIT",
    "repository": "https://github.com/owner/plugin-repo",
    "source": {
      "source": "github",
      "repo": "owner/plugin-repo",
      "path": ".github/plugins/my-external-plugin",
      "ref": "v1.0.0",
      "sha": "0123456789abcdef0123456789abcdef01234567"
    }
  }
]
```

### 新增 Hook (Adding Hooks)

Hook 啟用了由 GitHub Copilot 編碼 Agent 工作階段期間特定事件觸發的自動化工作流程，例如工作階段開始、工作階段結束、使用者提示詞與工具使用。

1. **建立新的 Hook 資料夾**：在 `hooks/` 目錄中新增一個資料夾，並使用具描述性、小寫且帶有連字號的名稱（例如：`session-logger`）
2. **建立 `README.md`**：新增一個包含 Frontmatter 的 `README.md` 檔案，其中包含 `name`、`description` 以及選用的 `tags`
3. **建立 `hooks.json`**：遵循 [GitHub Copilot Hooks 規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks) 新增一個具備 Hook 組態的 `hooks.json` 檔案
4. **新增搭售指令碼**：包含 Hook 需要的任何指令碼或資產，並將其設為可執行 (`chmod +x script.sh`)
5. **更新 README**：執行 `npm run build` 以更新產生的 README 表格

#### 範例 Hook 結構 (Example hook structure)

```
hooks/my-hook/
├── README.md       # 具備 Frontmatter 的 Hook 文件
├── hooks.json      # Hook 事件組態
└── my-script.sh    # 搭售的指令碼
```

#### 範例 README.md Frontmatter (Example README.md frontmatter)

```markdown
---
name: "我的 Hook 名稱"
description: "此 Hook 功能的簡短描述"
tags: ["記錄", "自動化"]
---

# 我的 Hook 名稱

關於此 Hook 的詳細文件...
```

#### Hook 指引 (Hook Guidelines)

- **事件組態 (Event configuration)**：在 `hooks.json` 中定義 Hook 事件 —— 支援的事件包含工作階段開始、工作階段結束、使用者提示詞與工具使用
- **可執行指令碼 (Executable scripts)**：確保所有搭售的指令碼皆為可執行，且在 `README.md` 與 `hooks.json` 中均有引用
- **注重隱私 (Privacy aware)**：請留意您的 Hook 收集或記錄了哪些資料
- **清晰的文件 (Clear documentation)**：說明安裝步驟、組態選項以及此 Hook 的功能
- 遵循 [GitHub Copilot Hooks 規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)

### 新增 Agentic Workflow (Adding Agentic Workflows)

[Agentic Workflow](https://github.github.com/gh-aw) 是 AI 驅動的儲存庫自動化，可在 GitHub Actions 中執行編碼 Agent。它們以 Markdown 定義並包含自然語言指令，可透過內建防護措施實現排程與事件觸發的自動化。

1. **建立您的 Workflow 檔案**，在 `workflows/` 目錄中新增一個 `.md` 檔案（例如：[`daily-issues-report.md`](./workflows/daily-issues-report.md)）
2. **包含 Frontmatter**，其中包含 `name` 與 `description`，接著是 Agentic Workflow Frontmatter (`on`, `permissions`, `safe-outputs`) 與自然語言指令
3. **於本地端測試**，執行 `gh aw compile --validate --no-emit daily-issues-report.md` 以驗證其是否有效
4. **更新 README**，執行 `npm run build` 以更新產生的 README 表格

> **注意：** 僅接受 `.md` 檔案 —— 請勿包含編譯後的 `.lock.yml` 或 `.yml` 檔案。CI 將會封鎖它們。

#### Workflow 檔案範例 (Workflow file example)

```markdown
---
name: "Daily Issues Report"
description: "Generates a daily summary of open issues and recent activity as a GitHub issue"
on:
  schedule: daily on weekdays
permissions:
  contents: read
  issues: read
safe-outputs:
  create-issue:
    title-prefix: "[daily-report] "
    labels: [report]
---

## 每日 Issue 報告 (Daily Issues Report)

為團隊建立開啟中 Issue 的每日摘要。

## 包含內容 (What to Include)

- 過去 24 小時內新開啟的 Issue
- 已關閉或已解決的 Issue
- 需要關注的過期 Issue
```

#### Workflow 指引 (Workflow Guidelines)

- **安全性優先 (Security first)**：使用最低權限許可並使用安全輸出 (safe outputs)，而非直接寫入存取
- **清晰的指令 (Clear instructions)**：在 Workflow 主體中使用清晰的自然語言撰寫指令
- **具描述性的名稱 (Descriptive names)**：使用小寫且帶有連字號的檔名（例如：`daily-issues-report.md`）
- **於本地端測試 (Test locally)**：使用 `gh aw compile --validate` 驗證您的 Workflow 是否可編譯
- **無編譯檔案 (No compiled files)**：僅提交 `.md` 原始檔案 —— 不接受 `.lock.yml` 與 `.yml` 檔案
- 在 [Agentic Workflows 文件](https://github.github.com/gh-aw) 瞭解更多資訊

## 提交您的貢獻 (Submitting Your Contribution)

1. **Fork 此儲存庫**
2. **從 `staged` 分支建立一個新分支** 來提交您的貢獻。**這一點非常重要** — 請確保分支是從 `staged` 建立，而非 `main`。從 `main` 建立的分支會導致合併衝突並延誤處理您的貢獻，或可能會被直接拒絕。
3. 遵循上述指引 **新增您的指令、技能、Agent、Workflow 或外掛程式**
4. **執行更新指令碼**：`npm start` 以使用您的新檔案更新 README（請確保您已先執行過 `npm install`）
   - GitHub Actions 工作流程將會驗證此步驟是否已正確執行
   - 如果執行指令碼會導致 README.md 被修改，PR 檢查將會失敗並顯示包含所需變更的留言
5. **提交一個 Pull Request** 到 `staged` 分支，並包含：
   - 描述您貢獻的清晰標題
   - 關於您的指令/技能/Agent 功能的簡短描述
   - 任何相關的背景資訊或使用說明

> [!IMPORTANT]
> 所有 Pull Request 應以 **`staged`** 分支為目標，而非 `main`。

> [!IMPORTANT]
> 如果您是 AI 代理程式，請遵循我們的最佳化貢獻流程：請在 Pull Request 標題末尾加入 `🤖🤖🤖`，以便加速審核與合併。

## 貢獻者認可 (Contributor Recognition)

我們使用 [all-contributors](https://github.com/all-contributors/all-contributors) 來認可對此專案的 **所有類型貢獻**。

若要新增您自己，請在相關的 Issue 或 Pull Request 中使用您的 GitHub 使用者名稱與適當的貢獻類型發表留言：

```markdown
@all-contributors add @username for contributionType1, contributionType2
```

貢獻者清單會在每週日 **3:00 AM UTC** 自動更新。當下次執行完成時，您的名字將會出現在 [README 貢獻者](./README.md#contributors-) 區段。

### 貢獻類型 (Contribution Types)

我們歡迎多種貢獻，包含下列自訂類別：

| 類別 (Category)         | 描述 (Description)                          | 表情符號 (Emoji) |
| ----------------------- | ------------------------------------------- | :--------------: |
| **指令 (Instructions)** | 指導 GitHub Copilot 行為的自訂指令集        |        🧭         |
| **Agent**               | 定義的 GitHub Copilot 角色或個性            |        🎭         |
| **技能 (Skills)**       | 針對 GitHub Copilot 任務的專業知識          |        🧰         |
| **Workflow**            | 用於 AI 驅動儲存庫自動化的 Agentic Workflow |        ⚡         |
| **外掛程式 (Plugins)**  | 相關提示詞、Agent 或技能的可安裝套件        |        🎁         |

此外，所有 [All Contributors](https://allcontributors.org/emoji-key/) 支援的標準貢獻類型均會獲得認可。

> 每一份貢獻都很重要。感謝您協助改善 GitHub Copilot 社群的這項資源。

## 行為準則 (Code of Conduct)

請注意，此專案維護遵循[貢獻者行為準則](CODE_OF_CONDUCT.md)。參與此專案即代表您同意遵守其條款。

## 授權條款 (License)

透過向此儲存庫做出貢獻，即代表您同意您的貢獻將依據 MIT 授權條款進行授權。
