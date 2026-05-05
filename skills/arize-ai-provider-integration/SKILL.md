---
name: arize-ai-provider-integration
description: "當建立、讀取、更新或刪除 Arize AI 整合 (integrations) 時，請叫用此技能。涵蓋列出整合、為任何支援的 LLM 提供者（OpenAI, Anthropic, Azure OpenAI, AWS Bedrock, Vertex AI, Gemini, NVIDIA NIM, 自訂）建立整合、更新認證或 Metadata，以及使用 ax CLI 刪除整合。"
---

# Arize AI 整合技能 (Arize AI Integration Skill)

> **`SPACE`** — 大多數 `--space` 旗標與 `ARIZE_SPACE` 環境變數接受空間 **名稱**（例如 `my-workspace`）或 base64 空間 **ID**（例如 `U3BhY2U6...`）。請使用 `ax spaces list` 查找您的資訊。
> **附註：** `ai-integrations create` **不** 接受 `--space` — AI 整合是帳戶範圍 (account-scoped) 的。僅在執行 `list`、`get`、`update` 與 `delete` 時使用 `--space`。

## 概念 (Concepts)

- **AI 整合 (AI Integration)** = 註冊在 Arize 中儲存的 LLM 提供者認證；供評估者 (evaluators) 用於呼叫評審模型，以及其他需要代表您呼叫 LLM 的 Arize 功能使用。
- **提供者 (Provider)** = 支援該整合的 LLM 服務（例如 `openAI`, `anthropic`, `awsBedrock`）。
- **整合 ID (Integration ID)** = 整合的 base64 編碼全域識別碼（例如 `TGxtSW50ZWdyYXRpb246MTI6YUJjRA==`）；建立評估者及其他下游操作時需要。
- **範圍限定 (Scoping)** = 控制哪些空間或使用者可以使用整合的可見性規則。
- **認證類型 (Auth type)** = Arize 與提供者進行驗證的方式：`default`（提供者 API 金鑰）、`proxy_with_headers`（透過自訂標頭進行代理）或 `bearer_token`（Bearer Token 驗證）。

## 先決條件 (Prerequisites)

直接進行任務 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔 (profiles)。

如果 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前設定檔。如果缺少設定檔或 API 金鑰錯誤，請遵循 references/ax-profiles.md 建立/更新。如果使用者沒有其金鑰，請引導他們前往 https://app.arize.com/admin > API Keys
- 空間 (Space) 未知 → 執行 `ax spaces list` 以按名稱選取，或詢問使用者
- LLM 提供者呼叫失敗（缺少 OPENAI_API_KEY / ANTHROPIC_API_KEY） → 執行 `ax ai-integrations list --space SPACE` 以檢查平台管理的認證。如果皆不存在，請要求使用者提供金鑰，或透過 **arize-ai-provider-integration** 技能建立整合。
- **安全性：** 絕不讀取 `.env` 檔案或在檔案系統中搜尋認證。使用 `ax profiles` 獲取 Arize 認證，使用 `ax ai-integrations` 獲取 LLM 提供者金鑰。如果無法透過這些管道取得認證，請詢問使用者。

---

## 列出 AI 整合 (List AI Integrations)

列出某個空間中可存取的所有整合：

```bash
ax ai-integrations list --space SPACE
```

按名稱篩選（不區分大小寫的子字串比對）：

```bash
ax ai-integrations list --space SPACE --name "openai"
```

對大型結果集進行分頁：

```bash
# 取得第一頁
ax ai-integrations list --space SPACE --limit 20 -o json

# 使用前一次回應中的游標 (cursor) 取得下一頁
ax ai-integrations list --space SPACE --limit 20 --cursor CURSOR_TOKEN -o json
```

**關鍵旗標：**

| 旗標 | 描述 |
|------|-------------|
| `--space` | 用於篩選整合的空間名稱或 ID |
| `--name` | 對整合名稱進行不區分大小寫的子字串篩選 |
| `--limit` | 最大結果數（1–100，預設為 15） |
| `--cursor` | 來自前一次回應的分頁權杖 (token) |
| `-o, --output` | 輸出格式：`table`（預設）或 `json` |

**回應欄位：**

| 欄位 | 描述 |
|-------|-------------|
| `id` | Base64 整合 ID — 複製此 ID 以用於下游指令 |
| `name` | 易於閱讀的名稱 |
| `provider` | LLM 提供者列舉（參見下方的支援提供者） |
| `has_api_key` | 如果認證已儲存則為 `true` |
| `model_names` | 允許的模型清單，若啟用所有模型則為 `null` |
| `enable_default_models` | 是否允許此提供者的預設模型 |
| `function_calling_enabled` | 是否啟用工具/函式呼叫 (tool/function calling) |
| `auth_type` | 驗證方法：`default`, `proxy_with_headers` 或 `bearer_token` |

---

## 取得特定整合 (Get a Specific Integration)

```bash
ax ai-integrations get NAME_OR_ID
ax ai-integrations get NAME_OR_ID -o json
ax ai-integrations get NAME_OR_ID --space SPACE   # 使用名稱而非 ID 時為必填
```

使用此指令來檢查整合的完整配置，或在建立後確認其 ID。

---

## 建立 AI 整合 (Create an AI Integration)

建立之前，請務必先列出整合 — 使用者可能已經有一個合適的整合：

```bash
ax ai-integrations list --space SPACE
```

如果沒有合適的整合，請建立一個。所需的旗標取決於提供者。

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

AWS Bedrock 使用基於 IAM 角色的驗證。請透過 `--provider-metadata` 提供 Arize 應採用的角色 ARN：

```bash
ax ai-integrations create \
  --name "My Bedrock Integration" \
  --provider awsBedrock \
  --provider-metadata '{"role_arn": "arn:aws:iam::123456789012:role/ArizeBedrockRole"}'
```

### Vertex AI

Vertex AI 使用 GCP 服務帳戶認證。請透過 `--provider-metadata` 提供 GCP 專案與區域：

```bash
ax ai-integrations create \
  --name "My Vertex AI Integration" \
  --provider vertexAI \
  --provider-metadata '{"project_id": "my-gcp-project", "location": "us-central1"}'
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

### 自訂 (OpenAI 相容端點) (Custom (OpenAI-compatible endpoint))

```bash
ax ai-integrations create \
  --name "My Custom Integration" \
  --provider custom \
  --base-url "https://my-llm-proxy.example.com/v1" \
  --api-key $CUSTOM_LLM_API_KEY
```

### 支援的提供者 (Supported Providers)

| 提供者 | 額外的必填旗標 |
|----------|---------------------|
| `openAI` | `--api-key <key>` |
| `anthropic` | `--api-key <key>` |
| `azureOpenAI` | `--api-key <key>`, `--base-url <azure-endpoint>` |
| `awsBedrock` | `--provider-metadata '{"role_arn": "<arn>"}'` |
| `vertexAI` | `--provider-metadata '{"project_id": "<gcp-project>", "location": "<region>"}'` |
| `gemini` | `--api-key <key>` |
| `nvidiaNim` | `--api-key <key>`, `--base-url <nim-endpoint>` |
| `custom` | `--base-url <endpoint>` |

### 適用於任何提供者的選填旗標 (Optional flags for any provider)

| 旗標 | 描述 |
|------|-------------|
| `--model-name` | 允許的模型名稱（多個請重複，例如 `--model-name gpt-4o --model-name gpt-4o-mini`）；省略則允許所有模型 |
| `--enable-default-models` | 啟用提供者的預設模型清單 |
| `--function-calling-enabled` | 啟用工具/函式呼叫支援 |
| `--auth-type` | 驗證類型：`default`, `proxy_with_headers` 或 `bearer_token` |
| `--headers` | 作為 JSON 物件或檔案路徑的自訂標頭（用於代理驗證） |
| `--provider-metadata` | 作為 JSON 物件或檔案路徑的提供者專用 Metadata |

### 建立後 (After creation)

擷取傳回的整合 ID（例如 `TGxtSW50ZWdyYXRpb246MTI6YUJjRA==`）— 下游指令與建立評估者時需要此 ID。如果您漏掉了，請檢索它：

```bash
ax ai-integrations list --space SPACE -o json
# 或直接透過名稱/ID：
ax ai-integrations get NAME_OR_ID
```

---

## 更新 AI 整合 (Update an AI Integration)

`update` 為部分更新 — 僅變更您提供的旗標。省略的欄位保持原樣。

```bash
# 重新命名
ax ai-integrations update NAME_OR_ID --name "New Name"

# 輪換 API 金鑰
ax ai-integrations update NAME_OR_ID --api-key $OPENAI_API_KEY

# 變更模型清單（替換所有現有模型名稱）
ax ai-integrations update NAME_OR_ID --model-name gpt-4o --model-name gpt-4o-mini

# 更新基礎 URL（用於 Azure, 自訂或 NIM）
ax ai-integrations update NAME_OR_ID --base-url "https://new-endpoint.example.com/v1"
```

使用名稱而非 ID 時，請加入 `--space SPACE`。任何 `create` 接受的旗標都可以傳遞給 `update`。

---

## 刪除 AI 整合 (Delete an AI Integration)

**警告：** 刪除是永久性的。引用此整合的評估者將無法再執行。

```bash
ax ai-integrations delete NAME_OR_ID --force
ax ai-integrations delete NAME_OR_ID --space SPACE --force   # 使用名稱而非 ID 時為必填
```

省略 `--force` 以顯示確認提示，而非立即刪除。

---

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰可能無權存取此空間。請在 https://app.arize.com/admin > API Keys 驗證金鑰與空間 ID |
| `No profile found` | 執行 `ax profiles show --expand`；設定 `ARIZE_API_KEY` 環境變數或撰寫 `~/.arize/config.toml` |
| `Integration not found` | 使用 `ax ai-integrations list --space SPACE` 驗證 |
| 建立後 `has_api_key: false` | 認證未儲存 — 使用正確的 `--api-key` 或 `--provider-metadata` 重新執行 `update` |
| 評估者執行失敗並出現 LLM 錯誤 | 使用 `ax ai-integrations get INT_ID` 檢查整合認證；視需要輪換 API 金鑰 |
| `provider` 不符 | 建立後無法變更提供者 — 請刪除並以正確的提供者重新建立 |

---

## 相關技能 (Related Skills)

- **arize-evaluator**：建立使用 AI 整合的 LLM-as-judge 評估者 → 使用 `arize-evaluator`
- **arize-experiment**：執行使用由 AI 整合支援的評估者的實驗 → 使用 `arize-experiment`

---

## 儲存認證供日後使用 (Save Credentials for Future Use)

參閱 references/ax-profiles.md § 儲存認證供日後使用。
