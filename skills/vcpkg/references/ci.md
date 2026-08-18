# vcpkg: CI/CD 與 DevOps

`vcpkg` 技能的參考資料。當使用者詢問在 CI/CD 管道中使用 vcpkg、設定二進位快取、產生 SBOM 或自動化相依性更新（GitHub Actions、Azure DevOps、二進位快取設定、CI 最佳化）時使用此內容。

## 二進位快取 (Binary Caching)

設定二進位快取以避免重新建構套件：

**Azure Blob Storage:**
```powershell
$env:VCPKG_BINARY_SOURCES = "clear;x-azblob,https://myaccount.blob.core.windows.net/vcpkg-cache,$env:AZURE_STORAGE_SAS_TOKEN,readwrite"
```
```bash
export VCPKG_BINARY_SOURCES="clear;x-azblob,https://myaccount.blob.core.windows.net/vcpkg-cache,$AZURE_STORAGE_SAS_TOKEN,readwrite"
```

**GitHub Packages (NuGet):**
```powershell
$env:VCPKG_BINARY_SOURCES = "clear;nuget,https://nuget.pkg.github.com/your-org/index.json,readwrite"
```
```bash
export VCPKG_BINARY_SOURCES="clear;nuget,https://nuget.pkg.github.com/your-org/index.json,readwrite"
```
對於 GitHub Packages，還要設定 NuGet 驗證（例如在 CI 中透過 `GITHUB_TOKEN`，或在本地開發中使用 PAT/憑證提供者）。在 GitHub Actions 中，為快取寫入者授與 `permissions: packages: write`（或為唯讀還原授與 `packages: read`）。將認證保留在機密以及使用者/機器 NuGet 設定中，不要放在已認可的檔案中。

**易於 CI 整合（跨平台）的 GitHub Actions 模式：**
```yaml
permissions:
  contents: read
  packages: write

env:
  VCPKG_BINARY_SOURCES: clear;nuget,https://nuget.pkg.github.com/your-org/index.json,readwrite
```
針對 NuGet 驗證使用存放庫/組織機密，而非將認證儲存在存放庫中。

**本機檔案系統：**
```powershell
$env:VCPKG_BINARY_SOURCES = "clear;files,C:\vcpkg-cache,readwrite"
```
```bash
export VCPKG_BINARY_SOURCES="clear;files,/var/tmp/vcpkg-cache,readwrite"
```

**在 CI 與本機開發之間共用：** 在兩種環境中使用相同的遠端快取來源，並僅切換最後的模式權杖：CI 使用 `readwrite`，開發人員使用 `read`。

---

## 產生 SBOM (軟體物料清單)

vcpkg 在一般的原始碼建構期間會針對每個連接埠發出 SPDX SBOM 檔案；不需要特殊的 SBOM 旗標。
```console
vcpkg install
```

每個已安裝的連接埠會寫入：
```text
<installed-root>/<triplet>/share/<port>/vcpkg.spdx.json
```

`<installed-root>` 取決於整合模式：
- CLI 資訊清單模式：`<manifest-root>/vcpkg_installed`
- CMake 整合（預設）：`${CMAKE_BINARY_DIR}/vcpkg_installed`（若被覆寫則為 `VCPKG_INSTALLED_DIR`）
- MSBuild 整合（預設）：`$(VcpkgManifestRoot)\vcpkg_installed`（若被覆寫則為 `$(VcpkgInstalledDir)`）

如果您需要單一彙總的 SBOM，使用 `vcpkg list` 列舉已安裝的連接埠，並在您的 SBOM 管道中合併/轉換它們個別連接埠的 SPDX 檔案。

---

## 自動化相依性更新

方案 1：**Dependabot** (GitHub) — 設定 `.github/dependabot.yml`：
```yaml
version: 2
updates:
  - package-ecosystem: "vcpkg"
    directory: "/"
    schedule:
      interval: "weekly"
```

方案 2：**基於指令碼** — 建立排程的 CI 作業：
1. 更新 vcpkg 複製存放庫 (`git pull`)
2. 取得新的基準線 (`git rev-parse HEAD`)
3. 更新 `vcpkg.json` 中的 `builtin-baseline`
4. 執行 `vcpkg install` 進行驗證
5. 建立包含變更的 PR

---

## 多三重態 CI 測試

在 GitHub Actions 工作流程中巢狀於 `jobs.<job-id>` 下方的此作業定義片段，可用於跨多個三重態進行測試：
```yaml
runs-on: ${{ matrix.os }}
strategy:
  matrix:
    triplet: [x64-windows, x64-linux, x64-osx]
    include:
      - triplet: x64-windows
        os: windows-latest
      - triplet: x64-linux
        os: ubuntu-latest
      - triplet: x64-osx
        os: macos-latest

steps:
  - uses: actions/checkout@v4
  - name: Clone vcpkg
    run: git clone https://github.com/microsoft/vcpkg
  - name: Bootstrap vcpkg (Windows)
    if: runner.os == 'Windows'
    shell: pwsh
    run: .\vcpkg\bootstrap-vcpkg.bat
  - name: Bootstrap vcpkg (Linux/macOS)
    if: runner.os != 'Windows'
    run: ./vcpkg/bootstrap-vcpkg.sh
  - name: Install dependencies (Windows)
    if: runner.os == 'Windows'
    shell: pwsh
    run: .\vcpkg\vcpkg.exe install --triplet ${{ matrix.triplet }}
  - name: Install dependencies (Linux/macOS)
    if: runner.os != 'Windows'
    run: ./vcpkg/vcpkg install --triplet ${{ matrix.triplet }}
```
