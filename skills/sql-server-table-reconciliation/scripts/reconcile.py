#!/usr/bin/env python3
"""SQL Server 資料表核對指令碼 (SQL Server Table Reconciliation Script)。

使用 mssql-python 驅動程式與 Apache Arrow 比較兩個 SQL Server 執行個體間相同的資料表。
偵測缺失的資料列、資料欄位不匹配、架構漂移，並產生核對報告。

用法：
    python reconcile.py \
        --source-server prod-server.database.windows.net \
        --source-database ProdDB \
        --target-server staging-server.database.windows.net \
        --target-database StagingDB \
        --tables "dbo.Orders,dbo.Items" \
        --auth entra \
        --output console \
        --chunk-size 100000

認證所需的環境變數 (當 --auth 為 sql 時)：
    MSSQL_USER       - SQL Server 使用者名稱
    MSSQL_PASSWORD   - SQL Server 密碼
"""

import argparse
import os
import sys
from getpass import getpass

import pandas as pd
import pyarrow as pa
import pyarrow.compute as pc
from mssql_python import connect as mssql_connect


# --- 連線設定 ---
def connect(server, database, auth_mode, user=None, password=None):
    """使用 mssql-python 驅動程式進行連線。

    從環境變數讀取認證資訊或進行互動式提示。絕不硬編碼。"""
    if auth_mode == "sql":
        user = user or os.environ.get("MSSQL_USER") or input("使用者名稱：")
        password = password or os.environ.get("MSSQL_PASSWORD") or getpass("密碼：")
        conn_str = (
            f"Server={server};Database={database};"
            f"UID={user};PWD={password};"
            f"TrustServerCertificate=yes;Encrypt=yes"
        )
    else:
        # Entra (Azure AD) 驗證
        conn_str = (
            f"Server={server};Database={database};"
            f"Authentication=ActiveDirectoryDefault;"
            f"TrustServerCertificate=yes;Encrypt=yes"
        )
    return mssql_connect(conn_str)


# --- 資料表解析 ---
def resolve_tables(conn, table_spec):
    """將資料表規格解析為 schema.table 名稱清單。

    接受：'dbo.*'、'dbo.Orders,dbo.Items' 或 'dbo.Orders'。"""
    tables = []
    for spec in table_spec.split(","):
        spec = spec.strip()
        schema, tbl = spec.split(".")
        if tbl == "*":
            query = """
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
            """
            cur = conn.cursor()
            cur.execute(query, [schema])
            rows = cur.arrow().to_pandas()
            tables.extend(f"{schema}.{t}" for t in rows["TABLE_NAME"])
        else:
            tables.append(spec)
    return tables


# --- 架構比較 ---
def compare_schema(source_conn, target_conn, table):
    """比較資料欄名稱、類型、是否可為 NULL。傳回漂移報告與共通資料欄。"""
    query = """
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH,
           NUMERIC_PRECISION, NUMERIC_SCALE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
    """
    schema_name, table_name = table.split(".")

    src_cur = source_conn.cursor()
    src_cur.execute(query, [schema_name, table_name])
    source_schema = src_cur.arrow().to_pandas()

    tgt_cur = target_conn.cursor()
    tgt_cur.execute(query, [schema_name, table_name])
    target_schema = tgt_cur.arrow().to_pandas()

    src_cols = set(source_schema["COLUMN_NAME"])
    tgt_cols = set(target_schema["COLUMN_NAME"])

    drift = []
    only_in_source = src_cols - tgt_cols
    only_in_target = tgt_cols - src_cols
    if only_in_source:
        drift.append(f"僅存在於來源的資料欄：{sorted(only_in_source)}")
    if only_in_target:
        drift.append(f"僅存在於目標的資料欄：{sorted(only_in_target)}")

    common_cols = sorted(src_cols & tgt_cols)

    # 檢查共通資料欄的類型差異
    src_types = source_schema.set_index("COLUMN_NAME")
    tgt_types = target_schema.set_index("COLUMN_NAME")
    for col in common_cols:
        if col in src_types.index and col in tgt_types.index:
            s = src_types.loc[col]
            t = tgt_types.loc[col]
            if s["DATA_TYPE"] != t["DATA_TYPE"]:
                drift.append(
                    f"  {col}：類型 {s['DATA_TYPE']} 對比 {t['DATA_TYPE']}"
                )

    return drift, common_cols


# --- 主鍵偵測 ---
def detect_primary_key(conn, table):
    """從 sys.index_columns 自動偵測主鍵資料欄。"""
    schema, tbl = table.split(".")
    query = """
    SELECT c.name
    FROM sys.indexes i
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.is_primary_key = 1
      AND OBJECT_SCHEMA_NAME(i.object_id) = ?
      AND OBJECT_NAME(i.object_id) = ?
    ORDER BY ic.key_ordinal
    """
    cur = conn.cursor()
    cur.execute(query, [schema, tbl])
    result = cur.arrow()
    return result.column("name").to_pylist()


# --- 資料擷取 (Arrow) ---
def extract_table(conn, table, pk_cols, chunk_size=100000):
    """使用 Arrow 資料行傳輸，將資料表資料擷取為 Arrow Table。"""
    pk_order = ", ".join(pk_cols)
    query = f"SELECT * FROM {table} ORDER BY {pk_order}"
    cur = conn.cursor()
    cur.execute(query)
    return cur.arrow()


# --- 雜湊預檢查 (適用於大型資料表) ---
def extract_hashes(conn, table, pk_cols, compare_cols):
    """針對大型資料表優化，擷取主鍵與資料列雜湊。"""
    pk_select = ", ".join(pk_cols)
    col_concat = ", ".join(compare_cols)
    query = f"""
    SELECT {pk_select},
           HASHBYTES('SHA2_256', CONCAT_WS('|', {col_concat})) AS row_hash
    FROM {table}
    ORDER BY {pk_select}
    """
    cur = conn.cursor()
    cur.execute(query)
    return cur.arrow()


# --- 核對邏輯 ---
def reconcile(source_table, target_table, pk_cols, compare_cols):
    """比較兩個 Arrow 資料表。

    1. 轉換為以主鍵為索引的 pandas DataFrame
    2. 識別缺失/多餘的資料列
    3. 針對匹配的資料列比較資料欄位值
    4. 處理 NULL 對比非 NULL (NULL == NULL 視為匹配)
    """
    src_df = source_table.to_pandas().set_index(pk_cols)
    tgt_df = target_table.to_pandas().set_index(pk_cols)

    # 缺失/多餘資料列
    src_keys = set(src_df.index.tolist() if len(pk_cols) > 1 else src_df.index)
    tgt_keys = set(tgt_df.index.tolist() if len(pk_cols) > 1 else tgt_df.index)
    missing_in_target = src_keys - tgt_keys
    extra_in_target = tgt_keys - src_keys
    common_keys = src_keys & tgt_keys

    # 針對共通資料列進行資料欄層級的不匹配檢查
    common_src = src_df.loc[src_df.index.isin(common_keys), compare_cols]
    common_tgt = tgt_df.loc[tgt_df.index.isin(common_keys), compare_cols]
    diff = common_src.compare(common_tgt, keep_shape=False)

    return {
        "missing_in_target": missing_in_target,
        "extra_in_target": extra_in_target,
        "mismatches": diff,
        "total_source": len(src_df),
        "total_target": len(tgt_df),
    }


# --- 個別資料表管線 ---
def reconcile_table(source_conn, target_conn, table, pk_override=None, columns=None,
                    chunk_size=100000):
    """執行單一資料表的完整核對流程。傳回結果字典。"""
    schema_drift, common_cols = compare_schema(source_conn, target_conn, table)

    pk_cols = pk_override
    if not pk_cols:
        pk_cols = detect_primary_key(source_conn, table)
    if not pk_cols:
        pk_cols = detect_primary_key(target_conn, table)
    if not pk_cols:
        return {"table": table, "error": "未偵測到主鍵", "status": "SKIPPED"}

    compare_cols = columns if columns else [c for c in common_cols if c not in pk_cols]

    source_data = extract_table(source_conn, table, pk_cols, chunk_size)
    target_data = extract_table(target_conn, table, pk_cols, chunk_size)

    result = reconcile(source_data, target_data, pk_cols, compare_cols)
    result["table"] = table
    result["schema_drift"] = schema_drift
    result["status"] = (
        "PASS"
        if not (result["missing_in_target"] or result["extra_in_target"] or len(result["mismatches"]))
        else "FAIL"
    )
    return result


# --- 報告產生 ---
def generate_report(all_results, output_format="console"):
    """輸出個別資料表詳細資訊與整合摘要。"""
    for r in all_results:
        print(f"\n--- {r['table']} ---")
        if r.get("error"):
            print(f"  已跳過：{r['error']}")
            continue
        print(f"  來源：{r['total_source']:,}  目標：{r['total_target']:,}")
        print(
            f"  缺失：{len(r['missing_in_target'])}  "
            f"多餘：{len(r['extra_in_target'])}  "
            f"不匹配：{len(r['mismatches'])}"
        )
        print(
            f"  結果：{'✓ 內容一致' if r['status'] == 'PASS' else '✗ 發現差異'}"
        )
        if r.get("schema_drift"):
            print("  架構漂移：")
            for d in r["schema_drift"]:
                print(f"    {d}")

    # 摘要
    passed = sum(1 for r in all_results if r["status"] == "PASS")
    failed = sum(1 for r in all_results if r["status"] == "FAIL")
    skipped = sum(1 for r in all_results if r["status"] == "SKIPPED")
    print(
        f"\n=== 摘要：{passed} 個通過，{failed} 個失敗，"
        f"{skipped} 個跳過 / 共 {len(all_results)} 個資料表 ==="
    )

    # 若要求則匯出
    if output_format == "csv":
        rows = [
            {
                "table": r["table"],
                "status": r["status"],
                "source_rows": r.get("total_source", 0),
                "target_rows": r.get("total_target", 0),
                "missing": len(r.get("missing_in_target", [])),
                "extra": len(r.get("extra_in_target", [])),
                "mismatches": len(r.get("mismatches", [])),
            }
            for r in all_results
        ]
        df = pd.DataFrame(rows)
        df.to_csv("reconciliation_report.csv", index=False)
        print("\n報告已儲存至 reconciliation_report.csv")
    elif output_format == "json":
        import json

        rows = [
            {
                "table": r["table"],
                "status": r["status"],
                "source_rows": r.get("total_source", 0),
                "target_rows": r.get("total_target", 0),
                "missing": len(r.get("missing_in_target", [])),
                "extra": len(r.get("extra_in_target", [])),
                "mismatches": len(r.get("mismatches", [])),
            }
            for r in all_results
        ]
        with open("reconciliation_report.json", "w") as f:
            json.dump(rows, f, indent=2)
        print("\n報告已儲存至 reconciliation_report.json")


# --- 主程式 ---
def main():
    parser = argparse.ArgumentParser(
        description="比較兩個 SQL Server 執行個體間的資料表。"
    )
    parser.add_argument("--source-server", required=True, help="來源 SQL Server 主機")
    parser.add_argument("--source-database", required=True, help="來源資料庫名稱")
    parser.add_argument("--target-server", required=True, help="目標 SQL Server 主機")
    parser.add_argument("--target-database", required=True, help="目標資料庫名稱")
    parser.add_argument(
        "--tables",
        required=True,
        help="以逗號分隔的 schema.table 名稱或 schema.* 萬用字元",
    )
    parser.add_argument(
        "--auth",
        choices=["sql", "entra"],
        default="sql",
        help="驗證模式 (預設：sql)",
    )
    parser.add_argument(
        "--primary-key",
        default=None,
        help="以逗號分隔的主鍵資料欄。若省略則自動偵測。",
    )
    parser.add_argument(
        "--columns",
        default=None,
        help="以逗號分隔的欲比較資料欄。若省略則比較所有非主鍵資料欄。",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=100000,
        help="大型資料表的每批處理列數 (預設：100000)",
    )
    parser.add_argument(
        "--output",
        choices=["console", "csv", "json"],
        default="console",
        help="輸出格式 (預設：console)",
    )
    args = parser.parse_args()

    pk_override = [c.strip() for c in args.primary_key.split(",")] if args.primary_key else None
    columns = [c.strip() for c in args.columns.split(",")] if args.columns else None

    print(f"正在連線至來源：{args.source_server}/{args.source_database}")
    source_conn = connect(args.source_server, args.source_database, args.auth)

    print(f"正在連線至目標：{args.target_server}/{args.target_database}")
    target_conn = connect(args.target_server, args.target_database, args.auth)

    tables = resolve_tables(source_conn, args.tables)
    print(f"欲核對的資料表：{tables}")

    results = []
    for table in tables:
        print(f"正在核對 {table}...")
        results.append(
            reconcile_table(
                source_conn, target_conn, table,
                pk_override=pk_override,
                columns=columns,
                chunk_size=args.chunk_size,
            )
        )

    generate_report(results, output_format=args.output)


if __name__ == "__main__":
    main()
