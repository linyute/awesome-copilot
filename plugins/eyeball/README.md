# Eyeball

這是一個幫助驗證 AI 陳述的工具，旨在減少 (或至少緩解) 切換內容帶來的痛苦。

當 AI 分析一份文件並告訴您「第 10 節要求共同賠償」時，您如何知道第 10 節實際上是這麼說的？Eyeball 讓您可以親眼確認。

這是一個 Copilot CLI 外掛程式，它產生的文件分析為 Word 檔案，並在其中包含原始資料相關部分的內建螢幕截圖。分析中的每項事實主張都包含原始文件中的反白顯示摘錄，因此您可以驗證每項斷言，而無需在檔案之間切換或尋找正確的頁面。

## 它的功能

您給予 Copilot 一份文件 (Word 檔案、PDF 或網頁 URL) 並要求它分析特定內容。Eyeball 會讀取原始資料、撰寫分析，並針對每項主張，從原始文件中截取相關章節的螢幕截圖，並將引用的文字以黃色反白顯示。輸出結果是您桌面上的一個 Word 文件，其中分析文字和原始資料螢幕截圖交錯排列。

如果分析顯示「第 9.3 節允許在 30 天的補救期後因故終止」，其下方的螢幕截圖將顯示實際文件中的第 9.3 節，並將該文字反白顯示。如果螢幕截圖顯示的內容不同，則分析是錯誤的，您可以立即發現。

## 安裝

### 前提條件

- 已安裝並通過身分驗證的 [Copilot CLI](https://docs.github.com/copilot/concepts/agents/about-copilot-cli)
- Python 3.8 或更高版本
- 以下其中之一用於支援 Word 文件 (PDF 和網頁 URL 無需這些即可運作)：
  - Microsoft Word (macOS 或 Windows)
  - LibreOffice (任何平台)

### 安裝外掛程式

透過 Copilot CLI 外掛程式系統安裝。在 Copilot CLI 交談中：

```
install the eyeball plugin from github/awesome-copilot
```

### 安裝相依性

安裝外掛程式後，安裝 Python 相依性：

```bash
pip install pymupdf pillow python-docx playwright
python -m playwright install chromium
```

在 Windows 上，還要安裝用於 Word 自動化的 pywin32：
```bash
pip install pywin32
```

### 驗證設定

```bash
python3 skills/eyeball/tools/eyeball.py setup-check
```

這會顯示您的機器支援哪些原始資料類型。

## 如何使用

在 Copilot CLI 交談中，告訴它使用 eyeball 以及您要分析的內容：

```
use eyeball on ~/Desktop/vendor-agreement.docx -- analyze the indemnification
and liability provisions and flag anything unusual
```

```
run eyeball on https://example.com/terms-of-service -- identify the
developer-friendly aspects of these terms
```

```
use eyeball to analyze this NDA for non-compete provisions
```

Eyeball 會啟動、讀取原始文件、撰寫帶有確切章節參考的分析，並在您的桌面上產生一個帶有內建原始資料螢幕截圖的 Word 文件。

## 支援範圍

| 原始資料類型 | 要求 |
|---|---|
| PDF 檔案 | Python + PyMuPDF (已包含在設定中) |
| 網頁 | Python + Playwright + Chromium (已包含在設定中) |
| Word 文件 (.docx) | Microsoft Word (macOS/Windows) 或 LibreOffice (任何平台)。在 Windows 上，還需要 pywin32 (已包含在設定中)。 |

## 運作原理

1. Eyeball 讀取原始文件的全文
2. 它撰寫帶有確切章節編號、頁面參考和逐字引用的分析
3. 針對每項主張，它在算繪出的原始資料中搜尋引用的文字
4. 它截取包含引用文字的周圍區域螢幕截圖，並將引用文字以黃色反白顯示
5. 它將分析段落和螢幕截圖交錯排列，組合成一個 Word 文件
6. 輸出結果存放在您的桌面

螢幕截圖是動態調整大小的：如果分析中的某個部分引用的文字跨越了較大區域，螢幕截圖會擴大以覆蓋該區域。如果引用的文字出現在多個頁面上，螢幕截圖會拼接在一起。

## 為什麼使用螢幕截圖而不是引用文字？

在對幻覺 (hallucination) 敏感的語境中，有時我們需要看到憑據。

引用文字很容易造假。模型可以產生一個聽起來很合理的引用，但實際上並未出現在原始資料中，如果不進行檢查，您永遠不會知道。來自算繪原始資料的螢幕截圖較難偽造；它們顯示了原始文件的實際格式、版面配置和周圍內容。您可以一目了然地看到反白顯示的文字是否符合主張，且周圍的文字提供了摘錄引用可能遺漏的背景資訊。

## 限制

- Word 文件轉換需要 Microsoft Word 或 LibreOffice。如果沒有其中之一，您仍然可以對 PDF 和網頁 URL 使用 Eyeball。
- 文字搜尋是字串比對。如果原始文件使用不尋常的編碼、連字或非標準字元，某些搜尋可能無法比對成功。技能指令會要求 AI 使用提取文字中的逐字片語，這可以處理大多數情況。
- 網頁算繪取決於 Playwright，可能無法完美擷取所有動態內容 (例如，在頁面載入後由 JavaScript 載入的內容、登入牆後的內容)。
- 螢幕截圖品質取決於原始資料的格式。密集的多欄版面或非常小的文字可能會產生較難閱讀的螢幕截圖。如有需要，請增加 DPI 設定。

## 授權

MIT
