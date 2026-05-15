# FlowStudio MCP — 動作模式：資料轉換

陣列作業、HTTP 呼叫、解析和資料轉換模式。

> 所有範例皆假設已適當設定 `"runAfter"`。
> `<connectionName>` 是 `connectionReferences` 中的 **鍵** (例如 `shared_sharepointonline`)，而不是 GUID。
> GUID 應放在對應表值的 `connectionName` 屬性中。

---

## 陣列作業

### 選取 (Select) (重塑 / 投影陣列)

轉換陣列中的每個項目，僅保留您需要的資料欄位或重新命名它們。
可避免在流程的其餘部分攜帶大型物件。

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

結果參考：`@body('Select_Needed_Columns')` — 傳回重塑後物件的直接陣列。

> 在執行迴圈或篩選之前使用「選取」動作，可以減小承載資料的大小並簡化下游運算式。適用於任何陣列 — SharePoint 結果、HTTP 回應、變數。
>
> **提示：**
> - **單一物件強制轉換為陣列**：當 API 傳回單一物件但您需要「選取」動作（該動作需要陣列）時，請將其包裝起來：`@array(body('Get_Employee')?['data'])`。輸出是一個包含 1 個元素的陣列 — 透過 `?[0]?['field']` 存取結果。
> - **選用欄位的 Null 標準化**：在每個選用欄位上使用 `@if(empty(item()?['field']), null, item()?['field'])`，將空字串、缺失屬性和空物件標準化為明確的 `null`。確保下游 `@equals(..., @null)` 檢查的一致性。
> - **展平巢狀物件**：將巢狀屬性投影到扁平欄位中：
>   ```
>   "manager_name": "@if(empty(item()?['manager']?['name']), null, item()?['manager']?['name'])"
>   ```
>   這樣可以實現與來自其他來源的扁平結構進行直接的欄位級比較。

---

### 篩選陣列 (Filter Array) (查詢)

將陣列篩選為符合條件的項目。對於複雜的多條件邏輯，請使用動作形式（而不是 `filter()` 運算式）— 這樣更清晰且更易於維護。

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

結果參考：`@body('Filter_Active_Subscriptions')` — 直接篩選後的陣列。

> 提示：在同一個來源陣列上執行多個「篩選陣列」動作，以建立具名的分組（例如 active、being-canceled、fully-canceled），然後使用 `coalesce(first(body('Filter_A')), first(body('Filter_B')), ...)` 以在不使用任何迴圈的情況下選取優先級最高的相符項。

---

### 建立 CSV 表格 (Create CSV Table) (陣列 → CSV 字串)

將物件陣列轉換為 CSV 格式的字串 — 無需連接器呼叫，無需程式碼。
在 `Select` 或 `Filter Array` 之後使用，以匯出資料或將其傳遞給檔案寫入動作。

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

結果參考：`@body('Create_CSV')` — 一個包含標題列 + 資料列的純字串。

```json
// 自定義資料欄順序 / 重新命名標題：
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

> 如果沒有 `columns`，標題將從來源陣列中的物件屬性名稱取得。
> 使用 `columns` 時，您可以明確控制標題名稱和資料欄順序。
>
> 輸出是一個原始字串。使用 `CreateFile` 或 `UpdateFile` 將其寫入檔案（將 `body` 設定為 `@body('Create_CSV')`），或使用 `SetVariable` 儲存在變數中。
>
> 如果來源資料來自 Power BI 的 `ExecuteDatasetQuery`，資料欄名稱將被包裝在方括號中 (例如 `[Amount]`)。在寫入之前將其移除：
> `@replace(replace(body('Create_CSV'),'[',''),']','')`

---

### range() + Select 用於產生陣列

`range(0, N)` 產生一個整數序列 `[0, 1, 2, …, N-1]`。將其透過「選取」動作引導，即可在不使用迴圈的情況下產生日期系列、索引網格或任何計算出的陣列：

```json
// 從基準日期開始產生連續 14 個日期
"Generate_Date_Series": {
  "type": "Select",
  "inputs": {
    "from": "@range(0, 14)",
    "select": "@addDays(outputs('Base_Date'), item(), 'yyyy-MM-dd')"
  }
}
```

結果：`@body('Generate_Date_Series')` → `["2025-01-06", "2025-01-07", …, "2025-01-19"]`

對於笛卡兒積 (Cartesian products)，反覆運算 `range(0, mul(rowCount, colCount))`，並使用 `div(item(), colCount)` 和 `mod(item(), colCount)` 推導索引。

---

### 透過 json(concat(join())) 建立動態字典

當您在執行階段需要 O(1) 的 索引鍵→值 查閱，而 Power Automate 沒有原生的字典類型時，可以使用 Select + join + json 從陣列建構一個：

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

> `json(concat('{', join(...), '}'))` 模式適用於字串值。對於數字或布林值，請省略值部分的內部逸出引號。
> 索引鍵必須是唯一的 — 重複的索引鍵會默默地覆寫先前的索引鍵。
> 此方法可取代深層巢狀的 `if(equals(key,'A'),'X', if(equals(key,'B'),'Y', ...))` 鏈。

---

### union() 用於偵測變更欄位

當您需要尋找多個欄位中 *任一* 個已變更的記錄時，請針對每個欄位執行一次「篩選陣列」，並對結果執行 `union()`。這可避免複雜的多條件篩選，並產生乾淨的去重複集合：

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

參考：`@outputs('All_Changed')` — 發生任何變更的資料列去重複陣列。

> `union()` 會根據物件身分進行去重複，因此兩個欄位都發生變更的資料列只會出現一次。根據需要向 `union()` 新增更多 `Filter_*_Changed` 輸入：
> `@union(body('F1'), body('F2'), body('F3'))`

---

### 檔案內容變更閘道

在對檔案或 Blob 執行昂貴的處理之前，將其目前的內容與儲存的基準線進行比較。如果沒有任何變更，則完全跳過 — 使同步流程具有等冪性 (idempotent)，且可以安全地重新執行或積極排程。

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
    "Update_Baseline": { "...": "以新內容覆寫儲存的複本" },
    "Process_File":    { "...": "所有昂貴的工作都在這裡執行" }
  },
  "else": { "actions": {} }
}
```

> 將基準線作為檔案儲存在 SharePoint 或 Blob 儲存體中 — 在比較前對即時內容進行 `base64()` 編碼，以便統一套用處理二進位和文字檔案。
> 在處理 **之前** 寫入新的基準線，以便在部分失敗後重新執行時不會再次處理同一個檔案。

---

### 用於同步的集合聯結 (Set-Join) (不使用巢狀迴圈偵測更新)

將來源集合同步到目的地（例如 API 回應 → SharePoint 清單、CSV → 資料庫）時，請避免使用巢狀的 `Apply to each` 迴圈來尋找變更的記錄。
相反地，請 **投影扁平的索引鍵陣列** 並使用 `contains()` 執行集合運算 — 零巢狀迴圈，且最終迴圈僅處理變更的項目。

**插入/更新/刪除同步配方：**

1. 從目的地資料列 `Select_Dest_Keys`。
2. `Filter_To_Insert`：索引鍵不在目的地索引鍵中的來源資料列。
3. `Filter_Already_Exists`：索引鍵在目的地索引鍵中的來源資料列。
4. 針對每個比較的欄位，執行 `Filter_<Field>_Changed`；使用 `union()` 將它們合併為 `Union_Changed`。
5. 從 `Union_Changed` `Select_Changed_Keys`，然後在更新前將目的地資料列篩選為僅包含那些索引鍵。
6. `Select_Source_Keys`，然後 `Filter_To_Delete` 索引鍵不在來源索引鍵中的目的地資料列。

這將 O(n x m) 的巢狀迴圈改為 O(n + m) 的集合運算，並有助於避免 Power Automate 的 10 萬次動作執行限制。

---

### 第一個或 Null 單列查閱 (First-or-Null Single-Row Lookup)

在結果陣列上使用 `first()` 以在不使用迴圈的情況下擷取一筆記錄。
然後對輸出進行 Null 檢查以保護下游動作。

```json
"Get_First_Match": {
  "type": "Compose",
  "runAfter": { "Get_SP_Items": ["Succeeded"] },
  "inputs": "@first(outputs('Get_SP_Items')?['body/value'])"
}
```

在「條件」中，使用 **`@null` 常值**（而不是 `empty()`）測試是否不相符：

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

存取相符列上的欄位：`@outputs('Get_First_Match')?['FieldName']`

> 當您只需要一筆相符的記錄時，請使用此動作而不是 `Apply to each`。
> 對空陣列執行 `first()` 會傳回 `null`；`empty()` 用於陣列/字串，而非純量 (scalar) — 對 `first()` 結果使用它會導致執行階段錯誤。

---

## HTTP 與解析

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

對於呼叫需要 Azure AD 用戶端認證 (client-credentials) 的 API (例如 Microsoft Graph)，請使用行內 OAuth 而不是 Bearer 權杖變數：

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

> **何時使用**：在不使用進階連接器的情況下，從流程呼叫 Microsoft Graph、Azure Resource Manager 或任何受 Azure AD 保護的 API。
>
> `authentication` 區塊會透明地處理整個 OAuth 用戶端認證流程 — 不需要手動獲取權杖的步驟。
>
> Graph `$search` 查詢需要 `ConsistencyLevel: eventual`。若沒有它，`$search` 會傳回 400。
>
> 對於 PATCH/PUT 寫入，同一個 `authentication` 區塊也適用 — 只需變更 `method` 並新增一個 `body`。
>
> ⚠️ **切勿在行內硬編碼 `secret`**。請使用 `@parameters('graphClientSecret')` 並在流程的 `parameters` 區塊中宣告它（類型為 `securestring`）。這可防止秘密出現在執行歷程記錄中或透過 `get_live_flow` 被讀取。宣告參數如下：
> ```json
> "parameters": {
>   "graphClientSecret": { "type": "securestring", "defaultValue": "" }
> }
> ```
> 然後透過流程的連線或環境變數傳遞實際值 — 絕不要將其提交到原始碼控制。

---

### HTTP 回應 (Response) (傳回給呼叫者)

用於 HTTP 觸發的流程，以將結構化回覆傳回給呼叫者。
必須在流程逾時（同步 HTTP 預設為 2 分鐘）之前執行。

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

> **PowerApps / 低程式碼呼叫者模式**：始終傳回 `statusCode: 200` 並在本文中包含 `status` 欄位 (`"success"` / `"error"`)。PowerApps HTTP 動作無法優雅地處理非 2xx 回應 — 呼叫者應檢查 `body.status` 而不是 HTTP 狀態碼。
>
> 使用多個「回應」動作 — 每個分支一個 — 讓每個路徑傳回適當的訊息。每次執行僅執行一個動作。

---

### 子流程呼叫 (Parent→Child via HTTP POST)

Power Automate 支援透過直接呼叫子流程的 HTTP 觸發 URL 進行父子協調。父流程傳送 HTTP POST 並封鎖，直到子流程傳回「回應」動作。子流程使用 `manual` (Request) 觸發器。

```json
// 父流程 — 呼叫子流程並等待其回應
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
// 子流程 — 手動觸發器接收 JSON 本文
// (觸發器定義)
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

// 子流程 — 傳回結果給父流程
"Response_Success": {
  "type": "Response",
  "inputs": {
    "statusCode": 200,
    "headers": { "Content-Type": "application/json" },
    "body": { "Result": "Success", "Count": "@length(variables('processed'))" }
  }
}
```

> **`retryPolicy: none`** — 在父流程的 HTTP 呼叫中至關重要。若沒有它，子流程逾時會觸發重試，從而產生重複的子流程執行。
>
> **`DisableAsyncPattern`** — 可防止父流程將 202 Accepted 視為完成。父流程將封鎖，直到子流程傳送其「回應」。
>
> **`transferMode: Chunked`** — 將大型陣列 (>100 KB) 傳遞給子流程時啟用；可避免要求大小限制。
>
> **`limit.timeout: PT2H`** — 對於執行時間較長的子流程，請調高預設的 2 分鐘 HTTP 逾時。上限為 PT24H。
>
> 子流程的觸發 URL 包含一個對呼叫進行驗證的 SAS 權杖 (`sig=...`)。請從子流程的觸發器屬性面板中複製它。如果刪除並重新建立觸發器，該 URL 將會變更。

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

存取解析後的值：`@body('Parse_Response')?['name']`

---

### 手動 CSV → JSON (不使用進階動作)

僅使用內建運算式將原始 CSV 字串解析為物件陣列。
可避免使用進階的「解析 CSV」連接器動作。

```json
"Delimiter": { "type": "Compose", "inputs": "," },
"Strip_Quotes": { "type": "Compose", "inputs": "@replace(body('Get_File_Content'), '\"', '')" },
"Detect_Line_Ending": {
  "type": "Compose",
  "inputs": "@if(equals(indexOf(outputs('Strip_Quotes'), decodeUriComponent('%0D%0A')), -1), if(equals(indexOf(outputs('Strip_Quotes'), decodeUriComponent('%0A')), -1), decodeUriComponent('%0D'), decodeUriComponent('%0A')), decodeUriComponent('%0D%0A'))"
},
"Headers": {
  "type": "Compose",
  "inputs": "@split(first(split(outputs('Strip_Quotes'), outputs('Detect_Line_Ending'))), outputs('Delimiter'))"
},
"Data_Rows": { "type": "Compose", "inputs": "@skip(split(outputs('Strip_Quotes'), outputs('Detect_Line_Ending')), 1)" },
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

結果：`@body('Filter_Empty_Rows')` — 以標題名稱作為索引鍵的物件陣列。

備註：`Detect_Line_Ending` 可處理 CRLF/LF/CR。`Select` 中的動態索引鍵需要 `@{...}` 插值。此簡單模式無法安全地解析包含內嵌分隔符號的帶引號欄位；對於這些情況，請使用專用的解析器或自定義動作。

---

### ConvertTimeZone (內建，不使用連接器)

在時區之間轉換時間戳記，不產生 API 呼叫或連接器授權成本。
格式字串 `"g"` 產生簡短的當地日期+時間 (`M/d/yyyy h:mm tt`)。

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

常見的 `formatString` 值：`"g"` (簡短), `"f"` (完整), `"yyyy-MM-dd"`, `"HH:mm"`

常見的時區字串：`"UTC"`, `"AUS Eastern Standard Time"`, `"Taipei Standard Time"`,
`"Singapore Standard Time"`, `"GMT Standard Time"`

> 這是 `type: Expression, kind: ConvertTimeZone` — 一個內建的 Logic Apps 動作，而不是連接器。不需要連線參考。透過 `body()` (而不是 `outputs()`) 參考輸出，否則運算式會傳回 null。
