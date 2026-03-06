# 新手模式外掛程式 (Noob Mode Plugin)

為非技術背景的 Copilot CLI 使用者提供的淺顯易懂翻譯層。啟動後，Copilot 會自動將每個許可請求、錯誤訊息與技術輸出翻譯成清晰、不含專業術語的語言，並配有顏色標記的風險指標。

## 這是為誰準備的？ (Who Is This For?)

任何使用 Copilot CLI 但**不是**軟體開發人員的人：
- 律師與法律專業人士
- 產品經理與專案經理
- 業務關係人與高階主管
- 技術文件撰寫者與內容創作者
- 與程式碼相關工具搭配工作的設計師
- 任何剛開始接觸命令列的人

## 安裝 (Installation)

```bash
copilot plugin install noob-mode@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/noob-mode:noob-mode` | 為當前工作階段啟動新手模式。Copilot 將以白話文解釋一切 — 每個動作、每個許可請求以及每個結果。 |

### 隨附資產 (Bundled Assets)

| 資產 | 描述 |
|-------|-------------|
| `references/glossary.md` | 超過 100 個以白話文定義的技術術語，按類別組織 (Git、檔案系統、開發、網頁、Copilot CLI) |
| `references/examples.md` | 15 個前後對比範例，展示新手模式如何將技術輸出轉化為清晰的解釋 |

## 功能 (Features)

| 功能 | 對您的意義 |
|---|---|
| **核准翻譯** | 每當 Copilot 請求許可時，它會解釋它想要做「什麼」、為「什麼」、風險有多高，以及如果您說「是」或「否」會發生什麼 |
| **風險指標** | 顏色標記的風險等級 (🟢 低、🟡 中、🔴 高、⛔ 極高)，讓您可以立即查看動作是否安全 |
| **專業術語偵測** | 技術術語在第一次出現時會自動以白話文定義 |
| **逐步計畫** | 多步驟任務會從白話文路線圖開始，讓您知道接下來會發生什麼 |
| **輸出翻譯** | 錯誤訊息與指令結果會被翻譯成「這代表什麼意思」 |
| **完成摘要** | 在每個任務之後，您會得到一份關於更改了什麼、建立了什麼以及如何復原的摘要 |
| **決策支援** | 當您需要在選項之間做出選擇時，每個選項都會解釋優缺點並提供建議 |

## 範例 (Example)

**沒有新手模式：**
```
Allow tool: bash with command "grep -r 'indemnification' ./contracts/"?
[y/n]
```

**使用新手模式：**
```
📋 我正請求執行的動作：
我想要在您的 "contracts" 資料夾中搜尋所有檔案，找出 "indemnification" 這個字。

🎯 原因：
您要求我找出合約中所有提到 indemnification 的地方。

⚠️ 風險：🔴 高 (但在此情況下是安全的)
執行指令通常具有高風險，但這個指令僅進行搜尋 — 它不會
更改或刪除任何東西。

✅ 如果您核准：我將向您展示出現 "indemnification" 的每個檔案。
❌ 如果您拒絕：我可以逐一讀取檔案，但這會花費更長的時間。
```

## 如何關閉 (How to Turn Off)

在對話中說「關閉新手模式 (turn off noob mode)」，Copilot 將恢復其預設的溝通風格。

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
