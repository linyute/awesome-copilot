#!/bin/bash

# 治理稽核：記錄包含治理上下文的工作階段開始事件

set -euo pipefail

if [[ "${SKIP_GOVERNANCE_AUDIT:-}" == "true" ]]; then
  exit 0
fi

INPUT=$(cat)

mkdir -p logs/copilot/governance

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CWD=$(pwd)
LEVEL="${GOVERNANCE_LEVEL:-standard}"

jq -Rn \
  --arg timestamp "$TIMESTAMP" \
  --arg cwd "$CWD" \
  --arg level "$LEVEL" \
  '{"timestamp":$timestamp,"event":"session_start","governance_level":$level,"cwd":$cwd}' \
  >> logs/copilot/governance/audit.log

echo "🛡️ 治理稽核已啟動 (層級：$LEVEL)"
exit 0
