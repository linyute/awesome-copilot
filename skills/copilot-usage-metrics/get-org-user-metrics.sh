#!/usr/bin/env bash
# 擷取組織各使用者的 Copilot 使用計量資訊
# 用法：get-org-user-metrics.sh <org> [day]
#   org  - GitHub 組織名稱
#   day  - (選用) 指定日期，格式為 YYYY-MM-DD

set -euo pipefail

ORG="${1:?Usage: get-org-user-metrics.sh <org> [day]}"
DAY="${2:-}"

if [ -n "$DAY" ]; then
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/orgs/$ORG/copilot/usage/users/day?day=$DAY"
else
  gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/orgs/$ORG/copilot/usage/users"
fi
