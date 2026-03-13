---
name: cloud-design-patterns
description: '雲端設計模式適用於分散式系統架構，涵蓋了可靠性、效能、訊息、安全性和部署等 5 個類別中的 42 個業界標準模式。在設計、審核或實作分散式系統架構時使用。'
---

# 雲端設計模式

架構師透過整合平台服務、功能與程式碼來設計工作負載，以滿足功能性與非功能性需求。為了設計有效的工作負載，您必須瞭解這些需求，並選擇能夠應對工作負載條件限制之挑戰的拓撲與方法論。雲端設計模式為許多常見挑戰提供了解決方案。

系統設計在很大程度上依賴於既有的設計模式。您可以結合使用這些模式來設計基礎設施、程式碼與分散式系統。這些模式對於在雲端中建置可靠、高安全性、成本優化、營運效率高且高效能的應用程式至關重要。

以下雲端設計模式與技術無關，因此適用於任何分散式系統。您可以將這些模式應用於 Azure、其他雲端平台、地端設定以及混合式環境。

## 雲端設計模式如何強化設計流程

雲端工作負載很容易受到分散式運算謬誤的影響，這些謬誤是關於分散式系統運作方式常見但錯誤的假設。這些謬誤的範例包括：

- 網路是可靠的。
- 延遲為零。
- 頻寬是無限的。
- 網路是安全的。
- 拓撲不會改變。
- 只有一名管理員。
- 元件版本控制很簡單。
- 可觀測性的實作可以延後。

這些誤解可能導致工作負載設計出現瑕疵。設計模式並不能消除這些誤解，但有助於提高意識，提供補償策略與緩解措施。每種雲端設計模式都有權衡取捨。請專注於為什麼應該選擇特定模式，而不是如何實作它。

---

## 參考資料

| 參考資料 | 何時載入 |
|---|---|
| [可靠性與彈性模式](references/reliability-resilience.md) | Ambassador, Bulkhead, Circuit Breaker, Compensating Transaction, Retry, Health Endpoint Monitoring, Leader Election, Saga, Sequential Convoy |
| [效能模式](references/performance.md) | Async Request-Reply, Cache-Aside, CQRS, Index Table, Materialized View, Priority Queue, Queue-Based Load Leveling, Rate Limiting, Sharding, Throttling |
| [訊息與整合模式](references/messaging-integration.md) | Choreography, Claim Check, Competing Consumers, Messaging Bridge, Pipes and Filters, Publisher-Subscriber, Scheduler Agent Supervisor |
| [架構與設計模式](references/architecture-design.md) | Anti-Corruption Layer, Backends for Frontends, Gateway Aggregation/Offloading/Routing, Sidecar, Strangler Fig |
| [部署與營運模式](references/deployment-operational.md) | Compute Resource Consolidation, Deployment Stamps, External Configuration Store, Geode, Static Content Hosting |
| [安全性模式](references/security.md) | Federated Identity, Quarantine, Valet Key |
| [事件驅動架構模式](references/event-driven.md) | Event Sourcing |
| [最佳做法與模式選擇](references/best-practices.md) | 選擇適當的模式、配合完善架構框架 (Well-Architected Framework)、文件、監控 |
| [Azure 服務對應](references/azure-service-mappings.md) | 每個模式類別的常用 Azure 服務 |

---

## 模式類別一覽

| 類別 | 模式 | 重點 |
|---|---|---|
| 可靠性與彈性 | 9 個模式 | 容錯、自我修復、正常降級 |
| 效能 | 10 個模式 | 快取、擴充、負載管理、資料優化 |
| 訊息與整合 | 7 個模式 | 解耦、事件驅動通訊、工作流程協調 |
| 架構與設計 | 7 個模式 | 系統邊界、API 閘道、遷移策略 |
| 部署與營運 | 5 個模式 | 基礎設施管理、地理分佈、設定 |
| 安全性 | 3 個模式 | 身分、存取控制、內容驗證 |
| 事件驅動架構 | 1 個模式 | 事件溯源與稽核追蹤 |

## 外部連結

- [雲端設計模式 - Azure 架構中心](https://learn.microsoft.com/azure/architecture/patterns/)
- [Azure 完善架構框架](https://learn.microsoft.com/azure/architecture/framework/)
