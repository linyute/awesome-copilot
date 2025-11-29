---
description: 'Ruby on Rails 程式撰寫慣例與指引'
applyTo: '**/*.rb'
---

# Ruby on Rails

## 一般指引

- 遵循 RuboCop Style Guide，並使用 `rubocop`、`standardrb` 或 `rufo` 等工具保持格式一致。
- 變數/方法採用 snake_case，類別/模組採用 CamelCase。
- 方法保持簡短且聚焦，使用早期回傳、守衛條件與私有方法降低複雜度。
- 優先使用具意義的名稱，避免過短或通用名稱。
- 僅在必要時加註解，避免解釋明顯內容。
- 類別、方法、模組皆遵循單一職責原則。
- 優先組合而非繼承，重複邏輯請抽出至模組或服務。
- Controller 保持精簡，商業邏輯移至 Model、Service 或 Command/Query 物件。
- 「胖 Model、瘦 Controller」模式需謹慎運用並保持抽象清晰。
- 商業邏輯請抽出至 Service 物件以利重用與測試。
- View 重複可用 partial 或 view component 簡化。
- 負向條件可用 `unless`，但避免搭配 `else` 以維持清晰。
- 避免深層巢狀條件，優先守衛條件與方法抽出。
- 多重 nil 檢查請用安全導覽（`&.`）。
- 優先使用 `.present?`、`.blank?`、`.any?`，避免手動 nil/空值檢查。
- 路由與 Controller 行為遵循 RESTful 慣例。
- 使用 Rails 產生器一致 scaffold 資源。
- 強參數（strong parameters）安全白名單屬性。
- 優先使用 enum 與型別屬性提升 Model 清晰度與驗證。
- Migration 保持資料庫相容性，避免原始 SQL。
- 外鍵與常查詢欄位皆加索引。
- DB 層級定義 `null: false` 與 `unique: true`，不僅限 Model。
- 大量資料迴圈請用 `find_each` 降低記憶體用量。
- 查詢請於 Model scope 或 Query 物件定義，提升清晰與重用。
- `before_action` callback 請適度使用，避免商業邏輯。
- `Rails.cache` 儲存昂貴運算或常用資料。
- 檔案路徑請用 `Rails.root.join(...)`，勿硬編碼。
- 關聯請明確指定 `class_name` 與 `foreign_key`。
- 機密與設定請用 `Rails.application.credentials` 或 ENV 變數管理。
- Model、Service、Helper 皆寫獨立單元測試。
- 跨層邏輯用 request/system test 覆蓋。
- 非同步操作（如寄信、API 呼叫）用背景工作（ActiveJob）。
- 測試資料請用 `FactoryBot`（RSpec）或 fixture（Minitest）建立。
- 避免使用 `puts`，除錯請用 `byebug`、`pry` 或 logger。
- 複雜程式路徑與方法請用 YARD 或 RDoc 文件化。

## 應用程式目錄結構

- 商業邏輯請於 `app/services` 定義 Service 物件。
- 表單物件於 `app/forms` 管理驗證與送出邏輯。
- API 回應格式化請於 `app/serializers` 定義 JSON serializer。
- 授權政策於 `app/policies` 控管資源存取。
- GraphQL API 結構於 `app/graphql` 組織 schema、query、mutation。
- 自訂驗證邏輯於 `app/validators`。
- 複雜 ActiveRecord 查詢於 `app/queries` 隔離與封裝。
- 自訂資料型別與轉換邏輯於 `app/types` 擴充或覆寫 ActiveModel 型別。

## 指令

- 用 `rails generate` 建立新 Model、Controller、Migration。
- 用 `rails db:migrate` 套用資料庫 migration。
- 用 `rails db:seed` 初始化資料庫。
- 用 `rails db:rollback` 回復最後一次 migration。
- 用 `rails console` 於 REPL 環境互動。
- 用 `rails server` 啟動開發伺服器。
- 用 `rails test` 執行測試。
- 用 `rails routes` 列出所有路由。
- 用 `rails assets:precompile` 編譯生產環境資源。

## API 開發最佳實務

- 路由結構請用 Rails `resources`，遵循 RESTful 慣例。
- 命名空間路由（如 `/api/v1/`）用於版本控管與前向相容。
- 回應序列化請用 `ActiveModel::Serializer` 或 `fast_jsonapi`。
- 回應皆用正確 HTTP 狀態碼（如 200 OK、201 Created、422 Unprocessable Entity）。
- `before_action` filter 用於載入與授權資源，勿放商業邏輯。
- 大量資料端點請用分頁（如 `kaminari` 或 `pagy`）。
- 敏感端點請用 middleware 或 gem（如 `rack-attack`）限流。
- 錯誤回應皆用結構化 JSON，含錯誤碼、訊息與細節。
- 輸入參數請用 strong parameters 白名單。
- 回應格式化請用自訂 serializer 或 presenter，解耦內部邏輯。
- 查詢請用 `includes` 預先載入關聯，避免 N+1 問題。
- 非同步任務（如寄信、同步外部 API）請用背景工作。
- 請求/回應 metadata 皆記錄以利除錯、觀察與稽核。
- API 端點請用 OpenAPI（Swagger）、`rswag` 或 `apipie-rails` 文件化。
- 敏感資料絕不暴露於回應或錯誤訊息。

## 前端開發最佳實務

- Rails 6+ 前端請用 `app/javascript` 管理 JavaScript pack、模組與前端邏輯，搭配 Webpacker 或 esbuild。
- JavaScript 結構依元件或領域組織，保持模組化。
- Rails 原生應用建議用 Hotwire（Turbo + Stimulus）實現即時更新與最少 JavaScript。
- UI 行為請用 Stimulus controller 綁定 HTML，宣告式管理。
- 樣式請用 SCSS module、Tailwind 或 BEM，放於 `app/assets/stylesheets`。
- View 重複標記請抽出 partial 或 component。
- HTML 標籤請用語意化，所有 View 遵循無障礙（a11y）最佳實務。
- 避免 inline JavaScript 與樣式，請分離至 .js 或 .scss 檔案。
- 資源（圖片、字型、icon）請用 asset pipeline 或 bundler 優化快取與壓縮。
- 用 `data-*` 屬性串接前端互動與 Rails 產生 HTML、Stimulus。
- 前端功能請用 system test（Capybara）或 Cypress、Playwright 整合測試。
- 依環境載入資源，避免生產環境多餘 script 或樣式。
- UI 請遵循設計系統或元件庫，保持一致與可延展。
- 首次繪製與資源載入請用 lazy loading、Turbo Frame、JS 延遲。

## 測試指引

- Model 單元測試請放於 `test/models`（Minitest）或 `spec/models`（RSpec），驗證商業邏輯。
- 測試資料請用 fixture（Minitest）或 `FactoryBot`（RSpec）管理。
- Controller 測試請放於 `test/controllers` 或 `spec/requests`，測試 RESTful API 行為。
- RSpec 用 `before`，Minitest 用 `setup` 初始化共用測試資料。
- 測試勿呼叫外部 API，請用 `WebMock`、`VCR` 或 `stub_request` 隔離環境。
- Minitest 用 system test，RSpec 用 feature spec（Capybara）模擬完整使用流程。
- 慢速或昂貴測試（如外部服務、檔案上傳）請獨立分型或加 tag。
- 用 `SimpleCov` 追蹤測試覆蓋率。
- 測試勿用 `sleep`，Minitest 用 `perform_enqueued_jobs`，RSpec 用 `ActiveJob::TestHelper`。
- 資料庫清理請用 `rails test:prepare`、`DatabaseCleaner` 或 `transactional_fixtures`。
- 背景工作測試請用 `ActiveJob::TestHelper` 或 `have_enqueued_job` matcher。
- 測試於各環境皆能一致執行，建議用 CI 工具（如 GitHub Actions、CircleCI）。
- RSpec 用自訂 matcher，Minitest 用自訂 assertion，提升測試重用性與表達力。
- 測試依型別加 tag（如 :model、:request、:feature），加速並精準執行。
- 避免脆弱測試，勿依賴特定時間戳、隨機資料或順序，除非必要。
- 跨層流程請寫整合測試，涵蓋 Model、View、Controller。
- 測試需保持快速、可靠且如生產程式碼般 DRY。
