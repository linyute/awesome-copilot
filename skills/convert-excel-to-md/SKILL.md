---
name: convert-excel-to-md
description: '將 Excel (.xlsx) 活頁簿轉換為 Markdown，以便精確分析、摘要、搜尋或擷取其內容。每當使用者分享、參照或詢問 .xlsx 檔案時，即使他們沒有明確說「轉換」或「Markdown」，也請使用此技能。這包括要求「讀取」、「摘要」、「審閱」、「從中擷取資料」、「比較」、「製圖」或「分析」試算表、活頁簿、預算、資料匯出或追蹤器的請求。請務必先執行隨附的轉換腳本以產生 Markdown；不要嘗試直接解析 .xlsx 內容或撰寫臨時擷取程式碼。也可將此技能用於涉及整個資料夾的 Excel 活頁簿批次請求。重要事項：當使用者參照包含多種檔案類型（.pdf、.docx、.xlsx）的資料夾或文件集時，請呼叫全部三個同層技能——convert-pdf-to-md、convert-word-to-md 和 convert-excel-to-md——以免靜默略過任何檔案類型。'
---

# 將 Excel 轉換為 Markdown

## 何時使用此技能

只要有 `.xlsx` 檔案需要理解或處理，就觸發此技能——例如，使用者附上試算表並詢問相關問題、想要資料摘要、想提取特定列或數值，或想批次處理資料夾中的多個活頁簿。Excel 原生的 `.xlsx` 格式是一個壓縮的 XML 套件，無法可靠地作為純文字讀取，因此請務必先使用此技能中的腳本將其轉換為 Markdown，而不是嘗試直接開啟或解析檔案。

此技能僅支援 `.xlsx`。若被要求轉換舊版 `.xls` 檔案，請告知使用者不支援該格式，並請他們先將其另存為 `.xlsx`（Excel：檔案 > 另存新檔 > Excel 活頁簿 (.xlsx)）。

**混合檔案類型：** 當使用者參照包含多種支援檔案類型（`.pdf`、`.docx`、`.xlsx`）的資料夾或文件集時，此技能僅處理 `.xlsx` 檔案。代理程式也必須同時呼叫同層技能：
- `convert-pdf-to-md` 處理任何 `.pdf` 檔案
- `convert-word-to-md` 處理任何 `.docx` 檔案

絕不要處理資料夾時靜默略過支援的檔案類型。當存在混合類型時，必須同時呼叫全部三個技能。

## 設定（每個環境執行一次）

在特定環境中進行第一次轉換之前，請逐步遵循
[`references/setup.md`](references/setup.md) 以確保 Python、pip 和 `markitdown` 套件已安裝。請主動執行此操作，而不是猜測環境是否已準備就緒——如果 `markitdown` 缺失，腳本本身也會失敗並提供返回該檔案的明確指引，因此若您合理確信設定已完成，直接嘗試轉換也是安全的。

## 使用方式

轉換腳本位於 `scripts/convert_excel_to_md.py`。

**輸出結構：** MarkItDown 的 XLSX 轉換器將每個工作表渲染為其各自的 `## <SheetName>` Markdown 表格——完全不支援嵌入圖片。此腳本會另外擷取真正的嵌入圖片（點陣圖片，非圖表），並將其對應至所屬的工作表，並為每份文件寫入一個獨立資料夾：

```
<name>/
    img/
        sheet001_<sheetname>_img001.<ext>
        sheet002_<sheetname>_img001.<ext>
        ...
    <name>.md          (每個工作表的圖片緊接在其表格之後出現，
                         位於「#### Images in this sheet」標題下)
```

這是按工作表放置，而非精確的儲存格位置——這是 MarkItDown 穩定輸出錨點（`## <SheetName>` 標題）所能支援的最細粒度。如果活頁簿沒有嵌入圖片，則不會建立 `img/` 資料夾或圖片段落。原生 Excel **圖表**不會被擷取為圖片（只有實際嵌入的圖片才會——圖表需要由 Excel/LibreOffice 渲染，而此輕量技能並不執行此操作）。

**單一檔案：**

```powershell
python scripts\convert_excel_to_md.py "C:\path\to\workbook.xlsx"
```

這會在來源檔案旁建立一個 `workbook\` 資料夾（包含 `workbook.md` 以及若存在則含 `workbook\img\`）。若要明確控制目標資料夾：

```powershell
python scripts\convert_excel_to_md.py "C:\path\to\workbook.xlsx" -o "C:\path\to\output_folder"
```

**一個活頁簿資料夾（批次模式）：**

```powershell
python scripts\convert_excel_to_md.py "C:\path\to\folder"
```

加入 `--recursive` 也包含子資料夾：

```powershell
python scripts\convert_excel_to_md.py "C:\path\to\folder" --recursive
```

預設情況下，找到的每個 `.xlsx` 都會在其旁邊建立自己的 `<name>\` 輸出資料夾。傳遞 `-o "C:\path\to\output_parent"` 可將所有產生的 `<name>\` 資料夾收集到一個獨立的父目錄下（與 `--recursive` 結合使用時，會保留子資料夾結構）。

轉換完成後，讀取產生的 `.md` 檔案以執行使用者要求的實際分析——腳本的工作只是產生準確的 Markdown（和圖片），而非解讀內容。

## 決定輸出位置

**預設——始終輸出於來源檔案旁。** `<name>/` 資料夾建立於來源 `.xlsx` 的相同目錄中。這是每種情況的必要預設值。除非使用者明確要求不同位置，否則不要覆寫它。

**僅在**使用者明確提供輸出路徑時才使用 `-o`（例如，「將輸出儲存到 `C:\output`」、「將結果放在 `D:\work`」）。不要根據代理程式的當前工作目錄、工作階段狀態資料夾或任何隱含位置傳遞 `-o`。

**如果來源檔案路徑無法完全解析**——例如，使用者僅提供沒有目錄的檔案名，或路徑不明確——請使用 `ask_user` 在執行轉換之前確認完整的絕對路徑。絕不要猜測或假設目錄。

## 疑難排解

| 症狀 | 可能原因 | 修正方法 |
|---|---|---|
| `ModuleNotFoundError: No module named 'markitdown'` / 結束碼 2 | MarkItDown 未安裝 | 遵循 `references/setup.md` |
| `ERROR: Unsupported file type '.xls'` / 結束碼 3 | 舊版 `.xls`，非 `.xlsx` | 請使用者另存為 `.xlsx` |
| `ERROR: Input path not found` / 結束碼 3 | 路徑錯誤，或檔案已移動 | 與使用者確認正確路徑 |
| 批次輸出中的 `FAILED <file> -> ...` | 該特定檔案已損毀、受密碼保護或無法讀取 | 報告哪些檔案失敗；批次中的其他檔案仍會成功 |
| `NOTE: skipped N non-.xlsx file(s)` | 資料夾包含非 Excel 檔案 | 預期行為——這些檔案被刻意忽略 |
| 工作表的圖表未顯示為圖片 | 圖表是圖表物件，而非嵌入圖片——此技能僅擷取真正嵌入的點陣圖片 | 預期行為；若使用者特別需要圖表圖片，請提及此限制 |
