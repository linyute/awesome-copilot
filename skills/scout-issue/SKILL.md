---
name: scout-issue
description: "當開發人員想在儲存庫中尋找最適合貢獻的 GitHub issues 時使用。可使用 /scout-issue 呼叫，或要求尋找 good first issues、適合新手的 issues 或開源貢獻工作。會詢問經驗程度、技術技能、可用時間與貢獻類型，接著搜尋 GitHub issues、進行評分，並呈現附帶匹配分析的排名建議。"
---

# Issue Scout - /scout-issue 指令

當使用者呼叫 `/scout-issue` 或請求協助尋找可貢獻的 issues 時，執行此四階段管線。此技能預設為唯讀：僅檢視 issues 與程式碼，除非使用者明確要求，否則絕不修改 issues。

## 隨附資源

- `references/interview.md` — 需求訪談問題、優先順序排列與內部規格格式
- `references/scoring-rubric.md` — 評分維度、自適應權重與信心水準
- `references/workflow.md` — 端到端工作流程、決策點與邊界情況
- `references/tool-patterns.md` — GitHub CLI、REST 與 git 指令模式
- `references/investigation-templates.md` — 深度調查與實作計畫輸出範本
- `references/recovery.md` — 取消、缺少工具、速率限制與備援方案
- `references/quick-reference.md` — 精簡指令與輸出參考
- `examples/` — 完整範例情境，包含針對真實 issues 執行的 `copilot-run.md`
- `scripts/validate-skill.sh` — 此技能的本機一致性檢查

當某個階段需要比本檔案更詳細的資訊時，請閱讀相關參考資料。

## 指令偵測

**觸發條件：** 使用者呼叫 `/scout-issue`，或請求協助尋找可貢獻的 issues（例如：「幫我找一個這個週末就能完成的適合新手的 issue」）。

**偵測方式：** 在訊息中的任何位置剖析使用者輸入的 `/scout-issue`，或辨識探索並排名貢獻機會的請求。若偵測到，請啟動此管線而非一般對話。

**範例：**
- `/scout-issue`
- `/scout-issue rust`
- `/scout-issue beginner-friendly`
- `幫我找一個這個週末就能完成的適合新手的 Rust issue`

**注意：** 若使用者在過程中再次輸入 `/scout-issue`，請從第一階段重新開始。若他們輸入 `/cancel`，請中止管線。

## 管線流程

```
呼叫 /scout-issue
    ↓
第一階段：使用者訪談
    ↓
第二階段：Issue 偵測
    ↓
第三階段：Issue 分析與排名
    ↓
第四階段：輸出格式化
    ↓
顯示給使用者
```

---

## 第一階段：使用者訪談

**目標：** 建立內部規格：經驗、語言、可用時間、貢獻類型、難度與特殊需求。

當用戶端支援時，在單一訊息中詢問 `references/interview.md` 中的六個問題。跳過使用者已經回答的任何問題，且在澄清後不要重複詢問。若使用者未提供特殊需求，請勿根據指派狀態或關聯的 PR 狀態進行篩選。

**輸出：**
```
Experience: [等級]
Languages: [清單]
Scope: [時間估計]
Type: [貢獻類型]
Difficulty: [等級]
Special: [需求]
```

---

## 第二階段：Issue 偵測

**目標：** 使用 GitHub CLI/REST 與 git 尋找候選 issues。

### 步驟 1：檢視儲存庫

```bash
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh repo view --json name,primaryLanguage,languages
cat CONTRIBUTING.md 2>/dev/null || echo "No CONTRIBUTING.md"
git log --oneline -10
ls -la
```

### 步驟 2：列出候選 Issues

```bash
# 僅計算 issue 總數。open_issues_count 也會計算開啟的 pull requests，因此會高估搜尋母體。
gh api "search/issues?q=repo:$repo+is:issue+is:open&per_page=1" --jq '.total_count'

# 最新的 100 個開啟中 issues。gh issue list 會排除 pull requests。
gh issue list --state open --limit 100

# 使用 REST 分頁超過 100 筆。--paginate 會在 jq 執行前追蹤 API 的分頁連結，
# 因此篩選 pull requests 不會提早中斷分頁。issues 端點包含 pull requests，
# 因此請捨棄具有 pull_request 欄位的項目。
gh api "repos/$repo/issues?state=open&per_page=100" --paginate \
  --jq '.[] | select(.pull_request == null) | .number'

# 當使用者指定了語言、類型或難度提示時，依標籤篩選
gh issue list --state open --label "bug" --limit 50
gh issue list --state open --label "good first issue" --limit 50
```

> **注意：** `gh issue list` 與 `gh search issues` 沒有 `--page` 旗標。請使用帶有 `--paginate` 的 REST issues 端點來遍歷每一頁，並務必篩選掉具有非 null `pull_request` 欄位的項目。`gh search issues --repo "$repo" --limit N` 可以在不分頁的情況下提高搜尋上限；`--repo` 是將結果保持在儲存庫範圍內的必要參數。

### 步驟 3：初步篩選

僅套用符合使用者明確偏好的篩選條件。

移除符合以下條件的 issues：
- 已被指派，**僅當**特殊需求包含「無作用中 PR（僅限未認領的工作）」時。
- 明顯超出使用者所述技能範圍。

將以下項目保留至第三階段作為加權證據，而非自動拒絕：
- 具有關聯 PR 的 issues（**開啟中**的關聯 PR 屬於競爭工作；已關閉或已還原的 PR 僅作為證據）。
- 不活躍的 issues（6 個月以上無活動），除非有證據顯示已過時或使用者設定了近期性限制。

**輸出：** 候選 issue 編號（通常為 20-50 個）。

---

## 第三階段：Issue 分析與排名

> `good first issue` 標籤僅作為尋找候選項目的提示。在評分前，請從 issue 內文、留言與周圍程式碼驗證難度。

**目標：** 套用資格門檻、為候選項目評分並進行排名。

針對每個候選項目：
```bash
gh issue view ISSUE_NUM
gh issue view ISSUE_NUM --comments
gh api "repos/$repo/issues/ISSUE_NUM/timeline" --paginate --jq '[.[] | select(.event == "cross-referenced") | select(.source.issue.pull_request != null) | select(.source.issue.state == "open") | .source.issue.number]'
rg "relevant_function" src/
find . -name "*test*" -type f | head -5
```

**資格門檻（評分前必須全部通過）：**
- 該 issue 為開啟狀態且仍符合使用者的硬性限制。
- 當使用者請求未認領的工作時，該 issue 未被指派且沒有開啟中的關聯 PR。
- 證據來自 issue 內文、留言、程式碼與測試 —— 絕非僅來自標題。
- 提議的工作是可執行的：可以識別出位置或子系統，或者將缺少的資訊標記為風險。

**為每個符合資格的 issue 評分（0-100），維度包含：** 使用者契合度（User Fit）、技術契合度（Technical Fit）、範圍契合度（Scope Fit）、難度契合度（Difficulty Fit）、Issue 品質（Issue Quality）、活躍度（Activity）、貢獻可行性（Contribution Feasibility）與證據品質（Evidence Quality）。

使用預設權重（使用者契合度 20%、技術契合度 15%、範圍契合度 20%、難度契合度 15%、Issue 品質 10%、活躍度 5%、貢獻可行性 10%、證據品質 5%），或使用 `references/scoring-rubric.md` 中的調整後權重。依加權分數排名並保留每個分數背後的證據。

**輸出：** 前 5-10 個附帶分數與分析的 issues。

---

## 第四階段：輸出格式化

**目標：** 呈現開發人員可據以行動的排名精選清單。

**輸出合約：** 最多顯示前 5 名。針對每個 issue，顯示滿分 100 的整體匹配分數、難度等級、估計範圍、信心水準、關於驗證缺口的簡短備註、簡短的證據要點，以及簡短的顧慮要點。最後附上單一「最佳匹配」建議。使用表情符號以提升視覺清晰度。

使用 `references/quick-reference.md`（「輸出格式」）中的範本。提及僅含 issue 的候選池大小，以及因競爭 PR、指派或硬性限制而被排除的任何 issues。

**規則：**
- 最多顯示前 5 個 issues。
- 解釋每個 issue 為何匹配並指出顧慮。
- 區分證據與推論；切勿宣稱某個 issue「絕對會被接受」或「保證能運作」。
- 切勿為了快速掃描捷徑而跳過資格或證據檢查。

---

## 調查模式

**觸發條件：** 使用者說「Investigate #[NUMBER]」（調查 #[編號]）

**動作：** 產出 `references/investigation-templates.md` 中的深度調查簡報。包含問題描述、為何匹配、相關程式碼與測試、相關 PR／提交、實作範圍、潛在困難、維護者預期、工作量估計、第一步行動與信心水準。

結尾加上：`想要我建立實作計畫嗎？請說：「Plan this issue」。`

---

## 實作規劃

**觸發條件：** 使用者說「Plan this issue」（規劃此 issue）或「How should I approach this?」（我該如何處理這個問題？）

**動作：** 產出 `references/investigation-templates.md` 中的實作計畫。將已驗證的事實與可能的實作及開放式問題區分開來，並包含要修改的檔案、測試方法、潛在挑戰、時間估計與信心水準。

結尾加上：`準備好開始了嗎？請說：「Start working on this」。`

---

## 證據規則

- **證據：** 觀察到的事實 —— issue 文字、留言、程式碼、測試、時間軸或指派狀態。
- **推論：** 您得出的結論 —— 可能可執行、可能被接受。
- 使用：可能（likely）、似乎（appears）、顯示（suggests）、不確定（uncertain）、證據不足（insufficient evidence）。
- 切勿使用：「絕對會被接受」、「保證能運作」。
- 為每個主張記錄來源；指出缺口而非自行填補。

---

## 錯誤處理

- **取消：** 收到 `/cancel` 時，立即停止並返回一般對話。
- **重新開始：** 再次收到 `/scout-issue` 時，捨棄進度並重新啟動第一階段。
- **缺少工具、驗證失敗、速率限制：** 說明限制並使用 `references/recovery.md` 中的備援方案。
- **找不到 issues：** 說明哪些限制條件產生了束縛，並提議放寬這些條件。

---

## 重要規則

1. 切勿僅依標題匹配進行排名。
2. 在未檢查 issue 與周圍程式碼的情況下，切勿輕信 `good first issue` 或 `help-wanted` 標籤。
3. 切勿從開啟狀態推斷其為活躍，或從建立時間推斷其已被棄置。
4. 建議未認領的工作前，務必檢查是否有開啟中的關聯 PR。
5. 當難度或可行性重要時，務必檢查程式碼與測試。
6. 解釋建議與拒絕的原因。
7. 區分證據與推論；切勿捏造事實。
8. 少而精的建議勝過大量薄弱的建議。
9. 預設為唯讀；除非明確要求，否則切勿修改 issues。
10. 隨時處理取消與重新開始。

---

## 可攜性

適用於任何提供 shell 存取、git 與選用 GitHub CLI 的 AI CLI。若 `gh` 無法使用，請使用 `references/recovery.md` 中的 git 與網頁備援方案，並說明無法檢查的項目。