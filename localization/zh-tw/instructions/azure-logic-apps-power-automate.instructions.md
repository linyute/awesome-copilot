---
description: '開發 Azure Logic Apps 和 Power Automate 工作流程的指南，包含工作流程定義語言 (WDL)、整合模式和企業自動化的最佳實踐'
applyTo: "**/*.json,**/*.logicapp.json,**/workflow.json,**/*-definition.json,**/*.flow.json"
---

# Azure Logic Apps 和 Power Automate 指南

## 概述

這些指南將引導您使用基於 JSON 的工作流程定義語言 (WDL) 編寫高品質的 Azure Logic Apps 和 Microsoft Power Automate 工作流程定義。Azure Logic Apps 是一個基於雲端的整合平台即服務 (iPaaS)，提供 1,400 多個連接器，以簡化跨服務和協議的整合。請遵循這些指南來創建穩健、高效且可維護的雲端工作流程自動化解決方案。

## 工作流程定義語言結構

處理 Logic Apps 或 Power Automate 流程 JSON 文件時，請確保您的工作流程遵循此標準結構：

```json
{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "actions": { },
    "contentVersion": "1.0.0.0",
    "outputs": { },
    "parameters": { },
    "staticResults": { },
    "triggers": { }
  },
  "parameters": { }
}
```

## Azure Logic Apps 和 Power Automate 開發的最佳實踐

### 1. 觸發程序

- **根據您的場景使用適當的觸發程序類型**：
  - **請求觸發程序**：用於同步 API 類工作流程
  - **重複觸發程序**：用於排程操作
  - **事件驅動觸發程序**：用於反應模式 (Service Bus、Event Grid 等)
- **配置適當的觸發程序設定**：
  - 設定合理的逾時期間
  - 對於高容量資料來源使用分頁設定
  - 實施適當的身份驗證

```json
"triggers": {
  "manual": {
    "type": "Request",
    "kind": "Http",
    "inputs": {
      "schema": {
        "type": "object",
        "properties": {
          "requestParameter": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

### 2. 動作

- **描述性地命名動作**以指示其目的
- **使用範圍組織複雜的工作流程**以進行邏輯分組
- **對不同的操作使用適當的動作類型**：
  - 用於 API 呼叫的 HTTP 動作
  - 用於內建整合的連接器動作
  - 用於轉換的資料操作動作

```json
"actions": {
  "Get_Customer_Data": {
    "type": "Http",
    "inputs": {
      "method": "GET",
      "uri": "https://api.example.com/customers/@{triggerBody()?['customerId']}",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "runAfter": {}
  }
}
```

### 3. 錯誤處理和可靠性

- **實施穩健的錯誤處理**：
  - 使用 "runAfter" 配置來處理失敗
  - 配置重試策略以處理暫時性錯誤
  - 使用帶有 "runAfter" 條件的範圍來處理錯誤分支
- **為關鍵操作實施備用機制**
- **為外部服務呼叫添加逾時**
- **使用 runAfter 條件**來處理複雜的錯誤處理場景

```json
"actions": {
  "HTTP_Action": {
    "type": "Http",
    "inputs": { },
    "retryPolicy": {
      "type": "fixed",
      "count": 3,
      "interval": "PT20S",
      "minimumInterval": "PT5S",
      "maximumInterval": "PT1H"
    }
  },
  "Handle_Success": {
    "type": "Scope",
    "actions": { },
    "runAfter": {
      "HTTP_Action": ["Succeeded"]
    }
  },
  "Handle_Failure": {
    "type": "Scope",
    "actions": {
      "Log_Error": {
        "type": "ApiConnection",
        "inputs": {
          "host": {
            "connection": {
              "name": "@parameters('$connections')['loganalytics']['connectionId']"
            }
          },
          "method": "post",
          "body": {
            "LogType": "WorkflowError",
            "ErrorDetails": "@{actions('HTTP_Action').outputs.body}",
            "StatusCode": "@{actions('HTTP_Action').outputs.statusCode}"
          }
        }
      },
      "Send_Notification": {
        "type": "ApiConnection",
        "inputs": {
          "host": {
            "connection": {
              "name": "@parameters('$connections')['office365']['connectionId']"
            }
          },
          "method": "post",
          "path": "/v2/Mail",
          "body": {
            "To": "support@contoso.com",
            "Subject": "Workflow Error - HTTP Call Failed",
            "Body": "<p>The HTTP call failed with status code: @{actions('HTTP_Action').outputs.statusCode}</p>"
          }
        },
        "runAfter": {
          "Log_Error": ["Succeeded"]
        }
      }
    },
    "runAfter": {
      "HTTP_Action": ["Failed", "TimedOut"]
    }
  }
}
```

### 4. 表達式和函數

- **使用內建表達式函數**來轉換資料
- **保持表達式簡潔易讀**
- **用註釋記錄複雜的表達式**

常見表達式模式：
- 字串操作：`concat()`、`replace()`、`substring()`
- 集合操作：`filter()`、`map()`、`select()`
- 條件邏輯：`if()`、`and()`、`or()`、`equals()`
- 日期/時間操作：`formatDateTime()`、`addDays()`
- JSON 處理：`json()`、`array()`、`createArray()`

```json
"Set_Variable": {
  "type": "SetVariable",
  "inputs": {
    "name": "formattedData",
    "value": "@{map(body('Parse_JSON'), item => {
      return {
        id: item.id,
        name: toUpper(item.name),
        date: formatDateTime(item.timestamp, 'yyyy-MM-dd')
      }
    })}"
  }
}
```

#### 在 Power Automate 條件中使用表達式

Power Automate 支援在條件中使用高級表達式來檢查多個值。處理複雜邏輯條件時，請使用以下模式：

- 對於比較單個值：使用基本條件設計器介面
- 對於多個條件：在高級模式中使用高級表達式

Power Automate 中條件的常見邏輯表達式函數：

| 表達式 | 描述 | 範例 |
|------------|-------------|---------|
| `and` | 如果兩個參數都為 true，則返回 true | `@and(equals(item()?['Status'], 'completed'), equals(item()?['Assigned'], 'John'))` |
| `or` | 如果任一參數為 true，則返回 true | `@or(equals(item()?['Status'], 'completed'), equals(item()?['Status'], 'unnecessary'))` |
| `equals` | 檢查值是否相等 | `@equals(item()?['Status'], 'blocked')` |
| `greater` | 檢查第一個值是否大於第二個值 | `@greater(item()?['Due'], item()?['Paid'])` |
| `less` | 檢查第一個值是否小於第二個值 | `@less(item()?['dueDate'], addDays(utcNow(),1))` |
| `empty` | 檢查物件、陣列或字串是否為空 | `@empty(item()?['Status'])` |
| `not` | 返回布林值的相反值 | `@not(contains(item()?['Status'], 'Failed'))` |

範例：檢查狀態是否為「已完成」或「不必要」：
```
@or(equals(item()?['Status'], 'completed'), equals(item()?['Status'], 'unnecessary'))
```

範例：檢查狀態是否為「已阻止」且分配給特定人員：
```
@and(equals(item()?['Status'], 'blocked'), equals(item()?['Assigned'], 'John Wonder'))
```

範例：檢查付款是否逾期且未完成：
```
@and(greater(item()?['Due'], item()?['Paid']), less(item()?['dueDate'], utcNow()))
```

**注意**：在 Power Automate 中，當在表達式中從先前步驟存取動態值時，請使用 `item()?['PropertyName']` 語法來安全地存取集合中的屬性。

### 5. 參數和變數

- **參數化您的工作流程**以在不同環境中重複使用
- **在工作流程中使用變數**來儲存臨時值
- **定義清晰的參數架構**，包含預設值和描述

```json
"parameters": {
  "apiEndpoint": {
    "type": "string",
    "defaultValue": "https://api.dev.example.com",
    "metadata": {
      "description": "The base URL for the API endpoint"
    }
  }
},
"variables": {
  "requestId": "@{guid()}",
  "processedItems": []
}
```

### 6. 控制流程

- **使用條件**進行分支邏輯
- **為獨立操作實施並行分支**
- **使用 foreach 迴圈**處理集合，並設定合理的批次大小
- **使用 until 迴圈**，並設定適當的退出條件

```json
"Process_Items": {
  "type": "Foreach",
  "foreach": "@body('Get_Items')",
  "actions": {
    "Process_Single_Item": {
      "type": "Scope",
      "actions": { }
    }
  },
  "runAfter": {
    "Get_Items": ["Succeeded"]
  },
  "runtimeConfiguration": {
    "concurrency": {
      "repetitions": 10
    }
  }
}
```

### 7. 內容和訊息處理

- **驗證訊息架構**以確保資料完整性
- **實施適當的內容類型處理**
- **使用 Parse JSON 動作**來處理結構化資料

```json
"Parse_Response": {
  "type": "ParseJson",
  "inputs": {
    "content": "@body('HTTP_Request')",
    "schema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "data": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": { }
          }
        }
      }
    }
  }
}
```

### 8. 安全最佳實踐

- **盡可能使用受控識別**
- **將機密儲存在 Key Vault 中**
- **為連接實施最小權限存取**
- **使用身份驗證保護 API 端點**
- **為 HTTP 觸發程序實施 IP 限制**
- **對參數和訊息中的敏感資料應用資料加密**
- **使用 Azure RBAC** 控制對 Logic Apps 資源的存取
- **定期對工作流程和連接進行安全審查**

```json
"Get_Secret": {
  "type": "ApiConnection",
  "inputs": {
    "host": {
      "connection": {
        "name": "@parameters('$connections')['keyvault']['connectionId']"
      }
    },
    "method": "get",
    "path": "/secrets/@{encodeURIComponent('apiKey')}/value"
  }
},
"Call_Protected_API": {
  "type": "Http",
  "inputs": {
    "method": "POST",
    "uri": "https://api.example.com/protected",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer @{body('Get_Secret')?['value']}"
    },
    "body": {
      "data": "@variables('processedData')"
    }
  },
  "authentication": {
    "type": "ManagedServiceIdentity"
  },
  "runAfter": {
    "Get_Secret": ["Succeeded"]
  }
}
```

## 性能優化

- **最小化不必要的動作**
- **在可用時使用批次操作**
- **優化表達式**以降低複雜性
- **配置適當的逾時值**
- **為大型資料集實施分頁**
- **為可並行操作實施並行控制**

```json
"Process_Items": {
  "type": "Foreach",
  "foreach": "@body('Get_Items')",
  "actions": {
    "Process_Single_Item": {
      "type": "Scope",
      "actions": { }
    }
  },
  "runAfter": {
    "Get_Items": ["Succeeded"]
  },
  "runtimeConfiguration": {
    "concurrency": {
      "repetitions": 10
    }
  }
}
```

### 工作流程設計最佳實踐

- **將工作流程限制在 50 個動作或更少**以獲得最佳設計器性能
- **必要時將複雜的業務邏輯拆分為多個較小的工作流程**
- **使用部署槽**用於需要零停機部署的關鍵任務邏輯應用程式
- **避免在觸發程序和動作定義中硬編碼屬性**
- **添加描述性註釋**以提供有關觸發程序和動作定義的上下文
- **盡可能使用內建操作**而不是共享連接器以獲得更好的性能
- **使用整合帳戶**用於 B2B 場景和 EDI 訊息處理
- **重複使用工作流程模板**以在整個組織中實現標準模式
- **避免深度嵌套**範圍和動作以保持可讀性

### 監控和可觀察性

- **配置診斷設定**以捕獲工作流程執行和指標
- **添加追蹤 ID** 以關聯相關的工作流程執行
- **實施全面的日誌記錄**，並設定適當的詳細程度
- **設定警報**以處理工作流程失敗和性能下降
- **使用 Application Insights** 進行端到端追蹤和監控

## 平台類型和考量

### Azure Logic Apps 與 Power Automate

儘管 Azure Logic Apps 和 Power Automate 共享相同的底層工作流程引擎和語言，但它們具有不同的目標受眾和功能：

- **Power Automate**：
  - 用於業務用戶的用戶友好介面
  - Power Platform 生態系統的一部分
  - 與 Microsoft 365 和 Dynamics 365 整合
  - 用於 UI 自動化的桌面流程功能

- **Azure Logic Apps**：
  - 企業級整合平台
  - 專注於開發人員，具有高級功能
  - 更深入的 Azure 服務整合
  - 更廣泛的監控和操作功能

### Logic App 類型

#### 消費型 Logic Apps
- 按執行次數付費定價模型
- 無伺服器架構
- 適用於可變或不可預測的工作負載

#### 標準型 Logic Apps
- 基於 App Service Plan 的固定定價
- 可預測的性能
- 本地開發支援
- 與 VNet 整合

#### 整合服務環境 (ISE)
- 專用部署環境
- 更高的吞吐量和更長的執行時間
- 直接存取 VNet 資源
- 隔離的執行時環境

### Power Automate 授權類型
- **Power Automate 每用戶方案**：適用於個人用戶
- **Power Automate 每流程方案**：適用於特定工作流程
- **Power Automate 流程方案**：適用於 RPA 功能
- **Power Automate 包含在 Office 365 中**：Office 365 用戶的有限功能

## 常見整合模式

### 架構模式
- **中介者模式**：使用 Logic Apps/Power Automate 作為系統之間的中介層
- **基於內容的路由**：根據內容將訊息路由到不同的目的地
- **訊息轉換**：在不同格式（JSON、XML、EDI 等）之間轉換訊息
- **分散-收集**：並行分發工作並聚合結果
- **協議橋接**：連接具有不同協議（REST、SOAP、FTP 等）的系統
- **聲明檢查**：將大型負載外部儲存在 Blob 儲存或資料庫中
- **Saga 模式**：管理具有失敗補償動作的分散式事務
- **編排模式**：協調多個服務而無需中央協調器

### 動作模式
- **異步處理模式**：用於長時間運行的操作
  ```json
  "LongRunningAction": {
    "type": "Http",
    "inputs": {
      "method": "POST",
      "uri": "https://api.example.com/longrunning",
      "body": { "data": "@triggerBody()" }
    },
    "retryPolicy": {
      "type": "fixed",
      "count": 3,
      "interval": "PT30S"
    }
  }
  ```

- **Webhook 模式**：用於回調處理
  ```json
  "WebhookAction": {
    "type": "ApiConnectionWebhook",
    "inputs": {
      "host": {
        "connection": {
          "name": "@parameters('$connections')['servicebus']['connectionId']"
        }
      },
      "body": {
        "content": "@triggerBody()"
      },
      "path": "/subscribe/topics/@{encodeURIComponent('mytopic')}/subscriptions/@{encodeURIComponent('mysubscription')}"
    }
  }
  ```

### 企業整合模式
- **B2B 訊息交換**：在交易夥伴之間交換 EDI 文件（AS2、X12、EDIFACT）
- **整合帳戶**：用於儲存和管理 B2B 工件（協議、架構、映射）
- **規則引擎**：使用 Azure Logic Apps 規則引擎實施複雜的業務規則
- **訊息驗證**：根據架構驗證訊息以確保合規性和資料完整性
- **事務處理**：處理業務事務，並進行回滾補償事務

## Logic Apps 的 DevOps 和 CI/CD

### 原始碼控制和版本控制

- **將 Logic App 定義儲存在原始碼控制中**（Git、Azure DevOps、GitHub）
- **使用 ARM 模板**部署到多個環境
- **實施適合您發布節奏的分支策略**
- **使用標籤或版本屬性對 Logic Apps 進行版本控制**

### 自動化部署

- **使用 Azure DevOps 管道**或 GitHub Actions 進行自動化部署
- **實施參數化**以處理環境特定值
- **使用部署槽**實現零停機部署
- **在 CI/CD 管道中包含部署後驗證測試**

```yaml
# Example Azure DevOps YAML pipeline for Logic App deployment
trigger:
  branches:
    include:
    - main
    - release/*

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: AzureResourceManagerTemplateDeployment@3
  inputs:
    deploymentScope: 'Resource Group'
    azureResourceManagerConnection: 'Your-Azure-Connection'
    subscriptionId: '$(subscriptionId)'
    action: 'Create Or Update Resource Group'
    resourceGroupName: '$(resourceGroupName)'
    location: '$(location)'
    templateLocation: 'Linked artifact'
    csmFile: '$(System.DefaultWorkingDirectory)/arm-templates/logicapp-template.json'
    csmParametersFile: '$(System.DefaultWorkingDirectory)/arm-templates/logicapp-parameters-$(Environment).json'
    deploymentMode: 'Incremental'
```

## 跨平台考量

同時使用 Azure Logic Apps 和 Power Automate 時：

- **匯出/匯入相容性**：流程可以從 Power Automate 匯出並匯入到 Logic Apps，但可能需要進行一些修改
- **連接器差異**：某些連接器在一個平台中可用，但在另一個平台中不可用
- **環境隔離**：Power Automate 環境提供隔離，並且可能具有不同的策略
- **ALM 實踐**：考慮將 Azure DevOps 用於 Logic Apps，將 Solutions 用於 Power Automate

### 遷移策略

- **評估**：評估遷移的複雜性和適用性
- **連接器映射**：映射平台之間的連接器並識別差距
- **測試策略**：在切換前實施並行測試
- **文件**：記錄所有配置更改以供參考

```json
// Example Power Platform solution structure for Power Automate flows
{
  "SolutionName": "MyEnterpriseFlows",
  "Version": "1.0.0",
  "Flows": [
    {
      "Name": "OrderProcessingFlow",
      "Type": "Microsoft.Flow/flows",
      "Properties": {
        "DisplayName": "Order Processing Flow",
        "DefinitionData": {
          "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
          "triggers": {
            "When_a_new_order_is_created": {
              "type": "ApiConnectionWebhook",
              "inputs": {
                "host": {
                  "connectionName": "shared_commondataserviceforapps",
                  "operationId": "SubscribeWebhookTrigger",
                  "apiId": "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps"
                }
              }
            }
          },
          "actions": {
            // Actions would be defined here
          }
        }
      }
    }
  ]
}
```

## 實用 Logic App 範例

### 帶有 API 整合的 HTTP 請求處理程序

此範例演示了一個 Logic App，它接受 HTTP 請求，驗證輸入資料，呼叫外部 API，轉換響應，並返回格式化的結果。

```json
{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "actions": {
      "Validate_Input": {
        "type": "If",
        "expression": {
          "and": [
            {
              "not": {
                "equals": [
                  "@triggerBody()?['customerId']",
                  null
                ]
              }
            },
            {
              "not": {
                "equals": [
                  "@triggerBody()?['requestType']",
                  null
                ]
              }
            }
          ]
        },
        "actions": {
          "Get_Customer_Data": {
            "type": "Http",
            "inputs": {
              "method": "GET",
              "uri": "https://api.example.com/customers/@{triggerBody()?['customerId']}",
              "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer @{body('Get_API_Key')?['value']}"
              }
            },
            "runAfter": {
              "Get_API_Key": [
                "Succeeded"
              ]
            }
          },
          "Get_API_Key": {
            "type": "ApiConnection",
            "inputs": {
              "host": {
                "connection": {
                  "name": "@parameters('$connections')['keyvault']['connectionId']"
                }
              },
              "method": "get",
              "path": "/secrets/@{encodeURIComponent('apiKey')}/value"
            }
          },
          "Parse_Customer_Response": {
            "type": "ParseJson",
            "inputs": {
              "content": "@body('Get_Customer_Data')",
              "schema": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "name": { "type": "string" },
                  "email": { "type": "string" },
                  "status": { "type": "string" },
                  "createdDate": { "type": "string" },
                  "orders": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "orderId": { "type": "string" },
                        "orderDate": { "type": "string" },
                        "amount": { "type": "number" }
                      }
                    }
                  }
                }
              }
            },
            "runAfter": {
              "Get_Customer_Data": [
                "Succeeded"
              ]
            }
          },
          "Switch_Request_Type": {
            "type": "Switch",
            "expression": "@triggerBody()?['requestType']",
            "cases": {
              "Profile": {
                "actions": {
                  "Prepare_Profile_Response": {
                    "type": "SetVariable",
                    "inputs": {
                      "name": "responsePayload",
                      "value": {
                        "customerId": "@body('Parse_Customer_Response')?['id']",
                        "customerName": "@body('Parse_Customer_Response')?['name']",
                        "email": "@body('Parse_Customer_Response')?['email']",
                        "status": "@body('Parse_Customer_Response')?['status']",
                        "memberSince": "@formatDateTime(body('Parse_Customer_Response')?['createdDate'], 'yyyy-MM-dd')"
                      }
                    }
                  }
                }
              },
              "OrderSummary": {
                "actions": {
                  "Calculate_Order_Statistics": {
                    "type": "Compose",
                    "inputs": {
                      "totalOrders": "@length(body('Parse_Customer_Response')?['orders'])",
                      "totalSpent": "@sum(body('Parse_Customer_Response')?['orders'], item => item.amount)",
                      "averageOrderValue": "@if(greater(length(body('Parse_Customer_Response')?['orders']), 0), div(sum(body('Parse_Customer_Response')?['orders'], item => item.amount), length(body('Parse_Customer_Response')?['orders'])), 0)",
                      "lastOrderDate": "@if(greater(length(body('Parse_Customer_Response')?['orders']), 0), max(body('Parse_Customer_Response')?['orders'], item => item.orderDate), '')"
                    }
                  },
                  "Prepare_Order_Response": {
                    "type": "SetVariable",
                    "inputs": {
                      "name": "responsePayload",
                      "value": {
                        "customerId": "@body('Parse_Customer_Response')?['id']",
                        "customerName": "@body('Parse_Customer_Response')?['name']",
                        "orderStats": "@outputs('Calculate_Order_Statistics')"
                      }
                    },
                    "runAfter": {
                      "Calculate_Order_Statistics": [
                        "Succeeded"
                      ]
                    }
                  }
                }
              }
            },
            "default": {
              "actions": {
                "Set_Default_Response": {
                  "type": "SetVariable",
                  "inputs": {
                    "name": "responsePayload",
                    "value": {
                      "error": "Invalid request type specified",
                      "validTypes": [
                        "Profile",
                        "OrderSummary"
                      ]
                    }
                  }
                }
              }
            },
            "runAfter": {
              "Parse_Customer_Response": [
                "Succeeded"
              ]
            }
          },
          "Log_Successful_Request": {
            "type": "ApiConnection",
            "inputs": {
              "host": {
                "connection": {
                  "name": "@parameters('$connections')['applicationinsights']['connectionId']"
                }
              },
              "method": "post",
              "body": {
                "LogType": "ApiRequestSuccess",
                "CustomerId": "@triggerBody()?['customerId']",
                "RequestType": "@triggerBody()?['requestType']",
                "ProcessingTime": "@workflow()['run']['duration']"
              }
            },
            "runAfter": {
              "Switch_Request_Type": [
                "Succeeded"
              ]
            }
          },
          "Return_Success_Response": {
            "type": "Response",
            "kind": "Http",
            "inputs": {
              "statusCode": 200,
              "body": "@variables('responsePayload')",
              "headers": {
                "Content-Type": "application/json"
              }
            },
            "runAfter": {
              "Log_Successful_Request": [
                "Succeeded"
              ]
            }
          }
        },
        "else": {
          "actions": {
            "Return_Validation_Error": {
              "type": "Response",
              "kind": "Http",
              "inputs": {
                "statusCode": 400,
                "body": {
                  "error": "Invalid request",
                  "message": "Request must include customerId and requestType",
                  "timestamp": "@utcNow()"
                }
              }
            }
          }
        },
        "runAfter": {
          "Initialize_Response_Variable": [
            "Succeeded"
          ]
        }
      },
      "Initialize_Response_Variable": {
        "type": "InitializeVariable",
        "inputs": {
          "variables": [
            {
              "name": "responsePayload",
              "type": "object",
              "value": {}
            }
          ]
        }
      }
    },
    "contentVersion": "1.0.0.0",
    "outputs": {},
    "parameters": {
      "$connections": {
        "defaultValue": {},
        "type": "Object"
      }
    },
    "triggers": {
      "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
          "schema": {
            "type": "object",
            "properties": {
              "customerId": {
                "type": "string"
              },
              "requestType": {
                "type": "string",
                "enum": [
                  "Profile",
                  "OrderSummary"
                ]
              }
            }
          }
        }
      }
    }
  },
  "parameters": {
    "$connections": {
      "value": {
        "keyvault": {
          "connectionId": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/connections/keyvault",
          "connectionName": "keyvault",
          "id": "/subscriptions/{subscription-id}/providers/Microsoft.Web/locations/{location}/managedApis/keyvault"
        },
        "applicationinsights": {
          "connectionId": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/connections/applicationinsights",
          "connectionName": "applicationinsights",
          "id": "/subscriptions/{subscription-id}/providers/Microsoft.Web/locations/{location}/managedApis/applicationinsights"
        }
      }
    }
  }
}
```

### 事件驅動處理與錯誤處理

此範例演示了一個 Logic App，它處理來自 Azure Service Bus 的事件，使用穩健的錯誤處理來處理訊息處理，並實施重試模式以實現彈性。

```json
{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "actions": {
      "Parse_Message": {
        "type": "ParseJson",
        "inputs": {
          "content": "@triggerBody()?['ContentData']",
          "schema": {
            "type": "object",
            "properties": {
              "eventId": { "type": "string" },
              "eventType": { "type": "string" },
              "eventTime": { "type": "string" },
              "dataVersion": { "type": "string" },
              "data": {
                "type": "object",
                "properties": {
                  "orderId": { "type": "string" },
                  "customerId": { "type": "string" },
                  "items": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "productId": { "type": "string" },
                        "quantity": { "type": "integer" },
                        "unitPrice": { "type": "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "runAfter": {}
      },
      "Try_Process_Order": {
        "type": "Scope",
        "actions": {
          "Get_Customer_Details": {
            "type": "Http",
            "inputs": {
              "method": "GET",
              "uri": "https://api.example.com/customers/@{body('Parse_Message')?['data']?['customerId']}",
              "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer @{body('Get_API_Key')?['value']}"
              }
            },
            "runAfter": {
              "Get_API_Key": [
                "Succeeded"
              ]
            },
            "retryPolicy": {
              "type": "exponential",
              "count": 5,
              "interval": "PT10S",
              "minimumInterval": "PT5S",
              "maximumInterval": "PT1H"
            }
          },
          "Get_API_Key": {
            "type": "ApiConnection",
            "inputs": {
              "host": {
                "connection": {
                  "name": "@parameters('$connections')['keyvault']['connectionId']"
                }
              },
              "method": "get",
              "path": "/secrets/@{encodeURIComponent('apiKey')}/value"
            }
          },
          "Validate_Stock": {
            "type": "Foreach",
            "foreach": "@body('Parse_Message')?['data']?['items']",
            "actions": {
              "Check_Product_Stock": {
                "type": "Http",
                "inputs": {
                  "method": "GET",
                  "uri": "https://api.example.com/inventory/@{items('Validate_Stock')?['productId']}",
                  "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer @{body('Get_API_Key')?['value']}"
                  }
                },
                "retryPolicy": {
                  "type": "fixed",
                  "count": 3,
                  "interval": "PT15S"
                }
              },
              "Verify_Availability": {
                "type": "If",
                "expression": {
                  "and": [
                    {
                      "greater": [
                        "@body('Check_Product_Stock')?['availableStock']",
                        "@items('Validate_Stock')?['quantity']"
                      ]
                    }
                  ]
                },
                "actions": {
                  "Add_To_Valid_Items": {
                    "type": "AppendToArrayVariable",
                    "inputs": {
                      "name": "validItems",
                      "value": {
                        "productId": "@items('Validate_Stock')?['productId']",
                        "quantity": "@items('Validate_Stock')?['quantity']",
                        "unitPrice": "@items('Validate_Stock')?['unitPrice']",
                        "availableStock": "@body('Check_Product_Stock')?['availableStock']"
                      }
                    }
                  }
                },
                "else": {
                  "actions": {
                    "Add_To_Invalid_Items": {
                      "type": "AppendToArrayVariable",
                      "inputs": {
                        "name": "invalidItems",
                        "value": {
                          "productId": "@items('Validate_Stock')?['productId']",
                          "requestedQuantity": "@items('Validate_Stock')?['quantity']",
                          "availableStock": "@body('Check_Product_Stock')?['availableStock']",
                          "reason": "Insufficient stock"
                        }
                      }
                    }
                  }
                },
                "runAfter": {
                  "Check_Product_Stock": ["Succeeded"]
                }
              }
            },
            "runAfter": {
              "Get_Customer_Details": ["Succeeded"]
            }
          },
          "Check_Order_Validity": {
            "type": "If",
            "expression": {
              "and": [
                {
                  "equals": [
                    "@length(variables('invalidItems'))",
                    0
                  ]
                },
                {
                  "greater": [
                    "@length(variables('validItems'))",
                    0
                  ]
                }
              ]
            },
            "actions": {
              "Process_Valid_Order": {
                "type": "Http",
                "inputs": {
                  "method": "POST",
                  "uri": "https://api.example.com/orders",
                  "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer @{body('Get_API_Key')?['value']}"
                  },
                  "body": {
                    "orderId": "@body('Parse_Message')?['data']?['orderId']",
                    "customerId": "@body('Parse_Message')?['data']?['customerId']",
                    "customerName": "@body('Get_Customer_Details')?['name']",
                    "items": "@variables('validItems')",
                    "processedTime": "@utcNow()",
                    "eventId": "@body('Parse_Message')?['eventId']"
                  }
                }
              },
              "Send_Order_Confirmation": {
                "type": "ApiConnection",
                "inputs": {
                  "host": {
                    "connection": {
                      "name": "@parameters('$connections')['office365']['connectionId']"
                    }
                  },
                  "method": "post",
                  "path": "/v2/Mail",
                  "body": {
                    "To": "@body('Get_Customer_Details')?['email']",
                    "Subject": "Order Confirmation: @{body('Parse_Message')?['data']?['orderId']}",
                    "Body": "<p>Dear @{body('Get_Customer_Details')?['name']},</p><p>Your order has been successfully processed.</p><p>Order ID: @{body('Parse_Message')?['data']?['orderId']}</p><p>Thank you for your business!</p>",
                    "Importance": "Normal",
                    "IsHtml": true
                  }
                },
                "runAfter": {
                  "Process_Valid_Order": ["Succeeded"]
                }
              },
              "Complete_Message": {
                "type": "ApiConnection",
                "inputs": {
                  "host": {
                    "connection": {
                      "name": "@parameters('$connections')['servicebus']['connectionId']"
                    }
                  },
                  "method": "post",
                  "path": "/messages/complete",
                  "body": {
                    "lockToken": "@triggerBody()?['LockToken']",
                    "sessionId": "@triggerBody()?['SessionId']",
                    "queueName": "@parameters('serviceBusQueueName')"
                  }
                },
                "runAfter": {
                  "Send_Order_Confirmation": ["Succeeded"]
                }
              }
            },
            "else": {
              "actions": {
                "Send_Invalid_Stock_Notification": {
                  "type": "ApiConnection",
                  "inputs": {
                    "host": {
                      "connection": {
                        "name": "@parameters('$connections')['office365']['connectionId']"
                      }
                    },
                    "method": "post",
                    "path": "/v2/Mail",
                    "body": {
                      "To": "@body('Get_Customer_Details')?['email']",
                      "Subject": "Order Cannot Be Processed: @{body('Parse_Message')?['data']?['orderId']}",
                      "Body": "<p>Dear @{body('Get_Customer_Details')?['name']},</p><p>We regret to inform you that your order cannot be processed due to insufficient stock for the following items:</p><p>@{join(variables('invalidItems'), '</p><p>')}</p><p>Please adjust your order and try again.</p>",
                      "Importance": "High",
                      "IsHtml": true
                    }
                  }
                },
                "Dead_Letter_Message": {
                  "type": "ApiConnection",
                  "inputs": {
                    "host": {
                      "connection": {
                        "name": "@parameters('$connections')['servicebus']['connectionId']"
                      }
                    },
                    "method": "post",
                    "path": "/messages/deadletter",
                    "body": {
                      "lockToken": "@triggerBody()?['LockToken']",
                      "sessionId": "@triggerBody()?['SessionId']",
                      "queueName": "@parameters('serviceBusQueueName')",
                      "deadLetterReason": "InsufficientStock",
                      "deadLetterDescription": "Order contained items with insufficient stock"
                    }
                  },
                  "runAfter": {
                    "Send_Invalid_Stock_Notification": ["Succeeded"]
                  }
                }
              }
            },
            "runAfter": {
              "Validate_Stock": ["Succeeded"]
            }
          }
        },
        "runAfter": {
          "Initialize_Variables": ["Succeeded"]
        }
      },
      "Initialize_Variables": {
        "type": "InitializeVariable",
        "inputs": {
          "variables": [
            {
              "name": "validItems",
              "type": "array",
              "value": []
            },
            {
              "name": "invalidItems",
              "type": "array",
              "value": []
            }
          ]
        },
        "runAfter": {
          "Parse_Message": ["Succeeded"]
        }
      },
      "Handle_Process_Error": {
        "type": "Scope",
        "actions": {
          "Log_Error_Details": {
            "type": "ApiConnection",
            "inputs": {
              "host": {
                "connection": {
                  "name": "@parameters('$connections')['applicationinsights']['connectionId']"
                }
              },
              "method": "post",
              "body": {
                "LogType": "OrderProcessingError",
                "EventId": "@body('Parse_Message')?['eventId']",
                "OrderId": "@body('Parse_Message')?['data']?['orderId']",
                "CustomerId": "@body('Parse_Message')?['data']?['customerId']",
                "ErrorDetails": "@result('Try_Process_Order')",
                "Timestamp": "@utcNow()"
              }
            }
          },
          "Abandon_Message": {
            "type": "ApiConnection",
            "inputs": {
              "host": {
                "connection": {
                  "name": "@parameters('$connections')['servicebus']['connectionId']"
                }
              },
              "method": "post",
              "path": "/messages/abandon",
              "body": {
                "lockToken": "@triggerBody()?['LockToken']",
                "sessionId": "@triggerBody()?['SessionId']",
                "queueName": "@parameters('serviceBusQueueName')"
              }
            },
            "runAfter": {
              "Log_Error_Details": ["Succeeded"]
            }
          },
          "Send_Alert_To_Operations": {
            "type": "ApiConnection",
            "inputs": {
              "host": {
                "connection": {
                  "name": "@parameters('$connections')['office365']['connectionId']"
                }
              },
              "method": "post",
              "path": "/v2/Mail",
              "body": {
                "To": "operations@example.com",
                "Subject": "Order Processing Error: @{body('Parse_Message')?['data']?['orderId']}",
                "Body": "<p>An error occurred while processing an order:</p><p>Order ID: @{body('Parse_Message')?['data']?['orderId']}</p><p>Customer ID: @{body('Parse_Message')?['data']?['customerId']}</p><p>Error: @{result('Try_Process_Order')}</p>",
                "Importance": "High",
                "IsHtml": true
              }
            },
            "runAfter": {
              "Abandon_Message": ["Succeeded"]
            }
          }
        },
        "runAfter": {
          "Try_Process_Order": ["Failed", "TimedOut"]
        }
      }
    },
    "contentVersion": "1.0.0.0",
    "outputs": {},
    "parameters": {
      "$connections": {
        "defaultValue": {},
        "type": "Object"
      },
      "serviceBusQueueName": {
        "type": "string",
        "defaultValue": "orders"
      }
    },
    "triggers": {
      "When_a_message_is_received_in_a_queue": {
        "type": "ApiConnectionWebhook",
        "inputs": {
          "host": {
            "connection": {
              "name": "@parameters('$connections')['servicebus']['connectionId']"
            }
          },
          "body": {
            "isSessionsEnabled": true
          },
          "path": "/subscriptionListener",
          "queries": {
            "queueName": "@parameters('serviceBusQueueName')",
            "subscriptionType": "Main"
          }
        }
      }
    }
  },
  "parameters": {
    "$connections": {
      "value": {
        "keyvault": {
          "connectionId": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/connections/keyvault",
          "connectionName": "keyvault",
          "id": "/subscriptions/{subscription-id}/providers/Microsoft.Web/locations/{location}/managedApis/keyvault"
        },
        "servicebus": {
          "connectionId": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/connections/servicebus",
          "connectionName": "servicebus",
          "id": "/subscriptions/{subscription-id}/providers/Microsoft.Web/locations/{location}/managedApis/servicebus"
        },
        "office365": {
          "connectionId": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/connections/office365",
          "connectionName": "office365",
          "id": "/subscriptions/{subscription-id}/providers/Microsoft.Web/locations/{location}/managedApis/office365"
        },
        "applicationinsights": {
          "connectionId": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/connections/applicationinsights",
          "connectionName": "applicationinsights",
          "id": "/subscriptions/{subscription-id}/providers/Microsoft.Web/locations/{location}/managedApis/applicationinsights"
        }
      }
    }
  }
}
```

## 高級異常處理和監控

### 全面異常處理策略

實施多層次異常處理方法以實現穩健的工作流程：

1. **預防措施**：
   - 對所有傳入訊息使用架構驗證
   - 使用 `coalesce()` 和 `?` 運算符實施防禦性表達式評估
   - 在關鍵操作之前添加前置條件檢查

2. **運行時錯誤處理**：
   - 使用帶有嵌套 try/catch 模式的結構化錯誤處理範圍
   - 為外部依賴項實施斷路器模式
   - 捕獲並以不同方式處理特定錯誤類型

```json
"Process_With_Comprehensive_Error_Handling": {
  "type": "Scope",
  "actions": {
    "Try_Primary_Action": {
      "type": "Scope",
      "actions": {
        "Main_Operation": {
          "type": "Http",
          "inputs": { "method": "GET", "uri": "https://api.example.com/resource" }
        }
      }
    },
    "Handle_Connection_Errors": {
      "type": "Scope",
      "actions": {
        "Log_Connection_Error": {
          "type": "ApiConnection",
          "inputs": {
            "host": {
              "connection": {
                "name": "@parameters('$connections')['loganalytics']['connectionId']"
              }
            },
            "method": "post",
            "body": {
              "LogType": "ConnectionError",
              "ErrorCategory": "Network",
              "StatusCode": "@{result('Try_Primary_Action')?['outputs']?['Main_Operation']?['statusCode']}",
              "ErrorMessage": "@{result('Try_Primary_Action')?['error']?['message']}"
            }
          }
        },
        "Invoke_Fallback_Endpoint": {
          "type": "Http",
          "inputs": { "method": "GET", "uri": "https://fallback-api.example.com/resource" }
        }
      },
      "runAfter": {
        "Try_Primary_Action": ["Failed"]
      }
    },
    "Handle_Business_Logic_Errors": {
      "type": "Scope",
      "actions": {
        "Parse_Error_Response": {
          "type": "ParseJson",
          "inputs": {
            "content": "@outputs('Try_Primary_Action')?['Main_Operation']?['body']",
            "schema": {
              "type": "object",
              "properties": {
                "errorCode": { "type": "string" },
                "errorMessage": { "type": "string" }
              }
            }
          }
        },
        "Switch_On_Error_Type": {
          "type": "Switch",
          "expression": "@body('Parse_Error_Response')?['errorCode']",
          "cases": {
            "ResourceNotFound": {
              "actions": { "Create_Resource": { "type": "Http", "inputs": {} } }
            },
            "ValidationError": {
              "actions": { "Resubmit_With_Defaults": { "type": "Http", "inputs": {} } }
            },
            "PermissionDenied": {
              "actions": { "Elevate_Permissions": { "type": "Http", "inputs": {} } }
            }
          },
          "default": {
            "actions": { "Send_To_Support_Queue": { "type": "ApiConnection", "inputs": {} } }
          }
        }
      },
      "runAfter": {
        "Try_Primary_Action": ["Succeeded"]
      }
    }
  }
}
```

3. **集中式錯誤日誌記錄**：
   - 創建一個專用於錯誤處理的 Logic App，其他工作流程可以呼叫它
   - 使用關聯 ID 記錄錯誤，以便在系統之間進行追溯
   - 按類型和嚴重性對錯誤進行分類，以便更好地分析

### 高級監控架構

實施涵蓋以下內容的全面監控策略：

1. **操作監控**：
   - **健康探測**：創建專用的健康檢查工作流程
   - **心跳模式**：實施定期檢查以驗證系統健康狀況
   - **死信處理**：處理和分析失敗的訊息

2. **業務流程監控**：
   - **業務指標**：追蹤關鍵業務 KPI（訂單處理時間、批准率）
   - **SLA 監控**：衡量與服務級別協議的性能
   - **關聯追蹤**：實施端到端事務追蹤

3. **警報策略**：
   - **多通道警報**：將警報配置到適當的通道（電子郵件、SMS、Teams）
   - **基於嚴重性的路由**：根據業務影響路由警報
   - **警報關聯**：將相關警報分組以防止警報疲勞

```json
"Monitor_Transaction_SLA": {
  "type": "Scope",
  "actions": {
    "Calculate_Processing_Time": {
      "type": "Compose",
      "inputs": "@{div(sub(ticks(utcNow()), ticks(triggerBody()?['startTime'])), 10000000)}"
    },
    "Check_SLA_Breach": {
      "type": "If",
      "expression": "@greater(outputs('Calculate_Processing_Time'), parameters('slaThresholdSeconds'))",
      "actions": {
        "Log_SLA_Breach": {
          "type": "ApiConnection",
          "inputs": {
            "host": {
              "connection": {
                "name": "@parameters('$connections')['loganalytics']['connectionId']"
              }
            },
            "method": "post",
            "body": {
              "LogType": "SLABreach",
              "TransactionId": "@{triggerBody()?['transactionId']}",
              "ProcessingTimeSeconds": "@{outputs('Calculate_Processing_Time')}",
              "SLAThresholdSeconds": "@{parameters('slaThresholdSeconds')}",
              "BreachSeverity": "@if(greater(outputs('Calculate_Processing_Time'), mul(parameters('slaThresholdSeconds'), 2)), 'Critical', 'Warning')"
            }
          }
        },
        "Send_SLA_Alert": {
          "type": "ApiConnection",
          "inputs": {
            "host": {
              "connection": {
                "name": "@parameters('$connections')['teams']['connectionId']"
              }
            },
            "method": "post",
            "body": {
              "notificationTitle": "SLA Breach Alert",
              "message": "Transaction @{triggerBody()?['transactionId']} exceeded SLA by @{sub(outputs('Calculate_Processing_Time'), parameters('slaThresholdSeconds'))} seconds",
              "channelId": "@{if(greater(outputs('Calculate_Processing_Time'), mul(parameters('slaThresholdSeconds'), 2)), parameters('criticalAlertChannelId'), parameters('warningAlertChannelId'))}"
            }
          }
        }
      }
    }
  }
}
```

## API 管理整合

將 Logic Apps 與 Azure API 管理整合，以增強安全性、治理和管理：

### API 管理前端

- **透過 API 管理公開 Logic Apps**：
  - 為 Logic App HTTP 觸發程序創建 API 定義
  - 應用一致的 URL 結構和版本控制
  - 實施 API 策略以實現安全性和轉換

### Logic Apps 的策略模板

```xml
<!-- Logic App API Policy Example -->
<policies>
  <inbound>
    <!-- Authentication -->
    <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized">
      <openid-config url="https://login.microsoftonline.com/{tenant-id}/.well-known/openid-configuration" />
      <required-claims>
        <claim name="aud" match="any">
          <value>api://mylogicapp</value>
        </claim>
      </required-claims>
    </validate-jwt>
    
    <!-- Rate limiting -->
    <rate-limit calls="5" renewal-period="60" />
    
    <!-- Request transformation -->
    <set-header name="Correlation-Id" exists-action="override">
      <value>@(context.RequestId)</value>
    </set-header>
    
    <!-- Logging -->
    <log-to-eventhub logger-id="api-logger">
      @{
        return new JObject(
          new JProperty("correlationId", context.RequestId),
          new JProperty("api", context.Api.Name),
          new JProperty("operation", context.Operation.Name),
          new JProperty("user", context.User.Email),
          new JProperty("ip", context.Request.IpAddress)
        ).ToString();
      }
    </log-to-eventhub>
  </inbound>
  <backend>
    <forward-request />
  </backend>
  <outbound>
    <!-- Response transformation -->
    <set-header name="X-Powered-By" exists-action="delete" />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
```

### 工作流程即 API 模式

- **實施工作流程即 API 模式**：
  - 將 Logic Apps 專門設計為 API 後端
  - 使用帶有 OpenAPI 架構的請求觸發程序
  - 應用一致的響應模式
  - 實施適當的狀態碼和錯誤處理

```json
"triggers": {
  "manual": {
    "type": "Request",
    "kind": "Http",
    "inputs": {
      "schema": {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
          "customerId": {
            "type": "string",
            "description": "The unique identifier for the customer"
          },
          "requestType": {
            "type": "string",
            "enum": ["Profile", "OrderSummary"],
            "description": "The type of request to process"
          }
        },
        "required": ["customerId", "requestType"]
      },
      "method": "POST"
    }
  }
}
```

## 版本控制策略

為 Logic Apps 和 Power Automate 流程實施穩健的版本控制方法：

### 版本控制模式

1. **URI 路徑版本控制**：
   - 在 HTTP 觸發程序路徑中包含版本（/api/v1/resource）
   - 為每個主要版本維護單獨的 Logic Apps

2. **參數版本控制**：
   - 將版本參數添加到工作流程定義中
   - 根據版本參數使用條件邏輯

3. **並行版本控制**：
   - 將新版本與現有版本並行部署
   - 實施版本之間的流量路由

### 版本遷移策略

```json
"actions": {
  "Check_Request_Version": {
    "type": "Switch",
    "expression": "@triggerBody()?['apiVersion']",
    "cases": {
      "1.0": {
        "actions": {
          "Process_V1_Format": {
            "type": "Scope",
            "actions": { }
          }
        }
      },
      "2.0": {
        "actions": {
          "Process_V2_Format": {
            "type": "Scope",
            "actions": { }
          }
        }
      }
    },
    "default": {
      "actions": {
        "Return_Version_Error": {
          "type": "Response",
          "kind": "Http",
          "inputs": {
            "statusCode": 400,
            "body": {
              "error": "Unsupported API version",
              "supportedVersions": ["1.0", "2.0"]
            }
          }
        }
      }
    }
  }
}
```

### 針對不同版本的 ARM 模板部署

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "logicAppName": {
      "type": "string",
      "metadata": {
        "description": "Base name of the Logic App"
      }
    },
    "version": {
      "type": "string",
      "metadata": {
        "description": "Version of the Logic App to deploy"
      },
      "allowedValues": ["v1", "v2", "v3"]
    }
  },
  "variables": {
    "fullLogicAppName": "[concat(parameters('logicAppName'), '-', parameters('version'))]",
    "workflowDefinitionMap": {
      "v1": "[variables('v1Definition')]",
      "v2": "[variables('v2Definition')]",
      "v3": "[variables('v3Definition')]"
    },
    "v1Definition": {},
    "v2Definition": {},
    "v3Definition": {}
  },
  "resources": [
    {
      "type": "Microsoft.Logic/workflows",
      "apiVersion": "2019-05-01",
      "name": "[variables('fullLogicAppName')]",
      "location": "[resourceGroup().location]",
      "properties": {
        "definition": "[variables('workflowDefinitionMap')[parameters('version')]]"
      }
    }
  ]
}
```

## 成本優化技術

實施策略以優化 Logic Apps 和 Power Automate 解決方案的成本：

### Logic Apps 消費優化

1. **觸發程序優化**：
   - 在觸發程序中使用批次處理以在單次運行中處理多個項目
   - 實施適當的重複間隔（避免過度輪詢）
   - 使用基於 Webhook 的觸發程序而不是輪詢觸發程序

2. **動作優化**：
   - 通過組合相關操作來減少動作計數
   - 使用內建函數而不是自定義動作
   - 為 foreach 迴圈實施適當的並行設定

3. **資料傳輸優化**：
   - 最小化 HTTP 請求/響應中的負載大小
   - 使用本地文件操作而不是重複的 API 呼叫
   - 為大型負載實施資料壓縮

### Logic Apps 標準（工作流程）成本優化

1. **App Service Plan 選擇**：
   - 根據工作負載要求調整 App Service Plan 大小
   - 根據負載模式實施自動縮放
   - 考慮為可預測的工作負載預留實例

2. **資源共享**：
   - 在共享 App Service Plan 中整合工作流程
   - 實施共享連接和整合資源
   - 有效使用整合帳戶

### Power Automate 授權優化

1. **授權類型選擇**：
   - 根據工作流程複雜性選擇適當的授權類型
   - 為每用戶方案實施適當的用戶分配
   - 考慮高級連接器使用要求

2. **API 呼叫減少**：
   - 快取頻繁存取的資料
   - 為多個記錄實施批次處理
   - 減少排程流程的觸發頻率

### 成本監控和治理

```json
"Monitor_Execution_Costs": {
  "type": "ApiConnection",
  "inputs": {
    "host": {
      "connection": {
        "name": "@parameters('$connections')['loganalytics']['connectionId']"
      }
    },
    "method": "post",
    "body": {
      "LogType": "WorkflowCostMetrics",
      "WorkflowName": "@{workflow().name}",
      "ExecutionId": "@{workflow().run.id}",
      "ActionCount": "@{length(workflow().run.actions)}",
      "TriggerType": "@{workflow().triggers[0].kind}",
      "DataProcessedBytes": "@{workflow().run.transferred}",
      "ExecutionDurationSeconds": "@{div(workflow().run.duration, 'PT1S')}",
      "Timestamp": "@{utcNow()}"
    }
  },
  "runAfter": {
    "Main_Workflow_Actions": ["Succeeded", "Failed", "TimedOut"]
  }
}
```

## 增強型安全實踐

為 Logic Apps 和 Power Automate 工作流程實施全面的安全措施：

### 敏感資料處理

1. **資料分類和保護**：
   - 識別和分類工作流程中的敏感資料
   - 在日誌和監控中實施敏感資料遮罩
   - 對靜態和傳輸中的資料應用加密

2. **安全參數處理**：
   - 將 Azure Key Vault 用於所有機密和憑證
   - 在運行時實施動態參數解析
   - 對敏感值應用參數加密

```json
"actions": {
  "Get_Database_Credentials": {
    "type": "ApiConnection",
    "inputs": {
      "host": {
        "connection": {
          "name": "@parameters('$connections')['keyvault']['connectionId']"
        }
      },
      "method": "get",
      "path": "/secrets/@{encodeURIComponent('database-connection-string')}/value"
    }
  },
  "Execute_Database_Query": {
    "type": "ApiConnection",
    "inputs": {
      "host": {
        "connection": {
          "name": "@parameters('$connections')['sql']['connectionId']"
        }
      },
      "method": "post",
      "path": "/datasets/default/query",
      "body": {
        "query": "SELECT * FROM Customers WHERE CustomerId = @CustomerId",
        "parameters": {
          "CustomerId": "@triggerBody()?['customerId']"
        },
        "connectionString": "@body('Get_Database_Credentials')?['value']"
      }
    },
    "runAfter": {
      "Get_Database_Credentials": ["Succeeded"]
    }
  }
}
```

### 高級身份和存取控制

1. **細粒度存取控制**：
   - 為 Logic Apps 管理實施自定義角色
   - 對連接應用最小權限原則
   - 將受控識別用於所有 Azure 服務存取

2. **存取審查和治理**：
   - 定期對 Logic Apps 資源進行存取審查
   - 對管理操作應用即時存取
   - 審計所有存取和配置更改

3. **網路安全**：
   - 使用私有端點實施網路隔離
   - 對觸發程序端點應用 IP 限制
   - 將虛擬網路整合用於 Logic Apps 標準

```json
{
  "resources": [
    {
      "type": "Microsoft.Logic/workflows",
      "apiVersion": "2019-05-01",
      "name": "[parameters('logicAppName')]",
      "location": "[parameters('location')]",
      "identity": {
        "type": "SystemAssigned"
      },
      "properties": {
        "accessControl": {
          "triggers": {
            "allowedCallerIpAddresses": [
              {
                "addressRange": "13.91.0.0/16"
              },
              {
                "addressRange": "40.112.0.0/13"
              }
            ]
          },
          "contents": {
            "allowedCallerIpAddresses": [
              {
                "addressRange": "13.91.0.0/16"
              },
              {
                "addressRange": "40.112.0.0/13"
              }
            ]
          },
          "actions": {
            "allowedCallerIpAddresses": [
              {
                "addressRange": "13.91.0.0/16"
              },
              {
                "addressRange": "40.112.0.0/13"
              }
            ]
          }
        },
        "definition": {}
      }
    }
  ]
}
```

## 其他資源

- [Azure Logic Apps 文件](https://docs.microsoft.com/zh-tw/azure/logic-apps/)
- [Power Automate 文件](https://docs.microsoft.com/zh-tw/power-automate/)
- [工作流程定義語言架構](https://docs.microsoft.com/zh-tw/azure/logic-apps/logic-apps-workflow-definition-language)
- [Power Automate 與 Logic Apps 比較](https://docs.microsoft.com/zh-tw/azure/azure-functions/functions-compare-logic-apps-ms-flow-webjobs)
- [企業整合模式](https://docs.microsoft.com/zh-tw/azure/logic-apps/enterprise-integration-overview)
- [Logic Apps B2B 文件](https://docs.microsoft.com/zh-tw/azure/logic-apps/logic-apps-enterprise-integration-b2b)
- [Azure Logic Apps 限制和配置](https://docs.microsoft.com/zh-tw/azure/logic-apps/logic-apps-limits-and-config)
- [Logic Apps 性能優化](https://docs.microsoft.com/zh-tw/azure/logic-apps/logic-apps-performance-optimization)
- [Logic Apps 安全性概述](https://docs.microsoft.com/zh-tw/azure/logic-apps/logic-apps-securing-a-logic-app)
- [API 管理和 Logic Apps 整合](https://docs.microsoft.com/zh-tw/azure/api-management/api-management-create-api-logic-app)
- [Logic Apps 標準網路](https://docs.microsoft.com/zh-tw/azure/logic-apps/connect-virtual-network-vnet-isolated-environment)