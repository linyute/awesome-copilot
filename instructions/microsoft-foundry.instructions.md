---
description: '在 Python 中使用 Microsoft Foundry SDK (azure-ai-projects v2) 建構代理人：具版本的代理人、Responses/Conversations 模型、工具，以及 Copilot 預設會犯的 SDK 錯誤。'
applyTo: '**/*.py'
---

# Microsoft Foundry Agents (Python) 指示

使用 **`azure-ai-projects`** Python SDK (**v2**，Microsoft Foundry SDK 的一部分) 針對 **Microsoft Foundry** 建構代理人的指引。此 SDK 在 v2 中進行了大幅重構；依據舊版 `azure-ai-projects` 1.x 或 `azure-ai-agents` 執行緒/執行 API 定型的模型所產生的程式碼已無法運作。當這些指示與您的定型資料衝突時，**請遵循這些指示** — 並對照官方範例進行驗證：https://aka.ms/azsdk/azure-ai-projects-v2/python/samples/

> **實務筆記 (為何存在此檔案)：** 在 Copilot 協助的 Foundry 專案中，預設行為通常是產生*舊的* thread/run/message API，在最初幾次嘗試失敗後，只有在對照 **Microsoft Learn** 與 **Microsoft Docs MCP 伺服器**重新確認目前的方法並針對 v2 方法重新編程後才能復原。這些指示預先載入該更正，以便 Copilot 在第一次產出時就能產生正常運作的 v2 程式碼，而不是浪費反覆運算。若有疑問，請以 Microsoft Learn / Microsoft Docs MCP 伺服器為依據，不要只依賴定型資料 — Foundry SDK 介面變更頻繁。

## 驗證：本機開發 vs. 正式環境

Entra ID 是**唯一**支援的驗證方式。在**本機開發**中使用 `azure.identity.DefaultAzureCredential` (它會嘗試多個認證來源，包括環境變數、工作負載身分識別、受控識別以及 CLI/PowerShell 等開發人員工具認證)；在 Azure 上的**已部署工作負載** (App Service、Container Apps、Functions，其中已為運算資源指派了系統指派或使用者指派的受控識別) 中使用 `ManagedIdentityCredential`。

### 本機開發

```python
from azure.identity import DefaultAzureCredential

with (
    DefaultAzureCredential() as credential,
    AIProjectClient(endpoint=endpoint, credential=credential) as project_client,
):
    # ... 使用 project_client
```

可選：若使用 Azure CLI 進行驗證，請執行 `az login`。`DefaultAzureCredential` 將尋找並使用您的 CLI 認證、環境變數或其他可用的開發人員認證 (Visual Studio Code、Azure PowerShell、Azure Developer CLI 等)。若其他認證成功，則不需要 `az login`。

### 部署至 Azure (App Service, Container Apps, Functions)

對於**系統指派的身分識別** (預設)：

```python
from azure.identity import ManagedIdentityCredential

with (
    ManagedIdentityCredential() as credential,
    AIProjectClient(endpoint=endpoint, credential=credential) as project_client,
):
    # ... 使用 project_client
```

對於**使用者指派的身分識別**，請傳遞用戶端識別碼：

```python
from azure.identity import ManagedIdentityCredential

with (
    ManagedIdentityCredential(client_id="<USER_ASSIGNED_CLIENT_ID>") as credential,
    AIProjectClient(endpoint=endpoint, credential=credential) as project_client,
):
    # ... 使用 project_client
```

需求：運算資源 (App Service 應用程式、Container Apps 應用程式、Function 應用程式等) 已設定**系統指派或使用者指派的受控識別**，**且該身分識別在 Foundry 專案上具有所需的 RBAC 角色指派** — 通常是內建的 **`Foundry User`** 角色 (原名為 `Azure AI User`)。對於使用者指派的身分識別，請將用戶端識別碼傳遞至 `ManagedIdentityCredential(client_id=...)`。不需要 `az login`；平台會自動提供認證。有關目前的角色定義，請參閱 [Foundry 角色型存取控制](https://learn.microsoft.com/en-us/azure/ai-studio/concepts/rbac-ai-studio)。

### 部署至 AKS (工作負載身分識別)

對於設定了 Microsoft Entra Workload ID 的 AKS Pod，改用 `WorkloadIdentityCredential`：

```python
from azure.identity import WorkloadIdentityCredential

with (
    WorkloadIdentityCredential() as credential,
    AIProjectClient(endpoint=endpoint, credential=credential) as project_client,
):
    # ... 使用 project_client
```

需求：AKS Pod 已設定工作負載身分識別註解與投射的 OIDC 權杖磁碟區。請參閱 [Azure 工作負載身分識別文件](https://learn.microsoft.com/en-us/azure/aks/workload-identity-overview)。

> **最佳做法：** 在部署的程式碼中，為了清晰度與效能，請使用具體的認證類別 (App Service/Container Apps/Functions 使用 `ManagedIdentityCredential`，AKS 使用 `WorkloadIdentityCredential`)。有關 `DefaultAzureCredential` 完整認證鏈的詳細資料，請參閱 [Azure Identity 文件](https://learn.microsoft.com/en-us/python/api/azure-identity/azure.identity.defaultazurecredential)。

## 套件與版本

- 安裝：`pip install "azure-ai-projects>=2.3.0"` (非同步還需要 `pip install aiohttp`)。請使用 **2.3.0+** — 下方記載的流程依賴在 2.x 系列中新增的 API (2.1.0 中 `get_openai_client` 上的 `agent_name`；2.2.0 中 `delete_version` 上的 `force` 與 `AgentEndpointConfig`)。安裝 2.0.x 會導致部分程式碼執行失敗。
- 端點是形式為 `https://<account>.services.ai.azure.com/api/projects/<project>` 的**專案端點** — 而非純粹的資源 URL。

## 頭號錯誤：舊的 thread/run API 已廢棄

❌ **不要產生此程式碼 (v1 / azure-ai-agents 風格 — 已不再有效)：**
```python
# 錯誤 — azure-ai-projects v2 中不存在這些方法
agent = client.agents.create_agent(name="x", model="gpt-4o", instructions="...")
thread = client.threads.create()
client.messages.create(thread_id=thread.id, role="user", content="Hi")
run = client.runs.create_and_process_run(thread_id=thread.id, agent_id=agent.id)
messages = client.messages.list(thread_id=thread.id)   # 錯誤
```

> 若你發現自己正在撰寫 `create_agent` / `threads` / `runs` 並遇到 `AttributeError` 或 404 錯誤，請停止並對照 Microsoft Learn 或 Microsoft Docs MCP 伺服器重新確認 — 這是過時 API 失敗迴圈的典型特徵。

✅ **改為這樣做 (v2)：建立具版本的代理人，將端點指向該版本，然後透過與 OpenAI 相容的用戶端與其通訊。**
```python
import os
from azure.identity import DefaultAzureCredential  # 已部署應用程式請使用 ManagedIdentityCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import (
    PromptAgentDefinition,
    AgentEndpointConfig,
    ProtocolConfiguration,
    ResponsesProtocolConfiguration,
    VersionSelector,
    FixedRatioVersionSelectionRule,
)

endpoint = os.environ["FOUNDRY_PROJECT_ENDPOINT"]
agent_name = os.environ.get("FOUNDRY_AGENT_NAME", "MyAgent")

with (
    DefaultAzureCredential() as credential,
    AIProjectClient(endpoint=endpoint, credential=credential) as project_client,
):
    version = project_client.agents.create_version(
        agent_name=agent_name,
        definition=PromptAgentDefinition(
            model=os.environ["FOUNDRY_MODEL_NAME"],   # 一個*部署*名稱，預設並非 "gpt-4o"
            instructions="You are a helpful assistant that answers general questions.",
        ),
    )
    print(f"Agent {version.name} v{version.version} (id: {version.id})")

    # 必要：將代理人端點路由至您剛建立的版本。
    # 若沒有此步驟，新代理人將沒有可用的路由，且現有代理人
    # 可能會繼續提供舊版本的服務。
    project_client.agents.update_details(
        agent_name=agent_name,
        agent_endpoint=AgentEndpointConfig(
            version_selector=VersionSelector(
                version_selection_rules=[
                    FixedRatioVersionSelectionRule(
                        agent_version=version.version, traffic_percentage=100
                    ),
                ]
            ),
            protocol_configuration=ProtocolConfiguration(
                responses=ResponsesProtocolConfiguration()
            ),
        ),
    )

    with project_client.get_openai_client(agent_name=agent_name) as openai_client:
        response = openai_client.responses.create(
            input="What is the size of France in square miles?",
        )
        print(response.output_text)
```

> 官方範例將 create-version + endpoint-routing 步驟封裝在 `create_version_with_endpoint(...)` 協助程式中 (參閱 `samples/util.py`)。如上所示以行內方式撰寫能使必要的路由步驟更加明確。在測試/範例中，擷取先前的端點組態並在 `finally` 區塊中加以還原，以免暫時版本留下重新路由的代理人。

Copilot 預設會犯錯的關鍵事實：
- 代理人是**具備版本 (versioned)** 的。您使用 `agents.create_version(agent_name=..., definition=...)` 建立*版本*，而非一次性的 `create_agent`。
- 建立版本後，您**必須設定端點** (`update_details` + `AgentEndpointConfig`) 以在呼叫代理人之前將流量路由至該版本。
- 代理人定義是 **`PromptAgentDefinition`** (從 `azure.ai.projects.models` 匯入)，且 `model` 是來自 Foundry 專案「模型 + 端點」標籤頁的**部署名稱** — 而非原始模型 ID。
- 您透過 **`project_client.get_openai_client(agent_name=...)`** 進行互動，這會傳回標準的 OpenAI 用戶端。對話介面為 **Responses API** (`responses.create`) 與 **Conversations API** (`conversations.create`)，*而非* threads/runs/messages。
- 從 **`response.output_text`** 讀取回覆。

## 多回合：Conversations，而非 threads

對於具狀態的多回合聊天，建立一個 conversation 並傳遞其 ID — 不要自己重新建構訊息清單。

```python
with project_client.get_openai_client(agent_name=agent_name) as openai_client:
    conversation = openai_client.conversations.create(
        items=[{"type": "message", "role": "user", "content": "What is the size of France in square miles?"}],
    )
    response = openai_client.responses.create(conversation=conversation.id)
    print(response.output_text)

    # 繼續同一個對話
    openai_client.conversations.items.create(
        conversation_id=conversation.id,
        items=[{"type": "message", "role": "user", "content": "And the capital city?"}],
    )
    response = openai_client.responses.create(conversation=conversation.id)
    print(response.output_text)

    openai_client.conversations.delete(conversation_id=conversation.id)
```

對於簡單的無狀態後續問題，您可以在 `responses.create` 上改用 `previous_response_id=response.id` 進行鏈結。請注意這是一種**狀態管理**的選擇，而非成本最佳化 — 先前的回合在每次呼叫時仍會被重新處理並按輸入權杖計費，與 Conversation 相同。當您希望參照先前對話而不管理對話物件時使用此功能，而不是為了節省權杖。

## 工具：在定義中附加，不要在執行階段註冊

工具存在於 **`PromptAgentDefinition`** 上，以 `tools=[...]` 清單形式傳遞。從 `azure.ai.projects.models` 匯入工具類別。(在呼叫啟用工具的代理人之前，適用上述相同的 create-version + endpoint-routing 步驟。)

### 程式碼直譯器 (Code Interpreter)
```python
from azure.ai.projects.models import PromptAgentDefinition, CodeInterpreterTool

definition = PromptAgentDefinition(
    model=os.environ["FOUNDRY_MODEL_NAME"],
    instructions="You are a helpful assistant.",
    tools=[CodeInterpreterTool()],
)
# ... create_version(...), 設定端點，然後:
response = openai_client.responses.create(
    conversation=conversation.id,
    input="Generate a 10x10 multiplication table.",
    tool_choice="required",
)
# 檢查執行的程式碼:
code = next((o.code for o in response.output if o.type == "code_interpreter_call"), "")
print(response.output_text)
```

### 函式工具 (用戶端執行迴圈)
`FunctionTool` 宣告 JSON 綱要；由**你**執行呼叫並回饋結果。模型在 `response.output` 中發出 `function_call` 項目；你傳回 `FunctionCallOutput` 並再次使用 `previous_response_id` 呼叫 `responses.create`。

```python
import json
from openai.types.responses.response_input_param import FunctionCallOutput, ResponseInputParam
from azure.ai.projects.models import PromptAgentDefinition, FunctionTool

def get_horoscope(sign: str) -> str:
    return f"{sign}: Next Tuesday you will befriend a baby otter."

tool = FunctionTool(
    name="get_horoscope",
    parameters={
        "type": "object",
        "properties": {"sign": {"type": "string", "description": "An astrological sign"}},
        "required": ["sign"],
        "additionalProperties": False,
    },
    description="Get today's horoscope for an astrological sign.",
    strict=True,
)

# definition = PromptAgentDefinition(model=..., instructions=..., tools=[tool])
# ... 建立版本, 設定端點, 取得 openai_client ...

response = openai_client.responses.create(input="What is my horoscope? I am an Aquarius.")

# 繼續處理直到沒有更多的函式呼叫
while any(item.type == "function_call" for item in response.output):
    input_list: ResponseInputParam = []
    for item in response.output:
        if item.type == "function_call" and item.name == "get_horoscope":
            result = get_horoscope(**json.loads(item.arguments))
            input_list.append(FunctionCallOutput(
                type="function_call_output",
                call_id=item.call_id,
                output=json.dumps({"horoscope": result}),
            ))

    if input_list:
        response = openai_client.responses.create(input=input_list, previous_response_id=response.id)

print(response.output_text)
```

常見陷阱：設定 `strict=True` 與 `additionalProperties: False` 以獲得可靠的結構化呼叫；你**必須**在 `FunctionCallOutput` 中回應 `item.call_id`；反覆運算 `response.output` 的**全部**項目 (單次回應可能包含多個 `function_call` 項目)。

其他內建工具遵循相同的「新增至 `tools=[...]`」模式：`FileSearchTool`、`AzureAISearchTool`、`BingGroundingTool`、`OpenApiTool`、MCP 工具等 — 參見 `samples/agents/tools/`。

## 預覽功能

這是一個同時提供預覽功能的**穩定版**套件。透過穩定方法公開的預覽功能在建構用戶端時需要 **`allow_preview=True`**；其他預覽操作位於 `project_client.beta.*` 下 (例如 `beta.memory_stores`、`beta.evaluators`、`beta.red_teams`)。不要假設 `beta` 操作已正式發布 (GA)。

## 生命週期與正式環境注意事項

- 在測試/範例中，將建立作業包裝在 `try/finally` 中，並使用 `agents.delete_version(agent_name=..., agent_version=..., force=True)` 進行清理，以避免留下孤立版本。當您暫時重新路由代理人的端點時，請在同一個 `finally` 區塊中還原其先前的 `AgentEndpointConfig`。
- 使用 `AgentEndpointConfig` + `VersionSelector` / `FixedRatioVersionSelectionRule` 跨版本路由流量 — 將 100% 傳送至新版本，或按百分比分割以進行金絲雀發布。
- 透過 `azure.core.exceptions.HttpResponseError` (`e.status_code`, `e.reason`, `e.message`) 處理錯誤。`401 Unauthorized` 幾乎總是意味著缺少 RBAC 角色指派 (或在本地開發中未執行 `az login`)，而非端點錯誤。
- **記錄會暴露敏感資料 — 請謹慎對待。** `logging_enable=True` 會開啟完整的 HTTP 傳輸記錄。在 DEBUG 層級下，記錄包含請求/回應內文 (提示、使用者資料) 且標頭未經遮罩 — Bearer 權杖與承載資料可能會洩漏至記錄中。在其他層級下，記錄仍會發出但保持遮罩。日常診斷偏好使用 SDK 的已篩選主控台記錄路徑 (`AZURE_AI_PROJECTS_CONSOLE_LOGGING=true`，預設會遮罩驗證標頭)。僅針對非生產/非敏感資料啟用內文記錄，且絕不要將未遮罩的記錄傳送至共享的記錄接收端。
- 對於非同步操作，從 `azure.ai.projects.aio` 與 `azure.identity.aio` 匯入並使用 `async with` — 方法名稱完全相同。
