---
mode: 'agent'
description: '將 Bicep 檔案中的 Azure Verified Modules (AVM) 更新至最新版本。'
tools: ['changes', 'codebase', 'editFiles', 'fetch', 'runCommands', 'azure_get_deployment_best_practices', 'azure_get_schema_for_Bicep']
---
# 在 Bicep 檔案中更新 Azure Verified Modules

請將 Bicep 檔案 `${file}` 所使用的 Azure Verified Module (AVM) 更新至最新版本。

## 流程

1. **掃描**：從 `${file}` 擷取 AVM 模組及目前版本
2. **檢查**：從 MCR 取得最新版本：`https://mcr.microsoft.com/v2/bicep/avm/res/{service}/{resource}/tags/list`
3. **比較**：解析語意版本，判斷是否有可更新版本
4. **審查**：如有重大變更，請查閱文件：`https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/{service}/{resource}`
5. **更新**：套用版本更新及參數變更
6. **驗證**：執行 `bicep lint`，確保符合規範

## 重大變更政策

⚠️ **如遇下列情形，請暫停並等待審核：**

- 參數不相容的變更
- 安全性／合規性修改
- 行為變更

## 輸出格式

以表格及圖示顯示結果：

| 模組 | 目前版本 | 最新版本 | 狀態 | 動作 | 文件 |
|------|----------|----------|------|------|------|
| avm/res/compute/vm | 0.1.0 | 0.2.0 | 🔄 | 已更新 | [📖](link) |
| avm/res/storage/account | 0.3.0 | 0.3.0 | ✅ | 已是最新 | [📖](link) |

## 圖示說明

- 🔄 已更新
- ✅ 已是最新
- ⚠️ 需人工審查
- ❌ 失敗
- 📖 文件

## 需求

- 僅使用 MCR tags API 取得版本資訊
- 解析 JSON tags 陣列並依語意版本排序
- 維持 Bicep 檔案有效性及 lint 檢查通過
