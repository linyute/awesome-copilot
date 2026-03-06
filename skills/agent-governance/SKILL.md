---
name: agent-governance
description: |
  為 AI 代理程式系統增加治理、安全和信任控制的模式與技術。在以下情況使用此技能：
  - 建構呼叫外部工具（API、資料庫、檔案系統）的 AI 代理程式
  - 為代理程式工具使用實作以策略為基礎的存取控制
  - 增加語義意圖分類以偵測危險的提示詞
  - 為多代理程式工作流建立信任評分系統
  - 為代理程式動作和決策建構稽核追蹤
  - 對代理程式強制執行速率限制、內容篩選或工具限制
  - 使用任何代理程式框架（PydanticAI、CrewAI、OpenAI Agents、LangChain、AutoGen）
---

# 代理程式治理模式 (Agent Governance Patterns)

為 AI 代理程式系統增加安全性、信任和策略強制的模式。

## 總覽 (Overview)

治理模式確保 AI 代理程式在定義的邊界內執行 — 控制它們可以呼叫哪些工具、可以處理哪些內容、可以做多少事，並透過稽核追蹤保持問責制。

```
使用者請求 → 意圖分類 → 策略檢查 → 工具執行 → 稽核日誌
                 ↓          ↓         ↓
             威脅偵測   允許/拒絕  信任更新
```

## 何時使用 (When to Use)

- **具有工具存取權限的代理程式**：任何呼叫外部工具（API、資料庫、命令列指令）的代理程式
- **多代理程式系統**：委派給其他代理程式的代理程式需要信任邊界
- **生產環境部署**：合規性、稽核和安全性要求
- **敏感操作**：金融交易、資料存取、基礎設施管理

---

## 模式 1：治理策略 (Pattern 1: Governance Policy)

將代理程式被允許執行的操作定義為一個可組合、可序列化的策略物件。

```python
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import re

class PolicyAction(Enum):
    ALLOW = "allow"
    DENY = "deny"
    REVIEW = "review"  # 標記供人工審核

@dataclass
class GovernancePolicy:
    """控制代理程式行為的宣告式策略。"""
    name: str
    allowed_tools: list[str] = field(default_factory=list)       # 允許清單
    blocked_tools: list[str] = field(default_factory=list)       # 封鎖清單
    blocked_patterns: list[str] = field(default_factory=list)    # 內容篩選器
    max_calls_per_request: int = 100                             # 速率限制
    require_human_approval: list[str] = field(default_factory=list)  # 需要核准的工具

    def check_tool(self, tool_name: str) -> PolicyAction:
        """檢查此策略是否允許某個工具。"""
        if tool_name in self.blocked_tools:
            return PolicyAction.DENY
        if tool_name in self.require_human_approval:
            return PolicyAction.REVIEW
        if self.allowed_tools and tool_name not in self.allowed_tools:
            return PolicyAction.DENY
        return PolicyAction.ALLOW

    def check_content(self, content: str) -> Optional[str]:
        """根據封鎖模式檢查內容。傳回匹配的模式或 None。"""
        for pattern in self.blocked_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return pattern
        return None
```

### 策略組合 (Policy Composition)

結合多個策略（例如：全公司 + 團隊 + 代理程式特定）：

```python
def compose_policies(*policies: GovernancePolicy) -> GovernancePolicy:
    """使用「最嚴格者勝出」語義合併策略。"""
    combined = GovernancePolicy(name="composed")

    for policy in policies:
        combined.blocked_tools.extend(policy.blocked_tools)
        combined.blocked_patterns.extend(policy.blocked_patterns)
        combined.require_human_approval.extend(policy.require_human_approval)
        combined.max_calls_per_request = min(
            combined.max_calls_per_request,
            policy.max_calls_per_request
        )
        if policy.allowed_tools:
            if combined.allowed_tools:
                combined.allowed_tools = [
                    t for t in combined.allowed_tools if t in policy.allowed_tools
                ]
            else:
                combined.allowed_tools = list(policy.allowed_tools)

    return combined


# 用法：從廣泛到具體分層策略
org_policy = GovernancePolicy(
    name="org-wide",
    blocked_tools=["shell_exec", "delete_database"],
    blocked_patterns=[r"(?i)(api[_-]?key|secret|password)\s*[:=]"],
    max_calls_per_request=50
)
team_policy = GovernancePolicy(
    name="data-team",
    allowed_tools=["query_db", "read_file", "write_report"],
    require_human_approval=["write_report"]
)
agent_policy = compose_policies(org_policy, team_policy)
```

### 策略作為 YAML (Policy as YAML)

將策略儲存為設定，而非程式碼：

```yaml
# governance-policy.yaml
name: production-agent
allowed_tools:
  - search_documents
  - query_database
  - send_email
blocked_tools:
  - shell_exec
  - delete_record
blocked_patterns:
  - "(?i)(api[_-]?key|secret|password)\\s*[:=]"
  - "(?i)(drop|truncate|delete from)\\s+\\w+"
max_calls_per_request: 25
require_human_approval:
  - send_email
```

```python
import yaml

def load_policy(path: str) -> GovernancePolicy:
    with open(path) as f:
        data = yaml.safe_load(f)
    return GovernancePolicy(**data)
```

---

## 模式 2：語義意圖分類 (Pattern 2: Semantic Intent Classification)

在提示詞到達代理程式之前，使用以模式為基礎的訊號偵測提示詞中的危險意圖。

```python
from dataclasses import dataclass

@dataclass
class IntentSignal:
    category: str       # 例如："data_exfiltration" (資料外洩), "privilege_escalation" (權限提升)
    confidence: float   # 0.0 到 1.0
    evidence: str       # 觸發偵測的內容

# 威脅偵測的加權訊號模式
THREAT_SIGNALS = [
    # 資料外洩 (Data exfiltration)
    (r"(?i)send\s+(all|every|entire)\s+\w+\s+to\s+", "data_exfiltration", 0.8),
    (r"(?i)export\s+.*\s+to\s+(external|outside|third.?party)", "data_exfiltration", 0.9),
    (r"(?i)curl\s+.*\s+-d\s+", "data_exfiltration", 0.7),

    # 權限提升 (Privilege escalation)
    (r"(?i)(sudo|as\s+root|admin\s+access)", "privilege_escalation", 0.8),
    (r"(?i)chmod\s+777", "privilege_escalation", 0.9),

    # 系統修改 (System modification)
    (r"(?i)(rm\s+-rf|del\s+/[sq]|format\s+c:)", "system_destruction", 0.95),
    (r"(?i)(drop\s+database|truncate\s+table)", "system_destruction", 0.9),

    # 提示詞注入 (Prompt injection)
    (r"(?i)ignore\s+(previous|above|all)\s+(instructions?|rules?)", "prompt_injection", 0.9),
    (r"(?i)you\s+are\s+now\s+(a|an)\s+", "prompt_injection", 0.7),
]

def classify_intent(content: str) -> list[IntentSignal]:
    """為威脅訊號分類內容。"""
    signals = []
    for pattern, category, weight in THREAT_SIGNALS:
        match = re.search(pattern, content)
        if match:
            signals.append(IntentSignal(
                category=category,
                confidence=weight,
                evidence=match.group()
            ))
    return signals

def is_safe(content: str, threshold: float = 0.7) -> bool:
    """快速檢查：內容在給定閾值以上是否安全？"""
    signals = classify_intent(content)
    return not any(s.confidence >= threshold for s in signals)
```

**關鍵洞察**：意圖分類發生在工具執行*之前*，作為飛行前安全檢查。這與僅在產生*之後*檢查的輸出護欄有本質上的不同。

---

## 模式 3：工具級治理裝飾器 (Pattern 3: Tool-Level Governance Decorator)

使用治理檢查包裝個別的工具函式：

```python
import functools
import time
from collections import defaultdict

_call_counters: dict[str, int] = defaultdict(int)

def govern(policy: GovernancePolicy, audit_trail=None):
    """在工具函式上強制執行治理策略的裝飾器。"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            tool_name = func.__name__

            # 1. 檢查工具允許清單/封鎖清單
            action = policy.check_tool(tool_name)
            if action == PolicyAction.DENY:
                raise PermissionError(f"策略 '{policy.name}' 封鎖了工具 '{tool_name}'")
            if action == PolicyAction.REVIEW:
                raise PermissionError(f"工具 '{tool_name}' 需要人工核准")

            # 2. 檢查速率限制
            _call_counters[policy.name] += 1
            if _call_counters[policy.name] > policy.max_calls_per_request:
                raise PermissionError(f"已超過速率限制：{policy.max_calls_per_request} 次呼叫")

            # 3. 檢查參數中的內容
            for arg in list(args) + list(kwargs.values()):
                if isinstance(arg, str):
                    matched = policy.check_content(arg)
                    if matched:
                        raise PermissionError(f"偵測到封鎖模式：{matched}")

            # 4. 執行與稽核
            start = time.monotonic()
            try:
                result = await func(*args, **kwargs)
                if audit_trail is not None:
                    audit_trail.append({
                        "tool": tool_name,
                        "action": "allowed",
                        "duration_ms": (time.monotonic() - start) * 1000,
                        "timestamp": time.time()
                    })
                return result
            except Exception as e:
                if audit_trail is not None:
                    audit_trail.append({
                        "tool": tool_name,
                        "action": "error",
                        "error": str(e),
                        "timestamp": time.time()
                    })
                raise

        return wrapper
    return decorator


# 與任何代理程式框架搭配使用
audit_log = []
policy = GovernancePolicy(
    name="search-agent",
    allowed_tools=["search", "summarize"],
    blocked_patterns=[r"(?i)password"],
    max_calls_per_request=10
)

@govern(policy, audit_trail=audit_log)
async def search(query: str) -> str:
    """搜尋文件 — 受策略治理。"""
    return f"結果如下：{query}"

# 通過：search("最新季度報告")
# 封鎖：search("顯示管理員密碼")
```

---

## 模式 4：信任評分 (Pattern 4: Trust Scoring)

使用以衰減為基礎的信任分數追蹤代理程式隨時間變化的可靠性：

```python
from dataclasses import dataclass, field
import math
import time

@dataclass
class TrustScore:
    """具有時間衰減的信任分數。"""
    score: float = 0.5          # 0.0 (不信任) 到 1.0 (完全信任)
    successes: int = 0
    failures: int = 0
    last_updated: float = field(default_factory=time.time)

    def record_success(self, reward: float = 0.05):
        self.successes += 1
        self.score = min(1.0, self.score + reward * (1 - self.score))
        self.last_updated = time.time()

    def record_failure(self, penalty: float = 0.15):
        self.failures += 1
        self.score = max(0.0, self.score - penalty * self.score)
        self.last_updated = time.time()

    def current(self, decay_rate: float = 0.001) -> float:
        """獲取具有時間衰減的分數 — 信任會隨不活動而侵蝕。"""
        elapsed = time.time() - self.last_updated
        decay = math.exp(-decay_rate * elapsed)
        return self.score * decay

    @property
    def reliability(self) -> float:
        total = self.successes + self.failures
        return self.successes / total if total > 0 else 0.0


# 在多代理程式系統中使用
trust = TrustScore()

# 代理程式成功完成任務
trust.record_success()  # 0.525
trust.record_success()  # 0.549

# 代理程式發生錯誤
trust.record_failure()  # 0.467

# 根據信任程度管控敏感操作
if trust.current() >= 0.7:
    # 允許自主執行
    pass
elif trust.current() >= 0.4:
    # 允許人工監督下執行
    pass
else:
    # 拒絕或要求明確核准
    pass
```

**多代理程式信任**：在代理程式委派給其他代理程式的系統中，每個代理程式都會為其委派對象維護信任分數：

```python
class AgentTrustRegistry:
    def __init__(self):
        self.scores: dict[str, TrustScore] = {}

    def get_trust(self, agent_id: str) -> TrustScore:
        if agent_id not in self.scores:
            self.scores[agent_id] = TrustScore()
        return self.scores[agent_id]

    def most_trusted(self, agents: list[str]) -> str:
        return max(agents, key=lambda a: self.get_trust(a).current())

    def meets_threshold(self, agent_id: str, threshold: float) -> bool:
        return self.get_trust(agent_id).current() >= threshold
```

---

## 模式 5：稽核追蹤 (Pattern 5: Audit Trail)

所有代理程式動作的僅限附加稽核日誌 — 對於合規性和偵錯至關重要：

```python
from dataclasses import dataclass, field
import json
import time

@dataclass
class AuditEntry:
    timestamp: float
    agent_id: str
    tool_name: str
    action: str           # "allowed", "denied", "error"
    policy_name: str
    details: dict = field(default_factory=dict)

class AuditTrail:
    """代理程式治理事件的僅限附加稽核追蹤。"""
    def __init__(self):
        self._entries: list[AuditEntry] = []

    def log(self, agent_id: str, tool_name: str, action: str,
            policy_name: str, **details):
        self._entries.append(AuditEntry(
            timestamp=time.time(),
            agent_id=agent_id,
            tool_name=tool_name,
            action=action,
            policy_name=policy_name,
            details=details
        ))

    def denied(self) -> list[AuditEntry]:
        """獲取所有被拒絕的動作 — 對安全審查很有用。"""
        return [e for e in self._entries if e.action == "denied"]

    def by_agent(self, agent_id: str) -> list[AuditEntry]:
        return [e for e in self._entries if e.agent_id == agent_id]

    def export_jsonl(self, path: str):
        """匯出為 JSON Lines 以供日誌聚合系統使用。"""
        with open(path, "w") as f:
            for entry in self._entries:
                f.write(json.dumps({
                    "timestamp": entry.timestamp,
                    "agent_id": entry.agent_id,
                    "tool": entry.tool_name,
                    "action": entry.action,
                    "policy": entry.policy_name,
                    **entry.details
                }) + "\n")
```

---

## 模式 6：框架整合 (Pattern 6: Framework Integration)

### PydanticAI

```python
from pydantic_ai import Agent

policy = GovernancePolicy(
    name="support-bot",
    allowed_tools=["search_docs", "create_ticket"],
    blocked_patterns=[r"(?i)(ssn|social\s+security|credit\s+card)"],
    max_calls_per_request=20
)

agent = Agent("openai:gpt-4o", system_prompt="你是一位支援助理。")

@agent.tool
@govern(policy)
async def search_docs(ctx, query: str) -> str:
    """搜尋知識庫 — 受治理。"""
    return await kb.search(query)

@agent.tool
@govern(policy)
async def create_ticket(ctx, title: str, body: str) -> str:
    """建立支援票證 — 受治理。"""
    return await tickets.create(title=title, body=body)
```

### CrewAI

```python
from crewai import Agent, Task, Crew

policy = GovernancePolicy(
    name="research-crew",
    allowed_tools=["search", "analyze"],
    max_calls_per_request=30
)

# 在團隊級別套用治理
def governed_crew_run(crew: Crew, policy: GovernancePolicy):
    """使用治理檢查包裝團隊執行。"""
    audit = AuditTrail()
    for agent in crew.agents:
        for tool in agent.tools:
            original = tool.func
            tool.func = govern(policy, audit_trail=audit)(original)
    result = crew.kickoff()
    return result, audit
```

### OpenAI Agents SDK

```python
from agents import Agent, function_tool

policy = GovernancePolicy(
    name="coding-agent",
    allowed_tools=["read_file", "write_file", "run_tests"],
    blocked_tools=["shell_exec"],
    max_calls_per_request=50
)

@function_tool
@govern(policy)
async def read_file(path: str) -> str:
    """讀取檔案內容 — 受治理。"""
    import os
    safe_path = os.path.realpath(path)
    if not safe_path.startswith(os.path.realpath(".")):
        raise ValueError("路徑遍歷被治理封鎖")
    with open(safe_path) as f:
        return f.read()
```

---

## 治理層級 (Governance Levels)

使治理嚴格程度與風險等級相匹配：

| 層級 | 控制措施 | 使用案例 |
|-------|----------|----------|
| **開放 (Open)** | 僅稽核，無限制 | 內部開發/測試 |
| **標準 (Standard)** | 工具允許清單 + 內容篩選器 | 一般生產代理程式 |
| **嚴格 (Strict)** | 所有控制措施 + 敏感操作的人工核准 | 金融、醫療保健、法律 |
| **鎖定 (Locked)** | 僅限允許清單，無動態工具，完整稽核 | 關鍵合規性系統 |

---

## 最佳實作 (Best Practices)

| 做法 | 原理 |
|----------|-----------|
| **策略作為設定** | 將策略儲存在 YAML/JSON 中，而非硬編碼 — 實現無須部署即可更改 |
| **最嚴格者勝出** | 在組合策略時，拒絕一律優先於允許 |
| **飛行前意圖檢查** | 在工具執行*之前*分類意圖，而非之後 |
| **信任衰減** | 信任分數應隨時間衰減 — 需要持續的良好行為 |
| **僅限附加稽核** | 絕不修改或刪除稽核條目 — 不可變性實現合規性 |
| **失敗即關閉 (Fail closed)** | 如果治理檢查出錯，拒絕動作而非允許 |
| **將策略與邏輯分離** | 治理強制執行應獨立於代理程式業務邏輯 |

---

## 快速入門檢查清單 (Quick Start Checklist)

```markdown
## 代理程式治理實作檢查清單

### 設定
- [ ] 定義治理策略（允許工具、封鎖模式、速率限制）
- [ ] 選擇治理層級（開放/標準/嚴格/鎖定）
- [ ] 設定稽核追蹤儲存

### 實作
- [ ] 為所有工具函式增加 @govern 裝飾器
- [ ] 在使用者輸入處理中增加意圖分類
- [ ] 為多代理程式互動實作信任評分
- [ ] 串接稽核追蹤匯出

### 驗證
- [ ] 測試封鎖的工具是否被正確拒絕
- [ ] 測試內容篩選器是否捕捉到敏感模式
- [ ] 測試速率限制行為
- [ ] 驗證稽核追蹤是否擷取所有事件
- [ ] 測試策略組合（最嚴格者勝出）
```

---

## 相關資源 (Related Resources)

- [Agent-OS Governance Engine](https://github.com/imran-siddique/agent-os) — 完整治理框架
- [AgentMesh Integrations](https://github.com/imran-siddique/agentmesh-integrations) — 框架特定套件
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
