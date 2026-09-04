# Rust 與 Go 裝置

處於表達能力光譜兩端的兩種語言。Rust 幾乎可以在型別中編碼任何不變量；Go 則刻意無法做到，因此其裝置仰賴慣例加上工具支援。在提出裝置之前，先清楚了解你處於哪種語言環境。

---

# Rust

Rust 的型別系統比任何其他主流語言能針對更多的危害類別達到控制（Control）。
仿射型別系統（affine type system）特別是主流語言中對移動後使用（use-after-move）唯一的解法，且它將關閉後使用（use-after-close）轉變為編譯錯誤而非慣例 — 在 Python 擁有情境管理員、TypeScript 擁有範圍繫結回呼，以及 Go 擁有 `defer` 的地方，Rust 擁有編譯器。

## 接觸，新類型（newtypes）與智慧建構函式

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(Uuid);

#[derive(Debug, Clone)]
pub struct Email(String);

impl Email {
    // 建立 Email 的唯一途徑。私有欄位意味著無法繞過，
    // 若放在模組邊界後方，即使在 crate 內部也無法繞過。
    pub fn parse(s: &str) -> Result<Self, InvalidEmail> {
        if !s.contains('@') { return Err(InvalidEmail); }
        Ok(Email(s.to_owned()))
    }
    pub fn as_str(&self) -> &str { &self.0 }
}
```

私有欄位加上可能失敗的建構函式意味著擁有 `Email` 本身*就是*驗證的證明。這是任何地方所能獲得最強大形式的「剖析，而非驗證（parse-don't-validate）」。

## 接觸，列舉使非法狀態無法表示

```rust
// 每個變體僅攜帶該變體所擁有的精確資料。
// 不存在「帶有錯誤的成功」，因為根本無法寫出這種情況。
pub enum JobState {
    Queued { enqueued_at: DateTime<Utc> },
    Running { started_at: DateTime<Utc>, worker: WorkerId },
    Succeeded { output: Output },
    Failed { error: JobError, retries: u32 },
}
```

沒有萬用分支的 `match` 預設具備窮舉性，新增變體會在所有必須更新的地方破壞建置。正因如此，領域邏輯中應避免使用 `_ => {}` 分支：萬用萬能分支正是兩個版本之後將編譯錯誤轉變為無聲落入（fallthrough）的元兇。

## 動作步驟，型別狀態（typestate）

所有權讓型別狀態（typestate）變得真正實用，因為每次轉移都會消耗舊狀態：

```rust
pub struct Draft;
pub struct Validated;

pub struct Order<S> { items: Vec<Item>, _state: PhantomData<S> }

impl Order<Draft> {
    pub fn validate(self) -> Result<Order<Validated>, ValidationError> { /* … */ }
}

impl Order<Validated> {
    // Order<Draft> 上根本不存在 submit()。不是「回傳錯誤」，而是根本不存在。
    pub fn submit(self) -> Result<OrderId, SubmitError> { /* … */ }
}
```

被消耗的 `self` 意味著草稿在驗證後就已消失，因此過期未驗證的複本隨後無法被提交。

## 固定值，讓錯誤無法被忽略

`Result` 上內建了 `#[must_use]`；在你自己的型別中，如果丟棄該值屬於錯誤，也請加上它。然後設定 lint：

```toml
[workspace.lints.clippy]
unwrap_used = "deny"
expect_used = "warn"          # 在測試與啟動階段允許，但需附帶理由
panic = "deny"
indexing_slicing = "deny"     # 強制使用 .get() 與真實分支
float_cmp = "deny"
arithmetic_side_effects = "warn"  # 在溢位關係重大的地方強制使用 checked_/saturating_
todo = "deny"
dbg_macro = "deny"
```

`unwrap_used = "deny"` 是該區塊中價值最高的一行：它將每個「這不可能失敗」的假設轉化為審查時的明確決策。

## Rust 限制

- **`unsafe` 與 `unwrap` 是脫逃通道。** 透過 lint 拒絕兩者，並要求每個 `unsafe` 區塊都附帶 `// SAFETY:` 註解。
- **僅限編譯期。** 反序列化的輸入仍需搭配帶有 `deny_unknown_fields` 的 `serde`。
- **Panic 會繞過型別系統。** 會引發 panic 的裝置屬於警告（Warning），而非控制（Control）。
- **型別狀態具有實際的人體工學成本。** 將其保留給真正危險的序列：付款、資源生命週期、協定狀態，而不是用於每個 builder。

---

# Go

Go 在設計上拒絕了大部分編譯期表達能力。因此它的裝置較少，工具加上資料層條件約束承擔了更多負載。提出裝置時請坦誠說明這一點，此處通常無法達到控制（Control），假裝做得到比承認所處階梯更糟。

## 接觸，定義型別

```go
type UserID string
type OrderID string

func Transfer(from, to UserID) error { ... }
// Transfer(orderID, userID)，編譯錯誤，因為這些是定義型別（defined types），而非別名（aliases）。
```

使用 `type X string`（定義型別），切勿使用 `type X = string`（別名，它什麼好處都無法提供）。這是 Go 所提供唯一真正的控制（Control）階梯接觸裝置，卻常常未被充分利用。

## 接觸，以函數式選項取代布林旗標

```go
type Option func(*Config)

func WithTimeout(d time.Duration) Option { return func(c *Config) { c.Timeout = d } }
func WithRetries(n int) Option           { return func(c *Config) { c.Retries = n } }

func New(addr string, opts ...Option) (*Client, error) { ... }
```

每個選項在呼叫處都有明確具名，`time.Duration` 在型別中帶有單位，且日後新增選項不會破壞呼叫者。這同時消除了布林旗標危害與隱含單位危害。

## 動作步驟，建構函式與 defer

```go
func NewClient(addr string) (*Client, error) {
    // 回傳時已完全就緒。沒有可供遺忘的 Connect()。
}

conn, err := pool.Acquire(ctx)
if err != nil { return err }
defer conn.Release()   // 永遠放在取得資源後的下一行
```

在取得資源後立即放置 `defer`，位於任何其他陳述式之前。兩者之間的任何程式碼都是錯誤路徑上的洩漏。

## 固定值，窮舉性

Go 沒有窮舉式的 switch。請使用 linter：

```yaml
# .golangci.yml
version: "2"

linters:
  enable:
    - errcheck      # 未檢查的錯誤：Go 最具價值的單一 linter
    - exhaustive    # 具型別常數的非窮舉 switch
    - bodyclose     # 未關閉的 HTTP 回應主體
    - rowserrcheck  # 未檢查的 sql.Rows.Err
    - sqlclosecheck
    - contextcheck  # 未傳遞 context
    - nilerr        # 在非 nil 錯誤後回傳 nil
    - noctx         # 沒有 context 的 HTTP 請求
    - gosec
  settings:
    exhaustive:
      default-signifies-exhaustive: false
```

這是 v2 結構描述。golangci-lint v2 會拒絕針對 v1 檔案執行，而不是忽略它不再理解的部分，因此在升級前請先針對現有設定執行 `golangci-lint migrate`。

`errcheck` 是不可妥協的，沒有它，Go 的錯誤慣例完全是自由心證，而 `_ = doSomething()` 正是資料遺失潛入 Go 程式碼庫的方式。

## Go 特定陷阱

- **Nil map** 接受讀取但在寫入時會引發 panic。請在建構函式中使用 `make` 進行建構。
- **goroutine 中的迴圈變數捕捉** 在 Go 1.22+ 中已修復，但仍存在於較舊的程式碼庫與第三方套件（vendored code）中。
- **`time.Duration` 與裸整數**：一律接受 `Duration`；絕不要接受 `int` 秒數。
- **零值是有效的**，因此缺少欄位的結構體看起來像是已初始化的。使用回傳 `(T, error)` 的建構函式搭配未匯出欄位來強制執行。
- **Slice 共享底層陣列**，對子切片進行 `append` 可能會修改原始切片。傳出切片時請使用三索引切片操作 `s[a:b:b]`。
- **跨呼叫邊界遺失 `context.Context`** 會無聲無息地停用取消與逾時功能。`contextcheck` 可以捕捉到這一點。

## Go 限制

Go 無法表達：窮舉比對、不可為空的參照、不可變性、型別狀態，或足以表達單位的豐富泛型條件約束。其控制（Control）階梯裝置實質上就是定義型別、帶有建構函式的未匯出欄位，以及資料庫結構描述。

實際的結果：在 Go 中，**將更多不變量推入資料庫並納入必要的 CI 檢查**，其程度高於 Rust 或 TypeScript。`NOT NULL`、`CHECK` 與唯一條件約束正在承擔該語言所拒絕做的工作，而將 `golangci-lint` 作為必要檢查則是維持其餘部分的基石。
