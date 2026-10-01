# 審查路由、擁有權與 SLA

此頁面說明 Awesome Copilot 中的 Pull Request 如何指派給審查者、首次審查預期的時間，以及未達標時會發生什麼事。它涵蓋 [github/awesome-copilot#4184](https://github.com/github/awesome-copilot/issues/4184) 的第一階段（Phase 1）。

## 擁有權（`CODEOWNERS`）

根目錄的 [`CODEOWNERS`](../../CODEOWNERS) 檔案將每個路徑指派給一個團隊，而非個人。

| 路徑 | 擁有團隊 |
|---|---|
| `*`（預設） | `@github/awesome-copilot-core-maintainers` |
| `/extensions/` | `@github/awesome-copilot-canvas-reviewers` |
| `/plugins/` | `@github/awesome-copilot-plugin-reviewers` |
| `/agents/`、`/instructions/`、`/skills/`、`/hooks/`、`/workflows/` | `@github/awesome-copilot-content-reviewers` |
| `/.github/`（含 GitHub Actions 工作流）、`/eng/` | `@github/awesome-copilot-core-maintainers` |

GitHub 會套用**最後**一個符合的規則，因此檔案底部的每個資源項目會針對它們的路徑覆蓋團隊預設值。這些項目透過 `#codeowner` 指令（`.github/workflows/codeowner-update.md`）加入，該指令只在檔案末尾附加一個區塊。現有的每個資源項目目前原樣保留；移除它們已規劃為一個獨立的清理。當你手動編輯 `CODEOWNERS` 時：

- 保留檔案頂部的 `*` 規則與領域團隊區塊。
- 永遠不要把個人使用者加入 `*` 規則。
- 將新的每個資源擁有者附加到檔案末尾。

## 審查者集（`.github/review-routing.yml`）

[`.github/review-routing.yml`](../../.github/review-routing.yml) 是自動審查請求的單一真實來源（single source of truth）。工作流從不硬編碼審查者帳號。

| 鍵 | 用途 |
|---|---|
| `dry_run` | 當為 `true` 時，工作流將其計劃的動作記錄到 job summary，但不做任何變更。 |
| `sla.first_review_business_days` | 路由後、首次審查到期的工作日數（預設 `2`）。 |
| `sla.escalation_business_days` | 路由後、升級到核心集（core pool）的工作日數（預設 `4`）。 |
| `sla.holidays` | 可選的 `YYYY-MM-DD` UTC 日期清單，在計算工作日時排除這些日期。 |
| `labels` | 路由工作流所管理的標籤名稱。 |
| `pools.<name>.team` | 以 `<org>/<team-slug>` 格式表示的團隊。當沒有可用的個人時會被請求，且升級集的團隊在升級時一律會被請求。 |
| `pools.<name>.reviewers` | 路由可選擇的個人 GitHub 登入帳號。 |
| `pools.<name>.backup` | 當審查逾期時被請求的個人。 |
| `routes` | 將意圖標籤（intent labels）對應到集的有序清單。第一個其標籤存在於 PR 上的路由生效。 |
| `default_pool` | 當沒有任何路由符合時使用的集，例如僅含文件的 PR。 |
| `escalation_pool` | 接收升級並作為最後手段（last-resort）備援的集。 |
| `unavailable` | 暫時不在的登入帳號。它們從不被選擇。 |
| `skip_authors`、`skip_labels` | 由這些作者建立的、或帶有這些標籤的 PR，不會被路由或升級。 |

目前的路由，依優先順序：

| 意圖標籤 | 集 |
|---|---|
| `canvas-extension` | `canvas` |
| `external-plugin`、`plugin` | `plugin` |
| `skills`、`agent`、`instructions`、`workflow`、`hooks` | `content` |
| `website-update` | `core-maintainers` |

意圖標籤由 `.github/workflows/label-pr-intent.yml` 與 `label-pr-intent-writer.yml` 套用。

### 更新集（pools）

1. 編輯 `.github/review-routing.yml`。每個集至少保留三名審查者，並跨時區覆蓋。
2. 使用 `node eng/review-routing.mjs validate` 驗證檔案，然後用 `node --test eng/review-routing.test.mjs` 執行單元測試。
3. 開啟一個 PR。該檔案由 core-maintainer 團隊擁有。

要暫時將某位審查者移出輪值（rotation），將其登入帳號加入 `unavailable`，而非從每個集中移除。

## 路由（Routing）

**Review Routing** 工作流（`.github/workflows/review-routing.yml`）會在下列情況執行：

- 對某個 PR 完成 **Label PR Intent** 時。即使用意圖標籤尚未套用，路由也會使用該次執行的意圖標籤。
- 某人加上 `needs-reviewer` 標籤時。唯讀的 **Review Routing Request** 工作流會記錄該請求，然後由 Review Routing 處理。
- 透過 `pr_number` 輸入被手動調度（dispatch）時。像 `/request-review` 指令這類自動化會使用此路徑，因為以 `GITHUB_TOKEN` 加入的標籤不會觸發其他工作流。
- 每小時的排程執行時，或未附 `pr_number` 被調度時。此巡檢（sweep）會評估每個開啟中、非草稿（draft）的 PR。它會路由那些未路由、帶有 `needs-reviewer` 標籤、或其集未被覆蓋（covered）的 PR。每個被路由的 PR 都在各自的 job 中處理。

對每個符合條件的 PR，路由會執行以下步驟：

1. 使用 `routes` 挑選集，無法符合時回退到 `default_pool`。對由 **Label PR Intent** 觸發的執行，該次執行的意圖標籤會取代 PR 目前的意圖標籤，因此過期的標籤不會挑錯集。
2. 檢查該集是否已被**覆蓋（covered）**。當其某位審查者或 backup、或某位核心維護者已被請求或已審查該 PR 時，該集即被覆蓋。若集未被覆蓋，路由會請求集中的一位個人，排除 PR 作者、已被請求的審查者、bots，以及列於 `unavailable` 者。對 `unavailable` 中某人的待處理請求不算覆蓋，但其已提交的審查算。它會優先選擇在所有開啟中 PR 中**未處理的審查請求數最少**的審查者。平手時依 PR 編號輪替。
3. 若集中沒有符合條件的個人，路由會先嘗試該集的 `backup` 清單，再嘗試升級集的審查者，最後請求該集團隊。
4. 加上 `review-due:YYYY-MM-DD` 標籤。該日期是路由當天加上 `first_review_business_days`，以 UTC 計算。標籤被加入的時間標記 SLA 週期的開始。
5. 若 `needs-reviewer` 觸發了該次執行，路由會一律請求一位新審查者：一位尚未被請求、且尚未審查該 PR 的人。它會移除 `needs-reviewer`、`review-overdue` 與 `review-escalated`，然後移除並重新加入到期（due）標籤以重新啟動 SLA。若無法請求任何新審查者或團隊，路由什麼都不改，因此 `needs-reviewer` 與目前到期日期保持不變，每小時巡檢會再試。

一個已被路由的 PR，只要新的 commit 變更其意圖標籤，就會再被檢查一次。若新的目標集未被覆蓋（例如一個 skills PR 現在也涉及 workflow），路由會從該集請求一位審查者。現有的到期日期維持不變。

路由會略過草稿、已關閉的 PR，以及已有人工審查但未路由的 PR，除非存在 `needs-reviewer`。草稿 PR 在被標記為準備好審查時會被路由。

### 失敗與並行（concurrency）

- 路由在變更任何標籤前先請求審查者。若 GitHub 拒絕該請求（例如團隊遺失或 token 缺少存取權限），路由不動標籤並讓 job 失敗。不會有任何東西被標記為已路由，因此下一次執行或巡檢會再試。
- 每個工作流先執行一個唯讀的 `plan` job 來挑選目標 PR。然後在每個使用 `review-routing-pr-<number>` 並行（concurrency）分組的 job 中處理每個 PR。Review Routing 與 Review Escalation 共用該分組，因此它們的讀取、plan 與套用步驟對同一個 PR 從不重疊。在單一執行中，每個 PR 的 job 一次執行一個，且每個 job 在挑選某人前會重新讀取審查者負載（load）。
- 跨不同執行的負載平衡是盡力（best-effort）的。兩在同一時刻路由不同 PR 的執行，可能讀到相同的負載並挑到相同的審查者。一個倉庫級別的鎖可以避免這個問題，但 GitHub 會取消等待同一並行分組的待處理執行，因此路由請求可能會遺失。下一次路由執行會看到更新後的負載。
- 一個 GitHub Actions 矩陣（matrix）最多可持有 256 個 job。若一次巡檢找到的 PR 超過這個數，它會處理前 256 個、記錄一個警告，其餘留給下一次排程執行。Planning 是冪等的，因此沒有任何 PR 會被永久略過。

## SLA 與升級

**Review Escalation** 工作流（`.github/workflows/review-escalation.yml`）會在平日 14:00 UTC 執行，也可手動調度。它會檢查每個已路由的 PR，即每個帶有 `review-due:` 標籤的 PR。

| 條件 | 動作 |
|---|---|
| 人工審查在到期標籤加入後抵達 | 移除 `review-due:*`、`review-overdue` 與 `review-escalated` |
| 到期日結束前無審查 | 請求來自該集 `backup` 清單的 backup，再來自升級集。若沒有可用的個人，則請求該集團隊，然後請求升級團隊，除非它們已被請求。加上 `review-overdue` 並貼上一則註解，說明有誰（若有）被請求。 |
| 路由後 `escalation_business_days` 仍無審查 | 請求升級集團隊與一位核心維護者；加上 `review-escalated`；貼上一則註解 |

工作日為 UTC 的週一到週五，並減去 `sla.holidays`。週一路由的 PR 週三到期、週四逾期、週五升級，即路由後第四個工作日。週三路由的 PR 週五到期、週一逾期、週二升級。來自作者或 bots（包括 Copilot 程式碼審查）的審查不計為首次審查。只有當前到期標籤加入後提交的審查才計入。每個動作在每個 SLA 週期只發生一次，因為標籤記錄了狀態。若某次審查者請求失敗，則略過標籤與註解，讓下一次執行重試。

該工作流也會刪除日期超過 14 天前、且不再存在於任何開啟中 PR 上的 `review-due:*` 標籤。

## 標籤

| 標籤 | 意義 |
|---|---|
| `needs-reviewer` | 要求路由（重新）指派審查者。路由執行後會移除它。 |
| `review-due:YYYY-MM-DD` | 預期完成首次審查的日期。 |
| `review-overdue` | 首次審查已逾期，且已請求一位 backup 審查者。 |
| `review-escalated` | 審查已升級到 core-maintainer 集。 |

**Setup Repository Labels** 工作流會建立 `needs-reviewer`、`review-overdue` 與 `review-escalated`。Routing 會在首次使用每個 `review-due:` 標籤時建立它。

## 安全模型

- 由 Pull Request 觸發的工作流（**Label PR Intent** 與 **Review Routing Request**）以唯讀權限執行，且只上傳一個很小的 JSON artifact。
- **Review Routing** 從 `workflow_run`、`workflow_dispatch` 或 `schedule` 執行。它只 checkout 預設分支、針對觸發該次的執行驗證 artifact，且永遠不 checkout 或執行 PR 的程式碼。這與 `label-pr-intent-writer.yml` 的方法相同。
- 在 Review Routing 與 Review Escalation 兩者中，`plan` job 都是唯讀權限。只有每個 PR 的 job 能對 issues 與 pull requests 寫入。
- 所有審查者邏輯都在 `eng/review-routing.mjs` 中，並由 `eng/review-routing.test.mjs` 覆蓋。

## 啟用路由

路由工作流預設以 `dry_run: true` 與空的審查者清單發佈。要啟用它們：

1. 建立 `CODEOWNERS` 與 `.github/review-routing.yml` 中 `pools` 所參考的所有團隊，每個至少三名成員，並給予每個團隊對倉庫的存取權限。
2. 將團隊成員加入 `.github/review-routing.yml` 中對應的 `reviewers` 與 `backup` 清單。
3. 執行 **Setup Repository Labels**。
4. 設定 `dry_run: false`。
5. 一旦團隊與覆蓋到位，就在 `main` 的 ruleset 中啟用 **Require review from Code Owners**。
