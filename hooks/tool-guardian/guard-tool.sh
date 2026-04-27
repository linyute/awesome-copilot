#!/bin/bash

# Tool Guardian Hook (工具守護 Hook)
# 在 Copilot 程式碼編寫代理程式執行前，阻擋危險的工具操作 (破壞性檔案操作、強制推送、資料庫刪除等)。
#
# 環境變數：
#   GUARD_MODE           - "warn" (僅記錄) 或 "block" (威脅時非零值退出) (預設: block)
#   SKIP_TOOL_GUARD      - "true" 以完全停用 (預設: 未設定)
#   TOOL_GUARD_LOG_DIR   - 守護日誌目錄 (預設: logs/copilot/tool-guardian)
#   TOOL_GUARD_ALLOWLIST - 要跳過的逗號分隔模式 (預設: 未設定)

set -euo pipefail

# ---------------------------------------------------------------------------
# 若已停用則提前退出
# ---------------------------------------------------------------------------
if [[ "${SKIP_TOOL_GUARD:-}" == "true" ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 從 stdin 讀取工具呼叫 (JSON 格式，包含 toolName + toolInput)
# ---------------------------------------------------------------------------
INPUT=$(cat)

MODE="${GUARD_MODE:-block}"
LOG_DIR="${TOOL_GUARD_LOG_DIR:-.github/logs/copilot/tool-guardian}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/guard.log"

# ---------------------------------------------------------------------------
# 提取工具名稱和輸入文字
# ---------------------------------------------------------------------------
TOOL_NAME=""
TOOL_INPUT=""

if command -v jq &>/dev/null; then
  TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.toolName // empty' 2>/dev/null || echo "")
  TOOL_INPUT=$(printf '%s' "$INPUT" | jq -r '.toolInput // empty' 2>/dev/null || echo "")
fi

# 回退：若 jq 不可用或欄位為空，則使用 grep/sed 提取
if [[ -z "$TOOL_NAME" ]]; then
  TOOL_NAME=$(printf '%s' "$INPUT" | grep -oE '"toolName"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"toolName"\s*:\s*"//;s/"//')
fi
if [[ -z "$TOOL_INPUT" ]]; then
  TOOL_INPUT=$(printf '%s' "$INPUT" | grep -oE '"toolInput"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"toolInput"\s*:\s*"//;s/"//')
fi

# 組合以便進行模式比對
COMBINED="${TOOL_NAME} ${TOOL_INPUT}"

# ---------------------------------------------------------------------------
# 解析允許清單
# ---------------------------------------------------------------------------
ALLOWLIST=()
if [[ -n "${TOOL_GUARD_ALLOWLIST:-}" ]]; then
  IFS=',' read -ra ALLOWLIST <<< "$TOOL_GUARD_ALLOWLIST"
fi

is_allowlisted() {
  local text="$1"
  for pattern in "${ALLOWLIST[@]}"; do
    pattern=$(printf '%s' "$pattern" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "$pattern" ]] && continue
    if [[ "$text" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

# 儘早核對允許清單 — 若組合後的文字符合，則跳過所有掃描
if [[ ${#ALLOWLIST[@]} -gt 0 ]] && is_allowlisted "$COMBINED"; then
  printf '{"timestamp":"%s","event":"guard_skipped","reason":"allowlisted","tool":"%s"}\n' \
    "$TIMESTAMP" "$TOOL_NAME" >> "$LOG_FILE"
  exit 0
fi

# ---------------------------------------------------------------------------
# 威脅模式 (6 個類別，約 20 個模式)
#
# 每項條目：「類別:::嚴重性:::正規表示式:::建議」
# 使用 ::: 作為分隔符，以避免與正規表示式的管線字元衝突
# ---------------------------------------------------------------------------
PATTERNS=(
  # 破壞性檔案操作
  "destructive_file_ops:::critical:::rm -rf /:::請在特定路徑使用目標性 'rm'，而非根目錄"
  "destructive_file_ops:::critical:::rm -rf ~:::請在特定路徑使用目標性 'rm'，而非家目錄"
  "destructive_file_ops:::critical:::rm -rf \.:::請在特定檔案使用目標性 'rm'，而非當前目錄"
  "destructive_file_ops:::critical:::rm -rf \.\.:::請勿遞迴刪除父目錄"
  "destructive_file_ops:::critical:::(rm|del|unlink).*\.env:::請使用 'mv' 在刪除前備份 .env 檔案"
  "destructive_file_ops:::critical:::(rm|del|unlink).*\.git[^i]:::請勿刪除 .git 目錄 — 請使用 'git' 指令管理儲存庫狀態"

  # 破壞性 git 操作
  "destructive_git_ops:::critical:::git push --force.*(main|master):::請使用 'git push --force-with-lease' 或推送到功能分支"
  "destructive_git_ops:::critical:::git push -f.*(main|master):::請使用 'git push --force-with-lease' 或推送到功能分支"
  "destructive_git_ops:::high:::git reset --hard:::請使用 'git stash' 來保存變更，或使用 'git reset --soft'"
  "destructive_git_ops:::high:::git clean -fd:::先使用 'git clean -n' (試運行) 來預覽將被刪除的項目"

  # 資料庫破壞
  "database_destruction:::critical:::DROP TABLE:::請使用 'ALTER TABLE' 或建立具有回滾支援的遷移"
  "database_destruction:::critical:::DROP DATABASE:::請先建立備份；考慮撤銷 DROP 權限"
  "database_destruction:::critical:::TRUNCATE:::請使用 'DELETE FROM ... WHERE' 加上條件以進行更安全的資料刪除"
  "database_destruction:::high:::DELETE FROM [a-zA-Z_]+ *;:::增加 WHERE 子句至 'DELETE FROM' 以避免刪除所有資料列"

  # 權限濫用
  "permission_abuse:::high:::chmod 777:::請對目錄使用 'chmod 755' 或對檔案使用 'chmod 644'"
  "permission_abuse:::high:::chmod -R 777:::請使用特定權限 ('chmod -R 755') 並限制範圍"

  # 網路外洩
  "network_exfiltration:::critical:::curl.*\|.*bash:::請先下載指令碼、檢閱內容後再執行"
  "network_exfiltration:::critical:::wget.*\|.*sh:::請先下載指令碼、檢閱內容後再執行"
  "network_exfiltration:::high:::curl.*--data.*@:::在透過 'curl --data @file' 發送資料前，請先檢閱資料內容"

  # 系統危險
  "system_danger:::high:::sudo :::避免使用 'sudo' — 請以所需的最小權限執行指令"
  "system_danger:::high:::npm publish:::先使用 'npm publish --dry-run' 來驗證套件內容"
)

# ---------------------------------------------------------------------------
# 將字串轉義以進行安全的 JSON 嵌入
# ---------------------------------------------------------------------------
json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g'
}

# ---------------------------------------------------------------------------
# 根據威脅模式掃描組合後的文字
# ---------------------------------------------------------------------------
THREATS=()
THREAT_COUNT=0

for entry in "${PATTERNS[@]}"; do
  category="${entry%%:::*}"
  rest="${entry#*:::}"
  severity="${rest%%:::*}"
  rest="${rest#*:::}"
  regex="${rest%%:::*}"
  suggestion="${rest#*:::}"

  if printf '%s\n' "$COMBINED" | grep -qiE "$regex" 2>/dev/null; then
    local_match=$(printf '%s\n' "$COMBINED" | grep -oiE "$regex" 2>/dev/null | head -1)
    THREATS+=("${category}	${severity}	${local_match}	${suggestion}")
    THREAT_COUNT=$((THREAT_COUNT + 1))
  fi
done

# ---------------------------------------------------------------------------
# 輸出與記錄
# ---------------------------------------------------------------------------
if [[ $THREAT_COUNT -gt 0 ]]; then
  echo ""
  echo "🛡️  工具守護：在 '$TOOL_NAME' 呼叫中檢測到 $THREAT_COUNT 個威脅"
  echo ""
  printf "  %-24s %-10s %-40s %s\n" "類別" "嚴重性" "比對" "建議"
  printf "  %-24s %-10s %-40s %s\n" "--------" "--------" "-----" "----------"

  # 建立 JSON 發現陣列
  FINDINGS_JSON="["
  FIRST=true
  for threat in "${THREATS[@]}"; do
    IFS=$'\t' read -r category severity match suggestion <<< "$threat"

    # 截斷比對文字以利顯示
    display_match="$match"
    if [[ ${#match} -gt 38 ]]; then
      display_match="${match:0:35}..."
    fi
    printf "  %-24s %-10s %-40s %s\n" "$category" "$severity" "$display_match" "$suggestion"

    if [[ "$FIRST" != "true" ]]; then
      FINDINGS_JSON+=","
    fi
    FIRST=false
    FINDINGS_JSON+="{\"category\":\"$(json_escape "$category")\",\"severity\":\"$(json_escape "$severity")\",\"match\":\"$(json_escape "$match")\",\"suggestion\":\"$(json_escape "$suggestion")\"}"
  done
  FINDINGS_JSON+="]"

  echo ""

  # 寫入結構化日誌條目
  printf '{"timestamp":"%s","event":"threats_detected","mode":"%s","tool":"%s","threat_count":%d,"threats":%s}\n' \
    "$TIMESTAMP" "$MODE" "$(json_escape "$TOOL_NAME")" "$THREAT_COUNT" "$FINDINGS_JSON" >> "$LOG_FILE"

  if [[ "$MODE" == "block" ]]; then
    echo "🚫 操作已阻擋：請解決上述威脅或調整 TOOL_GUARD_ALLOWLIST。"
    echo "   將 GUARD_MODE=warn 設定為僅記錄而不阻擋。"
    exit 1
  else
    echo "⚠️  威脅已在 warn 模式下記錄。將 GUARD_MODE=block 設定為防止危險操作。"
  fi
else
  # 記錄清潔結果
  printf '{"timestamp":"%s","event":"guard_passed","mode":"%s","tool":"%s"}\n' \
    "$TIMESTAMP" "$MODE" "$(json_escape "$TOOL_NAME")" >> "$LOG_FILE"
fi

exit 0
