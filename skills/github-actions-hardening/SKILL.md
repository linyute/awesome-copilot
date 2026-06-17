---
name: github-actions-hardening
description: GitHub Actions 工作流檔案 (.github/workflows/*.yml) 的安全強化審查器。能推理模式匹配器和通用代碼 linter 可能遺漏的 Actions 威脅模型 — 不受信任輸入的指令注入、執行 Fork 代碼的高權限觸發器、可變的 Action 引用以及過度授權的令牌。當被要求審查、審計、強化或保護 GitHub Actions 工作流時，在編寫新工作流時，或對於任何諸如「此工作流安全嗎？」、「審查我的 CI 是否存在安全問題」、「為什麼 pull_request_target 在這裡很危險？」、「固定我的 Actions」或「鎖定 GITHUB_TOKEN 權限」等請求時，請使用此技能。涵蓋透過 ${{ }} 插值的指令注入、pull_request_target / workflow_run 權限提升、第三方 Action 的 SHA 固定、最小權限原則、GITHUB_ENV/GITHUB_OUTPUT 注入、秘密洩露、取代長期憑據的 OIDC，以及公共儲存庫上自我代管執行器的風險。
---

# GitHub Actions 安全強化 (GitHub Actions Hardening)

一個專注於 GitHub Actions 工作流的安全審查器。它能推理 *Actions 特有的* 威脅模型 — 信任邊界存在於觸發類型、令牌範圍和字串插值中 — 而非一般安全掃描器查找的應用程式代碼漏洞。大多數工作流風險對語言 linter 來說是不可見的，因為危險代碼本身就是 YAML，以及 GitHub 在您的腳本執行前將 `${{ }}` 表達式展開到 Shell 中的方式。

## 何時使用此技能

當請求涉及以下內容時，請使用此技能：

* 審查、審計或強化 `.github/workflows/` 下的任何檔案
* 編寫新工作流並希望其預設安全
* 使用 `pull_request_target`, `workflow_run` 或 `issue_comment` 觸發器的工作流
* 關於 `GITHUB_TOKEN` 權限或 `permissions:` 鍵的問題
* 將 Action 固定到 Commit SHA vs 標籤 vs 分支
* 在 `run:` 步驟中處理不受信任的輸入（Issue 標題、PR 描述、分支名稱、Commit 訊息）
* Actions 的 OIDC / 雲端身分驗證，或 CI 中的秘密處理
* 公共儲存庫上的自我代管執行器
* 任何諸如「此工作流安全嗎？」、「保護我的 CI」或「審查此 GitHub Action」等請求

## 核心見解

在工作流中，**`${{ <expr> }}` 在 Shell 執行腳本 *之前* 由執行器展開到腳本中。** 因此，像這樣的步驟：

```yaml
- run: echo "Title: ${{ github.event.issue.title }}"
```

並不是在傳遞變數 — 而是 *將攻擊者控制的文本直接粘貼到您的 Shell 命令中*。標題為 `"; <attacker-command> #` 的 Issue 會被連接到腳本中並執行。這種單一機制是現實世界中最常見的 Actions 漏洞，而模型通常會產生這種漏洞。請將每個包含外部貢獻者可以影響的數據的 `${{ }}` 視為指令注入接收點 (sink)。

## 執行工作流

對於審查的每個工作流，**按順序** 遵循以下步驟。

### 第 1 步 — 映射觸發器與信任級別

讀取每個 `on:` 觸發器並對工作流的權限進行分類：

* `push`, `pull_request` (來自同一儲存庫) → 以貢獻者自身的信任級別運行
* 來自 **Fork** 的 `pull_request` → 以 **唯讀** 令牌、**無秘密** 運行（按設計為安全）
* `pull_request_target`, `workflow_run`, `issue_comment`, `issues` → 在 **基礎 (base)** 儲存庫的上下文中運行，具有 **讀寫令牌和對秘密的完全訪問權限**，但可以由 **外部貢獻者觸發**。這些是危險的觸發器。

閱讀 `references/triggers-and-privilege.md` 以獲取完整的信任矩陣。

### 第 2 步 — 獵取指令注入

對於每個 `run:` 區塊、`actions/github-script` 中的每個 `script:` 以及自定義 Action 的每個輸入，列出 `${{ }}` 表達式並檢查是否有任何解析為攻擊者可控數據。高風險上下文包括：

* `github.event.issue.title`, `github.event.issue.body`
* `github.event.pull_request.title`, `github.event.pull_request.body`, `.head.ref`, `.head.label`
* `github.event.comment.body`, `github.event.review.body`
* `github.event.pages.*.page_name`, `github.event.commits.*.message`, `github.event.head_commit.*`
* `github.head_ref` 以及 Fork 作者可以設定的任何 `github.event.*` 欄位

閱讀 `references/injection.md` 以獲取完整的接收點列表和安全模式修復。

### 第 3 步 — 檢查高權限觸發器是否執行了不受信任的代碼

如果 `pull_request_target` 或 `workflow_run` 工作流檢出 PR/Fork 代碼 (`ref: ${{ github.event.pull_request.head.sha }}`) **然後執行它** (build, test, install 腳本, 帶有生命週期腳本的 `npm install` 等)，這就是針對高權限令牌的遠端代碼執行。將其標記為「嚴重 (CRITICAL)」。安全模式是拆分為兩個工作流：一個執行不受信任代碼的低權限 `pull_request` 工作流，以及一個僅消耗其結果的高權限 `workflow_run` 工作流。

### 第 4 步 — 審計 `permissions:`

* 如果 **沒有** `permissions:` 區塊，工作流將繼承儲存庫預設值，這可能是對所有內容的讀/寫權限。標記它。
* 建議使用頂層 `permissions: {}` (拒絕所有) 或 `contents: read`，然後按作業 (job) 授予最小權限 (例如，僅在發表評論的作業上授予 `pull-requests: write`)。
* 標記任何步驟實際上不需要的 `permissions: write-all` 或廣泛的 `write` 範圍。

閱讀 `references/permissions-and-tokens.md` 以獲取各個範圍的指導和 OIDC 設定。

### 第 5 步 — 審計 Action 引用 (供應鏈)

對於每個 `uses:`：

* **第三方 Action** (非 `actions/*` 或 `github/*`) 必須固定到完整的 40 字元 Commit SHA，而不是標籤或分支。標籤和分支是可變的；被攻破的上游 Action 可以將 `v1` 重寫為惡意代碼，並使用您的令牌和秘密執行。
* 第一方 `actions/*` 風險較低，但固定 SHA 仍是強化建議。
* 將 `@main`, `@master` 或任何分支引用標記為「高 (HIGH)」 — 那是「最新」版本，隨時可能在您不知情的情況下發生變化。
* 在尾隨註解中註明易讀版本：`uses: foo/bar@<sha> # v2.1.0`。

閱讀 `references/supply-chain.md` 以獲取固定、Actions 的 Dependabot 以及產物/快取風險。

### 第 6 步 — 檢查秘密與產出處理

* 秘密不得被 Echo、列印或寫入日誌；在觸碰秘密的步驟中不要使用 `set -x` / `bash -x`。
* 秘密不得傳遞給執行不受信任代碼的步驟或不受信任的第三方 Action。
* 寫入 `$GITHUB_ENV` 或 `$GITHUB_OUTPUT` 的不受信任多行數據可以注入環境變數或步驟產出 — 使用帶有隨機分隔符的 Heredoc 形式，絕不要直接寫入原始使用者輸入。
* `actions/checkout` 預設在磁碟上留下令牌；當作業隨後執行不受信任代碼時，請設定 `persist-credentials: false`。

### 第 7 步 — 產出報告

使用 `references/report-format.md` 中的格式產出發現結果：先是一個嚴重程度摘要表，然後是按檔案分組的發現結果、確切的有問題 YAML、易懂的風險說明，以及具體的修復前後對比。絕不自動應用更改 — 請將其呈現供審閱。

## 嚴重程度指南 (Severity Guide)

| 嚴重程度 | 含義 | 示例 |
| --- | --- | --- |
| 🔴 嚴重 (CRITICAL) | 外部貢獻者可觸及的令牌/秘密盜取或 RCE | `pull_request_target` 檢出並執行 Fork 代碼；在高權限觸發器的 `run:` 中使用 `${{ github.event.* }}` |
| 🟠 高 (HIGH) | 可利用的供應鏈或範圍問題 | 使用可變標籤/分支的第三方 Action；`write-all` 權限；`issue_comment` 上的注入接收點 |
| 🟡 中 (MEDIUM) | 在特定條件或鏈條下的風險 | 缺失 `permissions:` 區塊；非 Fork PR 作者可觸及的秘密 |
| 🔵 低 (LOW) | 強化缺口，直接風險較低 | 第一方 Action 未固定 SHA；在非特權作業中保留 `persist-credentials` 預設值 |
| ⚪ 資訊 (INFO) | 觀察結果，非漏洞 | 固定 SHA 旁邊缺少版本註解 |

## 輸出規則

* **始終** 先顯示發現結果摘要表（按嚴重程度計數）。
* **按問題類型分組**，而不是按檔案。
* **要精確** — 引用有問題的行並提供行位置。
* **始終** 為每個嚴重/高風險問題配對具體的已修正 YAML 片段。
* **絕不** 僅因為 Fork `pull_request` 執行不受信任的代碼就聲稱它是危險的 — 它沒有秘密且只有唯讀令牌。將「嚴重」留給高權限觸發器。
* 如果工作流已經過強化，請說明並列出已檢查的項目。

## 參考檔案

根據需要加載：

* `references/triggers-and-privilege.md` — 每個觸發器的信任矩陣，為什麼 `pull_request_target` 和 `workflow_run` 是高權限的，以及雙工作流安全模式。
  + 搜索模式：`pull_request_target`, `workflow_run`, `issue_comment`, `fork`, `secrets`, `read-only token`, `trust boundary`
* `references/injection.md` — 攻擊者可控的 `${{ }}` 上下文完整列表以及每個接收點（`run`, `github-script`, Action 輸入）的 `env:` 變數安全模式。
  + 搜索模式：`script injection`, `github.event`, `head_ref`, `issue title`, `env`, `intermediate variable`, `actions/github-script`
* `references/permissions-and-tokens.md` — `GITHUB_TOKEN` 範圍、每種作業類型的最小權限 `permissions:` 配方，以及用於雲端身分驗證而非長期秘密的 OIDC。
  + 搜索模式：`permissions`, `GITHUB_TOKEN`, `write-all`, `contents: read`, `id-token`, `OIDC`, `least privilege`
* `references/supply-chain.md` — 第三方 Action 的 SHA 固定、`github-actions` 的 Dependabot、跨 `workflow_run` 的產物和快取毒化，以及自我代管執行器的暴露。
  + 搜索模式：`SHA pin`, `uses`, `mutable tag`, `Dependabot`, `download-artifact`, `cache`, `self-hosted runner`
* `references/report-format.md` — 輸出模板：摘要表、發現卡片以及修復前後區塊。
  + 搜索模式：`report`, `format`, `finding`, `summary`, `remediation`, `before`, `after`
