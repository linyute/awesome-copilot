---
name: copilot-usage-metrics
description: 使用 GitHub CLI 和 REST API 擷取並顯示組織與企業的 GitHub Copilot 使用計量。
---

# Copilot 使用計量 (Copilot Usage Metrics)

您是一個使用 GitHub CLI (`gh`) 擷取並顯示 GitHub Copilot 使用計量的技能。

## 何時使用此技能 (When to use this skill)

當使用者詢問以下內容時，請使用此技能：
- Copilot 使用計量、採用情況或統計資料
- 組織或企業中有多少人正在使用 Copilot
- Copilot 接受率、建議或聊天使用情況
- 每個使用者的 Copilot 使用情況明細
- 特定日期的 Copilot 使用情況

## 如何使用此技能 (How to use this skill)

1. 確定使用者想要的是 **組織 (organization)** 還是 **企業 (enterprise)** 級別的計量。
2. 如果未提供，請詢問組織名稱或企業代稱 (slug)。
3. 確定他們想要的是 **彙總 (aggregated)** 計量還是 **個別使用者 (per-user)** 計量。
4. 確定他們是否想要 **特定日期**（YYYY-MM-DD 格式）的計量或一般/近期的計量。
5. 從此技能的目錄執行適當的指令碼。

## 可用的指令碼 (Available scripts)

### 組織計量 (Organization metrics)

- `get-org-metrics.sh <org> [day]` — 獲取組織的彙總 Copilot 使用計量。可選擇傳遞 YYYY-MM-DD 格式的特定日期。
- `get-org-user-metrics.sh <org> [day]` — 獲取組織的個別使用者 Copilot 使用計量。可選擇傳遞特定日期。

### 企業計量 (Enterprise metrics)

- `get-enterprise-metrics.sh <enterprise> [day]` — 獲取企業的彙總 Copilot 使用計量。可選擇傳遞特定日期。
- `get-enterprise-user-metrics.sh <enterprise> [day]` — 獲取企業的個別使用者 Copilot 使用計量。可選擇傳遞特定日期。

## 格式化輸出 (Formatting the output)

向使用者呈現結果時：
- 總結關鍵計量：總活躍使用者、接受率、總建議數、總聊天互動次數
- 使用表格呈現個別使用者明細
- 如果比較多個日期，請突顯趨勢
- 請注意，計量資料自 2025 年 10 月 10 日起開始提供，歷史資料最長可存取 1 年

## 重要注意事項 (Important notes)

- 這些 API 端點需要 **GitHub Enterprise Cloud**。
- 使用者必須具有適當的權限（企業擁有者、帳務管理員，或具有 `manage_billing:copilot` / `read:enterprise` 範圍的權杖）。
- 必須在企業設定中啟用「Copilot 使用計量 (Copilot usage metrics)」策略。
- 如果 API 傳回 403，請建議使用者檢查其權杖權限和企業策略設定。
