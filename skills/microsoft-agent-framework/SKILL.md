---
name: microsoft-agent-framework
description: '使用共享指南以及 .NET 和 Python 的語言特定參考，來建立、更新、重構、說明或檢閱 Microsoft 代理程式框架 (Microsoft Agent Framework) 解決方案。'
---

# Microsoft 代理程式框架 (Microsoft Agent Framework)

當處理基於 Microsoft 代理程式框架建構的應用程式、代理程式、工作流或遷移時，請使用此技能。

Microsoft 代理程式框架是 Semantic Kernel 和 AutoGen 的統一繼承者，結合了它們的優勢並加入了新功能。由於它仍處於公開預覽階段且變化快速，因此在實作建議時應始終以最新的官方文件和範例為準，而非依賴過時的知識。

## 首先確定目標語言

在提出建議或進行程式碼變更之前，請先選擇語言工作流：

1. 當儲存庫包含 `.cs`、`.csproj`、`.sln`、`.slnx` 或其他 .NET 專案檔案，或者使用者明確要求 C# 或 .NET 指南時，請使用 **.NET** 工作流。遵循 [references/dotnet.md](references/dotnet.md)。
2. 當儲存庫包含 `.py`、`pyproject.toml`、`requirements.txt` 或使用者明確要求 Python 指南時，請使用 **Python** 工作流。遵循 [references/python.md](references/python.md)。
3. 如果儲存庫同時包含兩個生態系統，請匹配正在編輯的檔案所使用的語言或使用者指定的目標。
4. 如果語言不明確，請先檢查目前工作區，然後選擇最接近的語言特定參考。

## 務必諮詢即時文件

- 先閱讀 Microsoft 代理程式框架概觀：<https://learn.microsoft.com/agent-framework/overview/agent-framework-overview>
- 對於目前的 API，優先選擇官方文件和範例。
- 在可用時，使用 Microsoft Docs MCP 工具來獲取最新的框架指南和範例。
- 將較舊的 Semantic Kernel 或 AutoGen 模式視為遷移輸入，而非預設的實作模型。

## 共享指南

在任何語言中使用 Microsoft 代理程式框架時：

- 代理程式和工作流操作使用非同步模式。
- 實作明確的錯誤處理和記錄。
- 偏好強型別、清晰的介面和可維護的組合模式。
- 當適用 Azure 身份驗證時，使用 `DefaultAzureCredential`。
- 使用代理程式進行自主決策、即時規劃、對話流程、工具使用以及 MCP 伺服器互動。
- 使用工作流進行多步驟編排、預定義執行圖、長時間執行任務以及人機協作 (human-in-the-loop) 場景。
- 支援模型提供者，例如 Azure AI Foundry、Azure OpenAI、OpenAI 等，但在符合使用者需求時，針對新專案優先選擇 Azure AI Foundry 服務。
- 當適合解決問題時，使用基於執行緒或等效的狀態處理、上下文提供者、中介軟體、檢查點、路由和編排模式。

## 遷移指南

- 如果是從 Semantic Kernel 遷移，請參閱官方遷移指南：<https://learn.microsoft.com/agent-framework/migration-guide/from-semantic-kernel/>
- 如果是從 AutoGen 遷移，請參閱官方遷移指南：<https://learn.microsoft.com/agent-framework/migration-guide/from-autogen/>
- 先保留行為，然後逐步採用原生的代理程式框架模式。

## 工作流

1. 確定目標語言並閱讀匹配的參考檔案。
2. 在做出實作選擇之前，獲取最新的官方文件和範例。
3. 套用此技能中的共享代理程式和工作流指南。
4. 使用所選參考中的語言特定套件、儲存庫、範例路徑和編碼實務。
5. 當儲存庫中的範例與目前文件不符時，說明差異並遵循目前支援的模式。

## 參考

- [.NET 參考](references/dotnet.md)
- [Python 參考](references/python.md)

## 完成標準

- 建議與目標語言相符。
- 套件名稱、儲存庫路徑和範例位置與所選生態系統相符。
- 指南反映目前的 Microsoft 代理程式框架文件，而非過往的假設。
- 僅在相關時提及 Semantic Kernel 和 AutoGen 的遷移建議。
