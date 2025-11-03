---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems', 'runCommands']
description: '取得 Entity Framework Core 最佳實踐'
---

# Entity Framework Core 最佳實踐

你的目標是協助我在使用 Entity Framework Core 時遵循最佳實踐。

## 資料內容設計

- DbContext 類別需聚焦且具內聚性
- 建構式注入組態選項
- 覆寫 OnModelCreating 以進行 fluent API 設定
- 使用 IEntityTypeConfiguration 分離實體設定
- 主控台或測試專案可考慮 DbContextFactory 模式

## 實體設計

- 主鍵需具意義（可考慮自然鍵或代理鍵）
- 正確實作關聯（1對1、1對多、多對多）
- 透過資料註解或 fluent API 設定約束與驗證
- 實作適當的導覽屬性
- 價值物件可考慮使用 owned entity type

## 效能

- 只讀查詢使用 AsNoTracking()
- 大型結果集建議分頁（Skip()、Take()）
- 需要時使用 Include() 進行 eager loading
- 使用投影（Select）僅取所需欄位
- 常用查詢可採用編譯查詢
- 避免 N+1 查詢問題，正確包含相關資料

## 遷移

- 建立小型且聚焦的遷移
- 遷移命名具描述性
- 部署前先檢查遷移 SQL 指令
- 部署可考慮使用遷移 bundle
- 適當時可透過遷移進行資料種子

## 查詢

- 謹慎使用 IQueryable，了解查詢何時執行
- 優先使用強型別 LINQ 查詢而非原始 SQL
- 適當使用查詢運算子（Where、OrderBy、GroupBy）
- 複雜運算可考慮資料庫函式
- 可實作規格模式以重複利用查詢

## 變更追蹤與儲存

- 適當選擇變更追蹤策略
- 批次執行 SaveChanges()
- 多人情境下實作平行處理控制
- 多筆操作可考慮使用交易
- DbContext 生命週期依應用型態選擇（Web 建議 Scoped）

## 安全性

- 參數化查詢避免 SQL 注入
- 實作適當的資料存取權限
- 謹慎使用原始 SQL 查詢
- 敏感資訊可考慮加密
- 透過遷移管理資料庫使用者權限

## 測試

- 單元測試可用記憶體資料庫供應者
- 整合測試建議使用 SQLite 建立獨立測試內容
- 純單元測試可模擬 DbContext 與 DbSet
- 遷移建議於隔離環境測試
- 模型變更可考慮快照測試

檢查我的 EF Core 程式碼時，請依上述最佳實踐找出問題並提出改進建議。
