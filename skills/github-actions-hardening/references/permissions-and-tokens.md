# 權限與令牌 (Permissions and Tokens)

每次工作流執行都會自動獲得一個 `GITHUB_TOKEN`。它的範圍決定了如果某個步驟被攻破後的受損範圍，因此請將其範圍限定為最小。

## 預設範圍過於寬泛

如果工作流沒有 `permissions:` 區塊，它將繼承儲存庫/組織的預設值。在較舊或權限較寬鬆的儲存庫上，該預設值可能是 **對大多數範圍的讀/寫權限**。那麼，單個注入的指令或惡意依賴項在執行時就具備了推送代碼、發布 Release 或批准 PR 的能力。

## 最小權限配方 (Least-Privilege Recipe)

在頂層設定限制性的預設值，然後僅在需要時按作業 (Job) 提升權限。

```yaml
# 預設拒絕所有
permissions: {}

jobs:
  build:
    permissions:
      contents: read          # 僅用於檢出代碼 (checkout)
    runs-on: ubuntu-latest
    steps: [...]

  comment:
    permissions:
      contents: read
      pull-requests: write    # 此作業發表評論；不執行其他操作
    runs-on: ubuntu-latest
    steps: [...]
```

常用範圍：`contents`, `pull-requests`, `issues`, `actions`, `packages`, `id-token`, `deployments`, `checks`, `statuses`。每個範圍都可以設定為 `read`, `write` 或 `none`。

## 要標記的發現結果

* 任何地方都沒有 `permissions:` 區塊 → 中 (MEDIUM)（繼承可能寬泛的預設值）。
* `permissions: write-all` → 高 (HIGH)。
* 作業步驟從未使用的 `write` 範圍 → 高 (HIGH)（請刪除）。
* 應存在於單個作業中的頂層 `write` 權限 → 中 (MEDIUM)（請將其下移）。

## 使用 OIDC 取代長期雲端秘密

將靜態雲端金鑰 (`AWS_ACCESS_KEY_ID` 等) 存儲為儲存庫秘密意味著洩露將是永久性的，直到手動更換。優先選擇 OpenID Connect：工作流請求一個受雲端供應商信任、範圍限定於該儲存庫/分支、並在幾分鐘內過期的短期令牌。

```yaml
permissions:
  id-token: write     # 請求 OIDC 令牌所需
  contents: read
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@<sha>
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-ci-role
          aws-region: us-east-1
      # 無需 AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY 秘密
```

Azure (`azure/login`)、GCP (`google-github-actions/auth`)、HashiCorp Vault 等也存在同樣的模式。在雲端側，將信任策略範圍限定於特定的儲存庫，理想情況下限定於特定的分支/環境，以便 Fork 或其他儲存庫無法取得該角色。

## 秘密衛生 (Secret Hygiene)

* 僅在需要秘密的作業中引用它們。
* 絕不要在處理秘密的步驟中 `echo` 秘密或啟用 Shell 追蹤 (`set -x`)。
* 不要將秘密傳遞給您尚未固定 SHA 並審查過的第三方 Action。
* 請記住，來自 Fork 的 `pull_request` 執行不會獲得秘密 — 不要試圖透過切換到 `pull_request_target` 來「修復」此問題（參見 `triggers-and-privilege.md`）。
