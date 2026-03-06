# PDFtk Server 手冊參考 (PDFtk Server Manual Reference)

- **`pdftk` 版本 2.02**
- 查看 [版本歷史](https://www.pdflabs.com/docs/pdftk-version-history/) 以獲取變更資訊
- 查看 [伺服器手冊](https://www.pdflabs.com/docs/pdftk-man-page/) 以獲取最新文件

## 總覽 (Overview)

PDFtk 是一個用於操作 PDF 文件的命令列公用程式。它可以實現對 PDF 檔案的合併、分割、旋轉、加密、解密、加浮水印、表單填寫以及中繼資料擷取等操作。

## 語法摘要 (Synopsis)

```
pdftk [輸入 PDF 檔案 | - | PROMPT]
      [input_pw <密碼>]
      [<作業>] [<作業引數>]
      [output <檔案名稱 | - | PROMPT>]
      [encrypt_40bit | encrypt_128bit]
      [allow <權限>]
      [owner_pw <密碼>] [user_pw <密碼>]
      [compress | uncompress]
      [flatten] [need_appearances]
      [verbose] [dont_ask | do_ask]
```

## 輸入選項 (Input Options)

**輸入 PDF 檔案 (Input PDF Files)**：指定一個或多個 PDF。使用 `-` 代表標準輸入 (stdin) 或 `PROMPT` 進行互動式輸入。檔案可以被分配代號 (handles)（單個大寫字母），以便在作業中引用：

```
pdftk A=file1.pdf B=file2.pdf cat A B output merged.pdf
```

**輸入密碼 (Input Passwords)** (`input_pw`)：對於加密的 PDF，提供與檔案代號相關聯或按輸入順序排列的擁有者或使用者密碼：

```
pdftk A=secured.pdf input_pw A=foopass cat output unsecured.pdf
```

## 核心作業 (Core Operations)

### cat - 連接與組合 (cat - Concatenate and Compose)

合併、分割或重新排序頁面，並可選擇旋轉。支援頁面範圍、反向排序（前綴 `r`）、頁面限定符 (`even`/`odd`) 以及旋轉（指南針方向 `north`、`south`、`east`、`west`、`left`、`right`、`down`）。

頁面範圍語法：`[代號][開始[-結束[限定符]]][旋轉]`

```
pdftk A=in1.pdf B=in2.pdf cat A1-7 B1-5 A8 output combined.pdf
```

### shuffle - 整理頁面 (shuffle - Collate Pages)

輪流從每個輸入範圍獲取一頁，產生交錯的結果。對於整理分別掃描的奇數和偶數頁非常有用。

```
pdftk A=even.pdf B=odd.pdf shuffle A B output collated.pdf
```

### burst - 拆分為個別頁面 (burst - Split into Individual Pages)

將單個 PDF 拆分為每頁一個檔案。輸出檔案使用 `printf` 風格的格式命名（預設：`pg_%04d.pdf`）。

```
pdftk input.pdf burst output page_%02d.pdf
```

### rotate - 旋轉頁面 (rotate - Rotate Pages)

旋轉指定頁面，同時保持文件順序。使用與 `cat` 相同的頁面範圍語法。

```
pdftk in.pdf cat 1-endeast output rotated.pdf
```

### generate_fdf - 擷取表單資料 (generate_fdf - Extract Form Data)

從 PDF 表單建立 FDF 檔案，擷取目前的欄位值。

```
pdftk form.pdf generate_fdf output form_data.fdf
```

### fill_form - 填寫表單欄位 (fill_form - Populate Form Fields)

從 FDF 或 XFDF 資料檔案填寫 PDF 表單欄位。

```
pdftk form.pdf fill_form data.fdf output filled.pdf flatten
```

### background - 在內容後方套用浮水印 (background - Apply Watermark Behind Content)

將單頁 PDF 作為背景（浮水印）套用到輸入檔案的每一頁後方。為了獲得最佳效果，輸入 PDF 應具有透明背景。

```
pdftk input.pdf background watermark.pdf output watermarked.pdf
```

### multibackground - 套用多頁浮水印 (multibackground - Apply Multi-Page Watermark)

類似 `background`，但將背景 PDF 的對應頁面套用到輸入檔案的相應頁面。

```
pdftk input.pdf multibackground watermarks.pdf output watermarked.pdf
```

### stamp - 在內容上方加上圖章 (stamp - Overlay on Top of Content)

在輸入檔案的每一頁上方加上單頁 PDF 圖章。當重疊的 PDF 是不透明或沒有透明度時，請使用此作業代替 `background`。

```
pdftk input.pdf stamp overlay.pdf output stamped.pdf
```

### multistamp - 多頁圖章重疊 (multistamp - Multi-Page Overlay)

類似 `stamp`，但將圖章 PDF 的對應頁面套用到輸入檔案的相應頁面。

```
pdftk input.pdf multistamp overlays.pdf output stamped.pdf
```

### dump_data - 匯出中繼資料 (dump_data - Export Metadata)

將 PDF 中繼資料、書籤和頁面指標輸出到文字檔案。

```
pdftk input.pdf dump_data output metadata.txt
```

### dump_data_utf8 - 匯出中繼資料 (UTF-8) (dump_data_utf8 - Export Metadata (UTF-8))

與 `dump_data` 相同，但輸出 UTF-8 編碼的文字。

```
pdftk input.pdf dump_data_utf8 output metadata_utf8.txt
```

### dump_data_fields - 擷取表單欄位資訊 (dump_data_fields - Extract Form Field Info)

報告表單欄位資訊，包括類型、名稱和值。

```
pdftk form.pdf dump_data_fields output fields.txt
```

### dump_data_fields_utf8 - 擷取表單欄位資訊 (UTF-8) (dump_data_fields_utf8 - Extract Form Field Info (UTF-8))

與 `dump_data_fields` 相同，但輸出 UTF-8 編碼的文字。

### dump_data_annots - 擷取註釋 (dump_data_annots - Extract Annotations)

報告 PDF 註釋資訊。

```
pdftk input.pdf dump_data_annots output annots.txt
```

### update_info - 修改中繼資料 (update_info - Modify Metadata)

從文字檔案（格式與 `dump_data` 輸出相同）更新 PDF 中繼資料和書籤。

```
pdftk input.pdf update_info metadata.txt output updated.pdf
```

### update_info_utf8 - 修改中繼資料 (UTF-8) (update_info_utf8 - Modify Metadata (UTF-8))

與 `update_info` 相同，但預期輸入為 UTF-8 編碼。

### attach_files - 嵌入檔案 (attach_files - Embed Files)

將檔案附加到 PDF，可選擇在特定頁面附加。

```
pdftk input.pdf attach_files table.html graph.png to_page 6 output output.pdf
```

### unpack_files - 擷取附件 (unpack_files - Extract Attachments)

從 PDF 擷取檔案附件。

```
pdftk input.pdf unpack_files output /path/to/output/
```

## 輸出選項 (Output Options)

| 選項 | 說明 |
|--------|-------------|
| `output <檔案名稱>` | 指定輸出檔案。使用 `-` 代表標準輸出或 `PROMPT` 進行互動。 |
| `encrypt_40bit` | 套用 40 位元 RC4 加密 |
| `encrypt_128bit` | 套用 128 位元 RC4 加密（設定密碼時的預設值） |
| `owner_pw <密碼>` | 設定擁有者密碼 |
| `user_pw <密碼>` | 設定使用者密碼 |
| `allow <權限>` | 授予特定權限（見下文） |
| `compress` | 壓縮頁面串流 |
| `uncompress` | 解壓縮頁面串流（對偵錯很有用） |
| `flatten` | 將表單欄位平面化到頁面內容中 |
| `need_appearances` | 訊號檢視器重新產生欄位外觀 |
| `keep_first_id` | 保留第一個輸入檔案的文件識別碼 (ID) |
| `keep_final_id` | 保留最後一個輸入檔案的文件識別碼 |
| `drop_xfa` | 移除 XFA 表單資料 |
| `verbose` | 啟用詳細的作業輸出 |
| `dont_ask` | 隱藏互動式提示 |
| `do_ask` | 啟用互動式提示 |

## 權限 (Permissions)

在加密時搭配 `allow` 關鍵字使用。可用權限如下：

| 權限 | 說明 |
|------------|-------------|
| `Printing` | 允許高品質列印 |
| `DegradedPrinting` | 允許低品質列印 |
| `ModifyContents` | 允許修改內容 |
| `Assembly` | 允許文件組合 |
| `CopyContents` | 允許複製內容 |
| `ScreenReaders` | 允許螢幕助讀程式存取 |
| `ModifyAnnotations` | 允許修改註釋 |
| `FillIn` | 允許表單填寫 |
| `AllFeatures` | 授予所有權限 |

## 關鍵筆記 (Key Notes)

- 頁碼從 1 開始；使用 `end` 關鍵字代表最後一頁
- 處理單個 PDF 時，代號是選用的
- 篩選模式（未指定作業）會套用輸出選項而不重新建構文件
- 反向頁面參考使用 `r` 前綴（例如：`r1` = 最後一頁，`r2` = 倒數第二頁）
- `background` 作業需要透明的輸入；對於不透明的重疊 PDF，請使用 `stamp`
- 輸出檔案名稱不能與任何輸入檔案名稱相同
