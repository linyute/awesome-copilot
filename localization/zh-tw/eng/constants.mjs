import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// README 的模板區塊
const TEMPLATES = {
  instructionsSection: `## 📋 自訂指示

團隊和專案特定的指示，用於增強 GitHub Copilot 針對特定技術和程式碼實踐的行為。`,

  instructionsUsage: `### 如何使用自訂指示

**安裝方式：**
- 點擊您要使用的指示的 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.instructions.md\` 檔案並手動將其新增到您專案的指示集合中

**使用/應用方式：**
- 將這些指示複製到您工作區中的 \`.github/copilot-instructions.md\` 檔案
- 在您工作區的 \`.github/instructions/\` 資料夾中建立任務特定的 \`*.instructions.md\` 檔案 (例如 \`.github/instructions/my-csharp-rules.instructions.md\`)
- 指示一旦安裝到您的工作區，就會自動應用於 Copilot 的行為`,

  promptsSection: `## 🎯 可重複使用的提示

用於特定開發情境和任務的即用型提示模板，定義具有特定模式、模型和可用工具集的提示文字。`,

  promptsUsage: `### 如何使用可重複使用的提示

**安裝方式：**
- 點擊您要使用的提示的 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.prompt.md\` 檔案並手動將其新增到您的提示集合中

**執行方式：**
- 安裝後在 VS Code 聊天中使用 \`/prompt-name\`
- 從命令面板執行 \`Chat: Run Prompt\` 命令
- 在 VS Code 中開啟提示檔案時點擊執行按鈕`,

  collectionsSection: `## 📦 集合

圍繞特定主題、工作流程或使用案例組織的相關提示、指示和代理程式的精選集合。`,

  collectionsUsage: `### 如何使用集合

**瀏覽集合：**
- ⭐ 精選集合會被突顯並顯示在列表頂部
- 探索將相關自訂分組的主題集合
- 每個集合都包含用於特定工作流程的提示、指示和代理程式
- 集合讓採用針對特定情境的全面工具包變得容易

**安裝項目：**
- 點擊集合中個別項目的安裝按鈕
- 或者瀏覽到個別檔案以手動複製內容
- 集合可協助您發現可能錯過的相關自訂`,

  featuredCollectionsSection: `## 🌟 精選集合

探索我們精選的提示、指示和代理程式集合，這些集合圍繞特定主題和工作流程組織。`,

  agentsSection: `## 🤖 自訂代理程式

GitHub Copilot 的自訂代理程式，讓使用者和組織可以透過簡單的檔案型組態輕鬆「專門化」他們的 Copilot 程式碼代理程式 (CCA)。`,

  agentsUsage: `### 如何使用自訂代理程式

**安裝方式：**
- 點擊您要使用的代理程式的 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.agent.md\` 檔案並將其新增到您的儲存庫

**MCP 伺服器設定：**
- 每個代理程式可能需要一個或多個 MCP 伺服器才能運作
- 點擊 MCP 伺服器以在 GitHub MCP 註冊表中檢視它
- 遵循有關如何將 MCP 伺服器新增到您的儲存庫的指南

**啟用/使用方式：**
- 透過 VS Code 聊天介面存取已安裝的代理程式，在 CCA 中指派它們，或透過 Copilot CLI (即將推出)
- 代理程式將有權存取來自已組態 MCP 伺服器的工具
- 遵循代理程式特定的指示以獲得最佳使用效果`,

  skillsSection: `## 🎯 代理程式技能

代理程式技能是自成一體的資料夾，包含指示和捆綁資源，可增強 AI 針對專業任務的應用程式能力。根據 [代理程式技能規範](https://agentskills.io/specification)，每個技能都包含一個 \`SKILL.md\` 檔案，其中包含代理程式按需載入的詳細指示。

技能與其他基本類型不同，它支援捆綁資產（腳本、程式碼範例、參考資料），代理程式可以在執行專業任務時利用這些資產。`,

  skillsUsage: `### 如何使用代理程式技能

**包含內容：**
- 每個技能都是一個資料夾，包含一個 \`SKILL.md\` 指示檔案
- 技能可能包含輔助腳本、程式碼範本或參考資料
- 技能遵循代理程式技能規範以實現最大相容性

**何時使用：**
- 技能非常適合複雜、可重複的工作流程，這些工作流程可受益於捆綁資源
- 當您需要程式碼範本、輔助公用程式或參考資料以及指示時，請使用技能
- 技能提供漸進式揭露 - 僅在需要特定任務時載入

**用法：**
- 瀏覽下面的技能表以搜尋相關功能
- 將技能資料夾複製到您的本機技能目錄
- 在您的提示中參考技能或讓代理程式自動探索它們`,
};

const vscodeInstallImage =
  "https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white";

const vscodeInsidersInstallImage =
  "https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white";

const repoBaseUrl =
  "https://raw.githubusercontent.com/linyute/awesome-copilot/main/localization/zh-tw";

const AKA_INSTALL_URLS = {
  instructions: "https://aka.ms/awesome-copilot/install/instructions",
  prompt: "https://aka.ms/awesome-copilot/install/prompt",
  agent: "https://aka.ms/awesome-copilot/install/agent",
};

const ROOT_FOLDER = path.join(__dirname, "..");
const INSTRUCTIONS_DIR = path.join(ROOT_FOLDER, "instructions");
const PROMPTS_DIR = path.join(ROOT_FOLDER, "prompts");
const AGENTS_DIR = path.join(ROOT_FOLDER, "agents");
const SKILLS_DIR = path.join(ROOT_FOLDER, "skills");
const COLLECTIONS_DIR = path.join(ROOT_FOLDER, "collections");
const MAX_COLLECTION_ITEMS = 50;

// Agent Skills validation constants
const SKILL_NAME_MIN_LENGTH = 1;
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_DESCRIPTION_MIN_LENGTH = 10;
const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

const DOCS_DIR = path.join(ROOT_FOLDER, "docs");

export {
  TEMPLATES,
  vscodeInstallImage,
  vscodeInsidersInstallImage,
  repoBaseUrl,
  AKA_INSTALL_URLS,
  ROOT_FOLDER,
  INSTRUCTIONS_DIR,
  PROMPTS_DIR,
  AGENTS_DIR,
  SKILLS_DIR,
  COLLECTIONS_DIR,
  MAX_COLLECTION_ITEMS,
  SKILL_NAME_MIN_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_DESCRIPTION_MIN_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  DOCS_DIR,
};
