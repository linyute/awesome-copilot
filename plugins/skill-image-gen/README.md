# Skill Image Gen

直接從您的程式碼編寫工作流程中，使用 AI 建立影像。支援 **OpenAI (gpt-image-2)** 與 **Google Gemini (Nano Banana)**。

## 功能介紹

使用自然語言建立影像 —— 圖示、精靈、紋理、模型、藝術品 —— 無須離開您的編輯器。此技能會處理 API 呼叫、檔案儲存，並在首次使用時引導您完成設定。

## 提供者

| 提供者 | 模型 | 優點 |
|---|---|---|
| OpenAI | gpt-image-2 | 高品質，卓越的文字渲染能力 |
| Google Gemini | gemini-2.0-flash-exp | 快速，提供免費方案 |

## 設定

自備 API 金鑰。在首次使用時，此技能將引導您完成：

1. 選擇提供者
2. 取得 API 金鑰 ([OpenAI](https://platform.openai.com/api-keys) · [Gemini](https://aistudio.google.com/apikey))
3. 設定環境變數 (`SKILL_IMAGE_GEN_OPENAI_KEY` 或 `SKILL_IMAGE_GEN_GEMINI_KEY`)

## 用法

要求 Copilot 建立影像：

- 「建立一個像素藝術寶箱」
- 「為我的遊戲建立無縫草地紋理」
- 「為我的應用程式建立一個極簡風格的標誌」

## 連結

- **原始碼存放庫**: [adamd9/skill-image-gen](https://github.com/adamd9/skill-image-gen)
- **授權條款**: MIT
