# Python IoT Edge 模組範本

使用此範本來結構化實作提議與檢閱。

## 0) 官方 Python 基準

- 已檢閱來自 <https://www.python.org/> 和 <https://docs.python.org/3/> 的官方參考資料。
- 語言與標準函式庫 (stdlib) 用法已對照 <https://docs.python.org/3/reference/> 和 <https://docs.python.org/3/library/> 進行驗證。
- 已檢閱來自 `references/python-official-best-practices.md` 的最佳實務。

## 1) 模組摘要

- 模組名稱：
- 業務能力：
- 輸入：
- 輸出：
- 觸發條件：

## 2) 訊息契約 (Contract)

- 結構描述 (Schema) 版本：
- 必要欄位：
- 選填欄位：
- 錯誤酬載契約：

## 3) 執行階段設定

- Python 版本：
- 基礎映像：
- 環境變數：
- 欲套用屬性 (Desired properties)：
- 資源限制：

## 4) 韌性 (Resilience)

- 重試原則：
- 退避 (Backoff) 原則：
- 佇列策略：
- 等冪處理方式：
- 逾時與斷路器 (circuit-breaker) 行為：

## 5) 安全性

- 秘密來源 (絕不內聯)：
- 身分與權限：
- 指令授權模型：
- 稽核記錄要求：

## 6) 觀測性

- 健全狀況訊號：
- 業務指標：
- 錯誤指標：
- 關聯/追蹤需求：
- 警示閾值：

## 7) 驗證矩陣

- 成功路徑測試：
- 格式錯誤酬載測試：
- 網路中斷測試：
- 吞吐量與延遲測試：
- 復原驗證：
