---
description: 'Power Apps 程式碼應用程式開發標準與最佳實務，用於 TypeScript、React 和 Power Platform 整合'
applyTo: '**/*.{ts,tsx,js,jsx}, **/vite.config.*, **/package.json, **/tsconfig.json, **/power.config.json'
---

# Power Apps 程式碼應用程式開發說明

使用 TypeScript、React 和 Power Platform SDK 產生高品質 Power Apps 程式碼應用程式的說明，遵循 Microsoft 官方最佳實務和預覽功能。

## 專案內容

- **Power Apps 程式碼應用程式 (預覽)**：使用 Power Platform 整合的程式碼優先網頁應用程式開發
- **TypeScript + React**：建議使用 Vite bundler 的前端堆疊
- **Power Platform SDK**：用於連接器整合的 @microsoft/power-apps (目前版本 ^0.3.1)
- **PAC CLI**：用於專案管理和部署的 Power Platform CLI
- **連接埠 3000**：Power Platform SDK 本機開發所需
- **Power Apps Premium**：生產使用者的授權要求

## 開發標準

### 專案結構

- 使用組織良好的資料夾結構，明確區分職責：
  ```
  src/
  ├── components/          # 可重複使用的 UI 元件
  ├── hooks/              # 適用於 Power Platform 的自訂 React 勾點
  ├── services/           # 產生的連接器服務 (PAC CLI)
  ├── models/            # 產生的 TypeScript 模型 (PAC CLI)
  ├── utils/             # 公用程式函式和輔助程式
  ├── types/             # TypeScript 類型定義
  ├── PowerProvider.tsx  # Power Platform 初始化
  └── main.tsx          # 應用程式進入點
  ```
- 將產生的檔案 (`services/`、`models/`) 與自訂程式碼分開
- 使用一致的命名慣例 (檔案使用 kebab-case，元件使用 PascalCase)

### TypeScript 設定

- 在 tsconfig.json 中設定 `verbatimModuleSyntax: false` 以實現 Power Apps SDK 相容性
- 使用建議的 tsconfig.json 啟用嚴格模式以確保類型安全：
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "verbatimModuleSyntax": false,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noFallthroughCasesInSwitch": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```
- 為 Power Platform 連接器回應使用適當的類型
- 使用 `"@": path.resolve(__dirname, "./src")` 設定路徑別名以實現更簡潔的匯入
- 為應用程式特定的資料結構定義介面
- 實作錯誤邊界和適當的錯誤處理類型

### 進階 Power Platform 整合

#### 自訂控制項框架 (PCF 控制項)
- **整合 PCF 控制項**：在程式碼應用程式中嵌入 Power Apps 元件框架控制項
  ```typescript
  // 範例：使用自訂 PCF 控制項進行資料視覺化
  import { PCFControlWrapper } from './components/PCFControlWrapper';
  
  const MyComponent = () => {
    return (
      <PCFControlWrapper
        controlName="CustomChartControl"
        dataset={chartData}
        configuration={chartConfig}
      />
    );
  };
  ```
- **PCF 控制項通訊**：處理 PCF 和 React 之間的事件和資料繫結
- **自訂控制項部署**：將 PCF 控制項與程式碼應用程式一起封裝和部署

#### Power BI 嵌入式分析
- **嵌入 Power BI 報表**：整合互動式儀表板和報表
  ```typescript
  import { PowerBIEmbed } from 'powerbi-client-react';
  
  const DashboardComponent = () => {
    return (
      <PowerBIEmbed
        embedConfig={{
          type: 'report',
          id: reportId,
          embedUrl: embedUrl,
          accessToken: accessToken,
          tokenType: models.TokenType.Aad,
          settings: { 
            panes: { filters: { expanded: false, visible: false } }
          }
        }}
      />
    );
  };
  ```
- **動態報表篩選**：根據程式碼應用程式內容篩選 Power BI 報表
- **報表匯出功能**：啟用 PDF、Excel 和影像匯出

#### AI Builder 整合
- **認知服務整合**：使用 AI Builder 模型進行表單處理、物件偵測
  ```typescript
  // 範例：使用 AI Builder 處理文件
  const processDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const result = await AIBuilderService.ProcessDocument({
      modelId: 'document-processing-model-id',
      document: formData
    });
    
    return result.extractedFields;
  };
  ```
- **預測模型**：整合自訂 AI 模型以進行業務預測
- **情感分析**：使用 AI Builder 分析文字情感
- **物件偵測**：實作影像分析和物件辨識

#### Power Virtual Agents 整合
- **聊天機器人嵌入**：在程式碼應用程式中整合 Power Virtual Agents 機器人
  ```typescript
  import { DirectLine } from 'botframework-directlinejs';
  import { WebChat } from 'botframework-webchat';
  
  const ChatbotComponent = () => {
    const directLine = new DirectLine({
      token: chatbotToken
    });
    
    return (
      <div style={{ height: '400px', width: '100%' }}>
        <WebChat directLine={directLine} />
      </div>
    );
  };
  ```
- **內容傳遞**：與聊天機器人對話共用程式碼應用程式內容
- **自訂機器人動作**：從機器人互動觸發程式碼應用程式函式
- 使用 PAC CLI 產生的 TypeScript 服務進行連接器操作
- 實作 Microsoft Entra ID 的適當驗證流程
- 處理連接器同意對話方塊和權限管理
- PowerProvider 實作模式：
  ```typescript
  import { initialize } from "@microsoft/power-apps/app";
  import { useEffect, type ReactNode } from "react";

  export default function PowerProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
      const initApp = async () => {
        try {
          await initialize();
          console.log('Power Platform SDK 初始化成功');
        } catch (error) {
          console.error('Power Platform SDK 初始化失敗:', error);
        }
      };
      initApp();
    }, []);
    return <>{children}</>;
  }
  ```
- 遵循官方支援的連接器模式：
  - SQL Server (包括 Azure SQL)
  - SharePoint
  - Office 365 使用者/群組
  - Azure Data Explorer
  - 商務用 OneDrive
  - Microsoft Teams
  - Dataverse (CRUD 操作)

### React 模式

- 對於所有新開發，使用帶有勾點的函式元件
- 為連接器操作實作適當的載入和錯誤狀態
- 考慮 Fluent UI React 元件 (如官方範例中所用)
- 適當時使用 React Query 或 SWR 進行資料擷取和快取
- 遵循 React 元件組合的最佳實務
- 實作響應式設計，採用行動優先方法
- 依照官方範例安裝主要相依性：
  - `@microsoft/power-apps` 用於 Power Platform SDK
  - `@fluentui/react-components` 用於 UI 元件
  - `concurrently` 用於平行指令碼執行 (開發相依性)

### 資料管理

- 將敏感資料儲存在資料來源中，絕不儲存在應用程式程式碼中
- 使用產生的模型進行類型安全的連接器操作
- 實作適當的資料驗證和清理
- 盡可能優雅地處理離線情境
- 適當地快取經常存取的資料

#### 進階 Dataverse 關係
- **多對多關係**：實作聯結表和關係服務
  ```typescript
  // 範例：使用者對角色多對多關係
  const userRoles = await UserRoleService.getall();
  const filteredRoles = userRoles.filter(ur => ur.userId === currentUser.id);
  ```
- **多型查閱**：處理可以參考多個實體類型的客戶欄位
  ```typescript
  // 處理多型客戶查閱 (帳戶或連絡人)
  const customerType = record.customerType; // 'account' 或 'contact'
  const customerId = record.customerId;
  const customer = customerType === 'account' 
    ? await AccountService.get(customerId)
    : await ContactService.get(customerId);
  ```
- **複雜關係查詢**：使用 $expand 和 $filter 進行高效的資料擷取
- **關係驗證**：實作關係約束的業務規則

### 效能最佳化

- 對於昂貴的計算，使用 React.memo 和 useMemo
- 對於大型應用程式，實作程式碼分割和延遲載入
- 透過 tree shaking 優化套件大小
- 使用高效的連接器查詢模式來最小化 API 呼叫
- 為大型資料集實作適當的分頁

#### 具有同步模式的離線優先架構
- **Service Worker 實作**：啟用離線功能
  ```typescript
  // 範例：Service Worker 註冊
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW 已註冊:', registration))
        .catch(error => console.log('SW 註冊失敗:', error));
    });
  }
  ```
- **本機資料儲存**：使用 IndexedDB 進行離線資料持久化
  ```typescript
  // 範例：用於離線儲存的 IndexedDB 包裝函式
  class OfflineDataStore {
    async saveData(key: string, data: any) {
      const db = await this.openDB();
      const transaction = db.transaction(['data'], 'readwrite');
      transaction.objectStore('data').put({ id: key, data, timestamp: Date.now() });
    }
    
    async loadData(key: string) {
      const db = await this.openDB();
      const transaction = db.transaction(['data'], 'readonly');
      return transaction.objectStore('data').get(key);
    }
  }
  ```
- **同步衝突解決**：在重新連線時處理資料衝突
- **背景同步**：實作定期資料同步
- **漸進式網頁應用程式 (PWA)**：啟用應用程式安裝和離線功能

### 安全性最佳實務

- 絕不將機密或敏感設定儲存在程式碼中
- 使用 Power Platform 的內建驗證和授權
- 實作適當的輸入驗證和清理
- 遵循 OWASP 網頁應用程式安全性指南
- 遵守 Power Platform 資料遺失防護原則
- 實作僅限 HTTPS 的通訊

### 錯誤處理

- 在 React 中實作全面的錯誤邊界
- 優雅地處理連接器特定錯誤
- 向使用者提供有意義的錯誤訊息
- 適當地記錄錯誤，而不暴露敏感資訊
- 實作暫時性失敗的重試邏輯
- 處理網路連線問題

### 測試策略

- 為業務邏輯和公用程式撰寫單元測試
- 使用 React Testing Library 測試 React 元件
- 在測試中模擬 Power Platform 連接器
- 為關鍵使用者流程實作整合測試
- 使用 TypeScript 提高測試安全性
- 測試錯誤情境和邊緣案例

### 開發工作流程

- 使用 PAC CLI 進行專案初始化和連接器管理
- 遵循適用於團隊規模的 git 分支策略
- 實作適當的程式碼審查流程
- 使用 linting 和格式化工具 (ESLint、Prettier)
- 使用 concurrently 設定開發指令碼：
  - `"dev": "concurrently \"vite\" \"pac code run\""`
  - `"build": "tsc -b && vite build"`
- 在 CI/CD 管線中實作自動化測試
- 遵循語義版本控制進行發布

### 部署和 DevOps

- 使用 `npm run build` 後接 `pac code push` 進行部署
- 實作適當的環境管理 (開發、測試、生產)
- 使用環境特定的設定檔
- 盡可能實作藍綠或金絲雀部署策略
- 監控生產中的應用程式效能和錯誤
- 實作適當的備份和災難復原程序

#### 多環境部署管線
- **環境特定設定**：管理開發/測試/預備/生產環境
  ```json
  // 範例：環境特定設定檔
  // config/development.json
  {
    "powerPlatform": {
      "environmentUrl": "https://dev-env.crm.dynamics.com",
      "apiVersion": "9.2"
    },
    "features": {
      "enableDebugMode": true,
      "enableAnalytics": false
    }
  }
  ```
- **自動化部署管線**：使用 Azure DevOps 或 GitHub Actions
  ```yaml
  # 範例 Azure DevOps 管線步驟
  - task: PowerPlatformToolInstaller@2
  - task: PowerPlatformSetConnectionVariables@2
    inputs:
      authenticationType: 'PowerPlatformSPN'
      applicationId: '$(AppId)'
      clientSecret: '$(ClientSecret)'
      tenantId: '$(TenantId)'
  - task: PowerPlatformPublishCustomizations@2
  ```
- **環境升級**：從開發 → 測試 → 預備 → 生產的自動化升級
- **回溯策略**：在部署失敗時實作自動回溯
- **設定管理**：使用 Azure Key Vault 儲存環境特定機密

## 程式碼品質準則

### 元件開發

- 建立具有清晰 props 介面的可重複使用元件
- 使用組合而非繼承
- 使用 TypeScript 實作適當的 prop 驗證
- 遵循單一職責原則
- 撰寫具有清晰命名的自文件程式碼

### 狀態管理

- 對於簡單情境，使用 React 的內建狀態管理
- 對於複雜狀態管理，考慮 Redux Toolkit
- 實作適當的狀態正規化
- 避免使用 context 或狀態管理函式庫進行 prop drilling
- 有效使用衍生狀態和計算值

### API 整合

- 使用 PAC CLI 產生的服務以保持一致性
- 實作適當的請求/回應攔截器
- 處理驗證權杖管理
- 實作請求重複資料刪除和快取
- 使用適當的 HTTP 狀態碼處理

### 樣式和 UI

- 使用一致的設計系統或元件函式庫
- 使用 CSS Grid/Flexbox 實作響應式設計
- 遵循輔助功能準則 (WCAG 2.1)
- 使用 CSS-in-JS 或 CSS 模組進行元件樣式設定
- 適當時實作深色模式支援
- 確保行動裝置友善的使用者介面

#### 進階 UI/UX 模式

##### 使用元件函式庫實作設計系統
- **元件函式庫結構**：建立可重複使用的元件系統
  ```typescript
  // 範例：設計系統按鈕元件
  interface ButtonProps {
    variant: 'primary' | 'secondary' | 'danger';
    size: 'small' | 'medium' | 'large';
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }
  
  export const Button: React.FC<ButtonProps> = ({ 
    variant, size, disabled, onClick, children 
  }) => {
    const classes = `btn btn-${variant} btn-${size} ${disabled ? 'btn-disabled' : ''}`;
    return <button className={classes} onClick={onClick} disabled={disabled}>{children}</button>;
  };
  ```
- **設計權杖**：實作一致的間距、顏色、排版
- **元件文件**：使用 Storybook 進行元件文件

##### 深色模式和主題系統
- **主題提供者實作**：支援多個主題
  ```typescript
  // 範例：主題內容和提供者
  const ThemeContext = createContext({ 
    theme: 'light',
    toggleTheme: () => {}
  });
  
  export const ThemeProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    
    const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };
    
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div className={`theme-${theme}`}>{children}</div>
      </ThemeContext.Provider>
    );
  };
  ```
- **CSS 自訂屬性**：使用 CSS 變數進行動態主題設定
- **系統偏好設定偵測**：尊重使用者作業系統主題偏好設定

##### 響應式設計進階模式
- **容器查詢**：使用基於容器的響應式設計
  ```css
  /* 範例：響應式元件的容器查詢 */
  .card-container {
    container-type: inline-size;
  }
  
  @container (min-width: 400px) {
    .card {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
  ```
- **流體排版**：實作響應式字體縮放
- **自適應版面**：根據螢幕大小和內容變更版面模式

##### 動畫和微互動
- **Framer Motion 整合**：流暢的動畫和轉場
  ```typescript
  import { motion, AnimatePresence } from 'framer-motion';
  
  const AnimatedCard = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="card"
      >
        卡片內容
      </motion.div>
    );
  };
  ```
- **載入狀態**：動畫骨架和進度指示器
- **手勢辨識**：滑動、捏合和觸控互動
- **效能最佳化**：使用 CSS 轉換和 will-change 屬性

##### 輔助功能自動化和測試
- **ARIA 實作**：適當的語義標記和 ARIA 屬性
  ```typescript
  // 範例：可存取模態元件
  const Modal: React.FC<{isOpen: boolean, onClose: () => void, children: ReactNode}> = ({ 
    isOpen, onClose, children 
  }) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        const focusableElement = document.querySelector('[data-autofocus]') as HTMLElement;
        focusableElement?.focus();
      }
      return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);
    
    return (
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        className={isOpen ? 'modal-open' : 'modal-hidden'}
      >
        {children}
      </div>
    );
  };
  ```
- **自動化輔助功能測試**：整合 axe-core 進行輔助功能測試
- **鍵盤導覽**：實作完整的鍵盤輔助功能
- **螢幕閱讀器最佳化**：使用 NVDA、JAWS 和 VoiceOver 進行測試

##### 國際化 (i18n) 和在地化
- **React-intl 整合**：多語言支援
  ```typescript
  import { FormattedMessage, useIntl } from 'react-intl';
  
  const WelcomeMessage = ({ userName }: { userName: string }) => {
    const intl = useIntl();
    
    return (
      <h1>
        <FormattedMessage
          id="welcome.title"
          defaultMessage="歡迎, {userName}!"
          values={{ userName }}
        />
      </h1>
    );
  };
  ```
- **語言偵測**：自動語言偵測和切換
- **RTL 支援**：阿拉伯語、希伯來語的從右到左語言支援
- **日期和數字格式**：地區設定特定格式
- **翻譯管理**：與翻譯服務整合

## 目前限制和因應措施

### 已知限制

- 內容安全性原則 (CSP) 尚未支援
- 儲存 SAS IP 限制不支援
- 無 Power Platform Git 整合
- 無 Dataverse 解決方案支援
- 無原生 Azure Application Insights 整合

### 因應措施

- 如有需要，使用替代錯誤追蹤解決方案
- 實作手動部署工作流程
- 使用外部工具進行進階分析
- 規劃未來移轉至支援的功能

## 文件標準

- 維護包含設定說明的全面 README.md
- 記錄所有自訂元件和勾點
- 包含常見問題的疑難排解指南
- 記錄部署程序和要求
- 維護版本更新的變更日誌
- 包含主要選擇的架構決策記錄

## 常見問題疑難排解

### 開發問題

- **連接埠 3000 衝突**：使用 `netstat -ano | findstr :3000` 終止現有程序，然後 `taskkill /PID {PID} /F`
- **驗證失敗**：使用 `pac auth list` 驗證環境設定和使用者權限
- **套件安裝失敗**：使用 `npm cache clean --force` 清除 npm 快取並重新安裝
- **TypeScript 編譯錯誤**：檢查 verbatimModuleSyntax 設定和 SDK 相容性
- **連接器權限錯誤**：確保適當的同意流程和管理員權限
- **PowerProvider 初始化錯誤**：檢查主控台是否有 SDK 初始化失敗
- **Vite 開發伺服器問題**：確保主機和連接埠設定符合要求

### 部署問題

- **建構失敗**：使用 `npm audit` 驗證所有相依性並檢查建構設定
- **驗證錯誤**：使用 `pac auth clear` 然後 `pac auth create` 重新驗證 PAC CLI
- **連接器不可用**：驗證 Power Platform 中的連接器設定和連線狀態
- **效能問題**：使用 `npm run build --report` 優化套件大小並實作快取
- **環境不符**：使用 `pac env list` 確認正確的環境選擇
- **應用程式逾時錯誤**：檢查 PowerProvider.tsx 實作和網路連線

### 執行階段問題

- **「應用程式逾時」錯誤**：驗證是否已執行 npm run build 且 PowerProvider 沒有錯誤
- **連接器驗證提示**：確保適當的同意流程實作
- **資料載入失敗**：檢查網路請求和連接器權限
- **UI 呈現問題**：驗證 Fluent UI 相容性和響應式設計實作

## 最佳實務摘要

1. **遵循 Microsoft 官方文件和最佳實務**
2. **使用 TypeScript 確保類型安全和更好的開發人員體驗**
3. **實作適當的錯誤處理和使用者回饋**
4. **優化效能和使用者體驗**
5. **遵循安全性最佳實務和 Power Platform 原則**
6. **撰寫可維護、可測試且文件齊全的程式碼**
7. **使用 PAC CLI 產生的服務和模型**
8. **規劃未來的功能更新和移轉**
9. **實作全面的測試策略**

10. **遵循適當的 DevOps 和部署實務**
