# 相等的計數可能會隱藏發佈失敗

這是一個小型的合成範例，並非 Copilot 的基準測試，也不是來自即時安裝程式的觀察結果。

某集合的發佈原則發佈了兩個技能 `active-a` 與 `active-b`，同時將 `template` 保留在內部。其擷取的探索輸出列出了 `active-a` 與 `template`。兩者的總數都是二。

將預期身份作為第一個 JSON 輸入提供：

```json
["active-a", "active-b"]
```

將觀察到的身份作為第二個 JSON 輸入提供：

```json
["active-a", "template"]
```

依照技能中的說明執行 [compare-discovery.mjs](../scripts/compare-discovery.mjs)。它會傳回結束代碼 1 以及以下內容：

```json
{
  "match": false,
  "counts": {
    "expected": 2,
    "observed": 2,
    "expectedUnique": 2,
    "observedUnique": 2
  },
  "missing": ["active-b"],
  "unexpected": ["template"],
  "duplicates": {"expected": [], "observed": []}
}
```

報告接著應該分別調查每個差異。針對遺漏的技能，請檢視剖析器警告、結構描述相容性、路徑規則與目標修訂版。針對範本，請檢視發佈原則與實際取用者的排除語意。僅靠身份比較並無法確立任一根本原因。

若資訊清單屬於另一個發佈管道，請分開比較該管道。請勿推斷變更該資訊清單就會變更直接的儲存庫探索。修復後，確切的唯一比對應該會傳回結束代碼 0；這仍然無法驗證執行階段載入或執行。