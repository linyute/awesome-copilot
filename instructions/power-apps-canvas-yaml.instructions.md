---
description: '根據 Microsoft Power Apps YAML schema v3.0，針對 Power Apps Canvas Apps YAML 結構、Power Fx 公式、控制結構、資料型別及原始碼管理最佳實踐的完整指南。'
applyTo: '**/*.{yaml,yml,md,pa.yaml}'
---

# Power Apps Canvas Apps YAML 結構指南

## 概述
本文件提供依據官方 Microsoft Power Apps YAML schema（v3.0）及 Power Fx 文件的 YAML 程式撰寫完整指引。

**官方 Schema 來源**：https://raw.githubusercontent.com/microsoft/PowerApps-Tooling/refs/heads/master/schemas/pa-yaml/v3.0/pa.schema.yaml

## Power Fx 設計原則
Power Fx 是 Power Apps Canvas Apps 的公式語言，遵循以下核心原則：

### 設計理念
- **簡單**：採用 Excel 公式的熟悉概念
- **Excel 一致性**：語法與行為與 Excel 公式一致
- **宣告式**：描述你想要的結果，而非如何達成
- **函數式**：避免副作用，大多數函式皆為純函式
- **組合性**：複雜邏輯由簡單函式組合而成
- **強型別**：型別系統確保資料正確性
- **整合性**：可跨 Power Platform 無縫運作

### 語言哲學
Power Fx 強調：
- 以 Excel 式公式推動低程式碼開發
- 依賴自動重新計算（依賴變更時自動更新）
- 型別安全，編譯時檢查
- 函數式程式設計模式

## 根結構
每個 Power Apps YAML 檔案皆遵循以下頂層結構：

```yaml
App:
  Properties:
    # 應用層級屬性與公式
    StartScreen: =Screen1

Screens:
  # 畫面定義

ComponentDefinitions:
  # 自訂元件定義

DataSources:
  # 資料來源設定

EditorState:
  # 編輯器中繼資料（畫面順序等）
```

## 1. App 區段
`App` 區段定義應用層級屬性與設定。

```yaml
App:
  Properties:
    StartScreen: =Screen1
    BackEnabled: =false
    # 其他 app 屬性（Power Fx 公式）
```

### 重點說明：
- 包含全域設定
- 屬性皆用 Power Fx 公式（前綴 `=`）
- 常見屬性如 `StartScreen`

## 2. Screens 區段
定義所有畫面，為無序映射。

```yaml
Screens:
  Screen1:
    Properties:
      # 畫面屬性
    Children:
      - Label1:
          Control: Label
          Properties:
            Text: ="Hello World"
            X: =10
            Y: =10
      - Button1:
          Control: Button
          Properties:
            Text: ="Click Me"
            X: =10
            Y: =100
```

### 畫面結構：
- **Properties**：畫面層級屬性與公式
- **Children**：畫面上的控制項陣列（依 z-index 排序）

### 控制項定義格式：
```yaml
ControlName:
  Control: ControlType      # 必填：控制項型別
  Properties:
    PropertyName: =PowerFxFormula
  # 選填屬性：
  Group: GroupName          # 用於 Studio 分組
  Variant: VariantName      # 控制項變體（影響預設屬性）
  MetadataKey: Key          # 控制項中繼資料識別
  Layout: LayoutName        # 版面配置
  IsLocked: true/false      # 是否鎖定於編輯器
  Children: []              # 容器控制項的子項（依 z-index 排序）
```

### 控制項版本指定：
可用 `@` 指定控制項版本：
```yaml
MyButton:
  Control: Button@2.1.0     # 指定版本
  Properties:
    Text: ="Click Me"

MyLabel:
  Control: Label            # 預設最新版本
  Properties:
    Text: ="Hello World"
```

## 3. 控制項型別

### 標準控制項
常見第一方控制項包括：
- **基本控制項**：`Label`、`Button`、`TextInput`、`HTMLText`
- **輸入控制項**：`Slider`、`Toggle`、`Checkbox`、`Radio`、`Dropdown`、`Combobox`、`DatePicker`、`ListBox`
- **顯示控制項**：`Image`、`Icon`、`Video`、`Audio`、`PDF viewer`、`Barcode scanner`
- **版面控制項**：`Container`、`Rectangle`、`Circle`、`Gallery`、`DataTable`、`Form`
- **圖表控制項**：`Column chart`、`Line chart`、`Pie chart`
- **進階控制項**：`Timer`、`Camera`、`Microphone`、`Add picture`、`Import`、`Export`

### 容器與版面控制項
容器控制項及其子項範例：
```yaml
MyContainer:
  Control: Container
  Properties:
    Width: =300
    Height: =200
    Fill: =RGBA(240, 240, 240, 1)
  Children:
    - Label1:
        Control: Label
        Properties:
          Text: ="Inside Container"
          X: =10         # 相對於容器
          Y: =10         # 相對於容器
    - Button1:
        Control: Button
        Properties:
          Text: ="Container Button"
          X: =10
          Y: =50
```

### 自訂元件
```yaml
MyCustomControl:
  Control: Component
  ComponentName: MyComponent
  Properties:
    X: =10
    Y: =10
    # 自訂元件屬性
```

### 程式碼元件（PCF）
```yaml
MyPCFControl:
  Control: CodeComponent
  ComponentName: publisherprefix_namespace.classname
  Properties:
    X: =10
    Y: =10
```

## 4. 元件定義
定義可重複使用的自訂元件：

```yaml
ComponentDefinitions:
  MyComponent:
    DefinitionType: CanvasComponent
    Description: "可重複使用的元件"
    AllowCustomization: true
    AccessAppScope: false
    CustomProperties:
      InputText:
        PropertyKind: Input
        DataType: Text
        Description: "輸入文字屬性"
        Default: ="Default Value"
      OutputValue:
        PropertyKind: Output
        DataType: Number
        Description: "輸出數值屬性"
    Properties:
      Fill: =RGBA(255, 255, 255, 1)
      Height: =100
      Width: =200
    Children:
      - Label1:
          Control: Label
          Properties:
            Text: =Parent.InputText
```

### 自訂屬性型別：
- **Input**：由父元件傳值
- **Output**：回傳值給父元件
- **InputFunction**：父元件呼叫的函式
- **OutputFunction**：元件內定義的函式
- **Event**：觸發事件給父元件
- **Action**：具副作用的函式

### 資料型別：
- `Text`、`Number`、`Boolean`
- `DateAndTime`、`Color`、`Currency`
- `Record`、`Table`、`Image`
- `VideoOrAudio`、`Screen`

## 5. 資料來源
設定資料連線：

```yaml
DataSources:
  MyTable:
    Type: Table
    Parameters:
      TableLogicalName: account

  MyActions:
    Type: Actions
    ConnectorId: shared_office365users
    Parameters:
      # 其他連接器參數
```

### 資料來源型別：
- **Table**：Dataverse 資料表或其他表格資料
- **Actions**：連接器動作與流程

## 6. 編輯器狀態
維持編輯器組織：

```yaml
EditorState:
  ScreensOrder:
    - Screen1
    - Screen2
    - Screen3
  ComponentDefinitionsOrder:
    - MyComponent
    - AnotherComponent
```

## Power Fx 公式指引

### 公式語法：
- 所有公式皆以 `=` 開頭
- 使用 Power Fx 語法撰寫運算式
- Null 值以 `null`（不加引號）表示
- 範例：
  ```yaml
  Text: ="Hello World"
  X: =10
  Visible: =Toggle1.Value
  OnSelect: =Navigate(Screen2, ScreenTransition.Fade)
  OptionalProperty: null    # 無值
  ```

### 常見公式範例：
```yaml
# 靜態值
Text: ="Static Text"
X: =50
Visible: =true

# 控制項參照
Text: =TextInput1.Text
Visible: =Toggle1.Value

# 父層參照（容器/畫廊）
Width: =Parent.Width - 20
Height: =Parent.TemplateHeight    # 畫廊模板

# 函式
OnSelect: =Navigate(NextScreen, ScreenTransition.Slide)
Text: =Concatenate("Hello ", User().FullName)

# 條件邏輯
Visible: =If(Toggle1.Value, true, false)
Fill: =If(Button1.Pressed, RGBA(255,0,0,1), RGBA(0,255,0,1))

# 資料操作
Items: =Filter(DataSource, Status = "Active")
Text: =LookUp(Users, ID = 123).Name
```

### Z-Index 與控制項排序：
- `Children` 陣列依 z-index 排序
- 第一個控制項 = 最底層（z-index 1）
- 最後一個控制項 = 最上層（最高 z-index）
- 所有控制項皆採升序排序

## 命名慣例

### 實體名稱：
- 畫面名稱：具描述性且唯一
- 控制項名稱：型別+編號（如 `Button1`、`Label2`）
- 元件名稱：PascalCase

### 屬性名稱：
- 標準屬性：依 schema 原始大小寫
- 自訂屬性：建議用 PascalCase

## 最佳實踐

### 1. 結構組織：
- 畫面邏輯分明
- 用 `Group` 屬性分組相關控制項
- 所有實體皆用有意義名稱

### 2. 公式撰寫：
- 公式可讀性高、格式良好
- 複雜公式盡量加註解
- 避免過度巢狀運算式

### 3. 元件設計：
- 元件設計可重複使用
- 自訂屬性需明確描述
- 屬性型別選擇適當（Input/Output）

### 4. 資料來源管理：
- 資料來源命名具描述性
- 記錄連線需求
- 資料來源設定精簡

## 驗證規則

### 必填屬性：
- 所有控制項必須有 `Control` 屬性
- 元件定義必須有 `DefinitionType`
- 資料來源必須有 `Type`

### 命名模式：
- 實體名稱：至少 1 字元，限英數
- 控制項型別 ID：遵循 `^([A-Z][a-zA-Z0-9]*/)?[A-Z][a-zA-Z0-9]*(@\d+\.\d+\.\d+)?$`
- 程式碼元件名稱：遵循 `^([a-z][a-z0-9]{1,7})_([a-zA-Z0-9]\.)+[a-zA-Z0-9]+$`

## 常見問題與解決方案

### 1. 控制項型別無效：
- 確認型別拼寫正確
- 檢查大小寫
- 驗證型別是否受 schema 支援

### 2. 公式錯誤：
- 所有公式皆以 `=` 開頭
- 使用正確 Power Fx 語法
- 屬性參照正確

### 3. 結構驗證：
- YAML 縮排正確
- 必填屬性皆有
- 完全遵循 schema 結構

### 4. 自訂元件問題：
- 驗證 `ComponentName` 與定義一致
- 自訂屬性定義正確
- 屬性型別選擇適當
- 若用外部元件，需驗證元件庫參照

### 5. 效能考量：
- 避免 YAML 公式過度巢狀
- 資料來源查詢需高效
- 大型資料集建議用可委派公式
- 頻繁更新屬性避免複雜運算

## 進階主題

### 1. 元件庫整合：
```yaml
ComponentDefinitions:
  MyLibraryComponent:
    DefinitionType: CanvasComponent
    AllowCustomization: true
    ComponentLibraryUniqueName: "pub_MyComponentLibrary"
    # 元件定義細節
```

### 2. 響應式設計考量：
- 用 `Parent.Width`、`Parent.Height` 實現響應式尺寸
- 複雜 UI 建議用容器式版面
- 動態定位與尺寸用公式計算

### 3. 畫廊模板：
```yaml
MyGallery:
  Control: Gallery
  Properties:
    Items: =DataSource
    TemplateSize: =100
  Children:
    - GalleryTemplate:  # 每個畫廊項目的模板
        Children:
          - TitleLabel:
              Control: Label
              Properties:
                Text: =ThisItem.Title
                Width: =Parent.TemplateWidth - 20
```

### 4. 表單控制項與資料卡：
```yaml
MyForm:
  Control: Form
  Properties:
    DataSource: =DataSource
    DefaultMode: =FormMode.New
  Children:
    - DataCard1:
        Control: DataCard
        Properties:
          DataField: ="Title"
        Children:
          - DataCardValue1:
              Control: TextInput
              Properties:
                Default: =Parent.Default
```

### 5. 公式錯誤處理：
```yaml
Properties:
  Text: =IfError(LookUp(DataSource, ID = 123).Name, "Not Found")
  Visible: =!IsError(DataSource)
  OnSelect: =IfError(
    Navigate(DetailScreen, ScreenTransition.Cover),
    Notify("Navigation failed", NotificationType.Error)
  )
```

## Power Apps 原始碼管理

### 取得原始碼檔案：
Power Apps YAML 檔案可透過以下方式取得：

1. **Power Platform CLI**：
   ```powershell
   # 列出環境中的 canvas apps
   pac canvas list

   # 下載並解壓 YAML 檔案
   pac canvas download --name "MyApp" --extract-to-directory "C:\path\to\destination"
   ```

2. **手動解壓 .msapp**：
   ```powershell
   # 用 PowerShell 解壓 .msapp 檔案
   Expand-Archive -Path "C:\path\to\yourFile.msapp" -DestinationPath "C:\path\to\destination"
   ```

3. **Dataverse Git 整合**：可直接存取原始檔案，無需 .msapp

### .msapp 檔案結構：
- `\src\App.pa.yaml` - 主應用設定
- `\src\[ScreenName].pa.yaml` - 每個畫面一個檔案
- `\src\Component\[ComponentName].pa.yaml` - 元件定義

**重要說明**：
- 只有 `\src` 資料夾內檔案適合原始碼管理
- .pa.yaml 檔案僅供檢閱，為唯讀
- 不支援外部編輯、合併與衝突解決
- .msapp 內 JSON 檔案不適合原始碼管理

### Schema 版本演進：
1. **實驗格式** (*.fx.yaml)：已停用
2. **早期預覽**：暫時格式，已停用
3. **原始碼格式** (*.pa.yaml)：現行支援版本控管

## Power Fx 公式參考

### 公式分類：

#### **函式**：帶參數、執行運算、回傳值
```yaml
Properties:
  Text: =Concatenate("Hello ", User().FullName)
  X: =Sum(10, 20, 30)
  Items: =Filter(DataSource, Status = "Active")
```

#### **訊號**：回傳環境資訊（無參數）
```yaml
Properties:
  Text: =Location.Latitude & ", " & Location.Longitude
  Visible: =Connection.Connected
  Color: =If(Acceleration.X > 5, Color.Red, Color.Blue)
```

#### **列舉**：預設常數值
```yaml
Properties:
  Fill: =Color.Blue
  Transition: =ScreenTransition.Fade
  Align: =Align.Center
```

#### **命名運算子**：存取容器資訊
```yaml
Properties:
  Text: =ThisItem.Title        # 畫廊內
  Width: =Parent.Width - 20    # 容器內
  Height: =Self.Height / 2     # 自身參照
```

### YAML 常用 Power Fx 函式

#### **導覽與應用控制**：
```yaml
OnSelect: =Navigate(NextScreen, ScreenTransition.Cover)
OnSelect: =Back()
OnSelect: =Exit()
OnSelect: =Launch("https://example.com")
```

#### **資料操作**：
```yaml
Items: =Filter(DataSource, Category = "Active")
Text: =LookUp(Users, ID = 123).Name
OnSelect: =Patch(DataSource, ThisItem, {Status: "Complete"})
OnSelect: =Collect(LocalCollection, {Name: TextInput1.Text})
```

#### **條件邏輯**：
```yaml
Visible: =If(Toggle1.Value, true, false)
Text: =Switch(Status, "New", "🅕", "Complete", "✅", "❓")
Fill: =If(Value < 0, Color.Red, Color.Green)
```

#### **文字處理**：
```yaml
Text: =Concatenate("Hello ", User().FullName)
Text: =Upper(TextInput1.Text)
Text: =Substitute(Label1.Text, "old", "new")
Text: =Left(Title, 10) & "..."
```

#### **數學運算**：
```yaml
Text: =Sum(Sales[Amount])
Text: =Average(Ratings[Score])
Text: =Round(Calculation, 2)
Text: =Max(Values[Number])
```

#### **日期與時間函式**：
```yaml
Text: =Text(Now(), "mm/dd/yyyy")
Text: =DateDiff(StartDate, EndDate, Days)
Text: =Text(Today(), "dddd, mmmm dd, yyyy")
Visible: =IsToday(DueDate)
```

### 公式語法指引：

#### **基本語法規則**：
- 所有公式皆以 `=` 開頭
- 不需前置 `+` 或 `=`（不同於 Excel）
- 字串用雙引號：`="Hello World"`
- 屬性參照：`ControlName.PropertyName`
- YAML 不支援註解

#### **公式元素**：
```yaml
# 常值
Text: ="Static Text"
X: =42
Visible: =true

# 控制項屬性參照
Text: =TextInput1.Text
Visible: =Checkbox1.Value

# 函式呼叫
Text: =Upper(TextInput1.Text)
Items: =Sort(DataSource, Title)

# 複雜運算式
Text: =If(IsBlank(TextInput1.Text), "Enter text", Upper(TextInput1.Text))
```

#### **屬性公式 vs 行為公式**：
```yaml
# 屬性公式（計算值）
Properties:
  Text: =Concatenate("Hello ", User().FullName)
  Visible: =Toggle1.Value

# 行為公式（執行動作，分號分隔多動作）
Properties:
  OnSelect: =Set(MyVar, true); Navigate(NextScreen); Notify("Done!")
```

### 進階公式模式：

#### **集合操作**：
```yaml
Properties:
  Items: =Filter(MyCollection, Status = "Active")
  OnSelect: =ClearCollect(MyCollection, DataSource)
  OnSelect: =Collect(MyCollection, {Name: "New Item", Status: "Active"})
```

#### **錯誤處理**：
```yaml
Properties:
  Text: =IfError(Value(TextInput1.Text), 0)
  OnSelect: =IfError(
    Patch(DataSource, ThisItem, {Field: Value}),
    Notify("Error updating record", NotificationType.Error)
  )
```

#### **動態屬性設定**：
```yaml
Properties:
  Fill: =ColorValue("#" & HexInput.Text)
  Height: =Parent.Height * (Slider1.Value / 100)
  X: =If(Alignment = "Center", (Parent.Width - Self.Width) / 2, 0)
```

## 公式撰寫最佳實踐

### 公式組織：
- 複雜公式拆分為易讀片段
- 用變數儲存中間運算
- 複雜邏輯用具描述性控制項命名
- 相關運算集中管理

### 效能最佳化：
- 大型資料集用可委派函式
- 頻繁更新屬性避免巢狀函式
- 複雜資料轉換用集合
- 外部資料來源呼叫最小化

## Power Fx 資料型別與操作

### 資料型別分類：

#### **基本型別**：
- **Boolean**：`=true`、`=false`
- **Number**：`=123`、`=45.67`
- **Text**：`="Hello World"`
- **Date**：`=Date(2024, 12, 25)`
- **Time**：`=Time(14, 30, 0)`
- **DateTime**：`=Now()`

#### **複合型別**：
- **Color**：`=Color.Red`、`=RGBA(255, 128, 0, 1)`
- **Record**：`={Name: "John", Age: 30}`
- **Table**：`=Table({Name: "John"}, {Name: "Jane"})`
- **GUID**：`=GUID()`

#### **型別轉換**：
```yaml
Properties:
  Text: =Text(123.45, "#,##0.00")        # 數字轉文字
  Text: =Value("123.45")                 # 文字轉數字
  Text: =DateValue("12/25/2024")         # 文字轉日期
  Visible: =Boolean("true")              # 文字轉布林
```

#### **型別檢查**：
```yaml
Properties:
  Visible: =Not(IsBlank(OptionalField))
  Visible: =Not(IsError(Value(TextInput1.Text)))
  Visible: =IsNumeric(TextInput1.Text)
```

### 表格操作：

#### **建立表格**：
```yaml
Properties:
  Items: =Table(
    {Name: "Product A", Price: 10.99},
    {Name: "Product B", Price: 15.99}
  )
  Items: =["Option 1", "Option 2", "Option 3"]  # 單欄表格
```

#### **篩選與排序**：
```yaml
Properties:
  Items: =Filter(Products, Price > 10)
  Items: =Sort(Products, Name, Ascending)
  Items: =SortByColumns(Products, "Price", Descending, "Name", Ascending)
```

#### **資料轉換**：
```yaml
Properties:
  Items: =AddColumns(Products, "Total", Price * Quantity)
  Items: =RenameColumns(Products, "Price", "Cost")
  Items: =ShowColumns(Products, "Name", "Price")
  Items: =DropColumns(Products, "InternalID")
```

#### **聚合運算**：
```yaml
Properties:
  Text: =Sum(Products, Price)
  Text: =Average(Products, Rating)
  Text: =Max(Products, Price)
  Text: =CountRows(Products)
```

### 變數與狀態管理：

#### **全域變數**：
```yaml
Properties:
  OnSelect: =Set(MyGlobalVar, "Hello World")
  Text: =MyGlobalVar
```

#### **Context 變數**：
```yaml
Properties:
  OnSelect: =UpdateContext({LocalVar: "Screen Specific"})
  OnSelect: =Navigate(NextScreen, None, {PassedValue: 42})
```

#### **集合**：
```yaml
Properties:
  OnSelect: =ClearCollect(MyCollection, DataSource)
  OnSelect: =Collect(MyCollection, {Name: "New Item"})
  Items: =MyCollection
```

## Power Fx 強化連接器與外部資料

### 連接器整合：
```yaml
DataSources:
  SharePointList:
    Type: Table
    Parameters:
      TableLogicalName: "Custom List"

  Office365Users:
    Type: Actions
    ConnectorId: shared_office365users
```

### 外部資料操作：
```yaml
Properties:
  Items: =Filter(SharePointList, Status = "Active")
  OnSelect: =Office365Users.SearchUser({searchTerm: SearchInput.Text})
```

### 委派考量：
```yaml
Properties:
  # 可委派操作（伺服器端執行）
  Items: =Filter(LargeTable, Status = "Active")    # 高效

  # 不可委派操作（可能下載全部資料）
  Items: =Filter(LargeTable, Len(Description) > 100)  # 會警告
```

## 疑難排解與常見模式

### 常見錯誤模式：
```yaml
# 處理空值
Properties:
  Text: =If(IsBlank(OptionalText), "Default", OptionalText)

# 錯誤處理
Properties:
  Text: =IfError(RiskyOperation(), "Fallback Value")

# 驗證輸入
Properties:
  Visible: =And(
    Not(IsBlank(NameInput.Text)),
    IsNumeric(AgeInput.Text),
    IsMatch(EmailInput.Text, Email)
  )
```

### 效能最佳化：
```yaml
# 高效資料載入
Properties:
  Items: =Filter(LargeDataSource, Status = "Active")    # 伺服器端過濾

# 用可委派操作
Properties:
  Items: =Sort(Filter(DataSource, Active), Name)        # 可委派
  # 避免：Sort(DataSource, If(Active, Name, ""))       # 不可委派
```

### 記憶體管理：
```yaml
# 清除未用集合
Properties:
  OnSelect: =Clear(TempCollection)

# 限制資料取得量
Properties:
  Items: =FirstN(Filter(DataSource, Status = "Active"), 50)
```

請注意：本指南涵蓋 Power Apps Canvas Apps YAML 結構與 Power Fx 公式的完整內容。請務必依官方 schema 驗證 YAML，並於 Power Apps Studio 測試公式。
