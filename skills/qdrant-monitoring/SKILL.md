---
name: qdrant-monitoring
description: "指導 Qdrant 監控與可觀測性設定。當有人問「如何監控 Qdrant」、「要追蹤哪些指標」、「Qdrant 是否健康」、「優化器卡住」、「為什麼記憶體在增長」、「請求很慢」，或者需要設定 Prometheus、Grafana 或運作狀態檢查時，請使用此技能。在偵錯需要指標分析的生產環境問題時也請使用此技能。"
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Qdrant 監控

Qdrant 監控允許追蹤您部署的效能和運作狀態，並在問題演變成停機事件前識別它們。首先判斷您是需要設定監控，還是需要診斷目前的問題。

- 了解可用的指標 [監控文件](https://search.qdrant.tech/md/documentation/operations/monitoring/)


## 監控設定

Prometheus 抓取、運作狀態探查、混合雲特點、警報以及記錄集中化。[監控設定](setup/SKILL.md)


## 使用指標偵錯

優化器卡住、記憶體增長、請求緩慢。使用指標診斷活躍的生產環境問題。[使用指標偵錯](debugging/SKILL.md)
