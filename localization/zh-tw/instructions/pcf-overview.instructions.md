---
description: 'Power Apps Component Framework 總覽與基礎'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# Power Apps Component Framework 總覽

Power Apps Component Framework 賦予專業開發人員和應用程式建立者為模型導向應用程式和畫布應用程式建立程式碼元件的能力。這些程式碼元件可用於增強使用者在表單、檢視、儀表板和畫布應用程式螢幕上處理資料的使用者體驗。

## 主要功能

您可以使用 PCF 來：
- 將表單上顯示數值文字的欄位替換為 `dial` 或 `slider` 程式碼元件
- 將列表轉換為綁定到資料集的完全不同的視覺體驗，例如 `Calendar` 或 `Map`

## 重要限制

- Power Apps Component Framework 僅適用於統一介面，不適用於舊版網頁用戶端
- Power Apps Component Framework 目前不支援內部部署環境

## PCF 與網頁資源的不同之處

與 HTML 網頁資源不同，程式碼元件是：
- 作為相同內容的一部分呈現
- 與任何其他元件同時載入
- 為使用者提供無縫體驗

程式碼元件可以：
- 用於 Power Apps 的全部功能
- 在不同的表格和表單中重複使用多次
- 將所有 HTML、CSS 和 TypeScript 檔案捆綁到單一解決方案套件中
- 跨環境移動
- 可透過 AppSource 獲得

## 主要優勢

### 豐富的框架 API
- 元件生命週期管理
- 上下文資料和中繼資料存取
- 透過 Web API 無縫伺服器存取
- 公用程式和資料格式設定方法
- 裝置功能：相機、位置、麥克風
- 使用者體驗元素：對話方塊、查詢、全頁呈現

### 開發效益
- 支援現代網頁實作
- 針對效能進行最佳化
- 高重複使用性
- 將所有檔案捆綁到單一解決方案檔案中
- 處理因效能原因被銷毀和重新載入，同時保留狀態

## 授權要求

Power Apps Component Framework 授權基於所使用的資料和連線類型：

### 進階程式碼元件
直接透過使用者瀏覽器用戶端 (而非透過連接器) 連接到外部服務或資料的程式碼元件：
- 被視為進階元件
- 使用這些元件的應用程式成為進階應用程式
- 終端使用者需要 Power Apps 授權

透過新增至資訊清單聲明為進階：
```xml
<external-service-usage enabled="true">
  <domain>www.microsoft.com</domain>
</external-service-usage>
```

### 標準程式碼元件
不連接到外部服務或資料的程式碼元件：
- 使用這些元件的應用程式仍具有標準功能
- 終端使用者需要最低 Office 365 授權

**注意**：如果在連接到 Microsoft Dataverse 的模型導向應用程式中使用程式碼元件，終端使用者將需要 Power Apps 授權。

## 相關資源

- [什麼是程式碼元件？](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/custom-controls-overview)
- [畫布應用程式的程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/component-framework-for-canvas-apps)
- [建立和建構程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/create-custom-controls-using-pcf)
- [學習 Power Apps Component Framework](https://learn.microsoft.com/en-us/training/paths/use-power-apps-component-framework)
- [在 Power Pages 中使用程式碼元件](https://learn.microsoft.com/en-us/power-apps/maker/portals/component-framework)

## 訓練資源

- [使用 Power Apps Component Framework 建立元件 - 訓練](https://learn.microsoft.com/en-us/training/paths/create-components-power-apps-component-framework/)
- [Microsoft 認證：Power Platform 開發人員助理](https://learn.microsoft.com/en-us/credentials/certifications/power-platform-developer-associate/)
