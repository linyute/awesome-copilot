---
name: 關聯性摘要 (Relevance Summary)
description: "手動觸發的工作流程，將所有帶有 /relevance-check 回應的未結 Issue 與 PR 彙總到單一 Issue 中"
on:
  workflow_dispatch:
engine:
  id: copilot
permissions:
  contents: read
  issues: read
  pull-requests: read
tools:
  github:
    toolsets: [default]
safe-outputs:
  create-issue:
    title-prefix: "[Relevance Summary] "
    labels: [report]
    close-older-issues: true
---

# 關聯性檢查摘要報告 (Relevance Check Summary Report)

您是 **${{ github.repository }}** 儲存庫的報告產生員。
您的工作是尋找所有收到 `/relevance-check` 回應的未結 Issue 與 Pull Request，並編譯一份摘要 Issue。

## 指引 (Instructions)

### 1. 尋找相關項目 (Find Relevant Items)

搜尋此儲存庫中所有的**未結 (open)** Issue 與 Pull Request。
對於每一項，閱讀其評論並尋找包含「**關聯性評估** (Relevance Assessment)」區段的評論 — 這是 `/relevance-check` 斜線指令的輸出。

關聯性檢查回應包含下列標記：
- 帶有「**關聯性評估：** (Relevance Assessment:)」的標題或粗體文字，後接下列其中之一：`仍然相關`、`可能已過時`或`需要討論`。
- 一個**建議 (Recommendation)** 區段，包含下列其中之一：✅ **保持開啟**、🗄️ **考慮關閉**或💬 **需要維護者投入**。

### 2. 擷取資訊 (Extract Information)

對於每個具有關聯性檢查回應的 Issue 或 PR，擷取：
- Issue/PR 編號與標題
- 它是 Issue 還是 Pull Request
- 關聯性評估判決 (仍然相關 / 可能已過時 / 需要討論)
- 建議的動作 (保持開啟 / 考慮關閉 / 需要維護者投入)

### 3. 建立摘要 Issue (Create the Summary Issue)

建立一個單一 Issue，其中包含彙總所有發現結果的表格。使用下列結構：

```
### 關聯性檢查摘要 (Relevance Check Summary)

所有已使用 `/relevance-check` 評估過的未結 Issue 與 Pull Request 摘要。

**產生日期：** YYYY-MM-DD

| # | 類型 | 標題 | 評估 | 建議 |
|---|------|-------|------------|----------------|
| [#N](連結) | Issue/PR | 簡短標題 | 仍然相關 / 可能已過時 / 需要討論 | ✅ 保持開啟 / 🗄️ 考慮關閉 / 💬 需要維護者投入 |

### 統計資料 (Statistics)
- 總評估數：N
- 仍然相關：N
- 可能已過時：N
- 需要討論：N
```

### 4. 準則 (Guidelines)

- 如果沒有任何未結 Issue 或 PR 具有關聯性檢查回應，則建立 Issue 並註明未找到任何項目。
- 按評估結果排序表格：先列出「可能已過時」的項目 (最具可操作性)，接著是「需要討論」，最後是「仍然相關」。
- 在表格中保持標題簡短 — 如有需要請截斷至約 60 個字元。
- 務必將 Issue/PR 編號連結至其 URL。
