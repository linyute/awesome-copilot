# FlowStudio MCP — 動作模式：核心 (Core)

Power Automate 流程定義的變數、流程控制和運算式模式。

> 所有範例皆假設 `"runAfter"` 已適當設定。
> 請將 `<connectionName>` 取代為您在 `connectionReferences` 對應表中使用的 **鍵 (key)**
> (例如 `shared_teams`, `shared_office365`) — NOT 連接 GUID。

---

## 資料與變數

### Compose (儲存數值)

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

型別：`"Integer"`, `"Float"`, `"Boolean"`, `"String"`, `"Array"`, `"Object"`

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

> 在迴圈中使用 `IncrementVariable` (而非使用 `add()` 的 `SetVariable`) —
> 它是原子的，且在變數於同一次迭代的其他地方使用時，可避免運算式錯誤。`value` 可以是任何整數或運算式，例如 `@mul(item()?['Interval'], 60)`，將 Unix 時間戳記游標推進 N 分鐘。

---

## 流程控制

### 條件 (If/Else)

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

### Switch

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

### 範圍 (Scope / Try-Catch)

將相關動作包裝在範圍 (Scope) 中，賦予它們共用的名稱，在設計工具中摺疊它們，並且 — 最重要的是 — 將它們的錯誤視為一個單位來處理。

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

> 參考範圍結果：`@result('Scope_Get_Customer')` 會回傳動作結果的陣列。在後續動作中使用 `runAfter: {"MyScope": ["Failed", "TimedOut"]}` 來建立 Try/Catch 語意，而無需使用 Terminate。

---

### Foreach (序列化)

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

> 除非刻意要進行平行處理，否則請務必包含 `"operationOptions": "Sequential"`。

---

### Foreach (具有並發限制的平行處理)

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

> 設定 `repetitions` 以控制同時處理多少項目。
> 建議值：對於外部 API 呼叫為 `5–10`（遵守速率限制），對於內部/快速操作為 `20–50`。
> 若要使用平台預設值（目前為 50），請完全省略 `runtimeConfiguration.concurrency`。請 **不要** 同時使用 `"operationOptions": "Sequential"` 和並發設定。

---

### 等待 (Wait/Delay)

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

> 使用「延遲 + 重新取得」作為去重複的守護機制：等待任何競爭流程完成，然後在採取行動前重新讀取記錄。這可避免多個觸發程序或手動編輯在同一項目上競爭時導致重複處理。

---

### 終止 (Terminate / 成功或失敗)

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

### Do Until (迴圈直到條件滿足)

重複一系列動作直到結束條件為真。
當迭代次數預先未知時使用（例如分頁 API、遍歷時間範圍、輪詢直到狀態變更）。

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

> 請務必明確設定 `limit.count` 和 `limit.timeout` — 平台預設值很低（60 次迭代，1 小時）。對於時間範圍遍歷，請使用 `limit.count: 5000` 和 `limit.timeout: "PT5H"` (ISO 8601 持續時間)。
>
> 結束條件會在每次迭代 **之前** 進行評估。在迴圈前初始化您的游標變數，以便條件可以在第一次通過時正確評估。

---

### 具有 RequestId 關聯的非同步輪詢 (Async Polling)

當 API 非同步啟動長時間執行的工作時（例如 Power BI 資料集重新整理、報告產生、批次匯出），觸發呼叫會回傳一個請求 ID。從 **回應標頭** 擷取它，然後根據該 ID 過濾並輪詢狀態端點：

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

> **狀態變數初始化**：在迴圈前設定一個 Sentinel 值 (`"Running"`, `"Unknown"`)。結束條件會測試 Sentinel 以外的任何值。如此一來，空的輪詢結果（工作尚未出現在歷程記錄中）就不會變更變數值，且迴圈會繼續 — 它不會因為空值而意外結束。
>
> **先過濾再擷取**：務必先 `Filter Array` 歷史記錄以對應到您的特定請求 ID，再呼叫 `first()`。歷程記錄端點會回傳所有工作；若不進行過濾，來自其他並發工作的狀態可能會損毀您的輪詢。

---

### runAfter 回退 (失敗 → 替代動作)

當主動作失敗時路由至回退動作 — 無需 Condition 區塊。
只需在回退動作上設定 `runAfter` 以接受來自主要的 `["Failed"]`：

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

> 後續動作可以使用 `runAfter` 接受 `["Succeeded", "Skipped"]` 來處理任一路徑 — 請參閱下方的 **Fan-In Join Gate**。

---

### Fan-In Join Gate (合併兩個互斥的分支)

當兩個分支互斥（每次執行僅有一個能成功）時，請使用單一下游動作，該動作接受來自 **兩者** 分支的 `["Succeeded", "Skipped"]`。閘道會在任一分支執行時精確觸發一次：

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

> 這可避免在每個分支中重複下游動作。關鍵見解：無論哪個分支被略過，它都會回報 `Skipped` — 閘道接受該狀態並觸發一次。只有在兩個分支確實互斥時（例如一個是另一個的 `runAfter: [...Failed]`）才能乾淨運作。

---

## 運算式 (Expressions)

### 常見運算式模式

```
Null-safe 欄位存取：    @item()?['FieldName']
Null 防護：                @coalesce(item()?['Name'], 'Unknown')
字串格式化：             @{variables('firstName')} @{variables('lastName')}
今天日期：                @utcNow()
格式化日期：            @formatDateTime(utcNow(), 'dd/MM/yyyy')
增加天數：                  @addDays(utcNow(), 7)
陣列長度：              @length(variables('myArray'))
過濾陣列：              使用 "Filter array" 動作（PA 中沒有內嵌過濾運算式）
Union (新的獲勝)：          @union(body('New_Data'), outputs('Old_Data'))
排序：                      @sort(variables('myArray'), 'Date')
Unix 時間戳記 → 日期：     @formatDateTime(addseconds('1970-1-1', triggerBody()?['created']), 'yyyy-MM-dd')
日期 → Unix 毫秒：  @div(sub(ticks(startOfDay(item()?['Created'])), ticks(formatDateTime('1970-01-01Z','o'))), 10000)
日期 → Unix 秒：       @div(sub(ticks(item()?['Start']), ticks('1970-01-01T00:00:00Z')), 10000000)
Unix 秒 → datetime：   @addSeconds('1970-01-01T00:00:00Z', int(variables('Unix')))
Coalesce 作為 no-else：       @coalesce(outputs('Optional_Step'), outputs('Default_Step'))
流程已過的分鐘數：      @div(float(sub(ticks(utcNow()), ticks(outputs('Flow_Start')))), 600000000)
HH:mm 時間字串：         @formatDateTime(outputs('Local_Datetime'), 'HH:mm')
回應標頭：           @outputs('HTTP_Action')?['headers/X-Request-Id']
陣列最大值（依欄位）：      @reverse(sort(body('Select_Items'), 'Date'))[0]
整數天數跨度：          @int(split(dateDifference(outputs('Start'), outputs('End')), '.')[0])
ISO 週數：           @div(add(dayofyear(addDays(subtractFromTime(date, sub(dayofweek(date),1), 'Day'), 3)), 6), 7)
串接錯誤至字串：     @if(equals(length(variables('Errors')),0), null, concat(join(variables('Errors'),', '),' not found.'))
比較前標準化：  @replace(coalesce(outputs('Value'),''),'_',' ')
強健的非空檢查：    @greater(length(trim(coalesce(string(outputs('Val')), ''))), 0)
```

### 運算式中的換行符號

> **`\n` 不會在 Power Automate 運算式中產生換行。** 它會被視為字面上的反斜線 + `n`，將會以原樣出現或導致驗證錯誤。

在需要換行字元的地方，請使用 `decodeUriComponent('%0a')`：

```
換行 (LF)：   decodeUriComponent('%0a')
CRLF：           decodeUriComponent('%0d%0a')
```

範例 — 透過 `concat()` 建立多行 Teams 或 Email 本文：
```json
"Compose_Message": {
  "type": "Compose",
  "inputs": "@concat('Hi ', outputs('Get_User')?['body/displayName'], ',', decodeUriComponent('%0a%0a'), 'Your report is ready.', decodeUriComponent('%0a'), '- The Team')"
}
```

範例 — 使用換行分隔符號的 `join()`：
```json
"Compose_List": {
  "type": "Compose",
  "inputs": "@join(body('Select_Names'), decodeUriComponent('%0a'))"
}
```

> 這是 Power Automate 流程定義中，在動態建構字串時嵌入換行的唯一可靠方式（已針對 Logic Apps 執行階段進行確認）。

---

### 加總陣列 (XPath 技巧)

Power Automate 沒有原生的 `sum()` 函式。請改用 XML 上的 XPath：

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

`Select_Amounts` 必須輸出一個扁平的數字陣列（先使用 **Select** 動作擷取單一數值欄位）。結果是一個可直接用於條件或計算的數值。

> 這是 Power Automate 中無需迴圈即可進行聚合（加總/最小值/最大值）陣列的唯一方法。
