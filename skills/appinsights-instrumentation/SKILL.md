---
name: appinsights-instrumentation
description: '為應用程式安裝檢測以將有用的遙測資料傳送至 Azure App Insights'
---

# AppInsights 檢測

此技能可將應用程式的遙測資料傳送至 Azure App Insights，以提升對應用程式健康狀況的觀察能力。

## 何時使用此技能

當使用者想要為其應用程式啟用遙測時，請使用此技能。

## 先決條件

工作區中的應用程式必須是以下類型之一：

- 裝載在 Azure 中的 ASP.NET Core 應用程式
- 裝載在 Azure 中的 Node.js 應用程式

## 指引

### 收集內容資訊

找出使用者嘗試加入遙測支援的應用程式之（程式語言、應用程式框架、裝載）組合。這決定了如何對應用程式進行檢測。閱讀程式碼以進行合理的推測。對於任何您不清楚的事項，請與使用者確認。您必須一律詢問使用者應用程式的裝載位置（例如：在個人電腦上、以程式碼形式在 Azure App Service 中、以容器形式在 Azure App Service 中、在 Azure Container App 中等）。

### 如果可能，優先使用自動檢測

如果應用程式是裝載在 Azure App Service 中的 C# ASP.NET Core 應用程式，請使用 [自動檢測指南 (AUTO guide)](references/AUTO.md) 來協助使用者自動檢測應用程式。

### 手動檢測

透過建立 AppInsights 資源並更新應用程式的程式碼來手動檢測應用程式。

#### 建立 AppInsights 資源

使用下列適合環境的選項之一。

- 將 AppInsights 加入現有的 Bicep 範本。請參閱 [examples/appinsights.bicep](examples/appinsights.bicep) 以了解要加入的內容。如果工作區中存在現有的 Bicep 範本檔案，這是最佳選擇。
- 使用 Azure CLI。請參閱 [scripts/appinsights.ps1](scripts/appinsights.ps1) 以了解建立 App Insights 資源所需執行的 Azure CLI 指令。

無論您選擇哪種選項，建議使用者在有意義的資源群組中建立 App Insights 資源，以便更輕鬆地管理資源。一個好的選擇是包含 Azure 中裝載應用程式資源的同一個資源群組。

#### 修改應用程式程式碼

- 如果應用程式是 ASP.NET Core 應用程式，請參閱 [ASPNETCORE 指南](references/ASPNETCORE.md) 以了解如何修改 C# 程式碼。
- 如果應用程式是 Node.js 應用程式，請參閱 [NODEJS 指南](references/NODEJS.md) 以了解如何修改 JavaScript/TypeScript 程式碼。
- 如果應用程式是 Python 應用程式，請參閱 [PYTHON 指南](references/PYTHON.md) 以了解如何修改 Python 程式碼。
