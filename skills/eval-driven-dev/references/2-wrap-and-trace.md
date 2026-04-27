# 步驟 2：使用 `wrap` 進行檢測並擷取參考追蹤

> 關於完整的 `wrap()` API、`Runnable` 類別及 CLI 指令，請參閱 `wrap-api.md`。

**為什麼需要此步驟**：在建構任何內容之前，您需要檢視流經應用程式的實際資料。此步驟會加入 `wrap()` 呼叫以標記資料邊界、實作 `Runnable` 類別、使用 `pixie trace` 擷取參考追蹤，並驗證所有評估準則 (eval criteria) 均可被評估。

此步驟整合了三件事：(1) 資料流分析，(2) 檢測 (instrumentation)，以及 (3) 撰寫 runnable。

---

## 2a. 資料流分析與 `wrap` 檢測

從 LLM 呼叫點開始，向後和向前追蹤程式碼以尋找：

- **入口輸入 (Entry input)**：使用者傳送的內容（透過進入點）
- **相依性輸入 (Dependency input)**：來自外部系統（資料庫、API、快取）的資料
- **應用程式輸出 (App output)**：傳送給使用者或外部系統的資料
- **中間狀態 (Intermediate state)**：與評估相關的內部決策（路由、工具呼叫）

對於找到的每個資料點，**立即在應用程式程式碼中加入 `wrap()` 呼叫**：

```python
import pixie

# 外部相依性資料 — 數值形式 (DB/API 呼叫的結果)
profile = pixie.wrap(db.get_profile(user_id), purpose="input", name="customer_profile",
    description="從資料庫擷取的客戶個人資料")

# 外部相依性資料 — 函式形式 (用於延遲評估 / 避免呼叫)
history = pixie.wrap(redis.get_history, purpose="input", name="conversation_history",
    description="來自 Redis 的對話歷史記錄")(session_id)

# 應用程式輸出 — 使用者收到的內容
response = pixie.wrap(response_text, purpose="output", name="response",
    description="助理對使用者的回應")

# 中間狀態 — 與評估相關的內部決策
selected_agent = pixie.wrap(selected_agent, purpose="state", name="routing_decision",
    description="選擇哪個代理來處理此請求")
```

### 包裝 (wrapping) 規則

1. **在資料邊界進行包裝** — 即資料進入或離開應用程式的位置，而非在公用函式 (utility functions) 的深處
2. **名稱在整個應用程式中必須是唯一的**（它們被用作註冊表金鑰和資料集欄位名稱）
3. **名稱請使用 `lower_snake_case`**
4. **不要包裝 LLM 呼叫參數或回應** — 這些已由 OpenInference 自動檢測擷取
5. **不要變更函式的介面** — `wrap()` 純粹是附加的，會回傳相同的類型

### 數值形式 vs. 函式形式包裝

```python
# 數值形式：包裝資料值（結果已計算）
profile = pixie.wrap(db.get_profile(user_id), purpose="input", name="customer_profile")

# 函式形式：包裝可呼叫物件本身 — 在評估模式下，原始函式
# 不會被呼叫；而是會回傳註冊表中的值。
profile = pixie.wrap(db.get_profile, purpose="input", name="customer_profile")(user_id)
```

當您希望防止在評估模式下發生外部呼叫時（例如：呼叫代價高昂、有副作用，或者您只是想要一個乾淨的注入點），請使用函式形式。在追蹤模式下，函式會正常呼叫並記錄結果。

### 涵蓋範圍檢查

加入 `wrap()` 呼叫後，請檢查 `pixie_qa/02-eval-criteria.md` 中的每個評估準則，並驗證每個必要的資料點是否都有對應的包裝呼叫。如果某個準則需要的資料未被擷取，請立即加入包裝 — 不要拖延。

## 2b. 實作 Runnable 類別

`Runnable` 類別取代了舊版本技能中的普通函式。它公開了三個生命週期方法：

- **`setup()`** — 非同步，在任何 `run()` 呼叫之前呼叫一次；在此處初始化共享資源（例如：非同步 HTTP 客戶端、資料庫連接、預先載入的組態）。選用 — 預設為無操作 (no-op)。
- **`run(args)`** — 非同步，針對每個資料集條目**同時 (concurrently)** 呼叫（最多 4 個並行）；使用 `args`（根據 `entry_kwargs` 建構的經過驗證的 Pydantic 模型）呼叫應用程式的實際進入點。**必須是並行安全的 (concurrency-safe)** — 詳見下文。
- **`teardown()`** — 非同步，在所有 `run()` 呼叫之後呼叫一次；清理資源。選用 — 預設為無操作 (no-op)。

**匯入解析 (Import resolution)**：載入您的 runnable 時，專案根目錄會自動加入 `sys.path`，因此您可以使用正常的 `import` 陳述式（例如：`from app import service`） — 無需操作 `sys.path`。

將類別放置於 `pixie_qa/scripts/run_app.py`：

```python
# pixie_qa/scripts/run_app.py
from __future__ import annotations
from pydantic import BaseModel
import pixie


class AppArgs(BaseModel):
    user_message: str


class AppRunnable(pixie.Runnable[AppArgs]):
    """用於驅動應用程式進行追蹤和評估的 Runnable。

    應用程式中的 wrap(purpose="input") 呼叫會自動從測試註冊表中注入相依性資料。
    wrap(purpose="output"/"state") 呼叫則擷取資料用於評估。
    無需手動模擬 (mocking)。
    """

    @classmethod
    def create(cls) -> AppRunnable:
        return cls()

    async def run(self, args: AppArgs) -> None:
        from myapp import handle_request
        await handle_request(args.user_message)
```

**對於網頁伺服器**，在 `setup()` 中初始化非同步 HTTP 客戶端，並在 `run()` 中使用它：

```python
import httpx
from pydantic import BaseModel
import pixie


class AppArgs(BaseModel):
    user_message: str


class AppRunnable(pixie.Runnable[AppArgs]):
    _client: httpx.AsyncClient

    @classmethod
    def create(cls) -> AppRunnable:
        return cls()

    async def setup(self) -> None:
        self._client = httpx.AsyncClient(base_url="http://localhost:8000")

    async def run(self, args: AppArgs) -> None:
        await self._client.post("/chat", json={"message": args.user_message})

    async def teardown(self) -> None:
        await self._client.aclose()
```

**對於 FastAPI/Starlette 應用程式**（不啟動伺服器的進程內測試），使用 `httpx.ASGITransport` 直接執行 ASGI 應用程式。這速度更快，且可避免連接埠管理：

```python
import asyncio
import httpx
from pydantic import BaseModel
import pixie


class AppArgs(BaseModel):
    user_message: str


class AppRunnable(pixie.Runnable[AppArgs]):
    _client: httpx.AsyncClient
    _sem: asyncio.Semaphore

    @classmethod
    def create(cls) -> AppRunnable:
        inst = cls()
        inst._sem = asyncio.Semaphore(1)  # 如果應用程式使用共享的可變狀態，則進行序列化
        return inst

    async def setup(self) -> None:
        from myapp.main import app  # 您的 FastAPI/Starlette 應用程式執行個體

        # ASGITransport 在進程內執行應用程式 — 無需伺服器
        transport = httpx.ASGITransport(app=app)
        self._client = httpx.AsyncClient(transport=transport, base_url="http://test")

    async def run(self, args: AppArgs) -> None:
        async with self._sem:
            await self._client.post("/chat", json={"message": args.user_message})

    async def teardown(self) -> None:
        await self._client.aclose()
```

選擇正確的模式：

- **直接函式呼叫**：當應用程式公開一個簡單的非同步函式時（無網頁框架）
- **帶有 `base_url` 的 `httpx.AsyncClient`**：當您需要針對執行中的 HTTP 伺服器進行測試時
- **`httpx.ASGITransport`**：當應用程式是 FastAPI/Starlette 時 — 最快、無需伺服器、對評估最可靠

**規則**：

- `run()` 方法接收一個 Pydantic 模型，其欄位由資料集的 `entry_kwargs` 填充。定義一個包含應用程式所需欄位的 `BaseModel` 子類別。
- 所有生命週期方法 (`setup`, `run`, `teardown`) 都是**非同步**的。
- `run()` 必須透過其實際進入點呼叫應用程式 — 絕不要繞過請求處理。
- 將檔案放在 `pixie_qa/scripts/run_app.py` — 將類別命名為 `AppRunnable`（或任何具描述性的名稱）。
- 資料集的 `"runnable"` 欄位引用該類別：`"pixie_qa/scripts/run_app.py:AppRunnable"`。

**並行性 (Concurrency)**：針對多個資料集條目，會並行呼叫 `run()`（最多 4 個並行）。如果應用程式使用共享的可變狀態 — SQLite、基於檔案的資料庫、全域快取 — 您必須同步存取：

```python
import asyncio

class AppRunnable(pixie.Runnable[AppArgs]):
    _sem: asyncio.Semaphore

    @classmethod
    def create(cls) -> AppRunnable:
        inst = cls()
        inst._sem = asyncio.Semaphore(1)  # 序列化資料庫存取
        return inst

    async def run(self, args: AppArgs) -> None:
        async with self._sem:
            await call_app(args.message)
```

常見的並行陷阱：

- **SQLite**：`sqlite3` 連接對於並行非同步寫入是不安全的。請使用 `Semaphore(1)` 進行序列化，或切換至具有 WAL 模式的 `aiosqlite`。
- **全域可變狀態**：在 `run()` 中修改的模組級 dict/list 需要鎖定 (lock)。
- **受速率限制的外部 API**：加入信號量 (semaphore) 以避免 429 錯誤。

## 2c. 使用 `pixie trace` 擷取參考追蹤

使用 `pixie trace` CLI 指令執行您的 `Runnable` 並擷取追蹤檔案。將入口輸入以 JSON 檔案形式傳遞：

```bash
# 建立一個帶有 entry kwargs 的 JSON 檔案
echo '{"user_message": "一個真實的範例輸入"}' > pixie_qa/sample-input.json

pixie trace --runnable pixie_qa/scripts/run_app.py:AppRunnable \
  --input pixie_qa/sample-input.json \
  --output pixie_qa/reference-trace.jsonl
```

`--input` 旗標接收 JSON 檔案的**檔案路徑**（而非行內 JSON）。JSON 物件的金鑰會成為傳遞給 Pydantic 模型。

該指令會呼叫 `AppRunnable.create()`，接著是 `setup()`，然後使用給定的輸入呼叫一次 `run(args)`，最後是 `teardown()`。產生的追蹤記錄會寫入輸出檔案。

JSONL 追蹤檔案將包含每個 `wrap()` 事件一行，以及每個 LLM span 一行：

```jsonl
{"type": "kwargs", "value": {"user_message": "你們的營業時間是？"}}
{"type": "wrap", "name": "customer_profile", "purpose": "input", "data": {...}, ...}
{"type": "llm_span", "request_model": "gpt-4o", "input_messages": [...], ...}
{"type": "wrap", "name": "response", "purpose": "output", "data": "我們的營業時間是...", ...}
```

## 2d. 使用 `pixie format` 驗證包裝涵蓋範圍

在追蹤檔案上執行 `pixie format` 以檢視資料集條目格式的資料。這會向您展示資料形狀以及實際應用程式輸出的樣子：

```bash
pixie format --input reference-trace.jsonl --output dataset-sample.json
```

輸出是一個格式化過的資料集條目範本 — 它包含：

- `entry_kwargs`：runnable 引數的確切金鑰/值
- `eval_input`：所有相依性的資料（來自 `wrap(purpose="input")` 呼叫）
- `eval_output`：從追蹤中擷取的**實際應用程式輸出**（這是真實的輸出 — 請使用它來了解應用程式產生的內容，而不是將其作為資料集的 `eval_output` 欄位）

對於 `pixie_qa/02-eval-criteria.md` 中的每個評估準則，請驗證格式化輸出是否包含評估該準則所需的資料。如果遺漏了某個資料點，請返回並加入 `wrap()` 呼叫。

---

## 輸出

- `pixie_qa/scripts/run_app.py` — `Runnable` 類別
- `pixie_qa/reference-trace.jsonl` — 包含所有預期包裝事件的參考追蹤
