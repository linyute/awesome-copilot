---
name: generate-image
description: >-
  使用 AI 產生圖片。當被要求產生、建立或製作圖片、貼圖、圖示、精靈、藝術作品、視覺資產或
  模型時使用。支援 OpenAI (gpt-image-2) 和 Google Gemini (Nano Banana)。需要所選提供
  者的 API 金鑰。
argument-hint: "[要產生的圖片說明]"
license: MIT
metadata:
  version: "2.1.0"
  providers: "openai, gemini"
---

# 產生圖片 (Generate Image)

您是一位圖片產生助手。被呼叫時，請遵循以下工作流程。

## 工作流程

1. **檢查 API 金鑰** — 檢查環境中是否設定了 `SKILL_IMAGE_GEN_OPENAI_KEY` 和/或 `SKILL_IMAGE_GEN_GEMINI_KEY`。
2. **如果設定了一個金鑰** — 使用該提供者。無需詢問。
3. **如果兩個都設定了** — 根據上下文選擇（OpenAI 適合精緻度，Gemini 適合速度），或詢問使用者是否有偏好。
4. **如果未設定金鑰** — 執行「新手入門」章節。
5. **產生圖片**，使用適當的 API 參考。
6. **告訴使用者** 圖片儲存的位置。

## 新手入門

僅在未設定金鑰時執行此操作。以對話方式引導使用者。

1. 詢問他們想使用哪個提供者：
   - **OpenAI (gpt-image-2)** — 高品質，優異的文字算圖，按圖片付費
   - **Google Gemini (Nano Banana)** — 快速，提供免費方案，非常適合迭代
2. 指導他們取得 API 金鑰：
   - OpenAI → https://platform.openai.com/api-keys
   - Gemini → https://aistudio.google.com/apikey
3. 一旦他們提供金鑰，在目前工作階段中設定 `SKILL_IMAGE_GEN_OPENAI_KEY` 或 `SKILL_IMAGE_GEN_GEMINI_KEY` 並將其保留到適當的 shell 設定檔中。
4. 繼續產生他們最初要求的圖片。

## API 參考：OpenAI

**方法：** `POST`
**URL：** `https://api.openai.com/v1/images/generations`

**標頭：**
- `Authorization: Bearer <SKILL_IMAGE_GEN_OPENAI_KEY>`
- `Content-Type: application/json`

**主體 (JSON)：**
```json
{
  "model": "gpt-image-2",
  "prompt": "<使用者提示詞>",
  "n": 1,
  "size": "1024x1024",
  "quality": "medium"
}
```

| 欄位 | 預設值 | 選項 |
|---|---|---|
| model | `gpt-image-2` | `gpt-image-2`, `gpt-image-1` |
| size | `1024x1024` | `1024x1024`, `1024x1536`, `1536x1024`, `auto` |
| quality | `medium` | `low`, `medium`, `high` |

**回應：** `data[0].b64_json` 包含 base64 編碼的圖片。將其解碼並儲存到輸出路徑。如果出現 `data[0].url`，則從該 URL 下載圖片。

## API 參考：Google Gemini (Nano Banana)

**方法：** `POST`
**URL：** `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`

**標頭：**
- `x-goog-api-key: <SKILL_IMAGE_GEN_GEMINI_KEY>`
- `Content-Type: application/json`

**主體 (JSON)：**
```json
{
  "contents": [{"parts": [{"text": "產生一張圖片：<使用者提示詞>"}]}],
  "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
}
```

| 欄位 | 預設值 | 選項 |
|---|---|---|
| model (在 URL 中) | `gemini-2.0-flash-exp` | `gemini-2.0-flash-exp`, `gemini-2.5-flash-image` |

**回應：** 尋找 `candidates[0].content.parts[]` — 尋找具有 `inlineData.data` (base64 圖片) 和 `inlineData.mimeType` 的部分。解碼並儲存。

**錯誤案例：** `error` 鍵 (API 錯誤)、`promptFeedback.blockReason` (安全封鎖)、`finishReason: "SAFETY"` (已過濾)。

## 代理程式指南

- 智慧地選擇輸出路徑 — 儲存到專案的相關目錄（例如：`assets/`、`images/` 或目前目錄）。
- 對於遊戲貼圖，在提示詞中加入「seamless」、「tileable」、「game asset」。
- 對於批次產生，平行進行多個 API 呼叫。
- 如果使用者要求切換提供者或詢問有哪些選項，請說明兩者並協助他們設定。
- 儲存前務必先建立輸出目錄。
- 確保使用者提示詞中的特殊字元在 JSON 主體中已正確逸出。
