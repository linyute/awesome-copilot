# FlowStudio MCP — 動作模式：核心

Power Automate 流程定義的變數、控制流程和運算式模式。

> 所有範例皆假設已適當設定 `"runAfter"`。
> 將 `<connectionName>` 替換為您在 `connectionReferences` 對應表中使用 的 **鍵**
> (例如 `shared_teams`, `shared_office365`) — 而不是連線的 GUID。

---

## 資料與變數

### 撰寫 (Compose) (儲存值)

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

類型：`"Integer"`, `"Float"`, `"Boolean"`, `"String"`, `"Array"`, `"Object"`

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

### 附加到陣列變數 (Append to Array Variable)

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

### 累加變數 (Increment Variable)

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

> 對於迴圈內部的計數器，請使用 `IncrementVariable`（而不是配合 `add()` 使用 `SetVariable`） — 它是不可分割的 (atomic)，可避免在同一次反覆運算中的其他地方使用變數時發生運算式錯誤。`value` 可以是任何整數或運算式，例如 `@mul(item()?['Interval'], 60)`，將 Unix 時間戳記游標前進 N 分鐘。

---

## 控制流程

### 條件 (Condition) (If/Else)

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
      "inputs": "Active user: @{item()?['Name']}"
    }
  },
  "else": {
    "actions": {
      "Handle_Inactive": {
        "type": "Compose",
        "runAfter": {},
        "inputs": "Inactive user"
      }
    }
  }
}
```

比較運算子：`equals`, `not`, `greater`, `greaterOrEquals`, `less`, `lessOrEquals`, `contains`  
邏輯運算子：`and: [...]`, `or: [...]`

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

### 範圍 (Scope) (分組 / Try-Catch)

將相關動作包裝在一個範圍內，為它們提供一個共享名稱，在設計器中將其摺疊，最重要的是 — 將它們的錯誤當作一個整體來處理。

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
  "inputs": "Scope failed: @{result('Scope_Get_Customer')?[0]?['error']?['message']}"
}
```

> 參考範圍結果：`@result('Scope_Get_Customer')` 傳回一個動作結果陣列。在後續動作上使用 `runAfter: {"MyScope": ["Failed", "TimedOut"]}` 來建立 try/catch 語意，而無需使用「終止」動作。

---

### Foreach (循序)

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

> 除非是有意進行平行處理，否則請始終包含 `"operationOptions": "Sequential"`。

---

### Foreach (限制並行程度的平行處理)

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

> 設定 `repetitions` 以控制同時處理的項目數量。實用值：針對外部 API 呼叫設定為 `5–10`（遵守頻率限制），針對內部/快速操作設定為 `20–50`。完全省略 `runtimeConfiguration.concurrency` 則使用平台預設值（目前為 50）。請勿同時使用 `"operationOptions": "Sequential"` 和並行設定。

---

### 等待 (Wait) (延遲)

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

有效的 `unit` 值：`"Second"`, `"Minute"`, `"Hour"`, `"Day"`

> 使用延遲 + 重新擷取作為去重複護欄：等待任何競爭程序完成，然後在採取行動前重新讀取記錄。這可避免多個觸發器或手動編輯在同一個項目上發生競爭時出現重複處理。

---

### 終止 (Terminate) (成功或失敗)

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

### Do Until (直到條件成立前重複執行迴圈)

重複一組動作，直到結束條件變為 true。
當事先不知道反覆運算次數時使用（例如對 API 進行分頁、查閱時間範圍、輪詢直到狀態變更）。

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

> 始終明確設定 `limit.count` 和 `limit.timeout` — 平台預設值很低（60 次反覆運算，1 小時）。對於時間範圍查閱，請使用 `limit.count: 5000` 和 `limit.timeout: "PT5H"` (ISO 8601 持續時間)。
>
> 結束條件是在 **每次** 反覆運算前進行評估的。在迴圈前初始化您的游標變數，以便條件可以在第一次執行時正確評估。

---

### 代理程式重試迴圈 (Agent Retry Loop)

當流程呼叫 AI 或 Copilot 樣式的代理程式，直到達到終止結果時，請保持迴圈狀態明確：

- 在 `Until` 之前初始化變數，例如 `agentStatus`、`attempt` 和 `finalPayload`。
- 在迴圈內部呼叫代理程式、驗證回應、更新狀態，且僅在狀態為非終止時延遲/重試。
- 將最終的發送動作（例如電子郵件、SharePoint 更新或 Teams 張貼）放在迴圈之後，以便重試不會產生重複的副作用。
- 如果平台拒絕巢狀在 `Until` 內部的複雜 `Switch`，請讓迴圈主體保持簡單的驗證和狀態更新，然後在迴圈之後使用 `Switch` 進行路由。

---

### 搭配 RequestId 關聯的非同步輪詢

當 API 非同步啟動長時間執行的作業（例如 Power BI 資料集重新整理、報告產生、批次匯出）時，觸發呼叫會傳回一個要求 ID。從 **回應標頭** 中擷取它，然後透過該確切 ID 篩選來輪詢狀態端點：

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

> **狀態變數初始化**：在迴圈前設定一個哨兵值 (`"Running"`, `"Unknown"`)。結束條件測試除了哨兵值以外的任何值。這樣一來，空的輪詢結果（作業尚未進入記錄中）將保持變數不變，且迴圈會繼續 — 不會意外因 null 而退出。
>
> **擷取前先篩選**：在呼叫 `first()` 之前，務必先將歷史記錄 `Filter Array` 篩選為您的特定要求 ID。歷程記錄端點會傳回所有作業；如果不進行篩選，來自另一個並行作業的狀態可能會損壞您的輪詢。

---

### runAfter 後備方案 (失敗 → 替代動作)

當主要動作失敗時，路由到後備動作 — 無需使用條件區塊。只需在後備動作上設定 `runAfter` 以接受來自主要動作的 `["Failed"]` 即可：

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

> 後續動作可以使用同時接受 `["Succeeded", "Skipped"]` 的 `runAfter` 來處理任一路徑 — 參見下文的 **收斂彙總閘道 (Fan-In Join Gate)**。

---

### 收斂彙總閘道 (Fan-In Join Gate) (合併兩個互斥的分支)

當兩個分支互斥時（每次執行只能有一個成功），請使用單個下游動作，該動作接受來自 **兩個** 分支的 `["Succeeded", "Skipped"]`。無論執行了哪個分支，閘道都會確切觸發一次：

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

> 這可避免在每個分支中重複下游動作。關鍵洞察：被跳過的分支會報告 `Skipped` — 閘道接受該狀態並觸發一次。僅在兩個分支真正互斥（例如其中一個是另一個的 `runAfter: [...Failed]`）時，此方法才奏效。

---

## 運算式

### 常見運算式模式

```
Null 安全欄位存取：       @item()?['FieldName']
Null 保護：                @coalesce(item()?['Name'], 'Unknown')
字串格式：                 @{variables('firstName')} @{variables('lastName')}
今天的日期：               @utcNow()
格式化日期：               @formatDateTime(utcNow(), 'dd/MM/yyyy')
加天數：                   @addDays(utcNow(), 7)
陣列長度：                 @length(variables('myArray'))
篩選陣列：                 使用 "Filter array" 動作 (PA 中不存在行內篩選運算式)
聯集 (新值勝出)：          @union(body('New_Data'), outputs('Old_Data'))
排序：                     @sort(variables('myArray'), 'Date')
Unix 時間戳記 → 日期：     @formatDateTime(addseconds('1970-1-1', triggerBody()?['created']), 'yyyy-MM-dd')
日期 → Unix 毫秒：         @div(sub(ticks(startOfDay(item()?['Created'])), ticks(formatDateTime('1970-01-01Z','o'))), 10000)
日期 → Unix 秒：           @div(sub(ticks(item()?['Start']), ticks('1970-01-01T00:00:00Z')), 10000000)
Unix 秒 → 日期時間：       @addSeconds('1970-01-01T00:00:00Z', int(variables('Unix')))
Coalesce 作為 no-else：    @coalesce(outputs('Optional_Step'), outputs('Default_Step'))
流程經過的分鐘數：         @div(float(sub(ticks(utcNow()), ticks(outputs('Flow_Start')))), 600000000)
HH:mm 時間字串：           @formatDateTime(outputs('Local_Datetime'), 'HH:mm')
回應標頭：                 @outputs('HTTP_Action')?['headers/X-Request-Id']
陣列最大值 (依欄位)：      @reverse(sort(body('Select_Items'), 'Date'))[0]
整數天數跨度：             @int(split(dateDifference(outputs('Start'), outputs('End')), '.')[0])
ISO 週數：                 @div(add(dayofyear(addDays(subtractFromTime(date, sub(dayofweek(date),1), 'Day'), 3)), 6), 7)
將錯誤加入字串：           @if(equals(length(variables('Errors')),0), null, concat(join(variables('Errors'),', '),' not found.'))
比較前標準化：             @replace(coalesce(outputs('Value'),''),'_',' ')
強健的非空值檢查：         @greater(length(trim(coalesce(string(outputs('Val')), ''))), 0)
```

### 不支援 / 有風險的運算式假設

Power Automate 運算式是工作流程定義語言，而不是 JavaScript。這些模式通常看起來很合理，但無法部署或行為不如代理程式預期：

| 目標 | 避免使用 | 請改用 |
|---|---|---|
| 行內建構物件 | `createObject(...)` | 帶有 JSON 物件常值的撰寫動作 |
| 行內轉換陣列 | 在運算式內使用 `select(...)` | 資料作業的 `Select` 動作 |
| 行內篩選陣列 | 在運算式內使用 `filter(...)` | 資料作業的 `Filter array` 動作 |
| 尋找陣列項目索引 | `indexOf(array, item)` | 帶有計數器變數的 Foreach，或建構具索引鍵的物件對應表 |

### 運算式中的換行符

> **`\n` 不會在 Power Automate 運算式內部產生換行符。** 它會被視為常值反斜線 + `n`，並且會逐字出現或導致驗證錯誤。

在任何需要換行符的地方使用 `decodeUriComponent('%0a')`：

```
換行 (LF)：   decodeUriComponent('%0a')
CRLF：        decodeUriComponent('%0d%0a')
```

範例 — 透過 `concat()` 建立多行 Teams 或電子郵件本文：
```json
"Compose_Message": {
  "type": "Compose",
  "inputs": "@concat('Hi ', outputs('Get_User')?['body/displayName'], ',', decodeUriComponent('%0a%0a'), 'Your report is ready.', decodeUriComponent('%0a'), '- The Team')"
}
```

範例 — 使用換行符分隔的 `join()`：
```json
"Compose_List": {
  "type": "Compose",
  "inputs": "@join(body('Select_Names'), decodeUriComponent('%0a'))"
}
```

> 這是 Power Automate 流程定義中動態建構字串時嵌入換行符唯一可靠的方法（已對 Logic Apps 執行階段進行驗證）。

---

### 陣列加總 (XPath 技巧)

Power Automate 沒有原生的 `sum()` 函式。請對 XML 使用 XPath：

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

`Select_Amounts` 必須輸出純數字陣列（先使用 **Select** 動作擷取單一數字欄位）。結果是一個您可以直接在條件或計算中使用的數字。

> 這是 Power Automate 中唯一無需迴圈即可對陣列進行彙總（加總/最小值/最大值）的方法。
