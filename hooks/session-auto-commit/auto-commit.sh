#!/bin/bash

# 會話自動提交 Hook
# 當 Copilot 會話結束時，自動提交並推送變更

set -euo pipefail

# 檢查是否設定了 SKIP_AUTO_COMMIT
if [[ "${SKIP_AUTO_COMMIT:-}" == "true" ]]; then
  echo "⏭️  已跳過自動提交 (SKIP_AUTO_COMMIT=true)"
  exit 0
fi

# 檢查是否位於 git 儲存庫中
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "⚠️  不處於 git 儲存庫中"
  exit 0
fi

# 檢查是否有未提交的變更
if [[ -z "$(git status --porcelain)" ]]; then
  echo "✨ 沒有需要提交的變更"
  exit 0
fi

echo "📦 正在自動提交來自 Copilot 會話的變更..."

# 暫存所有變更
git add -A

# 建立帶有時間戳記的提交
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "auto-commit: $TIMESTAMP" --no-verify 2>/dev/null || {
  echo "⚠️  提交失敗"
  exit 0
}

# 嘗試推送
if git push 2>/dev/null; then
  echo "✅ 變更已成功提交並推送"
else
  echo "⚠️  推送失敗 - 變更已在本地端提交"
fi

exit 0
