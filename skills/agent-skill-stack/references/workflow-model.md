# 動態工作流程推導 (Dynamic workflow derivation)

為每個請求推導一個新的流程。範例可以闡明方法，但絕不能變成可重複使用的階段清單。

## 反樣板規則

不要從領域生命週期（例如研究 -> 建立 -> 發佈 -> 分析）開始。請從使用者的最終結果與目前的起點開始。僅新增此結果實際必須存在的中間條件。

包含相同領域字詞的兩個請求可能需要完全不同的流程。「了解某平台」、「發佈一次」、「每週經營一個帳戶」與「為創作者建構工具」並非單一固定樣板的變體。

## 向後推導，向前驗證

在內部詢問：

1. 什麼可觀察到的結果會讓使用者認為這已經完成？
2. 在該結果存在之前，必須立即具備什麼條件？
3. 什麼輸入、決策、權限或轉換能使該條件成為可能？
4. 重複進行，直到觸及使用者已具備或可提供的內容。
5. 向前走一遍以確認每個步驟都產生下一步驟的輸入。

請勿向使用者詢問每個內部問題。僅在不同的答案會改變堆疊、成本、權限或交付成果時才詢問。

## 偵測形狀而非選擇樣板

獨立推斷屬性：

- 單次或週期性；
- 建立、決策、轉換、協調或監控；
- 僅限本機、外部讀取或外部寫入；
- 人類主導、代理輔助或自動化；
- 單一系統或多系統；
- 可逆或難以復原；
- 發生錯誤時後果輕微或嚴重。

這些屬性可在不施加預定階段清單的情況下指導分解。

## 拆分與停止規則

當步驟包含下列項目時拆分該步驟：

- 兩個可獨立替換的操作；
- 同時包含讀取與外部寫入；
- 不同的帳戶或權限；
- 核准決策與核准後的行動；
- 具有不同成功條件的輸出；
- 風險操作與安全操作混合。

當步驟具備下列條件時停止拆分：

- 非技術使用者可以理解的一個操作；
- 一個主要結果；
- 一個存取或副作用邊界；
- 一個可觀察的成功條件。

## 內部能力卡片

除非使用者詢問細節，否則將此技術表示法保留在內部：

```yaml
goal: user-visible result
input: what is available before the step
operation: one normalized action
output: what the step produces
constraints: []
frequency: one-off|recurring|event-driven
access: local|read-external|write-external
approval: none|before-access|before-spend|before-external-write
success: observable pass condition
fallback: alternative when unavailable
predecessors: []
successors: []
```

以簡單的一句話向初學者呈現相同資訊：`先用已有資料確認需求，再產生可審核的結果；只有你確認後才會寫入外部系統。`

## 跨領域需求

對於每個推導出的步驟，僅考慮重要的輔助工具：

| 需求 | 內部詢問 | 可能的能力術語 |
|---|---|---|
| 品質/風格 | 結果是否需要特定語氣或潤飾？ | humanizer, brand voice, proofreading |
| 準確性 | 未經證實的事實或數字是否會造成損害？ | fact check, grounded research, citation verification |
| 合規性 | 是否適用平台、版權、廣告或產業規則？ | compliance, policy audit, copyright |
| 隱私/安全 | 是否涉及個人隱私資料、Cookie、金鑰或帳戶？ | secret handling, PII redaction, permission audit |
| 在地化 | 語言、術語或文化是否必須調整？ | localization, translation QA |
| 資料品質 | 記錄是否會重複或使用不一致的格式？ | dedupe, validation, schema mapping |
| 協調 | 是否需要交接、排程、重試或核准？ | workflow, scheduler, human approval |
| 可見性 | 失敗或成果是否必須可被觀察？ | logging, analytics, monitoring |

透過輔助工具的能力特徵進行匹配。將草稿轉換為自然寫作的 Skill 可以支援任何寫作成果，而無需明確提及使用者的領域名稱。

## 充足性檢查

當每個必要步驟都具備以下條件時，流程即足夠詳細：

- 明確的結果；
- 至少一個有意義的搜尋表述；
- 存取與核准分類；
- 是/否成功條件；
- 使用現有 Skill、新 Skill、其他工具或無需額外功能的理由。

若產生的流程看起來與先前的範例可疑地相似，請將其捨棄並從目前成果重新推導。
