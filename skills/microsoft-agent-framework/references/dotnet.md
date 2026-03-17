# Microsoft 代理程式框架 (.NET) (Microsoft Agent Framework for .NET)

當目標專案使用 C# 或其他 .NET 語言編寫時，請使用此參考。

## 權威來源

- 儲存庫：<https://github.com/microsoft/agent-framework/tree/main/dotnet>
- 範例：<https://github.com/microsoft/agent-framework/tree/main/dotnet/samples>

## 安裝

對於新專案，使用以下命令安裝套件：

```bash
dotnet add package Microsoft.Agents.AI
```

## .NET 特定指南

- 對於代理程式操作和工作流執行，一致地使用 `async`/`await` 模式。
- 遵循 .NET 型別安全和相依性注入慣例。
- 保持服務註冊、設定和身份驗證與標準 .NET 託管模式一致。
- 在 .NET 應用程式模型中，以慣用的方式使用中介軟體、上下文提供者和編排 (Orchestration) 元件。
- 在引入新的 API 或工作流模式之前，請檢查最新的 .NET 範例。
