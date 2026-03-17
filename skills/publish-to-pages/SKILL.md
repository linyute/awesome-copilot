---
name: publish-to-pages
description: '將簡報與網頁內容發佈到 GitHub Pages。將 PPTX、PDF、HTML 或 Google 簡報轉換為即時 GitHub Pages URL。處理儲存庫建立、檔案轉換、啟用 Pages，並傳回即時 URL。當使用者想要透過 GitHub Pages 發佈、部署或共用簡報或 HTML 檔案時使用。'
---

# publish-to-pages

一鍵將任何簡報或網頁內容發佈到 GitHub Pages。

## 1. 必要條件檢查

以靜默方式執行。僅顯示錯誤：

```bash
command -v gh >/dev/null || echo "遺漏：gh CLI — 請從 https://cli.github.com 安裝"
gh auth status &>/dev/null || echo "遺漏：gh 未通過驗證 — 請執行 'gh auth login'"
command -v python3 >/dev/null || echo "遺漏：python3 (PPTX 轉換所需)"
```

`poppler-utils` 為選用 (透過 `pdftoppm` 進行 PDF 轉換)。不要因此而中斷流程。

## 2. 輸入偵測

根據使用者提供的內容決定輸入類型：

| 輸入 | 偵測 |
|-------|-----------|
| HTML 檔案 | 副檔名 `.html` 或 `.htm` |
| PPTX 檔案 | 副檔名 `.pptx` |
| PDF 檔案 | 副檔名 `.pdf` |
| Google 簡報 URL | URL 包含 `docs.google.com/presentation` |

若未提供，請詢問使用者 **儲存庫名稱**。預設值：不含副檔名的檔名。

## 3. 轉換

### HTML
不需轉換。直接將檔案用作 `index.html`。

### PPTX
執行轉換指令碼：
```bash
python3 SKILL_DIR/scripts/convert-pptx.py INPUT_FILE /tmp/output.html
```
如果遺漏 `python-pptx`，請告知使用者：`pip install python-pptx`

### PDF
使用隨附的指令碼進行轉換 (需要 `poppler-utils` 以執行 `pdftoppm`)：
```bash
python3 SKILL_DIR/scripts/convert-pdf.py INPUT_FILE /tmp/output.html
```
每一頁都會轉譯為 PNG 並以 Base64 內嵌到包含投影片導覽功能且自帶內容的 HTML 中。
如果遺漏 `pdftoppm`，請告知使用者：`apt install poppler-utils` (或 macOS 上的 `brew install poppler`)。

### Google 簡報
1. 從 URL 擷取簡報識別碼 (位於 `/d/` 與 `/` 之間的長字串)
2. 下載為 PPTX：
```bash
curl -L "https://docs.google.com/presentation/d/PRESENTATION_ID/export/pptx" -o /tmp/slides.pptx
```
3. 然後使用上述轉換指令碼轉換該 PPTX。

## 4. 發佈

### 可見性
依預設會建立 **公開** 的儲存庫。如果使用者指定 `private` (或想要私有儲存庫)，請使用 `--private` — 但請注意，私有儲存庫上的 GitHub Pages 需要 Pro、Team 或 Enterprise 方案。

### 發佈
```bash
bash SKILL_DIR/scripts/publish.sh /path/to/index.html REPO_NAME public "說明內容"
```

如果使用者要求，請傳遞 `private` 而非 `public`。

指令碼會建立儲存庫、推送 `index.html` 並啟用 GitHub Pages。

## 5. 輸出

告知使用者：
- **儲存庫：** `https://github.com/USERNAME/REPO_NAME`
- **即時 URL：** `https://USERNAME.github.io/REPO_NAME/`
- **注意：** Pages 需要 1-2 分鐘才會上線。

## 錯誤處理

- **儲存庫已存在：** 建議附加數字 (`my-slides-2`) 或日期 (`my-slides-2026`)。
- **啟用 Pages 失敗：** 仍然傳回儲存庫 URL。使用者可以在儲存庫設定中手動啟用 Pages。
- **PPTX 轉換失敗：** 告知使用者執行 `pip install python-pptx`。
- **PDF 轉換失敗：** 建議安裝 `poppler-utils` (`apt install poppler-utils` 或 `brew install poppler`)。
- **Google 簡報下載失敗：** 簡報可能無法公開存取。要求使用者將其設為可檢視或手動下載 PPTX。
