# FlowStudio MCP — 動作模式：資料轉換 (Data Transforms)

陣列作業、HTTP 呼叫、剖析及資料轉換模式。

> 所有範例皆假設 `"runAfter"` 已正確設定。
> `<connectionName>` 是 `connectionReferences` 中的 **鍵 (key)** (例如 `shared_sharepointonline`)，而非 GUID。
> GUID 應放在對應表數值的 `connectionName` 屬性中。

---

## 陣列作業 (Array Operations)

### 選取 (Select，重塑 / 投影陣列)

轉換陣列中的每個項目，僅保留您需要的資料欄或對其進行重新命名。
避免在流程的其餘部分攜帶大型物件。

```json
"Select_Needed_Columns": {
  "type": "Select",
  "runAfter": {},
  "inputs": {
    "from": "@outputs('HTTP_Get_Subscriptions')?['body/data']",
    "select": {
      "id":           "@item()?['id']",
      "status":       "@item()?['status']",
      "trial_end":    "@item()?['trial_end']",
      "cancel_at":    "@item()?['cancel_at']",
      "interval":     "@item()?['plan']?['interval']"
    }
  }
}
```

結果參考：`@body('Select_Needed_Columns')` — 傳回重塑後的物件直接陣列。

> 在迴圈或篩選之前使用「選取 (Select)」動作，可以減少裝載 (payload) 大小並簡化下游運算式。適用於任何陣列 — SharePoint 結果、HTTP 回應、變數。
>
> **提示：**
> - **單一物件轉陣列的強制轉型**：當 API 傳回單一物件但您需要「選取」(其需要陣列) 時，請將其包裝起來：`@array(body('Get_Employee')?['data'])`。輸出將是一個包含 1 個項目的陣列 — 透過 `?[0]?['field']` 存取結果。
> - **選用欄位的 Null 正規化**：在每個選用欄位上使用 `@if(empty(item()?['field']), null, item()?['field'])`，將空字串、缺少的屬性及空物件正規化為明確的 `null`。這可以確保下游 `@equals(..., @null)` 檢查的一致性。
> - **扁平化巢狀物件**：將巢狀屬性投影為扁平欄位：
>   ```
>   "manager_name": "@if(empty(item()?['manager']?['name']), null, item()?['manager']?['name'])"
>   ```
>   這可以實現與來自其他來源的扁平 Schema 進行直接的欄位級比較。

---

### 篩選陣列 (Filter Array，查詢)

將陣列篩選為符合條件的項目。對於複雜的多條件邏輯，請使用動作形式 (而非 `filter()` 運算式) — 它更清晰且更易於維護。

```json
"Filter_Active_Subscriptions": {
  "type": "Query",
  "runAfter": {},
  "inputs": {
    "from": "@body('Select_Needed_Columns')",
    "where": "@and(or(equals(item().status, 'trialing'), equals(item().status, 'active')), equals(item().cancel_at, null))"
  }
}
```

結果參考：`@body('Filter_Active_Subscriptions')` — 直接的篩選後陣列。

> 提示：對同一個來源陣列執行多個「篩選陣列」動作，以建立具名的貯體 (例如有效、取消中、已完全取消)，然後使用 `coalesce(first(body('Filter_A')), first(body('Filter_B')), ...)` 來挑選最高優先級的相符項，而不需要任何迴圈。

---

### 建立 CSV 表格 (Create CSV Table，陣列 → CSV 字串)

將物件陣列轉換為 CSV 格式的字串 — 無須呼叫連接器，無須撰寫程式碼。
在「選取 (Select)」或「篩選陣列 (Filter Array)」之後使用，以匯出資料或將其傳遞給檔案寫入動作。

```json
"Create_CSV": {
  "type": "Table",
  "runAfter": {},
  "inputs": {
    "from": "@body('Select_Output_Columns')",
    "format": "CSV"
  }
}
```

結果參考：`@body('Create_CSV')` — 包含標題列 + 資料列的純字串。

```json
// 自定義資料欄順序 / 重新命名標題：
"Create_CSV_Custom": {
  "type": "Table",
  "inputs": {
    "from": "@body('Select_Output_Columns')",
    "format": "CSV",
    "columns": [
      { "header": "日期",        "value": "@item()?['transactionDate']" },
      { "header": "金額",        "value": "@item()?['amount']" },
      { "header": "說明",        "value": "@item()?['description']" }
    ]
  }
}
```

> 如果沒有 `columns`，標題將取自來源陣列中的物件屬性名稱。使用 `columns`，您可以明確控制標題名稱和資料欄順序。
>
> 輸出是一個原始字串。使用 `CreateFile` 或 `UpdateFile` 將其寫入檔案 (將 `body` 設定為 `@body('Create_CSV')`)，或使用 `SetVariable` 儲存在變數中。
>
> 如果來源資料來自 Power BI 的 `ExecuteDatasetQuery`，資料欄名稱將被包裝在方括號中 (例如 `[Amount]`)。在寫入前將其移除：`@replace(replace(body('Create_CSV'),'[',''),']','')`

---

### range() + Select 用於產生陣列

`range(0, N)` 會產生一個整數序列 `[0, 1, 2, …, N-1]`。透過「選取 (Select)」動作對其進行管線處理，即可在不使用迴圈的情況下產生日期系列、索引格線或任何計算後的陣列：

```json
// 從基準日期開始產生 14 個連續日期
"Generate_Date_Series": {
  "type": "Select",
  "inputs": {
    "from": "@range(0, 14)",
    "select": "@addDays(outputs('Base_Date'), item(), 'yyyy-MM-dd')"
  }
}
```

結果：`@body('Generate_Date_Series')` → `["2025-01-06", "2025-01-07", …, "2025-01-19"]`

```json
// 使用算術索引將 2D 陣列 (列 × 欄) 扁平化為 1D
"Flatten_Grid": {
  "type": "Select",
  "inputs": {
    "from": "@range(0, mul(length(outputs('Rows')), length(outputs('Cols'))))",
    "select": {
      "row": "@outputs('Rows')[div(item(), length(outputs('Cols')))]",
      "col": "@outputs('Cols')[mod(item(), length(outputs('Cols')))]"
    }
  }
}
```

> `range()` 是從零開始的。上方的笛卡兒積 (Cartesian product) 模式使用 `div(i, cols)` 作為列索引，使用 `mod(i, cols)` 作為欄索引 — 這等同於將巢狀 for 迴圈扁平化為單次執行。適用於產生時段 × 日期格線、排班 × 地點分配等。

---

### 透過 json(concat(join())) 建立動態字典 (Dynamic Dictionary)

當您在執行階段需要 O(1) 的鍵→值 (key→value) 查閱，而 Power Automate 沒有內建的字典類型時，可以使用 Select + join + json 從陣列建構一個字典：

```json
"Build_Key_Value_Pairs": {
  "type": "Select",
  "inputs": {
    "from": "@body('Get_Lookup_Items')?['value']",
    "select": "@concat('\"', item()?['Key'], '\":\"', item()?['Value'], '\"')"
  }
},
"Assemble_Dictionary": {
  "type": "Compose",
  "inputs": "@json(concat('{', join(body('Build_Key_Value_Pairs'), ','), '}'))"
}
```

查閱：`@outputs('Assemble_Dictionary')?['myKey']`

```json
// 實際範例：用於商務規則的日期 → 費率代碼查閱
"Build_Holiday_Rates": {
  "type": "Select",
  "inputs": {
    "from": "@body('Get_Holidays')?['value']",
    "select": "@concat('\"', formatDateTime(item()?['Date'], 'yyyy-MM-dd'), '\":\"', item()?['RateCode'], '\"')"
  }
},
"Holiday_Dict": {
  "type": "Compose",
  "inputs": "@json(concat('{', join(body('Build_Holiday_Rates'), ','), '}'))"
}
```

接著在迴圈內使用：`@coalesce(outputs('Holiday_Dict')?[item()?['Date']], 'Standard')`

> `json(concat('{', join(...), '}'))` 模式適用於字串值。對於數值或布林值，請省略值部分內部轉義的引號。鍵 (Key) 必須是唯一的 — 重複的鍵會無聲地覆寫先前的鍵。這取代了深度巢狀的 `if(equals(key,'A'),'X', if(equals(key,'B'),'Y', ...))` 鏈。

---

### 使用 union() 偵測欄位變更

當您需要尋找多個欄位中「任何一個」發生變更的記錄時，請針對每個欄位執行一個 `篩選陣列 (Filter Array)`，然後對結果執行 `union()`。這可以避免複雜的多條件篩選，並產生一組乾淨、已去重複的資料：

```json
"Filter_Name_Changed": {
  "type": "Query",
  "inputs": { "from": "@body('Existing_Records')",
              "where": "@not(equals(item()?['name'], item()?['dest_name']))" }
},
"Filter_Status_Changed": {
  "type": "Query",
  "inputs": { "from": "@body('Existing_Records')",
              "where": "@not(equals(item()?['status'], item()?['dest_status']))" }
},
"All_Changed": {
  "type": "Compose",
  "inputs": "@union(body('Filter_Name_Changed'), body('Filter_Status_Changed'))"
}
```

結果參考：`@outputs('All_Changed')` — 已去重複的資料列陣列，其中包含任何發生變更的資料。

> `union()` 會根據物件身份進行去重複處理，因此在兩個欄位中皆發生變更的資料列只會出現一次。視需要將更多 `Filter_*_Changed` 輸入加入 `union()`：`@union(body('F1'), body('F2'), body('F3'))`

---

### 檔案內容變更控制門 (File-Content Change Gate)

在對檔案或 Blob 執行昂貴的處理之前，先將其目前內容與儲存的基準線 (baseline) 進行比較。如果沒有任何變更則完全跳過 — 這使得同步流程具有冪等性 (idempotent)，且可以安全地重新執行或進行密集的排程。

```json
"Get_File_From_Source": { ... },
"Get_Stored_Baseline": { ... },
"Condition_File_Changed": {
  "type": "If",
  "expression": {
    "not": {
      "equals": [
        "@base64(body('Get_File_From_Source'))",
        "@body('Get_Stored_Baseline')"
      ]
    }
  },
  "actions": {
    "Update_Baseline": { "...": "使用新內容覆寫儲存的複本" },
    "Process_File":    { "...": "所有昂貴的工作都在此執行" }
  },
  "else": { "actions": {} }
}
```

> 將基準線作為檔案儲存在 SharePoint 或 Blob 儲存體中 — 在比較之前對即時內容進行 `base64()` 編碼，以便統處理二進位與文字檔案。在處理 **之前** 寫入新的基準線，這樣在部分失敗後重新執行時就不會再次處理同一個檔案。

---

### 用於同步的集聯 (Set-Join) (無需巢狀迴圈的更新偵測)

在將來源集合同步到目的地 (例如 API 回應 → SharePoint 清單、CSV → 資料庫) 時，應避免使用巢狀的 `套用至各個 (Apply to each)` 迴圈來尋找變更的記錄。相反地，應 **投影扁平鍵陣列 (flat key arrays)** 並使用 `contains()` 執行集合運算 — 零巢狀迴圈，且最終的迴圈只會處理變更的項目。

**完整的插入/更新/刪除同步模式：**

```json
// 步驟 1 — 從目的地 (例如 SharePoint) 投影一個扁平鍵陣列
"Select_Dest_Keys": {
  "type": "Select",
  "inputs": {
    "from": "@outputs('Get_Dest_Items')?['body/value']",
    "select": "@item()?['Title']"
  }
}
// → ["KEY1", "KEY2", "KEY3", ...]

// 步驟 2 — 插入 (INSERT)：索引鍵不在目的地中的來源資料列
"Filter_To_Insert": {
  "type": "Query",
  "inputs": {
    "from": "@body('Source_Array')",
    "where": "@not(contains(body('Select_Dest_Keys'), item()?['key']))"
  }
}
// → 對每個 Filter_To_Insert 套用 → CreateItem

// 步驟 3 — 內部聯結 (INNER JOIN)：目的地中已存在的來源資料列
"Filter_Already_Exists": {
  "type": "Query",
  "inputs": {
    "from": "@body('Source_Array')",
    "where": "@contains(body('Select_Dest_Keys'), item()?['key'])"
  }
}

// 步驟 4 — 更新 (UPDATE)：針對每個追蹤欄位執行一個篩選器，然後聯結它們
"Filter_Field1_Changed": {
  "type": "Query",
  "inputs": {
    "from": "@body('Filter_Already_Exists')",
    "where": "@not(equals(item()?['field1'], item()?['dest_field1']))"
  }
}
"Filter_Field2_Changed": {
  "type": "Query",
  "inputs": {
    "from": "@body('Filter_Already_Exists')",
    "where": "@not(equals(item()?['field2'], item()?['dest_field2']))"
  }
}
"Union_Changed": {
  "type": "Compose",
  "inputs": "@union(body('Filter_Field1_Changed'), body('Filter_Field2_Changed'))"
}
// → 任何追蹤欄位有差異的資料列

// 步驟 5 — 解析變更資料列的目的地識別碼 (無巢狀迴圈)
"Select_Changed_Keys": {
  "type": "Select",
  "inputs": { "from": "@outputs('Union_Changed')", "select": "@item()?['key']" }
}
"Filter_Dest_Items_To_Update": {
  "type": "Query",
  "inputs": {
    "from": "@outputs('Get_Dest_Items')?['body/value']",
    "where": "@contains(body('Select_Changed_Keys'), item()?['Title'])"
  }
}
// 步驟 6 — 僅針對變更的項目進行單次迴圈
"Apply_to_each_Update": {
  "type": "Foreach",
  "foreach": "@body('Filter_Dest_Items_To_Update')",
  "actions": {
    "Get_Source_Row": {
      "type": "Query",
      "inputs": {
        "from": "@outputs('Union_Changed')",
        "where": "@equals(item()?['key'], items('Apply_to_each_Update')?['Title'])"
      }
    },
    "Update_Item": {
      "...": "...",
      "id": "@items('Apply_to_each_Update')?['ID']",
      "item/field1": "@first(body('Get_Source_Row'))?['field1']"
    }
  }
}

// 步驟 7 — 刪除 (DELETE)：不在來源中的目的地索引鍵
"Select_Source_Keys": {
  "type": "Select",
  "inputs": { "from": "@body('Source_Array')", "select": "@item()?['key']" }
}
"Filter_To_Delete": {
  "type": "Query",
  "inputs": {
    "from": "@outputs('Get_Dest_Items')?['body/value']",
    "where": "@not(contains(body('Select_Source_Keys'), item()?['Title']))"
  }
}
// → 對每個 Filter_To_Delete 套用 → DeleteItem
```

> **為何這優於巢狀迴圈**：單純的做法 (針對每個目的地項目掃描來源) 是 O(n × m)，在處理大型清單時會很快達到 Power Automate 的 10 萬次動作執行限制。此模式是 O(n + m)：一次傳遞來建構索引鍵陣列，每個篩選器一次傳遞。步驟 6 中的更新迴圈僅疊代 *變更過* 的記錄 — 通常只是整個集合的一小部分。在 **平行範圍 (parallel Scopes)** 中執行步驟 2/4/7 以進一步提高速度。

---

### 第一個或 Null 的單列查閱

對結果陣列使用 `first()` 來擷取一條記錄而不使用迴圈。
接著對輸出進行 Null 檢查，以管控下游動作。

```json
"Get_First_Match": {
  "type": "Compose",
  "runAfter": { "Get_SP_Items": ["Succeeded"] },
  "inputs": "@first(outputs('Get_SP_Items')?['body/value'])"
}
```

在「條件」中，使用 **`@null` 常值** (而非 `empty()`) 測試是否不相符：

```json
"Condition": {
  "type": "If",
  "expression": {
    "not": {
      "equals": [
        "@outputs('Get_First_Match')",
        "@null"
      ]
    }
  }
}
```

存取相符資料列上的欄位：`@outputs('Get_First_Match')?['FieldName']`

> 當您只需要一條相符記錄時，請使用此方式代替 `套用至各個 (Apply to each)`。對空陣列執行 `first()` 會傳回 `null`；`empty()` 是用於陣列/字串而非純量 — 對 `first()` 結果使用它會導致執行階段錯誤。

---

## HTTP 與剖析 (Parsing)

### HTTP 動作 (外部 API)

```json
"Call_External_API": {
  "type": "Http",
  "runAfter": {},
  "inputs": {
    "method": "POST",
    "uri": "https://api.example.com/endpoint",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer @{variables('apiToken')}"
    },
    "body": {
      "data": "@outputs('Compose_Payload')"
    },
    "retryPolicy": {
      "type": "Fixed",
      "count": 3,
      "interval": "PT10S"
    }
  }
}
```

回應參考：`@outputs('Call_External_API')?['body']`

#### 變體：ActiveDirectoryOAuth (服務對服務)

對於呼叫需要 Azure AD 用戶端認證 (例如 Microsoft Graph) 的 API，請使用內嵌 (in-line) OAuth 而非 Bearer 權杖變數：

```json
"Call_Graph_API": {
  "type": "Http",
  "runAfter": {},
  "inputs": {
    "method": "GET",
    "uri": "https://graph.microsoft.com/v1.0/users?$search=\"employeeId:@{variables('Code')}\"&$select=id,displayName",
    "headers": {
      "Content-Type": "application/json",
      "ConsistencyLevel": "eventual"
    },
    "authentication": {
      "type": "ActiveDirectoryOAuth",
      "authority": "https://login.microsoftonline.com",
      "tenant": "<租戶-識別碼>",
      "audience": "https://graph.microsoft.com",
      "clientId": "<應用程式-註冊識別碼>",
      "secret": "@parameters('graphClientSecret')"
    }
  }
}
```

> **使用時機**：在不使用進階連接器的情況下，從流程中呼叫 Microsoft Graph、Azure Resource Manager 或任何受 Azure AD 保護的 API。
>
> `authentication` 區塊會透明地處理整個 OAuth 用戶端認證流程 — 無須手動獲取權杖。
>
> Graph `$search` 查詢需要 `ConsistencyLevel: eventual`。若不執行此設定，`$search` 會傳回 400。
>
> 對於 PATCH/PUT 寫入，同樣的 `authentication` 區塊也適用 — 只要變更 `method` 並加入 `body` 即可。
>
> ⚠️ **切勿將 `secret` 寫死在行內**。請使用 `@parameters('graphClientSecret')` 並在流程的 `parameters` 區塊中宣告它 (類型為 `securestring`)。這可以防止祕密出現在執行歷程記錄中，或透過 `get_live_flow` 被讀取。如下宣告參數：
> ```json
> "parameters": {
>   "graphClientSecret": { "type": "securestring", "defaultValue": "" }
> }
> ```
> 然後透過流程連線或環境變數傳遞實際數值 — 切勿提交至原始碼控制系統。

---

### HTTP 回應 (傳回給呼叫端)

用於 HTTP 觸發的流程，以便將結構化回覆傳回給呼叫端。必須在流程逾時 (同步 HTTP 預設為 2 分鐘) 之前執行。

```json
"Response": {
  "type": "Response",
  "runAfter": {},
  "inputs": {
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "status": "success",
      "message": "@{outputs('Compose_Result')}"
    }
  }
}
```

> **PowerApps / 低程式碼呼叫端模式**：一律傳回 `statusCode: 200` 並在本文中包含 `status` 欄位 (`"success"` / `"error"`)。PowerApps HTTP 動作無法優雅地處理非 2xx 的回應 — 呼叫端應檢查 `body.status` 而非 HTTP 狀態碼。
>
> 使用多個「回應 (Response)」動作 — 每個路徑一個 — 以便每個路徑傳回適當的訊息。每次執行只會執行其中一個。

---

### 子流程呼叫 (Parent→Child，透過 HTTP POST)

Power Automate 支援父流程透過直接呼叫子流程的 HTTP 觸發程序 URL 來進行協作。父流程會傳送 HTTP POST 並封鎖，直到子流程傳回「回應 (Response)」動作。子流程使用 `manual` (Request) 觸發程序。

```json
// 父流程 — 呼叫子流程並等待其回應
"Call_Child_Flow": {
  "type": "Http",
  "inputs": {
    "method": "POST",
    "uri": "https://prod-XX.australiasoutheast.logic.azure.com:443/workflows/<工作流程識別碼>/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=<SAS>",
    "headers": { "Content-Type": "application/json" },
    "body": {
      "ID": "@triggerBody()?['ID']",
      "WeekEnd": "@triggerBody()?['WeekEnd']",
      "Payload": "@variables('dataArray')"
    },
    "retryPolicy": { "type": "none" }
  },
  "operationOptions": "DisableAsyncPattern",
  "runtimeConfiguration": {
    "contentTransfer": { "transferMode": "Chunked" }
  },
  "limit": { "timeout": "PT2H" }
}
```

```json
// 子流程 — 手動觸發程序接收 JSON 本文
// (觸發程序定義)
"manual": {
  "type": "Request",
  "kind": "Http",
  "inputs": {
    "schema": {
      "type": "object",
      "properties": {
        "ID": { "type": "string" },
        "WeekEnd": { "type": "string" },
        "Payload": { "type": "array" }
      }
    }
  }
}

// 子流程 — 將結果傳回給父流程
"Response_Success": {
  "type": "Response",
  "inputs": {
    "statusCode": 200,
    "headers": { "Content-Type": "application/json" },
    "body": { "Result": "Success", "Count": "@length(variables('processed'))" }
  }
}
```

> **`retryPolicy: none`** — 在父流程的 HTTP 呼叫中至關重要。若無此設定，子流程逾時會觸發重試，進而產生重複的子流程執行。
>
> **`DisableAsyncPattern`** — 防止父流程將「202 已接受 (Accepted)」視為完成。父流程將會封鎖，直到子流程傳送其「回應 (Response)」。
>
> **`transferMode: Chunked`** — 當向子流程傳遞大型陣列 (>100 KB) 時啟用；可以避免請求大小限制。
>
> **`limit.timeout: PT2H`** — 針對長時間執行的子流程調高預設的 2 分鐘 HTTP 逾時。最大值為 PT24H。
>
> 子流程的觸發程序 URL 包含一個驗證呼叫的 SAS 權杖 (`sig=...`)。請從子流程的觸發程序屬性面板中複製。如果刪除並重新建立觸發程序，URL 將會變更。

---

### 剖析 JSON (Parse JSON)

```json
"Parse_Response": {
  "type": "ParseJson",
  "runAfter": {},
  "inputs": {
    "content": "@outputs('Call_External_API')?['body']",
    "schema": {
      "type": "object",
      "properties": {
        "id": { "type": "integer" },
        "name": { "type": "string" },
        "items": {
          "type": "array",
          "items": { "type": "object" }
        }
      }
    }
  }
}
```

存取剖析後的數值：`@body('Parse_Response')?['name']`

---

### 手動將 CSV 轉為 JSON (無須進階動作)

僅使用內建運算式將原始 CSV 字串剖析為物件陣列。可以避免使用進階的「剖析 CSV」連接器動作。

```json
"Delimiter": {
  "type": "Compose",
  "inputs": ","
},
"Strip_Quotes": {
  "type": "Compose",
  "inputs": "@replace(body('Get_File_Content'), '\"', '')"
},
"Detect_Line_Ending": {
  "type": "Compose",
  "inputs": "@if(equals(indexOf(outputs('Strip_Quotes'), decodeUriComponent('%0D%0A')), -1), if(equals(indexOf(outputs('Strip_Quotes'), decodeUriComponent('%0A')), -1), decodeUriComponent('%0D'), decodeUriComponent('%0A')), decodeUriComponent('%0D%0A'))"
},
"Headers": {
  "type": "Compose",
  "inputs": "@split(first(split(outputs('Strip_Quotes'), outputs('Detect_Line_Ending'))), outputs('Delimiter'))"
},
"Data_Rows": {
  "type": "Compose",
  "inputs": "@skip(split(outputs('Strip_Quotes'), outputs('Detect_Line_Ending')), 1)"
},
"Select_CSV_Body": {
  "type": "Select",
  "inputs": {
    "from": "@outputs('Data_Rows')",
    "select": {
      "@{outputs('Headers')[0]}": "@split(item(), outputs('Delimiter'))[0]",
      "@{outputs('Headers')[1]}": "@split(item(), outputs('Delimiter'))[1]",
      "@{outputs('Headers')[2]}": "@split(item(), outputs('Delimiter'))[2]"
    }
  }
},
"Filter_Empty_Rows": {
  "type": "Query",
  "inputs": {
    "from": "@body('Select_CSV_Body')",
    "where": "@not(equals(item()?[outputs('Headers')[0]], null))"
  }
}
```

結果：`@body('Filter_Empty_Rows')` — 以標題名稱為鍵的物件陣列。

> **`Detect_Line_Ending`** 使用 `indexOf()` 搭配 `decodeUriComponent('%0D%0A' / '%0A' / '%0D')` 自動處理 CRLF (Windows)、LF (Unix) 及 CR (舊式 Mac)。
>
> **「選取」中的動態鍵名**：在「選取」形狀中將 `@{outputs('Headers')[0]}` 作為 JSON 鍵，會在執行階段根據標題列設定輸出屬性名稱 — 只要運算式使用 `@{...}` 插值語法即可運作。
>
> **包含嵌入逗號的資料欄**：如果欄位值可能包含分隔符號，請在「切換」中使用 `length(split(row, ','))` 偵測資料欄數量，並手動重新組合分割片段：`@concat(split(item(),',')[1],',',split(item(),',')[2])`

---

### ConvertTimeZone (內建，無須連接器)

在時區之間轉換時間戳記，不產生 API 呼叫或連接器授權成本。
格式字串 `"g"` 會產生簡短的地區日期+時間 (`M/d/yyyy h:mm tt`)。

```json
"Convert_to_Local_Time": {
  "type": "Expression",
  "kind": "ConvertTimeZone",
  "runAfter": {},
  "inputs": {
    "baseTime": "@{outputs('UTC_Timestamp')}",
    "sourceTimeZone": "UTC",
    "destinationTimeZone": "Taipei Standard Time",
    "formatString": "g"
  }
}
```

結果參考：`@body('Convert_to_Local_Time')` — 與大多數動作不同，**不是** `outputs()`。

常見的 `formatString` 數值：`"g"` (簡短)、`"f"` (完整)、`"yyyy-MM-dd"`、`"HH:mm"`

常見的時區字串：`"UTC"`、`"AUS Eastern Standard Time"`、`"Taipei Standard Time"`、
`"Singapore Standard Time"`、`"GMT Standard Time"`

> 這是 `type: Expression, kind: ConvertTimeZone` — 一個內建的 Logic Apps 動作，而非連接器。不需要連線參考。請透過 `body()` (而非 `outputs()`) 參考輸出，否則運算式將傳回 null。
