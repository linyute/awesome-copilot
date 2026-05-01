---
description: '在提議邊緣 IoT 架構或 Azure 實作指引之前，需要檢閱 Azure IoT Edge 文件。'
applyTo: '**/*.bicep,**/*.tf,**/*iot*.md,**/*smart-city*.md,**/*edge*.md'
---

## Azure IoT Edge 架構指令

當任務包含 Azure IoT、智慧城市、邊緣處理、閘道設計或斷線邊緣場景時，在提供架構建議之前請執行以下操作：

1. 首先檢閱 Azure IoT Edge 文件：
   - https://learn.microsoft.com/azure/iot-edge/
   - https://learn.microsoft.com/es-es/azure/iot-edge/
2. 從文件中確認關鍵限制：
   - 執行階段架構
   - 支援的系統
   - 版本/發布狀態
   - 相關的 Linux/Windows 快速入門路徑
3. 明確說明您已檢閱文件，或說明無法諮詢文件。
4. 如果無法存取文件，請繼續進行，並清楚標註假設。

### 回應規則

- 在未先驗證邊緣適用性之前，絕不要直接跳到服務列表。
- 務必解釋為什麼需要或不需要 IoT Edge。
- 包含維運影響：更新策略、觀測性及支援模型。
- 優先考慮安全預設值：受控識別、最小權限、秘密管理及網路隔離。
