---
description: '全方位技術堆疊原理圖產生器，能分析程式碼庫並建立詳細的架構文件。自動偵測技術堆疊、程式語言及多平台（.NET、Java、JavaScript、React、Python）實作模式。產生可設定的原理圖，包含版本資訊、授權細節、使用模式、程式規範及視覺化圖表。提供可直接實作的範本，並維持架構一致性以引導開發。'
agent: 'agent'
---

# 全方位技術堆疊原理圖產生器

## 設定變數
${PROJECT_TYPE="自動偵測|.NET|Java|JavaScript|React.js|React Native|Angular|Python|其他"} <!-- 主要技術 -->
${DEPTH_LEVEL="基本|標準|全方位|可直接實作"} <!-- 分析深度 -->
${INCLUDE_VERSIONS=true|false} <!-- 是否包含版本資訊 -->
${INCLUDE_LICENSES=true|false} <!-- 是否包含授權資訊 -->
${INCLUDE_DIAGRAMS=true|false} <!-- 是否產生架構圖 -->
${INCLUDE_USAGE_PATTERNS=true|false} <!-- 是否包含程式使用模式 -->
${INCLUDE_CONVENTIONS=true|false} <!-- 是否記錄程式規範 -->
${OUTPUT_FORMAT="Markdown|JSON|YAML|HTML"} <!-- 輸出格式 -->
${CATEGORIZATION="技術類型|層級|用途"} <!-- 組織方式 -->

## 產生提示

"請分析程式碼庫並產生一份 ${DEPTH_LEVEL} 技術堆疊原理圖，完整記錄技術與實作模式，以利一致性程式碼產生。請依下列步驟進行：

### 1. 技術識別階段
- ${PROJECT_TYPE == "自動偵測" ? "掃描程式碼庫的專案檔、設定檔及相依性，判斷所有使用的技術堆疊" : "聚焦於 ${PROJECT_TYPE} 技術"}
- 依副檔名及內容辨識所有程式語言
- 分析設定檔（package.json、.csproj、pom.xml 等）以擷取相依套件
- 檢查建構腳本及流程定義，取得工具資訊
- ${INCLUDE_VERSIONS ? "擷取所有套件的精確版本資訊" : "略過版本細節"}
- ${INCLUDE_LICENSES ? "記錄所有相依套件的授權資訊" : ""}

### 2. 核心技術分析

${PROJECT_TYPE == ".NET" || PROJECT_TYPE == "自動偵測" ? "#### .NET 堆疊分析（如偵測到）
- 目標框架與語言版本（由專案檔偵測）
- 所有 NuGet 相依套件及版本與用途註解
- 專案結構與組織模式
- 設定方式（appsettings.json、IOptions 等）
- 認證機制（Identity、JWT 等）
- API 設計模式（REST、GraphQL、Minimal API 等）
- 資料存取方式（EF Core、Dapper 等）
- 相依性注入模式
- 中介軟體管線元件" : ""}

${PROJECT_TYPE == "Java" || PROJECT_TYPE == "自動偵測" ? "#### Java 堆疊分析（如偵測到）
- JDK 版本與核心框架
- 所有 Maven/Gradle 相依套件及版本與用途
- 套件結構組織
- Spring Boot 使用與設定
- 註解模式
- 相依性注入方式
- 資料存取技術（JPA、JDBC 等）
- API 設計（Spring MVC、JAX-RS 等）" : ""}

${PROJECT_TYPE == "JavaScript" || PROJECT_TYPE == "自動偵測" ? "#### JavaScript 堆疊分析（如偵測到）
- ECMAScript 版本與轉譯設定
- 所有 npm 相依套件依用途分類
- 模組系統（ESM、CommonJS）
- 建構工具（webpack、Vite 等）及設定
- TypeScript 使用與設定
- 測試框架與模式" : ""}

${PROJECT_TYPE == "React.js" || PROJECT_TYPE == "自動偵測" ? "#### React 分析（如偵測到）
- React 版本與主要模式（hooks vs 類別元件）
- 狀態管理方式（Context、Redux、Zustand 等）
- 元件函式庫使用（Material-UI、Chakra 等）
- 路由實作
- 表單處理策略
- API 整合模式
- 元件測試方式" : ""}

${PROJECT_TYPE == "Python" || PROJECT_TYPE == "自動偵測" ? "#### Python 分析（如偵測到）
- Python 版本與主要語言特性
- 套件相依性與虛擬環境設定
- Web 框架細節（Django、Flask、FastAPI）
- ORM 使用模式
- 專案結構組織
- API 設計模式" : ""}

### 3. 實作模式與規範
${INCLUDE_CONVENTIONS ? 
"記錄各技術區域的程式規範與模式：

#### 命名規範
- 類別／型別命名模式
- 方法／函式命名模式
- 變數命名規範
- 檔案命名與組織規範
- 介面／抽象類別模式

#### 程式組織
- 檔案結構與組織
- 資料夾階層模式
- 元件／模組邊界
- 程式分層與責任分配

#### 常見模式
- 錯誤處理方式
- 日誌模式
- 設定存取
- 認證／授權實作
- 驗證策略
- 測試模式" : ""}

### 4. 使用範例
${INCLUDE_USAGE_PATTERNS ? 
"擷取代表性程式碼範例，展示標準實作模式：

#### API 實作範例
- 標準控制器／端點實作
- 請求 DTO 模式
- 回應格式化
- 驗證方式
- 錯誤處理

#### 資料存取範例
- Repository 模式實作
- 實體／模型定義
- 查詢模式
- 交易處理

#### 服務層範例
- 服務類別實作
- 商業邏輯組織
- 橫切關注整合
- 相依性注入使用

#### UI 元件範例（如適用）
- 元件結構
- 狀態管理模式
- 事件處理
- API 整合模式" : ""}

### 5. 技術堆疊地圖
${DEPTH_LEVEL == "全方位" || DEPTH_LEVEL == "可直接實作" ? 
"建立完整技術地圖，內容包含：

#### 核心框架使用
- 主要框架及其專案內用途
- 框架設定與客製化
- 擴充點與客製化

#### 整合點
- 各技術元件整合方式
- 元件間認證流程
- 前後端資料流
- 第三方服務整合模式

#### 開發工具
- IDE 設定與規範
- 程式分析工具
- Linter 與格式化工具及設定
- 建構與部署流程
- 測試框架與方法

#### 基礎設施
- 部署環境細節
- 容器技術
- 雲端服務使用
- 監控與日誌基礎設施" : ""}

### 6. 技術專屬實作細節

${PROJECT_TYPE == ".NET" || PROJECT_TYPE == "自動偵測" ? 
"#### .NET 實作細節（如偵測到）
- **相依性注入模式**：
  - 服務註冊方式（Scoped／Singleton／Transient）
  - 設定綁定模式
  
- **控制器模式**：
  - 基礎控制器使用
  - Action 回傳型別與模式
  - 路由屬性規範
  - 篩選器使用（授權、驗證等）
  
- **資料存取模式**：
  - ORM 設定與使用
  - 實體設定方式
  - 關聯定義
  - 查詢模式與最佳化
  
- **API 設計模式**（如有）：
  - 端點組織
  - 參數綁定方式
  - 回應型別處理
  
- **語言特性使用**：
  - 由程式碼偵測特定語言特性
  - 辨識常見模式與慣用語
  - 註明版本依賴特性" : ""}

${PROJECT_TYPE == "React.js" || PROJECT_TYPE == "自動偵測" ? 
"#### React 實作細節（如偵測到）
- **元件結構**：
  - 函式元件 vs 類別元件
  - Props 介面定義
  - 元件組合模式
  
- **Hook 使用模式**：
  - 自訂 hook 實作風格
  - useState 使用模式
  - useEffect 清理方式
  - Context 使用模式
  
- **狀態管理**：
  - 區域 vs 全域狀態決策
  - 狀態管理函式庫模式
  - Store 設定
  - Selector 模式
  
- **樣式處理**：
  - CSS 方法（CSS modules、styled-components 等）
  - 主題實作
  - 響應式設計模式" : ""}

### 7. 新程式實作原理圖
${DEPTH_LEVEL == "可直接實作" ? 
"請根據分析結果，提供新功能實作詳細原理圖：

- **檔案／類別範本**：常見元件標準結構
- **程式碼片段**：常用操作可直接使用的程式碼
- **實作檢查清單**：新功能端到端實作標準步驟
- **整合點**：新程式如何與現有系統連結
- **測試需求**：各元件標準測試模式
- **文件需求**：新功能標準文件模式" : ""}

${INCLUDE_DIAGRAMS ? 
"### 8. 技術關係圖
- **堆疊圖**：完整技術堆疊視覺化
- **相依流程**：各技術互動方式
- **元件關係**：主要元件間相依關係
- **資料流**：技術堆疊資料流向" : ""}

### ${INCLUDE_DIAGRAMS ? "9" : "8"}. 技術決策背景
- 記錄技術選擇原因
- 註明待汰換技術
- 辨識技術限制與邊界
- 記錄升級路徑與相容性考量

請以 ${OUTPUT_FORMAT} 格式輸出，並依 ${CATEGORIZATION} 分類技術。

請將結果儲存為 'Technology_Stack_Blueprint.${OUTPUT_FORMAT == "Markdown" ? "md" : OUTPUT_FORMAT.toLowerCase()}'
"
