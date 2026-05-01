---
name: batch-files
description: '專家級 Windows 批次檔 (.bat/.cmd) 技巧，用於編寫、偵錯與維護 CMD 腳本。當被要求「建立批次檔」、「編寫 .bat 腳本」、「自動化 Windows 工作」、「CMD 腳本編寫」、「批次自動化」、「排程工作腳本」、「Windows 殼層腳本」，或在工作空間中使用 .bat/.cmd 檔案時使用。涵蓋 cmd.exe 語法、環境變數、控制流程、字串處理、錯誤處理以及與系統工具的整合。'
---

# 批次檔 (Batch Files)

一個用於使用 cmd.exe 建立、編輯、偵錯與維護 Windows 批次檔 (.bat/.cmd) 的全方位技巧。適用於 CLI 工具開發、系統管理自動化、排程工作、檔案操作腳本編寫以及基於 PATH 的可執行腳本。

## 何時使用此技巧

- 建立或編輯 `.bat` 或 `.cmd` 檔案
- 自動化 Windows 工作（檔案操作、部署、備份）
- 建構預計放置於 PATH 上的 `bin/` 資料夾中的 CLI 工具
- 編寫排程工作腳本 (SCHTASKS, 工作排程器)
- 偵錯批次腳本問題（變數擴充、錯誤層級、引號）
- 將批次腳本與外部工具（curl, git, Node.js, Python）整合
- 使用結構化範本建立新的批次專案原型

## 先決條件

- 基於 Windows NT 的作業系統 (Windows 7 或更新版本)
- cmd.exe (內建)
- 選用：PATH 上的 `bin/` 目錄，用於將腳本發布為命令
- 選用：設定 PATHEXT 以包含 `.BAT;.CMD`（Windows 預設值）

## 命令解譯 (Command Interpretation)

cmd.exe 依序透過四個階段處理每一行：

1. **變數替換** — `%VAR%` Token 會被替換為環境變數值。`%0`–`%9` 參照批次引數。`%*` 擴充為所有引數。
2. **引號與轉義** — 插入符號 `^` 轉義特殊字元（`& | < > ^`）。引號防止解譯括號內的特殊字元。在批次檔中，`%%` 會產生字面上的 `%`。
3. **語法剖析** — 行被分割為管道 (`|`)、複合命令 (`&`, `&&`, `||`) 和括號群組 `( )`。
4. **重新導向** — `>` 覆寫, `>>` 附加, `<` 讀取輸入, `2>` 重新導向 stderr, `2>&1` 將 stderr 合併至 stdout, `>NUL` 捨棄輸出。

## 變數 (Variables)

### 環境變數 (Environment Variables)

```bat
set _MY_VAR=Hello World
echo %_MY_VAR%
set _MY_VAR=
```

- 不帶引數的 `set` 會列出所有變數
- `set _PREFIX` 會列出以 `_PREFIX` 開頭的變數
- `=` 周圍沒有空格 — `set name = val` 會將變數 `"name "` 設定為 `" val"`

### 特殊變數 (Special Variables)

| 變數 | 數值 |
|----------|-------|
| `%CD%` | 目前目錄 |
| `%DATE%` | 系統日期（取決於區域設定） |
| `%TIME%` | 系統時間 HH:MM:SS.mm |
| `%RANDOM%` | 虛擬隨機數 0–32767 |
| `%ERRORLEVEL%` | 上個命令的結束代碼 |
| `%USERNAME%` | 目前使用者名稱 |
| `%USERPROFILE%` | 目前使用者設定檔路徑 |
| `%TEMP%` / `%TMP%` | 暫存檔案目錄 |
| `%PATHEXT%` | 可執行副檔名清單 |
| `%COMSPEC%` | cmd.exe 的路徑 |

### 使用 SETLOCAL / ENDLOCAL 限制作用域

```bat
setlocal
set _LOCAL_VAR=scoped value
endlocal
REM _LOCAL_VAR 在此處不再被定義
```

要從作用域區塊回傳數值：

```bat
endlocal & set _RESULT=%_LOCAL_VAR%
```

### 延遲擴充 (Delayed Expansion)

括號區塊內的變數在剖析時擴充。使用延遲擴充進行執行階段評估：

```bat
setlocal EnableDelayedExpansion
set _COUNT=0
for /l %%i in (1,1,5) do (
    set /a _COUNT+=1
    echo !_COUNT!
)
endlocal
```

- `!VAR!` 在執行時擴充（延遲）
- `%VAR%` 在剖析時擴充（立即）

## 控制流程 (Control Flow)

### 條件執行

```bat
if exist "output.txt" echo 找到檔案
if not defined _MY_VAR echo 變數未設定
if "%_STATUS%"=="ready" (echo 開始) else (echo 等待)
if %ERRORLEVEL% neq 0 echo 命令失敗
```

比較運算子：`equ`, `neq`, `lss`, `leq`, `gtr`, `geq`。使用 `/i` 進行不區分大小寫的字串比較。

### 複合命令

```bat
command1 & command2        & REM 兩者皆執行
command1 && command2       & REM 僅在 command1 成功時執行 command2
command1 || command2       & REM 僅在 command1 失敗時執行 command2
```

### FOR 迴圈

```bat
REM 迭代一組數值
for %%i in (alpha beta gamma) do echo %%i

REM 數字範圍：開始, 步進, 結束
for /l %%i in (1,1,10) do echo %%i

REM 目錄中的檔案
for %%f in (*.txt) do echo %%f

REM 遞迴檔案搜尋
for /r %%f in (*.log) do echo %%f

REM 僅限目錄
for /d %%d in (*) do echo %%d

REM 剖析命令輸出
for /f "tokens=1,2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do echo %%b

REM 剖析檔案行
for /f "usebackq tokens=*" %%a in ("data.txt") do echo %%a
```

### GOTO 與標籤 (GOTO and Labels)

```bat
goto :main_logic
:usage
echo 用法: %~nx0 [選項]
exit /b 1

:main_logic
echo 正在執行主要邏輯...
goto :eof
```

`goto :eof` 結束目前的批次或副程式。標籤以 `:` 開頭。

## 命令列引數 (Command-Line Arguments)

| 語法 | 數值 |
|--------|-------|
| `%0` | 被叫用的腳本名稱 |
| `%1`–`%9` | 位置引數 |
| `%*` | 所有引數（不受 SHIFT 影響） |
| `%~1` | 移除周圍引號的引數 1 |
| `%~f1` | 引數 1 的完整路徑 |
| `%~d1` | 引數 1 的磁碟機代號 |
| `%~p1` | 引數 1 的路徑（不含磁碟機） |
| `%~n1` | 引數 1 的檔案名稱（無副檔名） |
| `%~x1` | 引數 1 的副檔名 |
| `%~dp0` | 批次檔本身的磁碟機與路徑 |
| `%~nx0` | 批次檔的檔案名稱與副檔名 |
| `%~z1` | 引數 1 的檔案大小 |
| `%~$PATH:1` | 在搜尋 PATH 中尋找引數 1 |

### 引數剖析模式

```bat
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--help" goto :usage
if /i "%~1"=="--output" (
    set "_OUTPUT_DIR=%~2"
    shift
)
shift
goto :parse_args
:args_done
```

## 字串處理 (String Processing)

### 子字串

```bat
set _STR=Hello World
echo %_STR:~0,5%       & REM "Hello"
echo %_STR:~6%         & REM "World"
echo %_STR:~-5%        & REM "World"
echo %_STR:~0,-6%      & REM "Hello"
```

### 搜尋與替換

```bat
set _STR=Hello World
echo %_STR:World=Earth%       & REM "Hello Earth"
echo %_STR:Hello=%            & REM " World" (移除 "Hello")
```

### 子字串包含測試

```bat
if not "%_STR:World=%"=="%_STR%" echo 包含 "World"
```

## 函式 (Functions)

函式使用標籤、CALL 以及 SETLOCAL/ENDLOCAL：

```bat
@echo off
call :greet "Jane Doe"
echo 結果: %_GREETING%
exit /b 0

:greet
setlocal
set "_MSG=Hello, %~1"
endlocal & set "_GREETING=%_MSG%"
exit /b 0
```

- `call :label args` 叫用一個函式
- `exit /b` 從函式回傳（而非結束腳本）
- 使用 `endlocal & set` 技巧將數值傳出作用域區塊

## 算術 (Arithmetic)

`set /a` 執行 32 位元有符號整數算術：

```bat
set /a _RESULT=10 * 5 + 3
set /a _COUNTER+=1
set /a _REMAINDER=14 %% 3       & REM 在批次檔中為餘數使用 %%
set /a _BITS="255 & 0x0F"       & REM 位元 AND
```

支援的運算子：`+ - * / %% ( )` 以及位元 `& | ^ ~ << >>`。

支援十六進位 (`0xFF`) 和八進位 (`077`) 常值。

## 錯誤處理 (Error Handling)

### 錯誤層級慣例 (Error Level Conventions)

- `0` = 成功
- 非零 = 失敗（通常為 `1`）

```bat
mycommand.exe
if %ERRORLEVEL% neq 0 (
    echo 錯誤: mycommand 失敗，代碼為 %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
```

### 快速失敗模式 (Fail-Fast Pattern)

```bat
command1 || (echo command1 失敗 & exit /b 1)
command2 || (echo command2 失敗 & exit /b 1)
```

### 設定結束代碼

```bat
exit /b 0        & REM 從批次/函式回傳成功
exit /b 1        & REM 回傳失敗
cmd /c "exit /b 42"   & REM 行內設定 ERRORLEVEL 為 42
```

## 常用命令參考 (Essential Commands Reference)

### 檔案操作

| 命令 | 用途 |
|---------|---------|
| `DIR` | 列出目錄內容 |
| `COPY` | 複製檔案 |
| `XCOPY` | 包含子目錄的擴充複製（舊版） |
| `ROBOCOPY` | 具備重試、鏡像、記錄功能的強大複製 |
| `MOVE` | 移動或重新命名檔案 |
| `DEL` | 刪除檔案 |
| `REN` | 重新命名檔案 |
| `MD` / `MKDIR` | 建立目錄 |
| `RD` / `RMDIR` | 移除目錄 |
| `MKLINK` | 建立符號或固定連結 |
| `ATTRIB` | 檢視或設定檔案屬性 |
| `TYPE` | 列印檔案內容 |
| `MORE` | 分頁顯示檔案 |
| `TREE` | 顯示目錄結構 |
| `REPLACE` | 以來源檔案替換目標處檔案 |
| `COMPACT` | 顯示或設定 NTFS 壓縮 |
| `EXPAND` | 從 .cab 檔案提取 |
| `MAKECAB` | 建立 .cab 封存檔 |
| `TAR` | 建立或提取 tar 封存檔 |

### 文字搜尋與處理

| 命令 | 用途 |
|---------|---------|
| `FIND` | 搜尋字面字串 |
| `FINDSTR` | 使用有限的正規表示式進行搜尋 |
| `SORT` | 依字母順序排序行 |
| `CLIP` | 將管道輸入複製到剪貼簿 |
| `FC` | 比較兩個檔案 |
| `COMP` | 二進位檔案比較 |
| `CERTUTIL` | 編碼/解碼 Base64, 計算雜湊 |

### 系統資訊

| 命令 | 用途 |
|---------|---------|
| `SYSTEMINFO` | 完整系統設定 |
| `HOSTNAME` | 顯示電腦名稱 |
| `VER` | Windows 版本 |
| `WHOAMI` | 目前使用者與群組資訊 |
| `TASKLIST` | 列出執行中的處理程序 |
| `TASKKILL` | 終止處理程序 |
| `WMIC` | WMI 查詢（磁碟機、OS、記憶體） |
| `SC` | 服務控制（查詢、啟動、停止） |
| `DRIVERQUERY` | 列出已安裝的驅動程式 |
| `REG` | 登錄編輯器操作（查詢、新增、刪除） |
| `SETX` | 設定永久環境變數 |

### 網路

| 命令 | 用途 |
|---------|---------|
| `PING` | 測試網路連線 |
| `IPCONFIG` | IP 設定 |
| `NSLOOKUP` | DNS 查詢 |
| `NETSTAT` | 網路連線與連接埠 |
| `TRACERT` | 追蹤至主機的路由 |
| `NET USE` | 對應/中斷網路磁碟機 |
| `NET USER` | 管理使用者帳戶 |
| `NETSH` | 網路設定公用程式 |
| `ARP` | ARP 快取管理 |
| `ROUTE` | 路由表管理 |
| `CURL` | HTTP 請求 (Windows 10+) |
| `SSH` | 安全殼層 (Windows 10+) |

### 排程與自動化

| 命令 | 用途 |
|---------|---------|
| `SCHTASKS` | 建立與管理排程工作 |
| `TIMEOUT` | 等待 N 秒 (Vista+) |
| `START` | 非同步啟動程式 |
| `RUNAS` | 以不同使用者身份執行 |
| `SHUTDOWN` | 關機或重新啟動 |
| `FORFILES` | 依日期尋找檔案並執行命令 |

### 殼層公用程式 (Shell Utilities)

| 命令 | 用途 |
|---------|---------|
| `WHERE` | 在 PATH 中定位執行檔 |
| `DOSKEY` | 建立命令巨集 |
| `CHOICE` | 提示單鍵輸入 |
| `MODE` | 設定主控台大小與連接埠 |
| `SUBST` | 將資料夾對應至磁碟機代號 |
| `CHCP` | 取得或設定主控台字碼頁 |
| `COLOR` | 設定主控台顏色 |
| `TITLE` | 設定主控台視窗標題 |
| `ASSOC` / `FTYPE` | 檔案類型關聯 |

## 殼層語法與運算式 (Shell Syntax and Expressions)

### 用於分組的括號

括號將複合命令轉換為單一單元，用於重新導向或條件執行：

```bat
(echo Line 1 & echo Line 2) > output.txt
if exist "data.csv" (
    echo 正在處理...
    call :process "data.csv"
) else (
    echo 找不到資料。
)
```

### 轉義字元 (Escape Characters)

插入符號 `^` 轉義下一個字元：

```bat
echo Total ^& Summary          & REM 輸出: Total & Summary
echo 100%% complete            & REM 輸出: 100% complete（在批次中）
echo Line one^
Line two                       & REM 插入符號轉義換行
```

在管道之後，需要三重插入符號：`echo x ^^^& y | findstr x`

### 萬用字元 (Wildcards)

- `*` 符合任何字元序列
- `?` 符合單一字元（或在無句點區段末尾符合零個字元）

```bat
dir *.txt           & REM 所有 .txt 檔案
ren *.jpeg *.jpg    & REM 整體重新命名
```

### 重新導向摘要 (Redirection Summary)

```bat
command > file.txt          & REM 將 stdout 覆寫至檔案
command >> file.txt         & REM 將 stdout 附加至檔案
command 2> errors.log       & REM 重新導向 stderr
command > all.log 2>&1      & REM 將 stderr 合併至 stdout
command < input.txt         & REM 從檔案讀取 stdin
command > NUL 2>&1          & REM 捨棄所有輸出
```

## 編寫生產級別的批次檔

### 標準腳本結構

```bat
@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM  腳本: example.bat
REM  用途: 描述此腳本的功能
REM ============================================================

call :main %*
exit /b %ERRORLEVEL%

:main
    call :parse_args %*
    if not defined _TARGET (
        echo 錯誤: 必須提供 --target。 1>&2
        call :usage
        exit /b 1
    )
    echo 正在處理: %_TARGET%
    exit /b 0

:parse_args
    if "%~1"=="" exit /b 0
    if /i "%~1"=="--target" set "_TARGET=%~2" & shift
    if /i "%~1"=="--help"   call :usage & exit /b 0
    shift
    goto :parse_args

:usage
    echo 用法: %~nx0 --target ^<路徑^> [--help]
    echo.
    echo 選項:
    echo   --target   要處理的路徑（必要）
    echo   --help     顯示此說明訊息
    exit /b 0
```

### 最佳實作

1. **一律以 `@echo off` 和 `setlocal` 開始** — 防止吵雜的輸出以及變數洩漏給呼叫者。
2. **在處理前驗證輸入** — 儘早檢查必要引數與檔案是否存在。使用 `if not defined` 和 `if not exist`。
3. **為路徑與變數加引號** — 使用 `"%~1"` 和 `"%_MY_PATH%"` 以安全地處理空格與特殊字元。
4. **使用 `exit /b` 代替 `exit`** — 避免關閉父主控台視窗。
5. **回傳有意義的結束代碼** — `exit /b 0` 代表成功，非零代表特定失敗。
6. **使用 `%~dp0` 取得腳本相對路徑** — 確保腳本不論呼叫者的工作目錄為何皆能運作。
7. **優先使用 `ROBOCOPY` 而非 `XCOPY`** — 更可靠，支援重試、鏡像與記錄。
8. **在迴圈或括號區塊內修改變數時，使用 `EnableDelayedExpansion`。**
9. **將錯誤寫入 stderr** — `echo ERROR: message 1>&2` 保持 stdout 乾淨以便進行管道傳輸。
10. **使用 `REM` 進行註解** — `::` 可能在 `FOR` 迴圈主體內造成問題。

### 安全考量

- **切勿在批次檔中儲存認證** — 使用環境變數、認證儲存庫或提示輸入。
- **驗證使用者輸入** — 包含 `&`、`|` 或 `>` 且未加引號的變數可能會注入命令。一律加引號：`"%_USER_INPUT%"`。
- **使用 `SETLOCAL`** — 防止變數值洩漏給父處理程序。
- **清理檔案路徑** — 在傳遞給 `DEL`、`RD` 或 `ROBOCOPY` 之前驗證路徑，以防止意外刪除。
- **避免針對敏感輸入使用 `SET /P`** — 輸入是可見的且會儲存在主控台歷程記錄中。盡可能使用專用的認證工具。

## 偵錯與疑難排解 (Debugging and Troubleshooting)

| 技術 | 方法 |
|-----------|-----|
| 追蹤執行 | 暫時移除 `@echo off` 或使用 `@echo on` |
| 逐步執行 | 在區段之間加入 `PAUSE` |
| 檢查錯誤層級 | 在每個命令後使用 `echo 結束代碼: %ERRORLEVEL%` |
| 檢查變數 | 使用 `set _MY_` 列出所有以 `_MY_` 開頭的變數 |
| 延遲擴充問題 | `( )` 區塊內的變數未更新？啟用 `!VAR!` 語法 |
| FOR 迴圈 `%%` vs `%` | 在批次檔中使用 `%%i`，在命令列中使用 `%i` |
| SET 中的空格 | 使用 `set name=value` 而非 `set name = value` |
| 管道中的插入符號 | 在管道之後，使用 `^^^` 轉義特殊字元 |
| SET /A 中的括號 | 在 `if` 區塊內使用 `^(` 和 `^)` 轉義，或使用引號 |
| 批次檔中餘數的雙百分比 | 在批次檔中使用 `set /a r=14 %% 3` |

## 跨平台與擴充工具 (Cross-Platform and Extended Tools)

當批次指令碼達到極限時，這些工具可擴充 cmd.exe 的功能：

| 工具 | 用途 |
|------|---------|
| **Cygwin** | Windows 上的完整 POSIX 環境（grep, sed, awk, ssh） |
| **MSYS2** | 輕量級 Unix 工具與套件管理員 (pacman) |
| **WSL** | Windows 子系統 Linux 版 — 執行原生 Linux 二進位檔 |
| **GnuWin32** | 作為原生 Windows 執行檔的個別 GNU 公用程式 |
| **PowerShell** | 整合 .NET 的現代 Windows 指令碼編寫 |

在需要以下情況時使用批次檔：快速啟動、簡單的檔案操作、基於 PATH 的 CLI 工具或工作排程器整合。對於複雜的資料處理、REST API 或物件導向指令碼，請考慮使用 PowerShell 或 WSL。

## CMD 鍵盤快速鍵

| 快速鍵 | 動作 |
|----------|--------|
| `Tab` | 自動完成檔案/資料夾名稱 |
| `Up` / `Down` | 瀏覽命令歷程記錄 |
| `F7` | 顯示命令歷程記錄彈出視窗 |
| `F3` | 重複上一個命令 |
| `Esc` | 清除目前行 |
| `Ctrl+C` | 取消執行中的命令 |
| `Alt+F7` | 清除命令歷程記錄 |

## 參考檔案 (Reference Files)

`references/` 資料夾包含詳細文件：

| 檔案 | 內容 |
|------|----------|
| `tools-and-resources.md` | Windows 工具、公用程式、套件管理員、終端機 |
| `batch-files-and-functions.md` | 範例腳本、技術、最佳實作連結 |
| `windows-commands.md` | 全面的 A-Z Windows 命令參考 |
| `cygwin.md` | Cygwin 使用者指南與常見問題集 |
| `msys2.md` | MSYS2 安裝、套件與環境 |
| `windows-subsystem-on-linux.md` | WSL 設定、命令與文件 |

## 資產範本 (Asset Templates)

`assets/` 資料夾包含入門批次檔範本資料，但為文字格式：

| 範本 | 用途 |
|----------|---------|
| `executable.txt` | 包含引數剖析的獨立 CLI 工具 |
| `library.txt` | 包含可透過 CALL 叫用標籤的可重複使用函式庫 |
| `task.txt` | 排程工作 / 自動化腳本 |
