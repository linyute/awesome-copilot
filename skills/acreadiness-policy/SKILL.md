---
name: acreadiness-policy
description: '協助使用者挑選、撰寫或套用 AgentRC 政策。政策可透過停用不相關的檢查、覆寫影響程度/等級、設定通過率門檻，或將組織基準與團隊覆寫鏈接，來定義就緒評分。當使用者詢問關於嚴格模式、僅限 AI 的評分、自訂權重、CI 閘控，或想要進行全組織標準化時使用。'
argument-hint: "[show | new <name> | apply <path-or-pkg>] — 例如 /acreadiness-policy show, /acreadiness-policy new strict-frontend"
---

# /acreadiness-policy — AgentRC 政策

當使用者詢問關於 **政策 (policies)**、**嚴格模式 (strict mode)**、**自訂評分 (custom scoring)**、**停用檢查 (disabling checks)**、**組織標準 (org standards)** 或就緒程度的 **CI 閘控 (CI gating)** 時，請使用此技能。

政策是一個小型 JSON 檔案，包含三個選填區塊 — `criteria`、`extras`、`thresholds` — 用於定義 AgentRC 如何對就緒程度進行評分。

## 內建範例 (Built-in examples)

AgentRC 在 `examples/policies/` 中隨附了三個範例政策：

| 政策 | 作用 |
|---|---|
| `strict.json` | 100% 通過率，提高關鍵標準的影響程度 |
| `ai-only.json` | 停用所有存放庫健康狀況檢查，專注於 AI 工具 |
| `repo-health-only.json` | 停用 AI 檢查，專注於傳統品質 |

在撰寫自訂政策之前，建議將這些作為起點。

## 政策結構描述 (Policy schema)

```jsonc
{
  "name": "my-policy",
  "criteria": {
    "disable":  ["env-example", "observability", "dependabot"],
    "override": {
      "readme":      { "impact": "high", "level": 2 },
      "lint-config": { "title": "Linter required" }
    }
  },
  "extras": {
    "disable": ["pre-commit"]
  },
  "thresholds": {
    "passRate": 0.9
  }
}
```

### 影響權重 (Impact weights)

| 影響程度 (Impact) | 權重 |
|---|---|
| critical | 5 |
| high | 4 |
| medium | 3 |
| low | 2 |
| info | 0 |

`分數 = 1 − (扣分 / 最大可能權重)`。等級：**A** ≥ 0.9, **B** ≥ 0.8, **C** ≥ 0.7, **D** ≥ 0.6, **F** < 0.6。

## 子指令 (Sub-commands)

### `show`
列出目前生效的政策（來自 `agentrc.config.json` 的 `policies` 陣列，或無）。

### `new <name>`
以合理的預設值建構 `policies/<name>.json` 的基礎架構。引導使用者完成：
1. **要停用的項目** — 針對其技術棧不相關的支柱或額外項目（例如為靜態網站停用 `observability`）。
2. **要提高的項目** — 將必須具備項目的 `impact` 覆寫為 `high` 或 `critical`（例如 `readme`、`codeowners`）。
3. **通過率門檻** — 典型的組織基準：`0.7`（寬鬆）、`0.85`（標準）、`1.0`（嚴格）。
4. 從 `agentrc.config.json` 引用該政策：
   ```json
   { "policies": ["./policies/<name>.json"] }
   ```

### `apply <path-or-pkg>`
執行 `agentrc readiness --json --policy <source>`，並透過移交給 `assess` 技能 / `ai-readiness-reporter` 代理程式來重新呈現報告。支援鏈接：
```bash
npx -y github:microsoft/agentrc readiness --json --policy ./org-baseline.json,./team-frontend.json
```

## CI 閘控 (CI gating)

將政策與 `--fail-level` 結合，以在 CI 中強制執行最低成熟度等級：

```yaml
- run: npx -y github:microsoft/agentrc readiness --policy ./policies/strict.json --fail-level 3
```

## 進階 (Advanced)

JSON 政策可以停用、覆寫及設定門檻 — 但 **不能新增偵測標準**。如需新的偵測邏輯，請引導使用者參考 AgentRC 的 TypeScript 外掛系統 (`docs/dev/plugins.md`)。

## 作業規則 (Operating rules)

- **絕不默默停用某個支柱。** 如果使用者想要停用 `observability`，請確認並解釋其權衡取捨。
- **優先覆寫 `impact` 而非停用。** 停用會完全隱藏差距；覆寫則能讓它仍出現在報告中。
- **建議保持額外項目為啟用狀態。** 它們無須成本 — 且不會影響評分。
- **建議採用分層方式** — 大多數組織想要一個基準政策 + 使用 `--policy a.json,b.json` 鏈接的各團隊覆寫。
