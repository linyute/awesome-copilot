import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// README 的範本區段
const TEMPLATES = {
  instructionsSection: `## 📋 自定義指引 (Custom Instructions)

用於增強 GitHub Copilot 在特定技術和編碼實作行為的團隊與專案特定指引。`,

  instructionsUsage: `### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-instructions) 以獲取有關如何貢獻新指引、改進現有指引以及分享您的使用案例的準則。

### 如何使用自定義指引

**安裝方式：**
- 針對您想要使用的指引，點擊 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.instructions.md\` 檔案並手動將其加入您專案的指引集合中

**使用/套用方式：**
- 將這些指引複製到工作區中的 \`.github/copilot-instructions.md\` 檔案中
- 在工作區的 \`.github/instructions/\` 資料夾中建立特定任務的 \`*.instructions.md\` 檔案 (例如：\`.github/instructions/my-csharp-rules.instructions.md\`)
- 一旦安裝到您的工作區中，指引將自動套用於 Copilot 的行為`,

  pluginsSection: `## 🔌 外掛程式 (Plugins)

圍繞特定主題、工作流程或使用案例組織的相關代理程式與技能精選外掛程式。外掛程式可直接透過 GitHub Copilot CLI 或 VS Code 安裝。

> **Awesome Copilot 為預設的外掛程式市集** — 在 Copilot CLI 或 VS Code 中皆無需額外設定即可使用。`,

  pluginsUsage: `### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-plugins) 以獲取有關如何貢獻新外掛程式、改進現有外掛程式以及分享您的使用案例的準則。

### 如何使用外掛程式

**瀏覽外掛程式：**
- ⭐ 精選外掛程式會被醒目提示並顯示在清單頂端
- 探索按主題分組相關自定義設定的外掛程式
- 每個外掛程式都包含針對特定工作流程的代理程式與技能
- 外掛程式讓針對特定情境採用完整的工具包變得容易

**在 Copilot CLI 中尋找與安裝：**
- 在互動式 Copilot 工作階段中瀏覽市集： \\\`/plugin marketplace browse awesome-copilot\\\`
- 安裝外掛程式： \\\`copilot plugin install <plugin-name>@awesome-copilot\\\`

**在 VS Code 中尋找與安裝：**
- 開啟 Extensions 搜尋視圖並輸入 \\\`@agentPlugins\\\` 以瀏覽可用外掛程式
- 或開啟指令面板並執行 \\\`Chat: Plugins\\\``,

  featuredPluginsSection: `## 🌟 精選外掛程式 (Featured Plugins)

探索我們圍繞特定主題與工作流程組織的代理程式與技能精選外掛程式。`,

  agentsSection: `## 🤖 自定義代理程式 (Custom Agents)

GitHub Copilot 的自定義代理程式，讓使用者與組織能透過簡單的檔案型設定來「專門化」他們的 Copilot 編碼代理程式 (CCA)。`,

  agentsUsage: `### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-agents) 以獲取有關如何貢獻新代理程式、改進現有代理程式以及分享您的使用案例的準則。

### 如何使用自定義代理程式

**安裝方式：**
- 針對您想要使用的代理程式，點擊 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.agent.md\` 檔案並將其加入您的存放區

**MCP 伺服器設定：**
- 每個代理程式可能需要一或多個 MCP 伺服器才能運作
- 點擊 MCP 伺服器以在 GitHub MCP 註冊表中檢視
- 遵循有關如何將 MCP 伺服器加入存放區的指引

**啟動/使用方式：**
- 透過 VS Code Chat 介面存取已安裝的代理程式、在 CCA 中指派它們，或透過 Copilot CLI 使用 (即將推出)
- 代理程式將能存取來自已設定之 MCP 伺服器的工具
- 遵循代理程式特定指引以獲得最佳使用體驗`,

  skillsSection: `## 🎯 代理程式技能 (Agent Skills)

代理程式技能是包含指引與隨附資源的獨立資料夾，可增強專門任務的 AI 能力。基於 [代理程式技能規格](https://agentskills.io/specification)，每個技能都包含一個 \`SKILL.md\` 檔案，其中包含代理程式按需載入的詳細指引。

技能與其他基本資源的不同之處在於支援隨附資產 (指令碼、程式碼範例、參考資料)，代理程式在執行專門任務時可以使用這些資產。`,

  skillsUsage: `### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-skills) 以獲取有關如何貢獻新代理程式技能、改進現有技能以及分享您的使用案例的準則。

### 如何使用代理程式技能

**包含內容：**
- 每個技能都是一個包含 \`SKILL.md\` 指引檔案的資料夾
- 技能可能包含輔助指令碼、程式碼範本或參考資料
- 技能遵循代理程式技能規格以實現最大相容性

**何時使用：**
- 技能非常適合受益於隨附資源的複雜、可重複工作流程
- 當您除了指引外還需要程式碼範本、輔助工具或參考資料時，請使用技能
- 技能提供漸進式揭露 — 僅在特定任務需要時才載入

**用法：**
- 瀏覽下方的技能表格以尋找相關功能
- 將技能資料夾複製到您的本機技能目錄
- 在提示中引用技能，或讓代理程式自動發現它們`,

  hooksSection: `## 🪝 勾點 (Hooks)

勾點可實作由 GitHub Copilot 編碼代理程式工作階段期間的特定事件觸發的自動化工作流程，例如工作階段開始、結束、使用者提示和工具使用。`,

  hooksUsage: `### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-hooks) 以獲取有關如何貢獻新勾點、改進現有勾點以及分享您的使用案例的準則。

### 如何使用勾點

**包含內容：**
- 每個勾點都是一個包含 \`README.md\` 檔案和 \`hooks.json\` 設定的資料夾
- 勾點可能包含輔助指令碼、工具或其他隨附資產
- 勾點遵循 [GitHub Copilot 勾點規格](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/use-hooks)

**安裝方式：**
- 將勾點資料夾複製到您存放區的 \`.github/hooks/\` 目錄
- 確保任何隨附指令碼皆具備執行權限 (\`chmod +x script.sh\`)
- 將勾點提交至您存放區的預設分支

**啟動/使用方式：**
- 勾點在 Copilot 編碼代理程式工作階段期間自動執行
- 在 \`hooks.json\` 檔案中設定勾點事件
- 可用事件：\`sessionStart\`, \`sessionEnd\`, \`userPromptSubmitted\`, \`preToolUse\`, \`postToolUse\`, \`errorOccurred\`

**何時使用：**
- 自動化工作階段記錄與稽核追蹤
- 在工作階段結束時自動提交變更
- 追蹤使用情形分析
- 與外部工具和服務整合
- 自定義工作階段工作流程`,

  workflowsSection: `## ⚡ 代理型工作流程 (Agentic Workflows)

[代理型工作流程](https://github.github.com/gh-aw) 是在 GitHub Actions 中執行編碼代理程式的 AI 驅動存放區自動化。這些工作流程以 Markdown 搭配自然語言指引定義，可實作事件觸發與排程的自動化，並具備內建護欄與安全性優先設計。`,

  workflowsUsage: `### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-agentic-workflows) 以獲取有關如何貢獻新工作流程、改進現有工作流程以及分享您的使用案例的準則。

### 如何使用代理型工作流程

**包含內容：**
- 每個工作流程都是一個包含 YAML Front Matter 與自然語言指引的獨立 \`.md\` 檔案
- 工作流程透過 \`gh aw compile\` 編譯為 \`.lock.yml\` GitHub Actions 檔案
- 工作流程遵循 [GitHub 代理型工作流程規格](https://github.github.com/gh-aw)

**安裝方式：**
- 安裝 \`gh aw\` CLI 延伸模組：\`gh extension install github/gh-aw\`
- 將工作流程 \`.md\` 檔案複製到您存放區的 \`.github/workflows/\` 目錄
- 使用 \`gh aw compile\` 進行編譯以產生 \`.lock.yml\` 檔案
- 同時提交 \`.md\` 與 \`.lock.yml\` 檔案

**啟動/使用方式：**
- 工作流程根據其配置的觸發條件 (排程、事件、斜線命令) 自動執行
- 使用 \`gh aw run <workflow>\` 手動觸發執行
- 使用 \`gh aw status\` 與 \`gh aw logs\` 監控執行狀況

**何時使用：**
- 自動化問題分類與標籤指派
- 產生每日狀態報告
- 自動維護文件
- 執行排程程式碼品質檢查
- 回應問題與 PR 中的斜線命令
- 編排多步驟的存放區自動化`,
};

const vscodeInstallImage =
  "https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white";

const vscodeInsidersInstallImage =
  "https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white";

const repoBaseUrl =
  "https://raw.githubusercontent.com/linyute/awesome-copilot/main";

const AKA_INSTALL_URLS = {
  instructions: "https://aka.ms/awesome-copilot/install/instructions",
  agent: "https://aka.ms/awesome-copilot/install/agent",
  hook: "https://aka.ms/awesome-copilot/install/hook",
};

const ROOT_FOLDER = path.join(__dirname, "..");
const INSTRUCTIONS_DIR = path.join(ROOT_FOLDER, "instructions");
const AGENTS_DIR = path.join(ROOT_FOLDER, "agents");
const SKILLS_DIR = path.join(ROOT_FOLDER, "skills");
const HOOKS_DIR = path.join(ROOT_FOLDER, "hooks");
const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const WORKFLOWS_DIR = path.join(ROOT_FOLDER, "workflows");
const COOKBOOK_DIR = path.join(ROOT_FOLDER, "cookbook");
const MAX_PLUGIN_ITEMS = 50;

// 代理程式技能驗證常數
const SKILL_NAME_MIN_LENGTH = 1;
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_DESCRIPTION_MIN_LENGTH = 10;
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

const DOCS_DIR = path.join(ROOT_FOLDER, "docs");

export {
  AGENTS_DIR,
  AKA_INSTALL_URLS,
  COOKBOOK_DIR,
  DOCS_DIR,
  HOOKS_DIR,
  INSTRUCTIONS_DIR,
  MAX_PLUGIN_ITEMS,
  PLUGINS_DIR,
  repoBaseUrl,
  ROOT_FOLDER,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_DESCRIPTION_MIN_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_NAME_MIN_LENGTH,
  SKILLS_DIR,
  TEMPLATES,
  vscodeInsidersInstallImage,
  vscodeInstallImage,
  WORKFLOWS_DIR,
};
