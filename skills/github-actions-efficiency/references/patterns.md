# 規範模式 (Canonical Patterns)

僅在實作期間需要具體範例時，才載入此參考。

## 相依性快取 (Dependency Cache)

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

將快取路徑和失效檔案調整為儲存庫的生態系統。

## 取消過時執行 (Cancel Stale Runs)

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## 範圍觸發器 (Scope Triggers)

```yaml
on:
  push:
    paths:
      - "src/**"
      - "tests/**"
      - "package.json"
```

當排除比包含更容易維護時，請使用 `paths-ignore`。

## 作業層級已變更檔案閘控 (Job-Level Changed-File Gating)

使用一個小的變更偵測步驟，產生明確的輸出，例如：

- `docs_relevant`
- `runtime_relevant`
- `compat_relevant`
- `run_tests`

當事件層級的篩選器表達能力不足時，請針對這些輸出對下游作業進行閘控。

## 矩陣精簡 (Matrix Reduction)

使用符合決策的最小矩陣：

- 在發行時使用完整矩陣
- 在敏感的執行階段表面上使用縮減的相容性矩陣
- 針對一般的程式碼變更使用單一代表性的分段 (leg)

## 選用的回寫作業 (Optional Write-Back Job)

針對會修改 PR 分支的作業（例如格式化機器人），請使用標籤驅動或手動觸發。
