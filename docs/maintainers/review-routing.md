# 檢閱路由、所有權與 SLA

本頁說明 Awesome Copilot 中的拉取請求 (Pull Request) 如何指派給檢閱者、預期初次檢閱的速度，以及未達目標時的處理方式。本內容涵蓋 [github/awesome-copilot#4184](https://github.com/github/awesome-copilot/issues/4184) 的第 1 階段。

## 所有權 (`CODEOWNERS`)

根目錄下的 [`CODEOWNERS`](../../CODEOWNERS) 檔案將每個路徑指派給一個團隊，而非個別人員。

| 路徑 | 擁有團隊 |
|---|---|
| `*`（預設） | `@github/awesome-copilot-core-maintainers` |
| `/extensions/` | `@github/awesome-copilot-canvas-reviewers` |
| `/plugins/` | `@github/awesome-copilot-plugin-reviewers` |
| `/.github/plugin/` | `@github/awesome-copilot-plugin-reviewers` |
| `/agents/`, `/instructions/`, `/skills/`, `/hooks/`, `/workflows/` | `@github/awesome-copilot-content-reviewers` |
| `/.github/`（包含 GitHub Actions 工作流程）、`/.github/scripts/` | `@github/awesome-copilot-core-maintainers` |
| `/website/` 下的 Copilot 工作坊內容 | `@github/awesome-copilot-workshop-reviewers` |

GitHub 會套用**最後一個**相符的規則，因此工作坊項目與 `/.github/plugin/` 項目會覆寫其路徑上較廣泛的規則。手動編輯 `CODEOWNERS` 時：

- 將 `*` 規則與領域團隊區塊保留在檔案頂端。
- 絕不要將個別使用者新增至 `*` 規則。
- 在所覆寫的較廣泛規則之後新增更明確的路徑擁有者。

## 檢閱者集區 (`.github/review-routing.yml`)

[`.github/review-routing.yml`](../../.github/review-routing.yml) 是自動檢閱請求的單一真實來源。工作流程絕不硬式編碼檢閱者帳號。

| 索引鍵 | 用途 |
|---|---|
| `dry_run` | 為 `true` 時，工作流程會將其規劃的動作記錄至作業摘要，但不會進行任何變更。 |
| `sla.first_review_business_days` | 路由後到初次檢閱到期的工作天數（預設為 `2`）。 |
| `sla.escalation_business_days` | 路由後到呈報至核心集區的工作天數（預設為 `4`）。 |
| `sla.holidays` | 從工作天計算中排除的 `YYYY-MM-DD` UTC 日期選用清單。 |
| `labels` | 路由工作流程所管理的標籤名稱。 |
| `pools.<name>.team` | `<org>/<team-slug>` 格式的團隊。當沒有個別人員可用時會請求該團隊，且呈報集區的團隊在呈報時一律會被請求。 |
| `pools.<name>.reviewers` | 路由可從中挑選的個別 GitHub 帳號。 |
| `pools.<name>.backup` | 檢閱逾期時請求的個別人員。 |
| `routes` | 將意圖標籤對應至集區的排序清單。PR 上符合的第一個路由標籤勝出。 |
| `default_pool` | 沒有相符路由時使用的集區，例如純文件的 PR。 |
| `escalation_pool` | 接收呈報並作為最後手段遞補的集區。 |
| `unavailable` | 暫時離開的帳號。它們絕不會被選中。 |
| `skip_authors`, `skip_labels` | 由這些作者建立或帶有這些標籤的 PR 不會進行路由或呈報。 |

目前的路由，依優先順序排列：

| 意圖標籤 | 集區 |
|---|---|
| `workshops` | `workshops` |
| `canvas-extension` | `canvas` |
| `external-plugin`, `plugin` | `plugin` |
| `skills`, `agent`, `instructions`, `workflow`, `hooks` | `content` |
| `website-update` | `core-maintainers` |

意圖標籤由 `.github/workflows/label-pr-intent.yml` 與 `label-pr-intent-writer.yml` 套用。

### 更新集區

1. 編輯 `.github/review-routing.yml`。每個集區至少保留三位檢閱者，並涵蓋各個時區。
2. 使用 `node .github/scripts/review/review-routing.mjs validate` 驗證檔案，然後使用 `node --test .github/scripts/review/review-routing.test.mjs` 執行單元測試。
3. 開啟 PR。該檔案由 core-maintainer 團隊擁有。

若要暫時將檢閱者移出輪替，請將其帳號新增至 `unavailable`，而非將其從每個集區中移除。

## 路由

**Review Routing** 工作流程 (`.github/workflows/review-routing.yml`) 會在下列時機執行：

- PR 的 **Label PR Intent** 完成。路由會使用該次執行的意圖標籤，即使它們尚未套用。
- 有人新增 `needs-reviewer` 標籤。唯讀的 **Review Routing Request** 工作流程會記錄該請求，而 Review Routing 會對其採取動作。
- 透過 `pr_number` 輸入進行分派。諸如 `/request-review` 指令等自動化功能使用此路徑，因為使用 `GITHUB_TOKEN` 新增的標籤不會觸發其他工作流程。
- 每小時排程執行，或在未提供 `pr_number` 的情況下進行分派。此批次排程會評估每個開啟中的非草稿 PR。它會路由尚未路由、具有 `needs-reviewer` 標籤或其集區未被涵蓋的 PR。每個已路由的 PR 都在其專屬的作業中處理。

針對每個符合資格的 PR，路由會執行下列作業：

1. 使用 `routes` 挑選集區，若無則退回至 `default_pool`。對於由 **Label PR Intent** 觸發的執行，該次執行的意圖標籤會取代 PR 目前的意圖標籤，因此過期的標籤無法挑選錯誤的集區。
2. 檢查集區是否已**涵蓋**。當集區的其中一位檢閱者或備用人員，或是核心維護人員已被請求或已檢閱該 PR 時，該集區即視為已涵蓋。若集區未被涵蓋，路由會從集區中請求一位個別人員，排除 PR 作者、已被請求的檢閱者、機器人以及任何列於 `unavailable` 中的人員。針對 `unavailable` 中人員的待處理請求不算涵蓋，但他們已提交的檢閱則計入。它偏好所有開啟中 PR 內**待處理檢閱請求最少**的檢閱者。平手時按 PR 編號輪替。
3. 若集區沒有符合資格的個別人員，路由會嘗試該集區的 `backup` 清單，接著嘗試呈報集區的檢閱者，最後請求集區團隊。
4. 新增 `review-due:YYYY-MM-DD` 標籤。日期為路由當天加上 `first_review_business_days`（以 UTC 計算）。新增標籤的時間標記著 SLA 週期的開始。
5. 若是由 `needs-reviewer` 觸發執行，路由一律會請求新的檢閱者：尚未被請求且尚未檢閱該 PR 的人員。它會移除 `needs-reviewer`、`review-overdue` 與 `review-escalated`，然後移除並重新新增 due 標籤以重新開始 SLA。若無法請求任何新的檢閱者或團隊，路由不會變更任何內容，因此 `needs-reviewer` 與目前的到期日保持不變，每小時的批次排程會再次重試。

每當有新的 commit 變更其意圖標籤時，已路由的 PR 都會再次接受檢查。若新的目標集區未被涵蓋（例如 skills PR 現在也變更了 workflow），路由會從該集區請求檢閱者。現有的到期日保持不變。

除非存在 `needs-reviewer`，否則路由會略過草稿、已關閉的 PR 以及已經有人工檢閱的未路由 PR。草稿 PR 會在標記為可供檢閱時進行路由。

### 失敗與並行處理

- 路由在變更任何標籤之前請求檢閱者。若 GitHub 拒絕該請求（例如團隊不存在或權杖缺少存取權限），路由會保留標籤不動並使作業失敗。沒有任何項目會被標記為已路由，因此下一次執行或排程會再次重試。
- 每個工作流程會先執行一個唯讀的 `plan` 作業來挑選目標 PR。接著它會在作業中使用 `review-routing-pr-<number>` 並行群組來處理每個 PR。Review Routing 與 Review Escalation 共用該群組，因此它們的讀取、規劃與套用步驟絕不會針對同一個 PR 重疊。在單一執行內，每個 PR 的作業會依序執行，且每個作業在挑選人員之前都會重新讀取檢閱者負載。
- 跨個別執行的負載平衡採盡力而為。在同一時刻路由不同 PR 的兩次執行可能會讀取到相同的負載並挑選同一位檢閱者。存放庫層級的鎖定可避免此情況，但 GitHub 會取消在相同並行群組上等待的擱置執行，因此路由請求可能會遺失。下一次路由執行會看到更新後的負載。
- GitHub Actions 矩陣最多可容納 256 個作業。若批次排程發現的 PR 超過該數量，它會處理前 256 個，記錄警告，並將其餘留待下一次排程執行。規劃具有等冪性，因此不會有任何 PR 被永久略過。

## SLA 與呈報

**Review Escalation** 工作流程 (`.github/workflows/review-escalation.yml`) 在工作日的 14:00 UTC 執行，亦可手動分派。它會檢查每個已路由的 PR，亦即帶有 `review-due:` 標籤的每個 PR。

| 條件 | 動作 |
|---|---|
| 在新增 due 標籤之後有人工檢閱送達 | 移除 `review-due:*`、`review-overdue` 與 `review-escalated` |
| 到期日結束前仍無檢閱 | 從該集區的 `backup` 清單請求備用人員，接著從呈報集區請求。若無個別人員可用，它會請求集區團隊，然後請求呈報團隊（除非它們已被請求）。新增 `review-overdue` 並發布評論說明請求了誰（若有的話）。 |
| 路由後經過 `escalation_business_days` 仍無檢閱 | 請求呈報集區團隊與一位核心維護人員；新增 `review-escalated`；發布評論 |

工作天為 UTC 時間的星期一至星期五，扣除 `sla.holidays`。星期一路由的 PR 於星期三到期、星期四逾期，並於星期五呈報（路由後四個工作天）。星期三路由的 PR 於星期五到期、星期一逾期，並於星期二呈報。來自作者或來自機器人（包含 Copilot 程式碼檢閱）的檢閱不計為初次檢閱。只有在目前 due 標籤新增之後提交的檢閱才計入。每個動作在每個 SLA 週期中發生一次，因為標籤會記錄狀態。若檢閱者請求失敗，則會略過標籤與評論，以便下一次執行重試。

該工作流程也會刪除日期已超過過去 14 天且不再存在於任何開啟中 PR 上的 `review-due:*` 標籤。

## 標籤

| 標籤 | 意義 |
|---|---|
| `needs-reviewer` | 要求路由（重新）指派檢閱者。路由在執行後會將其移除。 |
| `review-due:YYYY-MM-DD` | 預期完成初次檢閱的日期。 |
| `review-overdue` | 初次檢閱已逾期，且已請求備用檢閱者。 |
| `review-escalated` | 檢閱已呈報至核心維護人員集區。 |

**Setup Repository Labels** 工作流程會建立 `needs-reviewer`、`review-overdue` 與 `review-escalated`。路由會在首次使用各個 `review-due:` 標籤時建立它。

## 安全模型

- 由拉取請求觸發的工作流程（**Label PR Intent** 與 **Review Routing Request**）以唯讀權限執行，且僅上傳小型 JSON 成品。
- **Review Routing** 從 `workflow_run`、`workflow_dispatch` 或 `schedule` 執行。它僅簽出預設分支，針對觸發的執行驗證成品，且絕不簽出或執行 PR 程式碼。此做法與 `label-pr-intent-writer.yml` 相同。
- 在 Review Routing 與 Review Escalation 中，`plan` 作業皆具備唯讀權限。只有個別 PR 作業可以寫入 issue 與拉取請求。
- 所有檢閱者邏輯皆位於 `.github/scripts/review/review-routing.mjs` 中，並由 `.github/scripts/review/review-routing.test.mjs` 涵蓋測試。

## 啟用路由

路由工作流程發布時帶有 `dry_run: true` 與空的檢閱者清單。若要開啟它們：

1. 建立 `CODEOWNERS` 與 `.github/review-routing.yml` 的 `pools` 中所參考的每個團隊（每個團隊至少三名成員），並授予每個團隊存放庫的存取權限。
2. 將團隊成員新增至 `.github/review-routing.yml` 中相符的 `reviewers` 與 `backup` 清單。
3. 執行 **Setup Repository Labels**。
4. 設定 `dry_run: false`。
5. 一旦團隊與涵蓋範圍就緒，在 `main` 規則集中啟用 **Require review from Code Owners**。
