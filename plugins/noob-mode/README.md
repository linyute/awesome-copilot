# Noob 模式外掛程式

適用於非技術背景 Copilot CLI 使用者的淺白英文翻譯層。啟用後，Copilot 會自動將每個權限請求、錯誤訊息與技術輸出翻譯為清晰、無行話的語言，並帶有顏色編碼的風險指標。

## 這是為誰準備的？

任何使用 Copilot CLI 但**不是**軟體開發人員的人：
- 律師與法律專業人員
- 產品經理與專案經理
- 業務利害關係人與主管
- 技術作家與內容創作者
- 使用程式碼相關工具的設計師
- 任何剛接觸命令列的人

## 安裝

```bash
copilot plugin install noob-mode@awesome-copilot
```

## 內含項目

### 指令 (Slash Commands)

| 指令 | 說明 |
|---------|-------------|
| `/noob-mode:noob-mode` | 為目前工作階段啟用 Noob 模式。Copilot 將以淺白英文解釋所有內容 — 每個動作、每個權限請求與每個結果。 |

### 隨附資產

| 資產 | 說明 |
|-------|-------------|
| `references/glossary.md` | 100 多個以淺白英文定義的技術術語，依類別組織（Git、檔案系統、開發、Web、Copilot CLI） |
| `references/examples.md` | 15 個前後對比範例，展示 Noob 模式如何將技術輸出轉換為清晰的解釋 |

## 功能

| 功能 | 對您而言代表什麼 |
|---|---|
| **核准翻譯** | 每次 Copilot 請求權限時，它都會解釋它想做「什麼」、為「什麼」要做、有多「危險」，以及如果您同意或拒絕會發生什麼 |
| **風險指標** | 顏色編碼的風險等級（🟢 低、🟡 中等、🔴 高、⛔ 危急），以便您立即看出某個動作是否安全 |
| **行話偵測** | 技術術語在首次出現時會自動以淺白英文定義 |
| **逐步計畫** | 多步驟工作會先提供淺白英文的藍圖，讓您了解後續內容 |
| **輸出翻譯** | 錯誤訊息與指令結果會翻譯為「這代表什麼意思」 |
| **完成摘要** | 在每項工作完成後，您會獲得一份摘要，說明變更了什麼、建立了什麼以及如何還原 |
| **決策支援** | 當您需要在選項之間進行選擇時，每個選項都會附帶權衡說明與建議 |

## 範例

**沒有 Noob 模式：**
```
Allow tool: bash with command "grep -r 'indemnification' ./contracts/"?
[y/n]
```

**使用 Noob 模式：**
```
📋 WHAT I'M ASKING TO DO:
I want to search all files in your "contracts" folder for the word "indemnification."

🎯 WHY:
You asked me to find every mention of indemnification across your contracts.

⚠️ RISK: 🔴 High (but safe in this case)
Running commands is generally high-risk, but this one only searches — it doesn't
change or delete anything.

✅ If you approve: I'll show you every file where "indemnification" appears.
❌ If you decline: I can read files one by one instead, but it'll take longer.
```

## 如何關閉

在對話中說 "turn off noob mode"，Copilot 就會返回預設的溝通風格。

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個由社群驅動的 GitHub Copilot 擴充功能集合。

## 授權條款

MIT
