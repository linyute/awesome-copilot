# FlowStudio MCP — 動作模式：連接器

SharePoint、Outlook、Teams 和 Approvals 連接器動作模式。

> 所有範例均假設已適當設定 `"runAfter"`。
> 將 `<connectionName>` 替換為您在 `connectionReferences` 中使用的**索引鍵**
> （例如 `shared_sharepointonline`、`shared_teams`）。這不是連接的
> GUID — 它是將動作連結至其在 `connectionReferences` 對應項目的
> 邏輯參考名稱。

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

> **具字串插值的動態 OData 篩選**：使用 `@{...}` 語法將執行階段數值
> 直接插入 `$filter` 字串中：
> ```
> "$filter": "Title eq '@{outputs('ConfirmationCode')}'"  
> ```
> 請注意雙引號內的單引號 — 正確的 OData 字串常值
> 語法。避免使用個別的變數動作。

> **大型清單的分頁處理**：依預設，GetItems 會在 `$top` 處停止。若要自動分頁
> 超過該限制，請在動作上啟用分頁原則 (pagination policy)。在流程定義中，
> 這會顯示為：
> ```json
> "paginationPolicy": { "minimumItemCount": 10000 }
> ```
> 將 `minimumItemCount` 設定為您預期的最大項目數。連接器將
> 持續擷取分頁，直到達到該計數或清單耗盡為止。若未設定此項目，
> 流程在處理超過 5,000 個項目的清單時，會靜默傳回上限截斷的結果。

---

### SharePoint — 取得項目 (單一資料列，依識別碼) (Get Item)

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

> 當您已經擁有識別碼時，請使用 `GetItem`（而非帶有篩選的 `GetItems`）。
> 在觸發程序之後重新擷取可提供您**目前的**資料列狀態，而不是在
> 觸發時擷取的快照 — 如果自流程啟動以來可能有其他處理程序
> 修改了該項目，這點非常重要。

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

> `PatchItem` 即使在您沒有變更這些欄位的情況下，仍可驗證必要的 SharePoint
> 資料行。請從觸發程序或先前的 Get Item 動作回顯未變更的必要欄位，
> 例如 `item/Title`，並使用內部欄位名稱。

---

### SharePoint — 檔案 Upsert (在文件庫中建立或覆寫)

如果檔案已存在，SharePoint 的 `CreateFile` 會失敗。若要在未事先進行存在檢查的
情況下執行 upsert（建立或覆寫），請針對來自 `CreateFile` 的**成功 (Succeeded) 和失敗 (Failed)**
皆使用 `GetFileMetadataByPath` — 如果因為檔案存在而導致建立失敗，中繼資料呼叫仍會
傳回其識別碼，接著 `UpdateFile` 即可覆寫該檔案：

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

> 如果 `Create_File` 成功，`Get_File_Metadata_By_Path` 會被略過 (`Skipped`)，且 `Update_File` 
> 仍會觸發（接受 `Skipped`），無害地覆寫剛剛建立的檔案。
> 如果 `Create_File` 失敗（檔案已存在），中繼資料呼叫會擷取現有檔案的識別碼，
> 且 `Update_File` 會將其覆寫。無論哪種方式，您最終都會獲得最新內容。
>
> **文件庫系統屬性** — 逐一查看檔案庫結果時（例如來自
> `ListFolder` 或 `GetFilesV2`），請使用大括號屬性名稱來存取
> SharePoint 的內建檔案中繼資料。這些與清單欄位名稱不同：
> ```
> @item()?['{Name}']                  — 不含路徑的檔案名稱 (例如 "report.csv")
> @item()?['{FilenameWithExtension}'] — 在大多數連接器中與 {Name} 相同
> @item()?['{Identifier}']            — 用於 UpdateFile/DeleteFile 的內部檔案識別碼
> @item()?['{FullPath}']              — 完整伺服器相對路徑
> @item()?['{IsFolder}']              — 布林值，資料夾項目為 true
> ```

---

### SharePoint — GetItemChanges 資料行閘控 (Column Gate)

當 SharePoint「項目已修改」觸發程序引發時，它不會告訴您是哪一個
資料行發生了變更。使用 `GetItemChanges` 可取得每個資料行的變更旗標，然後針對
特定資料行閘控下游邏輯：

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

針對特定資料行進行閘控：

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

> **新項目偵測：**在第一次修改時（版本 1.0），
> `GetItemChanges` 可能會回報沒有先前的版本。請檢查
> `@equals(triggerBody()?['OData__UIVersionString'], '1.0')` 以偵測
> 新建立的項目，並針對這些項目略過變更閘控邏輯。

---

### SharePoint — 透過 HttpRequest 執行 REST MERGE

對於跨清單更新或標準更新項目連接器不支援的進階操作
（例如更新不同網站中的清單），請透過 `HttpRequest` 操作使用
SharePoint REST API：

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
> - `X-HTTP-Method: MERGE` — 指示 SharePoint 執行部分更新 (PATCH 語意)
> - `IF-MATCH: *` — 無論目前的 ETag 為何均直接覆寫 (不進行衝突檢查)
>
> `HttpRequest` 操作會重複使用現有的 SharePoint 連接 — 不需要額外的
> 驗證。當標準更新項目連接器無法觸及目標清單時
> （不同的網站集合，或者您需要原始的 REST 控制權），請使用此方法。
> 請完全依照所示保留連接器專屬的參數名稱：
> `parameters/method`、`parameters/uri`、`parameters/headers` 以及
> `parameters/body`。主體為 JSON 字串，且 `parameters/uri` 是相對於
> SharePoint `dataset`。

---

### SharePoint — 檔案作為 JSON 資料庫 (讀取 + 剖析)

使用 SharePoint 文件庫 JSON 檔案作為最新已知狀態記錄的
可查詢「資料庫」。由個別的處理程序（例如 Power BI 資料流程）維護
該檔案；流程會下載並篩選它以進行前後狀態比較。

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

> **解碼鏈：**`GetFileContent` 會在 `body(...)?['$content']` 中傳回 base64
> 編碼的內容。先套用 `decodeBase64()` 再套用 `json()` 即可取得
> 可用的陣列。接著 `Filter Array` 即可作為 WHERE 子句運作。
>
> **使用時機：**當您需要輕量級的「變更前」快照以偵測來自 Webhook 承載
> （「變更後」狀態）的欄位變更時。比維護完整的 SharePoint 清單鏡像
> 更簡單 — 適用於多達約 10,000 筆記錄。
>
> **檔案路徑編碼：**在 `id` 參數中，SharePoint 會對路徑進行兩次 URL
> 編碼。空格會變成 `%2b`（加號），斜線會變成 `%252f`。

---

## Excel Online

### Excel — 執行 Office 指令碼 (Run Office Script)

Office 指令碼動作在儲存時需要實際的活頁簿與指令碼識別碼。
請勿部署預留位置 `scriptId` 數值；`update_live_flow` 可能會在
動態操作驗證期間失敗，甚至在測試執行存在之前就會發生。

可用時請使用 `describe_live_connector` 或 `get_live_dynamic_options`，
若無法探索到活頁簿與指令碼，請向使用者詢問。如果仍然無法解析出
實際的 `scriptId`，請要求使用者在設計工具中新增一次「執行指令碼」動作，
然後讀取流程定義並保留已解析的
參數。

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

### Outlook — 取得電子郵件 (從資料夾讀取範本) (Get Emails)

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

> **Outlook 作為 CMS 模式**：將範本電子郵件儲存在專用的 Outlook 資料夾中。
> 設定 `fetchOnlyUnread: false`，以便範本在首次使用後仍會保留。
> 非技術使用者可以透過編輯該電子郵件來更新主旨和本文 —
> 不需要變更流程。將主旨和本文直接傳遞至 `SendEmailV2`。
>
> 若要取得資料夾識別碼：在 Outlook 網頁版中，以滑鼠右鍵按一下資料夾 → 在新索引標籤中
> 開啟 — 資料夾 GUID 位於 URL 中。在 `folderPath` 中為其加上 `Id::` 前置詞。

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

#### 變化形式：群組聊天 (1:1 或多人) (Group Chat)

若要張貼到群組聊天而非頻道，請使用 `"location": "Group chat"` 並搭配
對話串識別碼作為收件者：

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

若為 1:1（"Chat with Flow bot"），請使用 `"location": "Chat with Flow bot"` 並將
`body/recipient` 設定為該使用者的電子郵件地址。

> **有效使用者閘控：**在迴圈中傳送通知時，請在張貼前檢查收件者的
> Azure AD 帳戶是否已啟用 — 避免傳遞失敗給已離職的
> 員工：
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
> 接著進行閘控：`@equals(body('Check_User_Active')?['accountEnabled'], true)`

---

## Copilot Studio

### Copilot Studio — 叫用代理程式 (Invoke Agent)

使用 Copilot Studio 連接器時，請在執行流程之前發佈代理程式。
草稿/測試代理程式可以存在於工作室畫布中，但透過流程連接器端點
仍可能呈現無法使用或過時狀態。

如果連接器動作失敗並出現代理程式無法使用或端點樣式錯誤，
請發佈代理程式，稍候其傳播完成，然後在變更流程定義之前
重新提交相同的流程執行。

---

## Approvals

### 分割核准 (建立 → 等候) (Split Approval)

標準的「啟動並等候核准」是單一封鎖動作。
為了獲得更多控制權（例如在 Teams 中張貼核准連結，或新增逾時
範圍），請將其分割為兩個動作：`CreateAnApproval`（觸發後不理）接著
`WaitForAnApproval`（Webhook 暫停）。

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
> - `"Approve/Reject - First to respond"` — 二元選擇，最先回應者勝出
> - `"Approve/Reject - Everyone must approve"` — 需要所有指派對象核准
> - `"CustomResponse/Result"` — 定義您自訂的回應按鈕
>
> 在 `Wait_For_Approval` 之後，讀取結果：
> ```
> @body('Wait_For_Approval')?['outcome']          → "Approve"、"Reject" 或自訂
> @body('Wait_For_Approval')?['responses'][0]?['responder']?['displayName']
> @body('Wait_For_Approval')?['responses'][0]?['comments']
> ```
>
> 分割模式可讓您在建立與等候之間插入動作 — 例如
> 將核准連結張貼到 Teams、啟動逾時範圍，或將擱置中的
> 核准記錄至追蹤清單。
