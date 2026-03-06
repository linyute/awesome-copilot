---
name: datanalysis-credit-risk
description: 適用於貸前建模的信用風險資料清洗和變數篩選管線。當處理需要品質評估、缺失值分析或建模前變數選擇的原始信用資料時使用。它涵蓋資料載入與格式化、異常期間篩選、缺失率計算、高缺失變數移除、低 IV 變數篩選、高 PSI 變數移除、Null Importance 去噪、高相關性變數移除，以及清洗報告產生。適用情境為信用風險資料清洗、變數篩選、貸前建模預處理。
---

# 資料清洗與變數篩選 (Data Cleaning and Variable Screening)

## 快速入門 (Quick Start)

```bash
# 執行完整的資料清洗管線
python ".github/skills/datanalysis-credit-risk/scripts/example.py"
```

## 完整流程說明 (Complete Process Description)

資料清洗管線由以下 11 個步驟組成，每個步驟皆獨立執行且不會刪除原始資料：

1. **獲取資料 (Get Data)** - 載入並格式化原始資料
2. **機構樣本分析 (Organization Sample Analysis)** - 統計每個機構的樣本數和壞樣本率
3. **分離 OOS 資料 (Separate OOS Data)** - 將樣本外 (OOS) 樣本與建模樣本分離
4. **篩選異常月份 (Filter Abnormal Months)** - 移除壞樣本數或總樣本數不足的月份
5. **計算缺失率 (Calculate Missing Rate)** - 為每個特徵計算整體和機構級別的缺失率
6. **剔除高缺失率特徵 (Drop High Missing Rate Features)** - 移除整體缺失率超過閾值的特徵
7. **剔除低 IV 特徵 (Drop Low IV Features)** - 移除整體 IV 太低或在太多機構中 IV 太低的特徵
8. **剔除高 PSI 特徵 (Drop High PSI Features)** - 移除 PSI 不穩定的特徵
9. **Null Importance 去噪 (Null Importance Denoising)** - 使用標籤置換法移除噪聲特徵
10. **剔除高相關性特徵 (Drop High Correlation Features)** - 根據原始 gain 移除高相關性特徵
11. **匯出報告 (Export Report)** - 產生包含所有步驟詳細資訊和統計資料的 Excel 報告

## 核心函式 (Core Functions)

| 函式 | 目的 | 模組 |
|------|------|----------|
| `get_dataset()` | 載入並格式化資料 | references.func |
| `org_analysis()` | 機構樣本分析 | references.func |
| `missing_check()` | 計算缺失率 | references.func |
| `drop_abnormal_ym()` | 篩選異常月份 | references.analysis |
| `drop_highmiss_features()` | 剔除高缺失率特徵 | references.analysis |
| `drop_lowiv_features()` | 剔除低 IV 特徵 | references.analysis |
| `drop_highpsi_features()` | 剔除高 PSI 特徵 | references.analysis |
| `drop_highnoise_features()` | Null Importance 去噪 | references.analysis |
| `drop_highcorr_features()` | 剔除高相關性特徵 | references.analysis |
| `iv_distribution_by_org()` | IV 分佈統計 | references.analysis |
| `psi_distribution_by_org()` | PSI 分佈統計 | references.analysis |
| `value_ratio_distribution_by_org()` | 有值率分佈統計 | references.analysis |
| `export_cleaning_report()` | 匯出清洗報告 | references.analysis |

## 參數說明 (Parameter Description)

### 資料載入參數 (Data Loading Parameters)
- `DATA_PATH`: 資料檔案路徑（最好是 parquet 格式）
- `DATE_COL`: 日期欄位名稱
- `Y_COL`: 標籤欄位名稱
- `ORG_COL`: 機構欄位名稱
- `KEY_COLS`: 主鍵欄位名稱清單

### OOS 機構設定 (OOS Organization Configuration)
- `OOS_ORGS`: 樣本外機構清單

### 異常月份篩選參數 (Abnormal Month Filtering Parameters)
- `min_ym_bad_sample`: 每月最小壞樣本數（預設 10）
- `min_ym_sample`: 每月最小總樣本數（預設 500）

### 缺失率參數 (Missing Rate Parameters)
- `missing_ratio`: 整體缺失率閾值（預設 0.6）

### IV 參數 (IV Parameters)
- `overall_iv_threshold`: 整體 IV 閾值（預設 0.1）
- `org_iv_threshold`: 單一機構 IV 閾值（預設 0.1）
- `max_org_threshold`: 可容忍的低 IV 機構最大數量（預設 2）

### PSI 參數 (PSI Parameters)
- `psi_threshold`: PSI 閾值（預設 0.1）
- `max_months_ratio`: 最大不穩定月份比例（預設 1/3）
- `max_orgs`: 最大不穩定機構數量（預設 6）

### Null Importance 參數 (Null Importance Parameters)
- `n_estimators`: 樹的數量（預設 100）
- `max_depth`: 最大樹深度（預設 5）
- `gain_threshold`: Gain 差異閾值（預設 50）

### 高相關性參數 (High Correlation Parameters)
- `max_corr`: 相關性閾值（預設 0.9）
- `top_n_keep`: 依原始 gain 排名保留的前 N 個特徵（預設 20）

## 輸出報告 (Output Report)

產生的 Excel 報告包含以下工作表：

1. **彙總** - 所有步驟的摘要資訊，包括操作結果與條件
2. **機構樣本統計** - 每個機構的樣本數和壞樣本率
3. **分離 OOS 資料** - OOS 樣本和建模樣本計數
4. **Step4-異常月份處理** - 被移除的異常月份
5. **缺失率明細** - 每個特徵的整體和機構級別缺失率
6. **Step5-有值率分佈統計** - 特徵在不同有值率範圍內的分佈
7. **Step6-高缺失率處理** - 被移除的高缺失率特徵
8. **Step7-IV 明細** - 每個特徵在各個機構及整體的 IV 值
9. **Step7-IV 處理** - 不符合 IV 條件的特徵及低 IV 機構
10. **Step7-IV 分佈統計** - 特徵在不同 IV 範圍內的分佈
11. **Step8-PSI 明細** - 每個特徵在各機構每個月的 PSI 值
12. **Step8-PSI 處理** - 不符合 PSI 條件的特徵及不穩定機構
13. **Step8-PSI 分佈統計** - 特徵在不同 PSI 範圍內的分佈
14. **Step9-null importance 處理** - 被移除的噪聲特徵
15. **Step10-高相關性剔除** - 被移除的高相關性特徵

## 特色 (Features)

- **互動式輸入**：可在每個步驟執行前輸入參數，並支援預設值
- **獨立執行**：每個步驟皆獨立執行且不刪除原始資料，方便進行對照分析
- **完整報告**：產生包含詳細資訊、統計資料和分佈情形的完整 Excel 報告
- **多程序支援**：IV 和 PSI 計算支援多程序加速
- **機構級別分析**：支援機構級別的統計以及建模/OOS 的區分
