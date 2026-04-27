# 查詢檢查點

針對 acquire-codebase-knowledge 工作流程第 2 階段，各個範本區域的調查問題。對於每個範本區域，請先從掃描輸出中尋找答案，然後閱讀原始碼檔案以填補空白。

---

## 1. STACK.md — 技術堆疊

- 主要語言及其確切版本為何？ (檢查 `.nvmrc`, `go.mod`, `pyproject.toml`, Docker `FROM` 行)
- 使用何種套件管理員？ (`npm`, `yarn`, `pnpm`, `go mod`, `pip`, `uv`)
- 核心執行階段框架為何？ (網頁伺服器、ORM、DI 容器)
- `dependencies` (生產環境) 與 `devDependencies` (開發工具) 分別包含哪些內容？
- 是否有 Docker 映像檔？它使用什麼基礎映像檔？
- `package.json` / `Makefile` / `pyproject.toml` 中的關鍵指令為何？

## 2. STRUCTURE.md — 目錄配置

- 原始碼位於何處？ (通常在 `src/`、`lib/` 或 Go 的專案根目錄)
- 進入點為何？ (檢查 `package.json` 中的 `main`、`scripts.start`、`cmd/main.go`、`app.py`)
- 每個頂層目錄的既定目的是什麼？
- 是否有非顯而易見的目錄 (例如 `eng/`、`platform/`、`infra/`)？
- 是否有隱藏的組態目錄 (`.github/`、`.vscode/`、`.husky/`)？
- 目錄遵循何種命名規範？ (camelCase, kebab-case, 按領域劃分 vs 按層劃分)

## 3. ARCHITECTURE.md — 模式

- 程式碼是按層 (控制器 → 服務 → 儲存庫) 還是按功能組織的？
- 主要資料流為何？追蹤從進入點到資料儲存空間的一個請求或指令。
- 是否存在單例 (Singleton)、相依注入 (Dependency Injection) 模式或明確的初始化順序要求？
- 是否有背景工作程式、佇列或事件驅動元件？
- 重複出現哪些設計模式？ (工廠 (Factory)、儲存庫 (Repository)、裝飾器 (Decorator)、策略 (Strategy))

## 4. CONVENTIONS.md — 編碼標準

- 檔案命名規範為何？ (檢查 10 個以上檔案 — camelCase, kebab-case, PascalCase)
- 函式與變數的命名規範為何？
- 私有方法/欄位是否帶有前綴 (例如 `_methodName`, `#field`)？
- 設定了哪些 Linter 和 Formatter？ (檢查 `.eslintrc`, `.prettierrc`, `golangci.yml`)
- TypeScript 的嚴格程度設定為何？ (`strict`, `noImplicitAny` 等)
- 每一層如何處理錯誤？ (拋出例外 (Throw) vs 回傳結構化錯誤)
- 使用何種記錄 (Logging) 函式庫？日誌訊息格式為何？
- 匯入如何組織？ (Barrel 匯出、路徑別名、分組規則)

## 5. INTEGRATIONS.md — 外部服務

- 呼叫了哪些外部 API？ (搜尋 `axios.`, `fetch(`, `http.Get(`, 常數中的基準 URL)
- 認證資訊如何儲存與存取？ (`.env`、機密管理工具、環境變數)
- 連接了哪些資料庫？ (檢查資訊清單中的 `pg`, `mongoose`, `prisma`, `typeorm`, `sqlalchemy`)
- 應用程式與外部服務之間是否有 API 閘道、服務網格 (Service mesh) 或代理伺服器 (Proxy)？
- 使用何種監控或觀測能力工具？ (APM、Prometheus、記錄管線)
- 是否有訊息佇列或事件匯流排 (Event bus)？ (Kafka, RabbitMQ, SQS, Pub/Sub)

## 6. TESTING.md — 測試設定

- 設定了何種測試執行器 (Test runner)？ (檢查 `package.json` 中的 `scripts.test`, `pytest.ini`, `go test`)
- 測試檔案位於何處？ (與原始碼並列、在 `tests/` 中、在 `__tests__/` 中)
- 使用何種斷言函式庫？ (Jest expect, Chai, pytest assert)
- 外部依賴項如何模擬 (Mock)？ (jest.mock、相依注入、Fixtures)
- 是否有存取真實服務的整合測試，還是僅有使用模擬的單元測試？
- 是否有強制的涵蓋範圍門檻值？ (檢查 `jest.config.js`, `.nycrc`, `pyproject.toml`)

## 7. CONCERNS.md — 已知議題

- 生產環境程式碼中有多少個 TODO/FIXME/HACK？ (見掃描輸出)
- 過去 90 天內哪些檔案的 Git 變動頻率 (Churn) 最高？ (見掃描輸出)
- 是否有任何超過 500 行且混合多個職責的檔案？
- 是否有任何服務執行可以平行化的循序呼叫？
- 是否有應該改為組態的硬編碼數值 (URL、ID、魔術數字)？
- 存在哪些安全性風險？ (缺少輸入驗證、向客戶端洩露原始錯誤訊息、缺少身分驗證檢查)
- 是否有效能模式無法隨規模擴展？ (N+1 查詢、多執行個體設定中的記憶體內快取)
