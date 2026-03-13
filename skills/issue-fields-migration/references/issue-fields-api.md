# Issue Fields REST API 參考文件

Issue fields 是議題 (issue) 的組織級自訂 Metadata。所有端點都需要 API 版本標頭：

```
-H "X-GitHub-Api-Version: 2026-03-10"
```

## 列出組織 Issue Fields

```bash
gh api /orgs/{org}/issue-fields \
  -H "X-GitHub-Api-Version: 2026-03-10"
```

回傳一個欄位物件陣列：

```json
[
  {
    "id": "IF_abc123",
    "name": "Priority",
    "content_type": "single_select",
    "options": [
      { "id": "OPT_1", "name": "Critical" },
      { "id": "OPT_2", "name": "High" },
      { "id": "OPT_3", "name": "Medium" },
      { "id": "OPT_4", "name": "Low" }
    ]
  },
  {
    "id": "IF_def456",
    "name": "Due Date",
    "content_type": "date",
    "options": null
  }
]
```

**欄位類型**：`text`, `single_select`, `number`, `date`

**實用的 jq 篩選器**：

```bash
gh api /orgs/{org}/issue-fields \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --jq '.[] | {id, name, content_type, options: [.options[]?.name]}'
```

## 讀取 Issue Field 值

```bash
gh api /repos/{owner}/{repo}/issues/{number}/issue-field-values \
  -H "X-GitHub-Api-Version: 2026-03-10"
```

回傳該議題目前的欄位值。在寫入之前，請使用此方式檢查值是否已存在。

## 寫入 Issue Field 值 (POST，累加式)

將值新增到議題，而不會移除其他欄位現有的值。

**重要**：使用 `repository_id` (整數)，而非 `owner/repo`。

```bash
# 首先，取得儲存庫 ID：
REPO_ID=$(gh api /repos/{owner}/{repo} --jq .id)

# 然後寫入值：
echo '[
  {
    "field_id": "IF_abc123",
    "value": "High"
  }
]' | gh api /repositories/$REPO_ID/issues/{number}/issue-field-values \
  -X POST \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --input -
```

### 依欄位類型劃分的數值格式

| 欄位類型 | 數值格式 | 範例 |
|-----------|-------------|---------|
| text | 字串 | `"value": "Some text"` |
| single_select | 選項名稱 (字串) | `"value": "High"` |
| number | 數字 | `"value": 42` |
| date | ISO 8601 日期字串 | `"value": "2025-03-15"` |

**關鍵**：對於 `single_select`，REST API 接受選項**名稱**作為字串。您不需要查閱選項 ID。

### 一次寫入多個欄位

在陣列中傳遞多個物件，以便在單次呼叫中設定多個欄位：

```bash
echo '[
  {"field_id": "IF_abc123", "value": "High"},
  {"field_id": "IF_def456", "value": "2025-06-01"}
]' | gh api /repositories/$REPO_ID/issues/{number}/issue-field-values \
  -X POST \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  --input -
```

## 寫入 Issue Field 值 (PUT，全部取代)

取代議題上的所有欄位值。請謹慎使用。

```bash
echo '[{"field_id": "IF_abc123", "value": "Low"}]' | \
  gh api /repositories/$REPO_ID/issues/{number}/issue-field-values \
    -X PUT \
    -H "X-GitHub-Api-Version: 2026-03-10" \
    --input -
```

**警告**：PUT 會移除要求主體 (request body) 中未包含的任何欄位值。執行遷移時請務必使用 POST，以保留其他欄位值。

## 權限

- **儲存庫**："Issues" 讀取/寫入
- **組織**："Issue Fields" 讀取/寫入

## 速率限制 (Rate Limiting)

- 適用標準速率限制 (已驗證使用者每小時 5,000 次要求)
- 快速連續寫入可能會觸發次要速率限制
- 建議：呼叫之間延遲 100 毫秒，遇到 429 時執行指數型退避 (exponential backoff)
