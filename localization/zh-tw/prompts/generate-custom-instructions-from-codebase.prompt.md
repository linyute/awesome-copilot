---
description: 'GitHub Copilot 的遷移與程式碼演進指令產生器。分析兩個專案版本（分支、提交或發行版）之間的差異，產生精確指令，協助 Copilot 在技術遷移、大型重構或框架升級時維持一致性。'
agent: 'agent'
---

# 遷移與程式碼演進指令產生器

## 設定變數

```
${MIGRATION_TYPE="框架版本|架構重構|技術遷移|相依更新|模式變更"}
<!-- 遷移或演進類型 -->

${SOURCE_REFERENCE="branch|commit|tag"}
<!-- 原始參考點（遷移前狀態） -->

${TARGET_REFERENCE="branch|commit|tag"}  
<!-- 目標參考點（遷移後狀態） -->

${ANALYSIS_SCOPE="整個專案|特定資料夾|僅修改檔案"}
<!-- 分析範圍 -->

${CHANGE_FOCUS="重大變更|新慣例|過時模式|API 變更|設定"}
<!-- 變更重點 -->

${AUTOMATION_LEVEL="保守|平衡|積極"}
<!-- Copilot 建議的自動化程度 -->

${GENERATE_EXAMPLES="true|false"}
<!-- 是否包含轉換範例 -->

${VALIDATION_REQUIRED="true|false"}
<!-- 是否需驗證後套用 -->
```

## 產生的提示

```
"分析兩個專案狀態間的程式碼演進，產生精確的遷移指令給 GitHub Copilot。這些指令將引導 Copilot 在未來修改時自動套用相同轉換模式。請依下列方法：

### 階段一：比較狀態分析

#### 結構變更偵測
- 比較 ${SOURCE_REFERENCE} 與 ${TARGET_REFERENCE} 的資料夾結構
- 辨識移動、重新命名或刪除的檔案
- 分析設定檔變更
- 記錄新增與移除的相依項目

#### 程式碼轉換分析
${MIGRATION_TYPE == "框架版本" ? 
  "- 辨識框架版本間的 API 變更
   - 分析新功能使用情形
   - 記錄過時方法/屬性
   - 註明語法或慣例變更" : ""}

${MIGRATION_TYPE == "架構重構" ? 
  "- 分析架構模式變更
   - 辨識新抽象層
   - 記錄職責重組
   - 註明資料流變更" : ""}

${MIGRATION_TYPE == "技術遷移" ? 
  "- 分析技術替換
   - 辨識功能等價
   - 記錄 API 與語法變更
   - 註明新相依與設定" : ""}

#### 轉換模式萃取
- 辨識重複轉換
- 分析舊格式到新格式的轉換規則
- 記錄例外與特殊情境
- 建立前後對應矩陣

### 階段二：遷移指令產生

建立 `.github/copilot-migration-instructions.md` 檔案，結構如下：

\```markdown
# GitHub Copilot 遷移指令

## 遷移背景
- **類型**: ${MIGRATION_TYPE}
- **來源**: ${SOURCE_REFERENCE} 
- **目標**: ${TARGET_REFERENCE}
- **日期**: [GENERATION_DATE]
- **範圍**: ${ANALYSIS_SCOPE}

## 自動轉換規則

### 1. 強制轉換
${AUTOMATION_LEVEL != "保守" ? 
  "[自動轉換規則]
   - **舊模式**: [OLD_CODE]
   - **新模式**: [NEW_CODE]
   - **觸發條件**: 何時偵測此模式
   - **動作**: 自動套用的轉換" : ""}

### 2. 需驗證的轉換
${VALIDATION_REQUIRED == "true" ? 
  "[需驗證轉換]
   - **偵測模式**: [DESCRIPTION]
   - **建議轉換**: [NEW_APPROACH]
   - **驗證需求**: [VALIDATION_CRITERIA]
   - **替代方案**: [ALTERNATIVE_OPTIONS]" : ""}

### 3. API 對應
${CHANGE_FOCUS == "API 變更" || MIGRATION_TYPE == "框架版本" ? 
  "[API 對應表]
   | 舊 API   | 新 API   | 備註     | 範例        |
   | --------- | --------- | --------- | -------------- |
   | [OLD_API] | [NEW_API] | [CHANGES] | [CODE_EXAMPLE] | " : ""} |

### 4. 新模式採用
[偵測到的新模式]
- **模式**: [PATTERN_NAME]
- **使用時機**: [WHEN_TO_USE] 
- **實作方式**: [HOW_TO_IMPLEMENT]
- **優點**: [ADVANTAGES]

### 5. 避免使用的過時模式
[偵測到的過時模式]
- **過時模式**: [OLD_PATTERN]
- **避免原因**: [REASONS]
- **替代方案**: [NEW_PATTERN]
- **遷移步驟**: [CONVERSION_STEPS]

## 檔案類型專屬指令

${GENERATE_EXAMPLES == "true" ? 
  "### 設定檔
   [設定轉換範例]
   
   ### 主程式檔
   [程式轉換範例]
   
   ### 測試檔
   [測試轉換範例]" : ""}

## 驗證與安全性

### 自動檢查點
- 每次轉換後需執行的驗證
- 驗證變更的測試
- 需監控的效能指標
- 需執行的相容性檢查

### 人工升級
需人工介入情境：
- [複雜案例清單]
- [架構決策]
- [商業影響]

## 遷移監控

### 追蹤指標
- 自動遷移程式碼百分比
- 需人工驗證數量
- 自動轉換錯誤率
- 每檔案平均遷移時間

### 錯誤回報
如何向 Copilot 回報錯誤轉換：
- 回饋模式以優化規則
- 需記錄的例外
- 指令需調整之處

\```

### 階段三：情境範例產生

${GENERATE_EXAMPLES == "true" ? 
  "#### 轉換範例
   針對每個偵測到的模式，產生：
   
   \```
   // 轉換前（${SOURCE_REFERENCE}）
   [OLD_CODE_EXAMPLE]
   
   // 轉換後（${TARGET_REFERENCE}） 
   [NEW_CODE_EXAMPLE]
   
   // COPILOT 指令
   當偵測到此模式 [TRIGGER]，請依下列步驟將其轉換為 [NEW_PATTERN]：[STEPS]
   \```
" : ""}

### 階段四：驗證與最佳化

#### 指令測試
- 於測試程式碼套用指令
- 驗證轉換一致性
- 依結果調整規則
- 記錄例外與邊界情境

#### 反覆最佳化  
${AUTOMATION_LEVEL == "積極" ? 
  "- 精煉規則以最大化自動化
   - 降低誤判率
   - 提升轉換準確度
   - 記錄學習心得" : ""}

### 最終成果

遷移指令讓 GitHub Copilot 能：
1. **自動套用**相同轉換於未來修改
2. **維持一致性**，遵循新慣例
3. **避免過時模式**，自動建議替代方案
4. **加速未來遷移**，累積經驗
5. **降低錯誤率**，自動化重複轉換

這些指令讓 Copilot 成為智慧遷移助手，能一致且可靠地重現你的技術演進決策。
"
```

## 典型應用情境

### 框架版本遷移
適合記錄 Angular 14 升級至 Angular 17、React 類別元件轉 Hooks、.NET Framework 轉 .NET Core 等。可自動辨識重大變更並產生對應轉換規則。

### 技術堆疊演進  
適用於完全替換技術：如 jQuery 轉 React、REST 轉 GraphQL、SQL 轉 NoSQL。產生完整遷移指引與模式對應。

### 架構重構
適合大型重構，如單體轉微服務、MVC 轉乾淨架構、元件式轉組合式架構。保留架構知識，利於未來類似轉換。

### 設計模式現代化
適用於採用新模式：如 Repository Pattern、依賴注入、Observer 轉 Reactive Programming。記錄原理與實作差異。

## 獨特優勢

### 🧠 **人工智慧增強**
不同於傳統遷移文件，這些指令能「訓練」GitHub Copilot，在未來程式碼修改時自動重現你的技術演進決策。

### 🔄 **知識資本化**  
將專案經驗轉化為可重複使用的規則，避免遷移知識流失，加速未來類似轉換。

### 🎯 **情境精準**
不再僅給予通用建議，能根據你的程式碼庫產生專屬指令，並附上真實前後範例。

### ⚡ **自動化一致性**
確保新程式碼自動遵循新慣例，避免架構回退，維持程式碼演進一致性。
