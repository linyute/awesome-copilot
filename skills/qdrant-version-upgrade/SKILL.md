---
name: qdrant-version-upgrade
description: "關於如何升級 Qdrant 版本而不中斷應用程式可用性，並確保資料完整性的指南。"
---


# Qdrant 版本升級

Qdrant 對於版本相容性具有以下保證：

- Qdrant 與 SDK 的主版本 (Major version) 和次版本 (Minor version) 預期應相符。例如，Qdrant 1.17.x 與 SDK 1.17.x 相容。

- Qdrant 針對次版本之間的回溯相容性進行了測試。例如，Qdrant 1.17.x 應與 SDK 1.16.x 相容。Qdrant 伺服器 1.16.x 預期也與 SDK 1.17.x 相容，但僅限於 1.16.x 中已提供的功能子集。

- 對於遷移至下一個次版本，建議先將 SDK 升級至下一個次版本，然後再升級 Qdrant 伺服器。

- 儲存相容性僅針對一個次版本提供保證。例如，使用 Qdrant 1.16.x 儲存的資料預期與 Qdrant 1.17.x 相容。如果您需要跨越多個次版本進行遷移，則需要逐步升級，每次一個次版本。例如，要從 1.15.x 遷移至 1.17.x，您需要先升級到 1.16.x，然後再升級到 1.17.x。註：Qdrant Cloud 自動化了此流程，因此您可以直接從 1.15.x 升級至 1.17.x，而無需中間步驟。

- 複製因子 (replication factor) 為 2 或更高的 Qdrant 叢集可以透過執行滾動升級 (rolling upgrade) 在不致停機的情況下進行升級。這意味著您可以一次升級一個節點，同時其他節點繼續提供請求服務。這允許您在升級過程中維持應用程式的可用性。欲了解更多關於複製因子的資訊：[複製因子](https://search.qdrant.tech/md/documentation/operations/distributed_deployment/?s=replication-factor)

若要在 Qdrant Cloud 中管理 Qdrant 版本升級，您可以使用 [qcloud](https://github.com/qdrant/qcloud-cli) CLI 工具。
