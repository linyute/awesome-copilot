# 步驟 8: 回覆（一律）+ 解決（有條件）

子代理類型：`general-purpose` **草擬**回覆主體；
**父代**發佈它們（異動保持為父代所有）。草擬子代理的預算：5 分鐘。

在步驟 7（提交 + 推送）之後執行，以便每個回覆都可以引用**推送的提交 SHA**。

## 輸入

- 來自步驟 4 的完整分流表 — 每個開啟的執行緒為 `{ thread_id, action, rationale }`（包含 `escalate-to-user`）。
- 來自步驟 7 已推送的 `HeadOid`。
- 來自步驟 5 的每個執行緒修復 `summary` 和 `files_touched`（針對 `fix` 列）。

## 回傳合約

每個開啟的執行緒一列：

```
{ thread_id, action, reply_body }
```

其中 `action` ∈ `fix` | `decline` | `escalate-to-user`。父代取用此資料以執行解決/不解決的決策（請參閱程序）。

## 程序

1. **草擬子代理**根據分流 `action` 選擇適當的範本（請參閱 [#templates](#templates)），為每個執行緒產生一個 `reply_body`。在 `fix` 回覆中引用步驟 7 中推送的 SHA。對於 `escalate-to-user`，說明處置方式以及供人類合併擁有者解答的開放問題；不要承諾解決。
2. **父代發佈每個回覆**，選擇是否解決：

   ```pwsh
   pwsh ./scripts/08-reply-and-resolve.ps1 -ThreadId <id> -Body <text>
   ```

   - `action ∈ { fix, decline }` → 如上執行（執行解決）。
   - `action == escalate-to-user` → **新增 `-NoResolve`** 以便執行緒為人類保持開啟：

     ```pwsh
     pwsh ./scripts/08-reply-and-resolve.ps1 -ThreadId <id> -Body <text> -NoResolve
     ```

## 陷阱

- **回覆每個開啟的執行緒；僅在迴圈擁有處置方式（`fix` 或 `decline`）時解決。** 不回覆就解決不會留下為何認為該問題已被處理的記錄。
- **呈報的執行緒保持開啟，*並附帶我們說明處置方式的回覆*。** 它們是向人類合併擁有者的明確交接，而不是迴圈失敗 — 這就是為什麼步驟 9 的收斂可以在 `OpenThreadCount > 0` 的情況下成功的原因。
- **異動歸父代所有。** 子代理僅草擬，絕不發佈。這將異動的稽核追蹤保持在父代上，並避免並行子代理之間重複發佈的競爭條件。
- **引用已推送的 SHA，而非本機提交。** 步驟 7 記錄的 `HeadOid` 是檢視者唯一可以瀏覽的 SHA。
- **回覆衛生對下一輪很重要。** 未引用原由的拒絕會被下一次 Copilot 審查重新提出。請參閱 [04-triage.md](04-triage.md#reply-hygiene)。

## 範本

依分流動作選擇：

| 分流動作 | 範本 |
|---------------|----------|
| `fix` | [reply-fix.md](../templates/reply-fix.md) |
| `decline` | [reply-decline.md](../templates/reply-decline.md) |
| PR 說明 / 留言偏離確認 | [reply-drift.md](../templates/reply-drift.md) |
| 帶有延後後續追蹤的部分修復 | [reply-partial.md](../templates/reply-partial.md) |

對於 `escalate-to-user`，沒有範本 — 撰寫一個說明處置方式和開放問題的專屬回覆，然後以 `-NoResolve` 發佈，以便執行緒保持開啟。

## 回覆指引

回覆必須發揮實際作用 — 它為未來的維護者記錄決策，並塑造下一次 Copilot 審查將呈現的內容。

要**具體**（引用檔案路徑、提交 SHA、函式名稱）、**直接**（有立場時不迴避）且**簡短**（通常為 2-4 句話）。冗長的回覆通常意味著該輪次應該被拆分。

### 反模式 — 請勿使用

- ❌ 沒有實質內容的 `"Thanks!"` / `"Good point."`。
- ❌ `"Will fix later."` 要麼現在修復，要麼說明原由拒絕；未在任何地方追蹤的延後修復將會遺失。
- ❌ 不回覆即解決。下一個檢視者無法重建執行緒關閉的原因。
- ❌ 無推論的 `"I disagree."`。說明實際的技術分歧。
