"""
config.py — 內容圖形技能 (Context Graph Skill) 的全域設定常數。

資料目錄是從環境變數解析的，因此該技能可以從任何專案中使用，
而無需在技能套件內部寫入資料。

  MINI_CONTEXT_GRAPH_DATA_DIR — graph.json、index.json 等檔案所在位置
  MINI_CONTEXT_GRAPH_WIKI_DIR — Wiki 頁面、index.md 與 log.md 所在位置

當未設定環境變數時，兩者都預設為目前工作目錄的子目錄，
因此資料會存放在使用該技能的專案目錄中。
"""

import os
from pathlib import Path

_BASE = Path(os.environ.get("MINI_CONTEXT_GRAPH_BASE", str(Path.cwd())))
DATA_DIR = Path(os.environ.get("MINI_CONTEXT_GRAPH_DATA_DIR", str(_BASE / "data")))
WIKI_DIR = Path(os.environ.get("MINI_CONTEXT_GRAPH_WIKI_DIR", str(_BASE / "wiki")))

MAX_GRAPH_DEPTH: int = 2
MIN_CONFIDENCE: float = 0.6
MAX_NODES: int = 50
