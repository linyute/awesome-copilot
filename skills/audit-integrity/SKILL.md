---
name: audit-integrity
description: '在安全稽核中強制落實輸出品質、證據驗證與品質門檻。當你執行 SAST、SCA、威脅建模或安全程式碼檢視時，使用此技能。使用此技能來驗證所有發現事項的程式碼位置與污點追蹤（taint trace）。使用此技能來防止有效的安全發現事項遭到壓抑。使用此技能來在交付前依據品質門檻（評分 ≥ 8/10）評估報告。'
license: 'MIT'
metadata:
  version: '1.1'
---

# 稽核完整性技能

在安全稽核與程式碼檢視中，強制落實輸出品質、智識誠實與持續改進。

## 適用時機

- 執行安全分析、威脅模型、程式碼檢視或品質稽核時。
- 驗證每一項發現事項皆有已驗證的程式碼證據與污點流（taint flow）。
- 防止安全發現事項遭到壓抑或合理化。
- 依據品質門檻（評分 ≥ 8/10）評估草稿報告。
- 完成掃描後記錄經驗教訓與安全記憶（security memories）。

## 元件

此技能在 `references/` 目錄中提供 7 項模組化能力。進入對應的執行階段時，再讀取各檔案：

| 元件                    | 參考檔案                                                                           | 用途                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 澄清協定       | [references/clarification-protocol.md](references/clarification-protocol.md)             | 當範圍不明確時，最多提出 2 個針對性問題     |
| 反合理化防護   | [references/anti-rationalization-guard.md](references/anti-rationalization-guard.md)     | 針對發現事項明令禁止的合理化說法與必要回應  |
| 自我批判循環           | [references/self-critique-loop.md](references/self-critique-loop.md)                     | 強制的第二輪，用以驗證證據與涵蓋範圍             |
| 重試協定               | [references/retry-protocol.md](references/retry-protocol.md)                             | 工具失敗與空搜尋結果的處理：重試一次，然後文件化 |
| 不可談判行為     | [references/non-negotiable-behaviors.md](references/non-negotiable-behaviors.md)         | 強制規則：不得捏造、須引用證據、須報告缺口     |
| 自我反思品質門檻 | [references/self-reflection-quality-gate.md](references/self-reflection-quality-gate.md) | 評分準則（1–10 分制），最低門檻為 8 分         |
| 自我學習系統         | [references/self-learning-system.md](references/self-learning-system.md)                 | 經驗教訓與安全記憶的範本與規則             |

## 執行流程

進入每個階段時，讀取對應的參考檔案：

1. **分析前**：若範圍或政策不明確，讀取 [references/clarification-protocol.md](references/clarification-protocol.md)。最多提出 2 個針對性問題。
2. **分析中**：遵循 [references/non-negotiable-behaviors.md](references/non-negotiable-behaviors.md)。每次分級（triage）決策時，查閱 [references/anti-rationalization-guard.md](references/anti-rationalization-guard.md)。
3. **工具或搜尋失敗時**：遵循 [references/retry-protocol.md](references/retry-protocol.md)。在驗證之前，不得假設程式碼是安全的。
4. **初步分析後**：依照 [references/self-critique-loop.md](references/self-critique-loop.md) 中的檢核清單完成第二輪。驗證污點追蹤（taint trace）與 manifest 涵蓋範圍。
5. **交付前**：使用 [references/self-reflection-quality-gate.md](references/self-reflection-quality-gate.md) 為草稿報告評分。所有類別皆須評 ≥ 8 分。
6. **最終交付**：使用 [references/self-learning-system.md](references/self-learning-system.md) 記錄經驗教訓與記憶。
