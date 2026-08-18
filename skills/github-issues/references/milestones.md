# 里程碑 (Milestones)

使用里程碑將相關議題 (issues) 分組為可交付的工作單元。

里程碑可以透過 GitHub REST API 進行讀取與管理。

## 列出里程碑

```bash
gh api "repos/{owner}/{repo}/milestones?state=all&per_page=100" \
  --paginate \
  --jq '.[] | {number, title, state, open_issues, closed_issues, due_on}'
```

## 取得里程碑

```bash
gh api repos/{owner}/{repo}/milestones/{milestone_number}
```

## 建立里程碑

```bash
gh api repos/{owner}/{repo}/milestones \
  -X POST \
  -f title="Milestone title" \
  -f description="Milestone description"
```

選用截止日期：

```bash
gh api repos/{owner}/{repo}/milestones \
  -X POST \
  -f title="Milestone title" \
  -f description="Milestone description" \
  -f due_on="2026-09-01T00:00:00Z"
```

## 更新里程碑

```bash
gh api repos/{owner}/{repo}/milestones/{milestone_number} \
  -X PATCH \
  -f title="Updated title" \
  -f description="Updated description"
```

## 關閉里程碑

```bash
gh api repos/{owner}/{repo}/milestones/{milestone_number} \
  -X PATCH \
  -f state=closed
```

## 重新開啟里程碑

```bash
gh api repos/{owner}/{repo}/milestones/{milestone_number} \
  -X PATCH \
  -f state=open
```

## 列出里程碑中的議題

使用里程碑編號，而非里程碑標題。

```bash
gh api "repos/{owner}/{repo}/issues?milestone={milestone_number}&state=all&per_page=100" \
  --paginate \
  --jq '.[] | select(.pull_request == null) | {number, title, state}'
```

Issues REST 端點也可能回傳提取要求 (pull requests)，因此當呼叫端特別要求里程碑議題時，請排除包含 `pull_request` 的項目。

## 將議題指派至里程碑

```bash
gh api repos/{owner}/{repo}/issues/{issue_number} \
  -X PATCH \
  -F milestone={milestone_number}
```

## 從里程碑中移除議題

```bash
gh api repos/{owner}/{repo}/issues/{issue_number} \
  -X PATCH \
  -F milestone=null
```

## 刪除里程碑

僅在明確要求時才刪除里程碑。

```bash
gh api repos/{owner}/{repo}/milestones/{milestone_number} \
  -X DELETE
```

## 使用規則

- 使用里程碑編號進行 API 操作。
- 里程碑用於將工作分組；它不定義議題執行順序。
- 使用原生議題相依性來決定執行順序。
- 請勿僅因為議題屬於同一個里程碑就推斷存在相依性。
- 為自動化工作流程列出里程碑時，應包含所有開啟和關閉的議題，除非呼叫端明確要求其他方式。
