# 貢獻至 Awesome GitHub Copilot

感謝您對 Awesome GitHub Copilot 存放區的貢獻感興趣！我們歡迎社群的貢獻，以協助擴充我們的自定義指引與技能集合。

## 目錄

- [貢獻至 Awesome GitHub Copilot](#貢獻至-awesome-github-copilot)
  - [目錄](#目錄)
  - [如何貢獻](#如何貢獻)
    - [新增指引](#新增指引)
      - [範例指引格式](#範例指引格式)
    - [新增代理程式](#新增代理程式)
      - [範例代理程式格式](#範例代理程式格式)
    - [新增技能](#新增技能)
    - [新增外掛程式](#新增外掛程式)
      - [建立外掛程式](#建立外掛程式)
      - [外掛程式結構](#外掛程式結構)
      - [plugin.json 範例](#pluginjson-範例)
      - [外掛程式指引](#外掛程式指引)
      - [新增外部外掛程式](#新增外部外掛程式)
    - [新增勾點](#新增勾點)
      - [範例勾點結構](#範例勾點結構)
      - [範例 README.md Front Matter](#範例-readmemd-front-matter)
      - [勾點指引](#勾點指引)
    - [新增代理型工作流程](#新增代理型工作流程)
      - [工作流程檔案範例](#工作流程檔案範例)
      - [工作流程指引](#工作流程指引)
  - [提交您的貢獻](#提交您的貢獻)
  - [我們接受的內容](#我們接受的內容)
  - [我們不接受的內容](#我們不接受的內容)
  - [品質指引](#品質指引)
  - [貢獻者認可](#貢獻者認可)
    - [貢獻類型](#貢獻類型)
  - [行為準則](#行為準則)
  - [授權條款](#授權條款)

## 如何貢獻

### 新增指引

指引有助於針對特定技術、編碼實作或領域自定義 GitHub Copilot 的行為。

1. **建立您的指引檔案**：在 `instructions/` 目錄中新增一個 `.md` 檔案
2. **遵循命名慣例**：使用具描述性、小寫且帶連字號的檔名 (例如：`python-django.instructions.md`)
3. **結構化您的內容**：以清晰的標題開始，並有邏輯地組織您的指引
4. **測試您的指引**：確保您的指引能與 GitHub Copilot 良好協作

#### 範例指引格式

```markdown
---
description: '針對特定技術與實作自定義 GitHub Copilot 行為的指引'
---

# 您的技術/框架名稱

## 指引

- 為 GitHub Copilot 提供清晰、具體的引導
- 包含最佳實踐與慣例
- 使用項目符號以便閱讀

## 額外準則

- 任何額外的內容背景或範例
```

### 新增代理程式

代理程式是專門的配置，可將 GitHub Copilot Chat 轉換為針對特定開發情境的領域特定助手或角色。

1. **建立您的代理程式檔案**：在 `agents/` 目錄中新增一個 `.agent.md` 檔案
2. **遵循命名慣例**：使用具描述性、小寫且帶連字號的檔名，並加上 `.agent.md` 副檔名 (例如：`react-performance-expert.agent.md`)
3. **包含 Front Matter**：在檔案頂端加入包含必要欄位的 Metadata
4. **定義角色**：為代理程式建立清晰的身份與專業領域
5. **測試您的代理程式**：確保代理程式在其領域內提供有幫助且準確的回應

#### 範例代理程式格式

```markdown
---
description: '代理程式及其用途的簡短說明'
model: 'gpt-5'
tools: ['codebase', 'terminalCommand']
name: '我的代理程式名稱'
---

您是一位在 [特定領域] 擁有深厚知識的 [領域/角色] 專家。

## 您的專業知識

- [特定技能 1]
- [特定技能 2]
- [特定技能 3]

## 您的作法

- [您如何協助使用者]
- [您的溝通風格]
- [您的優先考量]

## 指導方針

- [針對回應的特定指令]
- [約束或限制]
- [應遵循的最佳實踐]
```

### 新增技能

技能是 `skills/` 目錄中的獨立資料夾，包含一個 `SKILL.md` 檔案 (含 Front Matter) 及選用的隨附資產。

1. **建立新技能資料夾**：執行 `npm run skill:create -- --name <skill-name> --description "<skill description>"`
2. **編輯 `SKILL.md`**：確保 `name` 與資料夾名稱相符 (小寫加連字號)，且 `description` 清晰且非空
3. **加入選用資產**：保持隨附資產大小適中 (每個小於 5MB)，並在 `SKILL.md` 中引用它們
4. **驗證並更新文件**：執行 `npm run skill:validate` 接著執行 `npm run build` 以更新產生的 README 表格

### 新增外掛程式

外掛程式將相關的代理程式、命令與技能圍繞特定主題或工作流程進行分組，讓使用者能輕鬆透過 GitHub Copilot CLI 安裝全面的工具包。

1. **建立您的外掛程式**：執行 `npm run plugin:create` 以建置新外掛程式的基礎結構
2. **遵循命名慣例**：使用具描述性、小寫且帶連字號的資料夾名稱 (例如：`python-web-development`)
3. **定義您的內容**：在 `plugin.json` 中使用 Claude Code 規格欄位列出代理程式、命令與技能
4. **測試您的外掛程式**：執行 `npm run plugin:validate` 以驗證您的外掛程式結構

#### 建立外掛程式

```bash
npm run plugin:create -- --name my-plugin-id
```

#### 外掛程式結構

```
plugins/my-plugin-id/
├── .github/plugin/plugin.json  # 外掛程式 Metadata (Claude Code 規格格式)
└── README.md                   # 外掛程式文件
```

> **註：** 外掛程式內容是在 `plugin.json` 中使用 Claude Code 規格欄位 (`agents`, `commands`, `skills`) 宣告定義的。原始檔案位於頂層目錄，並由 CI 實體化為外掛程式。

#### plugin.json 範例

```json
{
  "name": "my-plugin-id",
  "description": "外掛程式說明",
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

#### 外掛程式指引

- **宣告式內容**：外掛程式內容透過 `plugin.json` 中的 `agents`、`commands` 和 `skills` 陣列指定 — 原始檔案位於頂層目錄，並由 CI 實體化為外掛程式
- **有效引用**：`plugin.json` 中引用的所有路徑必須指向存放區中現有的原始檔案
- **排除指引**：指引是獨立資源，不屬於外掛程式的一部分
- **清晰目的**：外掛程式應解決特定的問題或工作流程
- **提交前驗證**：執行 `npm run plugin:validate` 以確保您的外掛程式有效

#### 新增外部外掛程式

外部外掛程式是託管於本存放區外的外掛（例如：GitHub 倉庫、npm 套件或 git URL）。這些外掛會列在 `plugins/external.json` 中，並在建置期間合併到產生的 `marketplace.json`。

要新增外部外掛程式，請依據 [Claude Code 外掛市場規範](https://code.claude.com/docs/en/plugin-marketplaces#plugin-entries) 在 `plugins/external.json` 中新增一個條目。每個條目需包含 `name`、`source`、`description` 與 `version`：

```json
[
  {
    "name": "my-external-plugin",
    "source": {
      "source": "github",
      "repo": "owner/plugin-repo"
    },
    "description": "Description of the external plugin",
    "version": "1.0.0"
  }
]
```

支援的來源類型：
- **GitHub**: `{ "source": "github", "repo": "owner/repo", "ref": "v1.0.0" }`
- **Git URL**: `{ "source": "url", "url": "https://gitlab.com/team/plugin.git" }`
- **npm**: `{ "source": "npm", "package": "@scope/package", "version": "1.0.0" }`
- **pip**: `{ "source": "pip", "package": "package-name", "version": "1.0.0" }`

編輯 `plugins/external.json` 後，請執行 `npm run build` 以重新產生 `marketplace.json`。

### 新增勾點

勾點可實作由 GitHub Copilot 編碼代理程式工作階段期間的特定事件觸發的自動化工作流程，例如工作階段開始、結束、使用者提示和工具使用。

1. **建立新勾點資料夾**：在 `hooks/` 目錄中新增一個具備描述性、小寫且使用連字號名稱的資料夾 (例如：`session-logger`)
2. **建立 `README.md`**：新增一個 `README.md` 檔案，Front Matter 包含 `name`、`description` 以及選用的 `tags`
3. **建立 `hooks.json`**：新增一個 `hooks.json` 檔案，其中包含遵循 [GitHub Copilot 勾點規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks) 的勾點設定
4. **加入隨附指令碼**：包含勾點所需的任何指令碼或資產，並使其具備執行權限 (`chmod +x script.sh`)
5. **更新 README**：執行 `npm run build` 以更新產生的 README 表格

#### 範例勾點結構

```
hooks/my-hook/
├── README.md       # 包含 Front Matter 的勾點文件
├── hooks.json      # 勾點事件設定
└── my-script.sh    # 隨附指令碼
```

#### 範例 README.md Front Matter

```markdown
---
name: '我的勾點名稱'
description: '此勾點功能的簡短說明'
tags: ['記錄', '自動化']
---

# 我的勾點名稱

關於勾點的詳細文件...
```

#### 勾點指引

- **事件設定**：在 `hooks.json` 中定義勾點事件 — 支援的事件包含工作階段開始、結束、使用者提示與工具使用
- **可執行指令碼**：確保所有隨附指令碼皆具備執行權限，且在 `README.md` 與 `hooks.json` 中皆有引用
- **隱私意識**：注意您的勾點收集或記錄了哪些資料
- **清晰文件**：解釋安裝步驟、設定選項以及勾點的功能
- 遵循 [GitHub Copilot 勾點規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)

### 新增代理型工作流程

[代理型工作流程 (Agentic Workflows)](https://github.github.com/gh-aw) 是在 GitHub Actions 中執行編碼代理程式的 AI 驅動存放區自動化。這些工作流程以 Markdown 搭配自然語言指引定義，可實作排程或事件觸發的自動化，並具備內建護欄。

1. **建立您的工作流程檔案**，在 `workflows/` 目錄中新增一個 `.md` 檔案 (例如：[`daily-issues-report.md`](./workflows/daily-issues-report.md))
2. **包含 Front Matter**，包含 `name` 和 `description`，接著是代理型工作流程 Front Matter (`on`, `permissions`, `safe-outputs`) 以及自然語言指引
3. **在本機測試**，使用 `gh aw compile --validate --no-emit daily-issues-report.md` 以驗證其有效性
4. **更新 README**，執行 `npm run build` 以更新產生的 README 表格

> **註：** 僅接受 `.md` 檔案 — 請勿包含編譯後的 `.lock.yml` 或 `.yml` 檔案。CI 將會封鎖它們。

#### 工作流程檔案範例

```markdown
---
name: "每日問題報告"
description: "將開啟的問題與近期活動產生每日摘要，並以 GitHub Issue 形式呈現"
on:
  schedule: 工作日每日執行
permissions:
  contents: read
  issues: read
safe-outputs:
  create-issue:
    title-prefix: "[每日報告] "
    labels: [報告]
---

## 每日問題報告

為團隊建立開啟問題的每日摘要。

## 應包含內容

- 過去 24 小時內開啟的新問題
- 已關閉或解決的問題
- 需要關注的過期問題
```

#### 工作流程指引

- **安全優先**：使用最小權限與安全輸出，而非直接的寫入存取權
- **清晰指令**：在工作流程主體中撰寫清晰的自然語言指引
- **描述性名稱**：使用小寫且帶連字號的檔名 (例如：`daily-issues-report.md`)
- **在本機測試**：使用 `gh aw compile --validate` 驗證您的工作流程是否可編譯
- **無編譯檔案**：僅提交 `.md` 原始碼 — 不接受 `.lock.yml` 與 `.yml` 檔案
- 至 [代理型工作流程文件](https://github.github.com/gh-aw) 瞭解更多資訊

## 提交您的貢獻

1. **Fork 此存放區**
2. **為您的貢獻建立一個新分支**
3. **遵循上述指引** 新增您的指引、技能、代理程式、工作流程或外掛程式
4. **執行更新指令碼**：`npm start` 以使用您的新檔案更新 README (請確保您已先執行 `npm install`)
   - GitHub Actions 工作流程將會驗證此步驟是否正確執行
   - 若執行指令碼會修改 `README.md`，PR 檢查將會失敗並附上顯示所需變更的評論
5. **提交提取要求 (Pull Request)** 到 `staged` 分支，並附上：
   - 描述您貢獻的清晰標題
   - 關於您的指引/技能/代理程式功能的簡短說明
   - 任何相關的內容背景或用法說明

> [!IMPORTANT]
> 所有提取要求應針對 **`staged`** 分支，而非 `main`。

> [!NOTE] 
> 我們使用 [all-contributors](https://github.com/all-contributors/all-contributors) 來認可專案中的所有類型貢獻。跳轉至 [貢獻者認可](#貢獻者認可) 以瞭解更多資訊！

## 我們接受的內容

我們歡迎涵蓋任何技術、框架或開發實作的貢獻，只要能協助開發人員更有效地使用 GitHub Copilot。這包含：

- 程式語言與框架
- 開發方法論與最佳實踐
- 架構模式與設計原則
- 測試策略與品質保證
- DevOps 與部署實作
- 協助工具與包容性設計
- 效能優化技術

## 我們不接受的內容

為了維持一個安全、負責任且具建設性的社群，我們將 **不接受** 具有以下行為的貢獻：

- **違反負責任 AI 原則**：企圖規避 Microsoft/GitHub 的負責任 AI 指引或推廣有害 AI 用法的內容
- **損害安全性**：旨在繞過安全政策、利用漏洞或削弱系統安全性的指引
- **啟用惡意活動**：意圖傷害其他系統、使用者或組織的內容
- **利用弱點**：利用其他平台或服務漏洞的指引
- **推廣有害內容**：可能導致產生有害、歧視性或不當內容的引導
- **規避平台政策**：企圖規避 GitHub、Microsoft 或其他平台服務條款的嘗試

## 品質指引

- **務求具體**：通用的指引不如具體、具可操作性的引導有幫助
- **測試您的內容**：確保您的指引或技能能與 GitHub Copilot 良好協作
- **遵循慣例**：使用一致的格式與命名
- **保持專注**：每個檔案應針對特定的技術、框架或使用情境
- **寫作清晰**：使用簡單、直接的語言
- **推廣最佳實踐**：鼓勵安全、可維護且符合道德的開發實作

## 貢獻者認可

我們使用 [all-contributors](https://github.com/all-contributors/all-contributors) 來認可對此專案的 **所有類型貢獻**。

若要加入您自己，請在相關的問題 (Issue) 或提取要求 (PR) 下使用您的 GitHub 使用者名稱與適當的貢獻類型發表評論：

```markdown
@all-contributors add @username for contributionType1, contributionType2
```

貢獻者名單會在每週日 **3:00 AM UTC** 自動更新。下次執行完成後，您的名字將會出現在 [README 貢獻者](./README.md#contributors-) 區段。

### 貢獻類型

我們歡迎多種貢獻，包含下方的自定義類別：

| 類別                     | 說明                                       | 表情符號 |
| ------------------------ | ------------------------------------------ | :------: |
| **指引 (Instructions)**  | 引導 GitHub Copilot 行為的自定義指引集     |    🧭     |
| **代理程式 (Agents)**    | 定義的 GitHub Copilot 角色或個性           |    🎭     |
| **技能 (Skills)**        | 針對 GitHub Copilot 任務的專門知識         |    🧰     |
| **工作流程 (Workflows)** | 用於 AI 驅動之存放區自動化的代理型工作流程 |    ⚡     |
| **外掛程式 (Plugins)**   | 相關提示、代理程式或技能的可安裝套件       |    🎁     |

此外，[All Contributors](https://allcontributors.org/emoji-key/) 支援的所有標準貢獻類型皆會被認可。

> 每份貢獻都很重要。感謝您協助為 GitHub Copilot 社群改善此資源。


## 行為準則

請注意，此專案維護有 [貢獻者行為準則](CODE_OF_CONDUCT.md)。參與此專案即代表您同意遵守其條款。

## 授權條款

貢獻此存放區即代表您同意您的貢獻將以 MIT 授權條款授權。
