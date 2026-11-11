---
name: pr-address-feedback
description: '逐一檢視 PR 審查評論，針對每項評論決定要採取行動還是回覆理由，並在變更任何內容前建立可獲核准的解決方案計畫。當使用者想要處理、回應或分類 PR 審查意見回饋時使用。'
argument-hint: '[PR 編號或 URL]（預設為目前分支的 PR）'
user-invocable: true
---

讓我們逐一檢視此 Pull Request 上的每條審查評論，並擬定計畫以針對意見回饋採取行動或回覆理由。

PR 目標：使用我隨此指令傳遞的 PR 編號/URL（若有）；否則使用目前分支的 PR。

您處於**計畫模式**。在我核准最終計畫之前，請勿編輯檔案、認可、推送、解決討論串或向 GitHub 發布任何內容。唯讀指令（`gh`、`git log/diff/show`、檢視檔案）是可以的。

PR 可能位於 github.com 或另一個 GitHub 主機上（例如 GitHub Enterprise Server）。從 PR 的 `url` 取得主機，並傳遞 `--hostname <host>` 給每個 `gh api` 呼叫（或執行一次 `export GH_HOST=<host>`）。即使在 Enterprise Server 簽出目錄中，`gh api` 預設仍為 github.com。

## 1. 收集意見回饋

- 解析 PR：若有提供，使用上述目標（編號、URL 或 `owner/repo#N`）；否則使用目前分支的 PR（`gh pr view --json number,url,headRefName,headRefOid,baseRefName,headRepository,headRepositoryOwner`）。若找不到，請詢問我。
- 使用 GraphQL 擷取**所有**審查討論串（分頁），包括每個討論串的：`id`、`isResolved`、`isOutdated`、`path`、`line`、`startLine`、`originalLine`、`diffSide`，以及每條評論的 `databaseId`、`url`、`author.login`、`body`、`diffHunk`、`createdAt`。
- 同時擷取頂層審查內文（帶有非空 `body` 的 `reviews`）以及一般 PR 對話評論，因為這些也可能包含意見回饋。
- 略過已解決的討論串，以及我（PR 作者）最後發言的討論串，除非它們看起來仍未解決。提及過期的討論串，但檢查意見回饋是否仍適用於目前的程式碼。
- 先執行 `git fetch <base remote> refs/pull/<n>/head`，並檢查擷取到的 SHA 是否與 PR 的 `headRefOid` 相符。從該 SHA（下方的 `<headSha>`）讀取程式碼，而不是從 `origin/<headRef>` 讀取（針對來自 Fork 的 PR，它可能不存在）。若我的本機分支落後於它，請指明。
- **對項目進行排序以使審查具連貫性**，而不僅僅是按 diff 中的位置排序：
  - 在排序前，閱讀每個項目並找出相依性與模式。某些評論指向其他評論（「同上」、「同前所述」、「如我在 `foo.go` 中所提」、「這裡有一樣的問題」）。其他評論則重複相同類型的意見回饋（例如在多處出現相同的命名挑剔或遺漏的錯誤檢查）。
  - 將建立模式的評論排在最前面：即完整解釋該模式的評論，通常是寫得最早的評論。然後將所有參照它或重複它的評論緊接排在其後，這樣您只需理解該模式一次。
  - 將其餘評論按檔案與行號排序，使相關的意見回饋保持在一起。若順序相同則按評論 `createdAt` 決勝。
- 在可見的訊息中（不僅僅在思考中），預先告知我有多少個項目。依您呈現的順序提供單行索引（`N. @reviewer path:line — 概要`）。標記後續衍生項目，例如 `(與 #2 相同模式)`。註明任何略過或已解決的討論串。然後按該順序**一次一個**進行檢視。

## 2. 呈現每個項目（每次互動呈現一個）

> **關鍵 — 在提問前項目必須可見。** 我無法看見您的思考/推理過程、工具輸出或 SQL 資料列。我唯一能看到的是您的**助手訊息文字**以及簡短的 `ask_user` 提示。因此對於每個項目，您必須在**同一回應中，緊接在 `ask_user` 呼叫之前**，將下方的完整項目區塊寫為常規助手訊息文字。在寫出該區塊之前，絕不要針對項目呼叫 `ask_user`。僅在思考中總結該項目不算數。
>
> 此區塊**不受任何常規簡潔/字數限制指引的約束** — 在這裡完整性重於簡短。請勿為節省空間而改述評論或略過 diff。

完全按照此範本撰寫每個項目（填寫每個節區；若無則填寫 "n/a" 而非刪除）：

````markdown
---
### 項目 N / M — @reviewer · [`path:line`](COMMENT_URL)
討論串：[在 GitHub 開啟](COMMENT_URL) · 狀態：open | outdated

**意見回饋**
> 第一條評論的完整文字，逐字引用（保留其程式碼區塊/建議）
>
> **@replier:** 每條回覆的完整文字，依序排列

**Diff 上下文**（來自審查的 `diffHunk`，修剪為評論行周圍約 10 行）
```diff
...
```

**目前程式碼** — `path` Lstart–Lend（一律包含；這是我進行決策的依據）
```go
214 | ...
```

**佐證 / 相關上下文** -
列出事實依據：指向相關程式碼/文件的指標、
同模式的早期項目、已驗證的事實。不要在此處放入分析。

**評估**：審查者是否正確？是否有我們應回覆的非顯而易見的權衡？我們確切提議做什麼？ - 讓此節區具可操作性 — 不要只是說「同意」，而是具體說明程式碼將如何變更，或起草論點。

**建議動作**：**採取行動** — 確切說明程式碼將如何變更，或 **回覆理由** — 完整擬定回覆文字供我核准，或 **採取不同行動** / **略過**。
---
````

此區塊的規則：

- `COMMENT_URL` 是評論的 `url` 欄位（例如 `https://github.com/o/r/pull/123#discussion_r456`；主機可能不同，例如在 GitHub Enterprise Server 上）。切勿省略它。
- 從擷取到的 `body` **逐字**引用意見回饋，不要憑記憶。對於頂層審查 / 對話意見回饋，使用該評論的 URL 並將「Diff 上下文」替換為「n/a（非行評論）」，但仍顯示相關的目前程式碼。
- 從 PR head 取得帶有行號的目前程式碼（例如 `git show <headSha>:path | sed -n 'A,Bp' | nl -ba -v A` 或 `gh api repos/<headOwner>/<headRepo>/contents/path?ref=<headSha> -H 'Accept: application/vnd.github.raw'`）— 不要依賴可能過期的本機分支。使用該檔案的語言作為程式碼圍欄標籤。
- 評估中的每個主張都應有「佐證」中的內容支援（`path:line` + 程式碼片段、認可、文件連結、相關評論）。若您在思考時調查了某些內容，請將調查結果放在那裡以便我看見。

然後呼叫 `ask_user` 以獲取我的決策：

- 使問題足夠獨立完整以識別該評論，即使我只看到提示文字：`項目 N / M — @reviewer 於 path:line：「<評論前約 15 個字>…」我該如何處理？`
- 提供如下選項：`照提議行動（建議）`、`回覆理由`、`採取不同行動`、`略過 / 延後`。將您的建議放在第一位。
- 對於遵循先前模式的項目，在項目區塊（於佐證底下）和提示中說明它參照哪個早期項目以及我在那裡的決策。當該決策明顯適用時，提供`同項目 K（建議）`作為第一選項。
- 若我選擇自由格式選項，請在繼續之前與我共同討論解決。
- 若我要求再次檢視項目，請重新列印其完整區塊（若需要請重新擷取）而非進行總結。

持續記錄每個項目和決策（例如在會話 SQL 資料庫中：comment id、url、path、line、decision、planned change、reply text），以免遺失任何內容並確保可重新呈現項目。

## 3. 建構解決方案計畫

當每個項目都已決定時，撰寫一份單一計畫，列出每個項目的：評論連結、決策、程式碼變更（若採取行動）、要張貼的**確切回覆文字**（若回覆，或用於確認行動），以及討論串是否將被**解決**（見 §4 中的預設值）。計畫末尾附上將**重新請求審查**的審查者清單。然後呼叫 `exit_plan_mode` 以便我檢閱與核准。

## 4. 執行核准計畫的規則

- 在進行任何編輯之前，確保工作樹是 PR head 的乾淨簽出：`gh pr checkout <n>`（這也會設定來自 Fork 之 PR 的推送目標），然後檢查 `HEAD` 是否與驗證過的 `<headSha>` 相符。若不相符或工作樹髒污，請停止並詢問我。
- 將程式碼變更做成小型、聚焦的認可。在合理的情況下，每個意見回饋項目使用一個認可，以便回覆能指向特定認可。
- **在回覆之前先推送。** 任何提及認可 SHA 的回覆都必須在該認可已推送到 GitHub 後才能張貼。否則 SHA 不會算繪為連結。依序進行：
  1. 認可，然後執行 `git push`。
  2. 重新讀取 PR 的 `headRefOid`（`gh pr view <n> --json headRefOid`）並確認每個引用的認可皆可從中連訪：`git fetch <base remote> refs/pull/<n>/head`，然後執行 `git merge-base --is-ancestor <sha> FETCH_HEAD`。若否，在張貼前請停止並修復。
  3. 僅在此之後張貼回覆。使用完整的 40 字元 SHA（或使用 PR 主機的 `https://{host}/{owner}/{repo}/pull/{n}/commits/{sha}` 連結），讓 GitHub 能建立連結。
- 在**現有討論串內回覆**（`gh api repos/{owner}/{repo}/pulls/{n}/comments/{comment_id}/replies -f body=...`），而不是作為新的頂層評論。對於頂層審查或對話意見回饋，張貼一條引用其所回答內容的 PR 評論。
- 張貼我核准的回覆文字。僅更改 SHA 是可以的。
- **僅解決計畫中標記為解決的討論串**，且僅在張貼回覆後解決。預設值（我可以在計畫中逐項覆寫）：
  - **採取行動**的項目：解決。
  - **回覆理由**的項目：保持開啟以便審查者回應。
  - **略過 / 延後**的項目：保持開啟，不回覆。
  - 頂層審查 / 對話意見回饋沒有要解決的討論串；略過。
  - 對於標記為解決的討論串，若可用請優先使用 `reply_and_resolve_review_thread` 工具（僅部分 Copilot 介面提供；傳遞討論串 `id` + 根評論 `databaseId`），它能一步完成回覆與解決。否則如上所述使用 `gh api` 張貼回覆，然後透過 GraphQL 解決：`gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -f id=<thread id>`。
  - 對於保持開啟的討論串，使用僅回覆呼叫（若可用使用 `reply_to_review_thread`，否則使用上述的 `gh api …/replies` 呼叫）。切勿對它們使用 reply-and-resolve 工具。
- **最後重新請求審查。** 在推送所有認可、張貼回覆並解決討論串後，向在此輪中處理過其意見回饋的每位人類審查者重新請求審查（排除我自己與機器人帳號）：`gh api -X POST repos/{owner}/{repo}/pulls/{n}/requested_reviewers -f 'reviewers[]=<login>'`（對每位重複 `reviewers[]`）。略過已有待處理審查請求的任何人。若呼叫失敗，請回報而非盲目重試。
- 最後，給我一份簡短摘要，附上您張貼的每個回覆、推送的每個認可、解決了哪些討論串以及向誰重新請求了審查的連結。
