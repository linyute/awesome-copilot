---
description: '完整的 PCF API 參考，包含所有介面及其在模型導向和畫布應用程式中的可用性'
applyTo: '**/*.{ts,tsx,js}'
---

# Power Apps Component Framework API 參考

Power Apps Component Framework 提供豐富的 API，使您能夠建立強大的程式碼元件。此參考列出所有可用的介面及其在不同應用程式類型中的可用性。

## API 可用性

下表顯示 Power Apps Component Framework 中所有可用的 API 介面，以及它們在模型導向應用程式和畫布應用程式中的可用性。

| API | 模型導向應用程式 | 畫布應用程式 |
|-----|------------------|-------------|
| AttributeMetadata | 是 | 否 |
| Client | 是 | 是 |
| Column | 是 | 是 |
| ConditionExpression | 是 | 是 |
| Context | 是 | 是 |
| DataSet | 是 | 是 |
| Device | 是 | 是 |
| Entity | 是 | 是 |
| Events | 是 | 是 |
| Factory | 是 | 是 |
| Filtering | 是 | 是 |
| Formatting | 是 | 是 |
| ImageObject | 是 | 是 |
| Linking | 是 | 是 |
| Mode | 是 | 是 |
| Navigation | 是 | 是 |
| NumberFormattingInfo | 是 | 是 |
| Paging | 是 | 是 |
| Popup | 是 | 是 |
| PopupService | 是 | 是 |
| PropertyHelper | 是 | 是 |
| Resources | 是 | 是 |
| SortStatus | 是 | 是 |
| StandardControl | 是 | 是 |
| UserSettings | 是 | 是 |
| Utility | 是 | 是 |
| WebApi | 是 | 是 |

## 主要 API 命名空間

### Context API

`Context` 物件提供對所有框架功能的存取，並傳遞給元件的生命週期方法。它包含：

- **Client**：有關用戶端的資訊 (表單因數、網路狀態)
- **Device**：裝置功能 (相機、位置、麥克風)
- **Factory**：用於建立框架物件的 Factory 方法
- **Formatting**：數字和日期格式設定
- **Mode**：元件模式和追蹤
- **Navigation**：導覽方法
- **Resources**：存取資源 (圖片、字串)
- **UserSettings**：使用者設定 (地區設定、數字格式、安全性角色)
- **Utils**：公用程式方法 (getEntityMetadata、hasEntityPrivilege、lookupObjects)
- **WebApi**：Dataverse Web API 方法

### Data API

- **DataSet**：處理表格資料
- **Column**：存取欄位中繼資料和資料
- **Entity**：存取記錄資料
- **Filtering**：定義資料篩選
- **Linking**：定義關聯
- **Paging**：處理資料分頁
- **SortStatus**：管理排序

### UI API

- **Popup**：建立彈出式對話方塊
- **PopupService**：管理彈出式生命週期
- **Mode**：取得元件呈現模式

### Metadata API

- **AttributeMetadata**：欄位中繼資料 (僅限模型導向)
- **PropertyHelper**：屬性中繼資料輔助函式

### Standard Control

- **StandardControl**：所有程式碼元件的基礎介面，具有生命週期方法：
  - `init()`：初始化元件
  - `updateView()`：更新元件使用者介面
  - `destroy()`：清理資源
  - `getOutputs()`：回傳輸出值

## 使用指南

### 模型導向與畫布應用程式

由於平台差異，某些 API 僅在模型導向應用程式中可用：

- **AttributeMetadata**：僅限模型導向 - 提供詳細的欄位中繼資料
- 大多數其他 API 在兩個平台中都可用

### API 版本相容性

- 始終檢查您的目標平台 (模型導向或畫布) 的 API 可用性
- 某些 API 在不同平台之間可能具有不同的行為
- 在目標環境中測試元件以確保相容性

### 常見模式

1. **存取 Context API**
   ```typescript
   // 在 init 或 updateView 中
   const userLocale = context.userSettings.locale;
   const isOffline = context.client.isOffline();
   ```

2. **處理 DataSet**
   ```typescript
   // 存取資料集記錄
   const records = context.parameters.dataset.records;
   
   // 取得已排序的欄位
   const sortedColumns = context.parameters.dataset.sorting;
   ```

3. **使用 WebApi**
   ```typescript
   // 擷取記錄
   context.webAPI.retrieveMultipleRecords("account", "?$select=name");
   
   // 建立記錄
   context.webAPI.createRecord("contact", data);
   ```

4. **裝置功能**
   ```typescript
   // 擷取圖片
   context.device.captureImage();
   
   // 取得目前位置
   context.device.getCurrentPosition();
   ```

5. **格式設定**
   ```typescript
   // 格式化日期
   context.formatting.formatDateLong(date);
   
   // 格式化數字
   context.formatting.formatDecimal(value);
   ```

## 最佳實務

1. **型別安全**：使用 TypeScript 進行型別檢查和 IntelliSense
2. **空值檢查**：在存取 API 物件之前，始終檢查空值/未定義
3. **錯誤處理**：將 API 呼叫包裝在 try-catch 區塊中
4. **平台偵測**：檢查 `context.client.getFormFactor()` 以調整行為
5. **API 可用性**：在使用前驗證您的目標平台的 API 可用性
6. **效能**：在適當時快取 API 結果以避免重複呼叫

## 額外資源

- 有關每個 API 的詳細文件，請參閱 [Power Apps Component Framework API 參考](https://learn.microsoft.com/power-apps/developer/component-framework/reference/)
- 每個 API 的範例程式碼可在 [PowerApps-Samples 儲存庫](https://github.com/microsoft/PowerApps-Samples/tree/master/component-framework) 中找到
