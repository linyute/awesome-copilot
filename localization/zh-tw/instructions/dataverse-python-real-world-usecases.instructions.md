---
applyTo: '**'
---

# Dataverse SDK for Python — 實際使用案例與範本

基於 Dataverse 官方資料遷移和整合模式。

## 1. 從舊有系統遷移資料

### 遷移架構

```
舊有系統 → 暫存資料庫 → Dataverse
    (提取)      (轉換)         (載入)
```

### 完整遷移範例

```python
import pandas as pd
import time
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.errors import DataverseError
from azure.identity import DefaultAzureCredential

class DataMigrationPipeline:
    """從舊有系統遷移資料到 Dataverse。"""
    
    def __init__(self, org_url: str):
        self.client = DataverseClient(
            base_url=org_url,
            credential=DefaultAzureCredential()
        )
        self.success_records = []
        self.failed_records = []
    
    def extract_from_legacy(self, legacy_db_connection, query: str):
        """從來源系統提取資料。"""
        return pd.read_sql(query, legacy_db_connection)
    
    def transform_accounts(self, df: pd.DataFrame) -> list:
        """將來源資料轉換為 Dataverse 結構描述。"""
        payloads = []
        
        for _, row in df.iterrows():
            # 將來源欄位對應到 Dataverse
            payload = {
                "name": row["company_name"][:100],  # 限制為 100 個字元
                "telephone1": row["phone"],
                "websiteurl": row["website"],
                "revenue": float(row["annual_revenue"]) if row["annual_revenue"] else None,
                "numberofemployees": int(row["employees"]) if row["employees"] else None,
                # 追蹤來源 ID 以便協調
                "new_sourcecompanyid": str(row["legacy_id"]),
                "new_importsequencenumber": row["legacy_id"]
            }
            payloads.append(payload)
        
        return payloads
    
    def load_to_dataverse(self, payloads: list, batch_size: int = 200):
        """將資料載入到 Dataverse 並進行錯誤追蹤。"""
        total = len(payloads)
        
        for i in range(0, total, batch_size):
            batch = payloads[i:i + batch_size]
            
            try:
                ids = self.client.create("account", batch)
                self.success_records.extend(ids)
                print(f"✓ 已建立 {len(ids)} 筆記錄 ({len(self.success_records)}/{total})")
                
                # 防止速率限制
                time.sleep(0.5)
                
            except DataverseError as e:
                self.failed_records.extend(batch)
                print(f"✗ 批次失敗：{e.message}")
    
    def reconcile_migration(self, df: pd.DataFrame):
        """驗證遷移並追蹤結果。"""
        
        # 查詢已建立的記錄
        created_accounts = self.client.get(
            "account",
            filter="new_importsequencenumber ne null",
            select=["accountid", "new_sourcecompanyid", "new_importsequencenumber"],
            top=10000
        )
        
        created_df = pd.DataFrame(list(created_accounts))
        
        # 使用 Dataverse ID 更新來源資料表
        merged = df.merge(
            created_df,
            left_on="legacy_id",
            right_on="new_importsequencenumber"
        )
        
        print(f"已成功遷移 {len(merged)} 個帳戶")
        print(f"失敗：{len(self.failed_records)} 筆記錄")
        
        return {
            "total_source": len(df),
            "migrated": len(merged),
            "failed": len(self.failed_records),
            "success_rate": len(merged) / len(df) * 100
        }

# 用法
pipeline = DataMigrationPipeline("https://myorg.crm.dynamics.com")

# 提取
source_data = pipeline.extract_from_legacy(
    legacy_connection,
    "SELECT id, company_name, phone, website, annual_revenue, employees FROM companies"
)

# 轉換
payloads = pipeline.transform_accounts(source_data)

# 載入
pipeline.load_to_dataverse(payloads, batch_size=300)

# 協調
results = pipeline.reconcile_migration(source_data)
print(results)
```

---

## 2. 資料品質與重複資料刪除代理

### 偵測並合併重複項

```python
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import DefaultAzureCredential
import difflib

class DataQualityAgent:
    """監控並改善資料品質。"""
    
    def __init__(self, org_url: str):
        self.client = DataverseClient(
            base_url=org_url,
            credential=DefaultAzureCredential()
        )
    
    def find_potential_duplicates(self, table_name: str, match_fields: list):
        """尋找潛在的重複記錄。"""
        
        records = []
        for page in self.client.get(table_name, select=match_fields, top=10000):
            records.extend(page)
        
        duplicates = []
        seen = {}
        
        for record in records:
            # 從匹配欄位建立鍵
            key = tuple(
                record.get(field, "").lower().strip() 
                for field in match_fields
            )
            
            if key in seen and key != ("",) * len(match_fields):
                duplicates.append({
                    "original": seen[key],
                    "duplicate": record,
                    "fields_matched": match_fields
                })
            else:
                seen[key] = record
        
        return duplicates, len(records)
    
    def merge_records(self, table_name: str, primary_id: str, duplicate_id: str, 
                     mapping: dict):
        """將重複記錄合併到主要記錄中。"""
        
        # 將資料從重複項複製到主要項
        updates = {}
        duplicate = self.client.get(table_name, duplicate_id)
        
        for source_field, target_field in mapping.items():
            if duplicate.get(source_field) and not primary.get(target_field):
                updates[target_field] = duplicate[source_field]
        
        # 更新主要記錄
        if updates:
            self.client.update(table_name, primary_id, updates)
        
        # 刪除重複項
        self.client.delete(table_name, duplicate_id)
        
        return f"已將 {duplicate_id} 合併到 {primary_id}"
    
    def generate_quality_report(self, table_name: str) -> dict:
        """生成資料品質報告。"""
        
        records = list(self.client.get(table_name, top=10000))
        
        report = {
            "table": table_name,
            "total_records": len(records),
            "null_values": {},
            "duplicates": 0,
            "completeness_score": 0
        }
        
        # 檢查空值
        all_fields = set()
        for record in records:
            all_fields.update(record.keys())
        
        for field in all_fields:
            null_count = sum(1 for r in records if not r.get(field))
            completeness = (len(records) - null_count) / len(records) * 100
            
            if completeness < 100:
                report["null_values"][field] = {
                    "null_count": null_count,
                    "completeness": completeness
                }
        
        # 檢查重複項
        duplicates, _ = self.find_potential_duplicates(
            table_name, 
            ["name", "emailaddress1"]
        )
        report["duplicates"] = len(duplicates)
        
        # 整體完整性
        avg_completeness = sum(
            100 - ((d["null_count"] / len(records)) * 100)
            for d in report["null_values"].values()
        ) / len(report["null_values"]) if report["null_values"] else 100
        report["completeness_score"] = avg_completeness
        
        return report

# 用法
agent = DataQualityAgent("https://myorg.crm.dynamics.com")

# 尋找重複項
duplicates, total = agent.find_potential_duplicates(
    "account",
    match_fields=["name", "emailaddress1"]
)

print(f"在 {total} 個帳戶中找到 {len(duplicates)} 個潛在重複項")

# 如果確定，則合併
for dup in duplicates[:5]:  # 處理前 5 個
    result = agent.merge_records(
        "account",
        primary_id=dup["original"]["accountid"],
        duplicate_id=dup["duplicate"]["accountid"],
        mapping={"telephone1": "telephone1", "websiteurl": "websiteurl"}
    )
    print(result)

# 品質報告
report = agent.generate_quality_report("account")
print(f"資料品質：{report['completeness_score']:.1f}%")
```

---

## 3. 連絡人與帳戶豐富化

### 從外部來源豐富 CRM 資料

```python
import requests
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import DefaultAzureCredential

class DataEnrichmentAgent:
    """使用外部資料豐富 CRM 記錄。"""
    
    def __init__(self, org_url: str, external_api_key: str):
        self.client = DataverseClient(
            base_url=org_url,
            credential=DefaultAzureCredential()
        )
        self.api_key = external_api_key
    
    def enrich_accounts_with_industry_data(self):
        """使用產業分類豐富帳戶。"""
        
        accounts = self.client.get(
            "account",
            select=["accountid", "name", "websiteurl"],
            filter="new_industrydata eq null",
            top=500
        )
        
        enriched_count = 0
        for page in accounts:
            for account in page:
                try:
                    # 呼叫外部 API
                    industry = self._lookup_industry(account["name"])
                    
                    if industry:
                        self.client.update(
                            "account",
                            account["accountid"],
                            {"new_industrydata": industry}
                        )
                        enriched_count += 1
                
                except Exception as e:
                    print(f"無法豐富 {account['name']}：{e}")
        
        return enriched_count
    
    def enrich_contacts_with_social_profiles(self):
        """尋找並連結社交媒體個人檔案。"""
        
        contacts = self.client.get(
            "contact",
            select=["contactid", "fullname", "emailaddress1"],
            filter="new_linkedinurl eq null",
            top=500
        )
        
        for page in contacts:
            for contact in page:
                try:
                    # 尋找社交個人檔案
                    profiles = self._find_social_profiles(
                        contact["fullname"],
                        contact["emailaddress1"]
                    )
                    
                    if profiles:
                        self.client.update(
                            "contact",
                            contact["contactid"],
                            {
                                "new_linkedinurl": profiles.get("linkedin"),
                                "new_twitterhandle": profiles.get("twitter")
                            }
                        )
                
                except Exception as e:
                    print(f"無法豐富 {contact['fullname']}：{e}")
    
    def _lookup_industry(self, company_name: str) -> str:
        """呼叫外部產業 API。"""
        response = requests.get(
            "https://api.example.com/industry",
            params={"company": company_name},
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        
        if response.status_code == 200:
            return response.json().get("industry")
        return None
    
    def _find_social_profiles(self, name: str, email: str) -> dict:
        """尋找個人的社交媒體個人檔案。"""
        response = requests.get(
            "https://api.example.com/social",
            params={"name": name, "email": email},
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        
        if response.status_code == 200:
            return response.json()
        return {}

# 用法
enricher = DataEnrichmentAgent(
    "https://myorg.crm.dynamics.com",
    api_key="your-api-key"
)

enriched = enricher.enrich_accounts_with_industry_data()
print(f"已豐富 {enriched} 個帳戶")
```

---

## 4. 自動化報告資料匯出

### 將 CRM 資料匯出到 Excel

```python
import pandas as pd
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import DefaultAzureCredential
from datetime import datetime

class ReportExporter:
    """將 Dataverse 資料匯出到報告。"""
    
    def __init__(self, org_url: str):
        self.client = DataverseClient(
            base_url=org_url,
            credential=DefaultAzureCredential()
        )
    
    def export_sales_summary(self, output_file: str):
        """匯出銷售資料以進行報告。"""
        
        accounts = []
        for page in self.client.get(
            "account",
            select=["accountid", "name", "revenue", "numberofemployees", 
                   "createdon", "modifiedon"],
            filter="statecode eq 0",  # 僅限活躍
            orderby=["revenue desc"],
            top=10000
        ):
            accounts.extend(page)
        
        # 商機
        opportunities = []
        for page in self.client.get(
            "opportunity",
            select=["opportunityid", "name", "estimatedvalue", 
                   "statuscode", "parentaccountid", "createdon"],
            top=10000
        ):
            opportunities.extend(page)
        
        # 建立 DataFrames
        df_accounts = pd.DataFrame(accounts)
        df_opportunities = pd.DataFrame(opportunities)
        
        # 生成報告
        with pd.ExcelWriter(output_file) as writer:
            df_accounts.to_excel(writer, sheet_name="帳戶", index=False)
            df_opportunities.to_excel(writer, sheet_name="商機", index=False)
            
            # 摘要工作表
            summary = pd.DataFrame({
                "指標": [
                    "總帳戶數",
                    "總商機數",
                    "總收入",
                    "匯出日期"
                ],
                "值": [
                    len(df_accounts),
                    len(df_opportunities),
                    df_accounts["revenue"].sum() if "revenue" in df_accounts else 0,
                    datetime.now().isoformat()
                ]
            })
            summary.to_excel(writer, sheet_name="摘要", index=False)
        
        return output_file
    
    def export_activity_log(self, days_back: int = 30) -> str:
        """匯出最近的活動以進行稽核。"""
        
        from_date = pd.Timestamp.now(tz='UTC') - pd.Timedelta(days=days_back)
        
        activities = []
        for page in self.client.get(
            "activitypointer",
            select=["activityid", "subject", "activitytypecode", 
                   "createdon", "ownerid"],
            filter=f"createdon gt {from_date.isoformat()}",
            orderby=["createdon desc"],
            top=10000
        ):
            activities.extend(page)
        
        df = pd.DataFrame(activities)
        output = f"activity_log_{datetime.now():%Y%m%d}.csv"
        df.to_csv(output, index=False)
        
        return output

# 用法
exporter = ReportExporter("https://myorg.crm.dynamics.com")
report_file = exporter.export_sales_summary("sales_report.xlsx")
print(f"報告已儲存到 {report_file}")
```

---

## 5. 工作流程整合 - 批次作業

### 根據條件處理記錄

```python
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import DefaultAzureCredential
from enum import IntEnum

class AccountStatus(IntEnum):
    PROSPECT = 1
    ACTIVE = 2
    CLOSED = 3

class BulkWorkflow:
    """自動化批次作業。"""
    
    def __init__(self, org_url: str):
        self.client = DataverseClient(
            base_url=org_url,
            credential=DefaultAzureCredential()
        )
    
    def mark_accounts_as_inactive_if_no_activity(self, days_no_activity: int = 90):
        """停用最近沒有活動的帳戶。"""
        
        from_date = f"2025-{datetime.now().month:02d}-01T00:00:00Z"
        
        inactive_accounts = self.client.get(
            "account",
            select=["accountid", "name"],
            filter=f"modifiedon lt {from_date} and statecode eq 0",
            top=5000
        )
        
        accounts_to_deactivate = []
        for page in inactive_accounts:
            accounts_to_deactivate.extend([a["accountid"] for a in page])
        
        # 批次更新
        if accounts_to_deactivate:
            self.client.update(
                "account",
                accounts_to_deactivate,
                {"statecode": AccountStatus.CLOSED}
            )
            print(f"已停用 {len(accounts_to_deactivate)} 個非活躍帳戶")
    
    def update_opportunity_status_based_on_amount(self):
        """根據預估價值更新商機階段。"""
        
        opportunities = self.client.get(
            "opportunity",
            select=["opportunityid", "estimatedvalue"],
            filter="statuscode ne 7",  # 未結案
            top=5000
        )
        
        updates = []
        ids = []
        
        for page in opportunities:
            for opp in page:
                value = opp.get("estimatedvalue", 0)
                
                # 判斷階段
                if value < 10000:
                    stage = 1  # 合格
                elif value < 50000:
                    stage = 2  # 提案
                else:
                    stage = 3  # 提案審查
                
                updates.append({"stageid": stage})
                ids.append(opp["opportunityid"])
        
        # 批次更新
        if ids:
            self.client.update("opportunity", ids, updates)
            print(f"已更新 {len(ids)} 個商機")

# 用法
workflow = BulkWorkflow("https://myorg.crm.dynamics.com")
workflow.mark_accounts_as_inactive_if_no_activity(days_no_activity=90)
workflow.update_opportunity_status_based_on_amount()
```

---

## 6. 排程作業範本

### 用於排程作業的 Azure Function

```python
# scheduled_migration_job.py
import azure.functions as func
from datetime import datetime
from DataMigrationPipeline import DataMigrationPipeline
import logging

def main(timer: func.TimerRequest) -> None:
    """按排程執行遷移作業 (例如，每日)。"""
    
    if timer.past_due:
        logging.info('計時器已過期！')
    
    try:
        logging.info(f'遷移作業於 {datetime.utcnow()} 開始')
        
        # 執行遷移
        pipeline = DataMigrationPipeline("https://myorg.crm.dynamics.com")
        
        # 提取、轉換、載入
        source_data = pipeline.extract_from_legacy(...)
        payloads = pipeline.transform_accounts(source_data)
        pipeline.load_to_dataverse(payloads)
        
        # 取得結果
        results = pipeline.reconcile_migration(source_data)
        
        logging.info(f'遷移完成：{results}')
        
    except Exception as e:
        logging.error(f'遷移失敗：{e}')
        raise

# function_app.py - Azure Functions 設定
app = func.FunctionApp()

@app.schedule_trigger(schedule="0 0 * * *")  # 每天午夜
def migration_job(timer: func.TimerRequest) -> None:
    main(timer)
```

---

## 7. 完整入門範本

```python
#!/usr/bin/env python3
"""
Dataverse SDK for Python - 完整入門範本
"""

from azure.identity import DefaultAzureCredential
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.config import DataverseConfig
from PowerPlatform.Dataverse.core.errors import DataverseError
import logging

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataverseApp:
    """Dataverse 應用程式的基底類別。"""
    
    def __init__(self, org_url: str):
        self.org_url = org_url
        self.client = self._create_client()
    
    def _create_client(self) -> DataverseClient:
        """建立已驗證的客戶端。"""
        cfg = DataverseConfig()
        cfg.logging_enable = False
        
        return DataverseClient(
            base_url=self.org_url,
            credential=DefaultAzureCredential(),
            config=cfg
        )
    
    def create_account(self, name: str, phone: str = None) -> str:
        """建立帳戶記錄。"""
        try:
            payload = {"name": name}
            if phone:
                payload["telephone1"] = phone
            
            id = self.client.create("account", payload)[0]
            logger.info(f"已建立帳戶：{id}")
            return id
        
        except DataverseError as e:
            logger.error(f"建立帳戶失敗：{e.message}")
            raise
    
    def get_accounts(self, filter_expr: str = None, top: int = 100) -> list:
        """取得帳戶記錄。"""
        try:
            accounts = self.client.get(
                "account",
                filter=filter_expr,
                select=["accountid", "name", "telephone1", "createdon"],
                orderby=["createdon desc"],
                top=top
            )
            
            all_accounts = []
            for page in accounts:
                all_accounts.extend(page)
            
            logger.info(f"已擷取 {len(all_accounts)} 個帳戶")
            return all_accounts
        
        except DataverseError as e:
            logger.error(f"取得帳戶失敗：{e.message}")
            raise
    
    def update_account(self, account_id: str, **kwargs) -> None:
        """更新帳戶記錄。"""
        try:
            self.client.update("account", account_id, kwargs)
            logger.info(f"已更新帳戶：{account_id}")
        
        except DataverseError as e:
            logger.error(f"更新帳戶失敗：{e.message}")
            raise

if __name__ == "__main__":
    # 用法
    app = DataverseApp("https://myorg.crm.dynamics.com")
    
    # 建立
    account_id = app.create_account("Acme Inc", "555-0100")
    
    # 取得
    accounts = app.get_accounts(filter_expr="statecode eq 0", top=50)
    print(f"找到 {len(accounts)} 個活躍帳戶")
    
    # 更新
    app.update_account(account_id, telephone1="555-0199")
```

---

## 8. 另請參閱

- [Dataverse 資料遷移](https://learn.microsoft.com/zh-tw/power-platform/architecture/key-concepts/data-migration/workflow-complex-data-migration)
- [處理資料 (SDK)](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/work-data)
- [GitHub 上的 SDK 範例](https://github.com/microsoft/PowerPlatform-DataverseClient-Python/tree/main/examples)
