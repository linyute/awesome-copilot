#!/bin/bash

set -euo pipefail

usage() {
  cat <<'EOF'
用法: bash scripts/delete-gone-branches.sh [--apply]

尋找上游已標記為 "[gone]" 的本地分支並將其刪除。

選項:
  --apply    實際執行 `git branch -D` 來刪除分支
  --help     顯示此說明文字

若不使用 --apply，此指令程式將僅列印預計刪除的內容。
EOF
}

apply=false

case "${1:-}" in
  "")
    ;;
  --apply)
    apply=true
    ;;
  --help|-h)
    usage
    exit 0
    ;;
  *)
    echo "未知選項: $1" >&2
    usage >&2
    exit 1
    ;;
esac

git fetch --prune --quiet

mapfile -t gone_branches < <(
  git for-each-ref --format='%(refname:short) %(upstream:track)' refs/heads |
    while IFS= read -r line; do
      branch=${line% *}
      tracking=${line#"$branch "}
      if [[ "$tracking" == "[gone]" ]]; then
        printf '%s\n' "$branch"
      fi
    done
)

if [[ ${#gone_branches[@]} -eq 0 ]]; then
  echo "未發現上游已移除的本地分支。"
  exit 0
fi

current_branch="$(git branch --show-current)"

echo "發現 ${#gone_branches[@]} 個上游已移除的分支："
printf '  %s\n' "${gone_branches[@]}"

if [[ "$apply" != true ]]; then
  echo
  echo "目前為模擬執行。請重新執行並加上 --apply 以刪除它們。"
  exit 0
fi

deleted_count=0

for branch in "${gone_branches[@]}"; do
  if [[ "$branch" == "$current_branch" ]]; then
    echo "略過目前分支：$branch"
    continue
  fi

  git branch -D "$branch"
  deleted_count=$((deleted_count + 1))
done

echo
echo "已刪除 $deleted_count 個分支。"
