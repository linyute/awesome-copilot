# FlowStudio MCP — 動作模式：連接器 (Connectors)

SharePoint、Outlook、Teams 與核准 (Approvals) 連接器的動作模式。

> 所有範例皆假設 `"runAfter"` 已正確設定。
> 請將 `<connectionName>` 取代為您在 `connectionReferences` 中使用的 **鍵 (key)**
> (例如 `shared_sharepointonline`、`shared_teams`)。這 **不是** 連線
> GUID — 它是將動作連結至其在 `connectionReferences` 對應表 (map) 中項目的邏輯參考名稱。

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

> **搭配字串插值的動態 OData 篩選**：使用 `@{...}` 語法將執行階段數值直接插入 `$filter` 字串中：
> ```
> "$filter": "Title eq '@{outputs('ConfirmationCode')}'"  
> ```
> 請注意雙引號內的單引號 — 這是正確的 OData 字串常值語法。這可以避免使用額外的變數動作。

> **大型清單的分頁 (Pagination)**：預設情況下，GetItems 會在 `$top` 處停止。若要自動分頁超過該限制，請在動作上啟用分頁策略。在流程定義中，這會顯示為：
> ```json
> "paginationPolicy": { "minimumItemCount": 10000 }
> ```
> 將 `minimumItemCount` 設定為您預期的最大項目數量。連接器將持續擷取頁面，直到達到該數量或清單耗盡。若不執行此設定，流程在處理超過 5,000 個項目的清單時，會無聲地傳回受限的結果。

---

### SharePoint — 取得項目 (Get Item，依識別碼取得單一資料列)

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

> 當您已有識別碼時，請使用 `GetItem` (而非搭配篩選器的 `GetItems`)。在觸發後重新擷取可為您提供 **目前** 的資料列狀態，而非觸發時擷取的快照 — 如果其他程序在流程啟動後可能修改了該項目，這一點非常重要。

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

若檔案已存在，SharePoint 的 `CreateFile` 會失敗。若要進行 Upsert (建立或覆寫) 且不進行事先的存在檢查，請對 `CreateFile` 的 **成功 (Succeeded) 與失敗 (Failed)** 皆使用 `GetFileMetadataByPath` — 如果建立因檔案已存在而失敗，中繼資料呼叫仍會傳回其識別碼，隨後 `UpdateFile` 即可進行覆寫：

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

> 如果 `Create_File` 成功，`Get_File_Metadata_By_Path` 會被 `跳過 (Skipped)`，而 `Update_File` 仍會執行 (接受 `跳過`)，並無害地覆寫剛建立的檔案。如果 `Create_File` 失敗 (檔案已存在)，中繼資料呼叫會抓取現有檔案的識別碼，然後 `Update_File` 會對其進行覆寫。無論哪種方式，您最後都會得到最新的內容。
>
> **文件庫系統屬性** — 在疊代檔案庫結果 (例如來自 `ListFolder` 或 `GetFilesV2`) 時，請使用大括號屬性名稱來存取 SharePoint 內建的檔案中繼資料。這些屬性與清單欄位名稱不同：
> ```
> @item()?['{Name}']                  — 不含路徑的檔案名稱 (例如 "report.csv")
> @item()?['{FilenameWithExtension}'] — 在大多數連接器中與 {Name} 相同
> @item()?['{Identifier}']            — 用於 UpdateFile/DeleteFile 的內部檔案識別碼
> @item()?['{FullPath}']              — 完整的伺服器相對路徑
> @item()?['{IsFolder}']             — 布林值，對資料夾項目為 true
> ```

---

### SharePoint — GetItemChanges 欄位控制門 (Column Gate)

當 SharePoint 「項目已修改」觸發程序啟動時，它不會告訴您是哪一欄發生了變更。請使用 `GetItemChanges` 取得各欄的變更旗標，然後針對特定欄位管控下游邏輯：

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

針對特定欄位進行管控：

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

> **新項目偵測**：在第一次修改 (版本 1.0) 時，`GetItemChanges` 可能會報告沒有先前的版本。請檢查 `@equals(triggerBody()?['OData__UIVersionString'], '1.0')` 以偵測新建立的項目，並對這些項目跳過變更控制邏輯。

---

### SharePoint — 透過 HttpRequest 進行 REST MERGE

對於跨清單更新或標準「更新項目」連接器不支援的進階作業 (例如更新不同站台中的清單)，請透過 `HttpRequest` 作業使用 SharePoint REST API：

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

> **關鍵標頭**：
> - `X-HTTP-Method: MERGE` — 告訴 SharePoint 執行部分更新 (PATCH 語義)
> - `IF-MATCH: *` — 無論目前的 ETag 為何皆進行覆寫 (不進行衝突檢查)
>
> `HttpRequest` 作業會重複使用現有的 SharePoint 連線 — 不需要額外的驗證。當標準「更新項目」連接器無法存取目標清單 (不同的站台集合，或您需要原始的 REST 控制) 時，請使用此方式。

---

### SharePoint — 將檔案作為 JSON 資料庫 (讀取 + 剖析)

將 SharePoint 文件庫的 JSON 檔案用作可查詢的最新狀態記錄「資料庫」。一個獨立的程序 (例如 Power BI 資料流程) 負責維護該檔案；流程會下載並篩選該檔案，以便進行前後對比。

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

> **解碼鏈**：`GetFileContent` 會在 `body(...)?['$content']` 中傳回 base64 編碼的內容。套用 `decodeBase64()` 然後套用 `json()` 即可取得可用的陣列。接著 `篩選陣列 (Filter Array)` 即可作為 WHERE 子句。
>
> **使用時機**：當您需要一個輕量級的「前」快照，以便從 Webhook 裝載 (「後」狀態) 中偵測欄位變更時。這比維護一個完整的 SharePoint 清單鏡像更簡單 — 適用於多達約 1 萬條記錄。
>
> **檔案路徑編碼**：在 `id` 參數中，SharePoint 會對路徑進行兩次 URL 編碼。空格變為 `%2b` (加號)，斜槓變為 `%252f`。

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
      "emailMessage/Subject": "自動化通知",
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
      "subjectFilter": "我的電子郵件範本主旨"
    }
  }
}
```

存取主旨與本文：
```
@first(outputs('Get_Email_Template')?['body/value'])?['subject']
@first(outputs('Get_Email_Template')?['body/value'])?['body']
```

> **Outlook 作為內容管理系統 (CMS) 模式**：將範本電子郵件儲存在專用的 Outlook 資料夾中。將 `fetchOnlyUnread` 設定為 `false`，以便範本在第一次使用後仍然存在。非技術使用者可以透過編輯該電子郵件來更新主旨和本文 — 無須變更流程。將主旨和本文直接傳入 `SendEmailV2`。
>
> 若要取得資料夾識別碼：在網頁版 Outlook 中，在資料夾上按一下滑鼠右鍵 → 在新索引標籤中開啟 — 資料夾 GUID 就在 URL 中。在 `folderPath` 中為其加上 `Id::` 前綴。

---

## Teams

### Teams — 發布訊息 (Post Message)

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

若要發布到群組聊天而非頻道，請使用 `"location": "Group chat"` 並將對話討論串識別碼 (thread ID) 作為收件者：

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

對於 1:1 (「與流程機器人聊天」)，請使用 `"location": "Chat with Flow bot"` 並將 `body/recipient` 設定為使用者的電子郵件地址。

> **作用中使用者門控**：在迴圈中傳送通知時，請在發布前檢查收件者的 Azure AD 帳戶是否已啟用 — 以避免傳送失敗給已離職的員工：
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
> 然後進行管控：`@equals(body('Check_User_Active')?['accountEnabled'], true)`

---

## 核准 (Approvals)

### 拆分核准 (建立 → 等待)

標準的「啟動並等待核准」是一個單一的封鎖動作。為了獲得更多控制 (例如在 Teams 中發布核准連結，或加入逾時範圍)，請將其拆分為兩個動作：`CreateAnApproval` (發出後不理) 然後是 `WaitForAnApproval` (Webhook 暫停)。

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
      "ApprovalCreationInput/title": "審閱：@{variables('ItemTitle')}",
      "ApprovalCreationInput/assignedTo": "approver@contoso.com",
      "ApprovalCreationInput/details": "請審閱並選擇一個選項。",
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

> **`approvalType` 選項**：
> - `"Approve/Reject - First to respond"` — 二進位制，第一位回應者勝出
> - `"Approve/Reject - Everyone must approve"` — 需要所有指派者核准
> - `"CustomResponse/Result"` — 自定義您自己的回應按鈕
>
> 在 `Wait_For_Approval` 之後，讀取結果：
> ```
> @body('Wait_For_Approval')?['outcome']          → "Approve", "Reject" 或自定義
> @body('Wait_For_Approval')?['responses'][0]?['responder']?['displayName']
> @body('Wait_For_Approval')?['responses'][0]?['comments']
> ```
>
> 拆分模式允許您在建立與等待之間插入動作 — 例如將核准連結發布到 Teams、啟動逾時範圍，或將待處理的核准記錄到追蹤清單中。
