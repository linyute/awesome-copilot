#!/usr/bin/env python3
"""在採信餘弦相似度比較結果之前，先檢查其是否存在各向異性 (anisotropy)。

A 的第 i 列與 B 的第 i 列配對：查詢及其標準段落、影像及其說明文字，或是同一模型在兩種精度、
不同層或不同執行環境下的相同輸入。A 與 B 必須位於同一個坐標空間：兩個獨立訓練的模型並不符合此條件，
在為這兩個空間擬合明確的對應關係之前，兩者之間的列餘弦值毫無意義。對於相同的配對，本指令檔會回報
配對項目以及置換基準底線（每個 A 列與非其夥伴的 B 列配對，兩次讀取使用相同的錯排）的原始與中心化餘弦值，
以及夥伴在所有 B 列中排名第一的頻率。

  python anisotropy_check.py A.npy B.npy
  python anisotropy_check.py A.npy B.npy --fit-a trainA.npy --fit-b trainB.npy
  python anisotropy_check.py A.npy B.npy --shared

中心化會減去擬合母體之單位正規化列的平均值，然後再次正規化。預設情況下，每一側都會依據其自身的平均值
進行中心化，並以被比較的列本身進行擬合；改為傳入 --fit-a 與 --fit-b 以在相同領域、模型與模態的訓練分割上
進行擬合，當 A 與 B 來自同一個空間與母體時則傳入 --shared。
僅需要 numpy；輸出一個 JSON 物件。

"""
import argparse
import json
import sys

import numpy as np

BLOCK = 2048
# 低於此值之範數或離散度視為捨入雜訊；餘弦值界於 1 以內。
TINY = 1e-9


def load_rows(path, what):
    x = np.load(path).astype(np.float64)
    if x.ndim != 2:
        sys.exit(f"{what} 必須為 (n, d) 陣列，但取得形狀 {x.shape}")
    if len(x) == 0:
        sys.exit(f"{what} 必須包含至少一列")
    bad = ~np.isfinite(x).all(axis=1)
    if bad.any():
        sys.exit(f"{what} 具有 {int(bad.sum())} 列包含 NaN 或無限大數值；請先移除或修正它們")
    zero = np.linalg.norm(x, axis=1) < 1e-12
    if zero.any():
        sys.exit(f"{what} 具有 {int(zero.sum())} 個長度為零的列，這些列沒有方向；請先移除它們")
    return x


def unit(x):
    return x / np.linalg.norm(x, axis=1, keepdims=True)


def anisotropy(u):
    """計算單位列 u 中所有不同列配對的平均餘弦值：無共享方向時接近 0，共享單一方向時接近 1。"""
    n = len(u)
    s = u.sum(0)
    return float((s @ s - n) / (n * (n - 1)))


def derangement(n, rng):
    while True:
        p = rng.permutation(n)
        if not np.any(p == np.arange(n)):
            return p


def partner_first(ua, ub):
    """計算 A 列中自身夥伴即為最近 B 列的比例，兩側均採分塊處理以確保記憶體維持在受控範圍內。"""
    hits = 0
    for i in range(0, len(ua), BLOCK):
        qa = ua[i:i + BLOCK]
        best, arg = np.full(len(qa), -np.inf), np.zeros(len(qa), dtype=np.int64)
        for j in range(0, len(ub), BLOCK):
            s = qa @ ub[j:j + BLOCK].T
            k = s.argmax(axis=1)
            v = s[np.arange(len(qa)), k]
            better = v > best
            best[better], arg[better] = v[better], k[better] + j
        hits += int(np.sum(arg == np.arange(i, i + len(qa))))
    return hits / len(ua)


def compare(ua, ub, perms):
    matched = np.sum(ua * ub, axis=1)
    floor = np.concatenate([np.sum(ua * ub[p], axis=1) for p in perms])
    gap, sd = float(matched.mean() - floor.mean()), float(floor.std())
    pooled = float(np.sqrt((matched.var() + floor.var()) / 2))
    return {"matched": float(matched.mean()), "floor": float(floor.mean()), "gap": gap,
            "floor_sd": sd, "gap_over_floor_sd": float(gap / sd) if sd > TINY else None,
            "cohens_d": float(gap / pooled) if pooled > TINY else None,
            "partner_ranked_first": float(partner_first(ua, ub))}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("a", help="(n, d) .npy，列 i 與 B 的列 i 配對")
    ap.add_argument("b", help="與 A 處於相同坐標空間的 (n, d) .npy")
    ap.add_argument("--fit-a", help="用以擬合 A 平均值的列；預設為 A 本身")
    ap.add_argument("--fit-b", help="用以擬合 B 平均值的列；預設為 B 本身")
    ap.add_argument("--shared", action="store_true", help="涵蓋兩側擬合列的單一平均值")
    ap.add_argument("--perms", type=int, default=20, help="用於基準底線的錯排次數 (預設為 20)")
    ap.add_argument("--seed", type=int, default=0)
    o = ap.parse_args()
    if o.perms < 1:
        ap.error("--perms 必須至少為 1")
    a, b = load_rows(o.a, "A"), load_rows(o.b, "B")
    if a.shape != b.shape or len(a) < 3:
        sys.exit(f"A 與 B 必須為形狀相同且 n >= 3 的配對陣列，但取得 {a.shape} 與 {b.shape}")
    rng = np.random.default_rng(o.seed)
    perms = [derangement(len(b), rng) for _ in range(o.perms)]
    ua, ub = unit(a), unit(b)
    fa = unit(load_rows(o.fit_a, "--fit-a")) if o.fit_a else ua
    fb = unit(load_rows(o.fit_b, "--fit-b")) if o.fit_b else ub
    for f, what in ((fa, "--fit-a"), (fb, "--fit-b")):
        if f.shape[1] != a.shape[1]:
            sys.exit(f"{what} 的維度為 {f.shape[1]}，被比較的列維度為 {a.shape[1]}")
    if o.shared:
        mu_a = mu_b = np.vstack([fa, fb]).mean(0)
    else:
        mu_a, mu_b = fa.mean(0), fb.mean(0)
    ca, cb = ua - mu_a, ub - mu_b
    for c, what in ((ca, "A"), (cb, "B")):
        empty = np.linalg.norm(c, axis=1) < TINY
        if empty.any():
            sys.exit(f"中心化導致 {what} 留下了 {int(empty.sum())} 個長度為零的列：它們等於擬合的平均值，如同"
                     "每個列都指向同一方向或擬合列僅有單一列時的情況。請以更多列擬合平均值，或捨棄這些列")
    raw = compare(ua, ub, perms)
    cen = compare(unit(ca), unit(cb), perms)
    an = {"a": anisotropy(ua), "b": anisotropy(ub)}
    share = raw["floor"] / raw["matched"] if raw["matched"] > 0 else None
    source = {"a": f"--fit-a，{len(fa)} 列" if o.fit_a else f"被比較的列，{len(a)}",
              "b": f"--fit-b，{len(fb)} 列" if o.fit_b else f"被比較的列，{len(b)}"}
    means = ({"shared": f"涵蓋兩側擬合列的單一平均值 ({source['a']}；{source['b']})"} if o.shared
             else {"a": f"擬合於 {source['a']}", "b": f"擬合於 {source['b']}"})
    apart = (f"相距 {cen['gap_over_floor_sd']:.2f} 個基準底線標準差" if cen["gap_over_floor_sd"] is not None
             else f"差距為 {cen['gap']:.4g}，因為基準底線沒有離散度，故無法以基準底線標準差表示大小")
    out = {"n": len(a), "dim": a.shape[1], "means": means,
           "anisotropy": an, "raw": raw, "centred": cen, "partner_first_by_chance": 1 / len(a),
           "reading": (f"非相關配對的原始分數為 {raw['floor']:.4f}" + (f"，佔配對分數 {raw['matched']:.4f} 的 {share:.0%}" if share is not None else "")
                       + f"；中心化後，配對分數為 {cen['matched']:.4f}（相對於基準底線 {cen['floor']:.4f}，"
                       f"{apart}）。請同時回報原始與中心化配對及其基準底線，切勿單獨回報原始配對餘弦值。")}
    if max(an.values()) > 0.3:
        out["warning"] = ("至少有一側的各向異性 (anisotropy) 高於 0.3：該側內的列聚集在平均方向周圍；"
                          "請檢查 raw.floor 以查看該方向在兩側之間的共享程度")
    notes = [f"{side} 的平均值是依據 {len(x)} 個被比較的列進行擬合；若有同母體的訓練分割，請改用其進行擬合"
             for side, given, x in (("A", o.fit_a, a), ("B", o.fit_b, b)) if not given and len(x) < 1000]
    if notes:
        out["note"] = notes
    print(json.dumps(out, indent=1, allow_nan=False))


if __name__ == "__main__":
    main()
