---
name: nano-banana-pro-openrouter
description: '透過 OpenRouter 使用 Gemini 3 Pro Image 模型產生或編輯影像。用於純提示詞影像產生、影像編輯和多影像合成；支援 1K/2K/4K 輸出。'
metadata:
  emoji: 🍌
  requires:
    bins:
      - uv
    env:
      - OPENROUTER_API_KEY
  primaryEnv: OPENROUTER_API_KEY
---


# Nano Banana Pro OpenRouter

## 概觀

透過 OpenRouter 使用 `google/gemini-3-pro-image-preview` 模型產生或編輯影像。支援純提示詞產生、單一影像編輯和多影像合成。

### 純提示詞產生

```
uv run {baseDir}/scripts/generate_image.py 
  --prompt "白雪皚皚的山脈上空的電影感日落" 
  --filename sunset.png
```

### 編輯單一影像

```
uv run {baseDir}/scripts/generate_image.py 
  --prompt "將天空替換為戲劇性的極光" 
  --input-image input.jpg 
  --filename aurora.png
```

### 合成多張影像

```
uv run {baseDir}/scripts/generate_image.py 
  --prompt "將主體結合成一張單獨的攝影棚肖像" 
  --input-image face1.jpg 
  --input-image face2.jpg 
  --filename composite.png
```

## 解析度

- 使用 `--resolution` 搭配 `1K`、`2K` 或 `4K`。
- 如果未指定，預設值為 `1K`。

## 系統提示詞自訂

此技能會從 `assets/SYSTEM_TEMPLATE` 讀取選用的系統提示詞。這讓您無需修改程式碼即可自訂影像產生行為。

## 行為與約束

- 透過重複的 `--input-image` 接受最多 3 張輸入影像。
- `--filename` 接受相對路徑（儲存到目前目錄）或絕對路徑。
- 如果傳回多張影像，請在檔案名稱後附加 `-1`、`-2` 等。
- 為每個儲存的影像列印 `MEDIA: <路徑>`。不要將影像讀回回應中。

## 疑難排解

如果指令碼以非零狀態結束，請檢查 stderr 是否有這些常見的阻礙因素：

| 症狀 | 解決方案 |
|---------|------------|
| `OPENROUTER_API_KEY is not set` | 請使用者設定。PowerShell: `$env:OPENROUTER_API_KEY = "sk-or-..."` / bash: `export OPENROUTER_API_KEY="sk-or-..."` |
| `uv: command not found` 或無法辨識 | macOS/Linux: <code>curl -LsSf https://astral.sh/uv/install.sh &#124; sh</code>。Windows: <code>powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 &#124; iex"</code>。然後重新啟動終端機。 |
| `AuthenticationError` / HTTP 401 | 金鑰無效或無額度。請在 <https://openrouter.ai/settings/keys> 驗證。 |

對於暫時性錯誤（HTTP 429、網路逾時），請在 30 秒後重試一次。同一個錯誤重試次數不要超過兩次 — 改為向使用者反映問題。
