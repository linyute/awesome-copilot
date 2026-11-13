---
description: 'Ruby on Rails 編碼慣例與指引'
applyTo: '**/*.rb'
---

# Ruby on Rails

## 版本與應用程式背景

- 在選擇 API 或變更基礎架構前，請先閱讀 `Gemfile.lock`、`config.load_defaults` 與環境設定。保留應用程式支援的 Rails 與 Ruby 版本。
- 新的 Rails 8 應用程式預設使用 Propshaft，並包含 Solid Queue、Solid Cache 與 Solid Cable 的正式環境設定。現有應用程式可能保留其他資產、工作、快取或 cable 後端；在建議遷移前，請先檢視特定環境的設定。
- 在 Rails 8+ 上，`bin/rails generate authentication` 提供了基於工作階段的身份驗證與密碼重設起點。僅在符合所請求的身份驗證工作時使用它；授權與任何額外帳號需求應分開檢視。

參考資料：[Rails 8.0 發行說明](https://guides.rubyonrails.org/8_0_release_notes.html)、[Active Job 設定](https://guides.rubyonrails.org/active_job_basics.html)、[Rails 身份驗證指引](https://guides.rubyonrails.org/security.html)。

## 一般指引

- 遵循 RuboCop 風格指南，並使用 `rubocop`、`standardrb` 或 `rufo` 等工具以維持一致的格式。
- 變數／方法使用 snake_case，類別／模組使用 CamelCase。
- 保持方法簡短且專注；使用提早返回、防衛子句（guard clauses）與私有方法來降低複雜度。
- 優先使用具意義的名稱，而非簡短或通用的名稱。
- 僅在必要時加上註解 —— 避免解釋顯而易見的內容。
- 將單一職責原則套用至類別、方法與模組。
- 優先使用組合而非繼承；將可重複使用的邏輯抽離至模組或服務中。
- 保持控制器精簡 —— 將商業邏輯移至模型、服務或命令／查詢物件中。
- 保持模型職責專注；當實際工作流程或重複使用邊界合理時，才抽離服務或查詢物件。
- 使用 partials 或檢視元件（view components）來減少重複並簡化檢視表。
- 針對否定條件使用 `unless`，但為了清晰度，避免與 `else` 搭配使用。
- 避免深層巢狀條件式 —— 優先使用防衛子句與方法抽離。
- 使用安全導覽運算子（`&.`）取代多個 `nil` 檢查。
- 優先使用 `.present?`、`.blank?` 與 `.any?`，而非手動檢查 nil／空值。
- 在路由與控制器動作中遵循 RESTful 慣例。
- 使用 Rails 產生器一致地建立資源鷹架。
- 使用強參數（strong parameters）安全地將屬性加入白名單。
- 優先使用列舉（enums）與具型別的屬性，以提升模型清晰度與驗證。
- 保持資料庫遷移與資料庫無關；盡可能避免使用原生 SQL。
- 務必為外部索引鍵與頻繁查詢的欄位加上索引。
- 在資料庫層級定義 `null: false` 與 `unique: true`，而不僅僅是在模型中。
- 對大型資料集進行疊代時使用 `find_each`，以減少記憶體使用量。
- 在模型中設定查詢範圍（scope），或使用查詢物件以提升清晰度與重複使用性。
- 謹慎使用 `before_action` 回呼 —— 避免在其中放置商業邏輯。
- 使用 `Rails.cache` 儲存昂貴的運算結果或頻繁存取的資料。
- 使用 `Rails.root.join(...)` 建構檔案路徑，而非硬編碼。
- 在關聯中使用 `class_name` 與 `foreign_key` 以明確定義關係。
- 使用 `Rails.application.credentials` 或環境變數，將機密資訊與設定排除在程式碼庫之外。
- 為模型、服務與輔助函式撰寫隔離的單元測試。
- 使用請求／系統測試涵蓋端到端邏輯。
- 針對非阻塞操作（如寄送電子郵件或呼叫 API）使用背景工作（ActiveJob）。
- 使用 `FactoryBot`（RSpec）或 fixtures（Minitest）乾淨地設定測試資料。
- 避免使用 `puts` —— 請使用 `byebug`、`pry` 或 logger 工具進行偵錯。
- 使用 YARD 或 RDoc 為複雜的程式碼路徑與方法撰寫文件。

## 應用程式目錄結構

- 需要時將服務物件放在 `app/services`；預設不要建立額外的應用程式層。
- 使用位於 `app/forms` 的表單物件來管理驗證與提交邏輯。
- 在 `app/serializers` 目錄中實作 JSON 序列化器以格式化 API 回應。
- 在 `app/policies` 中定義授權原則，以控制使用者對資源的存取。
- 透過在 `app/graphql` 中組織結構描述、查詢與突變（mutations）來建構 GraphQL API。
- 在 `app/validators` 中建立自訂驗證器，以強制執行專屬的驗證邏輯。
- 將複雜的 ActiveRecord 查詢隔離並封裝在 `app/queries` 中，以提升重複使用性與可測試性。
- 在 `app/types` 目錄中定義自訂資料類型與強制轉型邏輯，以擴充或覆寫 ActiveModel 型別行為。

## 指令

- 使用 `rails generate` 建立新的模型、控制器與資料庫遷移。
- 使用 `rails db:migrate` 套用資料庫遷移。
- 使用 `rails db:seed` 為資料庫填入初始資料。
- 使用 `rails db:rollback` 還原上一次的資料庫遷移。
- 使用 `rails console` 在 REPL 環境中與 Rails 應用程式互動。
- 使用 `rails server` 啟動開發伺服器。
- 使用 `rails test` 執行測試套件。
- 使用 `rails routes` 列出應用程式中所有已定義的路由。
- 使用 `rails assets:precompile` 編譯正式環境的資產。


## API 開發最佳實務

- 使用 Rails 的 `resources` 建構路由，以遵循 RESTful 慣例。
- 使用命名空間路由（例如：`/api/v1/`）進行版本控制與向前相容性。
- 使用 `ActiveModel::Serializer` 或 `fast_jsonapi` 序列化回應，以確保輸出一致。
- 為每個回應傳回適當的 HTTP 狀態碼（例如：200 OK、201 Created、422 Unprocessable Entity）。
- 使用 `before_action` 篩選器載入與授權資源，而非處理商業邏輯。
- 針對傳回大型資料集的端點，善用分頁（例如：`kaminari` 或 `pagy`）。
- 使用中介軟體或 `rack-attack` 等 gem 對敏感端點進行速率限制與節流。
- 以結構化 JSON 格式傳回錯誤，包含錯誤代碼、訊息與詳細資料。
- 使用強參數清理輸入參數並將其加入白名單。
- 使用自訂序列化器或呈現器（presenters）將內部邏輯與回應格式解耦。
- 在預先載入相關資料時使用 `includes`，以避免 N+1 查詢。
- 針對非阻塞任務（如寄送電子郵件或與外部 API 同步）實作背景工作。
- 記錄請求／回應 Metadata 以進行偵錯、可觀測性與稽核。
- 使用 OpenAPI（Swagger）、`rswag` 或 `apipie-rails` 為端點撰寫文件。
- 需要時使用 CORS 標頭（`rack-cors`）允許對 API 的跨來源存取。
- 確保敏感資料永遠不會暴露在 API 回應或錯誤訊息中。

## 前端開發最佳實務

- 使用應用程式在 `app/javascript` 下現有的 JavaScript 設定。現代 Rails 支援 import maps 或 JavaScript 套件打包；請遵循已設定的方式，而非引入 Webpacker。請參閱[在 Rails 中使用 JavaScript](https://guides.rubyonrails.org/working_with_javascript_in_rails.html)。
- 依元件或領域（而非檔案類型）結構化您的 JavaScript，以維持模組化。
- 在 Rails 原生應用程式中，善用 Hotwire（Turbo + Stimulus）進行即時更新並將 JavaScript 降至最低。
- 使用 Stimulus 控制器將行為繫結至 HTML，並以宣告式方式管理 UI 邏輯。
- 在 `app/assets/stylesheets` 下使用 SCSS 模組、Tailwind 或 BEM 慣例來組織樣式。
- 將重複的標記抽離至 partials 或元件中，以保持檢視邏輯乾淨。
- 在所有檢視表中使用語意化 HTML 標籤並遵循無障礙性（a11y）最佳實務。
- 避免內嵌 JavaScript 與樣式；改為將邏輯移至獨立的 `.js` 或 `.scss` 檔案以提升清晰度與重複使用性。
- 使用資產管線（asset pipeline）或打包工具最佳化資產（圖片、字型、圖示），以進行快取與壓縮。
- 使用 `data-*` 屬性將前端互動性與 Rails 產生的 HTML 及 Stimulus 橋接起來。
- 使用系統測試（Capybara）或搭配 Cypress、Playwright 等工具的整合測試來測試前端功能。
- 使用特定環境的資產載入，以防止在正式環境中載入不必要的指令碼或樣式。
- 遵循設計系統或元件函式庫，以維持 UI 的一致性與延展性。
- 使用延遲載入、Turbo Frames 與延後載入 JS 來最佳化首次繪製時間（TTFP）與資產載入。

## 測試指引

- 使用 `test/models`（Minitest）或 `spec/models`（RSpec）為模型撰寫單元測試，以驗證商業邏輯。
- 使用 fixtures（Minitest）或搭配 `FactoryBot` 的 factories（RSpec）乾淨且一致地管理測試資料。
- 將控制器 specs 組織在 `test/controllers` 或 `spec/requests` 下，以測試 RESTful API 行為。
- 優先在 RSpec 中使用 `before` 區塊或在 Minitest 中使用 `setup` 來初始化共同測試資料。
- 避免在測試中呼叫外部 API —— 使用 `WebMock`、`VCR` 或 `stub_request` 來隔離測試環境。
- 在 Minitest 中使用 `system tests` 或在 RSpec 中使用搭配 Capybara 的 `feature specs` 來模擬完整的使用者流程。
- 將緩慢且昂貴的測試（例如：外部服務、檔案上傳）隔離到獨立的測試類型或標籤中。
- 執行 `SimpleCov` 等測試涵蓋率工具，以確保足夠的程式碼涵蓋率。
- 避免在測試中使用 `sleep`；改用 `perform_enqueued_jobs`（Minitest）或搭配 RSpec 的 `ActiveJob::TestHelper`。
- 使用資料庫清理工具（`rails test:prepare`、`DatabaseCleaner` 或 `transactional_fixtures`）在測試之間維持乾淨的狀態。
- 使用 `ActiveJob::TestHelper` 或 `have_enqueued_job` 比對器將工作加入佇列並執行，以測試背景工作。
- 使用 CI 工具（例如：GitHub Actions、CircleCI）確保測試在各環境中一致執行。
- 使用自訂比對器（RSpec）或自訂斷言（Minitest）來實作可重複使用且具表達力的測試邏輯。
- 依類型（例如：`:model`、`:request`、`:feature`）標記測試，以進行更快速且具針對性的測試執行。
- 避免脆弱的測試 —— 除非明確必要，否則不要依賴特定的時間戳記、隨機資料或順序。
- 為跨越多層（模型、檢視表、控制器）的端到端流程撰寫整合測試。
- 保持測試快速、可靠，並與正式環境程式碼一樣遵守 DRY 原則。