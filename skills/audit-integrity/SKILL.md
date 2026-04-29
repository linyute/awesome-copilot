---
name: 'audit-integrity'
description: '適用於所有 AppSec 代理的共享稽核完整性框架 — 透過反合理化守衛、自我評論迴圈、重試協定、不可妥協的行為、自我反思品質閘門（1-10 評分，≥8 閾值）以及帶有教訓/記憶治理的安全性分析代理自我學習系統，強制執行輸出品質、智識誠實和持續改進。'
compatibility: '跨平台。適用於 AppSec 代理分析的任何語言或框架。'
metadata:
  version: '1.0'
---

# 稽核完整性技能

針對所有 AppSec 代理強制執行輸出品質、智識誠實和持續改進。

## 何時使用

- 每次執行安全性分析、程式碼審查、威脅模型或品質掃描代理時。
- 自動套用為分析後的品質閘門。
- 適用於任何執行 SAST、SCA、威脅建模或程式碼品質分析的代理。

## 元件

此技能提供 7 種可重複使用的能力。除非代理的範圍排除特定元件，否則代理會套用所有 7 種能力。

| 元件 | 參考檔案 | 用途 |
|-----------|---------------|---------|
| 澄清協定 | [clarification-protocol.md](references/clarification-protocol.md) | 在分析範圍模糊時，提出 ≤2 個針對性提問。 |
| 反合理化守衛 | [anti-rationalization-guard.md](references/anti-rationalization-guard.md) | 禁止的合理化清單以及對應的強制性回應。 |
| 自我評論迴圈 | [self-critique-loop.md](references/self-critique-loop.md) | 初始分析後進行強制性的第二次審查。 |
| 重試協定 | [retry-protocol.md](references/retry-protocol.md) | 工具故障處理 — 重試一次後記錄。 |
| 不可妥協的行為 | [non-negotiable-behaviors.md](references/non-negotiable-behaviors.md) | 硬性規則：絕不偽造、務必引用證據、回報缺口。 |
| 自我反思品質閘門 | [self-reflection-quality-gate.md](references/self-reflection-quality-gate.md) | 1–10 評分準則，每類別閾值需 ≥8。 |
| 自我學習系統 | [self-learning-system.md](references/self-learning-system.md) | 教訓/記憶範本與治理規則。 |

## 執行流程

1. **分析前**：若範圍模糊，套用「澄清協定」。
2. **分析中**：在每個決策點套用「反合理化守衛」。
3. **初始檢視後**：執行「自我評論迴圈」（強制性的第二次檢視）。
4. **工具故障時**：套用「重試協定」。
5. **交付前**：執行「自我反思品質閘門」（所有類別評分必須 ≥8）。
6. **交付後**：針對新發現、誤報或方法論缺口建立教訓/記憶（參見「自我學習系統」）。

## 代理特定改編

每個代理都會自訂「自我評論迴圈」檢查清單和「自我反思品質閘門」類別，以符合其領域。參考檔案提供了基礎範本，代理可自行擴充領域特定項目。

### 依代理類型的擴充範例
- **SAST/SCA 代理**：增加污點追蹤完整性和資訊清單覆蓋率檢查。
- **SonarQube 風格代理**：增加評級合理性檢查（A–E 評級與發現的一致性）。
- **威脅建模代理**：增加每個信任邊界的 STRIDE 類別完整性。
- **程式碼審查代理**：增加信任邊界稽核與資料流向追蹤。
