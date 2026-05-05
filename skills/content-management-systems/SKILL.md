---
name: content-management-systems
description: '跨 WordPress、Shopify、Wix、Squarespace、Drupal、WooCommerce、Joomla、HubSpot CMS Hub、Webflow、Adobe Experience Manager 等平台建構與修改內容管理系統的工作流程。當處理 CMS 佈景主題、外掛程式、應用程式、模組、管理員面板、媒體上傳、內容模型、編輯器、Markdown 管線或靜態匯出工作流程時使用。'
---

# 內容管理系統 (Content Management Systems)

當使用者正在處理內容管理系統或行為類似內容管理系統的軟體時，請使用此技能。

此技能專注於 CMS 工作中重要的銜接點 (seams)：

- 佈景主題與範本 (themes and templates)
- 外掛程式、應用程式、模組與擴充功能 (plugins, apps, modules, and extensions)
- 管理員與編輯器介面 (admin and editor interfaces)
- 媒體與上傳處理 (media and upload handling)
- 內容模型、分類與 Metadata (content models, taxonomy, and metadata)
- 渲染管線與靜態匯出流程 (render pipelines and static export flows)

## 何時使用此技能 (When to Use This Skill)

- 使用者提到 CMS 平台，例如 WordPress, Shopify, Drupal, Joomla, Webflow, Squarespace, Wix, WooCommerce, HubSpot CMS Hub 或 Adobe Experience Manager。
- 任務涉及 CMS 內部的佈景主題開發、範本變更或設計系統工作。
- 任務涉及外掛程式、模組、應用程式或擴充點。
- 任務觸及編輯器使用者體驗 (UX)、預覽、Slug、分類、SEO 欄位或發佈行為。
- 任務涉及上傳、媒體庫、經撰寫的資產、Markdown 渲染或靜態匯出。

## 初步檢查 (First Pass)

1. 識別平台類別：自行代管的 CMS、SaaS 網站建立工具、電子商務平台或混合/無頭 (headless) 系統。
2. 在編輯前找到負責實作的銜接點：
   - 佈景主題或範本層
   - 外掛程式、應用程式、模組或擴充層
   - 管理員或編輯器表面
   - 內容模型或儲存層
   - 媒體管線
   - 匯出、部署或渲染管線
3. 在選擇方法前檢查平台限制：
   - 哪些內容可以在本地端編輯
   - 哪些是經撰寫的內容，哪些是程式碼
   - 媒體歸屬於何處
   - 最終網站是伺服器呈現、靜態匯出還是遠端代管

## CMS 規則 (CMS Rules)

- 遵循平台針對佈景主題、模組、範本組件或區段的命名與資料夾慣例。
- 除非平台明確將佈景主題資產與使用者上傳的媒體結合，否則請保持兩者分開。
- 優先使用結構化內容欄位，而非將重要的 Metadata 儲存在呈現標記中。
- 將預覽、Slug、分類、摘要 (excerpts)、Metadata 欄位與發佈狀態視為 CMS 的首要關注事項。
- 當設定、佈景主題選取或內容輸入無效時，優先使用安全的預設值與優雅的備援行為。
- 當變更編輯器或管理員行為時，請同時追蹤儲存的欄位、驗證規則、預覽路徑以及最終的渲染路徑。

## 常見工作流程 (Common Workflows)

### 佈景主題與範本 (Themes and Templates)

- 從範本載入器或佈景主題執行階段開始，而非從下游的包含檔案 (include) 開始。
- 保留平台的範本階層與組件命名慣例。
- 讓呈現層的變更貼近範本與共享的佈景主題協助工具。

### 外掛程式、應用程式與模組 (Plugins, Apps, and Modules)

- 在平台的擴充銜接點新增行為，而非將邏輯散佈到範本中。
- 保持遷移 (migrations)、種子資料與配置更新明確且具備版本管理。
- 當平台需要啟用或註冊時，記錄擴充功能的設定假設。

### 管理員與編輯器 UX (Admin and Editor UX)

- 保持表單與儲存的內容模型一致。
- 當內容轉換非輕而易舉時，優先提供面向作者的預覽。
- 保持驗證、CSRF 或同等防護措施，以及權限與周圍的管理員程式碼一致。

### 媒體與上傳 (Media and Uploads)

- 為經撰寫的媒體使用專用的上傳路徑。
- 將裝飾性或佈景主題擁有的圖片保留在作用中的佈景主題資料夾內。
- 除非平台有更強的慣例，否則預設使用慣用位置，如用於經撰寫媒體的 `uploads/` 與用於佈景主題資產的 `img/`。
- 當 CMS 支援可配置的媒體目錄時，公開該設定並提供安全備援。

### 內容模型與遷移 (Content Models and Migrations)

- 清晰區分內容實體：頁面、文章、產品、項目、集合、分類與設定。
- 優先使用遷移檔案或可匯出的結構描述定義，而非臨機操作的執行階段變動。
- 保持串接網址 (slug)、發佈日期、摘要、標準 Metadata 以及分類關係的結構化。

### Markdown, HTML 與靜態匯出 (Markdown, HTML, and Static Export)

- 在變更渲染器前，判斷 Markdown 是經撰寫的輸入、中間內容還是建構輸出。
- 在可行時，將渲染器變更與預覽或驗證配對。
- 對於靜態匯出的 CMS 系統，在建構變更後驗證重寫的永久連結與資產路徑。

## 識別負責的銜接點 (Identifying the Owning Seam)

不論何種平台，在編輯前請透過將程式碼庫對應至以下 CMS 角色來定位負責的銜接點：

- 執行階段引導 (bootstrap) 與請求路由 (request routing)
- 管理員或編輯器控制器及其視圖範本
- 佈景主題載入、範本階層以及共享的範本協助工具
- 用於內容、分類與設定的存放庫 (repositories)、模型或結構描述/遷移檔案
- Markdown 或內容轉換公用程式
- 靜態匯出、部署或渲染管線進入點

先切換至負責的銜接點，然後進行最小程度的變更以保留 CMS 結構。

## 平台附註 (Platform Notes)

參見 `references/cms-platform-workflows.md` 以獲取常見 CMS 平台、擴充表面與媒體慣例的簡要對照表。
