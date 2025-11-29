---
description: '技術中立的藍圖產生器，用於建立完整的 copilot-instructions.md 文件，指引 GitHub Copilot 產生符合專案標準、架構模式與精確技術版本的程式碼，方法是分析現有程式碼庫模式並避免假設。'
mode: 'agent'
---

# Copilot 指令藍圖產生器

## 設定變數
${PROJECT_TYPE="自動偵測|.NET|Java|JavaScript|TypeScript|React|Angular|Python|多重|其他"} <!-- 主要技術 -->
${ARCHITECTURE_STYLE="分層|微服務|單體|領域驅動|事件驅動|無伺服器|混合"} <!-- 架構方法 -->
${CODE_QUALITY_FOCUS="可維護性|效能|安全性|無障礙|可測試性|全部"} <!-- 品質優先項目 -->
${DOCUMENTATION_LEVEL="簡略|標準|完整"} <!-- 文件需求 -->
${TESTING_REQUIREMENTS="單元|整合|E2E|TDD|BDD|全部"} <!-- 測試方法 -->
${VERSIONING="語意化|CalVer|自訂"} <!-- 版本管理方式 -->

## 產生的提示

「請產生完整的 copilot-instructions.md 文件，指引 GitHub Copilot 產生符合本專案標準、架構與技術版本的程式碼。指令必須嚴格根據程式碼庫實際模式，避免任何假設。請依下列方式進行：

### 1. 核心指令結構

```markdown
# GitHub Copilot 指令

## 優先指引

產生本儲存庫程式碼時：

1. **版本相容性**：務必偵測並遵守本專案所用語言、框架與函式庫的精確版本
2. **情境檔案**：優先遵循 .github/copilot 目錄下的模式與標準
3. **程式碼庫模式**：若情境檔案未明確指引，請掃描程式碼庫既有模式
4. **架構一致性**：維持我們的 ${ARCHITECTURE_STYLE} 架構風格與既有邊界
5. **程式品質**：所有產生程式碼均優先考量 ${CODE_QUALITY_FOCUS == "全部" ? "可維護性、效能、安全性、無障礙、可測試性" : CODE_QUALITY_FOCUS}

## 技術版本偵測

產生程式碼前，請掃描程式碼庫以辨識：

1. **語言版本**：偵測實際使用的程式語言版本
   - 檢查專案檔、設定檔與套件管理器
   - 尋找語言特定版本指示（如 .NET 專案的 <LangVersion>）
   - 絕不使用超出偵測版本的語言功能

2. **框架版本**：辨識所有框架的精確版本
   - 檢查 package.json、.csproj、pom.xml、requirements.txt 等
   - 產生程式碼時遵守版本限制
   - 絕不建議偵測版本未支援的功能

3. **函式庫版本**：記錄主要函式庫與相依套件的精確版本
   - 產生程式碼時須與這些版本相容
   - 絕不使用偵測版本未支援的 API 或功能

## 情境檔案

優先參考 .github/copilot 目錄下的下列檔案（如存在）：

- **architecture.md**：系統架構指引
- **tech-stack.md**：技術版本與框架細節
- **coding-standards.md**：程式風格與格式標準
- **folder-structure.md**：專案組織指引
- **exemplars.md**：範例程式碼模式

## 程式碼庫掃描指令

若情境檔案未明確指引：

1. 找出與欲修改或建立檔案類型相近的檔案
2. 分析下列模式：
   - 命名慣例
   - 程式組織
   - 錯誤處理
   - 日誌方式
   - 文件風格
   - 測試模式
   
3. 遵循程式碼庫最一致的模式
4. 若有衝突，優先採用新檔案或測試覆蓋率高的檔案模式
5. 絕不引入程式碼庫未出現的模式

## 程式品質標準

${CODE_QUALITY_FOCUS.includes("可維護性") || CODE_QUALITY_FOCUS == "全部" ? `### 可維護性
- 撰寫自我說明程式碼，命名清楚
- 遵循程式碼庫既有命名與組織慣例
- 依既有模式維持一致性
- 函式聚焦單一職責
- 函式複雜度與長度須符合既有模式` : ""}

${CODE_QUALITY_FOCUS.includes("效能") || CODE_QUALITY_FOCUS == "全部" ? `### 效能
- 遵循既有記憶體與資源管理模式
- 處理高運算負載時依既有模式
- 非同步操作依既有模式
- 快取依既有模式一致實作
- 依程式碼庫既有模式最佳化` : ""}

${CODE_QUALITY_FOCUS.includes("安全性") || CODE_QUALITY_FOCUS == "全部" ? `### 安全性
- 輸入驗證依既有模式
- 套用程式碼庫既有資料清理技術
- 參數化查詢依既有模式
- 認證與授權依既有模式
- 敏感資料處理依既有模式` : ""}

${CODE_QUALITY_FOCUS.includes("無障礙") || CODE_QUALITY_FOCUS == "全部" ? `### 無障礙
- 遵循程式碼庫既有無障礙模式
- ARIA 屬性用法與既有元件一致
- 維持鍵盤操作支援
- 色彩與對比依既有模式
- 替代文字依既有模式` : ""}

${CODE_QUALITY_FOCUS.includes("可測試性") || CODE_QUALITY_FOCUS == "全部" ? `### 可測試性
- 測試程式碼依既有模式
- 相依性注入依既有模式
- 相依管理依既有模式
- 模擬與測試替身依既有模式
- 測試風格與既有測試一致` : ""}

## 文件需求

${DOCUMENTATION_LEVEL == "簡略" ? 
`- 文件註解風格與既有程式碼一致
- 依程式碼庫模式記錄
- 非明顯行為依既有模式註解
- 參數說明格式與既有程式碼一致` : ""}

${DOCUMENTATION_LEVEL == "標準" ? 
`- 文件格式與程式碼庫一致
- XML/JSDoc 註解風格與完整度一致
- 參數、回傳值、例外皆依既有風格註解
- 用法範例依既有模式
- 類別層級文件風格與內容一致` : ""}

${DOCUMENTATION_LEVEL == "完整" ? 
`- 依程式碼庫最詳細文件模式
- 文件風格與最佳文件檔案一致
- 註解方式與最完整檔案一致
- 連結文件依既有模式
- 設計決策說明詳盡` : ""}

## 測試方法

${TESTING_REQUIREMENTS.includes("單元") || TESTING_REQUIREMENTS == "全部" ? 
`### 單元測試
- 測試結構與風格與既有單元測試一致
- 測試類別與方法命名一致
- 斷言模式與既有測試一致
- 模擬方式依既有程式碼
- 測試隔離依既有模式` : ""}

${TESTING_REQUIREMENTS.includes("整合") || TESTING_REQUIREMENTS == "全部" ? 
`### 整合測試
- 整合測試模式與程式碼庫一致
- 測試資料建立與清理依既有模式
- 元件互動測試依既有模式
- 系統行為驗證依既有模式` : ""}

${TESTING_REQUIREMENTS.includes("E2E") || TESTING_REQUIREMENTS == "全部" ? 
`### 端對端測試
- E2E 測試結構與模式與既有一致
- UI 測試依既有模式
- 使用者流程驗證依既有模式` : ""}

${TESTING_REQUIREMENTS.includes("TDD") || TESTING_REQUIREMENTS == "全部" ? 
`### 測試驅動開發
- TDD 模式依程式碼庫
- 測試案例進程依既有程式碼
- 測試通過後依既有模式重構` : ""}

${TESTING_REQUIREMENTS.includes("BDD") || TESTING_REQUIREMENTS == "全部" ? 
`### 行為驅動開發
- Given-When-Then 結構依既有測試
- 行為描述依既有模式
- 商業重點測試案例依既有模式` : ""}

## 技術特定指引

${PROJECT_TYPE == ".NET" || PROJECT_TYPE == "自動偵測" || PROJECT_TYPE == "多重" ? `### .NET 指引
- 嚴格遵守偵測到的 .NET 版本
- 僅用偵測版本支援的 C# 語言功能
- LINQ 用法與程式碼庫一致
- async/await 用法依既有程式碼
- 相依性注入依既有程式碼
- 集合型別與用法依既有程式碼` : ""}

${PROJECT_TYPE == "Java" || PROJECT_TYPE == "自動偵測" || PROJECT_TYPE == "多重" ? `### Java 指引
- 嚴格遵守偵測到的 Java 版本
- 設計模式用法與程式碼庫一致
- 例外處理依既有程式碼
- 集合型別與用法依既有程式碼
- 相依性注入依既有程式碼` : ""}

${PROJECT_TYPE == "JavaScript" || PROJECT_TYPE == "TypeScript" || PROJECT_TYPE == "自動偵測" || PROJECT_TYPE == "多重" ? `### JavaScript/TypeScript 指引
- 嚴格遵守偵測到的 ECMAScript/TypeScript 版本
- 模組匯入/匯出模式依既有程式碼
- TypeScript 型別定義依既有模式
- 非同步模式（promise、async/await）依既有程式碼
- 錯誤處理依相似檔案模式` : ""}

${PROJECT_TYPE == "React" || PROJECT_TYPE == "自動偵測" || PROJECT_TYPE == "多重" ? `### React 指引
- 嚴格遵守偵測到的 React 版本
- 元件結構模式依既有元件
- hooks 與生命週期模式依既有程式碼
- 狀態管理依既有元件
- prop 型別與驗證依既有程式碼` : ""}

${PROJECT_TYPE == "Angular" || PROJECT_TYPE == "自動偵測" || PROJECT_TYPE == "多重" ? `### Angular 指引
- 嚴格遵守偵測到的 Angular 版本
- 元件與模組模式依既有程式碼
- decorator 用法依既有程式碼
- RxJS 用法依既有程式碼
- 元件溝通依既有模式` : ""}

${PROJECT_TYPE == "Python" || PROJECT_TYPE == "自動偵測" || PROJECT_TYPE == "多重" ? `### Python 指引
- 嚴格遵守偵測到的 Python 版本
- 匯入組織依既有模組
- 型別提示用法依既有程式碼
- 錯誤處理依既有程式碼
- 模組組織依既有模式` : ""}

## 版本管理指引

${VERSIONING == "語意化" ? 
`- 依程式碼庫語意化版本管理模式
- 重大變更文件格式依既有模式
- 停用通知依既有模式` : ""}

${VERSIONING == "CalVer" ? 
`- 依程式碼庫 CalVer 版本管理模式
- 變更文件格式依既有模式
- 重大變更標示依既有模式` : ""}

${VERSIONING == "自訂" ? 
`- 依程式碼庫自訂版本管理模式
- 文件格式依既有文件
- 標籤慣例依專案既有模式` : ""}

## 一般最佳實踐

- 命名慣例完全依既有程式碼
- 程式組織依相似檔案
- 錯誤處理依既有模式
- 測試方式依既有程式碼
- 日誌模式依既有程式碼
- 設定方式依既有程式碼

## 專案特定指引

- 產生程式碼前請徹底掃描程式碼庫
- 絕對遵守既有架構邊界
- 風格與模式須與周邊程式碼一致
- 有疑慮時，優先考量與既有程式碼一致性，而非外部最佳實踐或新語言功能
```

### 2. 程式碼庫分析指令

建立 copilot-instructions.md 前，請先分析程式碼庫：

1. **辨識精確技術版本**：
   - ${PROJECT_TYPE == "自動偵測" ? "掃描副檔名與設定檔偵測所有程式語言、框架與函式庫" : `聚焦於 ${PROJECT_TYPE} 技術`}
   - 從專案檔、package.json、.csproj 等擷取精確版本資訊
   - 記錄版本限制與相容性需求

2. **理解架構**：
   - 分析資料夾結構與模組組織
   - 辨識分層邊界與元件關係
   - 記錄元件間通訊模式

3. **記錄程式碼模式**：
   - 彙整各類程式元素命名慣例
   - 註解風格與完整度
   - 錯誤處理模式
   - 測試方法與覆蓋率

4. **品質標準記錄**：
   - 辨識實際用到的效能最佳化技巧
   - 記錄已實作的安全措施
   - 註明現有無障礙功能（如適用）
   - 記錄程式品質模式

### 3. 實作備註

最終 copilot-instructions.md 應：
- 放置於 .github/copilot 目錄
- 僅參考程式碼庫既有模式與標準
- 明確記錄版本相容性需求
- 不得建議程式碼庫未出現的做法
- 提供程式碼庫具體範例
- 內容完整但足夠精簡，便於 Copilot 實際運用

重要：僅能依程式碼庫實際觀察到的模式提供指引。明確指示 Copilot 優先考量與既有程式碼一致性，而非外部最佳實踐或新語言功能。
"

## 預期輸出

一份完整的 copilot-instructions.md 文件，能指引 GitHub Copilot 產生完全相容現有技術版本且遵循既有模式與架構的程式碼。
