# Wrap API 參考

> 由 pixie 原始程式碼 docstrings 自動產生。
> 請勿手動編輯 — 請從上游 [pixie-qa](https://github.com/yiouli/pixie-qa) 原始來源存放庫重新產生。

`pixie.wrap` — 以資料為導向的觀察 API。

`wrap()` 在處理管道中的命名點觀察資料值或可呼叫物件。
其行為取決於啟動模式：

- **No-op** (追蹤已停用，無評估註冊表)：傳回未變更的 `data`。
- **追蹤** (執行 `pixie trace` 期間)：寫入追蹤檔案並發出一個
  OTel 事件 (如果 span 已啟動則透過 span 事件，否則透過 OTel 記錄器)
  並傳回未變更的 `data` (或封裝可呼叫物件，以便讓
  事件在呼叫時觸發)。
- **評估** (評估註冊表已啟動)：為 `purpose="input"` 注入相依性資料，
  為 `purpose="output"`/
  `purpose="state"` 擷取輸出/狀態。

---

## CLI 指令

| 指令                                                                                      | 說明                                                                                                                                          |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pixie trace --runnable <filepath:ClassName> --input <kwargs.json> --output <file.jsonl>` | 使用來自 JSON 檔案的 kwargs 執行一次 Runnable，並寫入追蹤檔案。`--input` 是一個**檔案路徑** (非內嵌 JSON)。                                   |
| `pixie format <file.jsonl>`                                                               | 將追蹤檔案轉換為格式化的資料集項目範本。顯示 `entry_kwargs`、`eval_input` 和 `eval_output` (實際擷取的輸出)。                                 |
| `pixie trace filter <file.jsonl> --purpose input`                                         | 僅列印符合指定用途的 wrap 事件。每個符合的事件輸出一行 JSON。                                                                                |

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

用於資料集執行器的結構化 Runnables 協定。`T` 是
`pydantic.BaseModel` 子類別，其欄位與資料集 JSON 中的 `entry_kwargs` 鍵
相符。

生命週期：

1. `create()` — 建構並傳回一個 runnable 執行個體的類別方法。
2. `setup()` — **非同步**，在第一次 `run()` 呼叫之前被呼叫**一次**。
   在此初始化共享資源 (例如：`TestClient`、資料庫連線)。
   選用 — 具有預設的 no-op 實作。
3. `run(args)` — **非同步**，針對**每個資料集項目同時呼叫**
   (最多 4 個項目並行)。`args` 是從 `entry_kwargs` 建立且經過驗證的
   Pydantic 模型。呼叫應用程式的實際進入點。
4. `teardown()` — **非同步**，在最後一次 `run()` 呼叫之後被呼叫**一次**。
   釋放任何在 `setup()` 中取得的資源。
   選用 — 具有預設的 no-op 實作。

`setup()` 和 `teardown()` 具有預設的 no-op 實作；
您只需要在需要共享資源時覆寫它們。

**並行 (Concurrency)**：`run()` 透過 `asyncio.gather` 並行呼叫。您的
實作**必須是並行安全的**。如果它使用共享的可變狀態
(例如：SQLite 連線、記憶體中快取、檔案控制代碼)，請使用
`asyncio.Semaphore` 或 `asyncio.Lock` 保護它：

```python
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

- **SQLite**：對於並行寫入不安全 — 請使用 `Semaphore(1)` 或搭配 WAL 模式的 `aiosqlite`。
- **全域可變狀態**：在 `run()` 中修改的模組層級 dicts/lists 需要保護。
- **受速率限制的 API**：新增一個 semaphore 以避免 429 錯誤。

**匯入解析**：在載入 runnables 和評估器之前，專案根目錄 (叫用 `pixie test` / `pixie trace`
的位置) 會自動新增到 `sys.path`。這意味著您的 runnable 可以使用
一般的 `import` 陳述式來參考專案模組
(例如：`from app import service`)。

**範例**：

```python
# pixie_qa/scripts/run_app.py
from __future__ import annotations
from pydantic import BaseModel
import pixie

class AppArgs(BaseModel):
    user_message: str

class AppRunnable(pixie.Runnable[AppArgs]):
    @classmethod
    def create(cls) -> AppRunnable:
        return cls()

    async def run(self, args: AppArgs) -> None:
        from myapp import handle_request
        await handle_request(args.user_message)
```

**網頁伺服器範例** (使用非同步 HTTP 用戶端)：

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

---

## 函式

### `pixie.wrap`

```python
pixie.wrap(data: 'T', *, purpose: "Literal['input', 'output', 'state']", name: 'str', description: 'str | None' = None) -> 'T'
```

在處理管道中的某個點觀察資料值或提供資料的可呼叫物件。

`data` 可以是純值或產生值的可呼叫物件。
在這兩種情況下，傳回類型均為 `T` — 呼叫者會得到與傳入
類型完全相同的傳回，當處於 no-op 或追蹤模式時。

在 `purpose="input"` 的評估模式下，傳回的值 (或可呼叫物件) 是
替換為還原序列化的註冊表值。當 `data` 是可呼叫物件時
傳回的封裝器會忽略原始函式，並在每次呼叫時傳回注入
的值；在所有其他模式下，傳回的可呼叫物件會封裝
原始函式並加入追蹤或擷取行為。

引數：
data: 資料值或提供資料的可呼叫物件。
purpose: 資料點的分類： - "input": 來自外部相依性的資料 (資料庫紀錄、API 回應) - "output": 傳出至外部系統或使用者的資料 - "state": 用於評估的中間狀態 (路由決策等)
name: 此資料點的唯一識別碼。用作
評估註冊表和追蹤記錄中的鍵。
description: 此資料內容的可讀性說明 (選用)。

傳回：
未變更的原始資料 (追蹤 / no-op 模式)，或
註冊表值 (評估模式且 purpose="input")。當 `data`
是可呼叫物件時，傳回值也是可呼叫物件。

---

## 錯誤類型

### `WrapRegistryMissError`

```python
WrapRegistryMissError(name: 'str') -> 'None'
```

當評估註冊表中找不到 wrap(purpose="input") 名稱時引發。

### `WrapTypeMismatchError`

```python
WrapTypeMismatchError(name: 'str', expected_type: 'type', actual_type: 'type') -> 'None'
```

當還原序列化的註冊表值與預期類型不符時引發。

---

## 追蹤檔案公用程式

用於 wrap 記錄項目和 JSONL 載入公用程式的 Pydantic 模型。

`WrapLogEntry` 是記錄在 JSONL 追蹤檔案中單個 `wrap()` 事件的
具類型表示。程式碼庫中的多個位置都會載入這些物件 — `pixie trace filter`
CLI、資料集載入器和驗證指令碼 — 因此它們
共享此單一模型。

### `pixie.WrapLogEntry`

```python
pixie.WrapLogEntry(*, type: str = 'wrap', name: str, purpose: str, data: Any, description: str | None = None, trace_id: str | None = None, span_id: str | None = None) -> None
```

記錄到 JSONL 追蹤檔案的單個 wrap() 事件。

屬性：
type: 對於 wrap 事件，始終為 `"wrap"`。
name: wrap 點名稱 (與 `wrap(name=...)` 相符)。
purpose: `"input"`、`"output"`、`"state"` 之一。
data: 序列化資料 (jsonpickle 字串)。
description: 選用的可讀性說明。
trace_id: OTel 追蹤 ID (如果可用)。
span_id: OTel span ID (如果可用)。

### `pixie.load_wrap_log_entries`

```python
pixie.load_wrap_log_entries(jsonl_path: 'str | Path') -> 'list[WrapLogEntry]'
```

從 JSONL 檔案載入所有 wrap 記錄項目。

略過非 wrap 行 (例如 `type=llm_span`) 和格式錯誤的行。

引數：
jsonl_path: JSONL 追蹤檔案的路徑。

傳回：
:class:`WrapLogEntry` 物件的清單。

### `pixie.filter_by_purpose`

```python
pixie.filter_by_purpose(entries: 'list[WrapLogEntry]', purposes: 'set[str]') -> 'list[WrapLogEntry]'
```

依用途篩選 wrap 記錄項目。

引數：
entries: wrap 記錄項目清單。
purposes: 要包含的用途值集合。

傳回：
篩選後的清單。
