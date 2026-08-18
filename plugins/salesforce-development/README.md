# Salesforce 開發外掛程式

涵蓋 Apex 與觸發程序 (Triggers)、Flow 自動化、Lightning Web Components (LWC)、Aura 元件以及 Visualforce 頁面的完整 Salesforce agent 開發環境。

## 安裝

```bash
copilot plugin install salesforce-development@awesome-copilot
```

## 包含內容

### Agents

| Agent | 描述 |
|-------|-------------|
| `salesforce-apex-triggers` | 遵循 Salesforce 最佳做法，使用 Apex 類別與觸發程序實作具備生產品質程式碼的 Salesforce 業務邏輯。 |
| `salesforce-aura-lwc` | 遵循 Lightning 架構最佳做法，使用 Lightning Web Components 與 Aura 元件實作 Salesforce UI 元件。 |
| `salesforce-flow` | 遵循宣告式自動化最佳做法，使用 Salesforce Flow 實作業務自動化。 |
| `salesforce-visualforce` | 遵循 Salesforce MVC 架構與最佳做法，實作 Visualforce 頁面與控制器。 |

## 使用方式

安裝完成後，根據您要建構的內容在 GitHub Copilot Chat 中切換至任一 Salesforce agent：

- 將 **`salesforce-apex-triggers`** 用於後端業務邏輯、觸發程序處理常式、公用程式類別與測試涵蓋範圍
- 將 **`salesforce-aura-lwc`** 用於建構 Lightning Web Components 或 Aura 元件 UI
- 將 **`salesforce-flow`** 用於宣告式自動化，包含記錄觸發 (Record-Triggered)、畫面 (Screen)、自動啟動 (Autolaunched) 與排程流程 (Scheduled flows)
- 將 **`salesforce-visualforce`** 用於 Visualforce 頁面及其 Apex 控制器

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
