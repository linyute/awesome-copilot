#!/bin/bash

# 記錄會話結束事件

set -euo pipefail

# 如果停用記錄則跳過
if [[ "${SKIP_LOGGING:-}" == "true" ]]; then
  exit 0
fi

# 從 Copilot 讀取輸入
INPUT=$(cat)

# 如果日誌目錄不存在則建立
mkdir -p logs/copilot

# 擷取時間戳記
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 記錄會話結束
echo "{\"timestamp\":\"$TIMESTAMP\",\"event\":\"sessionEnd\"}" >> logs/copilot/session.log

echo "📝 已記錄會話結束"
exit 0
