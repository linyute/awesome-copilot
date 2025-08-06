---
description: 'Angular 專屬程式撰寫標準與最佳實踐'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# Angular 開發指引

本指引適用於以 TypeScript 建構高品質 Angular 應用，採用 Angular Signals 進行狀態管理，並遵循 https://angular.dev 所述 Angular 最佳實踐。

## 專案背景
- 最新 Angular 版本（預設使用獨立元件）
- TypeScript 提供型別安全
- 專案設定與腳手架請用 Angular CLI
- 請遵循 Angular 風格指南（https://angular.dev/style-guide）
- 樣式一致可用 Angular Material 或其他現代 UI 函式庫（如有指定）

## 開發標準

### 架構
- 除非明確需要模組，否則請用獨立元件
- 依功能模組或領域組織程式碼，提升延展性
- 功能模組請實作 lazy loading 以優化效能
- 有效運用 Angular 內建相依性注入系統
- 元件結構請明確分離（智慧型 vs. 展示型元件）

### TypeScript
- `tsconfig.json` 請啟用嚴格模式以確保型別安全
- 為元件、服務與模型定義明確介面與型別
- 型別檢查請用型別守衛與聯集型別
- RxJS 操作符（如 `catchError`）實作正確錯誤處理
- 反應式表單請用型別化表單（如 `FormGroup`、`FormControl`）

### 元件設計
- 請遵循 Angular 元件生命週期掛鉤最佳實踐
- 若使用 Angular >= 19，請用 `input()`、`output()`、`viewChild()`、`viewChildren()`、`contentChild()`、`viewChildren()` 函式取代裝飾器；否則請用裝飾器
- 善用 Angular 變更偵測策略（預設或 `OnPush` 以提升效能）
- 保持模板乾淨，邏輯請放在元件類別或服務
- 請用 Angular 指令與管道實作可重用功能

### 樣式
- 請用 Angular 元件層級 CSS 封裝（預設：ViewEncapsulation.Emulated）
- 樣式請優先用 SCSS 並維持主題一致性
- 響應式設計請用 CSS Grid、Flexbox 或 Angular CDK Layout 工具
- 若用 Angular Material，請遵循其主題指引
- 請用 ARIA 屬性與語意化 HTML 維持無障礙（a11y）

### 狀態管理
- 元件與服務請用 Angular Signals 進行反應式狀態管理
- 請用 `signal()`、`computed()`、`effect()` 實作反應式狀態更新
- 可變狀態用 writable signals，衍生狀態用 computed signals
- 載入與錯誤狀態請用 signals 並提供適當 UI 回饋
- 結合 RxJS 時，模板請用 Angular 的 `AsyncPipe` 處理 observable

### 資料擷取
- API 呼叫請用 Angular 的 `HttpClient` 並正確型別化
- 資料轉換與錯誤處理請用 RxJS 操作符
- 獨立元件請用 Angular 的 `inject()` 進行相依性注入
- 快取策略可用（如 observable 的 `shareReplay`）
- API 回應資料請存於 signals 以利反應式更新
- API 錯誤請用全域攔截器統一處理

### 安全性
- 使用 Angular 內建機制消毒使用者輸入
- 認證與授權請用路由守衛
- CSRF 保護與 API 認證標頭請用 Angular 的 `HttpInterceptor`
- 表單驗證請用反應式表單與自訂驗證器
- 請遵循 Angular 安全性最佳實踐（如避免直接操作 DOM）

### 效能
- 最佳化請用 `ng build --prod` 產生 production build
- 路由請用 lazy loading 減少初始 bundle 大小
- 變更偵測請用 `OnPush` 策略與 signals 進行細緻反應式優化
- `ngFor` 迴圈請用 trackBy 提升渲染效能
- 若有需求，請用 Angular Universal 實作 SSR 或 SSG

### 測試
- 元件、服務與管道請用 Jasmine 與 Karma 撰寫單元測試
- 元件測試請用 Angular 的 `TestBed` 並模擬相依性
- signals 狀態更新請用 Angular 測試工具測試
- 端對端測試請用 Cypress 或 Playwright（如有指定）
- HTTP 請求請用 `HttpClientTestingModule` 模擬
- 關鍵功能請確保高測試涵蓋率

## 實作流程
1. 規劃專案結構與功能模組
2. 定義 TypeScript 介面與模型
3. 用 Angular CLI 建立元件、服務與管道
4. 以 signal 狀態實作資料服務與 API 整合
5. 建立具明確輸入與輸出的可重用元件
6. 加入反應式表單與驗證
7. 以 SCSS 與響應式設計套用樣式
8. 實作 lazy-loaded 路由與守衛
9. 用 signals 加入錯誤處理與載入狀態
10. 撰寫單元與端對端測試
11. 最佳化效能與 bundle 大小

## 其他指引
- 請遵循 Angular 命名慣例（如 `feature.component.ts`、`feature.service.ts`）
- 產生樣板程式碼請用 Angular CLI 指令
- 元件與服務請用明確 JSDoc 註解
- 符合無障礙標準（WCAG 2.1）
- 國際化請用 Angular 內建 i18n（如有指定）
- 請用可重用工具與共用模組保持程式碼 DRY
- 狀態管理請一律用 signals，確保反應式更新

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 在地化產生，因此可能包含錯誤。如發現任何不適當或錯誤之翻譯，請至 [issue](../../issues) 回報。
