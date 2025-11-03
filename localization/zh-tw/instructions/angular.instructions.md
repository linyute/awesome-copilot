---
description: 'Angular 專屬的程式碼標準與最佳實務'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# Angular 開發指示

使用 TypeScript 建立高品質 Angular 應用程式的指示，使用 Angular Signals 進行狀態管理，並遵循 https://angular.dev 中概述的 Angular 最佳實務。

## 專案情境
- 最新的 Angular 版本 (預設使用獨立元件)
- TypeScript 用於型別安全
- Angular CLI 用於專案建立與鷹架
- 遵循 Angular 樣式指南 (https://angular.dev/style-guide)
- 使用 Angular Material 或其他現代化 UI 函式庫以實現一致的樣式 (如果指定)

## 開發標準

### 架構
- 除非明確要求模組，否則使用獨立元件
- 依獨立功能模組或領域組織程式碼以實現延展性
- 實作功能模組的延遲載入以優化效能
- 有效使用 Angular 的內建依賴注入系統
- 以清晰的關注點分離來建構元件 (智慧型與展示型元件)

### TypeScript
- 在 `tsconfig.json` 中啟用嚴格模式以實現型別安全
- 為元件、服務與模型定義清晰的介面與型別
- 使用型別守衛與聯集型別以實現強固的型別檢查
- 使用 RxJS 運算子 (例如 `catchError`) 實作適當的錯誤處理
- 使用型別化表單 (例如 `FormGroup`、`FormControl`) 進行響應式表單

### 元件設計
- 遵循 Angular 的元件生命週期掛鉤最佳實務
- 當使用 Angular >= 19 時，使用 `input()` `output()`、`viewChild()`、`viewChildren()`、`contentChild()` 與 `contentChildren()` 函式而非裝飾器；否則使用裝飾器
- 利用 Angular 的變更偵測策略 (預設或 `OnPush` 以實現效能)
- 保持範本簡潔，並將邏輯放在元件類別或服務中
- 使用 Angular 指令與管道以實現可重複使用的功能

### 樣式
- 使用 Angular 的元件層級 CSS 封裝 (預設：ViewEncapsulation.Emulated)
- 偏好使用 SCSS 進行樣式設定，並採用一致的主題
- 使用 CSS Grid、Flexbox 或 Angular CDK Layout 公用程式實作響應式設計
- 如果使用 Angular Material，請遵循其主題指南
- 透過 ARIA 屬性與語義 HTML 維護可存取性 (a11y)

### 狀態管理
- 使用 Angular Signals 進行元件與服務中的響應式狀態管理
- 利用 `signal()`、`computed()` 與 `effect()` 進行響應式狀態更新
- 使用可寫入的信號進行可變狀態，並使用計算信號進行衍生狀態
- 使用信號與適當的 UI 回饋處理載入與錯誤狀態
- 當將信號與 RxJS 結合時，使用 Angular 的 `AsyncPipe` 處理範本中的可觀察物件

### 資料擷取
- 使用 Angular 的 `HttpClient` 進行具有適當型別的 API 呼叫
- 實作 RxJS 運算子進行資料轉換與錯誤處理
- 在獨立元件中使用 Angular 的 `inject()` 函式進行依賴注入
- 實作快取策略 (例如，`shareReplay` 用於可觀察物件)
- 將 API 回應資料儲存在信號中以實現響應式更新
- 使用全域攔截器處理 API 錯誤以實現一致的錯誤處理

### 安全性
- 使用 Angular 的內建淨化功能淨化使用者輸入
- 實作路由守衛以進行驗證與授權
- 使用 Angular 的 `HttpInterceptor` 進行 CSRF 保護與 API 驗證標頭
- 使用 Angular 的響應式表單與自訂驗證器驗證表單輸入
- 遵循 Angular 的安全性最佳實務 (例如，避免直接 DOM 操作)

### 效能
- 啟用生產建構與 `ng build --prod` 以進行優化
- 使用路由的延遲載入以減少初始套件大小
- 使用 `OnPush` 策略與信號優化變更偵測以實現細粒度響應性
- 在 `ngFor` 迴圈中使用 `trackBy` 以提高渲染效能
- 使用 Angular Universal 實作伺服器端渲染 (SSR) 或靜態網站生成 (SSG) (如果指定)

### 測試
- 使用 Jasmine 與 Karma 為元件、服務與管道撰寫單元測試
- 使用 Angular 的 `TestBed` 進行具有模擬依賴項的元件測試
- 使用 Angular 的測試公用程式測試基於信號的狀態更新
- 使用 Cypress 或 Playwright 撰寫端對端測試 (如果指定)
- 使用 `provideHttpClientTesting` 模擬 HTTP 請求
- 確保關鍵功能的測試覆蓋率高

## 實作流程
1. 規劃專案結構與功能模組
2. 定義 TypeScript 介面與模型
3. 使用 Angular CLI 鷹架元件、服務與管道
4. 實作資料服務與具有基於信號狀態的 API 整合
5. 建立具有清晰輸入與輸出的可重複使用元件
6. 新增響應式表單與驗證
7. 使用 SCSS 與響應式設計應用樣式
8. 實作延遲載入的路由與守衛
9. 使用信號新增錯誤處理與載入狀態
10. 撰寫單元與端對端測試
11. 優化效能與套件大小

## 其他準則
- 遵循 Angular 樣式指南中的檔案命名慣例 (請參閱 https://angular.dev/style-guide)，例如，元件使用 `feature.ts`，服務使用 `feature-service.ts`。對於舊版程式碼庫，請保持與現有模式的一致性。
- 使用 Angular CLI 命令生成樣板程式碼
- 使用清晰的 JSDoc 註解文件化元件與服務
- 在適用情況下確保可存取性合規性 (WCAG 2.1)
- 使用 Angular 的內建 i18n 進行國際化 (如果指定)
- 透過建立可重複使用的公用程式與共享模組來保持程式碼 DRY
- 一致地使用信號進行狀態管理以確保響應式更新
