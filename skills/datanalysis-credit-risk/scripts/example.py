#!/usr/bin/env python3
"""
執行指令碼
版本：1.0.0
上次修改時間：2026-03-02
"""
import os, sys
import time
import pandas as pd
from typing import Dict, List, Optional, Any, Callable
import numpy as np
import multiprocessing

# =============================================================================
# 系統設定
# =============================================================================
CPU_COUNT = multiprocessing.cpu_count()
N_JOBS = max(1, CPU_COUNT - 1)  # 多程序並行數量，保留 1 個核心給系統

def _ensure_references_on_path():
    script_dir = os.path.dirname(__file__)
    cur = script_dir
    for _ in range(8):
        candidate = os.path.join(cur, 'references')
        if os.path.isdir(candidate):
            # 將父資料夾 (包含 `references`) 加入 sys.path
            sys.path.insert(0, cur)
            return
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    # 備用方案：加入一個合理的 repo-root 猜測值
    sys.path.insert(0, os.path.abspath(os.path.join(script_dir, '..', '..', '..')))


_ensure_references_on_path()

from references.func import get_dataset, missing_check, org_analysis
from references.analysis import (drop_abnormal_ym, drop_highmiss_features,
                               drop_lowiv_features, drop_highcorr_features,
                               drop_highpsi_features,
                               drop_highnoise_features,
                               export_cleaning_report,
                               iv_distribution_by_org,
                               psi_distribution_by_org,
                               value_ratio_distribution_by_org)

# ==================== 路徑設定 (互動式輸入) ====================
# 預設使用 50 欄位的測試資料，支援在命令列中進行互動式修改
default_data_path = ''
default_output_dir = ''

def _get_path_input(prompt, default):
    try:
        user_val = input(f"{prompt} (預設：{default}): ").strip()
    except Exception:
        user_val = ''
    return user_val if user_val else default

DATA_PATH = _get_path_input('請輸入資料檔案路徑 DATA_PATH', default_data_path)
OUTPUT_DIR = _get_path_input('請輸入輸出目錄 OUTPUT_DIR', default_output_dir)
REPORT_PATH = os.path.join(OUTPUT_DIR, '資料清洗報告.xlsx')

# 資料欄位名稱設定 (根據實際資料調整)
DATE_COL = _get_path_input('請輸入資料中的日期欄位名稱', 'apply_date')
Y_COL = _get_path_input('請輸入資料中的標籤欄位名稱', 'target')
ORG_COL = _get_path_input('請輸入資料中的機構欄位名稱', 'org_info')

# 支援多個主鍵欄位名稱輸入 (逗號或空格分隔)
def _get_list_input(prompt, default):
    try:
        user_val = input(f"{prompt} (預設：{default}): ").strip()
    except Exception:
        user_val = ''
    if not user_val:
        user_val = default
    # 支援逗號或空格分隔
    parts = [p.strip() for p in user_val.replace(',', ' ').split() if p.strip()]
    return parts

KEY_COLS = _get_list_input('請輸入資料中的主鍵欄位名稱 (多個欄位以逗號或空格分隔)', 'record_id')

# ==================== 多程序設定資訊 ====================
print("=" * 60)
print("多程序設定")
print("=" * 60)
print(f"   本地 CPU 核心數：{CPU_COUNT}")
print(f"   當前程序數量：{N_JOBS}")
print("=" * 60)

# ==================== OOS 機構設定 (互動式輸入) ====================
# 預設貸外機構清單，使用者可在互動過程中輸入自定義清單 (逗號分隔格式)
default_oos = [
   'orgA', 'orgB', 'orgC', 'orgD', 'orgE',
]

try:
    oos_input = input('請輸入貸外機構清單，以逗號分隔 (按 Enter 使用預設清單)：').strip()
except Exception:
    oos_input = ''
if oos_input:
    OOS_ORGS = [s.strip() for s in oos_input.split(',') if s.strip()]
else:
    OOS_ORGS = default_oos

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==================== 互動式超參數輸入 ====================
def get_user_input(prompt, default, dtype=float):
    """獲取使用者輸入，支援預設值和類型轉換"""
    while True:
        try:
            user_input = input(f"{prompt} (預設：{default}): ").strip()
            if not user_input:
                return default
            return dtype(user_input)
        except ValueError:
            print(f"   輸入無效，請輸入 {dtype.__name__} 類型")

# 記錄清洗步驟
steps = []

# 儲存每個步驟的參數
params = {}

# 計時器裝飾器
def timer(step_name):
    """計時器裝飾器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"\n正在開始 {step_name}...")
            start_time = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time
            print(f"   {step_name} 耗時：{elapsed:.2f} 秒")
            return result
        return wrapper
    return decorator

# ==================== 步驟 1：獲取資料 ====================
print("\n" + "=" * 60)
print("步驟 1：獲取資料")
print("=" * 60)
step_start = time.time()
# 使用 global_parameters 中的設定
data = get_dataset(
    data_pth=DATA_PATH,
    date_colName=DATE_COL,
    y_colName=Y_COL,
    org_colName=ORG_COL,
    data_encode='utf-8',
    key_colNames=KEY_COLS,
    drop_colNames=[],
    miss_vals=[-1, -999, -1111]
)
print(f"   原始資料：{data.shape}")
print(f"   異常值已替換為 NaN：[-1, -999, -1111]")
print(f"   步驟 1 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 2：機構樣本分析 ====================
print("\n" + "=" * 60)
print("步驟 2：機構樣本分析")
print("=" * 60)
step_start = time.time()
org_stat = org_analysis(data, oos_orgs=OOS_ORGS)
steps.append(('機構樣本統計', org_stat))
print(f"   機構數量：{data['new_org'].nunique()}，月份數量：{data['new_date_ym'].nunique()}")
print(f"   貸外機構數量：{len(OOS_ORGS)}")
print(f"   步驟 2 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 3：分離 OOS 資料 ====================
print("\n" + "=" * 60)
print("步驟 3：分離 OOS 資料")
print("=" * 60)
step_start = time.time()
oos_data = data[data['new_org'].isin(OOS_ORGS)]
data = data[~data['new_org'].isin(OOS_ORGS)]
print(f"   OOS 樣本：{oos_data.shape[0]} 行")
print(f"   建模樣本：{data.shape[0]} 行")
print(f"   貸外機構：{OOS_ORGS}")
print(f"   步驟 3 耗時：{time.time() - step_start:.2f} 秒")
# 建立分離資訊 DataFrame
oos_info = pd.DataFrame({'變數': ['OOS樣本', '建模樣本'], '數量': [oos_data.shape[0], data.shape[0]]})
steps.append(('分離OOS資料', oos_info))

# ==================== 步驟 4：篩選異常月份 (僅限建模資料) ====================
print("\n" + "=" * 60)
print("步驟 4：篩選異常月份 (僅限建模資料)")
print("=" * 60)
print("   按 Enter 使用預設值")
print("=" * 60)
params['min_ym_bad_sample'] = int(get_user_input("壞樣本數閾值", 10, int))
params['min_ym_sample'] = int(get_user_input("總樣本數閾值", 500, int))
step_start = time.time()
data_filtered, abnormal_ym = drop_abnormal_ym(data.copy(), min_ym_bad_sample=params['min_ym_bad_sample'], min_ym_sample=params['min_ym_sample'])
steps.append(('Step4-異常月份處理', abnormal_ym))
print(f"   篩選後：{data_filtered.shape}")
print(f"   參數：min_ym_bad_sample={params['min_ym_bad_sample']}, min_ym_sample={params['min_ym_sample']}")
if len(abnormal_ym) > 0:
    print(f"   已剔除月份：{abnormal_ym['年月'].tolist()}")
    print(f"   移除條件：{abnormal_ym['去除條件'].tolist()}")
print(f"   步驟 4 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 5：計算缺失率 ====================
print("\n" + "=" * 60)
print("步驟 5：計算缺失率")
print("=" * 60)
step_start = time.time()
orgs = data['new_org'].unique().tolist()
channel = {'整體': orgs}
miss_detail, miss_channel = missing_check(data, channel=channel)
# miss_detail: 缺失率明細 (格式：特徵、整體、org1, org2, ..., orgn)
# miss_channel: 整體缺失率
steps.append(('缺失率明細', miss_detail))
print(f"   特徵數量：{len(miss_detail['變數'].unique())}")
print(f"   機構數量：{len(miss_detail.columns) - 2}")  # 減去 '變數' 和 '整體' 兩欄
print(f"   步驟 5 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 6：剔除高缺失率特徵 ====================
print("\n" + "=" * 60)
print("步驟 6：剔除高缺失率特徵")
print("=" * 60)
print("   按 Enter 使用預設值")
print("=" * 60)
params['missing_ratio'] = get_user_input("缺失率閾值", 0.6)
step_start = time.time()
data_miss, dropped_miss = drop_highmiss_features(data.copy(), miss_channel, threshold=params['missing_ratio'])
steps.append(('Step6-高缺失率處理', dropped_miss))
print(f"   已剔除：{len(dropped_miss)}")
print(f"   閾值：{params['missing_ratio']}")
if len(dropped_miss) > 0:
    print(f"   已剔除特徵：{dropped_miss['變數'].tolist()[:5]}...")
    print(f"   移除條件：{dropped_miss['去除條件'].tolist()[:5]}...")
print(f"   步驟 6 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 7：剔除低 IV 特徵 ====================
print("\n" + "=" * 60)
print("步驟 7：剔除低 IV 特徵")
print("=" * 60)
print("   按 Enter 使用預設值")
print("=" * 60)
params['overall_iv_threshold'] = get_user_input("整體 IV 閾值", 0.1)
params['org_iv_threshold'] = get_user_input("單一機構 IV 閾值", 0.1)
params['max_org_threshold'] = int(get_user_input("最大容忍低 IV 機構數量", 2, int))
step_start = time.time()
# 獲取特徵列表 (使用所有特徵)
features = [c for c in data.columns if c.startswith('i_')]
data_iv, iv_detail, iv_process = drop_lowiv_features(
    data.copy(), features,
    overall_iv_threshold=params['overall_iv_threshold'],
    org_iv_threshold=params['org_iv_threshold'],
    max_org_threshold=params['max_org_threshold'],
    n_jobs=N_JOBS
)
# iv_detail: IV 明細 (每個特徵在每個機構及整體的 IV 值)
# iv_process: IV 處理表 (不符合條件的特徵)
steps.append(('Step7-IV處理', iv_process))
print(f"   已剔除：{len(iv_process)}")
print(f"   參數：overall_iv_threshold={params['overall_iv_threshold']}, org_iv_threshold={params['org_iv_threshold']}, max_org_threshold={params['max_org_threshold']}")
if len(iv_process) > 0:
    print(f"   已剔除特徵：{iv_process['變數'].tolist()[:5]}...")
    print(f"   處理原因：{iv_process['處理原因'].tolist()[:5]}...")
print(f"   步驟 7 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 8：剔除高 PSI 特徵 ====================
print("\n" + "=" * 60)
print("步驟 8：剔除高 PSI 特徵 (按機構 + 逐月)")
print("=" * 60)
print("   按 Enter 使用預設值")
print("=" * 60)
params['psi_threshold'] = get_user_input("PSI 閾值", 0.1)
params['max_months_ratio'] = get_user_input("最大不穩定月份比例", 1/3)
params['max_orgs'] = int(get_user_input("最大不穩定機構數量", 6, int))
step_start = time.time()
# 獲取 PSI 計算前的特徵 (使用所有特徵)
features_for_psi = [c for c in data.columns if c.startswith('i_')]
data_psi, psi_detail, psi_process = drop_highpsi_features(
    data.copy(), features_for_psi,
    psi_threshold=params['psi_threshold'],
    max_months_ratio=params['max_months_ratio'],
    max_orgs=params['max_orgs'],
    min_sample_per_month=100,
    n_jobs=N_JOBS
)
# psi_detail: PSI 明細 (每個特徵在每個機構每個月份的 PSI 值)
# psi_process: PSI 處理表 (不符合條件的特徵)
steps.append(('Step8-PSI處理', psi_process))
print(f"   已剔除：{len(psi_process)}")
print(f"   參數：psi_threshold={params['psi_threshold']}, max_months_ratio={params['max_months_ratio']:.2f}, max_orgs={params['max_orgs']}")
if len(psi_process) > 0:
    print(f"   已剔除特徵：{psi_process['變數'].tolist()[:5]}...")
    print(f"   處理原因：{psi_process['處理原因'].tolist()[:5]}...")
print(f"   PSI 明細：{len(psi_detail)} 筆記錄")
print(f"   步驟 8 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 9：Null Importance 去噪 ====================
print("\n" + "=" * 60)
print("步驟 9：Null Importance 移除高雜訊特徵")
print("=" * 60)
print("   按 Enter 使用預設值")
print("=" * 60)
params['n_estimators'] = int(get_user_input("樹的數量", 100, int))
params['max_depth'] = int(get_user_input("最大樹深度", 5, int))
params['gain_threshold'] = get_user_input("增益差值閾值", 50)
step_start = time.time()
# 獲取特徵列表 (使用所有特徵)
features = [c for c in data.columns if c.startswith('i_')]
data_noise, dropped_noise = drop_highnoise_features(data.copy(), features, n_estimators=params['n_estimators'], max_depth=params['max_depth'], gain_threshold=params['gain_threshold'])
steps.append(('Step9-null importance處理', dropped_noise))
print(f"   已剔除：{len(dropped_noise)}")
print(f"   參數：n_estimators={params['n_estimators']}, max_depth={params['max_depth']}, gain_threshold={params['gain_threshold']}")
if len(dropped_noise) > 0:
    print(f"   已剔除特徵：{dropped_noise['變數'].tolist()}")
print(f"   步驟 9 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 10：剔除高相關性特徵 (基於 Null Importance 原始增益) ====================
print("\n" + "=" * 60)
print("步驟 10：剔除高相關性特徵 (基於 Null Importance 原始增益)")
print("=" * 60)
print("   按 Enter 使用預設值")
print("=" * 60)
params['max_corr'] = get_user_input("相關性閾值", 0.9)
params['top_n_keep'] = int(get_user_input("按原始增益排名保留前 N 個特徵", 20, int))
step_start = time.time()
# 獲取特徵列表 (使用所有特徵)
features = [c for c in data.columns if c.startswith('i_')]
# 從 null importance 結果中獲取原始增益
if len(dropped_noise) > 0 and '原始gain' in dropped_noise.columns:
    gain_dict = dict(zip(dropped_noise['變數'], dropped_noise['原始gain']))
else:
    gain_dict = {}
data_corr, dropped_corr = drop_highcorr_features(data.copy(), features, threshold=params['max_corr'], gain_dict=gain_dict, top_n_keep=params['top_n_keep'])
steps.append(('Step10-高相關性剔除', dropped_corr))
print(f"   已剔除：{len(dropped_corr)}")
print(f"   閾值：{params['max_corr']}")
if len(dropped_corr) > 0:
    print(f"   已剔除特徵：{dropped_corr['變數'].tolist()}")
    print(f"   移除條件：{dropped_corr['去除條件'].tolist()[:5]}...")
print(f"   步驟 10 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 步驟 11：匯出報告 ====================
print("\n" + "=" * 60)
print("步驟 11：匯出報告")
print("=" * 60)
step_start = time.time()

# 計算 IV 分佈統計
print("   正在計算 IV 分佈統計...")
iv_distribution = iv_distribution_by_org(iv_detail, oos_orgs=OOS_ORGS)
print(f"   IV 分佈統計：{len(iv_distribution)} 筆記錄")

# 計算 PSI 分佈統計
print("   正在計算 PSI 分佈統計...")
psi_distribution = psi_distribution_by_org(psi_detail, oos_orgs=OOS_ORGS)
print(f"   PSI 分佈統計：{len(psi_distribution)} 筆記錄")

# 計算有值率分佈統計 (使用所有特徵)
print("   正在計算有值率分佈統計...")
features_for_value_ratio = [c for c in data.columns if c.startswith('i_')]
value_ratio_distribution = value_ratio_distribution_by_org(data, features_for_value_ratio, oos_orgs=OOS_ORGS)
print(f"   有值率分佈統計：{len(value_ratio_distribution)} 筆記錄")

# 將明細和分佈統計加入步驟清單
steps.append(('Step7-IV明細', iv_detail))
steps.append(('Step7-IV分佈統計', iv_distribution))
steps.append(('Step8-PSI明細', psi_detail))
steps.append(('Step8-PSI分佈統計', psi_distribution))
steps.append(('Step5-有值率分佈統計', value_ratio_distribution))

export_cleaning_report(REPORT_PATH, steps,
                      iv_detail=iv_detail,
                      iv_process=iv_process,
                      psi_detail=psi_detail,
                      psi_process=psi_process,
                      params=params,
                      iv_distribution=iv_distribution,
                      psi_distribution=psi_distribution,
                      value_ratio_distribution=value_ratio_distribution)
print(f"   報告：{REPORT_PATH}")
print(f"   步驟 11 耗時：{time.time() - step_start:.2f} 秒")

# ==================== 彙總 ====================
print("\n" + "=" * 60)
print("資料清洗完成！")
print("=" * 60)
print(f"   原始資料：{data.shape[0]} 行")
print(f"   原始特徵：{len([c for c in data.columns if c.startswith('i_')])}")
print(f"   清洗步驟 (每個步驟獨立執行，資料不刪除)：")
for name, df in steps:
    print(f"     - {name}：已剔除 {df.shape[0] if hasattr(df, 'shape') else len(df)}")
