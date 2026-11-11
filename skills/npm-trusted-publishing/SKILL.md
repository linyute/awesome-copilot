---
name: npm-trusted-publishing
description: '在 GitHub Actions 中設定或修正 npm 受信任發佈 (OIDC) 並移除 NPM_TOKEN。適用於 ENEEDAUTH、PUT 時發生 E404、E422 repository.url，或在 2027 年 1 月前移出繞過 2FA 的權杖。'
---

# npm 受信任發佈 (Trusted Publishing)

將 GitHub Actions 發佈工作流程從儲存的 `NPM_TOKEN` 移轉至 npm [受信任發佈](https://docs.npmjs.com/trusted-publishers)。GitHub 會為該次執行簽署短期的 OIDC 權杖，npm 則將其交換為發佈權杖。本技能也能診斷移轉進行到一半時所產生的誤導性錯誤。自 2027 年 1 月起，繞過 2FA 的細微權杖將無法再直接進行發佈 ([npm 文件](https://docs.npmjs.com/about-access-tokens/))。

## 何時使用此技能

- 使用者希望從發佈工作流程中移除 `NPM_TOKEN` / `NODE_AUTH_TOKEN`，或設定 OIDC / 出處 (provenance) 發佈。
- CI 發佈失敗並顯示 `ENEEDAUTH`、`404 Not Found - PUT https://registry.npmjs.org/...` 或 `E422 ... repository.url`。
- 發佈記錄顯示 `npm notice npm tokens that bypass 2FA are being restricted`。

## 檢查清單 (必須全數符合)

請逐一檢查每項項目。缺少任何一項都會產生上述錯誤。

1. **OIDC 權限:** 發佈工作具有 `permissions: id-token: write`。若工作原本沒有 `permissions` 區塊，請保留其所需的範圍，例如用於標籤與發行版本的 `contents: write`，或用於 changeset 的 `pull-requests: write`。新增區塊會刪除所有未明確列出的範圍。
2. **使用 npm 11.5.1 或更新版本**執行發佈。Node 24 已隨附此版本。Node 22 隨附 npm 10，因此在發佈前請新增 `npm install -g npm@^11.5.1` (或更新的釘選主版本)。pnpm 10 會將發佈交由 npm 處理，故適用相同規則。Yarn Berry 則需要 4.10.3+。
3. **沒有權杖傳入發佈步驟。** 從步驟、工作及工作流程的 `env` 中移除 `NODE_AUTH_TOKEN`、`NPM_TOKEN` 與 `YARN_NPM_AUTH_TOKEN`，並刪除寫入 `_authToken` 或 `npmAuthToken` 的指令碼行。npm 會優先嘗試 OIDC，但會退回使用已設定的權杖，因此遺留的權杖會讓舊憑證繼續生效。僅在需要私有套件的安裝步驟中保留**唯讀**權杖。
4. **`actions/setup-node` 設定了 `registry-url: https://registry.npmjs.org`。**
5. **`package.json` 的 `repository.url` 指向相同的 GitHub 存放庫**，例如 `git+https://github.com/OWNER/REPO.git`，若為工作區套件則需加上 `directory`。不符會導致 E422。
6. **每個套件在 npm 上均已存在受信任發佈者** (npmjs.com → package → Settings → Trusted publishing)，或使用 npm 11.15+ 執行：
   `npm trust github <pkg> --repo OWNER/REPO --file release.yml --allow-publish --yes`
   - 工作流程**檔案名稱**必須完全相符；區分大小寫且包含 `.yml`。
   - 若為**可重複使用的工作流程 (reusable workflow)**，請使用*呼叫端*工作流程的檔案名稱，並在呼叫端中同樣授予 `id-token: write`。
   - 若工作使用 `environment:`，請在發佈者上設定相同的環境。
   - 尚不存在的套件必須先手動發佈一次。
7. **GitHub 代管的執行器 (runner)。** 自架執行器 (Self-hosted runner) 無法使用受信任發佈。

## 安全性規則

- **不受信任的觸發條件:** 絕不要在由 `pull_request_target`、`issue_comment`、`workflow_run` 或 `discussion` 觸發的工作流程工作中新增 `id-token: write`。這會讓外部人員能夠交換 OIDC 權杖並進行發佈。請將發佈移至 `release`、`push` (標籤) 或 `workflow_dispatch`。
- **模擬執行 (Dry runs):** `npm publish --dry-run` 與 `npm pack` 工作不會進行發佈，因此不需要 `id-token` 也不需要受信任發佈者。
- **舊權杖:** 僅在第一次無權杖發佈成功後，再刪除 Secret (`gh secret delete NPM_TOKEN`) 並在 npmjs.com 上將其撤銷。

## 錯誤疑難排解指引

| 錯誤 | 常見原因 |
|---|---|
| `ENEEDAUTH` | 未設定 `id-token: write`、npm 版本早於 11.5.1，或工作流程檔案名稱與受信任發佈者不相符 |
| `404 Not Found - PUT https://registry.npmjs.org/<pkg>` | 同上、`environment` 不相符、尚未建立受信任發佈者，或仍在使用過期的權杖 |
| `E422 ... repository.url` | `package.json` 缺少 `repository` 或指向另一個存放庫 |
| 發佈仍在使用權杖 | 權杖仍殘留在 env、`.npmrc` 或 `.yarnrc.yml` 中 (檢查清單第 3 項) |

## 範例

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm publish --access public   # 沒有 NODE_AUTH_TOKEN
```

## 自動化工具

[go-tokenless](https://github.com/Continuous-Actions/go-tokenless) (MIT) 可將此檢查清單套用至既有存放庫。當使用者希望自動進行修改時可使用它。
- `npx go-tokenless` 會印出工作流程與 `package.json` 變更的唯讀 diff，以及 `npm trust` 指令。
- `npx go-tokenless apply` 會寫入變更。
- 遇到上述不安全情境時它會拒絕執行，而非逕行臆測。

## 限制

- npm 端的操作 (新增受信任發佈者、刪除舊權杖) 需要使用者的 npm 登入資訊與 2FA。請將這些步驟交由使用者手動完成。
- 受信任發佈僅涵蓋 GitHub Actions、GitLab.com 及 CircleCI 雲端服務。
