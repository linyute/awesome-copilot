---
agent: 'agent'
description: '建立 AI 最佳化決策文件的架構決策記錄（ADR）文件。'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'extensions', 'web/fetch', 'githubRepo', 'openSimpleBrowser', 'problems', 'runTasks', 'search', 'search/searchResults', 'runCommands/terminalLastCommand', 'runCommands/terminalSelection', 'testFailure', 'usages', 'vscodeAPI']
---

# 建立架構決策記錄

請使用結構化格式，為 `${input:DecisionTitle}` 建立 ADR 文件，優化 AI 解析與人類可讀性。

## 輸入

- **情境**：`${input:Context}`
- **決策**：`${input:Decision}`
- **替代方案**：`${input:Alternatives}`
- **利害關係人**：`${input:Stakeholders}`

## 輸入驗證
如有必要輸入未提供或無法從對話紀錄判斷，請要求使用者補充後再產生 ADR。

## 要求

- 用精確且無歧義語言
- 遵循標準 ADR 格式並加上前置資訊
- 同時記錄正面與負面影響
- 替代方案需記錄拒絕理由
- 結構化以利機器解析與人類參考
- 多項內容請用編碼項目（3-4 字母代碼 + 3 位數）

ADR 檔案需儲存於 `/docs/adr/` 目錄，命名規則為：`adr-NNNN-[title-slug].md`，NNNN 為下個連號 4 位數（如 `adr-0001-database-selection.md`）。

## 文件結構範本

文件內容請依下列範本填寫，前置資訊格式需正確：

```md
---
title: "ADR-NNNN: [決策標題]"
status: "Proposed"
date: "YYYY-MM-DD"
authors: "[利害關係人姓名/角色]"
tags: ["architecture", "decision"]
supersedes: ""
superseded_by: ""
---

# ADR-NNNN: [決策標題]

## 狀態

**Proposed** | Accepted | Rejected | Superseded | Deprecated

## 情境

[問題說明、技術限制、業務需求與環境因素，說明此決策必要性。]

## 決策

[所選解決方案與選擇理由。]

## 影響

### 正面

- **POS-001**：[有利結果與優勢]
- **POS-002**：[效能、可維護性、延展性提升]
- **POS-003**：[符合架構原則]

### 負面

- **NEG-001**：[取捨、限制、缺點]
- **NEG-002**：[技術債或複雜度增加]
- **NEG-003**：[風險與未來挑戰]

## 替代方案

### [替代方案 1 名稱]

- **ALT-001**：**描述**：[簡要技術說明]
- **ALT-002**：**拒絕理由**：[未選用原因]

### [替代方案 2 名稱]

- **ALT-003**：**描述**：[簡要技術說明]
- **ALT-004**：**拒絕理由**：[未選用原因]

## 實作備註

- **IMP-001**：[關鍵實作考量]
- **IMP-002**：[移轉或推展策略（如適用）]
- **IMP-003**：[監控與成功標準]

## 參考資料

- **REF-001**：[相關 ADR]
- **REF-002**：[外部文件]
- **REF-003**：[引用標準或框架]
```
