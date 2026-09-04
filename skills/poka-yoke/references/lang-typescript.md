# TypeScript / JavaScript 裝置

型別系統能夠強制執行與無法強制執行的內容，以及幫助你達到控制（Control）的結構。

**先決條件**：若沒有在 tsconfig 中開啟 `strict: true` 並將 `tsc --noEmit` 設為*必要*的 CI 檢查，這一切都無法承載負載。在 CI 中不進行型別檢查的儲存庫裡，品牌化型別（branded type）充其量只是註解。從這裡開始。

另外請啟用 `noUncheckedIndexedAccess`（陣列存取會回傳 `T | undefined`，這才是真實情況）以及 `exactOptionalPropertyTypes`。兩者都能捕捉到單靠 `strict` 所遺漏的真實失誤。

## 接觸，品牌化型別（branded types）

TypeScript 是結構化型別（structurally typed），因此 `type UserId = string` 給不了你任何保障。品牌化（Branding）新增了一個僅存在於編譯期的幽靈屬性：

```ts
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type UserId = Brand<string, "UserId">;
export type OrderId = Brand<string, "OrderId">;

export const UserId = (s: string): UserId => s as UserId;

// transfer(orderId, userId) 現在會產生編譯錯誤
declare function transfer(from: UserId, to: UserId): void;
```

執行階段零成本，無需包裝物件。當字串具備值得檢查的形狀時，將建構函式與驗證結合，它就會變成剖析（如下所述）而非強制轉型。

## 接觸，剖析，而非驗證（parse, don't validate）

```ts
import { z } from "zod";

const Email = z.string().email().brand<"Email">();
export type Email = z.infer<typeof Email>;

// 在邊界處，且僅在此處：
const parsed = Email.safeParse(req.body.email);
if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });

sendWelcome(parsed.data); // sendWelcome(to: Email) 無法接收未經驗證的字串
```

Zod 的 `.brand()` 在單一步驟中組合了驗證與品牌化，這是最理想的形式：除了使用 `as` 強制轉型之外，獲得 `Email` 的唯一途徑就是成功剖析一個，這也是為什麼針對 `as unknown as T` 的 lint 是裝置的一部分，而非風格偏好。

應用於每個邊界：HTTP 處理常式、佇列取用者、`process.env`、第三方回應、檔案讀取。`JSON.parse` 回傳 `any`，而 `any` 正是保證消逝殆盡的地方。

## 接觸，標記聯集優於一袋選用欄位

```ts
// 允許「帶有錯誤的成功」、「載入中且有資料」，但只有三種組合是真實存在的
type Result = { status: string; data?: User; error?: Error };

// 僅允許確切存在的狀態
type Result =
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };
```

第二個版本讓 `result.data` 在你限縮至 `"success"` 之前無法被存取，因此檢查不可能被遺忘：編譯器會要求你進行檢查。

## 固定值，窮舉性

```ts
function assertNever(x: never): never {
  throw new Error(`未處理的變體：${JSON.stringify(x)}`);
}

switch (result.status) {
  case "loading": return spinner();
  case "success": return view(result.data);
  case "error":   return errorView(result.error);
  default:        return assertNever(result);
}
```

新增變體現在會在每個必須變更的 switch 處中斷建置。透過 `@typescript-eslint/switch-exhaustiveness-check` 在整個儲存庫中強制落實。這是該語言中最便宜且高價值的裝置：每個 switch 僅需一行。

## 動作步驟，建構器（builders）與型別狀態（typestate）

在型別中對必要步驟進行編碼，使得 `.delete()` 在這些步驟執行前根本不存在：

```ts
class QueryBuilder<HasFrom extends boolean = false, HasWhere extends boolean = false> {
  from(t: string): QueryBuilder<true, HasWhere> { /* … */ }
  where(c: Cond): QueryBuilder<HasFrom, true> { /* … */ }

  // 唯有兩者皆設定後才可呼叫
  delete(this: QueryBuilder<true, true>): string { /* … */ }
}
```

`this` 參數是關鍵技巧：它約束了方法存在於哪些執行個體上。這使「沒有 where 子句的刪除」成為編譯錯誤而非生產事故。

## 動作步驟，必要的等冪性

```ts
// 選用索引鍵 = 建議。必要索引鍵 = 裝置。
function charge(account: AccountId, amount: Money, idempotencyKey: IdempotencyKey): Promise<Charge>
```

在背後搭配 `(account_id, idempotency_key)` 上的唯一索引，讓第二次嘗試由資料庫拒絕，而非由可能被略過的應用程式邏輯來拒絕。

## 真正屬於防呆（poka-yoke）的 Lint 規則

程式碼風格規則不是防呆設計。這些規則才是，請將每一項都設為 `error`：

| 規則 | 預防的失誤 |
|---|---|
| `@typescript-eslint/no-floating-promises` | 從未被 await 且無聲無息遺失的寫入操作 |
| `@typescript-eslint/no-misused-promises` | 在預期同步之處傳遞了非同步函式 |
| `@typescript-eslint/switch-exhaustiveness-check` | 新列舉變體無聲無息未被處理 |
| `@typescript-eslint/no-unnecessary-condition` | 永遠為真的檢查，通常是真實的錯誤 |
| `@typescript-eslint/no-explicit-any` | 型別保證被無聲無息地停用 |
| `@typescript-eslint/no-unsafe-assignment` / `-return` / `-argument` | 從無型別標註的函式庫中洩漏出的 `any` |
| `no-empty`（搭配 `allowEmptyCatch: false`） | 空的 catch 區塊 |
| `eqeqeq` | `==` 強制轉型引發的出乎意料狀況 |
| `require-atomic-updates` | 跨越 `await` 的讀取-修改-寫入競爭條件 |
| `no-restricted-syntax` 針對 `it.only` / `describe.only` | 聚焦測試導致測試套件的其餘部分被停用 |

`no-empty` 只能看見空白區塊：包含註解的 catch，或是記錄日誌後繼續執行的 catch，都會吞噬錯誤並通過 lint。捕捉該形式屬於程式碼審查的工作。

## 已知限制

- **無執行階段強制約束。** 型別在編譯期即消逝。任何跨越邊界的內容都需要執行階段結構描述，而任何可從無型別標註 JavaScript 觸達的內容都需要執行階段檢查。
- **結構化型別** 意味著每個不同的概念都需要明確的品牌化標記；編譯器不會替你區分它們。
- **`as` 轉型是未經檢查的。** 將它們限制在剖析函式內部，並在其他任何地方針對 `as unknown as T` 設置 lint。
- **沒有仿射型別（affine types）**，因此無法防止移動後使用與關閉後使用；範圍繫結模式（使用 `withConnection(fn)` 回呼而非 `open`/`close`）是你所能達到的最近似解法，且通常已經足夠。
