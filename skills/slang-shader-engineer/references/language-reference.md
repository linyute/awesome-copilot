# Slang 語言參考

**來源：** [官方 Slang Shader 儲存庫](https://github.com/shader-slang/slang "Slang Shader repository")
**官方文件：** [官方 Slang Shader 線上文件](https://shader-slang.com/slang/user-guide/ "Slang Shader Online documentation")
**遊戲場：** [官方 Slang Shader 沙盒](https://shader-slang.com/slang-playground)

---

## 目錄

1. [型別](#型別)
2. [介面與泛型](#介面與泛型)
3. [自動微分](#自動微分)
4. [模組與存取控制](#模組與存取控制)
5. [功能系統](#功能系統)
6. [編譯 API](#編譯-api-c)
7. [反映 API](#反映-api)
8. [編譯目標](#編譯目標)
9. [目標相容性矩陣](#目標相容性矩陣)
10. [slangc 命令列](#slangc-命令列)

---

## 型別

### 純量
- 整數：`int8_t`、`int16_t`、`int`、`int64_t`、`uint8_t`、`uint16_t`、`uint`、`uint64_t`
- 浮點數：`half` (16 位元)、`float` (32 位元)、`double` (64 位元)
- 其他：`bool`、`void`

### 向量與矩陣
- `vector<T,N>` (N = 2–4)，便利型別：`float3`、`uint2` 等。
- `matrix<T,R,C>` (R,C = 2–4)，便利型別：`float3x4` 等。

### 陣列
```hlsl
int a[3];            // 固定大小
int a[] = {1,2,3};  // 推導大小
void f(int b[]) {}  // 未指定大小的參數
```
陣列擁有 `.getCount()`。

### 結構
```hlsl
struct MyData { int a; float b; }
// 自訂建構函式：
__init(int a_, float b_) { a = a_; b = b_; }
```

### 參數區塊
```hlsl
struct MaterialParams { float3 albedo; float metallic; float roughness; };
ParameterBlock<MaterialParams> gMaterial;
// 繫結至單一描述子表 (D3D12) 或描述子集 (Vulkan)
```

### 匯入
```hlsl
import foo;                  // 匯入 foo.slang
__exported import foo;       // 重新匯出 foo 的宣告
```
`import` ≠ `#include` — 無預處理器共享，每個模組僅載入一次。

---

## 介面與泛型

### 介面定義與實作
```hlsl
interface ILight
{
    LightSample sample(float3 position);
    static int  getCount();               // 介面中的靜態方法
    property int id { get; set; }        // 介面中的屬性
    int compute<T>(T val) where T : IBar; // 介面中的泛型方法
}

struct PointLight : ILight
{
    float3 position;
    LightSample sample(float3 hitPos) { ... }
    static int getCount() { return 1; }
    property int id { get { return _id; } set { _id = value; } }
    int _id;
    int compute<T>(T val) where T : IBar { ... }
}
```

### 多重符合 (Multiple Conformance)
```hlsl
struct MyType : IFoo, IBar { ... }
```

### 預設實作
```hlsl
interface IFoo
{
    int getVal() { return 0; }  // 預設
}
struct MyType2 : IFoo
{
    override int getVal() { return 1; }
}
```

### 泛型方法與條件約束
```hlsl
// 基本
float4 computeDiffuse<L : ILight>(float4 albedo, float3 P, float3 N, L light) { ... }

// where 子句 (多重條件約束)
struct MyType<T, U>
    where T: IFoo, IBar
    where U : IBaz<T>
{ ... }

// 簡化的條件約束語法
int myMethod<T:IFoo>(T arg) { ... }

// 泛型值參數
void g<let n : int>() { ... }

// 選用符合 (Optional conformance)
int myMethod<T>(T arg) where optional T: IFoo
{
    if (T is IFoo) { arg.myMethod(1.0); }
}
```

### 關聯型別 (Associated Types)
```hlsl
interface IMaterial
{
    associatedtype B : IBRDF;
    B evalPattern(float3 pos, float2 uv);
}

struct MyCoolMaterial : IMaterial
{
    typedef DisneyBRDF B;
    B evalPattern(float3 pos, float2 uv) { ... }
}
```

### 全域範圍泛型參數
```hlsl
type_param M : IMaterial;
M gMaterial;
```

---

## 自動微分

### 將函式標記為可微分
```hlsl
[Differentiable]
float2 foo(float a, float b) { return float2(a * b * b, a * a); }
```

### 正向模式
```hlsl
DifferentialPair<float> dp_a = diffPair(1.0, 1.0); // (值, 導數)
DifferentialPair<float> dp_b = diffPair(2.4, 0.0);
DifferentialPair<float2> out = fwd_diff(foo)(dp_a, dp_b);
float2 primal     = out.p;
float2 derivative = out.d;
```

### 反向模式
```hlsl
DifferentialPair<float> dp_a = diffPair(1.0);
DifferentialPair<float> dp_b = diffPair(2.4);
float2 dL_doutput = float2(1.0, 0.0);
bwd_diff(foo)(dp_a, dp_b, dL_doutput);
float dL_da = dp_a.d;
float dL_db = dp_b.d;
```

### 可微分型別
內建：`float`、`double`、`half`、及其向量/矩陣、可微分型別的陣列。
```hlsl
struct MyType : IDifferentiable { float x; float y; }
```

### 自訂導數
```hlsl
[Differentiable]
[ForwardDerivative(myForwardDeriv)]
[BackwardDerivative(myBackwardDeriv)]
float myFunc(float x) { ... }
```

---

## 模組與存取控制

### 定義模組
```hlsl
// scene.slang
module scene;
__include "scene-helpers";   // 非預處理器 — 無巨集共享

// scene-helpers.slang
implementing scene;
// 模組中的所有實體皆互相可見，無論包含順序為何
```

### 模組包含語法
```hlsl
__include dir.sub_file;           // → "dir/sub-file.slang"
__include "dir/sub-file.slang";
```

### 存取修飾詞
| 修飾詞     | 可見性                                  |
|------------|-----------------------------------------|
| `public`   | 到處（其他檔案、模組）                  |
| `internal` | 僅限相同模組（大部分的預設值）          |
| `private`  | 僅限相同型別與巢狀型別                  |

規則：
- 介面成員繼承介面的可見性。
- 舊版模組（無 `module` 宣告）將所有符號視為 `public`。
- 可見性較高的實體不能在其簽章中暴露可見性較低的實體。

---

## 功能系統 (Capabilities System)

### 宣告需求
```hlsl
[require(spvShaderClockKHR)]
[require(glsl, GL_EXT_shader_realtime_clock)]
[require(hlsl_nvapi)]
uint2 getClock() { ... }
// 組合：(spvShaderClockKHR | glsl + GL_EXT_shader_realtime_clock | hlsl_nvapi)
```

### 目標切換 (Target Switch)
```hlsl
void myFunc()
{
    __target_switch
    {
    case spirv: /* SPIR-V 路徑 */ break;
    case hlsl:  /* HLSL 路徑  */ break;
    }
}
```

### 功能別名
```hlsl
// 使用具名別名，而非拼寫完整的析取式 (disjunction)：
[require(sm_6_6)]
void myFunc() { ... }
```

### 常見功能原子 (Capability Atoms)
- 階段 (Stages)：`vertex`、`fragment`、`compute`、`hull`、`domain`、`geometry`
- API：`hlsl`、`glsl`、`spirv`、`cuda`、`cpp`
- 功能 (Features)：`_sm_6_7`、`SPV_KHR_ray_tracing`、`spvShaderClockKHR`、`hlsl_nvapi`

---

## 編譯 API (C++)

```cpp
// 1. 建立全域工作階段 (Global Session)
Slang::ComPtr<slang::IGlobalSession> globalSession;
slang::createGlobalSession(globalSession.writeRef());

// 2. 建立包含目標的工作階段
slang::SessionDesc sessionDesc = {};
slang::TargetDesc targetDesc   = {};
targetDesc.format   = SLANG_SPIRV;
targetDesc.profile  = SLANG_PROFILE_GLSL_450;
sessionDesc.targets      = &targetDesc;
sessionDesc.targetCount  = 1;
Slang::ComPtr<slang::ISession> session;
globalSession->createSession(sessionDesc, session.writeRef());

// 3. 載入模組與進入點
Slang::ComPtr<slang::IModule>     module;
Slang::ComPtr<slang::IEntryPoint> entryPoint;
session->loadModule("myModule", module.writeRef());
module->findEntryPointByName("main", entryPoint.writeRef());

// 4. 組合與連結
slang::IComponentType* components[] = { module, entryPoint };
Slang::ComPtr<slang::IComponentType> program, linkedProgram;
session->createCompositeComponentType(components, 2, program.writeRef());
program->link(linkedProgram.writeRef());

// 5. 取得核心程式碼 (Kernel Code)
Slang::ComPtr<slang::IBlob> kernelCode;
linkedProgram->getEntryPointCode(0, 0, kernelCode.writeRef());
```

### CMake 整合
```cmake
find_package(slang REQUIRED PATHS ${CMAKE_INSTALL_PREFIX} NO_DEFAULT_PATH)
target_link_libraries(yourLib PUBLIC slang::slang)
```

---

## 反映 API (Reflection API)

```cpp
slang::ProgramLayout* layout = program->getLayout(targetIndex);

// 列舉全域參數
int paramCount = layout->getParameterCount();
for (int i = 0; i < paramCount; i++)
{
    slang::VariableLayoutReflection* param = layout->getParameterByIndex(i);
    const char* name = param->getName();
    int binding      = param->getBindingIndex();
    int space        = param->getBindingSpace();
}

// 進入點佈局 (階段、變動參數)
slang::EntryPointLayout* ep = layout->getEntryPointByIndex(0);
slang::Stage stage = ep->getStage();
```

型別反映種類值：`Scalar`、`Vector`、`Matrix`、`Array`、`Struct`、`Resource`、`SamplerState` 等。

---

## 編譯目標

### D3D11 (DXBC)
階段：`vertex`、`hull`、`domain`、`geometry`、`fragment`  
暫存器：`b` (cbuffers)、`t` (SRVs)、`u` (UAVs)、`s` (samplers)

### D3D12 (DXIL)
新增：光線追蹤 (`raygeneration`、`closesthit`、`miss`、`anyhit`、`intersection`、`callable`)  
根簽章 (Root signatures)：根常數 (root constants)、描述子表 (descriptor tables)、根描述子 (root descriptors)。

### Vulkan (SPIR-V)
使用描述子集 (Descriptor sets) 而非描述子表。使用推播常數 (Push constants) 而非根常數。  
```hlsl
[[vk::binding(0, 1)]] Texture2D myTexture;
[[vk::push_constant]]  cbuffer PC { float4 color; };
[[vk::shader_record]]  cbuffer SR { uint id; };
```

### CUDA
- 原生指標支援、協作群組 (cooperative groups)、張量運算 (tensor ops)。
- 無圖形管線階段，有限的紋理運算。

### Metal
- 引數緩衝區 (Argument buffers)、基於圖塊的最佳化 (tile-based optimizations)、統一記憶體 (unified memory)。
- 無 double 型別。

### CPU/C++
- 主機端執行，用於偵錯與參考實作。
- 無 GPU 特定功能。

---

## 目標相容性矩陣

| 功能                   | D3D11 | D3D12 | Vulkan | CUDA | Metal | CPU |
|------------------------|:-----:|:-----:|:------:|:----:|:-----:|:---:|
| `half` 型別            | ✗     | ✓     | ✓      | ✓    | ✓     | ✗   |
| `double` 型別          | ✓     | ✓     | ✓      | ✓    | ✗     | ✓   |
| `u/int8_t`             | ✗     | ✗     | ✓      | ✓    | ✓     | ✓   |
| `u/int16_t`            | ✗     | ✓     | ✓      | ✓    | ✓     | ✓   |
| `u/int64_t`            | ✗     | ✓     | ✓      | ✓    | ✓     | ✓   |
| Wave 內建函式 (SM6)    | ✗     | ✓     | 部分   | ✓    | ✗     | ✗   |
| 光線追蹤               | ✗     | ✓     | ✓      | ✗    | ✗     | ✗   |
| 網格著色器             | ✗     | ✓     | ✓      | ✗    | ✓     | ✗   |
| 鑲嵌 (Tessellation)    | ✓     | ✓     | ✗      | ✗    | ✗     | ✗   |
| 圖形管線               | ✓     | ✓     | ✓      | ✗    | ✓     | ✗   |
| 原生 Bindless          | ✗     | ✗     | ✗      | ✓    | ✗     | ✓   |
| Atomics                | ✓     | ✓     | ✓      | ✓    | ✓     | ✓   |
| 指標                   | ✗     | ✗     | ✓      | ✓    | ✗     | ✓   |

**平台說明：**
- 鑲嵌 (Tessellation)：Vulkan 不可用（請改用網格著色器實作鑲嵌）。
- D3D12 中的 Half：`StructuredBuffer<half>` 有問題 — 應避免使用。
- CUDA 上的 Wave 內建函式：初步支援，使用合成的 WaveMask。
- D3D 上的 8/16 位元整數：需要特定的著色器模型與 DXIL 旗標。

---

## slangc 命令列

```bash
# 基本
slangc shader.slang -target spirv -o shader.spv
slangc shader.slang -target dxil  -o shader.dxil
slangc shader.slang -target glsl  -o shader.glsl
slangc shader.slang -target cuda  -o shader.cu
slangc shader.slang -target metal -o shader.metal
slangc shader.slang -target cpp   -o shader.cpp

# 多目標
slangc shader.slang -target spirv -o shader.spv -target dxil -o shader.dxil

# 進入點與階段
slangc shader.slang -target spirv -entry mainCS -stage compute -o out.spv

# 設定檔 (Profile)
slangc shader.slang -target glsl  -profile glsl_460 -o out.glsl
slangc shader.slang -target dxil  -profile sm_6_7   -o out.dxil

# 矩陣佈局 (對於像 xMath 這樣以列為主 (row-major) 的引擎很重要)
slangc shader.slang -target spirv -matrix-layout-row-major -o out.spv

# 最佳化
slangc shader.slang -O0   # 無最佳化
slangc shader.slang -O2   # 標準
slangc shader.slang -O3   # 進取 (Aggressive)

# 偵錯資訊
slangc shader.slang -g -o out.spv

# 包含路徑與巨集
slangc shader.slang -I./include -DENABLE_SHADOWS=1 -o out.spv

# 功能 (Capabilities)
slangc shader.slang -capability spvShaderClockKHR -target spirv -o out.spv

# Vulkan 特定
slangc shader.slang -target spirv -fvk-use-entrypoint-name -o out.spv
slangc shader.slang -target spirv -fvk-use-gl-layout       -o out.spv

# 預編譯模組
slangc shader.slang -r prebuilt.slang-module -target spirv -o out.spv

# 發出 IR
slangc shader.slang -emit-ir -o shader.slang-module
```

### 最佳化層級
| 旗標 | 效果                                |
|------|-------------------------------------|
| `-O0`| 無最佳化 (用於偵錯)                 |
| `-O1`| 基本最佳化                          |
| `-O2`| 標準最佳化 (預設)                   |
| `-O3`| 進取 (可能會增加編譯時間)           |

### `-stage` 的階段名稱
`vertex` · `fragment` · `compute` · `hull` · `domain` · `geometry`
`raygeneration` · `closesthit` · `miss` · `anyhit` · `intersection` · `callable`
