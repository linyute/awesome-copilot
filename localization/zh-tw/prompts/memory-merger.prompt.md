---
description: '將領域記憶檔案中的成熟經驗合併到其指令檔案中。語法：`/memory-merger >domain [scope]`，其中 scope 為 `global` (預設)、`user`、`workspace` 或 `ws`。'
---

# 記憶合併器

您將領域記憶檔案中的成熟學習內容合併到其指令檔案中，確保知識保留且冗餘最少。

**使用待辦事項清單**來追蹤您在流程步驟中的進度，並讓使用者隨時了解情況。

## 範圍

記憶指令可以儲存在兩個範圍中：

- **全域** (`global` 或 `user`) - 儲存在 `<global-prompts>` (`vscode-userdata:/User/prompts/`) 中，並適用於所有 VS Code 專案
- **工作區** (`workspace` 或 `ws`) - 儲存在 `<workspace-instructions>` (`<workspace-root>/.github/instructions/`) 中，並僅適用於目前專案

預設範圍為**全域**。

在整個提示中，`<global-prompts>` 和 `<workspace-instructions>` 指的是這些目錄。

## 語法

```
/memory-merger >domain-name [scope]
```

- `>domain-name` - 必填。要合併的領域 (例如，`>clojure`、`>git-workflow`、`>prompt-engineering`)
- `[scope]` - 選填。其中之一：`global`、`user` (兩者都表示全域)、`workspace` 或 `ws`。預設為 `global`

**範例：**
- `/memory-merger >prompt-engineering` - 合併全域提示工程記憶
- `/memory-merger >clojure workspace` - 合併工作區 Clojure 記憶
- `/memory-merger >git-workflow ws` - 合併工作區 Git 工作流程記憶

## 流程

### 1. 解析輸入並讀取檔案

- **從使用者輸入中擷取**領域和範圍
- **確定**檔案路徑：
  - 全域：`<global-prompts>/{domain}-memory.instructions.md` → `<global-prompts>/{domain}.instructions.md`
  - 工作區：`<workspace-instructions>/{domain}-memory.instructions.md` → `<workspace-instructions>/{domain}.instructions.md`
- 使用者可能輸入錯誤的領域，如果您找不到記憶檔案，請全域搜尋目錄並確定是否有匹配項。如有疑問，請向使用者詢問輸入。
- **讀取**兩個檔案 (記憶檔案必須存在；指令檔案可能不存在)

### 2. 分析並提出建議

審查所有記憶區段並將其呈現以供合併考量：

```
## 建議合併的記憶

### 記憶：[標題]
**內容：** [重點]
**位置：** [在指令中的位置]

[更多記憶]...
```

說：「請審查這些記憶。全部核准請輸入 'go'，或指定要跳過的記憶。」

**停止並等待使用者輸入。**

### 3. 定義品質標準

為構成出色的合併結果指令建立 10/10 的標準：
1. **零知識損失** - 保留每個細節、範例和細微差別
2. **最小冗餘** - 合併重疊的指導
3. **最大可掃描性** - 清晰的層次結構、平行結構、策略性粗體、邏輯分組

### 4. 合併並迭代

**暫不更新檔案**，開發最終合併的指令：

1. 起草合併的指令，納入核准的記憶
2. 根據品質標準進行評估
3. 精煉結構、措辭、組織
4. 重複直到合併的指令達到 10/10 的標準

### 5. 更新檔案

一旦最終合併的指令達到 10/10 的標準：

- **建立或更新**指令檔案，其中包含最終合併的內容
  - 如果建立新檔案，請包含適當的前置內容
  - 如果記憶檔案和指令檔案都存在，請**合併 `applyTo` 模式**，確保全面覆蓋且沒有重複
- **從記憶檔案中移除**合併的區段

## 範例

```
使用者：「/memory-merger >clojure」

代理程式：
1. 讀取 clojure-memory.instructions.md 和 clojure.instructions.md
2. 提出 3 個記憶以供合併
3. [停止]

使用者：「go」

代理程式：
4. 定義 10/10 的品質標準
5. 合併新的指令候選，迭代至 10/10
6. 更新 clojure.instructions.md
7. 清理 clojure-memory.instructions.md
```
