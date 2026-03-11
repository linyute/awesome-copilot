# PostgreSQL 例外處理：SELECT INTO 無資料 (SELECT INTO No Data Found)

## 概觀 (Overview)

從 Oracle 遷移到 PostgreSQL 時，一個常見的問題涉及 `SELECT INTO` 語句，這些語句預期在找不到資料列時引發例外。如果未妥善處理，這種模式差異可能會導致整合測試失敗，並使應用程式邏輯行為異常。

---

## 問題描述 (Problem Description)

### 情境 (Scenario)

預存程序使用 `SELECT INTO` 執行查閱操作以檢索所需的值：

```sql
SELECT column_name
INTO variable_name
FROM table1, table2 
WHERE table1.id = table2.id AND table1.id = parameter_value;
```

### Oracle 行為

當 Oracle 中的 `SELECT INTO` 語句**找不到任何資料列**時，它會自動引發：

```
ORA-01403: no data found
```

此例外會被程序的例外處理程式擷取，並重新引發給呼叫應用程式。

### PostgreSQL 行為 (修復前)

當 PostgreSQL 中的 `SELECT INTO` 語句**找不到任何資料列**時，它會：

- 將 `FOUND` 變數設定為 `false`
- **靜默地繼續**執行，而不引發例外

這種根本性的差異可能會導致測試靜默失敗，以及生產環境程式碼中的邏輯錯誤。

---

## 根本原因分析 (Root Cause Analysis)

PostgreSQL 版本缺少在 `SELECT INTO` 語句之後針對 `NOT FOUND` 條件的明確錯誤處理。

**原始程式碼 (有問題)：**

```plpgsql
SELECT column_name
INTO variable_name
FROM table1, table2 
WHERE table1.id = table2.id AND table1.id = parameter_value;

IF variable_name = 'X' THEN
 result_variable := 1;
ELSE
 result_variable := 2;
END IF;
```

**問題：** 未檢查 `NOT FOUND` 條件。當傳遞無效參數時，SELECT 不回傳任何資料列，`FOUND` 變更為 `false`，且執行會以未初始化的變數繼續。

---

## 關鍵差異：Oracle vs PostgreSQL

加入明確的 `NOT FOUND` 錯誤處理，以符合 Oracle 行為。

**修復後的程式碼：**

```plpgsql
SELECT column_name
INTO variable_name
FROM table1, table2 
WHERE table1.id = table2.id AND table1.id = parameter_value;

-- 如果找不到資料，則明確引發例外 (符合 Oracle 行為)
IF NOT FOUND THEN
    RAISE EXCEPTION 'no data found';
END IF;

IF variable_name = 'X' THEN
 result_variable := 1;
ELSE
 result_variable := 2;
END IF;
```

---

## 類似問題的遷移筆記

在修復此問題時，請驗證：

1. **成功路徑測試** — 確認有效參數仍能正確運作
2. **例外測試** — 驗證傳入無效參數時會引發例外
3. **交易回滾** — 確保發生錯誤時有適當的清理
4. **資料完整性** — 確認成功案例中所有欄位都正確填充
