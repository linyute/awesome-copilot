---
description: '使用 Bicep 進行基礎架構即程式碼'
applyTo: '**/*.bicep, **/*.bicepparam, **/bicepconfig.json'
---

## 命名慣例

-   撰寫 Bicep 程式碼時，所有名稱（變數、參數、資源）皆使用 lowerCamelCase（小駝峰式命名法）
-   使用具資源類型描述性的符號名稱（例如：使用 `'storageAccount'` 而非 `'storageAccountName'`）
-   避免在符號名稱中使用 `'name'`，因為符號名稱代表資源本身，而非資源的名稱
-   避免透過後綴來區分變數與參數

## 結構與宣告

-   務必在檔案頂部宣告參數，並加上 `@description` 裝飾器
-   所有資源皆使用最新的穩定版 API 版本
-   為所有參數加上具描述性的 `@description` 裝飾器
-   為命名參數指定最小與最大字元長度

## 參數

-   設定對測試環境安全的預設值（使用低成本定價層）
-   謹慎使用 `@allowed` 裝飾器，以免阻礙有效的部署
-   針對不同部署間會變動的設定使用參數
-   當專案的工具版本支援時，使用帶有 `using` 宣告的 `.bicepparam` 檔案；必要時保留 JSON 參數檔案。請勿將機密資訊放入參數檔案，並改用受支援的機密參考。
-   當能讓驗證更清晰時，針對結構化參數合約使用受支援的使用者自訂物件類型。

## 模組與驗證

-   當符合專案需求時，優先使用適當的 Azure Verified Module，並參考特定模組版本。在進行無關變更時，請保留現有的模組版本。
-   遵循專案的 Bicep CLI 版本與 `bicepconfig.json` linter 設定。在部署前執行專案的 Bicep 建置／lint 檢查，並解決診斷問題，而非全域停用規則。

## 變數

-   變數會自動從解析後的值推斷類型
-   使用變數來容納複雜的運算式，而非直接嵌入資源屬性中

## 資源參考

-   使用符號名稱進行資源參考，而非 `reference()` 或 `resourceId()` 函式
-   透過符號名稱（`resourceA.id`）建立資源相依性，而非明確使用 `dependsOn`
-   若要存取其他資源的屬性，請使用 `'existing'` 關鍵字，而非透過輸出傳遞值

## 資源名稱

-   使用搭配 `uniqueString()` 的範本運算式，建立具意義且唯一的資源名稱
-   為 `uniqueString()` 的結果加上前綴，因為部分資源不允許名稱以數字開頭

## 子資源

-   避免過度巢狀化子資源
-   使用 `parent` 屬性或巢狀結構，而非為子資源建構資源名稱

## 安全性

-   切勿在輸出中包含機密資訊或金鑰
-   直接在輸出中使用資源屬性（例如：`storageAccount.properties.primaryEndpoints`）

## 文件

-   在 Bicep 檔案中加入實用的 `//` 註解以提升可讀性

## 參考資料

-   [Bicep 模組與 Azure Verified Modules](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/modules)
-   [Bicep 參數檔案](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/parameter-files)
-   [Bicep linter](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/linter)