"""SKILL.md 範例：在 mteb/scifact 語料庫的前 100 篇文件中使用 bge-small-en-v1.5，每篇文件均在
中間句子邊界處分割為前半部與後半部，並透過此技能的指令檔以單一共享平均值進行檢查。除了 numpy 之外，
還需要 datasets 與 sentence-transformers；輸入均已固定至特定修訂版本，且輸出會記錄函式庫版本。

  python example_scifact_halves.py OUTDIR

句子會在後面接著空白字元的 '.'、'!' 或 '?' 之後進行分割；前半部為其中的前 len(sentences) // 2 句
（至少一句），後半部則為其餘句子。
"""
import json
import os
import re
import subprocess
import sys

import datasets
import numpy as np
import sentence_transformers
import torch
from datasets import load_dataset
from sentence_transformers import SentenceTransformer

DATASET, DATASET_REV = "mteb/scifact", "cf10ab6856b15b0e670ef8ae5dae4e266c12d035"
MODEL, MODEL_REV = "BAAI/bge-small-en-v1.5", "5c38ec7c405ec4b44b94cc5a9bb96e735b38267a"

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
docs = load_dataset(DATASET, "corpus", split="corpus", revision=DATASET_REV).select(range(100))
halves = []
for text in list(docs["text"]):
    s = re.split(r"(?<=[.!?])\s+", text.strip())
    k = max(1, len(s) // 2)
    halves.append((" ".join(s[:k]), " ".join(s[k:]) or s[-1]))
m = SentenceTransformer(MODEL, revision=MODEL_REV, device="cpu")
np.save(os.path.join(out, "A.npy"), m.encode([h[0] for h in halves], normalize_embeddings=True))
np.save(os.path.join(out, "B.npy"), m.encode([h[1] for h in halves], normalize_embeddings=True))
here = os.path.dirname(os.path.abspath(__file__))
script = next(p for p in (os.path.join(here, "anisotropy_check.py"), os.path.join(here, "embedding-anisotropy-check", "scripts", "anisotropy_check.py")) if os.path.exists(p))
res = subprocess.run([sys.executable, script, os.path.join(out, "A.npy"), os.path.join(out, "B.npy"), "--shared"],
                     capture_output=True, text=True, check=True).stdout
res = json.loads(res)
res["data"] = {"corpus": f"{DATASET}@{DATASET_REV} corpus, rows 0-99", "ids": list(docs["_id"]), "model": f"{MODEL}@{MODEL_REV}",
               "versions": {"datasets": datasets.__version__, "sentence_transformers": sentence_transformers.__version__,
                            "torch": torch.__version__, "numpy": np.__version__}}
json.dump(res, open(os.path.join(out, "example_scifact_halves.json"), "w"), indent=1)
print(json.dumps({k: res[k] for k in ("anisotropy", "raw", "centred")}))
