# FlowStudio MCP — 常見 Power Automate 錯誤

透過 FlowStudio MCP 伺服器偵錯 Power Automate 流程時的
錯誤代碼、可能原因及建議修正方式之參考指南。

---

## 運算式 / 範本錯誤

### `InvalidTemplate` — 函式套用於 Null

**完整訊息模式**：`"Unable to process template language expressions... function 'split' expects its first argument 'text' to be of type string"`

**根本原因**：類似 `@split(item()?['Name'], ' ')` 的運算式接收到了 null 值。

**診斷**：
1. 注意錯誤訊息中的動作名稱
2. 在產生陣列的動作上呼叫 `get_live_flow_run_action_outputs`
3. 找出 `Name`（或所參照欄位）為 `null` 的項目

**修正方式**：
```
修改前：@split(item()?['Name'], ' ')
修改後：@split(coalesce(item()?['Name'], ''), ' ')

或使用條件保護整個 foreach 內文：
  expression: "@not(empty(item()?['Name']))"
```

---

### `InvalidTemplate` — 錯誤的運算式路徑

**完整訊息模式**：`"Unable to process template language expressions... 'triggerBody()?['FieldName']' is of type 'Null'"`

**根本原因**：運算式中的欄位名稱與實際裝載結構描述不符。

**診斷**：
```python
# 檢查觸發程序輸出結構
mcp("get_live_flow_run_action_outputs",
    environmentName=ENV, flowName=FLOW_ID, runName=RUN_ID,
    actionName="<trigger-name>")
# 比較實際索引鍵與運算式
```

**修正方式**：更新運算式以使用正確的索引鍵名稱。常見的不符情況：
- `triggerBody()?['body']` 與 `triggerBody()?['Body']`（區分大小寫）
- `triggerBody()?['Subject']` 與 `triggerOutputs()?['body/Subject']`

---

### `InvalidTemplate` — 型別不符

**完整訊息模式**：`"... expected type 'Array' but got type 'Object'"`

**根本原因**：在運算式預期陣列的位置傳遞了物件（例如單一項目的 HTTP 回應與清單回應）。

**修正方式**：
```
修改前：@outputs('HTTP')?['body']
修改後：@outputs('HTTP')?['body/value']    ← 適用於 OData 清單回應
        @createArray(outputs('HTTP')?['body'])  ← 將單一物件包裹在陣列中
```

---

## 連線 / 驗證錯誤

### `ConnectionAuthorizationFailed`

**完整訊息**：`"The API connection ... is not authorized."`

**根本原因**：流程中參照的連線所屬的使用者/服務帳戶，
與目前使用其 JWT 的帳戶不同。

**診斷**：檢查 `properties.connectionReferences` — `connectionName` GUID
可識別擁有者。無法透過 API 修正。

**修正選項**：
1. 在 Power Automate 設計工具中開啟流程 → 重新驗證連線
2. 使用您持有其權杖的服務帳戶所擁有的連線
3. 在 PA 管理中心中將連線共用給該服務帳戶

---

### `InvalidConnectionCredentials`

**根本原因**：連線底層的 OAuth 權杖已過期，或
使用者的認證已變更。

**修正方式**：擁有者必須登入 Power Automate 並重新整理連線。

---

## HTTP 動作錯誤

### `ActionFailed` — HTTP 4xx/5xx

**完整訊息模式**：`"An HTTP request to... failed with status code '400'"`

**診斷**：
```python
actions_out = mcp("get_live_flow_run_action_outputs", ..., actionName="HTTP_My_Call")
item = actions_out[0]   # 傳回陣列中的第一筆項目
print(item["outputs"]["statusCode"])   # 400, 401, 403, 500...
print(item["outputs"]["body"])         # 來自目標 API 的錯誤詳細資訊
```

**常見原因**：
- 401 — 缺少驗證標頭或驗證標頭已過期
- 403 — 目標資源權限不足
- 404 — 錯誤的 URL / 資源已刪除
- 400 — 格式錯誤的 JSON 內文（檢查建構內文的運算式）

---

### `ActionFailed` — HTTP 逾時

**根本原因**：目標端點未在連接器的逾時限制內回應
（HTTP 動作預設為 90 秒）。

**修正方式**：為 HTTP 動作新增重試原則，或將裝載分割為更小的
批次以減少每次請求的處理時間。

---

## 控制流程錯誤

### `ActionSkipped` 未執行

**根本原因**：未滿足 `runAfter` 條件。例如設定為
`runAfter: { "Prev": ["Succeeded"] }` 的動作，若 `Prev` 失敗或被跳過，則不會執行。

**診斷**：檢查前一個動作的狀態。蓄意跳過
（例如在 false 分支內部）是刻意為之 — 非預期的跳過則是邏輯缺陷。

**修正方式**：若該動作也應在這些結果下執行，請在 `runAfter`
狀態陣列中新增 `"Failed"` 或 `"Skipped"`。

---

### Foreach 執行順序錯誤 / 競爭條件

**根本原因**：未設定 `"operationOptions": "Sequential"` 的 `Foreach` 會平行執行
反覆運算，導致寫入衝突或未定義的順序。

**修正方式**：在 Foreach 動作中新增 `"operationOptions": "Sequential"`。

---

### 內部失敗處理後 Foreach 父動作仍失敗

**徵兆**：內部動作具備失敗處理常式，但父 `Foreach` 仍
顯示為 `Failed`，且下游動作（如 `Response`）被跳過。

**根本原因**：已處理的子動作失敗仍可能將迴圈容器標記為
失敗。僅接受 `Succeeded` 的下游 `runAfter` 將不會執行。

**診斷**：使用 `get_live_flow_run_error` 檢查父 foreach，然後
檢查失敗該次反覆運算的子動作輸出。

**修正方式**：若可接受部分成功，請允許下游的聯結/回應在
`Succeeded` 與 `Failed` 後皆可執行，並在裝載中包含明確的錯誤摘要。
若迴圈必須是全部成功或全部失敗，請將有風險的內部工作包裹在 Scope 中，
並在 Scope 邊界處理成功/失敗。

---

## 更新 / 部署錯誤

### `update_live_flow` 傳回 No-Op

**徵兆**：`result["updated"]` 為空清單或 `result["created"]` 為空。

**可能原因**：傳遞了錯誤的參數名稱。必要的索引鍵為 `definition`
（物件），而非 `flowDefinition` 或 `body`。

---

### `update_live_flow` — `"Supply connectionReferences"`

**根本原因**：定義包含 `OpenApiConnection` 或
`OpenApiConnectionWebhook` 動作，但未傳遞 `connectionReferences`。

**修正方式**：使用 `get_live_flow` 擷取現有的連線參照，並將其
作為 `connectionReferences` 引數傳遞。

---

## 資料邏輯錯誤

### `union()` 以 Null 覆寫正確記錄

**徵兆**：合併兩個陣列後，某些記錄出現了原本存在於
其中一個來源陣列中的 null 欄位。

**根本原因**：`union(old_data, new_data)` — `union()` 採先到先贏原則，因此對於相符的記錄，
old_data 的值會覆寫 new_data。

**修正方式**：調換引數順序：`union(new_data, old_data)`

```
修改前：@sort(union(outputs('Old_Array'), body('New_Array')), 'Date')
修改後：@sort(union(body('New_Array'), outputs('Old_Array')), 'Date')
```

---

### 篩選陣列 / 查詢中的 Null 串聯

**徵兆**：查閱/篩選步驟傳回了錯誤的記錄，或者即使篩選動作
本身成功，後續運算式仍因 null 而失敗。

**根本原因**：查閱索引鍵為 null 或空白。類似
`equals(item()?['Email'], outputs('Lookup_Email'))` 的條件可能會意外比對到雙方皆為 null 的資料列，
或者將空陣列傳遞至下游。

**診斷**：檢查建立查閱索引鍵的動作以及篩選輸出的
長度。在信任篩選結果之前，請先確認索引鍵非空白。

**修正方式**：在篩選前新增非空白保護機制，使用 `trim()`/`toLower()`
將比較值正規化，並在找不到相符項目時明確進行分支處理。
