# 🤖 Awesome GitHub Copilot
[![由 Awesome Copilot 提供動力](https://img.shields.io/badge/Powered_by-Awesome_Copilot-blue?logo=githubcopilot)](https://aka.ms/awesome-github-copilot) [![來自 allcontributors.org 的 GitHub 貢獻者](https://img.shields.io/github/all-contributors/github/awesome-copilot?color=ee8449)](#contributors-)


由社群建立的自定義代理程式與指引集合，旨在強化您在不同領域、語言和使用情境下的 GitHub Copilot 體驗。

## 🚀 什麼是 Awesome GitHub Copilot？

此存放區提供了一套全面的工具包，透過以下專門資源來增強 GitHub Copilot：

- **👉 [Awesome Agents](docs/README.agents.md)** — 專門的 GitHub Copilot 代理程式，可與 MCP 伺服器整合，為特定工作流程與工具提供增強功能
- **👉 [Awesome Instructions](docs/README.instructions.md)** — 全面的編碼標準與最佳實踐，適用於特定的檔案模式或整個專案
- **👉 [Awesome Hooks](docs/README.hooks.md)** — 由開發、測試和部署期間的特定事件觸發的自動化工作流程
- **👉 [Awesome Agentic Workflows](docs/README.workflows.md)** — AI 驅動的存放區自動化，使用自然語言指引在 GitHub Actions 中執行編碼代理程式
- **👉 [Awesome Skills](docs/README.skills.md)** — 包含指引與隨附資源的獨立資料夾，可增強專門任務的 AI 能力
- **👉 [Awesome Plugins](docs/README.plugins.md)** — 圍繞特定主題與工作流程組織的相關代理程式與技能精選外掛程式
- **👉 [Awesome Cookbook Recipes](cookbook/README.md)** — 實用的、可直接複製貼上的程式碼片段，以及使用 GitHub Copilot 工具與功能的實務範例

## 🌟 精選外掛程式

探索我們圍繞特定主題與工作流程組織的代理程式與技能精選外掛程式。

| 名稱 | 說明 | 項目 | 標籤 |
| ---- | ----------- | ----- | ---- |
| [Awesome Copilot](plugins/awesome-copilot/README.md) | 元技能 (Meta skills)，協助您發現並產生精選的 GitHub Copilot 代理程式、集合、指引與技能。 | 5 個項目 | github-copilot, discovery, meta, prompt-engineering, agents |
| [Copilot SDK](plugins/copilot-sdk/README.md) | 使用 GitHub Copilot SDK 跨多種程式語言建構應用程式。包含針對 C#、Go、Node.js/TypeScript 與 Python 的全面指引，協助您建立 AI 驅動的應用程式。 | 5 個項目 | copilot-sdk, sdk, csharp, go, nodejs, typescript, python, ai, github-copilot |
| [Partners](plugins/partners/README.md) | 由 GitHub 合作夥伴建立的自定義代理程式 | 20 個項目 | devops, security, database, cloud, infrastructure, observability, feature-flags, cicd, migration, performance |


## 如何安裝自定義設定

為了讓您能輕鬆地將這些自定義設定加入編輯器，我們建立了一個 [MCP 伺服器](https://developer.microsoft.com/blog/announcing-awesome-copilot-mcp-server)，提供直接從此存放區搜尋與安裝指引、代理程式與技能的功能。您需要在本地安裝並執行 Docker 才能執行 MCP 伺服器。

[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/mcp/vscode) [![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/mcp/vscode-insiders) [![在 Visual Studio 中安裝](https://img.shields.io/badge/Visual_Studio-Install-C16FDE?logo=visualstudio&logoColor=white)](https://aka.ms/awesome-copilot/mcp/vs)

<details>
<summary>顯示 MCP 伺服器 JSON 設定</summary>

```json
{
  "servers": {
    "awesome-copilot": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "ghcr.io/microsoft/mcp-dotnet-samples/awesome-copilot:latest"
      ]
    }
  }
}
```

</details>

## 📄 llms.txt

符合 [llmstxt.org](https://llmstxt.org/) 規格的 [`llms.txt`](https://awesome-copilot.github.com/llms.txt) 檔案可在 GitHub Pages 網站上取得。此機器可讀檔案讓大型語言模型能輕鬆發現並理解所有可用的代理程式、指引與技能，提供包含名稱與說明的存放區資源結構化總覽。

## 🔧 如何使用

### 🔌 外掛程式 (Plugins)

外掛程式是可安裝的套件，綑綁了相關的代理程式與技能，讓您能輕鬆安裝精選資源集。

#### 安裝外掛程式

首先，將 Awesome Copilot 市集加入您的 Copilot CLI：

```bash
copilot plugin marketplace add github/awesome-copilot
```

接著安裝任何外掛程式：

```bash
copilot plugin install <plugin-name>@awesome-copilot
```

或者，您可以在 Copilot 聊天工作階段中使用 `/plugin` 命令來互動式地瀏覽與安裝外掛程式。

### 🤖 自定義代理程式

自定義代理程式可用於 Copilot 編碼代理程式 (CCA)、VS Code 與 Copilot CLI (即將推出)。針對 CCA，在將問題指派給 Copilot 時，從提供的清單中選擇自定義代理程式。在 VS Code 中，您可以在代理程式工作階段中啟動自定義代理程式，與 Plan 和 Agent 等內建代理程式並列。

### 🎯 技能 (Skills)

技能是包含指引與隨附資源的獨立資料夾，可增強專門任務的 AI 能力。可以透過 GitHub Copilot 介面存取或透過外掛程式安裝。

### 📋 指引 (Instructions)

指引會根據檔案模式自動套用於檔案，並為編碼標準、框架與最佳實踐提供內容背景引導。

### 🪝 勾點 (Hooks)

勾點可實作由 GitHub Copilot 編碼代理程式工作階段期間的特定事件觸發的自動化工作流程 (如 sessionStart, sessionEnd, userPromptSubmitted)。它們可以自動化記錄、自動提交變更或與外部服務整合等任務。

### ⚡ 代理型工作流程 (Agentic Workflows)

[代理型工作流程 (Agentic Workflows)](https://github.github.com/gh-aw) 是在 GitHub Actions 中執行編碼代理程式的 AI 驅動存放區自動化。這些工作流程以 Markdown 搭配自然語言指引定義，可實作事件觸發與排程的自動化 — 從問題分類到每日報告。

## 🎯 為何使用 Awesome GitHub Copilot？

- **生產力**：預建的代理程式與指引可節省時間並提供一致的結果。
- **最佳實踐**：從社群精選的編碼標準與模式中受益。
- **專門協助**：透過專門的自定義代理程式獲得專家級的引導。
- **持續學習**：掌握跨技術的最新模式與實作。

## 🤝 貢獻

我們歡迎各界貢獻！請參閱我們的 [貢獻指引](CONTRIBUTING.md) 以瞭解如何：

- 新增指引、勾點、工作流程、代理程式或技能
- 改善現有內容
- 回報問題或建議改進

對於處理此專案的 AI 編碼代理程式，請參閱 [AGENTS.md](AGENTS.md) 以獲取有關開發工作流程、設定命令與貢獻標準的詳細技術指引。

### 快速貢獻指南

1. 遵循我們的檔案命名慣例與 Front Matter 要求
2. 徹底測試您的貢獻
3. 更新對應的 README 表格
4. 提交提取要求並附上清晰的說明

## 📖 存放區結構

```plaintext
├── instructions/     # 編碼標準與最佳實踐 (.instructions.md)
├── agents/           # AI 角色與專門模式 (.agent.md)
├── hooks/            # Copilot 編碼代理程式工作階段的自動化勾點
├── workflows/        # GitHub Actions 自動化的代理型工作流程
├── plugins/          # 綑綁相關項目的可安裝外掛程式
├── scripts/          # 用於維護的工具指令碼
└── skills/           # 專門任務的 AI 能力
```

## 📄 授權條款

此專案採用 MIT 授權條款授權 — 詳情請參閱 [LICENSE](LICENSE) 檔案。

## 🛡️ 安全性與支援

- **安全性問題**：請參閱我們的 [安全性政策](SECURITY.md)
- **支援**：查看我們的 [支援指南](SUPPORT.md) 以獲取協助
- **行為準則**：我們遵循 [貢獻者公約 (Contributor Covenant)](CODE_OF_CONDUCT.md)

## ℹ️ 免責聲明

此存放區中的自定義設定源自第三方開發人員並由其建立。GitHub 不驗證、背書或保證這些代理程式的功能或安全性。請在安裝前仔細檢查任何代理程式及其文件，以瞭解其可能要求的權限及可能執行的動作。

---

**準備好強化您的編碼體驗了嗎？** 開始探索我們的 [指引](docs/README.instructions.md)、[勾點](docs/README.hooks.md)、[技能](docs/README.skills.md)、[代理型工作流程](docs/README.workflows.md) 與 [自定義代理程式](docs/README.agents.md)！

## 貢獻者 ✨

感謝這些傑出的人士 ([表情符號索引](./CONTRIBUTING.md#contributors-recognition))：

<!-- ALL-CONTRIBUTORS-LIST:START - 請勿移除或修改此區段 -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.aaron-powell.com/"><img src="https://avatars.githubusercontent.com/u/434140?v=4?s=100" width="100px;" alt="Aaron Powell"/><br /><sub><b>Aaron Powell</b></sub></a><br /><a href="#agents-aaronpowell" title="Specialized agents for GitHub Copilot">🎭</a> <a href="https://github.com/github/awesome-copilot/commits?author=aaronpowell" title="Code">💻</a> <a href="#plugins-aaronpowell" title="Curated plugins for GitHub Copilot">🎁</a> <a href="https://github.com/github/awesome-copilot/commits?author=aaronpowell" title="Documentation">📖</a> <a href="#infra-aaronpowell" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#instructions-aaronpowell" title="Custom instructions for GitHub Copilot">🧭</a> <a href="#maintenance-aaronpowell" title="Maintenance">🚧</a> <a href="#prompts-aaronpowell" title="Reusable prompts for GitHub Copilot">⌨️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codemilltech.com/"><img src="https://avatars.githubusercontent.com/u/2053639?v=4?s=100" width="100px;" alt="Matt Soucoup"/><br /><sub><b>Matt Soucoup</b></sub></a><br /><a href="#infra-codemillmatt" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.buymeacoffee.com/troystaylor"><img src="https://avatars.githubusercontent.com/u/44444967?v=4?s=100" width="100px;" alt="Troy Simeon Taylor"/><br /><sub><b>Troy Simeon Taylor</b></sub></a><br /><a href="#agents-troystaylor" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#plugins-troystaylor" title="Curated plugins for GitHub Copilot">🎁</a> <a href="#instructions-troystaylor" title="Custom instructions for GitHub Copilot">🧭</a> <a href="#prompts-troystaylor" title="Reusable prompts for GitHub Copilot">⌨️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/abbas133"><img src="https://avatars.githubusercontent.com/u/7757139?v=4?s=100" width="100px;" alt="Abbas"/><br /><sub><b>Abbas</b></sub></a><br /><a href="#agents-abbas133" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-abbas133" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://calva.io/"><img src="https://avatars.githubusercontent.com/u/30010?v=4?s=100" width="100px;" alt="Peter Strömberg"/><br /><sub><b>Peter Strömberg</b></sub></a><br /><a href="#agents-PEZ" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#plugins-PEZ" title="Curated plugins for GitHub Copilot">🎁</a> <a href="#instructions-PEZ" title="Custom instructions for GitHub Copilot">🧭</a> <a href="#prompts-PEZ" title="Reusable prompts for GitHub Copilot">⌨️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://danielscottraynsford.com/"><img src="https://avatars.githubusercontent.com/u/7589164?v=4?s=100" width="100px;" alt="Daniel Scott-Raynsford"/><br /><sub><b>Daniel Scott-Raynsford</b></sub></a><br /><a href="#agents-PlagueHO" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#plugins-PlagueHO" title="Curated plugins for GitHub Copilot">🎁</a> <a href="#instructions-PlagueHO" title="Custom instructions for GitHub Copilot">🧭</a> <a href="#prompts-PlagueHO" title="Reusable prompts for GitHub Copilot">⌨️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jhauga"><img src="https://avatars.githubusercontent.com/u/10998676?v=4?s=100" width="100px;" alt="John Haugabook"/><br /><sub><b>John Haugabook</b></sub></a><br /><a href="#instructions-jhauga" title="Custom instructions for GitHub Copilot">🧭</a> <a href="#prompts-jhauga" title="Reusable prompts for GitHub Copilot">⌨️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://witter.cz/@pavel"><img src="https://avatars.githubusercontent.com/u/7853836?v=4?s=100" width="100px;" alt="Pavel Simsa"/><br /><sub><b>Pavel Simsa</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=psimsa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://digitarald.de/"><img src="https://avatars.githubusercontent.com/u/8599?v=4?s=100" width="100px;" alt="Harald Kirschner"/><br /><sub><b>Harald Kirschner</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=digitarald" title="Code">💻</a> <a href="https://github.com/github/awesome-copilot/commits?author=digitarald" title="Documentation">📖</a> <a href="#maintenance-digitarald" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://mubaidr.js.org/"><img src="https://avatars.githubusercontent.com/u/2222702?v=4?s=100" width="100px;" alt="Muhammad Ubaid Raza"/><br /><sub><b>Muhammad Ubaid Raza</b></sub></a><br /><a href="#agents-mubaidr" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-mubaidr" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tmeschter"><img src="https://avatars.githubusercontent.com/u/10506730?v=4?s=100" width="100px;" alt="Tom Meschter"/><br /><sub><b>Tom Meschter</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=tmeschter" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.aungmyokyaw.com/"><img src="https://avatars.githubusercontent.com/u/9404824?v=4?s=100" width="100px;" alt="Aung Myo Kyaw"/><br /><sub><b>Aung Myo Kyaw</b></sub></a><br /><a href="#agents-AungMyoKyaw" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JasonYeMSFT"><img src="https://avatars.githubusercontent.com/u/39359541?v=4?s=100" width="100px;" alt="JasonYeMSFT"/><br /><sub><b>JasonYeMSFT</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=JasonYeMSFT" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/jrc356/"><img src="https://avatars.githubusercontent.com/u/37387479?v=4?s=100" width="100px;" alt="Jon Corbin"/><br /><sub><b>Jon Corbin</b></sub></a><br /><a href="#agents-Jrc356" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/troytaylor-msft"><img src="https://avatars.githubusercontent.com/u/248058374?v=4?s=100" width="100px;" alt="troytaylor-msft"/><br /><sub><b>troytaylor-msft</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=troytaylor-msft" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://delatorre.dev/"><img src="https://avatars.githubusercontent.com/u/38289677?v=4?s=100" width="100px;" alt="Emerson Delatorre"/><br /><sub><b>Emerson Delatorre</b></sub></a><br /><a href="#instructions-fazedordecodigo" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/burkeholland"><img src="https://avatars.githubusercontent.com/u/686963?v=4?s=100" width="100px;" alt="Burke Holland"/><br /><sub><b>Burke Holland</b></sub></a><br /><a href="#agents-burkeholland" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#infra-burkeholland" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#instructions-burkeholland" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://yaooqinn.github.io/"><img src="https://avatars.githubusercontent.com/u/8326978?v=4?s=100" width="100px;" alt="Kent Yao"/><br /><sub><b>Kent Yao</b></sub></a><br /><a href="#instructions-yaooqinn" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.devprodlogs.com/"><img src="https://avatars.githubusercontent.com/u/51440732?v=4?s=100" width="100px;" alt="Daniel Meppiel"/><br /><sub><b>Daniel Meppiel</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yeelam-gordon"><img src="https://avatars.githubusercontent.com/u/73506701?v=4?s=100" width="100px;" alt="Gordon Lam"/><br /><sub><b>Gordon Lam</b></sub></a><br /><a href="#instructions-yeelam-gordon" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.madskristensen.net/"><img src="https://avatars.githubusercontent.com/u/1258877?v=4?s=100" width="100px;" alt="Mads Kristensen"/><br /><sub><b>Mads Kristensen</b></sub></a><br /><a href="#instructions-madskristensen" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://ks6088ts.github.io/"><img src="https://avatars.githubusercontent.com/u/1254960?v=4?s=100" width="100px;" alt="Shinji Takenaka"/><br /><sub><b>Shinji Takenaka</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=ks6088ts" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/spectatora"><img src="https://avatars.githubusercontent.com/u/1385755?v=4?s=100" width="100px;" alt="spectatora"/><br /><sub><b>spectatora</b></sub></a><br /><a href="#agents-spectatora" title="Specialized agents for GitHub Copilot">🎭</a> <a href="https://github.com/github/awesome-copilot/commits?author=spectatora" title="Code">💻</a> <a href="#maintenance-spectatora" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sinedied"><img src="https://avatars.githubusercontent.com/u/593151?v=4?s=100" width="100px;" alt="Yohan Lasorsa"/><br /><sub><b>Yohan Lasorsa</b></sub></a><br /><a href="#instructions-sinedied" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VamshiVerma"><img src="https://avatars.githubusercontent.com/u/21999324?v=4?s=100" width="100px;" alt="Vamshi Verma"/><br /><sub><b>Vamshi Verma</b></sub></a><br /><a href="#instructions-VamshiVerma" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://montemagno.com/"><img src="https://avatars.githubusercontent.com/u/1676321?v=4?s=100" width="100px;" alt="James Montemagno"/><br /><sub><b>James Montemagno</b></sub></a><br /><a href="#agents-jamesmontemagno" title="Specialized agents for GitHub Copilot">🎭</a> <a href="https://github.com/github/awesome-copilot/commits?author=jamesmontemagno" title="Documentation">📖</a> <a href="#instructions-jamesmontemagno" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://twitter.com/alefragnani"><img src="https://avatars.githubusercontent.com/u/3781424?v=4?s=100" width="100px;" alt="Alessandro Fragnani"/><br /><sub><b>Alessandro Fragnani</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=alefragnani" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/ambilykk/"><img src="https://avatars.githubusercontent.com/u/10282550?v=4?s=100" width="100px;" alt="Ambily"/><br /><sub><b>Ambily</b></sub></a><br /><a href="#agents-ambilykk" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-ambilykk" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/krushideep"><img src="https://avatars.githubusercontent.com/u/174652083?v=4?s=100" width="100px;" alt="krushideep"/><br /><sub><b>krushideep</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mihsoft"><img src="https://avatars.githubusercontent.com/u/53946345?v=4?s=100" width="100px;" alt="devopsfan"/><br /><sub><b>devopsfan</b></sub></a><br /><a href="#agents-mihsoft" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://tgrall.github.io/"><img src="https://avatars.githubusercontent.com/u/541250?v=4?s=100" width="100px;" alt="Tugdual Grall"/><br /><sub><b>Tugdual Grall</b></sub></a><br /><a href="#instructions-tgrall" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.promptboost.dev/"><img src="https://avatars.githubusercontent.com/u/5461862?v=4?s=100" width="100px;" alt="Oren Me"/><br /><sub><b>Oren Me</b></sub></a><br /><a href="#agents-OrenMe" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-OrenMe" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mjrousos"><img src="https://avatars.githubusercontent.com/u/10077254?v=4?s=100" width="100px;" alt="Mike Rousos"/><br /><sub><b>Mike Rousos</b></sub></a><br /><a href="#instructions-mjrousos" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://devkimchi.com/"><img src="https://avatars.githubusercontent.com/u/1538528?v=4?s=100" width="100px;" alt="Justin Yoo"/><br /><sub><b>Justin Yoo</b></sub></a><br /><a href="#instructions-justinyoo" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/guiopen"><img src="https://avatars.githubusercontent.com/u/94094527?v=4?s=100" width="100px;" alt="Guilherme do Amaral Alves "/><br /><sub><b>Guilherme do Amaral Alves </b></sub></a><br /><a href="#instructions-guiopen" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/griffinashe/"><img src="https://avatars.githubusercontent.com/u/6391612?v=4?s=100" width="100px;" alt="Griffin Ashe"/><br /><sub><b>Griffin Ashe</b></sub></a><br /><a href="#agents-griffinashe" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#plugins-griffinashe" title="Curated plugins for GitHub Copilot">🎁</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/anchildress1"><img src="https://avatars.githubusercontent.com/u/6563688?v=4?s=100" width="100px;" alt="Ashley Childress"/><br /><sub><b>Ashley Childress</b></sub></a><br /><a href="#agents-anchildress1" title="Specialized agents for GitHub Copilot">🎭</a> <a href="https://github.com/github/awesome-copilot/commits?author=anchildress1" title="Documentation">📖</a> <a href="#instructions-anchildress1" title="Custom instructions for GitHub Copilot">🧭</a> <a href="#infra-anchildress1" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/github/awesome-copilot/commits?author=anchildress1" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.senseof.tech/"><img src="https://avatars.githubusercontent.com/u/50712277?v=4?s=100" width="100px;" alt="Adrien Clerbois"/><br /><sub><b>Adrien Clerbois</b></sub></a><br /><a href="#agents-AClerbois" title="Specialized agents for GitHub Copilot">🎭</a> <a href="https://github.com/github/awesome-copilot/commits?author=AClerbois" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Vhivi"><img src="https://avatars.githubusercontent.com/u/38220028?v=4?s=100" width="100px;" alt="ANGELELLI David"/><br /><sub><b>ANGELELLI David</b></sub></a><br /><a href="#agents-Vhivi" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://markdav.is/"><img src="https://avatars.githubusercontent.com/u/311063?v=4?s=100" width="100px;" alt="Mark Davis"/><br /><sub><b>Mark Davis</b></sub></a><br /><a href="#instructions-markdav-is" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MattVevang"><img src="https://avatars.githubusercontent.com/u/20714898?v=4?s=100" width="100px;" alt="Matt Vevang"/><br /><sub><b>Matt Vevang</b></sub></a><br /><a href="#instructions-MattVevang" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://max.irro.at/"><img src="https://avatars.githubusercontent.com/u/589073?v=4?s=100" width="100px;" alt="Maximilian Irro"/><br /><sub><b>Maximilian Irro</b></sub></a><br /><a href="#instructions-mpgirro" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nullchimp"><img src="https://avatars.githubusercontent.com/u/58362593?v=4?s=100" width="100px;" alt="NULLchimp"/><br /><sub><b>NULLchimp</b></sub></a><br /><a href="#agents-nullchimp" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pkarda"><img src="https://avatars.githubusercontent.com/u/12649718?v=4?s=100" width="100px;" alt="Peter Karda"/><br /><sub><b>Peter Karda</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sdolgin"><img src="https://avatars.githubusercontent.com/u/576449?v=4?s=100" width="100px;" alt="Saul Dolgin"/><br /><sub><b>Saul Dolgin</b></sub></a><br /><a href="#agents-sdolgin" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-sdolgin" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/shubham070"><img src="https://avatars.githubusercontent.com/u/5480589?v=4?s=100" width="100px;" alt="Shubham Gaikwad"/><br /><sub><b>Shubham Gaikwad</b></sub></a><br /><a href="#agents-shubham070" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-shubham070" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TheovanKraay"><img src="https://avatars.githubusercontent.com/u/24420698?v=4?s=100" width="100px;" alt="Theo van Kraay"/><br /><sub><b>Theo van Kraay</b></sub></a><br /><a href="#instructions-TheovanKraay" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TianqiZhang"><img src="https://avatars.githubusercontent.com/u/5326582?v=4?s=100" width="100px;" alt="Tianqi Zhang"/><br /><sub><b>Tianqi Zhang</b></sub></a><br /><a href="#agents-TianqiZhang" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://blog.miniasp.com/"><img src="https://avatars.githubusercontent.com/u/88981?v=4?s=100" width="100px;" alt="Will 保哥"/><br /><sub><b>Will 保哥</b></sub></a><br /><a href="#agents-doggy8088" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://tsubalog.hatenablog.com/"><img src="https://avatars.githubusercontent.com/u/1592808?v=4?s=100" width="100px;" alt="Yuta Matsumura"/><br /><sub><b>Yuta Matsumura</b></sub></a><br /><a href="#instructions-tsubakimoto" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/anschnapp"><img src="https://avatars.githubusercontent.com/u/17565996?v=4?s=100" width="100px;" alt="anschnapp"/><br /><sub><b>anschnapp</b></sub></a><br /><a href="#agents-anschnapp" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hizahizi-hizumi"><img src="https://avatars.githubusercontent.com/u/163728895?v=4?s=100" width="100px;" alt="hizahizi-hizumi"/><br /><sub><b>hizahizi-hizumi</b></sub></a><br /><a href="#instructions-hizahizi-hizumi" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jianminhuang.cc/"><img src="https://avatars.githubusercontent.com/u/6296280?v=4?s=100" width="100px;" alt="黃健旻 Vincent Huang"/><br /><sub><b>黃健旻 Vincent Huang</b></sub></a><br /><a href="#prompts-Jian-Min-Huang" title="Reusable prompts for GitHub Copilot">⌨️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://brunoborges.io/"><img src="https://avatars.githubusercontent.com/u/129743?v=4?s=100" width="100px;" alt="Bruno Borges"/><br /><sub><b>Bruno Borges</b></sub></a><br /><a href="#plugins-brunoborges" title="Curated plugins for GitHub Copilot">🎁</a> <a href="#instructions-brunoborges" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.movinglive.ca/"><img src="https://avatars.githubusercontent.com/u/14792628?v=4?s=100" width="100px;" alt="Steve Magne"/><br /><sub><b>Steve Magne</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=MovingLive" title="Documentation">📖</a> <a href="#instructions-MovingLive" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://shaneneuville.com/"><img src="https://avatars.githubusercontent.com/u/5375137?v=4?s=100" width="100px;" alt="Shane Neuville"/><br /><sub><b>Shane Neuville</b></sub></a><br /><a href="#agents-PureWeen" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-PureWeen" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://asilva.dev/"><img src="https://avatars.githubusercontent.com/u/2493377?v=4?s=100" width="100px;" alt="André Silva"/><br /><sub><b>André Silva</b></sub></a><br /><a href="#agents-askpt" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-askpt" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/agreaves-ms"><img src="https://avatars.githubusercontent.com/u/111466195?v=4?s=100" width="100px;" alt="Allen Greaves"/><br /><sub><b>Allen Greaves</b></sub></a><br /><a href="#agents-agreaves-ms" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-agreaves-ms" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AmeliaRose802"><img src="https://avatars.githubusercontent.com/u/26167931?v=4?s=100" width="100px;" alt="Amelia Payne"/><br /><sub><b>Amelia Payne</b></sub></a><br /><a href="#agents-AmeliaRose802" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/BBoyBen"><img src="https://avatars.githubusercontent.com/u/34445365?v=4?s=100" width="100px;" alt="BBoyBen"/><br /><sub><b>BBoyBen</b></sub></a><br /><a href="#instructions-BBoyBen" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://azureincubations.io/"><img src="https://avatars.githubusercontent.com/u/45323234?v=4?s=100" width="100px;" alt="Brooke Hamilton"/><br /><sub><b>Brooke Hamilton</b></sub></a><br /><a href="#instructions-brooke-hamilton" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/GeekTrainer"><img src="https://avatars.githubusercontent.com/u/6109729?v=4?s=100" width="100px;" alt="Christopher Harrison"/><br /><sub><b>Christopher Harrison</b></sub></a><br /><a href="#instructions-GeekTrainer" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/breakid"><img src="https://avatars.githubusercontent.com/u/1446918?v=4?s=100" width="100px;" alt="Dan"/><br /><sub><b>Dan</b></sub></a><br /><a href="#instructions-breakid" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://blog.codewithdan.com/"><img src="https://avatars.githubusercontent.com/u/1767249?v=4?s=100" width="100px;" alt="Dan Wahlin"/><br /><sub><b>Dan Wahlin</b></sub></a><br /><a href="#agents-DanWahlin" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://debbie.codes/"><img src="https://avatars.githubusercontent.com/u/13063165?v=4?s=100" width="100px;" alt="Debbie O'Brien"/><br /><sub><b>Debbie O'Brien</b></sub></a><br /><a href="#agents-debs-obrien" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-debs-obrien" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/echarrod"><img src="https://avatars.githubusercontent.com/u/1381991?v=4?s=100" width="100px;" alt="Ed Harrod"/><br /><sub><b>Ed Harrod</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="http://learn.microsoft.com/dotnet"><img src="https://avatars.githubusercontent.com/u/24882762?v=4?s=100" width="100px;" alt="Genevieve Warren"/><br /><sub><b>Genevieve Warren</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/guigui42"><img src="https://avatars.githubusercontent.com/u/2376010?v=4?s=100" width="100px;" alt="Guillaume"/><br /><sub><b>Guillaume</b></sub></a><br /><a href="#agents-guigui42" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/riqueufmg"><img src="https://avatars.githubusercontent.com/u/108551585?v=4?s=100" width="100px;" alt="Henrique Nunes"/><br /><sub><b>Henrique Nunes</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jeremiah-snee-openx"><img src="https://avatars.githubusercontent.com/u/113928685?v=4?s=100" width="100px;" alt="Jeremiah Snee"/><br /><sub><b>Jeremiah Snee</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=jeremiah-snee-openx" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kartikdhiman"><img src="https://avatars.githubusercontent.com/u/59189590?v=4?s=100" width="100px;" alt="Kartik Dhiman"/><br /><sub><b>Kartik Dhiman</b></sub></a><br /><a href="#instructions-kartikdhiman" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://kristiyanvelkov.com/"><img src="https://avatars.githubusercontent.com/u/40764277?v=4?s=100" width="100px;" alt="Kristiyan Velkov"/><br /><sub><b>Kristiyan Velkov</b></sub></a><br /><a href="#agents-kristiyan-velkov" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/msalaman"><img src="https://avatars.githubusercontent.com/u/28122166?v=4?s=100" width="100px;" alt="msalaman"/><br /><sub><b>msalaman</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=msalaman" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://soderlind.no/"><img src="https://avatars.githubusercontent.com/u/1649452?v=4?s=100" width="100px;" alt="Per Søderlind"/><br /><sub><b>Per Søderlind</b></sub></a><br /><a href="#instructions-soderlind" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://dotneteers.net/"><img src="https://avatars.githubusercontent.com/u/28162552?v=4?s=100" width="100px;" alt="Peter Smulovics"/><br /><sub><b>Peter Smulovics</b></sub></a><br /><a href="#instructions-psmulovics" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/madvimer"><img src="https://avatars.githubusercontent.com/u/3188898?v=4?s=100" width="100px;" alt="Ravish Rathod"/><br /><sub><b>Ravish Rathod</b></sub></a><br /><a href="#instructions-madvimer" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ricksm.it/"><img src="https://avatars.githubusercontent.com/u/7207783?v=4?s=100" width="100px;" alt="Rick Smit"/><br /><sub><b>Rick Smit</b></sub></a><br /><a href="#agents-ricksmit3000" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pertrai1"><img src="https://avatars.githubusercontent.com/u/442374?v=4?s=100" width="100px;" alt="Rob Simpson"/><br /><sub><b>Rob Simpson</b></sub></a><br /><a href="#instructions-pertrai1" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/inquinity"><img src="https://avatars.githubusercontent.com/u/406234?v=4?s=100" width="100px;" alt="Robert Altman"/><br /><sub><b>Robert Altman</b></sub></a><br /><a href="#instructions-inquinity" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://salih.guru/"><img src="https://avatars.githubusercontent.com/u/76786120?v=4?s=100" width="100px;" alt="Salih"/><br /><sub><b>Salih</b></sub></a><br /><a href="#instructions-salihguru" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://graef.io/"><img src="https://avatars.githubusercontent.com/u/19261257?v=4?s=100" width="100px;" alt="Sebastian Gräf"/><br /><sub><b>Sebastian Gräf</b></sub></a><br /><a href="#agents-segraef" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-segraef" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SebastienDegodez"><img src="https://avatars.githubusercontent.com/u/2349146?v=4?s=100" width="100px;" alt="Sebastien DEGODEZ"/><br /><sub><b>Sebastien DEGODEZ</b></sub></a><br /><a href="#instructions-SebastienDegodez" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sesmyrnov"><img src="https://avatars.githubusercontent.com/u/59627981?v=4?s=100" width="100px;" alt="Sergiy Smyrnov"/><br /><sub><b>Sergiy Smyrnov</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SomeSolutionsArchitect"><img src="https://avatars.githubusercontent.com/u/139817767?v=4?s=100" width="100px;" alt="SomeSolutionsArchitect"/><br /><sub><b>SomeSolutionsArchitect</b></sub></a><br /><a href="#agents-SomeSolutionsArchitect" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kewalaka"><img src="https://avatars.githubusercontent.com/u/3146590?v=4?s=100" width="100px;" alt="Stu Mace"/><br /><sub><b>Stu Mace</b></sub></a><br /><a href="#agents-kewalaka" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#plugins-kewalaka" title="Curated plugins for GitHub Copilot">🎁</a> <a href="#instructions-kewalaka" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/STRUDSO"><img src="https://avatars.githubusercontent.com/u/1543732?v=4?s=100" width="100px;" alt="Søren Trudsø Mahon"/><br /><sub><b>Søren Trudsø Mahon</b></sub></a><br /><a href="#instructions-STRUDSO" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://enakdesign.com/"><img src="https://avatars.githubusercontent.com/u/14024037?v=4?s=100" width="100px;" alt="Tj Vita"/><br /><sub><b>Tj Vita</b></sub></a><br /><a href="#agents-semperteneo" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pelikhan"><img src="https://avatars.githubusercontent.com/u/4175913?v=4?s=100" width="100px;" alt="Peli de Halleux"/><br /><sub><b>Peli de Halleux</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=pelikhan" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.paulomorgado.net/"><img src="https://avatars.githubusercontent.com/u/470455?v=4?s=100" width="100px;" alt="Paulo Morgado"/><br /><sub><b>Paulo Morgado</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://paul.crane.net.nz/"><img src="https://avatars.githubusercontent.com/u/808676?v=4?s=100" width="100px;" alt="Paul Crane"/><br /><sub><b>Paul Crane</b></sub></a><br /><a href="#agents-pcrane" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.pamelafox.org/"><img src="https://avatars.githubusercontent.com/u/297042?v=4?s=100" width="100px;" alt="Pamela Fox"/><br /><sub><b>Pamela Fox</b></sub></a><br /></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://oskarthornblad.se/"><img src="https://avatars.githubusercontent.com/u/640102?v=4?s=100" width="100px;" alt="Oskar Thornblad"/><br /><sub><b>Oskar Thornblad</b></sub></a><br /><a href="#instructions-prewk" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nischays"><img src="https://avatars.githubusercontent.com/u/54121853?v=4?s=100" width="100px;" alt="Nischay Sharma"/><br /><sub><b>Nischay Sharma</b></sub></a><br /><a href="#agents-nischays" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Naikabg"><img src="https://avatars.githubusercontent.com/u/19915620?v=4?s=100" width="100px;" alt="Nikolay Marinov"/><br /><sub><b>Nikolay Marinov</b></sub></a><br /><a href="#agents-Naikabg" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/niksac"><img src="https://avatars.githubusercontent.com/u/20246918?v=4?s=100" width="100px;" alt="Nik Sachdeva"/><br /><sub><b>Nik Sachdeva</b></sub></a><br /><a href="#agents-niksacdev" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#plugins-niksacdev" title="Curated plugins for GitHub Copilot">🎁</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://onetipaweek.com/"><img src="https://avatars.githubusercontent.com/u/833231?v=4?s=100" width="100px;" alt="Nick Taylor"/><br /><sub><b>Nick Taylor</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=nickytonline" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nicholasdbrady.github.io/cookbook/"><img src="https://avatars.githubusercontent.com/u/18353756?v=4?s=100" width="100px;" alt="Nick Brady"/><br /><sub><b>Nick Brady</b></sub></a><br /><a href="#agents-nicholasdbrady" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nastanford"><img src="https://avatars.githubusercontent.com/u/1755947?v=4?s=100" width="100px;" alt="Nathan Stanford Sr"/><br /><sub><b>Nathan Stanford Sr</b></sub></a><br /><a href="#instructions-nastanford" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/matebarabas"><img src="https://avatars.githubusercontent.com/u/22733424?v=4?s=100" width="100px;" alt="Máté Barabás"/><br /><sub><b>Máté Barabás</b></sub></a><br /><a href="#instructions-matebarabas" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mikeparker104"><img src="https://avatars.githubusercontent.com/u/12763221?v=4?s=100" width="100px;" alt="Mike Parker"/><br /><sub><b>Mike Parker</b></sub></a><br /><a href="#instructions-mikeparker104" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mikekistler"><img src="https://avatars.githubusercontent.com/u/85643503?v=4?s=100" width="100px;" alt="Mike Kistler"/><br /><sub><b>Mike Kistler</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/giomartinsdev"><img src="https://avatars.githubusercontent.com/u/125399281?v=4?s=100" width="100px;" alt="Giovanni de Almeida Martins"/><br /><sub><b>Giovanni de Almeida Martins</b></sub></a><br /><a href="#instructions-giomartinsdev" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dgh06175"><img src="https://avatars.githubusercontent.com/u/77305722?v=4?s=100" width="100px;" alt="이상현"/><br /><sub><b>이상현</b></sub></a><br /><a href="#instructions-dgh06175" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/zooav"><img src="https://avatars.githubusercontent.com/u/12625412?v=4?s=100" width="100px;" alt="Ankur Sharma"/><br /><sub><b>Ankur Sharma</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/webreidi"><img src="https://avatars.githubusercontent.com/u/55603905?v=4?s=100" width="100px;" alt="Wendy Breiding"/><br /><sub><b>Wendy Breiding</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=webreidi" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/voidfnc"><img src="https://avatars.githubusercontent.com/u/194750710?v=4?s=100" width="100px;" alt="voidfnc"/><br /><sub><b>voidfnc</b></sub></a><br /><a href="#agents-voidfnc" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://about.me/shane-lee"><img src="https://avatars.githubusercontent.com/u/5466825?v=4?s=100" width="100px;" alt="shane lee"/><br /><sub><b>shane lee</b></sub></a><br /><a href="#instructions-shavo007" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sdanzo-hrb"><img src="https://avatars.githubusercontent.com/u/136493100?v=4?s=100" width="100px;" alt="sdanzo-hrb"/><br /><sub><b>sdanzo-hrb</b></sub></a><br /><a href="#agents-sdanzo-hrb" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nativebpm"><img src="https://avatars.githubusercontent.com/u/33398121?v=4?s=100" width="100px;" alt="sauran"/><br /><sub><b>sauran</b></sub></a><br /><a href="#instructions-isauran" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/samqbush"><img src="https://avatars.githubusercontent.com/u/74389839?v=4?s=100" width="100px;" alt="samqbush"/><br /><sub><b>samqbush</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pareenaverma"><img src="https://avatars.githubusercontent.com/u/59843121?v=4?s=100" width="100px;" alt="pareenaverma"/><br /><sub><b>pareenaverma</b></sub></a><br /><a href="#agents-pareenaverma" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/oleksiyyurchyna"><img src="https://avatars.githubusercontent.com/u/10256765?v=4?s=100" width="100px;" alt="oleksiyyurchyna"/><br /><sub><b>oleksiyyurchyna</b></sub></a><br /><a href="#plugins-oleksiyyurchyna" title="Curated plugins for GitHub Copilot">🎁</a> <a href="#prompts-oleksiyyurchyna" title="Reusable prompts for GitHub Copilot">⌨️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/time-by-waves"><img src="https://avatars.githubusercontent.com/u/34587654?v=4?s=100" width="100px;" alt="oceans-of-time"/><br /><sub><b>oceans-of-time</b></sub></a><br /><a href="#instructions-time-by-waves" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kshashank57"><img src="https://avatars.githubusercontent.com/u/57212456?v=4?s=100" width="100px;" alt="kshashank57"/><br /><sub><b>kshashank57</b></sub></a><br /><a href="#agents-kshashank57" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-kshashank57" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hueanmy"><img src="https://avatars.githubusercontent.com/u/20430626?v=4?s=100" width="100px;" alt="Meii"/><br /><sub><b>Meii</b></sub></a><br /><a href="#agents-hueanmy" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/factory-davidgu"><img src="https://avatars.githubusercontent.com/u/229352262?v=4?s=100" width="100px;" alt="factory-davidgu"/><br /><sub><b>factory-davidgu</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=factory-davidgu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dangelov-qa"><img src="https://avatars.githubusercontent.com/u/92313553?v=4?s=100" width="100px;" alt="dangelov-qa"/><br /><sub><b>dangelov-qa</b></sub></a><br /><a href="#agents-dangelov-qa" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/BenoitMaucotel"><img src="https://avatars.githubusercontent.com/u/54392431?v=4?s=100" width="100px;" alt="BenoitMaucotel"/><br /><sub><b>BenoitMaucotel</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=BenoitMaucotel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/benjisho-aidome"><img src="https://avatars.githubusercontent.com/u/218995725?v=4?s=100" width="100px;" alt="benjisho-aidome"/><br /><sub><b>benjisho-aidome</b></sub></a><br /><a href="#agents-benjisho-aidome" title="Specialized agents for GitHub Copilot">🎭</a> <a href="#instructions-benjisho-aidome" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yukiomoto"><img src="https://avatars.githubusercontent.com/u/38450410?v=4?s=100" width="100px;" alt="Yuki Omoto"/><br /><sub><b>Yuki Omoto</b></sub></a><br /><a href="#instructions-yukiomoto" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wschultz-boxboat"><img src="https://avatars.githubusercontent.com/u/110492948?v=4?s=100" width="100px;" alt="Will Schultz"/><br /><sub><b>Will Schultz</b></sub></a><br /><a href="#agents-wschultz-boxboat" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://bio.warengonzaga.com/"><img src="https://avatars.githubusercontent.com/u/15052701?v=4?s=100" width="100px;" alt="Waren Gonzaga"/><br /><sub><b>Waren Gonzaga</b></sub></a><br /><a href="#agents-warengonzaga" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://linktr.ee/vincentkoc"><img src="https://avatars.githubusercontent.com/u/25068?v=4?s=100" width="100px;" alt="Vincent Koc"/><br /><sub><b>Vincent Koc</b></sub></a><br /><a href="#agents-vincentkoc" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Vaporjawn"><img src="https://avatars.githubusercontent.com/u/15694665?v=4?s=100" width="100px;" alt="Victor Williams"/><br /><sub><b>Victor Williams</b></sub></a><br /><a href="#agents-Vaporjawn" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://vesharma.dev/"><img src="https://avatars.githubusercontent.com/u/62218708?v=4?s=100" width="100px;" alt="Ve Sharma"/><br /><sub><b>Ve Sharma</b></sub></a><br /><a href="#agents-VeVarunSharma" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ferryhopper.com/"><img src="https://avatars.githubusercontent.com/u/19361558?v=4?s=100" width="100px;" alt="Vasileios Lahanas"/><br /><sub><b>Vasileios Lahanas</b></sub></a><br /><a href="#instructions-vlahanas" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://tinyurl.com/3p5j9mwe"><img src="https://avatars.githubusercontent.com/u/9591887?v=4?s=100" width="100px;" alt="Udaya Veeramreddygari"/><br /><sub><b>Udaya Veeramreddygari</b></sub></a><br /><a href="#instructions-udayakumarreddyv" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/iletai"><img src="https://avatars.githubusercontent.com/u/26614687?v=4?s=100" width="100px;" alt="Tài Lê"/><br /><sub><b>Tài Lê</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://tsubasaogawa.me/"><img src="https://avatars.githubusercontent.com/u/7788821?v=4?s=100" width="100px;" alt="Tsubasa Ogawa"/><br /><sub><b>Tsubasa Ogawa</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=tsubasaogawa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://glsauto.com/"><img src="https://avatars.githubusercontent.com/u/132710946?v=4?s=100" width="100px;" alt="Troy Witthoeft (glsauto)"/><br /><sub><b>Troy Witthoeft (glsauto)</b></sub></a><br /><a href="#instructions-twitthoeft-gls" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jfversluis.dev/"><img src="https://avatars.githubusercontent.com/u/939291?v=4?s=100" width="100px;" alt="Gerald Versluis"/><br /><sub><b>Gerald Versluis</b></sub></a><br /><a href="#instructions-jfversluis" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/geoder101"><img src="https://avatars.githubusercontent.com/u/145904?v=4?s=100" width="100px;" alt="George Dernikos"/><br /><sub><b>George Dernikos</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/gautambaghel"><img src="https://avatars.githubusercontent.com/u/22324290?v=4?s=100" width="100px;" alt="Gautam"/><br /><sub><b>Gautam</b></sub></a><br /><a href="#agents-gautambaghel" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/feapaydin"><img src="https://avatars.githubusercontent.com/u/19946639?v=4?s=100" width="100px;" alt="Furkan Enes"/><br /><sub><b>Furkan Enes</b></sub></a><br /><a href="#instructions-feapaydin" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fmuecke"><img src="https://avatars.githubusercontent.com/u/7921024?v=4?s=100" width="100px;" alt="Florian Mücke"/><br /><sub><b>Florian Mücke</b></sub></a><br /><a href="#agents-fmuecke" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.felixarjuna.dev/"><img src="https://avatars.githubusercontent.com/u/79026094?v=4?s=100" width="100px;" alt="Felix Arjuna"/><br /><sub><b>Felix Arjuna</b></sub></a><br /><a href="#instructions-felixarjuna" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ewega"><img src="https://avatars.githubusercontent.com/u/26189114?v=4?s=100" width="100px;" alt="Eldrick Wega"/><br /><sub><b>Eldrick Wega</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/danchev"><img src="https://avatars.githubusercontent.com/u/12420863?v=4?s=100" width="100px;" alt="Dobri Danchev"/><br /><sub><b>Dobri Danchev</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://dgamboa.com/"><img src="https://avatars.githubusercontent.com/u/7052267?v=4?s=100" width="100px;" alt="Diego Gamboa"/><br /><sub><b>Diego Gamboa</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/derekclair"><img src="https://avatars.githubusercontent.com/u/5247629?v=4?s=100" width="100px;" alt="Derek Clair"/><br /><sub><b>Derek Clair</b></sub></a><br /><a href="#agents-derekclair" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://dev.to/davidortinau"><img src="https://avatars.githubusercontent.com/u/41873?v=4?s=100" width="100px;" alt="David Ortinau"/><br /><sub><b>David Ortinau</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=davidortinau" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/danielabbatt"><img src="https://avatars.githubusercontent.com/u/8926756?v=4?s=100" width="100px;" alt="Daniel Abbatt"/><br /><sub><b>Daniel Abbatt</b></sub></a><br /><a href="#instructions-danielabbatt" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/CypherHK"><img src="https://avatars.githubusercontent.com/u/230935834?v=4?s=100" width="100px;" alt="CypherHK"/><br /><sub><b>CypherHK</b></sub></a><br /><a href="#agents-CypherHK" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/craigbekker"><img src="https://avatars.githubusercontent.com/u/1115912?v=4?s=100" width="100px;" alt="Craig Bekker"/><br /><sub><b>Craig Bekker</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=craigbekker" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.peug.net/"><img src="https://avatars.githubusercontent.com/u/3845786?v=4?s=100" width="100px;" alt="Christophe Peugnet"/><br /><sub><b>Christophe Peugnet</b></sub></a><br /><a href="#instructions-tossnet" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lechnerc77"><img src="https://avatars.githubusercontent.com/u/22294087?v=4?s=100" width="100px;" alt="Christian Lechner"/><br /><sub><b>Christian Lechner</b></sub></a><br /><a href="#instructions-lechnerc77" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/charris-msft"><img src="https://avatars.githubusercontent.com/u/74415662?v=4?s=100" width="100px;" alt="Chris Harris"/><br /><sub><b>Chris Harris</b></sub></a><br /><a href="#agents-charris-msft" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/artemsaveliev"><img src="https://avatars.githubusercontent.com/u/15679218?v=4?s=100" width="100px;" alt="Artem Saveliev"/><br /><sub><b>Artem Saveliev</b></sub></a><br /><a href="#instructions-artemsaveliev" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://javaetmoi.com/"><img src="https://avatars.githubusercontent.com/u/838318?v=4?s=100" width="100px;" alt="Antoine Rey"/><br /><sub><b>Antoine Rey</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PiKa919"><img src="https://avatars.githubusercontent.com/u/96786190?v=4?s=100" width="100px;" alt="Ankit Das"/><br /><sub><b>Ankit Das</b></sub></a><br /><a href="#instructions-PiKa919" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/alineavila"><img src="https://avatars.githubusercontent.com/u/24813256?v=4?s=100" width="100px;" alt="Aline Ávila"/><br /><sub><b>Aline Ávila</b></sub></a><br /><a href="#instructions-alineavila" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/martin-cod"><img src="https://avatars.githubusercontent.com/u/33550246?v=4?s=100" width="100px;" alt="Alexander Martinkevich"/><br /><sub><b>Alexander Martinkevich</b></sub></a><br /><a href="#agents-martin-cod" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aldunchev"><img src="https://avatars.githubusercontent.com/u/4631021?v=4?s=100" width="100px;" alt="Aleksandar Dunchev"/><br /><sub><b>Aleksandar Dunchev</b></sub></a><br /><a href="#agents-aldunchev" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.qreate.it/"><img src="https://avatars.githubusercontent.com/u/1868590?v=4?s=100" width="100px;" alt="Alan Sprecacenere"/><br /><sub><b>Alan Sprecacenere</b></sub></a><br /><a href="#instructions-tegola" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/akashxlr8"><img src="https://avatars.githubusercontent.com/u/58072860?v=4?s=100" width="100px;" alt="Akash Kumar Shaw"/><br /><sub><b>Akash Kumar Shaw</b></sub></a><br /><a href="#instructions-akashxlr8" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/abdidaudpropel"><img src="https://avatars.githubusercontent.com/u/51310019?v=4?s=100" width="100px;" alt="Abdi Daud"/><br /><sub><b>Abdi Daud</b></sub></a><br /><a href="#agents-abdidaudpropel" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AIAlchemyForge"><img src="https://avatars.githubusercontent.com/u/253636689?v=4?s=100" width="100px;" alt="AIAlchemyForge"/><br /><sub><b>AIAlchemyForge</b></sub></a><br /><a href="#instructions-AIAlchemyForge" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/4regab"><img src="https://avatars.githubusercontent.com/u/178603515?v=4?s=100" width="100px;" alt="4regab"/><br /><sub><b>4regab</b></sub></a><br /><a href="#instructions-4regab" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MiguelElGallo"><img src="https://avatars.githubusercontent.com/u/60221874?v=4?s=100" width="100px;" alt="Miguel P Z"/><br /><sub><b>Miguel P Z</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=MiguelElGallo" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://a11ysupport.io/"><img src="https://avatars.githubusercontent.com/u/498678?v=4?s=100" width="100px;" alt="Michael Fairchild"/><br /><sub><b>Michael Fairchild</b></sub></a><br /><a href="#instructions-mfairchild365" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/michael-volz/"><img src="https://avatars.githubusercontent.com/u/129928?v=4?s=100" width="100px;" alt="Michael A. Volz (Flynn)"/><br /><sub><b>Michael A. Volz (Flynn)</b></sub></a><br /></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Mike-Hanna"><img src="https://avatars.githubusercontent.com/u/50142889?v=4?s=100" width="100px;" alt="Michael"/><br /><sub><b>Michael</b></sub></a><br /><a href="#instructions-Mike-Hanna" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.mehmetalierol.com/"><img src="https://avatars.githubusercontent.com/u/16721723?v=4?s=100" width="100px;" alt="Mehmet Ali EROL"/><br /><sub><b>Mehmet Ali EROL</b></sub></a><br /><a href="#agents-mehmetalierol" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://maxprilutskiy.com/"><img src="https://avatars.githubusercontent.com/u/5614659?v=4?s=100" width="100px;" alt="Max Prilutskiy"/><br /><sub><b>Max Prilutskiy</b></sub></a><br /><a href="#agents-maxprilutskiy" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mbianchidev"><img src="https://avatars.githubusercontent.com/u/37507190?v=4?s=100" width="100px;" alt="Matteo Bianchi"/><br /><sub><b>Matteo Bianchi</b></sub></a><br /><a href="#agents-mbianchidev" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://marknoble.com/"><img src="https://avatars.githubusercontent.com/u/3819700?v=4?s=100" width="100px;" alt="Mark Noble"/><br /><sub><b>Mark Noble</b></sub></a><br /><a href="#agents-marknoble" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ManishJayaswal"><img src="https://avatars.githubusercontent.com/u/9527491?v=4?s=100" width="100px;" alt="Manish Jayaswal"/><br /><sub><b>Manish Jayaswal</b></sub></a><br /><a href="#agents-ManishJayaswal" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://linktr.ee/lukemurray"><img src="https://avatars.githubusercontent.com/u/24467442?v=4?s=100" width="100px;" alt="Luke Murray"/><br /><sub><b>Luke Murray</b></sub></a><br /><a href="#agents-lukemurraynz" title="Specialized agents for GitHub Copilot">🎭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/LouellaCreemers"><img src="https://avatars.githubusercontent.com/u/46204894?v=4?s=100" width="100px;" alt="Louella Creemers"/><br /><sub><b>Louella Creemers</b></sub></a><br /><a href="#instructions-LouellaCreemers" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/saikoumudi"><img src="https://avatars.githubusercontent.com/u/22682497?v=4?s=100" width="100px;" alt="Sai Koumudi Kaluvakolanu"/><br /><sub><b>Sai Koumudi Kaluvakolanu</b></sub></a><br /><a href="#agents-saikoumudi" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/whiteken"><img src="https://avatars.githubusercontent.com/u/20211937?v=4?s=100" width="100px;" alt="Kenny White"/><br /><sub><b>Kenny White</b></sub></a><br /><a href="#instructions-whiteken" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/KaloyanGenev"><img src="https://avatars.githubusercontent.com/u/42644424?v=4?s=100" width="100px;" alt="KaloyanGenev"/><br /><sub><b>KaloyanGenev</b></sub></a><br /><a href="#agents-KaloyanGenev" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ranrar"><img src="https://avatars.githubusercontent.com/u/95967772?v=4?s=100" width="100px;" alt="Kim Skov Rasmussen"/><br /><sub><b>Kim Skov Rasmussen</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=Ranrar" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.julien-dubois.com/"><img src="https://avatars.githubusercontent.com/u/316835?v=4?s=100" width="100px;" alt="Julien Dubois"/><br /><sub><b>Julien Dubois</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://digio.es/"><img src="https://avatars.githubusercontent.com/u/173672918?v=4?s=100" width="100px;" alt="José Antonio Garrido"/><br /><sub><b>José Antonio Garrido</b></sub></a><br /><a href="#instructions-josegarridodigio" title="Custom instructions for GitHub Copilot">🧭</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.sugbo4j.co.nz/"><img src="https://avatars.githubusercontent.com/u/15100839?v=4?s=100" width="100px;" alt="Joseph Gonzales"/><br /><sub><b>Joseph Gonzales</b></sub></a><br /><a href="#instructions-josephgonzales01" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yortch"><img src="https://avatars.githubusercontent.com/u/4576246?v=4?s=100" width="100px;" alt="Jorge Balderas"/><br /><sub><b>Jorge Balderas</b></sub></a><br /><a href="#instructions-yortch" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://johnpapa.net/"><img src="https://avatars.githubusercontent.com/u/1202528?v=4?s=100" width="100px;" alt="John Papa"/><br /><sub><b>John Papa</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=johnpapa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.johnlokerse.dev/"><img src="https://avatars.githubusercontent.com/u/3514513?v=4?s=100" width="100px;" alt="John"/><br /><sub><b>John</b></sub></a><br /><a href="#agents-johnlokerse" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://joe-watkins.io/"><img src="https://avatars.githubusercontent.com/u/3695795?v=4?s=100" width="100px;" alt="Joe Watkins"/><br /><sub><b>Joe Watkins</b></sub></a><br /><a href="#instructions-joe-watkins" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jan-v.nl/"><img src="https://avatars.githubusercontent.com/u/462356?v=4?s=100" width="100px;" alt="Jan de Vries"/><br /><sub><b>Jan de Vries</b></sub></a><br /><a href="#agents-Jandev" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nohwnd"><img src="https://avatars.githubusercontent.com/u/5735905?v=4?s=100" width="100px;" alt="Jakub Jareš"/><br /><sub><b>Jakub Jareš</b></sub></a><br /></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jaxn"><img src="https://avatars.githubusercontent.com/u/29095?v=4?s=100" width="100px;" alt="Jackson Miller"/><br /><sub><b>Jackson Miller</b></sub></a><br /><a href="#instructions-jaxn" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ioana37"><img src="https://avatars.githubusercontent.com/u/69301842?v=4?s=100" width="100px;" alt="Ioana A"/><br /><sub><b>Ioana A</b></sub></a><br /><a href="#instructions-Ioana37" title="Custom instructions for GitHub Copilot">🧭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hunterhogan"><img src="https://avatars.githubusercontent.com/u/2958419?v=4?s=100" width="100px;" alt="Hunter Hogan"/><br /><sub><b>Hunter Hogan</b></sub></a><br /><a href="#agents-hunterhogan" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hashimwarren"><img src="https://avatars.githubusercontent.com/u/6027587?v=4?s=100" width="100px;" alt="Hashim Warren"/><br /><sub><b>Hashim Warren</b></sub></a><br /><a href="#agents-hashimwarren" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Arggon"><img src="https://avatars.githubusercontent.com/u/20962238?v=4?s=100" width="100px;" alt="Gonzalo"/><br /><sub><b>Gonzalo</b></sub></a><br /></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hachyderm.io/@0gis0"><img src="https://avatars.githubusercontent.com/u/175379?v=4?s=100" width="100px;" alt="Gisela Torres"/><br /><sub><b>Gisela Torres</b></sub></a><br /><a href="#agents-0GiS0" title="Specialized agents for GitHub Copilot">🎭</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/shibicr93"><img src="https://avatars.githubusercontent.com/u/6803434?v=4?s=100" width="100px;" alt="Shibi Ramachandran"/><br /><sub><b>Shibi Ramachandran</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=shibicr93" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lupritz"><img src="https://avatars.githubusercontent.com/u/145381941?v=4?s=100" width="100px;" alt="lupritz"/><br /><sub><b>lupritz</b></sub></a><br /><a href="#plugin-lupritz" title="Plugin/utility libraries">🔌</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bhect0"><img src="https://avatars.githubusercontent.com/u/96436904?v=4?s=100" width="100px;" alt="Héctor Benedicte"/><br /><sub><b>Héctor Benedicte</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=bhect0" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">新增您的貢獻</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

此專案遵循 [all-contributors](https://github.com/all-contributors/all-contributors) 規格。歡迎任何形式的貢獻！

## 📚 額外資源

- [VS Code Copilot 自定義文件](https://code.visualstudio.com/docs/copilot/copilot-customization) — 官方 Microsoft 文件
- [GitHub Copilot Chat 文件](https://code.visualstudio.com/docs/copilot/chat/copilot-chat) — 完整的聊天功能指南
- [VS Code 設定](https://code.visualstudio.com/docs/getstarted/settings) — 一般 VS Code 設定指南

## ™️ 商標

此專案可能包含專案、產品或服務的商標或標誌。授權使用 Microsoft 商標或標誌須遵守並遵循
[Microsoft 商標與品牌指引](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general)。
在此專案的修改版本中使用 Microsoft 商標或標誌不得造成混淆或暗示 Microsoft 的贊助。
任何第三方商標或標誌的使用須遵守該第三方的政策。
