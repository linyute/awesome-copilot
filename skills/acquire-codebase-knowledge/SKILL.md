---
name: acquire-codebase-knowledge
description: '當使用者明確要求對現有程式碼庫進行地圖繪製、編寫文件或進行導覽時，請使用此技能。適用於如「繪製此程式碼庫地圖」、「記錄此架構」、「帶我導覽此存放庫」或「建立程式碼庫文件」等提示。除非使用者要求進行存放庫層級的探索，否則請勿在常規功能實作、錯誤修復或窄範圍的程式碼編輯中觸發。'
license: MIT
compatibility: '跨平台。需要 Python 3.8+ 與 git。請從目標專案根目錄執行 scripts/scan.py。'
metadata:
  version: "1.3"
  enhancements:
    - 多語言資訊清單偵測 (支援 25 種以上語言)
    - CI/CD 管線偵測 (10 種以上平台)
    - 容器與協調 (Orchestration) 偵測
    - 按語言劃分的程式碼指標
    - 安全性與合規性組態偵測
    - 效能測試標記
argument-hint: '選用：要關注的特定區域，例如「僅架構」、「測試與疑慮」'
---

# 獲取程式碼庫知識 (Acquire Codebase Knowledge)

在 `docs/codebase/` 中產生七個填寫完整的文件，涵蓋有效參與專案所需的一切資訊。僅記錄可從檔案或終端機輸出中核實的內容 — 絕不推斷或假設。

## 輸出合約 (必要)

在結束前，以下所有條件必須成立：

1. `docs/codebase/` 中確實存在以下檔案：`STACK.md`, `STRUCTURE.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `TESTING.md`, `CONCERNS.md`。
2. 每一項陳述皆可追溯至原始碼檔案、組態或終端機輸出。
3. 未知事項標記為 `[TODO]`；取決於意圖的決策標記為 `[詢問使用者]`。
4. 每一份文件皆包含一份帶有具體檔案路徑的簡短「證據」列表。
5. 最終回應包含編號的 `[詢問使用者]` 問題，以及意圖與現實的分歧。

## 工作流程

複製並追蹤此檢核表：

```
- [ ] 第 1 階段：執行掃描，閱讀意圖文件
- [ ] 第 2 階段：調查各個文件區域
- [ ] 第 3 階段：填寫 docs/codebase/ 中的所有七份文件
- [ ] 第 4 階段：驗證文件，呈現發現，解決所有 [詢問使用者] 項目
```

## 焦點區域模式

若使用者提供焦點區域 (例如：「僅架構」或「測試與疑慮」)：

1. 務必完整執行第 1 階段。
2. 先完整完成焦點區域文件。
3. 對於尚未分析的非焦點文件，保留必要章節並將未知事項標記為 `[TODO]`。
4. 在最終輸出前，仍需針對所有七份文件執行第 4 階段的驗證迴圈。

### 第 1 階段：掃描與閱讀意圖

1. 從目標專案根目錄執行掃描腳本：
   ```bash
   python3 "$SKILL_ROOT/scripts/scan.py" --output docs/codebase/.codebase-scan.txt
   ```
   其中 `$SKILL_ROOT` 是此技能資料夾的絕對路徑。適用於 Windows、macOS 與 Linux。

   **快速開始：** 若您有內嵌路徑：
   ```bash
   python3 /absolute/path/to/skills/acquire-codebase-knowledge/scripts/scan.py --output docs/codebase/.codebase-scan.txt
   ```

2. 搜尋 `PRD`, `TRD`, `README`, `ROADMAP`, `SPEC`, `DESIGN` 檔案並閱讀。
3. 在閱讀任何原始碼前，先摘要陳述的專案意圖。

### 第 2 階段：調查

使用掃描輸出來回答七個範本中各個範本的問題。載入 [`references/inquiry-checkpoints.md`](references/inquiry-checkpoints.md) 以獲取每個範本的完整問題列表。

若堆疊模糊 (存在多個資訊清單檔案、不熟悉的檔案類型、沒有 `package.json`)，請載入 [`references/stack-detection.md`](references/stack-detection.md)。

### 第 3 階段：填寫範本

將 `assets/templates/` 中的每個範本複製到 `docs/codebase/`。依此順序填寫：

1. [STACK.md](assets/templates/STACK.md) — 語言、執行階段、框架、所有依賴項
2. [STRUCTURE.md](assets/templates/STRUCTURE.md) — 目錄配置、進入點、關鍵檔案
3. [ARCHITECTURE.md](assets/templates/ARCHITECTURE.md) — 分層、模式、資料流
4. [CONVENTIONS.md](assets/templates/CONVENTIONS.md) — 命名、格式化、錯誤處理、匯入
5. [INTEGRATIONS.md](assets/templates/INTEGRATIONS.md) — 外部 API、資料庫、身分驗證、監控
6. [TESTING.md](assets/templates/TESTING.md) — 框架、檔案組織、模擬策略
7. [CONCERNS.md](assets/templates/CONCERNS.md) — 技術債、錯誤 (Bug)、安全性風險、效能瓶頸

對於無法從程式碼中確定的內容，請使用 `[TODO]`。對於正確答案需要團隊意圖的情況，請使用 `[詢問使用者]`。

### 第 4 階段：驗證、修復、核實

在結束前執行此強制性驗證迴圈：

1. 根據 `references/inquiry-checkpoints.md` 驗證每份文件。
2. 對於每個非顯而易見的陳述，確認至少存在一個證據參考。
3. 若缺少任何必要章節或缺乏支持：
  - 修復文件。
  - 重新執行驗證。
4. 重複執行直到所有七份文件皆通過驗證。

接著呈現所有七份文件的摘要，將每個 `[詢問使用者]` 項目列為編號問題，並強調任何來自第 1 階段的「意圖 vs. 現實」分歧。

驗證通過標準：

- 無缺乏支持的陳述。
- 必要章節皆非空白。
- 未知事項使用 `[TODO]` 而非假設。
- 團隊意圖差距已明確標記為 `[詢問使用者]`。

---

## 注意事項 (Gotchas)

**Monorepo：** 根目錄的 `package.json` 可能沒有原始碼 — 請檢查 `workspaces`, `packages/` 或 `apps/` 目錄。每個工作區可能擁有獨立的依賴項與規範。請分別對照每個子套件。

**過時的 README：** README 通常描述預期的架構，而非目前的架構。在將任何 README 陳述視為事實前，請先與實際檔案結構交叉比對。

**TypeScript 路徑別名：** `tsconfig.json` 的 `paths` 組態意味著如 `@/foo` 之類的匯入不會直接對應到檔案系統。在記錄結構前請先將別名對照至實際路徑。

**產生的/編譯的輸出：** 絕不記錄來自 `dist/`, `build/`, `generated/`, `.next/`, `out/` 或 `__pycache__/` 的模式。這些是產出物 — 僅記錄原始碼規範。

**`.env.example` 揭露了必要的組態：** 機密絕不提交。閱讀 `.env.example`, `.env.template` 或 `.env.sample` 以發現必要的環境變數。

**`devDependencies` ≠ 生產環境堆疊：** 僅有 `dependencies` (或同等項，例如 `[tool.poetry.dependencies]`) 會在生產環境執行。請將 Linter、Formatter 與測試框架另外記錄為開發工具。

**測試 TODO ≠ 生產環境技術債：** `test/`, `tests/`, `__tests__/` 或 `spec/` 內部的 TODO 是涵蓋範圍差距，而非生產環境技術債。請在 `CONCERNS.md` 中將其分開。

**高變動檔案 = 脆弱區域：** 在最近的 Git 歷史中出現頻率最高的檔案，其修改率最高，且可能隱藏複雜性。務必在 `CONCERNS.md` 中註明這些檔案。

---

## 反模式

| ❌ 錯誤做法 | ✅ 正確做法 |
|---------|--------------|
| 「使用具有領域/資料層的乾淨架構 (Clean Architecture)。」(當不存在此類目錄時) | 僅陳述目錄結構實際呈現的內容。 |
| 「這是一個 Next.js 專案。」(未檢查 `package.json` 前) | 先檢查 `dependencies`。陳述實際存在的內容。 |
| 從 `dbUrl` 類型的變數名稱猜測資料庫 | 檢查資訊清單中的 `pg`, `mysql2`, `mongoose`, `prisma` 等。 |
| 將 `dist/` 或 `build/` 的命名模式記錄為規範 | 僅記錄原始碼檔案。 |

---

## 增強的掃描輸出章節

`scan.py` 腳本現在除了原始輸出外，還會產生以下章節：

- **程式碼指標 (CODE METRICS)** — 總檔案數、按語言劃分的程式碼行數、最大檔案 (複雜度訊號)
- **CI/CD 管線 (CI/CD PIPELINES)** — 偵測到的 GitHub Actions, GitLab CI, Jenkins, CircleCI 等
- **容器與協調 (CONTAINERS & ORCHESTRATION)** — Docker, Docker Compose, Kubernetes, Vagrant 組態
- **安全性與合規性 (SECURITY & COMPLIANCE)** — Snyk, Dependabot, SECURITY.md, SBOM, 安全性政策
- **效能與測試 (PERFORMANCE & TESTING)** — 基準測試 (Benchmark) 組態、分析標記、負載測試工具

在第 2 階段使用這些章節來引導調查問題，並識別特定工具的模式。

---

## 隨附資產

| 資產 | 何時載入 |
|-------|-------------|
| [`scripts/scan.py`](scripts/scan.py) | 第 1 階段 — 在閱讀任何程式碼前先執行 (需要 Python 3.8+) |

| [`references/inquiry-checkpoints.md`](references/inquiry-checkpoints.md) | 第 2 階段 — 載入各個範本的調查問題 |
| [`references/stack-detection.md`](references/stack-detection.md) | 第 2 階段 — 僅當堆疊模糊時載入 |
| [`assets/templates/STACK.md`](assets/templates/STACK.md) | 第 3 階段 步驟 1 |
| [`assets/templates/STRUCTURE.md`](assets/templates/STRUCTURE.md) | 第 3 階段 步驟 2 |
| [`assets/templates/ARCHITECTURE.md`](assets/templates/ARCHITECTURE.md) | 第 3 階段 步驟 3 |
| [`assets/templates/CONVENTIONS.md`](assets/templates/CONVENTIONS.md) | 第 3 階段 步驟 4 |
| [`assets/templates/INTEGRATIONS.md`](assets/templates/INTEGRATIONS.md) | 第 3 階段 步驟 5 |
| [`assets/templates/TESTING.md`](assets/templates/TESTING.md) | 第 3 階段 步驟 6 |
| [`assets/templates/CONCERNS.md`](assets/templates/CONCERNS.md) | 第 3 階段 步驟 7 |

範本使用模式：

- 預設模式：僅完成每個範本中的「核心章節 (必要)」。
- 延伸模式：僅當存放庫複雜度足夠時新增選用章節。
