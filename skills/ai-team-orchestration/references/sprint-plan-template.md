# 工作計畫範本 (Work Plan Template)

針對重大工作使用此範本。小型、明確的變更可直接根據議題或需求進行。

```markdown
# [工作項目] - 計畫

## 目標

[一個可觀察的成果。]

## 上下文

- 相關議題/需求：[連結或摘要]
- 儲存庫指引：[連結]
- 重要限制條件：[清單]

## 範疇內

- [交付項目]

## 範疇外

- [明確排除項目]

## 工作項目

1. [工作]
2. [工作]
3. [工作]

## 驗收標準

- [ ] [可觀察的行為]
- [ ] 相關儲存庫檢查通過 (範例：`npm run lint`、`npm test`)
- [ ] 涵蓋該變更的測試已新增或驗證
- [ ] 當行為或操作發生變更時，文件/上下文已更新

## 驗證

- 自動化：[指令或檢查]
  - 範例：`npm ci && npm run test` 或 `pytest -q`
  - 範例：`npm run lint && npm run build`
- 手動：[重點情境，若有用]
- 獨立審查：必要 / 可選 / 不需要 - [原因]
- QA：必要 / 可選 / 不需要 - [原因]

## PR 檢查清單 (新增至 PR 內文)

- 分支名稱符合儲存庫政策 (例如：`feat/`、`fix/` 或 `chore/`)
- 說明：簡短摘要、原因與驗收標準
- 包含驗證步驟 (指令與手動檢查)
- 已新增測試或更新現有測試
- 若行為改變，已更新相關文件/PROJECT_BRIEF
- 審查者：@team 或特定擁有者
- 必要檢查：列出必須通過的 CI 工作
- 版本資訊 (Release notes) / 變更記錄 (changelog) 條目：是/否

## 風險與決策

- [風險或重大決策]

## QA 風險矩陣 (何時需要 QA)

- 高影響力 × 高不確定性 = 需要 QA
- 高影響力 × 低不確定性 = 建議 QA
- 低影響力 × 高不確定性 = 建議 QA
- 低影響力 × 低不確定性 = QA 可選

## 後續操作

[擁有者與立即的下一步]
```

## 進度簡記 (Progress Note)

對於長期執行的工作，保留一份簡短的進度簡記：

```markdown
# [工作項目] - 進度

- 已完成：[項目]
- 進行中：[項目]
- 已受阻：[議題或無]
- 決策：[重大決策]
- 目前為止的驗證：[結果]
- 後續操作：[具體操作]
```

## Dev 交接 (Dev Handoff)

```text
Read the repository instructions, PROJECT_BRIEF.md when present, and this plan.
Implement the in-scope work, run the listed verification, update durable context
when needed, and prepare a pull request. Do not merge.
```
