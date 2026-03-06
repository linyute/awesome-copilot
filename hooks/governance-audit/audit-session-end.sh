#!/bin/bash

# 治理稽核：記錄包含摘要統計資訊的工作階段結束事件

set -euo pipefail

if [[ "${SKIP_GOVERNANCE_AUDIT:-}" == "true" ]]; then
  exit 0
fi

INPUT=$(cat)

mkdir -p logs/copilot/governance

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="logs/copilot/governance/audit.log"

# 計算此工作階段的事件數 (根據工作階段開始時間戳記進行篩選)
TOTAL=0
THREATS=0
SESSION_START=""
if [[ -f "$LOG_FILE" ]]; then
  # 尋找最後一個 session_start 事件，以將統計範圍鎖定在目前工作階段
  SESSION_START=$(grep '"session_start"' "$LOG_FILE" 2>/dev/null | tail -1 | jq -r '.timestamp' 2>/dev/null || echo "")
  if [[ -n "$SESSION_START" ]]; then
    # 計算工作階段開始後的事件
    TOTAL=$(awk -v start="$SESSION_START" -F'"timestamp":"' '{split($2,a,"\""); if(a[1]>=start) count++} END{print count+0}' "$LOG_FILE" 2>/dev/null || echo 0)
    THREATS=$(awk -v start="$SESSION_START" -F'"timestamp":"' '{split($2,a,"\""); if(a[1]>=start && /threat_detected/) count++} END{print count+0}' "$LOG_FILE" 2>/dev/null || echo 0)
  else
    TOTAL=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
    THREATS=$(grep -c '"threat_detected"' "$LOG_FILE" 2>/dev/null || echo 0)
  fi
fi

jq -Rn \
  --arg timestamp "$TIMESTAMP" \
  --argjson total "$TOTAL" \
  --argjson threats "$THREATS" \
  '{"timestamp":$timestamp,"event":"session_end","total_events":$total,"threats_detected":$threats}' \
  >> "$LOG_FILE"

if [[ "$THREATS" -gt 0 ]]; then
  echo "⚠️ 工作階段結束：在 $TOTAL 個事件中偵測到 $THREATS 個威脅"
else
  echo "✅ 工作階段結束：共 $TOTAL 個事件，未發現威脅"
fi

exit 0
