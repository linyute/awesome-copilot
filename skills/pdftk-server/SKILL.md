---
name: pdftk-server
description: '使用命令列工具 pdftk (PDFtk Server) 處理 PDF 檔案的技能。當被要求合併 PDF、分割 PDF、旋轉頁面、加密或解密 PDF、填寫 PDF 表單、套用浮水印、圖章重疊、擷取中繼資料、將文件拆分為頁面、修復損毀的 PDF、附加或擷取檔案，或從命令列執行任何 PDF 操作時使用。'
---

# PDFtk Server

PDFtk Server 是一個用於處理 PDF 文件的命令列工具。它可以合併、分割、旋轉、加密、解密、加浮水印、加圖章、填寫表單、擷取中繼資料，以及以多種方式操作 PDF。

## 何時使用此技能 (When to Use This Skill)

- 將多個 PDF 檔案合併或連接為一個
- 將 PDF 分割或拆分為個別頁面
- 旋轉 PDF 頁面
- 加密或解密 PDF 檔案
- 從 FDF/XFDF 資料填寫 PDF 表單欄位
- 套用背景浮水印或前景圖章
- 擷取 PDF 中繼資料、書籤或表單欄位資訊
- 修復損毀的 PDF 檔案
- 附加或擷取內嵌在 PDF 中的檔案
- 從 PDF 中移除特定頁面
- 整理分別掃描的偶數/奇數頁
- 壓縮或解壓縮 PDF 頁面串流

## 先決條件 (Prerequisites)

- 系統上必須已安裝 PDFtk Server
  - **Windows**：`winget install --id PDFLabs.PDFtk.Server`
  - **macOS**：`brew install pdftk-java`
  - **Linux (Debian/Ubuntu)**：`sudo apt-get install pdftk`
  - **Linux (Red Hat/Fedora)**：`sudo dnf install pdftk`
- 可存取終端機或命令提示字元
- 透過執行 `pdftk --version` 驗證安裝

## 逐步工作流 (Step-by-Step Workflows)

### 合併多個 PDF (Merge Multiple PDFs)

```bash
pdftk file1.pdf file2.pdf cat output merged.pdf
```

使用代號 (handles) 進行更多控制：

```bash
pdftk A=file1.pdf B=file2.pdf cat A B output merged.pdf
```

### 將 PDF 分割為個別頁面 (Split a PDF into Individual Pages)

```bash
pdftk input.pdf burst
```

### 擷取特定頁面 (Extract Specific Pages)

擷取第 1-5 頁和第 10-15 頁：

```bash
pdftk input.pdf cat 1-5 10-15 output extracted.pdf
```

### 移除特定頁面 (Remove Specific Pages)

移除第 13 頁：

```bash
pdftk input.pdf cat 1-12 14-end output output.pdf
```

### 旋轉頁面 (Rotate Pages)

將所有頁面順時針旋轉 90 度：

```bash
pdftk input.pdf cat 1-endeast output rotated.pdf
```

### 加密 PDF (Encrypt a PDF)

使用 128 位元加密（預設）設定擁有者密碼和使用者密碼：

```bash
pdftk input.pdf output secured.pdf owner_pw mypassword user_pw userpass
```

### 解密 PDF (Decrypt a PDF)

使用已知密碼移除加密：

```bash
pdftk secured.pdf input_pw mypassword output unsecured.pdf
```

### 填寫 PDF 表單 (Fill a PDF Form)

從 FDF 檔案填入表單欄位，並將其平面化 (flatten) 以防止進一步編輯：

```bash
pdftk form.pdf fill_form data.fdf output filled.pdf flatten
```

### 套用背景浮水印 (Apply a Background Watermark)

在輸入檔案的每一頁後方放置一個單頁 PDF（輸入檔案應具有透明度）：

```bash
pdftk input.pdf background watermark.pdf output watermarked.pdf
```

### 加上圖章重疊 (Stamp an Overlay)

在輸入檔案的每一頁上方放置一個單頁 PDF：

```bash
pdftk input.pdf stamp overlay.pdf output stamped.pdf
```

### 擷取中繼資料 (Extract Metadata)

匯出書籤、頁面指標和文件資訊：

```bash
pdftk input.pdf dump_data output metadata.txt
```

### 修復損毀的 PDF (Repair a Corrupted PDF)

將損壞的 PDF 傳遞給 pdftk 以嘗試自動修復：

```bash
pdftk broken.pdf output fixed.pdf
```

### 整理掃描頁面 (Collate Scanned Pages)

交錯放置分別掃描的偶數和奇數頁：

```bash
pdftk A=even.pdf B=odd.pdf shuffle A B output collated.pdf
```

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|-------|----------|
| 找不到 `pdftk` 指令 | 驗證安裝；檢查 pdftk 是否在系統 PATH 中 |
| 無法解密 PDF | 確保您透過 `input_pw` 提供了正確的擁有者或使用者密碼 |
| 輸出檔案為空或損毀 | 檢查輸入檔案的完整性；嘗試先執行 `pdftk input.pdf output repaired.pdf` |
| 填寫後表單欄位不可見 | 使用 `flatten` 旗標將欄位合併到頁面內容中 |
| 浮水印未出現 | 確保輸入 PDF 具有透明區域；對於不透明的重疊 PDF，請使用 `stamp` |
| 拒絕存取錯誤 | 檢查輸入和輸出路徑的檔案權限 |

## 參考資料 (References)

`references/` 資料夾中隨附的參考文件：

- [pdftk-man-page.md](references/pdftk-man-page.md) - 包含所有操作、選項和語法的完整手冊參考
- [pdftk-cli-examples.md](references/pdftk-cli-examples.md) - 常見任務的實用命令列範例
- [download.md](references/download.md) - 所有平台的安裝與下載說明
- [pdftk-server-license.md](references/pdftk-server-license.md) - PDFtk Server 授權資訊
- [third-party-materials.md](references/third-party-materials.md) - 第三方函式庫授權
