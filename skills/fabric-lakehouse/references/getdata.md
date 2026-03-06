### Data Factory 整合 (Data Factory Integration)

Microsoft Fabric 包含 Data Factory，用於 ETL/ELT 調度：

- **180+ 個連接器**，用於多種資料源
- **複製活動 (Copy activity)**，用於資料移動
- **Dataflow Gen2**，用於轉換
- **筆記本活動 (Notebook activity)**，用於 Spark 處理
- **排程 (Scheduling)** 與觸發器

### 管線活動 (Pipeline Activities)

| 活動 | 說明 |
|----------|-------------|
| 複製資料 (Copy Data) | 在資料源與 Lakehouse 之間移動資料 |
| 筆記本 (Notebook) | 執行 Spark 筆記本 |
| 資料流 (Dataflow) | 執行 Dataflow Gen2 轉換 |
| 預存程序 (Stored Procedure) | 執行 SQL 程序 |
| ForEach | 在項目上進行迴圈 |
| If 條件 (If Condition) | 條件分支 |
| 獲取中繼資料 (Get Metadata) | 擷取檔案/資料夾中繼資料 |
| Lakehouse 維護 (Lakehouse Maintenance) | 最佳化 (Optimize) 與清理 (Vacuum) Delta 資料表 |

### 調度模式 (Orchestration Patterns)

```
管線 (Pipeline)：每日 ETL 管線 (Daily_ETL_Pipeline)
├── 獲取中繼資料 (檢查是否有新檔案)
├── ForEach (處理每個檔案)
│   ├── 複製資料 (銅級層，bronze layer)
│   └── 筆記本 (銀級轉換，silver transformation)
├── 筆記本 (金級彙總，gold aggregation)
└── Lakehouse 維護 (最佳化資料表)
```

---
