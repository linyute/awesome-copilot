---
agent: 'agent'
description: '更新 Bicep 檔案中的 Azure Verified Modules (AVM) 至最新版本。'
tools: ['search/codebase', 'think', 'changes', 'fetch', 'search/searchResults', 'todos', 'edit/editFiles', 'search', 'runCommands', 'bicepschema', 'azure_get_schema_for_Bicep']
---

# 更新 Bicep 檔案中的 Azure Verified Modules

更新 Bicep 檔案 `${file}` 以使用最新的 Azure Verified Module (AVM) 版本。將進度更新限制為非破壞性變更。除了最終輸出表格和摘要外，不要輸出其他資訊。

## 流程

1. **掃描**：從 `${file}` 中提取 AVM 模組和當前版本
1. **識別**：使用 `#search` 工具匹配 `avm/res/{service}/{resource}` 列出所有使用的唯一 AVM 模組
1. **檢查**：使用 `#fetch` 工具從 MCR 獲取每個 AVM 模組的最新版本：`https://mcr.microsoft.com/v2/bicep/avm/res/{service}/{resource}/tags/list`
1. **比較**：解析語義版本以識別需要更新的 AVM 模組
1. **審查**：對於破壞性變更，使用 `#fetch` 工具從以下位置獲取文件：`https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/{service}/{resource}`
1. **更新**：使用 `#editFiles` 工具應用版本更新和參數變更
1. **驗證**：使用 `#runCommands` 工具運行 `bicep lint` 和 `bicep build` 以確保合規性。
1. **輸出**：以表格格式總結變更，並在下方提供更新摘要。

## 工具使用

始終使用可用的工具 `#search`、`#searchResults`、`#fetch`、`#editFiles`、`#runCommands`、`#todos`。避免編寫程式碼來執行任務。

## 破壞性變更政策

⚠️ 如果更新涉及以下情況，**請暫停以待批准**：

- 不相容的參數變更
- 安全/合規性修改
- 行為變更

## 輸出格式

僅以帶有圖示的表格顯示結果：

```markdown
| 模組                    | 當前版本 | 最新版本 | 狀態 | 動作   | 文件      |
| ----------------------- | -------- | -------- | ---- | ------ | --------- |
| avm/res/compute/vm      | 0.1.0    | 0.2.0    | 🔄    | 已更新 | [📖](link) |
| avm/res/storage/account | 0.3.0    | 0.3.0    | ✅    | 當前   | [📖](link) |

### 更新摘要

描述所做的更新、任何需要手動審查或遇到的問題。
```

## 圖示

- 🔄 已更新
- ✅ 當前
- ⚠️ 需要手動審查
- ❌ 失敗
- 📖 文件

## 要求

- 僅使用 MCR 標籤 API 進行版本發現
- 解析 JSON 標籤陣列並按語義版本排序
- 維護 Bicep 檔案的有效性和 Linting 合規性
