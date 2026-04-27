#!/bin/bash

set -euo pipefail

usage() {
  cat <<'EOF'
使用方式: bash scripts/delete-gone-branches.sh [--apply]

尋找上游被標記為 "[gone]" 的本機分支並將其刪除。

選項:
  --apply    實際使用 `git branch -D` 刪除分支
  --help     顯示此說明文字

若不使用 --apply，此指令稿將僅顯示將要刪除的內容。
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
    echo "未知的選項: $1" >&2
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
  echo "找不到上游為 gone 的本機分支。"
  exit 0
fi

current_branch="$(git branch --show-current)"

echo "找到 ${#gone_branches[@]} 個上游為 gone 的分支:"
printf '  %s\n' "${gone_branches[@]}"

if [[ "$apply" != true ]]; then
  echo
  echo "僅進行試執行。請使用 --apply 重新執行以刪除它們。"
  exit 0
fi

deleted_count=0

for branch in "${gone_branches[@]}"; do
  if [[ "$branch" == "$current_branch" ]]; then
    echo "跳過當前分支: $branch"
    continue
  fi

  git branch -D "$branch"
  deleted_count=$((deleted_count + 1))
done

echo
echo "已刪除 $deleted_count 個分支。"
