---
name: integrate-context-matic
description: '使用 context-matic MCP 伺服器發現並整合第三方 API。使用 `fetch_api` 尋找可用的 API SDK，使用 `ask` 獲取整合指南，使用 `model_search` 與 `endpoint_search` 獲取 SDK 詳細資訊。當使用者要求整合第三方 API、新增 API 客戶端、使用外部 API 實作功能或處理任何第三方 API 或 SDK 時，請使用此技能。'
---

# API 整合 (API Integration)

當使用者要求整合第三方 API 或實作任何涉及外部 API 或 SDK 的內容時，請遵循此工作流程。請勿依賴自身對可用 API 或其功能的了解 — 務必使用 context-matic MCP 伺服器。

## 何時套用

當使用者出現以下行為時，請套用此技能：
- 要求整合第三方 API
- 想要為外部服務新增客戶端或 SDK
- 請求相依於外部 API 的實作
- 提到特定的 API（例如 PayPal、Twilio）並涉及實作或整合

## 工作流程

### 1. 確保準則與技能已存在

#### 1a. 偵測專案的主要語言

在檢查準則或技能之前，請透過檢查工作空間來識別專案的主要程式語言：

| 檔案 / 模式 | 語言 |
|---|---|
| `*.csproj`, `*.sln` | `csharp` |
| 包含 `"typescript"` 相依性或 `.ts` 檔案的 `package.json` | `typescript` |
| `requirements.txt`, `pyproject.toml`, `*.py` | `python` |
| `go.mod`, `*.go` | `go` |
| `pom.xml`, `build.gradle`, `*.java` | `java` |
| `Gemfile`, `*.rb` | `ruby` |
| `composer.json`, `*.php` | `php` |

在隨後所有需要 `language` 參數的步驟中，請使用偵測到的語言。

#### 1b. 檢查現有的準則與技能

檢查工作空間中是否已加入此專案的準則與技能。

- `{language}-conventions` 是由 **add_skills** 產生的技能。
- `{language}-security-guidelines.md` 與 `{language}-test-guidelines.md` 是由 **add_guidelines** 產生的語言特定準則檔案。
- `update-activity-workflow.md` 是由 **add_guidelines** 產生的工作流程準則檔案（不限於特定語言）。
- 請獨立檢查這些項目。不要因為存在其中一組就將其視為另一組也存在的證明。
- **如果此專案遺漏任何必要的準則檔案：** 請呼叫 **add_guidelines**。
- **如果遺漏專案語言對應的 `{language}-conventions`：** 請呼叫 **add_skills**。
- **如果所有必要的準則檔案與 `{language}-conventions` 皆已存在：** 請跳過此步驟並繼續執行步驟 2。

### 2. 發現可用的 API

呼叫 **fetch_api** 來尋找可用的 API — 務必從這裡開始。

- 務必使用步驟 1a 中偵測到的語言提供 `language` 參數。
- 務必提供 `key` 參數：傳入使用者請求中的 API 名稱/金鑰（例如 `"paypal"`、`"twilio"`）。
- 如果使用者未提供 API 名稱/金鑰，請詢問他們想要整合哪個 API，然後使用該值呼叫 `fetch_api`。
- 該工具在完全符合時僅傳回相符的 API，在不完全符合時則傳回完整的 API 目錄（名稱、說明與 `key`）。
- 根據名稱與說明識別與使用者請求相符的 API。
- 在繼續之前提取使用者請求 API 的正確 `key`。此金鑰將用於隨後所有與該 API 相關的工具呼叫。

**如果請求的 API 不在清單中：**
- 告知使用者該 API 目前在此插件 (context-matic) 中不可用並停止。
- 請求使用者指導如何繼續進行該 API 的整合。

### 3. 獲取整合指南

- 為 `ask` 提供：`language`、`key`（來自步驟 2）以及你的 `query`（查詢）。
- 將複雜的問題拆分為較小的聚焦查詢以獲得最佳效果：
  - _「我該如何進行驗證？」_
  - _「我該如何建立一筆付款？」_
  - _「速率限制為何？」_

### 4. 查詢 SDK 模型與端點（視需要）

這些工具僅傳回定義 — 它們不會呼叫 API 或產生程式碼。

- **model_search** — 查詢模型/物件定義。
  - 提供：`language`、`key` 以及作為 `query` 的精確或部分大小寫敏感的模型名稱（例如 `availableBalance`、`TransactionId`）。
- **endpoint_search** — 查詢端點方法的詳細資訊。
  - 提供：`language`、`key` 以及作為 `query` 的精確或部分大小寫敏感的方法名稱（例如 `createUser`、`get_account_balance`）。

### 5. 記錄里程碑

每當在 **程式碼或基礎架構中具體達成**（而不僅是提到或計畫）以下項目之一時，請呼叫 **update_activity**（並附帶適當的 `milestone`）：

| 里程碑 | 何時傳遞 |
|---|---|
| `sdk_setup` | SDK 套件已安裝於專案中（例如 `npm install`、`pip install`、`go get` 已執行並成功）。 |
| `auth_configured` | API 憑證已明確寫入專案的執行環境中（例如存在於 `.env` 檔案、秘密管理員或設定檔中）**且**在實際程式碼中被引用。 |
| `first_call_made` | 首次 API 呼叫程式碼已編寫並執行。 |
| `error_encountered` | 開發者回報臭蟲、錯誤回應或失敗的呼叫。 |
| `error_resolved` | 修復已套用且 API 呼叫確認可正常運作。 |

## 檢查清單

- [ ] 已偵測專案的主要語言（步驟 1a）
- [ ] 若遺漏準則檔案已呼叫 `add_guidelines`，否則跳過
- [ ] 若遺漏 `{language}-conventions` 已呼叫 `add_skills`，否則跳過
- [ ] 已使用正確的 `language` 與 `key`（API 名稱）呼叫 `fetch_api`
- [ ] 已為請求的 API 識別出正確的 `key`（或若未找到已告知使用者）
- [ ] 僅在程式碼/基礎架構中具體達成里程碑時呼叫 `update_activity` — 絕不針對提問、搜尋或工具查詢呼叫
- [ ] 在每個整合里程碑處使用適當的 `milestone` 呼叫 `update_activity`
- [ ] 已使用 `ask` 獲取整合指南與程式碼範例
- [ ] 視需要使用 `model_search` / `endpoint_search` 獲取 SDK 詳細資訊
- [ ] 每次修改程式碼後專案皆可編譯

## 備註

- **找不到 API**：如果 `fetch_api` 中缺少某個 API，請勿猜測 SDK 用法 — 告知使用者該 API 目前在此插件中不可用並停止。
- **update_activity 與 fetch_api**：`fetch_api` 是 API 發現而非整合 — 請勿在呼叫它之前呼叫 `update_activity`。
---
