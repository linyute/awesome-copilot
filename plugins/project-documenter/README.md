# Project Documenter 外掛程式

產生具備 draw.io 架構圖與包含 PNG 圖片之 Word (.docx) 輸出的專業專案文件。適用於任何軟體專案 — 自動探索技術棧、架構與程式碼結構。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install project-documenter@awesome-copilot
```

## 它的功能

將 **Project Documenter** 代理程式指向任何存放庫，它將產生：

1. **Markdown 文件** — 包含內建圖表參考的 10 章節專案摘要
2. **Draw.io 圖表** — C4 Context、Pipeline 與 Component 關係圖 (`.drawio` + `.drawio.png`)
3. **Word 文件** — 專業格式化的 `.docx`，包含標題頁、目錄與內建的 PNG 架構圖片

## 包含內容

### 代理程式

| 代理程式 | 說明 |
|-------|-------------|
| `project-documenter` | 產生具備 draw.io 架構圖與包含圖片之 Word 文件輸出的專業專案文件。自動探索任何專案的技術棧與架構。 |

### 技能

| 技能 | 說明 |
|-------|-------------|
| `drawio` | 將 draw.io 圖表產生為 `.drawio` 檔案，並透過隨附的 Node.js 指令碼匯出為 PNG (使用 draw.io CLI 或無頭瀏覽器) |
| `md-to-docx` | 將 Markdown 轉換為包含內建 PNG 圖片的 Word (`.docx`) — 純 JavaScript，無需 Pandoc |

## 運作原理

### 步驟 1：探索

代理程式掃描您的存放庫以了解：
- 技術棧 (`.csproj`, `package.json`, `pom.xml`, `go.mod` 等)
- 架構模式 (API, 背景工作服務, CLI, 函式庫)
- 設計模式 (工廠模式, 策略模式, 存放庫模式, 管線模式)
- 介面、實作、模型、設定
- 相依性、Docker 設定、CI/CD

### 步驟 2：產生圖表

遵循 C4 模型建立 3-5 張專業的 draw.io 圖表：

| 圖表 | C4 層級 | 顯示內容 |
|---------|----------|-------|
| 高階架構圖 | Context | 系統及其環境 — 上游、下游、外部相依性 |
| 處理管線圖 | Container | 內部資料流 — 入口點 → 階段 → 輸出 |
| 元件關係圖 | Component | 介面、實作、工廠、相依性注入圖 |
| 部署圖 (選填) | Infrastructure | Docker, Kubernetes, 擴展, 雲端服務 |
| 資料模型 (選填) | Component | 實體/DTO 階層 (若具有重大意義) |

每張圖表都使用隨附的 `drawio-to-png.mjs` 指令碼匯出為 PNG。

### 步驟 3：撰寫 Markdown

產生包含 10 個章節的 `docs/project-summary.md`：

1. 執行摘要 (Executive Summary)
2. 架構概覽 (Architecture Overview，包含內建圖表)
3. 處理管線 (Processing Pipeline，包含內建圖表)
4. 核心元件 (Core Components，包含內建圖表)
5. API 契約 / 訊息結構描述 (API Contracts / Message Schemas)
6. 基礎設施與部署 (Infrastructure & Deployment)
7. 擴充模式 (Extension Patterns)
8. 規則與反模式 (Rules & Anti-Patterns)
9. 相依性 (Dependencies)
10. 程式碼結構 (Code Structure)

### 步驟 4：Word 文件

使用隨附的 `md-to-docx.mjs` 指令碼將 Markdown 轉換為格式化的 `.docx`：

- 包含專案名稱、日期、版本、對象的標題頁
- 自動產生的目錄
- **內建於 Word 文件中的 PNG 圖表圖片**
- Calibri 字型、彩色標題、具備交替列款式的表格
- 使用 Consolas 字型且具備陰影背景的程式碼區塊

### 步驟 5：驗證

對照實際程式碼庫抽查類別名稱、檔案路徑與圖表準確性。回報所有產生的檔案。

## 產生輸出

```
docs/
├── project-summary.md                     # 原始文件 (Markdown)
├── project-summary.docx                   # 包含內建圖片的 Word 文件
└── diagrams/
    ├── high-level-architecture.drawio     # C4 Context 圖表 (可編輯)
    ├── high-level-architecture.drawio.png # 算繪出的 PNG
    ├── processing-pipeline.drawio         # C4 Container 圖表
    ├── processing-pipeline.drawio.png
    ├── component-relationships.drawio     # C4 Component 圖表
    └── component-relationships.drawio.png
```

## 前提條件

| 要求 | 用途 | 是否必備？ |
|-------------|---------|-----------|
| Node.js 18+ | 執行隨附的匯出指令碼 | 是 |
| Edge 或 Chrome | 用於圖表算繪的無頭瀏覽器 | 擇一：此項 或 draw.io 桌面版 |
| draw.io 桌面版 | CLI 圖表匯出 (較快的替代方案) | 選填 (具備瀏覽器備援) |

## 技術中立

適用於任何技術棧。代理程式會自動偵測：
- **.NET** (`.csproj`, `.sln`), **Java** (`pom.xml`, `build.gradle`), **Node.js** (`package.json`), **Python** (`pyproject.toml`), **Go** (`go.mod`), **Rust** (`Cargo.toml`)
- Docker, Kubernetes, GitHub Actions, GitLab CI
- 任何訊息系統 (SQS, RabbitMQ, Kafka, Azure Service Bus)
- 任何資料庫 ORM (EF, Hibernate, Prisma, SQLAlchemy)

## 原始資料

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
