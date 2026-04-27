---
name: arize-ai-provider-integration
description: "當建立、讀取、更新或刪除 Arize AI 整合時呼叫此技能。涵蓋列出整合、為任何支援的 LLM 提供者 (OpenAI、Anthropic、Azure OpenAI、AWS Bedrock、Vertex AI、Gemini、NVIDIA NIM、自訂) 建立整合、更新認證資訊或中繼資料 (Metadata)，以及使用 ax CLI 刪除整合。"
---

# Arize AI 整合技能 (Arize AI Integration Skill)

## 概念

- **AI 整合 (AI Integration)** = 儲存在 Arize 中的 LLM 提供者認證資訊；評估器使用它來呼叫評判模型，其他需要代表您呼叫 LLM 的 Arize 功能也會使用它
- **提供者 (Provider)** = 支援整合的 LLM 服務 (例如：`openAI`, `anthropic`, `awsBedrock`)
- **整合 ID (Integration ID)** = 整合的全域識別碼，採 Base64 編碼 (例如：`TGxtSW50ZWdyYXRpb246MTI6YUJjRA==`)；建立評估器及執行其他下游操作時需要此 ID
- **範圍設定 (Scoping)** = 控制哪些空間或使用者可以使用整合的可見性規則
- **驗證類型 (Auth type)** = Arize 向提供者進行身分驗證的方式：`default` (提供者 API 金鑰)、`proxy_with_headers` (透過自訂標頭進行代理) 或 `bearer_token` (Bearer 權杖驗證)

## 先決條件

直接開始執行工作 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔。

若 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` (找不到指令) 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` (未經授權) / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前的設定檔。若缺少設定檔或 API 金鑰錯誤：檢查 `.env` 檔案中是否有 `ARIZE_API_KEY`，並使用它透過 references/ax-profiles.md 建立/更新設定檔。若 `.env` 中也沒有金鑰，請向使用者詢問其 Arize API 金鑰 (https://app.arize.com/admin > API Keys)
- 空間 ID (Space ID) 未知 → 檢查 `.env` 中的 `ARIZE_SPACE_ID`，或執行 `ax spaces list -o json`，或詢問使用者
- LLM 提供者呼叫失敗 (缺少 OPENAI_API_KEY / ANTHROPIC_API_KEY) → 檢查 `.env`，若存在則載入，否則詢問使用者

---

## 列出 AI 整合

列出空間中可存取的所有整合：

```bash
ax ai-integrations list --space-id SPACE_ID
```

按名稱過濾 (不區分大小寫的子字串比對)：

```bash
ax ai-integrations list --space-id SPACE_ID --name "openai"
```

對大型結果集進行分頁：

```bash
# 獲取第一頁
ax ai-integrations list --space-id SPACE_ID --limit 20 -o json

# 使用前一次回應中的游標 (Cursor) 獲取下一頁
ax ai-integrations list --space-id SPACE_ID --limit 20 --cursor CURSOR_TOKEN -o json
```

**關鍵旗標：**

| 旗標 | 說明 |
|------|-------------|
| `--space-id` | 要列出整合的空間 |
| `--name` | 對整合名稱進行不區分大小寫的子字串過濾 |
| `--limit` | 最大結果數 (1–100，預設為 50) |
| `--cursor` | 來自前一次回應的分頁權杖 |
| `-o, --output` | 輸出格式：`table` (預設) 或 `json` |

**回應欄位：**

| 欄位 | 說明 |
|-------|-------------|
| `id` | Base64 編碼的整合 ID — 複製此 ID 以供下游指令使用 |
| `name` | 易於閱讀的名稱 |
| `provider` | LLM 提供者列舉值 (見下方的「支援的提供者」) |
| `has_api_key` | 若已儲存認證資訊，則為 `true` |
| `model_names` | 允許的模型列表，若為 `null` 則啟用所有模型 |
| `enable_default_models` | 是否允許此提供者的預設模型列表 |
| `function_calling_enabled` | 是否啟用工具/函式呼叫支援 |
| `auth_type` | 身分驗證方法：`default`、`proxy_with_headers` 或 `bearer_token` |

---

## 獲取特定整合

```bash
ax ai-integrations get INT_ID
ax ai-integrations get INT_ID -o json
```

使用此指令檢查整合的完整組態，或在建立後確認其 ID。

---

## 建立 AI 整合

在建立之前，請務必先列出整合 — 使用者可能已經有一個適合的整合：

```bash
ax ai-integrations list --space-id SPACE_ID
```

若不存在適合的整合，請建立一個。所需的旗標取決於提供者。

### OpenAI

```bash
ax ai-integrations create \
  --name "My OpenAI Integration" \
  --provider openAI \
  --api-key $OPENAI_API_KEY
```

### Anthropic

```bash
ax ai-integrations create \
  --name "My Anthropic Integration" \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY
```

### Azure OpenAI

```bash
ax ai-integrations create \
  --name "My Azure OpenAI Integration" \
  --provider azureOpenAI \
  --api-key $AZURE_OPENAI_API_KEY \
  --base-url "https://my-resource.openai.azure.com/"
```

### AWS Bedrock

AWS Bedrock 使用基於 IAM 角色的驗證，而非 API 金鑰。請提供 Arize 應假設 (Assume) 的角色 ARN：

```bash
ax ai-integrations create \
  --name "My Bedrock Integration" \
  --provider awsBedrock \
  --role-arn "arn:aws:iam::123456789012:role/ArizeBedrockRole"
```

### Vertex AI

Vertex AI 使用 GCP 服務帳號認證資訊。請提供 GCP 專案與區域：

```bash
ax ai-integrations create \
  --name "My Vertex AI Integration" \
  --provider vertexAI \
  --project-id "my-gcp-project" \
  --location "us-central1"
```

### Gemini

```bash
ax ai-integrations create \
  --name "My Gemini Integration" \
  --provider gemini \
  --api-key $GEMINI_API_KEY
```

### NVIDIA NIM

```bash
ax ai-integrations create \
  --name "My NVIDIA NIM Integration" \
  --provider nvidiaNim \
  --api-key $NVIDIA_API_KEY \
  --base-url "https://integrate.api.nvidia.com/v1"
```

### 自訂 (相容於 OpenAI 的端點)

```bash
ax ai-integrations create \
  --name "My Custom Integration" \
  --provider custom \
  --base-url "https://my-llm-proxy.example.com/v1" \
  --api-key $CUSTOM_LLM_API_KEY
```

### 支援的提供者

| 提供者 | 必要的額外旗標 |
|----------|---------------------|
| `openAI` | `--api-key <key>` |
| `anthropic` | `--api-key <key>` |
| `azureOpenAI` | `--api-key <key>`, `--base-url <azure-endpoint>` |
| `awsBedrock` | `--role-arn <arn>` |
| `vertexAI` | `--project-id <gcp-project>`, `--location <region>` |
| `gemini` | `--api-key <key>` |
| `nvidiaNim` | `--api-key <key>`, `--base-url <nim-endpoint>` |
| `custom` | `--base-url <endpoint>` |

### 適用於任何提供者的選用旗標

| 旗標 | 說明 |
|------|-------------|
| `--model-names` | 以逗號分隔的允許模型名稱列表；省略則允許所有模型 |
| `--enable-default-models` / `--no-default-models` | 啟用或停用提供者的預設模型列表 |
| `--function-calling` / `--no-function-calling` | 啟用或停用工具/函式呼叫支援 |

### 建立後

擷取回傳的整合 ID (例如：`TGxtSW50ZWdyYXRpb246MTI6YUJjRA==`) — 建立評估器及執行其他下游指令時需要此 ID。若您遺失了該 ID，請重新獲取：

```bash
ax ai-integrations list --space-id SPACE_ID -o json
# 或者，若您已知 ID：
ax ai-integrations get INT_ID
```

---

## 更新 AI 整合

`update` 是部分更新 — 僅會變更您提供的旗標。省略的欄位將保持不變。

```bash
# 重新命名
ax ai-integrations update INT_ID --name "New Name"

# 輪替 API 金鑰
ax ai-integrations update INT_ID --api-key $OPENAI_API_KEY

# 變更模型列表
ax ai-integrations update INT_ID --model-names "gpt-4o,gpt-4o-mini"

# 更新基準 URL (適用於 Azure、自訂或 NIM)
ax ai-integrations update INT_ID --base-url "https://new-endpoint.example.com/v1"
```

`create` 所接受的任何旗標都可以傳遞給 `update`。

---

## 刪除 AI 整合

**警告：** 刪除是永久性的。引用此整合的評估器將無法再執行。

```bash
ax ai-integrations delete INT_ID --force
```

省略 `--force` 可獲得確認提示，而非立即刪除。

---

## 疑難排解

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰可能無權存取此空間。請至 https://app.arize.com/admin > API Keys 驗證金鑰與空間 ID |
| `No profile found` | 執行 `ax profiles show --expand`；設定 `ARIZE_API_KEY` 環境變數或編寫 `~/.arize/config.toml` |
| `Integration not found` | 使用 `ax ai-integrations list --space-id SPACE_ID` 進行核實 |
| 建立後 `has_api_key: false` | 認證資訊未儲存 — 請使用正確的 `--api-key` 或 `--role-arn` 重新執行 `update` |
| 評估器執行失敗並出現 LLM 錯誤 | 使用 `ax ai-integrations get INT_ID` 檢查整合認證資訊；如有需要請輪替 API 金鑰 |
| `provider` 不符 | 建立後無法更改提供者 — 請刪除並使用正確的提供者重新建立 |

---

## 相關技能

- **arize-evaluator**：建立使用 AI 整合的「LLM 作為評判 (LLM-as-judge)」評估器 → 使用 `arize-evaluator`
- **arize-experiment**：執行使用由 AI 整合支援之評估器的實驗 → 使用 `arize-experiment`

---

## 儲存認證資訊供未來使用

參閱 references/ax-profiles.md § 儲存認證資訊供未來使用。
