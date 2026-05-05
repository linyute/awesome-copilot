---
name: commit-message-storyteller
description: '分析 git diff 或暫存 (staged) 的變更，並產生敘述式的提交訊息 (commit messages)，解釋變更發生的「原因」而不僅僅是變更了「什麼」 — 遵循約定式提交 (Conventional Commits) 格式。當被要求「編寫提交訊息」、「產生提交」、「描述我的變更」、「我應該將此提交為什麼」、「提交此內容」、「總結我的 diff」或「協助我進行提交」時使用。適用於 git diff 輸出、暫存檔案或變更的純文字描述。'
---

# 提交訊息說書人 (Commit Message Storyteller)

將原始的 git diff 與變更描述轉換為清晰且具故事性的提交訊息，並遵循 [約定式提交 (Conventional Commits)](https://www.conventionalcommits.org/) 規範。您將獲得傳達意圖、上下文與影響的訊息，而非僅僅是「更新 file.js」。

## 何時使用此技能 (When to Use This Skill)

- 使用者說「編寫提交訊息」、「協助我提交」或「產生一個提交」。
- 使用者貼上 git diff 或描述程式碼變更。
- 使用者說「我應該將此提交為什麼？」或「總結我的 diff」。
- 使用者想為其團隊或開源專案建立更好的提交歷史。
- 使用者正在準備 Pull Request 並想要有意義的提交訊息。

## 先決條件 (Prerequisites)

準備好以下至少一項：
- 來自 `git diff` 或 `git diff --staged` 的輸出。
- 對於變更內容與原因的描述。
- 已修改檔案的清單。

## 運作方式 (How It Works)

### 步驟 1：收集變更內容的上下文 (Step 1: Gather the Change Context)

詢問使用者（或從 diff 中推斷）：

1. **變更了什麼** — 受影響的檔案、函式、邏輯。
2. **為何變更** — 錯誤修復、新功能、重構、效能提升等。
3. **誰/什麼觸發了它** — 議題 (issue) 編號、使用者請求、技術債等。

如果使用者提供了原始的 `git diff`，請自動從中擷取這些上下文。

### 步驟 2：識別提交類型 (Step 2: Identify the Commit Type)

參考此指南將變更對應至約定式提交類型：

| 類型 | 何時使用 |
|------|----------|
| `feat` | 新增功能或能力 |
| `fix` | 修復錯誤或不正確的行為 |
| `refactor` | 在不改變行為的情況下重組程式碼 |
| `perf` | 提高效能的變更 |
| `docs` | 僅限文件的變更 |
| `style` | 格式、空格、缺失的分號（不涉及邏輯變更） |
| `test` | 新增或更新測試 |
| `chore` | 建構流程、相依性更新、設定變更 |
| `ci` | CI/CD 管線變更 |
| `revert` | 還原先前的提交 |

詳細範例請參閱 `references/conventional-commits-guide.md`。

### 步驟 3：撰寫提交訊息 (Step 3: Write the Commit Message)

遵循以下結構：

```
<類型>(<選填範圍>): <簡短的祈使句總結>

<正文 — 故事：為何進行此變更，解決了什麼問題>

<頁尾 — 議題引用、破壞性變更通知>
```

#### 各部分的規則 (Rules for Each Part)

**標題列（第一行）： (Subject line (first line):)**
- 使用祈使句 (imperative mood)：「新增 (add)」、「修復 (fix)」、「移除 (remove)」 — 而非「已新增 (added)」或「修復了 (fixes)」。
- 最多 72 個字元。
- 結尾不加句點。
- 冒號後使用小寫。

**正文（故事）： (Body (the story):)**
- 解釋「為什麼 (why)」，而非「什麼 (what)」（diff 已經顯示了是什麼）。
- 描述此變更前存在的問題。
- 如果相關，提及任何考慮過的替代方案。
- 每行保持在 100 個字元以內。
- 與標題列之間以一個空行隔開。

**頁尾： (Footer:)**
- 引用議題：`Closes #123`, `Fixes #456`, `Refs #789`。
- 標記破壞性變更：`BREAKING CHANGE: <描述>`。

### 步驟 4：產生輸出 (Step 4: Generate Output)

在可複製的程式碼區塊中產出提交訊息，隨後附上一句關於您所述故事的簡單英文解釋。

**範例輸出：**

```
fix(auth): prevent token refresh loop on expired sessions

When a user's session expired mid-request, the auth middleware was
triggering a token refresh, which itself failed validation and triggered
another refresh — causing an infinite retry loop that crashed the app.

This adds a recursion guard flag that aborts the refresh cycle if a
refresh is already in progress, returning a clean 401 instead.

Closes #312
```

> **所述故事：** 工作階段到期時的無聲無限循環導致應用程式當機；此變更提早停止該循環並傳回清晰的錯誤。

---

## 單一 Diff 包含多個提交 (Multiple Commits from One Diff)

如果 diff 包含 **邏輯上分開的變更**，請將其拆分為多個提交訊息並告知使用者。使用以下啟發式方法：

- 具有無關用途的不同檔案 → 可能是分開的提交。
- 同一個檔案但關注點不同（例如：錯誤修復 + 重構） → 建議拆分。
- 所有的內容都緊密耦合 → 一個提交即可。

---

## 邊緣情況 (Edge Cases)

| 情況 | 如何處理 |
|-----------|---------------|
| 使用者除了 diff 之外未提供任何上下文 | 從檔名與變更的符號中推斷類型與範圍 |
| 變更跨越多個檔案且無明確主題 | 詢問：「這是一個邏輯變更，還是多個？」 |
| 偵測到破壞性變更 (Breaking change) | 自動加入 `BREAKING CHANGE:` 頁尾 |
| 使用者要求「保持簡短」 | 省略正文，僅撰寫強而有力的標題列 |
| 無可用議題編號 | 完全省略頁尾 |

---

## 快速參考 (Quick Reference)

```bash
# 取得您的暫存 diff 並貼到 Copilot
git diff --staged

# 或取得最後一組未提交的工作樹變更
git diff
```

類型範例與範圍指南請參閱 `references/conventional-commits-guide.md`。
