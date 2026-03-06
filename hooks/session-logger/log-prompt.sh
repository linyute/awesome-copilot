#!/bin/bash

# 記錄使用者提示 (prompt) 提交

set -euo pipefail

# 如果停用記錄則跳過
if [[ "${SKIP_LOGGING:-}" == "true" ]]; then
  exit 0
fi

# 從 Copilot 讀取輸入 (包含提示資訊)
INPUT=$(cat)

# 如果日誌目錄不存在則建立
mkdir -p logs/copilot

# 擷取時間戳記
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 記錄提示 (您可以剖析 INPUT 以獲取更多詳細資訊)
echo "{\"timestamp\":\"$TIMESTAMP\",\"event\":\"userPromptSubmitted\",\"level\":\"${LOG_LEVEL:-INFO}\"}" >> logs/copilot/prompts.log

exit 0
