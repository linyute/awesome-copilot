---
name: optimize-simplicite-logs
description: 具備從原始 `.txt` 檔案解析 Simplicité 紀錄 (logs)、過濾欄位以減少雜訊，並將結果輸出為結構化 JSON 的能力。
---

# 優化 Simplicite 紀錄 (Optimize Simplicite Logs)

此技能提供從原始 `.txt` 檔案解析 Simplicité 紀錄、過濾欄位以減少雜訊，並將結果輸出為結構化 JSON 的能力。這對於優化 AI 上下文大小 (可節省約 56% 的 token) 以及為疑難排解提供結構化且可預測的資料至關重要。

## 何時使用此技能

當您需要執行以下操作時，請使用此技能：
- 分析使用者提供的 `.txt` 格式 Simplicité 紀錄檔。
- 避免將海量的原始紀錄檔直接讀入您的上下文視窗 (context window)。
- 從冗長的多行紀錄輸出中提取結構化欄位 (如 `timestamp`, `level`, `body`)。

**重要提示：** 您 **不得** 直接使用檔案讀取工具讀取使用者提供的原始 `.txt` 紀錄檔，而 **必須** 先使用其中一個紀錄轉換指令碼 (PowerShell 或 Python) 將檔案解析為 JSON 格式，並視需求僅提取必要的欄位。

## 先決條件 (Prerequisites)

- 可存取 PowerShell 指令碼 (`/scripts/SimpliciteLog2Json.ps1`) 或 Python 指令碼 (`/scripts/simplicite-log2json.py`)。

## 核心功能 (Core Capabilities)

### 1. 上下文優化 (Context Optimization)
藉由提取相關的紀錄欄位 (例如 `body`, `timestamp`, `level`) 並捨棄不相關的結構化紀錄資料 (如 `app`, `endpoint`, `contextPath`)，減少大型 Simplicité 紀錄所消耗的 token。

### 2. 多行支援 (Multi-line Support)
能正確擷取 JSON 結構中 `body` 欄位內的堆疊追蹤 (stack traces) 和多行錯誤，而單純的文字搜尋可能會遺漏這些資訊。

### 3. 標準輸出支援 (Stdout Support)
如果未提供 JSON 檔案的輸出路徑 (例如省略 `--output` 或 `-Output`)，解析後的 JSON 將直接列印到標準輸出 (stdout)，方便您透過管線 (pipe) 傳送到其他工具。

## 輸出摘要 (Output Summary)

處理完成後，工具會將摘要列印到標準錯誤 (stderr) 或主控台：
```
已處理：123 條項目，已跳過：2 條項目
```

## 使用範例 (Usage Examples)

### 範例 1：Python 版本 (推薦)
將紀錄檔轉換為 JSON，僅保留最重要的欄位：
```sh
python /absolute/path/to/skills/optimize-simplicite-logs/scripts/simplicite-log2json.py <輸入檔案.txt> --include timestamp,level,body --output <輸出檔案.json>
```

### 範例 2：PowerShell 版本
```powershell
/python /absolute/path/to/skills/optimize-simplicite-logs/scripts/SimpliciteLog2Json.ps1 -InputPath "<輸入檔案.txt>" -Output "<輸出檔案.json>" -Include "body,timestamp,level"
```

產生 `<輸出檔案.json>` 後，您即可安全地讀取該檔案進行分析。

## 指南 (Guidelines)

1. **務必先轉換**：絕不直接使用標準文字讀取工具讀取來自 Simplicité 的 `.txt` 紀錄檔。務必先使用現有的指令碼將其轉換為 JSON。
2. **過濾欄位**：使用 `--include` (Python) 或 `-Include` (PowerShell) 將欄位限制為診斷問題絕對必要的資訊 (通常為 `timestamp,level,body`)。
3. **可用欄位**：可過濾的欄位包括：`timestamp`, `app`, `level`, `endpoint`, `contextPath`, `event`, `user`, `class`, `function`, `rowId`, `body`。

## 常見模式 (Common Patterns)

### 模式：快速情境疑難排解
```sh
# 1. 在目前目錄執行指令碼，產生縮減後的 JSON 輸出
python /absolute/path/to/skills/optimize-simplicite-logs/scripts/simplicite-log2json.py logs.txt --include timestamp,level,body --output logs_minified.json

# 2. 接著讀取 logs_minified.json 以瞭解上下文內容。
```

## 限制 (Limitations)

- 解析器依賴於符合標準 Simplicité 紀錄輸出的固定正規表示式 (regex) 模式。如果紀錄格式經過大幅自訂，解析可能會失敗或效能下降。
