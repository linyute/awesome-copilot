# 進階議題搜尋 (Advanced Issue Search)

`search_issues` MCP 工具使用 GitHub 的議題搜尋查詢格式進行跨儲存庫搜尋，支援隱式 AND 查詢、日期範圍及 Metadata 篩選器 (但不支援顯式的 OR/NOT 運算子)。

## 使用搜尋 vs 列出 vs 進階搜尋的時機

尋找議題有三種方法，每種方法具有不同的功能：

| 功能 | `list_issues` (MCP) | `search_issues` (MCP) | 進階搜尋 (`gh api`) |
|-----------|---------------------|----------------------|---------------------------|
| **範圍 (Scope)** | 僅限單一儲存庫 | 跨儲存庫、跨組織 | 跨儲存庫、跨組織 |
| **議題欄位篩選器** (`field.priority:P0`) | 否 | 否 | **是** (點號標法) |
| **議題類型篩選器** (`type:Bug`) | 否 | 是 | 是 |
| **布林邏輯** (AND/OR/NOT, 巢狀) | 否 | 是 (僅限隱式 AND) | **是** (顯式 AND/OR/NOT) |
| **標籤/狀態/日期篩選器** | 是 | 是 | 是 |
| **指派者/作者/提到** | 否 | 是 | 是 |
| **否定 (Negation)** (`-label:x`, `no:label`) | 否 | 是 | 是 |
| **文字搜尋** (標題/本文/評論) | 否 | 是 | 是 |
| **`since` 篩選器** | 是 | 否 | 否 |
| **結果限制** | 無上限 (全部進行分頁) | 最高 1,000 筆 | 最高 1,000 筆 |
| **如何呼叫** | 直接使用 MCP 工具 | 直接使用 MCP 工具 | 搭配 `advanced_search=true` 使用 `gh api` |

**決策指南：**
- **單一儲存庫，簡單篩選 (狀態、標籤、近期更新)**：使用 `list_issues`。
- **跨儲存庫，文字搜尋，作者/指派者，議題類型**：使用 `search_issues`。
- **議題欄位數值 (優先級、日期、自定義欄位) 或複雜布林邏輯**：搭配 `advanced_search=true` 使用 `gh api`。

## 查詢語法

`query` 參數是一個包含搜尋詞與限定符的字串。搜尋詞之間的空格代表隱式的 AND。

### 設定範圍 (Scoping)

```
repo:擁有者/儲存庫    # 單一儲存庫 (若您傳遞了 owner+repo 參數則會自動加入)
org:github            # 組織中的所有儲存庫
user:octocat          # 使用者擁有的所有儲存庫
in:title              # 僅在標題中搜尋
in:body               # 僅在本文中搜尋
in:comments           # 僅在評論中搜尋
```

### 狀態與關閉原因

```
is:open               # 開啟的議題 (自動加入：is:issue)
is:closed             # 已關閉的議題
reason:completed      # 標記為「已完成」而關閉
reason:"not planned"  # 標記為「不予處理」而關閉
```

### 相關人員

```
author:使用者名稱     # 由此人建立
assignee:使用者名稱   # 指派給此人
mentions:使用者名稱   # 提到此人
commenter:使用者名稱  # 有此人的評論
involves:使用者名稱   # 作者 OR 指派者 OR 被提到 OR 評論者
author:@me            # 目前已通過驗證的使用者
team:組織/團隊        # 提到的團隊
```

### 標籤、里程碑、專案、類型

```
label:"bug"                 # 具有此標籤 (多字標籤請加引號)
label:bug label:priority    # 同時具有兩個標籤 (AND)
label:bug,enhancement       # 具有其中一個標籤 (OR)
-label:wontfix              # 「不」具有此標籤
milestone:"v2.0"            # 在此里程碑中
project:github/57           # 在此專案面板中
type:"Bug"                  # 議題類型
```

### 缺失的 Metadata (Missing Metadata)

```
no:label              # 未指派標籤
no:milestone          # 無里程碑
no:assignee           # 未指派人員
no:project            # 不在任何專案中
```

### 日期

所有日期限定符皆支援 `>`, `<`, `>=`, `<=`，以及使用 ISO 8601 格式的範圍 (`..`) 運算子：

```
created:>2026-01-01              # 在 1 月 1 日之後建立
updated:>=2026-03-01             # 自 3 月 1 日起更新
closed:2026-01-01..2026-02-01   # 在 1 月份關閉
created:<2026-01-01              # 在 1 月 1 日之前建立
```

### 連結的內容 (Linked Content)

```
linked:pr             # 議題有關連的 PR
-linked:pr            # 議題尚未關連至任何 PR
linked:issue          # PR 有關連至議題
```

### 數字篩選器 (Numeric Filters)

```
comments:>10          # 超過 10 則評論
comments:0            # 無評論
interactions:>100     # 回應 + 評論 > 100
reactions:>50         # 超過 50 個回應
```

### 布林邏輯與巢狀結構 (Boolean Logic & Nesting)

使用 `AND`、`OR` 以及括號 (最高支援 5 層巢狀，最多 5 個運算子)：

```
label:bug AND assignee:octocat
assignee:octocat OR assignee:hubot
(type:"Bug" AND label:P1) OR (type:"Feature" AND label:P1)
-author:app/dependabot          # 排除機器人建立的議題
```

在沒有顯式運算子的情況下，詞彙間的空格會被視為 AND。

## 常見查詢模式

**未指派的 Bug：**
```
repo:擁有者/儲存庫 type:"Bug" no:assignee is:open
```

**本週關閉的議題：**
```
repo:擁有者/儲存庫 is:closed closed:>=2026-03-01
```

**停滯的開啟議題 (90 天內無更新)：**
```
repo:擁有者/儲存庫 is:open updated:<2026-01-01
```

**無相關 PR 的開啟議題 (需要處理)：**
```
repo:擁有者/儲存庫 is:open -linked:pr
```

**我在組織中參與的議題：**
```
org:github involves:@me is:open
```

**高熱度議題：**
```
repo:擁有者/儲存庫 is:open comments:>20
```

**依類型與優先級標籤篩選議題：**
```
repo:擁有者/儲存庫 type:"Epic" label:P1 is:open
```

## 議題欄位搜尋

> **可靠性警告：** `field.name:value` 搜尋限定符語法仍處於實驗階段，即使存在相符的議題，也可能傳回 0 筆結果。為了可靠地根據欄位值進行篩選，請使用 [issue-fields.md](issue-fields.md#根據欄位值搜尋) 中記錄的 GraphQL 整批查詢方法。

理論上可以使用 **進階搜尋模式 (advanced search mode)**，透過 `field.name:value` 限定符來搜尋議題欄位。這在網頁 UI 中可以運作，但來自 API 的結果並不一致。

### REST API

在查詢參數中加入 `advanced_search=true`：

```bash
gh api "search/issues?q=org:github+field.priority:P0+type:Epic+is:open&advanced_search=true" \
  --jq '.items[] | "#\(.number): \(.title)"'
```

### GraphQL

使用 `type: ISSUE_ADVANCED` 代替 `type: ISSUE`：

```graphql
{
  search(query: "org:github field.priority:P0 type:Epic is:open", type: ISSUE_ADVANCED, first: 10) {
    issueCount
    nodes {
      ... on Issue { number title }
    }
  }
}
```

### 議題欄位限定符

語法使用 **點號標法 (dot notation)** 搭配欄位的 Slug 名稱 (小寫，空格以連字號取代)：

```
field.priority:P0                  # 單選欄位等於某數值
field.priority:P1                  # 不同的選項數值
field.target-date:>=2026-04-01     # 日期比較
has:field.priority                 # 已設定任何數值
no:field.priority                  # 未設定數值
```

**MCP 限制：** `search_issues` MCP 工具不會傳遞 `advanced_search=true`。您必須直接使用 `gh api` 進行議題欄位搜尋。

### 常見欄位搜尋模式

**組織中的 P0 史詩 (Epics)：**
```
org:github field.priority:P0 type:Epic is:open
```

**目標日期在本季度的議題：**
```
org:github field.target-date:>=2026-04-01 field.target-date:<=2026-06-30 is:open
```

**缺少優先級的開啟 Bug：**
```
org:github no:field.priority type:Bug is:open
```

## 限制

- 查詢文字：最多 **256 個字元** (不包含運算子/限定符)。
- 布林運算子：每個查詢最多 **5 個** AND/OR/NOT。
- 結果：總計最高 **1,000 筆** (若您需要所有議題，請使用 `list_issues`)。
- 儲存庫掃描：搜尋最多 **4,000 個** 符合條件的儲存庫。
- 速率限制：已通過驗證的搜尋為 **每分鐘 30 次請求**。
- 議題欄位搜尋需要 `advanced_search=true` (REST) 或 `ISSUE_ADVANCED` (GraphQL)；無法透過 MCP `search_issues` 使用。
