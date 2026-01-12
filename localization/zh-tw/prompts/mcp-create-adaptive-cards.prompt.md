---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '為基於 MCP 的 API 外掛程式新增調適型卡片回應範本，以便在 Microsoft 365 Copilot 中視覺化呈現資料'
model: 'gpt-4.1'
tags: [mcp, adaptive-cards, m365-copilot, api-plugin, response-templates]
---

# 為 MCP 外掛程式建立調適型卡片

為基於 MCP 的 API 外掛程式新增調適型卡片回應範本，以強化資料在 Microsoft 365 Copilot 中的視覺化呈現。

## 調適型卡片類型

### 靜態回應範本
當 API 總是傳回相同類型的項目，且格式不常變更時使用。

在 ai-plugin.json 的 `response_semantics.static_template` 中定義：

```json
{
  "functions": [
    {
      "name": "GetBudgets",
      "description": "傳回包含名稱和可用資金的預算詳細資訊",
      "capabilities": {
        "response_semantics": {
          "data_path": "$",
          "properties": {
            "title": "$.name",
            "subtitle": "$.availableFunds"
          },
          "static_template": {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.5",
            "body": [
              {
                "type": "Container",
                "$data": "${$root}",
                "items": [
                  {
                    "type": "TextBlock",
                    "text": "名稱: ${if(name, name, '不適用')}",
                    "wrap": true
                  },
                  {
                    "type": "TextBlock",
                    "text": "可用資金: ${if(availableFunds, formatNumber(availableFunds, 2), '不適用')}",
                    "wrap": true
                  }
                ]
              }
            ]
          }
        }
      }
    }
  ]
}
```

### 動態回應範本
當 API 傳回多種類型，且每個項目需要不同的範本時使用。

**ai-plugin.json 組態：**
```json
{
  "name": "GetTransactions",
  "description": "傳回具有動態範本的交易詳細資訊",
  "capabilities": {
    "response_semantics": {
      "data_path": "$.transactions",
      "properties": {
        "template_selector": "$.displayTemplate"
      }
    }
  }
}
```

**包含內嵌範本的 API 回應：**
```json
{
  "transactions": [
    {
      "budgetName": "Fourth Coffee 大廳翻修",
      "amount": -2000,
      "description": "許可申請的財產調查",
      "expenseCategory": "許可",
      "displayTemplate": "$.templates.debit"
    },
    {
      "budgetName": "Fourth Coffee 大廳翻修",
      "amount": 5000,
      "description": "支應成本超支的額外資金",
      "expenseCategory": null,
      "displayTemplate": "$.templates.credit"
    }
  ],
  "templates": {
    "debit": {
      "type": "AdaptiveCard",
      "version": "1.5",
      "body": [
        {
          "type": "TextBlock",
          "size": "medium",
          "weight": "bolder",
          "color": "attention",
          "text": "借方"
        },
        {
          "type": "FactSet",
          "facts": [
            {
              "title": "預算",
              "value": "${budgetName}"
            },
            {
              "title": "金額",
              "value": "${formatNumber(amount, 2)}"
            },
            {
              "title": "類別",
              "value": "${if(expenseCategory, expenseCategory, '不適用')}"
            },
            {
              "title": "說明",
              "value": "${if(description, description, '不適用')}"
            }
          ]
        }
      ],
      "$schema": "http://adaptivecards.io/schemas/adaptive-card.json"
    },
    "credit": {
      "type": "AdaptiveCard",
      "version": "1.5",
      "body": [
        {
          "type": "TextBlock",
          "size": "medium",
          "weight": "bolder",
          "color": "good",
          "text": "貸方"
        },
        {
          "type": "FactSet",
          "facts": [
            {
              "title": "預算",
              "value": "${budgetName}"
            },
            {
              "title": "金額",
              "value": "${formatNumber(amount, 2)}"
            },
            {
              "title": "說明",
              "value": "${if(description, description, '不適用')}"
            }
          ]
        }
      ],
      "$schema": "http://adaptivecards.io/schemas/adaptive-card.json"
    }
  }
}
```

### 混合靜態與動態範本
當項目沒有 template_selector 或值無法解析時，使用靜態範本作為預設。

```json
{
  "capabilities": {
    "response_semantics": {
      "data_path": "$.items",
      "properties": {
        "title": "$.name",
        "template_selector": "$.templateId"
      },
      "static_template": {
        "type": "AdaptiveCard",
        "version": "1.5",
        "body": [
          {
            "type": "TextBlock",
            "text": "預設: ${name}",
            "wrap": true
          }
        ]
      }
    }
  }
}
```

## 回應語義屬性

### data_path
指出資料在 API 回應中位置的 JSONPath 查詢：
```json
"data_path": "$"           // 回應的根目錄
"data_path": "$.results"   // 在 results 屬性中
"data_path": "$.data.items"// 巢狀路徑
```

### properties
為 Copilot 引用對應回應欄位：
```json
"properties": {
  "title": "$.name",            // 引用標題
  "subtitle": "$.description",  // 引用副標題
  "url": "$.link"               // 引用連結
}
```

### template_selector
每個項目上的屬性，指出要使用的範本：
```json
"template_selector": "$.displayTemplate"
```

## 調適型卡片範本語言

### 條件式轉譯
```json
{
  "type": "TextBlock",
  "text": "${if(field, field, '不適用')}"  // 顯示欄位或「不適用」
}
```

### 數字格式化
```json
{
  "type": "TextBlock",
  "text": "${formatNumber(amount, 2)}"  // 兩位小數
}
```

### 資料繫結
```json
{
  "type": "Container",
  "$data": "${$root}",  // 切換至根內容
  "items": [ ... ]
}
```

### 條件式顯示
```json
{
  "type": "Image",
  "url": "${imageUrl}",
  "$when": "${imageUrl != null}"  // 僅在 imageUrl 存在時顯示
}
```

## 卡片元素

### 文字區塊 (TextBlock)
```json
{
  "type": "TextBlock",
  "text": "文字內容",
  "size": "medium",      // small, default, medium, large, extraLarge
  "weight": "bolder",    // lighter, default, bolder
  "color": "attention",  // default, dark, light, accent, good, warning, attention
  "wrap": true
}
```

### 事實集 (FactSet)
```json
{
  "type": "FactSet",
  "facts": [
    {
      "title": "標籤",
      "value": "值"
    }
  ]
}
```

### 圖片 (Image)
```json
{
  "type": "Image",
  "url": "https://example.com/image.png",
  "size": "medium",  // auto, stretch, small, medium, large
  "style": "default" // default, person
}
```

### 容器 (Container)
```json
{
  "type": "Container",
  "$data": "${items}",  // 逐一查看陣列
  "items": [
    {
      "type": "TextBlock",
      "text": "${name}"
    }
  ]
}
```

### 欄位集 (ColumnSet)
```json
{
  "type": "ColumnSet",
  "columns": [
    {
      "type": "Column",
      "width": "auto",
      "items": [ ... ]
    },
    {
      "type": "Column",
      "width": "stretch",
      "items": [ ... ]
    }
  ]
}
```

### 動作 (Actions)
```json
{
  "type": "Action.OpenUrl",
  "title": "檢視詳細資訊",
  "url": "https://example.com/item/${id}"
}
```

## 回應式設計最佳做法

### 單欄版面配置
- 對於窄檢視區使用單欄
- 盡可能避免多欄版面配置
- 確保卡片在最小檢視區寬度下能正常運作

### 彈性寬度
- 不要為元素指定固定寬度
- 寬度屬性使用 "auto" 或 "stretch"
- 允許元素隨檢視區調整大小
- 固定寬度僅適用於圖示/大頭貼

### 文字與圖片
- 避免將文字與圖片放在同一列
- 例外：小圖示或大頭貼
- 文字內容使用 "wrap": true
- 在各種檢視區寬度下進行測試

### 跨中心 (Hub) 測試
在以下環境中驗證卡片：
- Teams (桌面版與行動版)
- Word
- PowerPoint
- 各種檢視區寬度 (縮放 UI)

## 完整範例

**ai-plugin.json：**
```json
{
  "functions": [
    {
      "name": "SearchProjects",
      "description": "搜尋具有狀態和詳細資訊的專案",
      "capabilities": {
        "response_semantics": {
          "data_path": "$.projects",
          "properties": {
            "title": "$.name",
            "subtitle": "$.status",
            "url": "$.projectUrl"
          },
          "static_template": {
            "type": "AdaptiveCard",
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.5",
            "body": [
              {
                "type": "Container",
                "$data": "${$root}",
                "items": [
                  {
                    "type": "TextBlock",
                    "size": "medium",
                    "weight": "bolder",
                    "text": "${if(name, name, '無標題專案')}",
                    "wrap": true
                  },
                  {
                    "type": "FactSet",
                    "facts": [
                      {
                        "title": "狀態",
                        "value": "${status}"
                      },
                      {
                        "title": "擁有者",
                        "value": "${if(owner, owner, '未指派')}"
                      },
                      {
                        "title": "到期日",
                        "value": "${if(dueDate, dueDate, '未設定')}"
                      },
                      {
                        "title": "預算",
                        "value": "${if(budget, formatNumber(budget, 2), '不適用')}"
                      }
                    ]
                  },
                  {
                    "type": "TextBlock",
                    "text": "${if(description, description, '無說明')}",
                    "wrap": true,
                    "separator": true
                  }
                ]
              }
            ],
            "actions": [
              {
                "type": "Action.OpenUrl",
                "title": "檢視專案",
                "url": "${projectUrl}"
              }
            ]
          }
        }
      }
    }
  ]
}
```

## 工作流程

詢問使用者：
1. API 傳回什麼類型的資料？
2. 所有項目都是相同類型 (靜態) 還是不同類型 (動態)？
3. 卡片中應該顯示哪些欄位？
4. 是否應該有動作 (例如「檢視詳細資訊」)？
5. 是否有多個狀態或類別需要不同的範本？

然後產生：
- 適當的 response_semantics 組態
- 靜態範本、動態範本或兩者
- 具有條件式轉譯的正確資料繫結
- 回應式單欄版面配置
- 驗證的測試案例

## 資源

- [調適型卡片設計工具](https://adaptivecards.microsoft.com/designer) - 視覺化設計工具
- [調適型卡片結構描述](https://adaptivecards.io/schemas/adaptive-card.json) - 完整結構描述參考
- [範本語言](https://learn.microsoft.com/en-us/adaptive-cards/templating/language) - 繫結語法指南
- [JSONPath](https://www.rfc-editor.org/rfc/rfc9535) - 路徑查詢語法

## 常見模式

### 具有圖片的清單
```json
{
  "type": "Container",
  "$data": "${items}",
  "items": [
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "width": "auto",
          "items": [
            {
              "type": "Image",
              "url": "${thumbnailUrl}",
              "size": "small",
              "$when": "${thumbnailUrl != null}"
            }
          ]
        },
        {
          "type": "Column",
          "width": "stretch",
          "items": [
            {
              "type": "TextBlock",
              "text": "${title}",
              "weight": "bolder",
              "wrap": true
            }
          ]
        }
      ]
    }
  ]
}
```

### 狀態指示器
```json
{
  "type": "TextBlock",
  "text": "${status}",
  "color": "${if(status == '已完成', 'good', if(status == '進行中', 'attention', 'default'))}"
}
```

### 貨幣格式化
```json
{
  "type": "TextBlock",
  "text": "$${formatNumber(amount, 2)}"
}
```
