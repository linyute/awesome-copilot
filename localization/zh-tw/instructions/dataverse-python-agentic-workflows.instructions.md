# Dataverse SDK for Python - 代理工作流程指南

## ⚠️ 預覽功能通知

**狀態**：此功能目前處於 **公開預覽** 階段（截至 2025 年 12 月）
**可用性**：正式發行 (GA) 日期待定
**文件**：完整的實作細節將於日後提供

本指南涵蓋了使用 Dataverse SDK for Python 建立代理工作流程的概念框架和預期功能。具體 API 和實作在正式發行前可能會有所變更。

---

## 1. 概述：Dataverse 代理工作流程

### 什麼是代理工作流程？

代理工作流程是自動化、智能的程序，其中：
- **代理** 根據資料和規則做出決策並採取行動
- **工作流程** 協調複雜的多步驟作業
- **Dataverse** 作為企業資料的中央事實來源

Dataverse SDK for Python 旨在讓資料科學家和開發人員無需 .NET 專業知識即可建立這些智能系統。

### 關鍵功能 (規劃中)

SDK 策略性地定位以支援：

1. **自主資料代理** - 獨立查詢、更新和評估資料品質
2. **表單預測與自動填寫** - 根據資料模式和上下文預先填寫表單
3. **模型上下文協議 (MCP)** 支援 - 啟用標準化的代理到工具通訊
4. **代理對代理 (A2A)** 協作 - 多個代理協同處理複雜任務
5. **語義模型建立** - 自然語言理解資料關聯
6. **安全模擬** - 代表特定使用者執行作業並留下稽核追蹤
7. **內建合規性** - 強制執行資料治理和保留政策

---

## 2. 代理系統的架構模式

### 多代理模式
```python
# Conceptual pattern - specific APIs pending GA
class DataQualityAgent:
    """Autonomous agent that monitors and improves data quality."""
    
    def __init__(self, client):
        self.client = client
    
    async def evaluate_data_quality(self, table_name):
        """Evaluate data quality metrics for a table."""
        records = await self.client.get(table_name)
        
        metrics = {
            'total_records': len(records),
            'null_values': sum(1 for r in records if None in r.values()),
            'duplicate_records': await self._find_duplicates(table_name)
        }
        return metrics
    
    async def auto_remediate(self, issues):
        """Automatically fix identified data quality issues."""
        # Agent autonomously decides on remediation actions
        pass

class DataEnrichmentAgent:
    """Autonomous agent that enriches data from external sources."""
    
    async def enrich_accounts(self):
        """Enrich account data with market information."""
        accounts = await self.client.get("account")
        
        for account in accounts:
            enrichment = await self._lookup_market_data(account['name'])
            await self.client.update("account", account['id'], enrichment)
```

### 代理協調模式
```python
# Conceptual pattern - specific APIs pending GA
class DataPipeline:
    """Orchestrates multiple agents working together."""
    
    def __init__(self, client):
        self.quality_agent = DataQualityAgent(client)
        self.enrichment_agent = DataEnrichmentAgent(client)
        self.sync_agent = SyncAgent(client)
    
    async def run(self, table_name):
        """Execute multi-agent workflow."""
        # Step 1: Quality check
        print("Running quality checks...")
        issues = await self.quality_agent.evaluate_data_quality(table_name)
        
        # Step 2: Enrich data
        print("Enriching data...")
        await self.enrichment_agent.enrich_accounts()
        
        # Step 3: Sync to external systems
        print("Syncing to external systems...")
        await self.sync_agent.sync_to_external_db(table_name)
```

---

## 3. 模型上下文協議 (MCP) 支援 (規劃中)

### 什麼是 MCP？

模型上下文協議 (MCP) 是一個開放標準，用於：
- **工具定義** - 描述可用的工具/功能
- **工具呼叫** - 允許大型語言模型 (LLM) 呼叫帶有參數的工具
- **上下文管理** - 管理代理和工具之間的上下文
- **錯誤處理** - 標準化的錯誤回應

### MCP 整合模式 (概念性)

```python
# Conceptual pattern - specific APIs pending GA
from dataverse_mcp import DataverseMCPServer

# Define available tools
tools = [
    {
        "name": "query_accounts",
        "description": "Query accounts with filters",
        "parameters": {
            "filter": "OData filter expression",
            "select": "Columns to retrieve",
            "top": "Maximum records"
        }
    },
    {
        "name": "create_account",
        "description": "Create a new account",
        "parameters": {
            "name": "Account name",
            "credit_limit": "Credit limit amount"
        }
    },
    {
        "name": "update_account",
        "description": "Update account fields",
        "parameters": {
            "account_id": "Account GUID",
            "updates": "Dictionary of field updates"
        }
    }
]

# Create MCP server
server = DataverseMCPServer(client, tools=tools)

# LLMs can now use Dataverse tools
await server.handle_tool_call("query_accounts", {
    "filter": "creditlimit gt 100000",
    "select": ["name", "creditlimit"]
})
```

---

## 4. 代理對代理 (A2A) 協作 (規劃中)

### A2A 通訊模式

```python
# Conceptual pattern - specific APIs pending GA
class DataValidationAgent:
    """Validates data before downstream agents process it."""
    
    async def validate_and_notify(self, data):
        """Validate data and notify other agents."""
        if await self._is_valid(data):
            # Publish event that other agents can subscribe to
            await self.publish_event("data_validated", data)
        else:
            await self.publish_event("validation_failed", data)

class DataProcessingAgent:
    """Waits for valid data from validation agent."""
    
    async def __init__(self):
        self.subscribe("data_validated", self.process_data)
    
    async def process_data(self, data):
        """Process already-validated data."""
        # Agent can safely assume data is valid
        result = await self._transform(data)
        await self.publish_event("processing_complete", result)
```

---

## 5. 建立自主資料代理

### 資料品質代理範例
```python
# Working example with current SDK features
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import InteractiveBrowserCredential
import json

class DataQualityAgent:
    """Monitor and report on data quality."""
    
    def __init__(self, org_url, credential):
        self.client = DataverseClient(org_url, credential)
    
    def analyze_completeness(self, table_name, required_fields):
        """Analyze field completeness."""
        records = self.client.get(
            table_name,
            select=required_fields
        )
        
        missing_by_field = {field: 0 for field in required_fields}
        total = 0
        
        for page in records:
            for record in page:
                total += 1
                for field in required_fields:
                    if field not in record or record[field] is None:
                        missing_by_field[field] += 1
        
        # Calculate completeness percentage
        completeness = {
            field: ((total - count) / total * 100) 
            for field, count in missing_by_field.items()
        }
        
        return {
            'table': table_name,
            'total_records': total,
            'completeness': completeness,
            'missing_counts': missing_by_field
        }
    
    def detect_duplicates(self, table_name, key_fields):
        """Detect potential duplicate records."""
        records = self.client.get(table_name, select=key_fields)
        
        all_records = []
        for page in records:
            all_records.extend(page)
        
        seen = {}
        duplicates = []
        
        for record in all_records:
            key = tuple(record.get(f) for f in key_fields)
            if key in seen:
                duplicates.append({
                    'original_id': seen[key],
                    'duplicate_id': record.get('id'),
                    'key': key
                })
            else:
                seen[key] = record.get('id')
        
        return {
            'table': table_name,
            'duplicate_count': len(duplicates),
            'duplicates': duplicates
        }
    
    def generate_quality_report(self, table_name):
        """Generate comprehensive quality report."""
        completeness = self.analyze_completeness(
            table_name,
            ['name', 'telephone1', 'emailaddress1']
        )
        
        duplicates = self.detect_duplicates(
            table_name,
            ['name', 'emailaddress1']
        )
        
        return {
            'timestamp': pd.Timestamp.now().isoformat(),
            'table': table_name,
            'completeness': completeness,
            'duplicates': duplicates
        }

# Usage
client = DataverseClient("https://<org>.crm.dynamics.com", InteractiveBrowserCredential())
agent = DataQualityAgent("https://<org>.crm.dynamics.com", InteractiveBrowserCredential())

report = agent.generate_quality_report("account")
print(json.dumps(report, indent=2))
```

### 表單預測代理範例
```python
# Conceptual pattern using current SDK capabilities
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

class FormPredictionAgent:
    """Predict and autofill form values."""
    
    def __init__(self, org_url, credential):
        self.client = DataverseClient(org_url, credential)
        self.model = None
    
    def train_on_historical_data(self, table_name, features, target):
        """Train prediction model on historical data."""
        # Collect training data
        records = []
        for page in self.client.get(table_name, select=features + [target]):
            records.extend(page)
        
        df = pd.DataFrame(records)
        
        # Train model
        X = df[features].fillna(0)
        y = df[target]
        
        self.model = RandomForestRegressor()
        self.model.fit(X, y)
        
        return self.model.score(X, y)
    
    def predict_field_values(self, table_name, record_id, features_data):
        """Predict missing field values."""
        if self.model is None:
            raise ValueError("Model not trained. Call train_on_historical_data first.")
        
        # Predict
        prediction = self.model.predict([features_data])[0]
        
        # Return prediction with confidence
        return {
            'record_id': record_id,
            'predicted_value': prediction,
            'confidence': self.model.score([features_data], [prediction])
        }
```

---

## 6. 與 AI/ML 服務整合

### LLM 整合模式
```python
# Using LLM to interpret Dataverse data
from openai import OpenAI

class DataInsightAgent:
    """Use LLM to generate insights from Dataverse data."""
    
    def __init__(self, org_url, credential, openai_key):
        self.client = DataverseClient(org_url, credential)
        self.llm = OpenAI(api_key=openai_key)
    
    def analyze_with_llm(self, table_name, sample_size=100):
        """Analyze data using LLM."""
        # Get sample data
        records = []
        count = 0
        for page in self.client.get(table_name):
            records.extend(page)
            count += len(page)
            if count >= sample_size:
                break
        
        # Create summary for LLM
        summary = f"""
        Table: {table_name}
        Total records sampled: {len(records)}
        
        Sample data:
        {json.dumps(records[:5], indent=2, default=str)}
        
        Provide insights about this data.
        """
        
        # Ask LLM
        response = self.llm.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": summary}]
        )
        
        return response.choices[0].message.content
```

---

## 7. 安全模擬與稽核追蹤

### 規劃功能

SDK 將支援代表特定使用者執行作業：

```python
# Conceptual pattern - specific APIs pending GA
from dataverse_security import ImpersonationContext

# Run as different user
with ImpersonationContext(client, user_id="user-guid"):
    # All operations run as this user
    client.create("account", {"name": "New Account"})
    # Audit trail: Created by [user-guid] at [timestamp]

# Retrieve audit trail
audit_log = client.get_audit_trail(
    table="account",
    record_id="record-guid",
    action="create"
)
```

---

## 8. 合規性與資料治理

### 規劃治理功能

```python
# Conceptual pattern - specific APIs pending GA
from dataverse_governance import DataGovernance

# Define retention policy
governance = DataGovernance(client)
governance.set_retention_policy(
    table="account",
    retention_days=365
)

# Define data classification
governance.classify_columns(
    table="account",
    classifications={
        "name": "Public",
        "telephone1": "Internal",
        "creditlimit": "Confidential"
    }
)

# Enforce policies
governance.enforce_all_policies()
```

---

## 9. 目前 SDK 支援代理工作流程的功能

雖然完整的代理功能仍在預覽中，但目前 SDK 功能已支援代理建構：

### ✅ 現已可用
- **CRUD 作業** - 建立、擷取、更新、刪除資料
- **批次作業** - 有效率地處理大量資料
- **查詢功能** - 用於靈活資料擷取的 OData 和 SQL
- **Metadata 作業** - 處理資料表和資料行定義
- **錯誤處理** - 結構化的例外階層
- **分頁** - 處理大量結果集
- **檔案上傳** - 管理文件附件

### 🔜 即將在 GA 中推出
- 完整的 MCP 整合
- A2A 協作基元
- 增強的驗證/模擬
- 治理政策執行
- 原生 async/await 支援
- 進階快取策略

---

## 10. 開始使用：立即建立您的第一個代理

```python
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import InteractiveBrowserCredential
import json

class SimpleDataAgent:
    """Your first Dataverse agent."""
    
    def __init__(self, org_url):
        credential = InteractiveBrowserCredential()
        self.client = DataverseClient(org_url, credential)
    
    def check_health(self, table_name):
        """Agent function: Check table health."""
        try:
            tables = self.client.list_tables()
            matching = [t for t in tables if t['LogicalName'] == table_name]
            
            if not matching:
                return {"status": "error", "message": f"Table {table_name} not found"}
            
            # Get record count
            records = []
            for page in self.client.get(table_name):
                records.extend(page)
                if len(records) > 1000:
                    break
            
            return {
                "status": "healthy",
                "table": table_name,
                "record_count": len(records),
                "timestamp": pd.Timestamp.now().isoformat()
            }
        
        except Exception as e:
            return {"status": "error", "message": str(e)}

# Usage
agent = SimpleDataAgent("https://<org>.crm.dynamics.com")
health = agent.check_health("account")
print(json.dumps(health, indent=2))
```

---

## 11. 資源與文件

### 官方文件
- [Dataverse SDK for Python 概述](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/overview)
- [處理資料](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/work-data)
- [發行計畫：代理工作流程](https://learn.microsoft.com/zh-tw/power-platform/release-plan/2025wave2/data-platform/build-agentic-flows-dataverse-sdk-python)

### 外部資源
- [模型上下文協議](https://modelcontextprotocol.io/)
- [Azure AI 服務](https://learn.microsoft.com/zh-tw/azure/ai-services/)
- [Python async/await](https://docs.python.org/3/library/asyncio.html)

### 儲存庫
- [SDK 原始程式碼](https://github.com/microsoft/PowerPlatform-DataverseClient-Python)
- [問題與功能要求](https://github.com/microsoft/PowerPlatform-DataverseClient-Python/issues)

---

## 12. 常見問題：代理工作流程

**Q: 我現在可以使用目前的 SDK 建立代理嗎？**
A: 可以！使用目前的功能建立類似代理的系統。完整的 MCP/A2A 支援將在 GA 中推出。

**Q: 目前 SDK 和代理功能有什麼區別？**
A: 目前：同步 CRUD；代理：非同步、自主決策、代理協作。

**Q: 從預覽版到正式發行版會有重大變更嗎？**
A: 可能會有。這是一個預覽功能；預計在正式發行前會對 API 進行改進。

**Q: 我該如何為今天的代理工作流程做準備？**
A: 使用目前的 CRUD 作業建立代理，在設計時考慮非同步模式，並使用 MCP 規範以確保未來的相容性。

**Q: 代理功能的成本會有所不同嗎？**
A: 目前未知。請在接近正式發行時查看發行說明。

---

## 13. 後續步驟

1. **建立原型** 使用目前的 SDK 功能
2. **加入預覽** 當 MCP 整合可用時
3. **透過 GitHub 問題提供回饋**
4. **關注 GA 公告** 及完整的 API 文件
5. **在準備好時遷移到完整的代理功能**

Dataverse SDK for Python 正在將自身定位為在 Microsoft Power Platform 上建立智能、自主資料系統的首選平台。
