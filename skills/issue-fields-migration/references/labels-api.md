# Labels API 參考文件

用於標籤 (label) 遷移流程之 GitHub Labels REST API 端點參考文件。

## 列出儲存庫中的標籤

```
GET /repos/{owner}/{repo}/labels
```

回傳儲存庫中定義的所有標籤。採用分頁機制 (每頁上限 100 個)。

**CLI 捷徑：**

```bash
gh label list -R {owner}/{repo} --limit 1000 --json name,color,description
```

**回應欄位：** `id`, `node_id`, `url`, `name`, `description`, `color`, `default`。

## 依標籤列出議題

```
GET /repos/{owner}/{repo}/issues?labels={label_name}&state=all&per_page=100
```

回傳符合該標籤的議題 (及提取要求，Pull Request)。藉由檢查是否不含 `pull_request` 欄位來篩選出 PR。

**CLI 捷徑：**

```bash
gh issue list -R {owner}/{repo} --label "{label_name}" --state all \
  --json number,title,labels --limit 1000
```

`gh issue list` 命令會自動排除 PR。

**分頁：** 在 CLI 中使用 `--limit`，或在 REST 中使用 `page` 查詢參數。對於含有超過 1,000 個符合議題的儲存庫，請透過 Link 標頭使用以游標 (cursor) 為基礎的分頁。

## 從議題中移除標籤

```
DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{label_name}
```

從議題中移除單一標籤。回傳 `200 OK` 以及該議題上剩餘的標籤。

**重要：** 對含有空格或特殊字元的標籤名稱進行 URL 編碼：
- `good first issue` → `good%20first%20issue`
- `bug/critical` → `bug%2Fcritical`

**CLI 捷徑：**

```bash
gh api /repos/{owner}/{repo}/issues/{number}/labels/{label_name} -X DELETE
```

## 將標籤新增至議題

```
POST /repos/{owner}/{repo}/issues/{issue_number}/labels
```

主體：`{"labels": ["label1", "label2"]}`

遷移時通常不需要，但在回溯 (rollback) 情境中很有用。

## 備註

- 標籤的作用域為儲存庫。相同的標籤名稱可以獨立存在於不同的儲存庫中。
- 目前沒有列出儲存庫標籤的 MCP 工具。請使用 `gh label list` 或 REST API。
- MCP 工具 `mcp__github__list_issues` 支援以 `labels` 篩選器來獲取特定標籤的議題。
- 標籤名稱在比對時不區分大小寫，但 API 會保留原始的大小寫格式。
- 每個議題的標籤數量上限：無硬性限制，但實務上通常為數十個。
