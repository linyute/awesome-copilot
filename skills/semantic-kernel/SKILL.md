---
name: semantic-kernel
description: '使用共享指南以及針對 .NET 和 Python 的語言特定參考，來建立、更新、重構、說明或檢閱 Semantic Kernel 解決方案。'
---

# Semantic Kernel

當處理基於 Semantic Kernel 建構的應用程式、外掛程式、函式呼叫流程或 AI 整合時，請使用此技能。

在實作建議時，應始終以最新的 Semantic Kernel 文件和範例為準，而非僅憑記憶。

## 首先確定目標語言

在提出建議或進行程式碼變更之前，請先選擇語言工作流：

1. 當儲存庫包含 `.cs`、`.csproj`、`.sln` 或其他 .NET 專案檔案，或者使用者明確要求 C# 或 .NET 指南時，請使用 **.NET** 工作流。遵循 [references/dotnet.md](references/dotnet.md)。
2. 當儲存庫包含 `.py`、`pyproject.toml`、`requirements.txt` 或使用者明確要求 Python 指南時，請使用 **Python** 工作流。遵循 [references/python.md](references/python.md)。
3. 如果儲存庫同時包含兩個生態系統，請匹配正在編輯的檔案所使用的語言或使用者指定的目標。
4. 如果語言不明確，請先檢查目前工作區，然後選擇最接近的語言特定參考。

## 務必諮詢即時文件

- 先閱讀 Semantic Kernel 概觀：<https://learn.microsoft.com/semantic-kernel/overview/>
- 對於目前的 API，優先選擇官方文件和範例。
- 在可用時，使用 Microsoft Docs MCP 工具來獲取最新的框架指南和範例。

## 共享指南

在任何語言中使用 Semantic Kernel 時：

- 核心 (Kernel) 操作使用非同步模式。
- 遵循官方的外掛程式和函式呼叫模式。
- 實作明確的錯誤處理和記錄。
- 偏好強型別、清晰的抽象和可維護的組合模式。
- 使用內建的 Azure AI Foundry、Azure OpenAI、OpenAI 和其他 AI 服務連接器，但在符合任務需求時，針對新專案優先選擇 Azure AI Foundry 服務。
- 當核心的記憶體和內容管理功能可以簡化解決方案時，請予以使用。
- 當適用 Azure 身份驗證時，使用 `DefaultAzureCredential`。

## 工作流

1. 確定目標語言並閱讀匹配的參考檔案。
2. 在做出實作選擇之前，獲取最新的官方文件和範例。
3. 套用此技能中的共享 Semantic Kernel 指南。
4. 使用所選參考中的語言特定套件、儲存庫、範例路徑和編碼實務。
5. 當儲存庫中的範例與目前文件不符時，說明差異並遵循目前支援的模式。

## 參考

- [.NET 參考](references/dotnet.md)
- [Python 參考](references/python.md)

## 完成標準

- 建議與目標語言相符。
- 套件名稱、儲存庫路徑和範例位置與所選生態系統相符。
- 指南反映目前的 Semantic Kernel 文件，而非過往的假設。
