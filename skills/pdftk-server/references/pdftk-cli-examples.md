# PDFtk 命令列範例 (PDFtk CLI Examples)

PDFtk 是一個命令列程式。執行這些範例時，請使用您的電腦終端機或命令提示字元。

## 整理掃描頁面 (Collate Scanned Pages)

將分別掃描的偶數和奇數頁交錯合併為單個文件：

```bash
pdftk A=even.pdf B=odd.pdf shuffle A B output collated.pdf
```

如果奇數頁是以相反順序排列：

```bash
pdftk A=even.pdf B=odd.pdf shuffle A Bend-1 output collated.pdf
```

## 解密 PDF (Decrypt a PDF)

使用密碼移除 PDF 的加密：

```bash
pdftk secured.pdf input_pw foopass output unsecured.pdf
```

## 使用 128 位元強度加密 PDF (Encrypt a PDF Using 128-Bit Strength)

套用擁有者密碼加密：

```bash
pdftk 1.pdf output 1.128.pdf owner_pw foopass
```

同時要求輸入密碼才能開啟 PDF：

```bash
pdftk 1.pdf output 1.128.pdf owner_pw foo user_pw baz
```

加密但仍允許列印：

```bash
pdftk 1.pdf output 1.128.pdf owner_pw foo user_pw baz allow printing
```

## 合併 PDF (Join PDFs)

將多個 PDF 合併為一個：

```bash
pdftk in1.pdf in2.pdf cat output out1.pdf
```

使用代號進行明確控制：

```bash
pdftk A=in1.pdf B=in2.pdf cat A B output out1.pdf
```

使用萬用字元合併目錄中的所有 PDF：

```bash
pdftk *.pdf cat output combined.pdf
```

## 移除特定頁面 (Remove Specific Pages)

從文件中排除第 13 頁：

```bash
pdftk in.pdf cat 1-12 14-end output out1.pdf
```

使用代號：

```bash
pdftk A=in1.pdf cat A1-12 A14-end output out1.pdf
```

## 套用 40 位元加密 (Apply 40-Bit Encryption)

合併並以 40 位元強度加密：

```bash
pdftk 1.pdf 2.pdf cat output 3.pdf encrypt_40bit owner_pw foopass
```

## 當其中一個檔案受密碼保護時進行合併 (Join Files When One Is Password-Protected)

為加密的輸入檔案提供密碼：

```bash
pdftk A=secured.pdf 2.pdf input_pw A=foopass cat output 3.pdf
```

## 解壓縮 PDF 頁面串流 (Uncompress PDF Page Streams)

解壓縮內部串流以供檢查或偵錯：

```bash
pdftk doc.pdf output doc.unc.pdf uncompress
```

## 修復損毀的 PDF (Repair Corrupted PDFs)

將損壞的 PDF 傳遞給 pdftk 以嘗試修復：

```bash
pdftk broken.pdf output fixed.pdf
```

## 將 PDF 拆分為個別頁面 (Burst a PDF into Individual Pages)

將每一頁分割為其自身的檔案：

```bash
pdftk in.pdf burst
```

拆分並套用加密和限制列印：

```bash
pdftk in.pdf burst owner_pw foopass allow DegradedPrinting
```

## 產生 PDF 中繼資料報告 (Generate a PDF Metadata Report)

匯出書籤、中繼資料和頁面指標：

```bash
pdftk in.pdf dump_data output report.txt
```

## 旋轉頁面 (Rotate Pages)

將第一頁順時針旋轉 90 度：

```bash
pdftk in.pdf cat 1east 2-end output out.pdf
```

將所有頁面旋轉 180 度：

```bash
pdftk in.pdf cat 1-endsouth output out.pdf
```

## 從資料填寫 PDF 表單 (Fill a PDF Form from Data)

從 FDF 檔案填入表單欄位：

```bash
pdftk form.pdf fill_form data.fdf output filled_form.pdf
```

在填寫後將表單平面化（防止進一步編輯）：

```bash
pdftk form.pdf fill_form data.fdf output filled_form.pdf flatten
```

## 套用背景浮水印 (Apply a Background Watermark)

在每一頁後方加上浮水印：

```bash
pdftk input.pdf background watermark.pdf output watermarked.pdf
```

## 在上方加上圖章重疊 (Stamp an Overlay on Top)

在每一頁上方套用重疊的 PDF：

```bash
pdftk input.pdf stamp overlay.pdf output stamped.pdf
```

## 將檔案附加到 PDF (Attach Files to a PDF)

將檔案嵌入為附件：

```bash
pdftk input.pdf attach_files table.html graph.png output output.pdf
```

## 從 PDF 擷取附件 (Extract Attachments from a PDF)

將所有內嵌檔案解包：

```bash
pdftk input.pdf unpack_files output /path/to/output/
```
