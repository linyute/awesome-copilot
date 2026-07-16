# 步驟 7：Commit 與 push

Owner: **parent** (無 sub-agent)；預算：不適用。

## 輸入

- 步驟 5 的修復結果與步驟 6 的綠色建構。

## 回傳協定

- 已推送的 `HeadOid`（新的 commit SHA），已記錄用於步驟 8 的回覆
  本文與步驟 9 的收斂證明。

## 步驟

- Parent 直接執行 `git commit` + `git push`。每輪進行一次聚焦的 commit
  —— 綑綁多輪會破壞「哪項發現
  推動了哪項變更」的稽核追蹤，並使 `git bisect` 失效。
- 包含 trailer：
  `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`。
- 記錄已推送的 SHA，以便步驟 8 可以在每個回覆本文中引用它，且
  步驟 9 可以將其與 `LatestCopilotReview.commitOid` 進行比較。
