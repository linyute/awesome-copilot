---
name: python-azure-iot-edge-modules
description: '建置並維運 Python Azure IoT Edge 模組，包含穩健的傳訊、部署宣示說明 (manifests)、觀測性以及生產就緒檢查。'
---

# Python Azure IoT Edge 模組

使用此技能來設計、實作並驗證基於 Python 的 IoT Edge 模組，用於遙測處理、本機推論、協定轉換以及邊緣對雲端整合。

## 何時使用

針對以下請求使用此技能：

- 「我想為 IoT Edge 建立一個 Python 模組」
- 「如何使用 manifest 部署邊緣模組」
- 「我需要在上傳遙測之前對其進行過濾/彙總」
- 「如何在邊緣處理中斷連線與重試」

## 強制性文件檢閱

在建議執行階段行為或部署決策之前，請先檢閱：

- https://learn.microsoft.com/azure/iot-edge/
- https://learn.microsoft.com/es-es/azure/iot-edge/

最低檢核項：

- 執行階段架構與模組生命週期。
- 支援的主機作業系統及版本。
- 部署模型與設定流程。
- 目前的發行/版本指引。

如果無法獲取文件，請以明確的假設繼續進行，並清楚標註。

## Python 官方參考資料與最佳實務 (必要)

在提出 Python 實作細節之前，請先諮詢 Python 官方來源：

- https://www.python.org/
- https://docs.python.org/3/
- https://docs.python.org/3/reference/
- https://docs.python.org/3/library/
- references/python-official-best-practices.md

除非有特定的相容性理由需要偏離，否則請優先選擇官方文件而非社群程式碼片段。

## 目標

- 交付專注於正式生產環境的模組架構與實作計劃。
- 確保在網路不穩定的情況下具備可靠的邊緣傳訊能力。
- 提供部署、觀測性及驗證成品。

## 模組使用案例

- 協定配接器 (序列/Modbus/OPC-UA 轉換為 IoT 訊息格式)。
- 遙測強化與正規化。
- 本機異常偵測或推論。
- 指令協調與本機驅動器控制。

## 交付工作流程

### 1) 契約與介面

定義：

- 模組的輸入與輸出。
- 訊息結構描述 (schema) 及版本管理原則。
- 一般遙測 vs 關鍵遙測的路由與優先順序。
- 用於動態設定的欲套用屬性 (Desired properties)。

### 2) 執行階段與封裝

指定：

- Python 執行階段版本目標。
- 容器映像標籤策略 (基礎映像、精簡體積、CVE 弱點管理)。
- 資源設定檔 (CPU/記憶體限制)。
- 啟動與健全狀況檢查。

### 3) 可靠性設計

實作並驗證：

- 帶有指數退避和抖動的重試機制。
- 當上游失敗時的適度降級處理。
- 必要時的本機佇列策略。
- 針對重播訊息的等冪處理。

### 4) 安全控制

要求：

- 程式碼或 manifest 中不得有明文秘密。
- 模組行為需遵循最小權限原則。
- 安全傳輸及受信任憑證鏈處理。
- 指令處理與狀態變更的可追溯性。

### 5) 部署與維運

定義：

- 環境專屬的部署 manifest。
- 推出策略 (試點、分階段、全面)。
- 復原 (rollback) 準則。
- SLO 與警示條件。

## 重複使用其他技能

相關時，結合以下技能：

- `azure-smart-city-iot-solution-builder` 用於平台層級的架構。
- `appinsights-instrumentation` 用於遙測檢測方法。
- `azure-resource-visualizer` 用於架構圖與相依性映射。

同時使用 `references/python-official-best-practices.md` 作為模組設計與實作指引的品質基準。

## 必要輸出

務必提供：

1. 模組設計簡介 (目的、輸入、輸出)。
2. 部署模型 (映像、manifest、環境設定)。
3. 可靠性與錯誤處理策略。
4. 安全性與維運檢查清單。
5. 測試矩陣 (功能、混亂測試、效能、復原)。

## 輸出範本

1. 背景與假設
2. 模組架構
3. 部署與設定
4. 可靠性、安全性、觀測性
5. 驗證與推出計劃

## 護欄

- 在通過試點階段前，不要建議直接全面生產推出。
- 不要將秘密嵌入 Dockerfile、原始碼或 manifest 中。
- 不要遺漏健全狀況探針、重新啟動行為及復原準則。
