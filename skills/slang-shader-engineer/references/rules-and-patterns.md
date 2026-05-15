# Slang Shader — 規則、模式與範例

## 應做事項 (DOs)

- 當相容性或逐步採用很重要時，請保持 HLSL 相容性。
- 使用模組與匯入來分離可重複使用的數學、材質、光照、公用程式與階段邏輯。
- 使用介面與泛型，而非依賴預處理器的特化。
- 使用泛型條件約束來保持特化的意圖，並使診斷更清晰。
- 使用 `ParameterBlock<T>` 設計，根據更新頻率組織資源與常數。
- 將參數區塊設計與 D3D12 描述元表 (descriptor-table) 及 Vulkan 描述元集 (descriptor-set) 的預期相連結。
- 使階段輸入與輸出明確且語義清晰。
- 根據記憶體壓力、佔用率與同步需求，有意地選擇計算工作群組大小。
- 當依賴特定平台的功能時，請使用功能 (capabilities) 或明確的目標假設。
- 當功能受限於目標時（指標、wave 操作、特定後端偵錯支援），請明確指出。
- 保持資料配置、矩陣慣例、手性與座標空間轉換明確。
- 當涉及主機端繫結或配置生成時，請使用具備反射感知能力的設計。
- 在所有範例中提供編譯目標、進入點與預期的繫結。
- 在重寫著色器介面或資源配置之前，請先詢問現有的引擎慣例。
- 當交叉編譯與偵錯是工作流的一部分時，請保持產生的程式碼具備可讀性。
- 針對所有著色器程式碼輸出，請使用標記為 `slang` 的圍欄程式碼區塊。
- 為每個產生的著色器包含簡短的繫結摘要或主機端假設。
- 針對複雜的著色器，將輔助邏輯與進入點分離。
## 不應做事項 (DON'Ts)

- 請勿發明未記載的 Slang 語法、屬性或資源規則。
- 請勿將 `import` 當作 `#include` 對待，或假設巨集可以跨越模組邊界共享。
- 請勿假設所有後端都支援相同的功能、指標行為、wave 操作、導數 (derivatives) 或偵錯設施。
- 請勿在未說明的情況下硬編碼特定平台的假設。
- 當介面或泛型更合適時，請勿將預處理器作為特化的預設機制。
- 在未檢查主機端 API 與反射流程的情況下，請勿假設參數區塊配置或繫結慣例。
- 如果精準度、配置、ABI 或主機互通性取決於精確型別，請勿隨處使用隱式型別。
- 除非目標集明確支援（僅限 SPIR-V、C++、CUDA），否則請勿在可移植程式碼中使用指標。
- 請勿僅因為 Slang 支援，就假設自動微分 (autodiff)、光線追蹤或進階功能是可以接受的。
- 在未解釋影響的情況下，請勿更改階段語義、描述元配置或緩衝區封裝規則。
- 請勿盲目最佳化 — 請說明目標是降低頻寬、減少屏障 (barriers)、減少分歧 (divergence)、更好的快取局部性、更高的佔用率，還是更少的指令。
- 當請求顯然也需要主機整合詳細資訊時，請勿僅提供著色器程式碼。
- 請勿隱藏不確定性 — 如果遺漏詳細資訊，請詢問。

---

## 當以下任何一項不明確時請詢問開發者

當以下內容實質影響正確性時，請提出針對性的後續問題：

- **目標後端 (Target backend)** — D3D12, Vulkan, Metal, SPIR-V, GLSL, CUDA, CPU 或多目標。
- **著色器階段 / 管線形狀** — 頂點 (vertex)、像素 (pixel)、計算 (compute)、外殼 (hull)、網域 (domain)、光線追蹤階段等。
- **進入點名稱** — 是否必須符合現有的引擎介面。
- **座標慣例** — 手性、剪裁空間 (clip-space)、矩陣封裝、列/行優先 (row/column-major)。
- **資源繫結模型** — 描述元配置、參數區塊用法、反射工作流。
- **緩衝區配置** — 紋理格式、對齊、精準度需求。
- **效能目標** — 吞吐量、延遲、暫存器壓力、佔用率、編譯大小。
- **硬體層級 / 廠商限制**。
- **HLSL 相容性需求** — 程式碼是否必須保持 HLSL 相容？
- **C++ 主機結構** — 著色器是否必須符合現有的 C++ 資料結構或引擎繫結路徑？
- **進階功能可用性** — 此專案中是否允許使用自動微分、光線追蹤或 wave 操作？

> 僅要求所需的最少遺漏資訊 — 不要讓使用者一開始就面對長篇問卷。

---

## 輸出格式要求

當產生新的 Slang 程式碼時：

```slang
// Target: Vulkan / SPIR-V
// Stage: Vertex + Fragment
// Entry points: mainVS, mainPS
// Bindings: set=0 MaterialParams, set=1 PerFrame

module MyMaterial;

import CommonMath;

struct MaterialParams { ... };
ParameterBlock<MaterialParams> gMaterial;

[shader("vertex")]
VSOut mainVS(VSIn v) { ... }

[shader("fragment")]
float4 mainPS(VSOut v) : SV_Target { ... }
```

當審查或重構現有程式碼時：
1. 首先識別**正確性**風險。
2. 然後是**可移植性**問題。
3. 然後是**效能**問題。
4. 最後提供修訂後的程式碼及差異說明。

---

## 模組結構模式

### 小型專案 (單一檔案)
```slang
// shader.slang — 全功能合一；適用於原型開發
[shader("compute")]
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) { ... }
```

### 中型專案 (按領域拆分的模組)
```
shaders/
├── common/
│   ├── math.slang        — 向量/矩陣公用程式
│   └── sampling.slang    — 隨機/重要性取樣
├── materials/
│   ├── brdf.slang        — BRDF 介面與實作
│   └── material.slang    — IMaterial, ParameterBlock 設定
├── lighting/
│   └── light.slang       — ILight, PointLight, DirectionalLight
└── passes/
    ├── gbuffer.slang     — G-buffer 寫入階段
    └── deferred.slang    — 延遲著色階段
```

### 根據更新頻率組織參數區塊
```slang
// 每一幀更新一次
struct PerFrameParams { float4x4 view; float4x4 proj; float time; };
ParameterBlock<PerFrameParams> gPerFrame;

// 每個繪圖呼叫 (draw call) 更新一次
struct PerObjectParams { float4x4 model; };
ParameterBlock<PerObjectParams> gPerObject;

// 每次材質變更時更新
struct MaterialParams { float3 albedo; float metallic; float roughness; };
ParameterBlock<MaterialParams> gMaterial;
```

---

## 計算著色器 (Compute Shader) 檢查表

- [ ] 執行緒群組大小符合目標 GPU 的預期佔用率。
- [ ] 共用記憶體 (Shared memory) 使用量在硬體限制內（通常為 48–64 KB）。
- [ ] 記憶體存取模式已將銀行衝突 (bank conflicts) 降至最低，並最大化合併存取 (coalescing)。
- [ ] `GroupMemoryBarrierWithGroupSync()` 放置正確 — 在共用記憶體寫入之前及/或之後。
- [ ] 導致分歧的布林分支已降至最低或已移至內層迴圈之外。
- [ ] 分派維度 (Dispatch dimensions) 與執行緒 ID 索引對於 1D/2D/3D 資料是正確的。

---

## 交叉編譯檢查表

- [ ] 所使用的功能已列為在所有要求的目標後端上可用。
- [ ] 指標用法已受限於僅限 SPIR-V/C++/CUDA。
- [ ] Wave/子群組 (subgroup) 操作已使用功能門控 (capability-gated)。
- [ ] 矩陣配置假設是明確的 (`-matrix-layout-row-major` / `-matrix-layout-column-major`)。
- [ ] 如果偵錯 printf 未被普遍支援，則已使用目標防護 (target guards) 將其封裝。
- [ ] 進入點語義在各個目標之間是一致的。

---

## 此技能擅長處理的範例提示

- 「為 PBR 撰寫一組具備法線貼圖與參數區塊的 Slang 頂點與片段著色器。」
- 「為具備抗裂邊緣因數的自適應鑲嵌 (adaptive tessellation) 產生一組 Slang 外殼與網域著色器。」
- 「重構此 Slang 計算著色器以減少共用記憶體銀行衝突。」
- 「為具有獨立材質、光照與公用程式模組的渲染器建立 Slang 模組配置。」
- 「解釋如何為光照系統使用 Slang 介面與泛型，而不使用預處理器巨集。」
- 「給定此 C++ 渲染階段程式碼與此 Slang 著色器，找出繫結、配置或語義不匹配之處。」
- 「展示如何為 SPIR-V 編譯此 Slang 著色器，並從 C++ 反射其參數配置。」
- 「撰寫一個跨目標的 Slang 計算著色器，並明確標記後端敏感的假設。」
- 「審查此 Slang 模組結構，並告訴我匯入、泛型或參數區塊的使用是否正確。」
- 「解釋生產環境中 `var`、`let`、泛型、關聯型別與功能 (capabilities) 的實際應做與不應做事項。」
- 「為載入、編譯與繫結計算著色器設計一個具備反射感知能力的 Slang + C++ 工作流。」
- 「展示如何組織一個用於多目標編譯（至 DXIL、SPIR-V 與 Metal）的 Slang 套件。」

---

## C++ 與引擎整合筆記

當任務涉及引擎或主機程式碼時：

- 在對配置、反射、資源繫結或執行階段分派做出假設之前，請先檢查使用者的程式碼庫。
- 當可用時，請使用語義符號工具來檢查 C++ 類別、列舉、編譯路徑、渲染階段與描述元設定。
- 在更改著色器介面之前，請先檢查 Slang 輸出在主機應用程式中是如何被編譯、載入、反射、快取與繫結的。
- 針對 C++ 整合問題，優先使用精確的符號查閱與用法查詢，而非原始文字搜尋。
- 始終優先選擇對反射友善且對引擎友善的介面，而非僅限於著色器的巧妙抽象。

### Slang CMake 整合程式碼片段
```cmake
find_package(slang REQUIRED PATHS ${CMAKE_INSTALL_PREFIX} NO_DEFAULT_PATH)
target_link_libraries(yourLib PUBLIC slang::slang)
```

### Slang 編譯目標 (slangc CLI)
```bash
# 用於 Vulkan 的 SPIR-V
slangc shader.slang -target spirv -o shader.spv

# 用於 D3D12 的 DXIL
slangc shader.slang -target dxil -o shader.dxil

# GLSL
slangc shader.slang -target glsl -o shader.glsl

# CUDA
slangc shader.slang -target cuda -o shader.cu

# 列優先矩陣 (對於 xMath 風格的引擎很重要)
slangc shader.slang -target spirv -matrix-layout-row-major -o shader.spv

