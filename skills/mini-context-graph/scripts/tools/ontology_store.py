"""
ontology_store.py — 追蹤實體類型與關聯類型。

處理：
- 註冊帶有使用次數的類型與關聯
- 透過同義詞映射將類型與關聯標準化
- 持久化至 ontology.json

注意：此處沒有 LLM 邏輯。標準化是基於規則的（小寫 + 同義詞映射）。
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import config

_DATA_DIR = Path(os.environ.get("MINI_CONTEXT_GRAPH_DATA_DIR", str(config.DATA_DIR)))
_ONTOLOGY_FILE = _DATA_DIR / "ontology.json"

# 同義詞映射 — 小寫變體映射至規範形式
_ENTITY_TYPE_MAP: dict[str, str] = {
    "component": "component",
    "module": "component",
    "class": "component",
    "function": "component",
    "method": "component",
    "bug": "issue",
    "defect": "issue",
    "fault": "issue",
    "error": "issue",
    "failure": "issue",
    "problem": "issue",
    "crash": "issue",
    "server": "infrastructure",
    "host": "infrastructure",
    "machine": "infrastructure",
    "node": "infrastructure",
    "user": "actor",
    "person": "actor",
    "operator": "actor",
    "admin": "actor",
    "administrator": "actor",
    "actor": "actor",
    "app": "software",
    "application": "software",
    "service": "software",
    "program": "software",
    "software": "software",
    "database": "storage",
    "datastore": "storage",
    "db": "storage",
    "storage": "storage",
    "api": "interface",
    "endpoint": "interface",
    "interface": "interface",
    "connection": "interface",
    "event": "event",
    "incident": "event",
    "occurrence": "event",
    "trigger": "event",
    "concept": "concept",
    "idea": "concept",
    "principle": "concept",
    "theory": "concept",
    "process": "process",
    "thread": "process",
    "task": "process",
    "job": "process",
    "workflow": "process",
    "object": "component",
    "resource": "component",
    "memory": "resource",
    "cpu": "resource",
    "system": "system",
    "platform": "system",
    "framework": "system",
    "library": "software",
    "package": "software",
}

_RELATION_TYPE_MAP: dict[str, str] = {
    "causes": "causes",
    "triggers": "causes",
    "leads to": "causes",
    "results in": "causes",
    "produces": "causes",
    "is part of": "contains",
    "belongs to": "contains",
    "lives in": "contains",
    "sits in": "contains",
    "contains": "contains",
    "depends on": "depends on",
    "requires": "depends on",
    "needs": "depends on",
    "uses": "uses",
    "calls": "uses",
    "invokes": "uses",
    "consumes": "uses",
    "affects": "affects",
    "impacts": "affects",
    "influences": "affects",
    "creates": "creates",
    "instantiates": "creates",
    "spawns": "creates",
    "connects to": "connects to",
    "links to": "connects to",
    "references": "connects to",
    "inherits from": "extends",
    "extends": "extends",
    "subclasses": "extends",
    "reads from": "reads from",
    "queries": "reads from",
    "fetches": "reads from",
    "writes to": "writes to",
    "stores in": "writes to",
    "persists to": "writes to",
    "contributes to": "contributes to",
    "allocated by": "allocated by",
    "released by": "released by",
    "not released": "not released",
}


def _load() -> dict:
    if _ONTOLOGY_FILE.exists():
        with open(_ONTOLOGY_FILE, "r") as f:
            return json.load(f)
    return {"entity_types": {}, "relation_types": {}}


def _save(ontology: dict) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(_ONTOLOGY_FILE, "w") as f:
        json.dump(ontology, f, indent=2)


def normalize_type(type_name: str) -> str:
    """回傳實體類型的規範形式。"""
    key = type_name.strip().lower().replace("-", " ").replace("_", " ")
    return _ENTITY_TYPE_MAP.get(key, key)


def normalize_relation(relation_name: str) -> str:
    """回傳關聯類型的規範形式。"""
    key = relation_name.strip().lower().replace("-", " ").replace("_", " ")
    return _RELATION_TYPE_MAP.get(key, key)


def add_type(type_name: str) -> None:
    """註冊實體類型，增加其使用次數。"""
    ontology = _load()
    canonical = normalize_type(type_name)
    ontology["entity_types"][canonical] = ontology["entity_types"].get(canonical, 0) + 1
    _save(ontology)


def add_relation(relation_name: str) -> None:
    """註冊關聯類型，增加其使用次數。"""
    ontology = _load()
    canonical = normalize_relation(relation_name)
    ontology["relation_types"][canonical] = ontology["relation_types"].get(canonical, 0) + 1
    _save(ontology)


def get_all_types() -> dict[str, int]:
    """回傳所有已註冊的實體類型及其計數。"""
    return _load()["entity_types"]


def get_all_relations() -> dict[str, int]:
    """回傳所有已註冊的關聯類型及其計數。"""
    return _load()["relation_types"]
