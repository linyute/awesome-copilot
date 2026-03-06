# Dataverse SDK for Python - Pandas 整合指南

## 概述
本指南旨在將 Dataverse SDK for Python 與 pandas DataFrame 整合，以支援資料科學和分析工作流程。SDK 的 JSON 回應格式可無縫對應到 pandas DataFrame，讓資料科學家能使用熟悉的資料處理工具來處理 Dataverse 資料。

---

## 1. PandasODataClient 簡介

### 什麼是 PandasODataClient？
`PandasODataClient` 是一個標準 `DataverseClient` 的輕薄包裝器，它以 pandas DataFrame 格式回傳資料，而非原始 JSON 字典。這使其非常適合：
- 處理表格資料的資料科學家
- 分析和報告工作流程
- 資料探索和清理
- 與機器學習管線整合

### 安裝需求
```bash
# 安裝核心相依套件
pip install PowerPlatform-Dataverse-Client
pip install azure-identity

# 安裝 pandas 進行資料處理
pip install pandas
```

### 何時使用 PandasODataClient
✅ **在以下情況下使用：**
- 資料探索和分析
- 處理表格資料
- 與統計/機器學習函式庫整合
- 高效率的資料處理

❌ **在以下情況下改用 DataverseClient：**
- 僅需要即時 CRUD 作業
- 檔案上傳作業
- Metadata 作業
- 單一記錄作業

---

## 2. 基本 DataFrame 工作流程

### 將查詢結果轉換為 DataFrame
```python
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient
import pandas as pd

# 設定驗證
base_url = "https://<myorg>.crm.dynamics.com"
credential = InteractiveBrowserCredential()
client = DataverseClient(base_url=base_url, credential=credential)

# 查詢資料
pages = client.get(
    "account",
    select=["accountid", "name", "creditlimit", "telephone1"],
    filter="statecode eq 0",
    orderby=["name"]
)

# 將所有頁面收集到一個 DataFrame 中
all_records = []
for page in pages:
    all_records.extend(page)

# 轉換為 DataFrame
df = pd.DataFrame(all_records)

# 顯示前幾行
print(df.head())
print(f"總記錄數：{len(df)}")
```

### 查詢參數對應到 DataFrame
```python
# 所有查詢參數都以資料行形式在 DataFrame 中回傳
df = pd.DataFrame(
    client.get(
        "account",
        select=["accountid", "name", "creditlimit", "telephone1", "createdon"],
        filter="creditlimit > 50000",
        orderby=["creditlimit desc"]
    )
)

# 結果是一個 DataFrame，包含以下資料行：
# accountid | name | creditlimit | telephone1 | createdon
```

---

## 3. 使用 Pandas 探索資料

### 基本探索
```python
import pandas as pd
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient

client = DataverseClient("https://<myorg>.crm.dynamics.com", InteractiveBrowserCredential())

# 載入帳戶資料
records = []
for page in client.get("account", select=["accountid", "name", "creditlimit", "industrycode"]):
    records.extend(page)

df = pd.DataFrame(records)

# 探索資料
print(df.shape)           # (1000, 4)
print(df.dtypes)          # 資料型別
print(df.describe())      # 統計摘要
print(df.info())          # 資料行資訊和空值計數
print(df.head(10))        # 前 10 行
```

### 篩選與選取
```python
# 依條件篩選列
high_value = df[df['creditlimit'] > 100000]

# 選取特定資料行
names_limits = df[['name', 'creditlimit']]

# 多重條件
filtered = df[(df['creditlimit'] > 50000) & (df['industrycode'] == 1)]

# 值計數
print(df['industrycode'].value_counts())
```

### 排序與分組
```python
# 依資料行排序
sorted_df = df.sort_values('creditlimit', ascending=False)

# 依分組並彙總
by_industry = df.groupby('industrycode').agg({
    'creditlimit': ['mean', 'sum', 'count'],
    'name': 'count'
})

# 分組統計
print(df.groupby('industrycode')['creditlimit'].describe())
```

### 資料清理
```python
# 處理遺失值
df_clean = df.dropna()                    # 移除含有 NaN 的列
df_filled = df.fillna(0)                  # 將 NaN 填入 0
df_ffill = df.fillna(method='ffill')      # 向前填入

# 檢查重複項
duplicates = df[df.duplicated(['name'])]
df_unique = df.drop_duplicates()

# 資料類型轉換
df['creditlimit'] = pd.to_numeric(df['creditlimit'])
df['createdon'] = pd.to_datetime(df['createdon'])
```

---

## 4. 資料分析模式

### 聚合與摘要
```python
# 建立摘要報告
summary = df.groupby('industrycode').agg({
    'accountid': 'count',
    'creditlimit': ['mean', 'min', 'max', 'sum'],
    'name': lambda x: ', '.join(x.head(3))  # 範例名稱
}).round(2)

print(summary)
```

### 時間序列分析
```python
# 轉換為日期時間
df['createdon'] = pd.to_datetime(df['createdon'])

# 重新取樣為每月
monthly = df.set_index('createdon').resample('M').size()

# 提取日期元件
df['year'] = df['createdon'].dt.year
df['month'] = df['createdon'].dt.month
df['day_of_week'] = df['createdon'].dt.day_name()
```

### 聯結與合併作業
```python
# 載入兩個相關的資料表
accounts = pd.DataFrame(client.get("account", select=["accountid", "name"]))
contacts = pd.DataFrame(client.get("contact", select=["contactid", "parentcustomerid", "fullname"]))

# 依關係合併
merged = accounts.merge(
    contacts,
    left_on='accountid',
    right_on='parentcustomerid',
    how='left'
)

print(merged.head())
```

### 統計分析
```python
# 關聯矩陣
correlation = df[['creditlimit', 'industrycode']].corr()

# 分佈分析
print(df['creditlimit'].describe())
print(df['creditlimit'].skew())
print(df['creditlimit'].kurtosis())

# 百分位數
print(df['creditlimit'].quantile([0.25, 0.5, 0.75]))
```

---

## 5. 樞紐分析表與報告

### 建立樞紐分析表
```python
# 依產業和狀態建立樞紐分析表
pivot = pd.pivot_table(
    df,
    values='creditlimit',
    index='industrycode',
    columns='statecode',
    aggfunc=['sum', 'mean', 'count']
)

print(pivot)
```

### 生成報告
```python
# 依產業劃分的銷售報告
industry_report = df.groupby('industrycode').agg({
    'accountid': 'count',
    'creditlimit': 'sum',
    'name': 'first' # 範例名稱
}).rename(columns={
    'accountid': '帳戶計數',
    'creditlimit': '總信用額度',
    'name': '範例帳戶'
})

# 匯出到 CSV
industry_report.to_csv('industry_report.csv')

# 匯出到 Excel
industry_report.to_excel('industry_report.xlsx')
```

---

## 6. 資料視覺化

### Matplotlib 整合
```python
import matplotlib.pyplot as plt

# 建立視覺化
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 長條圖
df['creditlimit'].hist(bins=30, ax=axes[0, 0])
axes[0, 0].set_title('信用額度分佈')

# 柱狀圖
df['industrycode'].value_counts().plot(kind='bar', ax=axes[0, 1])
axes[0, 1].set_title('依產業劃分的帳戶')

# 箱形圖
df.boxplot(column='creditlimit', by='industrycode', ax=axes[1, 0])
axes[1, 0].set_title('依產業劃分的信用額度')

# 散佈圖
df.plot.scatter(x='creditlimit', y='industrycode', ax=axes[1, 1])
axes[1, 1].set_title('信用額度與產業')

plt.tight_layout()
plt.show()
```

### Seaborn 整合
```python
import seaborn as sns

# 相關熱圖
plt.figure(figsize=(8, 6))
sns.heatmap(df[['creditlimit', 'industrycode']].corr(), annot=True)
plt.title('相關矩陣')
plt.show()

# 分佈圖
sns.distplot(df['creditlimit'], kde=True)
plt.title('信用額度分佈')
plt.show()
```

---

## 7. 機器學習整合

### 準備用於機器學習的資料
```python
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# 載入並準備資料
records = []
for page in client.get("account", select=["accountid", "creditlimit", "industrycode", "statecode"]):
    records.extend(page)

df = pd.DataFrame(records)

# 特徵工程
df['log_creditlimit'] = np.log1p(df['creditlimit'])
df['industry_cat'] = pd.Categorical(df['industrycode']).codes

# 分割特徵和目標
X = df[['industrycode', 'log_creditlimit']]
y = df['statecode']

# 訓練-測試分割
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

print(f"訓練集：{len(X_train)}，測試集：{len(X_test)}")
```

### 建立分類模型
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# 訓練模型
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# 評估
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# 特徵重要性
importances = pd.Series(
    model.feature_importances_,
    index=X.columns
).sort_values(ascending=False)

print(importances)
```

---

## 8. 進階 DataFrame 作業

### 自訂函式
```python
# 將函式應用於資料行
df['name_length'] = df['name'].apply(len)

# 將函式應用於列
df['category'] = df.apply(
    lambda row: '高' if row['creditlimit'] > 100000 else '低',
    axis=1
)

# 條件式作業
df['adjusted_limit'] = df['creditlimit'].where(
    df['statecode'] == 0,
    df['creditlimit'] * 0.5
)
```

### 字串作業
```python
# 字串方法
df['name_upper'] = df['name'].str.upper()
df['name_starts'] = df['name'].str.startswith('A')
df['name_contains'] = df['name'].str.contains('Inc')
df['name_split'] = df['name'].str.split(',').str[0]

# 取代和替代
df['industry'] = df['industrycode'].map({
    1: '零售',
    2: '製造',
    3: '科技'
})
```

### 重塑資料
```python
# 轉置
transposed = df.set_index('name').T

# 堆疊/取消堆疊
stacked = df.set_index(['name', 'industrycode'])['creditlimit'].unstack()

# 熔化成長格式
melted = pd.melt(df, id_vars=['name'], var_name='metric', value_name='value')
```

---

## 9. 效能最佳化

### 高效率資料載入
```python
# 以分塊方式載入大型資料集
all_records = []
chunk_size = 1000

for page in client.get(
    "account",
    select=["accountid", "name", "creditlimit"],
    top=10000,        # 限制總記錄數
    page_size=chunk_size
):
    all_records.extend(page)
    if len(all_records) % 5000 == 0:
        print(f"已載入 {len(all_records)} 條記錄")

df = pd.DataFrame(all_records)
print(f"總計：{len(df)} 條記錄")
```

### 記憶體最佳化
```python
# 減少記憶體使用
# 對於重複值使用分類
df['industrycode'] = df['industrycode'].astype('category')

# 使用適當的數值類型
df['creditlimit'] = pd.to_numeric(df['creditlimit'], downcast='float')

# 刪除不再需要的資料行
df = df.drop(columns=['unused_col1', 'unused_col2'])

# 檢查記憶體使用量
print(df.memory_usage(deep=True).sum() / 1024**2, "MB")
```

### 查詢最佳化
```python
# 在伺服器上應用篩選，而不是用戶端
# ✅ 好：在伺服器上篩選
accounts = client.get(
    "account",
    filter="creditlimit > 50000",  # 伺服器端篩選
    select=["accountid", "name", "creditlimit"]
)

# ❌ 壞：載入所有，然後在本機篩選
all_accounts = client.get("account")  # 載入所有內容
filtered = [a for a in all_accounts if a['creditlimit'] > 50000]  # 用戶端篩選
```

---

## 10. 完整範例：銷售分析

```python
import pandas as pd
import numpy as np
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient

# 設定
client = DataverseClient(
    "https://<myorg>.crm.dynamics.com",
    InteractiveBrowserCredential()
)

# 載入資料
print("正在載入帳戶資料...")
records = []
for page in client.get(
    "account",
    select=["accountid", "name", "creditlimit", "industrycode", "statecode", "createdon"],
    orderby=["createdon"]
):
    records.extend(page)

df = pd.DataFrame(records)
df['createdon'] = pd.to_datetime(df['createdon'])

# 資料清理
df = df.dropna()

# 特徵工程
df['year'] = df['createdon'].dt.year
df['month'] = df['createdon'].dt.month
df['year_month'] = df['createdon'].dt.to_period('M')

# 分析
print("\n=== 帳戶概覽 ===")
print(f"總帳戶數：{len(df)}")
print(f"總信用額度：${df['creditlimit'].sum():,.2f}")
print(f"平均信用額度：${df['creditlimit'].mean():,.2f}")

print("\n=== 依產業別 ===")
industry_summary = df.groupby('industrycode').agg({
    'accountid': 'count',
    'creditlimit': ['sum', 'mean']
}).round(2)
print(industry_summary)

print("\n=== 依狀態別 ===")
status_summary = df.groupby('statecode').agg({
    'accountid': 'count',
    'creditlimit': 'sum'
})
print(status_summary)

# 匯出報告
print("\n=== 正在匯出報告 ===")
industry_summary.to_csv('industry_analysis.csv')
print("報告已儲存到 industry_analysis.csv")
```

---

## 11. 已知限制

- `PandasODataClient` 目前需要從查詢結果手動建立 DataFrame
- 非常大的 DataFrame (數百萬行) 可能會遇到記憶體限制
- Pandas 作業是在用戶端執行；對於大型資料集，伺服器端聚合效率更高
- 檔案作業需要標準 `DataverseClient`，而不是 pandas 包裝器

---

## 12. 相關資源

- [Pandas 文件](https://pandas.pydata.org/docs/)
- [官方範例：quickstart_pandas.py](https://github.com/microsoft/PowerPlatform-DataverseClient-Python/blob/main/examples/quickstart_pandas.py)
- [SDK for Python README](https://github.com/microsoft/PowerPlatform-DataverseClient-Python/blob/main/README.md)
- [Microsoft Learn：處理資料](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/work-data)
