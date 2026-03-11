# 錯誤報告模板 (Bug Report Template)

在建立 Oracle 到 PostgreSQL 遷移缺陷的錯誤報告時使用此模板。

## 檔名格式

```
BUG_REPORT_<DescriptiveSlug>.md
```

## 模板結構

```markdown
# 錯誤報告：<標題>

**狀態：** ✅ RESOLVED | ⛔ UNRESOLVED | ⏳ IN PROGRESS
**元件：** <高階元件/端點和關鍵方法>
**測試：** <相關自動化測試名稱>
**嚴重性：** 低 | 中 | 高 | 緊急

---

## 問題 (Problem)

<可觀察到的錯誤行為。說明預期行為 (Oracle 基準線) 與實際行為 (PostgreSQL)。請具體且實事求是。>

## 情境 (Scenario)

<重現缺陷的有序步驟。包含：
1. 前提條件與種子資料
2. 確切的操作或 API 呼叫
3. 預期結果 (Oracle)
4. 實際結果 (PostgreSQL)>

## 根本原因 (Root Cause)

<極簡、具體的技術原因。參考特定的 Oracle/PostgreSQL 行為差異 (例如：空字串 vs NULL、類型強制嚴格度)。>

## 解決方案 (Solution)

<已做或需要的變更。明確說明資料存取層變更、追蹤旗標以及任何用戶端程式碼修改。註明變更是已套用還是仍有需要。>

## 驗證 (Validation)

<確認修復的通過測試或手動檢查項目清單：
- 在 Oracle 和 PostgreSQL 上重新執行重現步驟
- 比較列/欄輸出
- 檢查錯誤處理的一致性>

## 修改的檔案 (Files Modified)

<帶有相對檔案路徑和每次變更簡短用途的項目清單：
- `src/DataAccess/FooRepository.cs` — 為空字串參數加入了明確的 NULL 檢查>

## 備註 / 後續步驟 (Notes / Next Steps)

<後續行動、環境注意事项、風險或對其他修復的相依性。>
```

## 狀態值 (Status Values)

| 狀態 | 意義 |
|--------|---------|
| ✅ RESOLVED | 缺陷已修正並驗證 |
| ⛔ UNRESOLVED | 缺陷尚未處理 |
| ⏳ IN PROGRESS | 缺陷正在調查中或正在修復中 |

## 風格規則 (Style Rules)

- 保持文字簡潔且實事求是
- 始終使用現在式或過去式
- 偏好針對步驟和驗證使用項目符號和編號清單
- 明確指出資料層細微差異 (追蹤、填補、條件約束)
- 遵循現有的執行階段/語言版本；避免投機性的修復
- 包含最少的 SQL 摘錄和記錄作為證據；省略敏感資料
