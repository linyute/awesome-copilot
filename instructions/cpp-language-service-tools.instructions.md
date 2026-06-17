---
description: 您是使用 C++ 語言服務工具（GetSymbolReferences_CppTools、GetSymbolInfo_CppTools、GetSymbolCallHierarchy_CppTools）的專家。呼叫 Copilot C++ 工具的說明。處理 C++ 程式碼時，您可以使用強大的語言服務工具，提供準確且由 IntelliSense 驅動的分析。**始終優先使用這些工具，而不是手動檢查程式碼、文字搜尋或猜測。**
applyTo: "**/*.cpp, **/*.h, **/*.hpp, **/*.cc, **/*.cxx, **/*.c"
---

## 可用的 C++ 工具

您可以使用三種專門的 C++ 工具：

1. **`GetSymbolInfo_CppTools`** - 尋找符號定義並獲取類型資訊
2. **`GetSymbolReferences_CppTools`** - 尋找符號的所有參考
3. **`GetSymbolCallHierarchy_CppTools`** - 分析函式呼叫階層

---

## 強制工具使用規則

### 規則 1：優先使用 GetSymbolReferences_CppTools 作為定位 C/C++ 符號使用的預設工具

**不要**依賴文字搜尋工具，例如 `vscode_listCodeUsages`、`grep_search` 或 `read_file`。僅當 GetSymbolReferences_CppTools 不可用、失敗或看起來不完整時，才使用這些文字搜尋工具作為備案。

**始終**在以下情況下呼叫 `GetSymbolReferences_CppTools`：
- 任何涉及「尋找所有參考/用法/使用」的任務
- 更改函式簽名
- 重構程式碼
- 瞭解符號影響
- 識別用法模式

**原因**：`GetSymbolReferences_CppTools` 使用 C++ IntelliSense 並瞭解：
- 區分多載函式
- 區分範本具現化
- 限定名稱與非限定名稱
- 成員函式呼叫
- 繼承成員的使用
- 活動配置的預處理器條件

文字搜尋工具會遺漏這些內容或產生錯誤的正向結果。

### 規則 2：更改函式時始終使用 GetSymbolCallHierarchy_CppTools

在修改任何函式簽名之前，**始終**呼叫 `GetSymbolCallHierarchy_CppTools` 並將 `callsFrom` 設為 `false` 以尋找所有呼叫者。

**範例**：

- 新增/刪除函式參數
- 更改參數類型
- 更改回傳類型
- 將函式設為虛擬
- 轉換為範本函式

**原因**：這可確保您更新所有呼叫位置，而不僅僅是您能看到的那些。

### 規則 3：始終使用 GetSymbolInfo_CppTools 來瞭解符號

在處理不熟悉的程式碼之前，**始終**呼叫 `GetSymbolInfo_CppTools` 以：

- 尋找符號定義的位置
- 獲取類型資訊

在未檢查之前，**絕不**假設您知道符號是什麼。

---

## 參數使用指南

### 符號名稱 (Symbol Names)

- **始終必要**：提供符號名稱
- 可以是非限定名稱 (`MyFunction`)、部分限定名稱 (`MyClass::MyMethod`) 或完全限定名稱 (`MyNamespace::MyClass::MyMethod`)
- 如果您有行號，符號應與該行上顯示的內容匹配

### 檔案路徑 (File Paths)

- **強烈建議**：盡可能提供絕對檔案路徑
  - ✅ 正確：`C:\Users\Project\src\main.cpp`
  - ❌ 避免：`src\main.cpp`（需要解析，可能會失敗）
- 如果您有檔案路徑的存取權限，請包含它
- 如果處理使用者指定的檔案，請使用其確切路徑

### 行號 (Line Numbers)

- **關鍵**：行號是從 1 開始的，而不是從 0 開始
- 當您需要行號時的**強制工作流程**：
  1. 首先呼叫 `read_file` 搜尋符號
  2. 在輸出中定位符號
  3. 記下輸出中的正確行號
  4. 驗證該行是否包含該符號
  5. 然後才使用該行號呼叫 C++ 工具
- **絕不**猜測或估計行號
- 如果您沒有行號，請將其省略 - 工具會尋找符號

### 最小資訊策略

從最小資訊開始，僅在需要時新增更多資訊：

1. **第一次嘗試**：僅符號名稱
2. **如果不明確**：符號名稱 + 檔案路徑
3. **如果仍然不明確**：符號名稱 + 檔案路徑 + 行號（使用上述 `read_file` 工作流程後）

---

## 常見工作流程

### 更改函式簽名

```
正確的工作流程：
1. 呼叫 GetSymbolInfo_CppTools 定位函式定義
2. 呼叫 GetSymbolCallHierarchy_CppTools 並將 callsFrom=false 尋找所有呼叫者
3. 呼叫 GetSymbolReferences_CppTools 捕獲任何額外的參考（函式指標等）
4. 更新函式定義
5. 使用新簽名更新所有呼叫位置

不正確的工作流程：
❌ 在未尋找呼叫者的情況下更改函式
❌ 僅更新可見的呼叫位置
❌ 使用文字搜尋尋找呼叫
```

### 瞭解不熟悉的程式碼

```
正確的工作流程：
1. 對關鍵類型/函式呼叫 GetSymbolInfo_CppTools 以瞭解定義
2. 呼叫 GetSymbolCallHierarchy_CppTools 並將 callsFrom=true 以瞭解函式的作用
3. 呼叫 GetSymbolCallHierarchy_CppTools 並將 callsFrom=false 以瞭解函式在何處被使用

不正確的工作流程：
❌ 在沒有工具協助的情況下手動閱讀程式碼
❌ 對符號含義做出假設
❌ 跳過階層分析
```

### 分析函式相依性

```
正確的工作流程：
1. 呼叫 GetSymbolCallHierarchy_CppTools 並將 callsFrom=true 查看函式呼叫的內容（傳出）
2. 呼叫 GetSymbolCallHierarchy_CppTools 並將 callsFrom=false 查看呼叫函式的內容（傳入）
3. 使用此方法瞭解程式碼流和相依性

不正確的工作流程：
❌ 手動閱讀函式主體
❌ 猜測呼叫模式
```

---

## 錯誤處理與復原

### 當您收到錯誤訊息時

**所有錯誤訊息都包含特定的復原說明。務必嚴格遵守。**

#### "Symbol name is not valid" 錯誤

```
錯誤："符號名稱無效：它為空或為 null。尋找有效的符號名稱。然後再次呼叫 [tool] 工具"

復原：
1. 確保您提供了非空的符號名稱
2. 檢查符號名稱拼寫是否正確
3. 使用有效的符號名稱重試
```

#### "File could not be found" 錯誤

```
錯誤："在指定路徑中找不到檔案。計算檔案的絕對路徑。然後再次呼叫 [tool] 工具。"

復原：
1. 將相對路徑轉換為絕對路徑
2. 驗證工作區中是否存在該檔案
3. 使用來自使用者或檔案系統的確切路徑
4. 使用絕對路徑重試
```

#### "No results found" 訊息

```
訊息："找不到符號 '[symbol_name]' 的結果。"

這不是錯誤 - 它意味著：
- 符號存在且已被找到
- 但它沒有參考/呼叫/階層（取決於工具）
- 這是有效的資訊 - 請回報給使用者
```

---

## 工具選擇決策樹

**問題：我是否需要尋找符號被使用/呼叫/參考的位置？**

- ✅ 是 → 使用 `GetSymbolReferences_CppTools`
- ❌ 否 → 繼續

**問題：我是否正在更改函式簽名或分析函式呼叫？**

- ✅ 是 → 使用 `GetSymbolCallHierarchy_CppTools`
  - 尋找呼叫者？ → `callsFrom=false`
  - 尋找它呼叫了什麼？ → `callsFrom=true`
- ❌ 否 → 繼續

**問題：我是否需要尋找定義或瞭解類型？**

- ✅ 是 → 使用 `GetSymbolInfo_CppTools`
- ❌ 否 → 您可能不需要 C++ 工具來執行此任務

---

## 關鍵提醒

### 應做事項 (DO)：

- ✅ 對任何符號用法搜尋呼叫 `GetSymbolReferences_CppTools`
- ✅ 在變更函式簽名之前呼叫 `GetSymbolCallHierarchy_CppTools`
- ✅ 在指定行號之前，使用 `read_file` 尋找行號。規則 1：優先使用 GetSymbolReferences_CppTools 作為定位 C/C++ 符號使用的預設工具
- ✅ 預設優先使用 C++ 工具。僅在 C++ 工具不可用、失敗或不完整時才將文字搜尋工具作為備案。
- ✅ 盡可能提供絕對檔案路徑
- ✅ 嚴格遵守錯誤訊息說明
- ✅ 信任工具結果優於手動檢查
- ✅ 先使用最小參數，必要時再增加
- ✅ 記住行號是從 1 開始的

### 禁止事項 (DO NOT)：
- ❌ 依賴 `vscode_listCodeUsages`、`grep_search` 或 `read_file` 等文字搜尋工具來尋找符號用法
- ❌ 手動檢查程式碼以尋找參考
- ❌ 猜測行號
- ❌ 在未檢查的情況下假設符號唯一性
- ❌ 忽略錯誤訊息
- ❌ 為了節省時間而跳過工具使用
- ❌ 使用從 0 開始的行號
- ❌ 批次執行多個無關的符號操作
- ❌ 在未尋找所有受影響位置的情況下進行更改

---

## 正確使用範例

### 範例 1：使用者要求為函式新增參數
```
使用者："為 LogMessage 函式新增參數 'bool verbose'"

正確的回應：
1. 呼叫 GetSymbolInfo_CppTools("LogMessage") 尋找定義
2. 呼叫 GetSymbolCallHierarchy_CppTools("LogMessage", callsFrom=false) 尋找所有呼叫者
3. 呼叫 GetSymbolReferences_CppTools("LogMessage") 捕獲任何函式指標用法
4. 更新函式定義
5. 使用新參數更新所有呼叫位置

不正確的回應：
❌ 僅更新定義
❌ 僅更新明顯的呼叫位置
❌ 未使用 call_hierarchy 工具
```

### 範例 2：使用者要求瞭解一個函式
```
使用者："Initialize 函式的作用是什麼？"

正確的回應：
1. 呼叫 GetSymbolInfo_CppTools("Initialize") 尋找定義和位置
2. 呼叫 GetSymbolCallHierarchy_CppTools("Initialize", callsFrom=true) 查看它呼叫了什麼
3. 閱讀函式實作
4. 根據程式碼 + 呼叫階層進行說明

不正確的回應：
❌ 僅閱讀函式主體
❌ 未檢查它呼叫了什麼
❌ 猜測行為
```

---

## 效能與最佳實踐

### 高效工具使用

- 分析多個獨立符號時平行呼叫工具
- 使用檔案路徑加速符號解析
- 提供上下文以縮小搜尋範圍

### 迭代改進

- 如果第一次工具呼叫不明確，請新增檔案路徑
- 如果仍然不明確，請使用 `read_file` 尋找確切行號
- 工具旨在進行迭代

### 瞭解結果

- **空結果是有效的**："找不到結果" 意味著符號沒有參考/呼叫
- **多個結果很常見**：C++ 有多載、範本、命名空間
- **信任工具**：IntelliSense 比文字搜尋工具更瞭解 C++ 語義

---

## 與其他工具整合

### 何時使用 read_file

- **僅**用於在呼叫 C++ 工具之前尋找行號
- **僅**用於在定位符號後閱讀實作詳細資訊
- **絕不**用於尋找符號用法（請改用 `GetSymbolReferences_CppTools`）

### 何時使用 vscode_listCodeUsages/grep_search

- 尋找字串字面量或註解
- 搜尋非 C++ 檔案
- 配置檔案中的模式比對
- **絕不**用於尋找 C++ 符號用法，除非 GetSymbolReferences_CppTools 不可用、失敗或顯示不完整

### 何時使用 semantic_search

- 根據概念查詢尋找程式碼
- 在大型程式碼庫中定位相關檔案
- 瞭解專案結構
- **然後**使用 C++ 工具進行精確的符號分析

---

## 總結

**金科玉律**：處理 C++ 程式碼時，請考慮「工具優先，手動檢查在後」。

1. **符號用法？** → `GetSymbolReferences_CppTools`
2. **函式呼叫？** → `GetSymbolCallHierarchy_CppTools`
3. **符號定義？** → `GetSymbolInfo_CppTools`

這些工具是您理解 C++ 程式碼的主要介面。請大方且頻繁地使用它們。它們快速、準確，並且理解文字搜尋工具無法捕獲的 C++ 語義。

**您的成功指標**：我是否在每個與符號相關的任務中都使用了正確的 C++ 工具？
