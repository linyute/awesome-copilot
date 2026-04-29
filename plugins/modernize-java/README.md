# GitHub Copilot 現代化 – Java 升級 CLI 外掛程式

**GitHub Copilot 現代化 – Java 升級 CLI 外掛程式** 可協助您直接從命令列升級 Java 應用程式。它將與 VS Code 延伸模組相同的智慧現代化功能帶到您的終端機和 CI/CD 管線，讓您能夠：

- 分析您的專案、評估您的相依性，並產生升級計畫
- 執行計畫以自動轉換您的程式碼庫
- 在升級過程中修復建構問題並解決遷移錯誤
- 在升級後針對已知的 CVE 驗證您的應用程式
- 輸出詳細摘要，包括檔案變更、更新的相依性和升級結果

## 安裝

```bash
copilot plugin install modernize-java@awesome-copilot
```

## 快速入門

```bash
copilot --model claude-sonnet-4.6 --agent modernize-java:modernize-java
```

## 核心功能

### 🔍 智慧分析與升級規劃

現代化從了解您的程式碼開始。CLI 會自動分析您的 Java 專案，並產生一個可自訂的升級計畫，您可以在執行前檢閱並編輯。

### 🔧 自動程式碼轉換與錯誤修復

CLI 會套用程式碼轉換、自動解決建構問題並執行測試驗證 — 確保順暢、無誤且無需手動介入的升級過程。

### 🛡️ 升級後 CVE 驗證

升級後，CLI 會掃描 CVE (常見漏洞與暴露) 問題和程式碼不一致之處，然後報告偵測到的問題以及建議的修復方案，以改善您的應用程式安全性狀態。

### 🔄 升級摘要

在每次升級執行結束時，CLI 會輸出結構化摘要，涵蓋檔案變更、更新的相依性、測試驗證結果以及任何剩餘問題 — 適用於在提取要求 (pull requests) 或 CI 記錄中進行檢閱。

## 回饋

我們重視您的回饋 — 請在[此處分享您的想法](https://aka.ms/AM4JFeedback)，以協助我們持續改進產品。

## 授權

MIT

## 商標

經授權使用 Microsoft 商標或標誌必須遵循 [Microsoft 商標與品牌指南](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general)。

## 隱私權聲明

GitHub Copilot 現代化使用 GitHub Copilot 進行程式碼變更，除了立即工作階段外，不會保留程式碼片段。我們不會收集、傳輸或儲存您的自訂工作任務。請檢閱 [Microsoft 隱私權聲明](https://go.microsoft.com/fwlink/?LinkId=521839)。

系統會收集並分析遙測指標，以追蹤功能的使用情況和有效性。深入了解 [VS Code 中的遙測設定](https://code.visualstudio.com/docs/configure/telemetry)。

## 透明度說明

GitHub Copilot 現代化使用 AI 進行程式碼變更，而 AI 有時會犯錯。在將所有變更用於生產環境之前，請檢閱並測試所有變更。

## 免責聲明

除非適用授權另有允許，否則使用者在未經 Microsoft 事先書面同意的情況下，不得對作為本產品一部分提供的任何資產、提示或內部工具進行反向工程 (decompile)、修改、重新封裝或重新發佈。
