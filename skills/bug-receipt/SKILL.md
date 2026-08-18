---
name: 'bug-receipt'
description: '在診斷、修復或復原後，使用 BUG RECEIPT 以及 VERIFIED、PARTIAL 或 BLOCKED 狀態結案缺陷與事件。'
metadata:
  version: '1.4.1'
---

# 錯誤收據 (Bug Receipt)

## 強制結案輸出

對於每個錯誤或事件結案決策，傳回以下完整的收據作為整體面向使用者的結果，即使使用者要求簡短回覆或未指名此格式。簡潔化縮短了欄位值；它絕不會刪除或重新命名資料列。請勿使用散文段落取代收據。

```text
BUG RECEIPT · VERIFIED | PARTIAL | BLOCKED

Problem    <observed defect and intended behavior>
Baseline   <failing interaction or command and decisive result; or not run>
Root cause <proven mechanism; or unproven hypothesis>
Change     <responsible change; or none>
Proof      <supplied or executed check: result; include every decisive layer>
Gaps       <none; or exact missing proof and single next experiment/package>
Source     executed now | supplied | mixed
```

明確使用 `not run`、`unproven` 或 `none`。切勿為了使收據看起來完整而省略某資料列。

## 建立證據邊界

在編輯之前，記錄觀察到的問題、預期行為、最強力的直接檢查以及證據來源：`executed now`、`supplied` 或 `mixed`。切勿暗示提供的證據是在目前執行中執行的。

保持證據具備隱私最小化。遮蔽認證、權杖、Cookie、個人資料、私人 URL 與敏感負載；僅保留重現或關聯失敗所需的識別碼與節錄。

在可能的情況下，使用最狹窄的安全檢查重現失敗。若無法重現，請保留獲得的證據並將結果限制在 `PARTIAL` 或 `BLOCKED`。

## 追蹤與修復

1. 遵循從輸入到症狀的即時擁有者路徑。
2. 區分觀察到的事實、有界限的推論以及缺口。
3. 在指明根本原因之前，需要具體的位置或執行階段轉換。
4. 進行最小的負責任變更；避免無關的清理、重試、靜默備用方案與特定於測試資料的例外狀況。

請勿將似是而非的修補程式、過期的記錄、原始碼讀取或通過建構轉換為使用者可見行為的證明。

## 閉合證明迴圈

僅執行受影響合約所需的檢查：

- 原始重現或直接驗收檢查；
- 最近的負向或迴歸檢查；
- 受影響的建構或整合關卡；
- 當宣告跨越該邊界時，真實的 UI、API、持續性、並行性或執行階段路徑。

使用這些具決定性的邊界：

| 層面 | 所需的直接證明 |
| --- | --- |
| 邏輯或失敗測試 | 原始失敗輸入或焦點測試現在通過 |
| UI 行為 | 真實互動加上相關的主控台與網路觀察 |
| API 或整合 | 請求、回應與負責的服務行為 |
| 持續性 | 透過真實擁有者路徑進行寫入/讀取或重新載入來回行程 |
| 競爭或生命週期 | 重複並行觸發；零或一次成功；受影響的資料列與交易證據；最終不變量 |
| 跨系統阻礙 | 一個經過清理且帶有時間戳記或請求 ID 的失敗請求/回應、邊緣與應用程式記錄，以及當追蹤到達該擁有者時的身分識別提供者記錄 |

## 指派狀態

- `VERIFIED`：觀察到的基準、具體原因、負責任的變更、所有宣告的檢查均通過、無實質缺口。
- `PARTIAL`：存在有用證據，但缺少必要的證明層或無定論。
- `BLOCKED`：特定外部條件阻止重現、修復或證明。

對於 `PARTIAL` 或 `BLOCKED`，指名閉合決定性缺口的單一最小實驗或相關證據套件。切勿捏造指令、觀察、計數、位置或結果。

對於機器可讀的收據或 CI 整合，請閱讀 [references/receipt-contract.md](references/receipt-contract.md) 並符合其 JSON 欄位、證據來源標記、相容性規則與狀態不變量。

當需要 JSON 產物時，從 [assets/receipt.template.json](assets/receipt.template.json) 開始，將其寫入任務擁有的路徑，並從此技能目錄使用 `node scripts/validate-receipt.mjs <receipt.json>` 進行驗證。除非使用者要求，否則請勿提交產生的收據。

## 來源與授權條款

最初在 MIT 授權條款下發佈於 https://github.com/lMysticl/bug-receipt。
