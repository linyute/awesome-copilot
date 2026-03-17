# 技能範本 (Skill Templates)

適用於不同類型 Microsoft 技術的現成範本。

## MCP 工具的 CLI 替代方案

以下所有範本皆使用 MCP 工具呼叫 (例如：`microsoft_docs_search`、`microsoft_docs_fetch`、`microsoft_code_sample_search`)。如果 Microsoft Learn MCP 伺服器不可用，請將其替換為等效的 CLI 命令：

| MCP 工具 | CLI 命令 |
|----------|-------------|
| `microsoft_docs_search(query: "...")` | `mslearn search "..."` |
| `microsoft_code_sample_search(query: "...", language: "...")` | `mslearn code-search "..." --language ...` |
| `microsoft_docs_fetch(url: "...")` | `mslearn fetch "..."` |

直接使用 `npx @microsoft/learn-cli <command>` 執行，或使用 `npm install -g @microsoft/learn-cli` 全域安裝。

## 範本 1：SDK/函式庫技能 (SDK/Library Skill)

適用於用戶端函式庫、SDK 和程式設計框架。

```markdown
---
name: {sdk-名稱}
description: {功能說明}。當代理程式需要使用 {技術上下文} 執行 {主要任務} 時使用。支援 {語言/平台}。
---

# {SDK 名稱}

{一個段落：它是什麼、存在的原因、何時使用}

## 安裝

{受支援語言的套件管理員命令}

## 核心概念

{3-5 個核心概念，每個段落最多一個}

### {概念 1}
{簡短說明}

### {概念 2}
{簡短說明}

## 快速入門

{最小可行範例 — 如果少於 30 行則內嵌，否則參考 sample_codes/}

## 常見模式

### {模式 1：例如「基礎 CRUD」}
```{語言}
{程式碼}
```

### {模式 2：例如「錯誤處理」}
```{語言}
{程式碼}
```

## API 快速參考

| 類別/方法 | 目的 | 範例 |
|--------------|---------|---------|
| {名稱} | {功能說明} | `{用法}` |

如需完整 API 文件：
- `microsoft_docs_search(query="{sdk} {class} API reference")`
- `microsoft_docs_fetch(url="{url}")`

## 最佳實務

- **建議**：{建議事項}
- **建議**：{建議事項}
- **避免**：{反面模式 (anti-pattern)}

請參閱 [best-practices.md](references/best-practices.md) 以獲取詳細指南。

## 深入了解

| 主題 | 如何尋找 |
|-------|-------------|
| {進階主題 1} | `microsoft_docs_search(query="{sdk} {topic}")` |
| {進階主題 2} | `microsoft_docs_fetch(url="{url}")` |
| {程式碼範例} | `microsoft_code_sample_search(query="{sdk} {scenario}", language="{lang}")` |
```

---

## 範本 2：Azure 服務技能 (Azure Service Skill)

適用於 Azure 服務和雲端資源。

```markdown
---
name: {服務名稱}
description: 處理 {Azure 服務}。當代理程式需要 {主要功能} 時使用。涵蓋佈署、設定和 SDK 用法。
---

# {Azure 服務名稱}

{一個段落：服務的功能、主要使用案例}

## 概觀

- **類別**：{運算/儲存/AI/網路/等}
- **關鍵功能**：{主要價值主張}
- **何時使用**：{場景}

## 使用入門

### 先決條件
- Azure 訂閱
- {其他要求}

### 佈署
{用於建立資源的 CLI/入口網站/Bicep 片段}

## SDK 用法 ({語言})

### 安裝
```
{套件安裝命令}
```

### 身份驗證
```{語言}
{驗證程式碼模式}
```

### 基礎操作
```{語言}
{CRUD 或主要操作}
```

## 核心設定

| 設定 | 目的 | 預設值 |
|---------|---------|---------|
| {設定} | {控制內容} | {值} |

## 定價與限制

- **定價模型**：{耗用量/基於層級/等}
- **主要限制**：{重要配額}

如需目前定價：`microsoft_docs_search(query="{service} pricing")`

## 常見模式

### {模式 1}
{程式碼或設定}

### {模式 2}
{程式碼或設定}

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| {常見錯誤} | {修復方法} |

如需更多問題：`microsoft_docs_search(query="{service} troubleshoot {symptom}")`

## 深入了解

| 主題 | 如何尋找 |
|-------|-------------|
| REST API | `microsoft_docs_fetch(url="{url}")` |
| ARM/Bicep | `microsoft_docs_search(query="{service} bicep template")` |
| 安全性 | `microsoft_docs_search(query="{service} security best practices")` |
```

---

## 範本 3：框架/平台技能 (Framework/Platform Skill)

適用於開發框架和平台 (例如 ASP.NET, MAUI, Blazor)。

```markdown
---
name: {框架名稱}
description: 使用 {框架} 建構 {應用程式類型}。當代理程式需要建立、修改或除錯 {框架} 應用程式時使用。
---

# {框架名稱}

{一個段落：它是什麼、可以用它建構什麼、為什麼選擇它}

## 專案結構

```
{典型專案}/
├── {資料夾}/     # {用途}
├── {檔案}        # {用途}
└── {檔案}        # {用途}
```

## 使用入門

### 建立新專案
```bash
{用於架構的 CLI 命令}
```

### 專案設定
{要設定的關鍵檔案及其控制內容}

## 核心概念

### {概念 1：例如「元件」}
{說明，附帶最小程式碼範例}

### {概念 2：例如「路由」}
{說明，附帶最小程式碼範例}

### {概念 3：例如「狀態管理」}
{說明，附帶最小程式碼範例}

## 常見模式

### {模式 1}
```{語言}
{程式碼}
```

### {模式 2}
```{語言}
{程式碼}
```

## 設定選項

| 設定 | 檔案 | 目的 |
|---------|------|---------|
| {設定} | {檔案} | {功能說明} |

## 部署

{簡短的部署指南或參考}

如需詳細部署：`microsoft_docs_search(query="{framework} deploy {target}")`

## 深入了解

| 主題 | 如何尋找 |
|-------|-------------|
| {進階功能} | `microsoft_docs_search(query="{framework} {feature}")` |
| {整合} | `microsoft_docs_fetch(url="{url}")` |
| {範例} | `microsoft_code_sample_search(query="{framework} {scenario}")` |
```

---

## 範本 4：API/協定技能 (API/Protocol Skill)

適用於 API、協定和規格 (例如 Microsoft Graph, OOXML)。

```markdown
---
name: {api-名稱}
description: 與 {API/協定} 互動。當代理程式需要執行 {主要操作} 時使用。涵蓋身份驗證、端點和常見操作。
---

# {API/協定名稱}

{一個段落：它提供存取的內容、主要使用案例}

## 身份驗證

{驗證方法與程式碼模式}

## 基礎設定

- **基礎 URL**：`{url}`
- **版本**：`{version}`
- **格式**：{JSON/XML/等}

## 常見端點/操作

### {操作 1：例如「列出項目」}
```
{HTTP 方法} {端點}
```
```{語言}
{SDK 程式碼}
```

### {操作 2：例如「建立項目」}
```
{HTTP 方法} {端點}
```
```{語言}
{SDK 程式碼}
```

## 要求/回應模式

### 分頁 (Pagination)
{如何處理分頁}

### 錯誤處理
{錯誤格式與常見代碼}

## 快速參考

| 操作 | 端點/方法 | 備註 |
|-----------|-----------------|-------|
| {操作} | `{端點}` | {備註} |

## 權限/範圍 (Scopes)

| 操作 | 所需權限 |
|-----------|---------------------|
| {操作} | `{權限}` |

## 深入了解

| 主題 | 如何尋找 |
|-------|-------------|
| 完整端點參考 | `microsoft_docs_fetch(url="{url}")` |
| 權限 | `microsoft_docs_search(query="{api} permissions {resource}")` |
| SDK | `microsoft_docs_search(query="{api} SDK {language}")` |
```

---

## 選擇範本

| 技術類型 | 範本 | 範例 |
|-----------------|----------|----------|
| 用戶端函式庫、NuGet/npm 套件 | SDK/函式庫 | Semantic Kernel, Azure SDK, MSAL |
| Azure 資源 | Azure 服務 | Cosmos DB, Azure Functions, App Service |
| 應用程式開發框架 | 框架/平台 | ASP.NET Core, Blazor, MAUI |
| REST API、協定、規格 | API/協定 | Microsoft Graph, OOXML, FHIR |

## 自訂指南

範本是起點。透過以下方式進行自訂：

1. **新增章節** 以呈現技術的獨特面向
2. **移除不適用的章節**
3. **根據複雜度調整深度** (複雜技術需更多概念)
4. **新增參考檔案** 以呈現 SKILL.md 中無法容納的詳細內容
5. **新增 sample_codes/** 以呈現內嵌片段之外的可執行範例
