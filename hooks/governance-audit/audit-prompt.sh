#!/bin/bash

# 治理稽核：在代理程式處理前，掃描使用者提示中是否存在威脅訊號
#
# 環境變數：
#   GOVERNANCE_LEVEL - "open", "standard", "strict", "locked" (預設值：standard)
#   BLOCK_ON_THREAT  - 為 "true" 時，若偵測到威脅則以非零狀態碼結束 (預設值：false)
#   SKIP_GOVERNANCE_AUDIT - 為 "true" 時則停用 (預設值：未設定)

set -euo pipefail

if [[ "${SKIP_GOVERNANCE_AUDIT:-}" == "true" ]]; then
  exit 0
fi

INPUT=$(cat)

mkdir -p logs/copilot/governance

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LEVEL="${GOVERNANCE_LEVEL:-standard}"
BLOCK="${BLOCK_ON_THREAT:-false}"
LOG_FILE="logs/copilot/governance/audit.log"

# 從 Copilot 輸入中提取提示文字 (帶有 userMessage 欄位的 JSON)
PROMPT=""
if command -v jq &>/dev/null; then
  PROMPT=$(echo "$INPUT" | jq -r '.userMessage // .prompt // empty' 2>/dev/null || echo "")
fi
if [[ -z "$PROMPT" ]]; then
  PROMPT="$INPUT"
fi

# 按類別組織的威脅偵測模式
# 每個模式包含：類別、說明、嚴重性 (0.0-1.0)
THREATS_FOUND=()

check_pattern() {
  local pattern="$1"
  local category="$2"
  local severity="$3"
  local description="$4"

  if echo "$PROMPT" | grep -qiE "$pattern"; then
    local evidence
    evidence=$(echo "$PROMPT" | grep -oiE "$pattern" | head -1)
    local evidence_encoded
    evidence_encoded=$(printf '%s' "$evidence" | base64 | tr -d '
')
    THREATS_FOUND+=("$category	$severity	$description	$evidence_encoded")
  fi
}

# 資料外洩訊號
check_pattern "send\s+(all|every|entire)\s+\w+\s+to\s+" "data_exfiltration" "0.8" "大量資料傳輸"
check_pattern "export\s+.*\s+to\s+(external|outside|third[_-]?party)" "data_exfiltration" "0.9" "外部匯出"
check_pattern "curl\s+.*\s+-d\s+" "data_exfiltration" "0.7" "帶有資料的 HTTP POST"
check_pattern "upload\s+.*\s+(credentials|secrets|keys)" "data_exfiltration" "0.95" "認證上傳"

# 權限提升訊號
check_pattern "(sudo|as\s+root|admin\s+access|runas\s+/user)" "privilege_escalation" "0.8" "權限提升"
check_pattern "chmod\s+777" "privilege_escalation" "0.9" "全域可寫權限"
check_pattern "add\s+.*\s+(sudoers|administrators)" "privilege_escalation" "0.95" "新增管理員權限"

# 系統破壞訊號
check_pattern "(rm\s+-rf\s+/|del\s+/[sq]|format\s+c:)" "system_destruction" "0.95" "破壞性命令"
check_pattern "(drop\s+database|truncate\s+table|delete\s+from\s+\w+\s*(;|\s*$))" "system_destruction" "0.9" "資料庫破壞"
check_pattern "wipe\s+(all|entire|every)" "system_destruction" "0.9" "大規模刪除"

# 提示注入訊號
check_pattern "ignore\s+(previous|above|all)\s+(instructions?|rules?|prompts?)" "prompt_injection" "0.9" "忽略/覆蓋指引"
check_pattern "you\s+are\s+now\s+(a|an)\s+(assistant|ai|bot|system|expert|language\s+model)\b" "prompt_injection" "0.7" "角色重新指派"
check_pattern "(^|
)\s*system\s*:\s*you\s+are" "prompt_injection" "0.6" "系統提示注入"

# 認證洩露訊號
check_pattern "(api[_-]?key|secret[_-]?key|password|token)\s*[:=]\s*['\"]?\w{8,}" "credential_exposure" "0.9" "可能存在硬編碼認證"
check_pattern "(aws_access_key|AKIA[0-9A-Z]{16})" "credential_exposure" "0.95" "AWS 金鑰洩露"

# 記錄提示事件
if [[ ${#THREATS_FOUND[@]} -gt 0 ]]; then
  # 構建威脅 JSON 陣列
  THREATS_JSON="["
  FIRST=true
  MAX_SEVERITY="0.0"
  for threat in "${THREATS_FOUND[@]}"; do
    IFS=$'\t' read -r category severity description evidence_encoded <<< "$threat"
    local evidence
    evidence=$(printf '%s' "$evidence_encoded" | base64 -d 2>/dev/null || echo "[已遮蔽]")

    if [[ "$FIRST" != "true" ]]; then
      THREATS_JSON+=","
    fi
    FIRST=false

    THREATS_JSON+=$(jq -Rn \
      --arg cat "$category" \
      --arg sev "$severity" \
      --arg desc "$description" \
      --arg ev "$evidence" \
      '{"category":$cat,"severity":($sev|tonumber),"description":$desc,"evidence":$ev}')

    # 追蹤最大嚴重性
    if (( $(echo "$severity > $MAX_SEVERITY" | bc -l 2>/dev/null || echo 0) )); then
      MAX_SEVERITY="$severity"
    fi
  done
  THREATS_JSON+="]"

  jq -Rn 
    --arg timestamp "$TIMESTAMP" \
    --arg level "$LEVEL" \
    --arg max_severity "$MAX_SEVERITY" \
    --argjson threats "$THREATS_JSON" \
    --argjson count "${#THREATS_FOUND[@]}" \
    '{"timestamp":$timestamp,"event":"threat_detected","governance_level":$level,"threat_count":$count,"max_severity":($max_severity|tonumber),"threats":$threats}' \
    >> "$LOG_FILE"

  echo "⚠️ 治理：偵測到 ${#THREATS_FOUND[@]} 個威脅訊號 (最大嚴重性：$MAX_SEVERITY)"
  for threat in "${THREATS_FOUND[@]}"; do
    IFS=$'\t' read -r category severity description _evidence_encoded <<< "$threat"
    echo "  🔴 [$category] $description (嚴重性：$severity)"
  done

  # 在 strict/locked 模式或當 BLOCK_ON_THREAT 為 true 時，以非零狀態碼結束以進行封鎖
  if [[ "$BLOCK" == "true" ]] || [[ "$LEVEL" == "strict" ]] || [[ "$LEVEL" == "locked" ]]; then
    echo "🚫 提示已被治理原則封鎖 (層級：$LEVEL)"
    exit 1
  fi
else
  jq -Rn \
    --arg timestamp "$TIMESTAMP" \
    --arg level "$LEVEL" \
    '{"timestamp":$timestamp,"event":"prompt_scanned","governance_level":$level,"status":"clean"}' \
    >> "$LOG_FILE"
fi

exit 0
