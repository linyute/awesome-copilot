---
name: arize-instrumentation
description: '首次將 Arize AX 追蹤新增至 LLM 應用程式。遵循兩個階段的代理程式輔助流程來分析程式碼庫，然後在使用者確認後實作檢測。當使用者想要檢測他們的應用程式、從頭開始新增追蹤、設定 LLM 觀測能力、整合 OpenTelemetry 或 openinference，或開始使用 Arize 追蹤時使用。'
metadata:
  author: arize
  version: "1.0"
compatibility: Python 和 TypeScript/JavaScript 應用程式使用 openinference-instrumentation 套件進行自動檢測。Java 和 Go 應用程式使用具有手動 OpenInference span 的 OpenTelemetry SDK。有關設定詳細資訊，請參閱 https://arize.com/docs/PROMPT.md。
---

# Arize 檢測技能

當使用者想要將 **Arize AX 追蹤** 新增至其應用程式時，請使用此技能。遵循來自 [代理程式輔助追蹤設定](https://arize.com/docs/ax/alyx/tracing-assistant) 和 [Arize AX 追蹤 — 代理程式設定提示](https://arize.com/docs/PROMPT.md) 的 **兩個階段、代理程式輔助流程**。

## 快速開始（針對使用者）

如果使用者要求您「設定追蹤」或「使用 Arize 檢測我的應用程式」，您可以從以下內容開始：

> 請遵循來自 https://arize.com/docs/PROMPT.md 的指令，並根據需要向我提問。

然後執行下面的兩個階段。

## 核心原則

- **優先檢查而非變更** — 在變更之前了解程式碼庫。
- **不要變更商業邏輯** — 追蹤純粹是附加的。
- **在可用時使用自動檢測** — 僅針對整合未涵蓋的自定義邏輯新增手動 span。
- **遵循現有的程式碼樣式** 和專案慣例。
- **保持輸出簡潔且專注於生產** — 不要產生額外的文件或摘要檔案。
- **切勿在產生的程式碼中嵌入文字認證值** — 始終引用環境變數（例如，`os.environ["ARIZE_API_KEY"]`、`process.env.ARIZE_API_KEY`）。這包括 API 金鑰、空間 ID 和任何其他秘密資訊。使用者在自己的環境中設定這些資訊；代理程式絕不能輸出原始秘密值。

## 階段 0：環境預檢

在變更程式碼之前：

1. 確認存放庫/服務範圍明確。對於單一存放庫 (monorepo)，不要假設應該檢測整個存放庫。
2. 識別您將需要用於驗證的本機執行階段表面：
   - 套件管理員和應用程式啟動命令
   - 應用程式是長期執行的、基於伺服器的，還是短期執行的 CLI/指令碼
   - 是否需要 `ax` 進行變更後驗證
3. 不要主動檢查 `ax` 安裝或版本。如果稍後需要 `ax` 進行驗證，只需在時機成熟時執行即可。如果失敗，請參閱 references/ax-profiles.md。
4. 切勿默默地取代使用者提供的空間 ID、專案名稱或專案 ID。如果 CLI、收集器和使用者輸入不一致，請將該不匹配視為具體的阻礙因素並浮現出來。

## 階段 1：分析（唯讀）

**在此階段不要編寫任何程式碼或建立任何檔案。**

### 步驟

1. **檢查相依性資訊清單** 以偵測技術堆疊：
   - Python：`pyproject.toml`、`requirements.txt`、`setup.py`、`Pipfile`
   - TypeScript/JavaScript：`package.json`
   - Java：`pom.xml`、`build.gradle`、`build.gradle.kts`
   - Go：`go.mod`

2. **掃描來源檔案中的匯入陳述式** 以確認實際使用了什麼。

3. **檢查現有的追蹤/OTel** — 尋找 `TracerProvider`、`register()`、`opentelemetry` 匯入、`ARIZE_*`、`OTEL_*`、`OTLP_*` 環境變數或其他觀測能力設定（Datadog、Honeycomb 等）。

4. **識別範圍** — 對於單一存放庫或多服務專案，詢問要檢測哪些服務。

### 要識別的內容

| 項目 | 範例 |
|------|----------|
| 語言 | Python、TypeScript/JavaScript、Java、Go |
| 套件管理員 | pip/poetry/uv、npm/pnpm/yarn、maven/gradle、go modules |
| LLM 提供者 | OpenAI、Anthropic、LiteLLM、Bedrock 等 |
| 框架 | LangChain、LangGraph、LlamaIndex、Vercel AI SDK、Mastra 等 |
| 現有追蹤 | 任何 OTel 或供應商設定 |
| 工具/函式使用 | LLM 工具使用、函式呼叫，或應用程式執行的自定義工具（例如在代理程式迴圈中） |

**關鍵規則：** 當偵測到框架與 LLM 提供者並存時，請先檢查特定於框架的追蹤文件，並在框架原生整合已擷取您所需的模型和工具 span 時優先選擇該路徑。僅在框架文件要求時，或在框架原生整合留下明顯落差時，才新增單獨的提供者檢測。如果應用程式執行工具且框架整合未發出工具 span，請新增手動 TOOL span，以便每次呼叫都連同輸入/輸出一起顯示（避免稀疏追蹤，請參閱下文的 **豐富追蹤**）。

### 階段 1 輸出

傳回簡潔的摘要：

- 偵測到的語言、套件管理員、提供者、框架
- 建議的整合列表（來自文件中的路由表）
- 任何需要考慮的現有 OTel/追蹤
- 如果是單一存放庫：您建議檢測哪些服務
- **如果應用程式使用 LLM 工具使用 / 函式呼叫：** 註明您將新增手動 CHAIN + TOOL span，以便每個工具呼叫都連同輸入/輸出一起顯示在追蹤中（避免稀疏追蹤）。

如果使用者明確要求您現在檢測應用程式，且目標服務已經明確，請簡要呈現階段 1 摘要並直接繼續階段 2。如果範圍模糊，或使用者要求先進行分析，請停止並等待確認。

## 整合路由和文件

支援整合和文件 URL 的 **標準列表** 位於 [代理程式設定提示](https://arize.com/docs/PROMPT.md)。使用它將偵測到的訊號對應到實作文件。

- **LLM 提供者：** [OpenAI](https://arize.com/docs/ax/integrations/llm-providers/openai), [Anthropic](https://arize.com/docs/ax/integrations/llm-providers/anthropic), [LiteLLM](https://arize.com/docs/ax/integrations/llm-providers/litellm), [Google Gen AI](https://arize.com/docs/ax/integrations/llm-providers/google-gen-ai), [Bedrock](https://arize.com/docs/ax/integrations/llm-providers/amazon-bedrock), [Ollama](https://arize.com/docs/ax/integrations/llm-providers/llama), [Groq](https://arize.com/docs/ax/integrations/llm-providers/groq), [MistralAI](https://arize.com/docs/ax/integrations/llm-providers/mistralai), [OpenRouter](https://arize.com/docs/ax/integrations/llm-providers/openrouter), [VertexAI](https://arize.com/docs/ax/integrations/llm-providers/vertexai)。
- **Python 框架：** [LangChain](https://arize.com/docs/ax/integrations/python-agent-frameworks/langchain), [LangGraph](https://arize.com/docs/ax/integrations/python-agent-frameworks/langgraph), [LlamaIndex](https://arize.com/docs/ax/integrations/python-agent-frameworks/llamaindex), [CrewAI](https://arize.com/docs/ax/integrations/python-agent-frameworks/crewai), [DSPy](https://arize.com/docs/ax/integrations/python-agent-frameworks/dspy), [AutoGen](https://arize.com/docs/ax/integrations/python-agent-frameworks/autogen), [Semantic Kernel](https://arize.com/docs/ax/integrations/python-agent-frameworks/semantic-kernel), [Pydantic AI](https://arize.com/docs/ax/integrations/python-agent-frameworks/pydantic), [Haystack](https://arize.com/docs/ax/integrations/python-agent-frameworks/haystack), [Guardrails AI](https://arize.com/docs/ax/integrations/python-agent-frameworks/guardrails-ai), [Hugging Face Smolagents](https://arize.com/docs/ax/integrations/python-agent-frameworks/hugging-face-smolagents), [Instructor](https://arize.com/docs/ax/integrations/python-agent-frameworks/instructor), [Agno](https://arize.com/docs/ax/integrations/python-agent-frameworks/agno), [Google ADK](https://arize.com/docs/ax/integrations/python-agent-frameworks/google-adk), [MCP](https://arize.com/docs/ax/integrations/python-agent-frameworks/model-context-protocol), [Portkey](https://arize.com/docs/ax/integrations/python-agent-frameworks/portkey), [Together AI](https://arize.com/docs/ax/integrations/python-agent-frameworks/together-ai), [BeeAI](https://arize.com/docs/ax/integrations/python-agent-frameworks/beeai), [AWS Bedrock Agents](https://arize.com/docs/ax/integrations/python-agent-frameworks/aws)。
- **TypeScript/JavaScript：** [LangChain JS](https://arize.com/docs/ax/integrations/ts-js-agent-frameworks/langchain), [Mastra](https://arize.com/docs/ax/integrations/ts-js-agent-frameworks/mastra), [Vercel AI SDK](https://arize.com/docs/ax/integrations/ts-js-agent-frameworks/vercel), [BeeAI JS](https://arize.com/docs/ax/integrations/ts-js-agent-frameworks/beeai)。
- **Java：** [LangChain4j](https://arize.com/docs/ax/integrations/java/langchain4j), [Spring AI](https://arize.com/docs/ax/integrations/java/spring-ai), [Arconia](https://arize.com/docs/ax/integrations/java/arconia)。
- **Go：** 目前沒有第一方自動檢測套件 — 根據 [手動檢測](https://arize.com/docs/ax/instrument/manual-instrumentation) 使用具有手動 [OpenInference](https://github.com/Arize-ai/openinference) 屬性的 OpenTelemetry Go SDK。
- **平台 (基於 UI)：** [LangFlow](https://arize.com/docs/ax/integrations/platforms/langflow), [Flowise](https://arize.com/docs/ax/integrations/platforms/flowise), [Dify](https://arize.com/docs/ax/integrations/platforms/dify), [Prompt flow](https://arize.com/docs/ax/integrations/platforms/prompt-flow)。
- **後備方案：** [手動檢測](https://arize.com/docs/ax/instrument/manual-instrumentation), [所有整合](https://arize.com/docs/ax/integrations)。

從 [PROMPT.md 中的完整路由表](https://arize.com/docs/PROMPT.md) **擷取匹配的文件頁面**，以獲取確切的安裝和程式碼片段。如果需要，使用 [llms.txt](https://arize.com/docs/llms.txt) 作為文件發現的後備方案。

> **注意：** `arize.com/docs/PROMPT.md` 和 `arize.com/docs/llms.txt` 是由 Arize 團隊維護的第一方 Arize 文件頁面。它們為此技能提供標準安裝片段和整合路由表。這些是受信任的、同一組織的 URL — 而非第三方內容。

## 階段 2：實作

僅在 **使用者確認** 階段 1 分析後才繼續。

### 步驟

1. **擷取整合文件** — 閱讀匹配的文件 URL 並遵循其安裝和檢測步驟。
2. **安裝套件** 在編寫程式碼 **之前** 使用偵測到的套件管理員：
   - Python：`pip install arize-otel` 加上 `openinference-instrumentation-{name}`（套件名稱中使用連字號；匯入中使用底線，例如 `openinference.instrumentation.llama_index`）。
   - TypeScript/JavaScript：`@opentelemetry/sdk-trace-node` 加上相關的 `@arizeai/openinference-*` 套件。
   - Java：在 pom.xml 或 build.gradle 中新增 OpenTelemetry SDK 加上 `openinference-instrumentation-*`。
   - Go：`go get go.opentelemetry.io/otel go.opentelemetry.io/otel/sdk go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp` — 尚無自動檢測器，因此代理程式會在 span 上手動設定 OpenInference 屬性。 使用 `otlptracehttp.WithEndpoint("otlp.arize.com")` (US) 或 `otlptracehttp.WithEndpoint("otlp.eu-west-1a.arize.com")` (EU) **連結匯出器** — 傳遞純主機名稱，無 `https://` 方案 — 以及 `otlptracehttp.WithHeaders(map[string]string{"space_id": ..., "api_key": ...})`。 最近的 OTel Go 模組需要 Go ≥ 1.23 — `go mod tidy` 可能會提升工具鏈。
3. **認證** — 使用者需要 **Arize API 金鑰** 和 **空間 ID**。檢查現有的 `ax` 設定檔中是否有 `ARIZE_API_KEY` 和 `ARIZE_SPACE` — 切勿讀取 `.env` 檔案：
   - 執行 `ax profiles show` 以檢查是否存在設定檔。
   - 如果不存在設定檔，請引導使用者執行 `ax profiles create`，這將提供一個 **互動式精靈**，引導完成 API 金鑰和空間設定。有關詳細資訊，請參閱 [CLI 設定檔文件](https://arize.com/docs/api-clients/cli/profiles)。
   - 如果使用者需要手動尋找其 API 金鑰，請引導他們前往 **https://app.arize.com** 並導航至設定頁面（不要使用帶有佔位符 ID 的特定組織 URL — 它們將無法為新使用者解析）。
   - 如果未設定認證，請指示使用者將其設定為環境變數 — 切勿在產生的程式碼中嵌入原始值。所有產生的檢測程式碼都必須引用 `os.environ["ARIZE_API_KEY"]` (Python)、`process.env.ARIZE_API_KEY` (TypeScript/JavaScript) 或 `os.Getenv("ARIZE_API_KEY")` (Go)。
   - 有關完整的設定檔設定和疑難排解，請參閱 references/ax-profiles.md。
4. **集中式檢測** — 建立單一模組（例如 `instrumentation.py`、`instrumentation.ts`、`instrumentation.go`）並在建立任何 LLM 用戶端 **之前** 初始化追蹤。
5. **現有 OTel** — 如果已經有 TracerProvider，請將 Arize 新增為 **額外** 的匯出器（例如具有 Arize OTLP 的 BatchSpanProcessor）。除非使用者要求，否則不要取代現有的設定。

### 實作規則

- **優先使用自動檢測**；僅在需要時使用手動 span。
- 在新增通用的 OpenTelemetry 管道之前，優先使用存放庫的原生整合表面。如果框架隨附匯出器或觀測能力套件，除非存在記錄在案的落差，否則請先使用該套件。
- **優雅地失敗** 如果缺少環境變數（警告，不要當機）。
- **匯入順序：** 註冊 tracer → 附加檢測器 → 然後建立 LLM 用戶端。
- **專案名稱屬性（必填）：** 如果缺少專案名稱，Arize 會以 HTTP 500 拒絕 span — 僅有 `service.name` 是不被接受的。將其設定為 TracerProvider 上的 **資源屬性**（推薦 — 一處設定，適用於所有 span）：
  - **Python：** `register(project_name="my-app")` 會自動處理（在資源上設定 `"openinference.project.name"`）。對於將 span 路由到不同專案，請使用來自 `arize.otel` 的 `set_routing_context(space_id=..., project_name=...)`。
  - **TypeScript：** Arize 接受透過來自 `@arizeai/openinference-semantic-conventions` 的 `SEMRESATTRS_PROJECT_NAME` 設定的 `"model_id"`（顯示在官方 TS 快速開始中）和 `"openinference.project.name"`（顯示在手動檢測文件中） — 兩者皆可。
  - **Go：** 將 `attribute.String("openinference.project.name", "my-app")` 傳遞給 `resource.New(...)` 並透過 `sdktrace.WithResource(res)` 套用。Go SDK 沒有對此的協助工具，因此必須在每個 TracerProvider 上手動設定。
- **CLI/指令碼應用程式 — 結束前排空：** 在程序結束前必須呼叫 `provider.shutdown()` (TS) / `provider.force_flush()` 然後 `provider.shutdown()` (Python) / `tp.Shutdown(ctx)` (Go)，否則非同步 OTLP 匯出會被捨棄，且不會顯示任何追蹤。
- **當應用程式具有工具/函式執行時：** 新增手動 CHAIN + TOOL span（參見下文的 **豐富追蹤**），以便追蹤樹顯示每個工具呼叫及其結果 — 否則追蹤看起來會很稀疏（只有 LLM API span，沒有工具輸入/輸出）。

## 豐富追蹤：用於工具使用和代理程式迴圈的手動 span

### 為什麼自動檢測器不這樣做？

**提供者檢測器（Anthropic、OpenAI 等）僅包裝 LLM *用戶端* — 即發送 HTTP 請求並接收回應的程式碼。** 它們看到：

- 每次 API 呼叫一個 span：請求（訊息、系統提示、工具）和回應（文字、tool_use 區塊等）。

它們 **無法** 看到回應後在 *您的應用程式內部* 發生的情況：

- **工具執行** — 您的程式碼解析回應，呼叫 `run_tool("check_loan_eligibility", {...})` 並獲得結果。這在您的程序中執行；檢測器沒有勾點進入您的 `run_tool()` 或實際的工具輸出。 下一次 API 呼叫（將工具結果傳回）只是另一個 `messages.create` span — 檢測器不知道訊息內容是工具結果，也不知道工具傳回了什麼。
- **代理程式/鏈邊界** — 「一次使用者輪次 → 多次 LLM 呼叫 + 工具呼叫」的想法是一個 *應用程式級別* 的概念。檢測器只看到個別的 API 呼叫；它不知道它們屬於同一個邏輯「run_agent」執行。

因此，TOOL 和 CHAIN span 必須 **手動** 新增（或由了解工具和鏈的 *框架* 檢測器（如 LangChain/LangGraph）新增）。一旦您新增了它們，它們就會與 LLM span 出現在同一個追蹤中，因為它們使用同一個 TracerProvider。

---

為避免缺少工具輸入/輸出的稀疏追蹤：

1. **偵測** 代理程式/工具模式：一個呼叫 LLM，然後執行一個或多個工具（依名稱 + 引數），然後再次使用工具結果呼叫 LLM 的迴圈。
2. **新增手動 span** 使用相同的 TracerProvider（例如在 `register()` 之後使用 `opentelemetry.trace.get_tracer(...)`）：
   - **CHAIN span** — 包裝完整的代理程式執行（例如 `run_agent`）：設定 `openinference.span.kind` = `"CHAIN"`，`input.value` = 使用者訊息，`output.value` = 最終回覆。
   - **TOOL span** — 包裝每次工具呼叫：設定 `openinference.span.kind` = `"TOOL"`，`input.value` = 引數的 JSON，`output.value` = 結果的 JSON。使用工具名稱作為 span 名稱（例如 `check_loan_eligibility`）。

**OpenInference 屬性（使用這些以便 Arize 正確顯示 span）：**

| 屬性 | 用途 |
|-----------|-----|
| `openinference.span.kind` | 選擇正確的值：`"LLM"` 用於原始提供者 API 呼叫（OpenAI、Anthropic 等）；`"CHAIN"` 用於協調 / 代理程式迴圈邊界；`"TOOL"` 用於工具/函式執行；`"RETRIEVER"` 用於向量儲存 / 搜尋查找；`"EMBEDDING"` 用於嵌入 API 呼叫；`"AGENT"` 用於巢狀在較大鏈內部的自主子代理程式執行；`"RERANKER"` 用於重新排名 API 呼叫；`"GUARDRAIL"` 用於護欄/政策檢查；`"EVALUATOR"` 用於線上評估呼叫。 |
| `input.value` | 字串（例如使用者訊息或工具引數的 JSON） |
| `output.value` | 字串（例如最終回覆或工具結果的 JSON） |

**LLM-span 屬性（當 span 是實際的 LLM 呼叫時，除了上述三個屬性外還要設定這些）：**

| 屬性 | 用途 |
|-----------|-----|
| `llm.model_name` | 模型識別碼（例如 `"gpt-4o-mini"`） |
| `llm.provider` / `llm.system` | 提供者名稱（例如 `"openai"`、`"anthropic"`） |
| `llm.input_messages.{i}.message.role` | 第 i 個輸入訊息的 `"system"` / `"user"` / `"assistant"` / `"tool"` |
| `llm.input_messages.{i}.message.content` | 第 i 個輸入訊息的文字內容 |
| `llm.output_messages.{i}.message.role` | 輸出訊息的角色 |
| `llm.output_messages.{i}.message.content` | 輸出訊息的文字內容 |
| `llm.token_count.prompt` | int — 提示/輸入 token |
| `llm.token_count.completion` | int — 完成/輸出 token |
| `llm.token_count.total` | int — 總計 token |

在 Python 和 TypeScript 中，這些名稱透過 `openinference-semantic-conventions` 套件公開；在 Go 中，它們必須手動輸入為上述字串。

**Python 模式：** 取得全域 tracer（與 Arize 相同的提供者），然後使用上下文管理員，以便工具 span 是 CHAIN span 的子項，並與 LLM span 出現在同一個追蹤中：

```python
from opentelemetry.trace import get_tracer

tracer = get_tracer("my-app", "1.0.0")

# 在您的代理程式進入點中：
with tracer.start_as_current_span("run_agent") as chain_span:
    chain_span.set_attribute("openinference.span.kind", "CHAIN")
    chain_span.set_attribute("input.value", user_message)
    # ... LLM 呼叫 ...
    for tool_use in tool_uses:
        with tracer.start_as_current_span(tool_use["name"]) as tool_span:
            tool_span.set_attribute("openinference.span.kind", "TOOL")
            tool_span.set_attribute("input.value", json.dumps(tool_use["input"]))
            result = run_tool(tool_use["name"], tool_use["input"])
            tool_span.set_attribute("output.value", result)
        # ... 將工具結果附加到訊息，再次呼叫 LLM ...
    chain_span.set_attribute("output.value", final_reply)
```

**Go 模式：** 從全域 TracerProvider（透過 `otel.SetTracerProvider` 註冊）取得一個 tracer，然後使用 `tracer.Start` 巢狀 span，以便工具 span 成為 CHAIN span 的子項。

> **對於短期執行的程序至關重要：** span 啟動後切勿呼叫 `log.Fatalf` / `os.Exit` — 它們會跳過延遲的 `tp.Shutdown(ctx)`，且進行中的 CHAIN/LLM span 永遠不會排空。改為在 `main` 中使用 `log.Printf` + `return`，並將 `tp.Shutdown(ctx)` 延遲放在 `main` 的頂部。

```go
import (
    "context"
    "encoding/json"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
)

var tracer = otel.Tracer("my-app")

func runAgent(ctx context.Context, userMessage string) string {
    ctx, chainSpan := tracer.Start(ctx, "run_agent")
    defer chainSpan.End()
    chainSpan.SetAttributes(
        attribute.String("openinference.span.kind", "CHAIN"),
        attribute.String("input.value", userMessage),
    )

    // ... LLM 呼叫 ...
    for _, toolUse := range toolUses {
        ctx, toolSpan := tracer.Start(ctx, toolUse.Name)
        argsJSON, err := json.Marshal(toolUse.Input)
        if err != nil {
            toolSpan.RecordError(err)
        }
        toolSpan.SetAttributes(
            attribute.String("openinference.span.kind", "TOOL"),
            attribute.String("input.value", string(argsJSON)),
        )
        result := runTool(toolUse.Name, toolUse.Input)
        toolSpan.SetAttributes(attribute.String("output.value", result))
        toolSpan.End()
        // ... 將工具結果附加到訊息，再次呼叫 LLM ...
    }

    chainSpan.SetAttributes(attribute.String("output.value", finalReply))
    return finalReply
}
```

有關更多 span 種類和屬性，請參閱 [手動檢測](https://arize.com/docs/ax/instrument/manual-instrumentation)。

## 驗證

僅當以下所有條件皆成立時，才將檢測視為完成：

1. 應用程式在追蹤變更後仍可建構或進行型別檢查。
2. 應用程式使用新的追蹤設定成功啟動。
3. 您觸發了至少一個應該產生 span 的實際請求或執行。
4. 您或是在 Arize 中驗證了產生的追蹤，或是提供了一個精確的阻礙因素，區分應用程式端的成功與 Arize 端的失敗。

實作後：

1. 執行應用程式並觸發至少一次 LLM 呼叫。
2. **使用 `arize-trace` 技能** 確認追蹤已到達。如果為空，請稍後重試。驗證 span 是否具有預期的 `openinference.span.kind`、`input.value`/`output.value` 和父子關係。
3. 如果沒有追蹤：驗證 `ARIZE_SPACE` 和 `ARIZE_API_KEY`，確保 tracer 在檢測器和用戶端之前初始化，檢查與 `otlp.arize.com:443` 的連線能力，並檢查應用程式/執行階段匯出器日誌，以便分辨 span 是在本地發出但在遠端被拒絕。如需偵錯，請設定 `GRPC_VERBOSITY=debug` 或將 `log_to_console=True` 傳遞給 `register()`。 常見陷阱：(a) 缺少專案名稱資源屬性導致 HTTP 500 拒絕 — 僅有 `service.name` 是不夠的；Python：將 `project_name` 傳遞給 `register()`；TypeScript：在資源上設定 `"model_id"` 或 `SEMRESATTRS_PROJECT_NAME`；Go：在 `resource.New(...)` 中新增 `attribute.String("openinference.project.name", "my-app")`；(b) CLI/指令碼程序在 OTLP 匯出排空前結束 — 在結束前呼叫 `provider.force_flush()` 然後 `provider.shutdown()` (Python/TS) 或 `tp.Shutdown(ctx)` (Go)；(c) CLI 可見的空間/專案可能與收集器目標空間 ID 不一致 — 報告不匹配，而不是默默重寫認證。
4. 如果應用程式使用工具：確認具有 `input.value` / `output.value` 的 CHAIN 和 TOOL span 出現，以便工具呼叫和結果可見。

當驗證因 CLI 或帳號問題受阻時，以具體狀態結束：

- 應用程式檢測狀態
- 最近的本機追蹤 ID 或執行 ID
- 匯出器日誌是否顯示本機 span 發射
- 失敗原因是認證、空間/專案解析、網路還是收集器拒絕

## 利用追蹤輔助代理程式 (MCP)

為了在 IDE 內獲得更深層次的檢測指引，使用者可以啟用：

- **Arize AX Tracing Assistant MCP** — 檢測指南、框架範例和支援。在 Cursor 中：**Settings → MCP → Add** 並使用：
  ```json
  "arize-tracing-assistant": {
    "command": "uvx",
    "args": ["arize-tracing-assistant@latest"]
  }
  ```
- **Arize AX Docs MCP** — 可搜尋的文件。在 Cursor 中：
  ```json
  "arize-ax-docs": {
    "url": "https://arize.com/docs/mcp"
  }
  ```

然後使用者可以詢問類似以下的問題：*"使用 Arize AX 檢測此應用程式"*、*"您能使用手動檢測以便我對追蹤有更多控制權嗎？"*、*"我該如何從 span 中遮蓋敏感資訊？"*

請參閱完整的設定，網址為 [代理程式輔助追蹤設定](https://arize.com/docs/ax/alyx/tracing-assistant)。

## 參考連結

| 資源 | URL |
|----------|-----|
| 代理程式輔助追蹤設定 | https://arize.com/docs/ax/alyx/tracing-assistant |
| 代理程式設定提示（完整路由 + 階段） | https://arize.com/docs/PROMPT.md |
| Arize AX 文件 | https://arize.com/docs/ax |
| 完整整合列表 | https://arize.com/docs/ax/integrations |
| 文件索引 (llms.txt) | https://arize.com/docs/llms.txt |

## 儲存認證以供將來使用

請參閱 references/ax-profiles.md § 儲存認證以供將來使用。
