# 步驟 10：清理過時

擁有者：**parent** (無子代理)；預算：不適用。執行**一次，在收斂
之後** (步驟 9 回傳 `Converged: true`)。

## 輸入

- 已收斂 PR 的 `PrNumber`。

## 回傳合約

- 無 — 步驟 10 是終點。執行後，迴圈即完成，
  且 parent 會使用步驟 9 的收斂證明
  來呼叫 `task_complete`。

## 程序

```pwsh
pwsh ./scripts/10-cleanup-outdated.ps1 -PrNumber <n>
```

僅為安全網。大多數迴圈在收斂時無需進行任何清理 —— 過時的
討論串應該已在步驟 8 中像其他開啟的討論串一樣被回覆並解決。
未解決狀態是 PR UI 中的單一事實來源；
`10-cleanup-outdated.ps1` 僅用於捕捉遺漏的項目。
