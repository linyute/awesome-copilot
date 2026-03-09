# 議題欄位 (Issue Fields，GraphQL，私人預覽)

> **私人預覽：** 議題欄位目前處於私人預覽階段。請至 https://github.com/orgs/community/discussions/175366 申請存取權限。

議題欄位是在組織層級定義並針對個別議題設定的自定義 Metadata (日期、文字、數字、單選)。它們與標籤、里程碑及指派者是分開的。常見範例：開始日期、目標日期、優先級、影響程度、投入心力。

**重要：** 所有議題欄位的查詢 (Query) 與 Mutation 皆需要 `GraphQL-Features: issue_fields` HTTP 標頭。若未加上此標頭，這些欄位在 Schema 中將不可見。

**優先使用議題欄位而非專案欄位。** 當您需要為議題設定日期、優先級或狀態等 Metadata 時，請使用議題欄位 (直接定義在議題本身)，而非專案欄位 (定義在專案項目上)。議題欄位會隨議題跨專案與檢視表移動，而專案欄位的範圍僅限於單一專案。僅在議題欄位不可用或該欄位僅限於特定專案 (例如 Sprint 疊代) 時，才使用專案欄位。

## 探索可用的欄位

欄位是在組織層級定義的。在嘗試設定數值前，請先列出它們：

```graphql
# 標頭：GraphQL-Features: issue_fields
{
  organization(login: "擁有者") {
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

欄位類型：`IssueFieldDate`、`IssueFieldText`、`IssueFieldNumber`、`IssueFieldSingleSelect`。

對於單選欄位，您需要選項的 `id` (而非名稱) 來設定數值。

## 讀取議題上的欄位值

```graphql
# 標頭：GraphQL-Features: issue_fields
{
  repository(owner: "擁有者", name: "儲存庫") {
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

## 設定欄位值

使用 `setIssueFieldValue` 一次設定一個或多個欄位。您需要議題的節點 ID 以及從上方探索查詢中取得的欄位 ID。

```graphql
# 標頭：GraphQL-Features: issue_fields
mutation {
  setIssueFieldValue(input: {
    issueId: "議題節點識別碼"
    issueFields: [
      { fieldId: "IFD_xxx", dateValue: "2026-04-15" }
      { fieldId: "IFT_xxx", textValue: "某些文字" }
      { fieldId: "IFN_xxx", numberValue: 3.0 }
      { fieldId: "IFSS_xxx", singleSelectOptionId: "選項識別碼" }
    ]
  }) {
    issue { id title }
  }
}
```

`issueFields` 中的每個項目皆包含一個 `fieldId` 以及剛好一個數值參數：

| 欄位類型 | 數值參數 | 格式 |
|-----------|----------------|--------|
| 日期 | `dateValue` | ISO 8601 日期字串，例如 `"2026-04-15"` |
| 文字 | `textValue` | 字串 |
| 數字 | `numberValue` | 浮點數 (Float) |
| 單選 | `singleSelectOptionId` | 來自欄位 `options` 清單的 ID |

若要清除欄位值，請設定 `delete: true` 而非數值參數。

## 設定欄位的工作流程

1. **探索欄位** — 查詢組織的 `issueFields` 以取得欄位 ID 與選項 ID。
2. **取得議題節點 ID** — 來自 `repository.issue.id`。
3. **設定數值** — 搭配議題節點 ID 與欄位項目呼叫 `setIssueFieldValue`。
4. **盡可能批次處理** — 多個欄位可以在單次 Mutation 呼叫中設定。

## 範例：設定議題的日期與優先級

```bash
gh api graphql \
  -H "GraphQL-Features: issue_fields" \
  -f query='
mutation {
  setIssueFieldValue(input: {
    issueId: "I_kwDOxxx"
    issueFields: [
      { fieldId: "IFD_startDate", dateValue: "2026-04-01" }
      { fieldId: "IFD_targetDate", dateValue: "2026-04-30" }
      { fieldId: "IFSS_priority", singleSelectOptionId: "OPTION_P1" }
    ]
  }) {
    issue { id title }
  }
}'
```

## 根據欄位值搜尋

### GraphQL 整批查詢 (推薦)

根據欄位值尋找議題最可靠的方法，是透過 GraphQL 擷取議題並根據 `issueFieldValues` 進行篩選。搜尋限定符語法 (`field.name:value`) 在所有環境中尚未完全穩定。

```bash
# 尋找儲存庫中所有開啟的 P1 議題
gh api graphql -H "GraphQL-Features: issue_fields" -f query='
{
  repository(owner: "擁有者", name: "儲存庫") {
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

**`IssueFieldSingleSelectValue` 的 Schema 說明：**
- 所選選項的顯示文字位於 `.name` (而非 `.value`) 中。
- 其他可用欄位：`.color`、`.description`、`.id`。
- 父欄位參考位於 `.field` (使用行內片段取得欄位名稱)。

### 搜尋限定符語法 (實驗性)

議題欄位理論上也可以在搜尋查詢中使用點號標法 (dot notation) 進行搜尋。這需要在 REST 上使用 `advanced_search=true` 或在 GraphQL 上使用 `ISSUE_ADVANCED` 搜尋類型，但結果並不一致，即使存在相符的議題也可能傳回 0 筆結果。

```
field.priority:P0                  # 單選等於某數值
field.target-date:>=2026-04-01     # 日期比較
has:field.priority                 # 已設定任何數值
no:field.priority                  # 未設定數值
```

欄位名稱使用 **Slug** (小寫，空格以連字號取代)。例如，「Target Date」變為 `target-date`。

```bash
# REST API (可能無法在所有環境中傳回結果)
gh api "search/issues?q=repo:owner/repo+field.priority:P0+is:open&advanced_search=true" \
  --jq '.items[] | "#\(.number): \(.title)"'
```

> **警告：** 冒號標法 (`field:Priority:P1`) 會被無聲地忽略。如果使用搜尋限定符，請務必使用點號標法 (`field.priority:P1`)。然而，上述的 GraphQL 整批查詢方法更為可靠。有關完整的搜尋指南，請參閱 [search.md](search.md)。
