# GitHub Security

將安全性帶入您的 Copilot 工作流程中。官方的 GitHub Security 擴充功能加入了 **GitHub Security** 畫布，協助您及早發現弱點並處理現有的發現項目，完全無需離開工作階段：

- **在交付前攔截新的弱點。** 針對您在目前工作階段中所做的變更執行安全性檢閱，以便在建立提取請求（pull request）前修復問題。
- **修復程式碼中既有的弱點。** 將存放庫現有的程式碼掃描警示帶入工作階段中，並交由 Copilot 進行說明與修復。

![GitHub Copilot 應用程式中的 GitHub Security 畫布，列出含有修復與說明動作的程式碼掃描發現項目](https://raw.githubusercontent.com/github/awesome-copilot/main/extensions/github-security/assets/screenshot.png)

## 功能特色

### 在建立提取請求前攔截安全性問題

- **邊做邊審。** 針對您工作階段的變更執行安全性檢閱，並在畫布中檢視發現項目。
- **推送前先修復。** 在內容仍然記憶猶新的同一個工作階段中，將檢閱發現項目交回給 Copilot 進行修復。

### 逐步處理現有的程式碼掃描警示

- **工作階段中的程式碼掃描警示。** 從 GitHub.com 或 GitHub Enterprise Cloud 載入目前存放庫的程式碼掃描警示，並與您的程式碼並列瀏覽。
- **篩選與分級。** 依嚴重性、工具或被指派者篩選發現項目，並一眼綜覽被指派者、標籤與已連結的提取請求。
- **關閉警示。** 直接從畫布填寫原因以關閉程式碼掃描警示。

### 理解並修復各項發現

- **檢視周邊程式碼。** 發現項目包含從您簽出內容中醒目提示的程式碼片段。
- **取得清楚說明。** 要求 Copilot 說明一個或多個發現項目。
- **產生可供審查的修復。** 要求 Copilot 更新您的程式碼，然後檢閱其變更。

## 需求

- GitHub Copilot 應用程式。不支援獨立的 Copilot CLI。
- 位於 GitHub.com 或 GitHub Enterprise Cloud 上的存放庫。不支援 GitHub Enterprise Server。
- 擁有該存放庫程式碼掃描警示的存取權限（GitHub Advanced Security 或 GitHub Code Security），以處理現有警示。
- 存放庫的本機簽出複本，並已在 Copilot 應用程式中作為工作階段開啟。

若要載入現有的程式碼掃描警示，您的 Copilot 應用程式版本必須支援擴充功能的 GitHub 驗證。針對工作階段變更的安全性檢閱則不需要該驗證即可運作。

## 安裝

### 從 Copilot 應用程式

1. 開啟 **Customize** 並選取 **Plugins** 索引標籤。
2. 在 **awesome-copilot** 市集中找到 **github-security** 並選取 **Install**。
3. 重新載入擴充功能。您可能需要啟動新的工作階段，**GitHub Security** 畫布才會顯示。

### 從終端機

在 Copilot 應用程式關閉的狀態下執行：

```shell
copilot plugin install github-security@awesome-copilot
```

若要保持擴充功能在最新狀態，請開啟 **Plugins** 索引標籤上的 **Update all** 功能表並選取 **Update plugins automatically**，或執行 `copilot plugin update github-security@awesome-copilot`。

## 代理人工具

此擴充功能註冊了 Copilot 可以在工作階段中呼叫的工具。每次呼叫都會經過 Copilot 常規的每次呼叫核准機制。此擴充功能絕不會繞過工具權限提示。

| 工具 | 功能說明 |
| --- | --- |
| `fetchGhasFindings` | 將目前存放庫的程式碼掃描警示載入至畫布中。 |
| `loadLocalFindings` | 將本機安全性檢閱的發現項目新增至畫布中。 |
| `runFindingWorkflow` | 針對所選取的發現項目執行說明、修復或重新檢查工作流程。 |
| `reportFindingStatus` | 記錄在修復或重新檢查後，發現項目是已解決或仍然存在。 |
| `getExtensionState` | 讀取畫布狀態，讓 Copilot 得知您正在檢視哪些發現項目。 |

## 資料與權限

- 此擴充功能使用您在 Copilot 應用程式中登入的 GitHub 帳戶進行驗證。它不會要求或儲存 Token。
- 程式碼掃描 API 請求使用該存放庫的主機，且畫布會從 GitHub 傳回的 URL 載入被指派者的虛擬人偶。畫布於本機回送（loopback）伺服器上執行：靜態資產不需要驗證，而狀態、命令與程式碼片段端點則需要個別執行個體的 Token。
- 說明、修復與重新檢查均在您現有的 Copilot 工作階段與模型中執行。此擴充功能不會呼叫任何其他 AI 服務。
- Copilot 所設定的 **Resolved** 與 **In progress** 狀態僅限於您的本機工作階段。它們不會關閉或變更程式碼掃描警示。唯有明確的 **Dismiss** 動作才會更新 GitHub 上的警示。

安全性發現項目與產生的修復需要進行審查。它們並不保證存放庫毫無弱點。

## 第三方聲明

隨附相依套件的版本、授權與聲明包含於
[擴充功能](https://github.com/github/awesome-copilot/blob/main/extensions/github-security/THIRD_PARTY_NOTICES.md) 與
[畫布](https://github.com/github/awesome-copilot/blob/main/extensions/github-security/client/THIRD_PARTY_NOTICES.md) 中。