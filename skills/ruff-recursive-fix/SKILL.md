---
name: ruff-recursive-fix
description: Run Ruff checks with optional scope and rule overrides, apply safe and unsafe autofixes iteratively, review each change, and resolve remaining findings with targeted edits or user decisions.
---

# Ruff 遞迴修復

## 概覽

使用此技能在受控且反覆的流程中透過 Ruff 強制執行程式碼品質。
它支援：

- 可將範圍限制在特定資料夾。
- 來自 `pyproject.toml` 的預設專案設定。
- 彈性的 Ruff 呼叫方式（`uv`、直接 `ruff`、`python -m ruff` 或同等方式）。
- 選填的每次執行規則覆蓋（`--select`、`--ignore`、`--extend-select`、`--extend-ignore`）。
- 自動執行安全及不安全的自動修復。
- 在每次修復階段後進行 Diff 檢視。
- 遞迴重複直到結果解決或需要做出決定。
- 僅在抑制理由充足時才審慎使用行內 `# noqa`。

## 輸入

執行前請收集以下輸入：

- `target_path`（選填）：要檢查的資料夾或檔案。留空表示整個儲存庫。
- `ruff_runner`（選填）：明確的 Ruff 指令前綴（例如 `uv run`、`ruff`、`python -m ruff`、`pipx run ruff`）。
- `rules_select`（選填）：以逗號分隔的要強制執行的規則代碼。
- `rules_ignore`（選填）：以逗號分隔的要忽略的規則代碼。
- `extend_select`（選填）：額外新增的規則，不替換設定的預設值。
- `extend_ignore`（選填）：額外忽略的規則，不替換設定的預設值。
- `allow_unsafe_fixes`（預設值：true）：是否執行 Ruff 不安全修復。
- `ask_on_ambiguity`（預設值：true）：當存在多個有效選擇時，始終詢問使用者。

## 指令建構

根據輸入建構 Ruff 指令。

### 0. 確定 Ruff 執行器 (Ruff Runner)

在建構指令之前，確定一個可重複使用的 `ruff_cmd` 前綴。

解析順序：

1. 如果提供了 `ruff_runner`，則按原樣使用。
2. 否則，如果 `uv` 可用且 Ruff 透過 `uv` 管理，則使用 `uv run ruff`。
3. 否則，如果 `PATH` 中有 `ruff` 可用，則使用 `ruff`。
4. 否則，如果 Python 可用且在該環境中安裝了 Ruff，則使用 `python -m ruff`。
5. 否則，使用任何可呼叫已安裝 Ruff 的專案特定同等方式（例如 `pipx run ruff`），或者停止並詢問使用者。

在工作流程中，將相同的解析後的 `ruff_cmd` 用於所有 `check` 和 `format` 指令。

基礎指令：

```bash
<ruff_cmd> check
```

格式化指令：

```bash
<ruff_cmd> format
```

包含選填目標：

```bash
<ruff_cmd> format <target_path>
```

新增選填目標：

```bash
<ruff_cmd> check <target_path>
```

根據需要新增選填覆蓋參數：

```bash
--select <codes>
--ignore <codes>
--extend-select <codes>
--extend-ignore <codes>
```

範例：

```bash
# 使用 pyproject.toml 預設值的全專案檢查
ruff check

# 使用預設值檢查一個資料夾
python -m ruff check src/models

# 覆蓋設定以在此次執行中跳過文件 (docs) 和類似 TODO 的規則
uv run ruff check src --extend-ignore D,TD

# 僅檢查資料夾中選定的規則
ruff check src/data --select F,E9,I
```

## 工作流程

### 1. 基準分析

1. 以選定的範圍和選項執行 `<ruff_cmd> check`。
2. 按類型對結果進行分類：
	- 安全的自動修復。
	- 不安全的自動修復。
	- 無法自動修復。
3. 如果沒有剩餘結果，則停止。

### 2. 安全自動修復階段

1. 在相同的範圍/選項下，使用 `--fix` 執行 Ruff。
2. 仔細檢視產生的 Diff，以確保語義正確性和風格一致性。
3. 在相同範圍內執行 `<ruff_cmd> format`。
4. 重新執行 `<ruff_cmd> check` 以重新整理剩餘的結果。

### 3. 不安全自動修復階段

僅在仍有剩餘結果且 `allow_unsafe_fixes=true` 時執行。

1. 在相同的範圍/選項下，使用 `--fix --unsafe-fixes` 執行 Ruff。
2. 仔細檢視產生的 Diff，優先處理行為敏感的編輯。
3. 在相同範圍內執行 `<ruff_cmd> format`。
4. 重新執行 `<ruff_cmd> check`。

### 4. 手動修復階段

對於剩餘的結果：

1. 當有明確、安全的修正方式時，直接在程式碼中修復。
2. 保持編輯最小化且局部化。
3. 在相同範圍內執行 `<ruff_cmd> format`。
4. 重新執行 `<ruff_cmd> check`。

### 5. 歧義處理原則

如果在任何步驟中存在多個有效的解決方案，請務必在繼續之前詢問使用者。
不要在同等的選項之間進行靜默選擇。

### 6. 抑制決策 (`# noqa`)

僅在以下條件全部滿足時才使用抑制：

- 規則與必要的行為、公用 API、框架慣例或可讀性目標相衝突。
- 重構與該規則的價值不成比例。
- 抑制是窄範圍且具體的（單行，盡可能使用明確代碼）。

指南：

- 優先使用 `# noqa: <RULE>` 而非廣泛的 `# noqa`。
- 對於不明顯的抑制，請加入簡短的理由註釋。
- 如果存在兩個或更多有效的結果，請始終詢問使用者偏好哪種選項。

### 7. 遞迴迴圈與停止標準

重複步驟 2 到 6，直到達成以下其中一個結果：

- `<ruff_cmd> check` 回傳乾淨（無結果）。
- 剩餘的結果需要架構/產品決策。
- 剩餘的結果已被刻意抑制並記錄了理由。
- 重複的迴圈沒有進展。

每次迴圈反覆都必須在下一次 `<ruff_cmd> check` 之前包含 `<ruff_cmd> format`。

當偵測到沒有進展時：

1. 總結受阻的規則和受影響的檔案。
2. 展示有效的選項和權衡。
3. 請使用者做出選擇。

## 品質閘門

在宣告完成之前：

- Ruff 對選定的範圍/選項未回傳非預期的結果。
- 所有自動修復的 Diff 都經過正確性檢查。
- 未經明確說明理由，不得新增任何抑制。
- 任何可能影響行為的不安全修復都必須向使用者醒目提示。
- 在每次反覆中都執行了 Ruff 格式化。

## 輸出合約

在執行結束時，報告：

- 使用的範圍和 Ruff 選項。
- 執行的反覆次數。
- 已修復結果的摘要。
- 手動修復清單。
- 帶有理由的抑制清單。
- 剩餘結果（如有）以及需要使用者做出的決策。

## 建議的提示語

- 「在整個儲存庫上以預設設定執行 ruff-recursive-fix。」
- 「僅在 src/models 上執行 ruff-recursive-fix，忽略 DOC 規則。」
- 「在 tests 上執行 ruff-recursive-fix，選擇 F,E9,I 且不進行不安全修復。」
- 「在 src/data 上執行 ruff-recursive-fix，在新增任何 noqa 之前詢問我。」
