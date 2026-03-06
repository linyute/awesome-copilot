#!/bin/bash

# 記錄會話開始事件

set -euo pipefail

# 如果停用記錄則跳過
if [[ "${SKIP_LOGGING:-}" == "true" ]]; then
  exit 0
fi

# 從 Copilot 讀取輸入
INPUT=$(cat)

# 如果日誌目錄不存在則建立
mkdir -p logs/copilot

# 擷取時間戳記與會話資訊
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CWD=$(pwd)

# 記錄會話開始 (使用 jq 以進行正確的 JSON 編碼)
jq -Rn --arg timestamp "$TIMESTAMP" --arg cwd "$CWD" '{"timestamp":$timestamp,"event":"sessionStart","cwd":$cwd}' >> logs/copilot/session.log

echo "📝 已記錄會話"
exit 0
