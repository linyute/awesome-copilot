# 適用於 Python 的 Microsoft Graph SDK

當目標專案使用 Python 編寫時，請使用此參考。

## 權威來源

- SDK 儲存庫：<https://github.com/microsoftgraph/msgraph-sdk-python>
- 範例：<https://github.com/microsoftgraph/msgraph-training-python>
- SDK 變更記錄：<https://github.com/microsoftgraph/msgraph-sdk-python/blob/main/CHANGELOG.md>

## 套件

```bash
pip install msgraph-sdk azure-identity
```

或者在 `requirements.txt` / `pyproject.toml` 中：

```
msgraph-sdk>=1.0.0
azure-identity>=1.15.0
```

## 用戶端設定

### 受控識別 (Azure 託管應用程式 — 偏好使用)

```python
from azure.identity.aio import DefaultAzureCredential
from msgraph import GraphServiceClient

credential = DefaultAzureCredential()
graph_client = GraphServiceClient(credential)
```

Python SDK 是非同步優先的 (`asyncio`)。請使用 `azure.identity.aio`（非同步變體），而不是 `azure.identity`。

### 用戶端認證 (僅限應用程式 / 精靈)

```python
import os
from azure.identity.aio import ClientSecretCredential
from msgraph import GraphServiceClient

credential = ClientSecretCredential(
    tenant_id=os.environ["AZURE_TENANT_ID"],
    client_id=os.environ["AZURE_CLIENT_ID"],
    client_secret=os.environ["AZURE_CLIENT_SECRET"],
)

graph_client = GraphServiceClient(credential)
```

在生產環境中，偏好使用 `CertificateCredential` 而非 `ClientSecretCredential`。

### 代理 (On-Behalf-Of, OBO) — 代表已登入使用者的代理程式 / API

```python
from azure.identity.aio import OnBehalfOfCredential

# incoming_token 是來自呼叫者的載體權杖 (Bearer Token)
credential = OnBehalfOfCredential(
    tenant_id=os.environ["AZURE_TENANT_ID"],
    client_id=os.environ["AZURE_CLIENT_ID"],
    client_secret=os.environ["AZURE_CLIENT_SECRET"],
    user_assertion=incoming_token,
)

graph_client = GraphServiceClient(credential)
```

對於 OBO，請為每個要求建構一個新的 `GraphServiceClient` — 認證是針對特定使用者範圍的。

### 裝置代碼 (CLI / 本機開發)

```python
from azure.identity.aio import DeviceCodeCredential

credential = DeviceCodeCredential(
    client_id=os.environ["AZURE_CLIENT_ID"],
    tenant_id=os.environ["AZURE_TENANT_ID"],
)
graph_client = GraphServiceClient(credential, scopes=["User.Read", "Mail.Read"])
```

## 常見呼叫模式

Python 中所有的 Graph SDK 呼叫都是非同步的。請務必在非同步內容中執行。

### 取得具有欄位選擇的資源

```python
import asyncio
from msgraph.generated.me.me_request_builder import MeRequestBuilder
from kiota_abstractions.base_request_configuration import RequestConfiguration

async def get_my_profile():
    query_params = MeRequestBuilder.MeRequestBuilderGetQueryParameters(
        select=["displayName", "mail", "jobTitle"]
    )
    config = RequestConfiguration(query_parameters=query_params)
    user = await graph_client.me.get(request_configuration=config)
    return user

asyncio.run(get_my_profile())
```

### 具有過濾和選擇的郵件清單

```python
from msgraph.generated.me.messages.messages_request_builder import MessagesRequestBuilder

async def get_unread_messages():
    query_params = MessagesRequestBuilder.MessagesRequestBuilderGetQueryParameters(
        filter="isRead eq false",
        select=["subject", "from", "receivedDateTime"],
        top=25,
        orderby=["receivedDateTime desc"],
    )
    config = RequestConfiguration(query_parameters=query_params)
    result = await graph_client.me.messages.get(request_configuration=config)
    return result
```

### 使用 PageIterator 進行分頁

```python
from msgraph.generated.models.message import Message
from msgraph.core import PageIterator

async def get_all_messages():
    first_page = await graph_client.me.messages.get()
    all_messages: list[Message] = []

    async def process_message(message: Message) -> bool:
        all_messages.append(message)
        return True  # 回傳 False 以提早停止

    page_iterator = PageIterator(
        response=first_page,
        request_adapter=graph_client.request_adapter,
        constructor=Message,
    )
    await page_iterator.iterate(callback=process_message)
    return all_messages
```

### 傳送電子郵件

```python
from msgraph.generated.models.message import Message
from msgraph.generated.models.item_body import ItemBody
from msgraph.generated.models.body_type import BodyType
from msgraph.generated.models.recipient import Recipient
from msgraph.generated.models.email_address import EmailAddress
from msgraph.generated.me.send_mail.send_mail_post_request_body import SendMailPostRequestBody

async def send_email():
    body = SendMailPostRequestBody(
        message=Message(
            subject="來自 Graph 的問候",
            body=ItemBody(content_type=BodyType.Text, content="測試訊息"),
            to_recipients=[
                Recipient(email_address=EmailAddress(address="user@contoso.com"))
            ],
        )
    )
    await graph_client.me.send_mail.post(body)
```

### 發布 Teams 頻道訊息

```python
from msgraph.generated.models.chat_message import ChatMessage
from msgraph.generated.models.item_body import ItemBody
from msgraph.generated.models.body_type import BodyType

async def post_channel_message(team_id: str, channel_id: str):
    message = ChatMessage(
        body=ItemBody(content_type=BodyType.Html, content="<b>來自 Graph 的問候！</b>")
    )
    await graph_client.teams.by_team_id(team_id).channels.by_channel_id(channel_id).messages.post(message)
```

## 批次要求

```python
from kiota_http.middleware.options import ResponseHandlerOption
import json

async def batch_example():
    batch_body = {
        "requests": [
            {"id": "1", "method": "GET", "url": "/me"},
            {"id": "2", "method": "GET", "url": "/me/messages?$top=5&$select=subject"},
        ]
    }
    # 對批次處理使用原始 HTTP 用戶端
    response = await graph_client.request_adapter.send_primitive_async(
        # 或者是，搭配來自認證的權杖使用 requests 函式庫
    )
```

在 Python 中進行批次處理時，當批次協助工具尚未獲得完整支援時，通常使用 `httpx` 並搭配取得的權杖會更簡單：

```python
import httpx
from azure.identity.aio import ClientSecretCredential

async def batch_with_httpx(credential):
    token = await credential.get_token("https://graph.microsoft.com/.default")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://graph.microsoft.com/v1.0/$batch",
            headers={"Authorization": f"Bearer {token.token}"},
            json={
                "requests": [
                    {"id": "1", "method": "GET", "url": "/me"},
                    {"id": "2", "method": "GET", "url": "/me/messages?$top=5"},
                ]
            },
        )
    return response.json()
```

## 差異查詢 (Delta queries)

```python
async def delta_sync(stored_delta_link: str | None = None):
    if stored_delta_link:
        # 直接使用差異連結 (Delta link)
        response = await graph_client.request_adapter.send_async(...)
    else:
        response = await graph_client.users.delta.get()

    users = []
    async def collect(user):
        users.append(user)
        return True

    page_iterator = PageIterator(response=response, request_adapter=graph_client.request_adapter, constructor=...)
    await page_iterator.iterate(callback=collect)

    delta_link = page_iterator.delta_link  # 儲存此連結以供下次執行
    return users, delta_link
```

## 節流 / 重試

當使用預設的 `GraphClientFactory` 時，SDK 的 HTTP 傳輸會自動處理 429 重試。若要進行明確控制：

```python
import asyncio
import httpx

async def call_with_retry(graph_client, call_fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return await call_fn()
        except Exception as e:
            if "429" in str(e):
                retry_after = int(getattr(e, "retry_after", 10))
                await asyncio.sleep(retry_after)
            else:
                raise
```

## Python 特定指引

- Python Graph SDK 是**非同步優先**的 — 請使用 `asyncio.run()` 或非同步框架（如 FastAPI、aiohttp）。
- 務必在非同步內容中使用 `azure.identity.aio`（而非 `azure.identity`）。
- 完成後關閉認證：`await credential.close()` 或將其作為非同步內容管理員使用。
- Python SDK 模型類別對屬性使用 `snake_case`（Graph JSON 使用 `camelCase` — SDK 會自動對應）。
- 對於並行但獨立的 Graph 呼叫，使用 `asyncio.gather()`（注意節流限制）。
- 對於 FastAPI：使用生命週期事件來初始化一次 `GraphServiceClient`，並在關閉時關閉認證。

```python
# FastAPI 整合範例
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    credential = DefaultAzureCredential()
    app.state.graph_client = GraphServiceClient(credential)
    yield
    await credential.close()

app = FastAPI(lifespan=lifespan)
```
