# FlowStudio MCP — 常見 Power Automate 錯誤

有關透過 FlowStudio MCP 伺服器對 Power Automate 流程進行偵錯時，常見的錯誤代碼、可能原因及建議修正方法的參考資料。

---

## 運算式 / 範本 (Expression / Template) 錯誤

### `InvalidTemplate` — 對 Null 套用函式

**完整訊息模式**：`"Unable to process template language expressions... function 'split' expects its first argument 'text' to be of type string"`

**根本原因**：類似 `@split(item()?['Name'], ' ')` 的運算式接收到了 null 數值。

**診斷步驟**：
1. 注意錯誤訊息中的動作名稱。
2. 對產生該陣列的動作呼叫 `get_live_flow_run_action_outputs`。
3. 尋找 `Name` (或所參考欄位) 為 `null` 的項目。

**修正方法**：
```
修正前：@split(item()?['Name'], ' ')
修正後：@split(coalesce(item()?['Name'], ''), ' ')

或者使用條件約束整個 foreach 本文：
  運算式："@not(empty(item()?['Name']))"
```

---

### `InvalidTemplate` — 錯誤的運算式路徑

**完整訊息模式**：`"Unable to process template language expressions... 'triggerBody()?['FieldName']' is of type 'Null'"`

**根本原因**：運算式中的欄位名稱與實際的裝載 (payload) Schema 不符。

**診斷步驟**：
```python
# 檢查觸發程序的輸出形狀
mcp("get_live_flow_run_action_outputs",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID,
    actionName="<觸發程序名稱>")
# 比較實際的鍵 (Key) 與運算式
```

**修正方法**：更新運算式以使用正確的鍵名。常見的不相符情況：
- `triggerBody()?['body']` 與 `triggerBody()?['Body']` (區分大小寫)
- `triggerBody()?['Subject']` 與 `triggerOutputs()?['body/Subject']`

---

### `InvalidTemplate` — 類型不相符

**完整訊息模式**：`"... expected type 'Array' but got type 'Object'"`

**根本原因**：在運算式預期陣列的地方傳遞了物件 (例如單一項目的 HTTP 回應與清單回應)。

**修正方法**：
```
修正前：@outputs('HTTP')?['body']
修正後：@outputs('HTTP')?['body/value']    ← 適用於 OData 清單回應
        @createArray(outputs('HTTP')?['body'])  ← 將單一物件封裝在陣列中
```

---

## 連線 / 授權 (Connection / Auth) 錯誤

### `ConnectionAuthorizationFailed`

**完整訊息**：`"The API connection ... is not authorized."`

**根本原因**：流程中參考的連線所屬的使用者/服務帳戶，與目前使用 JWT 的帳戶不同。

**診斷步驟**：檢查 `properties.connectionReferences` — `connectionName` GUID 可識別擁有者。無法透過 API 修正。

**修正選項**：
1. 在 Power Automate 設計工具中開啟流程 → 重新驗證連線。
2. 使用您持有權杖的服務帳戶所擁有的連線。
3. 在 Power Automate 管理中心將連線共用給該服務帳戶。

---

### `InvalidConnectionCredentials`

**根本原因**：連線底層的 OAuth 權杖已過期，或使用者的認證已變更。

**修正方法**：擁有者必須登入 Power Automate 並重新整理連線。

---

## HTTP 動作錯誤

### `ActionFailed` — HTTP 4xx/5xx

**完整訊息模式**：`"An HTTP request to... failed with status code '400'"`

**診斷步驟**：
```python
actions_out = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_我的呼叫")
item = actions_out[0]   # 傳回陣列中的第一個項目
print(item["outputs"]["statusCode"])   # 400, 401, 403, 500...
print(item["outputs"]["body"])         # 來自目標 API 的錯誤詳細資料
```

**常見原因**：
- 401 — 缺少或過期的授權標頭 (auth header)。
- 403 — 對目標資源的權限不足。
- 404 — 錯誤的 URL / 資源已刪除。
- 400 — JSON 本文格式錯誤 (檢查建構本文的運算式)。

---

### `ActionFailed` — HTTP 逾時

**根本原因**：目標端點未在連接器的逾時時間內回應 (HTTP 動作預設為 90 秒)。

**修正方法**：為 HTTP 動作加入重試策略，或將裝載分割成較小的批次以減少每次請求的處理時間。

---

## 控制流程錯誤

### 動作被跳過 (`ActionSkipped`) 而非執行

**根本原因**：未滿足 `runAfter` 條件。例如，設定為 `runAfter: { "Prev": ["Succeeded"] }` 的動作，在 `Prev` 失敗或被跳過時將不會執行。

**診斷步驟**：檢查前一個動作的狀態。故意跳過 (例如在 false 分支內) 是正常的 — 非預期的跳過則是邏輯缺陷。

**修正方法**：如果動作在這些結果下也應執行，請將 `"Failed"` 或 `"Skipped"` 加入 `runAfter` 狀態陣列中。

---

### Foreach 執行順序錯誤 / 競爭條件 (Race Condition)

**根本原因**：沒有使用 `operationOptions: "Sequential"` 的 `Foreach` 會平行執行疊代，導致寫入衝突或順序不明確。

**修正方法**：為 Foreach 動作加入 `"operationOptions": "Sequential"`。

---

## 更新 / 部署錯誤

### `update_live_flow` 傳回無作業 (No-Op)

**徵狀**：`result["updated"]` 為空清單，或 `result["created"]` 為空。

**可能原因**：傳遞了錯誤的參數名稱。必要的鍵是 `definition` (物件)，而非 `flowDefinition` 或 `body`。

---

### `update_live_flow` — `"Supply connectionReferences"`

**根本原因**：定義中包含 `OpenApiConnection` 或 `OpenApiConnectionWebhook` 動作，但未傳遞 `connectionReferences`。

**修正方法**：使用 `get_live_flow` 抓取現有的連線參考，並將其作為 `connectionReferences` 引數傳遞。

---

## 資料邏輯錯誤

### `union()` 以 Null 覆蓋了正確的記錄

**徵狀**：合併兩個陣列後，部分記錄的欄位變為 null，而這些欄位原本存在於其中一個來源陣列中。

**根本原因**：`union(old_data, new_data)` — `union()` 是先贏 (first-wins)，因此對於相符的記錄，old_data 的數值會覆寫 new_data。

**修正方法**：對調引數順序：`union(new_data, old_data)`

```
修正前：@sort(union(outputs('舊陣列'), body('新陣列')), 'Date')
修正後：@sort(union(body('新陣列'), outputs('舊陣列')), 'Date')
```
