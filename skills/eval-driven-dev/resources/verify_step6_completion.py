#!/usr/bin/env python3
"""驗證 eval-driven-dev 步驟 6 的產出物是否完整。

用法：
    python verify_step6_completion.py /path/to/pixie_qa/results/<test_id>
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ENTRY_REQUIRED_FILES = ("evaluations.jsonl",)
DATASET_ANALYSIS_FILES = ("analysis.md", "analysis-summary.md")
ROOT_ANALYSIS_FILES = ("action-plan.md", "action-plan-summary.md", "meta.json")


def _dataset_dirs(results_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in results_dir.iterdir()
        if path.is_dir() and path.name.startswith("dataset-")
    )


def _entry_dirs(dataset_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in dataset_dir.iterdir()
        if path.is_dir() and path.name.startswith("entry-")
    )


def _read_jsonl(path: Path, errors: list[str]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    try:
        for index, line in enumerate(
            path.read_text(encoding="utf-8").splitlines(), start=1
        ):
            if not line.strip():
                continue
            obj = json.loads(line)
            if not isinstance(obj, dict):
                errors.append(f"{path}: 第 {index} 行不是 JSON 物件")
                continue
            rows.append(obj)
    except OSError as exc:
        errors.append(f"{path}: 無法讀取檔案 ({exc})")
    except json.JSONDecodeError as exc:
        errors.append(f"{path}: 無效的 JSONL ({exc})")
    return rows


def validate_results_dir(results_dir: Path) -> list[str]:
    """傳回 pixie 結果目錄的驗證錯誤清單。"""
    errors: list[str] = []

    if not results_dir.is_dir():
        return [f"{results_dir}: 找不到結果目錄"]

    for file_name in ROOT_ANALYSIS_FILES:
        if not (results_dir / file_name).is_file():
            errors.append(f"缺失根產出物：{results_dir / file_name}")

    datasets = _dataset_dirs(results_dir)
    if not datasets:
        errors.append(f"{results_dir}: 找不到 dataset-* 目錄")
        return errors

    for dataset_dir in datasets:
        for file_name in DATASET_ANALYSIS_FILES:
            if not (dataset_dir / file_name).is_file():
                errors.append(f"缺失資料集產出物：{dataset_dir / file_name}")

        entry_dirs = _entry_dirs(dataset_dir)
        if not entry_dirs:
            errors.append(f"{dataset_dir}: 找不到 entry-* 目錄")
            continue

        for entry_dir in entry_dirs:
            for file_name in ENTRY_REQUIRED_FILES:
                if not (entry_dir / file_name).is_file():
                    errors.append(f"缺失進入點產出物：{entry_dir / file_name}")

            evaluations_path = entry_dir / "evaluations.jsonl"
            if not evaluations_path.is_file():
                continue

            evaluations = _read_jsonl(evaluations_path, errors)
            for row in evaluations:
                status = row.get("status")
                if status == "pending":
                    errors.append(
                        "仍有待處理的評估："
                        f"{evaluations_path} ({row.get('evaluator', '未知的評估器')})"
                    )
                    continue

                if "score" not in row:
                    errors.append(
                        "已評分的評估中缺失分數："
                        f"{evaluations_path} ({row.get('evaluator', '未知的評估器')})"
                    )
                if "reasoning" not in row:
                    errors.append(
                        "已評分的評估中缺失推論："
                        f"{evaluations_path} ({row.get('evaluator', '未知的評估器')})"
                    )

    return errors


def main(argv: list[str] | None = None) -> int:
    """CLI 進入點。"""
    parser = argparse.ArgumentParser(
        description="驗證 pixie 結果目錄的步驟 6 完成情況"
    )
    parser.add_argument(
        "results_dir",
        type=Path,
        help="pixie_qa/results/<test_id> 的路徑",
    )
    args = parser.parse_args(argv)

    errors = validate_results_dir(args.results_dir)
    if errors:
        print("步驟 6 完成檢查失敗：")
        for error in errors:
            print(f"- {error}")
        return 1

    print("步驟 6 完成檢查通過。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
