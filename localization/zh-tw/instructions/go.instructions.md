---
description: '撰寫 Go 程式碼時遵循 Go 慣例與社群標準的指引'
applyTo: '**/*.go,**/go.mod,**/go.sum'
---

# Go 開發指引

撰寫 Go 程式碼時，請遵循 Go 慣例與社群標準。本指引依據 [Effective Go](https://go.dev/doc/effective_go)、[Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) 及 [Google Go Style Guide](https://google.github.io/styleguide/go/)。

## 一般指引

- 程式碼要簡單、清楚且符合 Go 慣例
- 追求清晰與簡潔勝於炫技
- 遵循最小驚訝原則
- 讓快樂路徑左對齊（減少縮排）
- 儘早 return，減少巢狀結構
- 讓零值有意義
- 為匯出的型別、函式、方法與套件撰寫文件
- 用 Go modules 管理相依套件

## 命名慣例

### 套件

- 套件名稱用小寫單字
- 避免底線、連字號或混合大小寫
- 名稱要描述套件提供什麼，而非內容
- 避免泛用名稱如 `util`、`common`、`base`
- 套件名稱用單數

### 變數與函式

- 用 mixedCaps 或 MixedCaps（駝峰式），避免底線
- 名稱要短且具描述性
- 只在極短範圍（如 for 迴圈索引）用單字母變數
- 匯出名稱首字大寫
- 未匯出名稱首字小寫
- 避免重複（如 `http.HTTPServer`，應用 `http.Server`）

### 介面

- 介面名稱盡量用 -er 結尾（如 `Reader`、`Writer`、`Formatter`）
- 單一方法介面用方法名（如 `Read` → `Reader`）
- 介面要小且聚焦

### 常數

- 匯出常數用 MixedCaps
- 未匯出常數用 mixedCaps
- 相關常數用 `const` 區塊分組
- 建議用型別常數提升型別安全

## 程式風格與格式化

### 格式化

- 一律用 `gofmt` 格式化程式碼
- 用 `goimports` 自動管理 import
- 行長無硬性限制，但要考慮可讀性
- 用空行分隔邏輯區塊

### 註解

- 註解用完整句子
- 句首用被描述物件名稱
- 套件註解以「Package [name]」開頭
- 多用行註解（`//`）
- 區塊註解（`/* */`）僅用於套件文件
- 註解說明「為什麼」，除非「做什麼」很複雜

### 錯誤處理

- 函式呼叫後立即檢查錯誤
- 除非有充分理由（並註明原因），否則勿用 `_` 忽略錯誤
- 用 `fmt.Errorf` 搭配 `%w` 包裝錯誤
- 需檢查特定錯誤時自訂錯誤型別
- 錯誤回傳值放最後
- 錯誤變數命名為 `err`
- 錯誤訊息用小寫且不加標點

## 架構與專案結構

### 套件組織

- 遵循標準 Go 專案結構
- `main` 套件放在 `cmd/` 目錄
- 可重用套件放在 `pkg/` 或 `internal/`
- `internal/` 用於不開放外部專案引用的套件
- 相關功能分組成套件
- 避免循環相依

### 相依管理

- 用 Go modules（`go.mod`、`go.sum`）
- 相依套件要精簡
- 定期更新相依，取得安全修補
- 用 `go mod tidy` 清理未用相依
- 只有必要時才 vendor 相依

## 型別安全與語言特性

### 型別定義

- 定義型別提升意義與型別安全
- struct tag 用於 JSON、XML、資料庫對應
- 優先用明確型別轉換
- 型別斷言要小心並檢查第二回傳值

### 指標與值

- 大型 struct 或需修改 receiver 時用指標
- 小型 struct 或需不可變時用值
- 同一型別的方法集要一致
- 選擇指標或值 receiver 時要考慮零值

### 介面與組合

- 接收介面，回傳具體型別
- 介面要小（1-3 方法最佳）
- 用嵌入（embedding）做組合
- 介面定義要靠近使用處，而非實作處
- 非必要勿匯出介面

## 平行處理

### Goroutine

- 函式庫勿自行建立 goroutine，讓呼叫者控管平行處理
- 一定要知道 goroutine 如何結束
- 用 `sync.WaitGroup` 或 channel 等待 goroutine
- 避免 goroutine 洩漏，確保清理

### Channel

- 用 channel 溝通 goroutine 間資料
- 不要用共享記憶體溝通；要用溝通共享記憶體
- channel 由 sender 關閉，receiver 不關
- 已知容量時用緩衝 channel
- 非阻塞操作用 `select`

### 同步

- 用 `sync.Mutex` 保護共享狀態
- 關鍵區段要小
- 多讀者時用 `sync.RWMutex`
- 能用 channel 取代 mutex 時優先用 channel
- 單次初始化用 `sync.Once`

## 錯誤處理模式

### 建立錯誤

- 簡單靜態錯誤用 `errors.New`
- 動態錯誤用 `fmt.Errorf`
- 領域專屬錯誤自訂型別
- 匯出錯誤變數做哨兵錯誤
- 用 `errors.Is`、`errors.As` 檢查錯誤

### 錯誤傳遞

- 傳遞錯誤時加上 context
- 不要同時 log 與回傳錯誤（二選一）
- 在適當層級處理錯誤
- 可用結構化錯誤提升除錯

## API 設計

### HTTP 處理器

- 簡單處理器用 `http.HandlerFunc`
- 需狀態時實作 `http.Handler`
- 橫切關注用 middleware
- 設定正確狀態碼與 header
- 錯誤要妥善處理並回傳適當錯誤回應

### JSON API

- 用 struct tag 控制 JSON 編碼
- 驗證輸入資料
- 選用欄位用指標
- 延遲解析可用 `json.RawMessage`
- 妥善處理 JSON 錯誤

## 效能最佳化

### 記憶體管理

- 熱點路徑減少配置
- 可重用物件時用（考慮 `sync.Pool`）
- 小型 struct 用值 receiver
- 已知大小時預先配置 slice
- 避免不必要的字串轉換

### 分析

- 用內建分析工具（`pprof`）
- 針對關鍵路徑做效能測試
- 先分析再優化
- 優先考慮演算法改進
- 用 `testing.B` 做效能測試

## 測試

### 測試組織

- 測試與程式碼同套件（白箱測試）
- 黑箱測試用 `_test` 套件後綴
- 測試檔名用 `_test.go` 結尾
- 測試檔案放在被測程式碼旁

### 撰寫測試

- 多測試案例用表格驅動測試
- 測試命名用 `Test_functionName_scenario`
- 用 `t.Run` 實作子測試，組織更佳
- 成功與錯誤案例都要測
- `testify` 等函式庫請酌量使用

### 測試輔助

- 輔助函式用 `t.Helper()` 標記
- 複雜設定用測試 fixture
- 測試與效能測試用 `testing.TB` 介面
- 用 `t.Cleanup()` 清理資源

## 安全最佳實踐

### 輸入驗證

- 驗證所有外部輸入
- 用強型別防止無效狀態
- SQL 查詢前先清理資料
- 使用者輸入的檔案路徑要小心
- 依不同情境（HTML、SQL、shell）驗證與跳脫資料

### 加密

- 用標準函式庫加密套件
- 勿自行實作加密
- 隨機數用 crypto/rand
- 密碼用 bcrypt 或類似方式儲存
- 網路通訊用 TLS

## 文件

### 程式碼文件

- 所有匯出符號都要有文件
- 文件開頭用符號名稱
- 文件中適時加入範例
- 文件要靠近程式碼
- 程式碼變更時同步更新文件

### README 與文件檔案

- 包含清楚的安裝說明
- 文件化相依套件與需求
- 提供使用範例
- 文件化設定選項
- 包含疑難排解區段

## 工具與開發流程

### 必備工具

- `go fmt`：格式化程式碼
- `go vet`：偵測可疑結構
- `golint` 或 `golangci-lint`：額外 lint
- `go test`：執行測試
- `go mod`：管理相依
- `go generate`：程式碼產生器

### 開發實踐

- 提交前先執行測試
- 用 pre-commit hook 格式化與 lint
- commit 要聚焦且原子化
- commit 訊息要有意義
- 提交前檢查 diff

## 常見陷阱

- 未檢查錯誤
- 忽略競爭條件
- goroutine 洩漏
- 未用 defer 清理
- map 並發修改
- 不理解 nil 介面與 nil 指標
- 忘記關閉資源（檔案、連線）
- 不必要用全域變數
- 過度使用空介面（`interface{}`）
- 忽略型別零值
