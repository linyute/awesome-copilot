# Issue Scout 快速參考

## 指令

| 指令 | 描述 |
|------|------|
| `/scout-issue` | 開始 issue 探索 |
| `/scout-issue rust` | 以語言篩選器開始 |
| `/scout-issue beginner` | 以難度篩選器開始 |
| `Find issues I could contribute to` | 自動啟用此技能（無需斜線指令） |
| `Investigate #NNN` | 深入探討特定 issue |
| `Plan this issue` | 取得實作計畫 |
| `How should I approach this?` | 取得處理建議 |
| `/cancel` | 中止目前的管線並返回一般對話模式 |
| `/scout-issue`（再次輸入） | 捨棄先前的進度並從第一階段重新啟動管線 |
| `Start working on this` | 開始執行已規劃的實作 |

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

## 使用者訪談問題

1. **經驗程度**
   - 首次貢獻者
   - 有些許熟悉度
   - 熟悉此程式碼庫

2. **技術技能**
   - JavaScript/TypeScript
   - Python
   - Rust
   - Go
   - Java/Kotlin
   - C/C++
   - Ruby
   - 其他

3. **可用時間**
   - 快速修復（< 2 小時）
   - 週末專案（4-8 小時）
   - 一週專案（20-40 小時）
   - 較長期的貢獻（40+ 小時）

4. **貢獻類型**
   - 錯誤修復
   - 新功能
   - 文件
   - 測試
   - 效能改進
   - 程式碼重構
   - 任何合適的 issue

5. **難度偏好**
   - 適合新手（good first issue）— 標籤僅為尋找提示；請從 issue 內文與程式碼驗證難度
   - 中階
   - 進階
   - 任何難度

6. **特殊需求**
   - 無作用中 PR（僅限未認領的工作）
   - 必須有重現案例
   - 必須有清晰的驗收標準
   - 避開編譯器／核心子系統
   - 其他

## 評分維度

1. **使用者契合度（User Fit）** - 符合使用者偏好
2. **技術契合度（Technical Fit）** - 符合技術堆疊
3. **範圍契合度（Scope Fit）** - 符合時間限制
4. **難度契合度（Difficulty Fit）** - 符合技能水準
5. **Issue 品質（Issue Quality）** - 問題定義明確
6. **活躍度（Activity）** - 維護活躍
7. **貢獻可行性（Contribution Feasibility）** - 務實可完成
8. **證據品質（Evidence Quality）** - 強有力的佐證

## GitHub CLI 指令

```bash
# 僅含 Issue 的開啟中計數（open_issues_count 也包含 PR）
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh api "search/issues?q=repo:$repo+is:issue+is:open&per_page=1" --jq '.total_count'

# 列出開啟中的 issues（排除 pull requests）
gh issue list --state open

# 依標籤篩選
gh issue list --label "bug" --state open

# 檢視特定 issue
gh issue view 1234

# 檢查開啟中的關聯 PR（僅開啟中的 PR 算作競爭工作）
gh api "repos/$repo/issues/1234/timeline" --paginate --jq '[.[] | select(.event == "cross-referenced") | select(.source.issue.pull_request != null) | select(.source.issue.state == "open") | .source.issue.number]'

# 列出 PR
gh pr list --state open

# 檢視 PR 詳細資訊
gh pr view 5678
```

## Git 指令

```bash
# 近期活動
git log --oneline -20

# 搜尋程式碼
rg "pattern" src/

# 尋找檔案
find . -name "*.ts" -type f

# 檢查 blame
git blame src/file.ts
```

## 信心水準

- **高**：強有力的證據、清晰的路徑、活躍的支援
- **中**：良好的證據、可達成、部分未知因素
- **低**：薄弱的證據、重大的未知因素

## 輸出格式

```
🔍 ISSUE SCOUT 結果

從 Y 個開啟中的 issues（僅計算 issue）中找到 X 個強有力的候選項目。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. #NNNN — [標題]
   📊 匹配度：NN/100
   🎯 難度：[等級]
   ⏱️ 估計範圍：[N] 小時
   📌 信心水準：[高/中/低]
   🔎 驗證缺口：[無，或無法檢查的項目]

   ✅ 為何匹配：
   • [證據點 1]
   • [證據點 2]
   • [證據點 3]

   ⚠️ 顧慮：
   • [顧慮 1]
   • [顧慮 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 最佳匹配：#[NUMBER]

[一句話建議]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 想要我詳細調查其中任何一個 issue 嗎？
   請說：「Investigate #[NUMBER]」
```

## 關鍵規則

1. 證據 ≠ 推論
2. 切勿僅依標題匹配進行排名
3. 檢查關聯的 PR
4. 檢查近期活動
5. 解釋建議原因
6. 解釋拒絕原因
7. 切勿捏造事實
8. 預設為唯讀

## 調查檢查清單

- [ ] 已閱讀完整描述
- [ ] 已檢視留言
- [ ] 已檢查關聯的 PR
- [ ] 已識別程式碼位置
- [ ] 已找到測試位置
- [ ] 已評估複雜度
- [ ] 已記錄證據