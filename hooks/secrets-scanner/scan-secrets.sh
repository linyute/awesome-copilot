#!/bin/bash

# 機密掃描器掛鉤 (Secrets Scanner Hook)
# 掃描 Copilot 編碼代理程式工作階段期間修改的檔案，
# 在提交前尋找意外洩漏的機密、認證資訊和敏感資料。
#
# 環境變數：
#   SCAN_MODE          - "warn" (僅記錄) 或 "block" (發現時以非零值結束) (預設值：warn)
#   SCAN_SCOPE         - "diff" (僅限變更的檔案) 或 "staged" (暫存檔案) (預設值：diff)
#   SKIP_SECRETS_SCAN  - "true" 用於完全停用掃描 (預設值：未設定)
#   SECRETS_LOG_DIR    - 掃描記錄的目錄 (預設值：logs/copilot/secrets)
#   SECRETS_ALLOWLIST  - 要忽略的模式之逗號分隔清單 (預設值：未設定)

set -euo pipefail

# ---------------------------------------------------------------------------
# 機密偵測模式 (編輯此清單以新增或移除模式)
#
# 每個項目："模式名稱|嚴重程度|正則表達式"
# 嚴重程度等級：critical (緊急), high (高), medium (中)
# ---------------------------------------------------------------------------
PATTERNS=(
  # 雲端提供者認證資訊
  "AWS_ACCESS_KEY|critical|AKIA[0-9A-Z]{16}"
  "AWS_SECRET_KEY|critical|aws_secret_access_key[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9/+=]{40}"
  "GCP_SERVICE_ACCOUNT|critical|\"type\"[[:space:]]*:[[:space:]]*\"service_account\""
  "GCP_API_KEY|high|AIza[0-9A-Za-z_-]{35}"
  "AZURE_CLIENT_SECRET|critical|azure[_-]?client[_-]?secret[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9_~.-]{34,}"

  # GitHub 權杖 (Token)
  "GITHUB_PAT|critical|ghp_[0-9A-Za-z]{36}"
  "GITHUB_OAUTH|critical|gho_[0-9A-Za-z]{36}"
  "GITHUB_APP_TOKEN|critical|ghs_[0-9A-Za-z]{36}"
  "GITHUB_REFRESH_TOKEN|critical|ghr_[0-9A-Za-z]{36}"
  "GITHUB_FINE_GRAINED_PAT|critical|github_pat_[0-9A-Za-z_]{82}"

  # 私鑰
  "PRIVATE_KEY|critical|-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----"
  "PGP_PRIVATE_BLOCK|critical|-----BEGIN PGP PRIVATE KEY BLOCK-----"

  # 通用機密與權杖
  "GENERIC_SECRET|high|(secret|token|password|passwd|pwd|api[_-]?key|apikey|access[_-]?key|auth[_-]?token|client[_-]?secret)[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9_/+=~.-]{8,}"
  "CONNECTION_STRING|high|(mongodb(\\+srv)?|postgres(ql)?|mysql|redis|amqp|mssql)://[^[:space:]'\"]{10,}"
  "BEARER_TOKEN|medium|[Bb]earer[[:space:]]+[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"

  # 通訊與 SaaS 權杖
  "SLACK_TOKEN|high|xox[baprs]-[0-9]{10,}-[0-9A-Za-z-]+"
  "SLACK_WEBHOOK|high|https://hooks\.slack\.com/services/T[0-9A-Z]{8,}/B[0-9A-Z]{8,}/[0-9A-Za-z]{24}"
  "DISCORD_TOKEN|high|[MN][A-Za-z0-9]{23,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}"
  "TWILIO_API_KEY|high|SK[0-9a-fA-F]{32}"
  "SENDGRID_API_KEY|high|SG\.[0-9A-Za-z_-]{22}\.[0-9A-Za-z_-]{43}"
  "STRIPE_SECRET_KEY|critical|sk_live_[0-9A-Za-z]{24,}"
  "STRIPE_RESTRICTED_KEY|high|rk_live_[0-9A-Za-z]{24,}"

  # npm 權杖
  "NPM_TOKEN|high|npm_[0-9A-Za-z]{36}"

  # JWT (長型、結構化權杖)
  "JWT_TOKEN|medium|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"

  # 帶有連接埠的 IP 位址 (可能是內部服務)
  "INTERNAL_IP_PORT|medium|(^|[^.0-9])(10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}):[0-9]{2,5}([^0-9]|$)"
)

if [[ "${SKIP_SECRETS_SCAN:-}" == "true" ]]; then
  echo "⏭️  機密掃描已跳過 (SKIP_SECRETS_SCAN=true)"
  exit 0
fi

# 確保我們位於 git 儲存庫中
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "⚠️  不在 git 儲存庫中，跳過機密掃描"
  exit 0
fi

MODE="${SCAN_MODE:-warn}"
SCOPE="${SCAN_SCOPE:-diff}"
LOG_DIR="${SECRETS_LOG_DIR:-logs/copilot/secrets}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FINDING_COUNT=0

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/scan.log"

# 根據範圍收集要掃描的檔案
FILES=()
if [[ "$SCOPE" == "staged" ]]; then
  while IFS= read -r f; do
    [[ -n "$f" ]] && FILES+=("$f")
  done < <(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null)
else
  while IFS= read -r f; do
    [[ -n "$f" ]] && FILES+=("$f")
  done < <(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null || git diff --name-only --diff-filter=ACMR 2>/dev/null)
  # 同時包含未追蹤的新檔案 (在工作階段期間建立，尚未在 HEAD 中)
  while IFS= read -r f; do
    [[ -n "$f" ]] && FILES+=("$f")
  done < <(git ls-files --others --exclude-standard 2>/dev/null)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "✨ 沒有修改過的檔案需要掃描"
  printf '{"timestamp":"%s","event":"scan_complete","mode":"%s","scope":"%s","status":"clean","files_scanned":0}\n' \
    "$TIMESTAMP" "$MODE" "$SCOPE" >> "$LOG_FILE"
  exit 0
fi

# 將允許列表解析為陣列
ALLOWLIST=()
if [[ -n "${SECRETS_ALLOWLIST:-}" ]]; then
  IFS=',' read -ra ALLOWLIST <<< "$SECRETS_ALLOWLIST"
fi

is_allowlisted() {
  local match="$1"
  for pattern in "${ALLOWLIST[@]}"; do
    pattern=$(printf '%s' "$pattern" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ -z "$pattern" ]] && continue
    if [[ "$match" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

# 二進位檔案偵測：跳過非文字檔案
is_text_file() {
  local filepath="$1"
  [[ -f "$filepath" ]] && file --brief --mime-type "$filepath" 2>/dev/null | grep -q "^text/" && return 0
  # 備案：檢查常見的文字擴充功能
  case "$filepath" in
    *.md|*.txt|*.json|*.yaml|*.yml|*.xml|*.toml|*.ini|*.cfg|*.conf|\
    *.sh|*.bash|*.zsh|*.ps1|*.bat|*.cmd|\
    *.py|*.rb|*.js|*.ts|*.jsx|*.tsx|*.go|*.rs|*.java|*.kt|*.cs|*.cpp|*.c|*.h|\
    *.php|*.swift|*.scala|*.r|*.R|*.lua|*.pl|*.ex|*.exs|*.hs|*.ml|\
    *.html|*.css|*.scss|*.less|*.svg|\
    *.sql|*.graphql|*.proto|\
    *.env|*.env.*|*.properties|\
    Dockerfile*|Makefile*|Vagrantfile|Gemfile|Rakefile)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

# 轉義字串值以便安全地嵌入 JSON 字串實字中
json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# 以定位字元 (tab) 分隔的紀錄儲存發現
FINDINGS=()

scan_file() {
  local filepath="$1"
  # read_path：實際要掃描的檔案；預設為 filepath (工作樹)
  # 當 SCOPE=staged 時，呼叫者會改為傳遞一個帶有暫存內容的暫存檔案
  local read_path="${2:-$1}"

  # 如果來源不存在則跳過 (例如：已刪除)
  [[ -f "$read_path" ]] || return 0

  # 跳過二進位檔案 (型別偵測使用原始路徑進行 MIME 查詢)
  if ! is_text_file "$filepath"; then
    return 0
  fi

  # 跳過常見的非敏感檔案
  case "$filepath" in
    *.lock|package-lock.json|yarn.lock|pnpm-lock.yaml|Cargo.lock|go.sum|*.sum)
      return 0 ;;
  esac

  for entry in "${PATTERNS[@]}"; do
    IFS='|' read -r pattern_name severity regex <<< "$entry"

    while IFS=: read -r line_num matched_line; do
      # 擷取匹配的片段
      local match
      match=$(printf '%s\n' "$matched_line" | grep -oE "$regex" 2>/dev/null | head -1)
      [[ -z "$match" ]] && continue

      # 從 IP:port 匹配中去除邊界字元
      if [[ "$pattern_name" == "INTERNAL_IP_PORT" ]]; then
        match=$(printf '%s' "$match" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+')
        [[ -z "$match" ]] && continue
      fi

      # 檢查允許列表
      if [[ ${#ALLOWLIST[@]} -gt 0 ]] && is_allowlisted "$match"; then
        continue
      fi

      # 如果這看起來像是佔位符或範例，則跳過
      if printf '%s\n' "$match" | grep -qiE '(example|placeholder|your[_-]|xxx|changeme|TODO|FIXME|replace[_-]?me|dummy|fake|test[_-]?key|sample)'; then
        continue
      fi

      # 脫敏 (redact) 匹配內容以便安全記錄：顯示前 4 個和最後 4 個字元
      local redacted
      if [[ ${#match} -le 12 ]]; then
        redacted="[REDACTED]"
      else
        redacted="${match:0:4}...${match: -4}"
      fi

      FINDINGS+=("$filepath	$line_num	$pattern_name	$severity	$redacted")
      FINDING_COUNT=$((FINDING_COUNT + 1))
    done < <(grep -nE "$regex" "$read_path" 2>/dev/null || true)
  done
}

echo "🔍 正在掃描 ${#FILES[@]} 個修改過的檔案以尋找機密..."

for filepath in "${FILES[@]}"; do
  if [[ "$SCOPE" == "staged" ]]; then
    # 掃描暫存 (索引) 版本，以符合實際將要提交的內容
    _tmpfile=$(mktemp)
    git show :"$filepath" > "$_tmpfile" 2>/dev/null || true
    scan_file "$filepath" "$_tmpfile"
    rm -f "$_tmpfile"
  else
    scan_file "$filepath"
  fi
done

# 記錄結果
if [[ $FINDING_COUNT -gt 0 ]]; then
  echo ""
  echo "⚠️  在修改過的檔案中發現 $FINDING_COUNT 個潛在機密："
  echo ""
  printf "  %-40s %-6s %-28s %s\n" "檔案" "行號" "模式" "嚴重程度"
  printf "  %-40s %-6s %-28s %s\n" "----" "----" "-------" "--------"

  # 建構 JSON 發現陣列並列印表格
  FINDINGS_JSON="["
  FIRST=true
  for finding in "${FINDINGS[@]}"; do
    IFS=$'\t' read -r fpath fline pname psev redacted <<< "$finding"

    printf "  %-40s %-6s %-28s %s\n" "$fpath" "$fline" "$pname" "$psev"

    if [[ "$FIRST" != "true" ]]; then
      FINDINGS_JSON+=","
    fi
    FIRST=false

    # 在不要求 jq 的情況下安全地建構 JSON；轉義路徑與匹配值
    FINDINGS_JSON+="{\"file\":\"$(json_escape "$fpath")\",\"line\":$fline,\"pattern\":\"$pname\",\"severity\":\"$psev\",\"match\":\"$(json_escape "$redacted")\"}"
  done
  FINDINGS_JSON+="]"

  echo ""

  # 寫入結構化記錄項目
  printf '{"timestamp":"%s","event":"secrets_found","mode":"%s","scope":"%s","files_scanned":%d,"finding_count":%d,"findings":%s}\n' \
    "$TIMESTAMP" "$MODE" "$SCOPE" "${#FILES[@]}" "$FINDING_COUNT" "$FINDINGS_JSON" >> "$LOG_FILE"

  if [[ "$MODE" == "block" ]]; then
    echo "🚫 工作階段已阻擋：請在提交前解決上述發現。"
    echo "   將 SCAN_MODE 設定為 warn 以進行記錄但不阻擋，或將模式新增至 SECRETS_ALLOWLIST。"
    exit 1
  else
    echo "💡 請檢視上述發現。將 SCAN_MODE 設定為 block 以防止提交含有機密。"
  fi
else
  echo "✅ 在 ${#FILES[@]} 個掃描的檔案中未偵測到機密"
  printf '{"timestamp":"%s","event":"scan_complete","mode":"%s","scope":"%s","status":"clean","files_scanned":%d}\n' \
    "$TIMESTAMP" "$MODE" "$SCOPE" "${#FILES[@]}" >> "$LOG_FILE"
fi

exit 0
