---
name: azure-devops-cli
description: 透過 CLI 管理 Azure DevOps 資源，包括專案、存放庫、管線、建構、提取要求、工作項目、構件和服務端點。在處理 Azure DevOps、az 指令、devops 自動化、CI/CD，或使用者提到 Azure DevOps CLI 時使用。
---

# Azure DevOps CLI

使用具有 Azure DevOps 延伸模組的 Azure CLI 管理 Azure DevOps 資源。

**CLI 版本：** 2.81.0（截至 2025 年的最新版本）

## 先決條件 (Prerequisites)

```bash
# 安裝 Azure CLI
brew install azure-cli  # macOS
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux

# 安裝 Azure DevOps 延伸模組
az extension add --name azure-devops
```

## 驗證 (Authentication)

```bash
# 使用 PAT 權杖登入
az devops login --organization https://dev.azure.com/{org} --token YOUR_PAT_TOKEN

# 設定預設組織和專案（避免重複輸入 --org/--project）
# 注意：舊版 URL https://{org}.visualstudio.com 應改為 https://dev.azure.com/{org}
az devops configure --defaults organization=https://dev.azure.com/{org} project={project}

# 列出目前設定
az devops configure --list
```

## CLI 結構 (CLI Structure)

```
az devops          # 主要 DevOps 指令
├── admin          # 管理（橫幅）
├── extension      # 延伸模組管理
├── project        # 小組專案
├── security       # 安全性作業
│   ├── group      # 安全性群組
│   └── permission # 安全性權限
├── service-endpoint # 服務連線
├── team           # 小組
├── user           # 使用者
├── wiki           # Wiki
├── configure      # 設定預設值
├── invoke         # 呼叫 REST API
├── login          # 驗證
└── logout         # 清除認證

az pipelines       # Azure Pipelines
├── agent          # 代理程式
├── build          # 建構
├── folder         # 管線資料夾
├── pool           # 代理程式集區
├── queue          # 代理程式佇列
├── release        # 發行
├── runs           # 管線執行
├── variable       # 管線變數
└── variable-group # 變數群組

az boards          # Azure Boards
├── area           # 區域路徑
├── iteration      # 反覆項目
└── work-item      # 工作項目

az repos           # Azure Repos
├── import         # Git 匯入
├── policy         # 分支策略
├── pr             # 提取要求
└── ref            # Git 參考

az artifacts       # Azure Artifacts
└── universal      # 通用套件
```

## 參考檔案 (Reference Files)

根據使用者的工作讀取相關的參考檔案。每個檔案都包含其領域的完整指令語法和範例。

| 檔案 | 何時讀取 | 涵蓋內容 |
|---|---|---|
| `references/repos-and-prs.md` | 存放庫、分支、提取要求、分支策略 | 存放庫、匯入、PR（建立/列出/投票/審核者/策略）、Git 參考、分支策略 |
| `references/pipelines-and-builds.md` | 管線、建構、發行、構件 | 管線 CRUD、執行、建構、發行、構件下載/上傳 |
| `references/boards-and-iterations.md` | 工作項目、短期衝刺、區域路徑 | 工作項目（WIQL/建立/更新/關聯）、區域路徑、反覆項目、小組反覆項目 |
| `references/variables-and-agents.md` | 管線變數、代理程式集區 | 管線變數、變數群組、管線資料夾、代理程式集區/佇列 |
| `references/org-and-security.md` | 專案、小組、使用者、權限、Wiki | 專案、延伸模組、小組、使用者、安全性群組/權限、服務端點、Wiki、管理 |
| `references/advanced-usage.md` | 輸出格式、JMESPath 查詢 | 輸出格式、JMESPath 查詢（基本 + 進階）、全域引數、常用參數、Git 別名 |
| `references/workflows-and-patterns.md` | 自動化指令碼、最佳實作、錯誤處理 | 常見工作流、最佳實作、錯誤處理、指令碼編寫模式、實際範例 |
