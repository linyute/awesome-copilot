---
name: aws-cdk-python-setup
description: 在 Python 中開發 AWS CDK (雲端開發套件) 應用程式的設定與初始化指南。此技能可讓使用者設定環境先決條件、建立新的 CDK 專案、管理依賴項並部署至 AWS。
---
# AWS CDK Python 設定說明

此技能提供使用 **Python** 處理 **AWS CDK (雲端開發套件)** 專案的設定指引。

---

## 先決條件

在開始之前，請確保已安裝下列工具：

- **Node.js** ≥ 14.15.0 — AWS CDK CLI 所需
- **Python** ≥ 3.7 — 用於撰寫 CDK 程式碼
- **AWS CLI** — 管理認證資訊與資源
- **Git** — 版本控制與專案管理

---

## 安裝步驟

### 1. 安裝 AWS CDK CLI
```bash
npm install -g aws-cdk
cdk --version
```

### 2. 設定 AWS 認證資訊
```bash
# 安裝 AWS CLI (若尚未安裝)
brew install awscli

# 設定認證資訊
aws configure
```
根據提示輸入您的 AWS 存取金鑰 (Access Key)、私密存取金鑰 (Secret Access Key)、預設區域以及輸出格式。

### 3. 建立新的 CDK 專案
```bash
mkdir my-cdk-project
cd my-cdk-project
cdk init app --language python
```

您的專案將包含：
- `app.py` — 主要應用程式進入點
- `my_cdk_project/` — CDK 堆疊 (Stack) 定義
- `requirements.txt` — Python 依賴項
- `cdk.json` — 組態檔案

### 4. 設定 Python 虛擬環境
```bash
# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### 5. 安裝 Python 依賴項
```bash
pip install -r requirements.txt
```
主要依賴項：
- `aws-cdk-lib` — 核心 CDK 建構物 (Constructs)
- `constructs` — 基礎建構物函式庫

---

## 開發工作流程

### 合成 CloudFormation 範本
```bash
cdk synth
```
產生包含 CloudFormation 範本的 `cdk.out/` 目錄。

### 部署堆疊至 AWS
```bash
cdk deploy
```
預覽並確認部署至已設定的 AWS 帳號。

### 啟動引導 (僅限首次部署)
```bash
cdk bootstrap
```
準備 S3 儲存貯體等環境資源，用於儲存資產。

---

## 最佳實務

- 務必在開始工作前啟動虛擬環境。
- 在部署前執行 `cdk diff` 以預覽變更。
- 使用開發用帳號進行測試。
- 遵循 Python 的命名與目錄規範。
- 保持 `requirements.txt` 固定版本以確保建構的一致性。

---

## 疑難排解提示

若發生問題，請檢查：

- AWS 認證資訊是否正確設定。
- 預設區域是否設定妥當。
- Node.js 與 Python 版本是否符合最低要求。
- 執行 `cdk doctor` 以診斷環境問題。
