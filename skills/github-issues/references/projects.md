# 專案 V2 (Projects V2)

GitHub 專案 V2 是透過 GraphQL 進行管理的。MCP 伺服器提供了三個封裝了 GraphQL API 的工具，因此您通常不需要使用原始的 GraphQL。

## 使用 MCP 工具（偏好使用）

**列出專案**：
呼叫 `mcp__github__projects_list` 並帶入 `method: "list_projects"`、`owner` 與 `owner_type`（"user" 或 "organization"）。

**列出專案欄位**：
呼叫 `mcp__github__projects_list` 並帶入 `method: "list_project_fields"` 與 `project_number`。

**列出專案項目**：
呼叫 `mcp__github__projects_list` 並帶入 `method: "list_project_items"` 與 `project_number`。

**將議題 (Issue)/提取要求 (PR) 加入專案**：
呼叫 `mcp__github__projects_write` 並帶入 `method: "add_project_item"`、`project_id` (node ID) 與 `content_id`（議題/提取要求的 node ID）。

**更新專案項目欄位值**：
呼叫 `mcp__github__projects_write` 並帶入 `method: "update_project_item"`、`project_id`、`item_id`、`field_id` 與 `value`（包含以下其中一個項目的物件：`text`、`number`、`date`、`singleSelectOptionId`、`iterationId`）。

**刪除專案項目**：
呼叫 `mcp__github__projects_write` 並帶入 `method: "delete_project_item"`、`project_id` 與 `item_id`。

## 專案操作工作流程

1. **尋找專案**：使用 `projects_list` 搭配 `list_projects` 以取得專案編號與節點 ID
2. **探索欄位**：使用 `projects_list` 搭配 `list_project_fields` 以取得欄位 ID 與選項 ID
3. **尋找項目**：使用 `projects_list` 搭配 `list_project_items` 以取得項目 ID
4. **變更 (Mutate)**：使用 `projects_write` 來新增、更新或刪除項目

## 用於進度報告的專案探索

當使用者要求專案的進度更新時（例如：「給我專案 X 的進度更新」），請遵循此工作流程：

1. **依名稱搜尋**：呼叫 `projects_list` 搭配 `list_projects` 並掃描結果中與使用者查詢相符的標題。專案名稱通常較為口語，因此請彈性匹配（例如：「issue fields」可匹配「Issue fields」或「Issue Fields and Types」）。

2. **探索欄位**：呼叫 `projects_list` 搭配 `list_project_fields` 以尋找「狀態」(Status) 欄位（其選項會告訴您工作流程階段）以及任何「迭代」(Iteration) 欄位（用以界定當前衝刺 (Sprint) 的範圍）。

3. **取得所有項目**：呼叫 `projects_list` 搭配 `list_project_items`。對於大型專案（超過 100 個項目），請逐頁分頁讀取。每個項目都包含其欄位值（狀態、迭代、指派對象）。

4. **建構報告**：依據「狀態」欄位值對項目進行分組並計算數量。對於基於迭代的專案，請先篩選至當前迭代。呈現如下的細目：

   ```
   專案：議題欄位 (第 42 次迭代，3 月 2-8 日)
   15 個可執行的項目：
     🎉 已完成 (Done)：    4 (27%)
     檢閱中 (In Review)：  3
     執行中 (In Progress)：3
     就緒 (Ready)：        2
     已封鎖 (Blocked)：    2
   ```

5. **加入上下文**：若項目具備子議題，請包含 `subIssuesSummary` 計數。若項目具備相依性，請註明被封鎖的項目以及封鎖它們的因素。

**提示**：對於組織層級的專案，請使用 GraphQL 並搭配 `organization.projectsV2(first: 20, query: "搜尋詞彙")` 來直接依名稱搜尋，這比列出所有專案更快。

## 直接使用 GraphQL（進階）

需要的權限範圍：查詢需具備 `read:project`，變更需具備 `project`。

**尋找專案**：
```graphql
{
  organization(login: "組織名稱") {
    projectV2(number: 5) { id title }
  }
}
```

**列出欄位（包含單選選項）**：
```graphql
{
  node(id: "PROJECT_ID") {
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
}
```

**新增項目**：
```graphql
mutation {
  addProjectV2ItemById(input: {
    projectId: "PROJECT_ID"
    contentId: "議題或提取要求的節點_ID"
  }) {
    item { id }
  }
}
```

**更新欄位值**：
```graphql
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
    fieldId: "FIELD_ID"
    value: { singleSelectOptionId: "選項_ID" }
  }) {
    projectV2Item { id }
  }
}
```

值可接受以下其中一項：`text`、`number`、`date`、`singleSelectOptionId`、`iterationId`。

**刪除項目**：
```graphql
mutation {
  deleteProjectV2Item(input: {
    projectId: "PROJECT_ID"
    itemId: "ITEM_ID"
  }) {
    deletedItemId
  }
}
```
