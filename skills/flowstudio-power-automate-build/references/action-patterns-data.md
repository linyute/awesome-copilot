# FlowStudio MCP — 動作模式：資料轉換

陣列操作、HTTP 呼叫、剖析與資料轉換模式。

> 所有範例皆假設已適當設定 "runAfter"。
> `<connectionName>` 是 `connectionReferences` 中的 **索引鍵**（例如 `shared_sharepointonline`），而非 GUID。
> GUID 應填入對應值中的 `connectionName` 屬性。

---

## 陣列操作

### Select（重新塑造 / 投影陣列）

轉換陣列中的每個項目，僅保留您需要的資料行或將其重新命名。
避免在流程的其餘部分中傳遞龐大的物件。

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

結果參照：`@body('Select_Needed_Columns')` — 直接傳回重新塑造後的物件陣列。

> 在執行迴圈或篩選前使用 Select，以減少承載大小並簡化
> 下游運算式。適用於任何陣列 — SP 結果、HTTP 回應、變數。
>
> **提示：**
> - **單一物件強制轉為陣列：** 當 API 傳回單一物件但您需要
>   Select（此動作需要陣列）時，請將其包裝：`@array(body('Get_Employee')?['data'])`。
>   輸出為 1 個元素的陣列 — 透過 `?[0]?['field']` 存取結果。
> - **將選用欄位正規化為 Null：** 在每個選用欄位上使用 `@if(empty(item()?['field']), null, item()?['field'])`
>   將空字串、遺漏的屬性以及空物件正規化為明確的 `null`。
>   確保一致的下游 `@equals(..., @null)` 檢查。
> - **扁平化巢狀物件：** 將巢狀屬性投影為扁平欄位：
>   ```
>   "manager_name": "@if(empty(item()?['manager']?['name']), null, item()?['manager']?['name'])"
>   ```
>   這可讓您直接與來自其他來源的扁平結構描述進行欄位層級的比較。

---

### Filter Array（篩選陣列 / Query）

將陣列篩選為符合條件的項目。對於複雜的多條件邏輯，請使用動作形式（而非 `filter()`
運算式）— 它更清晰且更容易維護。

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

結果參照：`@body('Filter_Active_Subscriptions')` — 直接取得篩選後的陣列。

> 提示：在同一個來源陣列上執行多個 Filter Array 動作以建立
> 具名的分類貯體（例如 active、being-canceled、fully-canceled），接著使用
> `coalesce(first(body('Filter_A')), first(body('Filter_B')), ...)` 來挑選
> 最高優先順序的相符項目，完全不需任何迴圈。

---

### Create CSV Table（建立 CSV 資料表：陣列 → CSV 字串）

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

結果參照：`@body('Create_CSV')` — 包含標頭列 + 資料列的純字串。

```json
// 自訂資料行順序 / 重新命名標頭：
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

> 若未指定 `columns`，標頭將取自來源陣列中的物件屬性名稱。
> 若指定 `columns`，您可以明確控制標頭名稱與資料行順序。
>
> 輸出為原始字串。使用 `CreateFile` 或 `UpdateFile` 將其寫入檔案
> （將 `body` 設定為 `@body('Create_CSV')`），或使用 `SetVariable` 儲存於變數中。
>
> 若來源資料來自 Power BI 的 `ExecuteDatasetQuery`，資料行名稱將會
> 被中括號包裝（例如 `[Amount]`）。寫入前請將其去除：
> `@replace(replace(body('Create_CSV'),'[',''),']','')`

---

### range() + Select 產生陣列

`range(0, N)` 會產生整數序列 `[0, 1, 2, …, N-1]`。透過
Select 動作進行管道傳輸，即可產生日期序列、索引網格或任何計算陣列，
無需迴圈：

```json
// 產生從基準日期開始的連續 14 天日期
"Generate_Date_Series": {
  "type": "Select",
  "inputs": {
    "from": "@range(0, 14)",
    "select": "@addDays(outputs('Base_Date'), item(), 'yyyy-MM-dd')"
  }
}
```

結果：`@body('Generate_Date_Series')` → `["2025-01-06", "2025-01-07", …, "2025-01-19"]`

若要建立笛卡兒積（Cartesian product），請反覆運算 `range(0, mul(rowCount, colCount))`，
並使用 `div(item(), colCount)` 和 `mod(item(), colCount)` 推導出索引。

---

### 透過 json(concat(join())) 建立動態字典

當您在執行階段需要 O(1) 的索引鍵→值查閱，而 Power Automate 沒有原生
字典類型時，可使用 Select + join + json 從陣列建構一個：

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

> `json(concat('{', join(...), '}'))` 模式適用於字串值。對於數值
> 或布林值，請省略值部分周圍的內部跳脫引號。
> 索引鍵必須是唯一的 — 重複的索引鍵會以無訊息方式覆寫先前的索引鍵。
> 這取代了深度巢狀的 `if(equals(key,'A'),'X', if(equals(key,'B'),'Y', ...))` 鏈結。

---

### 用於變更欄位偵測的 union()

當您需要尋找多個欄位中「任一」欄位已變更的記錄時，請針對每個欄位執行一個
`Filter Array`，並將結果以 `union()` 聯集。這可避免複雜的
多條件篩選，並產生乾淨且去重複的集合：

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

參照：`@outputs('All_Changed')` — 發生任何變更之資料列的已去重複陣列。

> `union()` 依據物件識別進行去重複，因此在兩個欄位中皆有變更的資料列
> 只會出現一次。視需要向 `union()` 新增更多 `Filter_*_Changed` 輸入：
> `@union(body('F1'), body('F2'), body('F3'))`

---

### 檔案內容變更閘道（Change Gate）

在對檔案或 Blob 執行高成本的處理之前，先將其目前內容
與已儲存的基準線進行比較。如果沒有任何變更則完全略過 — 使同步流程具備
等冪性（idempotent），並可安全地重新執行或積極進行排程。

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
    "Update_Baseline": { "...": "以新內容覆寫已儲存的複本" },
    "Process_File":    { "...": "所有高成本的工作放在這裡" }
  },
  "else": { "actions": {} }
}
```

> 將基準線儲存為 SharePoint 或 Blob 儲存體中的檔案 — 在比較之前
> 先對即時內容進行 `base64()` 編碼，以便統一生產處理二進位與文字檔案。
> 請在處理**之前**寫入新的基準線，這樣在部分失敗後重新執行時
> 就不會再次重複處理相同的檔案。

---

### 用於同步的集合聯結（無巢狀迴圈的更新偵測）

將來源集合同步至目的地時（例如 API 回應 → SharePoint 清單、
CSV → 資料庫），請避免使用巢狀 `Apply to each` 迴圈來尋找已變更的記錄。
相反地，**投影扁平鍵陣列**並使用 `contains()` 來執行集合操作 —
零巢狀迴圈，且最後的迴圈僅會處理已變更的項目。

**新增/更新/刪除同步配方：**

1. 從目的地資料列擷取 `Select_Dest_Keys`。
2. `Filter_To_Insert`：其索引鍵不存在於目的地索引鍵中的來源資料列。
3. `Filter_Already_Exists`：其索引鍵存在於目的地索引鍵中的來源資料列。
4. 針對每個比較的欄位，執行 `Filter_<Field>_Changed`；使用
   `union()` 將它們合併至 `Union_Changed`。
5. 從 `Union_Changed` 擷取 `Select_Changed_Keys`，然後在更新前將目的地資料列
   篩選為僅包含這些索引鍵。
6. `Select_Source_Keys`，然後 `Filter_To_Delete` 其索引鍵
   不存在於來源索引鍵中的目的地資料列。

這會將 O(n x m) 巢狀迴圈轉變為 O(n + m) 集合操作，並有助於避免
Power Automate 的 10 萬次動作執行限制。

---

### First-or-Null 單一資料列查閱

在結果陣列上使用 `first()` 來擷取單筆記錄，無需迴圈。
接著對輸出進行 Null 檢查以保護下游動作。

```json
"Get_First_Match": {
  "type": "Compose",
  "runAfter": { "Get_SP_Items": ["Succeeded"] },
  "inputs": "@first(outputs('Get_SP_Items')?['body/value'])"
}
```

在條件（Condition）中，使用 **`@null` 常值**（而非 `empty()`）測試是否無相符項目：

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

> 當您只需要一筆相符記錄時，請使用此方式代替 `Apply to each`。
> 空陣列上的 `first()` 會傳回 `null`；`empty()` 適用於陣列/字串，
> 而非純量 — 在 `first()` 結果上使用它會導致執行階段錯誤。

---

## HTTP 與剖析

### HTTP 動作（外部 API）

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

回應參照：`@outputs('Call_External_API')?['body']`

#### 變體：ActiveDirectoryOAuth（服務對服務）

針對呼叫需要 Azure AD 用戶端認證（例如 Microsoft Graph）的 API，
請使用內嵌 OAuth 代替 Bearer 權杖變數：

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

> **使用時機：** 從流程呼叫 Microsoft Graph、Azure Resource Manager 或任何
> 受 Azure AD 保護的 API，而無需使用進階連接器。
>
> `authentication` 區塊以透明方式處理整個 OAuth 用戶端認證流程 —
> 不需要手動權杖取得步驟。
>
> Graph `$search` 查詢需要 `ConsistencyLevel: eventual`。
> 如果沒有它，`$search` 會傳回 400。
>
> 對於 PATCH/PUT 寫入，相同的 `authentication` 區塊亦可運作 — 只要變更
> `method` 並新增 `body` 即可。
>
> ⚠️ **切勿內嵌寫死 `secret`。** 請使用 `@parameters('graphClientSecret')`
> 並在流程的 `parameters` 區塊中宣告它（類型為 `securestring`）。這
> 可防止密碼出現在執行記錄中或透過
> `get_live_flow` 被讀取。宣告該參數如下：
> ```json
> "parameters": {
>   "graphClientSecret": { "type": "securestring", "defaultValue": "" }
> }
> ```
> 然後透過流程的連線或環境變數傳遞真實的值
> — 切勿將其認可至原始碼控制項。

---

### HTTP 回應（傳回給呼叫者）

用於 HTTP 觸發的流程中，以將結構化回覆傳送回呼叫者。
必須在流程逾時前執行（同步 HTTP 預設為 2 分鐘）。

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

> **PowerApps / 低程式碼呼叫者模式**：一律傳回 `statusCode: 200`，並在本文中
> 包含 `status` 欄位（`"success"` / `"error"`）。PowerApps HTTP 動作
> 無法適當處理非 2xx 回應 — 呼叫者應檢查
> `body.status` 而非 HTTP 狀態碼。
>
> 使用多個 Response 動作 — 每個分支一個 — 讓每個路徑傳回
> 適當的訊息。每次執行僅會執行其中一個。

---

### 子流程呼叫（父→子透過 HTTP POST）

Power Automate 支援父→子協調流程，方式是直接呼叫子流程的
HTTP 觸發程序 URL。父流程傳送 HTTP POST 並封鎖，直到
子流程傳回 `Response` 動作。子流程使用 `manual`（Request）觸發程序。

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

> **`retryPolicy: none`** — 在父流程的 HTTP 呼叫中至關重要。若沒有它，子流程
> 逾時將會觸發重試，進而繁衍出重複的子流程執行。
>
> **`DisableAsyncPattern`** — 防止父流程將 202 Accepted 視為
> 完成。父流程將會封鎖，直到子流程傳送其 `Response` 為止。
>
> **`transferMode: Chunked`** — 當傳遞大型陣列（>100 KB）給子流程時啟用；
> 可避免超出要求大小限制。
>
> **`limit.timeout: PT2H`** — 針對長時間執行的子流程，提高預設的 2 分鐘
> HTTP 逾時。最大值為 PT24H。
>
> 子流程的觸發程序 URL 包含用來驗證呼叫的 SAS 權杖（`sig=...`）。
> 請從子流程的觸發程序屬性窗格中複製它。若觸發程序被刪除並
> 重新建立，該 URL 將會變更。

---

### Parse JSON（剖析 JSON）

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

存取剖析後的值：`@body('Parse_Response')?['name']`

---

### 手動 CSV → JSON（無進階動作）

僅使用內建運算式將原始 CSV 字串剖析為物件陣列。
避免使用進階的「Parse CSV」連接器動作。

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

結果：`@body('Filter_Empty_Rows')` — 以標頭名稱作為索引鍵的物件陣列。

附註：`Detect_Line_Ending` 可處理 CRLF/LF/CR。`Select` 中的動態索引鍵需要
`@{...}` 內插。此簡易模式無法安全剖析含有內嵌分隔符號的
以引號包覆的欄位；針對此類情況，請使用專用剖析器或自訂動作。

---

### ConvertTimeZone（內建，無連接器）

在時區之間轉換時間戳記，無需 API 呼叫或連接器授權費用。
格式字串 `"g"` 會產生簡短的地區設定日期+時間（`M/d/yyyy h:mm tt`）。

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

結果參照：`@body('Convert_to_Local_Time')` — 與大多數動作不同，**不是** `outputs()`。

常用 `formatString` 值：`"g"`（簡短）、`"f"`（完整）、`"yyyy-MM-dd"`、`"HH:mm"`

常用時區字串：`"UTC"`、`"AUS Eastern Standard Time"`、`"Taipei Standard Time"`、
`"Singapore Standard Time"`、`"GMT Standard Time"`

> 這是 `type: Expression, kind: ConvertTimeZone` — 一個內建的 Logic Apps 動作，
> 而非連接器。無需連線參照。請透過
> `body()`（而非 `outputs()`）參照輸出，否則運算式將傳回 null。
