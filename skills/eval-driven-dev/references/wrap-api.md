# Wrap API 參考

> 由 pixie 原始程式碼文件字串 (docstrings) 自動產生。
> 請勿手動編輯 — 請執行 `uv run python scripts/generate_skill_docs.py`。

`pixie.wrap` — 以資料為導向的觀察 API。

`wrap()` 在處理管線中的指定點觀察資料值或可呼叫物件。其行為取決於啟動模式：

- **無操作 (No-op)** (追蹤已停用，無評估註冊表)：原樣回傳 `data`。
- **追蹤 (Tracing)** (執行 `pixie trace` 期間)：寫入追蹤檔案並發出 OTel 事件（若有活動中的 Span 則透過 Span Event 發出，否則透過 OTel Logger 發出），並原樣回傳 `data`（或包裝可呼叫物件，以便在呼叫時觸發事件）。
- **評估 (Eval)** (評估註冊表已啟動)：為 `purpose="input"` 注入相依性資料，為 `purpose="output"`/`purpose="state"` 擷取輸出/狀態。

---

## CLI 命令

| 命令 | 說明 |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `pixie trace --runnable <filepath:ClassName> --input <kwargs.json> --output <file.jsonl>` | 使用來自 JSON 檔案的 kwargs 執行一次 Runnable，並寫入追蹤檔案。`--input` 是一個**檔案路徑** (而非內嵌 JSON)。 |
| `pixie format --input <trace.jsonl> --output <dataset_entry.json>`                        | 將追蹤檔案轉換為格式化的資料集項目範本。顯示 `input_data`、`eval_input` 以及 `eval_output` (實際擷取的輸出)。 |
| `pixie trace filter <file.jsonl> --purpose input`                                         | 僅列印符合指定用途 (Purposes) 的 Wrap 事件。每行輸出一個符合事件的 JSON。 |

---

## 類別

### `pixie.Runnable`

```python
class pixie.Runnable(Protocol[T]):
    @classmethod
    def create(cls) -> Runnable[Any]: ...
    async def setup(self) -> None: ...
    async def run(self, args: T) -> None: ...
    async def teardown(self) -> None: ...
```

用於評估控具的結構化 Runnable 協定。`T` 是一個 `pydantic.BaseModel` 子類別，其欄位與資料集 JSON 中的 `input_data` 鍵值相符。

生命週期：

1. `create()` — 類別方法，用以建構並回傳一個 Runnable 執行個體。
2. `setup()` — **異步 (Async)**，在第一次 `run()` 呼叫前呼叫**一次**。在此處初始化共享資源（例如：`TestClient`、資料庫連線）。可選 — 具有預設的無操作實作。
3. `run(args)` — **異步**，為每個資料集項目**並行呼叫**（最多 4 個項目並行）。`args` 是從 `input_data` 建置且經過驗證的 Pydantic 模型。在此呼叫應用程式的真實入口點。
4. `teardown()` — **異步**，在最後一次 `run()` 呼叫後呼叫**一次**。釋放在 `setup()` 中獲得的任何資源。可選 — 具有預設的無操作實作。

`setup()` 和 `teardown()` 具有預設的無操作實作；你只需在需要共享資源時覆寫它們。

**並行 (Concurrency)**：`run()` 透過 `asyncio.gather` 並行呼叫。你的實作**必須是執行緒安全的 (Concurrency-safe)**。如果它使用共享的可變狀態（例如：SQLite 連線、記憶體內快取、檔案控制代碼），請使用 `asyncio.Semaphore` 或 `asyncio.Lock` 進行保護：

```python
class AppRunnable(pixie.Runnable[AppArgs]):
    _sem: asyncio.Semaphore

    @classmethod
    def create(cls) -> "AppRunnable":
        inst = cls()
        inst._sem = asyncio.Semaphore(1)  # 序列化資料庫存取
        return inst

    async def run(self, args: AppArgs) -> None:
        async with self._sem:
            await call_app(args.message)
```

常見的並行陷阱：

- **SQLite**：對於並行寫入不安全 — 請使用 `Semaphore(1)` 或具有 WAL 模式的 `aiosqlite`。
- **全域可變狀態**：在 `run()` 中修改的模組級字典/列表需要保護。
- **有頻率限制的 API**：增加一個信號量 (Semaphore) 以避免 429 錯誤。

**匯入解析 (Import resolution)**：叫用 `pixie test` / `pixie trace` 的專案根目錄會在載入 Runnable 和評估器前自動加入到 `sys.path`。這意味著你的 Runnable 可以使用正常的 `import` 陳述式來引用專案模組（例如：`from app import service`）。

**範例：**

```python
# pixie_qa/run_app.py
from pydantic import BaseModel
import pixie

class AppArgs(BaseModel):
    user_message: str

class AppRunnable(pixie.Runnable[AppArgs]):
    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def run(self, args: AppArgs) -> None:
        from myapp import handle_request
        await handle_request(args.user_message)
```

**網頁伺服器範例** (使用異步 HTTP 客戶端)：

```python
import httpx
from pydantic import BaseModel
import pixie

class AppArgs(BaseModel):
    user_message: str

class AppRunnable(pixie.Runnable[AppArgs]):
    _client: httpx.AsyncClient

    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def setup(self) -> None:
        self._client = httpx.AsyncClient(base_url="http://localhost:8000")

    async def run(self, args: AppArgs) -> None:
        await self._client.post("/chat", json={"message": args.user_message})

    async def teardown(self) -> None:
        await self._client.aclose()
```

---

## 函式

### `pixie.wrap`

```python
pixie.wrap(data: 'T', *, purpose: "Literal['input', 'output', 'state']", name: 'str', description: 'str | None' = None) -> 'T'
```

在處理管線的一個點觀察資料值或資料提供者可呼叫物件。

`data` 可以是一個純數值或一個產生數值的可呼叫物件。在這兩種情況下，回傳類型都是 `T` — 在無操作或追蹤模式下，呼叫者會收到與其傳入完全相同的類型。

在評估模式且 `purpose="input"` 時，回傳的值（或可呼叫物件）會被取代為反序列化的註冊表值。當 `data` 是可呼叫物件時，回傳的包裝器會忽略原始函式並在每次呼叫時回傳注入的值；在所有其他模式下，回傳的可呼叫物件會包裝原始函式並加入追蹤或擷取行為。

參數：
data：資料值或資料提供者可呼叫物件。
purpose：資料點的分類： - "input"：來自外部相依性的資料 (資料庫記錄, API 回應) - "output"：流向外部系統或使用者的資料 - "state"：用於評估的中間狀態 (路由決策等)
name：此資料點的唯一識別碼。用作評估註冊表和追蹤記錄中的鍵值。
description：關於此資料是什麼的選用人讀說明。

回傳值：
未變更的原始資料 (追蹤 / 無操作模式)，或註冊表值 (評估模式且 purpose="input")。當 `data` 為可呼叫物件時，回傳值也是可呼叫的。

---

## 錯誤類型

### `WrapRegistryMissError`

```python
WrapRegistryMissError(name: 'str') -> 'None'
```

當在評估註冊表中找不到 wrap(purpose="input") 名稱時拋出。

### `WrapTypeMismatchError`

```python
WrapTypeMismatchError(name: 'str', expected_type: 'type', actual_type: 'type') -> 'None'
```

當反序列化的註冊表值與預期類型不符時拋出。

---

## 追蹤檔案公用程式

用於 Wrap 記錄項目和 JSONL 載入公用程式的 Pydantic 模型。

`WrapLogEntry` 是記錄在 JSONL 追蹤檔案中的單個 `wrap()` 事件的類型化表示。程式碼庫中的多個地方都會載入這些物件 — `pixie trace filter` CLI、資料集載入器以及驗證指令碼 — 因此它們共享這個單一模型。

### `pixie.WrapLogEntry`

```python
pixie.WrapLogEntry(*, type: str = 'wrap', name: str, purpose: str, data: Any, description: str | None = None, trace_id: str | None = None, span_id: str | None = None) -> None
```

記錄到 JSONL 追蹤檔案中的單個 wrap() 事件。

屬性：
type：對於 Wrap 事件，一律為 `"wrap"`。
name：Wrap 點名稱 (與 `wrap(name=...)` 相符)。
purpose：`"input"`、`"output"` 或 `"state"` 之一。
data：序列化的資料 (jsonpickle 字串)。
description：選用的人讀說明。
trace_id：OTel 追蹤 ID (若可用)。
span_id：OTel Span ID (若可用)。

### `pixie.load_wrap_log_entries`

```python
pixie.load_wrap_log_entries(jsonl_path: 'str | Path') -> 'list[WrapLogEntry]'
```

從 JSONL 檔案載入所有 Wrap 記錄項目。

跳過非 Wrap 行（例如 `type=llm_span`）和格式錯誤的行。

參數：
jsonl_path：JSONL 追蹤檔案的路徑。

回傳值：
:class:`WrapLogEntry` 物件的列表。

### `pixie.filter_by_purpose`

```python
pixie.filter_by_purpose(entries: 'list[WrapLogEntry]', purposes: 'set[str]') -> 'list[WrapLogEntry]'
```

按用途篩選 Wrap 記錄項目。

參數：
entries：Wrap 記錄項目列表。
purposes：要包含的用途值集合。

回傳值：
篩選後的列表。
