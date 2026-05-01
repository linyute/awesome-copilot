# Python 官方參考資料與最佳實務

在敲定模組架構或實作細節之前，請使用這些官方 Python 資源。

## 官方參考資料

- Python 首頁：<https://www.python.org/>
- Python 文件門戶：<https://docs.python.org/3/>
- Python 教程：<https://docs.python.org/3/tutorial/>
- Python 語言參考：<https://docs.python.org/3/reference/>
- Python 標準函式庫參考：<https://docs.python.org/3/library/>
- Python HOWTO 指南：<https://docs.python.org/3/howto/>
- 安裝模組：<https://docs.python.org/3/installing/>
- 分發模組：<https://docs.python.org/3/distributing/>
- PEP 索引：<https://peps.python.org/>
- PyPA 封裝指南：<https://packaging.python.org/>

## 編碼最佳實務

- 為每次部署指定並鎖定明確的 Python 主/次執行階段版本。
- 優先選擇明確、易讀的程式碼路徑，而非巧妙但簡練的邏輯。
- 為公開介面及關鍵資料轉換使用型別提示 (type hints)。
- 保持模組職責集中；分離協定處理、業務邏輯與傳輸層。
- 在邊界處驗證並清理外部輸入。
- 使用結構化異常，並提供具備可操作性的錯誤訊息。
- 記錄足夠的背景資訊以便進行事故分類 (關聯 ID、模組 ID、訊息 ID)。

## 可靠性與效能最佳實務

- 避免在頻繁的訊息路徑中執行阻塞操作。
- 執行逾時機制，並實作帶有指數退避和抖動的有界重試。
- 針對重播與重複交付設計等冪的處理程式。
- 使用資源限制並監控記憶體增長，以防止邊境不穩定。
- 定義正常的關機行為，以安全地排空緩衝狀態。

## 相依性與供應鏈最佳實務

- 鎖定相依性版本並記錄升級頻率。
- 優先選擇具備明確發布歷程且活躍維護的函式庫。
- 追蹤弱點並定期更新相依性。
- 保持容器映像精簡並及時修補補丁。

## 測試最佳實務

- 對解析、驗證和路由邏輯執行單元測試。
- 為模組 I/O 邊界新增整合測試。
- 針對網路遺失、上流緩慢以及重新啟動場景新增混亂測試 (chaos tests)。
- 在部署測試中驗證復原行為與狀態恢復。
