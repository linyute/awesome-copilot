# 觸發器與權限 (Triggers and Privilege)

工作流安全中唯一最重要的問題是：**外部貢獻者是否可以觸發此工作流，如果可以，它會獲得什麼令牌和秘密？** GitHub 對每個觸發器的回答都不同。

## 信任矩陣 (Trust Matrix)

| 觸發器 | 誰可以觸發它 | `GITHUB_TOKEN` | 秘密可用性 | 風險 |
| --- | --- | --- | --- | --- |
| `push` | 儲存庫協作者 | 讀取/寫入 | 是 | 低 — 受信任的作者 |
| `pull_request` (同儲存庫分支) | 協作者 | 讀取/寫入 | 是 | 低 |
| `pull_request` (來自 Fork) | **任何人** | **唯讀** | **否** | 按設計為低 — 即使是惡意代碼也無法竊取任何內容 |
| `pull_request_target` | **任何擁有 Fork 的人** | **讀取/寫入** | **是** | **高** — 在基礎儲存庫上下文中執行 |
| `workflow_run` | 在另一個工作流之後觸發 | **讀取/寫入** | **是** | **高** |
| `issue_comment`, `issues` | **任何人** | **讀取/寫入** | **是** | **高** |

陷阱：來自 Fork 的 `pull_request` 是 *安全* 的，因為 GitHub 有意縮減了令牌權限並扣留了秘密。發現「秘密在 Fork PR 上不起作用」的維護者通常會切換到 `pull_request_target` 以重新獲取它們 — 這樣做等於將寫入令牌和每個秘密交給了任意貢獻者。

## 為什麼 `pull_request_target` 很危險

`pull_request_target` 檢出 **基礎 (base)** 儲存庫的工作流定義（因此 Fork 無法更改執行的內容），但它以全權限執行。當工作流隨後明確檢出 **Fork** 的代碼並執行它時，危險就產生了：

```yaml
# 危險 — 具有寫入令牌 + 秘密的 RCE (遠端代碼執行)
on: pull_request_target
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
        with:
          ref: ${{ github.event.pull_request.head.sha }}   # Fork 的代碼
      - run: npm install && npm test                        # 執行 Fork 的代碼 + 腳本
```

單單 `npm install` 就會執行來自 PR 的任意生命週期腳本。在 `pull_request_target` 下，這些腳本可以讀取 `secrets.*` 並使用寫入令牌推送 commit。

## 安全的雙工作流模式 (Safe Two-Workflow Pattern)

分拆職責。一個 **低權限** 工作流執行不受信任的代碼；一個 **高權限** 工作流僅消耗受信任的 *產出 (output)*。

```yaml
# 1) 低權限：執行不受信任的代碼，無秘密，唯讀令牌
name: PR Build
on: pull_request
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@<sha>
        with: { name: pr, path: dist/ }
```

```yaml
# 2) 高權限：由第一個觸發，絕不執行 Fork 代碼
name: PR Comment
on:
  workflow_run:
    workflows: ["PR Build"]
    types: [completed]
permissions:
  pull-requests: write
jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@<sha>   # 僅限數據，不執行
      # 發布結果，使用受信任的令牌 — 但絕不執行產出的產物 (artifact)
```

## 規則

- 將 `pull_request_target`, `workflow_run`, `issue_comment` 和 `issues` 視為高權限。
- 在高權限工作流中，**絕不** 檢出並執行 PR/Fork 代碼。
- 如果您只需要根據元數據進行標籤、評論或分類，那沒問題 — 只要不執行貢獻者的代碼即可。
- 盡可能優先選擇 `pull_request`（及其安全的唯讀/無秘密預設值）。
