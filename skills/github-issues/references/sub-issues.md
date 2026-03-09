# 子議題 (Sub-Issues) 與父議題 (Parent Issues)

子議題可讓您將工作拆分為階層式任務。每個父議題最多可擁有 100 個子議題，巢狀層級最高可達 8 層。子議題可以跨越同一個擁有者下的不同儲存庫。

## 推薦的工作流程

建立子議題最簡單的方法是 **分兩個步驟**：建立議題，然後進行連結。

```bash
# 步驟 1：建立議題並擷取其數字 ID
ISSUE_ID=$(gh api repos/{owner}/{repo}/issues \
  -X POST \
  -f title="子任務標題" \
  -f body="說明" \
  --jq '.id')

# 步驟 2：將其連結為父議題的子議題
# 重要：sub_issue_id 必須是整數。使用 --input (而非 -f) 傳送 JSON。
echo "{\"sub_issue_id\": $ISSUE_ID}" | gh api repos/{owner}/{repo}/issues/{父議題編號}/sub_issues -X POST --input -
```

**為何使用 `--input` 而非 `-f`？** `gh api -f` 旗標會將所有數值作為字串傳送，但 API 要求 `sub_issue_id` 必須為整數。使用 `-f sub_issue_id=12345` 會傳回 422 錯誤。

或者，可以使用 GraphQL 的 `createIssue` 並搭配 `parentIssueId` 在單一步驟中完成 (參見下方的 GraphQL 區段)。

## 使用 MCP 工具

**列出子議題：**
呼叫 `mcp__github__issue_read` 並設定 `method: "get_sub_issues"`、`owner`、`repo` 與 `issue_number`。

**建立一個議題作為子議題：**
目前沒有直接建立子議題的 MCP 工具。請使用上述的工作流程或 GraphQL。

## 使用 REST API

**列出子議題：**
```bash
gh api repos/{owner}/{repo}/issues/{議題編號}/sub_issues
```

**取得父議題：**
```bash
gh api repos/{owner}/{repo}/issues/{議題編號}/parent
```

**將現有議題加入為子議題：**
```bash
# sub_issue_id 是數字格式的議題 ID (而非議題編號)
# 您可以在建立或擷取議題時從 .id 欄位取得它
echo '{"sub_issue_id": 12345}' | gh api repos/{owner}/{repo}/issues/{父議題編號}/sub_issues -X POST --input -
```

若要移動已有父議題的子議題，請在 JSON 本文中加入 `"replace_parent": true`。

**移除子議題：**
```bash
echo '{"sub_issue_id": 12345}' | gh api repos/{owner}/{repo}/issues/{父議題編號}/sub_issue -X DELETE --input -
```

**重新排列子議題的優先順序：**
```bash
echo '{"sub_issue_id": 6, "after_id": 5}' | gh api repos/{owner}/{repo}/issues/{父議題編號}/sub_issues/priority -X PATCH --input -
```

使用 `after_id` 或 `before_id` 來調整子議題相對於另一個子議題的位置。

## 使用 GraphQL

**讀取父議題與子議題：**
```graphql
{
  repository(owner: "擁有者", name: "儲存庫") {
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

**加入子議題：**
```graphql
mutation {
  addSubIssue(input: {
    issueId: "父議題節點識別碼"
    subIssueId: "子議題節點識別碼"
  }) {
    issue { id }
    subIssue { id number title }
  }
}
```

您也可以使用 `subIssueUrl` 代替 `subIssueId` (傳遞議題的 HTML URL)。加入 `replaceParent: true` 可將子議題從另一個父議題移動過來。

**直接建立一個議題作為子議題：**
```graphql
mutation {
  createIssue(input: {
    repositoryId: "儲存庫節點識別碼"
    title: "實作登入驗證"
    parentIssueId: "父議題節點識別碼"
  }) {
    issue { id number }
  }
}
```

**移除子議題：**
```graphql
mutation {
  removeSubIssue(input: {
    issueId: "父議題節點識別碼"
    subIssueId: "子議題節點識別碼"
  }) {
    issue { id }
  }
}
```

**重新排列子議題的優先順序：**
```graphql
mutation {
  reprioritizeSubIssue(input: {
    issueId: "父議題節點識別碼"
    subIssueId: "子議題節點識別碼"
    afterId: "另一個子議題節點識別碼"
  }) {
    issue { id }
  }
}
```

使用 `afterId` 或 `beforeId` 來調整相對於另一個子議題的位置。
