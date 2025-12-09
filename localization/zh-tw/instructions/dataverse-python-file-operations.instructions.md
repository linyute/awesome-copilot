# Dataverse SDK for Python - 檔案作業與實務範例

## 概述
本指南詳細介紹了檔案上傳作業、分塊策略，以及使用 PowerPlatform-DataverseClient-Python SDK 的實務範例。

---

## 1. 檔案上傳基礎

### 上傳小檔案 (< 128 MB)
```python
from pathlib import Path
from PowerPlatform.Dataverse.client import DataverseClient

file_path = Path("document.pdf")
record_id = "account-guid"

# 對於小檔案，單一 PATCH 上傳
response = client.upload_file(
    table_name="account",
    record_id=record_id,
    file_column_name="new_documentfile",
    file_path=file_path
)

print(f"上傳成功：{response}")
```

**使用時機：** 128 MB 以下的文件、圖片、PDF

### 上傳帶有分塊的大檔案
```python
from pathlib import Path

file_path = Path("large_video.mp4")
record_id = "account-guid"

# SDK 自動處理大檔案的分塊
response = client.upload_file(
    table_name="account",
    record_id=record_id,
    file_column_name="new_videofile",
    file_path=file_path,
    chunk_size=4 * 1024 * 1024  # 4 MB 分塊
)

print("分塊上傳完成")
```

**使用時機：** 128 MB 以上的大型影片、資料庫、壓縮檔案

### 上傳進度追蹤
```python
import hashlib
from pathlib import Path

def calculate_file_hash(file_path):
    """計算檔案的 SHA-256 雜湊值。"""
    hash_obj = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024*1024), b''):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()

def upload_with_tracking(client, table_name, record_id, column_name, file_path):
    """追蹤檔案上傳並驗證。"""
    file_path = Path(file_path)
    file_size = file_path.stat().st_size
    
    print(f"開始上傳：{file_path.name} ({file_size / 1024 / 1024:.2f} MB)")
    
    # 在上傳前計算雜湊值
    original_hash = calculate_file_hash(file_path)
    print(f"檔案雜湊值：{original_hash}")
    
    # 執行上傳
    response = client.upload_file(
        table_name=table_name,
        record_id=record_id,
        file_column_name=column_name,
        file_path=file_path
    )
    
    print(f"✓ 上傳完成")
    return response

# 用法
upload_with_tracking(client, "account", account_id, "new_documentfile", "report.pdf")
```

---

## 2. 上傳策略與配置

### 自動分塊決策
```python
def upload_file_smart(client, table_name, record_id, column_name, file_path):
    """自動選擇上傳策略。"""
    file_path = Path(file_path)
    file_size = file_path.stat().st_size
    max_single_patch = 128 * 1024 * 1024  # 128 MB
    
    if file_size <= max_single_patch:
        print(f"使用單一 PATCH (檔案 < 128 MB)")
        chunk_size = None  # SDK 將使用單一請求
    else:
        print(f"使用分塊上傳 (檔案 > 128 MB)")
        chunk_size = 4 * 1024 * 1024  # 4 MB 分塊
    
    response = client.upload_file(
        table_name=table_name,
        record_id=record_id,
        file_column_name=column_name,
        file_path=file_path,
        chunk_size=chunk_size
    )
    
    return response

# 用法
upload_file_smart(client, "account", account_id, "new_largemedifile", "video.mp4")
```

### 批次檔案上傳
```python
from pathlib import Path
from PowerPlatform.Dataverse.core.errors import HttpError

def batch_upload_files(client, table_name, record_id, files_dict):
    """
    將多個檔案上傳到相同記錄的不同資料行。
    
    參數：
        table_name：資料表名稱
        record_id：記錄 ID
        files_dict：{"column_name": "file_path", ...}
    
    傳回值：
        {"success": [...], "failed": [...]} 
    """
    results = {"success": [], "failed": []}
    
    for column_name, file_path in files_dict.items():
        try:
            print(f"正在上傳 {Path(file_path).name} 到 {column_name}...")
            response = client.upload_file(
                table_name=table_name,
                record_id=record_id,
                file_column_name=column_name,
                file_path=file_path
            )
            results["success"].append({
                "column": column_name,
                "file": Path(file_path).name,
                "response": response
            })
            print(f"  ✓ 上傳成功")
        except HttpError as e:
            results["failed"].append({
                "column": column_name,
                "file": Path(file_path).name,
                "error": str(e)
            })
            print(f"  ❌ 上傳失敗：{e}")
    
    return results

# 用法
files = {
    "new_contractfile": "contract.pdf",
    "new_specfile": "specification.docx",
    "new_designfile": "design.png"
}
results = batch_upload_files(client, "account", account_id, files)
print(f"成功：{len(results['success'])}, 失敗：{len(results['failed'])}")
```

### 恢復失敗的上傳
```python
from pathlib import Path
import time
from PowerPlatform.Dataverse.core.errors import HttpError

def upload_with_retry(client, table_name, record_id, column_name, file_path, max_retries=3):
    """使用指數退避重試邏輯進行上傳。"""
    file_path = Path(file_path)
    
    for attempt in range(max_retries):
        try:
            print(f"上傳嘗試 {attempt + 1}/{max_retries}：{file_path.name}")
            response = client.upload_file(
                table_name=table_name,
                record_id=record_id,
                file_column_name=column_name,
                file_path=file_path,
                chunk_size=4 * 1024 * 1024
            )
            print(f"✓ 上傳成功")
            return response
        except HttpError as e:
            if attempt == max_retries - 1:
                print(f"❌ 在 {max_retries} 次嘗試後上傳失敗")
                raise
            
            # 指數退避：1s、2s、4s
            backoff_seconds = 2 ** attempt
            print(f"⚠ 上傳失敗。將在 {backoff_seconds} 秒後重試...")
            time.sleep(backoff_seconds)

# 用法
upload_with_retry(client, "account", account_id, "new_documentfile", "contract.pdf")
```

---

## 3. 實務範例

### 範例 1：客戶文件管理系統

```python
from pathlib import Path
from datetime import datetime
from enum import IntEnum
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import ClientSecretCredential

class DocumentType(IntEnum):
    CONTRACT = 1
    INVOICE = 2
    SPECIFICATION = 3
    OTHER = 4

# 設定
credential = ClientSecretCredential(
    tenant_id="tenant-id",
    client_id="client-id",
    client_secret="client-secret"
)
client = DataverseClient("https://yourorg.crm.dynamics.com", credential)

def upload_customer_document(customer_id, doc_path, doc_type):
    """上傳客戶文件。"""
    doc_path = Path(doc_path)
    
    # 建立文件記錄
    doc_record = {
        "new_documentname": doc_path.stem,
        "new_documenttype": doc_type,
        "new_customerid": customer_id,
        "new_uploadeddate": datetime.now().isoformat(),
        "new_filesize": doc_path.stat().st_size
    }
    
    doc_ids = client.create("new_customerdocument", doc_record)
    doc_id = doc_ids[0]
    
    # 上傳檔案
    print(f"正在上傳 {doc_path.name}...")
    client.upload_file(
        table_name="new_customerdocument",
        record_id=doc_id,
        file_column_name="new_documentfile",
        file_path=doc_path
    )
    
    print(f"✓ 文件已上傳並連結到客戶")
    return doc_id

# 用法
customer_id = "customer-guid-here"
doc_id = upload_customer_document(
    customer_id,
    "contract.pdf",
    DocumentType.CONTRACT
)

# 查詢已上傳的文件
docs = client.get(
    "new_customerdocument",
    filter=f"new_customerid eq '{customer_id}'",
    select=["new_documentname", "new_documenttype", "new_uploadeddate"]
)

for page in docs:
    for doc in page:
        print(f"- {doc['new_documentname']} ({doc['new_uploadeddate']})")
```

### 範例 2：帶有縮圖的媒體圖庫

```python
from pathlib import Path
from enum import IntEnum
from PowerPlatform.Dataverse.client import DataverseClient

class MediaType(IntEnum):
    PHOTO = 1
    VIDEO = 2
    DOCUMENT = 3

def create_media_gallery(client, gallery_name, media_files):
    """
    建立包含多個檔案的媒體圖庫。 
    
    參數：
        gallery_name：圖庫名稱
        media_files：[{"file": path, "type": MediaType, "description": text}, ...]
    """
    # 建立圖庫記錄
    gallery_ids = client.create("new_mediagallery", {
        "new_galleryname": gallery_name,
        "new_createddate": datetime.now().isoformat()
    })
    gallery_id = gallery_ids[0]
    
    # 建立並上傳媒體項目
    for media_info in media_files:
        file_path = Path(media_info["file"])
        
        # 建立媒體項目記錄
        item_ids = client.create("new_mediaitem", {
            "new_itemname": file_path.stem,
            "new_mediatype": media_info["type"],
            "new_description": media_info.get("description", ""),
            "new_galleryid": gallery_id,
            "new_filesize": file_path.stat().st_size
        })
        item_id = item_ids[0]
        
        # 上傳媒體檔案
        print(f"正在上傳 {file_path.name}...")
        client.upload_file(
            table_name="new_mediaitem",
            record_id=item_id,
            file_column_name="new_mediafile",
            file_path=file_path
        )
        print(f"  ✓ {file_path.name}")
    
    return gallery_id

# 用法
media_files = [
    {"file": "photo1.jpg", "type": MediaType.PHOTO, "description": "產品照片 1"},
    {"file": "photo2.jpg", "type": MediaType.PHOTO, "description": "產品照片 2"},
    {"file": "demo.mp4", "type": MediaType.VIDEO, "description": "產品示範影片"},
    {"file": "manual.pdf", "type": MediaType.DOCUMENT, "description": "使用者手冊"}
]

gallery_id = create_media_gallery(client, "Q4 產品發布", media_files)
print(f"已建立圖庫：{gallery_id}")
```

### 範例 3：備份與歸檔系統

```python
from pathlib import Path
from datetime import datetime, timedelta
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.errors import DataverseError
import json

def backup_table_data(client, table_name, output_dir):
    """
    將資料表資料備份到 JSON 檔案並建立歸檔記錄。
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    backup_time = datetime.now()
    backup_file = output_dir / f"{table_name}_{backup_time.strftime('%Y%m%d_%H%M%S')}.json"
    
    print(f"正在備份 {table_name}...")
    
    # 擷取所有記錄
    all_records = []
    for page in client.get(table_name, top=5000):
        all_records.extend(page)
    
    # 寫入 JSON
    with open(backup_file, 'w') as f:
        json.dump(all_records, f, indent=2, default=str)
    
    print(f"  ✓ 已匯出 {len(all_records)} 條記錄")
    
    # 在 Dataverse 中建立備份記錄
    backup_ids = client.create("new_backuprecord", {
        "new_tablename": table_name,
        "new_recordcount": len(all_records),
        "new_backupdate": backup_time.isoformat(),
        "new_status": 1  # 已完成
    })
    backup_id = backup_ids[0]
    
    # 上傳備份檔案
    print(f"正在上傳備份檔案...")
    client.upload_file(
        table_name="new_backuprecord",
        record_id=backup_id,
        file_column_name="new_backupfile",
        file_path=backup_file
    )
    
    return backup_id

# 用法
backup_id = backup_table_data(client, "account", "backups")
print(f"已建立備份：{backup_id}")
```

### 範例 4：自動化報告生成與儲存

```python
from pathlib import Path
from datetime import datetime
from enum import IntEnum
from PowerPlatform.Dataverse.client import DataverseClient
import json

class ReportStatus(IntEnum):
    PENDING = 1
    PROCESSING = 2
    COMPLETED = 3
    FAILED = 4

def generate_and_store_report(client, report_type, data):
    """
    從資料生成報告並儲存到 Dataverse。
    """
    report_time = datetime.now()
    
    # 生成報告檔案 (模擬)
    report_file = Path(f"report_{report_type}_{report_time.strftime('%Y%m%d_%H%M%S')}.json")
    with open(report_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    # 建立報告記錄
    report_ids = client.create("new_report", {
        "new_reportname": f"{report_type} 報告",
        "new_reporttype": report_type,
        "new_generateddate": report_time.isoformat(),
        "new_status": ReportStatus.PROCESSING,
        "new_recordcount": len(data.get("records", []))
    })
    report_id = report_ids[0]
    
    try:
        # 上傳報告檔案
        print(f"正在上傳報告：{report_file.name}")
        client.upload_file(
            table_name="new_report",
            record_id=report_id,
            file_column_name="new_reportfile",
            file_path=report_file
        )
        
        # 更新狀態為已完成
        client.update("new_report", report_id, {
            "new_status": ReportStatus.COMPLETED
        })
        
        print(f"✓ 報告已成功儲存")
        return report_id
        
    except Exception as e:
        print(f"❌ 報告生成失敗：{e}")
        client.update("new_report", report_id, {
            "new_status": ReportStatus.FAILED,
            "new_errormessage": str(e)
        })
        raise
    finally:
        # 清理臨時檔案
        report_file.unlink(missing_ok=True)

# 用法
sales_data = {
    "month": "一月",
    "records": [
        {"product": "A", "sales": 10000},
        {"product": "B", "sales": 15000},
        {"product": "C", "sales": 8000}
    ]
}

report_id = generate_and_store_report(client, "SALES_SUMMARY", sales_data)
```

---

## 4. 檔案管理最佳實務

### 檔案大小驗證
```python
from pathlib import Path

def validate_file_for_upload(file_path, max_size_mb=500):
    """在上傳前驗證檔案。"""
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"找不到檔案：{file_path}")
    
    file_size = file_path.stat().st_size
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise ValueError(f"檔案太大：{file_size / 1024 / 1024:.2f} MB > {max_size_mb} MB")
    
    return file_size

# 用法
try:
    size = validate_file_for_upload("document.pdf", max_size_mb=128)
    print(f"檔案有效：{size / 1024 / 1024:.2f} MB")
except (FileNotFoundError, ValueError) as e:
    print(f"驗證失敗：{e}")
```

### 支援的檔案類型驗證
```python
from pathlib import Path

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.jpg', '.png', '.mp4', '.zip'}

def validate_file_type(file_path):
    """驗證檔案副檔名。"""
    file_path = Path(file_path)
    
    if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError(f"不支援的檔案類型：{file_path.suffix}")
    
    return True

# 用法
try:
    validate_file_type("document.pdf")
    print("檔案類型有效")
except ValueError as e:
    print(f"無效：{e}")
```

### 上傳日誌與稽核追蹤
```python
from pathlib import Path
from datetime import datetime
import json

def log_file_upload(table_name, record_id, file_path, status, error=None):
    """記錄檔案上傳以進行稽核追蹤。"""
    file_path = Path(file_path)
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "table": table_name,
        "record_id": record_id,
        "file_name": file_path.name,
        "file_size": file_path.stat().st_size if file_path.exists() else 0,
        "status": status,
        "error": error
    }
    
    # 附加到日誌檔案
    log_file = Path("upload_audit.log")
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + "\n")
    
    return log_entry

# 用於上傳包裝函式
def upload_with_logging(client, table_name, record_id, column_name, file_path):
    """帶有稽核日誌的上傳。"""
    try:
        client.upload_file(
            table_name=table_name,
            record_id=record_id,
            file_column_name=column_name,
            file_path=file_path
        )
        log_file_upload(table_name, record_id, file_path, "成功")
    except Exception as e:
        log_file_upload(table_name, record_id, file_path, "失敗", str(e))
        raise
```

---

## 5. 檔案作業疑難排解

### 常見問題與解決方案

#### 問題：檔案上傳逾時
```python
# 對於非常大的檔案，策略性地增加分塊大小
response = client.upload_file(
    table_name="account",
    record_id=record_id,
    file_column_name="new_file",
    file_path="large_file.zip",
    chunk_size=8 * 1024 * 1024  # 8 MB 分塊
)
```

#### 問題：磁碟空間不足
```python
import shutil
from pathlib import Path

def check_upload_space(file_path):
    """檢查系統是否有足夠的空間容納檔案 + 臨時緩衝區。"""
    file_path = Path(file_path)
    file_size = file_path.stat().st_size
    
    # 獲取磁碟空間
    total, used, free = shutil.disk_usage(file_path.parent)
    
    # 需要 file_size + 10% 緩衝區
    required_space = file_size * 1.1
    
    if free < required_space:
        raise OSError(f"磁碟空間不足：{free / 1024 / 1024:.0f} MB 可用，需要 {required_space / 1024 / 1024:.0f} MB")
    
    return True
```

#### 問題：上傳過程中檔案損毀
```python
import hashlib

def verify_uploaded_file(local_path, remote_data):
    """驗證上傳檔案的完整性。"""
    # 計算本機雜湊值
    with open(local_path, 'rb') as f:
        local_hash = hashlib.sha256(f.read()).hexdigest()
    
    # 與 Metadata 比較
    remote_hash = remote_data.get("new_filehash")
    
    if local_hash != remote_hash:
        raise ValueError("偵測到檔案損毀：雜湊值不符")
    
    return True
```

---

## 參考
- [官方檔案上傳範例](https://github.com/microsoft/PowerPlatform-DataverseClient-Python/blob/main/examples/advanced/file_upload.py)
- [檔案上傳最佳實務](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/file-column-data)
