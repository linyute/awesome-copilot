---
name: polyglot-test-agent
description: '使用多代理程式管線為任何程式語言產生全面的、可執行的單元測試。當被要求產生測試、編寫單元測試、改善測試涵蓋率、增加測試涵蓋率、建立測試檔案或測試程式碼庫時使用。支援 C#、TypeScript、JavaScript、Python、Go、Rust、Java 等。協調研究、規劃與實作階段，以產出符合專案慣例且可編譯、可通過的測試。'
---

# 多語言測試產生技能 (Polyglot Test Generation Skill)

這是一個由 AI 驅動的技能，使用協調的多代理程式管線為任何程式語言產生全面的、可執行的單元測試。

## 何時使用此技能 (When to Use This Skill)

在您需要執行以下操作時使用此技能：
- 為整個專案或特定檔案產生單元測試
- 改善現有程式碼庫的測試涵蓋率
- 建立遵循專案慣例的測試檔案
- 編寫實際可編譯且可通過的測試
- 為新功能或未測試的程式碼增加測試

## 運作原理 (How It Works)

此技能在 **研究 (Research) → 規劃 (Plan) → 實作 (Implement)** 管線中協調多個專門的代理程式：

### 管線總覽 (Pipeline Overview)

```
┌─────────────────────────────────────────────────────────────┐
│              測試產生器 (TEST GENERATOR)                    │
│                協調完整管線並管理狀態                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌────────────┐  ┌───────────┐  ┌───────────────┐
│ 研究員     │  │ 規劃員    │  │ 實作員        │
│(RESEARCHER)│  │ (PLANNER) │  │ (IMPLEMENTER) │
│ 分析       │  │ 建立分階段│  │ 依階段        │
│ 程式碼庫   │→ │ 計畫      │→ │ 編寫測試      │
└────────────┘  └───────────┘  └───────┬───────┘
                                       │
                    ┌─────────┬────────┼───────────┐
                    ▼         ▼        ▼           ▼
              ┌──────────┐ ┌────────┐ ┌───────┐ ┌────────┐
              │ 建置員   │ │ 測試員 │ │ 修復員│ │ Linter │
              │ (BUILDER)│ │(TESTER)│ │(FIXER)│ │(LINTER)│
              │ 編譯     │ │ 執行   │ │ 修復  │ │ 格式化 │
              │ 程式碼   │ │ 測試   │ │ 錯誤  │ │ 程式碼 │
              └──────────┘ └────────┘ └───────┘ └────────┘
```

## 逐步說明 (Step-by-Step Instructions)

### 步驟 1：確定使用者請求 (Step 1: Determine the User Request)

確保您了解使用者的要求以及範圍。
當使用者未對測試風格、涵蓋率目標或慣例表達強烈要求時，請參考 [unit-test-generation.prompt.md](unit-test-generation.prompt.md) 中的指引。該提示詞提供了關於探索慣例、參數化策略、涵蓋率目標（目標為 80%）以及語言特定模式的最佳實作。

### 步驟 2：呼叫測試產生器 (Step 2: Invoke the Test Generator)

首先呼叫 `polyglot-test-generator` 代理程式並提出您的測試產生請求：

```
為 [路徑或要測試的內容描述] 產生單元測試，並遵循 [unit-test-generation.prompt.md](unit-test-generation.prompt.md) 指引
```

測試產生器將自動管理整個管線。

### 步驟 3：研究階段（自動） (Step 3: Research Phase (Automatic))

`polyglot-test-researcher` 代理程式分析您的程式碼庫以了解：
- **語言與框架**：偵測 C#、TypeScript、Python、Go、Rust、Java 等。
- **測試框架**：識別 MSTest、xUnit、Jest、pytest、go test 等。
- **專案結構**：對應原始碼檔案、現有測試以及相依性。
- **建置指令**：探索如何建構與測試專案。

輸出：`.testagent/research.md`

### 步驟 4：規劃階段（自動） (Step 4: Planning Phase (Automatic))

`polyglot-test-planner` 代理程式建立結構化的實作計畫：
- 將檔案分組為邏輯階段（通常為 2-5 個階段）。
- 根據複雜度與相依性排列優先順序。
- 為每個檔案指定測試案例。
- 定義每個階段的成功準則。

輸出：`.testagent/plan.md`

### 步驟 5：實作階段（自動） (Step 5: Implementation Phase (Automatic))

`polyglot-test-implementer` 代理程式循序執行每個階段：

1. **讀取** 原始碼檔案以了解 API。
2. **編寫** 遵循專案模式的測試檔案。
3. 使用 `polyglot-test-builder` 子代理程式進行 **建置** 以驗證編譯。
4. 使用 `polyglot-test-tester` 子代理程式進行 **測試** 以驗證測試通過。
5. 如果發生錯誤，使用 `polyglot-test-fixer` 子代理程式進行 **修復**。
6. 使用 `polyglot-test-linter` 子代理程式進行 **Lint** 以進行程式碼格式化。

每個階段在下一階段開始前完成，確保增量進度。

### 涵蓋率型別 (Coverage Types)
- **正常路徑 (Happy path)**：有效的輸入產生預期的輸出。
- **邊緣情況 (Edge cases)**：空值、邊界、特殊字元。
- **錯誤情況 (Error cases)**：無效輸入、null 處理、例外狀況。

## 狀態管理 (State Management)

所有管線狀態都儲存在 `.testagent/` 資料夾中：

| 檔案 | 目的 |
|------|---------|
| `.testagent/research.md` | 程式碼庫分析結果 |
| `.testagent/plan.md` | 分階段實作計畫 |
| `.testagent/status.md` | 進度追蹤（選用） |

## 範例 (Examples)

### 範例 1：完整專案測試
```
為我位於 C:\src\Calculator 的 Calculator 專案產生單元測試
```

### 範例 2：特定檔案測試
```
為 src/services/UserService.ts 產生單元測試
```

### 範例 3：具目標性的涵蓋率
```
為驗證模組增加測試，重點關注邊緣情況
```

## 代理程式參考 (Agent Reference)

| 代理程式 | 目的 | 工具 |
|-------|---------|-------|
| `polyglot-test-generator` | 協調管線 | runCommands, codebase, editFiles, search, runSubagent |
| `polyglot-test-researcher` | 分析程式碼庫 | runCommands, codebase, editFiles, search, fetch, runSubagent |
| `polyglot-test-planner` | 建立測試計畫 | codebase, editFiles, search, runSubagent |
| `polyglot-test-implementer` | 編寫測試檔案 | runCommands, codebase, editFiles, search, runSubagent |
| `polyglot-test-builder` | 編譯程式碼 | runCommands, codebase, search |
| `polyglot-test-tester` | 執行測試 | runCommands, codebase, search |
| `polyglot-test-fixer` | 修復錯誤 | runCommands, codebase, editFiles, search |
| `polyglot-test-linter` | 格式化程式碼 | runCommands, codebase, search |

## 需求 (Requirements)

- 專案必須已配置建置/測試系統
- 應已安裝（或可安裝）測試框架
- 具備 GitHub Copilot 延伸模組的 VS Code

## 疑難排解 (Troubleshooting)

### 測試無法編譯
`polyglot-test-fixer` 代理程式將嘗試解決編譯錯誤。請檢查 `.testagent/plan.md` 以了解預期的測試結構。

### 測試失敗
檢閱測試輸出並調整測試預期值。某些測試可能需要模擬 (mocking) 相依性。

### 偵測到錯誤的測試框架
在初始請求中指定您偏好的框架：「為...產生 Jest 測試」
