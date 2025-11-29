---
description: 'PCF 元件的完整資訊清單結構描述參考，包含所有可用的 XML 元素'
applyTo: '**/*.xml'
---

# 資訊清單結構描述參考

資訊清單檔案 (`ControlManifest.Input.xml`) 是定義程式碼元件的中繼資料文件。此參考列出所有可用的資訊清單元素及其用途。

## 根元素

### manifest

包含整個元件定義的根元素。

## 核心元素

### code

參考實作元件邏輯的資源檔案。

**屬性：**
- `path`：TypeScript/JavaScript 實作檔案的路徑
- `order`：載入順序 (通常為「1」)

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

### control

定義元件本身，包括命名空間、版本和顯示資訊。

**主要屬性：**
- `namespace`：元件的命名空間
- `constructor`：建構子名稱
- `version`：語義化版本 (例如「1.0.0」)
- `display-name-key`：顯示名稱的資源索引鍵
- `description-key`：描述的資源索引鍵
- `control-type`：控制項類型 (「standard」或「virtual」)

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

## 屬性元素

### property

定義元件的輸入或輸出屬性。

**主要屬性：**
- `name`：屬性名稱
- `display-name-key`：顯示名稱的資源索引鍵
- `description-key`：描述的資源索引鍵
- `of-type`：資料類型 (例如「SingleLine.Text」、「Whole.None」、「TwoOptions」、「DateAndTime.DateOnly」)
- `usage`：屬性使用方式 (「bound」或「input」)
- `required`：屬性是否為必填 (true/false)
- `of-type-group`：類型群組的參考
- `default-value`：屬性的預設值

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

### type-group

定義屬性可以接受的類型群組。

**用途：** 允許屬性接受多種資料類型

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

## 資料集元素

### data-set

定義用於處理表格資料的資料集屬性。

**主要屬性：**
- `name`：資料集名稱
- `display-name-key`：顯示名稱的資源索引鍵
- `description-key`：描述的資源索引鍵

**可用性：** 模型導向應用程式 (畫布應用程式有其限制)

## 資源元素

### resources

所有資源定義 (程式碼、CSS、圖片、當地語系化) 的容器。

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

### css

參考 CSS 樣式表檔案。

**屬性：**
- `path`：CSS 檔案的路徑
- `order`：載入順序

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

### img

參考圖片資源。

**屬性：**
- `path`：圖片檔案的路徑

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

### resx

參考用於當地語系化的資源檔案。

**屬性：**
- `path`：.resx 檔案的路徑
- `version`：版本號碼

**可用性：** 模型導向應用程式、畫布應用程式、入口網站

## 功能使用元素

### uses-feature

宣告元件使用特定的平台功能。

**主要屬性：**
- `name`：功能名稱 (例如「Device.captureImage」、「Device.getCurrentPosition」、「Utility.lookupObjects」、「WebAPI」)
- `required`：功能是否為必填 (true/false)

**常用功能：**
- Device.captureAudio
- Device.captureImage
- Device.captureVideo
- Device.getBarcodeValue
- Device.getCurrentPosition
- Device.pickFile
- Utility.lookupObjects
- WebAPI

**可用性：** 依功能和平台而異

### feature-usage

功能宣告的容器。

**可用性：** 模型導向應用程式、畫布應用程式

## 相依性元素

### dependency

宣告元件所需的外部相依性。

**可用性：** 模型導向應用程式、畫布應用程式

### external-service-usage

宣告元件使用的外部服務。

**主要屬性：**
- `enabled`：是否啟用外部服務使用 (true/false)

**可用性：** 模型導向應用程式、畫布應用程式

## 函式庫元素

### platform-library

參考平台提供的函式庫 (例如 React、Fluent UI)。

**主要屬性：**
- `name`：函式庫名稱 (例如「React」、「Fluent」)
- `version`：函式庫版本

**可用性：** 模型導向應用程式、畫布應用程式

## 事件元素

### event

定義元件可以引發的自訂事件。

**主要屬性：**
- `name`：事件名稱
- `display-name-key`：顯示名稱的資源索引鍵
- `description-key`：描述的資源索引鍵

**可用性：** 模型導向應用程式、畫布應用程式

## 動作元素

### platform-action

定義元件可以叫用的平台動作。

**可用性：** 模型導向應用程式

## 範例資訊清單結構

```xml
<?xml version="1.0" encoding="utf-8" ?>
<manifest>
  <control namespace="SampleNamespace" 
           constructor="SampleControl" 
           version="1.0.0" 
           display-name-key="Sample_Display_Key" 
           description-key="Sample_Desc_Key" 
           control-type="standard">
    
    <!-- 屬性 -->
    <property name="sampleProperty" 
              display-name-key="Property_Display_Key" 
              description-key="Property_Desc_Key" 
              of-type="SingleLine.Text" 
              usage="bound" 
              required="true" />
    
    <!-- 類型群組範例 -->
    <type-group name="numbers">
      <type>Whole.None</type>
      <type>Currency</type>
      <type>FP</type>
      <type>Decimal</type>
    </type-group>
    
    <property name="numericProperty"
              display-name-key="Numeric_Display_Key"
              of-type-group="numbers"
              usage="bound" />
    
    <!-- 資料集範例 -->
    <data-set name="dataSetProperty" 
              display-name-key="Dataset_Display_Key">
    </data-set>
    
    <!-- 事件 -->
    <event name="onCustomEvent"
           display-name-key="Event_Display_Key"
           description-key="Event_Desc_Key" />
    
    <!-- 資源 -->
    <resources>
      <code path="index.ts" order="1" />
      <css path="css/SampleControl.css" order="1" />
      <img path="img/icon.png" />
      <resx path="strings/SampleControl.1033.resx" version="1.0.0" />
    </resources>
    
    <!-- 功能使用 -->
    <feature-usage>
      <uses-feature name="WebAPI" required="true" />
      <uses-feature name="Device.captureImage" required="false" />
    </feature-usage>
    
    <!-- 平台函式庫 -->
    <platform-library name="React" version="16.8.6" />
    <platform-library name="Fluent" version="8.29.0" />
    
  </control>
</manifest>
```

## 資訊清單驗證

資訊清單結構描述在建置過程中會進行驗證：
- 缺少必要的元素將導致建置錯誤
- 無效的屬性值將被標記
- 使用 `pac pcf` 命令驗證資訊清單結構

## 最佳實務

1. **語義化版本控制**：對元件版本使用語義化版本控制 (主要.次要.修補)
2. **當地語系化索引鍵**：始終使用資源索引鍵而不是硬式編碼的字串
3. **功能宣告**：宣告您的元件使用的所有功能
4. **必要與可選**：僅在確實必要時才將屬性和功能標記為必要
5. **類型群組**：對接受多個數字類型的屬性使用類型群組
6. **資料類型**：選擇符合您要求的最具體資料類型
7. **CSS 範圍**：限定 CSS 範圍以避免與主機應用程式衝突
8. **資源組織**：將資源組織在單獨的資料夾中 (css/, img/, strings/)

## 資料類型參考

屬性常用的 `of-type` 值：

- **文字**：SingleLine.Text、Multiple、SingleLine.TextArea、SingleLine.Email、SingleLine.Phone、SingleLine.Url、SingleLine.Ticker
- **數字**：Whole.None、Currency、FP、Decimal
- **日期/時間**：DateAndTime.DateAndTime、DateAndTime.DateOnly
- **布林值**：TwoOptions
- **查詢**：Lookup.Simple
- **選項集**：OptionSet、MultiSelectOptionSet
- **其他**：Enum

## 平台可用性圖例

- ✅ **模型導向應用程式**：完全支援
- ✅ **畫布應用程式**：支援 (可能有其限制)
- ✅ **入口網站**：在 Power Pages 中支援

大多數資訊清單元素在所有平台上都可用，但某些功能 (例如某些裝置 API 或平台動作) 可能僅限於特定平台。請務必在您的目標環境中進行測試。
