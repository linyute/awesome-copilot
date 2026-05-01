# Cygwin 參考 (Cygwin Reference)

Cygwin 提供了一套龐大的 GNU 和開源工具，其功能與 Windows 上的 Linux 發行版相似，外加一個 POSIX API DLL (`cygwin1.dll`)，以實現實質上的 Linux API 相容性。

## 文件 (Documentation)

- [Cygwin 使用者指南 (Cygwin User's Guide)](https://cygwin.com/cygwin-ug-net.html) — 詳盡的官方文件
- [Cygwin 常見問題集 (Cygwin FAQ)](https://cygwin.com/faq.html)
- [Cygwin 首頁 (Cygwin Homepage)](https://cygwin.com/)

## 使用者指南 — 目錄

### 第 1 章：Cygwin 概觀 (Cygwin Overview)

- **它是什麼？ (What is it?)** — 適用於 Windows 的 POSIX 相容層和 GNU 工具集
- **快速入門指南（Windows 使用者）** — 為熟悉 Windows 的使用者準備的入門指南
- **快速入門指南（UNIX 使用者）** — 為熟悉 UNIX/Linux 的使用者準備的入門指南
- **Cygwin 工具是自由軟體嗎？** — 授權許可 (GPL/LGPL)
- **Cygwin 專案簡史** — 起源與演進
- **Cygwin 功能亮點**
  - 權限與安全性
  - 檔案存取
  - 文字模式 vs. 二進位模式
  - ANSI C 函式庫
  - 處理程序建立 (Process Creation)
  - 訊號 (Signals)
  - Sockets 與 Select
- **新功能與變更** — 所有版本（1.7.x 至 3.6）的發行說明

### 第 2 章：設定 Cygwin (Setting Up Cygwin)

- **網際網路安裝** — 透過 `setup-x86_64.exe` 安裝、鏡像站點選擇、套件管理
- **環境變數** — 設定 `PATH`、`HOME`、`CYGWIN` 及其他環境變數
- **變更 Cygwin 的最大記憶體** — 透過登錄編輯器調整記憶體限制
- **國際化 (Internationalization)** — 區域設定與字元集設定
- **自訂 bash** — `.bashrc`、`.bash_profile` 及提示字元自訂

### 第 3 章：使用 Cygwin (Using Cygwin)

- **路徑名稱對應** — Cygwin 如何將 POSIX 路徑對應到 Windows 路徑（`/cygdrive/c` = `C:\`）
- **文字與二進位模式** — 換行符號處理（`\n` vs `\r\n`）、掛載選項
- **檔案權限** — NTFS 上的 POSIX 權限模型、ACL
- **特殊檔案名稱** — 裝置檔案、`/proc`、`/dev`、socket 檔案
- **POSIX 帳戶、權限與安全性** — 使用者/群組對應、`passwd`/`group` 檔案、`ntsec`
- **Cygserver** — 用於共享記憶體、訊息佇列、號誌 (Semaphore) 的背景服務
- **Cygwin 公用程式** — 內建命令列工具：
  - `cygcheck` — 系統資訊與套件診斷
  - `cygpath` — 在 POSIX 與 Windows 路徑之間轉換
  - `cygstart` — 使用關聯的 Windows 應用程式開啟檔案/URL
  - `dumper` — 建立 Windows 迷你傾印 (Minidump)
  - `getconf` — 查詢 POSIX 系統設定
  - `getfacl` / `setfacl` — 取得/設定檔案存取控制清單 (ACL)
  - `ldd` — 列出共享函式庫相依性
  - `locale` — 顯示區域設定資訊
  - `minidumper` — 寫入執行中處理程序的迷你傾印
  - `mkgroup` / `mkpasswd` — 從 Windows 帳戶產生群組/密碼檔項目
  - `mount` / `umount` — 管理 Cygwin 掛載表
  - `passwd` — 變更密碼
  - `pldd` — 列出處理程序載入的 DLL
  - `profiler` — 分析 Cygwin 程式效能
  - `ps` — 列出執行中的處理程序
  - `regtool` — 從殼層存取 Windows 登錄編輯器
  - `setmetamode` — 控制主控台中的 Meta 鍵行為
  - `ssp` — 單步分析器 (Single-step profiler)
  - `strace` — 追蹤系統呼叫與訊號
  - `tzset` — 列印 POSIX 相容的時區字串
- **區分大小寫的目錄** — 在 Windows 10+ 上啟用個別目錄的區分大小寫功能
- **在 Windows 中有效率地使用 Cygwin** — 整合秘訣、從 Cygwin 執行 Windows 程式

### 第 4 章：使用 Cygwin 進行程式設計 (Programming with Cygwin)

- **在 Cygwin 中使用 GCC** — 使用 Cygwin GCC 工具鏈編譯 C/C++ 程式
- **偵錯 Cygwin 程式** — 使用 GDB 和其他偵錯工具
- **建構與使用 DLL** — 在 Cygwin 下建立共享函式庫
- **定義 Windows 資源** — 資源檔與 `windres`
- **分析 Cygwin 程式效能** — 使用 `gprof` 和 `ssp` 進行效能分析

## 批次指令碼編寫的關鍵概念

### 從批次檔叫用 Cygwin

```batch
REM 從批次檔執行 Cygwin 命令
C:\cygwin64\bin\bash.exe -l -c "ls -la /home"

REM 為 Cygwin 將 Windows 路徑轉換為 POSIX
C:\cygwin64\bin\cygpath.exe -u "C:\Users\John Doe\Documents"

REM 將 POSIX 路徑轉換回 Windows
C:\cygwin64\bin\cygpath.exe -w "/home/jdoe/project"
```

### 常見環境變數

| 變數 | 用途 |
|----------|---------|
| `CYGWIN` | 執行階段選項（例如：`nodosfilewarning`, `winsymlinks:nativestrict`） |
| `HOME` | 使用者家目錄 |
| `PATH` | 必須包含 `/usr/local/bin:/usr/bin` 以執行 Cygwin 工具 |
| `SHELL` | 預設殼層（通常為 `/bin/bash`） |
| `TERM` | 主控台應用程式的終端機類型 |
