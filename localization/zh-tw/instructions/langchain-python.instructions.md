---
description: '使用 LangChain 搭配 Python 的說明'
applyTo: "**/*.py"
---

# LangChain Python 說明

這些說明指導 GitHub Copilot 在 Python 中為 LangChain 應用程式生成程式碼和文件。重點關注 LangChain 特定的模式、API 和最佳實踐。

## 可執行介面 (LangChain 特定)

LangChain 的 `Runnable` 介面是組合和執行鏈、聊天模型、輸出解析器、檢索器和 LangGraph 圖的基礎。它提供了一個統一的 API，用於呼叫、批次處理、串流、檢查和組合元件。

**LangChain 特定的主要功能：**

- 所有主要的 LangChain 元件 (聊天模型、輸出解析器、檢索器、圖) 都實作了 Runnable 介面。
- 支援同步 (`invoke`、`batch`、`stream`) 和非同步 (`ainvoke`、`abatch`、`astream`) 執行。
- 批次處理 (`batch`、`batch_as_completed`) 針對平行 API 呼叫進行了最佳化；在 `RunnableConfig` 中設定 `max_concurrency` 以控制平行處理。
- 串流 API (`stream`、`astream`、`astream_events`) 在產生輸出時產生輸出，這對於響應式 LLM 應用程式至關重要。
- 輸入/輸出類型是元件特定的 (例如，聊天模型接受訊息，檢索器接受字串，輸出解析器接受模型輸出)。
- 使用 `get_input_schema`、`get_output_schema` 及其 JSONSchema 變體檢查綱要以進行驗證和 OpenAPI 生成。
- 使用 `with_types` 覆寫推斷的輸入/輸出類型，以用於複雜的 LCEL 鏈。
- 使用 LCEL 宣告式地組合 Runnables：`chain = prompt | chat_model | output_parser`。
- 在 Python 3.11+ 中自動傳播 `RunnableConfig` (標籤、Metadata、回呼、並行)；在 Python 3.9/3.10 的非同步程式碼中手動傳播。
- 使用 `RunnableLambda` (簡單轉換) 或 `RunnableGenerator` (串流轉換) 建立自訂可執行檔；避免直接子類別化。
- 使用 `configurable_fields` 和 `configurable_alternatives` 配置執行時屬性和替代方案，以用於動態鏈和 LangServe 部署。

**LangChain 最佳實踐：**

- 使用批次處理進行平行 API 呼叫到 LLM 或檢索器；設定 `max_concurrency` 以避免速率限制。
- 優先使用串流 API 進行聊天 UI 和長輸出。
- 始終驗證自訂鏈和部署端點的輸入/輸出綱要。
- 在 `RunnableConfig` 中使用標籤和 Metadata，以便在 LangSmith 中追蹤和偵錯複雜鏈。
- 對於自訂邏輯，使用 `RunnableLambda` 或 `RunnableGenerator` 包裝函式，而不是子類別化。
- 對於進階配置，透過 `configurable_fields` 和 `configurable_alternatives` 公開欄位和替代方案。

- 使用 LangChain 的聊天模型整合進行對話式 AI：

- 從 `langchain.chat_models` 或 `langchain_openai` 匯入 (例如，`ChatOpenAI`)。
- 使用 `SystemMessage`、`HumanMessage`、`AIMessage` 組合訊息。
- 對於工具呼叫，使用 `bind_tools(tools)` 方法。
- 對於結構化輸出，使用 `with_structured_output(schema)`。

範例：
```python
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

chat = ChatOpenAI(model="gpt-4", temperature=0)
messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="What is LangChain?")
]
response = chat.invoke(messages)
print(response.content)
```

- 將訊息組合為 `SystemMessage`、`HumanMessage` 和可選的 `AIMessage` 物件列表。
- 對於 RAG，將聊天模型與檢索器/向量儲存結合以進行上下文注入。
- 使用 `streaming=True` 進行即時權杖串流 (如果支援)。
- 使用 `tools` 參數進行函式/工具呼叫 (OpenAI、Anthropic 等)。
- 使用 `response_format="json"` 進行結構化輸出 (OpenAI 模型)。

最佳實踐：

- 始終在使用模型輸出之前驗證它們，以用於下游任務。
- 優先使用明確的訊息類型以提高清晰度和可靠性。
- 對於 Copilot，提供清晰、可操作的提示並記錄預期輸出。

- LLM 用戶端工廠：集中提供者配置 (API 金鑰)、逾時、重試和遙測。提供一個單一位置來切換提供者或用戶端設定。
- 提示範本：將範本儲存在 `prompts/` 下，並透過安全的輔助函式載入。保持範本小巧且可測試。
- 鏈與代理：優先使用鏈進行確定性管線 (RAG、摘要)。當您需要規劃或動態工具選擇時，請使用代理。
- 工具：為工具實作類型化轉接器介面；嚴格驗證輸入和輸出。
- 記憶體：預設為無狀態設計。當需要記憶體時，儲存最少的上下文並記錄保留/清除策略。
- 檢索器：建立檢索 + 重新排名管線。保持向量儲存綱要穩定 (id、text、Metadata)。

### 模式

- 回呼與追蹤：使用 LangChain 回呼並與 LangSmith 或您的追蹤系統整合，以捕獲請求/回應生命週期。
- 關注點分離：將提示建構、LLM 連線和業務邏輯分開，以簡化測試並減少意外的提示變更。

## 嵌入與向量儲存

- 使用一致的區塊化和 Metadata 欄位 (來源、頁面、區塊索引)。
- 快取嵌入以避免未變更文件的重複成本。
- 本機/開發：Chroma 或 FAISS。生產：託管向量資料庫 (Pinecone、Qdrant、Milvus、Weaviate)，具體取決於規模和 SLA。

## 向量儲存 (LangChain 特定)

- 使用 LangChain 的向量儲存整合進行語義搜尋、檢索增強生成 (RAG) 和文件相似性工作流程。
- 始終使用支援的嵌入模型 (例如，OpenAIEmbeddings、HuggingFaceEmbeddings) 初始化向量儲存。
- 優先使用官方整合 (例如，Chroma、FAISS、Pinecone、Qdrant、Weaviate) 進行生產；使用 InMemoryVectorStore 進行測試和示範。
- 將文件儲存為具有 `page_content` 和 `metadata` 的 LangChain `Document` 物件。
- 使用 `add_documents(documents, ids=...)` 新增/更新文件。始終為 upsert 提供唯一的 ID。
- 使用 `delete(ids=...)` 依 ID 移除文件。
- 使用 `similarity_search(query, k=4, filter={...})` 檢索前 k 個相似文件。使用 Metadata 篩選器進行範圍搜尋。
- 對於 RAG，將您的向量儲存連接到檢索器並與 LLM 鏈接 (請參閱 LangChain 檢索器和 RAGChain 文件)。
- 對於進階搜尋，請使用向量儲存特定的選項：Pinecone 支援混合搜尋和 Metadata 篩選；Chroma 支援篩選和自訂距離指標。
- 始終驗證您環境中的向量儲存整合和 API 版本；LangChain 版本之間經常會出現重大變更。
- 範例 (InMemoryVectorStore)：

```python
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

embedding_model = OpenAIEmbeddings()
vector_store = InMemoryVectorStore(embedding=embedding_model)

documents = [Document(page_content="LangChain content", metadata={"source": "doc1"})]
vector_store.add_documents(documents=documents, ids=["doc1"])

results = vector_store.similarity_search("What is RAG?", k=2)
for doc in results:
    print(doc.page_content, doc.metadata)
```

- 對於生產，優先使用持久性向量儲存 (Chroma、Pinecone、Qdrant、Weaviate)，並根據提供者文件配置身份驗證、擴展和備份。
- 參考：https://python.langchain.com/docs/integrations/vectorstores/

## 提示工程與治理

- 將規範提示儲存在 `prompts/` 下，並從程式碼中按檔案名稱引用它們。
- 編寫單元測試，斷言所需的佔位符存在，並且呈現的提示符合預期模式 (長度、變數存在)。
- 維護提示和綱要變更的 CHANGELOG，這些變更會影響行為。

## 聊天模型

LangChain 為聊天模型提供了統一的介面，並具有用於監控、偵錯和最佳化的附加功能。

### 整合

整合可以是：

1. 官方：由 LangChain 團隊或提供者維護的打包 `langchain-<provider>` 整合。
2. 社群：貢獻的整合 (在 `langchain-community` 中)。

聊天模型通常遵循帶有 `Chat` 前綴的命名約定 (例如，`ChatOpenAI`、`ChatAnthropic`、`ChatOllama`)。沒有 `Chat` 前綴 (或帶有 `LLM` 後綴) 的模型通常實作較舊的字串輸入/字串輸出介面，並且對於現代聊天工作流程來說較不推薦。

### 介面

聊天模型實作 `BaseChatModel` 並支援 Runnable 介面：串流、非同步、批次處理等。許多操作接受並傳回 LangChain `messages` (例如 `system`、`user`、`assistant` 等角色)。有關詳細資訊，請參閱 BaseChatModel API 參考。

主要方法包括：

- `invoke(messages, ...)` — 傳送訊息列表並接收回應。
- `stream(messages, ...)` — 以權杖到達時串流部分輸出。
- `batch(inputs, ...)` — 批次處理多個請求。
- `bind_tools(tools)` — 附加工具轉接器以進行工具呼叫。
- `with_structured_output(schema)` — 請求結構化回應的輔助函式。

### 輸入和輸出

- LangChain 支援其自己的訊息格式和 OpenAI 的訊息格式；在您的程式碼庫中始終如一地選擇一種。
- 訊息包括 `role` 和 `content` 區塊；內容可以包括支援的結構化或多模態酬載。

### 標準參數

常用支援的參數 (取決於提供者)：

- `model`：模型識別碼 (例如 `gpt-4o`、`gpt-3.5-turbo`)。
- `temperature`：隨機性控制 (0.0 確定性 — 1.0 創意)。
- `timeout`：取消前等待的秒數。
- `max_tokens`：回應權杖限制。
- `stop`：停止序列。
- `max_retries`：網路/限制失敗的重試次數。
- `api_key`、`base_url`：提供者身份驗證和端點配置。
- `rate_limiter`：可選的 BaseRateLimiter，用於間隔請求並避免提供者配額錯誤。

> 注意：並非所有提供者都實作所有參數。請務必查閱提供者整合文件。

### 工具呼叫

聊天模型可以呼叫工具 (API、資料庫、系統轉接器)。使用 LangChain 的工具呼叫 API 來：

- 註冊具有嚴格輸入/輸出類型設定的工具。
- 觀察和記錄工具呼叫請求和結果。
- 在將工具輸出傳回模型或執行副作用之前驗證工具輸出。

有關範例和安全模式，請參閱 LangChain 文件中的工具呼叫指南。

### 結構化輸出

使用 `with_structured_output` 或綱要強制方法從模型請求 JSON 或類型化輸出。結構化輸出對於可靠的提取和下游處理 (解析器、資料庫寫入、分析) 至關重要。

### 多模態

某些模型支援多模態輸入 (圖像、音訊)。請查閱提供者文件以了解支援的輸入類型和限制。多模態輸出很少見 — 將它們視為實驗性並嚴格驗證。

### 上下文視窗

模型具有以權杖測量的有限上下文視窗。在設計對話流程時：

- 保持訊息簡潔並優先處理重要上下文。
- 當舊上下文超出視窗時，將其修剪 (摘要或封存)。
- 使用檢索器 + RAG 模式來顯示相關的長篇上下文，而不是將大型文件貼到聊天中。

## 進階主題

### 速率限制

- 在初始化聊天模型時使用 `rate_limiter` 來間隔呼叫。
- 實作帶有指數退避的重試，並在節流時考慮備用模型或降級模式。

### 快取

- 對於對話，精確輸入快取通常無效。考慮對重複的語義級查詢進行語義快取 (基於嵌入)。
- 語義快取引入了對嵌入的依賴，並且不普遍適用。
- 僅在減少成本並滿足正確性要求 (例如，FAQ 機器人) 的情況下進行快取。

## 最佳實踐

- 對於公共 API 使用類型提示和資料類別。
- 在呼叫 LLM 或工具之前驗證輸入。
- 從秘密管理器載入秘密；切勿記錄秘密或未編輯的模型輸出。
- 確定性測試：模擬 LLM 和嵌入呼叫。
- 快取嵌入和頻繁的檢索結果。
- 可觀察性：記錄 request_id、模型名稱、延遲和清理後的權杖計數。
- 為外部呼叫實作指數退避和冪等性。

## 安全與隱私

- 將模型輸出視為不受信任。在執行生成的程式碼或系統命令之前進行清理。
- 驗證任何使用者提供的 URL 和輸入，以避免 SSRF 和注入攻擊。
- 記錄資料保留並新增 API 以應要求清除使用者資料。
- 限制儲存的 PII 並在靜止時加密敏感欄位。
