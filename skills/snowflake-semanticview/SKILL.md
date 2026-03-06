---
name: snowflake-semanticview
description: 使用 Snowflake CLI (snow) 建立、修改及驗證 Snowflake 語義檢視表 (semantic views)。當被要求使用 CREATE/ALTER SEMANTIC VIEW 建構語義檢視表/語義層定義或進行疑難排解、透過 CLI 向 Snowflake 驗證語義檢視表 DDL，或引導進行 Snowflake CLI 安裝與連線設定時使用。
---

# Snowflake 語義檢視表 (Snowflake Semantic Views)

## 一次性設定

- 開啟新的終端機並執行 `snow --help` 以驗證 Snowflake CLI 是否已安裝。
- 如果遺漏 Snowflake CLI 或使用者無法安裝，請引導他們至 https://docs.snowflake.com/en/developer-guide/snowflake-cli/installation/installation。
- 根據 https://docs.snowflake.com/en/developer-guide/snowflake-cli/connecting/configure-connections#add-a-connection 使用 `snow connection add` 設定 Snowflake 連線。
- 使用設定好的連線進行所有驗證與執行步驟。

## 每個語義檢視表要求的工作流程

1. 確認目標資料庫、結構描述 (Schema)、角色、倉儲 (Warehouse) 以及最終的語義檢視表名稱。
2. 確認模型遵循星狀結構描述 (Star Schema) (事實表搭配一致的維度表)。
3. 使用官方語法草擬語義檢視表 DDL：
   - https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view
4. 為每個維度 (Dimension)、事實 (Fact) 和指標 (Metric) 填寫同義詞 (Synonyms) 和註解 (Comments)：
   - 首先讀取 Snowflake 資料表/檢視表/資料行註解 (偏好來源)：
     - https://docs.snowflake.com/en/sql-reference/sql/comment
   - 如果遺漏註解或同義詞，請詢問是否可以建立它們、使用者是否想要提供文字，或者你是否應該草擬建議以供核准。
5. 使用具備 DISTINCT 和 LIMIT (最多 1000 行) 的 SELECT 陳述式來探索事實表與維度表之間的關係、識別資料行資料類型，並為資料行建立更具意義的註解與同義詞。
6. 建立一個暫時的驗證名稱 (例如，附加 `__tmp_validate`)，同時保持相同的資料庫和結構描述。
7. 在定案之前，務必透過 Snowflake CLI 將 DDL 傳送至 Snowflake 進行驗證：
   - 使用 `snow sql` 以設定好的連線執行陳述式。
   - 如果旗標因版本而異，請檢查 `snow sql --help` 並使用該處顯示的連線選項。
8. 如果驗證失敗，請反覆修正 DDL 並重新執行驗證步驟，直到成功為止。
9. 使用真實的語義檢視表名稱套用最終的 DDL (建立或修改)。
10. 對最終的語義檢視表執行範例查詢，以確認其運作符合預期。其 SQL 語法不同，如下所示：https://docs.snowflake.com/en/user-guide/views-semantic/querying#querying-a-semantic-view
範例：

```SQL
SELECT * FROM SEMANTIC_VIEW(
    my_semview_name
    DIMENSIONS customer.customer_market_segment
    METRICS orders.order_average_value
)
ORDER BY customer_market_segment;
```

11. 清理驗證期間建立的任何暫時性語義檢視表。

## 同義詞與註解 (必要)

- 對同義詞與註解使用語義檢視表語法：

```
WITH SYNONYMS [ = ] ( 'synonym' [ , ... ] )
COMMENT = 'comment_about_dim_fact_or_metric'
```

- 將同義詞僅視為資訊性資訊；請勿在其他地方使用它們來引用維度、事實或指標。
- 使用 Snowflake 註解作為同義詞與註解的首選與第一來源：
  - https://docs.snowflake.com/en/sql-reference/sql/comment
- 如果遺漏 Snowflake 註解，請詢問是否可以建立它們、使用者是否想要提供文字，或者你是否應該草擬建議以供核准。
- 未經使用者核准，請勿發明同義詞或註解。

## 驗證模式 (必要)

- 絕不跳過驗證。在將 DDL 呈現為最終結果之前，務必使用 Snowflake CLI 對 Snowflake 執行該 DDL。
- 偏好使用暫時名稱進行驗證，以避免覆蓋真實的檢視表。

## 範例 CLI 驗證 (範本)

```bash
# 將預留位置替換為真實值。
snow sql -q "<CREATE OR ALTER SEMANTIC VIEW ...>" --connection <connection_name>
```

如果你的版本中 CLI 使用不同的連線旗標，請執行：

```bash
snow sql --help
```

## 備註

- 將安裝與連線設定視為一次性步驟，但在第一次驗證前請確認已完成。
- 保持最終的語義檢視表定義與經驗證的暫時定義相同，僅名稱除外。
- 請勿省略同義詞或註解；即使在語法中是選用的，也請將其視為完整性所必需。
