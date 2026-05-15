{skill_fallback_guide}

您是一位品質工程師，正在繼續執行逐階段的品質播放手冊。階段 1-2 已經完成。

請閱讀下列檔案以獲取內容：
1. quality/PROGRESS.md - 執行 Metadata、階段狀態、漏洞 (BUG) 追蹤器
2. quality/EXPLORATION.md - 階段 1 的發現 (特別是「階段 2 的候選漏洞」章節)
3. quality/REQUIREMENTS.md - 衍生的需求與使用案例
4. quality/CONTRACTS.md - 行為合約
5. SKILL.md - 閱讀階段 3 的章節 (「階段 3：程式碼審查與迴歸測試」)。同時閱讀 references/review_protocols.md。請透過上述的文件後備方案清單解析 SKILL.md 與 references/ 目錄；「請勿」假設任何單一的安裝佈局。

執行階段 3：程式碼審查 + 迴歸測試。
按照 quality/RUN_CODE_REVIEW.md 執行 3 步程式碼審查。對於每個已確認的漏洞：
- 以 ### BUG-NNN 標題格式新增至 quality/BUGS.md
- 撰寫一個迴歸測試 (標記為 xfail)
- 產生 quality/patches/BUG-NNN-regression-test.patch (每個已確認漏洞的「強制性」項目)
- 產生 quality/patches/BUG-NNN-fix.patch (強烈建議)
- 將程式碼審查報告寫入 quality/code_reviews/
- 更新 PROGRESS.md 的漏洞追蹤器

### 強制性矩陣步驟 (MANDATORY GRID STEP) (槓桿 2, v1.5.2) — 僅限帶有模式標記的 REQ

對於 quality/REQUIREMENTS.md 中帶有 `Pattern:` 欄位 (`whitelist`, `parity` 或 `compensation`) 的每個 REQ，您「必須」在為該 REQ 撰寫任何 BUG 條目之前產出一個補償矩陣。

**第 1 步：列舉權威項目集。** 從原始碼中進行機械式擷取 — UAPI 標頭、規格章節、記錄在案的常數。「不要」憑空發明。範例：對於 VIRTIO_F_RING_RESET 家族，請對 `include/uapi/linux/virtio_config.h` 執行 grep 指令搜尋 `VIRTIO_F_*`，並列出該 REQ 涵蓋的位元。

**第 2 步：列舉位置。** 來自 REQ 的各位置獨立使用案例 (UC-N.a, UC-N.b, …)。如果 REQ 具有單一傘狀使用案例但帶有模式標記，則矩陣是針對項目的 1 維矩陣。

**第 3 步：產出矩陣。** 將 `quality/compensation_grid.json` 寫入，每個 REQ 一個條目：

```json
{{
  "schema_version": "1.5.2",
  "reqs": {{
    "REQ-010": {{
      "pattern": "whitelist",
      "items": ["RING_RESET", "ADMIN_VQ", "NOTIF_CONFIG_DATA", "SR_IOV"],
      "sites": ["PCI", "MMIO", "vDPA"],
      "cells": [
        {{"cell_id": "REQ-010/cell-RING_RESET-PCI", "item": "RING_RESET", "site": "PCI", "present": true,  "evidence": "drivers/virtio/virtio_pci_modern.c:XXX-YYY"}},
        {{"cell_id": "REQ-010/cell-RING_RESET-MMIO", "item": "RING_RESET", "site": "MMIO", "present": false, "evidence": "drivers/virtio/virtio_mmio.c: no match for RING_RESET"}}
      ]
    }}
  }}
}}
```

單元格 (Cell) ID 是機械式產生的：`REQ-<N>/cell-<項目>-<位置>`。無空格，在自然的情況下使用大寫的項目/位置識別碼。

**第 4 步：套用 BUG 預設規則。** 對於每個滿足以下條件的單元格：
- 項目在權威來源中已定義，「並且」
- 項目不在任何共享篩選器中，「並且」
- 項目不在該位置的補償路徑中

→ 該單元格「預設」為 BUG。發出一個帶有單元格檔案:列引用、規格基礎和預期與實際行為的 `### BUG-NNN` 條目。包含一個 `- Covers: [REQ-N/cell-<項目>-<位置>]` 行（參見 schemas.md §8 了解欄位合約）。

**第 5 步：降級為 QUESTION 需要一個結構化的 JSON 記錄。** 對於每個降級的單元格，將一筆記錄附加到 `quality/compensation_grid_downgrades.json`：

```json
{{
  "schema_version": "1.5.2",
  "downgrades": [
    {{
      "cell_id": "REQ-010/cell-RING_RESET-MMIO",
      "authority_ref": "include/uapi/linux/virtio_config.h:116",
      "site_citation": "drivers/virtio/virtio_mmio.c:109-131",
      "reason_class": "intentionally-partial",
      "falsifiable_claim": "MMIO 不支援 RING_RESET，因為 MMIO 傳輸早於該特徵位元，且 Documentation/virtio/virtio_mmio.rst:42-55 的核心文件指出該傳輸已凍結在其 v1.0 特徵集中；可透過在任何核心版本下顯示 MMIO 重新設定位元 40 來證偽 (falsifiable)。"
    }}
  ]
}}
```

- `reason_class` 列舉：`out-of-scope | deprecated | platform-gated | handled-upstream | intentionally-partial`。
- `authority_ref`, `site_citation`, `falsifiable_claim` 是必填且非空的。
- `falsifiable_claim` 必須說明一個會使該主張錯誤的可觀察條件。
- 缺少任何必填欄位，或 `reason_class` 不在列舉中，或 `falsifiable_claim` 長度為零 → 單元格在階段 5 閘道時間「還原」為 BUG。沒有重新提示迴圈。

**第 6 步：自我檢查。** 在為此 REQ 完成 BUGS.md 之前，請驗證矩陣中的每個單元格都出現在下列其中之一：
- 某個 BUG 的 `- Covers: [...]` 清單，「或者」
- `quality/compensation_grid_downgrades.json` 中的降級記錄。

任何未出現在兩者之一的單元格都將導致階段 5 基數閘道失敗。此自我檢查在階段 3 是建議性的；封鎖性的閘道在階段 5 執行。

### 工作範例 — RING_RESET 矩陣 (virtio)

REQ-010 模式：whitelist。項目：{RING_RESET, ADMIN_VQ, NOTIF_CONFIG_DATA, SR_IOV}。位置：{PCI, MMIO, vDPA}。矩陣：4 × 3 = 12 個單元格。

程式碼檢查顯示 PCI 實作了所有四個；MMIO 四個皆未實作（凍結在 v1.0 特徵集）；vDPA 實作了 NOTIF_CONFIG_DATA 但未實作其餘三個。

矩陣 (存在=T, 缺失=F)：

|                       | PCI | MMIO | vDPA |
|-----------------------|-----|------|------|
| RING_RESET            |  T  |  F   |  F   |
| ADMIN_VQ              |  T  |  F   |  F   |
| NOTIF_CONFIG_DATA     |  T  |  F   |  T   |
| SR_IOV                |  T  |  F   |  F   |

BUG 預設規則適用於每個 F 單元格 (共 8 個)。可能的彙整方式：

### BUG-001: MMIO 忽略 VIRTIO_F_RING_RESET
- 主要需求：REQ-010
- 涵蓋範圍 (Covers)：[REQ-010/cell-RING_RESET-MMIO]

### BUG-002: vDPA 忽略 VIRTIO_F_RING_RESET
- 主要需求：REQ-010
- 涵蓋範圍：[REQ-010/cell-RING_RESET-vDPA]

### BUG-003: vDPA 遺漏 ADMIN_VQ 勾點
- 主要需求：REQ-010
- 涵蓋範圍：[REQ-010/cell-ADMIN_VQ-vDPA]

### BUG-004: MMIO 忽略 NOTIF_CONFIG_DATA 協商 (常見篩選器缺口)
- 主要需求：REQ-010
- 涵蓋範圍：[REQ-010/cell-NOTIF_CONFIG_DATA-MMIO]

### BUG-005: MMIO + vDPA 皆遺漏 SR_IOV 傳播
- 主要需求：REQ-010
- 涵蓋範圍：[REQ-010/cell-SR_IOV-MMIO, REQ-010/cell-SR_IOV-vDPA]
- 彙整理由：兩個傳輸中的共享修復路徑皆經過同一個特徵位元篩選器；對共享協助程式進行單一補丁即可關閉這兩個單元格。

如果審查者得出結論認為 MMIO ADMIN_VQ 是故意的範圍外，因為 ADMIN_VQ 是一項僅限 PCI 的規格特徵，則降級記錄將會是：

```json
{{
  "cell_id": "REQ-010/cell-ADMIN_VQ-MMIO",
  "authority_ref": "include/uapi/linux/virtio_pci.h:NN",
  "site_citation": "drivers/virtio/virtio_mmio.c: no admin virtqueue implementation",
  "reason_class": "out-of-scope",
  "falsifiable_claim": "ADMIN_VQ 是 MMIO 範圍內的 — 可透過引用任何要求在非 PCI 傳輸上使用 ADMIN_VQ 的 virtio 規格規範文字來證偽。"
}}
```

聯集檢查：8 個 BUG 涵蓋的單元格 + 1 個降級單元格 = 9。矩陣有 12 個單元格；4 個存在的單元格不需要涵蓋。總計：8 個 F 單元格透過 BUG 涵蓋 + 1 個透過降級涵蓋 = 所有 9 個缺失的單元格皆已說明。矩陣 → 乾淨。

### 反覆運算模式增補 (MANDATORY INCREMENTAL WRITE, 階段 8)

在以反覆運算模式 (gap / unfiltered / parity / adversarial) 執行時，請在識別出候選 BUG 虛設常式後立即寫入磁碟，不要等到審查結束。路徑：`quality/code_reviews/<反覆運算>-candidates.md`。每個候選漏洞一個 `### CANDIDATE-NNN` 標題，且至少包含一個 檔案:列 引用。審查者僅在完整分類後才將候選漏洞升級為 BUGS.md 中已確認的 BUG。

### 確認清單 (Lever 2, v1.5.2)

在將階段 3 完成檢查點寫入 PROGRESS.md 之前，請在您的階段 3 摘要中明確確認每一項：

1. 對於每個帶有模式標記的 REQ，我都在 `quality/compensation_grid.json` 中產出了一個補償矩陣。
2. 對於每個矩陣，我都機械式地套用了 BUG 預設規則。
3. 為帶有模式標記的 REQ 發出的每個 BUG 都具有一個包含有效單元格 ID 的 `- Covers: [...]` 欄位。
4. 涵蓋清單中具有 ≥2 個條目的每個 BUG 都有一個非空的 `- Consolidation rationale: ...` 欄位。
5. 對於每個降級的單元格，我都在 `quality/compensation_grid_downgrades.json` 中寫入了一筆包含所有五個必填欄位和有效 `reason_class` 的完整結構化記錄。
6. 對於每個帶有模式標記的 REQ，涵蓋清單與降級單元格的聯集等於矩陣的單元格集合。

在 PROGRESS.md 中標記階段 3（程式碼審查 + 迴歸測試）已完成（使用核取方塊格式 `- [x] Phase 3 - Code Review` — 「請勿」切換為表格）。

重要：請「不要」繼續進入階段 4 (規格稽核)。下一階段將在新鮮的內容視窗中執行規格稽核。
