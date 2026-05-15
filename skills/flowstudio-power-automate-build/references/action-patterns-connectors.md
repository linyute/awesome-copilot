# FlowStudio MCP — 動作模式：連接器

SharePoint、Outlook、Teams 和 Approvals 連接器動作模式。

> 所有範例皆假設已適當設定 `"runAfter"`。
> 將 `<connectionName>` 替換為您在 `connectionReferences` 中使用的 **鍵**
> (例如 `shared_sharepointonline`, `shared_teams`)。這不是連線的
> GUID — 它是將動作連結到其在 `connectionReferences` 對應表中項目的邏輯參考名稱。

---

## SharePoint

### SharePoint — 取得多個項目

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

> **帶有字串插值的動態 OData 篩選**：使用 `@{...}` 語法將執行階段值直接注入到 `$filter` 字串中：
> ```
> "$filter": "Title eq '@{outputs('ConfirmationCode')}'"  
> ```
> 請注意雙引號內的單引號 — 這是正確的 OData 字串常值語法。可避免使用單獨的變數動作。

> **大型清單的分頁**：預設情況下，GetItems 會在 `$top` 處停止。要自動分頁至超過該數量，請在動作上啟用分頁原則。在流程定義中，這顯示為：
> ```json
> "paginationPolicy": { "minimumItemCount": 10000 }
> ```
> 將 `minimumItemCount` 設定為您預期的最大項目數。連接器將持續擷取分頁，直到達到該數量或清單耗盡。如果沒有此設定，對於超過 5,000 個項目的清單，流程會默默地傳回受限的結果。

---

### SharePoint — 取得單一項目 (依 ID 取得單一資料列)

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

> 當您已經有 ID 時，請使用 `GetItem`（而不是帶有篩選器的 `GetItems`）。
> 在觸發後重新擷取可提供 **目前的** 資料列狀態，而不是觸發時擷取的快照 — 如果自流程啟動以來可能有另一個程序修改了該項目，這將非常重要。

---

### SharePoint — 建立項目

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

### SharePoint — 更新項目

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

> `PatchItem` 即使在您沒有變更那些欄位時也可以驗證必要的 SharePoint 欄位。請從觸發器或先前的「取得項目」動作重複使用未變更的必要欄位，例如 `item/Title`，並使用內部欄位名稱。

---

### SharePoint — 檔案 Upsert (在文件庫中建立或覆寫)

SharePoint 的 `CreateFile` 在檔案已存在時會失敗。要進行 upsert（建立或覆寫）而不需要事先檢查是否存在，請對 `CreateFile` 的 **成功與失敗** 皆使用 `GetFileMetadataByPath` — 如果建立因檔案已存在而失敗，元資料呼叫仍會傳回其 ID，然後 `UpdateFile` 就可以將其覆寫：

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

> 如果 `Create_File` 成功，`Get_File_Metadata_By_Path` 會被 `Skipped`，而 `Update_File` 仍會觸發（接受 `Skipped`），並無害地覆寫剛建立的檔案。
> 如果 `Create_File` 失敗（檔案已存在），元資料呼叫會擷取現有檔案的 ID，且 `Update_File` 會將其覆寫。無論哪種方式，您最終都會獲得最新內容。
>
> **文件庫系統屬性** — 當反覆執行檔案庫結果（例如來自 `ListFolder` 或 `GetFilesV2`）時，請使用大括號屬性名稱來存取 SharePoint 的內建檔案元資料。這些與清單欄位名稱不同：
> ```
> @item()?['{Name}']                  — 不含路徑的檔名 (例如 "report.csv")
> @item()?['{FilenameWithExtension}'] — 在大多數連接器中與 {Name} 相同
> @item()?['{Identifier}']            — 供 UpdateFile/DeleteFile 使用的內部檔案 ID
> @item()?['{FullPath}']              — 完整的伺服器相對路徑
> @item()?['{IsFolder}']             — 布林值，對資料夾項目為 true
> ```

---

### SharePoint — GetItemChanges 欄位閘道

當 SharePoint「項目已修改」觸發器觸發時，它不會告訴您是哪一欄發生了變化。使用 `GetItemChanges` 取得各欄變更旗標，然後針對特定欄位設定下游邏輯閘道：

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

針對特定欄位設定閘道：

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

> **新項目偵測**：在第一次修改（版本 1.0）時，`GetItemChanges` 可能會報告沒有先前版本。請檢查 `@equals(triggerBody()?['OData__UIVersionString'], '1.0')` 以偵測新建立的項目並為其跳過變更閘道邏輯。

---

### SharePoint — 透過 HttpRequest 進行 REST MERGE

對於跨清單更新或標準「更新項目」連接器不支援的進階操作（例如更新不同網站中的清單），請透過 `HttpRequest` 操作使用 SharePoint REST API：

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
> - `X-HTTP-Method: MERGE` — 告訴 SharePoint 執行部分更新 (PATCH 語意)
> - `IF-MATCH: *` — 無論目前的 ETag 為何皆進行覆寫（不進行衝突檢查）
>
> `HttpRequest` 操作會重複使用現有的 SharePoint 連線 — 不需要額外的驗證。當標準的「更新項目」連接器無法存取目標清單（不同的網站集合，或您需要原始的 REST 控制）時，請使用此動作。請確切保留如下所示的連接器專屬參數名稱：`parameters/method`, `parameters/uri`, `parameters/headers`, 和 `parameters/body`。Body 是 JSON 字串，而 `parameters/uri` 是相對於 SharePoint `dataset` 的路徑。

---

### SharePoint — 作為 JSON 資料庫的檔案 (讀取 + 解析)

使用 SharePoint 文件庫 JSON 檔案作為可查詢的最後已知狀態記錄「資料庫」。一個單獨的程序（例如 Power BI 資料流程）負責維護該檔案；流程下載該檔案並針對前後比較進行篩選。

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

> **解碼鏈**：`GetFileContent` 在 `body(...)?['$content']` 中傳回 Base64 編碼的內容。套用 `decodeBase64()` 然後套用 `json()` 即可獲得可用的陣列。接著 `Filter Array` 就充當 WHERE 子句。
>
> **何時使用**：當您需要輕量級的「前」快照，以從 Webhook 承載資料（「後」狀態）中偵測欄位變更時。比維護完整的 SharePoint 清單映射更簡單 — 對於多達約 1 萬筆記錄的效果良好。
>
> **檔案路徑編碼**：在 `id` 參數中，SharePoint 會對路徑進行兩次 URL 編碼。空格變成 `%2b`（加號），斜線變成 `%252f`。

---

## Excel Online

### Excel — 執行 Office 指令碼

Office 指令碼動作在儲存時需要實際的工作簿和指令碼識別碼。不要部署佔位符 `scriptId` 值；`update_live_flow` 可能會在動態操作驗證期間失敗，甚至在測試執行之前就發生。

在可用時使用 `describe_live_connector` 或 `get_live_dynamic_options`，如果工作簿和指令碼無法發現，請向使用者詢問。如果仍無法解析實際的 `scriptId`，請要求使用者在設計器中手動新增一次「執行指令碼」動作，然後讀取流程定義並保留解析後的參數。

---

## Outlook

### Outlook — 傳送電子郵件

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

### Outlook — 取得多封電子郵件 (從資料夾讀取範本)

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

存取主旨和本文：
```
@first(outputs('Get_Email_Template')?['body/value'])?['subject']
@first(outputs('Get_Email_Template')?['body/value'])?['body']
```

> **Outlook 作為內容管理系統 (CMS) 模式**：將範本電子郵件儲存在專用的 Outlook 資料夾中。設定 `fetchOnlyUnread: false` 以便範本在第一次使用後仍然存在。非技術使用者可以透過編輯該郵件來更新主旨和本文 — 不需要變更流程。將主旨和本文直接傳遞到 `SendEmailV2`。
>
> 取得資料夾 ID 的方法：在網頁版 Outlook 中，右鍵單擊資料夾 → 在新索引標籤中開啟 — 資料夾 GUID 就在 URL 中。在 `folderPath` 中以 `Id::` 作為其前綴。

---

## Teams

### Teams — 張貼訊息

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

要張貼到群組聊天而不是頻道，請使用 `"location": "Group chat"` 並以對話討論串 (thread) ID 作為收件者：

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

對於 1:1（「與流程機器人聊天」），請使用 `"location": "Chat with Flow bot"` 並將 `body/recipient` 設定為使用者的電子郵件地址。

> **有效使用者閘道**：在迴圈中傳送通知時，張貼前請檢查收件者的 Azure AD 帳戶是否已啟用 — 可避免將郵件傳送給已離職員工時發生遞送失敗：
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
> 然後設定閘道：`@equals(body('Check_User_Active')?['accountEnabled'], true)`

---

## Copilot Studio

### Copilot Studio — 呼叫代理程式

使用 Copilot Studio 連接器時，請在執行流程前發佈代理程式。草稿/測試代理程式可以存在於 Studio 畫布中，但透過流程連接器端點存取時可能仍然不可用或已過期。

如果連接器動作因代理程式不可用或端點類型的錯誤而失敗，請發佈代理程式，稍等片刻待其傳播，然後在變更流程定義前重新提交同一個流程執行。

---

## 簽核 (Approvals)

### 分割簽核 (建立 → 等待)

標準的「啟動並等待簽核」是單一的封鎖動作。為了獲得更多控制（例如在 Teams 中張貼簽核連結，或新增逾時範圍），請將其分割為兩個動作：`CreateAnApproval`（發出後不理）接著 `WaitForAnApproval`（Webhook 暫停）。

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

> **`approvalType` 選項**：
> - `"Approve/Reject - First to respond"` — 二進位，第一位回應者獲勝
> - `"Approve/Reject - Everyone must approve"` — 需要所有受指派者簽核
> - `"CustomResponse/Result"` — 定義您自己的回應按鈕
>
> 在 `Wait_For_Approval` 之後，讀取結果：
> ```
> @body('Wait_For_Approval')?['outcome']          → "Approve", "Reject", 或自定義值
> @body('Wait_For_Approval')?['responses'][0]?['responder']?['displayName']
> @body('Wait_For_Approval')?['responses'][0]?['comments']
> ```
>
> 分割模式允許您在建立和等待之間插入動作 — 例如將簽核連結張貼到 Teams、啟動逾時範圍，或將待處理簽核記錄到追蹤清單中。
