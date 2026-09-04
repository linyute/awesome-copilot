---
name: 'repo-standardizer'
description: '潤飾任何 GitHub 儲存庫的表面外觀 — 標籤（表情符號評級層級、P0–P3 優先級、影響嚴重程度）、Issue 表單、PR 範本、CI 工作流程、CODEOWNERS、規則集（rulesets）、文件。僅限儲存庫 Metadata 與設定 — 不更動程式碼邏輯。適用於建立新儲存庫或潤飾既有儲存庫。'
---

# GitHub 儲存庫標準化工具（GitHub Repo Standardizer）

偵測儲存庫的目前狀態，接著潤飾其表面外觀：Issue 表單、
PR 範本、標籤分類體系、CI、CODEOWNERS、規則集（rulesets）、文件。僅處理
儲存庫 Metadata 與設定檔 — 絕不更動程式碼邏輯。
**具等冪性（Idempotent）** — 可安全重複執行；補足缺失並調和差異，
不重複建立或覆寫既有內容。

## 使用時機

- 使用者表示「standardize / tidy up / professionalize this repo（標準化 / 整理 / 專業化此儲存庫）」
- 剛建立一個新的儲存庫，從第一天就需要範本、標籤、CI 與規則
- 儲存庫看起來空蕩蕩：沒有範本、沒有標籤、沒有 CI、沒有分支保護

## 行前檢查（Preflight，強制執行，依序進行）

> **需求**：`gh` CLI（已驗證身份）、`git`、`jq`、`python3` — 開始前
> 請確認它們存在（`which gh git jq python3`）。

### 1. 驗證身份 — 先檢查 gh 登入狀態

```bash
gh auth status 2>/dev/null || echo "NOT_LOGGED_IN"
```

- **已登入** → 繼續；印出 `gh api user -q .login`，讓使用者知道將使用哪個帳號操作。
- **未登入** → 停止。明確告知使用者（切勿猜測）：
  1. 執行 `gh auth login`（網頁/裝置流程），**或**
  2. 匯出權杖：`export GH_TOKEN=ghp_xxx` — 需要 `repo`、`workflow`（用於 CI 檔案），以及針對組織儲存庫的 `admin:org`（或 `admin:repo_hook` / 組織成員資格管理員）權限範圍（scopes）。
  - 絕不要將權杖貼入對話、記錄或檔案中。若使用者在對話中貼上權杖，建議他們立即撤銷並重新發行。
  - 若在此環境（無介面 headless 環境）中無法執行 `gh auth login`，建議使用 `gh auth login --with-token` 從使用者建立的檔案中讀取。

確認操作帳號對目標儲存庫具有寫入權限：

```bash
# 個人儲存庫：除了權杖權限範圍外無需額外檢查
# 組織儲存庫：必須是該組織的成員/管理員
gh api "orgs/ORG/memberships/$(gh api user -q .login)" -q .role 2>/dev/null || echo "NO_ORG_ACCESS"
```

- `admin`/`member` → OK。`404` → 停止並請使用者先將該帳號加入該組織。

### 2. 偵測儲存庫類型

```bash
gh repo view OWNER/REPO --json name,owner,visibility,defaultBranchRef,isArchived,isFork \
  -q '{name:.name, ownerType:.owner.type, visibility:.visibility, defaultBranch:.defaultBranchRef.name, archived:.isArchived, fork:.isFork}'
```

| 欄位 | 意義 | 後續影響 |
|---|---|---|
| `ownerType` | `User` = 個人，`Organization` = 組織 | 組織儲存庫也可使用組織層級規則集；兩者皆支援儲存庫層級規則集 |
| `visibility` | `PUBLIC` / `PRIVATE` / `INTERNAL` | 私有（Private）：跳過對外公開文件的要求，維持 CI 機密最簡化；公開（Public）：README 徽章 + CONTRIBUTING/SECURITY 至關重要 |
| `archived` / `fork` | 唯讀 / 分叉（fork） | **跳過寫入模組**；回報原因 |

若使用者未明確指定該儲存庫，在更動組織或私有
儲存庫之前請先確認。

### 3. 稽核目前狀態

```bash
gh label list --repo OWNER/REPO --limit 200
gh api repos/OWNER/REPO/contents/.github -q '.[].path' 2>/dev/null || echo "no .github dir"
gh api repos/OWNER/REPO/contents/.github/workflows -q '.[].name' 2>/dev/null || echo "no workflows"
gh api repos/OWNER/REPO/rulesets -q '.[] | {name:.name, enforcement:.enforcement}' 2>/dev/null || echo "no rulesets"
gh api repos/OWNER/REPO/branches -q '.[].name' 2>/dev/null
for f in README.md CONTRIBUTING.md SECURITY.md LICENSE .gitignore; do
  gh api "repos/OWNER/REPO/contents/$f" -q .name 2>/dev/null || echo "missing: $f"
done
```

### 4. 偵測測試架構（用於 CI 模組）

檢查以下指標信號（以第一個符合的為準）：

```bash
gh api repos/OWNER/REPO/contents/package.json -q .name 2>/dev/null   # node → templates/ci-node.yml
gh api repos/OWNER/REPO/contents/pyproject.toml -q .name 2>/dev/null # python → templates/ci-python.yml
gh api repos/OWNER/REPO/contents/go.mod -q .name 2>/dev/null         # go → templates/ci-go.yml
gh api repos/OWNER/REPO/contents/Cargo.toml -q .name 2>/dev/null     # rust → templates/ci-rust.yml
```

未偵測到信號 → 提出通用 CI 方案（或詢問使用者是否需要 CI）。

### 5. 詢問語言（規劃前）

- 詢問使用者 `CONTRIBUTING.md` 與 PR 範本應使用
  哪種語言撰寫（預設：英文，或本地專案的主要語言）。在產生時
  相應地翻譯範本 — 絕不擅自假設語言。
- （README 語言將於模組 F 中另外詢問。）

### 6. 詢問自動化機制（決定治理標籤）

詢問使用者該儲存庫是否有任何**自動化機器人或 AI 寫手**
正在執行 — 例如 dependabot、Stale bot、ClawSweeper，或自動提交
PR / 自動修復 Issue 的 AI 寫程式代理程式（coding agent）。

- **為何要問**：`r:*` / `clawsweeper:*` / `triage:*` / `close:*` 標籤是
  **信號標籤，而非分類** — 機器人會讀取它們並採取行動（自動關閉、
  自動鎖定、自動修復、自動合併）。若沒有正在執行的自動化，這些標籤
  就是累贅，因此該答案將決定是否加入治理（Governance）維度
  （模組 A，步驟 2）。
- **是** → 規劃 `Governance / auto-close rules` 維度（僅新增符合專案
  實際退回標準的 `r:*` 規則）。
- **否** → 完全跳過該維度 — 絕不要向沒有自動化的儲存庫新增 `r:*` /
  機器人標籤。

## 工作流程

1. **行前檢查（Preflight）**（如上所述）。若驗證或存取失敗，立即停止並給予明確訊息。
2. **模擬規劃（Dry-run plan）** — 向使用者展示將建立/更新/跳過項目的簡要表格。以下操作必須取得確認：規則集、分支刪除/保護變更、組織層級變更，以及任何具破壞性的更動。
3. **套用模組**（各模組具等冪性；依此順序執行）。
4. **驗證** — 重新查詢並印出 `applied / skipped / failed`（已套用 / 已跳過 / 失敗）檢查清單。

### 模組 A — 標籤（先設計，後執行等冪性 upsert）

**步驟 1 — 分析專案樣貌**（調整分類體系，切勿盲目複製）：

- **評級標籤（Rating labels）** → 為「本」專案設計專屬主題層級系統
  （切勿逐字照抄既有儲存庫的設定）：
  - 參考範例 — OpenClaw 官方儲存庫使用主題層級，
    搭配表情符號圖示與低→高漸層色彩（**僅供範例參考，請勿照抄**）：
    `rating: 🧂 unranked krab` → `rating: 🦪 silver shellfish` →
    `rating: 🦐 gold shrimp` → `rating: 🦀 challenger crab` →
    `rating: 🐚 platinum hermit` → `rating: 🦞 diamond lobster`
  - 國際化專案 → 通用等級亦可適用
    （`grade: S/A/B/C/D` 或 `★`–`★★★★★`）
  - 始終重新設計：挑選符合專案風格（動物、寶石、
    階級、星星…）與目標受眾語言的主題。請勿直接沿用任何既有
    儲存庫的評級標籤。
- **團隊**：若儲存庫有明確分工
  （CODEOWNERS、CONTRIBUTING、文件中的團隊清單） → 為每個群組
  新增一個 `team: *` 標籤（例如 `team: frontend`、`team: algorithm`）。若無團隊清單 → 跳過。
- **專案類型**（函式庫 / 應用程式 / 課程作業 / 組織基礎設施） → 決定需要以下哪些維度
  （`dependencies`、`security`、`docs` 等）。
- **語言**：以行前檢查步驟 5 所選的語言撰寫每個標籤名稱與說明
  （預設為英文；本地專案 → 其主要語言）。
  絕不擅自假設 — 將每個標籤名稱與說明翻譯為
  所選語言（表情符號圖示保持原樣）。
  - **例外 — 機器人標籤**：`r:*` / `clawsweeper:*` / `triage:*` /
    `close:*` 名稱是由自動化程式碼逐字比對的（幾乎全為英文）。
    保持這些**名稱**為機器人所用的語言 — 翻譯名稱會導致
    機器人失效。僅有其 `description`（說明）可使用使用者的語言。

**步驟 2 — 組合分類項目。** 基礎設定位於 `templates/labels.json`
（純文字名稱，無表情符號）；根據步驟 1 的分析樣貌進行擴充或刪減。

**表情符號政策 — 評級層級是「唯一」強制使用表情符號的標籤。** 每個
`rating:*` / `issue-rating:*` 層級「必須」帶有具備清楚低→高
漸層的表情符號（例如 `rating: 🦞 diamond lobster`）。其他所有標籤：表情符號由
代理程式自行斟酌 — 在有助於快速掃讀之處新增圖示，在造成雜亂之處予以省略。
**一致性規則：在同一維度內，要就「全部」標籤帶有表情符號，要就「完全不帶」** — 絕不允許
混合半表情符號的維度（例如不要在純文字 `enhancement` 旁出現 `🐛 bug`）。

**除 Type 外，每個維度皆為自由選擇（opt-in）。** 僅在儲存庫
確實需要該維度時才新增；否則予以跳過。下列選單比照 OpenClaw
官方標籤分類體系（最豐富的公開參考資料） — 涵蓋所有適用的維度，
但絕不強加儲存庫未使用的維度。

**優先級使用 `P0`–`P3`**（OpenClaw 慣例 — `P0` = 緊急）。
下表範例展示了選用的表情符號樣式 — 每個維度請全數套用或全不套用
（基準設定採用純文字 `P0`–`P3`）：

| 標籤 | 意義 | 顏色 |
|---|---|---|
| `🔴 P0` | 緊急（Emergency）：資料遺失、安全性漏洞繞過、崩潰迴圈、核心無法使用 | `b60205` |
| `🟠 P1` | 高（High）：阻礙既定工作，需儘速處理 | `d93f0b` |
| `🟡 P2` | 中（Medium）：一般優先級 | `fbca04` |
| `🟢 P3` | 低（Low）：有則更好（nice to have） | `1a7f37` |

**維度選單**（以使用者選擇的語言撰寫每個標籤）：

| 維度 | 標籤（範例） | 新增時機 |
|---|---|---|
| Type（類型，必備） | `🐛 bug` `✨ enhancement` `📚 documentation` `❓ question` `🙋 help wanted` `🌱 good first issue` | 必定新增 |
| Priority（優先級） | `🔴 P0` `🟠 P1` `🟡 P2` `🟢 P3` | 建議新增 |
| Status（狀態） | `🚧 in progress` `🧱 blocked` `✅ ready to merge` `🎉 merged` `🚫 wontfix` | 建議新增 |
| Impact（影響度） | `impact: security` `impact: data-loss` `impact: availability` … | 建議新增；對安全性敏感的儲存庫為必備 |
| Rating（PR 品質評級） | `rating: 🦞 diamond lobster` … 主題層級 | 存在 PR 品質把關機制時 |
| Issue rating（Issue 評級） | `issue-rating: 🦞 diamond lobster` … | 存在 Issue 品質把關機制時（可併入 Rating） |
| Merge risk（合併風險） | `merge-risk: 🚨 security-boundary` `merge-risk: 🚨 availability` … | 存在維護者審查流程時 |
| Size（規模大小） | `size: XS` `size: S` `size: M` `size: L` `size: XL` | 大型儲存庫 / 團隊估算需求 |
| Area / module（領域 / 模組） | `area: core` `area: api` `area: cli` … | 多模組專案 |
| Bug detail（Bug 細節） | `bug: behavior` `bug: crash` | 易崩潰 / 擁有大量 Bug 報告 |
| Governance / auto-close rules（治理 / 自動關閉規則） | `r: spam` `r: support` `r: no-ci-pr` … `clawsweeper:*` `triage:*` | 自動化機器人強制執行關閉/鎖定/審查規則 |
| Close reason（關閉原因） | `close: duplicate` `close: superseded` `close: invalid` … | 存在關閉自動化機器人時 |
| Triage（分類檢視） | `triage: bug` `triage: blocked` `triage: needs-review` … | 存在分類檢視工作流程時 |
| Proof（佐證） | `proof: 🎥 video` `proof: 📸 screenshot` | 需要重現證據時 |
| Dependencies（依賴套件） | `📦 dependencies` | dependabot / 依賴套件 PR |
| Security（安全性） | `🔒 security` | 安全性敏感的儲存庫 |
| Regression（效能退步/回歸） | `↩️ regression` | 穩定專案（原本正常但現在失效） |
| Stale（閒置逾期） | `🕰️ stale` `🚫 no-stale` | 存在閒置自動化機制時 |
| Team（團隊） | `team: <group>` | 明確分工 |
| Duplicate / invalid（重複 / 無效） | `👯 duplicate` `🚫 invalid` | 擁有大量 Issue 的活躍公開儲存庫 |
| Channel（管道） | `channel: discord` `channel: telegram` … | 多管道產品（OpenClaw 風格） |
| App / platform（應用程式 / 平台） | `app: ios` `app: android` `app: web-ui` … | 多平台應用程式 |
| Extensions / plugins（擴充套件 / 外掛程式） | `extensions: <name>` `plugin: <name>` | 外掛程式/擴充套件生態系統 |

**治理規則（`r:` / 機器人標籤） — 依行前檢查步驟 6 進行把關。** 僅在
使用者對自動化機器人 / AI 寫手回答「是」時，才考慮此維度；
否則完全跳過。自動關閉與機器人狀態標籤是
**信號標籤，而非分類** — 機器人（或 Actions 工作流程）會讀取它們並
採取行動（自動關閉、自動鎖定、自動修復、自動合併）。缺少對應的自動化機制時
它們毫無用處，因此**除非儲存庫上確實執行了治理機器人，否則請跳過它們**。
若確實有執行，僅新增符合專案實際離題 / 退回標準的 `r:*` 規則
（例如 `r: spam`、`r: support`、`r: no-ci-pr`）加上機器人自有的
狀態標籤（`clawsweeper:*`、`triage:*`、`close:*`）。切勿逐字照抄
OpenClaw 的標籤組合 — 其規則編碼了 OpenClaw 特定的產品邊界。

**Impact（影響度）維度** — 安全性「爆炸半徑（blast radius）」判定
（從 OpenClaw 通用化而來；依儲存庫實際的失敗模式進行裁剪）：

| 標籤 | 意義 |
|---|---|
| `impact: security` | 安全性邊界、憑證、授權、沙箱、敏感資料 |
| `impact: data-loss` | 遺失/損壞/遺棄使用者、工作階段或設定資料 |
| `impact: availability` | 崩潰、無回應（hang）、重啟迴圈或程序中斷服務 |
| `impact: auth-provider` | 身分驗證 / 路由 / 模型選擇 / 機密解析失效 |
| `impact: session-state` | 工作階段 / 記憶體 / 狀態偏離或損壞（具狀態的系統） |
| `impact: message-loss` | 訊息/事件遺失、重複或路由錯誤（傳訊系統） |
| `impact: ux-blocker` | 使用者受阻且無終端機/記錄/支援可用（GUI 產品） |
| `impact: ux-friction` | 流程令人困惑 / 增加支援負擔（GUI 產品） |
| `impact: other` | 自訂分類體系之外的重要影響 |

**步驟 3 — 色彩規則（強制性）：**

- **多樣化調色盤**：色彩必須豐富且多樣化 — 整個標籤集
  看起來應像一個調色盤，而非單色區塊。即使在同一
  分類中，也應分散色調（例如優先級標籤：紅 / 橘 / 黃 /
  綠，或四種截然不同的色調）。
- **語意提示（非硬性對應）**：`ready to merge` / `merged` / 完成
  → 綠色系（絕不要用灰色或紅色）；`wontfix` → 灰色；`in progress` → 藍色。
  其他所有標籤：挑選搭配美觀且與標籤意義大體相符的色彩 —
  但相較於嚴格的一意一色，應更著重多樣性。
- **表情符號政策**：評級層級**強制使用**表情符號 — 每個
  `rating:*` / `issue-rating:*` 標籤都需要具備清楚的低→高表情符號漸層
  （例如 `rating: 🦞 diamond lobster`）。其他所有地方，表情符號由代理程式
  自行決定：在有助於掃讀之處使用圖示，在造成雜亂之處予以省略。
  **一致性：在同一維度內，所有標籤要就全帶表情符號，要就全不帶** —
  絕不要出現混合半表情符號的維度。若有使用，表情符號必須符合
  標籤意義，絕不可僅作裝飾用途。
- **評級標籤需要說明文件**：新增評級標籤時，亦需新增
  `LABELS.md`（步驟 4）以描述各標籤意義與明確的
  低→高排序，確保評級毫無歧義。
- 相鄰標籤必須易於辨識區分。禁止：全部單一色彩、
  相鄰重複色彩，或與標籤內容矛盾的色彩。

**步驟 4 — 評級標籤說明文件（僅在存在評級標籤時執行）。** 從
`templates/LABELS.md` 產生 `LABELS.md`（或擴充既有文件檔案）：
列出每個評級標籤及其意義與明確的低→高順序，
以及其餘分類體系。與標籤一同進行 Commit 與 Push。

**步驟 5 — 等冪性更新與新增（Idempotent upsert）。** GitHub **沒有**
`PUT /labels/{name}` 端點。Upsert = 檢查是否存在（`GET /labels/{name}`），
接著使用 `POST /labels`（建立）或 `PATCH /labels/{name}`（更新）。適用於
Map 格式與陣列格式的 `labels.json`：

```bash
R="repos/OWNER/REPO"
jq -c 'if type == "array" then .[] else to_entries[] | {name: .key} + .value end' templates/labels.json | while read -r l; do
  name=$(echo "$l" | jq -r .name); color=$(echo "$l" | jq -r .color); desc=$(echo "$l" | jq -r .description)
  enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$name")
  if gh api "$R/labels/$enc" >/dev/null 2>&1; then
    gh api -X PATCH "$R/labels/$enc" -f name="$name" -f color="$color" -f description="$desc" --silent && echo "label updated: $name"
  else
    gh api -X POST "$R/labels" -f name="$name" -f color="$color" -f description="$desc" --silent && echo "label created: $name"
  fi
done
```

- 將標籤名稱進行 URL 編碼（處理空格、斜線）。
- 若要調和差異（已手動刪除的標籤），在移除已在使用中的標籤前，請展示 Diff 並先詢問確認。

### 模組 B — Issue 表單 + 設定

建立帶有 `config.yml` 的 `.github/ISSUE_TEMPLATE/`，加上每個
範本對應的一個 YAML 表單（bug / feature / question）。透過 Commit 進行 Push：

- **取代佔位符**：替換 `config.yml` 中的佔位符（Discussions / Security 聯絡
  URL 中的 `OWNER/REPO`） — 請參閱範本佔位符。
- 以使用者選擇的語言撰寫表單（行前檢查步驟 5）：翻譯
  表單名稱、標籤、說明與佔位符文字；`title:` 前綴
  與 `labels:` 值保持原樣（它們必須與標籤分類體系相符）。

```bash
mkdir -p .github/ISSUE_TEMPLATE
cp templates/issue-form-*.yml templates/config.yml .github/ISSUE_TEMPLATE/
git add .github/ISSUE_TEMPLATE && git commit -m "chore: add issue forms" && git push
```

- 若範本已存在，進行 Diff 比對；僅覆寫完全相同或明顯過時的
  檔案（若使用者可能自訂過，請先詢問）。
- 若尚未複製（clone）Git 儲存庫，請先複製（`gh repo clone OWNER/REPO`），編輯後再 Push。

### 模組 C — PR 範本

```bash
mkdir -p .github
cp templates/PR_TEMPLATE.md .github/PULL_REQUEST_TEMPLATE.md
git add .github/PULL_REQUEST_TEMPLATE.md && git commit -m "chore: add PR template" && git push
```

- 以使用者選擇的語言撰寫範本（行前檢查步驟 5）。
  PR 範本中沒有需要取代的佔位符。

### 模組 D — CI 工作流程

根據架構偵測結果挑選對應的工作流程（templates/ci-*.yml —
它們由 `$default-branch` 觸發，因此適用於任何預設分支
名稱）。寫入至 `.github/workflows/ci.yml`，Commit 並 Push。保留既有
工作流程；僅在不存在任何工作流程時才新增 `ci.yml`。

- Node 專案：`ci-node.yml` 能感知鎖定檔案（lockfile）來安裝依賴套件
  （`npm ci` / `pnpm install --frozen-lockfile` / `yarn install
  --frozen-lockfile`，並以純 `npm install` 作為遞補備援） — 針對 pnpm / yarn 儲存庫
  無需手動調整。

- 注意：推送工作流程檔案需要具備 `workflow` 權限範圍的權杖；若
  推送被以 403 拒絕，請告知使用者其權杖缺少 `workflow` 權限。

### 模組 E — 分支規則

相較於舊版分支保護，優先建議使用**規則集（rulesets）**（現代機制）：

```bash
# 列出既有規則集
gh api repos/OWNER/REPO/rulesets -q '.[].name'
# 建立（範例：保護預設分支）
gh api -X POST repos/OWNER/REPO/rulesets --input - <<'EOF'
{
  "name": "protect-default-branch",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {"include": ["refs/heads/DEFAULT_BRANCH"], "exclude": []}
  },
  "rules": [
    {"type": "pull_request", "parameters": {"required_approving_review_count": 1, "dismiss_stale_reviews_on_push": true, "require_code_owner_review": false, "require_last_push_approval": true, "required_review_thread_resolution": true}},
    {"type": "required_linear_history"},
    {"type": "deletion"},
    {"type": "non_fast_forward"},
    {"type": "required_signatures"}
  ]
}
EOF
```

- 等冪性：若已存在同名規則集，使用
  `PUT repos/OWNER/REPO/rulesets/{id}` 予以更新 — **完整替換**，請包含完整
  內容主體（name、enforcement、conditions、rules、bypass_actors）。規則集
  不支援 PATCH（PATCH 會回傳 404）。
- 選用的管理員略過設定：新增 `"bypass_actors": [{"actor_id": 5,
  "actor_type": "RepositoryRole", "bypass_mode": "always"}]`（id 5 = admin），
  讓維護者可直接推送到受保護的分支；非管理員仍需
  透過 Pull Request 進行。
- 在目前 API 版本中，`pull_request` 參數為**全部必填**：
  `required_approving_review_count`、`dismiss_stale_reviews_on_push`、
  `require_code_owner_review`、`require_last_push_approval`、
  `required_review_thread_resolution`。若遺漏任何一項 → HTTP 422。
- `target: "branch"` + `ref_name.include: refs/heads/<default>`；若標籤
  重要，亦可提供 `"tag"` 規則。
- 組織儲存庫：可選擇提供組織層級規則集（`/orgs/{org}/rulesets`）。

### 模組 F — 文件

README（請「先」詢問語言）：

- 詢問使用者：README 應支援哪些語言？（針對國際化專案，
  建議支援專案主要語言 + 英文）
- 若 README 已存在，詢問是否要改編為更多語言版本 —
  絕不要未經詢問就新增語言。
- 語言切換列慣例（參考自 `programmingHLS/ccmm` 模式）：
  - 預設檔案維持 `README.md`（通常為英文）。
  - 額外語言：`README.<lang>.md`（例如 `README.zh.md`、`README.ja.md`）。
  - 每個檔案頂端放置切換列 — 目前語言顯示為純文字，
    其他語言顯示為相對路徑連結：
    - `README.md`：       `< English | 简体中文 >`  （简体中文連結至 `README.zh.md`）
    - `README.zh.md`：    `< English | 简体中文 >`  （English 連結至 `README.md`）
  - 在各語言檔案間保持結構、徽章與錨點的一致與對應。
- `README.md`：若缺少或內容空泛，從 `templates/README.md` 產生一份
  （徽章、安裝、使用方式、模組表格）。若使用者的既有內容已經
  相當充實，請予以保留 — 僅附加徽章區塊。請依照範本佔位符說明
  **取代佔位符**（徽章 URL、複製 URL、擁有者致謝）。
- `CONTRIBUTING.md`、`SECURITY.md`、`CODE_OF_CONDUCT.md`：若缺少則從
  範本複製（以行前檢查步驟 5 所選語言撰寫 `CONTRIBUTING.md`；
  依照範本佔位符說明**取代 `SECURITY.md` 安全通報連結中的 `OWNER/REPO`**）。
- `VISION.md`：選用的方向指引文件（仿照 OpenClaw 的 VISION.md） —
  若使用者需要，可從 `templates/VISION.md` 產生簡要的願景文件
  （緣起、指導原則、目前狀態、發展方向、貢獻規則；請依範本佔位符說明**取代 `PROJECT_NAME`**）。
- `THIRD_PARTY_NOTICES.md`：當專案改編第三方內容時新增
  （授權條款、字型、行為準則） — 列出各項來源及其授權。
- `docs/ARCHITECTURE.md`：針對非簡易專案，根據稽核結果
  產生簡短的架構文件（結構、流程、限制條件）。
- `LICENSE`：建立前先詢問使用者要使用哪種授權條款（預設為 MIT）。
- `CHANGELOG.md`：若缺少，從 `templates/CHANGELOG.md` 建立（採用
  Keep a Changelog 格式）；記錄各版本的顯著變更（依範本佔位符說明
  **取代佔位符日期行中的 `YYYY-MM-DD`**）。

### 模組 G — AI 助理指引（CLAUDE.md / AGENTS.md）

- 缺少時新增 `CLAUDE.md`（給 Claude Code 的指引）與 `AGENTS.md`（給
  任何 AI 寫程式代理程式的指引） — 請參閱 `templates/CLAUDE.md` 與
  `templates/AGENTS.md`（依範本佔位符說明**取代 `OWNER/REPO`** 與 i18n 佔位符）。
- 若已存在，進行比對並補足缺失，而非直接覆寫。
- 一般內容取自儲存庫稽核結果（模組 A–F）：
  - 專案：一句話摘要、狀態、技術堆疊。
  - 指令：建構 / 測試 / linter / 執行（取自 CI 偵測 + 套件指令稿）。
  - 慣例：Commit 風格（參見 CONTRIBUTING）、標籤分類體系、i18n
    需求、機密政策（絕不寫死金鑰）、檔案結構圖。
  - 注意事項：已知風險、需謹慎處理的區域。
- CLAUDE.md 與 AGENTS.md 的差異：CLAUDE.md 為 Claude 專屬；AGENTS.md 則
  適用於各類代理程式（Cursor/Copilot/OpenClaw 皆可使用）。保持 AGENTS.md 中
  不含 Claude 專屬的參照。

## 驗證

```bash
gh label list --repo OWNER/REPO --limit 200 | wc -l
gh api repos/OWNER/REPO/contents/.github/ISSUE_TEMPLATE -q '.[].name' 2>/dev/null
gh api repos/OWNER/REPO/contents/.github/PULL_REQUEST_TEMPLATE.md -q .name 2>/dev/null
gh api repos/OWNER/REPO/contents/.github/workflows/ci.yml -q .name 2>/dev/null
gh api repos/OWNER/REPO/rulesets -q '.[] | {name:.name, enforcement:.enforcement}'
```

回報最終總結表格：`module | status (applied/skipped/failed) | note`。

## 範本佔位符（複製時取代）

範本維持通用格式 — `OWNER/REPO`、`OWNER_USERNAME`、`PROJECT_NAME`、
`YYYY-MM-DD` 是代理程式在將範本複製到目標儲存庫時應填入的
佔位符。**未取代的佔位符會導致破損的連結**（徽章、
複製 URL、Discussions、安全性通報、CODEOWNERS 帳號名稱）被推送至
使用者的儲存庫中。

| 佔位符 | 取代為 |
|---|---|
| `OWNER` | 目標儲存庫擁有者登入名稱（個人或組織） |
| `REPO` | 目標儲存庫名稱 |
| `OWNER_USERNAME` | 擁有者的預設審查者 / 團隊帳號名稱 |
| `PROJECT_NAME` | 專案顯示名稱 |
| `YYYY-MM-DD` | 目前日期 |

預先解析這些值一次，接著在每個複製的檔案中進行替換
（`config.yml`、`README*.md`、`SECURITY.md`、`CODEOWNERS`、`AGENTS.md` /
`CLAUDE.md`、`VISION.md` 等）：

```bash
O=OWNER R=REPO N=PROJECT_NAME D=$(date +%F)
sed -i "s|OWNER_USERNAME|$O|g; s|OWNER/REPO|$O/$R|g; s|PROJECT_NAME|$N|g; s|YYYY-MM-DD|$D|g" \
  .github/ISSUE_TEMPLATE/config.yml README.md SECURITY.md .github/CODEOWNERS AGENTS.md
```

- 在取代 `OWNER/REPO` 之前先取代 `OWNER_USERNAME` — 後者包含
  `OWNER` 前綴，因此使用單純 `sed` 時順序非常重要。
- 僅有 `config.yml`、`README*.md`、`SECURITY.md`、`CODEOWNERS`、`AGENTS.md` /
  `CLAUDE.md`、`VISION.md`、`CHANGELOG.md` 包含佔位符；Issue
  表單、PR 範本、CI 工作流程與行為準則（CoC）皆無佔位符。
- CI 範本無需進行替換，但若使用者選擇了非英文語言，
  請**翻譯**其對人顯示的文字。

## 經驗法則

- **具等冪性（Idempotent）**：每個模組執行兩次皆能產生相同結果。
- **絕不覆寫使用者內容**：先進行 Diff 比對，覆寫自訂檔案前務必先詢問。
- **身分驗證優先**：無權杖則不執行 — 告知使用者如何登入，切勿猜測。
- **執行具破壞性操作前先進行模擬測試（Dry-run）**：規則集、分支規則、標籤刪除、公開性變更。
- **確認範圍**：組織/私有儲存庫以及任何使用者未明確指名的項目。

## 範本

所有範本皆位於 `templates/`：
`labels.json`、`LABELS.md`、`config.yml`、`issue-form-bug.yml`、
`issue-form-feature.yml`、`issue-form-question.yml`、`PR_TEMPLATE.md`、
`ci-node.yml`、`ci-python.yml`、`ci-go.yml`、`ci-rust.yml`、`CODEOWNERS`、
`CONTRIBUTING.md`、`SECURITY.md`、`CODE_OF_CONDUCT.md`、`CLAUDE.md`、
`AGENTS.md`、`VISION.md`、`CHANGELOG.md`、`templates/README.md`、
`templates/README.zh.md`。
