---
name: publish-to-pages
description: '將簡報和網頁內容發佈到 GitHub Pages。將 PPTX、PDF、HTML 或 Google 簡報轉換為即時的 GitHub Pages 網址。處理存放庫建立、檔案轉換、啟用 Pages 功能，並回傳即時網址。當使用者想要透過 GitHub Pages 發佈、部署或共用簡報或 HTML 檔案時，請使用此技能。'
---

# publish-to-pages

一次完成將任何簡報或網頁內容發佈到 GitHub Pages。

## 1. 前提條件檢查

靜默執行這些檢查。僅在出錯時顯示：

```bash
command -v gh >/dev/null || echo "MISSING: gh CLI — 請從 https://cli.github.com 安裝"
gh auth status &>/dev/null || echo "MISSING: gh 未驗證 — 請執行 'gh auth login'"
command -v python3 >/dev/null || echo "MISSING: python3 (PPTX 轉換所需)"
```

`poppler-utils` 是選用的（透過 `pdftoppm` 進行 PDF 轉換）。不要因此阻塞流程。

## 2. 輸入偵測

根據使用者提供的內容判斷輸入類型：

| 輸入 | 偵測方式 |
|-------|-----------|
| HTML 檔案 | 副檔名為 `.html` 或 `.htm` |
| PPTX 檔案 | 副檔名為 `.pptx` |
| PDF 檔案 | 副檔名為 `.pdf` |
| Google 簡報網址 | 網址包含 `docs.google.com/presentation` |

如果使用者未提供，請詢問**存放庫名稱**。預設值：不含副檔名的檔名。

## 3. 轉換

### 大檔案處理

兩個轉換腳本都會自動偵測大型檔案並切換到**外部資產模式**：
- **PPTX：** 檔案 >20MB 或包含 >50 張影像 → 影像將作為獨立檔案儲存在 `assets/` 中
- **PDF：** 檔案 >20MB 或包含 >50 頁 → 頁面 PNG 將儲存在 `assets/` 中
- 檔案 >150MB 會顯示警告（PPTX 會建議改用 PDF 路徑）

這能確保個別檔案遠低於 GitHub 的 100MB 限制。小檔案仍會產生單一的自包含 HTML。

您可以使用 `--external-assets` 或 `--no-external-assets` 強制指定行為。

### HTML
無需轉換。直接將該檔案用作 `index.html`。

### PPTX
執行轉換腳本：
```bash
python3 SKILL_DIR/scripts/convert-pptx.py 輸入檔案 /tmp/output.html
# 針對大型檔案，強制使用外部資產：
python3 SKILL_DIR/scripts/convert-pptx.py 輸入檔案 /tmp/output.html --external-assets
```
如果缺少 `python-pptx`，請告知使用者：`pip install python-pptx`

### PDF
使用隨附的腳本轉換（`pdftoppm` 需要 `poppler-utils`）：
```bash
python3 SKILL_DIR/scripts/convert-pdf.py 輸入檔案 /tmp/output.html
# 針對大型檔案，強制使用外部資產：
python3 SKILL_DIR/scripts/convert-pdf.py 輸入檔案 /tmp/output.html --external-assets
```
每一頁都會被渲染為 PNG 並嵌入到具有投影片導覽功能的 HTML 中。
如果缺少 `pdftoppm`，請告知使用者：`apt install poppler-utils`（在 macOS 上為 `brew install poppler`）。

### Google 簡報
1. 從網址中擷取簡報 ID（`/d/` 和 `/` 之間的長字串）
2. 下載為 PPTX：
```bash
curl -L "https://docs.google.com/presentation/d/簡報_ID/export/pptx" -o /tmp/slides.pptx
```
3. 然後使用上述轉換腳本轉換 PPTX。

## 4. 發佈

### 可見性
預設情況下建立的存放庫為 **public**。如果使用者指定 `private`（或想要私有存放庫），請使用 `--private` — 但請注意，私有存放庫上的 GitHub Pages 需要 Pro、Team 或 Enterprise 方案。

### 發佈
```bash
bash SKILL_DIR/scripts/publish.sh /path/to/index.html 存放庫名稱 public "說明描述"
```

如果使用者要求，請傳遞 `private` 而非 `public`。

該腳本會建立存放庫，推送 `index.html`（如果存在則包含 `assets/`），並啟用 GitHub Pages。

**注意：** 當使用外部資產模式時，產出的 HTML 會引用 `assets/` 中的檔案。發佈腳本會自動偵測並將 `assets/` 目錄複製到 HTML 檔案旁邊。請確保 HTML 檔案及其 `assets/` 目錄位於同一個父目錄中。

## 5. 輸出

告知使用者：
- **存放庫：** `https://github.com/使用者名稱/存放庫名稱`
- **即時網址：** `https://使用者名稱.github.io/存放庫名稱/`
- **注意：** Pages 需要 1-2 分鐘才能上線。

## 錯誤處理

- **存放庫已存在：** 建議附加數字（`my-slides-2`）或日期（`my-slides-2026`）。
- **啟用 Pages 失敗：** 仍然回傳存放庫網址。使用者可以在存放庫「Settings」中手動啟用 Pages。
- **PPTX 轉換失敗：** 告知使用者執行 `pip install python-pptx`。
- **PDF 轉換失敗：** 建議安裝 `poppler-utils`（`apt install poppler-utils` 或 `brew install poppler`）。
- **Google 簡報下載失敗：** 簡報可能不具備公開存取權限。請要求使用者將其設為可檢視或手動下載 PPTX。
