# 子議題與父議題 (Sub-Issues and Parent Issues)

子議題讓您可以將工作拆解為具備階層結構的任務。每個父議題最多可擁有 100 個子議題，且最多可巢狀疊加至 8 層。子議題可以跨越同一個擁有者下的不同儲存庫。

## 使用 MCP 工具

**列出子議題**：
呼叫 `mcp__github__issue_read` 並帶入 `method: "get_sub_issues"`、`owner`、`repo` 以及 `issue_number`。

**建立一個議題作為子議題**：
目前沒有直接建立子議題的 MCP 工具。請使用 REST 或 GraphQL（見下方）。

## 使用 REST API

**列出子議題**：
```
GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues
```

**取得父議題**：
```
GET /repos/{owner}/{repo}/issues/{issue_number}/parent
```

**將現有議題加入為子議題**：
```
POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues
主體 (Body)：{ "sub_issue_id": 12345 }
```

`sub_issue_id` 是數值形式的議題 **ID**（非議題編號）。您可以從任何 API 回應的議題 `id` 欄位中取得它。

若要移動已具備父議題的子議題，請加入 `"replace_parent": true`。

**移除子議題**：
```
DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue
主體 (Body)：{ "sub_issue_id": 12345 }
```

**重新排列子議題優先順序**：
```
PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority
主體 (Body)：{ "sub_issue_id": 6, "after_id": 5 }
```

使用 `after_id` 或 `before_id` 來定位子議題相對於其他議題的位置。

## 使用 GraphQL

**讀取父議題與子議題**：
```graphql
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 123) {
      parent { number title }
      subIssues(first: 50) {
        nodes { number title state }
      }
      subIssuesSummary { total completed percentCompleted }
    }
  }
}
```

**新增子議題**：
```graphql
mutation {
  addSubIssue(input: {
    issueId: "PARENT_NODE_ID"
    subIssueId: "CHILD_NODE_ID"
  }) {
    issue { id }
    subIssue { id number title }
  }
}
```

您也可以使用 `subIssueUrl` 代替 `subIssueId`（傳入議題的 HTML URL）。加入 `replaceParent: true` 來將子議題從另一個父議題移動過來。

**直接建立議題作為子議題**：
```graphql
mutation {
  createIssue(input: {
    repositoryId: "REPO_NODE_ID"
    title: "實作登入驗證"
    parentIssueId: "PARENT_NODE_ID"
  }) {
    issue { id number }
  }
}
```

**移除子議題**：
```graphql
mutation {
  removeSubIssue(input: {
    issueId: "PARENT_NODE_ID"
    subIssueId: "CHILD_NODE_ID"
  }) {
    issue { id }
  }
}
```

**重新排列子議題優先順序**：
```graphql
mutation {
  reprioritizeSubIssue(input: {
    issueId: "PARENT_NODE_ID"
    subIssueId: "CHILD_NODE_ID"
    afterId: "OTHER_CHILD_NODE_ID"
  }) {
    issue { id }
  }
}
```

使用 `afterId` 或 `beforeId` 來定位相對於其他子議題的位置。
