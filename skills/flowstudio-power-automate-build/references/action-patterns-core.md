# FlowStudio MCP — 動作模式：核心 (Core)

Power Automate 流程定義中的變數、控制流程與運算式模式。

> 所有範例皆假設 `"runAfter"` 已正確設定。
> 請將 `<connectionName>` 取代為您在 `connectionReferences` 對應表 (map) 中使用的 **鍵 (key)**
> (例如 `shared_teams`、`shared_office365`) — **不是** 連線 GUID。

---

## 資料與變數

### 組合 (Compose，儲存數值)

```json
"Compose_My_Value": {
  "type": "Compose",
  "runAfter": {},
  "inputs": "@variables('myVar')"
}
```

參考：`@outputs('Compose_My_Value')`

---

### 初始化變數 (Initialize Variable)

```json
"Init_Counter": {
  "type": "InitializeVariable",
  "runAfter": {},
  "inputs": {
    "variables": [{
      "name": "counter",
      "type": "Integer",
      "value": 0
    }]
  }
}
```

類型：`"Integer"`、`"Float"`、`"Boolean"`、`"String"`、`"Array"`、`"Object"`

---

### 設定變數 (Set Variable)

```json
"Set_Counter": {
  "type": "SetVariable",
  "runAfter": {},
  "inputs": {
    "name": "counter",
    "value": "@add(variables('counter'), 1)"
  }
}
```

---

### 附加至陣列變數 (Append to Array Variable)

```json
"Collect_Item": {
  "type": "AppendToArrayVariable",
  "runAfter": {},
  "inputs": {
    "name": "resultArray",
    "value": "@item()"
  }
}
```

---

### 遞增變數 (Increment Variable)

```json
"Increment_Counter": {
  "type": "IncrementVariable",
  "runAfter": {},
  "inputs": {
    "name": "counter",
    "value": 1
  }
}
```

> 針對迴圈內的計數器，請使用 `IncrementVariable` (而非搭配 `add()` 的 `SetVariable`) — 它是原子性的，且能避免當變數在同一個疊代中其他地方被使用時發生運算式錯誤。`value` 可以是任何整數或運算式，例如 `@mul(item()?['Interval'], 60)`，以便將 Unix 時間戳記游標前進 N 分鐘。

---

## 控制流程 (Control Flow)

### 條件 (Condition，If/Else)

```json
"Check_Status": {
  "type": "If",
  "runAfter": {},
  "expression": {
    "and": [{ "equals": ["@item()?['Status']", "Active"] }]
  },
  "actions": {
    "Handle_Active": {
      "type": "Compose",
      "runAfter": {},
      "inputs": "有效使用者：@{item()?['Name']}"
    }
  },
  "else": {
    "actions": {
      "Handle_Inactive": {
        "type": "Compose",
        "runAfter": {},
        "inputs": "無效使用者"
      }
    }
  }
}
```

比較運算子：`equals`、`not`、`greater`、`greaterOrEquals`、`less`、`lessOrEquals`、`contains`  
邏輯運算子：`and: [...]`、`or: [...]`

---

### 切換 (Switch)

```json
"Route_By_Type": {
  "type": "Switch",
  "runAfter": {},
  "expression": "@triggerBody()?['type']",
  "cases": {
    "Case_Email": {
      "case": "email",
      "actions": { "Process_Email": { "type": "Compose", "runAfter": {}, "inputs": "email" } }
    },
    "Case_Teams": {
      "case": "teams",
      "actions": { "Process_Teams": { "type": "Compose", "runAfter": {}, "inputs": "teams" } }
    }
  },
  "default": {
    "actions": { "Unknown_Type": { "type": "Compose", "runAfter": {}, "inputs": "unknown" } }
  }
}
```

---

### 範圍 (Scope，群組化 / Try-Catch)

將相關動作封裝在一個「範圍 (Scope)」中，為它們提供一個共用名稱，在設計工具中摺疊它們，並且最重要的一點是 — 將它們的錯誤作為一個整體來處理。

```json
"Scope_Get_Customer": {
  "type": "Scope",
  "runAfter": {},
  "actions": {
    "HTTP_Get_Customer": {
      "type": "Http",
      "runAfter": {},
      "inputs": {
        "method": "GET",
        "uri": "https://api.example.com/customers/@{variables('customerId')}"
      }
    },
    "Compose_Email": {
      "type": "Compose",
      "runAfter": { "HTTP_Get_Customer": ["Succeeded"] },
      "inputs": "@outputs('HTTP_Get_Customer')?['body/email']"
    }
  }
},
"Handle_Scope_Error": {
  "type": "Compose",
  "runAfter": { "Scope_Get_Customer": ["Failed", "TimedOut"] },
  "inputs": "範圍執行失敗：@{result('Scope_Get_Customer')?[0]?['error']?['message']}"
}
```

> 參考範圍結果：`@result('Scope_Get_Customer')` 會傳回一個動作結果陣列。在後續動作上使用 `runAfter: {"MyScope": ["Failed", "TimedOut"]}` 即可建立不使用終止 (Terminate) 動作的 try/catch 語法。

---

### 對每個項目 (Foreach，循序)

```json
"Process_Each_Item": {
  "type": "Foreach",
  "runAfter": {},
  "foreach": "@outputs('Get_Items')?['body/value']",
  "operationOptions": "Sequential",
  "actions": {
    "Handle_Item": {
      "type": "Compose",
      "runAfter": {},
      "inputs": "@item()?['Title']"
    }
  }
}
```

> 除非是有意進行平行處理，否則請務必包含 `"operationOptions": "Sequential"`。

---

### 對每個項目 (Foreach，具備並行限制的平行處理)

```json
"Process_Each_Item_Parallel": {
  "type": "Foreach",
  "runAfter": {},
  "foreach": "@body('Get_SP_Items')?['value']",
  "runtimeConfiguration": {
    "concurrency": {
      "repetitions": 20
    }
  },
  "actions": {
    "HTTP_Upsert": {
      "type": "Http",
      "runAfter": {},
      "inputs": {
        "method": "POST",
        "uri": "https://api.example.com/contacts/@{item()?['Email']}"
      }
    }
  }
}
```

> 設定 `repetitions` 以控制同時處理的項目數量。實用的數值：針對外部 API 呼叫為 `5–10` (以符合速率限制)，針對內部/快速作業為 `20–50`。完全省略 `runtimeConfiguration.concurrency` 則使用平台預設值 (目前為 50)。請勿同時使用 `"operationOptions": "Sequential"` 與並行設定。

---

### 等待 (Wait，延遲)

```json
"Delay_10_Minutes": {
  "type": "Wait",
  "runAfter": {},
  "inputs": {
    "interval": {
      "count": 10,
      "unit": "Minute"
    }
  }
}
```

有效的 `unit` 數值：`"Second"`、`"Minute"`、`"Hour"`、`"Day"`

> 使用「延遲 + 重新擷取」作為重複刪除防護：等待任何競爭程序完成，然後在採取行動前重新讀取記錄。這可以避免當多個觸發程序或手動編輯在同一個項目上產生競爭時發生重複處理。

---

### 終止 (Terminate，成功或失敗)

```json
"Terminate_Success": {
  "type": "Terminate",
  "runAfter": {},
  "inputs": {
    "runStatus": "Succeeded"
  }
},
"Terminate_Failure": {
  "type": "Terminate",
  "runAfter": { "Risky_Action": ["Failed"] },
  "inputs": {
    "runStatus": "Failed",
    "runError": {
      "code": "StepFailed",
      "message": "@{outputs('Get_Error_Message')}"
    }
  }
}
```

---

### 直到 (Do Until，迴圈直到符合條件)

重複執行一個動作區塊，直到結束條件變為 true。當疊代次數無法預先得知時使用 (例如 API 分頁、遍歷時間範圍，或輪詢直到狀態變更)。

```json
"Do_Until_Done": {
  "type": "Until",
  "runAfter": {},
  "expression": "@greaterOrEquals(variables('cursor'), variables('endValue'))",
  "limit": {
    "count": 5000,
    "timeout": "PT5H"
  },
  "actions": {
    "Do_Work": {
      "type": "Compose",
      "runAfter": {},
      "inputs": "@variables('cursor')"
    },
    "Advance_Cursor": {
      "type": "IncrementVariable",
      "runAfter": { "Do_Work": ["Succeeded"] },
      "inputs": {
        "name": "cursor",
        "value": 1
      }
    }
  }
}
```

> 務必明確設定 `limit.count` 與 `limit.timeout` — 平台預設值較低 (60 次疊代，1 小時)。對於遍歷時間範圍，請使用 `limit.count: 5000` 與 `limit.timeout: "PT5H"` (ISO 8601 持續時間)。
>
> 結束條件會在每次疊代 **之前** 進行評估。請在迴圈前初始化您的游標變數，以便條件能在第一次執行時正確評估。

---

### 透過 RequestId 關聯進行非同步輪詢 (Async Polling)

當 API 非同步啟動長時間執行的工作 (例如 Power BI 資料集重新整理、報表產生、整批匯出) 時，觸發程序呼叫會傳回一個請求識別碼 (Request ID)。從 **回應標頭 (Response Header)** 擷取該識別碼，然後輪詢篩選該精確識別碼的狀態端點：

```json
"Start_Job": {
  "type": "Http",
  "inputs": { "method": "POST", "uri": "https://api.example.com/jobs" }
},
"Capture_Request_ID": {
  "type": "Compose",
  "runAfter": { "Start_Job": ["Succeeded"] },
  "inputs": "@outputs('Start_Job')?['headers/X-Request-Id']"
},
"Initialize_Status": {
  "type": "InitializeVariable",
  "inputs": { "variables": [{ "name": "jobStatus", "type": "String", "value": "Running" }] }
},
"Poll_Until_Done": {
  "type": "Until",
  "expression": "@not(equals(variables('jobStatus'), 'Running'))",
  "limit": { "count": 60, "timeout": "PT30M" },
  "actions": {
    "Delay": { "type": "Wait", "inputs": { "interval": { "count": 20, "unit": "Second" } } },
    "Get_History": {
      "type": "Http",
      "runAfter": { "Delay": ["Succeeded"] },
      "inputs": { "method": "GET", "uri": "https://api.example.com/jobs/history" }
    },
    "Filter_This_Job": {
      "type": "Query",
      "runAfter": { "Get_History": ["Succeeded"] },
      "inputs": {
        "from": "@outputs('Get_History')?['body/items']",
        "where": "@equals(item()?['requestId'], outputs('Capture_Request_ID'))"
      }
    },
    "Set_Status": {
      "type": "SetVariable",
      "runAfter": { "Filter_This_Job": ["Succeeded"] },
      "inputs": {
        "name": "jobStatus",
        "value": "@first(body('Filter_This_Job'))?['status']"
      }
    }
  }
},
"Handle_Failure": {
  "type": "If",
  "runAfter": { "Poll_Until_Done": ["Succeeded"] },
  "expression": { "equals": ["@variables('jobStatus')", "Failed"] },
  "actions": { "Terminate_Failed": { "type": "Terminate", "inputs": { "runStatus": "Failed" } } },
  "else": { "actions": {} }
}
```

存取回應標頭：`@outputs('Start_Job')?['headers/X-Request-Id']`

> **狀態變數初始化**：在迴圈之前設定一個守衛值 (`"Running"`、`"Unknown"`)。結束條件會測試任何非守衛值的數值。這樣一來，空的輪詢結果 (工作尚未出現在歷程記錄中) 會讓變數保持不變，讓迴圈繼續執行 — 而不會意外地因 null 而結束。
>
> **擷取前先篩選**：在呼叫 `first()` 之前，務必先將歷程記錄 `篩選陣列 (Filter Array)` 為您的特定請求識別碼。歷程記錄端點會傳回所有工作；如果不進行篩選，來自其他併發工作的狀態可能會干擾您的輪詢。

---

### runAfter 回退 (Fallback，失敗 → 替代動作)

當主要動作失敗時，路由至回退動作 — 不需要使用條件 (Condition) 區塊。只需將回退動作的 `runAfter` 設定為接受來自主要動作的 `["Failed"]`：

```json
"HTTP_Get_Hi_Res": {
  "type": "Http",
  "runAfter": {},
  "inputs": { "method": "GET", "uri": "https://api.example.com/data?resolution=hi-res" }
},
"HTTP_Get_Low_Res": {
  "type": "Http",
  "runAfter": { "HTTP_Get_Hi_Res": ["Failed"] },
  "inputs": { "method": "GET", "uri": "https://api.example.com/data?resolution=low-res" }
}
```

> 後續動作可以同時接受 `["Succeeded", "Skipped"]` 的 `runAfter` 以處理任一路徑 — 請參閱下方的 **扇入聯結門 (Fan-In Join Gate)**。

---

### 扇入聯結門 (Fan-In Join Gate，合併兩個互斥的分支)

當兩個分支是互斥的 (每次執行只能有一個成功) 時，使用單一的下游動作，並接受來自 **兩個** 分支的 `["Succeeded", "Skipped"]`。無論執行了哪個分支，該門控都只會啟動一次：

```json
"Increment_Count": {
  "type": "IncrementVariable",
  "runAfter": {
    "Update_Hi_Res_Metadata":  ["Succeeded", "Skipped"],
    "Update_Low_Res_Metadata": ["Succeeded", "Skipped"]
  },
  "inputs": { "name": "LoopCount", "value": 1 }
}
```

> 這可以避免在每個分支中重複下游動作。關鍵在於：無論哪個分支被跳過，都會回報 `Skipped` — 門控會接受該狀態並執行一次。這僅在兩個分支真正互斥時 (例如一個是另一個的 `runAfter: [...Failed]`) 才能乾淨俐落地運作。

---

## 運算式 (Expressions)

### 常見運算式模式

```
Null 安全的欄位存取：       @item()?['FieldName']
Null 守衛：                 @coalesce(item()?['Name'], 'Unknown')
字串格式化：                @{variables('firstName')} @{variables('lastName')}
今天的日期：                @utcNow()
格式化日期：                @formatDateTime(utcNow(), 'dd/MM/yyyy')
加天數：                    @addDays(utcNow(), 7)
陣列長度：                  @length(variables('myArray'))
篩選陣列：                  使用「篩選陣列 (Filter array)」動作 (PA 中不存在行內篩選運算式)
聯集 (新值優先)：           @union(body('New_Data'), outputs('Old_Data'))
排序：                      @sort(variables('myArray'), 'Date')
Unix 時間戳記 → 日期：      @formatDateTime(addseconds('1970-1-1', triggerBody()?['created']), 'yyyy-MM-dd')
日期 → Unix 毫秒：          @div(sub(ticks(startOfDay(item()?['Created'])), ticks(formatDateTime('1970-01-01Z','o'))), 10000)
日期 → Unix 秒：            @div(sub(ticks(item()?['Start']), ticks('1970-01-01T00:00:00Z')), 10000000)
Unix 秒 → 日期時間：        @addSeconds('1970-01-01T00:00:00Z', int(variables('Unix')))
Coalesce 作為 no-else：     @coalesce(outputs('Optional_Step'), outputs('Default_Step'))
流程已過分鐘數：            @div(float(sub(ticks(utcNow()), ticks(outputs('Flow_Start')))), 600000000)
HH:mm 時間字串：            @formatDateTime(outputs('Local_Datetime'), 'HH:mm')
回應標頭：                  @outputs('HTTP_Action')?['headers/X-Request-Id']
陣列最大值 (依欄位)：       @reverse(sort(body('Select_Items'), 'Date'))[0]
整數天數跨度：              @int(split(dateDifference(outputs('Start'), outputs('End')), '.')[0])
ISO 週數：                  @div(add(dayofyear(addDays(subtractFromTime(date, sub(dayofweek(date),1), 'Day'), 3)), 6), 7)
將錯誤合併為字串：          @if(equals(length(variables('Errors')),0), null, concat(join(variables('Errors'),', '),' not found.'))
比較前進行正規化：          @replace(coalesce(outputs('Value'),''),'_',' ')
強健的非空檢查：            @greater(length(trim(coalesce(string(outputs('Val')), ''))), 0)
```

### 運算式中的換行符號

> **`\n` 不會在 Power Automate 運算式中產生換行。** 它會被視為字面上的反斜槓 + `n`，並會直接顯示或導致驗證錯誤。

在任何需要換行字元的地方使用 `decodeUriComponent('%0a')`：

```
換行 (LF)：   decodeUriComponent('%0a')
CRLF：        decodeUriComponent('%0d%0a')
```

範例 — 透過 `concat()` 建立多行 Teams 或電子郵件本文：
```json
"Compose_Message": {
  "type": "Compose",
  "inputs": "@concat('嗨 ', outputs('Get_User')?['body/displayName'], ',', decodeUriComponent('%0a%0a'), '您的報表已準備就緒。', decodeUriComponent('%0a'), '- 團隊敬上')"
}
```

範例 — 搭配換行分隔符號使用 `join()`：
```json
"Compose_List": {
  "type": "Compose",
  "inputs": "@join(body('Select_Names'), decodeUriComponent('%0a'))"
}
```

> 這是 Power Automate 流程定義中，在動態建構的字串中嵌入換行的唯一可靠方法 (已對 Logic Apps 執行階段進行驗證)。

---

### 陣列加總 (XPath 技巧)

Power Automate 沒有內建的 `sum()` 函式。請改對 XML 使用 XPath：

```json
"Prepare_For_Sum": {
  "type": "Compose",
  "runAfter": {},
  "inputs": { "root": { "numbers": "@body('Select_Amounts')" } }
},
"Sum": {
  "type": "Compose",
  "runAfter": { "Prepare_For_Sum": ["Succeeded"] },
  "inputs": "@xpath(xml(outputs('Prepare_For_Sum')), 'sum(/root/numbers)')"
}
```

`Select_Amounts` 必須輸出數值的扁平陣列 (先使用 **選取 (Select)** 動作擷取單一數值欄位)。其結果為一個數值，您可以直接在條件或計算中使用。

> 這是 Power Automate 中唯一不使用迴圈即可彙總 (sum/min/max) 陣列的方法。
