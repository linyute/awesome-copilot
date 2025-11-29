---
description: '使用 Bicep 的基礎設施即程式碼最佳實踐'
applyTo: '**/*.bicep'
---

## 命名慣例

-   撰寫 Bicep 程式碼時，所有名稱（變數、參數、資源）皆使用 lowerCamelCase
-   資源型別請用具描述性的符號名稱（例如 'storageAccount' 而非 'storageAccountName'）
-   不要在符號名稱中使用 'name'，因為它代表資源本身而非資源名稱
-   不要用後綴區分變數與參數

## 結構與宣告

-   所有參數請在檔案最上方宣告，並加上 @description 註解
-   所有資源皆使用最新穩定 API 版本
-   所有參數皆加上具描述性的 @description 註解
-   命名參數請指定最小與最大字元長度

## 參數

-   預設值請設定為測試環境安全（使用低成本方案）
-   請謹慎使用 @allowed 註解，避免阻擋有效部署
-   部署間會變動的設定請用參數

## 變數

-   變數會自動從解析值推斷型別
-   複雜運算式請用變數包裝，不要直接嵌入資源屬性

## 資源參照

-   資源參照請用符號名稱，不要用 reference() 或 resourceId() 函式
-   資源相依性請用符號名稱（如 resourceA.id），不要用明確的 dependsOn
-   取用其他資源屬性時，請用 'existing' 關鍵字，不要透過 outputs 傳值

## 資源名稱

-   用 template expressions 搭配 uniqueString() 產生有意義且唯一的資源名稱
-   uniqueString() 結果請加上前綴，因部分資源名稱不能以數字開頭

## 子資源

-   避免過度巢狀子資源
-   子資源請用 parent 屬性或巢狀結構，不要自行組合資源名稱

## 資安

-   輸出中絕不包含密碼或金鑰
-   輸出請直接用資源屬性（如 storageAccount.properties.primaryEndpoints）

## 文件

-   請在 Bicep 檔案中加入有幫助的 // 註解以提升可讀性
