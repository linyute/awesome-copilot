---
name: transloadit-media-processing
description: '使用 Transloadit 處理媒體檔案（影片、音訊、影像、文件）。當被要求將影片編碼為 HLS/MP4、產生縮圖、調整影像大小或增加浮水印、擷取音訊、串接剪輯、增加字幕、對文件進行 OCR 或執行任何媒體處理管線時使用。涵蓋 86 個以上用於大規模檔案轉換的處理機器人 (robots)。'
license: MIT
compatibility: 需要免費的 Transloadit 帳戶 (https://transloadit.com/signup)。使用 @transloadit/mcp-server MCP 伺服器或 @transloadit/node CLI。
---

# Transloadit 媒體處理 (Transloadit Media Processing)

使用 Transloadit 的雲端基礎設施處理、轉換與編碼媒體檔案。
透過 86 個以上的專門處理機器人支援影片、音訊、影像與文件。

## 何時使用此技能 (When to Use This Skill)

當您需要執行以下操作時使用此技能：

- 將影片編碼為 HLS、MP4、WebM 或其他格式
- 從影片產生縮圖或動畫 GIF
- 調整影像大小、裁剪、增加浮水印或最佳化影像
- 在影像格式之間進行轉換（JPEG、PNG、WebP、AVIF、HEIF）
- 擷取音訊或進行音訊轉碼（MP3、AAC、FLAC、WAV）
- 串接影片或音訊剪輯
- 為影片增加字幕或重疊文字
- 對文件進行 OCR（PDF、掃描影像）
- 執行語音轉文字 (STT) 或文字轉語音 (TTS)
- 套用以 AI 為基礎的內容審核或物件偵測
- 建構串聯多個操作的多步驟媒體管線

## 設定 (Setup)

### 選項 A：MCP 伺服器（建議用於 Copilot） (Option A: MCP Server (recommended for Copilot))

將 Transloadit MCP 伺服器增加到您的 IDE 設定中。這讓代理程式能直接存取
Transloadit 工具（`create_template`、`create_assembly`、`list_assembly_notifications` 等）。

**VS Code / GitHub Copilot** (`.vscode/mcp.json` 或使用者設定)：

```json
{
  "servers": {
    "transloadit": {
      "command": "npx",
      "args": ["-y", "@transloadit/mcp-server", "stdio"],
      "env": {
        "TRANSLOADIT_KEY": "您的驗證金鑰",
        "TRANSLOADIT_SECRET": "您的驗證秘密"
      }
    }
  }
}
```

在 https://transloadit.com/c/-/api-credentials 獲取您的 API 認證

### 選項 B：CLI (Option B: CLI)

如果您偏好直接執行指令：

```bash
npx -y @transloadit/node assemblies create 
  --steps '{"encoded": {"robot": "/video/encode", "use": ":original", "preset": "hls-1080p"}}' 
  --wait 
  --input ./my-video.mp4
```

## 核心工作流 (Core Workflows)

### 將影片編碼為 HLS（自動調整串流） (Encode Video to HLS (Adaptive Streaming))

```json
{
  "steps": {
    "encoded": {
      "robot": "/video/encode",
      "use": ":original",
      "preset": "hls-1080p"
    }
  }
}
```

### 從影片產生縮圖 (Generate Thumbnails from Video)

```json
{
  "steps": {
    "thumbnails": {
      "robot": "/video/thumbs",
      "use": ":original",
      "count": 8,
      "width": 320,
      "height": 240
    }
  }
}
```

### 調整影像大小並增加浮水印 (Resize and Watermark Images)

```json
{
  "steps": {
    "resized": {
      "robot": "/image/resize",
      "use": ":original",
      "width": 1200,
      "height": 800,
      "resize_strategy": "fit"
    },
    "watermarked": {
      "robot": "/image/resize",
      "use": "resized",
      "watermark_url": "https://example.com/logo.png",
      "watermark_position": "bottom-right",
      "watermark_size": "15%"
    }
  }
}
```

### 對文件進行 OCR (OCR a Document)

```json
{
  "steps": {
    "recognized": {
      "robot": "/document/ocr",
      "use": ":original",
      "provider": "aws",
      "format": "text"
    }
  }
}
```

### 串接音訊剪輯 (Concatenate Audio Clips)

```json
{
  "steps": {
    "imported": {
      "robot": "/http/import",
      "url": ["https://example.com/clip1.mp3", "https://example.com/clip2.mp3"]
    },
    "concatenated": {
      "robot": "/audio/concat",
      "use": "imported",
      "preset": "mp3"
    }
  }
}
```

## 多步驟管線 (Multi-Step Pipelines)

步驟可以使用 `"use"` 欄位串聯起來。每個步驟參考前一個步驟的輸出：

```json
{
  "steps": {
    "resized": {
      "robot": "/image/resize",
      "use": ":original",
      "width": 1920
    },
    "optimized": {
      "robot": "/image/optimize",
      "use": "resized"
    },
    "exported": {
      "robot": "/s3/store",
      "use": "optimized",
      "bucket": "my-bucket",
      "path": "processed/${file.name}"
    }
  }
}
```

## 關鍵概念 (Key Concepts)

- **組件 (Assembly)**：單個處理任務。透過 `create_assembly` (MCP) 或 `assemblies create` (CLI) 建立。
- **範本 (Template)**：儲存在 Transloadit 上的可重用步驟集。透過 `create_template` (MCP) 或 `templates create` (CLI) 建立。
- **機器人 (Robot)**：一個處理單元（例如：`/video/encode`、`/image/resize`）。完整的清單請見 https://transloadit.com/docs/transcoding/
- **步驟 (Steps)**：定義管線的 JSON 物件。每個鍵值是一個步驟名稱，每個值配置一個機器人。
- **`:original`**：參考上傳的原始輸入檔案。

## 技巧 (Tips)

- 在 CLI 中使用 `--wait` 以阻塞執行直到處理完成。
- 使用 `preset` 值（例如：`"hls-1080p"`、`"mp3"`、`"webp"`）來針對常用格式，而非指定每個參數。
- 串聯 `"use": "step_name"` 以建構無須中介下載的多步驟管線。
- 進行批次處理時，使用 `/http/import` 從 URL、S3、GCS、Azure、FTP 或 Dropbox 擷取檔案。
- 範本可以包含 `${variables}`，用於在建立組件時傳遞動態值。
