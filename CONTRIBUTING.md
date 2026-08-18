# 為 Awesome GitHub Copilot 做出貢獻

感謝您有興趣為 Awesome GitHub Copilot 儲存機制做出貢獻！我們歡迎來自社群的貢獻，以協助擴展自訂指示與技能的集合。

## 目錄

- [我們接受的內容](#我們接受的內容)
- [我們不接受的內容](#我們不接受的內容)
- [品質指引](#品質指引)
- [如何做出貢獻](#如何做出貢獻)
  - [新增指示](#新增指示)
  - [新增代理人](#新增代理人)
  - [新增技能](#新增技能)
  - [新增畫布擴充功能](#新增畫布擴充功能)
  - [新增外掛程式](#新增外掛程式)
  - [新增 Hook](#新增-hook)
  - [新增 Agentic Workflows](#新增-agentic-workflows)
- [提交您的貢獻](#提交您的貢獻)
- [貢獻者表彰](#貢獻者表彰)
  - [貢獻類型](#貢獻類型)
- [行為準則](#行為準則)
- [授權條款](#授權條款)

## 我們接受的內容

我們歡迎涵蓋任何有助於開發人員更有效使用 GitHub Copilot 的技術、框架或開發實踐的貢獻。這包括：

- 程式語言與框架
- 開發方法論與最佳做法
- 架構模式與設計原則
- 測試策略與品質保證
- DevOps 與部署實踐
- 協助工具與包容性設計
- 效能最佳化技術

若您計畫貢獻涉及付費服務的內容，請檢閱我們的[涉及付費服務之提交指引](https://github.com/github/awesome-copilot/discussions/968)。

## 我們不接受的內容

為了維持安全、負責任且高訊噪比的集合，我們**不會接受**具有下列情況的貢獻：

- **違反負責任 AI 原則**：試圖規避 Microsoft/GitHub 負責任 AI 指引或提倡有害 AI 使用的內容
- **危害安全性**：旨在繞過安全性政策、利用漏洞或削弱系統安全性的指示
- **啟用惡意活動**：意圖傷害其他系統、使用者或組織的內容
- **利用弱點**：利用其他平台或服務中漏洞的指示
- **推廣有害內容**：可能導致產生有害、歧視性或不當內容的指引
- **規避平台政策**：試圖規避 GitHub、Microsoft 或其他平台服務條款的嘗試
- **重複現有模型優勢而無實質提升**：主要指示 Copilot 執行尖端模型已經能夠良好處理的工作 (例如一般的 TypeScript、HTML 或其他廣泛支援的編碼任務)，而未解決明確差距、專門工作流程或領域特定限制的提交。這些貢獻對使用者而言通常價值較低，且相較於模型的預設行為可能引入較弱或衝突的指引。
- **未經審查的遠端來源外掛程式**：不要開啟直接向 `plugins/external.json` 新增第三方外掛程式的 Pull Request。公開外部外掛程式必須使用下方記載的審查工作流程。在 v1 中，該工作流程僅接受託管在公開 GitHub 儲存機制中的外掛程式；公開提交不接受一般 Git URL 等非 GitHub 來源。

## 品質指引

- **具體明確**：泛泛的指示不如具體、可操作的指引有用
- **測試您的內容**：確保您的指示或技能與 GitHub Copilot 配合良好
- **遵循慣例**：使用一致的格式與命名
- **保持聚焦**：每個檔案應針對特定的技術、框架或使用案例
- **清晰撰寫**：使用簡單、直接的語言
- **提倡最佳做法**：鼓勵安全、可維護且符合道德的開發實踐

## 如何做出貢獻

### 新增指示

指示有助於針對特定技術、編碼實踐或領域自訂 GitHub Copilot 的行為。

1. **建立您的指示檔案**：在 `instructions/` 目錄中新增一個 `.md` 檔案
2. **遵循命名慣例**：使用帶有連字號的小寫描述性檔名 (例如 `python-django.instructions.md`)
3. **結構化您的內容**：以清晰的標題開頭並以邏輯方式組織您的指示
4. **測試您的指示**：確保您的指示與 GitHub Copilot 配合良好

#### 範例指示格式

```markdown
---
description: "Instructions for customizing GitHub Copilot behavior for specific technologies and practices"
---

# Your Technology/Framework Name

## Instructions

- Provide clear, specific guidance for GitHub Copilot
- Include best practices and conventions
- Use bullet points for easy reading

## Additional Guidelines

- Any additional context or examples
```

### 新增代理人

代理人是專門的組態設定，可將 GitHub Copilot Chat 轉變為針對特定開發情境的領域專用助理或角色。

1. **建立您的代理人檔案**：在 `agents/` 目錄中新增一個 `.agent.md` 檔案
2. **遵循命名慣例**：使用帶有連字號與 `.agent.md` 副檔名的小寫描述性檔名 (例如 `react-performance-expert.agent.md`)
3. **包含 Frontmatter**：在檔案頂部新增帶有必填欄位的中繼資料
4. **定義角色**：為代理人建立明確的身分識別與專業領域
5. **測試您的代理人**：確保代理人在其領域內提供有幫助、準確的回應

#### 範例代理人格式

```markdown
---
description: "Brief description of the agent and its purpose"
model: "gpt-5"
tools: ["codebase", "terminalCommand"]
name: "My Agent Name"
---

You are an expert [domain/role] with deep knowledge in [specific areas].

## Your Expertise

- [Specific skill 1]
- [Specific skill 2]
- [Specific skill 3]

## Your Approach

- [How you help users]
- [Your communication style]
- [What you prioritize]

## Guidelines

- [Specific instructions for responses]
- [Constraints or limitations]
- [Best practices to follow]
```

### 新增技能

技能是 `skills/` 目錄中的獨立資料夾，包含 `SKILL.md` 檔案 (帶有 Front Matter) 與選用的隨附資產。

1. **建立新技能資料夾**：執行 `npm run skill:create -- --name <skill-name> --description "<skill description>"`
2. **編輯 `SKILL.md`**：確保 `name` 與資料夾名稱相符 (小寫帶連字號)，且 `description` 清晰且非空
3. **新增選用資產**：保持隨附資產大小合理 (每個小於 5MB)，並在 `SKILL.md` 中引用它們
4. **驗證並更新文件**：執行 `npm run skill:validate`，然後執行 `npm run build` 以更新產生的 README 表格

### 新增畫布擴充功能

畫布擴充功能作為可重複使用的原始碼元件位於 `extensions/<extension-id>/` 中。它們僅透過 `plugins/` 中的外掛程式資訊清單發布。

1. **建立/更新擴充功能原始碼**：新增或更新 `extensions/<extension-id>/extension.mjs`
2. **註冊擴充功能外掛程式**：新增 `plugins/<extension-id>/plugin.json`：
   - 必填：`name` (符合資料夾名稱)、`description`、`version`
   - 選填：`author`、`keywords`
   - `extensions.com.github.copilot.logo` **必須**完全為 `"assets/preview.png"`
3. **螢幕截圖需求**：建立 `assets/preview.png` 作為您的主要視覺資產
4. **不要新增 `canvas.json`**：擴充功能網站中繼資料來自相符的外掛程式資訊清單
5. **提交前驗證**：執行 `npm run plugin:validate` 檢查是否符合慣例

### 新增外掛程式

外掛程式將相關的代理人、Hook 與技能圍繞特定主題或工作流程進行分組，使使用者能夠透過 GitHub Copilot CLI 輕鬆安裝全面的工具包。

1. **建立您的外掛程式**：執行 `npm run plugin:create` 搭架新外掛程式
2. **遵循命名慣例**：使用帶有連字號的小寫描述性資料夾名稱 (例如 `python-web-development`)
3. **定義您的內容**：在 `plugin.json` 中的 `extensions.com.github.awesome-copilot` 下列出代理人、Hook、技能與可重複使用的擴充功能
4. **測試您的外掛程式**：執行 `npm run plugin:validate` 驗證您的外掛程式結構

#### 建立外掛程式

```bash
npm run plugin:create -- --name my-plugin-id
```

#### 外掛程式結構

```
plugins/my-plugin-id/
├── plugin.json                # Plugin metadata
└── README.md                   # Plugin documentation
```

> **注意：** 外掛程式內容在 plugin.json 中以宣告方式定義於 `extensions.com.github.awesome-copilot` 下。原始碼檔案位於最上層目錄，並由 CI 具體化為外掛程式。技能在 `skills/` 下發出；Copilot 專屬代理人、Hook 與擴充功能在 `com.github.copilot/` 下發出。此儲存機制命名空間會從提供的資訊清單中移除。

#### plugin.json 範例

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "my-plugin-id",
  "description": "Plugin description",
  "version": "1.0.0",
  "keywords": [],
  "author": { "name": "Awesome Copilot Community" },
  "repository": "https://github.com/github/awesome-copilot",
  "license": "MIT",
  "extensions": {
    "com.github.awesome-copilot": {
      "agents": ["./agents/my-agent.md"],
      "skills": ["./skills/my-skill/"]
    }
  }
}
```

#### 外掛程式指引

- **宣告式內容**：外掛程式內容指定於 `extensions.com.github.awesome-copilot` 下 — 原始碼檔案位於最上層目錄，並由 CI 具體化為外掛程式。技能使用標準的 `skills/` 目錄；Copilot 專屬內容使用 `com.github.copilot/`。
- **有效參照**：plugin.json 中參照的所有路徑必須指向儲存機制中現有的原始碼檔案
- **可重複使用擴充功能**：精選外掛程式可透過在 `extensions.com.github.awesome-copilot.extensions` 下新增 `./extensions/<name>` 路徑來搭售擴充功能；同一個擴充功能可由多個外掛程式列出
- **排除指示**：指示是獨立資源，不屬於外掛程式的一部分
- **明確用途**：外掛程式應解決特定問題或工作流程
- **提交前驗證**：執行 `npm run plugin:validate` 確保您的外掛程式有效

#### 新增外部外掛程式

外部外掛程式是託管在此儲存機制外部並列在 `plugins/external.json` 中的外掛程式。公開貢獻者**不應**開啟直接編輯 `plugins/external.json` 的 PR。而是應透過下方的公開審查工作流程提交外部外掛程式。

> [!IMPORTANT]
> 公開外部外掛程式提交在 v1 中僅限 GitHub。提交的外掛程式必須位於公開的 GitHub 儲存機制中，並使用 `source.source: "github"`。

##### 提交欄位

外部外掛程式 Issue 表單將收集以下欄位：

- 外掛程式名稱 (Plugin name)
- 簡短描述 (Short description)
- 格式為 `owner/repo` 的 GitHub 儲存機制
- 儲存機制內的外掛程式路徑 (當外掛程式位於儲存機制根目錄時為選填)
- 要審查的 Ref (`ref`)，使用發布標籤 (release tag) 或標籤 ref 而非分支
- 要審查的提交 SHA (`sha`)，使用完整的 40 字元提交 SHA
- 外掛程式版本 (Plugin version)
- 授權條款識別碼 (License identifier)
- 作者姓名 (Author name)
- 作者 URL (選填)
- 首頁 URL (選填)
- 關鍵字/標籤 (Keywords/tags)
- 給審查者的額外注意事項 (選填)
- 確認核取方塊：儲存機制為公開、提交的 ref 及/或 sha 為不可變、提交遵循此儲存機制政策，且外掛程式不是重複清單

儲存機制規範的驗證規則位於 `eng/external-plugin-validation.mjs` 中。建置指令碼重複使用該模組中的 `marketplace` 政策，而 Issue 攝取自動化使用更嚴格的 `publicSubmission` 政策，以便 JSON 合約與工作流程檢查保持一致。

對於提交至 `plugins/external.json` 的項目，目前的 marketplace 驗證需要：

- `name`、`description` 與 `version` (有效的[語意化版本](https://semver.org)，例如 `1.2.3`)
- `author.name` (以及存在時有效的 `author.url` 與 `author.email`)
- 作為 HTTPS GitHub URL 的 `repository`
- 作為小寫帶連字號標籤的 `keywords`
- `license` 提供時，建議為 [SPDX 識別碼或運算式](https://spdx.org/licenses) (例如 `MIT`、`Apache-2.0`、`MIT OR Apache-2.0`)，但允許非 SPDX 或專有授權條款且僅產生警告
- `source.source: "github"` 加上 `owner/repo` 格式的 `source.repo`
- 選用的 `source.path` 值：`/` 表示儲存機制根目錄，或外掛程式結構開始的相對儲存機制資料夾 (不要直接指向 `plugin.json`)

驗證亦會發出非致命警告以及早發現錯誤：未知/拼錯的最上層、`author` 或 `source` 欄位；非已識別 SPDX 識別碼的 `license` 值 (允許非 SPDX/專有授權條款，不會拒絕)；以及其 `source` 省略不可變 `ref`/`sha` 定位器的 marketplace 項目。相同的 `license` 驗證與本機外掛程式 `plugin.json` 資訊清單共享，以確保兩者檢查一致。

公開提交政策建立在這些規則之上，並額外需要 `license` 加上至少一個不可變的來源定位器：`source.ref`、`source.sha` 或兩者。

##### 審查工作流程

1. 使用外部外掛程式 Issue 表單**開啟一個 Issue**。自動化會套用 `external-plugin` 與 `awaiting-review` 標籤。
2. **自動化攝取驗證**檢查 GitHub 託管外掛程式所需的欄位是否存在且格式正確。無效的提交會被標記為 `requires-submitter-fixes`，並附帶留言說明在維護者審查之前必須修正的內容。
3. 中繼資料驗證後執行**自動化品質關卡**：
   - 針對提交的外掛程式路徑/ref/sha 執行 `vally lint`
   - 透過 Copilot CLI 針對從提交內容產生的暫時性 marketplace 項目執行安裝冒煙測試 (smoke test)
4. **準備供維護者審查**：若中繼資料驗證與品質關卡通過，自動化會移除 `awaiting-review` 並新增 `ready-for-review`。
5. **提交者修正阻礙**：若中繼資料有效但品質關卡失敗，自動化會套用 `requires-submitter-fixes` 而非推進到人工審查。
6. **請求另一次攝取檢查**：更新 Issue 內文或來源外掛程式後，Issue 作者或維護者可留言 `/rerun-intake` 以依需求重新執行自動化攝取與品質關卡。開啟的 Issue 在編輯時會自動重新觸發攝取；已關閉且經維護者拒絕的 Issue 需要 `/rerun-intake`。當重新執行被接受時，自動化會對命令留言以 👀 做出反應，以便清楚看出處理已開始。
7. **維護者覆寫路徑**：具備寫入權限的維護者可留言 `/mark-ready-for-review [optional reason]` 以明確將 `requires-submitter-fixes` Issue 移至 `ready-for-review`。
8. **維護者決定**：一旦處於 `ready-for-review`，具備寫入權限的維護者會執行手動審查，然後在 Issue 上留言 `/approve` 或 `/reject <reason>`。非維護者的命令將被忽略。
9. **核准路徑**：收到 `/approve` 時，自動化會移除 `ready-for-review`、新增 `approved`、關閉 Issue，並開啟或更新針對 `main` 的 PR 以更新 `plugins/external.json` 與產生的 marketplace 輸出。
10. **拒絕路徑**：收到 `/reject <reason>` 時，自動化會移除 `ready-for-review`、新增 `rejected`、關閉 Issue，並在 Issue 留言中記錄原因。解決意見回饋後，更新同一個 Issue 並使用 `/rerun-intake` 重新排隊進行攝取。

##### 透過 PR 更新列出的外部外掛程式

當 Pull Request 更新 `plugins/external.json` 時 (例如先前核准清單的版本更新)，自動化會執行 PR 品質檢查並直接在 PR 上發布結果：

1. **偵測變更項目**：自動化識別 PR 中新增/更新的外部外掛程式項目。
2. **執行品質關卡**：自動化針對每個變更的外掛程式來源 ref/SHA/路徑執行安裝冒煙測試與 `vally lint` 檢查。
3. **發布來源連結**：自動化更新 Bot 留言，附帶每個外掛程式的結果與指向每個外掛程式來源位置的直接 GitHub 樹狀目錄連結。
4. **同步 PR 上的工作流程狀態標籤**：
   - 當所有檢查通過時為 `ready-for-review`
   - 當因外掛程式問題導致品質檢查失敗時為 `requires-submitter-fixes`
   - 當因基礎架構/暫時性錯誤導致檢查無法完成時為 `awaiting-review`

##### 維護者審查職責

維護者負責確認該提交：

- 明確符合 Awesome Copilot 集合，並在現有清單之外增加價值
- 使用公開的 GitHub 儲存機制與可可靠審查的不可變 ref 及/或 SHA
- 包含 `plugins/external.json` 所需的中繼資料 (`name`、`description`、`version`、`author.name`、`repository`、`keywords` 與 `source`)，以及任何提供的首頁/授權條款欄位
- 沒有明顯重複現有的 marketplace 項目
- 持續符合本儲存機制的內容、安全性與負責任 AI 政策

##### 審查週期與標籤語意

- `external-plugin`：套用至每個公開外部外掛程式提交，並保留在已核准的 Issue 上，以便排程審查自動化稍後能找到它們
- `awaiting-review`：自動化完成 Issue 驗證前的初始攝取狀態
- `ready-for-review`：Issue 通過自動化攝取檢查並等待維護者決定的狀態
- `requires-submitter-fixes`：自動化攝取發現中繼資料或品質關卡問題；人工審查前需要提交者更新
- `approved`：Issue 已獲核准、關閉，並可用作六個月重新審查的事實來源
- `rejected`：Issue 已被拒絕並關閉，未新增至 marketplace
- `re-review-due`：已核准的 Issue 達到六個月審查臨界值並等待維護者重新審查決定
- `re-review-follow-up`：維護者審查了外掛程式並在續訂或移除之前請求進一步跟進
- `removed`：重新審查後外掛程式已從 `plugins/external.json` 中移除，不應再視為作用中

六個月的重新審查時間範圍從已核准的提交 Issue **關閉**時開始。每夜工作流程會尋找標記為 `external-plugin` 與 `approved` 且其 `closed_at` 至少已六個月的已關閉 Issue，套用 `re-review-due`，並開啟或更新面向維護者的追蹤 Issue，其中連結目前到期的每個外掛程式。

維護者在**原始已核准的提交 Issue** 上使用以下 Issue 命令之一完成重新審查：

- `/re-review-keep` — 透過重新開啟並重新關閉已核准的 Issue 將清單續訂六個月，這會重設 `closed_at` 審查錨點並移除到期標籤
- `/re-review-needs-changes` — 將清單保留在到期佇列中，同時新增 `re-review-follow-up` 以便維護者追蹤額外的調查或補救修復工作
- `/re-review-remove` — 開啟或更新針對 `main` 的 PR 以從 `plugins/external.json` 中移除外掛程式並重新產生 marketplace 輸出；在該移除合併之前，Issue 會保留在到期佇列中

核准的提交會遵循 [Claude Code 外掛程式 marketplace 規範](https://code.claude.com/docs/en/plugin-marketplaces#plugin-entries) 轉換為 `plugins/external.json` 項目。典型的 GitHub 託管項目如下所示：

```json
[
  {
    "name": "my-external-plugin",
    "description": "Description of the external plugin",
    "version": "1.0.0",
    "author": {
      "name": "Plugin Author",
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

### 新增 Hook

Hook 支援在 GitHub Copilot 編程代理人工作階段期間由特定事件 (例如工作階段開始、工作階段結束、使用者提示與工具使用) 觸發的自動化工作流程。

1. **建立新 Hook 資料夾**：在 `hooks/` 目錄中新增一個具有描述性、小寫帶連字號名稱的資料夾 (例如 `session-logger`)
2. **建立 `README.md`**：新增包含 Frontmatter (含 `name`、`description` 與選用的 `tags`) 的 `README.md` 檔案
3. **建立 `hooks.json`**：新增符合 [GitHub Copilot hooks 規範](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks) 的 Hook 組態檔案 `hooks.json`
4. **新增隨附指令碼**：包含 Hook 所需的任何指令碼或資產，並使其可執行 (`chmod +x script.sh`)
5. **更新 README**：執行 `npm run build` 更新產生的 README 表格

#### 範例 Hook 結構

```
hooks/my-hook/
├── README.md       # Hook documentation with frontmatter
├── hooks.json      # Hook event configuration
└── my-script.sh    # Bundled script(s)
```

#### 範例 README.md Frontmatter

```markdown
---
name: "My Hook Name"
description: "Brief description of what this hook does"
tags: ["logging", "automation"]
---

# My Hook Name

Detailed documentation about the hook...
```

#### Hook 指引

- **事件組態**：在 `hooks.json` 中定義 Hook 事件 — 支援的事件包括工作階段開始、工作階段結束、使用者提示與工具使用
- **可執行指令碼**：確保所有隨附指令碼皆可執行，並在 `README.md` 與 `hooks.json` 中同時引用
- **注重隱私**：請注意您的 Hook 收集或記錄了什麼資料
- **清晰文件**：解釋安裝步驟、組態選項以及 Hook 的功能
- 遵循 [GitHub Copilot hooks 規範](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)

### 新增 Agentic Workflows

[Agentic Workflows](https://github.github.com/gh-aw) 是在 GitHub Actions 中執行編程代理人的 AI 驅動儲存機制自動化工具。它們以包含自然語言指示的 Markdown 定義，支援具有內建防護機制的排程與事件觸發自動化。

1. **建立您的工作流程檔案**：在 `workflows/` 目錄中新增一個 `.md` 檔案 (例如 [`daily-issues-report.md`](./workflows/daily-issues-report.md))
2. **包含 Frontmatter**：包含 `name` 與 `description`，其後接 Agentic Workflow Frontmatter (`on`、`permissions`、`safe-outputs`) 與自然語言指示
3. **本機測試**：使用 `gh aw compile --validate --no-emit daily-issues-report.md` 進行測試以驗證其有效性
4. **更新 README**：執行 `npm run build` 更新產生的 README 表格

> **注意：** 僅接受 `.md` 檔案 — 不要包含已編譯的 `.lock.yml` 或 `.yml` 檔案。CI 將會阻擋它們。

#### 工作流程檔案範例

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

## Daily Issues Report

Create a daily summary of open issues for the team.

## What to Include

- New issues opened in the last 24 hours
- Issues closed or resolved
- Stale issues that need attention
```

#### 工作流程指引

- **安全性第一**：使用最低權限與安全輸出，而非直接寫入存取權
- **清晰指示**：在工作流程主體中撰寫清晰的自然語言指示
- **描述性名稱**：使用小寫帶連字號的檔名 (例如 `daily-issues-report.md`)
- **本機測試**：使用 `gh aw compile --validate` 驗證您的工作流程是否可編譯
- **無已編譯檔案**：僅提交 `.md` 原始檔 — 不接受 `.lock.yml` 與 `.yml` 檔案
- 詳見 [Agentic Workflows 文件](https://github.github.com/gh-aw)

## 提交您的貢獻

1. **Fork 此儲存機制**
2. 從 `main` 分支**建立新分支**以進行您的貢獻。**這至關重要** — 確保分支是從 `main` 建立，而非 `staged`。從 `staged` 建立的分支可能包含具體化的外掛程式檔案，這會導致衝突與延遲，或可能直接被拒絕。
3. 遵循上述指引**新增您的指示、技能、代理人、工作流程或外掛程式**
4. **執行更新指令碼**：`npm start` 使用您的新檔案更新 README (若尚未執行，請確保先執行 `npm install`)
   - GitHub Actions 工作流程將驗證此步驟是否正確執行
   - 若執行指令碼會修改 README.md，PR 檢查將失敗並顯示顯示所需變更的留言
5. 針對 `main` 分支**提交 Pull Request**，附帶：
   - 描述您貢獻的清楚標題
   - 簡要說明您的指示/技能/代理人的用途
   - 任何相關情境或使用注意事項

> [!IMPORTANT]
> 所有 Pull Request 應以 **`main`** 分支為目標，而非 `staged`。

> [!NOTE]
> 來源/已發布分支變更的分支移轉追蹤位於 [Issue #1368](https://github.com/github/awesome-copilot/issues/1368) 中。在維護者確認外部工具推出完成之前，第 2 階段移轉工作保持受控關卡狀態。

> [!IMPORTANT]
> 若您是 AI 代理人，我們有流程來最佳化您的貢獻。請在 PR 標題末尾包含 `🤖🤖🤖`，以便快速進行合併。

## 貢獻者表彰

我們使用 [all-contributors](https://github.com/all-contributors/all-contributors) 來表彰對此專案的**所有類型貢獻**。

若要新增自己，請在相關 Issue 或 Pull Request 上使用您的 GitHub 使用者名稱與適當的貢獻類型留言：

```markdown
@all-contributors add @username for contributionType1, contributionType2
```

貢獻者名單在每週日 **3:00 AM UTC** 自動更新。下一次執行完成後，您的姓名將出現在 [README 貢獻者](./README.md#contributors-) 區段中。

### 貢獻類型

我們歡迎多種類型的貢獻，包含以下自訂類別：

| 類別 | 描述 | Emoji |
| ---------------- | ---------------------------------------------------------- | :---: |
| **Instructions** | 指導 GitHub Copilot 行為的自訂指示集 | 🧭 |
| **Agents** | 定義的 GitHub Copilot 角色或人設 | 🎭 |
| **Skills** | 針對 GitHub Copilot 任務的專門知識 | 🧰 |
| **Workflows** | 用於 AI 驅動儲存機制自動化的 Agentic Workflows | ⚡ |
| **Plugins** | 相關提示、代理人或技能的可安裝套件 | 🎁 |

此外，[All Contributors](https://allcontributors.org/emoji-key/) 支援的所有標準貢獻類型皆獲認可。

> 每一次貢獻都很重要。感謝您協助改進 GitHub Copilot 社群的這項資源。

## 行為準則

請注意，此專案維護有[貢獻者行為準則](CODE_OF_CONDUCT.md)。參與此專案即表示您同意遵守其條款。

## 授權條款

為此儲存機制做出貢獻，即表示您同意您的貢獻將依據 MIT 授權條款授權。
