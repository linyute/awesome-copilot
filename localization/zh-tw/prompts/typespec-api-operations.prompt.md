---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '為 TypeSpec API 外掛程式新增具有正確路由、參數和調適型卡片的 GET、POST、PATCH 和 DELETE 作業'
model: 'gpt-4.1'
tags: [typespec, m365-copilot, api-plugin, rest-operations, crud]
---

# 新增 TypeSpec API 作業

為現有的 Microsoft 365 Copilot TypeSpec API 外掛程式新增 RESTful 作業。

## 新增 GET 作業

### 簡單的 GET - 列出所有項目
```typescript
/**
 * 列出所有項目。
 */
@route("/items")
@get op listItems(): Item[];
```

### 具有查詢參數的 GET - 篩選結果
```typescript
/**
 * 列出根據準則篩選的項目。
 * @param userId 選用的使用者 ID，用於篩選項目
 */
@route("/items")
@get op listItems(@query userId?: integer): Item[];
```

### 具有路徑參數的 GET - 取得單一項目
```typescript
/**
 * 透過 ID 取得特定項目。
 * @param id 要擷取的項目 ID
 */
@route("/items/{id}")
@get op getItem(@path id: integer): Item;
```

### 具有調適型卡片的 GET
```typescript
/**
 * 列出具有調適型卡片視覺化呈現的項目。
 */
@route("/items")
@card(#{
  dataPath: "$",
  title: "$.title",
  file: "item-card.json"
})
@get op listItems(): Item[];
```

**建立調適型卡片** (`appPackage/item-card.json`)：
```json
{
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
          "text": "**${if(title, title, '不適用')}**",
          "wrap": true
        },
        {
          "type": "TextBlock",
          "text": "${if(description, description, '不適用')}",
          "wrap": true
        }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "檢視詳細資訊",
      "url": "https://example.com/items/${id}"
    }
  ]
}
```

## 新增 POST 作業

### 簡單的 POST - 建立項目
```typescript
/**
 * 建立新項目。
 * @param item 要建立的項目
 */
@route("/items")
@post op createItem(@body item: CreateItemRequest): Item;

model CreateItemRequest {
  title: string;
  description?: string;
  userId: integer;
}
```

### 具有確認對話方塊的 POST
```typescript
/**
 * 建立具有確認作業的新項目。
 */
@route("/items")
@post
@capabilities(#{
  confirmation: #{
    type: "AdaptiveCard",
    title: "建立項目",
    body: """
    您確定要建立此項目嗎？
      * **標題**: {{ function.parameters.item.title }}
      * **使用者 ID**: {{ function.parameters.item.userId }}
    """
  }
})
op createItem(@body item: CreateItemRequest): Item;
```

## 新增 PATCH 作業

### 簡單的 PATCH - 更新項目
```typescript
/**
 * 更新現有項目。
 * @param id 要更新的項目 ID
 * @param item 更新後的項目資料
 */
@route("/items/{id}")
@patch op updateItem(
  @path id: integer,
  @body item: UpdateItemRequest
): Item;

model UpdateItemRequest {
  title?: string;
  description?: string;
  status?: "active" | "completed" | "archived";
}
```

### 具有確認對話方塊的 PATCH
```typescript
/**
 * 更新具有確認作業的項目。
 */
@route("/items/{id}")
@patch
@capabilities(#{
  confirmation: #{
    type: "AdaptiveCard",
    title: "更新項目",
    body: """
    正在更新項目 #{{ function.parameters.id }}:
      * **標題**: {{ function.parameters.item.title }}
      * **狀態**: {{ function.parameters.item.status }}
    """
  }
})
op updateItem(
  @path id: integer,
  @body item: UpdateItemRequest
): Item;
```

## 新增 DELETE 作業

### 簡單的 DELETE
```typescript
/**
 * 刪除項目。
 * @param id 要刪除的項目 ID
 */
@route("/items/{id}")
@delete op deleteItem(@path id: integer): void;
```

### 具有確認對話方塊的 DELETE
```typescript
/**
 * 刪除具有確認作業的項目。
 */
@route("/items/{id}")
@delete
@capabilities(#{
  confirmation: #{
    type: "AdaptiveCard",
    title: "刪除項目",
    body: """
    ⚠️ 您確定要刪除項目 #{{ function.parameters.id }} 嗎？
    此動作無法復原。
    """
  }
})
op deleteItem(@path id: integer): void;
```

## 完整的 CRUD 範例

### 定義服務與模型
```typescript
@service
@server("https://api.example.com")
@actions(#{
  nameForHuman: "項目 API",
  descriptionForHuman: "管理項目",
  descriptionForModel: "讀取、建立、更新與刪除項目"
})
namespace ItemsAPI {
  
  // 模型
  model Item {
    @visibility(Lifecycle.Read)
    id: integer;
    
    userId: integer;
    title: string;
    description?: string;
    status: "active" | "completed" | "archived";
    
    @format("date-time")
    createdAt: utcDateTime;
    
    @format("date-time")
    updatedAt?: utcDateTime;
  }

  model CreateItemRequest {
    userId: integer;
    title: string;
    description?: string;
  }

  model UpdateItemRequest {
    title?: string;
    description?: string;
    status?: "active" | "completed" | "archived";
  }

  // 作業
  @route("/items")
  @card(#{ dataPath: "$", title: "$.title", file: "item-card.json" })
  @get op listItems(@query userId?: integer): Item[];

  @route("/items/{id}")
  @card(#{ dataPath: "$", title: "$.title", file: "item-card.json" })
  @get op getItem(@path id: integer): Item;

  @route("/items")
  @post
  @capabilities(#{
    confirmation: #{
      type: "AdaptiveCard",
      title: "建立項目",
      body: "正在建立：**{{ function.parameters.item.title }}**"
    }
  })
  op createItem(@body item: CreateItemRequest): Item;

  @route("/items/{id}")
  @patch
  @capabilities(#{
    confirmation: #{
      type: "AdaptiveCard",
      title: "更新項目",
      body: "正在更新項目 #{{ function.parameters.id }}"
    }
  })
  op updateItem(@path id: integer, @body item: UpdateItemRequest): Item;

  @route("/items/{id}")
  @delete
  @capabilities(#{
    confirmation: #{
      type: "AdaptiveCard",
      title: "刪除項目",
      body: "⚠️ 刪除項目 #{{ function.parameters.id }}？"
    }
  })
  op deleteItem(@path id: integer): void;
}
```

## 進階功能

### 多個查詢參數
```typescript
@route("/items")
@get op listItems(
  @query userId?: integer,
  @query status?: "active" | "completed" | "archived",
  @query limit?: integer,
  @query offset?: integer
): ItemList;

model ItemList {
  items: Item[];
  total: integer;
  hasMore: boolean;
}
```

### 標頭參數
```typescript
@route("/items")
@get op listItems(
  @header("X-API-Version") apiVersion?: string,
  @query userId?: integer
): Item[];
```

### 自訂回應模型
```typescript
@route("/items/{id}")
@delete op deleteItem(@path id: integer): DeleteResponse;

model DeleteResponse {
  success: boolean;
  message: string;
  deletedId: integer;
}
```

### 錯誤回應
```typescript
model ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

@route("/items/{id}")
@get op getItem(@path id: integer): Item | ErrorResponse;
```

## 測試提示

新增作業後，使用以下提示進行測試：

**GET 作業：**
- 「列出所有項目並在表格中顯示」
- 「顯示使用者 ID 1 的項目」
- 「取得項目 42 的詳細資訊」

**POST 作業：**
- 「為使用者 1 建立標題為 'My Task' 的新項目」
- 「新增項目：標題為 'New Feature'，說明為 'Add login'」

**PATCH 作業：**
- 「將項目 10 的標題更新為 'Updated Title'」
- 「將項目 5 的狀態變更為已完成」

**DELETE 作業：**
- 「刪除項目 99」
- 「移除 ID 為 15 的項目」

## 最佳做法

### 參數命名
- 使用具描述性的參數名稱：使用 `userId` 而非 `uid`
- 跨作業保持一致
- 對於篩選器使用選用參數 (`?`)

### 文件
- 為所有作業新增 JSDoc 註解
- 描述每個參數的作用
- 記錄預期的回應

### 模型
- 對於 `id` 等唯讀欄位使用 `@visibility(Lifecycle.Read)`
- 對於日期欄位使用 `@format("date-time")`
- 對於列舉使用聯集類型：`"active" | "completed"`
- 使用 `?` 明確標記選用欄位

### 確認
- 始終為破壞性作業 (DELETE, PATCH) 新增確認
- 在確認本體中顯示關鍵詳細資訊
- 對於不可逆的動作使用警告表情符號 (⚠️)

### 調適型卡片
- 保持卡片簡單且專注
- 使用 `${if(..., ..., '不適用')}` 進行條件式轉譯
- 包含常見後續步驟的動作按鈕
- 使用實際的 API 回應測試資料繫結

### 路由
- 遵循 RESTful 慣例：
  - `GET /items` - 清單
  - `GET /items/{id}` - 取得單一項
  - `POST /items` - 建立
  - `PATCH /items/{id}` - 更新
  - `DELETE /items/{id}` - 刪除
- 在同一個命名空間中群組相關作業
- 對於階層式資源使用巢狀路由

## 常見問題

### 問題：參數未顯示在 Copilot 中
**解決方案**：檢查參數是否正確使用了 `@query`、`@path` 或 `@body` 裝飾器。

### 問題：調適型卡片未轉譯
**解決方案**：驗證 `@card` 裝飾器中的檔案路徑，並檢查 JSON 語法。

### 問題：確認對話方塊未出現
**解決方案**：確保 `@capabilities` 裝飾器已正確格式化並包含確認物件。

### 問題：模型屬性未出現在回應中
**解決方案**：檢查屬性是否需要 `@visibility(Lifecycle.Read)`，或者如果該屬性應該是可寫入的，則將其移除。
