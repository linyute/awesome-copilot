# vcpkg: 自訂登錄檔與覆疊連接埠 (Custom Registries & Overlay Ports)

`vcpkg` 技能的參考資料。當使用者詢問建立或設定自訂登錄檔、建立覆疊連接埠 (overlay ports)、使用私人套件摘要或設定 `vcpkg-configuration.json` 登錄檔時使用此內容。

## 私人 / 自訂登錄檔安裝

1. 在 `vcpkg.json` 旁建立 `vcpkg-configuration.json`：
```json
{
  "registries": [
    {
      "kind": "git",
      "repository": "https://github.com/your-org/vcpkg-registry",
      "baseline": "<commit-sha>",
      "packages": ["company-utils", "internal-lib"]
    }
  ],
  "default-registry": {
    "kind": "builtin",
    "baseline": "<commit-sha>"
  }
}
```

2. 然後在 `vcpkg.json` 中正常新增相依性：
```json
{
  "dependencies": ["company-utils"]
}
```

登錄檔項目中的 `"packages"` 陣列控制從該登錄檔解析哪些套件。未列出的套件會退回至 `default-registry`。

---

## 在 `vcpkg-configuration.json` 中設定登錄檔

```json
{
  "default-registry": {
    "kind": "builtin",
    "baseline": "<vcpkg-commit-sha>"
  },
  "registries": [
    {
      "kind": "git",
      "repository": "https://github.com/your-org/vcpkg-registry.git",
      "baseline": "<registry-commit-sha>",
      "packages": ["your-package-1", "your-package-2"]
    }
  ]
}
```

將此檔案放在專案根目錄中 `vcpkg.json` 的旁邊。

---

## 建立覆疊連接埠 (Overlay Port)

覆疊連接埠可在本機覆寫或新增連接埠。目錄結構：
```
my-overlays/
  telemetry-sdk/
    portfile.cmake
    vcpkg.json
```

**`vcpkg.json`**（連接埠 Metadata）：
```json
{
  "name": "telemetry-sdk",
  "version": "1.0.0",
  "description": "Internal telemetry SDK",
  "dependencies": [
    "curl",
    "nlohmann-json",
    { "name": "vcpkg-cmake", "host": true },
    { "name": "vcpkg-cmake-config", "host": true }
  ]
}
```

**`portfile.cmake`**（建構說明）：
```cmake
vcpkg_from_github(
    OUT_SOURCE_PATH SOURCE_PATH
    REPO your-org/telemetry-sdk
    REF v1.0.0
    SHA512 <hash>
)

vcpkg_cmake_configure(SOURCE_PATH "${SOURCE_PATH}")
vcpkg_cmake_install()
vcpkg_cmake_config_fixup()

file(REMOVE_RECURSE "${CURRENT_PACKAGES_DIR}/debug/include")
vcpkg_install_copyright(FILE_LIST "${SOURCE_PATH}/LICENSE")
```

傳統模式：`vcpkg install telemetry-sdk --overlay-ports=./my-overlays`

資訊清單模式：將 `telemetry-sdk` 新增至 `vcpkg.json`，然後執行 `vcpkg install --overlay-ports=./my-overlays`。
或在 `vcpkg-configuration.json` 中設定：
```json
{
  "overlay-ports": ["./my-overlays"]
}
```

---

## 預設功能 (Default Features)

控制相依性的現有預設功能是否已啟用，並在專案資訊清單中請求額外功能：
```json
{
  "dependencies": [
    {
      "name": "curl",
      "default-features": true,
      "features": ["ssl", "http2"]
    }
  ]
}
```

若要**停用**預設功能：`"default-features": false`

在 portfile 的 `vcpkg.json` 中，預設功能列在下列欄位下：
```json
{
  "name": "curl",
  "default-features": ["ssl", "http2"],
  "features": {
    "ssl": { "description": "SSL/TLS support" },
    "http2": { "description": "HTTP/2 support" }
  }
}
```
