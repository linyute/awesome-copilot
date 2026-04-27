---
description: '遵循慣用 Go 實踐與社群標準撰寫 Go 程式碼的指令'
applyTo: '**/*.go,**/go.mod,**/go.sum'
---

# Go 開發指令

在撰寫 Go 程式碼時，請遵循慣用 Go 實踐與社群標準。這些指令基於 [Effective Go](https://go.dev/doc/effective_go)、[Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) 與 [Google's Go Style Guide](https://google.github.io/styleguide/go/)。

## 一般指令

- 撰寫簡單、清晰且具備慣用風格的 Go 程式碼
- 偏好清晰與簡單，勝過聰明但複雜的實作
- 遵循「最小驚訝原則」 (principle of least surprise)
- 保持成功路徑靠左對齊 (最小化縮排)
- 儘早 return 以減少巢狀結構
- 偏好儘早 return 而非 if-else 鏈；使用 `if condition { return }` 模式以避免 else 區塊
- 讓零值 (zero value) 有意義
- 撰寫具備清晰、描述性名稱的自解釋程式碼
- 為導出的型別、函式、方法與套件編寫文件
- 使用 Go modules 進行相依性管理
- 利用 Go 標準函式庫，而非重複造輪子 (例如使用 `strings.Builder` 進行字串串接，`filepath.Join` 進行路徑建構)
- 當功能存在時，優先使用標準函式庫解決方案，而非自訂實作
- 預設以英文撰寫註解；僅在使用者要求時才翻譯
- 避免在程式碼與註解中使用 Emoji

## 命名慣例

### 套件 (Packages)

- 使用小寫、單字作為套件名稱
- 避免底線、連字號或 mixedCaps
- 選擇描述套件提供什麼功能的名稱，而非包含什麼內容
- 避免使用如 `util`, `common` 或 `base` 等泛型名稱
- 套件名稱應為單數，而非複數

#### 套件宣告規則 (關鍵)：
- **永遠不要重複 `package` 宣告** - 每個 Go 檔案必須僅有一行 `package`
- 編輯既有的 `.go` 檔案時：
  - **保留** 現有的 `package` 宣告 — 不要新增另一行
  - 若需替換整個檔案內容，請以現有的套件名稱開始
- 建立新的 `.go` 檔案時：
  - **在寫任何程式碼之前**，檢查同一目錄下的其他 `.go` 檔案使用什麼套件名稱
  - 使用與該目錄下既有檔案 **相同** 的套件名稱
  - 若為新目錄，請使用目錄名稱作為套件名稱
  - 在檔案最頂端寫下 **確切的一行** `package <name>`
- 使用檔案建立或替換工具時：
  - **永遠驗證** 目標檔案在新增前是否已存在 `package` 宣告
  - 若替換檔案內容，新內容中僅包含一行 `package` 宣告
  - **永遠不要** 建立包含多行 `package` 或重複宣告的檔案

### 變數與函式

- 使用 mixedCaps 或 MixedCaps (camelCase)，而非底線
- 名稱應簡短但具描述性
- 僅在極短範圍 (如迴圈索引) 使用單字母變數
- 導出名稱以大寫字母開頭
- 非導出名稱以小寫字母開頭
- 避免結巴 (例如：避免 `http.HTTPServer`，偏好 `http.Server`)

### 介面 (Interfaces)

- 可能時，介面名稱以 -er 為後綴 (例如 `Reader`, `Writer`, `Formatter`)
- 單一方法介面應以該方法命名 (例如 `Read` → `Reader`)
- 保持介面簡短且聚焦

### 常數 (Constants)

- 導出常數使用 MixedCaps
- 非導出常數使用 mixedCaps
- 使用 `const` 區塊將相關常數分組
- 考慮使用具型別常數以提升型別安全

## 程式碼風格與格式化

### 格式化

- 永遠使用 `gofmt` 格式化程式碼
- 使用 `goimports` 自動管理匯入
- 保持合理的行長 (無硬性限制，但請考量可讀性)
- 新增空行以區隔邏輯程式碼群組

### 註解 (Comments)

- 追求自解釋程式碼；偏好清晰的變數名稱、函式名稱與程式碼結構，勝過註解
- 僅在必要時撰寫註解以解釋複雜邏輯、業務規則或非明顯行為
- 預設以英文撰寫完整句子的註解
- 僅在使用者明確要求時才將註解翻譯為其他語言
- 句子以描述事物的名稱作為開頭
- 套件註解應以 "Package [name]" 開頭
- 大多數註解使用行註解 (`//`)
- 區塊註解 (`/* */`) 應節制使用，主要用於套件文件
- 紀錄「為什麼」 (why)，而非「是什麼」 (what)，除非「是什麼」本身很複雜
- 避免在註解與程式碼中使用 Emoji

### 錯誤處理

- 函式呼叫後請立即檢查錯誤
- 除非有充分理由 (請註明理由)，否則不要使用 `_` 忽略錯誤
- 使用 `fmt.Errorf` 搭配 `%w` 動詞包裝帶有 Context 的錯誤
- 當需要檢查特定錯誤時，建立自訂錯誤型別
- 將錯誤回傳值置於最後一個回傳值
- 錯誤變數名稱請命名為 `err`
- 錯誤訊息應保持小寫，且結尾不加標點符號

## 架構與專案結構

### 套件組織

- 遵循標準 Go 專案佈局慣例
- `main` 套件置於 `cmd/` 目錄
- 可重複使用套件置於 `pkg/` 或 `internal/`
- 使用 `internal/` 放置不應被外部專案匯入的套件
- 將相關功能分組至套件
- 避免循環相依

### 相依性管理

- 使用 Go modules (`go.mod` 與 `go.sum`)
- 保持相依性最簡化
- 定期更新相依性以取得安全性修正
- 使用 `go mod tidy` 清理未使用的相依性
- 僅在必要時使用 vendor 相依性

## 型別安全與語言特性

### 型別定義

- 定義型別以增加意義與型別安全
- 使用結構標籤 (struct tags) 進行 JSON, XML, 資料庫對應
- 偏好顯式型別轉換
- 謹慎使用型別斷言 (type assertions) 並檢查第二個回傳值
- 偏好泛型勝過非約束型別；若確實需要無約束型別，請使用預宣告別名 `any` 而非 `interface{}` (Go 1.18+)

### 指標 vs 值 (Pointers vs Values)

- 大型結構或需要修改接收者時，使用指標接收者 (pointer receivers)
- 小型結構或需要不可變時，使用值接收者 (value receivers)
- 需要修改引數或大型結構時，使用指標參數
- 小型結構或希望防止修改時，使用值參數
- 於型別的方法集中保持一致
- 選擇指標 vs 值接收者時，請考量零值

### 介面與組合 (Interfaces and Composition)

- 接受介面，回傳具體型別
- 保持介面簡短 (1-3 個方法為理想)
- 使用嵌入 (embedding) 進行組合
- 介面定義應靠近其使用處，而非實作處
- 除非必要，否則不要匯出介面

## 並行處理 (Concurrency)

### Goroutines

- 在函式庫中建立 Goroutine 請務必謹慎；偏好由呼叫者控制並行
- 若必須在函式庫中建立 Goroutine，請提供清晰的文件與清理機制
- 永遠清楚 Goroutine 將如何退出
- 使用 `sync.WaitGroup` 或 Channel 等待 Goroutine
- 確保清理以避免 Goroutine 洩漏

### Channels

- 使用 Channel 在 Goroutine 間溝通
- 不要透過共享記憶體溝通；應透過溝通共享記憶體
- 由發送端關閉 Channel，而非接收端
- 了解容量時使用緩衝 Channel
- 使用 `select` 進行非阻塞操作

### 同步 (Synchronization)

- 使用 `sync.Mutex` 保護共享狀態
- 保持臨界區段 (critical sections) 簡短
- 當有許多讀取者時，使用 `sync.RWMutex`
- 根據使用情境選擇 Channel 或 Mutex：使用 Channel 溝通，使用 Mutex 保護狀態
- 使用 `sync.Once` 進行一次性初始化
- WaitGroup 使用方式依 Go 版本而定：
	- 若 `go.mod` 中 `go >= 1.25`，請使用新的 `WaitGroup.Go` 方法 ([文件](https://pkg.go.dev/sync#WaitGroup))：
		```go
		var wg sync.WaitGroup
		wg.Go(task1)
		wg.Go(task2)
		wg.Wait()
		```
	- 若 `go < 1.25`，請使用經典的 `Add`/`Done` 模式

## 錯誤處理模式

### 建立錯誤

- 簡單靜態錯誤使用 `errors.New`
- 動態錯誤使用 `fmt.Errorf`
- 針對領域特定錯誤建立自訂錯誤型別
- 匯出錯誤變數做為 sentinel 錯誤
- 錯誤檢查使用 `errors.Is` 與 `errors.As`

### 錯誤傳播

- 在堆疊傳播錯誤時新增 Context
- 不要同時記錄與回傳錯誤 (擇一即可)
- 在適當層級處理錯誤
- 考慮使用結構化錯誤以利偵錯

## API 設計

### HTTP 處理常式 (Handlers)

- 簡單處理常式使用 `http.HandlerFunc`
- 需要狀態的處理常式實作 `http.Handler`
- 使用 Middleware 處理跨領域關注點 (cross-cutting concerns)
- 設定適當的狀態碼與 Header
- 優雅處理錯誤並回傳適當錯誤回應
- 路由使用方式依 Go 版本而定：
	- 若 `go >= 1.22`，偏好增強型 `net/http` `ServeMux` 搭配模式路由與方法比對
	- 若 `go < 1.22`，使用經典 `ServeMux` 並手動處理方法/路徑 (或在合理情況下使用第三方路由器)

### JSON APIs

- 使用結構標籤控制 JSON 編組 (marshaling)
- 驗證輸入資料
- 針對可選欄位使用指標
- 考慮使用 `json.RawMessage` 進行延遲解析
- 適當處理 JSON 錯誤

### HTTP 客戶端

- 客戶端結構應僅聚焦於設定與相依性 (例如基礎 URL, `*http.Client`, 驗證, 預設 Header)。絕對不要儲存任何個別請求狀態
- 不要在客戶端結構內儲存或快取 `*http.Request`，且不要在跨呼叫間持久化請求特定狀態；請在每次方法呼叫中建構全新的請求
- 方法應接受 `context.Context` 與輸入參數，於本地組裝 `*http.Request` (或透過每次呼叫建立的短暫 Builder/協助程式)，然後呼叫 `c.httpClient.Do(req)`
- 若重複使用請求建構邏輯，請將其分解為非導出協助函式或每次呼叫的 Builder 型別；永遠不要將 `http.Request` (URL 參數, 主體, Header) 作為欄位保存在長執行的客戶端中
- 確保基礎 `*http.Client` 已設定 (逾時, 傳輸) 且可安全並行使用；避免在第一次使用後變更 `Transport`
- 務必在發送的請求執行個體上設定 Header，並關閉回應主體 (`defer resp.Body.Close()`)，並正確處理錯誤

## 效能優化

### 記憶體管理

- 最小化 Hot path 中的配置
- 可能時重複使用物件 (考慮 `sync.Pool`)
- 小型結構使用值接收者
- 大小已知時預先配置 Slice
- 避免不必要的字串轉換

### I/O：讀取器與緩衝區 (Readers and Buffers)

- 多數 `io.Reader` 串流僅能消耗一次；讀取會變更狀態。除非具備特殊處理，否則不要假設讀取器可重複讀取
- 若必須多次讀取資料，請緩衝一次並依需求重新建立讀取器：
	- 使用 `io.ReadAll` (或限制讀取) 取得 `[]byte`，然後為每次重複使用建立全新的讀取器 (`bytes.NewReader(buf)` 或 `bytes.NewBuffer(buf)`)
	- 針對字串，使用 `strings.NewReader(s)`；你可以在 `*bytes.Reader` 上使用 `Seek(0, io.SeekStart)` 進行重繞
- 針對 HTTP 請求，不要重複使用已消耗的 `req.Body`。反之：
	- 將原始酬載保持為 `[]byte`，並在每次發送前設定 `req.Body = io.NopCloser(bytes.NewReader(buf))`
	- 優先設定 `req.GetBody` 以便傳輸層可為重定向/重試重建主體：`req.GetBody = func() (io.ReadCloser, error) { return io.NopCloser(bytes.NewReader(buf)), nil }`
- 若要在讀取時複製串流，請使用 `io.TeeReader` (複製到緩衝區的同時通過) 或使用 `io.MultiWriter` 寫入多個接收器
- 重複使用緩衝讀取器：呼叫 `(*bufio.Reader).Reset(r)` 以附加至新的基礎讀取器；除非來源支援搜尋，否則不要期望它能「重繞」
- 針對大型酬載，避免無限制緩衝；考慮串流、`io.LimitReader` 或磁碟臨時儲存以控制記憶體

- 使用 `io.Pipe` 進行串流而不緩衝整個酬載：
	- 在讀取器消耗時，於獨立的 Goroutine 中寫入 `*io.PipeWriter`
	- 永遠關閉寫入器；失敗時使用 `CloseWithError(err)`
	- `io.Pipe` 適用於串流，而非重繞或重複使用讀取器

- **警告**：使用 `io.Pipe` (特別是搭配 multipart 寫入器) 時，所有寫入必須嚴格順序執行。不要並行或亂序寫入 — 必須保留 multipart 邊界與區塊順序。亂序或平行寫入會損毀串流並導致錯誤。

- 使用 `io.Pipe` 串流 multipart/form-data：
	- `pr, pw := io.Pipe()`; `mw := multipart.NewWriter(pw)`; 使用 `pr` 作為 HTTP 請求主體
	- 設定 `Content-Type` 為 `mw.FormDataContentType()`
	- 在 Goroutine 中：以正確順序將所有部分寫入 `mw`；失敗時 `pw.CloseWithError(err)`；成功時 `mw.Close()` 然後 `pw.Close()`
	- 不要在長執行的客戶端上儲存請求/傳輸中的表單狀態；請依呼叫建構
	- 串流主體不可重繞；針對重試/重定向，請緩衝小型酬載或提供 `GetBody`

### 效能剖析 (Profiling)

- 使用內建剖析工具 (`pprof`)
- 基準測試關鍵程式碼路徑
- 優化前先進行剖析
- 優先聚焦於演算法改進
- 考慮使用 `testing.B` 進行基準測試

## 測試 (Testing)

### 測試組織

- 將測試保持在相同套件中 (白箱測試)
- 使用 `_test` 套件後綴進行黑箱測試
- 測試檔案名稱使用 `_test.go` 後綴
- 將測試檔案放置於受測試程式碼旁

### 撰寫測試

- 針對多個測試情境使用表格驅動測試 (table-driven tests)
- 使用 `Test_functionName_scenario` 描述性地命名測試
- 使用 `t.Run` 進行子測試以增進組織
- 測試成功與失敗情境
- 考慮在價值顯著時使用 `testify` 或類似函式庫，但不要過度複雜化簡單測試

### 測試協助程式

- 標記協助函式為 `t.Helper()`
- 為複雜設定建立測試夾具 (test fixtures)
- 針對測試與基準測試中使用的函式使用 `testing.TB` 介面
- 使用 `t.Cleanup()` 清理資源

## 安全性最佳實務

### 輸入驗證

- 驗證所有外部輸入
- 使用強型別防止無效狀態
- 在 SQL 查詢中使用前清理資料
- 小心使用者輸入的檔案路徑
- 針對不同 Context (HTML, SQL, Shell) 驗證並跳脫資料

### 密碼學

- 使用標準函式庫 crypto 套件
- 不要自行實作密碼學
- 使用 crypto/rand 進行隨機數生成
- 使用 bcrypt, scrypt 或 argon2 儲存密碼 (考慮使用 golang.org/x/crypto 取得額外選項)
- 網路通訊使用 TLS

## 文件編寫

### 程式碼文件

- 透過清晰的命名與結構，優先追求自解釋程式碼
- 使用清晰、簡潔的解釋紀錄所有導出符號
- 文件說明以符號名稱開頭
- 預設以英文撰寫文件
- 若有助益，請在文件中加入範例
- 文件應儘可能靠近程式碼
- 程式碼變更時請更新文件
- 避免在文件與註解中使用 Emoji

### README 與文件檔案

- 包含清晰的設定指令
- 紀錄相依性與需求
- 提供使用範例
- 紀錄設定選項
- 包含疑難排解區段

## 工具與開發工作流程

### 必要工具

- `go fmt`: 格式化程式碼
- `go vet`: 尋找可疑建構
- `golangci-lint`: 額外 Linting (golint 已被棄用)
- `go test`: 執行測試
- `go mod`: 管理相依性
- `go generate`: 程式碼生成

### 開發實務

- 提交前執行測試
- 使用 Pre-commit Hook 進行格式化與 Linting
- 保持 Commit 聚焦且具原子性
- 撰寫具意義的 Commit 訊息
- 提交前審查 Diff

## 常見陷阱 (Pitfalls)

- 未檢查錯誤
- 忽略競爭條件
- 建立 Goroutine 洩漏
- 未使用 defer 進行清理
- 並行修改 Map
- 未理解 nil 介面 vs nil 指標
- 忘記關閉資源 (檔案、連線)
- 不必要地使用全域變數
- 過度使用無約束型別 (例如 `any`)；偏好特定型別或具約束的泛型型別參數。若確實需要無約束型別，請使用 `any` 而非 `interface{}`
- 未考量型別的零值
- **建立重複的 `package` 宣告** - 這是編譯錯誤；在新增套件宣告前務必檢查既有檔案
