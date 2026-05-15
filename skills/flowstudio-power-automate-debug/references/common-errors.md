# FlowStudio MCP — 常見 Power Automate 錯誤

當透過 FlowStudio MCP 伺服器偵錯 Power Automate 流程時，供參考的錯誤代碼、可能原因和建議的修復方法。

---

## 運算式 / 範本錯誤

### `InvalidTemplate` — 函式套用於 Null 值

**完整訊息模式**：`"Unable to process template language expressions... function 'split' expects its first argument 'text' to be of type string"` (無法處理範本語言運算式... 函式 'split' 預期其第一個引數 'text' 為字串類型)

**根本原因**：類似 `@split(item()?['Name'], ' ')` 的運算式接收到了 null 值。

**診斷步驟**：
1. 記下錯誤訊息中的動作名稱。
2. 對產生該陣列的動作呼叫 `get_live_flow_run_action_outputs`。
3. 找出 `Name`（或引用的欄位）為 `null` 的項目。

**修復方法**：
```
修改前：@split(item()?['Name'], ' ')
修改後：@split(coalesce(item()?['Name'], ''), ' ')

或在整個 foreach 主體前加上條件保護：
  運算式：@not(empty(item()?['Name']))
```

---

### `InvalidTemplate` — 錯誤的運算式路徑

**完整訊息模式**：`"Unable to process template language expressions... 'triggerBody()?['FieldName']' is of type 'Null'"` (無法處理範本語言運算式... 'triggerBody()?['FieldName']' 為 'Null' 類型)

**根本原因**：運算式中的欄位名稱與實際的承載資料結構描述不符。

**診斷步驟**：
```python
# 檢查觸發器輸出形狀
mcp("get_live_flow_run_action_outputs",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID,
    actionName="<trigger-name>")
# 比較實際的索引鍵與運算式中的路徑
```

**修復方法**：更新運算式以使用正確的索引鍵名稱。常見的不匹配情況包括：
- `triggerBody()?['body']` 與 `triggerBody()?['Body']` (區分大小寫)
- `triggerBody()?['Subject']` 與 `triggerOutputs()?['body/Subject']`

---

### `InvalidTemplate` — 類型不匹配

**完整訊息模式**：`"... expected type 'Array' but got type 'Object'"` (... 預期類型為 'Array'，但得到的是 'Object')

**根本原因**：在運算式預期陣列的地方傳遞了物件（例如單一項目的 HTTP 回應與清單回應的差異）。

**修復方法**：
```
修改前：@outputs('HTTP')?['body']
修改後：@outputs('HTTP')?['body/value']    ← 用於 OData 清單回應
        @createArray(outputs('HTTP')?['body'])  ← 將單一物件包裝在陣列中
```

---

## 連線 / 認證錯誤

### `ConnectionAuthorizationFailed`

**完整訊息**：`"The API connection ... is not authorized."` (API 連線 ... 未獲授權。)

**根本原因**：流程中引用的連線屬於與目前使用 JWT 權杖的使用者/服務帳戶不同的使用者。

**診斷步驟**：檢查 `properties.connectionReferences` — `connectionName` GUID 可識別擁有者。無法透過 API 修復。

**修復選項**：
1. 在 Power Automate 設計器中開啟流程 → 重新驗證連線。
2. 使用由您持有權杖的服務帳戶所擁有的連線。
3. 在 Power Automate 管理中心將連線分享給該服務帳戶。

---

### `InvalidConnectionCredentials`

**根本原因**：連線底層的 OAuth 權杖已過期，或使用者的認證已變更。

**修復方法**：擁有者必須登入 Power Automate 並重新整理連線。

---

## HTTP 動作錯誤

### `ActionFailed` — HTTP 4xx/5xx

**完整訊息模式**：`"An HTTP request to... failed with status code '400'"` (對 ... 的 HTTP 要求失敗，狀態碼為 '400')

**診斷步驟**：
```python
actions_out = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_My_Call")
item = actions_out[0]   # 傳回陣列中的第一個項目
print(item["outputs"]["statusCode"])   # 400, 401, 403, 500...
print(item["outputs"]["body"])         # 來自目標 API 的錯誤詳細資訊
```

**常見原因**：
- 401 — 缺少驗證標頭或權杖已過期。
- 403 — 對目標資源的權限不足。
- 404 — 錯誤的 URL / 資源已刪除。
- 400 — JSON 本文格式錯誤（檢查建構本文的運算式）。

---

### `ActionFailed` — HTTP 逾時

**根本原因**：目標端點未在連接器的逾時時間內（HTTP 動作預設為 90 秒）做出回應。

**修復方法**：在 HTTP 動作中新增重試原則，或將承載資料分割成較小的批次以減少每次要求的處理時間。

---

## 控制流程錯誤

### `ActionSkipped` 而非執行

**根本原因**：未滿足 `runAfter` 條件。例如，設定為 `runAfter: { "Prev": ["Succeeded"] }` 的動作在 `Prev` 失敗或被跳過時將不會執行。

**診斷步驟**：檢查前一個動作的狀態。故意跳過（例如在 false 分支內部）是正常的 — 意外跳過則是邏輯缺陷。

**修復方法**：如果該動作在那些結果下也應該執行，請將 `"Failed"` 或 `"Skipped"` 新增到 `runAfter` 狀態陣列中。

---

### Foreach 執行順序錯誤 / 發生競爭條件

**根本原因**：未設定 `operationOptions: "Sequential"` 的 `Foreach` 會平行執行反覆運算，導致寫入衝突或順序不明確。

**修復方法**：在 Foreach 動作中新增 `"operationOptions": "Sequential"`。

---

### 已處理內部失敗後 Foreach 父代仍然失敗

**徵狀**：內部動作具備失敗處理常式，但父代 `Foreach` 仍然顯示 `Failed` (失敗)，且下游動作（如 `Response`）被跳過。

**根本原因**：已處理的子系失敗仍可能將迴圈容器標記為失敗。僅接受 `Succeeded` (成功) 的下游 `runAfter` 將不會執行。

**診斷步驟**：使用 `get_live_flow_run_error` 檢查父代 foreach，然後檢查發生失敗之反覆運算的子動作輸出。

**修復方法**：如果部分成功是可以接受的，請允許下游的彙總/回應在 `Succeeded` 和 `Failed` 之後皆執行，並在承載資料中包含明確的錯誤摘要。如果迴圈必須是「全有或全無」，請將具風險的內部工作包裝在一個範圍 (Scope) 中，並在範圍邊界處理成功/失敗。

---

## 更新 / 部署錯誤

### `update_live_flow` 傳回無操作 (No-Op)

**徵狀**：`result["updated"]` 是空清單或 `result["created"]` 為空。

**可能原因**：傳遞了錯誤的參數名稱。必要的索引鍵是 `definition` (物件)，而不是 `flowDefinition` 或 `body`。

---

### `update_live_flow` — `"Supply connectionReferences"`

**根本原因**：定義包含 `OpenApiConnection` 或 `OpenApiConnectionWebhook` 動作，但未傳遞 `connectionReferences`。

**修復方法**：使用 `get_live_flow` 擷取現有的連線參考，並將其作為 `connectionReferences` 引數傳遞。

---

## 資料邏輯錯誤

### `union()` 使用 Null 覆寫了正確的記錄

**徵狀**：合併兩個陣列後，某些記錄的欄位變為 null，而該欄位原本存在於其中一個來源陣列中。

**根本原因**：`union(old_data, new_data)` — `union()` 是先到先得 (first-wins)，因此 old_data 的值會覆寫相符記錄的 new_data 值。

**修復方法**：調換引數順序：`union(new_data, old_data)`

```
修改前：@sort(union(outputs('Old_Array'), body('New_Array')), 'Date')
修改後：@sort(union(body('New_Array'), outputs('Old_Array')), 'Date')
```

---

### 篩選陣列 / 查詢中的 Null 串接 (Null Cascade)

**徵狀**：查閱/篩選步驟傳回錯誤的記錄，或者後面的運算式在 null 上失敗，即使篩選動作本身成功也是如此。

**根本原因**：查閱鍵為 null 或為空。類似 `equals(item()?['Email'], outputs('Lookup_Email'))` 的條件可能會意外地匹配雙方皆為 null 的資料列，或將空陣列傳遞到下游。

**診斷步驟**：檢查建立查閱鍵的動作和篩選輸出的長度。在信任篩選結果之前，請確認索引鍵不為空。

**修復方法**：在篩選前新增非空值保護，使用 `trim()`/`toLower()` 標準化比較值，並在未找到相符項時進行明確的分支處理。
