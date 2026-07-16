---
name: convert-pdf-to-md
description: '將 PDF (.pdf) 文件轉換為 Markdown，以便精確分析、摘要、搜尋或擷取其內容。每當使用者分享、參照或詢問 .pdf 檔案時，即使他們沒有明確說「轉換」或「Markdown」，也請使用此技能。這包括要求「讀取」、「摘要」、「審閱」、「從中擷取資料」、「比較」或「分析」 PDF 報告、論文、發票、表單、合約或掃描文件的請求。請務必先執行隨附的轉換腳本以產生 Markdown；不要嘗試直接解析 PDF 內容或撰寫臨時擷取程式碼。也可將此技能用於涉及整個資料夾的 PDF 文件批次請求。重要事項：當使用者參照包含多種檔案類型（.pdf、.docx、.xlsx）的資料夾或文件集時，請呼叫全部三個同層技能——convert-pdf-to-md、convert-word-to-md 和 convert-excel-to-md——以免靜默略過 any 檔案類型。'
---

# 將 PDF 轉換為 Markdown

## 何時使用此技能

針對 `.pdf` 檔案需要理解或處理的任何時候觸發此技能——例如，使用者附上 PDF 並詢問問題、需要摘要、需要提取特定資料或表格，或想批次處理資料夾中的多個 PDF。PDF 是版面/列印格式，無法可靠地作為純文字讀取，因此請務必先使用此技能中的腳本將其轉換為 Markdown，而不是嘗試直接開啟或解析檔案。

此技能僅支援 `.pdf`——這是 MarkItDown 唯一的 PDF 家族格式，因此這裡不需要擔心舊版格式（不像 Word 的 `.doc` 或 Excel 的 `.xls`）。

**混合檔案類型：** 當使用者參照包含多種支援檔案類型（`.pdf`、`.docx`、`.xlsx`）的資料夾或文件集時，此技能僅處理 `.pdf` 檔案。代理程式也必須同時呼叫同層技能：
- `convert-word-to-md` 處理任何 `.docx` 檔案
- `convert-excel-to-md` 處理任何 `.xlsx` 檔案

絕不要處理資料夾時靜默略過支援的檔案類型。當存在混合類型時，必須同時呼叫全部三個技能。

## 設定（每個環境執行一次）

在特定環境中進行首次轉換之前，請逐步遵循 [`references/setup.md`](references/setup.md) 以確保已安裝 Python、pip、`markitdown` 和 `pymupdf`（用於影像擷取）。請主動執行此操作，而不是猜測環境是否已準備就緒——如果結果顯示缺少相依性，腳本本身也會失敗並顯示指向該檔案的明確指標，因此如果您對已完成設定有合理的把握，先嘗試轉換是安全的。

## 用法

轉換腳本位於 `scripts/convert_pdf_to_md.py`。

**輸出結構：** MarkItDown 的 PDF 轉換器僅擷取文字和表格——它完全沒有嵌入影像的概念。此腳本透過 PyMuPDF 單獨擷取真實的嵌入影像，並為每個文件寫入一個獨立的資料夾：

```
<name>/
    img/
        page001_img001.<ext>
        page002_img001.<ext>
        ...
    <name>.md
```

因為 MarkItDown 的 PDF 文字不保留可靠的每頁標記，所以無法安全地知道影像在行內確切屬於哪裡。為了避免將影像誤置於錯誤段落旁邊的風險，腳本會在 Markdown 的末尾附加一個 `## Extracted Images` 區段，其中每個有影像的頁面都有一個 `### Page N` 子標題——請與主體文字分開閱讀此區段。如果文件沒有嵌入影像，則不會建立 `img/` 資料夾或 `Extracted Images` 區段。

**單一檔案：**

```powershell
python scripts\convert_pdf_to_md.py "C:\path\to\document.pdf"
```

這會在來源檔案旁邊建立一個 `document\` 資料夾（包含 `document.md`，如果存在的話，還有 `document\img\`）。若要明確控制目的地資料夾：

```powershell
python scripts\convert_pdf_to_md.py "C:\path\to\document.pdf" -o "C:\path\to\output_folder"
```

**PDF 資料夾（批次模式）：**

```powershell
python scripts\convert_pdf_to_md.py "C:\path\to\folder"
```

加入 `--recursive` 以同時包含子資料夾：

```powershell
python scripts\convert_pdf_to_md.py "C:\path\to\folder" --recursive
```

預設情況下，找到的每個 `.pdf` 都會在自己旁邊獲得其專屬的 `<name>\` 輸出資料夾。傳遞 `-o "C:\path\to\output_parent"` 以將所有產生的 `<name>\` 資料夾收集在一個單獨的父目錄下（與 `--recursive` 結合使用時，會保留子資料夾結構）。

轉換後，請閱讀產生的 `.md` 檔案以執行使用者要求的實際分析——腳本的工作只是產生精確的 Markdown（和影像），而不是解讀內容。

## 決定輸出目的地

**預設——一律輸出在來源檔案旁邊。** `<name>/` 資料夾建立在與來源 `.pdf` 相同的目錄中。這是每種情況下的必要預設設定。除非使用者明確要求不同的位置，否則請勿覆寫此設定。

**僅在以下情況使用 `-o`：** 使用者明確提供輸出路徑（例如，「將輸出儲存至 `C:\output`」、「將結果放入 `D:\work`」）。請勿根據代理程式的目前工作目錄、工作階段狀態資料夾或任何隱含位置傳遞 `-o`。

**如果無法完全解析來源檔案路徑**——例如，使用者僅提供沒有目錄的檔名，或者路徑不明確——請在執行轉換之前使用 `ask_user` 確認完整的絕對路徑。絕不要猜測或假設目錄。

## 疑難排解

| 症狀 | 可能原因 | 修正方法 |
|---|---|---|
| `ModuleNotFoundError: No module named 'markitdown'` 或 `'fitz'` / 結束代碼 2 | 未安裝 MarkItDown 或 PyMuPDF | 遵循 `references/setup.md` |
| `ERROR: Unsupported file type '...'` / 結束代碼 3 | 不是 `.pdf` 檔案 | 向使用者索取正確的檔案，或者如果是 `.doc`/`.docx`/`.xlsx`，請改用相應的同層技能 |
| `ERROR: Input path not found` / 結束代碼 3 | 路徑錯誤或檔案已移動 | 與使用者確認正確的路徑 |
| 批次輸出中出現 `FAILED <file> -> ...` | 該特定檔案已損毀、受密碼保護或以其他方式無法讀取 | 報告哪些檔案失敗；批次中的其他檔案仍會成功 |
| `NOTE: skipped N non-.pdf file(s)` | 資料夾包含非 PDF 檔案 | 預期行為——這些檔案會被刻意忽略 |
| 儘管已擷取影像，但 Markdown 主體為空或幾近空白 | 該 PDF 是僅含影像/掃描的檔案，沒有嵌入文字層；MarkItDown 不執行 OCR | 告知使用者不支援 OCR——擷取出的頁面影像仍可供其檢視 |
| 影像出現在附錄中，而不是與文字並排 | 刻意的限制——MarkItDown 的 PDF 文字沒有可靠的每頁標記來將影像置於行內 | 預期行為；如果需要，請將 `### Page N` 標題與周圍的文字內容進行交叉比對 |
