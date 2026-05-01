# MSYS2 參考 (MSYS2 Reference)

MSYS2 提供了一套用於建構、安裝與執行原生 Windows 軟體的工具與函式庫。它使用 Pacman（源自 Arch Linux）進行套件管理。

## 入門指南 (Getting Started)

- [入門指南 (Getting Started)](https://www.msys2.org/)
- [什麼是 MSYS2？ (What is MSYS2?)](https://www.msys2.org/docs/what-is-msys2/)
- [誰在使用 MSYS2？ (Who Is Using MSYS2?)](https://www.msys2.org/docs/who-is-using-msys2/)
- [MSYS2 安裝程式 (MSYS2 Installer)](https://www.msys2.org/docs/installer/)
- [新聞 (News)](https://www.msys2.org/news/)
- [常見問題集 (FAQ)](https://www.msys2.org/docs/faq/)
- [支援的 Windows 版本與硬體](https://www.msys2.org/docs/windows_support/)
- [ARM64 支援](https://www.msys2.org/docs/arm64/)

## 環境 (Environments)

MSYS2 提供了多種針對不同使用情境的環境：

- [環境概觀 (Environments Overview)](https://www.msys2.org/docs/environments/)
- [GCC vs LLVM/Clang](https://www.msys2.org/docs/environments/#gcc-vs-llvmclang)
- [MSVCRT vs UCRT](https://www.msys2.org/docs/environments/#msvcrt-vs-ucrt)
- [變更日誌 (Changelog)](https://www.msys2.org/docs/environments/#changelog)

| 環境 | 字首 | 工具鏈 | C 執行階段 |
|-------------|--------|-----------|-----------|
| MSYS | `/usr` | GCC | cygwin |
| MINGW64 | `/mingw64` | GCC | MSVCRT |
| UCRT64 | `/ucrt64` | GCC | UCRT |
| CLANG64 | `/clang64` | LLVM | UCRT |
| CLANGARM64 | `/clangarm64` | LLVM | UCRT |

## 設定 (Configuration)

- [更新 MSYS2 (Updating MSYS2)](https://www.msys2.org/docs/updating/)
- [檔案系統路徑 (Filesystem Paths)](https://www.msys2.org/docs/filesystem-paths/)
- [符號連結 (Symlinks)](https://www.msys2.org/docs/symlinks/)
- [設定位置 (Configuration Locations)](https://www.msys2.org/docs/configuration/)
- [終端機 (Terminals)](https://www.msys2.org/docs/terminals/)
- [IDE 與文字編輯器 (IDEs and Text Editors)](https://www.msys2.org/docs/ides-editors/)
- [即時偵錯 (Just-in-time Debugging)](https://www.msys2.org/docs/jit-debugging/)

## 套件管理 (Package Management)

- [套件管理 (Package Management)](https://www.msys2.org/docs/package-management/)
- [套件命名 (Package Naming)](https://www.msys2.org/docs/package-naming/)
- [套件索引 (Package Index)](https://packages.msys2.org/)
- [存放庫與鏡像站點 (Repositories and Mirrors)](https://www.msys2.org/docs/repos-mirrors/)
- [套件鏡像站點 (Package Mirrors)](https://www.msys2.org/docs/mirrors/)
- [秘訣與技巧 (Tips and Tricks)](https://www.msys2.org/docs/package-management-tips/)
- [常見問題集 (FAQ)](https://www.msys2.org/docs/package-management-faq/)
- [pacman](https://www.msys2.org/docs/pacman/)

## 開發工具 (Development Tools)

- [在 MSYS2 中使用 CMake](https://www.msys2.org/docs/cmake/)
- [Autotools](https://www.msys2.org/docs/autotools/)
- [Python](https://www.msys2.org/docs/python/)
- [Git](https://www.msys2.org/docs/git/)
- [C/C++](https://www.msys2.org/docs/c/)
- [C++](https://www.msys2.org/docs/cpp/)
- [pkg-config](https://www.msys2.org/docs/pkgconfig/)
- [在 CI 中使用 MSYS2](https://www.msys2.org/docs/ci/)

## 套件開發 (Package Development)

- [建立新套件 (Creating a new Package)](https://www.msys2.org/dev/new-package/)
- [更新現有套件 (Updating an existing Package)](https://www.msys2.org/dev/update-package/)
- [套件指南 (Package Guidelines)](https://www.msys2.org/dev/package-guidelines/)
- [授權 Metadata (License Metadata)](https://www.msys2.org/dev/package-licensing/)
- [PKGBUILD](https://www.msys2.org/dev/pkgbuild/)
- [鏡像站點 (Mirrors)](https://www.msys2.org/dev/mirrors/)
- [MSYS2 金鑰圈 (Keyring)](https://www.msys2.org/dev/keyring/)
- [Python](https://www.msys2.org/dev/python/)
- [自動化建構流程 (Automated Build Process)](https://www.msys2.org/dev/build-process/)
- [漏洞通報 (Vulnerability Reporting)](https://www.msys2.org/dev/vulnerabilities/)
- [帳戶與所有權 (Accounts and Ownership)](https://www.msys2.org/dev/accounts/)

## Wiki

- [歡迎來到 MSYS2 wiki](https://www.msys2.org/wiki/Home/)
- [MSYS2 與 Cygwin 有何不同？](https://www.msys2.org/wiki/How-does-MSYS2-differ-from-Cygwin/)
- [MSYS2 介紹 (MSYS2-Introduction)](https://www.msys2.org/wiki/MSYS2-introduction/)
- [MSYS2 歷史](https://www.msys2.org/wiki/History/)
- [建立套件 (Creating Packages)](https://www.msys2.org/wiki/Creating-Packages/)
- [發行 (Distributing)](https://www.msys2.org/wiki/Distributing/)
- [啟動器 (Launchers)](https://www.msys2.org/wiki/Launchers/)
- [移植 (Porting)](https://www.msys2.org/wiki/Porting/)
- [重新安裝 MSYS2 (Re-installing MSYS2)](https://www.msys2.org/wiki/MSYS2-reinstallation/)
- [設定 SSHd](https://www.msys2.org/wiki/Setting-up-SSHd/)
- [簽署套件 (Signing Packages)](https://www.msys2.org/wiki/Signing-packages/)
- [你需要 Sudo 嗎？](https://www.msys2.org/wiki/Sudo/)
- [終端機 (Terminals)](https://www.msys2.org/wiki/Terminals/)
- [Qt Creator](https://www.msys2.org/wiki/GDB-qtcreator/)
- [代辦清單 (TODO LIST)](https://www.msys2.org/wiki/Devtopics/)
