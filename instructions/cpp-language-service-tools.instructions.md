---
description: 您是使用 C++ 語言服務工具 (GetSymbolReferences_CppTools, GetSymbolInfo_CppTools, GetSymbolCallHierarchy_CppTools) 的專家。這是針對 Copilot 呼叫 C++ 工具的指引。在處理 C++ 程式碼時，您可以使用強大的語言服務工具，這些工具能提供準確且由 IntelliSense 驅動的分析。**請務必優先使用這些工具，而非手動程式碼檢查、文字搜尋或猜測。**
applyTo: "**/*.cpp, **/*.h, **/*.hpp, **/*.cc, **/*.cxx, **/*.c"
---

## 可用的 C++ 工具

您可以使用三種專門的 C++ 工具：

1. **`GetSymbolInfo_CppTools`** — 尋找符號 (symbol) 定義並獲取型別細節
2. **`GetSymbolReferences_CppTools`** — 尋找符號的所有參考
3. **`GetSymbolCallHierarchy_CppTools`** — 分析函式呼叫關係

---

## 強制性工具使用規則

### 規則 1：務必使用 GetSymbolReferences_CppTools 尋找符號用法

**絕不要** 依賴手動程式碼檢查、`vscode_listCodeUsages`、`grep_search` 或 `read_file` 來尋找符號的使用位置。

在以下情況，**務必** 呼叫 `GetSymbolReferences_CppTools`：

- 重新命名任何符號 (函式、變數、類別、方法等)
- 變更函式特徵 (signatures)
- 重構程式碼
- 瞭解符號影響
- 尋找所有呼叫點 (call sites)
- 識別使用模式
- 任何涉及「尋找所有用途/用法/參考/呼叫」的任務

**原因**：`GetSymbolReferences_CppTools` 使用 C++ IntelliSense 並能理解：

- 多載 (Overloaded) 函式
- 範本具現化 (Template instantiations)
- 限定與非限定名稱 (Qualified vs unqualified names)
- 成員函式呼叫
- 繼承成員的用法
- 前置處理器條件程式碼

文字搜尋工具會遺漏這些或產生誤報。

### 規則 2：務必使用 GetSymbolCallHierarchy_CppTools 進行函式變更

在修改任何函式特徵之前，**務必** 呼叫 `GetSymbolCallHierarchy_CppTools` 並將 `callsFrom` 設為 `false` 以尋找所有呼叫者。

**範例**：

- 新增/移除函式參數
- 變更參數型別
- 變更回傳型別
- 將函式設為虛擬 (virtual)
- 轉換為範本函式

**原因**：這能確保您更新所有的呼叫點，而不僅僅是您能看到的那些。

### 規則 3：務必使用 GetSymbolInfo_CppTools 瞭解符號

在處理不熟悉的程式碼之前，**務必** 呼叫 `GetSymbolInfo_CppTools` 以：

- 尋找符號定義位置
- 瞭解類別/結構 (class/struct) 的記憶體配置
- 獲取型別資訊
- 定位宣告

**絕不要** 在未檢查的情況下假定您知道某個符號是什麼。

---

## 參數使用指引

### 符號名稱 (Symbol Names)

- **務必提供 (REQUIRED)**：提供符號名稱
- 可以是非限定名稱 (`MyFunction`)、部分限定名稱 (`MyClass::MyMethod`) 或完全限定名稱 (`MyNamespace::MyClass::MyMethod`)
- 如果您有行號，符號應與該行出現的內容相符

### 檔案路徑

- **強烈建議 (STRONGLY PREFERRED)**：盡可能提供絕對檔案路徑
  - ✅ 正確：`C:\Users\Project\src\main.cpp`
  - ❌ 避免：`src\main.cpp` (需要解析，可能會失敗)
- 如果您可以取得檔案路徑，請將其包含在內
- 若處理使用者指定的檔案，請使用其精確路徑

### 行號

- **重要提示**：行號是以 1 為基底 (1-based)，而非以 0 為基底
- 需要行號時的 **強制性工作流程**：
  1. 先呼叫 `read_file` 搜尋符號
  2. 在輸出中定位符號
  3. 記錄輸出中精確的行號
  4. 驗證該行是否包含該符號
  5. 僅在此之後使用該行號呼叫 C++ 工具
- **絕不要** 猜測或估計行號
- 如果您沒有行號，請將其省略 — 工具會自行尋找符號

### 最小資訊策略

從最少的資訊開始，僅在需要時增加：

1. **第一次嘗試**：僅提供符號名稱
2. **若有歧義**：符號名稱 + 檔案路徑
3. **若仍有歧義**：符號名稱 + 檔案路徑 + 行號 (使用 `read_file` 之後)

---

## 常見工作流程

### 重新命名符號

```
正確工作流程：
1. 呼叫 GetSymbolReferences_CppTools，提供符號名稱 (及檔案路徑，若可用)
2. 檢閱回傳的所有參考
3. 在定義位置更新符號
4. 在所有參考位置更新符號

錯誤工作流程：
❌ 使用 vscode_listCodeUsages 或 grep_search 尋找用法
❌ 手動檢查少數幾個檔案
❌ 假定您知道所有的用法
```

### 變更函式特徵

```
正確工作流程：
1. 呼叫 GetSymbolInfo_CppTools 定位函式定義
2. 呼叫 GetSymbolCallHierarchy_CppTools 並設定 callsFrom=false 以尋找所有呼叫者
3. 呼叫 GetSymbolReferences_CppTools 以捕捉任何額外的參考 (函式指標等)
4. 更新函式定義
5. 使用新特徵更新所有呼叫點

錯誤工作流程：
❌ 在未尋找呼叫者的情況下變更函式
❌ 僅更新可見的呼叫點
❌ 使用文字搜尋尋找呼叫
```

### 瞭解不熟悉的程式碼

```
正確工作流程：
1. 對關鍵型別/函式呼叫 GetSymbolInfo_CppTools 以瞭解定義
3. 呼叫 GetSymbolCallHierarchy_CppTools 並設定 callsFrom=true 以瞭解函式的功能
4. 呼叫 GetSymbolCallHierarchy_CppTools 並設定 callsFrom=false 以瞭解函式的使用位置

錯誤工作流程：
❌ 在無工具協助下進行手動程式碼讀取
❌ 對符號意義做出假設
❌ 跳過階層分析
```

### 分析函式相依性

```
正確工作流程：
1. 呼叫 GetSymbolCallHierarchy_CppTools 並設定 callsFrom=true 以查看該函式呼叫了什麼 (傳出)
2. 呼叫 GetSymbolCallHierarchy_CppTools 並設定 callsFrom=false 以查看什麼呼叫了該函式 (傳入)
3. 藉此瞭解程式碼流與相依性

錯誤工作流程：
❌ 手動讀取整個函式主體
❌ 猜測呼叫模式
```

---

## 錯誤處理與復原

### 當您收到錯誤訊息時

**所有錯誤訊息皆包含具體的復原指令。務必完全遵循。**

#### 「符號名稱無效 (Symbol name is not valid)」錯誤

```
錯誤："The symbol name is not valid: it is either empty or null. Find a valid symbol name. Then call the [tool] tool again"

復原：
1. 確保您提供的是非空符號名稱
2. 檢查符號名稱拼字是否正確
3. 使用有效的符號名稱重試
```

#### 「找不到檔案 (File could not be found)」錯誤

```
錯誤："A file could not be found at the specified path. Compute the absolute path to the file. Then call the [tool] tool again."

復原：
1. 將相對路徑轉換為絕對路徑
2. 驗證工作區中是否存在該檔案
3. 使用來自使用者或檔案系統的精確路徑
4. 使用絕對路徑重試
```

#### 「未找到結果 (No results found)」訊息

```
訊息："No results found for the symbol '[symbol_name]'."

這不是錯誤，這代表：
- 符號存在且已被找到
- 但它沒有參考/呼叫/階層 (取決於工具)
- 這是有效的資訊 — 請回報給使用者
```

---

## 工具選擇決策樹

**問題：我是否需要尋找符號的使用/呼叫/參考位置？**

- ✅ 是 → 使用 `GetSymbolReferences_CppTools`
- ❌ 否 → 繼續

**問題：我是否正在變更函式特徵或分析函式呼叫？**

- ✅ 是 → 使用 `GetSymbolCallHierarchy_CppTools`
  - 尋找呼叫者？ → `callsFrom=false`
  - 尋找它呼叫了什麼？ → `callsFrom=true`
- ❌ 否 → 繼續

**問題：我是否需要尋找定義或瞭解型別？**

- ✅ 是 → 使用 `GetSymbolInfo_CppTools`
- ❌ 否 → 您可能不需要為此任務使用 C++ 工具

---

## 關鍵提醒

### 務必：

- ✅ 呼叫 `GetSymbolReferences_CppTools` 進行任何符號用法搜尋
- ✅ 在變更函式特徵前呼叫 `GetSymbolCallHierarchy_CppTools`
- ✅ 在指定行號前，先使用 `read_file` 尋找行號
- ✅ 盡可能提供絕對檔案路徑
- ✅ 完全遵循錯誤訊息指令
- ✅ 相信工具結果而非手動檢查
- ✅ 先使用最少參數，必要時再增加
- ✅ 記住行號是以 1 為基底

### 絕不：

- ❌ 使用 `vscode_listCodeUsages`、`grep_search` 或 `read_file` 尋找符號用法
- ❌ 手動檢查程式碼以尋找參考
- ❌ 猜測行號
- ❌ 在未檢查的情況下假定符號是唯一的
- ❌ 忽略錯誤訊息
- ❌ 為了節省時間而跳過工具使用
- ❌ 使用以 0 為基底的行號
- ❌ 批次執行多個無關的符號作業
- ❌ 在未尋找所有受影響位置的情況下進行變更

---

## 正確用法範例

### 範例 1：使用者要求重新命名函式

```
使用者：「將 ProcessData 函式重新命名為 HandleData」

正確回應：
1. 呼叫 GetSymbolReferences_CppTools("ProcessData")
2. 檢閱結果中所有的參考位置
3. 更新定義位置的符號
4. 更新結果中顯示的所有呼叫點
5. 確認所有變更已完成

錯誤回應：
❌ 使用 grep_search 尋找 "ProcessData"
❌ 僅更新使用者提到的檔案
❌ 假定您已手動找到所有用法
```

### 範例 2：使用者要求為函式新增參數

```
使用者：「為 LogMessage 函式新增一個 'bool verbose' 參數」

正確回應：
1. 呼叫 GetSymbolInfo_CppTools("LogMessage") 尋找定義
2. 呼叫 GetSymbolCallHierarchy_CppTools("LogMessage", callsFrom=false) 尋找所有呼叫者
3. 呼叫 GetSymbolReferences_CppTools("LogMessage") 以捕捉任何函式指標用法
4. 更新函式定義
5. 使用新參數更新所有呼叫點

錯誤回應：
❌ 僅更新定義
❌ 僅更新顯而易見的呼叫點
❌ 未使用 call_hierarchy 工具
```

### 範例 3：使用者要求瞭解一個函式

```
使用者：「Initialize 函式的功能是什麼？」

正確回應：
1. 呼叫 GetSymbolInfo_CppTools("Initialize") 尋找定義與位置
2. 呼叫 GetSymbolCallHierarchy_CppTools("Initialize", callsFrom=true) 查看它呼叫了什麼
3. 閱讀函式實作
4. 根據程式碼 + 呼叫階層進行說明

錯誤回應：
❌ 僅閱讀函式主體
❌ 未檢查它呼叫了什麼
❌ 猜測行為
```

---

## 效能與最佳實踐

### 高效率的工具使用

- 分析多個獨立符號時，並行呼叫工具
- 使用檔案路徑加速符號解析
- 提供上下文以縮小搜尋範圍

### 迭代精煉

- 若第一次工具呼叫結果具歧義，請加入檔案路徑
- 若仍具歧義，使用 `read_file` 尋找精確行號
- 工具是為迭代而設計的

### 理解結果

- **空結果是有效的**：「未找到結果」代表符號沒有參考/呼叫
- **多個結果很常見**：C++ 具有多載、範本、命名空間
- **相信工具**：IntelliSense 比文字搜尋更瞭解 C++ 語義

---

## 與其他工具整合

### 何時使用 read_file

- **僅限** 在呼叫 C++ 工具前尋找行號
- **僅限** 在定位符號後讀取實作細節
- **絕不** 用於尋找符號用法 (請改用 `GetSymbolReferences_CppTools`)

### 何時使用 vscode_listCodeUsages/grep_search

- 尋找字串常值 (string literals) 或註釋
- 搜尋非 C++ 檔案
- 設定檔中的模式比對
- **絕不** 用於尋找 C++ 符號用法

### 何時使用 semantic_search

- 根據概念性查詢尋找程式碼
- 在大型程式碼庫中定位相關檔案
- 瞭解專案結構
- **接著** 使用 C++ 工具進行精確的符號分析

---

## 總結

**黃金法則**：處理 C++ 程式碼時，請遵循「工具優先，手動檢查其次」。

1. **符號用法？** → `GetSymbolReferences_CppTools`
2. **函式呼叫？** → `GetSymbolCallHierarchy_CppTools`
3. **符號定義？** → `GetSymbolInfo_CppTools`

這些工具是您理解 C++ 程式碼的主要介面。請頻繁且廣泛地使用它們。它們快速、準確，且能理解文字搜尋無法捕捉的 C++ 語義。

**您的成功指標**：我是否在每項與符號相關的任務中都使用了正確的 C++ 工具？
