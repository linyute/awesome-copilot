---
applyTo: '**'
---
# Dataverse SDK for Python — 入門指南

- 安裝 Dataverse Python SDK 和必要條件。
- 配置 Dataverse 租戶、客戶端 ID、密碼和資源 URL 的環境變數。
- 使用 SDK 透過 OAuth 進行驗證並執行 CRUD 操作。

## 設定
- Python 3.10+
- 建議：虛擬環境

## 安裝
```bash
pip install dataverse-sdk
```

## 驗證基礎
- 使用 OAuth 和 Azure AD 應用程式註冊。
- 將機密儲存在 `.env` 中並透過 `python-dotenv` 載入。

## 常見任務
- 查詢資料表
- 建立/更新資料列
- 批次作業
- 處理分頁和節流

## 提示
- 重複使用客戶端；避免頻繁重新驗證。
- 對於暫時性故障，請新增重試機制。
- 記錄請求以進行疑難排解。
