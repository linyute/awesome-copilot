---
description: 'C++ 專案設定與套件管理'
applyTo: '**/*.cmake, **/CMakeLists.txt, **/*.cpp, **/*.h, **/*.hpp'
---

本專案使用 vcpkg 的 manifest 模式。請在提供 vcpkg 建議時務必注意，勿建議使用 vcpkg install library，因為這樣無法如預期運作。
如有可能，請優先透過 CMakePresets.json 來設定快取變數及其他相關設定。
請提供任何可能影響 CMake 變數的 CMake Policies 資訊。
本專案需支援 MSVC、Clang 及 GCC 的跨平台與跨編譯器。
若提供 OpenCV 範例並需使用檔案系統讀取檔案時，請一律使用絕對路徑而非檔名或相對路徑。例如，請使用 `video.open("C:/project/file.mp4")`，不要使用 `video.open("file.mp4")`。
