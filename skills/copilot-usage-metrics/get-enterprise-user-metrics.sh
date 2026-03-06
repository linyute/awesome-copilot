#!/usr/bin/env bash
# 擷取企業各使用者的 Copilot 使用計量資訊
# 用法：get-enterprise-user-metrics.sh <enterprise> [day]
#   enterprise - GitHub 企業代號 (slug)
#   day        - (選用) 指定日期，格式為 YYYY-MM-DD

set -euo pipefail

ENTERPRISE="${1:?Usage: get-enterprise-user-metrics.sh <enterprise> [day]}"
DAY="${2:-}"

if [ -n "$DAY" ]; then
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/enterprises/$ENTERPRISE/copilot/usage/users/day?day=$DAY"
else
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/enterprises/$ENTERPRISE/copilot/usage/users"
fi
