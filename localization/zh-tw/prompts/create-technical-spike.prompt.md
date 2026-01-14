---
agent: 'agent'
description: '建立時間限制的技術探索文件，用於在實作之前研究和解決關鍵開發決策。'
tools: ['runCommands', 'runTasks', 'edit', 'search', 'extensions', 'usages', 'vscodeAPI', 'think', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'web/fetch', 'githubRepo', 'todos', 'microsoft-docs/*', 'search']
---

# 建立技術探索文件

建立時間限制的技術探索文件，用於研究在開發進行之前必須回答的關鍵問題。每個探索都專注於一個特定的技術決策，並具有明確的交付成果和時間表。

## 文件結構

在 `${input:FolderPath|docs/spikes}` 目錄中建立單獨的檔案。使用以下模式命名每個檔案：`[類別]-[簡短描述]-spike.md` (例如，`api-copilot-integration-spike.md`、`performance-realtime-audio-spike.md`)。

```md
---
title: "${input:SpikeTitle}"
category: "${input:Category|Technical}"
status: "🔴 未開始"
priority: "${input:Priority|High}"
timebox: "${input:Timebox|1 week}"
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
owner: "${input:Owner}"
tags: ["technical-spike", "${input:Category|technical}", "research"]
---

# ${input:SpikeTitle}

## 摘要

**探索目標：** [需要解決的明確、具體問題或決策]

**為何重要：** [對開發/架構決策的影響]

**時間限制：** [分配給此探索的時間]

**決策截止日期：** [何時必須解決此問題以避免阻礙開發]

## 研究問題

**主要問題：** [需要回答的主要技術問題]

**次要問題：**

- [相關問題 1]
- [相關問題 2]
- [相關問題 3]

## 調查計畫

### 研究任務

- [ ] [特定研究任務 1]
- [ ] [特定研究任務 2]
- [ ] [特定研究任務 3]
- [ ] [建立概念驗證/原型]
- [ ] [文件化發現和建議]

### 成功標準

**此探索在以下情況下完成：**

- [ ] [特定標準 1]
- [ ] [特定標準 2]
- [ ] [文件化明確建議]
- [ ] [完成概念驗證 (如果適用)]

## 技術背景

**相關元件：** [列出受此決策影響的系統元件]

**依賴項：** [哪些其他探索或決策依賴於解決此問題]

**限制：** [影響解決方案的已知限制或要求]

## 研究發現

### 調查結果

[文件化研究發現、測試結果和收集到的證據]

### 原型/測試筆記

[任何原型、探索或技術實驗的結果]

### 外部資源

- [相關文件的連結]
- [應用程式介面參考的連結]
- [社群討論的連結]
- [範例/教學的連結]

## 決策

### 建議

[根據研究發現的明確建議]

### 基本原理

[為何選擇此方法而非替代方法]

### 實作筆記

[實作的關鍵考量]

### 後續行動

- [ ] [行動項目 1]
- [ ] [行動項目 2]
- [ ] [更新架構文件]
- [ ] [建立實作任務]

## 狀態歷史

| 日期   | 狀態         | 筆記                      |
| ------ | -------------- | -------------------------- |
| [日期] | 🔴 未開始 | 探索已建立並確定範圍   |
| [日期] | 🟡 進行中 | 研究已開始         |
| [日期] | 🟢 完成    | [解決方案摘要]       |

---

_上次更新：[日期] 由 [姓名]_
```

## 技術探索的類別

### 應用程式介面整合

- 第三方應用程式介面功能和限制
- 整合模式和身份驗證
- 速率限制和效能特性

### 架構與設計

- 系統架構決策
- 設計模式適用性
- 元件互動模型

### 效能與延展性

- 效能要求和限制
- 延展性瓶頸和解決方案
- 資源利用模式

### 平台與基礎設施

- 平台功能和限制
- 基礎設施要求
- 部署和託管考量

### 安全性與合規性

- 安全性要求和實作
- 合規性限制
- 身份驗證和授權方法

### 使用者體驗

- 使用者互動模式
- 無障礙要求
- 介面設計決策

## 檔案命名慣例

使用描述性、烤肉串式命名，指示類別和特定未知：

**應用程式介面/整合範例：**

- `api-copilot-chat-integration-spike.md`
- `api-azure-speech-realtime-spike.md`
- `api-vscode-extension-capabilities-spike.md`

**效能範例：**

- `performance-audio-processing-latency-spike.md`
- `performance-extension-host-limitations-spike.md`
- `performance-webrtc-reliability-spike.md`

**架構範例：**

- `architecture-voice-pipeline-design-spike.md`
- `architecture-state-management-spike.md`
- `architecture-error-handling-strategy-spike.md`

## 應用程式介面代理程式的最佳實踐

1. **每個探索一個問題：** 每個文件都專注於一個技術決策或研究問題

2. **時間限制研究：** 為每個探索定義特定的時間限制和交付成果

3. **基於證據的決策：** 在標記為完成之前，需要具體證據 (測試、原型、文件)

4. **明確建議：** 文件化具體建議和實作的基本原理

5. **依賴項追蹤：** 識別探索之間的關係以及對專案決策的影響

6. **以結果為導向：** 每個探索都必須產生可操作的決策或建議

## 研究策略

### 階段 1：資訊收集

1. **使用搜尋/擷取工具搜尋現有文件**
2. **分析程式碼庫**以尋找現有模式和限制
3. **研究外部資源** (應用程式介面、函式庫、範例)

### 階段 2：驗證與測試

1. **建立重點原型**以測試特定假設
2. **執行有針對性的實驗**以驗證假設
3. **文件化測試結果**並提供支援證據

### 階段 3：決策與文件化

1. **將發現綜合**為明確建議
2. **文件化開發團隊的實作指南**
3. **建立後續任務**以進行實作

## 工具使用

- **search/searchResults：** 研究現有解決方案和文件
- **fetch/githubRepo：** 分析外部應用程式介面、函式庫和範例
- **codebase：** 了解現有系統限制和模式
- **runTasks：** 執行原型和驗證測試
- **editFiles：** 更新研究進度和發現
- **vscodeAPI：** 測試 VS Code 擴充功能功能和限制

專注於時間限制研究，以解決關鍵技術決策並解除開發進度。
