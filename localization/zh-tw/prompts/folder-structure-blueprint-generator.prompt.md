---
description: '技術無關的專案資料夾結構分析與文件產生器，能自動偵測專案型態（.NET、Java、React、Angular、Python、Node.js、Flutter），產生詳細藍圖，包含視覺化選項、命名慣例、檔案放置模式與擴充範本，協助多種技術棧維持一致的程式碼組織。'
agent: 'agent'
---

# 專案資料夾結構藍圖產生器

## 設定變數

${PROJECT_TYPE="自動偵測|.NET|Java|React|Angular|Python|Node.js|Flutter|其他"} 
<!-- 選擇主要技術 -->

${INCLUDES_MICROSERVICES="自動偵測|true|false"} 
<!-- 是否為微服務架構？ -->

${INCLUDES_FRONTEND="自動偵測|true|false"} 
<!-- 是否包含前端元件？ -->

${IS_MONOREPO="自動偵測|true|false"} 
<!-- 是否為多專案 monorepo？ -->

${VISUALIZATION_STYLE="ASCII|Markdown List|Table"} 
<!-- 結構視覺化方式 -->

${DEPTH_LEVEL=1-5} 
<!-- 詳細記錄幾層資料夾 -->

${INCLUDE_FILE_COUNTS=true|false} 
<!-- 是否包含檔案數量統計 -->

${INCLUDE_GENERATED_FOLDERS=true|false} 
<!-- 是否包含自動產生資料夾 -->

${INCLUDE_FILE_PATTERNS=true|false} 
<!-- 是否記錄檔案命名/位置模式 -->

${INCLUDE_TEMPLATES=true|false} 
<!-- 是否包含新功能的檔案/資料夾範本 -->

## 產生的提示

「請分析專案資料夾結構，建立完整的 'Project_Folders_Structure_Blueprint.md' 文件，作為維持一致程式碼組織的權威指南。請依以下步驟進行：

### 初始自動偵測階段

${PROJECT_TYPE == "自動偵測" ? 
"先掃描資料夾結構以判斷專案型態：
- 尋找解決方案/專案檔（.sln, .csproj, .fsproj, .vbproj）判斷 .NET 專案
- 檢查建置檔（pom.xml, build.gradle, settings.gradle）判斷 Java 專案
- 尋找 package.json 判斷 JavaScript/TypeScript 專案
- 尋找框架專屬檔案（angular.json, react-scripts, next.config.js）
- 檢查 Python 專案指標（requirements.txt, setup.py, pyproject.toml）
- 檢查行動專案指標（pubspec.yaml, android/ios 資料夾）
- 記錄所有技術簽名與版本" : 
"聚焦於 ${PROJECT_TYPE} 專案結構分析"}

${IS_MONOREPO == "自動偵測" ? 
"判斷是否為 monorepo：
- 是否有多個獨立專案與組態檔
- 是否有 workspace 組態檔（lerna.json, nx.json, turborepo.json 等）
- 是否有跨專案相依模式
- 根目錄是否有協調腳本與組態" : ""}

${INCLUDES_MICROSERVICES == "自動偵測" ? 
"檢查微服務架構指標：
- 多個服務資料夾且結構重複
- 服務專屬 Dockerfile 或部署組態
- 服務間通訊模式（API、訊息代理）
- 服務註冊或發現組態
- API gateway 組態檔
- 服務間共用函式庫或工具" : ""}

${INCLUDES_FRONTEND == "自動偵測" ? 
"判斷是否包含前端元件：
- 網頁資產資料夾（wwwroot, public, dist, static）
- UI 框架檔案（components, modules, pages）
- 前端建置組態（webpack, vite, rollup 等）
- 樣式表組織（CSS, SCSS, styled-components）
- 靜態資產（images, fonts, icons）" : ""}

### 1. 結構總覽

提供 ${PROJECT_TYPE == "自動偵測" ? "偵測到的專案型態" : PROJECT_TYPE} 的高層次組織原則與資料夾結構：

- 說明整體架構原則
- 識別主要組織原則（依功能、依層、依領域等）
- 記錄重複出現的結構模式
- 推測結構背後的設計理念

${IS_MONOREPO == "自動偵測" ? 
"若偵測為 monorepo，說明其組織方式與專案間關係。" : 
IS_MONOREPO ? "說明 monorepo 組織方式與專案間關係。" : ""}

${INCLUDES_MICROSERVICES == "自動偵測" ? 
"若偵測到微服務，描述其結構與組織。" : 
INCLUDES_MICROSERVICES ? "描述微服務結構與組織。" : ""}

### 2. 資料夾視覺化

${VISUALIZATION_STYLE == "ASCII" ? 
"以 ASCII 樹狀圖表示資料夾層級（深度 ${DEPTH_LEVEL}）。" : ""}

${VISUALIZATION_STYLE == "Markdown List" ? 
"以巢狀 markdown 清單表示資料夾層級（深度 ${DEPTH_LEVEL}）。" : ""}

${VISUALIZATION_STYLE == "Table" ? 
"以表格呈現路徑、用途、內容型態與慣例。" : ""}

${INCLUDE_GENERATED_FOLDERS ? 
"包含所有資料夾（含自動產生）。" : 
"排除 bin/、obj/、node_modules/ 等自動產生資料夾。"}

### 3. 主要資料夾分析

記錄每個重要資料夾的用途、內容與模式：

${PROJECT_TYPE == "自動偵測" ? 
"針對每種偵測到的技術，依實際使用模式分析資料夾結構：" : ""}

${(PROJECT_TYPE == ".NET" || PROJECT_TYPE == "自動偵測") ? 
"#### .NET 專案結構（如偵測到）

- **解決方案組織**：
  - 專案分組與關聯
  - 解決方案資料夾組織模式
  - 多目標專案模式

- **專案組織**：
  - 內部資料夾結構
  - 原始碼組織方式
  - 資源組織
  - 專案相依與參考

- **領域/功能組織**：
  - 業務領域或功能分離
  - 領域邊界管理

- **層級組織**：
  - 關注點分離（Controllers, Services, Repositories 等）
  - 層級互動與相依模式

- **組態管理**：
  - 組態檔位置與用途
  - 環境專屬組態
  - 機密管理方式

- **測試專案組織**：
  - 測試專案結構與命名
  - 測試分類與組織
  - 測試資料與模擬位置" : ""}

${(PROJECT_TYPE == "React" || PROJECT_TYPE == "Angular" || PROJECT_TYPE == "自動偵測") ? 
"#### UI 專案結構（如偵測到）

- **元件組織**：
  - 元件資料夾結構
  - 分組策略（依功能、型態等）
  - 共用與專屬元件

- **狀態管理**：
  - 狀態相關檔案組織
  - 全域狀態 store 結構
  - 區域狀態管理模式

- **路由組織**：
  - 路由定義位置
  - 頁面/檢視元件組織
  - 路由參數處理

- **API 整合**：
  - API client 組織
  - 服務層結構
  - 資料取得模式

- **資產管理**：
  - 靜態資源組織
  - 圖片/媒體檔案結構
  - 字型與圖示組織
  
- **樣式組織**：
  - CSS/SCSS 檔案結構
  - 主題組織
  - 樣式模組模式" : ""}

### 4. 檔案放置模式

${INCLUDE_FILE_PATTERNS ? 
"記錄各類檔案放置模式：

- **組態檔**：
  - 各類組態檔位置
  - 環境專屬組態模式
  
- **模型/實體定義**：
  - 領域模型定義位置
  - DTO 位置
  - 結構定義位置
  
- **商業邏輯**：
  - 服務實作位置
  - 商業規則組織
  - 工具與輔助函式放置
  
- **介面定義**：
  - 介面與抽象定義位置
  - 介面分組與組織
  
- **測試檔案**：
  - 單元測試放置模式
  - 整合測試位置
  - 測試工具與模擬位置
  
- **文件檔案**：
  - API 文件放置
  - 內部文件組織
  - README 檔分布" : 
"記錄專案主要檔案類型放置位置。"}

### 5. 命名與組織慣例
記錄專案命名與組織慣例：

- **檔案命名模式**：
  - 大小寫慣例（PascalCase, camelCase, kebab-case）
  - 前綴與後綴模式
  - 檔案型態指標
  
- **資料夾命名模式**：
  - 各類資料夾命名慣例
  - 階層命名模式
  - 分組與分類慣例
  
- **命名空間/模組模式**：
  - 命名空間/模組如何對應資料夾結構
  - import/using 組織
  - 內部與公開 API 分離

- **組織模式**：
  - 程式碼共置策略
  - 功能封裝方式
  - 橫切關注組織

### 6. 導覽與開發流程
提供專案結構導覽與開發指引：

- **進入點**：
  - 主應用程式進入點
  - 主要組態起始點
  - 初學者理解專案的起始檔案

- **常見開發任務**：
  - 新功能如何加入
  - 擴充既有功能方式
  - 新測試放置位置
  - 組態修改位置
  
- **相依模式**：
  - 資料夾間相依流向
  - import/參考模式
  - 相依性注入註冊位置

${INCLUDE_FILE_COUNTS ? 
"- **內容統計**：
  - 各資料夾檔案數量分析
  - 程式碼分布指標
  - 複雜度集中區域" : ""}

### 7. 建構與輸出組織
記錄建構流程與輸出結構：

- **建構組態**：
  - 建構腳本位置與用途
  - 建構流程組織
  - 建構任務定義
  
- **輸出結構**：
  - 編譯/建構後輸出位置
  - 輸出組織模式
  - 發佈套件結構
  
- **環境專屬建構**：
  - 開發/正式環境差異
  - 環境組態策略
  - 建構變體組織

### 8. 技術專屬組織

${(PROJECT_TYPE == ".NET" || PROJECT_TYPE == "自動偵測") ? 
"#### .NET 專屬結構（如偵測到）

- **專案檔組織**：
  - 專案檔結構與模式
  - 目標框架組態
  - PropertyGroup 組織
  - ItemGroup 模式
  
- **組件組織**：
  - 組件命名模式
  - 多組件架構
  - 組件參考模式
  
- **資源組織**：
  - 內嵌資源模式
  - 本地化檔案結構
  - 靜態網頁資產組織
  
- **套件管理**：
  - NuGet 組態位置
  - 套件參考組織
  - 套件版本管理" : ""}

${(PROJECT_TYPE == "Java" || PROJECT_TYPE == "自動偵測") ? 
"#### Java 專屬結構（如偵測到）

- **套件階層**：
  - 套件命名與巢狀慣例
  - 領域 vs 技術套件
  - 可見性與存取模式
  
- **建置工具組織**：
  - Maven/Gradle 結構
  - 模組組織
  - 外掛組態模式
  
- **資源組織**：
  - 資源資料夾結構
  - 環境專屬資源
  - properties 檔案組織" : ""}

${(PROJECT_TYPE == "Node.js" || PROJECT_TYPE == "自動偵測") ? 
"#### Node.js 專屬結構（如偵測到）

- **模組組織**：
  - CommonJS vs ESM 組織
  - 內部模組模式
  - 第三方相依管理
  
- **腳本組織**：
  - npm/yarn 腳本定義
  - 工具腳本位置
  - 開發工具腳本
  
- **組態管理**：
  - 組態檔位置
  - 環境變數管理
  - 機密管理方式" : ""}

### 9. 擴充與演進
記錄專案結構如何設計以利擴充：

- **擴充點**：
  - 如何新增模組/功能並維持慣例
  - 外掛/擴充資料夾模式
  - 自訂化資料夾結構
  
- **延展性模式**：
  - 結構如何因應大型功能擴充
  - 大型模組拆分方式
  - 程式碼分割策略
  
- **重構模式**：
  - 常見重構方式
  - 結構變更管理
  - 漸進式重組模式

${INCLUDE_TEMPLATES ? 
"### 10. 結構範本

提供依專案慣例建立新元件的範本：

- **新功能範本**：
  - 新功能資料夾結構
  - 必要檔案型態與位置
  - 命名慣例
  
- **新元件範本**：
  - 元件典型資料夾結構
  - 必要檔案
  - 與既有結構整合方式
  
- **新服務範本**：
  - 新服務資料夾結構
  - 介面與實作放置位置
  - 組態與註冊慣例
  
- **新測試結構**：
  - 測試專案/檔案資料夾結構
  - 測試檔案組織範本
  - 測試資源組織" : ""}

### ${INCLUDE_TEMPLATES ? "11" : "10"}. 結構維護

記錄專案結構如何維護與強制執行：

- **結構驗證**：
  - 強制結構的工具/腳本
  - 建構檢查結構合規
  - 結構相關 lint 規則
  
- **文件化慣例**：
  - 結構變更如何記錄
  - 架構決策記錄位置
  - 結構演進歷程

文件結尾需包含如何維護此藍圖及最後更新時間。
"
