#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// README 的範本區段
const TEMPLATES = {
  header: `# 🤖 超棒的 GitHub Copilot 自訂

[![Powered by Awesome Copilot](https://img.shields.io/badge/Powered_by-Awesome_Copilot-blue?logo=githubcopilot)](https://aka.ms/awesome-github-copilot)
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-86-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

透過社群貢獻的[指令](#-custom-instructions)、[提示](#-reusable-prompts)和[聊天模式](#-custom-chat-modes)來增強您的 GitHub Copilot 體驗。獲得遵循您團隊編碼標準和專案要求的一致 AI 協助。

<details>
<summary><strong>🎯 GitHub Copilot 自訂功能</strong></summary>

GitHub Copilot 提供三種主要方式來自訂 AI 回應並根據您的特定工作流程、團隊準則和專案要求調整協助：

| **🧩 [自訂聊天模式](#-custom-chat-modes)** | **🎯 [可重用提示](#-reusable-prompts)** | **📋 [自訂指令](#-custom-instructions)** |
| --- | --- | --- |
| 在每個請求的特定範圍內定義聊天行為、可用工具和程式碼庫互動模式<br><br>**優點：**<br>• 上下文感知協助<br>• 工具配置<br>• 角色特定工作流程 | 建立可重用的獨立提示以執行特定任務。描述 *應該做什麼*，並可選地提供任務特定準則<br><br>**優點：**<br>• 消除重複的提示撰寫<br>• 團隊間可共享<br>• 支援變數和依賴項 | 定義程式碼生成、審查和提交訊息等任務的通用準則。描述 *如何* 執行任務<br><br>**優點：**<br>• 自動包含在每個聊天請求中<br>• 儲存庫範圍的一致性<br>• 多種實作選項 |

> **💡 專業提示：** 自訂指令僅影響 Copilot Chat（不影響行內程式碼完成）。您可以結合所有三種自訂類型 - 使用自訂指令作為通用準則，提示檔案用於特定任務，聊天模式用於控制互動上下文。

</details>

<details>
<summary><strong>📝 貢獻</strong></summary>

我們歡迎貢獻！請參閱我們的[貢獻指南](./CONTRIBUTING.md)，了解如何提交新的指令和提示。

</details>`,

  instructionsSection: `## 📋 自訂指令

團隊和專案特定的指令，用於增強 GitHub Copilot 在特定技術和編碼實踐方面的行為。`,

  instructionsUsage: `### 如何使用自訂指令

**安裝方式：**
- 點擊您要使用的指令的 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.instructions.md\` 檔案並手動將其添加到您專案的指令集合中

**使用/應用方式：**
- 將這些指令複製到您工作區中的 \\.github/copilot-instructions.md\` 檔案
- 在您工作區的 \\.github/instructions\` 資料夾中建立任務特定的 \\.github/.instructions.md\` 檔案
- 指令一旦安裝到您的工作區，就會自動應用於 Copilot 的行為`,

  promptsSection: `## 🎯 可重用提示

用於特定開發場景和任務的即用型提示範本，定義了具有特定模式、模型和可用工具集的提示文本。`,

  promptsUsage: `### 如何使用可重用提示

**安裝方式：**
- 點擊您要使用的提示的 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.prompt.md\` 檔案並手動將其添加到您的提示集合中

**運行/執行方式：**
- 安裝後在 VS Code 聊天中使用 \\/prompt-name\`
- 從命令面板運行 \`Chat: Run Prompt\` 命令
- 在 VS Code 中打開提示檔案時點擊運行按鈕`,

  chatmodesSection: `## 🧩 自訂聊天模式

自訂聊天模式定義了 GitHub Copilot Chat 的特定行為和工具，為特定任務或工作流程提供增強的上下文感知協助。`,

  chatmodesUsage: `### 如何使用自訂聊天模式

**安裝方式：**
- 點擊您要使用的聊天模式的 **VS Code** 或 **VS Code Insiders** 安裝按鈕
- 下載 \`*.chatmode.md\` 檔案並使用命令面板手動將其安裝到 VS Code 中

**啟用/使用方式：**
- 將聊天模式配置導入到您的 VS Code 設定中
- 透過 VS Code 聊天介面存取已安裝的聊天模式
- 從 VS Code 聊天中的可用選項中選擇所需的聊天模式`,

  footer: `## 貢獻者 ✨

感謝這些出色的人 ([表情符號鍵](https://allcontributors.org/docs/en/emoji-key))：

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.aaron-powell.com/"><img src="https://avatars.githubusercontent.com/u/434140?v=4?s=100" width="100px;" alt="Aaron Powell"/><br /><sub><b>Aaron Powell</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=aaronpowell" title="Code">💻</a> <a href="#maintenance-aaronpowell" title="Maintenance">🚧</a> <a href="#projectManagement-aaronpowell" title="Project Management">📆</a> <a href="#promotion-aaronpowell" title="Promotion">📣</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://mubaidr.js.org/"><img src="https://avatars.githubusercontent.com/u/2222702?v=4?s=100" width="100px;" alt="Muhammad Ubaid Raza"/><br /><sub><b>Muhammad Ubaid Raza</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=mubaidr" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://digitarald.de/"><img src="https://avatars.githubusercontent.com/u/8599?v=4?s=100" width="100px;" alt="Harald Kirschner"/><br /><sub><b>Harald Kirschner</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=digitarald" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mbianchidev"><img src="https://avatars.githubusercontent.com/u/37507190?v=4?s=100" width="100px;" alt="Matteo Bianchi"/><br /><sub><b>Matteo Bianchi</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=mbianchidev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AungMyoKyaw"><img src="https://avatars.githubusercontent.com/u/9404824?v=4?s=100" width="100px;" alt="Aung Myo Kyaw"/><br /><sub><b>Aung Myo Kyaw</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=AungMyoKyaw" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://danielscottraynsford.com/"><img src="https://avatars.githubusercontent.com/u/7589164?v=4?s=100" width="100px;" alt="Daniel Scott-Raynsford"/><br /><sub><b>Daniel Scott-Raynsford</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=PlagueHO" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/burkeholland"><img src="https://avatars.githubusercontent.com/u/686963?v=4?s=100" width="100px;" alt="Burke Holland"/><br /><sub><b>Burke Holland</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=burkeholland" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://calva.io/"><img src="https://avatars.githubusercontent.com/u/30010?v=4?s=100" width="100px;" alt="Peter Strömberg"/><br /><sub><b>Peter Strömberg</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=PEZ" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.devprodlogs.com/"><img src="https://avatars.githubusercontent.com/u/51440732?v=4?s=100" width="100px;" alt="Daniel Meppiel"/><br /><sub><b>Daniel Meppiel</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=danielmeppiel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://montemagno.com/"><img src="https://avatars.githubusercontent.com/u/1676321?v=4?s=100" width="100px;" alt="James Montemagno"/><br /><sub><b>James Montemagno</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=jamesmontemagno" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VamshiVerma"><img src="https://avatars.githubusercontent.com/u/21999324?v=4?s=100" width="100px;" alt="Vamshi Verma"/><br /><sub><b>Vamshi Verma</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=VamshiVerma" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sinedied"><img src="https://avatars.githubusercontent.com/u/593151?v=4?s=100" width="100px;" alt="Yohan Lasorsa"/><br /><sub><b>Yohan Lasorsa</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=sinedied" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/OrenMe"><img src="https://avatars.githubusercontent.com/u/5461862?v=4?s=100" width="100px;" alt="Oren Me"/><br /><sub><b>Oren Me</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=OrenMe" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mjrousos"><img src="https://avatars.githubusercontent.com/u/10077254?v=4?s=100" width="100px;" alt="Mike Rousos"/><br /><sub><b>Mike Rousos</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=mjrousos" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/guiopen"><img src="https://avatars.githubusercontent.com/u/94094527?v=4?s=100" width="100px;" alt="Guilherme do Amaral Alves "/><br /><sub><b>Guilherme do Amaral Alves </b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=guiopen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.buymeacoffee.com/troystaylor"><img src="https://avatars.githubusercontent.com/u/44444967?v=4?s=100" width="100px;" alt="Troy Simeon Taylor"/><br /><sub><b>Troy Simeon Taylor</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=troystaylor" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/ambilykk/"><img src="https://avatars.githubusercontent.com/u/10282550?v=4?s=100" width="100px;" alt="Ambily"/><br /><sub><b>Ambily</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=ambilykk" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://tgrall.github.io/"><img src="https://avatars.githubusercontent.com/u/541250?v=4?s=100" width="100px;" alt="Tugdual Grall"/><br /><sub><b>Tugdual Grall</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=tgrall" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TianqiZhang"><img src="https://avatars.githubusercontent.com/u/5326582?v=4?s=100" width="100px;" alt="Tianqi Zhang"/><br /><sub><b>Tianqi Zhang</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=TianqiZhang" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/shubham070"><img src="https://avatars.githubusercontent.com/u/5480589?v=4?s=100" width="100px;" alt="Shubham Gaikwad"/><br /><sub><b>Shubham Gaikwad</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=shubham070" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sdolgin"><img src="https://avatars.githubusercontent.com/u/576449?v=4?s=100" width="100px;" alt="Saul Dolgin"/><br /><sub><b>Saul Dolgin</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=sdolgin" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nullchimp"><img src="https://avatars.githubusercontent.com/u/58362593?v=4?s=100" width="100px;" alt="NULLchimp"/><br /><sub><b>NULLchimp</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=nullchimp" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MattVevang"><img src="https://avatars.githubusercontent.com/u/20714898?v=4?s=100" width="100px;" alt="Matt Vevang"/><br /><sub><b>Matt Vevang</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=MattVevang" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://devkimchi.com/"><img src="https://avatars.githubusercontent.com/u/1538528?v=4?s=100" width="100px;" alt="Justin Yoo"/><br /><sub><b>Justin Yoo</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=justinyoo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hachyderm.io/@0gis0"><img src="https://avatars.githubusercontent.com/u/175379?v=4?s=100" width="100px;" alt="Gisela Torres"/><br /><sub><b>Gisela Torres</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=0GiS0" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://debbie.codes/"><img src="https://avatars.githubusercontent.com/u/13063165?v=4?s=100" width="100px;" alt="Debbie O'Brien"/><br /><sub><b>Debbie O'Brien</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=debs-obrien" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/agreaves-ms"><img src="https://avatars.githubusercontent.com/u/111466195?v=4?s=100" width="100px;" alt="Allen Greaves"/><br /><sub><b>Allen Greaves</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=agreaves-ms" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AmeliaRose802"><img src="https://avatars.githubusercontent.com/u/26167931?v=4?s=100" width="100px;" alt="Amelia Payne"/><br /><sub><b>Amelia Payne</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=AmeliaRose802" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SebastienDegodez"><img src="https://avatars.githubusercontent.com/u/2349146?v=4?s=100" width="100px;" alt="Sebastien DEGODEZ"/><br /><sub><b>Sebastien DEGODEZ</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=SebastienDegodez" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://graef.io/"><img src="https://avatars.githubusercontent.com/u/19261257?v=4?s=100" width="100px;" alt="Sebastian Gräf"/><br /><sub><b>Sebastian Gräf</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=segraef" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://9ssi7.dev/"><img src="https://avatars.githubusercontent.com/u/76786120?v=4?s=100" width="100px;" alt="Salih İbrahimbaş"/><br /><sub><b>Salih İbrahimbaş</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=9ssi7" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/inquinity"><img src="https://avatars.githubusercontent.com/u/406234?v=4?s=100" width="100px;" alt="Robert Altman"/><br /><sub><b>Robert Altman</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=inquinity" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pertrai1"><img src="https://avatars.githubusercontent.com/u/442374?v=4?s=100" width="100px;" alt="Rob Simpson"/><br /><sub><b>Rob Simpson</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=pertrai1" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ricksm.it/"><img src="https://avatars.githubusercontent.com/u/7207783?v=4?s=100" width="100px;" alt="Rick Smit"/><br /><sub><b>Rick Smit</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=ricksmit3000" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://dotneteers.net/"><img src="https://avatars.githubusercontent.com/u/28162552?v=4?s=100" width="100px;" alt="Peter Smulovics"/><br /><sub><b>Peter Smulovics</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=psmulovics" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pelikhan"><img src="https://avatars.githubusercontent.com/u/4175913?v=4?s=100" width="100px;" alt="Peli de Halleux"/><br /><sub><b>Peli de Halleux</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=pelikhan" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.paulomorgado.net/"><img src="https://avatars.githubusercontent.com/u/470455?v=4?s=100" width="100px;" alt="Paulo Morgado"/><br /><sub><b>Paulo Morgado</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=paulomorgado" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nickyt.co/"><img src="https://avatars.githubusercontent.com/u/833231?v=4?s=100" width="100px;" alt="Nick Taylor"/><br /><sub><b>Nick Taylor</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=nickytonline" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mikeparker104"><img src="https://avatars.githubusercontent.com/u/12763221?v=4?s=100" width="100px;" alt="Mike Parker"/><br /><sub><b>Mike Parker</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=mikeparker104" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mikekistler"><img src="https://avatars.githubusercontent.com/u/85643503?v=4?s=100" width="100px;" alt="Mike Kistler"/><br /><sub><b>Mike Kistler</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=mikekistler" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://a11ysupport.io/"><img src="https://avatars.githubusercontent.com/u/498678?v=4?s=100" width="100px;" alt="Michael Fairchild"/><br /><sub><b>Michael Fairchild</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=mfairchild365" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/michael-volz/"><img src="https://avatars.githubusercontent.com/u/129928?v=4?s=100" width="100px;" alt="Michael A. Volz (Flynn)"/><br /><sub><b>Michael A. Volz (Flynn)</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=michaelvolz" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/4regab"><img src="https://avatars.githubusercontent.com/u/178603515?v=4?s=100" width="100px;" alt="4regab"/><br /><sub><b>4regab</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=4regab" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TheovanKraay"><img src="https://avatars.githubusercontent.com/u/24420698?v=4?s=100" width="100px;" alt="Theo van Kraay"/><br /><sub><b>Theo van Kraay</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=TheovanKraay" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://glsauto.com/"><img src="https://avatars.githubusercontent.com/u/132710946?v=4?s=100" width="100px;" alt="Troy Witthoeft (glsauto)"/><br /><sub><b>Troy Witthoeft (glsauto)</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=twitthoeft-gls" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/iletai"><img src="https://avatars.githubusercontent.com/u/26614687?v=4?s=100" width="100px;" alt="Tài Lê"/><br /><sub><b>Tài Lê</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=iletai" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://tinyurl.com/3p5j9mwe"><img src="https://avatars.githubusercontent.com/u/9591887?v=4?s=100" width="100px;" alt="Udaya Veeramreddygari"/><br /><sub><b>Udaya Veeramreddygari</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=udayakumarreddyv" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://bio.warengonzaga.com/"><img src="https://avatars.githubusercontent.com/u/15052701?v=4?s=100" width="100px;" alt="Waren Gonzaga"/><br /><sub><b>Waren Gonzaga</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=warengonzaga" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://blog.miniasp.com/"><img src="https://avatars.githubusercontent.com/u/88981?v=4?s=100" width="100px;" alt="Will 保哥"/><br /><sub><b>Will 保哥</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=doggy8088" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yukiomoto"><img src="https://avatars.githubusercontent.com/u/38450410?v=4?s=100" width="100px;" alt="Yuki Omoto"/><br /><sub><b>Yuki Omoto</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=yukiomoto" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hueanmy"><img src="https://avatars.githubusercontent.com/u/20430626?v=4?s=100" width="100px;" alt="Meii"/><br /><sub><b>Meii</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=hueanmy" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/samqbush"><img src="https://avatars.githubusercontent.com/u/74389839?v=4?s=100" width="100px;" alt="samqbush"/><br /><sub><b>samqbush</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=samqbush" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sdanzo-hrb"><img src="https://avatars.githubusercontent.com/u/136493100?v=4?s=100" width="100px;" alt="sdanzo-hrb"/><br /><sub><b>sdanzo-hrb</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=sdanzo-hrb" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/voidfnc"><img src="https://avatars.githubusercontent.com/u/194750710?v=4?s=100" width="100px;" alt="voidfnc"/><br /><sub><b>voidfnc</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=voidfnc" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/webreidi"><img src="https://avatars.githubusercontent.com/u/55603905?v=4?s=100" width="100px;" alt="Wendy Breiding"/><br /><sub><b>Wendy Breiding</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=webreidi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/zooav"><img src="https://avatars.githubusercontent.com/u/12625412?v=4?s=100" width="100px;" alt="Ankur Sharma"/><br /><sub><b>Ankur Sharma</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=zooav" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://jianminhuang.cc/"><img src="https://avatars.githubusercontent.com/u/6296280?v=4?s=100" width="100px;" alt="黃健旻 Vincent Huang"/><br /><sub><b>黃健旻 Vincent Huang</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=Jian-Min-Huang" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dgh06175"><img src="https://avatars.githubusercontent.com/u/77305722?v=4?s=100" width="100px;" alt="이상현"/><br /><sub><b>이상현</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=dgh06175" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/abdidaudpropel"><img src="https://avatars.githubusercontent.com/u/51310019?v=4?s=100" width="100px;" alt="Abdi Daud"/><br /><sub><b>Abdi Daud</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=abdidaudpropel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.senseof.tech/"><img src="https://avatars.githubusercontent.com/u/50712277?v=4?s=100" width="100px;" alt="Adrien Clerbois"/><br /><sub><b>Adrien Clerbois</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=AClerbois" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.qreate.it/"><img src="https://avatars.githubusercontent.com/u/1868590?v=4?s=100" width="100px;" alt="Alan Sprecacenere"/><br /><sub><b>Alan Sprecacenere</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=tegola" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://asilva.dev/"><img src="https://avatars.githubusercontent.com/u/2493377?v=4?s=100" width="100px;" alt="André Silva"/><br /><sub><b>André Silva</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=askpt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://javaetmoi.com/"><img src="https://avatars.githubusercontent.com/u/838318?v=4?s=100" width="100px;" alt="Antoine Rey"/><br /><sub><b>Antoine Rey</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=arey" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/artemsaveliev"><img src="https://avatars.githubusercontent.com/u/15679218?v=4?s=100" width="100px;" alt="Artem Saveliev"/><br /><sub><b>Artem Saveliev</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=artemsaveliev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://brunoborges.io/"><img src="https://avatars.githubusercontent.com/u/129743?v=4?s=100" width="100px;" alt="Bruno Borges"/><br /><sub><b>Bruno Borges</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=brunoborges" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.peug.net/"><img src="https://avatars.githubusercontent.com/u/3845786?v=4?s=100" width="100px;" alt="Christophe Peugnet"/><br /><sub><b>Christophe Peugnet</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=tossnet" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.movinglive.ca/"><img src="https://avatars.githubusercontent.com/u/14792628?v=4?s=100" width="100px;" alt="Chtive"/><br /><sub><b>Chtive</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=MovingLive" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/craigbekker"><img src="https://avatars.githubusercontent.com/u/1115912?v=4?s=100" width="100px;" alt="Craig Bekker"/><br /><sub><b>Craig Bekker</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=craigbekker" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/breakid"><img src="https://avatars.githubusercontent.com/u/1446918?v=4?s=100" width="100px;" alt="Dan"/><br /><sub><b>Dan</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=breakid" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ewega"><img src="https://avatars.githubusercontent.com/u/26189114?v=4?s=100" width="100px;" alt="Eldrick Wega"/><br /><sub><b>Eldrick Wega</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=ewega" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.felixarjuna.dev/"><img src="https://avatars.githubusercontent.com/u/79026094?v=4?s=100" width="100px;" alt="Felix Arjuna"/><br /><sub><b>Felix Arjuna</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=felixarjuna" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/feapaydin"><img src="https://avatars.githubusercontent.com/u/19946639?v=4?s=100" width="100px;" alt="Furkan Enes"/><br /><sub><b>Furkan Enes</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=feapaydin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://learn.microsoft.com/dotnet"><img src="https://avatars.githubusercontent.com/u/24882762?v=4?s=100" width="100px;" alt="Genevieve Warren"/><br /><sub><b>Genevieve Warren</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=gewarren" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/geoder101"><img src="https://avatars.githubusercontent.com/u/145904?v=4?s=100" width="100px;" alt="George Dernikos"/><br /><sub><b>George Dernikos</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=geoder101" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/giomartinsdev"><img src="https://avatars.githubusercontent.com/u/125399281?v=4?s=100" width="100px;" alt="Giovanni de Almeida Martins"/><br /><sub><b>Giovanni de Almeida Martins</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=giomartinsdev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ioana37"><img src="https://avatars.githubusercontent.com/u/69301842?v=4?s=100" width="100px;" alt="Ioana A"/><br /><sub><b>Ioana A</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=Ioana37" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nohwnd"><img src="https://avatars.githubusercontent.com/u/5735905?v=4?s=100" width="100px;" alt="Jakub Jareš"/><br /><sub><b>Jakub Jareš</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=nohwnd" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://joe-watkins.io/"><img src="https://avatars.githubusercontent.com/u/3695795?v=4?s=100" width="100px;" alt="Joe Watkins"/><br /><sub><b>Joe Watkins</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=joe-watkins" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://johnpapa.net/"><img src="https://avatars.githubusercontent.com/u/1202528?v=4?s=100" width="100px;" alt="John Papa"/><br /><sub><b>John Papa</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=johnpapa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.sugbo4j.co.nz/"><img src="https://avatars.githubusercontent.com/u/15100839?v=4?s=100" width="100px;" alt="Joseph Gonzales"/><br /><sub><b>Joseph Gonzales</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=josephgonzales01" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://digio.es/"><img src="https://avatars.githubusercontent.com/u/173672918?v=4?s=100" width="100px;" alt="José Antonio Garrido"/><br /><sub><b>José Antonio Garrido</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=josegarridodigio" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ranrar"><img src="https://avatars.githubusercontent.com/u/95967772?v=4?s=100" width="100px;" alt="Kim Skov Rasmussen"/><br /><sub><b>Kim Skov Rasmussen</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=Ranrar" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/whiteken"><img src="https://avatars.githubusercontent.com/u/20211937?v=4?s=100" width="100px;" alt="Kenny White"/><br /><sub><b>Kenny White</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=whiteken" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/LouellaCreemers"><img src="https://avatars.githubusercontent.com/u/46204894?v=4?s=100" width="100px;" alt="Louella Creemers"/><br /><sub><b>Louella Creemers</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=LouellaCreemers" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://linktr.ee/lukemurray"><img src="https://avatars.githubusercontent.com/u/24467442?v=4?s=100" width="100px;" alt="Luke Murray"/><br /><sub><b>Luke Murray</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=lukemurraynz" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://marknoble.com/"><img src="https://avatars.githubusercontent.com/u/3819700?v=4?s=100" width="100px;" alt="Mark Noble"/><br /><sub><b>Mark Noble</b></sub></a><br /><a href="https://github.com/github/awesome-copilot/commits?author=marknoble" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

本專案遵循 [all-contributors](https://github.com/all-contributors/all-contributors) 規範。歡迎任何形式的貢獻！

## 📚 其他資源

- [VS Code Copilot 自訂文件](https://code.visualstudio.com/docs/copilot/copilot-customization) - 官方 Microsoft 文件
- [GitHub Copilot Chat 文件](https://code.visualstudio.com/docs/copilot/chat/copilot-chat) - 完整的聊天功能指南
- [自訂聊天模式](https://code.visualstudio.com/docs/copilot/chat/chat-modes) - 進階聊天配置
- [VS Code 設定](https://code.visualstudio.com/docs/getstarted/settings) - 一般 VS Code 配置指南

## 🛠️ 開發配置

此儲存庫使用各種配置檔案來確保一致的程式碼風格並避免行尾問題：

- [\[.editorconfig\](.editorconfig)](.editorconfig) - 定義不同編輯器和 IDE 的編碼風格
- [\[.gitattributes\](.gitattributes)](.gitattributes) - 確保文字檔案中一致的行尾
- [\[.vscode/settings.json\](.vscode/settings.json)](.vscode/settings.json) - 此儲存庫的 VS Code 特定設定
- [\[.vscode/extensions.json\](.vscode/extensions.json)](.vscode/extensions.json) - 推薦的 VS Code 擴充功能

> 💡 **注意**：此儲存庫中的所有 Markdown 檔案都使用 LF 行尾（Unix 風格）以避免混合行尾問題。儲存庫配置為自動處理行尾轉換。

## 📄 授權

此專案根據 MIT 授權發布 - 有關詳細資訊，請參閱 [LICENSE](LICENSE) 檔案。

## 🤝 行為準則

請注意，此專案隨附[貢獻者行為準則](CODE_OF_CONDUCT.md)。參與此專案即表示您同意遵守其條款。

## ™️ 商標

此專案可能包含專案、產品或服務的商標或標誌。
Microsoft 商標或標誌的授權使用受
[Microsoft 商標和品牌準則](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general)的約束並必須遵守。
在修改後的專案版本中使用 Microsoft 商標或標誌不得引起混淆或暗示 Microsoft 贊助。
任何第三方商標或標誌的使用均受該第三方政策的約束。`
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
