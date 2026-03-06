# 議題類型 (進階 GraphQL) (Issue Types - Advanced GraphQL)

議題類型（Bug、Feature、Task、Epic 等）是在**組織**層級定義的，並由儲存庫繼承。它們在標籤 (Labels) 之外對議題進行分類。

對於基本用法，MCP 工具原生支援議題類型。呼叫 `mcp__github__list_issue_types` 來探索類型，並將 `type: "Bug"` 傳遞給 `mcp__github__create_issue` 或 `mcp__github__update_issue`。此參考文件涵蓋進階 GraphQL 操作。

## GraphQL 特性標頭 (Feature Header)

所有 GraphQL 議題類型操作皆需要 `GraphQL-Features: issue_types` HTTP 標頭。

## 列出類型（組織或儲存庫層級）

```graphql
# 標頭：GraphQL-Features: issue_types
{
  organization(login: "OWNER") {
    issueTypes(first: 20) {
      nodes { id name color description isEnabled }
    }
  }
}
```

也可以透過 `repository.issueTypes` 列出每個儲存庫的類型，或透過 `repository.issueType(name: "Bug")` 依名稱查詢。

## 讀取議題的類型

```graphql
# 標頭：GraphQL-Features: issue_types
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 123) {
      issueType { id name color }
    }
  }
}
```

## 為現有議題設定類型

```graphql
# 標頭：GraphQL-Features: issue_types
mutation {
  updateIssueIssueType(input: {
    issueId: "ISSUE_NODE_ID"
    issueTypeId: "IT_xxx"
  }) {
    issue { id issueType { name } }
  }
}
```

## 建立具備類型的議題

```graphql
# 標頭：GraphQL-Features: issue_types
mutation {
  createIssue(input: {
    repositoryId: "REPO_NODE_ID"
    title: "修復登入錯誤"
    issueTypeId: "IT_xxx"
  }) {
    issue { id number issueType { name } }
  }
}
```

若要清除類型，請將 `issueTypeId` 設定為 `null`。

## 可用顏色

`GRAY` (灰色)、`BLUE` (藍色)、`GREEN` (綠色)、`YELLOW` (黃色)、`ORANGE` (橘色)、`RED` (紅色)、`PINK` (粉紅色)、`PURPLE` (紫色)
