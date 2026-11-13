---
description: 'C++ 專案設定與套件管理'
applyTo: '**/*.cmake, **/CMakeLists.txt, **/CMakePresets.json, **/CMakeUserPresets.json, **/vcpkg.json, **/vcpkg-configuration.json'
---

在提出變更建議前，請先檢視專案現有的 CMake presets 與 vcpkg 設定。當存在 `vcpkg.json` 時，請在該資訊清單中維護相依性，並透過 CMake 設定或不含套件名稱的 `vcpkg install` 來還原它們；請勿以傳統模式的 `vcpkg install <library>` 指令取代。
建議將共用的快取變數與工具鏈設定放在 `CMakePresets.json` 中。將特定機器的路徑放在未追蹤的 `CMakeUserPresets.json` 中，並使用專案 CMake 版本所支援的 presets 結構描述。在首次呼叫 `project()` 之前設定 `CMAKE_TOOLCHAIN_FILE`，最好透過 preset 設定。
當專案使用 vcpkg 版本控制時，請保留明確的登錄檔或 `builtin-baseline` 版本；應刻意更新這些版本，而非在無關變更時順便更新。
提供可能影響所建議或提及之 CMake 變數的任何 CMake 原則相關資訊。
此專案必須支援跨平台與跨編譯器，適用於 MSVC、Clang 與 GCC。
針對 OpenCV 檔案系統範例，請遵循專案的資產路徑慣例。若範例必須獨立於工作目錄，請接受絕對路徑作為輸入，而非硬編碼開發人員特定的 Windows 路徑。

參考資料：[vcpkg CMake 整合](https://learn.microsoft.com/en-us/vcpkg/users/buildsystems/cmake-integration)、[資訊清單模式](https://learn.microsoft.com/en-us/vcpkg/users/manifests)、[CMake presets](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html)。