# FlowStudio MCP — 動作模式：連接器 (Connectors)

SharePoint、Outlook、Teams 和核准 (Approvals) 連接器動作模式。

> 所有範例皆假設 `"runAfter"` 已適當設定。
> 請將 `<connectionName>` 取代為您在 `connectionReferences` 中使用的 **鍵 (key)**
> (例如 `shared_sharepointonline`, `shared_teams`)。這 **不是** 連接 GUID，而是將動作連結至 `connectionReferences` 對應表中的邏輯參考名稱。

---

## SharePoint

### SharePoint — 取得項目 (Get Items)

```json
"Get_SP_Items": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "GetItems"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList",
      "$filter": "Status eq 'Active'",
      "$top": 500
    }
  }
}
```

結果參考：`@outputs('Get_SP_Items')?['body/value']`

> **使用字串插值 (string interpolation) 的動態 OData 篩選器**：使用 `@{...}` 語法將執行階段值直接注入到 `$filter` 字串中：
> ```
> "$filter": "Title eq '@{outputs('ConfirmationCode')}'"  
> ```
> 注意雙引號內的單引號 — 這是正確的 OData 字串常值語法。可避免額外的變數動作。

> **大型清單分頁**：預設情況下，GetItems 會在 `$top` 處停止。若要自動分頁至該數量之外，請在該動作上啟用分頁原則。在流程定義中，這會顯示為：
> ```json
> "paginationPolicy": { "minimumItemCount": 10000 }
> ```
> 將 `minimumItemCount` 設定為您預期的最大項目數。連接器會持續擷取頁面，直到達到該數量或清單耗盡為止。若未設定此項，流程在超過 5,000 個項目的清單上將靜默返回截斷後的結果。

---

### SharePoint — 取得項目 (依 ID 取得單列)

```json
"Get_SP_Item": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "GetItem"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList",
      "id": "@triggerBody()?['ID']"
    }
  }
}
```

結果參考：`@body('Get_SP_Item')?['FieldName']`

> 當您已擁有 ID 時，請使用 `GetItem` (而非使用篩選器的 `GetItems`)。
> 在觸發程序後重新擷取，會得到 **目前** 的列狀態，而不是觸發當下擷取的快照 — 如果其他流程可能已在流程開始後修改了該項目，這點非常重要。

---

### SharePoint — 建立項目 (Create Item)

```json
"Create_SP_Item": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "PostItem"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList",
      "item/Title": "@variables('myTitle')",
      "item/Status": "Active"
    }
  }
}
```

---

### SharePoint — 更新項目 (Update Item)

```json
"Update_SP_Item": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "PatchItem"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList",
      "id": "@item()?['ID']",
      "item/Status": "Processed"
    }
  }
}
```

---

### SharePoint — 檔案 Upsert (在文件庫中建立或覆寫)

如果檔案已存在，SharePoint 的 `CreateFile` 會失敗。若要在沒有預先存在檢查的情況下執行 Upsert（建立或覆寫），請在 `CreateFile` 的 **Succeeded (成功) 和 Failed (失敗)** 情況下都呼叫 `GetFileMetadataByPath` — 如果因為檔案存在而建立失敗，中繼資料呼叫仍會返回其 ID，然後 `UpdateFile` 即可覆寫該檔案：

```json
"Create_File": {
  "type": "OpenApiConnection",
  "inputs": {
    "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
              "connectionName": "<connectionName>", "operationId": "CreateFile" },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "folderPath": "/My Library/Subfolder",
      "name": "@{variables('filename')}",
      "body": "@outputs('Compose_File_Content')"
    }
  }
},
"Get_File_Metadata_By_Path": {
  "type": "OpenApiConnection",
  "runAfter": { "Create_File": ["Succeeded", "Failed"] },
  "inputs": {
    "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
              "connectionName": "<connectionName>", "operationId": "GetFileMetadataByPath" },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "path": "/My Library/Subfolder/@{variables('filename')}"
    }
  }
},
"Update_File": {
  "type": "OpenApiConnection",
  "runAfter": { "Get_File_Metadata_By_Path": ["Succeeded", "Skipped"] },
  "inputs": {
    "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
              "connectionName": "<connectionName>", "operationId": "UpdateFile" },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "id": "@outputs('Get_File_Metadata_By_Path')?['body/{Identifier}']",
      "body": "@outputs('Compose_File_Content')"
    }
  }
}
```

> 如果 `Create_File` 成功，`Get_File_Metadata_By_Path` 會被 `Skipped` (跳過)，而 `Update_File` 仍會觸發（接受 `Skipped`），無害地覆寫剛建立的檔案。
> 如果 `Create_File` 失敗（檔案已存在），中繼資料呼叫會擷取現有檔案的 ID，然後 `Update_File` 將其覆寫。無論如何，最終您都會得到最新的內容。
>
> **文件庫系統屬性** — 迭代檔案庫結果（例如從 `ListFolder` 或 `GetFilesV2`）時，使用大括號屬性名稱來存取 SharePoint 的內建檔案中繼資料。這些與清單欄位名稱不同：
> ```
> @item()?['{Name}']                  — 不含路徑的檔名（例如 "report.csv"）
> @item()?['{FilenameWithExtension}'] — 在大多數連接器中與 {Name} 相同
> @item()?['{Identifier}']            — 用於 UpdateFile/DeleteFile 的內部檔案 ID
> @item()?['{FullPath}']              — 完整的伺服器相對路徑
> @item()?['{IsFolder}']             — 布林值，資料夾條目為 true
> ```

---

### SharePoint — GetItemChanges 欄位閘道 (Column Gate)

當 SharePoint 的「項目已修改」觸發程序啟動時，它不會告訴您 **哪一個** 欄位變更了。請使用 `GetItemChanges` 取得各欄位的變更旗標，然後對特定欄位限制下游邏輯：

```json
"Get_Changes": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "GetItemChanges"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "<list-guid>",
      "id": "@triggerBody()?['ID']",
      "since": "@triggerBody()?['Modified']",
      "includeDrafts": false
    }
  }
}
```

限制特定欄位：

```json
"expression": {
  "and": [{
    "equals": [
      "@body('Get_Changes')?['Column']?['hasChanged']",
      true
    ]
  }]
}
```

> **新項目偵測：** 在第一次修改（版本 1.0）時，`GetItemChanges` 可能會回報沒有先前的版本。檢查 `@equals(triggerBody()?['OData__UIVersionString'], '1.0')` 以偵測新建立的項目，並針對這些項目跳過變更限制邏輯。

---

### SharePoint — 透過 HttpRequest 執行 REST MERGE

對於標準「更新項目」連接器不支援的跨清單更新或進階操作（例如，更新不同網站中的清單），請透過 `HttpRequest` 動作使用 SharePoint REST API：

```json
"Update_Cross_List_Item": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "HttpRequest"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/target-site",
      "parameters/method": "POST",
      "parameters/uri": "/_api/web/lists(guid'<list-guid>')/items(@{variables('ItemId')})",
      "parameters/headers": {
        "Accept": "application/json;odata=nometadata",
        "Content-Type": "application/json;odata=nometadata",
        "X-HTTP-Method": "MERGE",
        "IF-MATCH": "*"
      },
      "parameters/body": "{ \"Title\": \"@{variables('NewTitle')}\", \"Status\": \"@{variables('NewStatus')}\" }"
    }
  }
}
```

> **關鍵標頭：**
> - `X-HTTP-Method: MERGE` — 告訴 SharePoint 執行部分更新 (PATCH 語意)
> - `IF-MATCH: *` — 不論目前的 ETag 為何都執行覆寫（無衝突檢查）
>
> `HttpRequest` 動作會重複使用現有的 SharePoint 連接 — 無需額外驗證。當標準「更新項目」連接器無法存取目標清單（不同的網站集，或者您需要原始 REST 控制權）時，請使用此方式。

---

### SharePoint — 檔案即 JSON 資料庫 (讀取 + 解析)

將 SharePoint 文件庫的 JSON 檔案當作可查詢的「資料庫」來記錄最後已知的狀態。另一個流程（例如 Power BI 資料流）負責維護此檔案；流程下載並過濾它以進行變更前後的比對。

```json
"Get_File": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "GetFileContent"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "id": "%252fShared%2bDocuments%252fdata.json",
      "inferContentType": false
    }
  }
},
"Parse_JSON_File": {
  "type": "Compose",
  "runAfter": { "Get_File": ["Succeeded"] },
  "inputs": "@json(decodeBase64(body('Get_File')?['$content']))"
},
"Find_Record": {
  "type": "Query",
  "runAfter": { "Parse_JSON_File": ["Succeeded"] },
  "inputs": {
    "from": "@outputs('Parse_JSON_File')",
    "where": "@equals(item()?['id'], variables('RecordId'))"
  }
}
```

> **解碼鏈：** `GetFileContent` 在 `body(...)?['$content']` 中回傳 Base64 編碼的內容。應用 `decodeBase64()` 然後應用 `json()` 即可得到可使用的陣列。「篩選陣列」(Filter Array) 接著充當 WHERE 子句。
>
> **何時使用：** 當您需要一個輕量級的「變更前」快照來偵測來自 Webhook 負載的欄位變更（即「變更後」狀態）時。比維護完整的 SharePoint 清單鏡像更簡單 — 適用於多達約 1 萬筆記錄。
>
> **檔案路徑編碼：** 在 `id` 參數中，SharePoint 會對路徑進行兩次 URL 編碼。空格變為 `%2b`（加號），斜線變為 `%252f`。

---

## Outlook

### Outlook — 傳送電子郵件 (Send Email)

```json
"Send_Email": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365",
      "connectionName": "<connectionName>",
      "operationId": "SendEmailV2"
    },
    "parameters": {
      "emailMessage/To": "recipient@contoso.com",
      "emailMessage/Subject": "Automated notification",
      "emailMessage/Body": "<p>@{outputs('Compose_Message')}</p>",
      "emailMessage/IsHtml": true
    }
  }
}
```

---

### Outlook — 取得電子郵件 (從資料夾讀取範本)

```json
"Get_Email_Template": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365",
      "connectionName": "<connectionName>",
      "operationId": "GetEmailsV3"
    },
    "parameters": {
      "folderPath": "Id::<outlook-folder-id>",
      "fetchOnlyUnread": false,
      "includeAttachments": false,
      "top": 1,
      "importance": "Any",
      "fetchOnlyWithAttachment": false,
      "subjectFilter": "My Email Template Subject"
    }
  }
}
```

存取主旨與本文：
```
@first(outputs('Get_Email_Template')?['body/value'])?['subject']
@first(outputs('Get_Email_Template')?['body/value'])?['body']
```

> **Outlook 當作 CMS 模式：** 將範本郵件儲存在指定的 Outlook 資料夾中。
> 將 `fetchOnlyUnread` 設定為 `false`，以便範本在首次使用後仍然存在。
> 非技術人員可以透過編輯該郵件來更新主旨和內容 — 不需要變更流程。將主旨和內容直接傳入 `SendEmailV2`。
>
> 若要取得資料夾 ID：在網頁版 Outlook 中，右鍵點選資料夾 → 在新索引標籤中開啟 — 資料夾 GUID 就在 URL 中。在 `folderPath` 中為其加上 `Id::` 前綴。

---

## Teams

### Teams — 張貼訊息 (Post Message)

```json
"Post_Teams_Message": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_teams",
      "connectionName": "<connectionName>",
      "operationId": "PostMessageToConversation"
    },
    "parameters": {
      "poster": "Flow bot",
      "location": "Channel",
      "body/recipient": {
        "groupId": "<team-id>",
        "channelId": "<channel-id>"
      },
      "body/messageBody": "@outputs('Compose_Message')"
    }
  }
}
```

#### 變體：群組聊天 (1:1 或多人)

若要張貼到群組聊天而非頻道，請使用 `"location": "Group chat"` 並將執行緒 ID 作為收件者：

```json
"Post_To_Group_Chat": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_teams",
      "connectionName": "<connectionName>",
      "operationId": "PostMessageToConversation"
    },
    "parameters": {
      "poster": "Flow bot",
      "location": "Group chat",
      "body/recipient": "19:<thread-hash>@thread.v2",
      "body/messageBody": "@outputs('Compose_Message')"
    }
  }
}
```

對於 1:1（「與 Flow bot 聊天」），請使用 `"location": "Chat with Flow bot"` 並將 `body/recipient` 設定為使用者的電子郵件地址。

> **作用中使用者閘道：** 在迴圈中發送通知時，請先檢查收件者的 Azure AD 帳戶是否已啟用，再張貼訊息 — 避免傳送失敗給已離職的員工：
> ```json
> "Check_User_Active": {
>   "type": "OpenApiConnection",
>   "inputs": {
>     "host": { "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365users",
>               "operationId": "UserProfile_V2" },
>     "parameters": { "id": "@{item()?['Email']}" }
>   }
> }
> ```
> 然後限制：`@equals(body('Check_User_Active')?['accountEnabled'], true)`

---

## 核准 (Approvals)

### 分割核准 (建立 → 等待)

標準的「啟動並等待核准」是一個單一的阻塞動作。
若需要更多控制（例如，在 Teams 中張貼核准連結，或新增逾時範圍），請將其分割為兩個動作：`CreateAnApproval`（觸發即忘）和 `WaitForAnApproval`（Webhook 暫停）。

```json
"Create_Approval": {
  "type": "OpenApiConnection",
  "runAfter": {},
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_approvals",
      "connectionName": "<connectionName>",
      "operationId": "CreateAnApproval"
    },
    "parameters": {
      "approvalType": "CustomResponse/Result",
      "ApprovalCreationInput/title": "Review: @{variables('ItemTitle')}",
      "ApprovalCreationInput/assignedTo": "approver@contoso.com",
      "ApprovalCreationInput/details": "Please review and select an option.",
      "ApprovalCreationInput/responseOptions": ["Approve", "Reject", "Defer"],
      "ApprovalCreationInput/enableNotifications": true,
      "ApprovalCreationInput/enableReassignment": true
    }
  }
},
"Wait_For_Approval": {
  "type": "OpenApiConnectionWebhook",
  "runAfter": { "Create_Approval": ["Succeeded"] },
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_approvals",
      "connectionName": "<connectionName>",
      "operationId": "WaitForAnApproval"
    },
    "parameters": {
      "approvalName": "@body('Create_Approval')?['name']"
    }
  }
}
```

> **`approvalType` 選項：**
> - `"Approve/Reject - First to respond"` — 二進位，第一個回應者勝出
> - `"Approve/Reject - Everyone must approve"` — 需要所有指派者核准
> - `"CustomResponse/Result"` — 定義您自己的回應按鈕
>
> 在 `Wait_For_Approval` 之後，讀取結果：
> ```
> @body('Wait_For_Approval')?['outcome']          → "Approve", "Reject", 或自訂值
> @body('Wait_For_Approval')?['responses'][0]?['responder']?['displayName']
> @body('Wait_For_Approval')?['responses'][0]?['comments']
> ```
>
> 分割模式讓您可以在建立和等待之間插入動作 — 例如，在 Teams 中張貼核准連結、啟動逾時範圍，或將待處理的核准記錄到追蹤清單中。
