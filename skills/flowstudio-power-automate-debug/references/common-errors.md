# FlowStudio MCP — 常見 Power Automate 錯誤 (Common Power Automate Errors)

在使用 FlowStudio MCP 伺服器偵錯 Power Automate 流程時，錯誤代碼、可能原因及建議修復方法的參考。

---

## 運算式 / 範本錯誤

### `InvalidTemplate` — 函式應用於 Null 值

**完整訊息模式**：`"Unable to process template language expressions... function 'split' expects its first argument 'text' to be of type string"`

**根本原因**：像 `@split(item()?['Name'], ' ')` 這樣的運算式接收到了 null 值。

**診斷**：
1. 記下錯誤訊息中的動作名稱
2. 呼叫 `get_live_flow_run_action_outputs` 取得產生該陣列的動作
3. 找出 `Name`（或參考欄位）為 `null` 的項目

**修復方法**：
```
修改前： @split(item()?['Name'], ' ')
修改後： @split(coalesce(item()?['Name'], ''), ' ')

或者使用條件包裹整個 foreach 本體：
  expression: "@not(empty(item()?['Name']))"
```

---

### `InvalidTemplate` — 錯誤的運算式路徑

**完整訊息模式**：`"Unable to process template language expressions... 'triggerBody()?['FieldName']' is of type 'Null'"`

**根本原因**：運算式中的欄位名稱與實際負載結構描述 (schema) 不符。

**診斷**：
```python
# 檢查觸發程序輸出形狀
mcp("get_live_flow_run_action_outputs",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID,
    actionName="<trigger-name>")
# 比對實際鍵值與運算式
```

**修復方法**：更新運算式以使用正確的鍵名稱。常見的不匹配情況：
- `triggerBody()?['body']` 與 `triggerBody()?['Body']` (區分大小寫)
- `triggerBody()?['Subject']` 與 `triggerOutputs()?['body/Subject']`

---

### `InvalidTemplate` — 型別不匹配

**完整訊息模式**：`"... expected type 'Array' but got type 'Object'"`

**根本原因**：在運算式預期陣列時傳入物件（例如：單一項目的 HTTP 回應與清單回應相比）。

**修復方法**：
```
修改前： @outputs('HTTP')?['body']
修改後： @outputs('HTTP')?['body/value']    ← 用於 OData 清單回應
        @createArray(outputs('HTTP')?['body'])  ← 將單一物件包裹在陣列中
```

---

## 連接 / 驗證錯誤

### `ConnectionAuthorizationFailed`

**完整訊息**：`"The API connection ... is not authorized."`

**根本原因**：流程中參考的連接是由與當前使用的 JWT 不同的使用者/服務帳戶所擁有。

**診斷**：檢查 `properties.connectionReferences` — `connectionName` GUID 可識別擁有者。無法透過 API 修復。

**修復選項**：
1. 在 Power Automate 設計工具中開啟流程 → 重新驗證該連接
2. 使用由該權杖所持有的服務帳戶所擁有的連接
3. 在 PA 管理員中將連接共用給該服務帳戶

---

### `InvalidConnectionCredentials`

**根本原因**：連接的基礎 OAuth 權杖已過期，或使用者的憑證已變更。

**修復方法**：擁有者必須登入 Power Automate 並重新整理連接。

---

## HTTP 動作錯誤

### `ActionFailed` — HTTP 4xx/5xx

**完整訊息模式**：`"An HTTP request to... failed with status code '400'"`

**診斷**：
```python
actions_out = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_My_Call")
item = actions_out[0]   # 回傳陣列中的第一個條目
print(item["outputs"]["statusCode"])   # 400, 401, 403, 500...
print(item["outputs"]["body"])         # 來自目標 API 的錯誤詳細資訊
```

**常見原因**：
- 401 — 遺失或過期的授權標頭
- 403 — 目標資源存取被拒
- 404 — 錯誤的 URL / 資源已刪除
- 400 — 錯誤的 JSON 本文（檢查建構本文的運算式）

---

### `ActionFailed` — HTTP 逾時 (Timeout)

**根本原因**：目標端點未在連接器的逾時限制（HTTP 動作預設為 90 秒）內回應。

**修復方法**：在 HTTP 動作中新增重試原則，或將負載拆分為較小的批次以減少單次請求的處理時間。

---

## 流程控制錯誤

### `ActionSkipped` 而未執行

**根本原因**：未滿足 `runAfter` 條件。例如，設定為 `runAfter: { "Prev": ["Succeeded"] }` 的動作，若 `Prev` 失敗或被跳過，該動作將不會執行。

**診斷**：檢查前一個動作的狀態。蓄意跳過（例如在假分支中）是有意的 — 非預期的跳過則是邏輯缺口。

**修復方法**：如果動作也應在這些結果上執行，請將 `"Failed"` 或 `"Skipped"` 新增至 `runAfter` 狀態陣列。

---

### Foreach 執行順序錯誤 / 競爭條件

**根本原因**：沒有 `"operationOptions": "Sequential"` 的 `Foreach` 會平行執行迭代，導致寫入衝突或順序未定義。

**修復方法**：在 Foreach 動作中新增 `"operationOptions": "Sequential"`。

---

## 更新 / 部署錯誤

### `update_live_flow` 回傳 No-Op

**症狀**：`result["updated"]` 為空清單或 `result["created"]` 為空。

**可能原因**：傳遞了錯誤的參數名稱。必需的鍵是 `definition` (物件)，而非 `flowDefinition` 或 `body`。

---

### `update_live_flow` — `"Supply connectionReferences"`

**根本原因**：定義包含 `OpenApiConnection` 或 `OpenApiConnectionWebhook` 動作，但未傳遞 `connectionReferences`。

**修復方法**：使用 `get_live_flow` 擷取現有的連接參考，並將其作為 `connectionReferences` 引數傳遞。

---

## 資料邏輯錯誤

### `union()` 用 Null 值覆寫正確記錄

**症狀**：合併兩個陣列後，部分記錄出現了原先存在於其中一個來源陣列中的 Null 欄位。

**根本原因**：`union(old_data, new_data)` — `union()` 是先到者獲勝，因此在匹配記錄時，`old_data` 值會覆寫 `new_data`。

**修復方法**：交換引數順序：`union(new_data, old_data)`

```
修改前： @sort(union(outputs('Old_Array'), body('New_Array')), 'Date')
修改後： @sort(union(body('New_Array'), outputs('Old_Array')), 'Date')
```
