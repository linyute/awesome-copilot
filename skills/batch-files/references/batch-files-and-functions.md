# Batch Files、腳本與函式

## 公用程式腳本 (Utility Scripts)

**執行腳本 (Run a Script)** — 使用 .CMD 副檔名（優於 .BAT）。在記事本中編輯，從命令提示字元執行或按兩下。在批次檔之間使用 `CALL`。使用 `%CmdCmdLine%` 偵測啟動模式。從 CMD 執行 PowerShell：`powershell.exe -command "& {script}"`。執行 VBScript：`cscript //nologo script.vbs`。

**橫幅 (Banner)** — 使用 SET 命令以大型 ASCII 藝術字母顯示文字。為每個字母（a-z, 0-9, 空格, 連字號, 句號）建立 7 行字元變數指派。Echo 每一行以組成橫幅輸出。

**權限提升/UAC (Elevate/UAC)** — 以提升的權限執行。方法：(1) 使用「以管理員身份執行」核取方塊的捷徑，(2) 從命令列進行 VBScript/PowerShell 提升，(3) 使用 `FSUTIL` 或 `CACLS` 測試提升。不使用提升權限執行：`SET __COMPAT_LAYER=RunAsInvoker`。提升權限後修正目前目錄：`pushd "%~dp0"`。

## 日期與時間

**日期運算 (DateMath)** — 使用儒略日 (Julian Day Number) 計算從任何日期加/減天數。正確處理 Y2K 問題。支援日期減法（天數差）和日期+天數算術。使用 `SETLOCAL`/`ENDLOCAL` 搭配變數回傳技術。

**取得日期 (GetDate)** — 取得與區域設定無關的目前日期。方法：(1) PowerShell `get-date -format`，(2) Robocopy 時間戳記剖析（最常見），(3) `date /t` 剖析，(4) DOFF.exe，(5) VBScript。Robocopy 方法會建立一個暫存資料夾，並從 `ROBOCOPY /njh /njs` 剖析時間戳記。

**取得時間 (GetTime)** — 將目前時間回傳至變數中。藉由動態偵測分隔字元來處理任何區域時間分隔符號。確保小時有前置零以保持格式一致。

**取得 GMT (GetGMT)** — 使用 `WMIC Win32_LocalTime` 與 `Win32_UTCTime` 計算格林威治標準時間。注意：WMIC 在 Win10 21H1 中已棄用。PowerShell 替代方案：`(Get-Date).ToUniversalTime()`。

**時間差 (TimeDiff)** — 計算兩個時間值之間的差異。處理午夜跨日問題。回傳 HH:MM:ss.hs 格式。將時間轉換為百分之一秒的時間碼以進行算術運算。

**計時器 (Timer)** — 使用暫存戳記檔案以開始/停止/單圈 (Start/Stop/Lap) 模式測量經過的時間。計算時:分:秒.百分之一秒。處理區域時間設定。

## 字串與檔案處理

**去引號 (DeQuote)** — 移除字串中的引號。最簡單的方法：`%~1` 參數擴充。單行：`Set "var=%var:"=%"`。函式方法：使用 `FOR /F` 搭配 `%%~A`。可偵測成對與不成對的引號。

**空目錄 (Empty)** — 檢查目錄是否為空：`FOR /F %%A in ('dir /b /a "%folder%"') do goto NotEmpty`。檔案檢查替代方案：`dir /A:-D /B`。不包含子目錄遞迴。

**產生字元 (GenChr)** — 使用 `MAKECAB` 搭配 `reserveperfoldersize` 技巧產生任何 ASCII/Unicode 字元 (0-255) 作為 .chr 檔案。使用 `CHCP` 處理字碼頁切換。

**戳記 (StampMe)** — 使用 Robocopy 時間戳記剖析為檔案重新命名並加上日期/時間戳記。輸出格式：`filename-YYYY-MM-DD@HH-MM-SS.ext`。支援拖放（將檔案名稱傳遞為 %1）。

**字串長度 (StrLen)** — 使用 `FOR` 迴圈測試位置 4096, 2048, 1024...1 的二進位搜尋來計算字串長度。效能為 O(log n)。透過變數或 echo 回傳長度。

**轉換小寫 (ToLower)** — 將字串轉換為大寫/小寫。方法 1：`CALL SET` 進行逐字替換（處理德語變音符號/國際字元）。方法 2：較簡單的 `FOR` 迴圈搭配不區分大小寫的 `SET` 替換。

## 檔案系統

**刪除舊檔案 (DelOlder)** — 刪除早於 n 天的檔案。方法：(1) `ForFiles /d -7`，(2) `Robocopy /move /minage:7`，(3) DateMath.cmd 搭配儒略日比較，(4) PowerShell `.AddDays(-7)`。

**是否為目錄 (IsDirectory)** — 使用 `%~a1` 屬性擴充檢查路徑是檔案還是目錄。檢查第一個字元是否為 `d`：`Set "_attr=%~a1" & If "%_attr:~0,1%"=="d" (echo Directory)`。若找不到則引發 ERRORLEVEL 1。

**在哪裡 (Whereis)** — 顯示任何執行檔的完整路徑。先測試內部命令，然後搜尋 PATH+PATHEXT。處理含空格的加引號路徑。透過變數或 echo 回傳結果。

**超長路徑 (xlong)** — 列出超過 MAX_PATH (260 字元) 的檔案。使用 `DIR /b /s` 搭配位置 256 的子字串檢查：`If not "!name:~256,1!"=="" echo Extra long name: "%%a"`。PowerShell 單行替代方案：`cmd /c dir /s /b | where-object{$_.length -gt 256}`。

## 系統與設定 (System and Configuration)

**ANSI 顏色 (ANSI Colours)** — Windows 1909+ 預設可用。前景：`Esc[30m` (黑色) 到 `Esc[97m` (白色)。背景：`Esc[40m` 到 `Esc[107m`。格式化：`Esc[1m` (粗體), `Esc[4m` (底線), `Esc[7m` (反白)。重設：`Esc[0m`。將 ESC 儲存至變數：`for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"`。Win10 支援 24 位元 RGB。在舊版 Win10 透過登錄編輯器啟用：`[HKCU\Console] VirtualTerminalLevel=dword:1`。

**Autoexec 與 AutoRun** — Autoexec.bat：舊版 MS-DOS；在 Windows 下，開機時僅剖析 `C:\autoexec.bat` 中的 SET 陳述式。AutoRun 命令：設定 `HKCU\Software\Microsoft\Command Processor\AutoRun` 或對應的 `HKLM` 以在開啟 CMD 時執行命令（對於 DOSKEY 巨集很有用）。啟動位置：`%appdata%\Microsoft\Windows\Start Menu\Programs\Startup\`、`HKCU\...\Run`、`HKLM\...\Run`。機器啟動：使用工作排程器搭配「當我的電腦啟動時」。停用磁碟機上的 AutoRun：`NoDriveTypeAutoRun` 登錄機碼；使用 `iniFileMapping` 方法完全停用。

**CMD 殼層 (CMD Shell)** — 使用 Ctrl+S 暫停，Ctrl+C 取消。預設啟用 Tab 自動完成。命令歷程記錄：F7 (清單), F8 (搜尋), F9 (依編號)。引號處理：CMD 在特定條件下會去除前置/後置引號；使用雙引號 `""` 以保留。最大命令列：8191 字元。最大路徑：260 字元。允許 UNC 路徑：`[HKLM\...\Command Processor] DisableUNCCheck=dword:1`。.CMD 與 .BAT：.CMD 在每個命令後重設 ERRORLEVEL；.BAT 僅在發生錯誤時重設。`%COMSPEC%` 顯示正在執行的殼層。

**內部命令 (Internal Commands)** — 內建於 CMD.exe 的命令（不需要外部 .exe）：ASSOC, BREAK, CALL, CD, CLS, COLOR, COPY, DATE, DEL, DIR, DPATH, ECHO, ENDLOCAL, ERASE, EXIT, FOR, FTYPE, GOTO, IF, KEYS, MD, MKLINK, MOVE, PATH, PAUSE, POPD, PROMPT, PUSHD, REM, REN, RD, SET, SETLOCAL, SHIFT, START, TIME, TITLE, TYPE, VER, VERIFY, VOL。外部命令儲存在 `C:\WINDOWS\System32`。參數可以傳遞給內部命令；在命令列可以省略參數前的空格，但在腳本中應包含它。

**應用程式相容性 (App Compatibility)** — 透過登錄編輯器設定，位於 `HKCU\Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers`（個別使用者）或 `HKLM`（所有使用者）。語法：`~ [PrivilegeLevel] [Settings] [CompatibilityMode]`。權限：`RUNASADMIN`。設定：`256COLOR`, `16BITCOLOR`, `640X480`, `HIGHDPIAWARE`, `DPIUNAWARE`, `GDIDPISCALING DPIUNAWARE`, `DISABLEDXMAXIMIZEDWINDOWEDMODE`。模式：`WIN95`, `WIN98`, `WINXPSP2`, `WINXPSP3`, `VISTARTM`, `VISTASP1`, `VISTASP2`, `WIN7RTM`, `WIN8RTM`。範例：`REG ADD "HKCU\...\AppCompatFlags\Layers" /V "%ProgramFiles%\app\app.exe" /T REG_SZ /D "~ RUNASADMIN WINXPSP2" /F`。

**Errorlevel 與結束代碼 (Errorlevel and Exit Codes)** — 大多數命令成功時回傳 0。最大範圍：±2147483647。偵測方法：(1) `IF ERRORLEVEL n`（舊版，表示 >= n），(2) `IF %ERRORLEVEL% EQU 0`（偏好）。在迴圈中，使用 `&&`/`||` 條件運算子或啟用 DelayedExpansion 以使用 `!ERRORLEVEL!`。不影響 ERRORLEVEL 的命令：BREAK, ECHO, ENDLOCAL, FOR, IF, PAUSE, REM, RD, TITLE。強制 ERRORLEVEL 為 1：`(CALL)`。重設為 0：`(call )`。切勿 `SET ERRORLEVEL=...`（會建立遮蔽虛擬變數的使用者變數）。.CMD 腳本在每個內部命令後重設 ERRORLEVEL；.BAT 腳本僅在發生錯誤時重設。

**錯誤處理 (Error Handling)** — 使用條件運算子根據成功/失敗進行分支：`SomeCommand && (echo success) || (echo failed)`。陷阱：如果成功分支中的最後一個命令出錯，則觸發失敗分支；以 `(call )` 結束成功區塊。對於特定錯誤：`IF %ERRORLEVEL% NEQ 0 (Echo Error &Exit /b 1)`。DEL 即使失敗也會回傳 0；Robocopy 在成功時回傳非零值。對於排程工作，以錯誤代碼結束會將工作記錄為失敗。

**顯示 DPI (Display DPI)** — DPI = √(W² + H²) / 螢幕尺寸。Win10 設定：設定 > 顯示 > 比例與版面配置 (100-500%)。終端伺服器上透過登錄編輯器設定個別使用者 DPI。不要將 DPI 設定在 96 以下（字型會破裂）。Citrix：僅透過 96/120/144 DPI 的登錄機碼設定個別使用者 DPI。

**OOBE** — 在沒有網際網路/Microsoft 帳戶的情況下設定 Windows 11。Win11 25H2：在設定期間從 Shift+F10 CMD 提示字元執行 `start ms-cxh:localonly`。早期 Win11：`OOBE\BYPASSNRO`（重新啟動並提供「我沒有網際網路」選項）。手動方法：透過 regedit 加入 `HKLM\...\OOBE BypassNRO=dword:1`。自訂使用者資料夾名稱 (25H2)：設定期間按 Shift+F10，執行 `cd oobe`，執行 `SetDefaultUserFolder.cmd`，輸入名稱（最多 16 個字元）。

**修復環境 (Recovery Environment)** — WinRE/安全模式/WinPE。安全模式：按住 Shift + 電源 > 重新啟動，然後疑難排解 > 啟動設定 > F4（安全）或 F5（安全+網路）。WinRE：重複電源循環（按住電源 10 秒，3 次）。WinPE：從 USB 啟動，自動執行 wpeinit。WinPE 磁碟機偵測腳本：在磁碟機代號 A-Z 中迴圈檢查已知檔案是否存在。從修復環境建立管理員帳戶：重新命名 utilman.exe，將 cmd.exe 複製覆蓋它，重新啟動，在登入時點選「輕鬆存取」以取得 CMD，`NET user demo-user password1 /add` 然後 `NET localgroup administrators demo-user /add`。

**64 位元偵測 (64-Bit Detection)** — 偵測 64 位元作業系統：`IF %PROCESSOR_ARCHITECTURE%==x86 (IF NOT DEFINED PROCESSOR_ARCHITEW6432 Set _os=32)`。在 64 位元偵測 32 位元處理程序：檢查是否定義了 `PROCESSOR_ARCHITEW6432`。系統資料夾：32 位元工作階段將 System32 視為 32 位元，將 SysNative 視為 64 位元；64 位元工作階段將 System32 視為 64 位元，將 SysWOW64 視為 32 位元。以 64 位元重新啟動：`%SystemRoot%\Sysnative\cmd.exe /C "%~f0" %*`。執行 32 位元：`%SystemRoot%\SysWoW64\cmd.exe`。環境：`%ProgramFiles%` = 64 位元程式，`%ProgramFiles(x86)%` = 32 位元程式。

## 網路與安全性

**慢速網路瀏覽 (Slow Network Browsing)** — Desktop.ini 剖析會減慢資料夾列出速度；在檔案伺服器上使用 `NET FILE | Find "desktop.ini"` 檢查。修正：刪除非必要的 desktop.ini 檔案或移除 READ_ONLY 權限。損毀的設定檔權限：從另一個管理員帳戶重新命名 `C:\Users\<profile>\AppData\Local\Microsoft\Windows`。桌面/開始功能表上的網路捷徑在資源不可用時會導致重新整理緩慢；改用 `explorer /e, \\Server\Share` 捷徑。

**LAN 管理員驗證 (LAN Manager Authentication)** — 透過 `HKLM\SYSTEM\CurrentControlSet\Control\LSA\LMCompatibilityLevel` 控制 NTLM 驗證等級 0-5。NTLMv1 已在 Win11 24H2 和 Server 2025 中移除。目前作業系統的預設等級為 3。等級 0-1：傳送 LM+NTLM。等級 2：僅傳送 NTLM。等級 3+：僅傳送 NTLMv2。網域控制站上的等級 4-5：拒絕 NTLMv1/LM 回應。在伺服器上增加到 3 以上可能會鎖定舊用戶端。

**登入類型 (Logon Types)** — 事件識別碼 4624 類型：3=網路（遠端檔案/印表機存取，不快取認證）, 4=批次（排程工作，認證寫入磁碟）, 5=服務（服務帳戶，認證在 LSA 機密中）, 7=解除鎖定, 8=網路純文字 (IIS 基本驗證), 9=新認證 (RunAs /netonly), 10=遠端互動式 (RDP, 認證在 lsass 中), 11=快取互動式（離線網域登入, mscache2 格式）。

**檔案共用組織 (File Shares Organization)** — 拆分資料夾共用：每個團隊兩個磁碟機對應 — S: (Shared, 其他團隊可見) 和 T: (Team-only, 透過存取型列舉 ABE 隱藏)。ABE 隱藏使用者無法存取的資料夾；在數千個共用下運作良好，但在數萬個時效能會下降。每個團隊使用兩個 AD 群組：一個用於 T: 磁碟機，一個用於 S: 磁碟機存取。主資料夾對應到 H:（清單頂端）或 U:（底端）。預設子資料夾協助使用者組織：管理 (Admin), 文件 (Documentation), 會議 (Meetings), 專案 (Projects), 資源 (Resources), 範本 (Templates)。

**檔案共用模式 (File Sharing Modes)** — 建立/開啟檔案時，指定 FILE_SHARE_READ, FILE_SHARE_WRITE, 兩者皆有或皆無。兩個處理程序必須具有相容的共用模式。GENERIC_READ + FILE_SHARE_READ：與任何同樣具有 File_Share_Read 的 READ 處理程序共用。GENERIC_WRITE + FILE_SHARE_WRITE：與任何具有 File_Share_Write 的 WRITE 處理程序共用。不相容的模式 = 檔案被第一個處理程序鎖定。

**隱藏磁碟機 (NoDrives)** — 透過 `HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\NoDrives` 的登錄 DWORD 在檔案總管中隱藏磁碟機代號。位元遮罩值：A=1, B=2, C=4, D=8... Z=33554432, ALL=67108863。隱藏的磁碟機仍可透過在網址列輸入代號存取。需要登出/重新啟動。隱藏磁碟空間顏色列：編輯 `HKLM\Software\Classes\Drive\TileInfo` 並移除 `System.PercentFull;`。

**內建群組與特殊身分 (Built-In Groups and Special Identities)** — 關鍵群組：系統管理員 (Administrators, 不受限存取), 網域管理員 (Domain Admins, 管理網域), 企業管理員 (Enterprise Admins, 全樹系變更), 帳戶操作員 (Account Operators, 受限帳戶建立), 備份操作員 (Backup Operators, 備份/還原所有檔案), 伺服器操作員 (Server Operators, 服務、共用、DC 上的關機)。特殊身分（隱含）：Everyone, Authenticated Users, Interactive, Network, Batch, Service, Creator Owner, Anonymous Logon。Protected Users 群組提供額外的認證保護。KRBTGT 是 KDC 服務帳戶。LocalSystem 具有完整的系統存取權。LocalService 和 NetworkService 以受限權限執行。

**Active Directory 群組** — 安全性群組：控制資源存取。通訊群組：僅限電子郵件清單。範圍：全域 (Global, 以網域為中心, 巢狀使用者), 網域區域 (Domain Local, 指派資源權限), 通用 (Universal, 簡單全用途, 複寫到通用類別目錄), 本機 (Local, 儲存在 SAM 中, 單一機器)。最佳實作：使用者在全域群組中，將全域群組巢狀放入網域區域群組以取得權限 (AGDLP)。單一網域：全域群組可巢狀放入其他全域群組；資源使用網域區域群組可防止錯誤方向的權限繼承。群組成員資格在登入時評估 — 變更需要重新驗證。命名：使用英數字、連字號、底線；加上 G- 或 T- 前綴以利識別。

**登錄編輯器調整 (Win11)** — 開機：停用鎖定畫面 `NoLockScreen=1`，詳細登入 `verbosestatus=1`。檔案總管：Win10 樣式操作功能表（加入 `InprocServer32` 機碼），預設為「本機」`LaunchTo=1`，停用 Thumbs.db `DisableThumbnailCache=1`，顯示隱藏檔案 `Hidden=1`，顯示副檔名 `HideFileExt=0`。開始功能表：靠左對齊 `TaskbarAl=0`，移除 Bing 搜尋 `BingSearchEnabled=0`，加速顯示 `MenuShowDelay=250`。控制台：允許變更外觀/顯示/螢幕保護程式，設定鎖定畫面底圖。遙測：停用 Copilot/Recall `TurnOffWindowsCopilot=1`，停用診斷 `AllowTelemetry=0`。更新：自動下載+排程 `AUOptions=4`，僅通知 `AUOptions=2`，停用 `AUOptions=1`。

## 其他 (Miscellaneous)

**長檔名與 NTFS** — 最大路徑：260 字元 (MAX_PATH = 磁碟機 + 冒號 + 反斜線 + 256 字元 + null)。最大檔名：256 字元。使用 `\\?\` 前綴存取長路徑（停用正規化，允許最多 32,767 字元）。Win10 1607+ 可選擇移除 MAX_PATH 限制。.BAT 與 .CMD：.CMD 一致地重設 ERRORLEVEL；.BAT 則否。.BAT 在 32 位元 Windows 上可能會建立 .PIF 檔案（安全性風險）。保留名稱：CON, PRN, AUX, NUL, COM0-9, LPT0-9。非法字元：`/ \ : * ? " < > |`。自 Win8/Server 2012 起預設停用 8.3 檔名；使用 `FSUTIL behavior set disable8dot3 1` 手動停用。路徑類型：絕對路徑 `C:\path`, UNC 路徑 `\\server\share`, 裝置路徑 `\\.\` 或 `\\?\`。

**百分比符號 (% vs %%)** — 在批次檔中，`%%` 產生單個 `%`。剖析邏輯：`%%G` → FOR 參數值；`%1` → 命令列引數；`%var%` → 變數。在命令列中，僅需單個 `%`（無批次參數衝突）。切勿以數字命名變數（與 `%1` 等衝突）。`SET /A` 餘數運算子在批次檔中需要 `%%`。變數加上底線前綴以避免數字名稱衝突。

**網路列印 (Network Printing)** — Print$ 隱藏共用將驅動程式傳遞給用戶端。保持印表機名稱與共用名稱相同。使用短名稱（≤8 字元, 無空格）以利移植。印表機集區：多個裝置作為一個虛擬印表機，路由到第一個可用的裝置。優先順序：建立指向同一裝置的多個不同優先順序佇列。預設印表機是按使用者設定的，隨設定檔漫遊。LPR 通訊協定用於行式印表機和 UNIX 互通。使用 PRINTBRM 進行大量遷移。透過登錄編輯器刪除卡住的印表機：`HKLM\SYSTEM\CurrentControlSet\Control\Print\Printers\<name>`，然後重新啟動列印多工緩衝處理器 (Print Spooler) 服務。地點感知列印會根據網路自動切換預設值。

---

## 最佳實作與偵錯

**批次檔指令碼技術 (Batch File Scripting Techniques)** — 批次指令碼類別的主索引。技術分類為「DOS 批次」(COMMAND.COM) 或「NT 批次」(CMD.EXE)。在 NT 系統上使用 `COMMAND /C` 呼叫 DOS 批次技術。類別：最佳實作、偵錯、資料/變數、裝置、提升權限、檔案、資料夾、網際網路、資產盤點、數學、其他、網路、列印、處理程序/服務、程式流程、登錄編輯器、範例、排程器、安全性、時間/日期、UNIX 移植、使用者互動、萬用字元。

**COMMAND.COM、SHELL 與 COMSPEC** — COMMAND.COM 是 DOS 16 位元命令解譯器。語法：`COMMAND [drive:path] [device] [/C command | /K command] [/D] [/E:nnn] [/F] [/MSG] [/P] [/Y] [/Z]`。`/C` 執行後關閉工作階段，`/K` 保持工作階段開啟，`/P` 使其永久化，`/E:nnn` 設定環境大小 (160–32768 位元組)，`/F` 啟用預設失敗（隱藏 中止/重試/失敗），`/Y` 逐步偵錯，`/Z` 顯示每個命令的 errorlevel。CONFIG.SYS 中的 SHELL 命令指定主要解譯器。COMSPEC 變數指定次要解譯器。CMD.EXE 是 Windows NT 4+ 的 32 位元替換版本。次要環境中的變更會在工作階段關閉時遺失。

**編寫批次檔的注意事項 (DOs and DON'Ts)** — 務必：(1) 加入註解，(2) 驗證輸入，(3) 引號包圍引數 `"%~1"`，(4) 引號包圍路徑（防止來自 & 或空格的程式碼插入攻擊），(5) 大小寫一致，(6) 初始化變數，(7) 使用 `SETLOCAL`/區域變數，(8) 以副程式引數而非全域變數傳遞資料，(9) 在 `IF`/`FOR` 中使用多行縮排程式碼區塊，(10) 每個命令佔用一行，(11) 避免使用 & 的單行指令，(12) 檢查外部命令可用性/版本，(13) 指定外部命令的副檔名，(14) 指定外部命令的完整路徑，(15) 即使運作正常也要偵錯。切勿：(1) 不使用變數作為命令名稱，(2) 不使用巢狀 `IF...ELSE`，(3) 不使用巢狀程式碼區塊（使用副程式），(4) 除了 `@ECHO OFF` 以外不使用 `@command` 隱藏，(5) 不編寫單行指令，(6) 不使用無文件說明的聰明技巧。引述：「偵錯總是比編寫程式困難，因此如果你寫出了極盡聰明之能事的程式碼，根據定義你將無法對其進行偵錯。」

**偵錯批次檔 (Debugging Batch Files)** — 技術：(1) 錯誤訊息 — 註解掉 `REM` `@ECHO OFF`，將所有輸出重新導向至記錄檔 `mybatch.bat params > mybatch.log 2>&1`，在記錄檔中搜尋錯誤。(2) 環境變數 — 插入 `SET MyVariable` 或 `ECHO %MyVariable%` 以檢查值，在 FOR/程式碼區塊中啟用延遲擴充 (Delayed Expansion)。(3) 複雜命令 — 簡化巢狀 `FIND`/`FINDSTR`/`FOR /F`，個別測試元件，驗證 Token 位置。(4) 副程式 — 在開始處加入計數器 `SET /A Counter += 1`，使用 `SET` 傾印所有變數。(5) Windows 版本 — 使用來自不同作業系統版本的 CMD.EXE 複本進行測試（重新命名為 `cmdNT4.exe` 等），已知問題：`REG.EXE` v3 vs v2、NT4/早期 Win2K 無法使用延遲擴充、`SET /A` 整數範圍差異、`NETSH` 選項不同。版本控制：`VER | FIND "Windows NT"`。

**批次檔中的註解 (Comments in Batch Files)** — 方法：(1) `REM` — 標準，處處可用，但在磁碟片上會減慢 COMMAND.COM 速度。(2) `::` 雙冒號 — 較快（被視為無效標籤並跳過），但必須位於行首。在程式碼區塊和 FOR 迴圈內部會失效（導致 `) was unexpected` 錯誤）。例外：緊接著非空白命令的單個 `::` 在程式碼區塊中可行。(3) 註解區塊 — 使用 `GOTO EndComment`/`:EndComment`，或在檔案末尾使用 `EXIT`，或在檔案末尾使用不對應關閉 `)` 的 `(`。(4) `%= 行內註解 =%` 語法。關鍵陷阱：`(REM comment & ECHO text)` — `REM` 會將包括 `)` 在內的所有內容視為註解，開啟一個不對應的左括號並吃掉檔案剩餘部分。管道技巧：`REM | CHOICE /C:AB /T:A,5 > NUL` 封鎖鍵盤輸入（僅限 COMMAND.COM；CMD.EXE 使用 `TYPE NUL | CHOICE`）。最佳實作：避免在程式碼區塊內使用註解；若必須使用，請使用 `REM`；將註解放置在程式碼區塊之前。

## 輸入驗證與安全性

**防止程式碼插入攻擊 (Prevent Code Insertion Exploits)** — 批次檔是「弱型別」的：所有內容都是字串，字串可以是命令，無法區分資料與程式碼。`%CD%` 弱點：資料夾名稱中的 & 會在未加引號使用 `%CD%` 時導致程式碼執行。解決方案：加上雙引號 `"%CD%"`（安全，因為路徑不能包含雙引號）。對於可能包含雙引號的變數，加引號無法解決問題。測試批次檔中未加引號的 `%CD%`：`TYPE "%%~A" | FIND /I /N "%%CD" | FINDSTR /R /I /C:"[^""]%%CD[:%%]"`。替代方案：使用 `"%CD%"`、使用 `.` 或 `.\` 代替 `%CD%`、若有 & 則中止：`CD | FIND "&" && EXIT /B 1`。

**命令列輸入驗證 (Command Line Input Validation)** — 不存在萬無一失的命令列驗證。最佳方法：`ECHO "%~1"| FIND /I "TEST"`（方法 7, 分數 6/7）或 `ECHO "%~1"| FINDSTR /L /X /I """TEST"""`（方法 13, 分數 6.5/7）。弱點：「內含引號」 — 未結束的雙引號結合 & 可實現程式碼插入。`%1` vs `%~1`：波浪號會去除周圍的引號。示範：傳遞 `test1"&test2=` 會顯示透過不對應引號進行的程式碼插入。

**參數檔案 (Parameter Files)** — 命令列引數的更安全替代方案。純文字檔案，每行一個 `Parameter=Value`。使用 `FINDSTR /R /C:"[()&'\`\"]" "parameterfile"` 進行驗證以拒絕不必要的字元。使用 `FOR /F "tokens=* delims==" %%A IN ('FINDSTR /R /X /C:"[^=][^=]*=.*" "parameterfile"') DO SET Parameter.%%A` 剖析安全檔案。單引號在使用 `usebackq` 時是安全的（但隨後禁用反引號）。對於輸入中的 & 或雙引號，請考慮改用 VBScript 或 PowerShell。

**安全使用 SET /P (Safely Using SET /P)** — `SET /P "Input=prompt: "` 接受鍵盤輸入。程式碼插入風險：輸入 `abc&ping ::1` 會導致 `ECHO %Input%` 執行 `ping`。加上雙引號 `"%Input%"` 在面對內嵌雙引號（如 `abc"&ping ::1&echo "oops`）時會失敗。解決方案：使用變數延遲擴充 — `SETLOCAL EnableDelayedExpansion` 然後以 `!var!` 參照。延遲擴充在命令處理的第 3 階段（在發生插入的第 2 階段命令分割之後）解析，因此特殊字元不再被解譯。拒絕雙引號：`SET Input | FIND """" >NUL` 然後 `IF NOT ERRORLEVEL 1 SET Input=`。測試所有有問題的字元：`SET Input | FINDSTR /R /C:"[&""|()]"`。替代方案：使用 `CHOICE` 進行選擇而非自由輸入。

**使用 SeCEdit 進行安全性設定 (Security Configuration with SeCEdit)** — 使用安全性範本設定檔案、資料夾和登錄機碼的權限。透過 MMC 嵌入式管理單元（安全性範本）建立範本，在 GUI 中設定權限，儲存為 `.inf` 檔案。編輯 `.inf` 以僅保留變更的區段 (`[Registry Keys]`, `[File Security]`, `[Version]`, `[Profile Description]`)。透過以下方式套用：`ECHO y| SECEDIT.EXE /CONFIGURE /CFG myprog.inf /DB dummy.sdb /OVERWRITE /AREAS REGKEYS FILESTORE /LOG myprog.log /QUIET`。SeCEdit 命令中不允許雙引號 — 對於含空格的路徑，請使用 8.3 短名稱。開發期間使用 `/VERBOSE` 開關進行測試。

**SubInACL 權限管理 (SubInACL Permissions Management)** — 用於管理檔案、登錄機碼、服務、共用、印表機和處理程序安全性的 Microsoft 公用程式。語法：`SubInAcl [/option...] /object_type object_name [/action[=parameter]...]`。物件類型：`/file`, `/subdirectories`, `/keyreg`, `/subkeyreg`, `/service`, `/printer`, `/share`, `/process`。關鍵動作：`/grant=[Domain\]User[=Access]`, `/revoke`, `/replace`, `/display`, `/setowner`, `/findsid`, `/changedomain`。存取碼依類型而異 — 檔案：`F`=完全控制 (Full), `C`=變更 (Change), `R`=讀取 (Read), `W`=寫入 (Write), `X`=執行 (Execute)；服務：`T`=啟動 (Start), `O`=停止 (Stop), `P`=暫停 (Pause)；登錄編輯器：`Q`=查詢 (Query), `S`=設定值 (Set Value), `C`=建立子機碼 (Create SubKey)。範例：`SUBINACL /verbose=1 /subdirectories "D:\folder" /grant=Users=R`。

## 變數與資料

**SET 命令 (The SET Command)** — 顯示、設定或移除環境變數。基本：`SET variable=value`，刪除：`SET variable=`，顯示字首符合：`SET P` 顯示所有以 P 開頭的變數。`SET /A expression` 用於整數運算 (Windows NT 4+)：支援 `()`, `* / %`, `+ -`, `<< >>`, `& ^ |` 以及指派運算子。數值常值：`0x` 十六進位, `0b` 二進位, `0` 八進位 — 注意 `08`/`09` 是無效的八進位。受限於 16 或 32 位元整數（取決於 Windows 版本）。`SET /P variable=prompt` (Windows 2000+) 提示輸入；僅按 Enter 鍵會使變數保持不變。

**NT SET 功能** — 字串替換：`%PATH:str1=str2%` 替換出現處（在 XP+ 中不區分大小寫）。`str1` 可以以 `*` 開頭以從開頭開始符合。子字串：`%PATH:~10,5%` 提取從偏移量 10 開始的 5 個字元。負偏移量：`%PATH:~-10%` 最後 10 個字元，`%PATH:~0,-2%` 除了最後 2 個以外的所有字元。

**動態環境變數 (Dynamic Environment Variables)** — 在每次擴充時計算，不顯示在 `SET` 輸出中：`%CD%`（目前目錄）, `%DATE%`, `%TIME%`, `%RANDOM%` (0–32767), `%ERRORLEVEL%`, `%CMDCMDLINE%`, `%CMDEXTVERSION%`, `%HIGHESTNUMANODENUMBER%`。隱藏動態變數（透過 `SET ""` 發現）：`%=C:%` (C: 上的目前目錄), `%=ExitCode%`（最後結束代碼的十六進位）, `%=ExitCodeAscii%`, `%__APPDIR__%`（執行檔父資料夾，含結尾 `\`）, `%__CD__%`（目前目錄，含結尾 `\`）。如果使用者設定了動態變數名稱，它會覆蓋動態值；取消設定則會恢復。

**驗證變數是否已定義 (Verify if Variables are Defined)** — `IF DEFINED varname`（需要命令擴充）。比 `IF "%var%"==""` 更安全，後者在值包含雙引號或特殊字元時會失敗。隱藏/動態變數（`DATE`, `CD`, `RANDOM` 等）透過 `IF DEFINED` 回報為已定義，但 `SET varname` 會回傳「未定義」，除非已明確設定。檢查是動態還是靜態：`SET Date >NUL 2>&1` — errorlevel 1 表示仍為動態。示範：`FOR %%A IN (COMSPEC __APPDIR__ CD DATE ERRORLEVEL RANDOM TIME) DO (IF DEFINED %%A (...))`。

**驗證變數 (Validate Variables)** — 使用 `FINDSTR` 或 `FOR /F` delims 技巧檢查字串格式。十六進位：`FOR /F "delims=0123456789AaBbCcDdEeFf" %%A IN ("%~1") DO ECHO NOT hex` 或 `SET /A "=0x%~1"`。十進位：`ECHO.%~1| FINDSTR /R /X /C:"[0-9][0-9]*"`。IPv4：使用巢狀檢查驗證 4 個以點分隔的區塊 (0–255)（拒絕 256+、拒絕非數值、拒絕錯誤的區塊計數）。IPv6：移除介面部分（`%%` 及其後內容）、檢查無 `:::`、計算以冒號分隔的區塊（無 `::` 則為 8 個，有 `::` 則允許較少）、驗證每個區塊為 1–4 個十六進位數字。MAC：6 組 2 個十六進位數字，以 `:` 或 `-` 分隔。ISBN-13：交替乘以 1 和 3 進行總和檢查。Luhn 演算法：用於信用卡、IMEI — 交替加倍數字，若 >9 則減 9，比較總和檢查碼。

**變數延遲擴充 (Delayed Variable Expansion)** — 以 `%var%` 擴充的變數在讀取行時解析，而非在執行時。在 `FOR` 迴圈和程式碼區塊 `(...)` 內，這表示 `%var%` 取得的是區塊執行前的值。使用 `SETLOCAL ENABLEDELAYEDEXPANSION` 或 `CMD /V:ON` 啟用。使用 `!var!` 代替 `%var%` 進行執行時擴充。範例：`SET LIST=` 然後 `FOR %A IN (*) DO SET LIST=!LIST! %A` 建立累計清單。版面配置注意：`FOR %%A IN (...) DO (SET X=%X%%%A)` 與單行形式完全相同 — 兩者都在迴圈執行前擴充 `%X%`。在某些極端案例中，延遲擴充存在錯誤。

**轉義字元 (Escape Characters)** — 百分比符號 `%` 在批次檔中透過雙寫 `%%` 進行轉義。插入符號 `^` 在 CMD.EXE 中轉義特殊字元：`^&`, `^<`, `^>`, `^|`, `^^`, `^(`, `^)`。雙引號也能保護特殊字元，但引號會傳遞給命令。驚嘆號（搭配延遲擴充）：使用 `^^!`（需要雙重插入符號 — 第一個插入符號在第一輪處理中消耗，驚嘆號在第二輪延遲擴充處理中消耗）。`FIND` 透過雙寫來轉義雙引號：`""""`。`FINDSTR` regex 轉義：`\\`, `\[`, `\]`, `\"`, `\.`, `\*`, `\?`。CALL 會為引數增加額外的插入符號轉義 — 將轉義字串傳遞給 CALL 時務必測試。

**命令列參數 (Command Line Parameters)** — `%0` 是程式名稱，`%1`–`%9` 是引數。`%10` 不是第 10 個引數 — 它是 `%1` 後面跟著 `0`。使用 `SHIFT` 旋轉參數（或使用 `SHIFT /n` 從位置 n 開始旋轉）。NT 功能：`%*` = 所有引數, `%~d1` 磁碟機, `%~p1` 路徑, `%~n1` 檔案名稱, `%~x1` 副檔名, `%~f1` 完整路徑。`%CmdCmdLine%` = 原始 CMD 呼叫。分隔符號：逗號/分號被替換為空格（除非在引號內）、命令後的第一個 `/` 被替換為空格、多個空格被合併。迴圈替代方案：`FOR %%A IN (%*) DO (handle %%A)`。使用 GOTO 技巧驗證：`GOTO:%~1 2>NUL` / `IF ERRORLEVEL 1 (echo invalid)`。

**隨機數 (Random Numbers)** — `%RANDOM%` 動態變數提供 0–32767 範圍。技術：(1) 原生：`FOR /F "tokens=*" %%A IN ('VER ^| TIME ^| FINDSTR /R "[.,]"') DO FOR %%B IN (%%A) DO SET Random=%%B`（百分之一秒，在迴圈中非真正隨機）。(2) PowerShell：`FOR /F %%A IN ('powershell.exe -Command "Get-Random -Minimum 1 -Maximum 100"') DO SET Random=%%A`。(3) Rexx：`rexxtry say Random(min, max)`。(4) VBScript：`Randomize` 然後 `WScript.Echo Int((6 * Rnd) + 1)`，使用 `FOR /F %%A IN ('CSCRIPT //NoLogo random.vbs') DO SET Random=%%A` 擷取。

## 字串處理 (String Processing)

**取得字串長度 (Get String Length)** — 無原生字串長度函式。暴力破解：以 `!var:~%%A,1!` 迭代字元位置直到為空。逐次逼近（對於長字串較快）：在 2 的冪次方 (512, 256, 128, ..., 1) 處使用 `IF NOT "!var:~N!"==""` 進行二進位搜尋，累加長度。暴力破解範例：`SET len=0` / `FOR /L %%A IN (0,1,8191) DO IF NOT "!str:~%%A,1!"=="" SET /A len=%%A+1`。

**FOR /F Token 與 Delim** — `FOR /F "options" %%A IN ('command') DO ...`。分隔符號將輸入分割為 Token；多個連續的分隔符號被視為一個。第一個單字前的領頭分隔符號會被忽略（可用於去除領頭空格：`FOR /F "tokens=*" %%A IN ("   text") DO ECHO %%A`）。第一個指定的 Token 對應到 `%%A`，下一個對應到 `%%B` 等。`tokens=*` 擷取所有剩餘部分。在 `FOR /F` 括號內使用插入符號轉義管道/重新導向字元：`^|`, `^>`。當字元位於加引號的字串內（如 `FIND "<03>"`）時，不需要轉義。去除領頭零：`FOR /F "tokens=* delims=0" %%A IN ("00012") DO ECHO %%A`。

**字串替換 (String Substitution)** — `%var:str1=str2%` 將變數值中所有出現的 `str1` 替換為 `str2`。在 XP+ 中不區分大小寫。`str2` 可以為空以刪除出現處。`str1` 可以以 `*` 開頭，以符合從開頭到剩餘部分第一次出現的所有內容。範例：`SET var=%var:old=new%`。

**子字串 (Substrings)** — `%var:~offset,length%` 提取子字串。偏移量從 0 開始；負偏移量從末尾開始計算。`%var:~-10%` 最後 10 個字元。`%var:~0,-2%` 除了最後 2 個以外的所有字元。省略長度 = 字串剩餘部分。

**轉換為大寫或小寫 (Convert to Upper or Lower Case)** — 方法 1（搭配延遲擴充的 SET 替換）：針對每個字母 A–Z 重複 `SET %~1=!%~1:a=A!`。作為副程式呼叫：`CALL :UpCase VarName`。方法 2（FOR 迴圈, 不需要延遲擴充）：`FOR %%i IN ("a=A" "b=B" ...) DO CALL SET "%1=%%%1:%%~i%%"`。字首大寫變體會替換 `" a= A"`（以空格為前綴）。方法 3 (Brad Thone)：利用不區分大小寫的替換 — `SET _Abet=A B C D...Z` 然後 `FOR %%Z IN (%_Abet%) DO SET _Tmp=!_Tmp:%%Z=%%Z!`。方法 4 (FIND 技巧)：`FIND` 在「找不到檔案」訊息中以大寫回傳「檔案名稱」 — `FOR /F "tokens=2 delims=-" %%A IN ('FIND "" "%~1" 2^>^&1') DO SET UpCase=%%A` (XP+)。方法 5 (DIR /L)：`DIR /L /B ~%%B` 將暫存檔案名稱轉換為小寫。PowerShell：`('%*').ToUpper()` 或 `('%*').ToLower()`。警告：所有基於 SET 的方法都容易受到程式碼插入攻擊 — 請先驗證輸入。

**對齊文字以顯示為表格 (Align Text to Display as Tables)** — 將字串填補至固定寬度：附加 N 個空格然後截斷：`SET Line=%%A%FortySpaces%` / `SET Line=!Line:~0,40!`。對於動態欄寬，先使用暴力破解長度檢查測量最長字串（迭代位置 0..80，將寬度設定為最大值）。完整模式：`SET "EightySpaces=..."` / 第一輪 `FOR /F` 找出最大長度 / 第二輪填補並附加第二欄。主控台寬度偵測：`FOR /F "tokens=2 delims=:" %%A IN ('MODE CON ^| FIND "Columns"') DO SET ConsoleWidth=%%A`。

**批次檔中的陣列 (Arrays in Batch Files)** — 使用變數命名慣例模擬陣列。`SET User` 列出所有以 "User" 開頭的變數。建立類似陣列的組合：`SET __Arr.Key1=Value1`, `SET __Arr.Key2=Value2`。在其中迴圈：`FOR /F "tokens=2* delims=.=" %%A IN ('SET __Arr.') DO ECHO %%A = %%B`。WMIC 範例：`FOR /F "tokens=*" %%A IN ('WMIC LogicalDisk Where "DeviceID='C:'" Get /Format:list ^| FIND "="') DO SET __Disk.%%A`。使用 `FINDSTR /R /C:"=."` 以跳過空值（WMIC 在空欄位中輸出 CR/LF 對）。使用 `SET __Disk.` 進行列舉以列出所有儲存的屬性。批次語言中最接近關聯陣列/雜湊表 (Hashtable) 的近似值。

## 數學與算術 (Math and Arithmetic)

- **SET /A 算術** — `SET /A` 支援加 (`+`), 減 (`-`), 乘 (`*`), 整數除法 (`/`), 餘數 (`%%`), 位元移位 (`<<`, `>>`), 位元邏輯 AND (`&`), OR (`|`), XOR (`^`), NOT (`~`), 邏輯 NOT (`!`), 分組 `()` 以及組合指派運算子 (`+=`, `-=`, `*=`, `/=`, `%%=`, `&=`, `|=`, `^=`, `<<=`, `>>=`)。數值常值：八進位前綴 `0`, 十六進位前綴 `0x`。受限於 32 位元有符號整數範圍（−2,147,483,648 到 2,147,483,647）；NT4 上為 16 位元。無次方運算子 — 使用變數在迴圈中相乘。無平方根 — 使用二進位搜尋或 PowerShell。
- **無浮點數 (No Floating Point)** — 批次無原生浮點數。解決方法：乘以 100（或 1000）, 進行整數運算, 然後透過字串切片提取整數和小數部分：`SET Whole=%Result:~0,-2%` 和 `SET Frac=%Result:~-2%`。對於真正大或精確的數學, 請嵌入 PowerShell 單行指令：`powershell -C "expression"`。
- **大數解決方法 (Big Number Workarounds)** — 對於超過 32 位元範圍的數字：(1) 去除最後 N 位數字進行近似運算, (2) 拆分為單個數字進行任意精度加法/乘法（例如，帶進位的逐位處理）, (3) 呼叫 PowerShell 或其他語言。
- **格式化數字 (Formatting Numbers)** — 顯示十六進位：重複除以 16, 使用 `!Convert:~%Digit%,1!` 對 `0123456789ABCDEF` 輔助字串進行索引。顯示八進位：除以 8 的迴圈。右對齊十進位：補上空格然後以 `!Align:~-8!` 擷取。乘以 20 時檔案大小限制約 107MB（32 位元溢位）。PowerShell 的 `.ToString("format")` 對於複雜格式化較為簡單。
- **條件中的布林邏輯 (Boolean Logic in Conditions)** — `IF` 條件不支援 AND/OR/XOR（僅用於 `SET /A` 的二進位數學）。AND：巢狀 `IF` 陳述式。OR：將暫存變數設為 0, 針對每個符合條件設為 1, 最後進行測試。XOR：在巢狀 IF 中過於複雜。更好的方法：將每個條件指派給二進位變數 (0 或 1), 然後使用 `SET /A "ResultAND = %C1% & %C2%"`, `SET /A "ResultOR = %C1% | %C2%"`, `SET /A "ResultXOR = %C1% ^ %C2%"`。
- **領頭零陷阱 (Leading Zeroes Gotcha)** — `SET /A` 將帶有領頭 `0` 的數字視為八進位, 因此 `SET /A x=08` 和 `SET /A x=09` 會導致「無效數字」錯誤。在進行算術運算前務必去除領頭零。常見技術：使用 `FOR /F` 進行 Token 化、使用字串操作移除領頭零, 或使用 `SET /A "1%var:~-2% - 100"` 模式強制進行十進位解譯。

## 裝置與硬體 (Devices and Hardware)

- **DOS/NT 裝置名稱** — 有效的邏輯裝置：AUX, CON, PRN, COM1-4, LPT1-3, NUL。在 NT 中, 檢查名稱是否為裝置：`DIR %1 2>NUL | FIND /I "Volume" >NUL` — 無磁碟區標籤表示它是裝置。在 DOS 中, AUX/CON/PRN 會由 DIR 顯示目前日期/時間, 因此必須個別檢查。
- **DEVCON** — 來自 Windows 驅動程式套件 (WDK) 的命令列裝置管理員替代方案。關鍵命令：`classes`（列出設定類別）, `find`/`findall`（尋找裝置，包括已斷開連接的）, `hwids`（列出硬體識別碼）, `driverfiles`（列出驅動程式檔案）, `install`/`remove`/`enable`/`disable`/`restart`/`rescan`, `reboot`, `status`, `resources`, `update`, `dp_add`/`dp_delete`/`dp_enum` (OEM 驅動程式套件)。遠端：`-m:\\machine`。類別篩選器：`=ClassName`（例如，`=USB`, `=Printer`, `=DiskDrive`）。硬體識別碼：`@hwid`。範例：`DEVCON FindAll =USB` 列出包括已斷開連接的所有 USB 裝置。

## 提升權限 (Elevated Privileges)

- **檢查權限提升** — 多種技術：(1) `OPENFILES >NUL 2>&1` — 若未提升權限則失敗，但 `OPENFILES` 僅限 64 位元，且在 64 位元 Windows 上的 32 位元處理程序中會失敗。(2) `CACLS "%SYSTEMROOT%\system32\config\system"` — 檢查 errorlevel；若 CACLS 可用則有效。(3) 最可靠：`WHOAMI /Groups | FIND "12288" >NUL` — 不論 32/64 位元處理程序均能正確運作。在 64 位元 Windows 偵測 32 位元處理程序：若設定了 `PROCESSOR_ARCHITEW6432`（等於 AMD64）, 則為 64 位元作業系統中的 32 位元處理程序。
- **設定提升權限 (UAC 提示)** — 即時建立暫時的 VBScript：`Set UAC = CreateObject("Shell.Application")` 然後 `UAC.ShellExecute "%~snx0", "%*", "%~sdp0", "runas", 1`。這會以提升的權限重新啟動批次檔。重新啟動時變數會遺失（新處理程序）, 因此請先測試提升權限。PowerShell 檢查：`[Security.Principal.WindowsPrincipal]([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)`。

## 檔案與資料夾 (Files and Folders)

- **重新命名檔案** — `REN oldname newname` 支援萬用字元：`REN *.txt *.bak`。無文件說明的功能：`REN file.txt *s` 會在最後一次出現該字元後截斷檔案名稱。對於複雜的重新命名請使用 `FOR` 迴圈：`FOR %%A IN (*.txt) DO REN "%%A" "%%~nA_backup%%~xA"`。使用 `MOVE oldfolder newfolder` 重新命名資料夾。
- **透過 FOR 修飾詞取得檔案屬性** — 搭配修飾詞使用 `FOR %%A IN (file) DO`：`%%~nA` (名稱), `%%~xA` (副檔名), `%%~snA` (短 8.3 名稱), `%%~aA` (屬性), `%%~dA` (磁碟機), `%%~zA` (位元組大小), `%%~tA` (日期/時間), `%%~dpA` (磁碟機+路徑/父項目), `%%~fA` (完整路徑), `%%~$PATH:A` (第一個 PATH 符合項)。修飾詞可組合使用：`%%~nxA` (名稱+副檔名), `%%~dpnxA` (完整路徑), `%%~fsA` (完整短路徑)。
- **檔案與產品版本** — `FILEVER /V filename`（來自支援工具）顯示檔案/產品版本、描述、公司。使用 `FOR /F` 提取版本：剖析 `/V` 輸出。比較以點分隔的版本字串：按數值比較每個區段（`1.10` 與 `1.9` 的字串比較會失敗，因為依字母順序 `"10" < "9"`）。
- **START 與檔案關聯** — `START "title" [/D path] [/I] [/MIN] [/MAX] [/WAIT] [/B] [/SEPARATE] [/SHARED] [priority] command [args]`。優先順序類別：`/LOW`, `/NORMAL`, `/HIGH`, `/REALTIME`, `/ABOVENORMAL`, `/BELOWNORMAL`。透過 `HKEY_CLASSES_ROOT` 的檔案關聯：參數 `%1` (檔案路徑), `%L` (長名稱), `%W` (工作目錄)。`PATHEXT` 控制哪些副檔名在沒有明確副檔名的情況下進行解析。
- **暫存檔案** — 使用 `"%TEMP%.\tempfile"`（含結尾點）以取得安全的暫存路徑。Windows 2000 的 `%TEMP%` 通常包含空格 — 務必加引號。`RUNAS` 可能會將 `%TEMP%` 變更為唯讀位置。使用 `%RANDOM%` 或 `%TIME::=%` 建立唯一的暫存名稱。
- **PDF 命令** — 取得頁數：ExifTool (`-PageCount`), GhostScript (`gswin32c -q -dNODISPLAY -c "(file) (r) file runpdfbegin pdfpagecount = quit"`), PDFtk (`pdftk file dump_data | FIND "NumberOfPages"`), 或原生方式：`TYPE file.pdf | FINDSTR /R /C:"/Type\s*/Page"`（約略值）。合併：GhostScript 或 `pdftk file1.pdf file2.pdf cat output merged.pdf`。列印：Acrobat Reader `/P` 或 `/T`, Foxit `/p`, GhostScript 或註冊的列印命令。
- **檢查資料夾是否存在** — NT：`IF EXIST "folder\"`（結尾反斜線）。DOS：`IF EXIST folder\NUL`。更可靠的方法：`PUSHD "folder" && (POPD & ECHO exists) || ECHO not exists`。`NUL` 技巧在 NT 中面對連接點 (Junction)/符號連結 (Symlink) 可能會失敗。`FOR /D` 也能符合目錄：`FOR /D %%A IN (folder) DO ECHO found`。
- **FOR /D 與 FOR /R** — `FOR /D %%A IN (pattern) DO command` 符合目錄。`FOR /R [path] %%A IN (pattern) DO command` 遞迴走訪目錄樹。結合使用：`FOR /R "C:\" /D %%A IN (*) DO ECHO %%A` 列出所有子目錄。
- **RD (RMDIR)** — `RD /S /Q directory` 安靜地移除目錄樹。`/S` 移除所有子目錄與檔案。`/Q` 隱藏確認提示。若找不到目錄則回傳 errorlevel 2, 若目錄不為空則回傳 145（當省略 `/S` 時）。
- **萬用字元奇特行為** — `*` 符合包括無字元在內的任何字元；`?` 恰好符合一個字元。奇特行為：副檔名第 3 個字元之後的萬用字元在某些命令中會被忽略。短 8.3 名稱可能導致非預期的符合（具有長名稱的檔案可能會透過其短名稱符合）。`DIR *~*.*` 回傳不可預測的結果。`DEL *~*.*` 很危險 — 可能會因為短名稱符合而刪除預期之外的檔案。

## 重新導向與編碼 (Redirection and Encoding)

- **FOR /F (檔案/字串/命令剖析)** — `FOR /F "options" %%A IN (source) DO command`。選項：`tokens=`（欄位選擇，例如 `1,3*`）, `delims=`（分隔字元，預設為空格/Tab）, `eol=`（註解字元，預設為 `;`）, `skip=n`（跳過前 N 行）, `usebackq`（變更引號規則：反引號用於命令，雙引號用於檔案名稱，單引號用於字串）。來源：檔案名稱、`"字串"`、`` `命令` ``（搭配 `usebackq`）或 `('命令')`。變數修飾詞：`%%~fA` (完整路徑), `%%~dpA` (磁碟機+路徑) 等。
- **Token 與 Delim** — `tokens=1,3` 將第 1 欄和第 3 欄提取至 `%%A`/`%%B`, 剩餘部分提取至 `%%C`。`delims=,;` 設定分隔符號。`eol=` (註解字元)。`skip=n` (跳過標題行)。`usebackq` 啟用反引號命令和雙引號檔案名稱。變數修飾詞：`%%~fA` (完整路徑), `%%~dpA` (磁碟機+路徑), `%%~nxA` (名稱+副檔名), `%%~zA` (檔案大小), `%%~tA` (時間戳記), `%%~aA` (屬性), `%%~$PATH:A` (搜尋 PATH)。修飾詞可組合使用。
- **重新導向 (Redirection)** — `>` (覆寫 stdout), `>>` (附加 stdout), `2>` (重新導向 stderr), `2>&1` (將 stderr 合併至 stdout), `1>&2` (將 stdout 重新導向至 stderr), `|` (管道 stdout)。檔案控制代碼：0=stdin, 1=stdout, 2=stderr。為了可讀性，請將重新導向放置在命令之前：`>file ECHO text`。使用插入符號轉義：`ECHO text ^> not-redirected`。`>` 之前的空格可能會被視為要 echo 的文字一部分。
- **串流與重新導向說明** — 三個標準串流：標準輸出 (Standard Output, 代號 1), 標準錯誤 (Standard Error, 代號 2), 主控台 (Console, CON)。`2>&1` 將 stderr 合併到 stdout 以進行組合管道/擷取。`>CON` 繞過檔案重新導向，始終寫入主控台。`CLS` 和某些命令的主控台輸出無法重新導向。最佳實作：`command > logfile 2>&1` 以擷取兩個串流。歧義：`>` 之前的行若以 `1` 或 `2` 結尾，可能會被誤解為代號。
- **TEE 等效項** — Windows 中無原生的 TEE。解決方法：透過管道傳輸到同時寫入螢幕和檔案的批次/PowerShell 腳本。或使用 Unix TEE 命令的移植版本。簡單的批次近似值：使用 `FOR /F` 讀取命令輸出，同時 `ECHO` 到螢幕並 `>>file`。
- **偵測檔案編碼** — `FOR /F` 迴圈會在遇到 Unicode 檔案中的 ASCII 0 (null) 字元時中止。測試：`FOR /F %%A IN (file) DO (ECHO ANSI&GOTO:EOF)` — 如果迴圈在執行 ECHO 前就完成, 則檔案為 Unicode（包含會破壞 `FOR /F` 的 null 位元組）。
- **ASCII 與 Unicode 轉換** — `TYPE` 不會鎖定檔案（可用於複製正在使用的記錄檔）。Unicode 轉 ASCII：`TYPE unicode.txt > ascii.txt`。ASCII 轉 Unicode：`CMD /U /C TYPE ascii.txt > unicode.txt`。Unicode BOM 標頭：位元組 `0xFF 0xFE`。將 Unix 換行轉換為 Windows：`TYPE input.txt | MORE /E /P > output.txt`。
- **Base64 編碼/解碼** — `CERTUTIL.EXE -encode inputfile outputfile.b64`（編碼為 Base64）。`CERTUTIL.EXE -decode inputfile.b64 outputfile`（從 Base64 解碼）。輸出包含標頭/頁尾行 (`-----BEGIN CERTIFICATE-----` / `-----END CERTIFICATE-----`)，可能需要使用 `FINDSTR /V "CERTIFICATE"` 刪除。
- **十六進位編碼/解碼** — `CERTUTIL.EXE -encodehex inputfile outputfile [format]`。格式：預設（含偏移量和 ASCII 的十六進位編輯器檢視）, `4`（僅十六進位, 無 ASCII 或偏移量）, `12`（單行連續十六進位）。解碼：`CERTUTIL.EXE -decodehex hexfile outputfile`。PowerShell 替代方案：`[Convert]::ToHexString()` / `[Convert]::FromHexString()` (.NET 5+)。
- **檔案雜湊 (File Hashes)** — `CERTUTIL.EXE -hashfile filename [algorithm]`。演算法：MD2, MD4, MD5, SHA1 (預設), SHA256, SHA384, SHA512。範例：`CERTUTIL -hashfile myapp.exe SHA256`。替代方案：FCIV（File Checksum Integrity Verifier, 不再支援的 Microsoft 工具, 僅 MD5/SHA1）。PowerShell：`Get-FileHash -Algorithm SHA256 filename`。

## 網際網路與網路 (Internet and Networking)

- **取得預設瀏覽器** — 手動：`START ms-settings:defaultapps`。程式化：透過 `REG QUERY` 讀取 `HKCU\SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice\ProgID`, 回傳如 `FirefoxHTML-308046B0AF4A39CB` 的值。然後尋找執行檔：`REG QUERY "HKCR\<ProgID>\shell\open\command"` 以取得瀏覽器路徑。在 Windows 10+ 中，使用 `ASSOC .html` / `FTYPE` 的舊技術已不再可靠。
- **自動下載提示** — 檢查第三方工具是否存在：`TOOL /? >NUL 2>&1` 然後 `IF ERRORLEVEL 1` 表示缺失。若工具在 `/?` 時回傳非零值, 請使用 `(TOOL /? 2>&1) | FIND /I "copyright" >NUL` 偵測其輸出。提示使用者：`SET /P Download=立即下載？ [y/N]`, 然後 `IF /I "%Download%"=="Y" START "title" "https://download-page"`。執行前務必偵測，以避免出現隱晦的「無法辨識」錯誤。
- **從批次檔傳送電子郵件** — `START mailto:user@example.com?subject=Hello%%20World^&body=Message%%20text`。轉義：空格=`%%20`, CR/LF=`%%0D%%0A`, 驚嘆號使用插入符號 (`^&`) 轉義, 批次檔中使用雙寫 `%%`。長度受限於最大命令列（現代 Windows 約為 8191 字元）。僅建立訊息 — 使用者必須按「傳送」。對於自動傳送：使用第三方工具如 Blat (SMTP, 免費) 或 MailSend (共享軟體)。HTML5 也支援 `<a href="tel:">` 和 `<a href="sms:">`。
- **FTP 腳本編寫** — `FTP -s:scriptfile hostname` 用於自動化傳輸。腳本檔案包含：`USER username`, 密碼（下一行）, `cd path`, `binary`, `prompt n`, `mget *.*`（或 `mput`）。安全性：使用 `ECHO` 重新導向即時建立腳本，使用後刪除 (`TYPE NUL >script.ftp & DEL script.ftp`)。檢查錯誤：將 FTP 輸出重新導向至記錄檔，使用 `FIND` 搜尋錯誤訊息。替代方案：WGET (`wget ftp://host/file` 用於匿名下載), WinSCP (具備腳本介面的 SFTP/FTP), ScriptFTP (加密腳本, 獨立執行檔)。
- **WMIC (WMI 命令列)** — XP Pro+ 可用（Windows 11 中預設停用）。命令：`GET`（讀取屬性）, `SET`（變更）, `CALL`（叫用方法）。輸出格式：`/Format:csv`, `/Format:list`, `/Format:htable`。儲存在變數中：`FOR /F "tokens=*" %%A IN ('WMIC BIOS Get Manufacturer^,Name /Value ^| FIND "="') DO SET BIOS.%%A`。搭配 WQL 的 `WHERE` 子句：`WMIC Path Win32_NetworkAdapter Where "PhysicalAdapter=TRUE" Get`。別名 vs 完整類別路徑：`WMIC OS Get` = `WMIC Path Win32_OperatingSystem Get`。遠端：`/Node:computer`。非預設命名空間：`/NameSpace:\\root\other`。可以存取登錄編輯器，但 `REG.EXE` 較容易。
- **DMIDecode** — 移植到 Windows 的 Linux/Unix 公用程式，用於直接從韌體表格讀取 DMI/SMBIOS 資料（硬體資訊如 BIOS、系統、主機板、機箱、處理器詳細資料），不需透過 WMI。
- **RAS (遠端存取)** — 從命令列管理撥號和 VPN 連線的命令。`RASDIAL entryname [username password]` 進行連線，`RASDIAL /DISCONNECT` 斷開連線。`RASPHONE -h entryname` 掛斷。
- **終端伺服器命令** — `QUERY USER [/SERVER:name]`（列出使用者）, `QUERY SESSION`, `LOGOFF sessionid /SERVER:name`, `TSSHUTDN seconds /SERVER:name /POWERDOWN /DELAY:n /V`（具備通知的關機）, `MSG sessionid message`, `SHADOW sessionid`（遠端控制）。使用 `CHANGE LOGON /DISABLE` 防止新的登入。

## 登入腳本與管理 (Login Scripts and Administration)

- **網路磁碟機對應** — `NET USE G: \\Server\Share /PERSISTENT:No` 進行對應。`NET USE G: /DELETE` 斷開連線。基於群組的條件式對應：`NET GROUP "groupname" /DOMAIN | FINDSTR /I "%USERNAME%"` 若找到則對應。在登入腳本中務必使用 `/PERSISTENT:No` 以防止過期的對應。
- **網路印表機對應** — `NET USE LPT1 \\Server\Printer` 連接印表機連接埠。對於非連接埠導向的列印，使用 `RUNDLL32 PRINTUI.DLL,PrintUIEntry /in /n \\Server\Printer`。設定預設印表機：`WMIC Path Win32_Printer Where Name='PrinterName' Call SetDefaultPrinter`。
- **記錄電腦存取** — 建立以日期為名的記錄資料夾並附加登入事件：記錄 `%COMPUTERNAME%`, `%USERNAME%`, 日期/時間。擷取 IP 與 MAC：使用 `FOR /F` 剖析 `IPCONFIG /ALL`，或使用 `WMIC NIC Where NetEnabled=TRUE Get MACAddress`。透過 WMI SecurityCenter 命名空間檢查防毒軟體狀態。
- **登入腳本最佳實作** — 保持腳本精簡；避免不必要的作業造成負擔。若連線已存在則跳過對應。不要在伺服器上對應磁碟機。使用與一般工作站腳本分開的專用終端伺服器登入腳本。在不同 Windows 版本上進行徹底測試。
- **Active Directory 命令列工具 (DS Tools)** — `DSQUERY`（尋找 AD 物件：`DSQUERY USER -name "John*"`）, `DSGET`（讀取屬性：`DSGET USER "CN=John,DC=corp,DC=com" -email`）, `DSADD`（建立物件）, `DSMOD`（修改）, `DSRM`（刪除）, `DSMOVE`（移動/重新命名）。皆接受辨別名稱 (DN) 格式。管道傳輸結果：`DSQUERY USER -inactive 12 | DSMOD USER -disabled yes`。

## 列印 (Printing)

- **列印文字檔** — 經典方式：`PRINT myfile.txt /D:LPT1`（需要 LPT/COM 連接埠）。現代方式：`NOTEPAD /P file.txt`（預設印表機，不論關聯為何皆適用於任何文字檔）。Wordpad：`WRITE /P file.rtf`（含列印對話方塊）或 `WRITE /PT file.rtf PrinterName`（安靜列印，特定印表機）。
- **列印註冊的檔案類型** — 技術：使用 `ASSOC .ext` 取得檔案類型，然後在 `HKCR\FileType\shell\print\command` 中尋找列印命令。HTML：`RUNDLL32.EXE MSHTML.DLL,PrintHTML "%1"`。PDF：從登錄編輯器讀取關聯，透過 `REGEDIT /E` 或 `REG QUERY` 提取列印命令。對於任何註冊類型：查詢 `HKCR\filetype\shell\print\command` 並搭配 `START /MIN` 執行。檔案關聯參數：`%1` (完整路徑), `%L` (長名稱), `%W` (父資料夾)。
- **應用程式的命令列參數** — 廣泛的列印/開啟/轉換參數集合：Adobe Reader (`/P` 列印對話方塊, `/N /T file printer` 安靜列印), Foxit Reader (`/p` 安靜, `/t file printer`), IrfanView (`/print`, `/convert=output`), OpenOffice (`-pt "Printer" file`), Word（需要 VBA 巨集 `winword /mPrintDefault /q /n`）, Notepad (`/P`), Wordpad (`/P`, `/PT`), PowerPoint (`/PT "Printer" "" "" "File"`)。大多數程式接受檔案路徑作為第一個引數以開啟它。
- **命令列印表機控制 (PRINTUI.DLL)** — `RUNDLL32.EXE PRINTUI.DLL,PrintUIEntry [options]`（Windows 7 簡寫：`PRINTUI.EXE [options]`）。安裝印表機：`/if /b "Name" /f ntprint.inf /r "port:" /m "Model"`。刪除：`/dl /n "Name"`。設定預設：`/y /n "Name"`。取得/設定設定值：`/Xg` / `/Xs`。備份：`/Ss /n "printer" /a "file.dat"`。還原：`/Sr /n "printer" /a "file.dat"`。始終回傳 errorlevel 0 — 透過將設定匯出至檔案並檢查是否存在來驗證成功。遷移印表機：PrintMig 3.1 (W2K/XP/2003) 或 PRINTBRM (W7/2008+)。
- **DDE 命令列控制** — 作為 DDE 伺服器的程式可以透過 DDE 命令從命令列進行控制。如 CMCDDE 和 ClassExec 等工具會向執行中的應用程式傳送 DDE 執行/請求命令。對於控制缺乏直接列印命令的 Office 應用程式很有用。
- **印表機管理腳本** — Windows 在 `%windir%\System32\` 中隨附 VBScript 印表機管理腳本（模式為 `*prn*.vbs`）：`prnmngr.vbs`（新增/刪除/列出印表機）, `prncnfg.vbs`（設定）, `prnport.vbs`（管理連接埠）, `prndrvr.vbs`（管理驅動程式）, `prnjobs.vbs`（管理列印工作）。

## 處理程序與服務 (Processes and Services)

- **管理處理程序** — 原生 (XP+)：`TASKLIST`（列出處理程序；`/V` 詳細資訊含視窗標題, `/SVC` 顯示裝載的服務, `/FI "filter"` 依 `IMAGENAME`、`PID`、`STATUS`、`USERNAME`、`MEMUSAGE` 等準則篩選；輸出格式 `/FO TABLE|LIST|CSV`）。`TASKKILL /PID pid` 或 `/IM imagename`（依 PID 或名稱刪除；`/F` 強制, `/T` 樹狀刪除包含子項）。支援工具替代方案：`KILL pid|pattern`, `TLIST [-t]` (樹狀檢視), `PULIST` (處理程序+使用者)。SysInternals：`PSKILL [\\remote] pid|name`, `PSLIST [-d|-m|-x|-t|-s]`。判斷自身的 PID：`FOR /F "tokens=2" %%A IN ('TASKLIST /V ^| FIND /I "%~0"') DO SET MyPID=%%A`（有效是因為 TASKLIST `/V` 顯示包含批次檔路徑的 CMD 視窗標題）。
- **關機、重新啟動、登出** — `SHUTDOWN /s /t 60 /c "message"`（60 秒內關機並顯示警告）, `SHUTDOWN /p`（立即關機）, `SHUTDOWN /l`（登出）, `SHUTDOWN /r /t 0`（立即重新啟動）, `SHUTDOWN /h`（休眠）, `SHUTDOWN /a`（中止擱置的關機）。WMIC：`WMIC OS Where Primary=TRUE Call Shutdown|Reboot|Win32Shutdown`。Win32Shutdown 代碼：0=登出, 1=關機, 2=重新啟動, +4=強制, 8=關閉電源。鎖定工作站：`RUNDLL32 USER32.DLL,LockWorkStation`。睡眠：`RUNDLL32 powrprof.dll,SetSuspendState Sleep`。PowerShell：`Restart-Computer [-Force]`, `Stop-Computer [-Force]`, `Stop-Computer -ComputerName "remote"`。針對遠端機器使用 SysInternals PSSHUTDOWN。
- **SC (服務控制器 Service Controller)** — `SC \\computer [command] [service] [options]`。命令：`query`（狀態）, `start`, `stop`, `config`（變更設定）, `description`, `failure`（修復動作）, `delete`, `create`, `qc` (查詢設定), `qdescription`, `qfailure`。變更啟動類型：`SC Config servicename start= auto|disabled|demand`。修復：`SC Failure servicename actions= restart/60000/restart/60000// reset= 120`（前兩次失敗後 1 分鐘重新啟動，之後不執行任何動作）。重要：`=` 後的空格是強制性的（`start= auto`, 而非 `start=auto`）。服務名稱是短名稱，而非顯示名稱 — 可透過 `services.msc` 或 `SC Query` 尋找。

## 程式流程 (Program Flow)

- **條件式執行** — `IF condition command`。`IF ... ELSE` 需要括號：`IF condition (cmd1) ELSE (cmd2)`。`IF ... ELSE IF` 鏈：`IF cond1 (cmd1) ELSE IF cond2 (cmd2) ELSE (cmd3)`。命令鏈接：`&`（一律依序執行）, `&&`（僅在成功/errorlevel 0 時執行下一個）, `||`（僅在失敗/非零 errorlevel 時執行下一個）。結合使用：`(cmd1 && cmd2 && cmd3) || ECHO Error occurred`。條件中的邏輯 AND：巢狀 `IF`。邏輯 OR：針對每個條件設定暫存變數，測試最終值。
- **FOR 迴圈 (DOS 與 NT)** — 基本：`FOR %%A IN (set) DO command`。`FOR /D %%A IN (pattern) DO`（僅限目錄）。`FOR /R [path] %%A IN (pattern) DO`（遞迴走訪樹狀目錄）。`FOR /L %%A IN (start,step,end) DO`（數值範圍）。`FOR /F "options" %%A IN (source) DO`（剖析檔案/字串/命令）。在命令提示字元使用 `%A`；在批次檔中使用 `%%A`。變數為單一字母且區分大小寫 (`%%A` ≠ `%%a`)。
- **FOR /F 詳細資料** — `tokens=1,3*` 將第 1 和第 3 欄提取至 `%%A`/`%%B`, 剩餘部分提取至 `%%C`。`delims=,;` 設定分隔符號。`eol=` (註解字元)。`skip=n` (跳過標題行)。`usebackq` 啟用反引號命令和雙引號檔案名稱。變數修飾詞：`%%~fA` (完整路徑), `%%~dpA` (磁碟機+路徑), `%%~nxA` (名稱+副檔名), `%%~zA` (檔案大小), `%%~tA` (時間戳記), `%%~aA` (屬性), `%%~$PATH:A` (搜尋 PATH)。修飾詞可組合使用。
- **FOR 中的檔案屬性** — `%%~aA` 擴充為屬性旗標字串，如 `d--------` (目錄) 或 `--a------` (封存)。屬性位置：`d` (目錄), `r` (唯讀), `a` (封存), `h` (隱藏), `s` (系統), 以及壓縮、加密等。使用 `IF "%%~aA" GEQ "d" ECHO directory` 進行測試或剖析特定的字元位置。
- **擴充的 FOR 變數** — 標點符號字元可以作為 FOR 變數名稱：`%%~f#`, `%%~dp$PATH:!` 等。這允許巢狀 FOR 迴圈而不致用盡字母變數。數字作為 FOR 變數：`%%0`–`%%9` 和 `%%~f0` 等在某些內容中可行，但會與批次參數 `%0`–`%9` 衝突。
- **模擬 While 迴圈** — Do...Until：`:Loop` / 執行工作 / `IF NOT condition GOTO Loop`。Do...While：`:Loop` / `IF condition GOTO End` / 執行工作 / `GOTO Loop` / `:End`。使用具備數字字尾的唯一標籤名稱 (`:Loop1`, `:Loop2`) 以避免衝突。
- **GOTO** — `GOTO label` 跳轉到 `:label`。`GOTO:EOF` 結束目前的副程式（如果不在 `CALL` 叫用的副程式中，則結束批次檔）。標籤不區分大小寫。在某些 Windows 版本中，標籤僅前 8 個字元有效。在加括號的程式碼區塊（如 `FOR` 或 `IF`）內使用 `GOTO` 會跳出該區塊。
- **連續的 FOR /L 迴圈** — `FOR /L %%A IN (1,0,1) DO command` 建立無限迴圈（步長=0, 永遠不會到達終點）。此外：`FOR /L %%A IN () DO` 或極大的終點值。適用於輪詢/等待情境。
- **打破無窮迴圈** — `Ctrl+C` 傳送中斷訊號。從另一個處理程序：`TASKKILL /F /IM cmd.exe /FI "WINDOWTITLE eq BatchTitle"`。自我中斷：每次迭代檢查旗標檔案或登錄編輯器數值, `IF EXIST stop.flag GOTO End`。
- **Errorlevel** — `IF ERRORLEVEL n` 在 errorlevel >= n 時為 TRUE（不是等於！）。精確測試：`IF %ERRORLEVEL% EQU 0`（或 `NEQ`, `GTR`, `LSS`）。切勿建立名為 `ERRORLEVEL` 的變數（會遮蔽動態虛擬變數）。設定 errorlevel：`EXIT /B n` (W2K+, 結束批次檔/副程式並將 errorlevel 設為 n)。重設為 0：`CMD /C EXIT 0` 或 `VER >NUL`。強制為非零：`COLOR 00`（設定 errorlevel 1）或 `VERIFY OTHER 2>NUL`（設定 errorlevel 1）。對於 DOS 中的精確 errorlevel 檢查：使用倒序的 `IF ERRORLEVEL` 鏈（先檢查最高值）。
- **EXIT** — `EXIT` 會完全關閉 CMD 視窗。`EXIT /B [exitcode]` 僅結束目前的批次檔（或副程式，如果是透過 `CALL` 叫用的），並可選擇將 `%ERRORLEVEL%` 設定為 exitcode。在批次檔中一律使用 `EXIT /B` 以免關閉使用者的終端機。在副程式中：成功回傳 `EXIT /B 0`, 失敗回傳 `EXIT /B 1`（或其他非零值）。

## 登錄編輯器 (Registry)

- **REGEDIT** — GUI 和命令列登錄編輯程式。匯入（合併）：`REGEDIT /S importfile.REG`（安靜）。匯出：`REGEDIT /E exportfile.REG "HKEY_XXXX\Whatever Key"`。透過 .REG 檔案移除樹狀結構：在機碼前加上減號 `[-HKEY_CURRENT_USER\DummyTree]`。移除單一數值：`"ValueToBeRemoved"=-`。獨立的 .REG 批次混合檔：檔案開頭為 `REGEDIT4`, 使用分號表示批次命令 (`;@ECHO OFF` / `;REGEDIT.EXE /S "%~f0"` / `;EXIT`), 然後下方接續登錄編輯器項目。警告：編輯登錄編輯器前務必備份。
- **REG.EXE** — 命令列登錄編輯器工具（NT4 為 Resource Kit 工具, XP 起為原生工具）。使用 `FOR /F` 讀取數值：`FOR /F "tokens=2* delims=<TAB> " %%A IN ('REG QUERY "HKCU\Control Panel\International" /v sCountry') DO SET Country=%%B`。使用 `tokens=2*` 搭配星號以擷取多字數值。子命令：`REG QUERY`, `REG ADD`, `REG DELETE`, `REG COPY`, `REG EXPORT`, `REG IMPORT`。結合 `FOR /F` 可將任何登錄編輯器數值提取至環境變數中。
- **WMIC 登錄編輯器** — 檢查登錄編輯器存取權限：`WMIC /NameSpace:\\root\default Class StdRegProv Call CheckAccess`。也能透過 WMI 的 `StdRegProv` 類別方法（如 `GetStringValue`, `EnumKey`, `EnumValues`）以程式化方式查詢登錄編輯器數值。
- **搜尋登錄編輯器** — Windows 7+ 的 `REG Query` 支援 `/F`（尋找）開關：`REG Query HKLM\Software /F "searchpattern" /S`。使用 `/K` 僅搜尋機碼名稱（快）, `/V` 搜尋數值名稱（快）, `/D` 搜尋資料（慢）, 或省略以進行全域搜尋。使用 `/E` 進行精確符合, `/C` 區分大小寫。範例：`REG Query HKLM\Software /V /F AppPath /S /E` 尋找所有名稱完全為 "AppPath" 的數值。

## 日期與時間

- **NT 中的 DATE 與 TIME 基礎** — 取得目前日期/時間：`FOR /F "tokens=*" %%A IN ('DATE /T') DO SET Today=%%A` 或使用內建的 `%Date%` 和 `%Time%` 變數 (W2K+)。內層 `FOR` 迴圈去除星期幾前綴。數值取決於區域設定（日/月的順序、分隔符號、AM/PM vs 24 小時制皆取決於區域設定）。
- **剖析 DATE 與 TIME** — 兩種方法：搭配分隔符號的 `FOR /F` (`FOR /F "tokens=1-3 delims=/-" %%A IN ("%Today%") DO ...`) 或 `SET` 子字串 (`SET Year=%Today:~-4%`, `SET Month=%Today:~-10,2%`)。透過登錄編輯器判斷日期順序：從 `HKCU\Control Panel\International` 使用 `REG QUERY` 讀取 `iDate` (0=MDY, 1=DMY, 2=YMD) 和 `sDate` (分隔符號)。剖析具備領頭零的時間：`SET Now=%Time: =0%` 然後 `SET Hours=%Now:~0,2%`。去除領頭零：`SET /A Hours = 100%Hours% %% 100`。
- **進階日期運算** — 將日期轉換為儒略日數以進行算術運算。批次檔中的 Fliegel-Van Flandern 演算法 (由 Ron Bakowski 編寫)：`:JDate` 副程式接受 YYYY MM DD, 回傳儒略日期。`:GDate` 進行反向轉換。日期算術：`SET /A JPast = JDate - 28` 得到 4 週前的日期。從儒略日計算星期幾：`SET /A WD = %JDate% %% 7` (0=星期一...6=星期日)。以天數計算年齡：從今天的儒略日減去出生時的儒略日。
- **讀取 CMOS 即時時鐘** — 使用 DEBUG 直接讀取 CMOS RTC 暫存器（僅限 16 位元，需要 32 位元作業系統）。連接埠 `70` 選擇暫存器, 連接埠 `71` 讀取數值。暫存器：`09`=年, `08`=月, `07`=日, `04`=時, `02`=分, `00`=秒（皆為 BCD）。暫存器 `0E` > `7F` 表示時鐘未設定。100% 與區域設定無關，但需要管理員權限。
- **延遲與等待技術** — `PAUSE` 等待任意按鍵。`SLEEP n`（資源套件）等待 n 秒。`TIMEOUT /T n`（原生 W7+）等待 n 秒或按鍵；`/NOBREAK` 需要 Ctrl+C。PING 技巧：`PING localhost -n 6 >NUL` 延遲約 5 秒 (n=秒數+1)。CHOICE 技巧：`REM | CHOICE /C:AB /T:A,10 >NUL` (DOS) 或 `CHOICE /C:AB /D:A /T:10 >NUL` (W10)。PowerShell：`powershell -Command "Start-Sleep -Seconds %1"`。
- **AT 命令** — 在絕對時間排程命令（NT 伺服器）：`AT [\\computername] time [/INTERACTIVE] [/EVERY:day,...] command`。預設使用 SYSTEM 帳戶。批次檔前必須加上 `CMD /C`。偵測排程工作：排程 `CMD.EXE` 搭配 `/INTERACTIVE` 以在 SYSTEM 內容中取得可見的提示字元。在 Windows XP+ 中已被 SCHTASKS 取代。
- **JT (工作工具 Job Tool)** — Windows 2000 資源套件工具，用於工作排程器命令列管理。列舉工作：`JT /SE` 或 `JT /SE P` 取得完整詳細資料。在本地/遠端電腦上新增、編輯或移除排程工作。命令列參數不直覺；使用 JTHelp.bat 產生 HTML 說明。
- **SCHTASKS** — 功能齊全的工作排程器 CLI (XP+)。子命令：`/Create`（排程新工作）, `/Delete`, `/Query`, `/Change`, `/Run`（立即執行）, `/End`（停止執行中的工作）, `/ShowSid`。建立範例：`SCHTASKS /Create /SC DAILY /TN "MyTask" /TR "C:\script.bat" /ST 21:00`。排程類型：MINUTE, HOURLY, DAILY, WEEKLY, MONTHLY, ONCE, ONSTART, ONLOGON, ONIDLE, ONEVENT。使用 `/RU` 指定執行帳戶, `/XML` 用於匯入/匯出, `/F` 強制覆寫。

## 使用者互動 (User Interaction)

- **使用者輸入** — `SET /P variable=prompt` (W2K+) 讀取一行使用者輸入。警告：包含 `&`, `<`, `>`, `|` 或 `"` 的輸入可能會導致程式碼插入 — 切勿在提升權限的腳本中使用 `SET /P`。NT4：`FOR /F "tokens=*" %%A IN ('TYPE CON') DO SET INPUT=%%A`（使用者按 F6+Enter 結束）。MS-DOS：`CHOICE /C:YN` 用於單鍵是/否。PowerShell 登入對話方塊：`FOR /F "tokens=1* delims=;" %%A IN ('PowerShell ./login.ps1 %UserName%') DO (SET Usr=%%A & SET Pwd=%%B)`。
- **批次檔中精美的對話方塊** — 用於批次的 C# GUI 公用程式：`MessageBox.exe`（彈出訊息, 回傳點擊的按鈕標題）、`InputBox.exe`（具備選用密碼遮罩、正規表示式篩選、逾時功能的文字輸入）、`OpenFileBox.exe` / `SaveFileBox.exe`（檔案對話方塊）、`OpenFolderBox.exe`（資料夾瀏覽器）、`PrinterSelectBox.exe`、`DateTimeBox.exe`、`DropDownBox.exe` / `RadioButtonBox.exe`（清單選擇）、`MultipleChoiceBox.exe`（核取方塊）、`ColorSelectBox.exe`、`FontSelectBox.exe`、`ProgressBarGUI.exe`。皆會將選擇內容寫入 stdout 以供 `FOR /F` 擷取。回傳 errorlevel 0=OK, 2=取消。
- **隱藏或最小化主控台** — 啟動時最小化：`START /MIN "title" "batch.bat"`。最小化自身視窗：`CONSOLESTATE /Min` 或 `SETCONSOLE /minimize` 或 title+CMDOW 組合。隱藏自身視窗：`CONSOLESTATE /Hide` 或 `SETCONSOLE /hide`。完全隱藏（無閃爍）：透過 `RUNNHIDE.EXE batch.bat` 或 `WSCRIPT.EXE RunNHide.vbs batch.bat` 或 `HSTART /NOCONSOLE "batch.bat"` 啟動。注意：從批次檔內部隱藏始終會顯示短暫的主控台閃爍；隱藏動作必須在批次啟動前開始。
- **本地語言的錯誤訊息** — `NET HELPMSG nnnn` 以本地系統語言顯示 Windows 錯誤訊息編號 nnnn。產生完整清單：`FOR /L %%A IN (0,1,16384) DO (FOR /F "tokens=*" %%B IN ('NET HELPMSG %%A 2^>NUL') DO ECHO %%A %%B)`。在批次指令碼中使用這些編號以獲得本地化的錯誤輸出，而無需硬編碼翻譯。
- **彈出訊息** — `MSG.EXE` (XP Pro+)：傳送彈出訊息給使用者/工作階段。即時 VBScript：`> msg.vbs ECHO WScript.Echo "message"` 然後 `WSCRIPT msg.vbs`。MSHTA 單行指令：`MSHTA vbscript:Close(MsgBox("message",vbOKOnly,"title"))`。PowerShell 單行指令：`FOR /F "usebackq" %%A IN (\`PowerShell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('message','title','YesNo','Question')"\`) DO SET Answer=%%A`。結果為按鈕標題字串 (Yes, No, OK, Cancel)。
- **ANSI 顏色與逸出序列 (ANSI Colors and Escape Sequences)** — DOS 中需要 ANSI.SYS；Windows 10+ CMD.EXE 原生內建。逸出字元 (Escape) = ASCII 27。透過 FORFILES 插入批次檔：`FORFILES /P %~dps0 /M %~nxs0 /C "CMD /C ECHO 0x1B[1;31m Red Text 0x1B[0m"`。顏色代碼：`<Esc>[30m`–`<Esc>[37m` 前景, `<Esc>[40m`–`<Esc>[47m` 背景, `<Esc>[1;3Xm` 亮色。屬性：`<Esc>[0m` 重設, `<Esc>[1m` 粗體, `<Esc>[4m` 底線, `<Esc>[7m` 反白。游標：`<Esc>[r;cH` 定位, `<Esc>[nA/B/C/D` 移動, `<Esc>[2J` 清除螢幕, `<Esc>[K` 清除到行尾。在 PROMPT 字串中使用 `$E` 代替 Esc 字元。

## 其他與集合 (Miscellaneous and Collections)

- **UNIX 移植版本 (WHICH, TEE, CUT)** — 基礎 Unix 公用程式的批次/Rexx/Perl/PowerShell/VBScript 移植版本。WHICH：在 PATH 中尋找執行檔（處理 DOSKEY 巨集和 CMD 內部命令）。TEE：同時將 stdout 分割到螢幕和檔案。CUT：從文字中提取欄位/欄。亦包含用於明確設定 errorlevel 的 TRUE/FALSE 公用程式。提供原生批次 (.bat)、編譯的 Perl (.exe) 以及多種指令碼語言版本。
- **無文件說明的 NT 命令** — `ACINIUPD` (W2K 伺服器)：從命令列更新 INI 檔案 (`ACINIUPD /e "file.ini" "section" key "value"`; `/u` 用於使用者目錄; 僅限管理員)。`SFC /SCANNOW`：掃描並取代損毀的受保護系統檔案。`TSSHUTDN`（終端伺服器）：受控的伺服器關機，具備使用者通知、重新啟動和關閉電源選項。
- **DEBUG** — 用於批次指令碼的 16 位元 DOS 偵錯程式（僅限 32 位元作業系統；64 位元不可用）。讀取 CMOS 即時時鐘（與區域設定無關的日期/時間）。讀取 VideoROM 製造商資訊。讀取 COM/LPT 連接埠的 I/O 連接埠位址。檢查 CapsLock/NumLock/ScrollLock 狀態。建立微型的 .COM 公用程式（例如，用於使用者輸入的 REPLY.COM, 用於重新啟動的 RESET.COM）。在批次中嵌入指令碼：`DEBUG < %0.BAT` / `GOTO Around` / 指令碼 / `:Around`。
- **聰明的提示與技巧** — CMD /C 引號奇特行為：`CMD /C @"command" "arg"`（加上 `@` 前綴以防止第一個和最後一個字元為引號時剖析錯誤）。權限提升檢查：`WHOAMI /GROUPS | FIND "12288"`（在 32 位元和 64 位元皆適用）。`PUSHD "%~dp0"` 自動將 UNC 路徑對應到磁碟機代號（適用於 RUNAS, PSEXEC, UAC）。`SET /P var=<file` 將檔案的第一行讀取到變數中。大數數學：FOR 迴圈在數字之間插入空格以進行逐位乘法。FOR /F 支援使用轉義特殊字元（如 `%%^^`, `%%_`, `%%\``）的 31 個 Token（而不僅是 26 個）。交換滑鼠按鈕：`RUNDLL32 USER32.DLL,SwapMouseButton`。解析主機名稱：`FOR /F "tokens=2" %%A IN ('PING -a %1 ^| FIND "[%1]"') DO ECHO %%A`。群組命令以進行單一重新導向：`(cmd1 & cmd2 & cmd3) > log.txt`。
- **ANSI 藝術與主控台顏色** — 使用 ANSI 逸出序列建立彩色文字畫面和動畫。ANSI.SYS (DOS) 或 Windows 10 內建支援。FORFILES 技術即時產生 Esc 字元。替代方案：`KOLOR.EXE`（在 32/64 位元設定文字選擇顏色）, BG (由 Carlos M. 編寫, 現代的 BATCHMAN 替代品), EKKO (由 Norman De Forest 編寫, 具備類 PROMPT 顏色功能的 ECHO 增強版, 不需 ANSI 驅動程式)。
- **AUTOEXEC.BAT** — 開機時由 COMMAND.COM 自動執行的啟動批次檔 (MS-DOS/Windows 9x)。用於設定 PATH、載入 TSR、設定環境變數以及初始化裝置。在 Windows NT+ 中不使用（由登錄編輯器 Run 機碼和啟動資料夾取代）。
- **基於 PHP 的批次檔** — 將 PHP 程式碼與批次檔混合使用的技術。PHP CLI 處理腳本，而批次命令則隱藏在 PHP 註解中。適用於在 .bat 包裝器中利用 PHP 字串函式、正規表示式和網頁功能。
- **批次檔教學與範例集合** — 精選的批次檔技術、教學指南和範例腳本集合，涵蓋常見的 Windows 管理工作。主題包括資產盤點腳本、登入腳本、管理工具、網路管理和社群貢獻的解決方案。「窮人的管理工具」提供商業公用程式的輕量型純批次替代方案 (PMChoice, PMSleep, PMSoon 等)。
- **對管理員有用的 NT 命令** — 管理批次指令碼中常用的 NT 命令參考，包括 NET 命令、SC (服務控制)、TASKLIST/TASKKILL、WMIC、REG、SCHTASKS、ROBOCOPY、ICACLS 以及系統資訊公用程式。
