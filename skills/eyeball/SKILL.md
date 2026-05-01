---
name: eyeball
description: '具備內建原始資料螢幕截圖的文件分析。當您要求 Copilot 分析文件時，Eyeball 會產生一個 Word 文件，其中每項事實主張都包含原始資料的反白顯示螢幕截圖，讓您可以親眼驗證。'
---

# Eyeball

具備視覺證明的分析文件。啟動時，Eyeball 會在使用的桌面上產生一個 Word 文件，其中每項事實主張都包含原始資料的內嵌螢幕截圖，並將引用的文字以黃色反白顯示。

## 啟動

當使用者呼叫此技能時 (例如：「使用 eyeball」、「對此執行 eyeball」、「eyeball 這份文件」)，請回應：

> **Eyeball 已啟動。** 我將分析該文件並產生一個帶有內建原始資料螢幕截圖的 Word 文件，以便您親眼驗證每項主張。

然後遵循以下工作流程。

## 支援的來源

- **本機檔案：** Word 文件 (.docx, .doc)、PDF (.pdf)、RTF 檔案
- **網頁 URL：** 任何可公開存取的網頁

## 工具位置

Eyeball Python 工具位於：
```
<plugin_dir>/skills/eyeball/tools/eyeball.py
```

如需尋找實際路徑，請執行：
```bash
find ~/.copilot/installed-plugins -name "eyeball.py" -path "*/eyeball/*" 2>/dev/null
```

如果在那裡找不到，請檢查專案目錄或使用者主目錄中的 eyeball 存放庫。

## 首次執行設置

首次使用前，請檢查是否已安裝相依性：

```bash
python3 <路徑>/eyeball.py setup-check
```

如果缺少任何內容，請安裝必要的相依性：
```bash
pip3 install pymupdf pillow python-docx playwright
python3 -m playwright install chromium
```

在 Windows 上，還要安裝用於 Word 自動化的 pywin32：
```bash
pip install pywin32
```

## 工作流程

請嚴格遵循以下步驟。順序很重要。

### 步驟 1：讀取原始文字

在撰寫任何分析之前，請先提取並讀取來源文件的全文：

```bash
python3 <路徑>/eyeball.py extract-text --source "<路徑或 URL>"
```

仔細閱讀輸出內容。識別實際的章節編號、標題、頁碼和關鍵文字。

**關鍵：** 不要略過此步驟。不要基於對文件結構的假設來撰寫分析。請閱讀實際文字。

### 步驟 2：撰寫帶有確切引用的分析

針對分析中的每一點，您必須：

1. **參考文件中顯示的正確章節編號** (例如：是「第 9 節」而不是您假設編號後的「第 8 節」)。
2. **參考章節在提取文字中出現的正確頁碼**。
3. **選擇與原始資料完全一致的片語作為錨點 (anchor)**，以直接支持您的主張。

### 步驟 3：正確選擇錨點

這是最重要的步驟。錨點決定了螢幕截圖中反白顯示的內容。

**要做到：**
- 使用原始文字中直接支持您斷言的逐字片語
- 使用多個錨點以涵蓋讀者應該看到的完整文字範圍
- 使用僅在您意圖的位置出現的、特定且不常見的片語

**不要做：**
- 使用在整份文件中重複出現的通用主題標籤 (例如：「機密性」)
- 當章節標題在其他地方作為交叉引用出現時，僅單獨使用章節標題
- 使用會在許多地方匹配的單個常用詞

**範例：**

錯誤 -- 使用了隨處都會匹配的通用主題標籤：
```json
{"anchors": ["User-Generated Content"], "target_page": 8}
```

正確 -- 使用了支持主張的具體語言：
```json
{"anchors": ["retain ownership", "Ownership of Content, Right to Post"], "target_page": 8}
```

錯誤 -- 章節標題在之前的頁面中作為交叉引用出現：
```json
{"anchors": ["LIMITATION OF LIABILITY"]}
```

正確 -- 包含章節編號以確保精確度，並鎖定正確頁面：
```json
{"anchors": ["12. LIMITATION OF LIABILITY", "INDIRECT", "CONSEQUENTIAL"], "target_page": 13}
```

### 步驟 4：建置分析文件

構建一個章節的 JSON 陣列並呼叫建置指令：

```bash
python3 <路徑>/eyeball.py build \
  --source "<路徑或 URL>" \
  --output ~/Desktop/<標題>.docx \
  --title "分析標題" \
  --subtitle "來源說明" \
  --sections '[
    {
      "heading": "1. 章節標題",
      "analysis": "您的分析文字。參考第 Y 頁的第 X 節...",
      "anchors": ["逐字片語 1", "逐字片語 2"],
      "target_page": 5,
      "context_padding": 40
    },
    {
      "heading": "2. 另一個章節",
      "analysis": "更多分析...",
      "anchors": ["來自原始資料的確切引用"],
      "target_pages": [10, 11],
      "context_padding": 50
    }
  ]'
```

章節物件欄位：
- `heading` (必要)：輸出文件中的章節標題
- `analysis` (必要)：您的分析文字
- `anchors` (必要)：要搜尋並反白顯示的原始資料逐字片語清單
- `target_page` (選填)：要搜尋的單一頁碼 (從 1 開始)
- `target_pages` (選填)：要跨頁搜尋的頁碼清單 (螢幕截圖將垂直拼接)
- `context_padding` (選填)：錨點區域上方/下方的 PDF 點數邊距 (預設：40)。增加此值以獲得更多背景資訊。

### 步驟 5：交付輸出

將輸出儲存至使用者的桌面。告訴使用者檔案名稱，並說明他們可以開啟檔案，對照反白顯示的原始資料螢幕截圖來驗證每項主張。

## 交付前的自我檢查

在儲存最終文件之前，請在心中驗證：

1. 每個章節的分析文字是否參考了原始資料中的正確章節編號？
2. 錨點是否為出現在目標頁面上的逐字片語？
3. 每個錨點是否直接支持分析中的主張，而不僅僅是與同一主題相關？
4. 如果螢幕截圖與分析不符，是分析錯誤還是錨點錯誤？修正錯誤的那一個。

## 備註

- 輸出文件包含動態調整大小的反白顯示螢幕截圖。如果您提供多個錨點，螢幕截圖會擴大以涵蓋所有錨點。
- 找不到搜尋詞時，輸出文件會予以註明。如果發生這種情況，可能是錨點不夠逐字。請調整並重建。
- 對於網頁，Playwright 會先將頁面算繪為 PDF。產生的頁碼可能與您在瀏覽器中看到的有所不同。請使用提取的文字輸出 (步驟 1) 來確定正確的頁碼。
- 如果使用者已經提供了原始文字，或者您已經在當外交談中閱讀過，則可以略過步驟 1。但在撰寫分析之前，請務必對照實際文字驗證章節編號與頁面參考。
