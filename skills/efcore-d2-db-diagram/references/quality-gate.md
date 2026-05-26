# 品質閘道 (Quality Gate)

在交付前，請確認：

- 已確認所選的 DbContext。
- 已確認檢查過的來源檔案。
- 已對照 Fluent API 和遷移來驗證資料表名稱。
- 包含主鍵 (Primary keys)。
- 包含外鍵 (Foreign keys)。
- 包含基數 (Cardinalities)。
- 包含連結資料表，除非使用者選擇隱藏。
- 根據使用者選擇包含擁有的型別 (Owned types)。
- 僅在設定時隱藏技術資料表，並將其列在總結中。
- 若可用，請執行 `d2 fmt`。
- 對容器內的邊緣使用完整的點記號法 (Full dot-notation)。
- 提供渲染指令。
