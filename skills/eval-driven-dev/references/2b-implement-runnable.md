# 步驟 2b：實作 Runnable

> 有關完整的 `Runnable` 協定和 `wrap()` API，請參閱 `wrap-api.md`。

**目標**：編寫一個 Runnable 類別，讓評估控具 (Harness) 能像真實使用者一樣呼叫應用程式。

---

## 核心構想

Runnable 是 `pixie test` 和 `pixie trace` 執行應用程式的方式。可以將其視為真實使用者的程式化代表：它啟動應用程式、發送請求，並讓應用程式執行其功能。評估控具為每個測試案例呼叫 `run()`，傳入使用者的輸入參數。應用程式透過其真實程式碼（真實路由、真實提示詞組合、真實 LLM 呼叫、真實回應格式化）處理這些參數，而控具則透過步驟 2a 中的 `wrap()` 檢測 (Instrumentation) 觀察發生的情況。

**這意味著 Runnable 應該保持簡單。** 它只是將應用程式的真實入口點串接到控具介面。如果你的 Runnable 變得很複雜 — 例如你正在建置自訂邏輯、重新實作應用程式行為或替換元件 — 那麼一定是哪裡出了問題。

## 四項要求

### 1. 執行真實的生產程式碼

Runnable 呼叫應用程式的實際入口點 — 即真實使用者觸發的同一個函式、類別或端點。它不應重新實作、走捷徑或替換應用程式的任何部分。

這包括 LLM。應用程式的 LLM 呼叫必須走真實的程式碼路徑 — 請勿模擬 (Mock)、偽造或替換應用程式元件。基於評估測試的全部分點在於：LLM 的輸出是非確定性的，因此你使用評估器（而非斷言 Assertions）來對其評分。如果你用偽造的實作替換了任何元件，你就消除了真實的行為，評估也就失去了測量意義。

**如果應用程式由於缺失你無法解決的環境變數或設定而無法執行，請停止並請求使用者協助修復環境設定。** 不要透過模擬元件來規避。

### 2. 使用 Pydantic BaseModel 表示啟動參數

`run()` 方法接收一個 Pydantic `BaseModel`，其欄位由資料集的 `input_data` 填充。定義一個子類別，包含應用程式所需的欄位：

```python
from pydantic import BaseModel

class AppArgs(BaseModel):
    user_message: str
    # 根據應用程式入口點的需求增加更多欄位。
    # 這些欄位與資料集中的 input_data 鍵值一一對應。
```

**這些欄位必須反映真實使用者實際提供的內容。** 閱讀 `pixie_qa/00-project-analysis.md` — 「現實輸入特性」章節描述了真實輸入的複雜度、規模和多樣性。設計模型以接受符合該真實水準的輸入，而非簡化過的範例。

理解使用者提供的參數與世界資料 (World data) 之間的邊界：

- **使用者提供的參數** (BaseModel 上的欄位)：真實使用者輸入或設定的內容 — 提示詞、查詢、設定旗標、URL、結構描述定義。
- **世界資料** (由步驟 2a 中的 `wrap(purpose="input")` 處理)：應用程式在執行期間從外部來源獲取的內容 — 網頁、資料庫記錄、API 回應。這**不屬於** BaseModel 的一部分。

| 應用程式類型 | BaseModel 欄位 (使用者提供) | 世界資料 (Wrap 提供) |
| -------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| 網頁抓取工具 | URL + 提示詞 + 結構描述定義 | HTML 頁面內容 |
| 研究代理 | 研究問題 + 範圍約束 | 來源文件、搜尋結果 |
| 客戶支援機器人 | 客戶說出的訊息 | 來自 CRM 的客戶設定檔、來自工作階段儲存空間的對話紀錄 |
| 程式碼審查工具 | PR URL + 審查標準 | 實際的 Diff、檔案內容、CI 結果 |

如果一個欄位最終用於存放應用程式通常會自行獲取的資料，那麼它可能應該屬於 `wrap(purpose="input")` 呼叫，而不是放在 BaseModel 上。

### 3. 確保執行緒安全 (Concurrency-safe)

`run()` 會為多個資料集項目並行呼叫（最多 4 個並行）。如果應用程式使用共享的可變狀態（例如：SQLite、基於檔案的資料庫、全域快取），請使用 `asyncio.Semaphore` 保護存取：

```python
import asyncio

class AppRunnable(pixie.Runnable[AppArgs]):
    _sem: asyncio.Semaphore

    @classmethod
    def create(cls) -> "AppRunnable":
        inst = cls()
        inst._sem = asyncio.Semaphore(1)
        return inst

    async def run(self, args: AppArgs) -> None:
        async with self._sem:
            await call_app(args.message)
```

僅在應用程式確實具有共享可變狀態時增加信號量 (Semaphore)。如果應用程式使用按唯一 ID 索引的每請求狀態，或者本質上是無狀態的，則並行呼叫會自然隔離。

### 4. 遵守 Runnable 介面

```python
class AppRunnable(pixie.Runnable[AppArgs]):
    @classmethod
    def create(cls) -> "AppRunnable": ...     # 建構執行個體
    async def setup(self) -> None: ...        # 在第一次執行 run() 前執行一次
    async def run(self, args: AppArgs) -> None: ...  # 為每個資料集項目執行，並行
    async def teardown(self) -> None: ...     # 在最後一次執行後執行一次
```

- `create()` — 類別方法，回傳一個新執行個體。使用引用的回傳類型 (`-> "AppRunnable"`) 以避免前向引用 (Forward reference) 錯誤。
- `setup()` — 選用的異步方法；初始化共享資源（HTTP 客戶端、資料庫連線、伺服器）。
- `run(args)` — 異步方法；為每個資料集項目呼叫。在此處叫用應用程式的真實入口點。
- `teardown()` — 選用的異步方法；清理 `setup()` 中獲得的資源。

## 最簡範例

```python
# pixie_qa/run_app.py
from pydantic import BaseModel
import pixie


class AppArgs(BaseModel):
    user_message: str


class AppRunnable(pixie.Runnable[AppArgs]):
    """驅動應用程式進行追蹤和評估。"""

    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def run(self, args: AppArgs) -> None:
        from myapp import handle_request
        await handle_request(args.user_message)
```

就是這樣。Runnable 匯入應用程式的真實入口點並呼叫它。沒有自訂邏輯，沒有元件替換，也沒有花哨的規避方法。

## 架構特定範例

根據應用程式的執行方式，閱讀對應的範例檔案：

| 應用程式類型 | 入口點 | 範例檔案 |
| ----------------------------------- | ----------------------- | ---------------------------------------------------------- |
| **獨立函式** (無伺服器) | Python 函式 | 閱讀 `references/runnable-examples/standalone-function.md` |
| **網頁伺服器** (FastAPI, Flask) | HTTP/WebSocket 端點 | 閱讀 `references/runnable-examples/fastapi-web-server.md` |
| **CLI 應用程式** | 命令列叫用 | 閱讀 `references/runnable-examples/cli-app.md` |

**僅**閱讀與你的應用程式類型相符的範例檔案。

## 檔案放置

- 將檔案放在 `pixie_qa/run_app.py`。
- 資料集的 `"runnable"` 欄位引用：`"pixie_qa/run_app.py:AppRunnable"`。
- 專案根目錄會自動加入 `sys.path`，因此請使用正常的匯入方式（`from app import service`）。

## 技術註記

不要在 Runnable 檔案中使用 `from __future__ import annotations` — 它會破壞 Pydantic 對巢狀模型的解析。請在需要時使用引用的回傳類型。

---

## 輸出

`pixie_qa/run_app.py` — Runnable 類別。
