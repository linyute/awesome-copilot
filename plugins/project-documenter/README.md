# Project Documenter 外掛程式

產生具備 draw.io 架構圖以及嵌入 PNG 圖片的 Word (.docx) 輸出的專業專案文件。適用於任何軟體專案 — 自動探索技術堆疊、架構以及程式碼結構。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install project-documenter@awesome-copilot
```

## 功能簡介

將 **Project Documenter** agent 指向任何存放庫，即可產生：

1. **Markdown 文件** — 包含嵌入圖表參考的 10 個章節專案摘要
2. **Draw.io 圖表** — C4 Context、Pipeline 以及 Component 關聯圖（`.drawio` + `.drawio.png`）
3. **Word 文件** — 具備標題頁、目錄以及嵌入 PNG 架構圖片的專業格式化 `.docx`

## 包含內容

### Agent

| Agent | 描述 |
|-------|-------------|
| `project-documenter` | 產生具備 draw.io 架構圖以及嵌入圖片的 Word 文件輸出的專業專案文件。自動探索任何專案的技術堆疊與架構。 |

### Skills

| Skill | 描述 |
|-------|-------------|
| `drawio` | 將 draw.io 圖表產生為 `.drawio` 檔案，並透過隨附的 Node.js 指令碼匯出為 PNG（使用 draw.io CLI 或無前端介面瀏覽器） |
| `md-to-docx` | 將 Markdown 轉換為具備嵌入 PNG 圖片的 Word (`.docx`) — 純 JavaScript，無需 Pandoc |

## 運作方式

### 步驟 1：探索

Agent 掃描您的存放庫以了解：
- 技術堆疊（`.csproj`、`package.json`、`pom.xml`、`go.mod` 等）
- 架構模式（API、Worker 服務、CLI、函式庫）
- 設計模式（Factory、Strategy、Repository、Pipeline）
- 介面、實作、模型、設定
- 相依性、Docker 設定、CI/CD

### 步驟 2：產生圖表

遵循 C4 模型建立 3-5 個專業 draw.io 圖表：

| 圖表 | C4 層級 | 顯示內容 |
|---------|----------|-------|
| 高階架構 | Context | 環境中的系統 — 上游、下游、外部相依性 |
| 處理管線 | Container | 內部資料流程 — 進入點 → 各階段 → 輸出 |
| 元件關聯性 | Component | 介面、實作、Factory、DI 圖 |
| 部署（選用） | Infrastructure | Docker、Kubernetes、擴展、雲端服務 |
| 資料模型（選用） | Component | 實體/DTO 階層（若重要） |

每個圖表皆使用隨附的 `drawio-to-png.mjs` 指令碼匯出為 PNG。

### 步驟 3：撰寫 Markdown

產生包含 10 個章節的 `docs/project-summary.md`：

1. 執行摘要 (Executive Summary)
2. 架構概觀 (Architecture Overview，含嵌入圖表)
3. 處理管線 (Processing Pipeline，含嵌入圖表)
4. 核心元件 (Core Components，含嵌入圖表)
5. API 協定 / 訊息結構描述 (API Contracts / Message Schemas)
6. 基礎架構與部署 (Infrastructure & Deployment)
7. 擴充模式 (Extension Patterns)
8. 規則與反模式 (Rules & Anti-Patterns)
9. 相依性 (Dependencies)
10. 程式碼結構 (Code Structure)

### 步驟 4：Word 文件

使用隨附的 `md-to-docx.mjs` 指令碼將 Markdown 轉換為格式化的 `.docx`：

- 包含專案名稱、日期、版本、目標對象的標題頁
- 自動產生目錄
- **PNG 圖表圖片行內嵌入**至 Word 文件中
- Calibri 字型、彩色標題、交替行樣式的表格
- Consolas 程式碼區塊與陰影背景

### 步驟 5：驗證

對照實際程式碼庫抽查類別名稱、檔案路徑與圖表準確性。回報所有產生的檔案。

## 產生輸出

```
docs/
├── project-summary.md                     # 來源文件 (Markdown)
├── project-summary.docx                   # 具備嵌入圖片的 Word 文件
└── diagrams/
    ├── high-level-architecture.drawio     # C4 Context 圖表 (可編輯)
    ├── high-level-architecture.drawio.png # 轉譯的 PNG
    ├── processing-pipeline.drawio         # C4 Container 圖表
    ├── processing-pipeline.drawio.png
    ├── component-relationships.drawio     # C4 Component 圖表
    └── component-relationships.drawio.png
```

## 先決條件

| 需求 | 用途 | 是否必備？ |
|-------------|---------|-----------|
| Node.js 18+ | 執行隨附的匯出指令碼 | 是 |
| Edge 或 Chrome | 用於圖表轉譯的無前端介面瀏覽器 | 其中之一：此項 或 draw.io 桌面版 |
| draw.io 桌面版 | CLI 圖表匯出（更快的替代方案） | 選用（提供瀏覽器後備方案） |

## 跨技術堆疊

適用於任何堆疊。Agent 會自動偵測：
- **.NET** (`.csproj`, `.sln`)、**Java** (`pom.xml`, `build.gradle`)、**Node.js** (`package.json`)、**Python** (`pyproject.toml`)、**Go** (`go.mod`)、**Rust** (`Cargo.toml`)
- Docker、Kubernetes、GitHub Actions、GitLab CI
- 任何傳訊系統（SQS、RabbitMQ、Kafka、Azure Service Bus）
- 任何資料庫 ORM（EF、Hibernate、Prisma、SQLAlchemy）

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
