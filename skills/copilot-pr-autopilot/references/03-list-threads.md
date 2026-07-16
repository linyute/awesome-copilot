# 步驟 3：列出並分類未解決的對話串

子代理程式類型：`explore`；預算：5 分鐘。

## 輸入

- `PrNumber`。

## 回傳協定

資料列的表格，每個未解決的對話串一列：

```
{ thread_id, file, line, author, author_class, severity, summary }
```

其中 `author_class` ∈ `copilot` | `human-or-bot`，衍生自
原始的 `author.login`（請參閱注意事項）。

## 流程

執行列出指令碼：

```pwsh
pwsh ./scripts/03-list-open-threads.ps1 -PrNumber <n>
```

這會回傳來自**所有審查者**
（Copilot、人類、`github-advanced-security`、其他 Bot）的每個未解決審查對話串。該指令碼
會將 `Path` 輸出為 `<檔案>:<行>`；當留言錨定到特定行時
（例如 `src/foo.js:42`）；當留言沒有行錨定
（檔案層級 / PR 層級的留言）時，`Path` 僅為 `<檔案>`，沒有
`:<行>` 後綴。呼叫端應**僅在後綴解析為整數時**
才依據最後一個 `:` 進行分割，否則將 `Path` 僅視為檔案。
對於每一列，對 `author` 進行分類：

- `copilot-pull-request-reviewer` 或
  `copilot-pull-request-reviewer[bot]` → `author_class: copilot`
- 其他所有內容 → `author_class: human-or-bot`

將分類後的表格傳遞給步驟 4 — 審查分流規則取決於它。

## 注意事項

- **`[bot]` 後綴會出現在某些介面上。** 同時比對
  `copilot-pull-request-reviewer` 與
  `copilot-pull-request-reviewer[bot]` — 它們是同一個動作執行者。
- **在步驟 4 中，將人類 / advanced-security 對話串預設為 `escalate-to-user`。**
  此處的分類僅為它們加上標記；分流會套用該原則。
  請參閱 [04-triage.md](04-triage.md)。
- **未解決的對話串是單一事實來源。** 已過期但未解決的
  對話串仍會顯示 — 這是正確的。請勿將其過濾掉；
  它們的處理方式與步驟 8 中的任何其他未解決對話串相同。
