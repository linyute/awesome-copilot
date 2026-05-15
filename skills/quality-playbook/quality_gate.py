#!/usr/bin/env python3
"""quality_gate.py — Quality Playbook 產出物的執行後驗證閘。

機械式地檢查模型自我證明持續遺漏的產出物一致性問題。現在是唯一的閘指令碼；之前的 quality_gate.sh
(bash) 已停用。請參閱 quality_gate/test_quality_gate.py 了解測試套件。

用法：
    ./quality_gate.py .                          # 檢查目前目錄 (基準測試模式)
    ./quality_gate.py --general .                # 以放寬的閾值檢查
    ./quality_gate.py virtio                     # 檢查命名的儲存庫 (來自 repos/)
    ./quality_gate.py --all                      # 檢查所有當前版本的儲存庫
    ./quality_gate.py --version 1.3.27 virtio    # 檢查特定版本

結束代碼：
    0 — 所有檢查通過
    1 — 一個或多個檢查失敗

在 Python 3.8+ 上執行，僅使用標準函式庫。
"""

import json
import os
import re
import sys
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

# 允許軟匯入 bin/citation_verifier 以進行 v1.5.1 位元組相等性檢查。
# 驗證器可能位於多個位置之一，具體取決於閘的安裝位置：
#   1. <QPB-clone>/bin/citation_verifier.py — 閘從原始碼樹執行
#      (閘路徑：<clone>/.github/skills/quality_gate/quality_gate.py；
#      bin/ 位於 SCRIPT_DIR 向上三層)。
#   2. <install-root>/bin/citation_verifier.py — 閘與
#      bin/ 一起安裝在安裝根目錄 (v1.5.6 BUG-005 修復；bin/install_skill.py
#      和 repos/setup_repos.sh 都在這裡捆綁了 bin/citation_verifier.py)。
#   3. <install-root>/bin/citation_verifier.py 透過巢狀技能路徑
#      (.github/skills/quality_gate.py — SCRIPT_DIR 是 .github/skills，且
#      bin/ 位於向上兩層)。
# 當這些都無法解析時，位元組相等性檢查將以 WARN 略過，而不是硬性的 FAIL —
# 閘將以降低的執行強度繼續。
_CITATION_VERIFIER = None
_VERIFIER_SEARCH_ROOTS = [
    SCRIPT_DIR.parent.parent.parent,  # 原始碼複製佈局
    SCRIPT_DIR,                       # 閘 + bin/ 兄弟目錄 (不常見)
    SCRIPT_DIR.parent.parent,         # 巢狀技能佈局 (.github/skills/quality_gate.py)
]
for _candidate_root in _VERIFIER_SEARCH_ROOTS:
    _verifier_file = _candidate_root / "bin" / "citation_verifier.py"
    if _verifier_file.is_file():
        try:
            if str(_candidate_root) not in sys.path:
                sys.path.insert(0, str(_candidate_root))
            from bin import citation_verifier as _CITATION_VERIFIER  # noqa: E402
            break
        except Exception:  # noqa: BLE001 — 缺少 / 誤安裝 bin/ 是可以容忍的
            _CITATION_VERIFIER = None
            continue

# 全域計數器 — 透過 main() 每次呼叫重設。直接呼叫 check_repo 的測試
# 應該在 setUp 中重設這些。
FAIL = 0
WARN = 0


# v1.5.2 — REQ Pattern 欄位 (Lever 2)
VALID_PATTERN_VALUES = frozenset({"whitelist", "parity", "compensation"})

_REQ_PATTERN_RE = re.compile(
    r"^\s*-\s*Pattern:\s*(\S+)\s*$", re.IGNORECASE | re.MULTILINE
)


def extract_req_pattern(req_block):
    """從 REQUIREMENTS.md 區塊傳回 REQ 的 Pattern 標籤，若無則傳回 None。

    當該區塊帶有無效的 Pattern 值時引發 ValueError。有效值為
    VALID_PATTERN_VALUES。若無此欄位則傳回 None。
    """
    m = _REQ_PATTERN_RE.search(req_block)
    if not m:
        return None
    value = m.group(1).strip()
    if value not in VALID_PATTERN_VALUES:
        raise ValueError(
            "無效的 REQ Pattern '{}'。預期為以下之一：{}".format(
                value, sorted(VALID_PATTERN_VALUES)
            )
        )
    return value


# v1.5.2 — 基數閘 (Lever 3)

VALID_REASON_CLASSES = frozenset({
    "out-of-scope",
    "deprecated",
    "platform-gated",
    "handled-upstream",
    "intentionally-partial",
})

_CELL_ID_RE = re.compile(r"^REQ-\d+/cell-[A-Za-z0-9_]+-[A-Za-z0-9_]+$")

_COVERS_RE = re.compile(
    r"^\s*-\s*Covers:\s*\[(.*?)\]\s*$", re.IGNORECASE | re.MULTILINE
)

_CONSOLIDATION_RE = re.compile(
    r"^\s*-\s*Consolidation rationale:\s*(.+?)\s*$",
    re.IGNORECASE | re.MULTILINE,
)

_BUG_HEADING_RE = re.compile(r"^###\s+BUG-(\d+):", re.MULTILINE)

# v1.5.2 (C13.8/Fix 1) — present:true 網格單元格的證據定位器。
# 相對路徑 (不含開頭 '/')、單個冒號、行號 (>=1) 或
# 範圍 ``N-M`` 且兩端點皆 >=1。拒絕：絕對路徑、
# 多斜線根路徑、URL、第 0 行、零端點範圍。
_EVIDENCE_RE = re.compile(r"^(?!/)[^:]+:[1-9]\d*(-[1-9]\d*)?$")


def _parse_covers(bug_block):
    m = _COVERS_RE.search(bug_block)
    if not m:
        return []
    raw = m.group(1).strip()
    if not raw:
        return []
    items = [s.strip() for s in raw.split(",")]
    return [s for s in items if s]


def _parse_consolidation_rationale(bug_block):
    m = _CONSOLIDATION_RE.search(bug_block)
    if not m:
        return None
    text = m.group(1).strip()
    return text or None


def _split_bug_blocks(bugs_md_text):
    """傳回 (bug_id, body) 配對列表。"""
    positions = [(m.start(), m.group(1)) for m in _BUG_HEADING_RE.finditer(bugs_md_text)]
    result = []
    for idx, (start, bug_id) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(bugs_md_text)
        result.append(("BUG-{}".format(bug_id), bugs_md_text[start:end]))
    return result


def _bug_primary_requirement(block):
    m = re.search(
        r"^\s*-\s*Primary requirement:\s*(REQ-\d+)", block, re.MULTILINE | re.IGNORECASE
    )
    return m.group(1) if m else None


def _load_json_or_none(path):
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _read_text_safe(path):
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


_REQ_HEADING_RE = re.compile(r"^###\s+(REQ-\d+):", re.MULTILINE)


def _enumerate_pattern_tagged_reqs(req_text):
    """針對 REQUIREMENTS.md 中帶有 ``- Pattern: <value>`` 行的每個 ### REQ-NNN: 區塊，
    傳回 {req_id: pattern}。

    若任何區塊的 Pattern 值不在 VALID_PATTERN_VALUES 中，則引發 ValueError
    (委派給 extract_req_pattern())。省略不帶 Pattern 欄位的區塊 (它們沒有 Pattern 標籤)。
    """
    if not req_text:
        return {}
    positions = [(m.start(), m.group(1)) for m in _REQ_HEADING_RE.finditer(req_text)]
    result = {}
    for idx, (start, req_id) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(req_text)
        block = req_text[start:end]
        pattern = extract_req_pattern(block)
        if pattern is not None:
            result[req_id] = pattern
    return result


# v1.5.2 (C13.7/Fix 2) — 逐站點 UC 偵測。
# 第一階段的笛卡兒 UC 規則會為兩個資格閘都匹配的 REQ 發送 UC-N.a / UC-N.b / ...。
# REQUIREMENTS.md 中任何引用此類逐站點 UC 的 REQ 區塊都必須帶有 Pattern 欄位 —
# 否則第二階段會自動丟棄它。該正規表示式被刻意縮小：僅限一個小寫字母後綴，
# 兩側都有單字邊界，因此不會誤將單純的 UC-N 和後綴過多的 UC-N.a.bad 視為逐站點引用。
_PER_SITE_UC_RE = re.compile(r"\bUC-\d+\.[a-z]\b")


def _enumerate_per_site_uc_reqs(req_text):
    """針對每個引用了至少一個逐站點 UC 參考 (UC-N.a / UC-N.b / ...) 的 ### REQ-NNN: 區塊，
    傳回 {req_id: sorted_list_of_uc_ids}。

    結果中會省略不含逐站點 UC 參考的 REQ 區塊。
    傳回的每個 UC 列表都經過重複刪除並按字母順序排序。
    """
    if not req_text:
        return {}
    positions = [(m.start(), m.group(1)) for m in _REQ_HEADING_RE.finditer(req_text)]
    result = {}
    for idx, (start, req_id) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(req_text)
        block = req_text[start:end]
        ucs = sorted(set(_PER_SITE_UC_RE.findall(block)))
        if ucs:
            result[req_id] = ucs
    return result


def validate_cardinality_gate(repo_dir):
    """執行 v1.5.2 基數對帳閘。

    傳回失敗字串列表。空列表表示閘檢查通過。
    由呼叫者決定如何呈現失敗訊息 (列印 / fail())。

    預期 repo_dir/quality/ 中的輸入：
      - REQUIREMENTS.md (帶有 Pattern 標籤的 REQ 來源)
      - BUGS.md (Covers: 註釋來源)
      - compensation_grid.json (每個 REQ 的單元格組來源)
      - compensation_grid_downgrades.json (選用；降級單元格來源)
    """
    failures = []
    q = Path(repo_dir) / "quality"

    req_text = _read_text_safe(q / "REQUIREMENTS.md")

    # 事先列舉帶有 Pattern 標籤和逐站點 UC 的 REQ，以便無論網格檔案
    # 是否存在都能執行下游交叉檢查。引用逐站點 UC 但缺少 Pattern 的 REQ 
    # 無論網格是否存在都是失敗 (事實上，如果缺少 Pattern 就正因為 Pattern 
    # 是產生網格的觸發器而不會有網格)。
    try:
        pattern_tagged = _enumerate_pattern_tagged_reqs(req_text)
    except ValueError as exc:
        failures.append("REQUIREMENTS.md: {}".format(exc))
        pattern_tagged = {}
    try:
        per_site = _enumerate_per_site_uc_reqs(req_text)
    except ValueError as exc:
        failures.append("REQUIREMENTS.md: {}".format(exc))
        per_site = {}

    # 交叉檢查 (C13.7/Fix 2)：REQUIREMENTS.md 中引用逐站點 UC (UC-N.a,
    # UC-N.b, ...) 的每個 REQ 都必須帶有 Pattern 欄位。逐站點 UC
    # 是第一階段笛卡兒 UC 規則發出的結構信號；如果信號在那裡但缺少 Pattern，
    # 第二階段會自動丟棄它，而 v1.4.5 迴歸向量就會再次啟動。無論網格
    # 是否存在都會執行，因為缺少 Pattern 正是導致網格最初不存在的原因。
    for req_id, uc_ids in per_site.items():
        if req_id not in pattern_tagged:
            failures.append(
                "基數閘：{} 在 REQUIREMENTS.md 中有逐站點 UC ({}) "
                "但缺少 Pattern 欄位 — 第一階段笛卡兒 UC 規則"
                "要求跨站點 REQ 需標記 Pattern (請參閱 "
                "phase1_prompt 確認清單項目 6)".format(
                    req_id, ", ".join(uc_ids)
                )
            )

    grid_path = q / "compensation_grid.json"
    grid = _load_json_or_none(grid_path)
    if grid is None:
        # 無網格檔案：僅當存在任何帶有 Pattern 標籤的 REQ 時才是問題。
        if _REQ_PATTERN_RE.search(req_text):
            failures.append(
                "基數閘：存在帶有 Pattern 標籤的 REQ，但 "
                "quality/compensation_grid.json 遺失"
            )
        return failures

    reqs = grid.get("reqs") or {}
    if not isinstance(reqs, dict):
        failures.append("compensation_grid.json: 'reqs' 不是物件")
        return failures

    # 交叉檢查：REQUIREMENTS.md 中每個帶有 Pattern 標籤的 REQ 必須出現在
    # 網格中。從網格中省略帶有 Pattern 標籤的 REQ 是 v1.5.2 的逃生口
    # (被逐一 REQ 對帳迴圈自動略過)；在此關閉它。
    for req_id, req_pattern in pattern_tagged.items():
        if req_id not in reqs:
            failures.append(
                "基數閘：{} 在 REQUIREMENTS.md 中標記為 Pattern '{}' "
                "但在 compensation_grid.json 中沒有分錄".format(req_id, req_pattern)
            )

    # 載入 BUGS.md 並依 REQ 索引 Covers
    bugs_text = _read_text_safe(q / "BUGS.md")
    covers_by_req = {}
    for bug_id, block in _split_bug_blocks(bugs_text):
        covers = _parse_covers(block)
        if len(covers) >= 2:
            if not _parse_consolidation_rationale(block):
                failures.append(
                    "{}: Covers 有 {} 個分錄，但 'Consolidation rationale:' 缺失或為空".format(
                        bug_id, len(covers)
                    )
                )
        for cell_id in covers:
            if not _CELL_ID_RE.match(cell_id):
                failures.append(
                    "{}: 單元格 ID '{}' 格式錯誤 (預期為 REQ-N/cell-<項目>-<站點>)".format(
                        bug_id, cell_id
                    )
                )
                continue
            req_id = cell_id.split("/", 1)[0]
            covers_by_req.setdefault(req_id, set()).add(cell_id)

    # 載入降級資訊並驗證每條記錄
    downgrades = _load_json_or_none(q / "compensation_grid_downgrades.json") or {"downgrades": []}
    downgrade_cells_by_req = {}
    for rec in downgrades.get("downgrades", []):
        rid = rec.get("cell_id", "")
        if not _CELL_ID_RE.match(rid):
            failures.append("降級記錄：單元格 ID '{}' 格式錯誤".format(rid))
            continue
        # 降級記錄僅在下列每項驗證皆通過時，才計入對帳。
        # 格式錯誤的記錄會發出診斷失敗字串，且不計入 
        # downgrade_cells_by_req，因此逐個 REQ 的未涵蓋單元格計算仍會標記該單元格。
        rec_ok = True
        for field in ("authority_ref", "site_citation", "reason_class", "falsifiable_claim"):
            value = rec.get(field)
            if not value or not isinstance(value, str) or not value.strip():
                failures.append(
                    "降級記錄 {}: 欄位 '{}' 遺失或為空".format(rid, field)
                )
                rec_ok = False
        reason = rec.get("reason_class", "")
        if reason and reason not in VALID_REASON_CLASSES:
            failures.append(
                "降級記錄 {}: reason_class '{}' 不在 {} 中".format(
                    rid, reason, sorted(VALID_REASON_CLASSES)
                )
            )
            rec_ok = False
        if not rec_ok:
            continue
        req_id = rid.split("/", 1)[0]
        downgrade_cells_by_req.setdefault(req_id, set()).add(rid)

    # 逐個 REQ 進行對帳
    for req_id, entry in reqs.items():
        pattern = entry.get("pattern")
        if pattern not in {"whitelist", "parity", "compensation"}:
            failures.append(
                "compensation_grid.json: {} 的 Pattern '{}' 無效或遺失".format(
                    req_id, pattern
                )
            )
            continue
        cells = entry.get("cells") or []
        # v1.5.2 (C13.8/Fix 2)：預先驗證每個單元格的 'present' 欄位是否為
        # 嚴格的布林值。非布林值 (字串 "true", 整數 1, None, 遺失鍵)
        # 否則會落在 'is False' (缺席單元格分支) 和 
        # 'is not True' (存在單元格證據分支) 之間，從而逃避檢查。
        # 與 B1 同屬隱式規避系列 — 進行診斷並略過該單元格，不計入覆蓋統計。
        valid_cells = []
        for c in cells:
            if not isinstance(c, dict):
                continue
            present = c.get("present")
            if not isinstance(present, bool):
                cell_id = c.get("cell_id") or "<無單元格 ID>"
                failures.append(
                    "{}: 單元格 {} 的 'present' 必須是布林值 true 或 false；得到 {!r}".format(
                        req_id, cell_id, present
                    )
                )
                continue
            valid_cells.append(c)

        grid_cell_ids = {c.get("cell_id") for c in valid_cells}
        grid_cell_ids.discard(None)
        # 只有缺席的單元格需要覆蓋。現在身份檢查是安全的 — 
        # valid_cells 的每個元素之 'present' 皆為嚴格布林值。
        absent_cells = {
            c.get("cell_id") for c in valid_cells
            if c.get("present") is False
        }
        absent_cells.discard(None)

        # v1.5.2 (C13.6/B2)：present:true 的單元格必須帶有非空的 
        # 'evidence' 欄位，格式為檔案:行號。若無此項，審閱者或 LLM 
        # 可以聲稱任何單元格都存在，卻不提供任何資訊，而閘也會接受它 — 
        # 第 5 輪委員會將此規避行為稱為最高剩餘風險。
        for c in valid_cells:
            if c.get("present") is not True:
                continue
            cell_id = c.get("cell_id") or "<無單元格 ID>"
            evidence = c.get("evidence")
            if not evidence or not isinstance(evidence, str) or not evidence.strip():
                failures.append(
                    "{}: present:true 要求非空的 'evidence' 欄位，並包含檔案:行號引用".format(cell_id)
                )
                continue
            if not _EVIDENCE_RE.match(evidence.strip()):
                failures.append(
                    "{}: 'evidence' 必須是檔案:行號 (例如 'path/to.c:123' 或 'path/to.c:120-140')；得到 {!r}".format(
                        cell_id, evidence
                    )
                )

        covered = covers_by_req.get(req_id, set())
        downgraded = downgrade_cells_by_req.get(req_id, set())
        uncovered = absent_cells - covered - downgraded

        if uncovered:
            failures.append(
                "{}: 未涵蓋的單元格 — {}".format(req_id, ", ".join(sorted(uncovered)))
            )

        # 每個被涵蓋的單元格必須在網格中
        stray = (covered | downgraded) - grid_cell_ids
        if stray:
            failures.append(
                "{}: Covers/降級單元格不在網格中 — {}".format(
                    req_id, ", ".join(sorted(stray))
                )
            )

    return failures


def _reset_counters():
    global FAIL, WARN
    FAIL = 0
    WARN = 0


def fail(msg, reason=None, *, line=None):
    """發出結構化失敗行並遞增 FAIL。

    第 5 階段 r3 格式：`<路徑>[:<行號>]: <原因>` — 無 "FAIL:" 標籤，因此
    輸出可被 grep 解析為 `^[^:]+:[0-9]*:? .+$`。字首 `FAIL:` 被刻意
    移除；全域 FAIL 計數器 (在 main() 中總結) 是每次執行之失敗情況的
    權威計數。

    偏好形式：
        fail("quality/INDEX.md", "檔案遺失")
            -> "  quality/INDEX.md: 檔案遺失"
        fail("quality/INDEX.md", "缺少必要欄位 'x'", line=42)
            -> "  quality/INDEX.md:42: 缺少必要欄位 'x'"

    舊版單引數形式 (過渡期；仍支援 — 大多數 v1.4.x
    訊息已內嵌路徑式標記)：
        fail("BUGS.md 遺失或不是檔案")
            -> "  BUGS.md 遺失或不是檔案"
    """
    global FAIL
    if reason is None:
        print(f"  {msg}")
    elif line is None:
        print(f"  {msg}: {reason}")
    else:
        print(f"  {msg}:{line}: {reason}")
    FAIL += 1


def pass_(msg):
    print(f"  PASS: {msg}")


def warn(msg):
    global WARN
    print(f"  WARN: {msg}")
    WARN += 1


def info(msg):
    print(f"  INFO: {msg}")


# --- JSON 輔助函式 (正確解析，而非 grep 式) ---


def load_json(path):
    """解析 JSON 檔案。傳回解析後的值，若有任何錯誤則傳回 None。"""
    if not path.is_file():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return None


def has_key(data, key):
    """若 `data` 是包含 `key` 的字典，則傳回 True。"""
    return isinstance(data, dict) and key in data


def get_str(data, key):
    """若 data[key] 為字串則傳回之，否則傳回空字串。"""
    if not isinstance(data, dict):
        return ""
    val = data.get(key)
    return val if isinstance(val, str) else ""


def count_per_bug_field(bugs_list, field):
    """計算列表中已設定 `field` 的 bug 數量。"""
    if not isinstance(bugs_list, list):
        return 0
    return sum(1 for b in bugs_list if isinstance(b, dict) and field in b)


# --- 檔案輔助函式 ---


# v1.5.4 第 3.6.4 階段 (B-16)：執行結束後的重組會將中間
# 管線產出物移至 quality/workspace/ 下。閘會在多個站點讀取
# 這些子目錄；_resolve_artifact_path 集中了雙重佈局查閱，
# 讓每個站點保持單行程式碼。
# 最上層優先 (舊版 / 重組前佈局)；workspace/ 是 _finalize_quality_layout 
# 執行後的 v1.5.4 規範位置。
_WORKSPACE_DIRS = (
    "control_prompts",
    "results",
    "code_reviews",
    "spec_audits",
    "patches",
    "writeups",
    "mechanical",
    "phase3",
)


def _resolve_artifact_path(quality_dir, name):
    """傳回 quality/ 下中間產出物目錄或檔案的現用路徑。
    先嘗試最上層 (舊版 / 目前執行中的佈局)，然後嘗試 
    quality/workspace/<name> (v1.5.4 執行結束後的重組佈局)。
    即使兩者都不存在，也會傳回最上層路徑，以便測試 
    ``.is_dir()`` / ``.is_file()`` 的呼叫者得到 False 而非引發異常。

    ``name`` 可以是單個段落 (``"results"``) 或帶有段落的路徑 
    (``"results/tdd-results.json"``)；無論佈局為何，這兩種形式都有效。"""
    top = quality_dir / name
    if top.exists():
        return top
    workspace = quality_dir / "workspace" / name
    if workspace.exists():
        return workspace
    return top


def has_file_matching(directory, patterns):
    """若 `directory` 中 (非遞迴) 有任何檔案匹配任何 glob 模式，則傳回 True。"""
    if not directory.is_dir():
        return False
    for pat in patterns:
        for _ in directory.glob(pat):
            return True
    return False


def count_files_matching(directory, pattern):
    """計算 `directory` 中 (非遞迴) 匹配 glob 模式的檔案數量。"""
    if not directory.is_dir():
        return 0
    return sum(1 for _ in directory.glob(pattern))


def first_file_matching(directory, patterns):
    """傳回第一個匹配的路徑，若無則傳回 None。"""
    if not directory.is_dir():
        return None
    for pat in patterns:
        for p in directory.glob(pat):
            return p
    return None


def file_contains(path, pattern):
    """若檔案中任何一行匹配模式 (正規表示式字串或已編譯的模式)，則傳回 True。"""
    if not path.is_file():
        return False
    if isinstance(pattern, str):
        pattern = re.compile(pattern)
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if pattern.search(line):
                    return True
    except OSError:
        pass
    return False


def read_first_line_stripped(path):
    """傳回檔案的第一行並移除空白字元。"""
    if not path.is_file():
        return ""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            line = f.readline()
    except OSError:
        return ""
    return re.sub(r"\s", "", line)


def validate_iso_date(date_str):
    """傳回以下之一：'valid', 'placeholder', 'future', 'bad_format', 'empty'。

    在檢查格式之前會先檢查佔位符，以便將 'YYYY-MM-DD' 報告為 
    'placeholder' 而非 'bad_format'。bash 版本的順序相反，
    導致 'YYYY-MM-DD' 被誤報 — 雖然兩者仍會 FAIL，但 
    Python 版本提供的訊息更清晰。
    """
    if not date_str:
        return "empty"
    if date_str in ("YYYY-MM-DD", "0000-00-00"):
        return "placeholder"
    date_part = date_str[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_part):
        return "bad_format"
    if len(date_str) > 10 and not re.fullmatch(r"T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?", date_str[10:]):
        return "bad_format"
    today = date.today().isoformat()
    if date_part > today:
        return "future"
    return "valid"


def detect_skill_version(locations):
    """從第一個存在的類 SKILL.md 檔案中讀取 `version:` 值。"""
    for loc in locations:
        if loc.is_file():
            try:
                with open(loc, "r", encoding="utf-8", errors="replace") as f:
                    for line in f:
                        m = re.match(r"^\s*(?:version:|\*\*Version:\*\*)\s*([0-9]+(?:\.[0-9]+)+)\b",
                                     line, re.IGNORECASE)
                        if m:
                            return m.group(1)
            except OSError:
                continue
    return ""


def read_skill_value_line(path, prefix):
    """模仿：grep -m1 'prefix' FILE | sed 's/.*prefix *//' | tr -d ' '。"""
    if not path.is_file():
        return ""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                if prefix in line:
                    v = re.sub(rf".*{re.escape(prefix)}\s*", "", line, count=1)
                    return v.replace(" ", "").rstrip("\n").rstrip("\r")
    except OSError:
        pass
    return ""


def detect_project_language(repo_dir):
    """查閱深度達 3 層目錄，傳回第一個副檔名存在的語言。

    鏡像 bash `find -maxdepth 3 -not -path ...` 的行為。
    """
    language_order = [
        ("go", ".go"),
        ("py", ".py"),
        ("java", ".java"),
        ("kt", ".kt"),
        ("rs", ".rs"),
        ("ts", ".ts"),
        ("js", ".js"),
        ("scala", ".scala"),
        ("c", ".c"),
        ("agc", ".agc"),
    ]
    excluded = {"vendor", "node_modules", ".git", "quality", "repos"}

    def present(base, target_ext):
        stack = [(Path(base), 1)]
        while stack:
            curr, depth = stack.pop()
            try:
                for entry in os.scandir(curr):
                    name = entry.name
                    if entry.is_dir(follow_symlinks=False):
                        if name in excluded:
                            continue
                        if depth < 3:
                            stack.append((Path(entry.path), depth + 1))
                    elif entry.is_file(follow_symlinks=False):
                        if name.endswith(target_ext):
                            return True
            except (OSError, PermissionError):
                continue
        return False

    for lang, ext in language_order:
        if present(repo_dir, ext):
            return lang
    return ""


def count_source_files(repo_dir):
    """計算原始碼檔案數量，深度達 4 層目錄，排除 vendor/node_modules/ 等。"""
    src_count = 0
    exts = {".go", ".py", ".java", ".kt", ".rs", ".ts", ".js", ".scala",
            ".c", ".h", ".agc"}
    excluded = {"vendor", "node_modules", ".git", "quality"}

    def walk(base, current_depth, max_depth):
        nonlocal src_count
        try:
            for entry in os.scandir(base):
                name = entry.name
                if entry.is_dir(follow_symlinks=False):
                    if current_depth < max_depth and name not in excluded:
                        walk(entry.path, current_depth + 1, max_depth)
                elif entry.is_file(follow_symlinks=False):
                    dot = name.rfind(".")
                    if dot >= 0 and name[dot:] in exts:
                        src_count += 1
        except (OSError, PermissionError):
            pass

    walk(str(repo_dir), 1, 4)
    return src_count


# --- 區段檢查 ---


def check_file_existence(repo_dir, q, strictness):
    """檔案存在區段 (基準測試 40)。"""
    print("[檔案存在]")
    for f in ["BUGS.md", "REQUIREMENTS.md", "QUALITY.md", "PROGRESS.md",
              "COVERAGE_MATRIX.md", "COMPLETENESS_REPORT.md"]:
        if (q / f).is_file():
            pass_(f"{f} 已存在")
        else:
            fail(f"{f} 缺失")

    for f in ["CONTRACTS.md", "RUN_CODE_REVIEW.md", "RUN_SPEC_AUDIT.md",
              "RUN_INTEGRATION_TESTS.md", "RUN_TDD_TESTS.md"]:
        if (q / f).is_file():
            pass_(f"{f} 已存在")
        else:
            fail(f"{f} 缺失")

    if has_file_matching(q, ["test_functional.*", "functional_test.*",
                             "FunctionalSpec.*", "FunctionalTest.*",
                             "functional.test.*"]):
        pass_("功能測試檔案已存在")
    else:
        fail("功能測試檔案缺失 (test_functional.*, functional_test.*, FunctionalSpec.*, FunctionalTest.*, functional.test.*)")

    if (repo_dir / "AGENTS.md").is_file():
        pass_("AGENTS.md 已存在")
    else:
        fail("AGENTS.md 缺失 (專案根目錄必須具備)")

    if (q / "EXPLORATION.md").is_file():
        pass_("EXPLORATION.md 已存在")
        _check_exploration_sections(q / "EXPLORATION.md")
    else:
        fail("EXPLORATION.md 缺失")

    cr_dir = _resolve_artifact_path(q, "code_reviews")
    if cr_dir.is_dir() and has_file_matching(cr_dir, ["*.md"]):
        pass_("code_reviews/ 內有 .md 檔案")
    else:
        fail("code_reviews/ 缺失或為空")

    sa_dir = _resolve_artifact_path(q, "spec_audits")
    if sa_dir.is_dir():
        triage_count = count_files_matching(sa_dir, "*triage*")
        auditor_count = count_files_matching(sa_dir, "*auditor*")
        if triage_count > 0:
            pass_("spec_audits/ 內有 triage 檔案")
        else:
            fail("spec_audits/ 缺失 triage 檔案")
        if auditor_count > 0:
            pass_(f"spec_audits/ 內有 {auditor_count} 個 auditor 檔案")
        else:
            fail("spec_audits/ 缺失個別的 auditor 檔案")

        if triage_count > 0:
            has_probes = False
            if (sa_dir / "triage_probes.sh").is_file():
                has_probes = True
                pass_("triage_probes.sh 已存在 (可執行的 triage 證據)")
            elif (_resolve_artifact_path(q, "mechanical/verify.sh")).is_file() and \
                 file_contains(_resolve_artifact_path(q, "mechanical/verify.sh"), r"probe|triage|auditor"):
                has_probes = True
                pass_("verify.sh 包含 triage probe 斷言")
            if not has_probes:
                msg = "未發現可執行的 triage 證據 (預期為 spec_audits/triage_probes.sh 或 mechanical/verify.sh 中的 probe 斷言)"
                if strictness == "benchmark":
                    fail(msg)
                else:
                    warn(msg)
    else:
        fail("spec_audits/ 目錄缺失")


def check_bugs_heading(q):
    """BUGS.md 標題格式區段 (基準測試 39)。

    傳回 (bug_count, bug_ids)。
    """
    print("[BUGS.md 標題格式]")
    bugs_md = q / "BUGS.md"
    if not bugs_md.is_file():
        fail("BUGS.md 缺失")
        return 0, []

    try:
        bugs_content = bugs_md.read_text(encoding="utf-8", errors="replace")
    except OSError:
        bugs_content = ""
    lines = bugs_content.splitlines()

    correct_headings = sum(1 for ln in lines
                           if re.match(r"^### BUG-([HML]|[0-9])[0-9]*", ln))
    wrong_headings = sum(1 for ln in lines
                         if re.match(r"^## BUG-", ln)
                         and not re.match(r"^### BUG-", ln))
    deep_headings = sum(1 for ln in lines
                        if re.match(r"^#{4,} BUG-([HML]|[0-9])", ln))
    bold_headings = sum(1 for ln in lines
                        if re.match(r"^\*\*BUG-([HML]|[0-9])", ln))
    bullet_headings = sum(1 for ln in lines
                          if re.match(r"^- BUG-([HML]|[0-9])", ln))

    bug_count = correct_headings

    if (correct_headings > 0 and wrong_headings == 0 and deep_headings == 0
            and bold_headings == 0 and bullet_headings == 0):
        pass_(f"所有 {correct_headings} 個 bug 標題皆使用 ### BUG-NNN 格式")
    else:
        if wrong_headings > 0:
            fail(f"{wrong_headings} 個標題使用 ## 而非 ###")
        if deep_headings > 0:
            fail(f"{deep_headings} 個標題使用 #### 或更深層級而非 ###")
        if bold_headings > 0:
            fail(f"{bold_headings} 個標題使用 **BUG- 格式")
        if bullet_headings > 0:
            fail(f"{bullet_headings} 個標題使用 - BUG- 格式")
        if correct_headings == 0 and wrong_headings == 0:
            if re.search(r"^##\s+(No confirmed bugs|Zero confirmed bugs)\s*$",
                         bugs_content, re.MULTILINE | re.IGNORECASE):
                pass_("零 Bug 執行 — 不預期有標題")
            else:
                bug_count = wrong_headings + deep_headings + bold_headings + bullet_headings
                warn("在 BUGS.md 中未發現 ### BUG-NNN 標題")
        else:
            bug_count = correct_headings + wrong_headings + bold_headings + bullet_headings

    # 擷取規範的 bug ID：BUG-NNN 或 BUG-HNN / BUG-MNN / BUG-LNN
    raw = re.findall(r"BUG-(?:[HML][0-9]+|[0-9]+)", bugs_content)
    filtered = [b for b in raw if re.fullmatch(r"BUG-(?:[HML][0-9]+|[0-9]+)", b)]
    bug_ids = sorted(set(filtered))

    return bug_count, bug_ids


def check_tdd_sidecar(q, bug_count):
    """TDD 附隨 JSON (基準測試 14, 41)。"""
    print("[TDD 附隨 JSON]")
    json_path = _resolve_artifact_path(q, "results/tdd-results.json")

    if bug_count <= 0:
        info("零 Bug — 不要求 tdd-results.json")
        return None

    if not json_path.is_file():
        fail(f"tdd-results.json 缺失 ({bug_count} 個 Bug 需要它)")
        return None

    pass_(f"tdd-results.json 已存在 ({bug_count} 個 Bug)")

    data = load_json(json_path)
    if data is None:
        # 檔案存在但無法解析 — 失敗所有根鍵檢查
        for key in ["schema_version", "skill_version", "date", "project",
                    "bugs", "summary"]:
            fail(f"缺失根鍵 '{key}'")
        fail("schema_version 為 'missing'，預期為 '1.1'")
        return None

    for key in ["schema_version", "skill_version", "date", "project",
                "bugs", "summary"]:
        if has_key(data, key):
            pass_(f"具有 '{key}'")
        else:
            fail(f"缺失根鍵 '{key}'")

    sv = get_str(data, "schema_version")
    if sv == "1.1":
        pass_("schema_version 為 '1.1'")
    else:
        fail(f"schema_version 為 '{sv or 'missing'}'，預期為 '1.1'")

    bugs_list = data.get("bugs") if isinstance(data, dict) else None
    if not isinstance(bugs_list, list):
        bugs_list = []

    for field in ["id", "requirement", "red_phase", "green_phase",
                  "verdict", "fix_patch_present", "writeup_path"]:
        fcount = count_per_bug_field(bugs_list, field)
        if fcount >= bug_count:
            pass_(f"每個 Bug 的 '{field}' 欄位已存在 ({fcount}x)")
        elif fcount > 0:
            warn(f"每個 Bug 的 '{field}' 欄位發現 {fcount}x，預期為 {bug_count}")
        else:
            fail(f"每個 Bug 的 '{field}' 欄位完全缺失")

    # 非規範的欄位名稱 (在任何層級 — 檢查根目錄和 bug)
    bad_fields = ["bug_id", "bug_name", "status", "phase", "result"]
    for bad in bad_fields:
        found = has_key(data, bad) or any(
            has_key(b, bad) for b in bugs_list if isinstance(b, dict)
        )
        if found:
            fail(f"發現非規範欄位 '{bad}' (請使用標準欄位名稱)")

    summary = data.get("summary") if isinstance(data, dict) else None
    if not isinstance(summary, dict):
        summary = {}
    for skey in ["total", "verified", "confirmed_open", "red_failed", "green_failed"]:
        if skey in summary:
            pass_(f"摘要中具有 '{skey}'")
        else:
            fail(f"摘要中缺失 '{skey}' 計數")

    # 日期驗證
    tdd_date = get_str(data, "date")
    status = validate_iso_date(tdd_date)
    if status == "empty":
        fail("tdd-results.json 日期欄位缺失或為空")
    elif status == "bad_format":
        fail(f"tdd-results.json 日期 '{tdd_date}' 不是 ISO 8601 (YYYY-MM-DD)")
    elif status == "placeholder":
        fail(f"tdd-results.json 日期為佔位符 '{tdd_date}'")
    elif status == "future":
        fail(f"tdd-results.json 日期 '{tdd_date}' 位於未來")
    else:
        pass_(f"tdd-results.json 日期 '{tdd_date}' 有效")

    # 結論枚舉
    allowed_verdicts = {"TDD verified", "red failed", "green failed",
                        "confirmed open", "deferred"}
    bad_verdicts = 0
    for b in bugs_list:
        if isinstance(b, dict) and "verdict" in b:
            v = b.get("verdict")
            if v not in allowed_verdicts:
                bad_verdicts += 1
    if bad_verdicts == 0:
        pass_("所有結論值皆為規範值")
    else:
        fail(f"{bad_verdicts} 個非規範的結論值")

    return data


def check_tdd_logs(q, bug_count, bug_ids, tdd_data):
    """TDD 紀錄檔與附隨資料至紀錄檔的交叉驗證。"""
    print("[TDD 紀錄檔]")
    if bug_count <= 0:
        info("零 Bug — 不要求 TDD 紀錄檔")
        return

    patches_dir = _resolve_artifact_path(q, "patches")
    results_dir = _resolve_artifact_path(q, "results")
    valid_tags = {"RED", "GREEN", "NOT_RUN", "ERROR"}

    red_found = 0
    red_missing = 0
    green_found = 0
    green_missing = 0
    green_expected = 0
    red_bad_tag = 0
    green_bad_tag = 0

    for bid in bug_ids:
        red_log = results_dir / f"{bid}.red.log"
        if red_log.is_file():
            red_found += 1
            tag = read_first_line_stripped(red_log)
            if tag not in valid_tags:
                red_bad_tag += 1
        else:
            red_missing += 1

        fix_patch = first_file_matching(patches_dir, [f"{bid}-fix*.patch"])
        if fix_patch is not None:
            green_expected += 1
            green_log = results_dir / f"{bid}.green.log"
            if green_log.is_file():
                green_found += 1
                tag = read_first_line_stripped(green_log)
                if tag not in valid_tags:
                    green_bad_tag += 1
            else:
                green_missing += 1

    if red_missing == 0 and red_found > 0:
        pass_(f"所有 {red_found} 個已確認的 bug 皆具備紅燈階段紀錄")
    elif red_found > 0:
        fail(f"{red_missing} 個已確認的 bug 缺失紅燈階段紀錄 (BUG-NNN.red.log)")
    else:
        fail("未發現紅燈階段紀錄 (每個已確認的 bug 皆需要 quality/results/BUG-NNN.red.log)")

    if green_expected > 0:
        if green_missing == 0:
            pass_(f"所有 {green_found} 個具備修復補丁的 bug 皆具備綠燈階段紀錄")
        else:
            fail(f"{green_missing} 個具備修復補丁的 bug 缺失綠燈階段紀錄 (BUG-NNN.green.log)")
    else:
        info("未發現修復補丁 — 不要求綠燈階段紀錄")

    if red_bad_tag > 0:
        fail(f"{red_bad_tag} 個紅燈階段紀錄缺失有效的首行狀態標籤 (預期為 RED/GREEN/NOT_RUN/ERROR)")
    elif red_found > 0:
        pass_("所有紅燈階段紀錄皆具備有效的狀態標籤")
    if green_bad_tag > 0:
        fail(f"{green_bad_tag} 個綠燈階段紀錄缺失有效的首行狀態標籤 (預期為 RED/GREEN/NOT_RUN/ERROR)")
    elif green_found > 0:
        pass_("所有綠燈階段紀錄皆具備有效的狀態標籤")

    # 附隨資料至紀錄檔之交叉驗證 (BUG-M18)
    if tdd_data is not None and isinstance(tdd_data, dict):
        bugs_list = tdd_data.get("bugs") or []
        if not isinstance(bugs_list, list):
            bugs_list = []
        # 依 ID 索引 bug 以供查閱
        bug_by_id = {}
        for b in bugs_list:
            if isinstance(b, dict) and isinstance(b.get("id"), str):
                bug_by_id[b["id"]] = b

        xv_checked = 0
        xv_mismatch = 0

        for bid in bug_ids:
            bug_obj = bug_by_id.get(bid)
            sidecar_red = get_str(bug_obj, "red_phase") if bug_obj else ""
            sidecar_green = get_str(bug_obj, "green_phase") if bug_obj else ""

            red_log = results_dir / f"{bid}.red.log"
            if sidecar_red and red_log.is_file():
                log_tag = read_first_line_stripped(red_log)
                xv_checked += 1
                if sidecar_red == "fail" and log_tag != "RED":
                    xv_mismatch += 1
                    fail(f"{bid}：附隨資料 red_phase='{sidecar_red}' 但紀錄檔首行為 '{log_tag}' (預期為 RED)")
                elif sidecar_red == "pass" and log_tag != "GREEN":
                    xv_mismatch += 1
                    fail(f"{bid}：附隨資料 red_phase='{sidecar_red}' 但紀錄檔首行為 '{log_tag}' (預期為 GREEN)")

            green_log = results_dir / f"{bid}.green.log"
            if sidecar_green and green_log.is_file():
                log_tag = read_first_line_stripped(green_log)
                xv_checked += 1
                if sidecar_green == "pass" and log_tag != "GREEN":
                    xv_mismatch += 1
                    fail(f"{bid}：附隨資料 green_phase='{sidecar_green}' 但紀錄檔首行為 '{log_tag}' (預期為 GREEN)")
                elif sidecar_green == "fail" and log_tag != "RED":
                    xv_mismatch += 1
                    fail(f"{bid}：附隨資料 green_phase='{sidecar_green}' 但紀錄檔首行為 '{log_tag}' (預期為 RED)")

        if xv_checked > 0 and xv_mismatch == 0:
            pass_(f"附隨資料至紀錄檔之交叉驗證通過 ({xv_checked} 項檢查)")
        elif xv_checked == 0:
            info("附隨資料至紀錄檔之交叉驗證：無匹配項可供檢查")

    # TDD_TRACEABILITY.md
    if red_found > 0:
        if (q / "TDD_TRACEABILITY.md").is_file():
            pass_(f"TDD_TRACEABILITY.md 已存在 ({red_found} 個具有紅燈階段結果的 bug)")
        else:
            fail("TDD_TRACEABILITY.md 缺失 (當 bug 具有紅燈階段結果時為強制性)")


def check_integration_sidecar(q, strictness):
    """整合附隨 JSON 區段。"""
    print("[整合附隨 JSON]")
    ij = _resolve_artifact_path(q, "results/integration-results.json")

    if not ij.is_file():
        if strictness == "benchmark":
            warn("integration-results.json 不存在")
        else:
            info("integration-results.json 不存在 (在一般模式下為選用)")
        return

    data = load_json(ij)

    for key in ["schema_version", "skill_version", "date", "project",
                "recommendation", "groups", "summary", "uc_coverage"]:
        if has_key(data, key):
            pass_(f"具有 '{key}'")
        else:
            fail(f"缺失鍵 '{key}'")

    summary = data.get("summary") if isinstance(data, dict) else None
    if not isinstance(summary, dict):
        summary = {}
    for iskey in ["total_groups", "passed", "failed", "skipped"]:
        if iskey in summary:
            pass_(f"整合摘要具有 '{iskey}'")
        else:
            fail(f"整合摘要缺失必要的子鍵 '{iskey}'")

    isv = get_str(data, "schema_version")
    if isv == "1.1":
        pass_("整合 schema_version 為 '1.1'")
    else:
        fail(f"整合 schema_version 為 '{isv or 'missing'}'，預期為 '1.1'")

    int_date = get_str(data, "date")
    if int_date:  # 匹配 bash：if [ -n "$int_date" ]
        status = validate_iso_date(int_date)
        if status == "bad_format":
            fail(f"integration-results.json 日期 '{int_date}' 不是 ISO 8601 (YYYY-MM-DD)")
        elif status == "placeholder":
            fail(f"integration-results.json 日期為佔位符 '{int_date}'")
        elif status == "future":
            fail(f"integration-results.json 日期 '{int_date}' 位於未來")
        else:
            pass_(f"integration-results.json 日期 '{int_date}' 有效")

    rec = get_str(data, "recommendation")
    if rec in ("SHIP", "FIX BEFORE MERGE", "BLOCK"):
        pass_(f"建議 '{rec}' 為規範值")
    elif rec:
        fail(f"建議 '{rec}' 為非規範值 (必須為 SHIP/FIX BEFORE MERGE/BLOCK)")
    else:
        fail("建議缺失")

    # groups[].result 枚舉
    allowed_results = {"pass", "fail", "skipped", "error"}
    bad_results = 0
    groups = data.get("groups") if isinstance(data, dict) else None
    if isinstance(groups, list):
        for g in groups:
            if isinstance(g, dict) and "result" in g:
                if g.get("result") not in allowed_results:
                    bad_results += 1
    if bad_results == 0:
        pass_("所有 groups[].result 值皆為規範值")
    else:
        fail(f"{bad_results} 個非規範的 groups[].result 值 (必須為 pass/fail/skipped/error)")

    # uc_coverage 值枚舉
    allowed_uc = {"covered_pass", "covered_fail", "not_mapped"}
    bad_uc = 0
    uc_cov = data.get("uc_coverage") if isinstance(data, dict) else None
    if isinstance(uc_cov, dict):
        for v in uc_cov.values():
            if v not in allowed_uc:
                bad_uc += 1
    if bad_uc == 0:
        pass_("所有 uc_coverage 值皆為規範值")
    else:
        fail(f"{bad_uc} 個非規範的 uc_coverage 值 (必須為 covered_pass/covered_fail/not_mapped)")


def check_recheck_sidecar(q):
    """複檢附隨 JSON (schema 1.0，使用 'results' 鍵而非 'bugs')。"""
    print("[複檢附隨 JSON]")
    rj = _resolve_artifact_path(q, "results/recheck-results.json")
    rs = _resolve_artifact_path(q, "results/recheck-summary.md")

    if not rj.is_file():
        info("recheck-results.json 不存在 (僅在執行複檢模式時要求)")
        return

    pass_("recheck-results.json 已存在")
    data = load_json(rj)

    # SKILL.md 複檢範本使用 'results' 作為陣列鍵，而非 'bugs'。
    for key in ["schema_version", "skill_version", "date", "project",
                "results", "summary"]:
        if has_key(data, key):
            pass_(f"複檢具有 '{key}'")
        else:
            fail(f"複檢缺失根鍵 '{key}'")

    rsv = get_str(data, "schema_version")
    if rsv == "1.0":
        pass_("複檢 schema_version 為 '1.0'")
    else:
        fail(f"複檢 schema_version 為 '{rsv or 'missing'}'，預期為 '1.0'")

    rdate = get_str(data, "date")
    if rdate:
        status = validate_iso_date(rdate)
        if status == "bad_format":
            fail(f"recheck-results.json 日期 '{rdate}' 不是 ISO 8601 (YYYY-MM-DD)")
        elif status == "placeholder":
            fail(f"recheck-results.json 日期為佔位符 '{rdate}'")
        elif status == "future":
            fail(f"recheck-results.json 日期 '{rdate}' 位於未來")
        else:
            pass_(f"recheck-results.json 日期 '{rdate}' 有效")

    if rs.is_file():
        pass_("recheck-summary.md 已存在")
    else:
        fail("recheck-summary.md 缺失 (為 recheck-results.json 的必要隨附檔案)")


def check_use_cases(repo_dir, q, strictness):
    """使用案例識別碼區段 (基準測試 43, 48)。"""
    print("[使用案例]")
    req_md = q / "REQUIREMENTS.md"
    if not req_md.is_file():
        fail("REQUIREMENTS.md 缺失")
        return

    try:
        req_content = req_md.read_text(encoding="utf-8", errors="replace")
    except OSError:
        req_content = ""

    # uc_ids：匹配 UC-N 的行數 (bash grep -cE 計算行數)
    uc_ids = sum(1 for ln in req_content.splitlines()
                 if re.search(r"UC-[0-9]+", ln))
    uc_unique = len(set(re.findall(r"UC-[0-9]+", req_content)))

    src_count = count_source_files(repo_dir) if repo_dir.is_dir() else 0
    min_uc = 3 if src_count < 5 else 5

    if uc_unique >= min_uc:
        pass_(f"發現 {uc_unique} 個不同的 UC 識別碼 (共 {uc_ids} 次引用，{src_count} 個原始碼檔案)")
    elif uc_unique > 0:
        connector = "針對" if strictness == "general" else "要求針對"
        msg = f"僅發現 {uc_unique} 個不同的 UC 識別碼 (至少需要 {min_uc} 個 {connector} {src_count} 個原始碼檔案)"
        if strictness == "general":
            warn(msg)
        else:
            fail(msg)
    else:
        fail("REQUIREMENTS.md 中無規範的 UC-NN 識別碼")


def check_test_file_extension(repo_dir, q):
    """測試檔案副檔名需匹配專案語言 (基準測試 47)。"""
    print("[測試檔案副檔名]")
    func_test = first_file_matching(q, ["test_functional.*", "functional_test.*",
                                        "FunctionalSpec.*", "FunctionalTest.*",
                                        "functional.test.*"])
    reg_test = first_file_matching(q, ["test_regression.*"])

    if func_test is None:
        warn("在支援的命名矩陣中未發現功能測試檔案")
        return

    ext = func_test.suffix.lstrip(".") if func_test.suffix else ""
    detected_lang = detect_project_language(repo_dir) if repo_dir.is_dir() else ""

    if not detected_lang:
        info(f"無法偵測專案語言 — 略過副檔名檢查 (test_functional.{ext})")
        return

    lang_to_valid = {
        "go": "go",
        "py": "py",
        "java": "java",
        "kt": "kt java",
        "rs": "rs",
        "ts": "ts",
        "js": "js ts",
        "scala": "scala",
        "c": "c py sh",
        "agc": "py sh",
    }
    valid_ext = lang_to_valid.get(detected_lang, "")
    valid_list = valid_ext.split()
    primary = valid_list[0] if valid_list else ""

    if ext in valid_list:
        pass_(f"{func_test.name} 匹配專案語言 ({detected_lang})")
    else:
        fail(f"{func_test.name} 不匹配專案語言 ({detected_lang}) — 預期為 .{primary}")

    if reg_test is not None:
        reg_ext = reg_test.suffix.lstrip(".") if reg_test.suffix else ""
        if reg_ext in valid_list:
            pass_(f"test_regression.{reg_ext} 匹配專案語言 ({detected_lang})")
        else:
            fail(f"test_regression.{reg_ext} 不匹配專案語言 ({detected_lang}) — 預期為 .{primary}")


def check_terminal_gate(q):
    """PROGRESS.md 中的 Terminal Gate 區段。"""
    print("[Terminal Gate]")
    progress_md = q / "PROGRESS.md"
    if not progress_md.is_file():
        return
    pat = re.compile(r"^#+ *Terminal", re.IGNORECASE | re.MULTILINE)
    if file_contains(progress_md, pat):
        pass_("PROGRESS.md 具有 Terminal Gate 區段")
    else:
        fail("PROGRESS.md 缺失 Terminal Gate 區段")


def check_mechanical(q):
    """機械式驗證區段。"""
    print("[機械式驗證]")
    mech_dir = _resolve_artifact_path(q, "mechanical")
    if not mech_dir.is_dir():
        info("無 mechanical/ 目錄")
        return
    verify_sh = mech_dir / "verify.sh"
    if not verify_sh.is_file():
        fail("mechanical/ 已存在但 verify.sh 缺失")
        return
    pass_("verify.sh 已存在")

    mv_log = _resolve_artifact_path(q, "results/mechanical-verify.log")
    mv_exit = _resolve_artifact_path(q, "results/mechanical-verify.exit")
    if mv_log.is_file() and mv_exit.is_file():
        try:
            exit_code = mv_exit.read_text(encoding="utf-8", errors="replace")
        except OSError:
            exit_code = ""
        exit_code = re.sub(r"\s", "", exit_code)
        if exit_code == "0":
            pass_("mechanical-verify.exit 為 0")
        else:
            fail(f"mechanical-verify.exit 為 '{exit_code}'，預期為 0")
    else:
        fail("驗證收據檔案缺失")


def check_patches(q, bug_count, bug_ids, strictness):
    """補丁區段 (基準測試 44)。"""
    print("[補丁]")
    if bug_count <= 0:
        return

    patches_dir = _resolve_artifact_path(q, "patches")

    # 迴歸測試檔案 — 當有 bug 存在時為必要項
    reg_test_file = None
    if q.is_dir():
        reg_files = sorted(q.glob("test_regression.*"))
        if reg_files:
            reg_test_file = reg_files[0]

    if reg_test_file is not None:
        pass_(f"test_regression.* 已存在 ({bug_count} 個已確認的 bug 要求具備它)")
    else:
        msg = "test_regression.* 缺失 — 當有 bug 存在時為必要項 (SKILL.md 產出物合約)"
        if strictness == "benchmark":
            fail(msg)
        else:
            warn(msg)

    reg_patch_count = 0
    fix_patch_count = 0
    reg_patch_missing = 0
    for bid in bug_ids:
        if first_file_matching(patches_dir, [f"{bid}-regression*.patch"]) is not None:
            reg_patch_count += 1
        else:
            reg_patch_missing += 1
        if first_file_matching(patches_dir, [f"{bid}-fix*.patch"]) is not None:
            fix_patch_count += 1

    if reg_patch_missing == 0 and reg_patch_count > 0:
        pass_(f"針對 {bug_count} 個 bug 的 {reg_patch_count} 個迴歸測試補丁")
    elif reg_patch_count > 0:
        fail(f"{reg_patch_missing} 個 bug 缺失迴歸測試補丁")
    else:
        fail("未發現迴歸測試補丁 (要求具備 quality/patches/BUG-NNN-regression-test.patch)")

    if fix_patch_count > 0:
        pass_(f"{fix_patch_count} 個修復補丁")
    else:
        warn("0 個修復補丁 (修復補丁為選用，但強烈建議具備)")

    total_patches = reg_patch_count + fix_patch_count
    info(f"總計：quality/patches/ 內有 {total_patches} 個補丁檔案")


# 由第 5 階段撰寫 stub 產生的未填充範本標記片語。
# 撰寫文件中若存在這些字串，則是範本在發送時未從 BUGS.md 填充其內容欄位的強力證據。
# 請參閱 bin/run_playbook.py::phase5_prompt 了解產生用的提示。
_WRITEUP_TEMPLATE_SENTINELS = (
    "is a confirmed code bug in ``",
    "The affected implementation lives at ``",
    "Patch path: ``",
    "- Regression test: ``",
    "- Regression patch: ``",
)

# 匹配 ```diff 圍欄區塊並擷取其主體以進行內容檢查。
_WRITEUP_DIFF_BLOCK_RE = re.compile(r"```diff\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)


def _writeup_diff_is_non_empty(text):
    """若 ``text`` 中的任何 ```diff 區塊包含至少一行統一差異 
    (非 `+++`/`---` 檔案標頭字首的 `+` 或 `-`)，則傳回 True。"""
    for block in _WRITEUP_DIFF_BLOCK_RE.findall(text):
        for line in block.splitlines():
            stripped = line.lstrip()
            if stripped.startswith("+++") or stripped.startswith("---"):
                continue
            if stripped.startswith(("+", "-")):
                return True
    return False


def check_writeups(q, bug_count):
    """Bug 撰寫文件區區段 (基準測試 30)。"""
    print("[Bug 撰寫文件]")
    if bug_count <= 0:
        return

    writeups_dir = _resolve_artifact_path(q, "writeups")
    writeup_count = 0
    writeup_diff_count = 0
    empty_diff_writeups = []
    sentinel_writeups = []
    if writeups_dir.is_dir():
        writeup_files = sorted(p for p in writeups_dir.glob("BUG-*.md") if p.is_file())
        writeup_count = len(writeup_files)
        for wf in writeup_files:
            try:
                text = wf.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            # 存在性測試使用與內容測試相同的正規表示式，因此
            # 兩者永遠不會在圍欄是否存在上產生分歧。不分大小寫的
            # 匹配一致地接受 ```diff / ```Diff / ```DIFF — 操作員
            # 經常將圍欄標籤大寫，而閘絕不能自動略過
            # 這些撰寫文件 (否則內容非空檢查將永遠不會觸發，
            # 在一個明顯包含統一差異的撰寫文件上產生令人困惑的 "無內嵌修復差異" FAIL)。
            if _WRITEUP_DIFF_BLOCK_RE.search(text):
                writeup_diff_count += 1
                if not _writeup_diff_is_non_empty(text):
                    empty_diff_writeups.append(wf.name)
            if any(s in text for s in _WRITEUP_TEMPLATE_SENTINELS):
                sentinel_writeups.append(wf.name)

    if writeup_count >= bug_count:
        pass_(f"{writeup_count} 個撰寫文件對應 {bug_count} 個 bug")
    elif writeup_count > 0:
        fail(f"{writeup_count} 個撰寫文件對應 {bug_count} 個 bug — 所有已確認的 bug 皆要求具備撰寫文件 (SKILL.md 第 1454 行)")
    else:
        fail(f"無 {bug_count} 個已確認 bug 的撰寫文件")

    if writeup_count > 0:
        if writeup_diff_count >= writeup_count:
            pass_(f"所有 {writeup_diff_count} 個撰寫文件皆具備內嵌修復差異")
        elif writeup_diff_count > 0:
            fail(f"僅 {writeup_diff_count}/{writeup_count} 個撰寫文件具備內嵌修復差異 (所有撰寫文件皆要求具備第 6 節差異)")
        else:
            fail("無撰寫文件具備內嵌修復差異 (第 6 節 'The fix' 必須包含一個 ```diff 區塊)")

        # 非空差異內容檢查。一個不具備 `+`/`-` 主體的 ```diff 圍欄 
        # 是一個範本 stub — 舊版僅檢查存在性的方式會讓這些通過。
        if empty_diff_writeups:
            preview = ", ".join(empty_diff_writeups[:5])
            suffix = f" (還有 +{len(empty_diff_writeups) - 5} 個)" if len(empty_diff_writeups) > 5 else ""
            fail(
                f"{len(empty_diff_writeups)} 個撰寫文件具備空的 ```diff 區塊 "
                f"(圍欄存在，但無 +/- 行)：{preview}{suffix}"
            )
        else:
            pass_("所有撰寫文件的 ```diff 區塊皆包含統一差異內容")

        # 範本標記檢查。撰寫文件中若仍存在這些字串，表示第 5 階段撰寫 stub
        # 在發送時未從 BUGS.md 填充內容。
        if sentinel_writeups:
            preview = ", ".join(sentinel_writeups[:5])
            suffix = f" (還有 +{len(sentinel_writeups) - 5} 個)" if len(sentinel_writeups) > 5 else ""
            fail(
                f"{len(sentinel_writeups)} 個撰寫文件包含未填充的範本標記 "
                f"('is a confirmed code bug in'、'The affected implementation lives at'、"
                f"'Patch path:'、'Regression test:' 或 'Regression patch:' 之後有空的反引號)："
                f"{preview}{suffix}"
            )
        else:
            pass_("無撰寫文件包含未填充的範本標記")


def check_version_stamps(repo_dir, q):
    """版本戳記一致性 (基準測試 26)。傳回偵測到的 skill_version。"""
    print("[版本戳記]")
    skill_version = detect_skill_version([
        repo_dir / "SKILL.md",
        repo_dir / ".claude" / "skills" / "quality-playbook" / "SKILL.md",
        repo_dir / ".github" / "skills" / "SKILL.md",
        repo_dir / ".github" / "skills" / "quality-playbook" / "SKILL.md",
        SCRIPT_DIR / ".." / "SKILL.md",
        SCRIPT_DIR / "SKILL.md",
    ])

    if not skill_version:
        warn("無法從 SKILL.md 偵測技能版本")
        return skill_version

    progress_md = q / "PROGRESS.md"
    if progress_md.is_file():
        pv = read_skill_value_line(progress_md, "Skill version:")
        if pv == skill_version:
            pass_(f"PROGRESS.md 版本匹配 ({skill_version})")
        elif pv:
            fail(f"PROGRESS.md 版本 '{pv}' != '{skill_version}'")
        else:
            warn("PROGRESS.md 缺失 Skill version 欄位")

    json_path = _resolve_artifact_path(q, "results/tdd-results.json")
    if json_path.is_file():
        data = load_json(json_path)
        tv = get_str(data, "skill_version")
        if tv == skill_version:
            pass_("tdd-results.json skill_version 匹配")
        elif tv:
            fail(f"tdd-results.json skill_version '{tv}' != '{skill_version}'")

    return skill_version


def check_cross_run_contamination(repo_dir, q, version_arg, skill_version):
    """跨執行污染偵測。"""
    print("[跨執行污染]")
    repo_name = repo_dir.name
    if skill_version and version_arg:
        matches = re.findall(r"[0-9]+\.[0-9]+\.[0-9]+", repo_name)
        dir_version = matches[-1] if matches else ""
        if dir_version and dir_version != skill_version:
            fail(f"目錄版本 '{dir_version}' != 技能版本 '{skill_version}' — 可能存在跨執行污染")
        else:
            pass_("未偵測到版本不匹配")

    json_path = _resolve_artifact_path(q, "results/tdd-results.json")
    if json_path.is_file() and skill_version:
        data = load_json(json_path)
        json_sv = get_str(data, "skill_version")
        if json_sv and json_sv != skill_version:
            fail(f"tdd-results.json skill_version '{json_sv}' != SKILL.md '{skill_version}' — 可能是先前執行的過時產出物？")


def _check_exploration_sections(path):
    """檢查 EXPLORATION.md 是否包含所有必要的區段標題。"""
    required_sections = [
        "## Open Exploration Findings",
        "## Quality Risks",
        "## Pattern Applicability Matrix",
        "## Candidate Bugs for Phase 2",
        "## Gate Self-Check",
    ]
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        fail(f"EXPLORATION.md 無法讀取：{exc}")
        return
    for section in required_sections:
        if section not in content:
            fail(f"EXPLORATION.md 缺失必要區段：{section!r}")


def check_run_metadata(q):
    """驗證執行 Metadata 附隨 JSON (run-YYYY-MM-DDTHH-MM-SS.json)。"""
    print("[執行 Metadata]")
    results_dir = _resolve_artifact_path(q, "results")
    pattern = str(results_dir / "run-*.json")
    import glob as _glob
    matches = _glob.glob(pattern)
    if not matches:
        fail("執行 Metadata JSON 缺失 (預期為 quality/results/run-YYYY-MM-DDTHH-MM-SS.json)")
        return
    if len(matches) > 1:
        warn(f"發現多個執行 Metadata 檔案：{len(matches)}")
    filename_re = re.compile(r"run-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$")
    for path in matches:
        if not filename_re.search(path):
            fail(f"執行 Metadata 檔名不符合預期格式：{path}")
        data = load_json(Path(path))
        if data is None:
            fail(f"執行 Metadata JSON 解析錯誤：{path}")
            continue
        required_fields = ("schema_version", "skill_version", "project", "model", "runner", "start_time")
        for field in required_fields:
            if not data.get(field):
                fail(f"執行 Metadata 缺失或欄位為空：{field!r}")
    pass_("執行 Metadata JSON 已存在")


# --- 個別儲存庫進入點 ---


# ---------------------------------------------------------------------------
# v1.5.1 Layer-1 機械式不變量 (schemas.md §10)。
#
# 每項檢查在 v1.5.1 之前的執行中皆會優雅地不執行任何操作 (缺失資訊清單 = 舊版
# 儲存庫；無需強制執行)。當存在 v1.5.1 產出物時，下列每項不變量都會被
# 機械式地強制執行，並以特定的 <路徑>: <原因> 訊息回報 FAIL，以便操作員
# 可以在不重新執行整個攻略的情況下修復單個產出物。
# ---------------------------------------------------------------------------

_V150_VALID_DISPOSITIONS = (
    "code-fix",
    "spec-fix",
    "upstream-spec-issue",
    "mis-read",
    "deferred",
)
_V150_VALID_FIX_TYPES = ("code", "spec", "both")
_V150_ILLEGAL_FIX_PAIRS = {
    ("code-fix", "spec"),
    ("spec-fix", "code"),
    ("upstream-spec-issue", "code"),
    ("mis-read", "both"),
}
_V150_SUPPORTED_EXTENSIONS = (".txt", ".md")
# v1.5.4 第一部分 / 第一輪委員會發現 C2-1：INDEX 架構現在
# 根據版本路由。新的執行必須發出包含 target_role_breakdown 
# 的 schema_version "2.0"；舊版封存檔則包含具有 
# target_project_type 的 schema_version "1.0" (或完全沒有 
# schema_version)。兩種架構共有的欄位位於 _V150_INDEX_COMMON_FIELDS；
# 版本特定欄位則位於其各自的元組中，並在驗證時選取。
#
# v1.5.4 第二輪委員會發現 C1：SCHEMA_VERSION_CURRENT 固定了
# 此閘能理解的版本。未來的架構 (>2.0) 會以明確的錯誤拒絕，
# 而非默默降級至舊版。當 v1.5.5+ 的執行提升架構版本時，
# 也請提升此常數；否則新版閘會故意拒絕新的 INDEX 形狀。
SCHEMA_VERSION_CURRENT = "2.0"
_V150_INDEX_COMMON_FIELDS = (
    "run_timestamp_start",
    "run_timestamp_end",
    "duration_seconds",
    "qpb_version",
    "target_repo_path",
    "target_repo_git_sha",
    "phases_executed",
    "summary",
    "artifacts",
)
_V150_INDEX_LEGACY_FIELDS = ("target_project_type",)
_V154_INDEX_CURRENT_FIELDS = ("target_role_breakdown",)
# 舊版別名：少數迭代前測試仍匯入 _V150_REQUIRED_INDEX_FIELDS 
# 並預期一個元組。在 v1.5.4 當前合約下保留此別名；
# 版本路由式強制執行發生在 check_v1_5_0_index_md 內部。
_V150_REQUIRED_INDEX_FIELDS = (
    _V150_INDEX_COMMON_FIELDS + _V154_INDEX_CURRENT_FIELDS
)
_V150_REQUIRED_SUMMARY_KEYS = ("requirements", "bugs", "gate_verdict")


# ---------------------------------------------------------------------------
# v1.5.3 — 架構擴充 (schemas.md §3.6–§3.10, §4.1, §6.1, §8.1, §10
# 不變量 #21–#23)。欄位存在性偵測 (§3.10) 是針對每個資訊清單
# 切換 v1.5.3 不變量檢查，而非透過 schema_version 比較。
# ---------------------------------------------------------------------------

_V153_VALID_SOURCE_TYPES = (
    "code-derived",
    "skill-section",
    "reference-file",
    "execution-observation",
    # v1.5.6 (來自 v1.5.6 自我啟動的 QG-fail-2)：衍生自
    # 目標儲存庫 `reference_docs/` 樹狀目錄下操作員提供之非正式文件
    # 的 REQ。不同於 `reference-file`，schemas.md §3.7 將其連結至 
    # `references/` 下隨 QPB 出貨的參考檔案。第二階段 LLM 
    # 根據名稱區分這兩個證據來源；現在架構與閘已相符。
    "docs-derived",
)
_V153_VALID_DIVERGENCE_TYPES = (
    "code-spec",
    "internal-prose",
    "prose-to-code",
    "execution",
)
_V153_VALID_FORMAL_DOC_ROLES = (
    "external-spec",
    "project-spec",
    "skill-self-spec",
    "skill-reference",
)

# DQ-3 (v1.5.3 第三階段 / 第二輪委員會)：v1.5.3 欄位存在性
# 偵測鍵值組為模組層級，以便迴歸測試可以將其與 schemas.md 的
# 列舉欄位列表進行比對。未來若架構新增 (例如第五個僅限 v1.5.3 的欄位)
# 僅更新此常數而未更新測試的字面量，將導致迴歸測試失敗，
# 從而強制同步維護並使變更顯露出來以供明確審閱。
_V153_FIELD_KEYS = frozenset({"source_type", "divergence_type", "role"})


def _is_v1_5_3_shaped(manifest):
    """若 *manifest* 中的任何記錄包含 v1.5.3 欄位，則傳回 True。

    遍歷記錄 (或 `reviews`) 一次。在任何記錄上若存在 _V153_FIELD_KEYS 
    中的任何鍵，皆會依 schemas.md §3.10 切換至每個資訊清單的嚴格模式驗證。
    空或無法解析的資訊清單傳回 False，以便舊版裝置保持在軟性警告路徑上。

    DQ-3 設計說明：檢查鍵組源自 _V153_FIELD_KEYS (一個模組層級的 frozenset)
    而非硬編碼在此函式主體中。test_quality_gate.py::TestV153FieldKeysContract 
    中的迴歸測試將 _V153_FIELD_KEYS 與字面量 `{"source_type", "divergence_type", "role"}` 
    釘在一起，因此未來維護人員在架構中新增僅限 v1.5.3 的欄位時，
    不會遺漏更新偵測輔助函式。
    """
    if not isinstance(manifest, dict):
        return False
    records = manifest.get("records")
    if not isinstance(records, list):
        records = manifest.get("reviews") if isinstance(
            manifest.get("reviews"), list
        ) else []
    for rec in records:
        if not isinstance(rec, dict):
            continue
        if not _V153_FIELD_KEYS.isdisjoint(rec.keys()):
            return True
    return False


def _v150_manifest(q, name):
    """傳回解析後的最上層 JSON 物件，若缺失或無效則傳回 None。"""
    path = q / name
    if not path.is_file():
        return None
    data = load_json(path)
    if isinstance(data, dict):
        return data
    fail(f"{path.name}：不是有效的 JSON 物件 (schemas.md §1.6)")
    return None


def check_v1_5_0_cite_extensions(repo_dir):
    """§10 不變量 #9 — reference_docs/cite/ 僅包含 .txt/.md。

    v1.5.2 將舊有的 formal_docs/+informal_docs/ 分層合併為單一的 
    reference_docs/ 樹狀目錄，並以 reference_docs/cite/ 存放可引用教材。
    僅限純文字的約束現在適用於該 cite 資料夾；該檢查保留了 
    v1.5.0 不變量背景 (因此有 _v1_5_0_ 名稱首碼)。
    """
    folder = repo_dir / "reference_docs" / "cite"
    if not folder.is_dir():
        return
    any_file = False
    for path in sorted(folder.rglob("*")):
        if not path.is_file():
            continue
        any_file = True
        if path.name == "README.md":
            continue
        if path.name.endswith(".meta.json"):
            continue
        # v1.5.6 (來自 v1.5.6 自我啟動的 QG-fail-1)：`.gitkeep` 
        # 是已記載的哨兵檔案，即使採用者尚無可引用之純文字，
        # 也能將 `reference_docs/cite/` 固定在版本控制中。
        # 預行檢查預期其存在；閘絕不能拒絕它。
        if path.name == ".gitkeep":
            continue
        ext = path.suffix.lower()
        if ext not in _V150_SUPPORTED_EXTENSIONS:
            rel = path.relative_to(repo_dir).as_posix()
            fail(
                f"{rel}：在 reference_docs/cite/ 下不支援的副檔名 {ext or '(none)'} "
                "(schemas.md §2 僅允許 .txt, .md；§10 不變量 #9)"
            )
    if any_file:
        pass_("reference_docs/cite/：所有檔案皆使用支援的副檔名")


def check_v1_5_0_manifest_wrappers(q):
    """§10 不變量 #13 — 資訊清單包裝外形。

    四個以記錄形式呈現的資訊清單 (formal_docs / requirements / use_cases / 
    bugs) 使用 `records`；citation_semantic_check.json 使用 `reviews` 
    (schemas.md §9.1)。每個資訊清單必須帶有 schema_version + 
    generated_at 並作為非空字串。
    """
    record_shaped = (
        "formal_docs_manifest.json",
        "requirements_manifest.json",
        "use_cases_manifest.json",
        "bugs_manifest.json",
    )
    for name in record_shaped:
        data = _v150_manifest(q, name)
        if data is None:
            continue
        for key in ("schema_version", "generated_at"):
            if not isinstance(data.get(key), str) or not data[key]:
                fail(f"{name}：缺失或最上層 {key!r} 為空 (schemas.md §1.6)")
        if not isinstance(data.get("records"), list):
            fail(f"{name}：缺失或最上層 'records' 不是陣列 (schemas.md §1.6)")
        if "reviews" in data:
            fail(
                f"{name}：具有 'reviews' 鍵 — 根據 schemas.md §9.1 / §10 不變量 #13，"
                "此鍵保留給 citation_semantic_check.json 使用"
            )
        else:
            pass_(f"{name}：資訊清單包裝有效")

    data = _v150_manifest(q, "citation_semantic_check.json")
    if data is not None:
        for key in ("schema_version", "generated_at"):
            if not isinstance(data.get(key), str) or not data[key]:
                fail(
                    f"citation_semantic_check.json：缺失或最上層 {key!r} 為空 "
                    "(schemas.md §1.6)"
                )
        if not isinstance(data.get("reviews"), list):
            fail(
                "citation_semantic_check.json：缺失或最上層 'reviews' 不是陣列 "
                "(schemas.md §9.1 — 語義檢查使用 'reviews' 而非 'records')"
            )
        if "records" in data:
            fail(
                "citation_semantic_check.json：具有 'records' 鍵 — 根據 schemas.md §9.1 / §10 不變量 #13，"
                "語義檢查使用 'reviews'"
            )
        else:
            pass_("citation_semantic_check.json：資訊清單包裝有效")


def _check_citation_block(repo_dir, req_id, citation, formal_docs_by_path, req_tier):
    excerpt = citation.get("citation_excerpt")
    if not isinstance(excerpt, str) or not excerpt:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：引用缺失 citation_excerpt 或為空 "
            "(schemas.md §10 不變量 #4)",
        )
        return
    doc_path_str = citation.get("document")
    if not isinstance(doc_path_str, str) or not doc_path_str:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：引用缺失 'document' 欄位",
        )
        return
    section = citation.get("section")
    line = citation.get("line")
    has_section = isinstance(section, str) and section.strip()
    has_line = isinstance(line, int) and not isinstance(line, bool)
    if not has_section and not has_line:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：引用無區段或行號定位器 "
            "(僅有頁碼是不夠的；schemas.md §10 不變量 #4)",
        )
        return

    fd_rec = formal_docs_by_path.get(doc_path_str)
    if fd_rec is None:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：引用文件 {doc_path_str!r} "
            "不在 formal_docs_manifest.json 中 (schemas.md §10 不變量 #2)",
        )
        return
    fd_tier = fd_rec.get("tier")
    if fd_tier != req_tier:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：層級={req_tier} 與所引用之 FORMAL_DOC "
            f"層級={fd_tier!r} 不匹配 (schemas.md §10 不變量 #14)",
        )
    fd_sha = fd_rec.get("document_sha256")
    cite_sha = citation.get("document_sha256")
    if isinstance(fd_sha, str) and isinstance(cite_sha, str) and fd_sha != cite_sha:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：citation.document_sha256 與 FORMAL_DOC 不符 "
            "(schemas.md §10 不變量 #3 — citation_stale)",
        )

    if _CITATION_VERIFIER is None:
        warn(
            f"requirements_manifest.json：record_id={req_id}：位元組相等性檢查已略過 — "
            "此安裝環境無法使用 bin/citation_verifier"
        )
        return

    doc_path = repo_dir / doc_path_str
    if not doc_path.is_file():
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：引用文件不在磁碟上：{doc_path_str}",
        )
        return
    try:
        bytes_ = doc_path.read_bytes()
        fresh = _CITATION_VERIFIER.extract_excerpt(
            bytes_, doc_path.suffix.lower(), section if has_section else None,
            line if has_line else None,
        )
    except _CITATION_VERIFIER.CitationResolutionError as exc:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：引用位置無法在 "
            f"{doc_path_str} 中解析：{exc.message} (schemas.md §10 不變量 #4)",
        )
        return
    except Exception as exc:  # noqa: BLE001 — 以真實訊息回報失敗
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：引用驗證器發生錯誤：{exc}",
        )
        return

    if fresh != excerpt:
        fail(
            "requirements_manifest.json",
            f"record_id={req_id}：citation_excerpt 與從 {doc_path_str} "
            f"新鮮提取的內容位元組不相等 "
            "(schemas.md §10 不變量 #11 — Layer-1 反幻覺)",
        )


def check_v1_5_0_requirements_manifest(repo_dir, q):
    """§10 不變量 #1, #4, #8, #11, #14 — REQ 形狀、引用門控、functional_section。"""
    req_data = _v150_manifest(q, "requirements_manifest.json")
    if req_data is None:
        return
    records = req_data.get("records")
    if not isinstance(records, list):
        return  # 包裝檢查已回報
    fd_data = _v150_manifest(q, "formal_docs_manifest.json")
    formal_docs_by_path = {}
    if fd_data and isinstance(fd_data.get("records"), list):
        for rec in fd_data["records"]:
            if isinstance(rec, dict) and isinstance(rec.get("source_path"), str):
                formal_docs_by_path[rec["source_path"]] = rec

    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            fail(
                "requirements_manifest.json",
                f"record_id=<#{idx}>：不是一個 JSON 物件",
            )
            continue
        req_id = rec.get("id", f"<#{idx}>")

        fs = rec.get("functional_section")
        if not isinstance(fs, str) or not fs.strip():
            fail(
                "requirements_manifest.json",
                f"record_id={req_id}：缺失 functional_section 或為空 "
                "(schemas.md §10 不變量 #8)",
            )

        tier = rec.get("tier")
        citation = rec.get("citation")
        if tier in (1, 2):
            if not isinstance(citation, dict):
                fail(
                    "requirements_manifest.json",
                    f"record_id={req_id}：為層級 {tier} 但無引用區塊 "
                    "(schemas.md §10 不變量 #1)",
                )
                continue
            _check_citation_block(repo_dir, req_id, citation, formal_docs_by_path, tier)
        elif tier in (3, 4, 5):
            if citation is not None:
                fail(
                    "requirements_manifest.json",
                    f"record_id={req_id}：為層級 {tier} 但帶有引用區塊 "
                    "(根據 schemas.md §10 不變量 #1，引用僅限層級 1/2)",
                )
        elif tier is None:
            fail(
                "requirements_manifest.json",
                f"record_id={req_id}：缺失 'tier' 欄位",
            )
        else:
            fail(
                "requirements_manifest.json",
                f"record_id={req_id}：具有無效的層級 {tier!r} (預期為整數 1–5)",
            )

        # v1.5.2：驗證 REQ 記錄上選用的 `pattern` 欄位。
        pattern = rec.get("pattern")
        if pattern is not None and pattern not in VALID_PATTERN_VALUES:
            fail(
                "requirements_manifest.json",
                f"record_id={req_id}：具有無效的 Pattern {pattern!r} "
                f"(預期為 {sorted(VALID_PATTERN_VALUES)} 之一)",
            )

    pass_("requirements_manifest.json：v1.5.1 Layer-1 REQ 檢查完成")


def check_v1_5_0_bugs_manifest(q):
    """§10 不變量 #7, #12 — 處置完整性 + 合法的 fix_type × 處置。"""
    data = _v150_manifest(q, "bugs_manifest.json")
    if data is None:
        return
    records = data.get("records")
    if not isinstance(records, list):
        return
    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            continue
        bug_id = rec.get("id", f"<#{idx}>")
        disp = rec.get("disposition")
        if disp not in _V150_VALID_DISPOSITIONS:
            fail(
                "bugs_manifest.json",
                f"record_id={bug_id}：具有無效或缺失的處置 {disp!r} "
                f"(schemas.md §10 不變量 #7，有效值為："
                f"{', '.join(_V150_VALID_DISPOSITIONS)})",
            )
            continue
        rationale = rec.get("disposition_rationale")
        if not isinstance(rationale, str) or not rationale.strip():
            fail(
                "bugs_manifest.json",
                f"record_id={bug_id}：具有空或缺失的 disposition_rationale "
                "(schemas.md §10 不變量 #7)",
            )
        ft = rec.get("fix_type")
        if ft not in _V150_VALID_FIX_TYPES:
            fail(
                "bugs_manifest.json",
                f"record_id={bug_id}：具有無效或缺失的 fix_type {ft!r}",
            )
            continue
        if (disp, ft) in _V150_ILLEGAL_FIX_PAIRS:
            fail(
                "bugs_manifest.json",
                f"record_id={bug_id}：根據 schemas.md §3.4 / §10 不變量 #12，"
                f"不合法的處置 × fix_type 組合 ({disp}, {ft})",
            )

    pass_("bugs_manifest.json：v1.5.1 Layer-1 BUG 檢查完成")


def check_v1_5_0_index_md(q):
    """§10 不變量 #10 — quality/INDEX.md 已存在並包含 §11 所有的必要欄位。

    v1.5.4 第一部分 / 第一輪委員會發現 C2-1 + 第二輪委員會發現 C1：
    根據 INDEX payload.schema_version 路由，並針對每種情況進行明確處理，
    以免未來的架構被自動降級。

      - ``schema_version == SCHEMA_VERSION_CURRENT`` (目前為 ``"2.0"``) 
        → v1.5.4 合約；要求具備 target_role_breakdown (第一階段前的 stub 可以為 null)。
      - ``schema_version == "1.0"`` → 舊版 v1.5.3 封存檔；
        要求具備 target_project_type；發出一個 WARN。
      - ``schema_version`` 缺失/為空 且 payload 帶有 target_project_type 
        但沒有 target_role_breakdown → 舊版 WARN (針對架構版本前封存檔的啟發式回退)。
      - ``schema_version`` 缺失/為空 且 payload 不符合舊版啟發式
        → 當前路徑；執行被視為尚未填充 schema_version 的 v1.5.4 stub，
        且要求具備 target_role_breakdown。
      - 任何其他 ``schema_version`` (例如來自未來閘的 ``"3.0"``) 
        → 明確的 FAIL "版本比支援的版本新"，以便操作員知道要升級閘或降級執行。

    這使得 quality/previous_runs/ 下的歷史封存檔在不溯及既往地重寫的情況下保持可讀性，
    同時對當前執行保持嚴格要求。
    """
    path = q / "INDEX.md"
    v150_artifacts = (
        "formal_docs_manifest.json",
        "requirements_manifest.json",
        "use_cases_manifest.json",
        "bugs_manifest.json",
        "citation_semantic_check.json",
    )
    is_v150_run = any((q / name).is_file() for name in v150_artifacts)
    if not path.is_file():
        if is_v150_run:
            fail(
                "quality/INDEX.md 不存在 (根據 schemas.md §10 不變量 #10，"
                "每次 v1.5.1 執行皆為必要)"
            )
        return
    text = path.read_text(encoding="utf-8", errors="ignore")
    match = re.search(r"```json\n(.*?)\n```", text, re.DOTALL)
    if not match:
        fail("quality/INDEX.md：未發現 JSON 圍欄區塊 (schemas.md §11)")
        return
    try:
        payload = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        fail(f"quality/INDEX.md：JSON 圍欄區塊無效：{exc}")
        return
    if not isinstance(payload, dict):
        fail("quality/INDEX.md：JSON 圍欄區塊不是一個 JSON 物件")
        return

    # INDEX.md 的架構版本路由 (v1.5.4 第二輪委員會發現 C1)。
    # 明確處理四種情況，handled explicitly so future schemas
    # don't silently downgrade to legacy:
    #   1. schema_version == "1.0"                       -> 舊版 WARN
    #   2. schema_version 缺失/為空 且 payload           -> 舊版 WARN
    #      帶有 target_project_type 但不帶                  (針對架構版本
    #      target_role_breakdown                             前封存檔的
    #                                                        啟發式回退)
    #   3. schema_version == SCHEMA_VERSION_CURRENT      -> 當前路徑
    #   4. schema_version 缺失/為空 且 payload
    #      不符合情況 2                                   -> 當前路徑
    #                                                       (若缺失
    #                                                        target_role_breakdown
    #                                                        則 FAIL，因為
    #                                                        執行具歧義且
    #                                                        v1.5.4 為現行
    #                                                        形狀)
    #   5. 任何其他 schema_version                       -> 明確的 FAIL
    #                                                       "比支援版本新"
    schema_version = payload.get("schema_version")
    if schema_version == "1.0":
        is_legacy = True
    elif schema_version in (None, ""):
        is_legacy = (
            "target_project_type" in payload
            and "target_role_breakdown" not in payload
        )
    elif schema_version == SCHEMA_VERSION_CURRENT:
        is_legacy = False
    else:
        fail(
            f"quality/INDEX.md：schema_version {schema_version!r} "
            f"比此閘支援的版本 (目前為：{SCHEMA_VERSION_CURRENT!r}) 新。"
            "請升級閘或降級執行。"
        )
        return

    if is_legacy:
        warn(
            f"quality/INDEX.md：schema_version={schema_version!r} 被視為 "
            "舊版 v1.5.3 封存檔 (target_project_type 合約)。v1.5.4+ "
            f"執行必須發出包含 target_role_breakdown 的 "
            f"schema_version={SCHEMA_VERSION_CURRENT!r}。"
        )
        required = _V150_INDEX_COMMON_FIELDS + _V150_INDEX_LEGACY_FIELDS
    else:
        required = _V150_INDEX_COMMON_FIELDS + _V154_INDEX_CURRENT_FIELDS

    for key in required:
        if key not in payload:
            fail(f"quality/INDEX.md：缺失必要欄位 {key!r} (schemas.md §11)")
            continue
        val = payload[key]
        if isinstance(val, str) and not val:
            fail(f"quality/INDEX.md：欄位 {key!r} 為空字串 (schemas.md §11)")
    summary = payload.get("summary")
    if isinstance(summary, dict):
        for sub in _V150_REQUIRED_SUMMARY_KEYS:
            if sub not in summary:
                fail(
                    f"quality/INDEX.md：摘要缺失 {sub!r} 子鍵 "
                    "(schemas.md §11)"
                )
    pass_("quality/INDEX.md：§11 欄位已存在")


_V150_VALID_VERDICTS = ("supports", "overreaches", "unclear")


def check_v1_5_0_semantic_check(q):
    """§10 不變量 #17 — 三人小組過半數 overreaches 規則。

    Layer-2 語義檢查 (第六階段)。閘不會重新執行語義審閱；
    它解析 quality/citation_semantic_check.jsonbing 並套用過半數 overreaches 規則：

      - 同一個層級 1/2 REQ 有 ≥2/3 的 `overreaches` → FAIL。
      - 單一的 1/3 `overreaches` 或 `unclear` → WARN。
      - 任何層級 1/2 REQ 的審閱少於 3 個 → FAIL (schemas.md §9.4)。
      - 層級 3/4/5 REQ 的審閱分錄 → FAIL (僅層級 1/2 可供語義審閱，
        因為它們帶有引用)。

    當 requirements_manifest.json 有零個層級 1/2 REQ 時，仍預期會有 
    citation_semantic_check.json 檔案 (發出空 reviews[])；
    在這種情況下缺失該檔案將發出警告而非失敗，以免破壞 Spec Gap 執行。
    """
    req_data = _v150_manifest(q, "requirements_manifest.json")
    tier_by_req = {}
    if req_data and isinstance(req_data.get("records"), list):
        for rec in req_data["records"]:
            if isinstance(rec, dict):
                rid = rec.get("id")
                tier = rec.get("tier")
                if isinstance(rid, str) and isinstance(tier, int) and not isinstance(tier, bool):
                    tier_by_req[rid] = tier
    tier_12_req_ids = {rid for rid, t in tier_by_req.items() if t in (1, 2)}

    sc_path = q / "citation_semantic_check.json"
    if not sc_path.is_file():
        if tier_12_req_ids:
            fail(
                "quality/citation_semantic_check.json",
                "檔案缺失 (根據 schemas.md §10 不變量 #17，每個層級 1/2 REQ "
                "皆要求語義檢查)",
            )
        else:
            # Spec Gap：無層級 1/2 REQ 可供審閱。預期有檔案，但缺失
            # 不會破壞不變量，因為無可強制執行的項目。發出警告，讓 
            # 編排器知道應發出空檔案。
            warn(
                "quality/citation_semantic_check.json：檔案缺失；無層級 1/2 "
                "REQ 存在，因此不變量 #17 無可強制執行項目 — 為確保合約完整性，"
                "請發出空的 reviews[]"
            )
        return

    data = _v150_manifest(q, "citation_semantic_check.json")
    if data is None:
        return  # 包裝檢查已回報失敗
    reviews = data.get("reviews")
    if not isinstance(reviews, list):
        return  # wrapper check already reported

    by_req = {}
    seen_reviewers = {}
    for idx, entry in enumerate(reviews):
        if not isinstance(entry, dict):
            fail(
                "citation_semantic_check.json",
                f"reviews[#{idx}]：不是一個 JSON 物件",
            )
            continue
        rid = entry.get("req_id")
        reviewer = entry.get("reviewer")
        verdict = entry.get("verdict")
        notes = entry.get("notes")
        if not isinstance(rid, str) or not rid:
            fail(
                "citation_semantic_check.json",
                f"reviews[#{idx}]：缺失或非字串的 req_id",
            )
            continue
        if not isinstance(reviewer, str) or not reviewer:
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：缺失或非字串的審閱者",
            )
            continue
        if verdict not in _V150_VALID_VERDICTS:
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：審閱者={reviewer!r} 的結論 {verdict!r} 無效；"
                f"預期為 {_V150_VALID_VERDICTS} 之一",
            )
            continue
        if not isinstance(notes, str):
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：審閱者={reviewer!r} 的備註必須是字串",
            )
            continue
        # §9.4 常見錯誤：層級檢查 — 審閱分錄必須僅屬於層級 1/2 REQ。
        tier = tier_by_req.get(rid)
        if tier is None:
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：審閱者={reviewer!r} 審閱了一個 "
                "不在 requirements_manifest.json 中的 REQ",
            )
            continue
        if tier not in (1, 2):
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：審閱者={reviewer!r} 審閱了一個層級 {tier} "
                "的 REQ；根據 schemas.md §9.4，語義檢查僅適用於層級 1/2",
            )
            continue
        # 偵測重複的 (req_id, reviewer) 對 — 這是一個可能讓選票規避過半數計算的錯誤。
        pair_key = seen_reviewers.setdefault(rid, set())
        if reviewer in pair_key:
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：來自審閱者={reviewer!r} 的重複審閱",
            )
            continue
        pair_key.add(reviewer)
        by_req.setdefault(rid, []).append(entry)

    # §9.4：每個層級 1/2 REQ 至少需要 3 個審閱。
    for rid in sorted(tier_12_req_ids):
        entries = by_req.get(rid, [])
        if len(entries) < 3:
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：審閱少於 3 個 (僅存在 {len(entries)} 個) "
                "— schemas.md §9.4 要求每個層級 1/2 REQ 對應委員會成員各提供一個分錄",
            )
            continue
        overreach_count = sum(1 for e in entries if e.get("verdict") == "overreaches")
        unclear_count = sum(1 for e in entries if e.get("verdict") == "unclear")
        if overreach_count >= 2:
            reviewers_flagged = ", ".join(
                sorted(
                    str(e.get("reviewer"))
                    for e in entries
                    if e.get("verdict") == "overreaches"
                )
            )
            fail(
                "citation_semantic_check.json",
                f"record_id={rid}：語義檢查過半數過度延伸 "
                f"({overreach_count}/{len(entries)} 名審閱者標記為過度延伸："
                f"{reviewers_flagged}) — schemas.md §10 不變量 #17",
            )
        elif overreach_count == 1:
            flagged = next(
                str(e.get("reviewer"))
                for e in entries
                if e.get("verdict") == "overreaches"
            )
            warn(
                f"citation_semantic_check.json：record_id={rid}：1/{len(entries)} "
                f"名審閱者 ({flagged}) 標記為 `overreaches` — 已顯露以供人工審閱；"
                "除非 ≥2 名審閱者一致同意，否則不視為閘失敗"
            )
        if unclear_count >= 1 and overreach_count == 0:
            flagged = ", ".join(
                sorted(
                    str(e.get("reviewer"))
                    for e in entries
                    if e.get("verdict") == "unclear"
                )
            )
            warn(
                f"citation_semantic_check.json：record_id={rid}："
                f"{unclear_count}/{len(entries)} 名審閱者標記為 "
                f"`unclear` ({flagged}) — 已顯露以供人工審閱"
            )

    if not tier_12_req_ids:
        pass_(
            "citation_semantic_check.json：無層級 1/2 REQ 可供審閱 "
            "(不變量 #17 已自然達成)"
        )
    else:
        pass_(
            f"citation_semantic_check.json：已針對 {len(tier_12_req_ids)} 個層級 1/2 REQ "
            "完成 §10 不變量 #17 檢查"
        )


# --- v1.5.1 項目 5.2: challenge-gate coverage invariant -------------------

# 來自實作計畫項目 5.2 的規範結論行正規表示式。匹配獨立的一行 
# "**Verdict:** CONFIRMED/DOWNGRADED/REJECTED"。
_CHALLENGE_VERDICT_RE = re.compile(
    r"^\*\*Verdict:\*\*\s+(CONFIRMED|DOWNGRADED|REJECTED)\s*$",
    re.MULTILINE,
)
# 在規範正規表示式指定之前產生的挑戰記錄所使用的舊版最終結論形式 
# (包括位於 repos/benchmark-1.5.0/virtio-1.4.6/quality/challenge/ 
# 保留的 virtio-1.4.6 證據)。簡報指出 "此不變量僅驗證挑戰已執行" — 
# 舊版形式明確記錄了最終結論，因此在不要求操作員重新產生基準產出物的情況下 
# 滿足了不變量的意圖。新的 v1.5.1+ 執行應優先使用規範形式。
_CHALLENGE_VERDICT_LEGACY_RE = re.compile(
    r"^\*\*(CONFIRMED|DOWNGRADED|REJECTED)\.?\*\*",
    re.MULTILINE,
)

# 觸發模式關鍵字表 (不分大小寫的子字串匹配)。
_CHALLENGE_SECURITY_SEVERITIES = frozenset({"CRITICAL", "HIGH"})
_CHALLENGE_SECURITY_KEYWORDS = (
    "credential", "secret", "auth", "injection", "xss", "csrf",
    "ssrf", "privilege", "bypass", "leak",
)
_CHALLENGE_SIBLING_KEYWORDS = (
    "sibling", "parallel", "parity", "contrasted with", "same concern",
    "in contrast", "other path", "other branch",
)
_CHALLENGE_MISSING_KEYWORDS = (
    "never", "does not", "doesn't", "missing", "absent", "fails to",
)
_CHALLENGE_DESIGN_KEYWORDS = (
    "todo", "why", "ooda", "design decision",
)
_CHALLENGE_ITERATION_KEYWORDS = (
    "gap", "unfiltered", "parity", "adversarial", "iteration",
)


def _bug_writeup_text(q, bug_id):
    """傳回 ``bug_id`` 的小寫撰寫文件文字 (若缺失則為空字串)。

    撰寫文件位於 quality/writeups/BUG-NNN.md。讀取失敗被視為空文字 — 
    不變量仍會在資訊清單欄位 (標題 / 摘要 / 來源) 上執行，
    這些欄位是獨立存在的。
    """
    path = _resolve_artifact_path(q, f"writeups/{bug_id}.md")
    if not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8", errors="ignore").lower()
    except OSError:
        return ""


def _bug_req_has_tier_12_citation(req_id, requirements_records):
    """若 req_id 解析為一個具有非空引用且層級為 {1, 2} 的 REQ，則傳回 True。
    由 "無規範依據" 觸發模式使用。"""
    if not req_id or not isinstance(requirements_records, list):
        return False
    for rec in requirements_records:
        if not isinstance(rec, dict):
            continue
        if rec.get("id") != req_id:
            continue
        if rec.get("tier") not in (1, 2):
            return False
        citation = rec.get("citation")
        if isinstance(citation, dict) and citation:
            return True
        return False
    return False


def _contains_any(text, keywords):
    """跨關鍵字元組進行不分大小寫的子字串 OR 匹配。"""
    if not text:
        return False
    lowered = text.lower()
    return any(kw in lowered for kw in keywords)


def _classify_bug_triggers(rec, q, requirements_records):
    """傳回針對一個 bug 觸發的觸發模式名稱列表。
    空列表表示該 bug 不需要挑戰記錄。

    模式鏡像實作計畫項目 5.2 逐字內容。輸入別名：
      - title: 優先使用 rec['title']，回退至 rec['summary']。
      - requirement: 優先使用 rec['requirement']，回退至 rec['req_id']
        (v1.4.x 使用 req_id；v1.5.1+ 收斂為 requirement)。
      - source_comments: 選用，較舊的執行可能會省略它。
      - source / discovery_phase: 對迭代衍生關鍵字列表進行子字串匹配。
    """
    fired = []

    bug_id = rec.get("id", "")
    title = rec.get("title") or rec.get("summary") or ""
    severity = (rec.get("severity") or "").upper()
    writeup = _bug_writeup_text(q, bug_id) if bug_id else ""
    title_plus_writeup = f"{title}\n{writeup}"

    # 1. 安全等級。
    if severity in _CHALLENGE_SECURITY_SEVERITIES and _contains_any(
        title_plus_writeup, _CHALLENGE_SECURITY_KEYWORDS
    ):
        fired.append("security-class")

    # 2. 無規範依據。
    requirement = rec.get("requirement") or rec.get("req_id")
    has_valid_citation = _bug_req_has_tier_12_citation(requirement, requirements_records)
    if not requirement or not has_valid_citation:
        fired.append("no-spec-basis")

    # 3. 兄弟路徑分歧。
    if _contains_any(writeup, _CHALLENGE_SIBLING_KEYWORDS):
        fired.append("sibling-path-divergence")

    # 4. 功能缺失。
    if _contains_any(writeup, _CHALLENGE_MISSING_KEYWORDS):
        fired.append("missing-functionality")

    # 5. 設計決策備註 (選用欄位)。
    source_comments = rec.get("source_comments")
    if isinstance(source_comments, str) and _contains_any(
        source_comments, _CHALLENGE_DESIGN_KEYWORDS
    ):
        fired.append("design-decision-comment")

    # 6. 迭代衍生。
    source = rec.get("source") or ""
    discovery_phase = rec.get("discovery_phase") or ""
    iter_haystack = f"{source}\n{discovery_phase}"
    if _contains_any(iter_haystack, _CHALLENGE_ITERATION_KEYWORDS):
        fired.append("iteration-derived")

    return fired


def _challenge_record_has_verdict(path):
    """若檔案存在且包含根據不變量接受組定義的規範結論行或舊版結論行，則傳回 True。"""
    if not path.is_file():
        return False
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return False
    if _CHALLENGE_VERDICT_RE.search(text):
        return True
    if _CHALLENGE_VERDICT_LEGACY_RE.search(text):
        return True
    return False


def check_challenge_gate_coverage(q):
    """v1.5.1 項目 5.2 — 指紋觸發挑戰閘的每個 bug 必須具有一個帶有有效結論行的 
    quality/challenge/BUG-NNN-challenge.md。

    當 quality/bugs_manifest.json 缺失時不適用 (零 bug 的執行不可能有未挑戰的 bug)。
    僅在當前的 quality/ 樹狀目錄上執行；無跨執行狀態。
    """
    data = _v150_manifest(q, "bugs_manifest.json")
    if data is None:
        # 不適用 — 計畫中明確指出 "若檔案缺失，則不變量不適用"。
        # 這與其他在輸入不存在時自動略過的 quality_gate 不變量檢查一致。
        return
    records = data.get("records")
    if not isinstance(records, list):
        return

    reqs_data = _v150_manifest(q, "requirements_manifest.json") or {}
    req_records = reqs_data.get("records") if isinstance(reqs_data, dict) else None

    challenge_dir = q / "challenge"
    triggered = 0
    missing = []   # 缺失記錄的 bug 列表，格式為 (bug_id, [觸發模式名稱])
    bad_verdict = []  # 有記錄但結論行無效的 bug 列表，格式為 (bug_id, [觸發模式名稱])

    for rec in records:
        if not isinstance(rec, dict):
            continue
        bug_id = rec.get("id")
        if not bug_id:
            continue
        fired = _classify_bug_triggers(rec, q, req_records)
        if not fired:
            continue
        triggered += 1
        record_path = challenge_dir / f"{bug_id}-challenge.md"
        if not record_path.is_file():
            missing.append((bug_id, fired))
        elif not _challenge_record_has_verdict(record_path):
            bad_verdict.append((bug_id, fired))

    if missing:
        for bug_id, fired in missing:
            fail(
                "quality/challenge/",
                f"{bug_id}：挑戰記錄缺失 (觸發於：{', '.join(fired)}) "
                f"— 預期具備包含 **Verdict:** 行的 {bug_id}-challenge.md",
            )
    if bad_verdict:
        for bug_id, fired in bad_verdict:
            fail(
                f"quality/challenge/{bug_id}-challenge.md",
                f"結論行缺失或格式錯誤 (觸發於：{', '.join(fired)}) "
                "— 預期具備匹配 `^\\*\\*Verdict:\\*\\*\\s+(CONFIRMED|DOWNGRADED|REJECTED)` "
                "或舊版最終結論形式的一行",
            )

    if triggered == 0:
        pass_("挑戰閘覆蓋：無 bug 觸發挑戰閘 (自然達成)")
    elif not missing and not bad_verdict:
        pass_(
            f"挑戰閘覆蓋：{triggered} 個觸發挑戰的 bug 皆具備有效的挑戰記錄"
        )


def check_v1_5_3_formal_doc_role_validation(q):
    """schemas.md §10 不變量 #23 — v1.5.3 形式資訊清單上的 FORMAL_DOC.role。

    舊版資訊清單 (無處可見 v1.5.3 欄位)：發出一個 WARN 後略過。
    v1.5.3 形式：每條記錄必須填充為 formal_doc_role (§3.6) 成員的 role。
    """
    data = _v150_manifest(q, "formal_docs_manifest.json")
    if data is None:
        return
    records = data.get("records")
    if not isinstance(records, list):
        return  # wrapper check already reported
    if not _is_v1_5_3_shaped(data):
        warn(
            "formal_docs_manifest.json：偵測到舊版資訊清單；根據 schemas.md §3.10 "
            "向後相容規則，將缺失的 FORMAL_DOC.role 視為 'external-spec'"
        )
        return
    any_fail = False
    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            continue
        rec_id = rec.get("source_path", f"<#{idx}>")
        role = rec.get("role")
        if role not in _V153_VALID_FORMAL_DOC_ROLES:
            fail(
                "formal_docs_manifest.json",
                f"record_id={rec_id}：在 v1.5.3 形式資訊清單中 role {role!r} "
                f"缺失或無效 (schemas.md §10 不變量 #23，有效值為："
                f"{', '.join(_V153_VALID_FORMAL_DOC_ROLES)})",
            )
            any_fail = True
    if not any_fail:
        pass_("formal_docs_manifest.json：v1.5.3 role 驗證完成")


def check_v1_5_3_source_type_validation(q):
    """schemas.md §10 不變量 #21 (前半部分) — REQ.source_type 存在性。

    舊版資訊清單：發出一個 WARN 後略過。
    v1.5.3 形式：每個 REQ 必須填充為 req_source_type (§3.7) 成員的 source_type。
    """
    data = _v150_manifest(q, "requirements_manifest.json")
    if data is None:
        return
    records = data.get("records")
    if not isinstance(records, list):
        return
    if not _is_v1_5_3_shaped(data):
        warn(
            "requirements_manifest.json：偵測到舊版資訊清單；根據 schemas.md §3.10 "
            "向後相容規則，將缺失的 REQ.source_type 視為 'code-derived'"
        )
        return
    any_fail = False
    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            continue
        req_id = rec.get("id", f"<#{idx}>")
        source_type = rec.get("source_type")
        if source_type not in _V153_VALID_SOURCE_TYPES:
            fail(
                "requirements_manifest.json",
                f"record_id={req_id}：在 v1.5.3 形式資訊清單中 source_type "
                f"{source_type!r} 缺失或無效 "
                f"(schemas.md §10 不變量 #21，有效值為："
                f"{', '.join(_V153_VALID_SOURCE_TYPES)})",
            )
            any_fail = True
    if not any_fail:
        pass_("requirements_manifest.json：v1.5.3 source_type 驗證完成")


def check_v1_5_3_skill_section_consistency(q):
    """schemas.md §10 不變量 #21 (後半部分) — skill_section 一致性。

    在 v1.5.3 形式的需求資訊清單中，source_type == 'skill-section' 的 REQ 
    必須具備非空的 skill_section；具備任何其他 source_type 值的 REQ 
    必須不具備 skill_section 或其值為 null (根據 §1.5：選用欄位可以省略或以 null 呈現)。
    已填充的 skill_section 配對非 skill-section 的 source_type 將導致 FAIL。

    此處會自動略過舊版資訊清單 — source_type 檢查已經針對該資訊清單發出了單一的 WARN。

    刻意搭便車 (第二輪委員會項目 1)：這是其他三個 v1.5.3 不變量所使用的 
    "每個檢查函式僅限一個 WARN" 慣例中已記錄的唯一例外。由於 
    check_v1_5_3_source_type_validation 與此檢查共用 
    requirements_manifest.json，因此在此處發出第二個 WARN 
    會針對同一個舊版檔案重複發出警告。此搭便車行為已被 
    TestV153SkillSectionConsistency 中的 test_legacy_manifest_silently_skips 
    固定下來 — 未來維護人員若為了維持一致性而閱讀簡報並新增 WARN，將會破壞該測試。
    """
    data = _v150_manifest(q, "requirements_manifest.json")
    if data is None:
        return
    records = data.get("records")
    if not isinstance(records, list):
        return
    if not _is_v1_5_3_shaped(data):
        return  # source_type check handled the soft warn for this manifest
    any_fail = False
    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            continue
        req_id = rec.get("id", f"<#{idx}>")
        source_type = rec.get("source_type")
        skill_section = rec.get("skill_section")
        if source_type == "skill-section":
            if not isinstance(skill_section, str) or not skill_section.strip():
                fail(
                    "requirements_manifest.json",
                    f"record_id={req_id}：source_type='skill-section' 但 "
                    f"skill_section 為空或缺失 "
                    "(schemas.md §10 不變量 #21)",
                )
                any_fail = True
        else:
            if skill_section is not None and skill_section != "":
                fail(
                    "requirements_manifest.json",
                    f"record_id={req_id}：skill_section={skill_section!r} "
                    f"已填充但 source_type={source_type!r} 不是 "
                    "'skill-section' (schemas.md §10 不變量 #21)",
                )
                any_fail = True
    if not any_fail:
        pass_("requirements_manifest.json：v1.5.3 skill_section 一致性完成")


def check_v1_5_3_divergence_type_validation(q):
    """schemas.md §10 不變量 #22 — v1.5.3 形式資訊清單上的 BUG.divergence_type。

    舊版資訊清單：發出一個 WARN 後略過。
    v1.5.3 形式：每個 BUG 必須填充為 bug_divergence_type (§3.8) 成員的 divergence_type。
    """
    data = _v150_manifest(q, "bugs_manifest.json")
    if data is None:
        return
    records = data.get("records")
    if not isinstance(records, list):
        return
    if not _is_v1_5_3_shaped(data):
        warn(
            "bugs_manifest.json：偵測到舊版資訊清單；根據 schemas.md §3.10 "
            "向後相容規則，將缺失的 BUG.divergence_type 視為 'code-spec'"
        )
        return
    any_fail = False
    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            continue
        bug_id = rec.get("id", f"<#{idx}>")
        divergence_type = rec.get("divergence_type")
        if divergence_type not in _V153_VALID_DIVERGENCE_TYPES:
            fail(
                "bugs_manifest.json",
                f"record_id={bug_id}：在 v1.5.3 形式資訊清單中 divergence_type "
                f"{divergence_type!r} 缺失或無效 "
                f"(schemas.md §10 不變量 #22，有效值為："
                f"{', '.join(_V153_VALID_DIVERGENCE_TYPES)})",
            )
            any_fail = True
    if not any_fail:
        pass_("bugs_manifest.json：v1.5.3 divergence_type 驗證完成")


_V153_COUNCIL_INBOX_ITEM_TYPES = frozenset({
    "rejected-draft",
    "tier-5-demotion",
    "zero-req-section",
    "weak-rationale",
})


def check_v1_5_3_council_inbox_validation(q):
    """第 3b 階段 BLOCK-4 交叉引用 + DQ-5 結構驗證。

    根據 DQ-5 架構驗證 quality/phase3/pass_d_council_inbox.json 
    並驗證每個 Pass D 拒絕 / 層級 5 降級在 council-inbox 中皆具備相符項目。
    若無此交叉引用不變量，一個語法正確但內容為空的收件匣即使在 
    pass_d_audit.json 顯示 30 多個拒絕時也能通過 — 
    收件匣的填充流程可能會無聲無息地損壞，而閘將無法捕捉。

    兩種失敗模式：
      1. 結構性 — 項目記錄格式錯誤、item_type 無效、
         缺少根據 DQ-5 架構要求的必要欄位。
      2. 交叉引用 — pass_d_audit.json 中 outcome 為 
         {rejected, demoted_to_tier_5} 的分錄在收件匣中無相符項目。

    第 3 階段產出物組位於 <repo>/quality/phase3/，而非最上層的 
    <repo>/quality/。若 phase3 目錄不存在，此檢查將自動傳回 
    (專案為純程式碼或尚未執行第 3 階段)。
    """
    phase3_dir = _resolve_artifact_path(q, "phase3")
    if not phase3_dir.is_dir():
        return  # 未執行第 3 階段；不在資訊清單組的範圍內
    inbox_path = phase3_dir / "pass_d_council_inbox.json"
    audit_path = phase3_dir / "pass_d_audit.json"
    if not inbox_path.is_file():
        return  # 第 3 階段僅部分執行；自動略過

    inbox_data = load_json(inbox_path)
    if not isinstance(inbox_data, dict):
        fail(f"{inbox_path.name}：不是一個有效的 JSON 物件")
        return

    # 結構驗證。
    schema_version = inbox_data.get("schema_version")
    if schema_version != "1.0":
        fail(
            f"{inbox_path.name}：schema_version {schema_version!r} "
            "與 DQ-5 規範值 '1.0' 不符"
        )
    items = inbox_data.get("items")
    if not isinstance(items, list):
        fail(f"{inbox_path.name}：'items' 缺失或不是列表")
        return

    required_fields = {
        "item_type",
        "draft_idx",
        "section_idx",
        "section_heading",
        "rationale",
        "context_excerpt",
        "provisional_disposition",
    }
    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            fail(f"{inbox_path.name}：項目 #{idx} 不是一個 JSON 物件")
            continue
        missing = required_fields - set(item.keys())
        if missing:
            fail(
                f"{inbox_path.name}：項目 #{idx} 缺失必要的 "
                f"DQ-5 欄位：{sorted(missing)}"
            )
        if item.get("item_type") not in _V153_COUNCIL_INBOX_ITEM_TYPES:
            fail(
                f"{inbox_path.name}：項目 #{idx} 具有無效的 item_type "
                f"{item.get('item_type')!r} (有效值為："
                f"{sorted(_V153_COUNCIL_INBOX_ITEM_TYPES)})"
            )
        rationale = item.get("rationale")
        if not isinstance(rationale, str) or not rationale.strip():
            fail(
                f"{inbox_path.name}：項目 #{idx} 具有空或缺失的 "
                "rationale"
            )

    # 交叉引用不變量：每個被拒絕 / 降級的稽核分錄
    # 必須根據 (draft_idx, item_type) 在收件匣中具備相符項目。
    if audit_path.is_file():
        audit_data = load_json(audit_path)
        if isinstance(audit_data, dict):
            inbox_pairs = {
                (item.get("draft_idx"), item.get("item_type"))
                for item in items
                if isinstance(item, dict)
            }
            for entry in audit_data.get("rejected", []) or []:
                if not isinstance(entry, dict):
                    continue
                pair = (entry.get("draft_idx"), "rejected-draft")
                if pair not in inbox_pairs:
                    fail(
                        f"{inbox_path.name}：pass_d_audit.json 顯示 "
                        f"已拒絕之 draft_idx={entry.get('draft_idx')} "
                        "但在 council inbox 中無相符的 rejected-draft 項目 "
                        "(違反 BLOCK-4 交叉引用不變量)"
                    )
            for entry in audit_data.get("demoted_to_tier_5", []) or []:
                if not isinstance(entry, dict):
                    continue
                pair = (entry.get("draft_idx"), "tier-5-demotion")
                if pair not in inbox_pairs:
                    fail(
                        f"{inbox_path.name}：pass_d_audit.json 顯示 "
                        f"在 draft_idx={entry.get('draft_idx')} 處發生層級 5 降級 "
                        "但在 council inbox 中無相符的 tier-5-demotion 項目"
                    )

    pass_(f"{inbox_path.name}：v1.5.3 council inbox 驗證完成")


# ---------------------------------------------------------------------------
# 第 4 階段技能專案閘強制檢查 (DQ-4-4)。
#
# 當目標角色對映表顯示為 skill-prose 表面時，這四項檢查將會觸發；
# 若為純程式碼目標，則略過 (顯示為資訊性 `INFO: skipped` 行，且不增加 
# 失敗計數器)。一律會執行的檢查為 check_role_map_consistency。
#
# v1.5.4 第一部分：舊版的 Code/Skill/Hybrid 字串現在衍生自 
# <q>/exploration_role_map.json 處的第 1 階段角色對映表。
# 此對映鏡像了 bin/role_map.py::derive_legacy_project_type。
# 若角色對映表缺失，則這四項檢查皆會靜默略過 — 表示此目標尚未執行第 1 階段。
# 閘以僅限標準函式庫的指令碼形式部署至目標儲存庫中，無法匯入 bin/role_map；
# 它所需的少量角色對映感知邏輯已內嵌於下方。
# ---------------------------------------------------------------------------


def _load_role_map(q):
    """傳回解析後的 exploration_role_map.json 字典，若缺失或無法解析則傳回 None。
    v1.5.4 中用於取代先前 project_type.json 讀取器的內嵌實作。"""
    return load_json(q / "exploration_role_map.json")


def _role_map_has_role(role_map, role_set):
    if not isinstance(role_map, dict):
        return False
    files = role_map.get("files") or []
    if not isinstance(files, list):
        return False
    for entry in files:
        if isinstance(entry, dict) and entry.get("role") in role_set:
            return True
    return False


def _phase4_project_type(q):
    """傳回衍生自第 1 階段角色對映表的 v1.5.3 同等分類字串 
    ('Code' / 'Skill' / 'Hybrid')，若角色對映表缺失或無法解析則傳回 None。

    對映方式 (鏡像 bin/role_map.derive_legacy_project_type)：
      - 具備 skill-prose 且具備程式碼  -> 'Hybrid'
      - 具備 skill-prose，無程式碼      -> 'Skill'
      - 無 skill-prose                -> 'Code'
    """
    role_map = _load_role_map(q)
    if role_map is None:
        return None
    skill = _role_map_has_role(role_map, ("skill-prose", "skill-reference"))
    code = _role_map_has_role(role_map, ("code",))
    if skill and code:
        return "Hybrid"
    if skill:
        return "Skill"
    return "Code"


def check_skill_section_req_coverage(repo_dir, q):
    """Skill / Hybrid：根據 pass_d_section_coverage.json，
    每個運作中 (operational) 的 SKILL.md 區段皆具備 ≥1 個已推廣的 REQ。
    Meta-allowlist 區段則豁免 (其 section_kind == 'meta')。

    對於程式碼 (Code) 專案則略過。"""
    print("[第 4 階段：skill-section REQ 覆蓋]")
    classification = _phase4_project_type(q)
    if classification not in ("Skill", "Hybrid"):
        info(f"check_skill_section_req_coverage: skip (project_type={classification!r})")
        return
    coverage_path = _resolve_artifact_path(q, "phase3/pass_d_section_coverage.json")
    data = load_json(coverage_path)
    if not isinstance(data, dict):
        info(
            "check_skill_section_req_coverage: skip "
            "(pass_d_section_coverage.json 缺失或無法解析)"
        )
        return
    failures = 0
    for s in data.get("sections", []) or []:
        if not isinstance(s, dict):
            continue
        kind = s.get("section_kind")
        if kind != "operational":
            continue
        promoted = s.get("drafts_promoted", 0) or 0
        if promoted < 1:
            heading = s.get("heading") or "<未知>"
            document = s.get("document") or "SKILL.md"
            section_idx = s.get("section_idx")
            fail(
                f"{document}",
                f"區段 #{section_idx} {heading!r} 有 0 個已推廣的 "
                "REQ，且不在 meta 允許清單中 "
                "(check_skill_section_req_coverage)",
            )
            failures += 1
    if failures == 0:
        pass_("check_skill_section_req_coverage：每個運作中區段皆具備 ≥1 個已推廣的 REQ")


def check_reference_file_req_coverage(repo_dir, q):
    """Skill / Hybrid：在 references/ 下的每個參考檔案皆具備 ≥1 個
    引用它的 REQ，或者在其前 5 行內具備 `<!-- non-normative -->` 標記。

    對於程式碼 (Code) 專案則略過。"""
    print("[第 4 階段：reference-file REQ 覆蓋]")
    classification = _phase4_project_type(q)
    if classification not in ("Skill", "Hybrid"):
        info(f"check_reference_file_req_coverage: skip (project_type={classification!r})")
        return
    references_dir = repo_dir / "references"
    if not references_dir.is_dir():
        info("check_reference_file_req_coverage: skip (無 references/ 目錄)")
        return
    formal_path = _resolve_artifact_path(q, "phase3/pass_c_formal.jsonl")
    if not formal_path.is_file():
        info(
            "check_reference_file_req_coverage: skip "
            "(pass_c_formal.jsonl 缺失 — 尚未執行第 3 階段)"
        )
        return
    cited_documents = set()
    for line in formal_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(rec, dict):
            continue
        sd = rec.get("source_document")
        if isinstance(sd, str):
            cited_documents.add(sd)
    failures = 0
    for ref in sorted(references_dir.glob("*.md")):
        rel = f"references/{ref.name}"
        if rel in cited_documents:
            continue
        # 非規範性標記檢查 (前 5 行)。
        head = ref.read_text(encoding="utf-8", errors="replace").splitlines()[:5]
        if any("<!-- non-normative -->" in line.lower() for line in head):
            continue
        fail(
            rel,
            "無 REQ 引用此參考檔案，且其前 5 行內無 <!-- non-normative --> "
            "標記 (check_reference_file_req_coverage)",
        )
        failures += 1
    if failures == 0:
        pass_("check_reference_file_req_coverage：每個參考檔案皆具備 ≥1 個引用的 REQ 或非規範性標記")


def check_hybrid_cross_cutting_reqs(repo_dir, q):
    """僅限混合型 (Hybrid)：≥1 個 REQ 具備三角測量證據 — 
    `source_type=skill-section` 且其 acceptance_criteria 引用了
    在另一個 `source_type=code-derived` 的 REQ 中提到的程式碼產出物。

    對於技能 (Skill) 或程式碼 (Code) 專案則略過。"""
    print("[第 4 階段：混合型橫切 REQ]")
    classification = _phase4_project_type(q)
    if classification != "Hybrid":
        info(f"check_hybrid_cross_cutting_reqs: skip (project_type={classification!r})")
        return
    formal_path = _resolve_artifact_path(q, "phase3/pass_c_formal.jsonl")
    if not formal_path.is_file():
        info(
            "check_hybrid_cross_cutting_reqs: skip "
            "(pass_c_formal.jsonl 缺失 — 尚未執行第 3 階段)"
        )
        return
    skill_section_reqs = []
    code_derived_artifacts = set()
    for line in formal_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(rec, dict):
            continue
        st = rec.get("source_type")
        if st == "skill-section":
            skill_section_reqs.append(rec)
        elif st == "code-derived":
            ac = (rec.get("acceptance_criteria") or "")
            cite = (rec.get("citation_excerpt") or "")
            for token in re.findall(
                r"\b([\w./-]+\.(?:py|sh|json))\b", ac + " " + cite
            ):
                code_derived_artifacts.add(token)
    if not code_derived_artifacts:
        # 對於尚未產生 any 程式碼衍生 REQ 的混合型專案，
        # 橫切檢查無可供三角測量的項目。
        # 顯示 INFO + 略過而非失敗 (缺失本身即為診斷結果)。
        info(
            "check_hybrid_cross_cutting_reqs: skip "
            "(pass_c_formal.jsonl 中尚未有程式碼衍生 REQ)"
        )
        return
    triangulated = 0
    for rec in skill_section_reqs:
        ac = (rec.get("acceptance_criteria") or "") + " " + (
            rec.get("citation_excerpt") or ""
        )
        if any(art in ac for art in code_derived_artifacts):
            triangulated += 1
            if triangulated >= 1:
                break
    if triangulated >= 1:
        pass_(
            f"check_hybrid_cross_cutting_reqs：存在三角測量證據 "
            f"(≥{triangulated} 個 skill-section REQ 引用了"
            "程式碼衍生產出物)"
        )
    else:
        fail(
            "pass_c_formal.jsonl",
            "混合型專案無三角測量 REQ 對 "
            "(skill-section REQ 引用程式碼衍生產出物)；"
            "check_hybrid_cross_cutting_reqs",
        )


def check_role_map_consistency(repo_dir, q):
    """所有專案：exploration_role_map.json (若存在) 解析為 
    JSON 物件，宣告 schema_version '1.0'，帶有 'files' 
    列表和一個包含四個預期份額鍵的 'breakdown.percentages' 字典。

    若角色對映表缺失，則靜默略過 — 表示此目標尚未執行第 1 階段。
    此為 v1.5.4 第一部分用於取代 v1.5.3 check_project_type_consistency 
    的檢查，後者是以 quality/project_type.json (現已退役) 為鍵。"""
    print("[第 4 階段：角色對映一致性]")
    rm_path = q / "exploration_role_map.json"
    if not rm_path.is_file():
        info(
            "check_role_map_consistency: skip "
            "(exploration_role_map.json 缺失 — 尚未執行第 1 階段)"
        )
        return
    data = load_json(rm_path)
    if not isinstance(data, dict):
        fail(
            f"{rm_path.relative_to(q.parent)}",
            "exploration_role_map.json 不是有效的 JSON 物件",
        )
        return
    if data.get("schema_version") != "1.0":
        fail(
            f"{rm_path.relative_to(q.parent)}",
            f"schema_version {data.get('schema_version')!r} 不是 '1.0' "
            "(check_role_map_consistency)",
        )
        return
    files = data.get("files")
    if not isinstance(files, list):
        fail(
            f"{rm_path.relative_to(q.parent)}",
            "'files' 不是列表 (check_role_map_consistency)",
        )
        return
    breakdown = data.get("breakdown")
    if not isinstance(breakdown, dict):
        fail(
            f"{rm_path.relative_to(q.parent)}",
            "'breakdown' 不是物件 (check_role_map_consistency)",
        )
        return
    percentages = breakdown.get("percentages")
    if not isinstance(percentages, dict):
        fail(
            f"{rm_path.relative_to(q.parent)}",
            "'breakdown.percentages' 不是物件 "
            "(check_role_map_consistency)",
        )
        return
    missing = [
        k for k in ("skill_share", "code_share", "tool_share", "other_share")
        if k not in percentages
    ]
    if missing:
        fail(
            f"{rm_path.relative_to(q.parent)}",
            f"breakdown.percentages 缺失鍵值組：{missing} "
            "(check_role_map_consistency)",
        )
        return
    derived = _phase4_project_type(q) or "未知"
    pass_(
        f"{rm_path.relative_to(q.parent)}：角色對映格式良好 "
        f"(舊版衍生之專案類型為 {derived!r}；"
        "check_role_map_consistency)"
    )


def check_v1_5_2_cardinality_gate(repo_dir):
    """v1.5.2 Lever 3：第 5 階段基數對帳閘。

    將來自 validate_cardinality_gate() 的每個失敗顯露為一個 fail() 分錄。
    """
    failures = validate_cardinality_gate(repo_dir)
    if not failures:
        pass_("compensation_grid.json：v1.5.2 基數閘乾淨無誤")
        return
    for msg in failures:
        fail("compensation_grid.json", msg)


def check_v1_5_0_gate_invariants(repo_dir, q):
    """分配器，執行來自 schemas.md §10 的每項 Layer-1 機械式檢查。"""
    check_v1_5_0_cite_extensions(repo_dir)
    check_v1_5_0_manifest_wrappers(q)
    check_v1_5_0_requirements_manifest(repo_dir, q)
    check_v1_5_0_bugs_manifest(q)
    check_v1_5_0_index_md(q)
    # 第 6 階段不變量 #17 在 requirements_manifest 之後執行，
    # 以便它可以看到經過外形驗證的 REQ 記錄。
    check_v1_5_0_semantic_check(q)
    # v1.5.1 項目 5.2：挑戰閘覆蓋最後執行。它依賴 
    # requirements_manifest.json 取得 "無規範依據" 模式，
    # 但不會重複執行先前不變量已涵蓋的架構檢查。
    check_challenge_gate_coverage(q)
    # v1.5.2 Lever 3：基數對帳閘。
    check_v1_5_2_cardinality_gate(repo_dir)
    # v1.5.3 第 2 階段：技能感知專案的架構擴充 (具備舊版資訊清單的 
    # 程式碼專案將進入軟性警告路徑；v1.5.3 形式資訊清單 
    # 則根據 schemas.md §10 不變量 #21–#23 進行嚴格驗證)。
    check_v1_5_3_formal_doc_role_validation(q)
    check_v1_5_3_source_type_validation(q)
    check_v1_5_3_skill_section_consistency(q)
    check_v1_5_3_divergence_type_validation(q)
    # v1.5.3 第 3b 階段：議會收件匣結構 + 交叉引用
    # 驗證 (DQ-5 + BLOCK-4)。對於程式碼專案為無操作 (缺失 phase3 目錄)。
    check_v1_5_3_council_inbox_validation(q)
    # v1.5.3 第 4 階段 (DQ-4-4)：技能專案閘強制執行。
    # 前三項對於純程式碼專案會略過 (角色對映表中無 skill-prose 表面)；
    # check_role_map_consistency 則針對所有專案執行。
    # v1.5.4 第一部分：專案類型衍生自第 1 階段角色對映表，
    # 而非已退役的 project_type.json。
    check_skill_section_req_coverage(repo_dir, q)
    check_reference_file_req_coverage(repo_dir, q)
    check_hybrid_cross_cutting_reqs(repo_dir, q)
    check_role_map_consistency(repo_dir, q)


def check_repo(repo_dir, version_arg, strictness):
    """針對單一儲存庫執行所有檢查。透過 pass_/fail_/warn/info 寫入輸出。"""
    repo_dir = Path(repo_dir)
    if str(repo_dir) == ".":
        repo_dir = Path.cwd()
    repo_name = repo_dir.name
    q = repo_dir / "quality"

    print("")
    print(f"=== {repo_name} ===")

    check_file_existence(repo_dir, q, strictness)
    bug_count, bug_ids = check_bugs_heading(q)
    tdd_data = check_tdd_sidecar(q, bug_count)
    check_tdd_logs(q, bug_count, bug_ids, tdd_data)
    check_integration_sidecar(q, strictness)
    check_recheck_sidecar(q)
    check_use_cases(repo_dir, q, strictness)
    check_test_file_extension(repo_dir, q)
    check_terminal_gate(q)
    check_mechanical(q)
    check_patches(q, bug_count, bug_ids, strictness)
    check_writeups(q, bug_count)
    skill_version = check_version_stamps(repo_dir, q)
    check_cross_run_contamination(repo_dir, q, version_arg, skill_version)
    check_run_metadata(q)
    check_v1_5_0_gate_invariants(repo_dir, q)

    print("")


# --- 主程式 ---


def main(argv=None):
    _reset_counters()
    if argv is None:
        argv = sys.argv[1:]

    repo_dirs = []
    version = ""
    check_all = False
    strictness = "benchmark"

    expect_version = False
    for arg in argv:
        if expect_version:
            version = arg
            expect_version = False
            continue
        if arg == "--version":
            expect_version = True
        elif arg == "--all":
            check_all = True
        elif arg == "--benchmark":
            strictness = "benchmark"
        elif arg == "--general":
            strictness = "general"
        else:
            repo_dirs.append(arg)

    if not version:
        version = detect_skill_version([
            SCRIPT_DIR / ".." / "SKILL.md",
            SCRIPT_DIR / "SKILL.md",
            Path("SKILL.md"),
            Path(".claude") / "skills" / "quality-playbook" / "SKILL.md",
            Path(".github") / "skills" / "SKILL.md",
            Path(".github") / "skills" / "quality-playbook" / "SKILL.md",
        ])

    # 解析儲存庫
    if check_all:
        for entry in sorted(SCRIPT_DIR.glob(f"*-{version}")):
            if (entry / "quality").is_dir():
                repo_dirs.append(str(entry))
    elif len(repo_dirs) == 1 and repo_dirs[0] == ".":
        repo_dirs = [str(Path.cwd())]
    else:
        resolved = []
        for name in repo_dirs:
            p = Path(name)
            if (p / "quality").is_dir():
                resolved.append(name)
            elif (SCRIPT_DIR / f"{name}-{version}").is_dir():
                resolved.append(str(SCRIPT_DIR / f"{name}-{version}"))
            elif (SCRIPT_DIR / name).is_dir():
                resolved.append(str(SCRIPT_DIR / name))
            else:
                print(f"警告：找不到儲存庫 '{name}'")
        repo_dirs = resolved

    if not repo_dirs:
        print(f"用法：{sys.argv[0]} [--version V] [--all | repo1 repo2 ... | .]")
        return 1

    print("=== Quality Gate — 執行後驗證 ===")
    print(f"版本：      {version or '未知'}")
    print(f"嚴格程度：  {strictness}")
    print(f"儲存庫數量：{len(repo_dirs)}")

    for rd in repo_dirs:
        check_repo(rd, version, strictness)

    print("")
    print("===========================================")
    print(f"總計：{FAIL} 個 FAIL，{WARN} 個 WARN")
    if FAIL > 0:
        print(f"結果：閘檢查失敗 — 必須修復 {FAIL} 項檢查")
        return 1
    else:
        print("結果：閘檢查通過")
        return 0


if __name__ == "__main__":
    sys.exit(main())
