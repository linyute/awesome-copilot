# 自動化、MCP 伺服器與電腦使用

從 Illustrator 外部發起的每條途徑最終都會到達同一個地方：在 Illustrator 內部執行的 ExtendScript。本檔案說明如何從作業系統指令碼或其他語言啟動該指令碼、傳遞參數、讀取結果、將其包裝為供 AI 工具使用的 MCP 伺服器，以及在沒有指令碼途徑時進行電腦使用 (computer-use) 工作階段的規則。

## 從外部啟動指令碼

### Windows：COM

Illustrator 會註冊 COM 類別 `Illustrator.Application`（特定版本為 `Illustrator.Application.<major>`）。其指令碼方法（摘自 Illustrator 安裝的型別函式庫）如下：

| 方法 | 參數 |
| --- | --- |
| `DoJavaScriptFile` | `JavaScriptFile`、選用的 `Arguments` (陣列)、選用的 `ExecutionMode` |
| `DoJavaScript` | `JavaScriptCode` (ExtendScript 字串)、選用的 `Arguments`、選用的 `ExecutionMode` |
| `DoScript` | `Action`、`From` (動作組)、選用的 `Dialogs`：播放已錄製的動作 |

`ExecutionMode` 數值：1 為 `aiNeverShowDebugger`、2 為 `aiDebuggerOnError`、3 為 `aiBeforeRunning`。無人看管執行時請使用 1。此呼叫會在指令碼執行完成後回傳，並將指令碼最後一個運算式的值以字串形式傳回。

PowerShell：

```powershell
$ai = New-Object -ComObject Illustrator.Application   # 若 Illustrator 未執行則將其啟動
$result = $ai.DoJavaScriptFile('C:\Users\<user>\Documents\AcmeTools\export-artboards.jsx', @(), 1)
Write-Output $result
```

Python (pywin32)：

```python
import win32com.client

app = win32com.client.Dispatch("Illustrator.Application")
result = app.DoJavaScriptFile(r"C:\Users\<user>\Documents\AcmeTools\export-artboards.jsx", [], 1)
print(result)
```

如果呼叫失敗並顯示 "JavaScript code was missing"，表示 `.jsx` 路徑不存在或無法讀取。

### macOS：AppleScript

```bash
osascript - "/Users/<user>/Documents/AcmeTools/export-artboards.jsx" <<'APPLESCRIPT'
on run argv
  tell application "Adobe Illustrator"
    do javascript "$.evalFile(new File(arguments[0]))" with arguments {item 1 of argv}
  end tell
end run
APPLESCRIPT
```

指令碼路徑作為 `osascript` 的引數傳遞，並透過 `with arguments` 送達 ExtendScript，因此它絕不會成為任何一方指令碼原始碼的一部分：包含引號的路徑不會破壞呼叫或注入程式碼。`do javascript` 也接受檔案參照，但某些版本會拒絕檔案引數；使用來自固定程式碼字串的 `$.evalFile` 來評估檔案可在各版本間正常運作。如果 `tell application` 找不到應用程式，請檢查該安裝版本的應用程式名稱。

### 偵錯與舊版途徑

- **VS Code ExtendScript Debugger**（Adobe 出品，Marketplace ID 為 `Adobe.extendscript-debug`）：針對執行中的 Illustrator 執行並偵錯 `.jsx`。這是 Adobe 用於取代 ExtendScript Toolkit 的工具。
- **ExtendScript Toolkit** (`-run script.jsx`)：32 位元，無法在 macOS 10.15 或更新版本上執行，且需要針對偵錯工具錯誤 #1116 的因應措施。僅在已經依賴它的舊版管線中保留。

## 參數與結果

各啟動工具對 `arguments` 的處理方式有所不同（ExtendScript Toolkit `-run` 和 BridgeTalk 不會傳遞它們），因此僅使用 `arguments` 來傳遞指令碼路徑（如上述的 AppleScript 啟動工具），並將工作的參數透過指令碼讀取的附隨檔案傳遞，結果則寫入另一個檔案。ExtendScript 中的 `Folder.temp` 為作業系統的暫存資料夾，雙方皆可找到。有關外部執行的指令碼端細節（`arguments[]`、`$.getenv`、`$.fileName`、記錄），請參閱 adobe-illustrator-scripting 技能的外部呼叫與引數傳遞章節。

由呼叫端撰寫為 `key=value` 行的參數檔案，在 Windows 上為 `%TEMP%\acme-export-params.txt`，在 macOS 上為 `$TMPDIR/acme-export-params.txt`：

```text
outputFolder=C:\Users\<user>\Documents\AcmeExports
scale=200
```

ExtendScript 沒有內建的 JSON 剖析器，而 `key=value` 檔案不需要剖析器，因此檔案中的內容絕不會以程式碼形式執行。對於巢狀資料，請隨附 json2.js 並使用其 `JSON.parse`，絕不使用 `eval`。

`export-artboards.jsx` (ES3)：

```javascript
(function () {
  var paramsFile = new File(Folder.temp + '/acme-export-params.txt');
  var resultFile = new File(Folder.temp + '/acme-export-result.json');

  // key=value 行；值維持純文字，因此檔案中沒有任何內容會被評估。
  function readParams(file) {
    var params = {};
    file.encoding = 'UTF-8';
    if (!file.open('r')) { return null; }
    while (!file.eof) {
      var line = file.readln().replace(/\r$/, '');
      var at = line.indexOf('=');
      if (at > 0) { params[line.substring(0, at)] = line.substring(at + 1); }
    }
    file.close();
    return params;
  }

  // JSON 字串常值：跳脫反斜線、引號以及所有控制字元，
  // 讓多行錯誤訊息仍可正常剖析。
  function quote(value) {
    return '"' + String(value).replace(/[\\"\u0000-\u001f]/g, function (ch) {
      if (ch === '\\' || ch === '"') { return '\\' + ch; }
      return '\\u' + ('000' + ch.charCodeAt(0).toString(16)).slice(-4);
    }) + '"';
  }

  function writeResult(ok, message) {
    resultFile.encoding = 'UTF-8';
    resultFile.open('w');
    resultFile.write('{"ok":' + (ok ? 'true' : 'false') + ',"message":' + quote(message) + '}');
    resultFile.close();
  }

  var previous = app.userInteractionLevel;
  app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
  try {
    if (!paramsFile.exists) { writeResult(false, '找不到參數檔案。'); return; }
    var params = readParams(paramsFile);
    if (!params) { writeResult(false, '無法讀取參數檔案。'); return; }
    var scale = Number(params.scale);
    if (!params.outputFolder || !isFinite(scale) || scale <= 0) {
      writeResult(false, '參數需要 outputFolder 以及正數 scale。');
      return;
    }
    if (!app.documents.length) { writeResult(false, '未開啟任何文件。'); return; }
    // 匯出工作放這裡 (參閱 adobe-illustrator-scripting 技能)。
    writeResult(true, '已匯出至 ' + params.outputFolder + '，比例為 ' + scale + '%');
  } catch (e) {
    writeResult(false, '第 ' + e.line + ' 行：' + e.message);
  } finally {
    app.userInteractionLevel = previous;
  }
}());
```

批次呼叫端 (Windows)：

```bat
@echo off
setlocal
set "_script=%~dp0export-artboards.jsx"
set "_params=%TEMP%\acme-export-params.txt"
set "_result=%TEMP%\acme-export-result.json"

if exist "%_result%" del /Q "%_result%"
powershell -NoProfile -Command "[System.IO.File]::WriteAllLines($env:_params, @(('outputFolder=' + $env:USERPROFILE + '\Documents\AcmeExports'), 'scale=200'), (New-Object System.Text.UTF8Encoding))"

powershell -NoProfile -Command "$ai = New-Object -ComObject Illustrator.Application; [void]$ai.DoJavaScriptFile($env:_script, @(), 1)"

if not exist "%_result%" (
  echo Illustrator did not write a result file.
  exit /b 1
)
type "%_result%"
findstr /c:"\"ok\":true" "%_result%" >nul || exit /b 1
exit /b 0
```

bash 呼叫端 (macOS)：

```bash
#!/usr/bin/env bash
set -euo pipefail
script="$(cd "$(dirname "$0")" && pwd)/export-artboards.jsx"
params="${TMPDIR%/}/acme-export-params.txt"
result="${TMPDIR%/}/acme-export-result.json"

rm -f "$result"
printf 'outputFolder=%s\nscale=200\n' "$HOME/Documents/AcmeExports" > "$params"

# 路徑是 osascript 的引數，透過 "with arguments" 向下傳遞，因此絕不會成為任何指令碼原始碼的一部分。
osascript - "$script" <<'APPLESCRIPT'
on run argv
  tell application "Adobe Illustrator"
    do javascript "$.evalFile(new File(arguments[0]))" with arguments {item 1 of argv}
  end tell
end run
APPLESCRIPT

[[ -f "$result" ]] || { echo "Illustrator did not write a result file." >&2; exit 1; }
cat "$result"
grep -q '"ok":true' "$result"
```

管線提示：

- Illustrator 一次只執行一個指令碼。請將呼叫排入佇列；絕不要同時啟動兩個。
- 使用 `saveAs` 或匯出呼叫將輸出儲存到輸出資料夾；絕不要直接儲存覆寫原始文件。
- 依使用者進行記錄，例如 `C:\Users\<user>\AppData\Local\AcmeTools\logs\` 或 `~/Library/Logs/AcmeTools/`。
- 如果執行停滯，通常是 Illustrator 中開啟了強制回應對話方塊；請如上所述設定 `userInteractionLevel`。

## 用於 Illustrator 的 MCP 伺服器

Illustrator MCP 伺服器是由 AI 工具啟動（通常透過 stdio）並公開工具的處理程序；每個工具透過 COM 或 AppleScript 在 Illustrator 中執行 ExtendScript 並傳回結果。

```text
AI 工具  <->  MCP 伺服器 (stdio)  <->  COM / AppleScript  <->  Illustrator (ExtendScript)
```

### 工具設計

維持工具集精簡且具體：

| 工具 | 輸入 | 輸出 |
| --- | --- | --- |
| `document_info` | 無 | 開啟的文件、現用文件、工作區域、顏色模式、單位 |
| `list_layers` | 文件索引 | 圖層名稱、可見度、鎖定狀態、項目數量 |
| `run_script` | 來自允許清單資料夾的指令碼名稱、JSON 參數 | 指令碼的 JSON 結果 |
| `export_artboard_png` | 工作區域索引、比例 | PNG 的路徑 (或影像本身)，讓模型可以檢視結果 |
| `save_copy_as` | 輸出資料夾內的輸出路徑、格式 | 已儲存的路徑 |

- 優先使用來自允許清單資料夾的指定指令碼，而非評估任意程式碼的工具。如果存在任意程式碼工具，請保持預設關閉，並在每次呼叫時要求確認。
- 在外觀變更後傳回 PNG 預覽，讓 agent 可以檢查其工作成果。
- 將呼叫序列化；逾時時傳回明確的錯誤，而不是無止境地等待。
- 絕不要覆寫使用者開啟的檔案；請寫入至輸出資料夾，並在覆寫前先詢問。
- 將每個指令碼包裝在 `try`/`catch` 中並傳回 `{ ok, message }`。

在 VS Code (`.vscode/mcp.json`) 中註冊本機伺服器：

```json
{
  "servers": {
    "illustrator": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/tools/illustrator-mcp/server.js"],
      "env": { "ACME_SCRIPTS_DIR": "${workspaceFolder}/tools/illustrator-mcp/scripts" }
    }
  }
}
```

### 審查社群的 Illustrator MCP 伺服器

在安裝之前，請閱讀其原始碼並檢查：

- 它在 Illustrator 內部執行什麼程式碼，以及是否有工具接受任意 ExtendScript
- 它可以讀取和寫入哪些資料夾，以及是否能覆寫檔案
- 它發出的網路呼叫，以及它發送了什麼
- 它支援哪些作業系統和 Illustrator 版本，以及它如何啟動 Illustrator
- 是否鎖定特定版本或 commit，而非追蹤變動中的分支

## Illustrator 中的電腦使用

僅在沒有指令碼途徑時使用電腦使用工具：某些面板與對話方塊、生成式功能，以及指令碼無法執行的視覺檢查。

- 在整個工作階段中將 Illustrator 視窗維持在固定的大小與位置。
- 優先使用選單路徑和鍵盤快速鍵，而非點擊座標。
- 在每個步驟之後擷取螢幕截圖，並在畫面與預期狀態不符時停止。
- 盡可能透過指令碼回讀來確認結果（例如項目數量或圖層名稱）。
- 在文件的複本上操作。
- 絕不要輸入憑證，絕不要點擊登入、授權、購買或帳戶對話方塊，絕不要替使用者接受條款，也絕不上傳或共用檔案。
- 遇到任何非預期的對話方塊時，立即停止並交還給使用者處理。
