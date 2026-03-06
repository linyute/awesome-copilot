---
name: github-issues
description: '使用 MCP 工具建立、更新與管理 GitHub 議題。當使用者想要建立錯誤回報 (Bug reports)、功能請求或任務議題，更新現有議題，加入標籤/指派對象/里程碑，設定議題欄位（日期、優先順序、自訂欄位），設定議題類型或管理議題工作流程時，使用此技能。適用於如「建立議題」、「提報錯誤」、「要求新功能」、「更新議題 X」、「設定優先順序」、「設定開始日期」或任何 GitHub 議題管理任務等請求。'
---

# GitHub 議題 (GitHub Issues)

使用 `@modelcontextprotocol/server-github` MCP 伺服器管理 GitHub 議題。

## 可用的 MCP 工具

| 工具 | 用途 |
|------|---------|
| `mcp__github__create_issue` | 建立新議題 |
| `mcp__github__update_issue` | 更新現有議題 |
| `mcp__github__get_issue` | 獲取議題詳情 |
| `mcp__github__search_issues` | 搜尋議題 |
| `mcp__github__add_issue_comment` | 加入評論 |
| `mcp__github__list_issues` | 列出儲存庫中的議題 |
| `mcp__github__list_issue_types` | 列出組織可用的議題類型 |
| `mcp__github__issue_read` | 讀取議題詳情、子議題、評論、標籤 |
| `mcp__github__projects_list` | 列出專案、專案欄位、專案項目、狀態更新 |
| `mcp__github__projects_get` | 獲取專案、欄位、項目或狀態更新的詳情 |
| `mcp__github__projects_write` | 新增/更新/刪除專案項目，建立狀態更新 |

## 工作流程

1. **確定動作**：要建立、更新還是查詢？
2. **收集上下文**：獲取儲存庫資訊、現有標籤，必要時獲取里程碑
3. **結構化內容**：使用來自 [references/templates.md](references/templates.md) 的適當範本
4. **執行**：呼叫適當的 MCP 工具
5. **確認**：向使用者回報議題的 URL

## 建立議題

### 必要參數

```
owner: 儲存庫擁有者（組織或個人）
repo: 儲存庫名稱  
title: 清楚且具備行動導向的標題
body: 具備結構的 Markdown 內容
```

### 選填參數

```
labels: ["bug", "enhancement", "documentation", ...]
assignees: ["username1", "username2"]
milestone: 里程碑編號（整數）
type: 議題類型名稱（例如："Bug", "Feature", "Task", "Epic"）
```

**議題類型 (Issue types)** 是組織層級的 Metadata。在使用 `type` 之前，請先呼叫 `mcp__github__list_issue_types` 並帶入組織名稱以探索可用的類型。若該組織未設定議題類型，則省略此參數。

**優先使用議題類型而非標籤進行分類**。當有議題類型可用時（例如：Bug、Feature、Task），請使用 `type` 參數，而非套用如 `bug` 或 `enhancement` 等對應的標籤。議題類型是 GitHub 上對議題進行分類的標準方式。僅在組織未設定議題類型時，才改為使用標籤。

### 標題指引

- 必要時以類型前綴開頭：`[Bug]`、`[Feature]`、`[Docs]`
- 具體且具備行動導向
- 保持在 72 個字元以內
- 範例：
  - `[Bug] 啟用 SSO 時登入失敗`
  - `[Feature] 增加深色模式支援`
  - `為驗證模組加入單元測試`

### 內容結構

請務必使用 [references/templates.md](references/templates.md) 中的範本。根據議題類型進行選擇：

| 使用者請求 | 範本 |
|--------------|----------|
| Bug、錯誤、損壞、無法運作 | 錯誤回報 (Bug Report) |
| 功能、增強、加入、新增 | 功能請求 (Feature Request) |
| 任務、瑣事、重構、更新 | 任務 (Task) |

## 更新議題

搭配以下參數使用 `mcp__github__update_issue`：

```
owner, repo, issue_number (必要)
title, body, state, labels, assignees, milestone (選填 - 僅包含變更的欄位)
```

狀態 (State) 值：`open` (開啟)、`closed` (關閉)

## 範例

### 範例 1：錯誤回報 (Bug Report)

**使用者**：「建立一個 Bug 議題 - 使用 SSO 時登入頁面會當掉」

**動作**：呼叫 `mcp__github__create_issue` 並帶入：
```json
{
  "owner": "github",
  "repo": "awesome-copilot",
  "title": "[Bug] 使用 SSO 時登入頁面會當掉",
  "body": "## 描述\n當使用者嘗試使用 SSO 進行驗證時，登入頁面會發生當機。\n\n## 重現步驟\n1. 導覽至登入頁面\n2. 點擊「使用 SSO 登入」\n3. 頁面當機\n\n## 預期行為\nSSO 驗證應完成並重新導向至儀表板。\n\n## 實際行為\n頁面變得無回應並顯示錯誤。\n\n## 環境\n- 瀏覽器：[待填寫]\n- 作業系統：[待填寫]\n\n## 額外上下文\n由使用者回報。",
  "type": "Bug"
}
```

### 範例 2：功能請求 (Feature Request)

**使用者**：「為深色模式建立一個功能請求，並設為高優先權」

**動作**：呼叫 `mcp__github__create_issue` 並帶入：
```json
{
  "owner": "github",
  "repo": "awesome-copilot",
  "title": "[Feature] 增加深色模式支援",
  "body": "## 摘要\n加入深色模式佈景主題選項，以改善使用者體驗與無障礙性。\n\n## 動機\n- 減少低光源環境下的眼睛疲勞\n- 使用者期待日益增加\n- 改善無障礙性\n\n## 建議的解決方案\n實作具備系統偏好偵測功能的佈景主題切換開關。\n\n## 驗收準則\n- [ ] 設定中的切換開關\n- [ ] 永久儲存使用者偏好\n- [ ] 預設遵循系統偏好\n- [ ] 所有 UI 元件皆支援兩種主題\n\n## 考慮過的替代方案\n未指定。\n\n## 額外上下文\n高優先權請求。",
  "type": "Feature",
  "labels": ["high-priority"]
}
```

## 常見標籤

在適用時使用這些標準標籤：

| 標籤 | 用於 |
|-------|---------|
| `bug` | 某些功能無法運作 |
| `enhancement` | 新功能或改進 |
| `documentation` | 文件更新 |
| `good first issue` | 適合新手 |
| `help wanted` | 需要額外關注 |
| `question` | 要求進一步資訊 |
| `wontfix` | 將不予處理 |
| `duplicate` | 已存在重複項 |
| `high-priority` | 緊急議題 |

## 提示

- 在建立議題前務必先確認儲存庫上下文
- 針對遺漏的關鍵資訊請直接詢問而非猜測
- 若已知相關議題請進行連結：`Related to #123`
- 對於更新，請先獲取當前議題以保留未變更的欄位

## 擴充能力

以下特性需要使用基本 MCP 工具之外的 REST 或 GraphQL API。各項特性皆記錄在各自的參考檔案中，以便代理人僅載入所需的知識。

| 能力 | 何時使用 | 參考文件 |
|------------|-------------|-----------|
| 子議題與父議題 | 將工作拆解為階層式任務 | [references/sub-issues.md](references/sub-issues.md) |
| 議題相依性 | 追蹤「被封鎖」/「封鎖中」關係 | [references/dependencies.md](references/dependencies.md) |
| 議題類型（進階） | 超出 MCP `list_issue_types` / `type` 參數的 GraphQL 操作 | [references/issue-types.md](references/issue-types.md) |
| 專案 V2 | 專案面板、進度報告、欄位管理 | [references/projects.md](references/projects.md) |
| 議題欄位 | 自訂 Metadata：日期、優先順序、文字、數字（私人預覽） | [references/issue-fields.md](references/issue-fields.md) |
