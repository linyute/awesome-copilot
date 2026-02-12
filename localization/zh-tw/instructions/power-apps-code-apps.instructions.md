---
description: 'Power Apps Code Apps 開發標準與 TypeScript、React 及 Power Platform 整合的最佳實務'
applyTo: '**/*.{ts,tsx,js,jsx}, **/vite.config.*, **/package.json, **/tsconfig.json, **/power.config.json'
---

# Power Apps Code Apps 開發指令

使用 TypeScript、React 與 Power Platform SDK 產生高品質 Power Apps Code Apps 的指令，遵循 Microsoft 官方最佳實務與預覽功能。

## 專案內容

- **Power Apps Code Apps**：整合 Power Platform 的程式碼優先（Code-first）網頁應用程式開發
- **TypeScript + React**：建議的前端技術棧，搭配 Vite 服務組合器
- **Power Platform SDK**：@microsoft/power-apps (目前版本 ^1.0.3)，用於連接器整合
- **PAC CLI**：用於專案管理與部署的 Power Platform CLI
- **連接埠 3000**：使用 Power Platform SDK 進行本機開發的必要條件
- **Power Apps Premium**：生產環境使用的終端使用者授權要求

## 開發標準

### 專案結構

- 使用組織良好的資料夾結構，並明確分離關注點：
  ```
  src/
  ├── components/          # 可重複使用的 UI 元件
  ├── hooks/              # 用於 Power Platform 的自訂 React hooks
  ├── generated/
  │   ├── services/       # 產生的連接器服務 (PAC CLI)
  │   └── models/         # 產生的 TypeScript 模型 (PAC CLI)
  ├── utils/             # 公用程式函式與輔助工具
  ├── types/             # TypeScript 型別定義
  ├── PowerProvider.tsx  # Power Platform 內容包裝器
  └── main.tsx          # 應用程式進入點
  ```
- 將產生的檔案 (`generated/services/`, `generated/models/`) 與自訂程式碼分開
- 使用一致的命名慣例（檔案使用 kebab-case，元件使用 PascalCase）

### TypeScript 設定

- 在 tsconfig.json 中將 `verbatimModuleSyntax` 設為 `false`，以確保與 Power Apps SDK 的相容性
- 啟用嚴格模式（strict mode）以確保型別安全，建議的 tsconfig.json 如下：
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
- 為 Power Platform 連接器回應使用正確的型別
- 使用 `"@": path.resolve(__dirname, "./src")` 設定路徑別名，使匯入更簡潔
- 為應用程式特定的資料結構定義介面
- 實作錯誤邊界（Error Boundaries）與正確的錯誤處理型別

### 進階 Power Platform 整合

#### 自訂控制項架構 (PCF 控制項)
- **整合 PCF 控制項**：在 Code Apps 中嵌入 Power Apps Component Framework 控制項
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
- **PCF 控制項通訊**：處理 PCF 與 React 之間的事件與資料繫結
- **自訂控制項部署**：將 PCF 控制項與 Code Apps 一起封裝並部署

#### Power BI 嵌入式分析
- **嵌入 Power BI 報告**：整合互動式儀表板與報告
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
- **動態報告篩選**：根據 Code App 內容篩選 Power BI 報告
- **報告匯出功能**：啟用 PDF、Excel 與圖片匯出

#### AI Builder 整合
- **認知服務整合**：使用 AI Builder 模型進行表單處理、物件偵測
  ```typescript
  // 範例：使用 AI Builder 進行文件處理
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
- **預測模型**：整合用於商業預測的自訂 AI 模型
- **情緒分析**：使用 AI Builder 分析文字情緒
- **物件偵測**：實作圖片分析與物件辨識

#### Power Virtual Agents 整合
- **嵌入聊天機器人**：在 Code Apps 中整合 Power Virtual Agents 機器人
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
- **內容傳遞**：與聊天機器人對話共享 Code App 內容
- **自訂機器人動作**：從機器人互動中觸發 Code App 函式
- 使用 PAC CLI 產生的 TypeScript 服務進行連接器操作
- 實作 Microsoft Entra ID 的正確驗證流程
- 處理連接器同意對話方塊與權限管理
- PowerProvider 實作模式 (v1.0 不需要 SDK 初始化)：
  ```typescript
  import type { ReactNode } from "react";

  export default function PowerProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }
  ```
- 遵循官方支援的連接器模式：
  - SQL Server (包含 Azure SQL)
  - SharePoint
  - Office 365 使用者/群組
  - Azure Data Explorer
  - OneDrive for Business
  - Microsoft Teams
  - Dataverse (CRUD 操作)

### React 模式

- 所有新開發皆應使用帶有 hooks 的功能性元件（Functional Components）
- 為連接器操作實作正確的載入與錯誤狀態
- 考慮使用 Fluent UI React 元件（如官方範例所示）
- 適當時使用 React Query 或 SWR 進行資料擷取與快取
- 遵循 React 元件組合的最佳實務
- 實作行動優先（Mobile-first）的響應式設計
- 根據官方範例安裝關鍵相依套件：
  - `@microsoft/power-apps` 用於 Power Platform SDK
  - `@fluentui/react-components` 用於 UI 元件
  - `concurrently` 用於平行指令碼執行 (開發相依套件)

### 資料管理

- 將敏感資料儲存在資料來源中，絕不存放在應用程式程式碼內
- 為型別安全的連接器操作使用產生的模型
- 實作正確的資料驗證與清理
- 盡可能優雅地處理離線情境
- 適當地快取頻繁存取的資料

#### 進階 Dataverse 關聯
- **多對多關聯**：實作接合資料表（Junction Tables）與關聯服務
  ```typescript
  // 範例：使用者對角色的多對多關聯
  const userRoles = await UserRoleService.getall();
  const filteredRoles = userRoles.filter(ur => ur.userId === currentUser.id);
  ```
- **多型查閱（Polymorphic Lookups）**：處理可參照多種實體型別的客戶欄位
  ```typescript
  // 處理多型客戶查閱 (客戶或聯絡人)
  const customerType = record.customerType; // 'account' 或 'contact'
  const customerId = record.customerId;
  const customer = customerType === 'account'
    ? await AccountService.get(customerId)
    : await ContactService.get(customerId);
  ```
- **複雜關聯查詢**：使用 $expand 與 $filter 進行高效率資料檢索
- **關聯驗證**：為關聯限制實作商業規則

### 效能最佳化

- 為高昂的運算使用 React.memo 與 useMemo
- 為大型應用程式實作程式碼拆分與延遲載入（Lazy Loading）
- 使用 Tree Shaking 最佳化套件大小
- 使用高效率的連接器查詢模式以減少 API 呼叫
- 為大型資料集實作正確的分頁

#### 具有同步模式的離線優先架構
- **Service Worker 實作**：啟用離線功能
  ```typescript
  // 範例：Service worker 註冊
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
  // 範例：用於離線儲存的 IndexedDB 包裝器
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
- **同步衝突解決**：處理恢復連線後的資料衝突
- **背景同步**：實作定期資料同步
- **漸進式網頁應用程式 (PWA)**：啟用應用程式安裝與離線功能

### 安全性最佳實務

- 絕不將密鑰或敏感設定儲存在程式碼中
- 使用 Power Platform 內建的驗證與授權機制
- 實作正確的輸入驗證與清理
- 遵循 Web 應用程式的 OWASP 安全指南
- 遵守 Power Platform 資料遺失防護（DLP）原則
- 實作僅限 HTTPS 的通訊

### 錯誤處理

- 在 React 中實作全面的錯誤邊界
- 優雅地處理連接器特定的錯誤
- 為使用者提供具意義的錯誤訊息
- 在不洩漏敏感資訊的情況下適當記錄錯誤
- 為暫時性故障實作重試邏輯
- 處理網路連線性問題

### 測試策略

- 為商業邏輯與公用程式撰寫單元測試
- 使用 React Testing Library 測試 React 元件
- 在測試中模擬（Mock）Power Platform 連接器
- 為關鍵使用者流程實作整合測試
- 使用 TypeScript 提高測試安全性
- 測試錯誤情境與邊緣案例

### 開發工作流

- 使用 PAC CLI 進行專案初始化與連接器管理
- 遵循適合團隊規模的 git 分支策略
- 實作正確的程式碼審查流程
- 使用 Lint 與格式化工具 (ESLint, Prettier)
- 使用 concurrently 設定開發指令碼：
  - `"dev": "concurrently "vite" "pac code run""`
  - `"build": "tsc -b && vite build"`
- 在 CI/CD 管線中實作自動化測試
- 為版本發布遵循語義化版本控制（Semantic Versioning）

### 部署與 DevOps

- 部署時先執行 `npm run build`，接著執行 `pac code push`
- 實作正確的環境管理（開發、測試、生產）
- 使用環境特定的設定檔
- 盡可能實作藍綠部署（Blue-green）或金絲雀部署（Canary）策略
- 監控生產環境中的應用程式效能與錯誤
- 實作正確的備份與災難復原程序

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
- **環境晉升**：自動將環境從開發 → 測試 → 預備 → 生產晉升
- **復原策略**：在部署失敗時實作自動復原
- **設定管理**：為環境特定的密鑰使用 Azure Key Vault

## 程式碼品質指南

### 元件開發

- 建立具有清晰 props 介面的可重複使用元件
- 優先使用組合（Composition）而非繼承（Inheritance）
- 使用 TypeScript 實作正確的 prop 驗證
- 遵循單一職責原則
- 使用清晰的命名撰寫自我說明的程式碼

### 狀態管理

- 對於簡單情境，使用 React 內建的狀態管理
- 對於複雜狀態管理，考慮使用 Redux Toolkit
- 實作正確的狀態正規化（Normalization）
- 使用內容（Context）或狀態管理函式庫避免 Prop Drilling
- 高效率地使用衍生狀態（Derived State）與計算值

### API 整合

- 為保持一致性，使用 PAC CLI 產生的服務
- 實作正確的請求/回應攔截器（Interceptors）
- 處理驗證權杖（Token）管理
- 實作請求去重（Deduplication）與快取
- 使用正確的 HTTP 狀態碼處理

### 樣式與 UI

- 使用一致的設計系統或元件函式庫
- 使用 CSS Grid/Flexbox 實作響應式設計
- 遵循無障礙指南 (WCAG 2.1)
- 為元件樣式使用 CSS-in-JS 或 CSS 模組
- 適當時實作深色模式支援
- 確保行動裝置友善的使用者介面

#### 進階 UI/UX 模式

##### 使用元件函式庫實作設計系統
- **元件函式庫結構**：建構可重複使用的元件系統
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
- **設計權杖 (Design Tokens)**：實作一致的間距、顏色、字體排版
- **元件文件**：使用 Storybook 撰寫元件文件

##### 深色模式與佈景主題系統
- **佈景主題提供者實作**：支援多個佈景主題
  ```typescript
  // 範例：佈景主題內容與提供者
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
- **CSS 自訂屬性**：為動態佈景主題使用 CSS 變數
- **系統偏好偵測**：尊重使用者的作業系統佈景主題偏好

##### 響應式設計進階模式
- **容器查詢 (Container Queries)**：使用以容器為基礎的響應式設計
  ```css
  /* 範例：用於響應式元件的容器查詢 */
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
- **流體字體 (Fluid Typography)**：實作響應式字體縮放
- **適應性版面配置**：根據螢幕大小與內容變更版面配置模式

##### 動畫與微互動
- **Framer Motion 整合**：平滑的動畫與轉場
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
- **載入狀態**：動畫骨架屏（Skeletons）與進度指示器
- **手勢辨識**：滑動、縮放與觸控互動
- **效能最佳化**：使用 CSS transforms 與 will-change 屬性

##### 無障礙自動化與測試
- **ARIA 實作**：正確的語義標記與 ARIA 屬性
  ```typescript
  // 範例：具備無障礙功能的互動視窗元件
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
- **自動化無障礙測試**：整合 axe-core 進行無障礙測試
- **鍵盤導覽**：實作完整的鍵盤無障礙存取
- **螢幕閱讀器最佳化**：使用 NVDA、JAWS 與 VoiceOver 進行測試

##### 國際化 (i18n) 與在地化
- **React-intl 整合**：多語言支援
  ```typescript
  import { FormattedMessage, useIntl } from 'react-intl';

  const WelcomeMessage = ({ userName }: { userName: string }) => {
    const intl = useIntl();

    return (
      <h1>
        <FormattedMessage
          id="welcome.title"
          defaultMessage="歡迎，{userName}！"
          values={{ userName }}
        />
      </h1>
    );
  };
  ```
- **語言偵測**：自動語言偵測與切換
- **RTL 支援**：支援阿拉伯文、希伯來文等由右至左的語言
- **日期與數字格式化**：地區特定的格式化
- **翻譯管理**：與翻譯服務整合

## 目前限制與因應措施

### 已知限制

- 尚未支援內容安全性原則 (CSP)
- 尚未支援儲存體 SAS IP 限制
- 無 Power Platform Git 整合
- 支援 Dataverse 解決方案，但解決方案封裝程式與原始程式碼整合受到限制
- 透過 SDK 記錄器設定支援 Application Insights (無內建原生整合)

### 因應措施

- 如有需要，使用替代的錯誤追蹤解決方案
- 實作手動部署工作流
- 為進階分析使用外部工具
- 為未來遷移至受支援功能做好規劃

## 文件標準

- 維護包含安裝指令的完整 README.md
- 為所有自訂元件與 hooks 撰寫文件
- 包含常見問題的疑難排解指南
- 記錄部署程序與要求
- 為版本更新維護變更記錄（Changelog）
- 為重大抉擇包含架構決策記錄（ADR）

## 常見問題疑難排解

### 開發問題

- **連接埠 3000 衝突**：使用 `netstat -ano | findstr :3000` 找出並使用 `taskkill /PID {PID} /F` 終止現有程序
- **驗證失敗**：使用 `pac auth list` 驗證環境設定與使用者權限
- **套件安裝失敗**：使用 `npm cache clean --force` 清除 npm 快取並重新安裝
- **TypeScript 編譯錯誤**：檢查 verbatimModuleSyntax 設定與 SDK 相容性
- **連接器權限錯誤**：確保正確的同意流程與管理員權限
- **PowerProvider 問題**：確保 v1.0 應用程式不會等待 SDK 初始化
- **Vite 開發伺服器問題**：確保主機與連接埠設定符合要求

### 部署問題

- **建構失敗**：使用 `npm audit` 驗證所有相依套件並檢查建構設定
- **驗證錯誤**：使用 `pac auth clear` 接著 `pac auth create` 重新驗證 PAC CLI
- **連接器無法使用**：在 Power Platform 中驗證連接器設定與連線狀態
- **效能問題**：使用 `npm run build --report` 最佳化套件大小並實作快取
- **環境不符**：使用 `pac env list` 確認選擇正確的環境
- **應用程式逾時錯誤**：檢查建構輸出與網路連線性

### 執行階段問題

- **「應用程式逾時」錯誤**：驗證是否已執行 `npm run build` 且部署輸出有效
- **連接器驗證提示**：確保實作了正確的同意流程
- **資料載入失敗**：檢查網路請求與連接器權限
- **UI 轉譯問題**：驗證 Fluent UI 相容性與響應式設計實作

## 最佳實務摘要

1. **遵循 Microsoft 官方文件與最佳實務**
2. **使用 TypeScript 確保型別安全與更好的開發體驗**
3. **實作正確的錯誤處理與使用者回饋**
4. **針對效能與使用者體驗進行最佳化**
5. **遵循安全性最佳實務與 Power Platform 原則**
6. **撰寫具維護性、可測試且具備完整文件的程式碼**
7. **使用 PAC CLI 產生的服務與模型**
8. **為未來的功能更新與遷移做好規劃**
9. **實作全面的測試策略**
10. **遵循正確的 DevOps 與部署實務**
