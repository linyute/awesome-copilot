# Issue Fields (問題欄位)

問題欄位是在組織層級定義並針對每個問題設定的自訂 Metadata (日期、文字、數字、單選)。它們與標籤、里程碑和負責人是分開的。常見範例：開始日期、目標日期、優先順序、影響、努力。

**優先使用問題欄位而非專案欄位。** 當您需要為問題設定日期、優先順序或狀態等 Metadata 時，請使用問題欄位 (位於問題本身) 而非專案欄位 (位於專案項目)。問題欄位會隨問題跨專案和檢視移動，而專案欄位僅限於單一專案。僅在問題欄位不可用或欄位是專案專用 (例如衝刺迭代) 時才使用專案欄位。

## REST API (建議使用)

REST API 是探索欄位和設定值最簡單的方式。

### 探索可用欄位

```bash
gh api orgs/{org}/issue-fields --jq '.[] | {id, name, options: [.options[]? | {id, name}]}'
```

### 讀取問題上的欄位值

```bash
gh api repos/{owner}/{repo}/issues/{number}/issue-field-values
```

### 設定欄位值

```bash
gh api repos/{owner}/{repo}/issues/{number}/issue-field-values \
  -X POST \
  --input - <<'EOF'
{"issue_field_values": [{"field_id": 1, "value": "P1"}]}
EOF
```

**重要：** 承載必須是一個包含 `issue_field_values` 陣列的 JSON 物件。每個項目包含：
- `field_id` (整數)：來自組織欄位清單的欄位數字 ID
- `value` (字串)：單選欄位的**選項名稱** (例如 `"P1"`、`"High"`)，或文字/數字/日期欄位的字面值

應避免的常見錯誤：
- 將選項 ID 而非選項名稱作為 `value` 傳遞 (API 預期顯示名稱)
- 將 `field_id` 和 `value` 作為最上層鍵發送，而未包裝在 `issue_field_values` 陣列中
- 使用 `-f` 旗標而非 `--input` 配合 JSON 主體

### 範例：將優先順序設定為 P1

```bash
# 1. 尋找優先順序欄位 ID 和選項名稱
gh api orgs/{org}/issue-fields --jq '.[] | select(.name == "Priority")'

# 2. 設定它 (使用選項名稱 (NAME)，而非 ID)
gh api repos/{owner}/{repo}/issues/{number}/issue-field-values \
  -X POST \
  --input - <<'EOF'
{"issue_field_values": [{"field_id": 1, "value": "P1"}]}
EOF
```

### 範例：一次設定多個欄位

```bash
gh api repos/{owner}/{repo}/issues/{number}/issue-field-values \
  -X POST \
  --input - <<'EOF'
{"issue_field_values": [
  {"field_id": 1, "value": "P1"},
  {"field_id": 5, "value": "2026-06-01"},
  {"field_id": 7, "value": "High"}
]}
EOF
```

### 設定欄位的工作流程 (REST)

1. **探索欄位** - `gh api orgs/{org}/issue-fields` 以取得欄位 ID 和選項名稱
2. **設定值** - POST 到 `repos/{owner}/{repo}/issues/{number}/issue-field-values` 配合 JSON 主體
3. **盡可能批次處理** - 多個欄位可以在單一要求中設定

## GraphQL API (替代方案)

GraphQL API 需要 `GraphQL-Features: issue_fields` HTTP 標頭。沒有它，欄位在結構描述中將不可見。

### 探索可用欄位 (GraphQL)

```graphql
# 標頭: GraphQL-Features: issue_fields
{
  organization(login: "OWNER") {
    issueFields(first: 30) {
      nodes {
        __typename
        ... on IssueFieldDate { id name }
        ... on IssueFieldText { id name }
        ... on IssueFieldNumber { id name }
        ... on IssueFieldSingleSelect { id name options { id name color } }
      }
    }
  }
}
```

欄位型別：`IssueFieldDate`、`IssueFieldText`、`IssueFieldNumber`、`IssueFieldSingleSelect`。

### 讀取欄位值 (GraphQL)

```graphql
# 標頭: GraphQL-Features: issue_fields
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 123) {
      issueFieldValues(first: 20) {
        nodes {
          __typename
          ... on IssueFieldDateValue {
            value
            field { ... on IssueFieldDate { id name } }
          }
          ... on IssueFieldTextValue {
            value
            field { ... on IssueFieldText { id name } }
          }
          ... on IssueFieldNumberValue {
            value
            field { ... on IssueFieldNumber { id name } }
          }
          ... on IssueFieldSingleSelectValue {
            name
            color
            field { ... on IssueFieldSingleSelect { id name } }
          }
        }
      }
    }
  }
}
```

### 設定欄位值 (GraphQL)

使用 `setIssueFieldValue` 一次設定一個或多個欄位。您需要問題的節點 ID 和上述探索查詢中的欄位 ID。

```graphql
# 標頭: GraphQL-Features: issue_fields
mutation {
  setIssueFieldValue(input: {
    issueId: "ISSUE_NODE_ID"
    issueFields: [
      { fieldId: "IFD_xxx", dateValue: "2026-04-15" }
      { fieldId: "IFT_xxx", textValue: "一些文字" }
      { fieldId: "IFN_xxx", numberValue: 3.0 }
      { fieldId: "IFSS_xxx", singleSelectOptionId: "選項_ID" }
    ]
  }) {
    issue { id title }
  }
}
```

`issueFields` 中的每個項目採用 `fieldId` 加上恰好一個值參數：

| 欄位型別 | 值參數 | 格式 |
|-----------|----------------|--------|
| 日期 | `dateValue` | ISO 8601 日期字串，例如 `"2026-04-15"` |
| 文字 | `textValue` | 字串 |
| 數字 | `numberValue` | 浮點數 |
| 單選 | `singleSelectOptionId` | 來自欄位 `options` 清單的節點 ID |

若要清除欄位值，請設定 `delete: true` 而非值參數。

## 依欄位值搜尋

### GraphQL 大量查詢 (建議使用)

依欄位值尋找問題最可靠的方式是透過 GraphQL 擷取問題，並依 `issueFieldValues` 進行過濾。搜尋限定詞語法 (`field.name:value`) 在所有環境中尚不可靠。

```bash
# 尋找儲存庫中所有開啟的 P1 問題
gh api graphql -H "GraphQL-Features: issue_fields" -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    issues(first: 100, states: OPEN) {
      nodes {
        number
        title
        updatedAt
        assignees(first: 3) { nodes { login } }
        issueFieldValues(first: 10) {
          nodes {
            __typename
            ... on IssueFieldSingleSelectValue {
              name
              field { ... on IssueFieldSingleSelect { name } }
            }
          }
        }
      }
    }
  }
}' --jq '
  [.data.repository.issues.nodes[] |
    select(.issueFieldValues.nodes[] |
      select(.field.name == "Priority" and .name == "P1")
    ) |
    {number, title, updatedAt, assignees: [.assignees.nodes[].login]}
  ]'
```

**`IssueFieldSingleSelectValue` 的結構描述說明：**
- 所選選項的顯示文字在 `.name` 中 (而非 `.value`)
- 同樣可用：`.color`、`.description`、`.id`
- 父欄位參考在 `.field` 中 (使用內嵌片段以取得欄位名稱)

### 搜尋限定詞語法 (實驗性)

問題欄位也可以在搜尋查詢中使用點標法進行搜尋。這需要 REST 上的 `advanced_search=true` 或 GraphQL 上的 `ISSUE_ADVANCED` 搜尋型別，但結果不一致，即使存在相符的問題也可能傳回 0 個結果。

```
field.priority:P0                  # 單選等於值
field.target-date:>=2026-04-01     # 日期比較
has:field.priority                 # 已設定任何值
no:field.priority                  # 未設定值
```

欄位名稱使用**代稱 (slug)** (小寫，空格以連字號代替)。例如，"Target Date" 變為 `target-date`。

```bash
# REST API (可能不會在所有環境中傳回結果)
gh api "search/issues?q=repo:owner/repo+field.priority:P0+is:open&advanced_search=true" \
  --jq '.items[] | "#\(.number): \(.title)"'
```

> **Warning:** 冒號標法 (`field:Priority:P1`) 會被默默忽略。如果使用搜尋限定詞，請務必使用點標法 (`field.priority:P1`)。然而，上述 GraphQL 大量查詢方法更為可靠。請參閱 [search.md](search.md) 以取得完整搜尋指南。
