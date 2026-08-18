---
name: 'latchshot-page-capture'
description: '當使用者需要透過 Latchshot 將公用 HTTP(S) 網頁的螢幕截圖、網站縮圖、全頁擷取或 PDF 儲存為本機產物時使用此技能，包含報告、QA、封存和社群預覽工作流程。請勿用於私人或需驗證的頁面、原始 HTML、抓取或擷取、任意瀏覽器操作、CAPTCHA 或反爬蟲繞過，或本機檔案擷取。'
---

# Latchshot 網頁擷取 (Latchshot page capture)

使用隨附的無相依性用戶端，將公用網頁 URL 轉換為經過驗證的本機 PNG、JPEG 或 PDF。適當時從受限制的無金鑰 JPEG 示範開始。經過驗證的指令僅將 API 金鑰傳送至固定的 `https://latchshot.fly.dev` 來源，且每個產物皆為不可分割地 (atomically) 寫入。

Latchshot 是由此技能貢獻者維護的託管第三方服務。保持其使用為可選，並在任務需要私人頁面或不受支援的瀏覽器操作時保留現有的本機瀏覽器工作流程。

## 先決條件

需要 Node.js 20 或更新版本以及網路存取權限。針對經過驗證的擷取和使用量指令，僅從 `LATCHSHOT_API_KEY` 讀取金鑰。

如果缺少該變數，且符合請求需求時，請使用無金鑰示範進行單次有界限的 JPEG 擷取。對於 PNG、PDF、全頁、清理或重複性工作，引導使用者參閱 [Agent Skills 設定文件](https://latchshot.fly.dev/integrations.md#agent-skills)，然後停止。切勿要求使用者將金鑰貼到聊天、指令引數、原始碼、已認可的檔案或輸出中。切勿印出或傳回金鑰。

## 無金鑰示範

當檢視區 JPEG 可接受時，針對公用頁面使用此指令：

```bash
node scripts/latchshot.mjs demo \
  --url 'https://example.com' \
  --output './artifacts/example-demo.jpg'
```

該示範僅限 JPEG，不使用帳戶或轉譯配額，並允許每個 IP 位址每小時嘗試三次。它僅接受寬度、高度、查詢確認和明確覆寫選項。公用 URL 仍會傳送至 Latchshot，且請求帶有粗略的 `agentskill` 取得標籤。嚴格如同在擷取工作流程中一樣拒絕私人頁面、機密、已簽署的 URL 和經驗證的存取。將結果視為證明產物，而非客戶啟用或方案註冊。

## 擷取工作流程

1. 確認目標為公用 HTTP 或 HTTPS 頁面。拒絕憑證、私人/內部頁面、非 Web 連接埠、已簽署的 URL、查詢機密以及任何需要登入、Cookie、CAPTCHA 處理、Proxy 輪替、任意指令碼、點擊、輸入或反爬蟲繞過的請求。
2. 選擇使用者核准的輸出路徑。從 `.png`、`.jpg`/`.jpeg` 或 `.pdf` 推斷格式，或明確傳遞相符的 `--format`。
3. 從此技能目錄執行用戶端：

   ```bash
   node scripts/latchshot.mjs capture \
     --url 'https://example.com' \
     --output './artifacts/example.png'
   ```

4. 針對可啟動延遲載入內容的有界限全頁螢幕截圖：

   ```bash
   node scripts/latchshot.mjs capture \
     --url 'https://example.com' \
     --output './artifacts/example-full.png' \
     --full-page \
     --scroll-page
   ```

5. 針對 PDF：

   ```bash
   node scripts/latchshot.mjs capture \
     --url 'https://example.com' \
     --output './artifacts/example.pdf' \
     --paper A4
   ```

6. 剖析單行 JSON 結果。確認 `ok`、`output`、`format`、`contentType` 和 `bytes`；當周圍的任務需要視覺或文件驗證時，檢查本機產物。回報路徑和相關的轉譯/配額診斷資訊，而不公開金鑰。

執行 `node scripts/latchshot.mjs --help` 以取得確切的有界限選項。僅將 `--block-ads`、`--block-trackers`、`--block-chats`、`--hide-cookie-banners` 和 `--hide-popups` 作為盡力而為的清理 — 而非繞過。僅在確認查詢不包含憑證、簽章、權杖、客戶資料或其他機密後，才使用 `--allow-query`。除非明確指定 `--force`，否則用戶端拒絕覆寫檔案。

## 讀取配額

當使用者詢問剩餘轉譯次數或重設時間時，使用唯讀指令：

```bash
node scripts/latchshot.mjs usage
```

這不會消耗轉譯配額或變更方案。

## 失敗處理

- 從 stderr 讀取結構化錯誤碼和訊息；請勿重試驗證或身分驗證失敗。
- 對於 `demo_limit`，等待每小時重設，而不是循環重試或切換身分。
- 對於 `rate_limited`，等待回報的重設或 retry-after 邊界，而不是循環重試。
- 對於轉譯失敗，說明失敗原因並保留任何現有輸出檔案。不要靜默替換為本機瀏覽器、其他提供者或不受支援的私人頁面存取。
- 不要啟動升級、結帳、付款、實作請求或其他商業行動。這些仍由使用者和擁有者控制。

## 硬性邊界

Latchshot 僅接受公用頁面並傳回一個二進位產物。它不提供原始 HTML 輸入、DOM 擷取、選取器、工作階段、任意 JavaScript、經身分驗證/私人頁面、CAPTCHA 破解、住宅代理或反機器人規避。僅成功的轉譯才會消耗配額。
