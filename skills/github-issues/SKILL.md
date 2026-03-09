---
name: github-issues
description: '使用 MCP 工具建立、更新與管理 GitHub 議題 (Issues)。當使用者想要建立錯誤報告、功能請求或工作議題、更新現有議題、加入標籤/指派者/里程碑、設定議題欄位 (日期、優先級、自定義欄位)、設定議題類型或管理議題工作流程時，請使用此技能。適用於「建立議題」、「提報錯誤」、「請求功能」、「更新議題 X」、「設定優先級」、「設定開始日期」或任何 GitHub 議題管理任務等請求。'
---

# GitHub 議題 (Issues)

使用 `@modelcontextprotocol/server-github` MCP 伺服器管理 GitHub 議題。

## 可用的工具

### MCP 工具 (讀取作業)

| 工具 | 用途 |
|------|---------|
| `mcp__github__issue_read` | 讀取議題詳細資料、子議題、評論、標籤 (方法：get, get_comments, get_sub_issues, get_labels) |
| `mcp__github__list_issues` | 列出並根據狀態、標籤、日期篩選儲存庫議題 |
| `mcp__github__search_issues` | 使用 GitHub 搜尋語法跨儲存庫搜尋議題 |
| `mcp__github__projects_list` | 列出專案、專案欄位、專案項目、狀態更新 |
| `mcp__github__projects_get` | 取得專案、欄位、項目或狀態更新的詳細資料 |
| `mcp__github__projects_write` | 新增/更新/刪除專案項目，建立狀態更新 |

### CLI / REST API (寫入作業)

目前 MCP 伺服器不支援建立、更新議題或對議題發表評論。請使用 `gh api` 執行這些作業。

| 作業 | 指令 |
|-----------|---------|
| 建立議題 | `gh api repos/{owner}/{repo}/issues -X POST -f title=... -f body=...` |
| 更新議題 | `gh api repos/{owner}/{repo}/issues/{number} -X PATCH -f title=... -f state=...` |
| 加入評論 | `gh api repos/{owner}/{repo}/issues/{number}/comments -X POST -f body=...` |
| 關閉議題 | `gh api repos/{owner}/{repo}/issues/{number} -X PATCH -f state=closed` |
| 設定議題類型 | 在建立呼叫中包含 `-f type=Bug` (僅限 REST API，`gh issue create` CLI 不支援) |

**注意：** `gh issue create` 適用於基本的議題建立，但 **不支援** `--type` 旗標。當您需要設定議題類型時，請使用 `gh api`。

## 工作流程

1. **判斷動作**：建立、更新還是查詢？
2. **收集上下文**：視需要取得儲存庫資訊、現有標籤、里程碑
3. **建構內容**：使用 [references/templates.md](references/templates.md) 中的適當範本
4. **執行**：讀取作業使用 MCP 工具，寫入作業使用 `gh api`
5. **確認**：向使用者回報議題 URL

## 建立議題

使用 `gh api` 建立議題。這支援包含議題類型在內的所有參數。

```bash
gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f title="議題標題" \
  -f body="Markdown 格式的議題本文" \
  -f type="Bug" \
  --jq '{number, html_url}'
```

### 選用參數

在 `gh api` 呼叫中加入下列任何旗標：

```
-f type="Bug"                    # 議題類型 (Bug, Feature, Task, Epic 等)
-f labels[]="bug"                # 標籤 (多個標籤請重複使用)
-f assignees[]="username"        # 指派者 (多個指派者請重複使用)
-f milestone=1                   # 里程碑編號
```

**議題類型** 是組織層級的 Metadata。若要探索可用的類型，請使用：
```bash
gh api graphql -f query='{ organization(login: "組織名稱") { issueTypes(first: 10) { nodes { name } } } }' --jq '.data.organization.issueTypes.nodes[].name'
```

**分類時優先使用議題類型而非標籤。** 當議題類型可用時 (例如 Bug, Feature, Task)，請使用 `type` 參數，而非套用對等的標籤 (如 `bug` 或 `enhancement`)。議題類型是 GitHub 上對議題進行分類的規範方式。僅當組織未設定任何議題類型時，才退而使用標籤。

### 標題準則

- 應具體且具備行動性
- 保持在 72 個字元以內
- 設定議題類型時，不要加入冗餘的前綴 (如 `[Bug]`)
- 範例：
  - `啟用 SSO 時登入失敗` (使用 type=Bug)
  - `加入深色模式支援` (使用 type=Feature)
  - `為驗證模組加入單元測試` (使用 type=Task)

### 本文結構

務必使用 [references/templates.md](references/templates.md) 中的範本。根據議題類型進行選擇：

| 使用者請求 | 範本 |
|--------------|----------|
| 錯誤、故障、損壞、無法運作 | 錯誤報告 (Bug Report) |
| 功能、增強、加入、新增 | 功能請求 (Feature Request) |
| 任務、瑣事、重構、更新 | 任務 (Task) |

## 更新議題

搭配 PATCH 使用 `gh api`：

```bash
gh api repos/{owner}/{repo}/issues/{number} \
  -X PATCH \
  -f state=closed \
  -f title="更新後的標題" \
  --jq '{number, html_url}'
```

僅包含您想要變更的欄位。可用欄位：`title`、`body`、`state` (open/closed)、`labels`、`assignees`、`milestone`。

## 範例

### 範例 1：錯誤報告 (Bug Report)

**使用者**：「建立一個 Bug 議題 - 使用 SSO 時登入頁面當機」

**動作**：
```bash
gh api repos/github/awesome-copilot/issues \
  -X POST \
  -f title="使用 SSO 時登入頁面當機" \
  -f type="Bug" \
  -f body="## 說明
當使用者嘗試使用 SSO 進行驗證時，登入頁面會發生當機。

## 重現步驟
1. 導覽至登入頁面
2. 按一下「使用 SSO 登入」
3. 頁面當機

## 預期行為
SSO 驗證應完成並重新導向至儀表板。

## 實際行為
頁面變得無回應並顯示錯誤。" \
  --jq '{number, html_url}'
```

### 範例 2：功能請求 (Feature Request)

**使用者**：「為深色模式建立一個高優先級的功能請求」

**動作**：
```bash
gh api repos/github/awesome-copilot/issues \
  -X POST \
  -f title="加入深色模式支援" \
  -f type="Feature" \
  -f labels[]="high-priority" \
  -f body="## 摘要
加入深色模式主題選項，以提升使用者體驗與無障礙性。

## 動機
- 減輕低光源環境下的眼睛疲勞
- 使用者對此功能的預期日益增加

## 建議解決方案
實作具備系統偏好設定偵測功能的主題切換。

## 驗收標準
- [ ] 設定中有切換開關
- [ ] 永久儲存使用者偏好
- [ ] 預設遵循系統偏好設定" \
  --jq '{number, html_url}'
```

## 常見標籤

適用時請使用下列標準標籤：

| 標籤 | 用途 |
|-------|---------|
| `bug` | 某些功能無法運作 |
| `enhancement` | 新功能或改進 |
| `documentation` | 文件更新 |
| `good first issue` | 適合新手 |
| `help wanted` | 需要額外關注 |
| `question` | 請求進一步資訊 |
| `wontfix` | 將不予處理 |
| `duplicate` | 已存在重複項 |
| `high-priority` | 緊急議題 |

## 提示

- 建立議題前務必確認儲存庫內容
- 缺少關鍵資訊時請詢問，而非自行猜測
- 已知時請連結相關議題：`Related to #123`
- 進行更新時，先抓取目前議題以保留未變更的欄位

## 擴充功能

下列功能需要基礎 MCP 工具之外的 REST 或 GraphQL API。每一項都記錄在各自的參考文件中，以便代理程式僅載入所需的知識。

| 功能 | 使用時機 | 參考資料 |
|------------|-------------|-----------|
| 進階搜尋 | 具備布林邏輯、日期範圍、跨儲存庫搜尋、議題欄位篩選 (`field.name:value`) 的複雜查詢 | [references/search.md](references/search.md) |
| 子議題與父議題 | 將工作拆分為階層式任務 | [references/sub-issues.md](references/sub-issues.md) |
| 議題相依性 | 追蹤「被哪些阻礙」/「阻礙了哪些」的關係 | [references/dependencies.md](references/dependencies.md) |
| 議題類型 (進階) | 超出 MCP `list_issue_types` / `type` 參數的 GraphQL 作業 | [references/issue-types.md](references/issue-types.md) |
| 專案 V2 | 專案面板、進度報告、欄位管理 | [references/projects.md](references/projects.md) |
| 議題欄位 | 自定義 Metadata：日期、優先級、文字、數字 (私人預覽) | [references/issue-fields.md](references/issue-fields.md) |
| 議題中的圖片 | 透過 CLI 在議題本文與評論中嵌入圖片 | [references/images.md](references/images.md) |
