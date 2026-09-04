# Python 裝置

Python 的型別提示是選用的，且在執行階段不具強制約束力，這將每個裝置拆分為兩個問題：檢查器捕捉到了什麼，以及程式碼執行時實際上能維持什麼保證。

**先決條件**：將 `mypy --strict`（或 strict 模式下的 `pyright`）設為*必要*的 CI 檢查。若沒有它，型別註解就只是文件，屬於第零階。將其與設為錯誤等級的 `ruff` 搭配使用。

## 接觸，使用 NewType 實現低成本的區隔性

```python
from typing import NewType

UserId = NewType("UserId", str)
OrderId = NewType("OrderId", str)

def transfer(src: UserId, dst: UserId) -> None: ...

transfer(order_id, user_id)  # mypy: 錯誤：執行階段零成本
```

`NewType` 在執行階段完全免費，並在檢查階段阻擋混淆。它不進行驗證，請在概念不同但形狀無需檢查時使用。

## 接觸，在邊界使用 Pydantic 進行剖析

當數值需要檢查時，將其剖析為模型，並讓型別承載證明：

```python
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class CreateUser(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    email: EmailStr
    age: int = Field(ge=0, le=150)
```

兩項設定完成了大部分工作。`extra="forbid"` 會將拼錯的欄位轉為錯誤，而不是無聲無息地忽略該索引鍵：這就是 400 錯誤與使用者偏好設定從未被儲存之間的差別。`frozen=True` 阻止重新賦值模型的欄位，因此下游任何程式碼都無法悄悄替換你已驗證的內容。但它是淺層的：`list` 或 `dict` 欄位仍然可以就地修改，因此在重視這點的地方，請改用 `tuple`、`frozenset` 或巢狀的凍結模型。

應用於每個邊界：請求主體、佇列訊息、第三方回應、檔案載入。

## 接觸，僅限關鍵字引數

Python 對於參數調換的解法，而且僅需花費一個字元的成本：

```python
def transfer(*, source: AccountId, dest: AccountId, amount: Money) -> None: ...

transfer(source=a, dest=b, amount=m)   # 唯一合法的形式
transfer(a, b, m)                      # TypeError
```

針對任何超過兩個參數的情況，以及只要有兩個參數共享型別時，一律強制使用僅限關鍵字引數。這屬於警告（Warning）階梯。它使失誤變得明顯而非不可能，但它是該語言中價值最高的一個字元變更。

## 固定值，窮舉性

```python
from typing import assert_never, Literal

Status = Literal["pending", "active", "closed"]

def label(s: Status) -> str:
    match s:
        case "pending": return "Pending"
        case "active":  return "Active"
        case "closed":  return "Closed"
        case _: assert_never(s)   # 若有變體未處理，mypy 會在此處報錯
```

`assert_never` 將「有人新增了狀態」轉變為每個必須變更之處的建置失敗。適用於 `Literal`、`Enum` 以及帶標記的資料類別（tagged dataclass）聯集。

## 固定值，啟動時驗證設定

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    stripe_key: str
    region: str            # 無預設值：未設定的值應阻止部署

settings = Settings()      # 在匯入時即引發例外，趕在服務回報健康之前
```

在啟動時匯入一次並將該物件向下傳遞。深埋在處理常式中的每個 `os.getenv` 都是一顆定時炸彈，等待著觸達它的那唯一一個請求在凌晨 3 點引爆呼叫警報。

## 接觸，不可變的數值物件

```python
from dataclasses import dataclass

@dataclass(frozen=True, slots=True, kw_only=True)
class Money:
    cents: int
    currency: str

    def __add__(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(f"無法將 {self.currency} 與 {other.currency} 相加")
        return Money(cents=self.cents + other.cents, currency=self.currency)
```

`frozen=True` 防止驗證後的修改，`slots=True` 將拼錯的屬性指派轉為 `AttributeError` 而非無聲無息地建立新屬性，而 `kw_only=True` 則消除了位置參數的調換。三個旗標，關閉了三個危害類別。

## 動作步驟，情境管理員

任何取得／釋放的配對都應放入情境管理員（context manager）中。切勿將 `open()`/`close()` 作為獨立的公開方法暴露：錯誤路徑將會洩漏，而且往往只在高負載下顯現。

```python
from contextlib import contextmanager

@contextmanager
def transaction(conn):
    tx = conn.begin()
    try:
        yield tx
        tx.commit()
    except Exception:
        tx.rollback()
        raise          # 重新引發：在此吞噬錯誤將會是 X1
```

## 每次都值得檢查的 Python 特定陷阱

- **可變預設引數**：`def f(items=[])` 會在每次呼叫之間共享同一個清單。使用 `None` 並在函式內部建構。由 ruff `B006` 捕捉。
- **裸露的 `except:`** 也會捕捉到 `KeyboardInterrupt` 和 `SystemExit`。由 `E722` 捕捉。
- **使用 `assert` 進行驗證** 在 `python -O` 下會被去除。絕不要將其用於任何攸關安全性或正確性的關鍵邏輯；請改用 raise。
- **簡易 `datetime.now()`**：使用 `datetime.now(timezone.utc)`，並注入時鐘以便測試時間。由 ruff `DTZ` 捕捉。
- **以浮點數表示金錢**：使用 `int` 美分或 `decimal.Decimal`，絕不要使用 `float`。
- **字串與整數上的 `==` 與 `is`** 因駐留機制（interning）而偶然正常運作，但在正式環境處理較長的值時會損毀。由 `F632` 捕捉。
- **`asyncio.create_task` 未保留參照**：任務可能在執行途中被記憶體回收，導致工作無聲無息地未被執行。由 ruff `RUF006` 捕捉。

## 屬於防呆（poka-yoke）的 Ruff 規則集

程式碼風格規則不是防呆設計；這些規則才是，這也是為什麼 `E` 僅以其呈現錯誤特徵的子集出現而非全部。以錯誤等級選取：

```toml
[tool.ruff.lint]
select = [
  "F",                 # pyflakes：未定義的名稱、未使用的匯入
  "E4", "E7", "E9",    # pycodestyle 具錯誤特徵的規則：裸露 except、`== None`、語法錯誤
  "B",                 # bugbear：可變預設值、迴圈變數捕捉、對元組進行 assert
  "S",                 # bandit：硬式編碼的密鑰、不安全的身分處理常式/子行程、弱密碼編譯
  "DTZ",               # 簡易日期時間
  "ASYNC",             # 非同步函式內部的阻塞呼叫
  "RUF006",            # 懸空的 asyncio 任務
  "PLE",               # pylint 錯誤：僅限真正的錯誤
  "T20",               # 散落的 print/pprint
]
```

## 已知限制

- **型別註解在執行階段不具強制約束力。** 任何跨越邊界或可從未檢查程式碼觸達的內容，都需要真正的執行階段剖析。Pydantic 是你獲得控制（Control）的途徑；單靠 mypy 只能讓你對 mypy 實際檢查的程式碼獲得控制。
- **`Any` 具傳染性**，且未標註型別的相依套件會悄悄將其重新引入。設定 `disallow_any_unimported` 與 `warn_return_any`；審查 `# type: ignore` 註解並要求每條註解都附帶理由。
- **沒有仿射型別（affine types）**，因此無法防止關閉後使用（use-after-close）；情境管理員是解決之道。
- **猴子補丁（Monkey-patching）意味著沒有任何封裝是絕對的。** 將真正必須維持的不變量推入資料庫，而不是推入類別。
