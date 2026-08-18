協助驗證 AI 陳述的工具，免除（或至少減少）切換情境的困擾。

當 AI 分析一份文件並告訴您「第 10 條要求雙方共同賠償」時，您如何知道第 10 條確實是這樣寫的？Eyeball 讓您可以親眼確認。

這是一個 Copilot CLI 外掛模組，可產生 Word 檔案格式的文件分析，並內嵌來自原始資料相關部分的螢幕擷取畫面。分析中的每個事實宣告都包含從原始文件中醒目提示的摘錄，因此您無需在檔案之間切換或尋找正確頁面即可驗證每個斷言。

## 功能說明

您提供 Copilot 一份文件（Word 檔案、PDF 或網頁 URL），並要求其分析特定內容。Eyeball 讀取來源、撰寫分析，並針對每個宣告擷取原始文件中相關章節的螢幕擷取畫面，同時將引用的文字以黃色醒目提示。輸出結果是放置在您桌面上的 Word 文件，其中交錯呈現分析文字與來源螢幕擷取畫面。

若分析指出「第 9.3 條允許在具備 30 天補救期的情況下因故終止」，其下方的螢幕擷取畫面會顯示實際文件中的第 9.3 條，並醒目提示該用語。若螢幕擷取畫面顯示不同的內容，則表示分析有誤，您可以立即察覺。

## 安裝

### 先決條件

- 已安裝並經過驗證的 [Copilot CLI](https://docs.github.com/copilot/concepts/agents/about-copilot-cli)
- Python 3.8 或更新版本
- 下列其中之一以支援 Word 文件（PDF 與網頁 URL 在沒有這些的情況下亦可運作）：
  - Microsoft Word (macOS 或 Windows)
  - LibreOffice（任何平台）

### 安裝外掛模組

透過 Copilot CLI 外掛模組系統安裝。在 Copilot CLI 對話中：

```
install the eyeball plugin from github/awesome-copilot
```

### 安裝相依套件

安裝外掛模組後，安裝 Python 相依套件：

```bash
pip install pymupdf pillow python-docx playwright
python -m playwright install chromium
```

在 Windows 上，還需安裝 pywin32 以進行 Word 自動化：
```bash
pip install pywin32
```

### 驗證設定

```bash
python3 skills/eyeball/tools/eyeball.py setup-check
```

這會顯示您的電腦支援哪些來源型別。

## 使用方式

在 Copilot CLI 對話中，指示其使用 eyeball 以及您要分析的內容：

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

Eyeball 隨即啟動，讀取來源文件，撰寫包含精確章節參考資料的分析，並在您的桌面上產生內嵌來源螢幕擷取畫面的 Word 文件。

## 支援項目

| 來源型別 | 需求 |
|---|---|
| PDF 檔案 | Python + PyMuPDF（包含於設定中） |
| 網頁 | Python + Playwright + Chromium（包含於設定中） |
| Word 文件 (.docx) | Microsoft Word (macOS/Windows) 或 LibreOffice（任何平台）。在 Windows 上，亦需要 pywin32（包含於設定中）。 |

## 運作方式

1. Eyeball 讀取來源文件的完整文字
2. 它會撰寫包含精確章節編號、頁面參考和逐字引用的分析
3. 針對每個宣告，它會在轉譯後的來源中搜尋引用的文字
4. 它會擷取周圍區域的螢幕擷取畫面，並將引用的文字以黃色醒目提示
5. 它會組合一份交錯包含分析段落與螢幕擷取畫面的 Word 文件
6. 輸出結果會儲存於您的桌面

螢幕擷取畫面為動態調整大小：若某段分析參考了跨越較大區域的文字，螢幕擷取畫面會擴展以涵蓋該區域。若參考的文字出現在多個頁面上，螢幕擷取畫面會拼接在一起。

## 為何使用螢幕擷取畫面而非引用文字？

在對幻覺敏感的情境中，有時我們需要看到確切憑據。

引用文字很容易捏造。模型可以產生聽起來合理但實際上並未出現在來源中的引文，若不加以查證，您永遠不會知道。轉譯來源的螢幕擷取畫面較難造假；它們顯示原始文件的實際格式、版面配置和周圍情境。您可以一眼看出醒目提示的文字是否與宣告相符，且周圍文字提供了經過精挑細選的引文可能會忽略的情境。

## 限制

- Word 文件轉換需要 Microsoft Word 或 LibreOffice。沒有這些工具，您仍然可以將 Eyeball 用於 PDF 和網頁 URL。
- 文字搜尋採用字串比對。若來源文件使用不尋常的編碼、連字或非標準字元，某些搜尋可能無法相符。技能指示要求 AI 使用擷取文字中的逐字片語，這可以處理大多數情況。
- 網頁轉譯依賴 Playwright，可能無法完美擷取所有動態內容（例如頁面載入後由 JavaScript 載入的內容、登入牆後方的內容）。
- 螢幕擷取畫面品質取決於來源格式。密集的多欄版面配置或極小的文字可能會產生可讀性較低的螢幕擷取畫面。如有需要，請提高 DPI 設定。

## 授權條款

MIT
