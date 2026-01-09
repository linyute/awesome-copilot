---
name: 'snowflake-semanticview'
description: '使用 Snowflake CLI (snow) 建立、變更和驗證 Snowflake 語意檢視表。當被要求使用 CREATE/ALTER SEMANTIC VIEW 建構語意檢視表/語意層定義或對其進行疑難排解、透過 CLI 對 Snowflake 驗證語意檢視表 DDL，或是引導 Snowflake CLI 安裝和連線設定時使用。'
---

# Snowflake 語意檢視表

## 一次性設定

- 在新終端機中執行 `snow --help` 以驗證 Snowflake CLI 安裝。
- 如果缺少 Snowflake CLI 或使用者無法安裝，請引導他們至 https://docs.snowflake.com/en/developer-guide/snowflake-cli/installation/installation。
- 依照 https://docs.snowflake.com/en/developer-guide/snowflake-cli/connecting/configure-connections#add-a-connection 使用 `snow connection add` 設定 Snowflake 連線。
- 將設定好的連線用於所有驗證和執行步驟。

## 每個語意檢視表要求的流程

1. 確認目標資料庫、結構描述、角色、倉儲和最終語意檢視表名稱。
2. 確認模型遵循星狀結構描述（包含符合維度的事實）。
3. 使用官方語法草擬語意檢視表 DDL：
   - https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view
4. 為每個維度、事實和計量指標填寫同義詞和註解：
   - 先讀取 Snowflake 資料表/檢視表/資料行註解（偏好的來源）：
     - https://docs.snowflake.com/en/sql-reference/sql/comment
   - 如果缺少註解或同義詞，請詢問是否可以建立它們、使用者是否要提供文字，或者您是否應草擬建議供核准。
5. 建立暫時的驗證名稱（例如，附加 `__tmp_validate`），同時保持相同的資料庫和結構描述。
6. 在最終確定之前，務必透過 Snowflake CLI 將 DDL 發送至 Snowflake 進行驗證：
   - 使用 `snow sql` 以設定好的連線執行陳述式。
   - 如果旗標因版本而異，請檢查 `snow sql --help` 並使用該處顯示的連線選項。
7. 如果驗證失敗，請反覆修改 DDL 並重新執行驗證步驟，直到成功為止。
8. 使用真實的語意檢視表名稱套用最終 DDL（建立或變更）。
9. 清除驗證期間建立的任何暫時語意檢視表。

## 同義詞與註解 (必要)

- 針對同義詞和註解使用語意檢視表語法：

```
WITH SYNONYMS [ = ] ( 'synonym' [ , ... ] )
COMMENT = 'comment_about_dim_fact_or_metric'
```

- 將同義詞僅視為資訊用途；請勿在其他地方使用它們來引用維度、事實或計量指標。
- 使用 Snowflake 註解作為同義詞和註解的首選和第一來源：
  - https://docs.snowflake.com/en/sql-reference/sql/comment
- 如果缺少 Snowflake 註解，請詢問是否可以建立它們、使用者是否要提供文字，或者您是否應草擬建議供核准。
- 未經使用者核准，請勿虛構同義詞或註解。

## 驗證模式 (必要)

- 絕不跳過驗證。在將 DDL 呈現為最終結果之前，務必透過 Snowflake CLI 對 Snowflake 執行該 DDL。
- 偏好使用暫時名稱進行驗證，以避免破壞真實檢視表。

## 範例 CLI 驗證 (範本)

```bash
# 將預留位置替換為真實值。
snow sql -q "<CREATE OR ALTER SEMANTIC VIEW ...>" --connection <connection_name>
```

如果 CLI 在您的版本中使用不同的連線旗標，請執行：

```bash
snow sql --help
```

## 備註

- 將安裝和連線設定視為一次性步驟，但在第一次驗證之前確認其已完成。
- 除名稱外，最終語意檢視表定義應與經過驗證的暫時定義完全相同。
- 請勿省略同義詞或註解；即使在語法中是選填的，也請將其視為完整性所必需。
