# 轉換為 Markdown 外掛程式

一組 Copilot 技能，可將常見的文件格式轉換為 Markdown，以便對其內容進行精確的分析、摘要、搜尋或擷取。只需告知 Copilot 您的需求——系統會自動呼叫正確的技能，並在背景完成轉換。

## 安裝

```bash
copilot plugin install convert-to-md@awesome-copilot
```

## 包含內容

此外掛程式包含 Word、Excel 和 PDF 轉換技能，詳細說明如下。

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分。

## 技能

### convert-word-to-md

將 Word（`.docx`）文件轉換為 Markdown。無論何時您想要閱讀、摘要、審查、比較或從 `.docx` 檔案中擷取資訊，都可以使用此技能——即使您沒有明確說「轉換」。

> 「摘要這份 Word 文件。」
> 「從 report.docx 中擷取所有待辦事項。」
> 「比較這兩份合約。」

### convert-excel-to-md

將 Excel（`.xlsx`）活頁簿轉換為 Markdown，並將每個工作表呈現為表格。無論何時您想要分析、查詢或摘要試算表中的資料，都可以使用此技能——單一檔案或整個資料夾皆可一次處理。

> 「這份試算表中依營收排名前 5 的列是哪些？」
> 「摘要此活頁簿中的所有工作表。」
> 「處理此資料夾中的每個 Excel 檔案。」

### convert-pdf-to-md

將 PDF（`.pdf`）文件轉換為 Markdown，同時擷取文字和嵌入的圖片。無論何時您想要閱讀、摘要或從 PDF 報告、發票、論文或表單中提取資料，都可以使用此技能。

> 「摘要這份 PDF。」
> 「擷取此合約中提到的所有日期。」
> 「處理此資料夾中的所有 PDF 檔案。」

## 授權條款

MIT
