---
name: 'GitHub Actions Windows ARM64 wheel builder'
description: '使用 "windows-11-arm" runner 將原生 Windows ARM64 wheel 建構與測試新增至 Python 套件現有的 GitHub Actions 工作流程中。'
---

# GitHub Actions Windows ARM64 wheel builder

您是 CI/CD 專家。您的任務是使用 `windows-11-arm` runner 映像檔，將原生 Windows ARM64 wheel 建構新增至此儲存庫的 GitHub Actions 建構/發行工作流程。

## Context

許多 Python 套件儲存庫使用 GitHub Actions 工作流程來為 PyPI 產生平台 wheel。常見的目標包括 Linux x86_64/aarch64、macOS（universal2 或獨立的 x86_64/arm64）和 Windows AMD64 — 但通常缺少 Windows ARM64。

GitHub 現在提供了原生的 `windows-11-arm` runner，可以在不需要交叉編譯（cross-compilation）的情況下建構 ARM64 Windows wheel。

## Pre-flight Checks

在修改工作流程之前，請確認以下事項：

### cibuildwheel 版本（如果適用）
如果工作流程使用 `cibuildwheel`，原生 `win_arm64` 支援需要 cibuildwheel ≥ 2.11.2。如果工作流程鎖定了舊版本（例如在 `requirements-dev.txt` 或 action 的 `version` 輸入中），請在繼續之前將其更新為相容的發行版本。

### Python 版本支援
並非所有 Python 版本都提供 Windows ARM64 wheel。請檢查所使用的特定建構工具（例如 cibuildwheel、maturin、原始 pip）的文件，以確定 `win_arm64` 支援的最低 Python 版本。在建構 ARM64 矩陣項目時，請省略不受支援的 Python 版本 — 嘗試建構不受支援的版本將會失敗。建議更新目標 `strategy.exclude` 項目或條件矩陣規則，而不是進行會變更受支援 AMD64 組合的廣泛變更。請勿假設 Windows AMD64 所使用的 Python 版本範圍對 ARM64 也同樣有效。

## Instructions

### 1. 尋找建構工作流程

尋找建構 wheel 的 GitHub Actions 工作流程檔案（通常是 `.github/workflows/build.yml` 或類似檔案）。尋找呼叫 `cibuildwheel` 或以其他方式產生 `.whl` 成品的工作（job）。

某些儲存庫會將實際的建構邏輯封裝在可重複使用的工作流程（`workflow_call`）或 `.github/actions/` 下的複合式 action（composite action）中。請追蹤這些間接調用並更新 wheel 建構邏輯的實際來源，而不僅僅是包裝工作流程。

如果儲存庫已經包含 Windows ARM64 項目或工作，請勿重複新增。相反地，請將現有的設定進行標準化或修正，以便其使用正確的 runner 和特定架構設定。

### 2. 新增 Windows ARM64 項目至建構矩陣

如果工作流程對每個平台使用獨立的工作，而不是使用策略矩陣（strategy matrix），請藉由複製現有的 Windows AMD64 工作並僅修改特定平台欄位，來建立一個 Windows ARM64 同級工作。

在 wheel 建構工作的策略矩陣中，為 Windows ARM64 新增一個新項目。請遵循矩陣中已使用的命名慣例（例如，如果現有項目使用像是 `win_amd64`、`manylinux_x86_64` 等識別碼，請選擇一致的名稱，例如 `win_arm64`）。

如果工作流程已經使用 `strategy.exclude` 或類似的條件邏輯，請更新這些規則，以便明確排除不受支援的 Windows ARM64 與 Python 組合，同時不影響現有支援的平台。

**`CIBW_BUILD` 篩選器：** 如果工作流程將 `CIBW_BUILD` 設定為明確的 wheel 標記白名單（例如 `cp39-win_amd64 cp310-win_amd64 ...`），則也必須將 ARM64 項目新增至該清單（例如 `cp39-win_arm64 cp310-win_arm64 ...`）。如果沒有這樣做，即使在正確的 runner 上執行，cibuildwheel 也會默默地跳過 ARM64 wheel。請使用矩陣變數或條件運算式來設定每個平台的適當值，以使現有的 AMD64 項目不受影響。

### 3. 將新項目對應至 `windows-11-arm` runner

確保新的矩陣項目解析為 `windows-11-arm` runner。請遵循工作流程中已用於將矩陣項目對應至 runner 標籤的相同模式（例如，透過 `include` 區塊、條件運算式，或矩陣中直接指定的 `os` 值）。

**重複使用現有的矩陣變數：** 如果傳遞給 Windows AMD64/x64 建構的 `runs-on` runner 映像檔是透過矩陣變數提供的（例如 `runs-on: ${{ matrix.os }}` 或 `runs-on: ${{ matrix.runner }}`），請透過**同一個**矩陣變數來設定 ARM64 項目的映像檔（例如，新增一個帶有 `os: windows-11-arm` 的矩陣項目）。當現有的矩陣變數可以直接帶入 `windows-11-arm` 時，請勿在 `runs-on` 中引入複雜的條件運算式來選取 ARM64 映像檔。

**`windows-latest` 區分：** 如果現有的 Windows AMD64 工作使用 `windows-latest` 作為其 runner 標籤，請勿對 ARM64 項目使用 `windows-latest` 的變體。請務必將 ARM64 runner 明確設定為 `windows-11-arm`，以便選取正確的原生硬體。

### 4. 當工作流程已為 x64 設定 MSVC 時，為 ARM64 設定 MSVC

如果工作流程使用 `ilammy/msvc-dev-cmd`（或類似的 action）來為 x64 Windows wheel 建構設定 MSVC，請在 `windows-11-arm` runner 上為 ARM64 新增一個等效的 MSVC 設定步驟。新步驟應使用 `arm64` 架構，並設定條件以便其僅在 ARM64 runner 上執行。

同時，也要對現有的 x64 MSVC 設定步驟進行保護（guard），使其僅在原始的 Windows 工作/項目上執行，而不在 `windows-11-arm` 上執行。建議使用基於矩陣或工作 Metadata 的條件（例如平台 ID、架構或目標），而不是像 `runner.os == 'Windows'` 這樣廣泛的檢查或寫死的 runner 標籤檢查。這可確保每個項目僅設定其實際需要的 MSVC 工具鏈。

**直接呼叫 Visual Studio 指令碼：** 某些工作流程會直接呼叫 Visual Studio 開發人員環境指令碼，而不是使用 GitHub Action（例如 `call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\Common7\Tools\VsDevCmd.bat"` 或 `vcvarsall.bat`）。`windows-11-arm` runner 隨附 Visual Studio 2022，且可能未安裝 VS2019 或可能缺少 ARM64 工具鏈支援。在建立 ARM64 工作或矩陣項目時，請檢查是否有寫死 VS2019 指令碼的實體路徑，並將其更新為對應的 VS2022 路徑：

- `C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\...` → `C:\Program Files\Microsoft Visual Studio\2022\Enterprise\...`
- 將 `-arch=` 引數變更為 `arm64`（例如 `-arch=amd64` → `-arch=arm64`）。

請注意，VS2022 安裝在 `Program Files` 下（而非 `Program Files (x86)`）。如果現有的 x64 工作和 ARM64 工作是分開的，請僅變更 ARM64 工作中的路徑 — 保持現有 x64 工作對 VS2019 的引用不變。如果它們透過矩陣共享步驟，請使用矩陣變數或條件運算式來為每個項目選取正確的 Visual Studio 路徑和架構。

### 5. 當指定架構時，傳遞 `arm64` 給 `actions/setup-python`

如果工作流程中的 `actions/setup-python` 步驟包含 `architecture` 選項（例如 `architecture: x64`），請確保 ARM64 矩陣項目將 `arm64` 作為架構值傳遞。請使用矩陣變數或條件運算式，以使現有項目不受影響。

如果 `setup-python` 步驟完全沒有指定 `architecture` 選項，請勿新增該選項。

**`setup-python` 版本支援：** 如果現有的 Windows AMD64 工作使用 `setup-python` action，它對 Windows ARM64 僅支援 Python 3.11 或更新版本。

### 6. 針對 ARM64 使用正確的 Rust/cargo/maturin 目標

當工作流程建構 Rust 元件時（透過 `maturin`、`setuptools-rust`、原始 `cargo` 或透過使用 `rustup` 新增 Rust 目標），請確保 ARM64 項目使用目標 `aarch64-pc-windows-msvc`。這是原生 Windows ARM64 建構的正確 Rust 目標三元組（target triple）。

**針對 Rust 目標，請務必使用完整的 `aarch64-pc-windows-msvc` 三元組 — 絕不要使用 `arm64` 或簡寫形式 `aarch64`。** `arm64` 是其他 ARM64 上下文中的有效值（例如 `actions/setup-python` 的 `architecture` 輸入、MSVC `arch` 或 `CIBW_ARCHS`），但它**不應該**被用作 Rust 目標。**請在每個 Rust 目標位置使用 `aarch64-pc-windows-msvc`。**

- 每當指定 Rust 目標時 — 包括 `rustup target add`（例如 `rustup target add aarch64-pc-windows-msvc`） — 請在 ARM64 項目中使用 `aarch64-pc-windows-msvc`。如果使用 `setuptools-rust`（或其他間接呼叫 cargo 的工具），通常會在設定步驟或 `CIBW_BEFORE_ALL` 中以此方式安裝目標；請確保在該處新增了 ARM64 目標。
- 在 `maturin-action` 中，將 `target` 輸入設定為 `aarch64-pc-windows-msvc`。當透過諸如 `PyO3/maturin-action` 的 action 執行建構時，請使用同一個目標（將其 `target` 輸入設定為 `aarch64-pc-windows-msvc`）。
- 對於原始的 `cargo build` 或 `cargo test` 呼叫，請傳遞 `--target aarch64-pc-windows-msvc`。

### 7. 測試指令 — 與現有的 x64 Windows 行為保持一致

除非工作流程已經為 x64 建構定義了 Windows 特定的測試設定，否則**請勿**新增 ARM64 特定的測試指令或覆寫（例如 `CIBW_TEST_COMMAND_WINDOWS`）。ARM64 建構應該獲得與現有 Windows AMD64 建構相同的測試處理。

如果現有的工作流程使用通用的 `CIBW_TEST_COMMAND`（甚至是呼叫 `bash` 的指令）且未為 x64 新增 Windows 特定的變體，則也不要為 ARM64 新增。保持這兩個 Windows 目標對稱。

### 8. 為 ARM64 架構設定 cibuildwheel（如果使用 cibuildwheel）

檢查 cibuildwheel 是否需要明確的 `CIBW_ARCHS_WINDOWS` 覆寫。在 `windows-11-arm` runner 上進行原生建構時，cibuildwheel 的預設自動偵測就已經會以 ARM64 為目標。**僅在工作流程已經設定該變數，或需要覆寫預設行為時，才新增 `CIBW_ARCHS_WINDOWS`**（例如，如果 AMD64 和 ARM64 共享同一個 runner，且必須透過矩陣條件來區分架構）。

如果需要覆寫，請使用與矩陣項目綁定的條件運算式，以使現有的 AMD64 建構不受影響。將其置於任何現有的 `CIBW_ARCHS_LINUX` 或 `CIBW_ARCHS_MACOS` 變數旁邊。如果不需要覆寫，請勿新增。

### 9. 審查 `CIBW_BEFORE_BUILD` 和 `CIBW_BEFORE_ALL` 指令碼（如果使用 cibuildwheel）

如果工作流程定義了用來安裝原生相依套件的 `CIBW_BEFORE_BUILD` 或 `CIBW_BEFORE_ALL` 指令（例如透過 `choco install`、`vcpkg install` 或類似的套件管理工具），請確認這些套件及其版本在 ARM64 上是否可用。視需要更新這些指令碼 — 例如，指定 ARM64 套件變體或不同的安裝指令 — 並對其設定僅在 ARM64 矩陣項目中生效，以使現有的建構不受影響。

### 10. 在 ARM64 上從 PyTorch 下載索引安裝 PyTorch 相依套件

如果建構或測試步驟透過 `pip` 安裝 PyTorch 相依套件（例如 `torch`、`torchvision`、`torchaudio`），請注意 — 截至 2026 年 5 月 — PyTorch 尚未在 PyPI 上為 Windows ARM64（`win_arm64`）發佈 wheel。因此，在 `windows-11-arm` runner 上執行單純的 `pip install torch` 將會失敗或抓到不相容的 wheel。

對於 ARM64 項目，請藉由新增索引 URL，從 PyTorch 下載索引而非 PyPI 安裝 PyTorch 相依套件：

- `https://download.pytorch.org/whl` — 用於預設（例如 CUDA 標記）的 wheel。
- `https://download.pytorch.org/whl/cpu` — 用於僅限 CPU 的建構變體。

將其透過 `--index-url`（或 `--extra-index-url`）傳遞給 `pip`，例如 `pip install torch --index-url https://download.pytorch.org/whl/cpu`。請使用矩陣變數或條件運算式，以使該索引 URL 僅套用於 ARM64 項目，而現有的 x64/Linux/macOS 安裝（可以從 PyPI 解析 PyTorch）不受影響。

### 11. 當工作流程建構 LLVM 時，為 ARM64 設定編譯器環境變數

如果工作流程中手動建構 LLVM 或相依於 LLVM 的專案（例如透過 CMake），請確保 ARM64 工作設定了適當的編譯器環境變數，以便在原生 Windows ARM64 建構中使用以 LLVM 為基礎的工具鏈。

- 設定 `CC=clang-cl` 和 `CXX=clang-cl` 環境變數（或 CMake 中的等效設定 `-DCMAKE_C_COMPILER=clang-cl -DCMAKE_CXX_COMPILER=clang-cl`）。
- 如果需要 Fortran 編譯器，請設定 `FC=flang`（或 CMake 中的等效設定 `-DCMAKE_Fortran_COMPILER=flang`）。
- 請使用矩陣變數或條件運算式，以使可能使用不同編譯器（例如 `gfortran`）的現有 x64 Windows、Linux 或 macOS 項目不受影響。

### 12. 驗證上傳的成品名稱是否不重複

如果上傳的成品名稱是衍生自矩陣（例如 `wheels-${{ matrix.platform_id }}-${{ matrix.python }}`），請確保新的 `win_arm64` 項目能產生一個不重複的成品名稱。大多數基於矩陣的命名配置都會自動處理此問題。

### 13. 當已存在 x64 Windows 測試時，新增 Windows ARM64 測試執行

在 `.github/workflows/` 下的所有工作流程檔案中，搜尋在 Windows x64 上執行測試的工作（例如 `windows-latest`、`windows-2022`、`windows-2019` 或任何具有 `x64` 架構的 runner）。這些測試工作可能與 wheel 建構位於同一個工作流程檔案中，也可能位於獨立的工作流程檔案中（例如 `ci.yml`、`tests.yml`、`test.yml`）。

如果存在 Windows x64 測試工作（不論是在同一個工作流程檔案還是不同檔案中），請鏡像現有的 Windows x64 測試設定 — 相同的步驟、相同的相依套件、相同的測試指令 — 僅變更 runner 和特定架構的設定，並且只有在步驟和測試與 Windows ARM64 不相容時才跳過它們。

當新增 ARM64 測試項目時：

- 使用 `windows-11-arm` 作為 runner。
- 如果 `actions/setup-python` 指定了 `architecture: x64`，請新增矩陣變數或條件，以便 ARM64 項目傳遞 `architecture: arm64`。如果未指定 `architecture`，則不要新增。
- 僅包含 Windows ARM64 支援的 Python 版本（對於 `actions/setup-python` 為 3.11+）。如果 x64 矩陣測試了較舊的 Python 版本，請使用 `strategy.exclude`、矩陣條件，或為 ARM64 建構較窄的版本清單，以將其從 ARM64 項目中排除。
- 如果測試工作使用 MSVC 設定（例如 `ilammy/msvc-dev-cmd`），請套用步驟 4 中相同的 ARM64 MSVC 指引。
- 如果測試工作安裝原生相依套件（例如透過 `choco`、`vcpkg`），請按照步驟 9 中所述驗證 ARM64 可用性。
- 確保任何成品下載或上傳名稱保持不重複。

如果在任何工作流程檔案中都不存在 Windows x64 測試工作，請跳過此步驟。

### 14. 保持無關的工作不變

除非直接受到新平台項目的影響，否則請勿修改原始碼發行版（source-distribution）的建構、純 Python wheel 建構或發布工作。

### 15. 驗證

- 確認工作流程 YAML 是有效的（例如，執行 `actionlint`）。
- 如果儲存庫存取權限允許，請使用儲存庫的常規 CI 驗證流程或測試建構，以確認新的 ARM64 矩陣/工作項目已正確連接。如果目前環境中無法觸發 CI，仍請確保設定在內部是一致的且已準備好執行。

## 驗收標準

- wheel 建構矩陣或工作集包含一個在 `windows-11-arm` 上執行的 Windows ARM64 項目。
- 儲存庫的 wheel 建構路徑（`cibuildwheel`、`maturin` 或等效工具）已設定為在該 runner 上產生 ARM64 wheel。
- 所有現有的平台建構（Linux、macOS、Windows AMD64）保持不變；先前支援的成品沒有退化（regress），並且為所有支援的組合新增了 ARM64 成品。
- 在所有矩陣組合中，成品名稱保持不重複。
- 工作流程 YAML 語法有效。
- 未嘗試建構任何不受支援的 Python 版本 ARM64 wheel。
- 如果有任何工作流程檔案包含 Windows x64 測試工作，則已新增使用 `windows-11-arm` 的對應 Windows ARM64 測試工作或矩陣項目，並排除了不受支援的 Python 版本。
- 僅在工作流程已包含根據架構衍生或修改工作名稱的邏輯時，才擴充工作名稱邏輯，使 Windows ARM64 項目產生一個獨特的、特定於架構的名稱（例如能將其識別為 `arm64`/`win_arm64` 的名稱）。如果工作流程沒有與架構相關的工作命名邏輯，則工作名稱保持不變。
- 重新執行 agent 不會重複建立現有的 Windows ARM64 項目或工作。
