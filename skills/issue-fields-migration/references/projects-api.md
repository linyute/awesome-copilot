# Projects V2 API 參考文件 (用於遷移)

本參考文件涵蓋欄位遷移所需的 Projects V2 API 子集：探索專案欄位及讀取項目值。

## 列出專案欄位

### 透過 MCP 工具

```
mcp__github__projects_list(
  owner: "{org}",
  project_number: {n},
  method: "list_project_fields"
)
```

### 透過 GraphQL

```bash
gh api graphql -f query='
  query {
    organization(login: "ORG") {
      projectV2(number: N) {
        fields(first: 30) {
          pageInfo { hasNextPage endCursor }
          nodes {
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              dataType
              options { id name }
            }
            ... on ProjectV2IterationField {
              id
              name
              dataType
            }
          }
        }
      }
    }
  }'
```

### 欄位資料類型

| dataType | 描述 | 遷移至 |
|----------|-------------|-------------|
| TEXT | 自由格式文字 | `text` 議題欄位 |
| SINGLE_SELECT | 含有選項的下拉式清單 | `single_select` 議題欄位 |
| NUMBER | 數值 | `number` 議題欄位 |
| DATE | 日期值 | `date` 議題欄位 |
| ITERATION | 衝刺 (Sprint)/反覆項目週期 | 無對應項目 (略過) |

## 列出專案項目 (包含欄位值)

### 透過 MCP 工具

```
mcp__github__projects_list(
  owner: "{org}",
  project_number: {n},
  method: "list_project_items"
)
```

回傳分頁後的結果。每個項目皆包含：
- 項目類型 (ISSUE, DRAFT_ISSUE, PULL_REQUEST)
- 內容參考 (儲存庫擁有者, 儲存庫名稱, 議題編號)
- 所有專案欄位的欄位值

### 透過 GraphQL

```bash
gh api graphql -f query='
  query($cursor: String) {
    organization(login: "ORG") {
      projectV2(number: N) {
        items(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            type
            content {
              ... on Issue {
                number
                repository { nameWithOwner }
              }
            }
            fieldValues(first: 20) {
              pageInfo { hasNextPage endCursor }
              nodes {
                ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2Field { name } } }
                ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2SingleSelectField { name } } }
                ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2Field { name } } }
                ... on ProjectV2ItemFieldDateValue { date field { ... on ProjectV2Field { name } } }
              }
            }
          }
        }
      }
    }
  }' -f cursor="$CURSOR"
```

### 遷移重要備註

- **分頁機制**：專案最多可包含 10,000 個項目。請務必使用 `pageInfo.hasNextPage` 及 `pageInfo.endCursor` 進行分頁。
- **草稿項目**：類型為 `DRAFT_ISSUE` 的項目未連結至實際議題。執行遷移時請略過。
- **提取要求 (Pull requests)**：類型為 `PULL_REQUEST` 的項目是 PR，而非議題。議題欄位僅適用於議題。請略過。
- **跨儲存庫**：單一專案可能包含來自多個儲存庫的議題。請依儲存庫將項目分組，以便批次查閱儲存庫 ID。
- **欄位值存取**：各種類型的欄位值節點類型皆不同 (`ProjectV2ItemFieldTextValue`, `ProjectV2ItemFieldSingleSelectValue` 等)。請處理各種類型。
