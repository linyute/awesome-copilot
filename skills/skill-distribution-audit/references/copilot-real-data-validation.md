# Copilot 在真實擷取集合資料上的驗證

2026-11-06，GitHub Copilot CLI **1.0.106** 在修訂版 **11a11ef7c37cd2317e9121c695c7fb9d7b3e8e62** 使用此技能稽核真實的歷史 `findscripter/everything-skills` 探索擷取資料。該工作階段使用 GitHub Copilot 的託管供應商，由 Auto 選取 **GPT-6 Luna**（`gpt-6-luna`，`isByok: false`），於 Windows 上搭配 Node.js **24.19.0** 執行。

工作階段：`70196521-4d41-458d-8dcc-40eb33cc4158`。初始請求於 06:48:05–06:50:12 UTC 執行；接續請求於 06:51:10–06:54:13 UTC 執行。過於狹窄的操作員 shell 允許清單導致第一個請求無法完成比較。同一工作階段在允許本機 shell 執行、額外提供一份取用者實作摘錄，以及使用相同技能與其他輸入位元組的情況下繼續執行。兩個請求皆呼叫了專案技能。這是一次實務驗證執行，而非與未使用該技能的 Copilot 進行的對照比較。

## 輸入與結果

目標取用者為 **`skills@1.7.4`**，使用 `skills add findscripter/everything-skills --list` 的歷史輸出。輸入包含來源名稱／路徑／狀態投影、原始 marketplace JSON、完整排序的探索名稱摘錄、擷取 Metadata、剖析器警告，以及標有行號的發佈原則／取用者實作摘錄。探索名稱是從原始終端機 stdout 擷取，並與歷史 `allDiscovered` 記錄進行交叉檢查。未執行全新的安裝程式執行。

| 來源修訂版 | 預期作用中身份 | 資訊清單路徑 | 擷取的探索 | 來源對資訊清單 | 來源對探索 |
| --- | ---: | ---: | ---: | --- | --- |
| `3641911a4540686b02900c7c49a14d021286e3ee` | 1,093 | 1,093 | 1,076 | 完全相符；結束碼 0 | 38 個遺漏、21 個非預期；結束碼 1 |
| `d696ae529a83ecdd83d2ae69d5a3a221b0209541` | 1,093 | 1,093 | 1,093 | 完全相符；結束碼 0 | 完全相符；結束碼 0 |

Copilot 從來源原則推導出預期集合、將資訊清單目錄路徑與探索名稱分開對應、檢查身份歧義，並執行隨附的比較輔助程式。這四次比較中皆無重複身份。21 個非預期項目包含 20 個來源已棄用的技能與一個未編入索引的身份。39 個歷史 YAML 警告涵蓋了 38 個遺漏的作用中技能加上一個已棄用技能。報告將這些觀察結果與推論原因區分開來，並將 marketplace 發佈與直接儲存庫掃描視為不同的管道。

- [Copilot 擷取的稽核報告](../assets/copilot-validation/outputs/audit-report.md)
- [完整的變更前探索輔助程式輸出](../assets/copilot-validation/outputs/before-discovery-comparison.json)與[變更後輸出](../assets/copilot-validation/outputs/after-discovery-comparison.json)
- [變更前資訊清單輔助程式輸出](../assets/copilot-validation/outputs/before-manifest-comparison.json)與[變更後輸出](../assets/copilot-validation/outputs/after-manifest-comparison.json)
- [原始提示](../assets/copilot-validation/prompt.txt)、[接續提示](../assets/copilot-validation/followup.txt)與[選定的工具／工作階段證據](../assets/copilot-validation/session-evidence.json)
- [輸入來源出處、固定來源 URL、雜湊值與已發佈檔案清單](../assets/copilot-validation/provenance.json)

選定的追蹤紀錄記載了技能載入／呼叫、Copilot 供應商／模型身份、指令、工具輸出以及權限遭拒的嘗試。本機路徑已遮蔽。私人服務日誌、個人技能描述與模型推理均已排除。獨立驗證發現成功的輔助程式 stdout 與儲存的 JSON 相同，結束代碼為 **0 / 1 / 0 / 0**；在整個 Copilot 執行過程中，所有 14 個輸入檔案與四個技能檔案皆保留了原始位元組。發佈時將四個輸出檔案正規化為 LF，並從路徑已遮蔽的 stderr 摘錄中移除了尾隨空行；這些轉換與雜湊值皆記錄於來源出處中。

## 重現具決定性的結果

從儲存庫根目錄使用 Node.js 24 或更新版本執行：

```sh
node skills/skill-distribution-audit/assets/copilot-validation/reproduce.mjs
```

這會建立一個全新的暫存工作區、複製提供的輸入與技能，並執行 Copilot 產生的三個指令碼：身份推導、四次輔助程式比較與發現註釋。僅其行尾在發佈時經過正規化，如來源出處檔案所記錄。它會根據擷取的結果驗證報告與結束代碼。它不會呼叫 Copilot、網路工具、安裝程式或受稽核的集合技能。暫存工作區會保留以供檢視。

若要重複 Copilot 引導的部分，請使用該暫存工作區、授予本機執行／輸出寫入權限，並將儲存的原始提示提交至已驗證的 Copilot CLI 工作階段。保留其文字記錄並記錄實際的用戶端／模型版本；全新的模型回應不需要使用完全相同的措辭。儲存的接續提示說明了原始的權限修正與新增的實作摘錄。

## 這確立了什麼

這證明了 GitHub Copilot 在真實擷取資料上使用該技能與輔助程式，以產出可重現的身份協調結果。它僅確立了所提供來源投影與歷史擷取的涵蓋率。完整的原始終端機日誌保留在本機；已發佈的摘錄包含其雜湊值與擷取方法。變更前擷取缺少其自身的時間戳記、記錄的結束代碼與變更前後簽出觀察；其來源歸屬來自歷史稽核 Metadata。變更後擷取記錄了 2026-11-02T09:41:54.651Z、結束代碼 0，以及在探索前後觀察到相同的來源修訂版。在此執行期間，未獨立重新下載或針對套件完整性驗證快取的取用者摘錄。

它並不確立目前的安裝程式行為、詳盡的 YAML／結構描述有效性、集合技能的即時載入或成功執行、認證／服務可用性，或相較於基準 Copilot 的量化改進。擷取的稽核報告中提及「無網路請求」是指無網路**工具**請求；Copilot 推論本身使用了其託管服務。