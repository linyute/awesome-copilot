---
name: 'resemble-detect'
description: '深偽偵測與媒體安全 — 使用 Resemble AI 偵測 AI 產生的音訊、圖片、影片和文字、追蹤合成來源、套用浮水印、驗證講者身分，以及分析媒體情報。'
license: 'Apache-2.0'
compatibility: '需要將 Resemble AI API 金鑰 (https://app.resemble.ai) 設定為 RESEMBLE_API_KEY。所有媒體都必須透過公開的 HTTPS URL 存取 — 除文字偵測外，不支援本地檔案路徑。'
---

# Resemble Detect — 深偽偵測與媒體安全

使用 Resemble AI 平台分析音訊、圖片、影片和文字，以進行合成竄改、AI 產生內容、浮水印、講者身分以及媒體情報分析。

## 核心原則 — 鐵律

**「在偵測結果完成前，絕不宣稱媒體為真或假。」**

不要對媒體的真實性進行猜測、推論或投機。每項真實性主張都必須有已完成的 Resemble 偵測任務支援，且該任務應回傳 `label`（標籤）、`score`（分數）以及 `status: "completed"`（狀態：已完成）。如果偵測仍在 `processing`（處理中），請等待。如果偵測 `failed`（失敗），請如實說明 — 不要代入你自己的判斷。

## 何時使用

每當使用者的請求涉及以下任一項時，請使用此技能：

- 檢查音訊、影片、圖片或文字是否為 AI 產生或經過竄改
- 偵測任何媒體格式中的深偽內容 (Deepfakes)
- 驗證媒體的真實性或來源 (Provenance)
- 識別哪一個 AI 平台合成的音訊 (來源追蹤)
- 對媒體套用或偵測浮水印
- 分析媒體以獲取講者資訊、情緒、逐字稿或錯誤資訊
- 針對偵測結果提出自然語言問題
- 將講者身分與已知的語音設定檔進行比對或驗證
- 偵測 AI 產生或機器編寫的文字
- 任何提及以下詞彙的內容：「deepfake」、「深偽偵測」、「合成媒體」、「語音驗證」、「浮水印」、「媒體鑑識」、「真實性檢查」、「來源追蹤」、「這是真的嗎」、「AI 編寫文字」、「文字偵測」

**請勿**用於文字轉語音產生、語音複製或語音轉文字逐字稿 — 這些屬於 Resemble 的其他功能。

## 能力決策樹

| 使用者想要... | 使用此功能 | API 端點 |
|-------------------------------------------------------|---------------------------|---------------------------------------|
| 檢查媒體是否為 AI 產生 / 深偽 | **深偽偵測** | `POST /detect` |
| 了解*哪一個 AI 平台*製作了偽造音訊 | **音訊來源追蹤** | 帶有旗標的 `POST /detect` |
| 從媒體獲取講者資訊、情緒、逐字稿 | **媒體情報** | `POST /intelligence` |
| 針對已完成的偵測結果提出問題 | **偵測情報** | `POST /detects/{uuid}/intelligence` |
| 對媒體套用不可見浮水印 | **套用浮水印** | `POST /watermark/apply` |
| 檢查媒體是否包含浮水印 | **偵測浮水印** | `POST /watermark/detect` |
| 根據已知設定檔驗證講者身分 | **身分搜尋** | `POST /identity/search` |
| 檢查文字是否為 AI 產生 | **文字偵測** | `POST /text_detect` |
| 建立語音身分設定檔以供未來比對 | **建立身分** | `POST /identity` |

當多種能力同時適用時（例如：使用者想要深偽偵測以及情報分析），請在單次 `POST /detect` 呼叫中使用 `intelligence: true` 旗標，而不要分開請求。

## 必要設定

- **API 金鑰**：來自 Resemble AI 儀表板的載體權仗 (Bearer token)（設定為 `RESEMBLE_API_KEY`）
- **基礎 URL**：`https://app.resemble.ai/api/v2`
- **驗證標頭**：`Authorization: Bearer <RESEMBLE_API_KEY>`
- **媒體要求**：所有媒體必須位於可公開存取的 HTTPS URL 上

如果使用者提供本地檔案路徑而非 URL，請告知他們必須先將檔案代管在公開的 HTTPS URL 上。請勿嘗試將本地檔案上傳到 API。（例外：`POST /text_detect` 接受內嵌的文字內容。）

## 可用的 MCP 工具

當 Resemble MCP 伺服器連線時，請使用這些工具而非原始 API 呼叫：

| 工具 | 用途 |
|---------------------------|---------------------------------------------------|
| `resemble_docs_lookup` | 獲取任何偵測子主題的全面文件 |
| `resemble_search` | 在所有文件中進行搜尋 |
| `resemble_api_endpoint` | 獲取任何端點的確切 OpenAPI 規範 |
| `resemble_api_search` | 透過關鍵字尋找端點 |
| `resemble_get_page` | 閱讀特定的說明文件頁面 |
| `resemble_list_topics` | 列出所有可用主題 |

**工具使用模式**：使用 `resemble_docs_lookup` 並將主題設為 `"detect"` 以獲取全貌，然後在發起 API 呼叫前，使用 `resemble_api_endpoint` 獲取確切的請求/回應結構描述。

## 完整 API 參考

每個端點的詳細請求/回應結構描述位於 **[references/api-reference.md](references/api-reference.md)**。在發起任何 API 呼叫前，請務必查閱該檔案以驗證確切的參數名稱和回應形狀。下方各節涵蓋決策過程；參考檔案則涵蓋確切的欄位格式。

---

## 階段 1：深偽偵測

核心能力。透過 `POST /detect` 提交音訊、圖片或影片以進行 AI 產生內容分析。

**要考慮的關鍵旗標：**
- `visualize: true` — 產生熱圖/視覺化成品
- `intelligence: true` — 在偵測的同時執行多模態情報分析（節省往返時間）
- `audio_source_tracing: true` — 識別是哪個 AI 平台合成的偽造音訊（僅對標籤為 `"fake"` 的音訊觸發）
- `use_reverse_search: true` — 啟用反向圖片搜尋（僅限圖片）
- `zero_retention_mode: true` — 在分析後自動刪除媒體（針對敏感內容）

偵測是異步執行的。請以 2s → 5s → 10s 的間隔輪詢 `GET /detect/{uuid}`，直到 `status`（狀態）為 `"completed"`（已完成）或 `"failed"`（失敗）。大多數偵測在 10–60 秒內完成。

**支援的格式：** 音訊 (WAV, MP3, OGG, M4A, FLAC) · 影片 (MP4, MOV, AVI, WMV) · 圖片 (JPG, PNG, GIF, WEBP)

### 讀取結果

- **音訊** — 判決結果在 `metrics` 中 — 請使用 `label` 和 `aggregated_score`
- **圖片** — 判決結果在 `image_metrics` 中 — 請使用 `label` 和 `score`；`ifl` 包含隱形頻率層 (Invisible Frequency Layer) 熱圖
- **影片** — 判決結果在 `video_metrics` 中 — 為影格/片段結果的階層樹；含音軌的影片會同時回傳 `metrics` 和 `video_metrics`

有關完整的回應結構描述，請參閱 [references/api-reference.md](references/api-reference.md#reading-results-by-media-type)。

### 解讀分數

| 分數範圍 | 解讀 |
|-------------|-----------------------------------------------------|
| 0.0 – 0.3 | 強烈顯示媒體為真實/真跡 |
| 0.3 – 0.5 | 不確定 — 建議進行額外分析 |
| 0.5 – 0.7 | 可能是合成的 — 標記以供審查 |
| 0.7 – 1.0 | 高度置信為合成/AI 產生 |

**務必結合背景呈現分數。** 請說：「偵測回傳分數為 0.87，顯示此音訊高度置信為 AI 產生」— 絕不要只說「它是假的」。

---

## 階段 2：情報 — 媒體分析

關於媒體的豐富結構化見解：講者資訊、情緒、逐字稿、翻譯、錯誤資訊、異常情況。

執行情報分析的兩種方式：
1. **與偵測結合** — 在 `POST /detect` 中加入 `intelligence: true`（推薦；單次呼叫即可完成）
2. **獨立執行** — 帶有 URL 的 `POST /intelligence`（當你只需要分析而不需要深偽判決時）

**音訊/影片結構化欄位包含：** `speaker_info`、`language`、`dialect`、`emotion`、`speaking_style`、`context`、`message`、`abnormalities`、`transcription`、`translation`、`misinformation`。

**圖片結構化欄位包含：** `scene_description`、`subjects`、`authenticity_analysis`、`context_and_setting`、`abnormalities`、`misinformation`。

### 偵測情報 — 針對結果提問

在偵測完成後，透過 `POST /detects/{detect_uuid}/intelligence` 並帶上 `{ "query": "..." }` 提出自然語言問題。會回傳一個問題 UUID — 請輪詢 `GET /detects/{detect_uuid}/intelligence/{question_uuid}` 直到狀態為 `completed`。

**建議向使用者提議的問題：**
- 「用簡單的語言總結偵測結果」
- 「有哪些具體指標顯示這是 AI 產生的？」
- 「音訊和影片的偵測結果有何不同？」
- 「置信度等級是多少，代表什麼意義？」
- 「分析中是否有任何不一致之處？」

**先決條件**：偵測的 `status` 必須為 `"completed"`。針對處理中或失敗的偵測提交問題會回傳 422 錯誤。

有關完整參數，請參閱 [references/api-reference.md](references/api-reference.md#intelligence)。

---

## 階段 3：音訊來源追蹤

當音訊被標記為 `"fake"` 時，識別是哪個 AI 平台產生的。

在 `POST /detect` 請求中設定 `audio_source_tracing: true` 以**啟用此功能**。結果會出現在偵測回應的 `audio_source_tracing.label` 中。

已知標籤：`resemble_ai`、`elevenlabs`、`real`，以及隨著模型擴展而增加的其他標籤。

**重要提示：** 來源追蹤僅針對標記為 `"fake"` 的音訊執行。真實音訊不會產生來源追蹤結果。

獨立查詢：`GET /audio_source_tracings` 和 `GET /audio_source_tracings/{uuid}`。

---

## 階段 4：浮水印

對媒體套用不可見浮水印以進行來源追蹤，或偵測現有的浮水印。

- **套用**：`POST /watermark/apply` 帶上 `url`、選用的 `strength` (0.0–1.0) 以及選用的 `custom_message`。加入 `Prefer: wait` 標頭以進行同步回應，或輪詢 `GET /watermark/apply/{uuid}/result`。回應包含 `watermarked_media` 的 URL。
- **偵測**：`POST /watermark/detect` 帶上 `url`。音訊回傳 `{ has_watermark, confidence }`；圖片/影片回傳 `{ has_watermark }`。

有關確切的參數規則，請參閱 [references/api-reference.md](references/api-reference.md#watermarking)。

---

## 階段 5：身分 — 講者驗證 (Beta)

建立語音身分設定檔，並將傳入的音訊與之比對。

> **Beta 測試功能** — 需要加入預覽計畫。如果使用者遇到存取錯誤，請告知他們。

- **建立設定檔**：`POST /identity` 帶上 `{ audio_url, name }`
- **搜尋**：`POST /identity/search` 帶上 `{ audio_url, top_k }`

回應會回傳按排名排列的符合項，包含 `confidence`（置信度，越高越強）和 `distance`（距離，越低越接近）。

有關完整的結構描述，請參閱 [references/api-reference.md](references/api-reference.md#identity--speaker-verification-beta)。

---

## 階段 6：文字偵測

透過 `POST /text_detect` 偵測文字內容是 AI 產生還是人類編寫。

> **Beta 測試功能** — 需要 `detect_beta_user` 角色或包含 `dfd_text` 產品的計費方案。

**關鍵參數：**
- `text`（必要，最多 100,000 個字元）
- `threshold`（預設值 0.5）
- `privacy_mode: true` — 分析後不儲存文字內容
- `callback_url` — 異步通知 Webhook

加入 `Prefer: wait` 以進行同步回應，或輪詢 `GET /text_detect/{uuid}`。回應包含 `prediction`（`"ai"` 或 `"human"`）和 `confidence` (0.0–1.0)。

有關完整結構描述和回呼格式，請參閱 [references/api-reference.md](references/api-reference.md#text-detection)。

---

## 推薦工作流程

### 全面媒體鑑識 (最徹底)

為了進行全面分析，請結合所有能力：

1. 提交開啟所有旗標的偵測請求：
   ```json
   {
     "url": "https://example.com/suspect.mp4",
     "visualize": true,
     "intelligence": true,
     "audio_source_tracing": true,
     "use_reverse_search": true
   }
   ```
2. 輪詢直到 `status: "completed"`
3. 讀取 `metrics` / `image_metrics` / `video_metrics` 以獲取判決
4. 閱讀 `intelligence.description` 以獲取結構化的媒體分析
5. 如果音訊標記為 `"fake"`，檢查 `audio_source_tracing.label` 以了解來源平台
6. 如果有任何需要澄清的地方，透過偵測情報提出後續問題
7. 如果來源追蹤相關，透過 `POST /watermark/detect` 檢查浮水印

### 快速真實性檢查 (最快)

1. 提交最小化的偵測請求：`{ "url": "..." }`
2. 輪詢直到完成
3. 檢查 `label` 和 `aggregated_score`（音訊）或 `label` 和 `score`（圖片/影片）
4. 結合分數背景回報結果

### 來源追蹤管線 (內容創作者)

1. 對原始內容套用浮水印：`POST /watermark/apply`
2. 發佈含浮水印的媒體
3. 之後，針對任何副本透過 `POST /watermark/detect` 驗證來源

---

## 紅燈 — 停止並重新評估

- **在偵測結果出來前宣稱真實性** — 絕不要僅根據視覺/聽覺檢查就斷定媒體是真還是假。
- **忽視分數而僅回報標籤** — 分數 0.51 的 `"fake"` 標籤與分數 0.95 的意義完全不同。
- **向 API 提交本地檔案路徑** — API 需要可公開存取的 HTTPS URL（不適用於文字偵測）。
- **傳送超過 100,000 個字元的文字進行偵測** — 將其拆分為多個區塊或告知使用者該限制。
- **過於頻繁地輪詢** — 從 2 秒間隔開始，並以指數級退讓；不要以少於 1 秒的間隔進行迴圈。
- **在偵測完成前提出偵測情報問題** — 會導致 422 錯誤。
- **期望在「真實 (real)」音訊上進行來源追蹤** — 來源追蹤僅針對標記為 `"fake"` 的音訊執行。
- **將 Beta 測試功能 (Identity, Text Detection) 視為生產就緒** — 警告使用者其 Beta 狀態。
- **針對敏感媒體忽略 `zero_retention_mode`** — 當使用者指示媒體為敏感或私密時，務必建議使用此旗標。
- **在可以合併旗標時發起多次獨立的 API 呼叫** — 在偵測呼叫中一併使用 `intelligence: true` 和 `audio_source_tracing: true`，而不要發起多個請求。

## 回應呈現指引

向使用者呈現結果時：

1. **先說判決結果** — 「偵測顯示此音訊可能是 AI 產生的（分數：0.87）」
2. **提供分數背景** — 使用上方的分數解讀表
3. **提及限制** — 偵測是機率性的，而非絕對證據
4. **包含可執行的後續步驟** — 視情況建議情報查詢、來源追蹤或浮水印檢查
5. **針對不確定的結果 (0.3–0.5)** — 明確說明結果不確定，並建議使用不同參數進行額外分析或人工審查
6. **絕不將偵測結果作為法律證據呈現** — 偵測結果是分析工具，而非鑑識認證

## 錯誤處理

| 錯誤代碼 | 原因 | 解決方案 |
|-----------|--------------------------------------------|-------------------------------------------------|
| 400 | 無效的請求本文或缺少 `url` | 檢查必要的參數 |
| 401 | 無效或缺少 API 金鑰 | 驗證 `RESEMBLE_API_KEY` |
| 404 | 找不到偵測 UUID | 從建立回應中驗證 UUID |
| 422 | 偵測尚未完成（針對情報分析） | 等待偵測達到 `completed` 狀態 |
| 429 | 觸發頻率限制 | 退讓並以指數延遲重試 |
| 500 | 伺服器錯誤 | 重試一次，然後回報給使用者 |

## 隱私與合規註記

- **零保留模式 (Zero retention mode)**：設定 `zero_retention_mode: true` 以在分析後自動刪除媒體。URL 會被遮罩，且完成後 `media_deleted` 會設為 true。
- **文字隱私模式 (Text privacy mode)**：在文字偵測上設定 `privacy_mode: true`，以防止文字內容在分析後被儲存。
- **資料處理**：媒體 URL 和文字內容預設會被儲存。對於符合 GDPR/合規性要求的工作流程，請啟用零保留（媒體）或隱私模式（文字）。
- **回呼安全性**：如果使用 `callback_url`，請確保端點為 HTTPS 且在接收端已通過驗證。
