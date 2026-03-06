#!/usr/bin/env python3
# -*- coding: utf-8 -*-"""
用於 AzureRM Set 類型屬性的 Terraform 計畫分析器

分析 terraform 計畫 (plan) JSON 輸出，以區分：
- Set 類型屬性中的僅順序變更 (誤報)
- 實際的新增/刪除/修改

用法：
    terraform show -json plan.tfplan | python analyze_plan.py
    python analyze_plan.py plan.json
    python analyze_plan.py plan.json --format json --exit-code

有關 CI/CD 管道用法，請參閱此目錄中的 README.md。
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

# --exit-code 選項的結束代碼
EXIT_NO_CHANGES = 0
EXIT_ORDER_ONLY = 0  # 僅順序變更不是真正的變更
EXIT_SET_CHANGES = 1  # 實際的 Set 屬性變更
EXIT_RESOURCE_REPLACE = 2  # 資源替換 (最嚴重)
EXIT_ERROR = 3

# 外部屬性 JSON 檔案的預設路徑 (相對於此指令稿)
DEFAULT_ATTRIBUTES_PATH = (
    Path(__file__).parent.parent / "references" / "azurerm_set_attributes.json"
)


# 全域配置
class Config:
    """分析器的全域配置。"""

    ignore_case: bool = False
    quiet: bool = False
    verbose: bool = False
    warnings: List[str] = []


CONFIG = Config()


def warn(message: str) -> None:
    """新增一條警告訊息。"""
    CONFIG.warnings.append(message)
    if CONFIG.verbose:
        print(f"警告：{message}", file=sys.stderr)


def load_set_attributes(path: Optional[Path] = None) -> Dict[str, Dict[str, Any]]:
    """從外部 JSON 檔案載入 Set 類型屬性。"""
    attributes_path = path or DEFAULT_ATTRIBUTES_PATH

    try:
        with open(attributes_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("resources", {})
    except FileNotFoundError:
        warn(f"找不到屬性檔案：{attributes_path}")
        return {}
    except json.JSONDecodeError as e:
        print(f"錯誤：屬性檔案中的 JSON 無效：{e}", file=sys.stderr)
        sys.exit(EXIT_ERROR)


# 儲存已載入屬性的全域變數 (在 main 中初始化)
AZURERM_SET_ATTRIBUTES: Dict[str, Any] = {}


def get_attr_config(attr_def: Any) -> tuple:
    """
    剖析屬性定義並回傳 (key_attr, nested_attrs)。

    屬性定義可以是：
    - str：簡單的鍵值屬性 (例如："name")
    - None/null：沒有鍵值屬性
    - dict：包含 "_key" 和嵌套屬性的嵌套結構
    """
    if attr_def is None:
        return (None, {})
    if isinstance(attr_def, str):
        return (attr_def, {})
    if isinstance(attr_def, dict):
        key_attr = attr_def.get("_key")
        nested_attrs = {k: v for k, v in attr_def.items() if k != "_key"}
        return (key_attr, nested_attrs)
    return (None, {})


@dataclass
class SetAttributeChange:
    """代表 Set 類型屬性中的變更。"""

    attribute_name: str
    path: str = (
        ""  # 嵌套屬性的完整路徑 (例如："rewrite_rule_set.rewrite_rule")
    )
    order_only_count: int = 0
    added: List[str] = field(default_factory=list)
    removed: List[str] = field(default_factory=list)
    modified: List[tuple] = field(default_factory=list)
    nested_changes: List["SetAttributeChange"] = field(default_factory=list)
    # 用於原始型別集合 (字串/數字陣列)
    is_primitive: bool = False
    primitive_added: List[Any] = field(default_factory=list)
    primitive_removed: List[Any] = field(default_factory=list)


@dataclass
class ResourceChange:
    """代表對單個資源的變更。"""

    address: str
    resource_type: str
    actions: List[str] = field(default_factory=list)
    set_changes: List[SetAttributeChange] = field(default_factory=list)
    other_changes: List[str] = field(default_factory=list)
    is_replace: bool = False
    is_create: bool = False
    is_delete: bool = False


@dataclass
class AnalysisResult:
    """整體的分析結果。"""

    resources: List[ResourceChange] = field(default_factory=list)
    order_only_count: int = 0
    actual_set_changes_count: int = 0
    replace_count: int = 0
    create_count: int = 0
    delete_count: int = 0
    other_changes_count: int = 0
    warnings: List[str] = field(default_factory=list)


def get_element_key(element: Dict[str, Any], key_attr: Optional[str]) -> str:
    """從 Set 元素中提取鍵值 (key value)。"""
    if key_attr and key_attr in element:
        val = element[key_attr]
        if CONFIG.ignore_case and isinstance(val, str):
            return val.lower()
        return str(val)
    # 對於沒有鍵值屬性的元素，回傳排序後項目的雜湊值
    return str(hash(json.dumps(element, sort_keys=True)))

def normalize_value(val: Any) -> Any:
    """將值正規化以進行比較 (將空字串與 None 視為等價)。"""
    if val == "" or val is None:
        return None
    if isinstance(val, list) and len(val) == 0:
        return None
    #正規化數字型別 (int vs float)
    if isinstance(val, float) and val.is_integer():
        return int(val)
    return val

def normalize_for_comparison(val: Any) -> Any:
    """正規化值以進行比較，包括不區分大小寫的選項。"""
    val = normalize_value(val)
    if CONFIG.ignore_case and isinstance(val, str):
        return val.lower()
    return val

def values_equivalent(before_val: Any, after_val: Any) -> bool:
    """檢查兩個值是否實際上等價。"""
    return normalize_for_comparison(before_val) == normalize_for_comparison(after_val)

def compare_elements(
    before: Dict[str, Any], after: Dict[str, Any], nested_attrs: Dict[str, Any] = None
) -> tuple:
    """
    比較兩個元素並回傳 (simple_diffs, nested_set_attrs)。

    simple_diffs：非 Set 屬性中的差異
    nested_set_attrs：嵌套 Set 的 (attr_name, before_val, after_val, attr_def) 清單
    """
    nested_attrs = nested_attrs or {}
    simple_diffs = {}
    nested_set_attrs = []

    all_keys = set(before.keys()) | set(after.keys())

    for key in all_keys:
        before_val = before.get(key)
        after_val = after.get(key)

        # 檢查這是否為嵌套 Set 屬性
        if key in nested_attrs:
            if before_val != after_val:
                nested_set_attrs.append((key, before_val, after_val, nested_attrs[key]))
        elif not values_equivalent(before_val, after_val):
            simple_diffs[key] = {"before": before_val, "after": after_val}

    return (simple_diffs, nested_set_attrs)

def analyze_primitive_set(
    before_list: Optional[List[Any]],
    after_list: Optional[List[Any]],
    attr_name: str,
    path: str = "",
) -> SetAttributeChange:
    """分析原始型別集合 (字串/數字陣列) 中的變更。"""
    full_path = f"{path}.{attr_name}" if path else attr_name
    change = SetAttributeChange(
        attribute_name=attr_name, path=full_path, is_primitive=True
    )

    before_set = set(before_list) if before_list else set()
    after_set = set(after_list) if after_list else set()

    # 如果已配置，套用不區分大小寫的比較
    if CONFIG.ignore_case:
        before_normalized = {v.lower() if isinstance(v, str) else v for v in before_set}
        after_normalized = {v.lower() if isinstance(v, str) else v for v in after_set}
    else:
        before_normalized = before_set
        after_normalized = after_set

    removed = before_normalized - after_normalized
    added = after_normalized - before_normalized

    if removed:
        change.primitive_removed = list(removed)
    if added:
        change.primitive_added = list(added)

    # 同時存在於兩者中的元素 (僅限順序變更)
    common = before_normalized & after_normalized
    if common and not removed and not added:
        change.order_only_count = len(common)

    return change

def analyze_set_attribute(
    before_list: Optional[List[Dict[str, Any]]],
    after_list: Optional[List[Dict[str, Any]]],
    key_attr: Optional[str],
    attr_name: str,
    nested_attrs: Dict[str, Any] = None,
    path: str = "",
    after_unknown: Optional[Dict[str, Any]] = None,
) -> SetAttributeChange:
    """分析 Set 類型屬性中的變更，包括嵌套的 Set。"""
    full_path = f"{path}.{attr_name}" if path else attr_name
    change = SetAttributeChange(attribute_name=attr_name, path=full_path)
    nested_attrs = nested_attrs or {}

    before_list = before_list or []
    after_list = after_list or []

    # 處理非清單值 (單個元素)
    if not isinstance(before_list, list):
        before_list = [before_list] if before_list else []
    if not isinstance(after_list, list):
        after_list = [after_list] if after_list else []

    # 檢查這是否為原始型別集合 (非字典元素)
    has_primitive_before = any(
        not isinstance(e, dict) for e in before_list if e is not None
    )
    has_primitive_after = any(
        not isinstance(e, dict) for e in after_list if e is not None
    )

    if has_primitive_before or has_primitive_after:
        # 處理原始型別集合
        return analyze_primitive_set(before_list, after_list, attr_name, path)

    # 建立以鍵值屬性為鍵的映射 (Maps)
    before_map: Dict[str, Dict[str, Any]] = {}
    after_map: Dict[str, Dict[str, Any]] = {}

    # 偵測重複的鍵
    for e in before_list:
        if isinstance(e, dict):
            key = get_element_key(e, key_attr)
            if key in before_map:
                warn(f"{full_path} 的 before 狀態中存在重複的鍵 '{key}'")
            before_map[key] = e

    for e in after_list:
        if isinstance(e, dict):
            key = get_element_key(e, key_attr)
            if key in after_map:
                warn(f"{full_path} 的 after 狀態中存在重複的鍵 '{key}'")
            after_map[key] = e

    before_keys = set(before_map.keys())
    after_keys = set(after_map.keys())

    # 找出已移除的元素
    for key in before_keys - after_keys:
        display_key = key if key_attr else "(元素)"
        change.removed.append(display_key)

    # 找出已新增的元素
    for key in after_keys - before_keys:
        display_key = key if key_attr else "(元素)"
        change.added.append(display_key)

    # 比較共同元素
    for key in before_keys & after_keys:
        before_elem = before_map[key]
        after_elem = after_map[key]

        if before_elem == after_elem:
            # 完全符合 - 僅順序變更
            change.order_only_count += 1
        else:
            # 內容已變更 - 檢查是否有意義的差異
            simple_diffs, nested_set_list = compare_elements(
                before_elem, after_elem, nested_attrs
            )

            # 遞迴處理嵌套的 Set 屬性
            for nested_name, nested_before, nested_after, nested_def in nested_set_list:
                nested_key, sub_nested = get_attr_config(nested_def)
                nested_change = analyze_set_attribute(
                    nested_before,
                    nested_after,
                    nested_key,
                    nested_name,
                    sub_nested,
                    full_path,
                )
                if (
                    nested_change.order_only_count > 0
                    or nested_change.added
                    or nested_change.removed
                    or nested_change.modified
                    or nested_change.nested_changes
                    or nested_change.primitive_added
                    or nested_change.primitive_removed
                ):
                    change.nested_changes.append(nested_change)

            if simple_diffs:
                # 在非嵌套屬性中具有實際差異
                display_key = key if key_attr else "(元素)"
                change.modified.append((display_key, simple_diffs))
            elif not nested_set_list:
                # 僅有 null/空值差異 - 視為順序變更
                change.order_only_count += 1

    return change

def analyze_resource_change(
    resource_change: Dict[str, Any],
    include_filter: Optional[List[str]] = None,
    exclude_filter: Optional[List[str]] = None,
) -> Optional[ResourceChange]:
    """分析來自 terraform 計畫的單個資源變更。"""
    resource_type = resource_change.get("type", "")
    address = resource_change.get("address", "")
    change = resource_change.get("change", {})
    actions = change.get("actions", [])

    # 如果沒有變更或不是 AzureRM 資源，則跳過
    if actions == ["no-op"] or not resource_type.startswith("azurerm_"):
        return None

    # 套用篩選器
    if include_filter:
        if not any(f in resource_type for f in include_filter):
            return None
    if exclude_filter:
        if any(f in resource_type for f in exclude_filter):
            return None

    before = change.get("before") or {}
    after = change.get("after") or {}
    after_unknown = change.get("after_unknown") or {}
    before_sensitive = change.get("before_sensitive") or {}
    after_sensitive = change.get("after_sensitive") or {}

    # 確定操作類型
    is_create = actions == ["create"]
    is_delete = actions == ["delete"]
    is_replace = "delete" in actions and "create" in actions

    result = ResourceChange(
        address=address,
        resource_type=resource_type,
        actions=actions,
        is_replace=is_replace,
        is_create=is_create,
        is_delete=is_delete,
    )

    # 針對建立/刪除跳過詳細的 Set 分析 (所有元素都是新建立/已移除)
    if is_create or is_delete:
        return result

    # 取得此資源類型的 Set 屬性
    set_attrs = AZURERM_SET_ATTRIBUTES.get(resource_type, {})

    # 分析 Set 類型屬性
    analyzed_attrs: Set[str] = set()
    for attr_name, attr_def in set_attrs.items():
        before_val = before.get(attr_name)
        after_val = after.get(attr_name)

        # 針對敏感屬性發出警告
        if attr_name in before_sensitive or attr_name in after_sensitive:
            if before_sensitive.get(attr_name) or after_sensitive.get(attr_name):
                warn(
                    f"{address} 中的屬性 '{attr_name}' 包含敏感值 (比較結果可能不完整)"
                )

        # 如果屬性不存在或未變更，則跳過
        if before_val is None and after_val is None:
            continue
        if before_val == after_val:
            continue

        # 僅在其為清單 (Terraform 中的 Set) 或已變更時進行分析
        if not isinstance(before_val, list) and not isinstance(after_val, list):
            continue

        # 剖析屬性定義中的鍵值與嵌套屬性
        key_attr, nested_attrs = get_attr_config(attr_def)

        # 取得此屬性的 after_unknown
        attr_after_unknown = after_unknown.get(attr_name)

        set_change = analyze_set_attribute(
            before_val,
            after_val,
            key_attr,
            attr_name,
            nested_attrs,
            after_unknown=attr_after_unknown,
        )

        # 僅在有實際發現時包含
        if (
            set_change.order_only_count > 0
            or set_change.added
            or set_change.removed
            or set_change.modified
            or set_change.nested_changes
            or set_change.primitive_added
            or set_change.primitive_removed
        ):
            result.set_changes.append(set_change)
            analyzed_attrs.add(attr_name)

    # 找出其他 (非 Set) 變更
    all_keys = set(before.keys()) | set(after.keys())
    for key in all_keys:
        if key in analyzed_attrs:
            continue
        if key.startswith("_"):
            continue
        before_val = before.get(key)
        after_val = after.get(key)
        if before_val != after_val:
            result.other_changes.append(key)

    return result

def collect_all_changes(set_change: SetAttributeChange, prefix: str = "") -> tuple:
    """
    從嵌套結構中遞迴收集僅順序變更與實際變更。
    回傳 (order_only_list, actual_change_list)
    """
    order_only = []
    actual = []

    display_name = (
        f"{prefix}{set_change.attribute_name}" if prefix else set_change.attribute_name
    )

    has_actual_change = (
        set_change.added
        or set_change.removed
        or set_change.modified
        or set_change.primitive_added
        or set_change.primitive_removed
    )

    if set_change.order_only_count > 0 and not has_actual_change:
        order_only.append((display_name, set_change))
    elif has_actual_change:
        actual.append((display_name, set_change))

    # 處理嵌套變更
    for nested in set_change.nested_changes:
        nested_order, nested_actual = collect_all_changes(nested, f"{display_name}.")
        order_only.extend(nested_order)
        actual.extend(nested_actual)

    return (order_only, actual)

def format_set_change(change: SetAttributeChange, indent: int = 0) -> List[str]:
    """將單個 SetAttributeChange 格式化以供輸出。"""
    lines = []
    prefix = "  " * indent

    # 處理原始型別集合
    if change.is_primitive:
        if change.primitive_added:
            lines.append(f"{prefix}**新增：**")
            for item in change.primitive_added:
                lines.append(f"{prefix}  - {item}")
        if change.primitive_removed:
            lines.append(f"{prefix}**移除：**")
            for item in change.primitive_removed:
                lines.append(f"{prefix}  - {item}")
        if change.order_only_count > 0:
            lines.append(f"{prefix}**僅限順序：** {change.order_only_count} 個元素")
        return lines

    if change.added:
        lines.append(f"{prefix}**新增：**")
        for item in change.added:
            lines.append(f"{prefix}  - {item}")

    if change.removed:
        lines.append(f"{prefix}**移除：**")
        for item in change.removed:
            lines.append(f"{prefix}  - {item}")

    if change.modified:
        lines.append(f"{prefix}**修改：**")
        for item_key, diffs in change.modified:
            lines.append(f"{prefix}  - {item_key}：")
            for diff_key, diff_val in diffs.items():
                before_str = json.dumps(diff_val["before"], ensure_ascii=False)
                after_str = json.dumps(diff_val["after"], ensure_ascii=False)
                lines.append(f"{prefix}    - {diff_key}：{before_str} → {after_str}")

    if change.order_only_count > 0:
        lines.append(f"{prefix}**僅限順序：** {change.order_only_count} 個元素")

    # 格式化嵌套變更
    for nested in change.nested_changes:
        if (
            nested.added
            or nested.removed
            or nested.modified
            or nested.nested_changes
            or nested.primitive_added
            or nested.primitive_removed
        ):
            lines.append(f"{prefix}**嵌套屬性 `{nested.attribute_name}`：**")
            lines.extend(format_set_change(nested, indent + 1))

    return lines

def format_markdown_output(result: AnalysisResult) -> str:
    """將分析結果格式化為 Markdown。"""
    lines = ["# Terraform 計畫分析結果", ""]
    lines.append(
        '分析 AzureRM Set 類型屬性變更，並識別僅順序變更的「誤報差異」。'
    )
    lines.append("")

    # 將變更分類 (包含嵌套變更)
    order_only_changes: List[tuple] = []
    actual_set_changes: List[tuple] = []
    replace_resources: List[ResourceChange] = []
    create_resources: List[ResourceChange] = []
    delete_resources: List[ResourceChange] = []
    other_changes: List[tuple] = []

    for res in result.resources:
        if res.is_replace:
            replace_resources.append(res)
        elif res.is_create:
            create_resources.append(res)
        elif res.is_delete:
            delete_resources.append(res)

        for set_change in res.set_changes:
            order_only, actual = collect_all_changes(set_change)
            for name, change in order_only:
                order_only_changes.append((res.address, name, change))
            for name, change in actual:
                actual_set_changes.append((res.address, name, change))

        if res.other_changes:
            other_changes.append((res.address, res.other_changes))

    # 章節：僅順序變更 (無影響)
    lines.append("## 🟢 僅順序變更 (無影響)")
    lines.append("")
    if order_only_changes:
        lines.append(
            "以下變更僅為 Set 類型屬性的內部重新排序，無實際資源變更。"
        )
        lines.append("")
        for address, name, change in order_only_changes:
            lines.append(
                f"- `{address}`：**{name}** ({change.order_only_count} 個元素)"
            )
    else:
        lines.append("無")
    lines.append("")

    # 章節：實際的 Set 變更
    lines.append("## 🟡 實際的 Set 屬性變更")
    lines.append("")
    if actual_set_changes:
        for address, name, change in actual_set_changes:
            lines.append(f"### `{address}` - {name}")
            lines.append("")
            lines.extend(format_set_change(change))
            lines.append("")
    else:
        lines.append("無")
    lines.append("")

    # 章節：資源替換
    lines.append("## 🔴 資源替換 (請注意)")
    lines.append("")
    if replace_resources:
        lines.append(
            "以下資源將被刪除並重新建立。這可能會導致停機。"
        )
        lines.append("")
        for res in replace_resources:
            lines.append(f"- `{res.address}`")
    else:
        lines.append("無")
    lines.append("")

    # 章節：警告
    if result.warnings:
        lines.append("## ⚠️ 警告")
        lines.append("")
        for warning in result.warnings:
            lines.append(f"- {warning}")
        lines.append("")

    return "\n".join(lines)

def format_json_output(result: AnalysisResult) -> str:
    """將分析結果格式化為 JSON。"""

    def set_change_to_dict(change: SetAttributeChange) -> dict:
        d = {
            "attribute_name": change.attribute_name,
            "path": change.path,
            "order_only_count": change.order_only_count,
            "is_primitive": change.is_primitive,
        }
        if change.added:
            d["added"] = change.added
        if change.removed:
            d["removed"] = change.removed
        if change.modified:
            d["modified"] = [{"key": k, "diffs": v} for k, v in change.modified]
        if change.primitive_added:
            d["primitive_added"] = change.primitive_added
        if change.primitive_removed:
            d["primitive_removed"] = change.primitive_removed
        if change.nested_changes:
            d["nested_changes"] = [set_change_to_dict(n) for n in change.nested_changes]
        return d

    def resource_to_dict(res: ResourceChange) -> dict:
        return {
            "address": res.address,
            "resource_type": res.resource_type,
            "actions": res.actions,
            "is_replace": res.is_replace,
            "is_create": res.is_create,
            "is_delete": res.is_delete,
            "set_changes": [set_change_to_dict(c) for c in res.set_changes],
            "other_changes": res.other_changes,
        }

    output = {
        "summary": {
            "order_only_count": result.order_only_count,
            "actual_set_changes_count": result.actual_set_changes_count,
            "replace_count": result.replace_count,
            "create_count": result.create_count,
            "delete_count": result.delete_count,
            "other_changes_count": result.other_changes_count,
        },
        "has_real_changes": (
            result.actual_set_changes_count > 0
            or result.replace_count > 0
            or result.create_count > 0
            or result.delete_count > 0
            or result.other_changes_count > 0
        ),
        "resources": [resource_to_dict(r) for r in result.resources],
        "warnings": result.warnings,
    }
    return json.dumps(output, indent=2, ensure_ascii=False)

def format_summary_output(result: AnalysisResult) -> str:
    """將分析結果格式化為單行摘要。"""
    parts = []

    if result.order_only_count > 0:
        parts.append(f"🟢 {result.order_only_count} 個僅順序變更")
    if result.actual_set_changes_count > 0:
        parts.append(f"🟡 {result.actual_set_changes_count} 個 set 變更")
    if result.replace_count > 0:
        parts.append(f"🔴 {result.replace_count} 個替換變更")

    if not parts:
        return "✅ 未偵測到任何變更"

    return " | ".join(parts)

def analyze_plan(
    plan_json: Dict[str, Any],
    include_filter: Optional[List[str]] = None,
    exclude_filter: Optional[List[str]] = None,
) -> AnalysisResult:
    """分析 terraform 計畫 JSON 並回傳結果。"""
    result = AnalysisResult()

    resource_changes = plan_json.get("resource_changes", [])

    for rc in resource_changes:
        res = analyze_resource_change(rc, include_filter, exclude_filter)
        if res:
            result.resources.append(res)

            # 計數統計
            if res.is_replace:
                result.replace_count += 1
            elif res.is_create:
                result.create_count += 1
            elif res.is_delete:
                result.delete_count += 1

            if res.other_changes:
                result.other_changes_count += len(res.other_changes)

            for set_change in res.set_changes:
                order_only, actual = collect_all_changes(set_change)
                result.order_only_count += len(order_only)
                result.actual_set_changes_count += len(actual)

    # 從全域配置中新增警告
    result.warnings = CONFIG.warnings.copy()

    return result

def determine_exit_code(result: AnalysisResult) -> int:
    """根據分析結果決定結束代碼。"""
    if result.replace_count > 0:
        return EXIT_RESOURCE_REPLACE
    if (
        result.actual_set_changes_count > 0
        or result.create_count > 0
        or result.delete_count > 0
    ):
        return EXIT_SET_CHANGES
    return EXIT_NO_CHANGES

def parse_args() -> argparse.Namespace:
    """剖析命令列引數。"""
    parser = argparse.ArgumentParser(
        description="分析 Terraform 計畫 JSON 以了解 AzureRM Set 類型屬性的變更。",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例：
  # 基本用法
  python analyze_plan.py plan.json

  # 從 stdin 讀取
  terraform show -json plan.tfplan | python analyze_plan.py

  # 包含結束代碼的 CI/CD
  python analyze_plan.py plan.json --exit-code

  # 用於程式化處理的 JSON 輸出
  python analyze_plan.py plan.json --format json

  # 用於 CI 日誌的摘要
  python analyze_plan.py plan.json --format summary

結束代碼 (搭配 --exit-code)：
  0 - 無變更或僅有順序變更
  1 - 實際的 Set 屬性變更
  2 - 偵測到資源替換
  3 - 錯誤
""",
    )

    parser.add_argument(
        "plan_file",
        nargs="?",
        help="Terraform 計畫 JSON 檔案的路徑 (如果未提供，則從 stdin 讀取)",
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["markdown", "json", "summary"],
        default="markdown",
        help="輸出格式 (預設值：markdown)",
    )
    parser.add_argument(
        "--exit-code",
        "-e",
        action="store_true",
        help="根據變更嚴重程度回傳結束代碼",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="隱藏警告與詳細輸出",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="顯示詳細警告與偵錯資訊",
    )
    parser.add_argument(
        "--ignore-case",
        action="store_true",
        help="比較字串值時不區分大小寫",
    )
    parser.add_argument(
        "--attributes", type=Path, help="自定義屬性 JSON 檔案的路徑"
    )
    parser.add_argument(
        "--include",
        action="append",
        help="僅分析符合此模式的資源 (可重複使用)",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        help="排除符合此模式的資源 (可重複使用)",
    )

    return parser.parse_args()

def main():
    """主要進入點。"""
    global AZURERM_SET_ATTRIBUTES

    args = parse_args()

    # 配置全域設定
    CONFIG.ignore_case = args.ignore_case
    CONFIG.quiet = args.quiet
    CONFIG.verbose = args.verbose
    CONFIG.warnings = []

    # 從外部 JSON 載入 Set 屬性
    AZURERM_SET_ATTRIBUTES = load_set_attributes(args.attributes)

    # 讀取計畫輸入
    if args.plan_file:
        try:
            with open(args.plan_file, "r") as f:
                plan_json = json.load(f)
        except FileNotFoundError:
            print(f"錯誤：找不到檔案：{args.plan_file}", file=sys.stderr)
            sys.exit(EXIT_ERROR)
        except json.JSONDecodeError as e:
            print(f"錯誤：JSON 無效：{e}", file=sys.stderr)
            sys.exit(EXIT_ERROR)
    else:
        try:
            plan_json = json.load(sys.stdin)
        except json.JSONDecodeError as e:
            print(f"錯誤：來自 stdin 的 JSON 無效：{e}", file=sys.stderr)
            sys.exit(EXIT_ERROR)

    # 檢查是否有空白計畫
    resource_changes = plan_json.get("resource_changes", [])
    if not resource_changes:
        if args.format == "json":
            print(
                json.dumps(
                    {
                        "summary": {},
                        "has_real_changes": False,
                        "resources": [],
                        "warnings": [],
                    }
                )
            )
        elif args.format == "summary":
            print("✅ 未偵測到任何變更")
        else:
            print("# Terraform 計畫分析結果\n")
            print("未偵測到資源變更。")
        sys.exit(EXIT_NO_CHANGES)

    # 分析計畫
    result = analyze_plan(plan_json, args.include, args.exclude)

    # 格式化輸出
    if args.format == "json":
        output = format_json_output(result)
    elif args.format == "summary":
        output = format_summary_output(result)
    else:
        output = format_markdown_output(result)

    print(output)

    # 決定結束代碼
    if args.exit_code:
        sys.exit(determine_exit_code(result))


if __name__ == "__main__":
    main()