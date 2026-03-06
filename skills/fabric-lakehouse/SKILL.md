---
name: fabric-lakehouse
description: '使用此技能獲取關於 Fabric Lakehouse 及其功能的背景資訊，適用於軟體系統和 AI 驅動的功能。它提供 Lakehouse 資料元件的說明、使用結構描述和捷徑進行組織、存取控制以及程式碼範例。此技能支援使用者使用最佳實作來設計、建構和最佳化 Lakehouse 解決方案。'
metadata:
  author: tedvilutis
  version: "1.0"
---

# 何時使用此技能 (When to Use This Skill)

在以下情況使用此技能：
- 產生包含 Fabric Lakehouse 定義及其功能的背景資訊的文件或說明。
- 使用最佳實作設計、建構和最佳化 Lakehouse 解決方案。
- 了解 Microsoft Fabric 中 Lakehouse 的核心概念和元件。
- 了解如何管理 Lakehouse 中的表格式和非表格式資料。

# Fabric Lakehouse

## 核心概念 (Core Concepts)

### 什麼是 Lakehouse？ (What is a Lakehouse?)

Microsoft Fabric 中的 Lakehouse 是一個專案 (item)，為使用者提供儲存表格式資料（如資料表）和非表格式資料（如檔案）的地方。它結合了資料湖的靈活性與資料倉儲的管理功能。它提供：

- **OneLake 中的統一儲存**，適用於結構化和非結構化資料
- **Delta Lake 格式**，支援 ACID 交易、版本控制和時間導覽 (time travel)
- **SQL 分析端點**，適用於 T-SQL 查詢
- **語義模型**，適用於 Power BI 整合
- 支援其他資料表格式，如 CSV、Parquet
- 支援任何檔案格式
- 資料表最佳化和資料管理工具

### 關鍵元件 (Key Components)

- **Delta 資料表 (Delta Tables)**：符合 ACID 規範並強制執行結構描述 (schema) 的受管理資料表
- **檔案 (Files)**：位於「檔案」區段中的非結構化/半結構化資料
- **SQL 端點 (SQL Endpoint)**：自動產生的唯讀 SQL 介面，用於查詢
- **捷徑 (Shortcuts)**：指向外部/內部資料的虛擬連結，無須進行複製
- **Fabric 具體化檢視表 (Fabric Materialized Views)**：用於快速查詢效能的預先計算資料表

### Lakehouse 中的表格式資料 (Tabular data in a Lakehouse)

以資料表形式存在的表格式資料儲存在「Tables」資料夾下。Lakehouse 中資料表的主要格式是 Delta。Lakehouse 可以儲存其他格式的表格式資料，如 CSV 或 Parquet，但這些格式僅供 Spark 查詢使用。
資料表可以是內部的（資料儲存在「Tables」資料夾下），也可以是外部的（僅在「Tables」資料夾下儲存對資料表的參考，但資料本身儲存在參考的位置）。資料表透過捷徑進行參考，捷徑可以是內部的（指向 Fabric 中的另一個位置）或外部的（指向儲存在 Fabric 之外的資料）。

### Lakehouse 中資料表的結構描述 (Schemas for tables in a Lakehouse)

建立 Lakehouse 時，使用者可以選擇啟用結構描述 (schemas)。結構描述用於組織 Lakehouse 資料表。結構描述實作為「Tables」資料夾下的子資料夾，並在這些資料夾中儲存資料表。預設結構描述為「dbo」，且無法刪除或重新命名。所有其他結構描述都是選用的，可以建立、重新命名或刪除。使用者可以使用結構描述捷徑參考位於另一個 Lakehouse 中的結構描述，進而透過單一捷徑參考目的地結構描述中的所有資料表。

### Lakehouse 中的檔案 (Files in a Lakehouse)

檔案儲存在「Files」資料夾下。使用者可以建立資料夾和子資料夾來組織其檔案。任何檔案格式都可以儲存在 Lakehouse 中。

### Fabric 具體化檢視表 (Fabric Materialized Views)

一組根據排程自動更新的預先計算資料表。它們為複雜的彙總和彙算 (joins) 提供快速的查詢效能。具體化檢視表使用 PySpark 或 Spark SQL 定義，並儲存在相關聯的筆記本 (Notebook) 中。

### Spark 檢視表 (Spark Views)

由 SQL 查詢定義的邏輯資料表。它們不儲存資料，而是提供用於查詢的虛擬層。檢視表使用 Spark SQL 定義，並儲存在 Lakehouse 中資料表的旁邊。

## 安全性 (Security)

### 專案存取或控制平面安全性 (Item access or control plane security)

使用者可以擁有工作區角色（管理員、成員、參與者、檢視者），這些角色提供對 Lakehouse 及其內容的不同存取層級。使用者也可以使用 Lakehouse 的共用功能獲取存取權限。

### 資料存取或 OneLake 安全性 (Data access or OneLake Security)

對於資料存取，請使用 OneLake 安全性模型，該模型以 Microsoft Entra ID（前身為 Azure Active Directory）和角色型存取控制 (RBAC) 為基礎。Lakehouse 資料儲存在 OneLake 中，因此對資料的存取是透過 OneLake 權限控制的。除了物件層級權限外，Lakehouse 還支援資料表的資料欄層級和資料列層級安全性，允許精細控制誰可以看到資料表中的特定資料欄或資料列。


## Lakehouse 捷徑 (Lakehouse Shortcuts)

捷徑可建立指向資料的虛擬連結，無須進行複製：

### 捷徑類型 (Types of Shortcuts)

- **內部 (Internal)**：連結到其他 Fabric Lakehouses/資料表，跨工作區資料共用
- **ADLS Gen2**：連結到 Azure 中的 ADLS Gen2 容器
- **Amazon S3**：AWS S3 貯體 (buckets)，跨雲端資料存取
- **Dataverse**：Microsoft Dataverse，商業應用程式資料
- **Google Cloud Storage**：GCS 貯體 (buckets)，跨雲端資料存取

## 效能最佳化 (Performance Optimization)

### V-Order 最佳化 (V-Order Optimization)

為了透過語義模型實現更快的資料讀取，請在 Delta 資料表上啟用 V-Order 最佳化。這會以一種改進常見存取模式查詢效能的方式對資料進行預先排序。

### 資料表最佳化 (Table Optimization)

資料表還可以使用 OPTIMIZE 指令進行最佳化，該指令會將小型檔案壓縮成較大的檔案，還可以套用 Z-ordering 以提高特定資料欄的查詢效能。定期最佳化有助於在資料隨時間擷取和更新時維持效能。Vacuum 指令可用於清理舊檔案並釋放儲存空間，尤其是在更新和刪除之後。

## 系列工作 (Lineage)

Lakehouse 專案支援系列工作 (lineage)，允許使用者追蹤資料的來源和轉換。Lakehouse 中的資料表和檔案會自動擷取系列工作資訊，顯示資料如何從來源流向目的地。這有助於偵錯、稽核和了解資料相依性。

## PySpark 程式碼範例 (PySpark Code Examples)

詳情請參閱 [PySpark 程式碼](references/pyspark.md)。

## 將資料匯入 Lakehouse (Getting data into Lakehouse)

詳情請參閱 [獲取資料](references/getdata.md)。
