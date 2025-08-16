#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// README 的範本區段
const TEMPLATES = {
  header: `# 🤖 超讚 GitHub Copilot 客製化

透過社群貢獻的[指令](#-自訂指令)、[提示](#-可重用提示)與[聊天模式](#-自訂聊天模式)，強化你的 GitHub Copilot 體驗。讓 AI 助理一致遵循你的團隊程式標準與專案需求。

<details>
<summary><strong>🎯 GitHub Copilot 客製化功能</strong></summary>

GitHub Copilot 提供三種主要方式，讓你自訂 AI 回應，並依據你的工作流程、團隊指引與專案需求量身打造協助：

| **🧩 [自訂聊天模式](#-自訂聊天模式)** | **🎯 [可重用提示](#-可重用提示)** | **📋 [自訂指令](#-自訂指令)** |
| --- | --- | --- |
| 為每次請求定義聊天行為、可用工具與程式庫互動範圍<br><br>**優點：**<br>• 情境感知協助<br>• 工具設定<br>• 角色專屬工作流程 | 建立可重用、獨立的提示，適用於特定任務。描述*要做什麼*，可選擇性加入任務指引<br><br>**優點：**<br>• 省去重複撰寫提示<br>• 團隊間可分享<br>• 支援變數與依賴 | 定義常用指引，適用於程式產生、審查、提交訊息等。描述*如何*執行任務<br><br>**優點：**<br>• 每次聊天請求自動套用<br>• 整個專案一致性<br>• 多種實作方式 |

> **💡 專家提示：** 自訂指令僅影響 Copilot Chat（不影響程式碼即時補全）。三種客製化方式可同時使用——用自訂指令設定一般指引、提示檔案處理特定任務、聊天模式控制互動情境。

</details>

<details>
<summary><strong>📝 貢獻方式</strong></summary>

歡迎貢獻！請參閱我們的[貢獻指南](./CONTRIBUTING.md)，瞭解如何提交新指令與提示。

</details>`,

  instructionsSection: `## 📋 自訂指令

團隊與專案專屬指令，強化 GitHub Copilot 在特定技術與程式實作上的行為：`,

  instructionsUsage: `> 💡 **使用方式**：將這些指令複製到你的 \`.github/copilot-instructions.md\` 檔案，或在工作區的 \`.github/instructions\` 資料夾建立任務專屬的 \`.github/.instructions.md\` 檔案。`,

  promptsSection: `## 🎯 可重用提示

針對特定開發情境與任務，提供可直接使用的提示範本，定義提示文字、模式、模型與可用工具集。`,

  promptsUsage: `> 💡 **使用方式**：在 VS Code 聊天中使用 \`/prompt-name\`，執行 \`Chat: Run Prompt\` 指令，或在開啟提示時點擊執行按鈕。`,

  chatmodesSection: `## 🧩 自訂聊天模式

自訂聊天模式可定義 GitHub Copilot Chat 的特定行為與工具，讓協助更貼合任務或工作流程。`,

  chatmodesUsage: `> 💡 **使用方式**：使用 \`Chat: Configure Chat Modes...\` 指令建立新聊天模式，然後在聊天輸入框將模式從 _Agent_ 或 _Ask_ 切換到你自己的模式。`,

  footer: `## 📚 其他資源

- [VS Code Copilot 客製化官方文件](https://code.visualstudio.com/docs/copilot/copilot-customization) - 微軟官方說明
- [GitHub Copilot Chat 文件](https://code.visualstudio.com/docs/copilot/chat/copilot-chat) - 完整聊天功能指南
- [自訂聊天模式](https://code.visualstudio.com/docs/copilot/chat/chat-modes) - 進階聊天設定
- [VS Code 設定](https://code.visualstudio.com/docs/getstarted/settings) - 一般 VS Code 設定說明

## 🛠️ 開發環境設定

本儲存庫使用多種設定檔，確保程式風格一致並避免換行問題：

- [\`.editorconfig\`](.editorconfig) - 跨編輯器程式風格設定
- [\`.gitattributes\`](.gitattributes) - 確保文字檔案換行一致
- [\`.vscode/settings.json\`](.vscode/settings.json) - VS Code 專案設定
- [\`.vscode/extensions.json\`](.vscode/extensions.json) - 推薦 VS Code 擴充套件

> 💡 **注意**：本儲存庫所有 markdown 檔案皆採用 LF 換行（Unix 樣式），避免混合換行問題。儲存庫已自動處理換行轉換。

## 📄 授權

本專案採用 MIT 授權，詳見 [LICENSE](LICENSE) 檔案。

## 🤝 行為準則

本專案已發布[貢獻者行為準則](CODE_OF_CONDUCT.md)。參與本專案即表示你同意遵守其規範。

## ™️ 商標

本專案可能包含專案、產品或服務的商標或標誌。
授權使用微軟商標或標誌必須遵循[微軟商標與品牌指南](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general)。
在本專案的修改版本中使用微軟商標或標誌，不得造成混淆或暗示微軟贊助。
任何第三方商標或標誌的使用，均須遵循該第三方政策。`,
};

// Add error handling utility
function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return defaultValue;
  }
}

function extractTitle(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      // Step 1: Look for title in frontmatter for all file types
      let inFrontmatter = false;
      let frontmatterEnded = false;

      for (const line of lines) {
        if (line.trim() === "---") {
          if (!inFrontmatter) {
            inFrontmatter = true;
          } else if (!frontmatterEnded) {
            frontmatterEnded = true;
          }
          continue;
        }

        if (inFrontmatter && !frontmatterEnded) {
          // Look for title field in frontmatter
          if (line.includes("title:")) {
            // Extract everything after 'title:'
            const afterTitle = line
              .substring(line.indexOf("title:") + 6)
              .trim();
            // Remove quotes if present
            const cleanTitle = afterTitle.replace(/^['"]|['"]$/g, "");
            return cleanTitle;
          }
        }
      }

      // Reset for second pass
      inFrontmatter = false;
      frontmatterEnded = false;

      // Step 2: For prompt/chatmode/instructions files, look for heading after frontmatter
      if (
        filePath.includes(".prompt.md") ||
        filePath.includes(".chatmode.md") ||
        filePath.includes(".instructions.md")
      ) {
        for (const line of lines) {
          if (line.trim() === "---") {
            if (!inFrontmatter) {
              inFrontmatter = true;
            } else if (inFrontmatter && !frontmatterEnded) {
              frontmatterEnded = true;
            }
            continue;
          }

          if (frontmatterEnded && line.startsWith("# ")) {
            return line.substring(2).trim();
          }
        }

        // Step 3: Format filename for prompt/chatmode/instructions files if no heading found
        const basename = path.basename(
          filePath,
          filePath.includes(".prompt.md")
            ? ".prompt.md"
            : filePath.includes(".chatmode.md")
            ? ".chatmode.md"
            : ".instructions.md"
        );
        return basename
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }

      // Step 4: For instruction files, look for the first heading
      for (const line of lines) {
        if (line.startsWith("# ")) {
          return line.substring(2).trim();
        }
      }

      // Step 5: Fallback to filename
      const basename = path.basename(filePath, path.extname(filePath));
      return basename
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    },
    filePath,
    path
      .basename(filePath, path.extname(filePath))
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

function extractDescription(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");

      // Parse frontmatter for description (for both prompts and instructions)
      const lines = content.split("\n");
      let inFrontmatter = false;

      // For multi-line descriptions
      let isMultilineDescription = false;
      let multilineDescription = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim() === "---") {
          if (!inFrontmatter) {
            inFrontmatter = true;
            continue;
          }
          break;
        }

        if (inFrontmatter) {
          // Check for multi-line description with pipe syntax (|)
          const multilineMatch = line.match(/^description:\s*\|(\s*)$/);
          if (multilineMatch) {
            isMultilineDescription = true;
            // Continue to next line to start collecting the multi-line content
            continue;
          }

          // If we're collecting a multi-line description
          if (isMultilineDescription) {
            // If the line has no indentation or has another frontmatter key, stop collecting
            if (!line.startsWith("  ") || line.match(/^[a-zA-Z0-9_-]+:/)) {
              // Join the collected lines and return
              return multilineDescription.join(" ").trim();
            }

            // Add the line to our multi-line collection (removing the 2-space indentation)
            multilineDescription.push(line.substring(2));
          } else {
            // Look for single-line description field in frontmatter
            const descriptionMatch = line.match(
              /^description:\s*['"]?(.+?)['"]?\s*$/
            );
            if (descriptionMatch) {
              let description = descriptionMatch[1];

              // Check if the description is wrapped in single quotes and handle escaped quotes
              const singleQuoteMatch = line.match(/^description:\s*'(.+?)'\s*$/);
              if (singleQuoteMatch) {
                // Replace escaped single quotes ('') with single quotes (')
                description = singleQuoteMatch[1].replace(/''/g, "'");
              }

              return description;
            }
          }
        }
      }

      // If we've collected multi-line description but the frontmatter ended
      if (multilineDescription.length > 0) {
        return multilineDescription.join(" ").trim();
      }

      return null;
    },
    filePath,
    null
  );
}

/**
 * Generate badges for installation links in VS Code and VS Code Insiders.
 * @param {string} link - The relative link to the instructions or prompts file.
 * @returns {string} - Markdown formatted badges for installation.
 */
const vscodeInstallImage =
  "https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white";
const vscodeInsidersInstallImage =
  "https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white";
const repoBaseUrl =
  "https://raw.githubusercontent.com/github/awesome-copilot/main";
const vscodeBaseUrl = "https://vscode.dev/redirect?url=";
const vscodeInsidersBaseUrl = "https://insiders.vscode.dev/redirect?url=";
function makeBadges(link, type) {
  return `[![Install in VS Code](${vscodeInstallImage})](${vscodeBaseUrl}${encodeURIComponent(
    `vscode:chat-${type}/install?url=${repoBaseUrl}/${link})`
  )}<br />[![Install in VS Code](${vscodeInsidersInstallImage})](${vscodeInsidersBaseUrl}${encodeURIComponent(
    `vscode-insiders:chat-${type}/install?url=${repoBaseUrl}/${link})`
  )}`;
}

/**
 * Generate the instructions section with a table of all instructions
 */
function generateInstructionsSection(instructionsDir) {
  // Check if directory exists
  if (!fs.existsSync(instructionsDir)) {
    return "";
  }

  // Get all instruction files
  const instructionFiles = fs
    .readdirSync(instructionsDir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  console.log(`Found ${instructionFiles.length} instruction files`);

  // Return empty string if no files found
  if (instructionFiles.length === 0) {
    return "";
  }

  // Create table header
  let instructionsContent =
    "| 標題 | 說明 |\n| ----- | ----------- |\n";

  // Generate table rows for each instruction file
  for (const file of instructionFiles) {
    const filePath = path.join(instructionsDir, file);
    const title = extractTitle(filePath);
    const link = encodeURI(`instructions/${file}`);

    // Check if there's a description in the frontmatter
    const customDescription = extractDescription(filePath);

    // Create badges for installation links
    const badges = makeBadges(link, "instructions");

    if (customDescription && customDescription !== "null") {
      // Use the description from frontmatter
      instructionsContent += `| [${title}](${link})<br />${badges} | ${customDescription} |\n`;
    } else {
      // Fallback to the default approach - use last word of title for description, removing trailing 's' if present
      const topic = title.split(" ").pop().replace(/s$/, "");
      instructionsContent += `| [${title}](${link})<br />${badges} | ${topic} specific coding standards and best practices |\n`;
    }
  }

  return `${TEMPLATES.instructionsSection}\n${TEMPLATES.instructionsUsage}\n\n${instructionsContent}`;
}

/**
 * Generate the prompts section with a table of all prompts
 */
function generatePromptsSection(promptsDir) {
  // Check if directory exists
  if (!fs.existsSync(promptsDir)) {
    return "";
  }

  // Get all prompt files
  const promptFiles = fs
    .readdirSync(promptsDir)
    .filter((file) => file.endsWith(".prompt.md"))
    .sort();

  console.log(`Found ${promptFiles.length} prompt files`);

  // Return empty string if no files found
  if (promptFiles.length === 0) {
    return "";
  }

  // Create table header
  let promptsContent =
    "| 標題 | 說明 |\n| ----- | ----------- |\n";

  // Generate table rows for each prompt file
  for (const file of promptFiles) {
    const filePath = path.join(promptsDir, file);
    const title = extractTitle(filePath);
    const link = encodeURI(`prompts/${file}`);

    // Check if there's a description in the frontmatter
    const customDescription = extractDescription(filePath);

    // Create badges for installation links
    const badges = makeBadges(link, "prompt");

    if (customDescription && customDescription !== "null") {
      promptsContent += `| [${title}](${link})<br />${badges} | ${customDescription} |\n`;
    } else {
      promptsContent += `| [${title}](${link})<br />${badges} | | |\n`;
    }
  }

  return `${TEMPLATES.promptsSection}\n${TEMPLATES.promptsUsage}\n\n${promptsContent}`;
}

/**
 * Generate the chat modes section with a table of all chat modes
 */
function generateChatModesSection(chatmodesDir) {
  // Check if chatmodes directory exists
  if (!fs.existsSync(chatmodesDir)) {
    console.log("Chat modes directory does not exist");
    return "";
  }

  // Get all chat mode files
  const chatmodeFiles = fs
    .readdirSync(chatmodesDir)
    .filter((file) => file.endsWith(".chatmode.md"))
    .sort();

  console.log(`Found ${chatmodeFiles.length} chat mode files`);

  // If no chat modes, return empty string
  if (chatmodeFiles.length === 0) {
    return "";
  }

  // Create table header
  let chatmodesContent =
    "| 標題 | 說明  |\n| ----- | ----------- |\n";

  // Generate table rows for each chat mode file
  for (const file of chatmodeFiles) {
    const filePath = path.join(chatmodesDir, file);
    const title = extractTitle(filePath);
    const link = encodeURI(`chatmodes/${file}`);

    // Check if there's a description in the frontmatter
    const customDescription = extractDescription(filePath);

    // Create badges for installation links
    const badges = makeBadges(link, "mode");

    if (customDescription && customDescription !== "null") {
      chatmodesContent += `| [${title}](${link})<br />${badges} | ${customDescription} |\n`;
    } else {
      chatmodesContent += `| [${title}](${link})<br />${badges} | | |\n`;
    }
  }

  return `${TEMPLATES.chatmodesSection}\n${TEMPLATES.chatmodesUsage}\n\n${chatmodesContent}`;
}

/**
 * Generate the complete README.md content from scratch
 */
function generateReadme() {
  const instructionsDir = path.join(__dirname, "instructions");
  const promptsDir = path.join(__dirname, "prompts");
  const chatmodesDir = path.join(__dirname, "chatmodes");

  // Generate each section
  const instructionsSection = generateInstructionsSection(instructionsDir);
  const promptsSection = generatePromptsSection(promptsDir);
  const chatmodesSection = generateChatModesSection(chatmodesDir);

  // Build the complete README content with template sections
  const sections = [TEMPLATES.header];

  // Only include sections that have content
  if (instructionsSection.trim()) sections.push(instructionsSection);
  if (promptsSection.trim()) sections.push(promptsSection);
  if (chatmodesSection.trim()) sections.push(chatmodesSection);

  sections.push(TEMPLATES.footer);

  return sections.join("\n\n");
}

// Main execution
try {
  console.log("Generating README.md from scratch...");

  const readmePath = path.join(__dirname, "README.md");
  const newReadmeContent = generateReadme();

  // Check if the README file already exists
  if (fs.existsSync(readmePath)) {
    const originalContent = fs.readFileSync(readmePath, "utf8");
    const hasChanges = originalContent !== newReadmeContent;

    if (hasChanges) {
      fs.writeFileSync(readmePath, newReadmeContent);
      console.log("README.md updated successfully!");
    } else {
      console.log("README.md is already up to date. No changes needed.");
    }
  } else {
    // Create the README file if it doesn't exist
    fs.writeFileSync(readmePath, newReadmeContent);
    console.log("README.md created successfully!");
  }
} catch (error) {
  console.error(`Error generating README.md: ${error.message}`);
  process.exit(1);
}
