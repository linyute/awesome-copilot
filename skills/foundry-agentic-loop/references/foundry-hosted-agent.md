# Foundry 託管 agent (Foundry hosted agent)

`foundry-agentic-loop` skill 的參考資料：託管在 Microsoft Foundry 上的 agent 執行階段考量事項。託管 agent 預設應公開 **Responses API**；僅在為確保相容性而有明確需求時才使用 invocations。`foundry-agentic-loop` 決定 agent *是否*託管以及使用*哪種架構*；本檔案包含託管 agent 的執行階段詳細資料。參考 agent 為 [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py)。

## 託管 agent 通訊協定 (Hosted-agent protocol)

託管 agent 預設採用 **Responses API** 通訊協定。Responses 公開與 OpenAI 相容的 `/responses` 端點，且平台負責管理交談歷程記錄、串流與工作階段生命週期。新託管 agent 與產生的計畫請優先採用此協定。

使用工具的 agent 會將每個工具呼叫以輸出項目串流傳輸，因為評估程式僅針對輸出項目評分；切勿從中傳回單純的 `TextResponse`。使用 `azure-ai-agentserver-responses` 2.2.0–2.3.0（請先檢視已安裝的 API），`ResponsesAgentServerHost()` 的 `@app.response_handler` 會傳回一個非同步產生器，該產生器建立 `ResponseEventStream(response_id=context.response_id, request=request)`，yield `emit_created()` 與 `emit_in_progress()`，接著為每個呼叫 yield `output_item_function_call(name, call_id, arguments)` 與 `output_item_function_call_output(call_id, output)` 的事件，然後是 `output_item_message(text)` 的事件（保持在最後以確保 `output_text` 為最終答案），最後 yield `emit_completed()`。

僅在使用者明確要求、現有已部署 agent 已依賴它，或所需範例/執行階段尚未透過 Responses 提供時，才使用 **invocations** 通訊協定。若選取了 invocations，請在 `./docs/spec.md` (SDD) 或根目錄 `README.md` (rapid) 中記錄原因。

## Python 相依性契約 (`requirements.txt`)

在 `requirements.txt` 或 `pyproject.toml` 中宣告每個 agent 的相依性。在實作時解析最新穩定且相容的發行版本並予以鎖定；此表格為針對已做決策的必要意圖。依據 SKILL.md 的架構規則，每個 agent 選取一個架構列。

| 何時使用 | 套件 | 原因 |
| --- | --- | --- |
| 一律使用 | `azure-identity` | `DefaultAzureCredential`：託管時使用受控識別，本機使用 `az login` |
| 一律使用 | `azure-ai-agentserver-responses` | 提供 Responses 端點服務；其核心從 `APPLICATIONINSIGHTS_CONNECTION_STRING` 匯出主機遙測 |
| 僅限 Invocations | `azure-ai-agentserver-invocations` | 僅在明確選取 invocations 時使用 |
| 使用執行階段 skills 的 agents | `github-copilot-sdk[telemetry]` | Copilot 執行階段、BYOK 提供者與執行階段遙測；在 [`copilot-sdk-with-toolbox.py`](copilot-sdk-with-toolbox.py) 中引入 `httpx` 用於 toolbox 橋接 |
| 基本 agents 與明確工作流程 | `agent-framework-foundry` (透過 MAF 代管時新增 `agent-framework-foundry-hosting`) | Microsoft Agent Framework 子套件，每個皆以 `==` 鎖定版本；絕不使用 `agent-framework` 元套件 |
| 多檔案 skills 或 toolbox 外部的 skills | `azure-ai-projects` | Skills API 下載 (請參閱 microsoft-foundry)；toolbox skills 則作為 MCP 資源抵達 |
| 處理程序內 OpenAI 用戶端模型呼叫 | `opentelemetry-instrumentation-openai-v2` | 執行階段未發出的模型 span |

不要在代管轉接器的全域遙測匯出工具旁新增第二個全域匯出工具（[observability.md](observability.md)）。不要新增 `azure-search-documents`：Foundry IQ 基礎 (grounding) 透過 toolbox 提供；僅在需要 [`foundry-iq-grounding.md`](foundry-iq-grounding.md#escape-hatch-direct-in-code-retrieval) 中的直接擷取應急出口時才新增 Search SDK。

同時請對照建置所使用的索引解析版本，因為鏡像或 Proxy 可能落後於官方索引。具雜湊值的鎖定檔案僅保留 sha256、sha384 或 sha512 雜湊值；pip 會拒絕其他雜湊演算法 ("Allowed hash algorithms for --hash are sha256, sha384, sha512")。

## 本機執行與程式碼封裝

- `azd ai agent run` 使用 `uv sync --locked` 進行同步。若其回報 `uv.lock` 需要更新，而 `pyproject.toml` 與鎖定檔案一致，則表示機器上的 uv 設定 (`/etc/uv/uv.toml`, `~/.config/uv/uv.toml` 或 `UV_INDEX*`，通常是套件摘要 Proxy) 正在重寫索引。僅針對本機執行重新鎖定，並在部署前還原已認可的鎖定檔案。
- 程式碼部署僅使用 agent 服務資料夾的 `.agentignore` 進行封裝；`.azdignore` 會被忽略。預設值已排除 `.env*`、`.azure/`、`.git/`、`.venv/`、`__pycache__/` 與 `*.pyc`，因此僅列出額外的非執行階段檔案：測試、評估程式、評估設定與 Dockerfile。

## Copilot SDK 相容性

產生的程式碼必須符合最新的穩定版 `github-copilot-sdk`，而非過時的範例。在實作時期，從官方索引解析最新穩定發行版本並安裝，在編寫處理常式前檢視 `CopilotClient.create_session`、`CopilotSession.send_and_wait`、事件資料型別以及非同步情境管理員生命週期。若組建的索引缺少該發行版本，鎖定其提供的最新穩定發行版本（絕不使用預覽版本）並記錄差異。[copilot-sdk-foundry.md](copilot-sdk-foundry.md) 列出了需要記錄的項目。

相容性檢查屬於所產生應用程式的實作與 CI 範疇，這些檢查會針對其解析後的鎖定檔案執行；此 skill 不搭售 SDK 測試套件。若附隨 skill 指引與已安裝的套件衝突，請遵循套件 API 並將缺陷回報至上游（issue 或 PR），而非修補本機的第三方 skill。

在檢閱或修正 SDK 程式碼時，說明解析後的版本、Python 最低需求（v1.0.14–1.0.23 為 3.11；託管 agent 保留 3.13）以及工作階段建立、提示詞傳送、事件與生命週期的結構形式，以便能檢查修正內容。

## 唯讀容器檔案系統

託管容器除 `/tmp` 外皆為唯讀。將每個執行階段寫入作業（skills、工作階段狀態、產生的檔案）預設放置於 `tempfile.gettempdir()` 底下；在應用程式目錄下寫入會導致首次叫用崩潰。參考 agent 將 skills 寫入每輪次的暫存目錄中，並僅在 HOME 不可寫入時才將 Copilot 工作階段狀態移至暫存目錄下。
