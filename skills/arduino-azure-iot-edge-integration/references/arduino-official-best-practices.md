# Arduino 官方參考資料與最佳實務

在敲定韌體或硬體指引之前，請使用這些 Arduino 官方資源。

## 官方參考資料

- Arduino 主要指南：<https://www.arduino.cc/en/Guide>
- Arduino 文件首頁：<https://docs.arduino.cc/>
- 入門路徑：<https://docs.arduino.cc/learn/starting-guide/getting-started-arduino/>
- Arduino IDE 使用：<https://docs.arduino.cc/learn/starting-guide/the-arduino-software-ide/>
- Arduino 語言參考：<https://docs.arduino.cc/language-reference/>
- Arduino 程式設計參考概覽：<https://docs.arduino.cc/learn/programming/reference/>
- Arduino 記憶體指南：<https://docs.arduino.cc/learn/programming/memory-guide/>
- Arduino 偵錯基礎：<https://docs.arduino.cc/learn/microcontrollers/debugging/>
- Arduino 低功耗設計指南：<https://docs.arduino.cc/learn/electronics/low-power/>
- Arduino 通訊協定索引：<https://docs.arduino.cc/learn/communication/>
- Arduino 函式庫風格指南：<https://docs.arduino.cc/learn/contributions/arduino-library-style-guide/>

## 韌體最佳實務

- 保持 `loop()` 為非阻塞；避免在生產邏輯中長時間使用 `delay()`。
- 使用基於 `millis()` 的排程來執行週期性任務。
- 明確規劃 SRAM 預算，避免在頻繁執行的路徑中使用動態分配。
- 驗證感測器範圍，並為無效讀數提供安全預設值。
- 加入啟動自我檢查和週期性的健全狀況活動訊號訊息。
- 在每個遙測串流中標註酬載結構描述版本和韌體版本。
- 為網路操作實作帶有指數退避和抖動的重試機制。
- 將認證儲存在原始程式碼之外，並根據原則進行輪轉。

## 硬體與電力最佳實務

- 記錄每個周邊裝置的電壓位準、接腳映射和電流限制。
- 針對電壓不足 (brownout) 和電力波動情境進行設計。
- 在可用處使用看門狗 (watchdog) 和安全復原行為。
- 為電池部署規劃低功耗模式，並驗證喚醒週期。

## Azure IoT 整合最佳實務

- 優先選擇安全傳輸 (MQTT over TLS) 和每個裝置專屬的身分。
- 為重複訊息情境定義等冪的下游處理。
- 包含裝置健全狀況指標 (上線時間、重新啟動原因、RSSI (若適用))。
- 驗證離線緩衝邊界，以避免記憶體失控增長。
