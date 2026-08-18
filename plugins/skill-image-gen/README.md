# Skill Image Gen

直接從您的編碼工作流程中使用 AI 產生圖片。支援 **OpenAI (gpt-image-2)** 與 **Google Gemini (Nano Banana)**。

## 功能介紹

使用自然語言產生圖片 — 圖示、精靈圖、材質貼圖、模型、藝術作品 — 無需離開您的編輯器。此技能會處理 API 呼叫、檔案儲存，並在首次使用時引導您完成設定。

## 提供者

| 提供者 | 模型 | 優勢 |
|---|---|---|
| OpenAI | gpt-image-2 | 高品質、優異的文字算繪能力 |
| Google Gemini | gemini-2.0-flash-exp | 快速、提供免費方案 |

## 設定

自行準備 API 金鑰。首次使用時，此技能會引導您完成：

1. 選擇提供者
2. 取得 API 金鑰 ([OpenAI](https://platform.openai.com/api-keys) · [Gemini](https://aistudio.google.com/apikey))
3. 設定環境變數 (`SKILL_IMAGE_GEN_OPENAI_KEY` 或 `SKILL_IMAGE_GEN_GEMINI_KEY`)

## 使用方式

要求 Copilot 產生圖片：

- "產生像素藝術風格的寶箱"
- "為我的遊戲建立無縫草地材質貼圖"
- "為我的應用程式製作簡約風格的標誌"

## 連結

- **來源存放庫**：[adamd9/skill-image-gen](https://github.com/adamd9/skill-image-gen)
- **授權**：MIT
