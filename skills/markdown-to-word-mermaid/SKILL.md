---
name: markdown-to-word-mermaid
description: '將包含 Mermaid 程式碼區塊的 Markdown 匯出為 Word (.docx)，並嵌入 SVG 圖表與 PNG 備用影像。適用於重視圖表清晰度、Office 相容標籤或頁面感知排版的情境。不適用於 Word 轉 Markdown、可編輯的 Office 圖形或一般簡報建立。'
license: MIT
argument-hint: 'Markdown 輸入檔案與選填的 DOCX 輸出路徑'
user-invocable: true
---

# 結合 Mermaid 的 Markdown 轉 Word

匯出技術文件，無需手動將 Mermaid 區塊替換為螢幕擷圖。隨附的轉換器會在本地端轉譯每個圖表，透過 Office OOXML 關聯性嵌入 SVG，並保留 3 倍解析度的 PNG 備用影像。產生檔案無需 Word；需要支援 SVG 的 Word 版本以檢查向量轉譯效果。

## 何時使用

- 設計文件、運作手冊 (runbook) 或報告包含 Mermaid 程式碼區塊，且必須以 DOCX 交付。
- 在縮放或列印時，圖表標籤必須保持銳利清晰。
- 較高的圖表需要具備頁面感知排版，而非被跨頁截斷。

對於包含既有 PNG 影像的一般 Markdown 轉 DOCX 轉換，使用像 `md-to-docx` 這類通用轉換器可能更簡單。本技能專注於轉譯與封裝 Mermaid 圖表。SVG 嵌入不會建立可編輯的 Word 圖形、連接線或文字方塊。

## 需求與設定

- Python 3.10+ 及 [scripts/requirements.txt](scripts/requirements.txt) 中的套件。
- 與所選 Mermaid CLI 版本相容的 Node.js，以及 `@mermaid-js/mermaid-cli`。
- Puppeteer 可使用的本機瀏覽器，以及涵蓋文件中字元的已安裝字型。
- 預設字型: Noto Sans JP。使用 `--font-family` 選擇其他已安裝的字型系列。

解析路徑時應相對於此技能的安裝目錄，而非假設的存放庫名稱。以下範例均在此技能目錄下執行。請使用使用者選擇的 Python 環境 (`python`、`python3` 或其絕對路徑)。

在安裝相依套件之前，請確認環境並視需要取得授權。若有既有的 Mermaid CLI，請優先重複使用。否則請將其安裝至使用者核准的本機工具目錄，切勿全域安裝：

```sh
python -m pip install -r scripts/requirements.txt
npm install --prefix ./run/mermaid-cli @mermaid-js/mermaid-cli
```

本機執行檔在 POSIX 上為 `./run/mermaid-cli/node_modules/.bin/mmdc`，在 Windows 上為 `./run/mermaid-cli/node_modules/.bin/mmdc.cmd`。請勿將已安裝的相依套件包含在提交的技能套件中。在使用的專案中鎖定選定的相依套件版本，以實現可重現的安裝。

在 Windows 上，轉換器會偵測標準 Chrome 與 Edge 路徑。若使用其他瀏覽器位置，請將 `MERMAID_BROWSER_PATH` 設定為其絕對可執行檔路徑：

```powershell
$env:MERMAID_BROWSER_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

在 POSIX 上，請使用 `export MERMAID_BROWSER_PATH=/absolute/path/to/browser`，或使用 Puppeteer 安裝的瀏覽器。切勿為了進行轉換而停用瀏覽器沙盒 (sandbox)。

## 工作流程

1. 確認輸入 Markdown 檔案、輸出目的地與字型。若未提供目的地，請使用帶有 `.docx` 副檔名的輸入路徑。
2. 檢查輸出檔案是否不存在。絕不刪除或覆寫既有文件；請要求不同的目的地。
3. 執行 [scripts/markdown_to_word.py](scripts/markdown_to_word.py)。保留使用者的圖表原始碼與語意。切勿暗中修復無效的 Mermaid。
4. 檢查產生的套件，當 Word 可用時，以目視檢查文件。請分開回報套件檢查與目視檢查結果。

當 PATH 中包含 `mmdc` 時：

```sh
python scripts/markdown_to_word.py input.md --output output.docx
```

在 Windows 上使用工作區本機 CLI：

```powershell
python scripts/markdown_to_word.py input.md --output output.docx --mermaid-cli ./run/mermaid-cli/node_modules/.bin/mmdc.cmd
```

選擇已安裝的字型：

```sh
python scripts/markdown_to_word.py input.md --output output.docx --font-family "Noto Sans JP" --timeout 120
```

如需可重現的範例，請將 [assets/example.md](assets/example.md) 轉換至新的輸出路徑。其中包含英文與日文標籤、多個圖表以及高長圖表。

## 轉換行為

- 標題、段落、強調文字、清單 (保留排序清單起始編號與獨立清單邊界)、引言區塊、表格及程式碼區塊均會轉換為 Word 內容。
- 每個 Mermaid 區塊都會轉譯為 SVG 與 3 倍解析度 PNG，並設有單一指令逾時限制 (預設: 120 秒)。Office SVG 擴充功能會參照 SVG；一般影像參照會保留 PNG 備用影像，繪圖 metadata (`title` 與 `descr`) 包含章節標題或 Mermaid `accTitle`/`accDescr` 以及圖表類型。
- 輸出 DOCX 檔案會在暫存目錄中暫存並注入 SVG，然後才移動到目的地路徑，因此失敗的執行絕不會留下不完整的殘留檔案。
- 選定的字型會套用至 Word 段落樣式與 Mermaid 的字型設定。程式碼文字使用 Consolas。字型不會嵌入；無法取得的字型可能會被替代。
- 全域及流程圖均設定 `htmlLabels: false`，以避免 Office 可能無法顯示的 HTML `foreignObject` 標籤。請檢查實際 SVG 輸出是否包含不支援的結構。
- 圖表居中對齊、保持長寬比，並使用不跨頁段落。佔據頁面內文高度至少 70% 的圖表將從新分頁開始。超大圖表會縮放至頁面內文高度。大型圖表會產生可讀性警告。
- 簡單的單行 frontmatter `title` 會成為文件標題；其他 frontmatter 欄位會從內文中移除。這不是完整的 YAML metadata 剖析器。
- 一般 Markdown 影像連結保持為替代文字與來源路徑或 URL；不會被嵌入。原始 HTML 會縮減為純文字，不會被執行。

## 終止條件與限制

- 缺少輸入、副檔名錯誤、輸出檔案已存在、缺少 CLI、無效 Mermaid、轉譯失敗或無法使用的 SVG 尺寸均會中止轉換並回報錯誤。
- 轉換器不會呼叫外部轉譯服務或個別的 AI API。相依套件安裝與瀏覽器執行並非離線沙盒。在轉譯之前，請檢視不受信任的圖表內容 (包括外部資源)。
- 圖表並非語意上可編輯的 Office 物件。Word 轉譯、字型替代與最終分頁結果取決於檢視軟體，必須在該處進行檢查。
- 成功建立 DOCX 並不能證明每個圖表標籤均清晰易讀。僅在取得使用者核准後，才能在原始碼中分割大型圖表。

## 驗證

從技能目錄執行測試套件：

```sh
python -m unittest discover -s tests -v
```

一般測試套件會模擬 Mermaid 轉譯。若要一併執行真實轉譯器測試，請將 `MERMAID_CLI` 設定為 CLI 執行檔的絕對路徑，然後再次執行指令。在 Windows PowerShell 上：

```powershell
$env:MERMAID_CLI = (Join-Path $env:APPDATA "npm\mmdc.cmd")
python -m unittest discover -s tests -v
```

該測試會轉譯隨附的範例，並檢查產生的 DOCX 的 SVG 參照、PNG 備用影像、標籤與繪圖尺寸。它不會自動執行 Word 目視檢查。

在回報完成之前：

- 計算 Mermaid 區塊數量，並確認 DOCX 中具有相同數量的 SVG 部件與 SVG 影像參照。
- 確認存在 PNG 備用影像參照，且範例的 SVG 中沒有殘留標籤 `foreignObject`。
- 在 Word 中檢查節點名稱、分支標籤、字型、圖表位置與分頁邊界；在重視銳利度時，請檢查縮放或列印輸出。
- 若 Word 或實際轉譯器不可用，請說明未執行哪些檢查。

有關貢獻範圍、評估案例與草擬提交說明，請參閱 [references/publication.md](references/publication.md)。該檔案為維護者指引，並非發佈許可。
## 陷阱與注意事項

- `mmdc.cmd` 需要 Windows 指令處理機制；請使用 `--mermaid-cli` 傳遞其路徑，而不是改寫指令碼。
- 缺少字型可能會影響 PNG 轉譯與 SVG 顯示。請使用在轉譯與檢視機器上均已安裝的字型系列。
- 保持 SVG 與 PNG 成對。將 SVG 替換為螢幕擷圖會破壞保留向量圖的工作流程。
- 套件驗證、轉譯器測試、代理人選取評估與人工目視驗收屬於不同的檢查項目。
