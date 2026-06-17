# 指令注入 (Script Injection)

`${{ <expr> }}` 在 Shell 執行 **之前** 作為文本被替換到腳本中。因此，任何解析為外部貢獻者可控數據的表達式都是指令注入的接收點 (sink)。

## 攻擊者可控的上下文

這些內容可以由任何能夠開啟 Issue、PR 或評論的人設定：

| 上下文 | 設定者 |
| --- | --- |
| `github.event.issue.title` / `.body` | Issue 作者 |
| `github.event.pull_request.title` / `.body` | PR 作者 |
| `github.event.pull_request.head.ref` / `.head.label` | PR 作者（分支名稱） |
| `github.head_ref` | PR 作者（分支名稱） |
| `github.event.comment.body` | 評論者 |
| `github.event.review.body` / `.review_comment.body` | 審閱者 |
| `github.event.commits.*.message` / `head_commit.message` | Commit 作者 |
| `github.event.commits.*.author.email` / `.name` | Commit 作者 |
| `github.event.pages.*.page_name` | Wiki 編輯者 |

名為 `$(<attacker-command>)` 的分支或標題為 `"; <attacker-command> #` 的 Issue 在插值到 `run:` 步驟時會變為 Shell 指令。

## 易受攻擊的模式 (Vulnerable Pattern)

```yaml
# 易受攻擊
- run: |
    echo "Reviewing PR: ${{ github.event.pull_request.title }}"
    git checkout ${{ github.head_ref }}
```

## 安全模式 — 透過 `env:` 傳遞

將不受信任的值綁定到環境變數，然後引用 *Shell* 變數（需加引號）。Shell 變數被視為數據，絕不會被重新解析為工作流語法：

```yaml
# 安全
- env:
    PR_TITLE: ${{ github.event.pull_request.title }}
    HEAD_REF: ${{ github.head_ref }}
  run: |
    echo "Reviewing PR: $PR_TITLE"
    git checkout "$HEAD_REF"
```

`${{ }}` 現在僅出現在 `env:` 側，它在那裡被賦值為一個值，而不是拼接到指令中。始終為 Shell 變數加引號 (`"$PR_TITLE"`) 以防止單詞拆分 (word-splitting) 和 Globbing。

## `actions/github-script`

同樣的規則也適用。不要將 `${{ }}` 插值到 `script:` 主體中 — 請透過環境變數傳遞並讀取 `process.env`：

```yaml
# 易受攻擊
- uses: actions/github-script@<sha>
  with:
    script: console.log("${{ github.event.issue.title }}")

# 安全
- uses: actions/github-script@<sha>
  env:
    TITLE: ${{ github.event.issue.title }}
  with:
    script: console.log(process.env.TITLE)
```

## 自定義 Action 輸入

將不受信任的 `${{ }}` 傳遞給 Composite 或 JS Action 的 `with:` 輸入是否安全，取決於 Action 本身是否將輸入插值到 Shell 中。如有疑問，請透過 `env:` 傳遞並讓 Action 讀取環境，或先進行清理/驗證（例如，分支名稱應匹配 `^[A-Za-z0-9._/-]+$`）。

## 快速審計清單

1. 使用 Grep 查找每個 `run:` 和 `script:` 中的 `${{`。
2. 對於每一個，解析表達式指向的內容。
3. 如果它可以由非協作者設定 → 使用帶引號的 Shell 變數透過 `env:` 重寫。
4. `github.actor`, `github.repository`, `github.sha`, `github.ref`（用於分支保護上下文）以及類似的伺服器控制值並非由攻擊者設定，但作為深度防禦，進行 `env:` 重寫也沒有壞處。
