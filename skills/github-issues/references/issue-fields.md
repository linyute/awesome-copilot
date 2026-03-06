# 議題欄位 (GraphQL，私人預覽) (Issue Fields - GraphQL, Private Preview)

> **私人預覽**：議題欄位目前處於私人預覽階段。請至 https://github.com/orgs/community/discussions/175366 申請存取權限。

議題欄位是在組織層級定義並針對每個議題設定的自訂 Metadata（日期、文字、數字、單選）。它們獨立於標籤 (Labels)、里程碑 (Milestones) 與指派對象 (Assignees)。常見範例：開始日期 (Start Date)、目標日期 (Target Date)、優先順序 (Priority)、影響 (Impact)、工作量 (Effort)。

**重要提示**：所有議題欄位查詢與變更 (Mutations) 皆需要 `GraphQL-Features: issue_fields` HTTP 標頭。若無此標頭，欄位在結構定義 (Schema) 中將不可見。

**優先使用議題欄位而非專案欄位**：當您需要在議題上設定日期、優先順序或狀態等 Metadata 時，請使用議題欄位（這些欄位存在於議題本身），而非專案欄位（這些欄位存在於專案項目上）。議題欄位會隨議題跨專案與視圖移動，而專案欄位則僅限於單一專案。僅在議題欄位不可用或該欄位具備專案特定性（例如：衝刺迭代）時，才使用專案欄位。

## 探索可用欄位

欄位是在組織層級定義的。在嘗試設定值之前，請先列出它們：

```graphql
# 標頭：GraphQL-Features: issue_fields
{
  organization(login: "擁有者名稱") {
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

欄位型別：`IssueFieldDate` (日期)、`IssueFieldText` (文字)、`IssueFieldNumber` (數字)、`IssueFieldSingleSelect` (單選)。

對於單選欄位，您需要選項 `id`（而非名稱）來設定值。

## 讀取議題上的欄位值

```graphql
# 標頭：GraphQL-Features: issue_fields
{
  repository(owner: "擁有者名稱", name: "儲存庫名稱") {
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

使用 `setIssueFieldValue` 一次設定一或多個欄位。您需要議題的節點 ID 以及來自上方探索查詢的欄位 ID。

```graphql
# 標頭：GraphQL-Features: issue_fields
mutation {
  setIssueFieldValue(input: {
    issueId: "議題節點_ID"
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

`issueFields` 中的每個條目都包含一個 `fieldId` 以及剛好一個值參數：

| 欄位型別 | 值參數 | 格式 |
|-----------|----------------|--------|
| 日期 (Date) | `dateValue` | ISO 8601 日期字串，例如 `"2026-04-15"` |
| 文字 (Text) | `textValue` | 字串 |
| 數字 (Number) | `numberValue` | 浮點數 (Float) |
| 單選 (Single select) | `singleSelectOptionId` | 來自該欄位 `options` 清單的 ID |

若要清除欄位值，請將 `delete: true` 設定為代替值參數。

## 設定欄位的工作流程

1. **探索欄位**：查詢組織的 `issueFields` 以取得欄位 ID 與選項 ID
2. **取得議題節點 ID**：來自 `repository.issue.id`
3. **設定值**：呼叫 `setIssueFieldValue` 並帶入議題節點 ID 與欄位條目
4. **儘可能批次處理**：可以在單次變更呼叫中設定多個欄位

## 範例：設定議題的日期與優先順序

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
