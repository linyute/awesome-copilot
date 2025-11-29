---
mode: 'agent'
description: '依循業界最佳實踐與架構文件標準，為物件導向元件建立完整且標準化的文件。'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'extensions', 'fetch', 'githubRepo', 'openSimpleBrowser', 'problems', 'runTasks', 'search', 'search/searchResults', 'runCommands/terminalLastCommand', 'runCommands/terminalSelection', 'testFailure', 'usages', 'vscodeAPI']
---

# 產生標準 OO 元件文件

為下列物件導向元件建立完整文件：`${input:ComponentPath}`。

分析元件時，請檢查指定路徑下的程式碼。若為資料夾，分析所有原始檔；若為單一檔案，視為主要元件並分析同目錄相關檔案。

## 文件標準

- DOC-001：遵循 C4 Model 文件層級（Context、Containers、Components、Code）
- DOC-002：符合 Arc42 軟體架構文件樣板
- DOC-003：遵循 IEEE 1016 軟體設計說明標準
- DOC-004：採用敏捷文件原則（只產生有價值的文件）
- DOC-005：以開發者與維護者為主要讀者

## 分析指引

- ANA-001：判斷路徑型態（資料夾或單一檔案），並識別主要元件
- ANA-002：檢查原始檔案中的類別結構與繼承
- ANA-003：識別設計模式與架構決策
- ANA-004：記錄公開 API、介面與相依性
- ANA-005：辨識建立型／結構型／行為型模式
- ANA-006：記錄方法參數、回傳值、例外狀況
- ANA-007：評估效能、安全性、可靠性、可維護性
- ANA-008：推斷整合模式與資料流

## 語言最佳化

- LNG-001：**C#/.NET** - async/await、相依性注入、設定、資源釋放
- LNG-002：**Java** - Spring 框架、註解、例外處理、封裝
- LNG-003：**TypeScript/JavaScript** - 模組、非同步模式、型別、npm
- LNG-004：**Python** - 套件、虛擬環境、型別提示、測試

## 錯誤處理

- ERR-001：路徑不存在 - 提供正確格式指引
- ERR-002：找不到原始檔 - 建議其他位置
- ERR-003：結構不明確 - 記錄發現並請求釐清
- ERR-004：非標準模式 - 記錄自訂做法
- ERR-005：程式碼不足 - 針對現有資訊記錄並標示缺漏

## 輸出格式

產生結構清晰的 Markdown，具備明確標題階層、程式碼區塊、表格、項目清單，並確保可讀性與可維護性。

## 檔案位置

文件應儲存於 `/docs/components/` 目錄，檔名格式為 `[component-name]-documentation.md`。

## 必要文件結構

文件必須遵循下列樣板，並確保所有章節皆適當填寫。Markdown 前置資料需正確結構，如下範例：

```md
---
title: [元件名稱] - 技術文件
component_path: `${input:ComponentPath}`
version: [選填：如 1.0、日期]
date_created: [YYYY-MM-DD]
last_updated: [選填：YYYY-MM-DD]
owner: [選填：負責此元件的團隊／個人]
tags: [選填：相關標籤或分類，如 `component`、`service`、`tool`、`infrastructure`、`documentation`、`architecture` 等]
---

# [元件名稱] 文件

[簡短介紹元件及其在系統中的用途。]

## 1. 元件概述

### 目的／職責
- OVR-001：說明元件主要職責
- OVR-002：定義範疇（包含／排除功能）
- OVR-003：描述系統情境與關聯

## 2. 架構章節

- ARC-001：記錄所用設計模式（Repository、Factory、Observer 等）
- ARC-002：列出內外部相依性及用途
- ARC-003：記錄元件互動與關係
- ARC-004：包含視覺化圖（UML 類別、序列、元件圖）
- ARC-005：建立 mermaid 圖，呈現元件結構、關係與相依性

### 元件結構與相依性圖

請包含完整 mermaid 圖，內容涵蓋：
- **元件結構**：主要類別、介面及其關係
- **內部相依性**：系統內元件互動
- **外部相依性**：外部函式庫、服務、資料庫、API
- **資料流**：相依與互動方向
- **繼承／組合**：類別階層與組合關係

```mermaid
graph TD
    subgraph "元件系統"
        A[主元件] --> B[內部服務]
        A --> C[內部儲存庫]
        B --> D[商業邏輯]
        C --> E[資料存取層]
    end

    subgraph "外部相依性"
        F[外部 API]
        G[資料庫]
        H[第三方函式庫]
        I[設定服務]
    end

    A --> F
    E --> G
    B --> H
    A --> I

    classDiagram
        class MainComponent {
            +property: Type
            +method(): ReturnType
            +asyncMethod(): Promise~Type~
        }
        class InternalService {
            +businessOperation(): Result
        }
        class ExternalAPI {
            <<external>>
            +apiCall(): Data
        }

        MainComponent --> InternalService
        MainComponent --> ExternalAPI
```

## 3. 介面文件

- INT-001：記錄所有公開介面與使用模式
- INT-002：建立方法／屬性參考表
- INT-003：記錄事件／回呼／通知機制

| 方法／屬性 | 用途   | 參數   | 回傳型別 | 使用說明 |
| ---------- | ------ | ------ | -------- | -------- |
| [名稱]     | [用途] | [參數] | [型別]   | [說明]   |

## 4. 實作細節

- IMP-001：記錄主要實作類別與職責
- IMP-002：描述設定需求與初始化
- IMP-003：記錄關鍵演算法與商業邏輯
- IMP-004：標示效能特性與瓶頸

## 5. 使用範例

### 基本用法

```csharp
// 基本用法範例
var component = new ComponentName();
component.DoSomething();
```

### 進階用法

```csharp
// 進階設定模式
var options = new ComponentOptions();
var component = ComponentFactory.Create(options);
await component.ProcessAsync(data);
```

- USE-001：提供基本用法範例
- USE-002：展示進階設定模式
- USE-003：記錄最佳實踐與建議模式

## 6. 品質屬性

- QUA-001：安全性（認證、授權、資料保護）
- QUA-002：效能（特性、延展性、資源使用）
- QUA-003：可靠性（錯誤處理、容錯、復原）
- QUA-004：可維護性（標準、測試、文件）
- QUA-005：可擴充性（擴充點、客製化選項）

## 7. 參考資訊

- REF-001：列出相依項目、版本與用途
- REF-002：完整設定選項參考
- REF-003：測試指引與模擬設定
- REF-004：疑難排解（常見問題、錯誤訊息）
- REF-005：相關文件連結
- REF-006：變更紀錄與移轉說明

```
