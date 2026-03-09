# 專案 (Projects) V2

GitHub 專案 V2 是透過 GraphQL 進行管理的。MCP 伺服器提供了三個封裝了 GraphQL API 的工具，因此您通常不需要使用原始的 GraphQL。

## 使用 MCP 工具 (推薦)

**列出專案：**
呼叫 `mcp__github__projects_list` 並設定 `method: "list_projects"`、`owner` 與 `owner_type` (「使用者 user」或「組織 organization」)。

**列出專案欄位：**
呼叫 `mcp__github__projects_list` 並設定 `method: "list_project_fields"` 與 `project_number`。

**列出專案項目：**
呼叫 `mcp__github__projects_list` 並設定 `method: "list_project_items"` 與 `project_number`。

**將議題/PR 加入專案：**
呼叫 `mcp__github__projects_write` 並設定 `method: "add_project_item"`、`project_id` (節點 ID) 與 `content_id` (議題/PR 的節點 ID)。

**更新專案項目欄位值：**
呼叫 `mcp__github__projects_write` 並設定 `method: "update_project_item"`、`project_id`、`item_id`、`field_id` 以及 `value` (物件，包含下列其中一項：`text`、`number`、`date`、`singleSelectOptionId`、`iterationId`)。

**刪除專案項目：**
呼叫 `mcp__github__projects_write` 並設定 `method: "delete_project_item"`、`project_id` 與 `item_id`。

## 專案作業的工作流程

1. **尋找專案** — 參閱下方的 [依名稱尋找專案](#依名稱尋找專案)。
2. **探索欄位** — 使用 `projects_list` 搭配 `list_project_fields` 以取得欄位 ID 與選項 ID。
3. **尋找項目** — 使用 `projects_list` 搭配 `list_project_items` 以取得項目 ID。
4. **執行 Mutation** — 使用 `projects_write` 來新增、更新或刪除項目。

## 依名稱尋找專案

> **⚠️ 已知問題：** `projectsV2(query: "…")` 執行的是關鍵字搜尋，而非精確名稱比對，且會傳回依近期 (recency) 排序的結果。常見的字詞如「issue」或「bug」會傳回數百個錯誤的相符項。實際的專案可能埋藏在數十頁之後。

請遵循下列優先順序：

### 1. 直接查閱 (如果您知道編號)
```bash
gh api graphql -f query='{
  organization(login: "組織名稱") {
    projectV2(number: 42) { id title }
  }
}' --jq '.data.organization.projectV2'
```

### 2. 從已知議題進行反向查閱 (最可靠)
如果使用者提到了專案中的某個議題、史詩 (Epic) 或里程碑，請查詢該議題的 `projectItems` 以探索專案：

```bash
gh api graphql -f query='{
  repository(owner: "擁有者", name: "儲存庫") {
    issue(number: 123) {
      projectItems(first: 10) {
        nodes {
          id
          project { number title id }
        }
      }
    }
  }
}' --jq '.data.repository.issue.projectItems.nodes[] | {number: .project.number, title: .project.title, id: .project.id}'
```

對於名稱搜尋失效的大型組織，這是最可靠的方法。

### 3. GraphQL 名稱搜尋搭配用戶端篩選 (備用方案)
查詢較大範圍的頁面，並在用戶端進行精確標題比對的篩選：

```bash
gh api graphql -f query='{
  organization(login: "組織名稱") {
    projectsV2(first: 100, query: "搜尋字詞") {
      nodes { number title id }
    }
  }
}' --jq '.data.organization.projectsV2.nodes[] | select(.title | test("(?i)^精確名稱$"))'
```

如果未傳回任何結果，請搭配 `after` 游標進行分頁，或放寬正則運算式 (Regex)。由於結果是依近期排序，因此較舊的專案需要進行分頁。

### 4. MCP 工具 (僅限小型組織)
呼叫 `mcp__github__projects_list` 並設定 `method: "list_projects"`。這對專案數量少於 50 個的組織運作良好，但由於沒有名稱篩選器，您必須掃描所有結果。

## 用於進度報告的專案探索

當使用者詢問專案的進度更新時 (例如「給我專案 X 的進度更新」)，請遵循此工作流程：

1. **尋找專案** — 使用上述的 [尋找專案](#依名稱尋找專案) 策略。如果名稱搜尋失敗，請詢問使用者一個已知的議題編號。

2. **探索欄位** — 呼叫 `projects_list` 搭配 `list_project_fields` 來尋找「狀態 (Status)」欄位 (其選項會告訴您工作流程階段) 以及任何「疊代 (Iteration)」欄位 (以限定在目前 Sprint 的範圍)。

3. **取得所有項目** — 呼叫 `projects_list` 搭配 `list_project_items`。對於大型專案 (100 個以上項目)，請巡覽所有頁面。每個項目皆包含其欄位值 (狀態、疊代、指派者)。

4. **建立報告** — 根據「狀態」欄位值將項目分組並計算數量。對於基於疊代的專案，先篩選出目前的疊代。呈現如下的分析：

   ```
   專案：議題欄位 (疊代 42，3 月 2-8 日)
   15 個可執行的項目：
     🎉 已完成：      4 (27%)
     檢閱中：        3
     進行中：        3
     就緒：          2
     已阻礙：        2
   ```

5. **加入上下文** — 如果項目有子議題，請包含 `subIssuesSummary` 計數。如果項目有相依性，請註明被阻礙的項目以及阻礙它們的因素。

## OAuth 範圍 (Scope) 要求

| 作業 | 要求的範圍 |
|-----------|---------------|
| 讀取專案、欄位、項目 | `read:project` |
| 新增/更新/刪除項目、變更欄位值 | `project` |

**常見陷阱：** 預設的 `gh auth` 權杖通常僅具有 `read:project` 權限。執行 Mutation 會失敗並顯示 `INSUFFICIENT_SCOPES`。若要加入寫入範圍：

```bash
gh auth refresh -h github.com -s project
```

這會觸發基於瀏覽器的 OAuth 流程。您必須完成此流程後 Mutation 才能運作。

## 尋找議題的專案項目 ID

當您知道議題但需要其專案項目 ID 時 (例如為了更新其狀態)，請從議題端進行查詢：

```bash
gh api graphql -f query='
{
  repository(owner: "擁有者", name: "儲存庫") {
    issue(number: 123) {
      projectItems(first: 5) {
        nodes {
          id
          project { title number }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}' --jq '.data.repository.issue.projectItems.nodes'
```

這會在單次查詢中傳回項目 ID、專案資訊與目前的欄位值。

## 透過 gh api 使用 GraphQL (推薦)

使用 `gh api graphql` 執行 GraphQL 查詢與 Mutation。對於寫入作業，這比 MCP 工具更可靠。

**尋找專案及其狀態欄位選項：**
```bash
gh api graphql -f query='
{
  organization(login: "組織名稱") {
    projectV2(number: 5) {
      id
      title
      field(name: "Status") {
        ... on ProjectV2SingleSelectField {
          id
          options { id name }
        }
      }
    }
  }
}' --jq '.data.organization.projectV2'
```

**列出所有欄位 (包含疊代)：**
```bash
gh api graphql -f query='
{
  node(id: "專案識別碼") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2Field { id name }
          ... on ProjectV2SingleSelectField { id name options { id name } }
          ... on ProjectV2IterationField { id name configuration { iterations { id startDate } } }
        }
      }
    }
  }
}' --jq '.data.node.fields.nodes'
```

**更新欄位值 (例如將狀態設定為「進行中」)：**
```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "專案識別碼"
    itemId: "項目識別碼"
    fieldId: "欄位識別碼"
    value: { singleSelectOptionId: "選項識別碼" }
  }) {
    projectV2Item { id }
  }
}'
```

`value` 接受下列其中之一：`text`、`number`、`date`、`singleSelectOptionId`、`iterationId`。

**新增項目：**
```bash
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "專案識別碼"
    contentId: "議題或 PR 節點識別碼"
  }) {
    item { id }
  }
}'
```

**刪除項目：**
```bash
gh api graphql -f query='
mutation {
  deleteProjectV2Item(input: {
    projectId: "專案識別碼"
    itemId: "項目識別碼"
  }) {
    deletedItemId
  }
}'
```

## 端對端範例：將議題狀態設定為「進行中」

```bash
# 1. 取得議題的專案項目 ID、專案 ID 以及目前狀態
gh api graphql -f query='{
  repository(owner: "github", name: "planning-tracking") {
    issue(number: 2574) {
      projectItems(first: 1) {
        nodes { id project { id title } }
      }
    }
  }
}' --jq '.data.repository.issue.projectItems.nodes[0]'

# 2. 取得「狀態 (Status)」欄位 ID 以及「進行中 (In Progress)」選項 ID
gh api graphql -f query='{
  node(id: "專案識別碼") {
    ... on ProjectV2 {
      field(name: "Status") {
        ... on ProjectV2SingleSelectField { id options { id name } }
      }
    }
  }
}' --jq '.data.node.field'

# 3. 更新狀態
gh api graphql -f query='mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "專案識別碼"
    itemId: "項目識別碼"
    fieldId: "欄位識別碼"
    value: { singleSelectOptionId: "進行中選項識別碼" }
  }) { projectV2Item { id } }
}'
```
