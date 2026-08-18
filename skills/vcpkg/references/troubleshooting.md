# vcpkg: 疑難排解與相依性生命週期 (Troubleshooting & Dependency Lifecycle)

`vcpkg` 技能的參考資料。當使用者遇到 vcpkg 建構失敗、找不到套件錯誤、需要讀取建構記錄或管理相依性生命週期（移除、變更功能、取代函式庫、清理快取）時使用此內容。

## 讀取 vcpkg 建構記錄

建構記錄儲存於：
```
<vcpkg-root>/buildtrees/<port-name>/
```

主要記錄檔：
- `config-<triplet>-out.log` — CMake 設定輸出
- `build-<triplet>-<dbg|rel>-<out|err>.log` — 常見建構記錄
- `install-<triplet>-<dbg|rel>-<out|err>.log` — 常見安裝記錄

確切名稱因連接埠和建構協助程式而異；使用 vcpkg 為失敗指令印出的路徑。

當建構失敗時，vcpkg 會印出相關記錄的路徑。從失敗步驟的 `-err.log` 檔案開始。

---

## 解決安裝後出現 package-not-found 的問題

如果 CMake 顯示 `Could not find a package configuration file provided by "X"`：

1. **檢查工具鏈檔案** — 確保已設定 `-DCMAKE_TOOLCHAIN_FILE=<vcpkg-root>/scripts/buildsystems/vcpkg.cmake`
2. **檢查三重態匹配** — 安裝的三重態必須與您的建構架構相符
3. **檢查套件名稱** — vcpkg 連接埠名稱可能與 CMake 套件名稱不同（例如，連接埠 `nlohmann-json` → `find_package(nlohmann_json)`）
4. **檢查已安裝清單** — 執行 `vcpkg list` 以確認該套件確實已安裝
5. **清除 CMake 快取** — 刪除 `CMakeCache.txt` 並重新設定

---

## 相依性生命週期

### 移除函式庫

1. 從 `vcpkg.json` → `"dependencies"` 陣列中將其移除
2. 執行 `vcpkg install` 進行協調（資訊清單模式會自動移除未使用的套件）

在傳統模式中：
```console
vcpkg remove boost-regex
vcpkg remove boost-regex --recurse  # 同時移除相依於它的項目
```

### 變更已安裝函式庫的功能

更新 `vcpkg.json` 中的功能：
```json
{
  "dependencies": [
    {
      "name": "curl",
      "features": ["ssl", "ssh"]
    }
  ]
}
```

然後執行 `vcpkg install` — vcpkg 將偵測到功能變更並重新建構。

在傳統模式中，安裝功能只會新增至已安裝的功能集中；省略的功能不會被移除。若要移除功能，請解除安裝 `curl`，然後以所需的功能重新安裝它。在使用 `--recurse` 之前先確認相依套件，因為它也會將它們一併移除。

### 使用另一個函式庫取代現有函式庫

1. 從 `vcpkg.json` 移除舊函式庫
2. 將新函式庫新增至 `vcpkg.json`
3. 執行 `vcpkg install` 進行協調
4. 更新您的原始碼：變更 CMakeLists.txt 中的 `#include` 指示詞、`find_package()` 呼叫與 `target_link_libraries()`

### 清理 vcpkg 快取

```powershell
# 移除建構樹
Remove-Item -Recurse -Force <vcpkg-root>\buildtrees

# 移除下載的封存檔
Remove-Item -Recurse -Force <vcpkg-root>\downloads

# 移除已安裝的套件（僅限傳統模式）
Remove-Item -Recurse -Force <vcpkg-root>\installed

# 移除套件建構產物
Remove-Item -Recurse -Force <vcpkg-root>\packages

# 在 CLI 資訊清單模式中，移除資訊清單根目錄安裝目錄
Remove-Item -Recurse -Force .\vcpkg_installed

# 搭配 CMake 整合，移除 <build-directory>\vcpkg_installed（或 VCPKG_INSTALLED_DIR）
```

```bash
rm -rf <vcpkg-root>/buildtrees
rm -rf <vcpkg-root>/downloads
rm -rf <vcpkg-root>/installed
rm -rf <vcpkg-root>/packages
# CLI 資訊清單模式；搭配 CMake 整合，使用 <build-directory>/vcpkg_installed（或 VCPKG_INSTALLED_DIR）
rm -rf ./vcpkg_installed
```
