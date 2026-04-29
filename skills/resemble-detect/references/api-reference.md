# Resemble Detect — 完整 API 參考

針對每個 Resemble 偵測端點的詳細請求/回應結構描述。

## 基礎

- **基礎 URL**：`https://app.resemble.ai/api/v2`
- **驗證**：`Authorization: Bearer <RESEMBLE_API_KEY>`

---

## 深偽偵測 (Deepfake Detection)

### `POST /detect`

提交音訊、圖片或影片進行 AI 產生內容分析。

```json
{
  "url": "https://example.com/media.mp4",
  "visualize": true,
  "intelligence": true,
  "audio_source_tracing": true
}
```

| 參數 | 類型 | 必要 | 說明 |
|------------------------|---------|----------|----------------------------------------------------------|
| `url` | 字串 | 是 | 音訊、圖片或影片檔案的 HTTPS URL |
| `callback_url` | 字串 | 否 | 異步完成通知的 Webhook URL |
| `visualize` | 布林值 | 否 | 產生熱圖/視覺化成品 |
| `intelligence` | 布林值 | 否 | 在偵測的同時執行多模態情報分析 |
| `audio_source_tracing` | 布林值 | 否 | 識別哪一個 AI 平台合成的偽造音訊 |
| `frame_length` | 整數 | 否 | 音訊/影片視窗大小，單位為秒 (1–4，預設為 2) |
| `start_region` | 數字 | 否 | 要分析的片段開始時間 (秒) |
| `end_region` | 數字 | 否 | 要分析的片段結束時間 (秒) |
| `model_types` | 字串 | 否 | `"image"` 或 `"talking_head"` (用於換臉偵測) |
| `use_reverse_search` | 布林值 | 否 | 啟用反向圖片搜尋 (僅限圖片) |
| `use_ood_detector` | 布林值 | 否 | 啟用離群值偵測 (Out-of-distribution detection) |
| `zero_retention_mode` | 布林值 | 否 | 偵測完成後自動刪除媒體 |

**支援格式：** 音訊 (WAV, MP3, OGG, M4A, FLAC) · 影片 (MP4, MOV, AVI, WMV) · 圖片 (JPG, PNG, GIF, WEBP)

### `GET /detect/{uuid}` — 輪詢結果

偵測是異步執行的。請持續輪詢直到 `status`（狀態）為 `"completed"` 或 `"failed"`。建議從 2 秒間隔開始，並逐漸退讓到 5 秒、10 秒。大多數偵測會在 10–60 秒內完成。

### 按媒體類型讀取結果

**音訊結果** — 位於 `metrics`：
```json
{
  "label": "fake",
  "score": ["0.92", "0.88", "0.95"],
  "consistency": "0.91",
  "aggregated_score": "0.92",
  "image": "https://..."
}
```
- `label`：`"fake"` 或 `"real"` — 判決結果
- `score`：按區塊劃分的預測分數 (陣列)
- `aggregated_score`：總體置信度 (0.0–1.0，越高代表越有可能是合成的)
- `consistency`：跨區塊預測的一致性程度
- `image`：視覺化熱圖 URL（如果 `visualize: true`）

**圖片結果** — 位於 `image_metrics`：
```json
{
  "type": "ImageAnalysis",
  "label": "fake",
  "score": 0.87,
  "image": "https://...",
  "ifl": { "score": 0.82, "heatmap": "https://..." },
  "reverse_image_search_sources": [
    { "url": "...", "title": "...", "verdict": "known_fake", "similarity": 0.95 }
  ]
}
```
- `ifl`：隱形頻率層 (Invisible Frequency Layer) 分析與熱圖
- `reverse_image_search_sources`：已知的線上來源（如果 `use_reverse_search: true`）

**影片結果** — 位於 `video_metrics`：
```json
{
  "label": "fake",
  "score": 0.89,
  "certainty": 0.91,
  "children": [
    { "type": "VideoResult", "conclusion": "Fake", "score": 0.89, "timestamp": 2.5, "children": [...] }
  ]
}
```
- 影格級別和片段級別結果的階層樹
- 含音軌的影片會同時回傳 `metrics`（音訊）和 `video_metrics`（視覺）

---

## 情報分析 (Intelligence)

### `POST /intelligence`

分析媒體以獲取豐富的結構化見解，可單獨執行或與偵測同時執行。

```json
{ "url": "https://example.com/audio.mp3", "json": true }
```

| 參數 | 類型 | 必要 | 說明 |
|----------------|---------|----------|----------------------------------------------------------|
| `url` | 字串 | 二擇一 | 媒體檔案的 HTTPS URL |
| `media_token` | 字串 | 二擇一 | 來自安全上傳的權仗 (URL 的替代方案) |
| `detect_id` | 字串 | 否 | 要關聯的現有偵測 UUID |
| `media_type` | 字串 | 否 | `"audio"`, `"video"`, 或 `"image"` (自動偵測) |
| `json` | 布林值 | 否 | 回傳結構化欄位 (音訊/影片預設為 false, 圖片預設為 true) |
| `callback_url` | 字串 | 否 | 異步模式的 Webhook |

**音訊/影片結構化回應** (`json: true`)：
- `speaker_info` — 講者描述 (年齡, 性別)
- `language` / `dialect` — 偵測到的語言
- `emotion` — 偵測到的情緒狀態
- `speaking_style` — 對話式, 正式等
- `context` — 推斷出的對話背景
- `message` — 內容摘要
- `abnormalities` — 媒體中偵測到的異常情況
- `transcription` — 完整逐字稿
- `translation` — 非英文內容的翻譯
- `misinformation` — 錯誤資訊分析

**圖片結構化回應**：
- `scene_description` — 圖片顯示內容
- `subjects` — 識別出的人物/物體
- `authenticity_analysis` — 視覺真實性評估
- `context_and_setting` — 環境描述
- `abnormalities` — 視覺異常
- `misinformation` — 錯誤資訊分析

### `POST /detects/{detect_uuid}/intelligence` — 提問

在偵測完成後，針對結果提出自然語言問題：

```json
{ "query": "模型對於此音訊為假的置信度有多少？" }
```

回傳一個問題 UUID。請輪詢 `GET /detects/{detect_uuid}/intelligence/{question_uuid}` 直到 `status` 為 `"completed"`。

**先決條件**：偵測的 `status` 必須為 `"completed"`，否則回傳 422 錯誤。

---

## 音訊來源追蹤 (Audio Source Tracing)

在 `POST /detect` 中設定 `audio_source_tracing: true` 即可啟用。

結果出現在偵測回應的 `audio_source_tracing` 欄位下：
```json
{ "label": "elevenlabs", "error_message": null }
```

已知來源標籤：`resemble_ai`、`elevenlabs`、`real`，以及隨著模型擴展增加的其他標籤。

**重要提示：** 來源追蹤僅在音訊標記為 `"fake"` 時執行。如果音訊為 `"real"`，則不會出現來源追蹤結果。

**獨立查詢：**
- `GET /audio_source_tracings` — 列出所有來源追蹤報告
- `GET /audio_source_tracings/{uuid}` — 獲取特定報告

---

## 浮水印 (Watermarking)

### `POST /watermark/apply`

```json
{
  "url": "https://example.com/image.png",
  "strength": 0.3,
  "custom_message": "my-organization"
}
```

| 參數 | 類型 | 必要 | 說明 |
|------------------|--------|----------|-------------------------------------------------------------|
| `url` | 字串 | 是 | 媒體檔案的 HTTPS URL |
| `strength` | 數字 | 否 | 浮水印強度 0.0–1.0 (僅限圖片/影片，預設為 0.2) |
| `custom_message` | 字串 | 否 | 自訂訊息 (僅限圖片/影片，預設為 "resembleai") |

- 加入 `Prefer: wait` 標頭以獲取同步回應
- 若不使用該標頭，請輪詢 `GET /watermark/apply/{uuid}/result`
- 回應包含 `watermarked_media` URL 以供下載含浮水印的檔案

### `POST /watermark/detect`

```json
{ "url": "https://example.com/suspect-image.png" }
```

**音訊偵測結果：**
```json
{ "has_watermark": true, "confidence": 0.95 }
```

**圖片/影片偵測結果：**
```json
{ "has_watermark": true }
```

---

## 身分 — 講者驗證 (Identity — Speaker Verification) (Beta)

> **Beta 測試功能** — 需要加入預覽計畫。如果使用者遇到存取錯誤，請告知他們。

### `POST /identity` — 建立身分設定檔

```json
{
  "audio_url": "https://example.com/known-speaker.wav",
  "name": "Jane Doe"
}
```

### `POST /identity/search` — 搜尋已知身分

```json
{
  "audio_url": "https://example.com/unknown-speaker.wav",
  "top_k": 5
}
```

**回應：**
```json
{
  "success": true,
  "item": [
    { "uuid": "...", "name": "Jane Doe", "confidence": 0.92, "distance": 0.08 }
  ]
}
```

`distance`（距離）越低 = 匹配越接近。`confidence`（置信度）越高 = 匹配越強。

---

## 文字偵測 (Text Detection)

> **Beta 測試功能** — 需要 `detect_beta_user` 角色或包含 `dfd_text` 產品的計費方案。

### `POST /text_detect`

加入 `Prefer: wait` 以獲取同步回應。否則請進行輪詢或使用回呼 (callback)。

| 參數 | 類型 | 必要 | 說明 |
|----------------|---------|----------|----------------------------------------------------------|
| `text` | 字串 | 是 | 要分析的文字 (最多 100,000 個字元) |
| `thinking` | 字串 | 否 | 始終使用 `"low"` (預設值) |
| `threshold` | 浮點數 | 否 | 決策閾值 0.0–1.0 (預設值：0.5) |
| `callback_url` | 字串 | 否 | 異步完成通知的 Webhook URL |
| `privacy_mode` | 布林值 | 否 | 若為 true，分析後不儲存文字內容 |

**回應：**
```json
{
  "success": true,
  "item": {
    "uuid": "abc-123",
    "status": "completed",
    "prediction": "ai",
    "confidence": 0.91,
    "text_content": "This is some text to analyze.",
    "privacy_mode": false,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

- `prediction`：`"ai"` 或 `"human"` — 判決結果
- `confidence`：0.0–1.0，越高代表越置信
- `status`：`"processing"`, `"completed"`, 或 `"failed"`

### `GET /text_detect/{uuid}` — 輪詢

輪詢直到 `status` 為 `"completed"` 或 `"failed"`。

### `GET /text_detect` — 列表

回傳團隊的分頁文字偵測紀錄。

### 回呼 (Callback)

如果提供了 `callback_url`，完成時會發送 `POST` 請求：
```json
{ "success": true, "item": { ... } }
```
失敗時：
```json
{ "success": false, "item": { ... }, "error": "錯誤訊息寫在這裡" }
```
