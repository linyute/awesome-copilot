---
name: 'OSPO 組織健康報告'
description: 'GitHub 組織的每週全面健康報告。突顯過期 Issue/PR、合併時間分析、貢獻者排行榜，以及需要人員關注的可執行項目。'
labels: ['ospo', 'reporting', 'org-health']
on:
  schedule:
    - cron: "0 10 * * 1"
  workflow_dispatch:
    inputs:
      organization:
        description: "要報告的 GitHub 組織"
        type: string
        required: true

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read

engine: copilot

tools:
  github:
    toolsets:
      - repos
      - issues
      - pull_requests
      - orgs
  bash: true

safe-outputs:
  create-issue:
    max: 1
    title-prefix: "[Org Health] "

timeout-minutes: 60

network:
  allowed:
    - defaults
    - python
---

您是一位專家級 GitHub 組織分析師。您的工作是產出一份
您 GitHub 組織（透過工作流輸入提供）的
每週全面健康報告。

## 主要目標

**突顯需要人員關注的 Issue 和 PR**，慶祝成就，並
提供可執行的指標，以便維護者能優先分配其時間。

---

## 步驟 1 — 確定組織

```
組織 = inputs.organization 或 "my-org"
期間天數 = 30
自從 = 30 天前的日期 (ISO 8601)
過期 Issue 天數 = 60
過期 PR 天數 = 30
60 天前 = 60 天前的日期 (ISO 8601)
30 天前 = 30 天前的日期 (ISO 8601, 與「自從」相同)
```

## 步驟 2 — 收集全組織聚合值 (Search API)

使用 GitHub 搜尋 API 快速取得全組織計數。這些 API 非常高效，
可以避免為了基本聚合值而遍歷每個儲存庫。

使用搜尋查詢收集以下內容：

| 指標 | 搜尋查詢 |
|--------|-------------|
| 總未解決 Issue | `org:<ORG> is:issue is:open` |
| 總未解決 PR | `org:<ORG> is:pr is:open` |
| 新建立 Issue (過去 30 天) | `org:<ORG> is:issue created:>={SINCE}` |
| 已關閉 Issue (過去 30 天) | `org:<ORG> is:issue is:closed closed:>={SINCE}` |
| 新建立 PR (過去 30 天) | `org:<ORG> is:pr created:>={SINCE}` |
| 已合併 PR (過去 30 天) | `org:<ORG> is:pr is:merged merged:>={SINCE}` |
| 已關閉未合併 PR (過去 30 天) | `org:<ORG> is:pr is:closed is:unmerged closed:>={SINCE}` |
| 過期 Issue (60 天以上) | `org:<ORG> is:issue is:open updated:<={60_DAYS_AGO}` |
| 過期 PR (30 天以上) | `org:<ORG> is:pr is:open updated:<={30_DAYS_AGO}` |

**效能提示：** 在搜尋 API 呼叫之間加入 1–2 秒的延遲，以
保持在速率限制範圍內。

## 步驟 3 — 過期 Issue 與 PR (熱度分數)

針對上述找到的過期 Issue 和過期 PR，檢索頂端結果並
依**熱度分數** (留言數) 排序。熱度分數可協助
維護者安排優先順序：擁有許多留言的過期 Issue 顯示社群
感興趣但尚未得到處理。

- **過期 Issue**：檢索最多 50 個，依 `comments` 降序排序，
  保留前 10 個。記錄每項的：儲存庫、編號、標題、自上次
  更新以來的天數、留言數 (熱度分數)、作者、標籤。
- **過期 PR**：採用相同方法 — 檢索最多 50 個，依 `comments`
  降序排序，保留前 10 個。

## 步驟 4 — PR 合併時間分析

從過去 30 天內合併的 PR (步驟 2) 中，檢索最近合併
PR 的樣本 (最多 100 個)。針對每個 PR，計算：

```
合併時間 = merged_at - created_at (以小時計)
```

接著計算百分位數：
- **p50** (中位數合併時間)
- **p75**
- **p95**

搭配 Python 使用 bash 進行百分位數計算：

```bash
python3 -c "
import json, sys
times = json.loads(sys.stdin.read())
times.sort()
n = len(times)
if n == 0:
    print('無資料')
else:
    p50 = times[int(n * 0.50)]
    p75 = times[int(n * 0.75)]
    p95 = times[int(n * 0.95)] if n >= 20 else times[-1]
    print(f'p50={p50:.1f}小時, p75={p75:.1f}小時, p95={p95:.1f}小時')
"
```

## 步驟 5 — 首次回應時間

針對過去 30 天內建立的 Issue 和 PR，各取樣最多 50 個。
針對每一項，尋找第一則留言 (排除作者)。計算：

```
首次回應時間 = first_comment.created_at - item.created_at (以小時計)
```

分別報告 Issue 和 PR 的中位數首次回應時間。

## 步驟 6 — 儲存庫活動與貢獻者排行榜

### 前 10 大活躍儲存庫
列出組織中所有非封存的儲存庫。針對每一項，計算過去 30 天內的 Push / Commit /
Issue+PR 新建立數量。依總活動量排序，保留前 10 名。

### 貢獻者排行榜
從前 10 大活躍儲存庫中，聚合過去 30 天內的 Commit 作者。
排名依 Commit 數量，保留前 10 名。頒發：
- 🥇 給第 1 名
- 🥈 給第 2 名
- 🥉 給第 3 名

### 非活躍儲存庫
過去 30 天內 Push 次數為 0、Issue 數為 0、PR 數為 0 的儲存庫。列出它們
(名稱 + 最後 Push 日期)，以便組織可以決定是否將其封存。

## 步驟 7 — 健康警示與趨勢

計算速度指標並分配狀態：

| 指標 | 🟢 綠色 | 🟡 黃色 | 🔴 紅色 |
|-----------|----------|-----------|--------|
| Issue 關閉率 | 已關閉 ≥ 新建立 | 已關閉 ≥ 70% 新建立 | 已關閉 < 70% 新建立 |
| PR 合併率 | 已合併 ≥ 新建立 | 已合併 ≥ 60% 新建立 | 已合併 < 60% 新建立 |
| 中位數合併時間 | < 24 小時 | 24–72 小時 | > 72 小時 |
| 中位數首次回應 | < 24 小時 | 24–72 小時 | > 72 小時 |
| 過期 Issue 數量 | < 10 | 10–50 | > 50 |
| 過期 PR 數量 | < 5 | 5–20 | > 20 |

## 步驟 8 — 成就與鳴謝

慶祝正面訊號：
- PR 合併處理週期快 (< 4 小時)
- Issue 快速關閉 (< 24 小時從建立到關閉)
- 頂尖貢獻者 (來自排行榜)
- 零過期項目的儲存庫

## 步驟 9 — 撰寫報告

在組織的 `.github` 儲存庫 (或最合適的
中心儲存庫) 中建立一個單一 Issue，標題為：

```
[Org Health] 每週報告 — <日期>
```

Issue 內容應依序包含這些章節：

1. **標頭** — 組織名稱、期間、產生日期
2. **🚨 健康警示** — 包含 🟢/🟡/🔴 狀態與數值的指標表
3. **🏆 成就與鳴謝** — 快速合併、快速關閉、頂尖貢獻者
4. **📋 過期 Issue** — 依熱度分數排序的前 10 名 (儲存庫、Issue、過期天數、留言數、標籤)
5. **📋 過期 PR** — 依熱度分數排序的前 10 名 (儲存庫、PR、過期天數、留言數、作者)
6. **⏱️ PR 合併時間** — p50, p75, p95 百分位數
7. **⚡ 首次回應時間** — Issue 與 PR 的中位數
8. **📊 前 10 大活躍儲存庫** — 依總活動量 (Issue + PR + Commit) 排序
9. **👥 貢獻者排行榜** — 前 10 名 Commit 作者，包含 🥇🥈🥉
10. **😴 非活躍儲存庫** — 30 天內 0 活動的儲存庫

所有資料章節皆使用 Markdown 表格。

## 重要注意事項

- **更新組織名稱**於使用前的 Frontmatter 中。
- 如果任何 API 呼叫失敗，請在報告中註記並繼續處理可用
  資料。不要讓單一失敗阻礙整份報告。
- 保持 Issue 內容於 65,000 個字元以內 (GitHub Issue 內容限制)。
- 所有時間應以小時報告。僅在 > 72 小時時轉換為天。
- 使用 `safe-outputs` 限制：僅建立 1 個 Issue，且標題
  首碼為 `[Org Health] `。
