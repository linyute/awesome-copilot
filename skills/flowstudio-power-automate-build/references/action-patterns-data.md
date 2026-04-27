# FlowStudio MCP — 動作模式：資料轉換 (Data Transforms)

陣列操作、HTTP 呼叫、解析與資料轉換模式。

> 所有範例皆假設 `"runAfter"` 已適當設定。
> `<connectionName>` 是 `connectionReferences` 中的 **鍵 (key)** (例如 `shared_sharepointonline`)，而非 GUID。
> GUID 位於對應表數值的 `connectionName` 屬性中。

---

## 陣列操作 (Array Operations)

### Select (重塑 / 投影陣列)

轉換陣列中的每個項目，僅保留您需要的欄位或對其進行重新命名。
可避免在流程後續部分攜帶大型物件。

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

結果參考：`@body('Select_Needed_Columns')` — 回傳重塑物件的直接陣列。

> 在迴圈或過濾前使用 Select 可縮減負載大小並簡化後續運算式。適用於任何陣列 — SP 結果、HTTP 回應、變數。
>
> **提示：**
> - **單一物件轉陣列強制轉換**：當 API 回傳單一物件但您需要使用 Select (需要陣列) 時，請將其包裹：`@array(body('Get_Employee')?['data'])`。輸出為單一元素陣列 — 透過 `?[0]?['field']` 存取結果。
> - **Null 標準化選用欄位**：在每個選用欄位上使用 `@if(empty(item()?['field']), null, item()?['field'])`，將空字串、遺失屬性與空物件標準化為明確的 `null`。確保後續一致的 `@equals(..., @null)` 檢查。
> - **扁平化巢狀物件**：將巢狀屬性投影為扁平欄位：
>   ```
>   "manager_name": "@if(empty(item()?['manager']?['name']), null, item()?['manager']?['name'])"
>   ```
>   這能讓來自不同來源的扁平結構描述進行欄位層級的直接比較。

---

### Filter Array (過濾陣列 / Query)

將陣列過濾為符合條件的項目。針對複雜的多條件邏輯，請使用動作形式 (而非 `filter()` 運算式) — 它更清晰且易於維護。

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

結果參考：`@body('Filter_Active_Subscriptions')` — 直接回傳過濾後的陣列。

> 提示：在同一個來源陣列上執行多個 Filter Array 動作以建立具名的桶 (例如 active, being-canceled, fully-canceled)，然後使用 `coalesce(first(body('Filter_A')), first(body('Filter_B')), ...)` 來選取優先權最高的匹配項目，而無需任何迴圈。

---

### Create CSV Table (陣列 → CSV 字串)

將物件陣列轉換為 CSV 格式字串 — 無需連接器呼叫，無需程式碼。
在 `Select` 或 `Filter Array` 後使用，以匯出資料或傳遞給檔案寫入動作。

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
// 自訂欄位順序 / 重新命名標題：
"Create_CSV_Custom": {
  "type": "Table",
  "inputs": {
    "from": "@body('Select_Output_Columns')",
    "format": "CSV",
    "columns": [
      { "header": "Date",        "value": "@item()?['transactionDate']" },
      { "header": "Amount",      "value": "@item()?['amount']" },
      { "header": "Description", "value": "@item()?['description']" }
    ]
  }
}
```

> 若無 `columns`，標題取自來源陣列中的物件屬性名稱。
> 有了 `columns`，您可以明確控制標題名稱與欄位順序。
>
> 輸出為原始字串。使用 `CreateFile` 或 `UpdateFile` 將其寫入檔案 (將 `body` 設定為 `@body('Create_CSV')`)，或使用 `SetVariable` 儲存至變數。
>
> 若來源資料來自 Power BI 的 `ExecuteDatasetQuery`，欄位名稱會被方括號包住 (例如 `[Amount]`)。寫入前請將其移除：
> `@replace(replace(body('Create_CSV'),'[',''),']','')`

---

### range() + Select 產生陣列

`range(0, N)` 產生整數序列 `[0, 1, 2, …, N-1]`。透過 Select 動作將其串流傳輸，即可產生日期序列、索引網格或任何計算陣列，無需使用迴圈：

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

> `range()` 是以 0 為起始。上述笛卡兒乘積模式使用 `div(i, cols)` 作為列索引，並使用 `mod(i, cols)` 作為欄索引 — 等同於扁平化為單次傳遞的巢狀 for-loop。適用於產生時間槽 × 日期網格、輪班 × 位置指派等。

---

### 動態字典 (透過 json(concat(join())))

當您需要在執行階段進行 O(1) 鍵值查詢，且 Power Automate 沒有原生字典型別時，請使用 Select + join + json 從陣列建立一個：

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

查詢：`@outputs('Assemble_Dictionary')?['myKey']`

```json
// 實際範例：業務規則的日期 → 費率代碼查詢
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

然後在迴圈中：`@coalesce(outputs('Holiday_Dict')?[item()?['Date']], 'Standard')`

> `json(concat('{', join(...), '}'))` 模式適用於字串值。對於數值或布林值，請省略數值部分周圍的內側跳脫引號。
> 鍵必須唯一 — 重複鍵會靜默覆寫較早的內容。
> 這取代了深度巢狀的 `if(equals(key,'A'),'X', if(equals(key,'B'),'Y', ...))` 鏈結。

---

### union() 用於偵測變更欄位

當您需要找出 *多個欄位中任一欄位* 發生變更的記錄時，請針對每個欄位執行一個 `Filter Array`，然後對結果執行 `union()`。這可避免複雜的多條件過濾，並產生乾淨的去重複集：

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

參考：`@outputs('All_Changed')` — 發生變更的列之去重複陣列。

> `union()` 透過物件識別進行去重複，因此在兩個欄位中皆有變更的列僅會出現一次。根據需要將更多 `Filter_*_Changed` 輸入新增至 `union()`：
> `@union(body('F1'), body('F2'), body('F3'))`

---

### 檔案內容變更閘道 (File-Content Change Gate)

在對檔案或 Blob 執行昂貴的處理之前，請先將其當前內容與儲存的基準 (baseline) 進行比較。若無變更則完全跳過 — 使同步流程具有冪等性 (idempotent)，並可安全地重新執行或積極地排程。

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
    "Update_Baseline": { "...": "用新內容覆寫儲存的副本" },
    "Process_File":    { "...": "所有昂貴的作業都在這裡" }
  },
  "else": { "actions": {} }
}
```

> 將基準儲存為 SharePoint 或 Blob 儲存中的檔案 — 在比較前將即時內容進行 `base64()` 編碼，以便統一處理二進位與文字檔案。
> 在處理 **之前** 寫入新的基準，如此一來在部分失敗後重新執行，就不會再次重新處理同一個檔案。

---

### Set-Join 用於同步 (無需巢狀迴圈的更新偵測)

將來源集合同步至目的地 (例如 API 回應 → SharePoint 清單，CSV → 資料庫) 時，避免使用巢狀的 `Apply to each` 迴圈來尋找變更的記錄。
反之，**投影扁平的鍵值陣列** 並使用 `contains()` 來執行集合操作 — 零巢狀迴圈，且最終迴圈僅會處理變更的項目。

**完整新增/更新/刪除同步模式：**

```json
// 步驟 1 — 從目的地 (例如 SharePoint) 投影扁平鍵值陣列
"Select_Dest_Keys": {
  "type": "Select",
  "inputs": {
    "from": "@outputs('Get_Dest_Items')?['body/value']",
    "select": "@item()?['Title']"
  }
}
// → ["KEY1", "KEY2", "KEY3", ...]

// 步驟 2 — 插入：鍵不在目的地中的來源列
"Filter_To_Insert": {
  "type": "Query",
  "inputs": {
    "from": "@body('Source_Array')",
    "where": "@not(contains(body('Select_Dest_Keys'), item()?['key']))"
  }
}
// → Apply to each Filter_To_Insert → CreateItem

// 步驟 3 — 內部聯結：存在於目的地中的來源列
"Filter_Already_Exists": {
  "type": "Query",
  "inputs": {
    "from": "@body('Source_Array')",
    "where": "@contains(body('Select_Dest_Keys'), item()?['key'])"
  }
}

// 步驟 4 — 更新：每個追蹤欄位一個過濾器，然後執行 union()
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
// → 任何追蹤欄位不同的列

// 步驟 5 — 解析變更列的目的地 ID (無需巢狀迴圈)
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
// 步驟 6 — 單一迴圈僅處理變更的項目
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

// 步驟 7 — 刪除：不在來源中的目的地鍵
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
// → Apply to each Filter_To_Delete → DeleteItem
```

> **為什麼此方法優於巢狀迴圈**：天真的方法（針對每個目的地項目，掃描來源）是 O(n × m)，在大清單上會很快達到 Power Automate 10 萬個動作的執行限制。此模式為 O(n + m)：一次傳遞以建構鍵陣列，每個過濾器一次傳遞。步驟 6 中的更新迴圈僅迭代 *已變更* 的記錄 — 這通常只是完整集合的一小部分。以 **平行 Scope** 執行步驟 2/4/7 可進一步提升速度。

---

### First-or-Null 單列查詢

對結果陣列使用 `first()` 以無需迴圈擷取一筆記錄。
然後檢查輸出的 Null 值以保護後續動作。

```json
"Get_First_Match": {
  "type": "Compose",
  "runAfter": { "Get_SP_Items": ["Succeeded"] },
  "inputs": "@first(outputs('Get_SP_Items')?['body/value'])"
}
```

在條件中，使用 **`@null` 文字** (而非 `empty()`) 來測試是否沒有匹配：

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

存取匹配列上的欄位：`@outputs('Get_First_Match')?['FieldName']`

> 當您僅需要一筆匹配記錄時，請使用此方式而非 `Apply to each`。
> 空陣列上的 `first()` 會回傳 `null`；`empty()` 用於陣列/字串，
> 而非純量 (scalars) — 在 `first()` 結果上使用它會導致執行階段錯誤。

---

## HTTP 與解析 (HTTP & Parsing)

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

對於呼叫需要 Azure AD 用戶端憑證的 API (例如 Microsoft Graph)，請使用行內 OAuth，而不是 Bearer 權杖變數：

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
      "tenant": "<tenant-id>",
      "audience": "https://graph.microsoft.com",
      "clientId": "<app-registration-id>",
      "secret": "@parameters('graphClientSecret')"
    }
  }
}
```

> **何時使用：** 從沒有進階連接器的流程呼叫 Microsoft Graph、Azure Resource Manager 或任何 Azure AD 保護的 API。
>
> `authentication` 區塊會透明地處理整個 OAuth 用戶端憑證流程 — 無需手動取得權杖的步驟。
>
> `ConsistencyLevel: eventual` 是 Graph `$search` 查詢所必需的。
> 若沒有它，`$search` 會回傳 400。
>
> 對於 PATCH/PUT 寫入，相同的 `authentication` 區塊也能運作 — 只需變更 `method` 並新增 `body`。
>
> ⚠️ **絕不要硬編碼 `secret`。** 使用 `@parameters('graphClientSecret')` 並在流程的 `parameters` 區塊中宣告它 (型別 `securestring`)。這可防止秘密出現在執行歷程記錄中，或透過 `get_live_flow` 被讀取。宣告參數如下：
> ```json
> "parameters": {
>   "graphClientSecret": { "type": "securestring", "defaultValue": "" }
> }
> ```
> 然後透過流程的連接或環境變數傳遞實際值 — 永遠不要將其提交至原始程式碼控制。

---

### HTTP 回應 (回傳給呼叫者)

用於 HTTP 觸發的流程，將結構化回覆送回呼叫者。
必須在流程逾時前執行 (同步 HTTP 預設為 2 分鐘)。

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

> **PowerApps / 低程式碼呼叫者模式**：一律回傳 `statusCode: 200` 並在本文中包含 `status` 欄位 (`"success"` / `"error"`)。PowerApps HTTP 動作無法妥善處理非 2xx 的回應 — 呼叫者應檢查 `body.status` 而非 HTTP 狀態代碼。
>
> 使用多個 Response 動作 — 每個分支一個 — 讓每個路徑都能回傳適當的訊息。每次執行僅會執行其中一個。

---

### 子流程呼叫 (Parent→Child，透過 HTTP POST)

Power Automate 支援透過直接呼叫子流程的 HTTP 觸發 URL 來進行父→子編排。父流程傳送 HTTP POST 並阻塞，直到子流程回傳 `Response` 動作。子流程使用 `manual` (Request) 觸發程序。

```json
// 父流程 — 呼叫子流程並等待回應
"Call_Child_Flow": {
  "type": "Http",
  "inputs": {
    "method": "POST",
    "uri": "https://prod-XX.australiasoutheast.logic.azure.com:443/workflows/<workflowId>/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=<SAS>",
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

// 子流程 — 回傳結果給父流程
"Response_Success": {
  "type": "Response",
  "inputs": {
    "statusCode": 200,
    "headers": { "Content-Type": "application/json" },
    "body": { "Result": "Success", "Count": "@length(variables('processed'))" }
  }
}
```

> **`retryPolicy: none`** — 在父流程的 HTTP 呼叫上非常關鍵。若無此設定，子流程逾時會觸發重試，導致產生重複的子流程執行記錄。
>
> **`DisableAsyncPattern`** — 防止父流程將 202 Accepted 視為完成。父流程會阻塞直到子流程傳送其 `Response` 為止。
>
> **`transferMode: Chunked`** — 當傳遞大型陣列 (>100 KB) 給子流程時啟用；可避免請求大小限制。
>
> **`limit.timeout: PT2H`** — 針對長時間執行的子流程提高預設的 2 分鐘 HTTP 逾時。上限為 PT24H。
>
> 子流程的觸發 URL 包含驗證呼叫的 SAS 權杖 (`sig=...`)。請從子流程觸發程序屬性面板複製它。若觸發程序被刪除並重新建立，URL 會變更。

---

### 解析 JSON (Parse JSON)

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

存取解析後的數值：`@body('Parse_Response')?['name']`

---

### 手動 CSV → JSON (無進階動作)

僅使用內建運算式將原始 CSV 字串解析為物件陣列。
避免使用進階的「Parse CSV」連接器動作。

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

> **`Detect_Line_Ending`** 使用 `indexOf()` 搭配 `decodeUriComponent('%0D%0A' / '%0A' / '%0D')` 自動處理 CRLF (Windows)、LF (Unix) 與 CR (舊版 Mac)。
>
> **`Select` 中的動態鍵名稱**：在 `Select` 形狀中作為 JSON 鍵的 `@{outputs('Headers')[0]}` 會在執行階段從標題列設定輸出屬性名稱 — 只要運算式位於 `@{...}` 插值語法中，這就能正常運作。
>
> **包含嵌入逗號的欄位**：若欄位值可能包含分隔符號，請在 Switch 中使用 `length(split(row, ','))` 來偵測欄位計數，並手動重新組合分割後的片段：`@concat(split(item(),',')[1],',',split(item(),',')[2])`

---

### ConvertTimeZone (內建，無需連接器)

在時區之間轉換時間戳記，無需 API 呼叫或連接器授權成本。
格式字串 `"g"` 產生簡短的地區日期+時間 (`M/d/yyyy h:mm tt`)。

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

結果參考：`@body('Convert_to_Local_Time')` — **不是** `outputs()` (與大多數動作不同)。

常見 `formatString` 值：`"g"` (簡短), `"f"` (完整), `"yyyy-MM-dd"`, `"HH:mm"`

常見時區字串：`"UTC"`, `"AUS Eastern Standard Time"`, `"Taipei Standard Time"`,
`"Singapore Standard Time"`, `"GMT Standard Time"`

> 這是 `type: Expression, kind: ConvertTimeZone` — 一個內建的 Logic Apps 動作，而非連接器。無需連接參考。請透過 `body()` (非 `outputs()`) 參考輸出，否則運算式會回傳 null。
