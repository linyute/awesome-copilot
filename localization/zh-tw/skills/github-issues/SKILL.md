---
name: github-issues
description: '使用 MCP 工具建立、更新及管理 GitHub issue。當使用者想要建立錯誤回報、功能要求或任務 issue、更新現有 issue、加入標籤/指派人員/里程碑，或管理 issue 工作流程時，請使用此技能。觸發條件包括「建立一個 issue」、「回報一個錯誤」、「要求一個功能」、「更新 issue X」或任何 GitHub issue 管理任務等請求。'
---

# GitHub Issue

使用 `@modelcontextprotocol/server-github` MCP 伺服器來管理 GitHub issue。

## 可用的 MCP 工具

| 工具 | 用途 |
|------|---------|
| `mcp__github__create_issue` | 建立新 issue |
| `mcp__github__update_issue` | 更新現有 issue |
| `mcp__github__get_issue` | 獲取 issue 詳情 |
| `mcp__github__search_issues` | 搜尋 issue |
| `mcp__github__add_issue_comment` | 新增留言 |
| `mcp__github__list_issues` | 列出儲存庫 issue |

## 工作流程

1. **確定操作**：建立、更新還是查詢？
2. **收集內容資訊**：獲取儲存庫資訊、現有標籤，如有需要則獲取里程碑
3. **建構內容**：使用來自 [references/templates.md](references/templates.md) 的適當範本
4. **執行**：呼叫適當的 MCP 工具
5. **確認**：向使用者回報 issue URL

## 建立 Issue

### 必要參數

```
owner: 儲存庫擁有者 (組織或使用者)
repo: 儲存庫名稱
title: 清晰、具體且可執行的標題
body: 結構化的 markdown 內容
```

### 選用參數

```
labels: ["bug", "enhancement", "documentation", ...]
assignees: ["username1", "username2"]
milestone: 里程碑編號 (整數)
```

### 標題指南

- 在有用的情況下，以類型前綴開始：`[Bug]`、`[Feature]`、`[Docs]`
- 具體且可執行
- 保持在 72 個字元以內
- 範例：
  - `[Bug] 啟用 SSO 時登入失敗`
  - `[Feature] 新增深色模式支援`
  - `為驗證模組新增單元測試`

### 內容結構 (Body Structure)

務必使用 [references/templates.md](references/templates.md) 中的範本。根據 issue 類型選擇：

| 使用者請求 | 範本 |
|--------------|----------|
| 錯誤、錯誤訊息、損壞、無法運作 | 錯誤回報 (Bug Report) |
| 功能、增強、新增、全新 | 功能要求 (Feature Request) |
| 任務、雜務、重構、更新 | 任務 (Task) |

## 更新 Issue

使用 `mcp__github__update_issue` 並包含：

```
owner, repo, issue_number (必要)
title, body, state, labels, assignees, milestone (選用 - 僅包含變更的欄位)
```

狀態值：`open`、`closed`

## 範例

### 範例 1：錯誤回報

**使用者**：「建立一個錯誤 issue - 使用 SSO 時登入頁面當機」

**操作**：呼叫 `mcp__github__create_issue` 並包含：
```json
{
  "owner": "github",
  "repo": "awesome-copilot",
  "title": "[Bug] 使用 SSO 時登入頁面當機",
  "body": "## 說明\n當使用者嘗試使用 SSO 進行驗證時，登入頁面會當機。\n\n## 重現步驟\n1. 導覽至登入頁面\n2. 點擊「使用 SSO 登入」\n3. 頁面當機\n\n## 預期行為\nSSO 驗證應完成並重新導向至儀表板。\n\n## 實際行為\n頁面變得無回應並顯示錯誤。\n\n## 環境\n- 瀏覽器：[待填寫]\n- 作業系統：[待填寫]\n\n## 其他背景資訊\n由使用者回報。",
  "labels": ["bug"]
}
```

### 範例 2：功能要求

**使用者**：「為深色模式建立一個高優先權的功能要求」

**操作**：呼叫 `mcp__github__create_issue` 並包含：
```json
{
  "owner": "github",
  "repo": "awesome-copilot",
  "title": "[Feature] 新增深色模式支援",
  "body": "## 摘要\n新增深色模式主題選項，以提升使用者體驗和無障礙性。\n\n## 動機\n- 減少低光源環境下的眼睛疲勞\n- 使用者期待度日益增高\n- 提升無障礙性\n\n## 建議解決方案\n實作具備系統偏好偵測功能的主題切換。\n\n## 驗收標準\n- [ ] 設定中提供切換開關\n- [ ] 持久化使用者偏好\n- [ ] 預設遵循系統偏好\n- [ ] 所有 UI 元件皆支援兩種主題\n\n## 曾考慮的替代方案\n未指定。\n\n## 其他背景資訊\n高優先權要求。",
  "labels": ["enhancement", "high-priority"]
}
```

## 常用標籤

在適用時使用這些標準標籤：

| 標籤 | 用於 |
|-------|---------|
| `bug` | 某些功能無法運作 |
| `enhancement` | 新功能或改進 |
| `documentation` | 文件更新 |
| `good first issue` | 適合新手 |
| `help wanted` | 需要額外關注 |
| `question` | 需要進一步資訊 |
| `wontfix` | 不會處理 |
| `duplicate` | 已存在重複項 |
| `high-priority` | 緊急問題 |

## 提示

- 在建立 issue 之前，務必確認儲存庫內容資訊
- 詢問缺失的關鍵資訊，而非憑空猜測
- 在已知情況下連結相關 issue：`Related to #123`
- 對於更新操作，先獲取目前的 issue 以保留未變更的欄位
