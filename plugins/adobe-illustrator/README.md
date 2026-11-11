# Adobe Illustrator 外掛程式

Adobe Illustrator 指令碼撰寫、擴充功能與外掛程式開發、MCP 和命令列自動化，以及 Creative Cloud 資產管理，由 Adobe Creative Cloud 專家技術美術代理人主導。

## 安裝

```bash
copilot plugin install adobe-illustrator@awesome-copilot
```

## 包含內容

### 代理人

| 代理人 | 功能說明 |
| --- | --- |
| `Adobe Creative Cloud` | 一位專家技術美術，能挑選合適的 Creative Cloud 應用程式或應用程式組合、熟悉 Creative Cloud 儲存空間（雲端文件、專案、資料庫、Stock、本機檔案）、協助將工作移出已停止支援的應用程式、說明如何擴充各個應用程式，並主導以下兩項技能。 |

### 技能

| 技能 | 功能說明 |
| --- | --- |
| `adobe-illustrator-scripting` | 撰寫、偵錯並最佳化 Illustrator ExtendScript：文件、圖層、路徑、文字、色彩、工作區域、匯出，以及從 Illustrator 外部執行指令碼。 |
| `adobe-illustrator-integrations` | 建構並記錄指令碼周邊環境：CEP 擴充功能面板、C++ SDK 外掛程式、即將推出的 UXP 外掛程式、Illustrator MCP 伺服器、命令列與作業系統自動化、電腦操作工作階段，以及已發佈工具的安裝與使用文件。 |

## 使用案例

- 撰寫或修正 Illustrator 指令碼，從單行批次重新命名到資料驅動的藝術作品產生器
- 為複雜的 Illustrator 圖形撰寫逐步操作說明，或是為其他人將發佈的資產、外掛程式、擴充功能或指令碼撰寫文件
- 建構或擴充 MCP 伺服器，讓 AI 工具能夠控制 Illustrator
- 當某項功能沒有指令碼途徑時，透過電腦操作工具在 Illustrator 中工作
- 建構或修正 Illustrator CEP 擴充功能面板
- 建構或修正 Illustrator C++ 外掛程式
- 透過執行 ExtendScript 的批次檔、PowerShell、bash 或 AppleScript 指令碼來自動化 Illustrator
- 在專案或工作區中整理 Illustrator 和 Creative Cloud 檔案

## 範例提示詞

```text
撰寫一個 Illustrator 指令碼，將開啟文件中每個工作區域以 2x 匯出為 PNG
並存放到文件旁的 exports 資料夾中，命名為 acme-icons-<artboard name>.png。
```

```text
為 Illustrator 2026 建構一個 CEP 面板，讓設計師能從
Acme Corp 資料庫中挑選品牌色彩並套用至每個選取的路徑，並附上適用於 Windows 和 macOS 的安裝步驟。
```

```text
為 Illustrator 設計一個 MCP 伺服器，包含列出圖層、從允許清單資料夾執行具名指令碼，
以及匯出工作區域預覽的工具，並說明如何在 VS Code 中註冊它。
```

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。

## 授權

MIT