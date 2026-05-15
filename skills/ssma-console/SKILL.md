---
name: ssma-console
description: "使用情境：SSMA 主控台作業 — 建立專案、產生評估報告、轉換結構描述、移轉資料、Oracle 到 SQL Server 移轉、結構描述轉換、資料移轉"
---

# SSMA 主控台 — Oracle 到 SQL Server 移轉

直接產生 XML 配置並呼叫 `SSMAforOracleConsole.exe` — 不使用外部指令碼或封裝。

**作業**（按「完整移轉」順序執行）：
1. **create-project** — 連接來源和目標，對應結構描述
2. **generate-report** — 評估報告
3. **migrate-schema** — 轉換並部署結構描述
4. **migrate-data** — 端對端轉換、部署及移轉資料

## 收集輸入

詢問缺失的參數。括號中為預設值。

**Oracle**: 主機 (`localhost`)、連接埠 (`1521`)、執行個體 *(必要，服務名稱)*、使用者、密碼、結構描述
**SQL Server**: 伺服器、資料庫、使用者、密碼、加密 (`true`)、信任伺服器憑證 (`true`)、目標結構描述 (`dbo`)
**專案**: 名稱 (`ssma-migration`)、資料夾 (`.`)、類型 (`sql-server-2022` — 亦可為 `2016`/`2017`/`2019`/`2025`/`sql-azure`)、SSMA 路徑 (`C:\Program Files\Microsoft SQL Server Migration Assistant for Oracle\bin\SSMAforOracleConsole.exe`)

## 產生 XML 檔案

在寫入前解析所有 `{PLACEHOLDER}` 權杖。產生 3 個檔案：

### `ssma-variables.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<variables>
  <variable name="$WorkingFolder$" value="{PROJECT_FOLDER}" />
  <variable name="$ProjectType$" value="{PROJECT_TYPE}" />
  <variable name="$ProjectName$" value="{PROJECT_NAME}" />
  <variable-group name="OracleConnection">
    <variable name="$OracleHostName$" value="{ORACLE_HOST}" />
    <variable name="$OracleInstance$" value="{ORACLE_INSTANCE}" />
    <variable name="$OraclePort$" value="{ORACLE_PORT}" />
    <variable name="$OracleUserName$" value="{ORACLE_USER}" />
    <variable name="$OraclePassword$" value="{ORACLE_PASSWORD}" />
    <variable name="$OracleSchemaName$" value="{ORACLE_SCHEMA}" />
  </variable-group>
  <variable-group name="SQLServerConnection">
    <variable name="$SQLServerName$" value="{SQL_SERVER}" />
    <variable name="$SQLServerDb$" value="{SQL_DATABASE}" />
    <variable name="$SQLServerUsrID$" value="{SQL_USER}" />
    <variable name="$SQLServerPwd$" value="{SQL_PASSWORD}" />
  </variable-group>
  <variable-group name="ReportSettings">
    <variable name="$SummaryReportFile$" value="Reports\Assessment\AssessmentReport.xml" />
    <variable name="$ConversionReportFile$" value="Reports\Conversion\ConversionReport.xml" />
    <variable name="$ConversionReportFolder$" value="Reports\Conversion" />
    <variable name="$DataMigrationReportFile$" value="Reports\Migration\DataMigrationReport.xml" />
    <variable name="$SynchronizationReportFolder$" value="Reports\Synchronization" />
  </variable-group>
</variables>
```

### `ssma-servers.xml`

**關鍵**：使用 `tns-name-mode` — `standard-mode` 會將執行個體視為 SID 並因 ORA-12505 失敗。

```xml
<?xml version="1.0" encoding="utf-8"?>
<servers>
  <oracle name="source_oracle">
    <tns-name-mode>
      <connection-provider value="OracleClient" />
      <service-name value="(DESCRIPTION =(ADDRESS_LIST =(ADDRESS = (PROTOCOL = TCP)(HOST = $OracleHostName$)(PORT = $OraclePort$)))(CONNECT_DATA =(SERVICE_NAME = $OracleInstance$)))" />
      <user-id value="$OracleUserName$" />
      <password value="$OraclePassword$" />
    </tns-name-mode>
  </oracle>
  <sql-server name="target_sqlserver">
    <sql-server-authentication>
      <server value="$SQLServerName$" />
      <database value="$SQLServerDb$" />
      <user-id value="$SQLServerUsrID$" />
      <password value="$SQLServerPwd$" />
      <encrypt value="{ENCRYPT}" />
      <trust-server-certificate value="{TRUST_CERT}" />
    </sql-server-authentication>
  </sql-server>
</servers>
```

### 作業指令碼 XML

每個作業產生一個指令碼。所有指令碼共享此通用的 `<config>` 區塊（針對 migrate-schema/migrate-data 加入 `<object-overwrite action="overwrite" />`，針對 migrate-data 加入 `<data-migration-connection source-use-last-used="true" target-server="target_sqlserver" />`，對 schema/data 作業使用 `every-5%` 進度）：

```xml
<config>
  <output-providers>
    <output-window suppress-messages="false" destination="stdout" />
    <upgrade-project action="yes" />
    <user-input-popup mode="continue" />
    <progress-reporting enable="true" report-messages="true" report-progress="every-10%" />
    <log-verbosity level="info" />
  </output-providers>
</config>
```

所有指令碼都以 `<script-commands>` 中的此**前導段落 (preamble)** 開始：

```xml
<create-new-project project-folder="$WorkingFolder$" project-name="$ProjectName$"
                    overwrite-if-exists="true" project-type="$ProjectType$" />
<connect-source-database server="source_oracle">
  <object-to-collect object-name="$OracleSchemaName$" />
</connect-source-database>
```

**關鍵**：務必包含 `<object-to-collect>` — 若無此項，`map-schema` 會因「找不到來源命名空間」而失敗。

**個別作業命令**（在前導段落之後，`<save-project />` 之前）：

| 作業 | 檔案 | 前導段落之後的命令 |
|-----------|------|------------------------|
| create-project | `ssma-create-project.xml` | `connect-target-database` → `map-schema source-schema="$OracleSchemaName$" sql-server-schema="$SQLServerDb$.{TARGET_SCHEMA}"` |
| generate-report | `ssma-assessment.xml` | `generate-assessment-report object-name="$OracleSchemaName$" object-type="Schemas" write-summary-report-to="$SummaryReportFile$" verbose="true" report-errors="true"` |
| migrate-schema | `ssma-schema.xml` | `connect-target-database` → `map-schema` → `convert-schema` (至 `$ConversionReportFile$`) → `synchronize-target object-name="$SQLServerDb$.{TARGET_SCHEMA}"` |
| migrate-data | `ssma-data.xml` | 與 migrate-schema 相同 + `refresh-from-database` → `migrate-data object-name="$OracleSchemaName$.Tables" object-type="category"` (至 `$DataMigrationReportFile$`) → `close-project` |

## 執行

向使用者顯示解析後的 XML 和命令。執行前請先確認。

```powershell
New-Item -ItemType Directory -Force -Path "Reports\Assessment","Reports\Conversion","Reports\Migration","Reports\Synchronization","Logs" | Out-Null
& "{SSMA_CONSOLE_PATH}" -s "{SCRIPT_XML}" -c "ssma-servers.xml" -v "ssma-variables.xml" -l "Logs\{OPERATION}.log"
```

## 回報結果

檢查結束代碼 (`0` = 成功)，讀取記錄和報告 (`Reports\Assessment\`、`Reports\Conversion\`、`Reports\Migration\`)，並總結發現。

## 限制

- 無外部指令碼 — 不使用 `.ps1`、`.bat`、`.sh`
- 執行前確認連線詳細資訊
- 解析所有佔位符 — 最終 XML 中不得有 `{...}`
- 執行前建立輸出目錄

## 已知問題

| 徵狀 | 修復方法 |
|---------|-----|
| `ORA-12505: SID not registered` | 使用 `tns-name-mode`，而非 `standard-mode` |
| `Source namespace was not found` | 在 `connect-source-database` 中加入 `<object-to-collect>` |
| `force-load` 時出現 `not found in metabase` | 改用 `object-to-collect` — `force-load` 不可靠 |
| `SQL Server Agent is not running` | 僅為警告 — BCP 用戶端移轉仍可運作 |
