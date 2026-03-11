# 議題相依性 (被封鎖 / 封鎖中) (Issue Dependencies - Blocked By / Blocking)

相依性讓您可以標記某個議題被另一個議題封鎖。這會建立一個正式的相依關係，可在 UI 中檢視並透過 API 追蹤。目前沒有針對相依性的 MCP 工具；請直接使用 REST 或 GraphQL。

## 使用 REST API

**列出封鎖此議題的議題**：
```
GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by
```

**新增一個封鎖相依性**：
```
POST /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by
主體 (Body)：{ "issue_id": 12345 }
```

`issue_id` 是數值形式的議題 **ID**（非議題編號）。

**移除一個封鎖相依性**：
```
DELETE /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by/{issue_id}
```

## 使用 GraphQL

**讀取相依性**：
```graphql
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 123) {
      blockedBy(first: 10) { nodes { number title state } }
      blocking(first: 10) { nodes { number title state } }
      issueDependenciesSummary { blockedBy blocking totalBlockedBy totalBlocking }
    }
  }
}
```

**新增相依性**：
```graphql
mutation {
  addBlockedBy(input: {
    issueId: "被封鎖議題的節點_ID"
    blockingIssueId: "執行封鎖議題的節點_ID"
  }) {
    blockingIssue { number title }
  }
}
```

**移除相依性**：
```graphql
mutation {
  removeBlockedBy(input: {
    issueId: "被封鎖議題的節點_ID"
    blockingIssueId: "執行封鎖議題的節點_ID"
  }) {
    blockingIssue { number title }
  }
}
```

## 被追蹤的議題 (唯讀)

任務清單 (Task-list) 追蹤關係可透過 GraphQL 作為唯讀欄位取得：

- `trackedIssues(first: N)` - 在此議題的任務清單中被追蹤的議題
- `trackedInIssues(first: N)` - 其任務清單中引用了此議題的議題

當議題在任務清單中被引用時（`- [ ] #123`），這些關係會自動設定。目前沒有可以用於管理這些關係的變更 (Mutations)。
