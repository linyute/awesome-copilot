# Slang 語言文件 - 完整參考

來源：[官方 Slang Shader 存放庫](https://github.com/shader-slang/slang "Slang Shader repository")

## 目錄

- [專案概觀](#project-overview)
- [介紹與為何使用 Slang](#introduction-and-why-use-slang)
- [入門指南](#getting-started)
- [語言特性](#language-features)
- [常規特性](#conventional-features)
- [介面與泛型](#interfaces-and-generics)
- [自動微分](#automatic-differentiation)
- [模組與存取控制](#modules-and-access-control)
- [功能系統](#capabilities-system)
- [使用 Slang 編譯程式碼](#compiling-code-with-slang)
- [反射 API](#reflection-api)
- [編譯目標](#compilation-targets)
- [目標相容性](#target-compatibility)
- [命令列參考](#command-line-reference)
- [從原始碼建構](#building-from-source)
- [常見問題](#faq)

## 專案概觀

Slang 是一種即時著色語言，旨在提高 GPU 程式設計的開發人員生產力，同時保持高效能。它使用現代程式語言特性擴展了 HLSL，並支援編譯到多個目標平台，包括 Direct3D、Vulkan、CUDA、Metal 和 CPU。

關鍵優點：

- 向後相容大多數現有的 HLSL 程式碼
- 用於高效描述元表 (descriptor table) 使用的參數區塊
- 用於型別安全著色器特化 (shader specialization) 的介面與泛型
- 用於機器學習應用程式的自動微分
- 用於更好程式碼組織的模組系統
- 全面的反射 API
- 到多個目標的跨平台編譯

## 介紹與為何使用 Slang

### 為何使用 Slang？

Slang 系統幫助即時圖形開發人員編寫更簡潔、更易於維護的 GPU 程式碼，而不會犧牲執行階段效能。Slang 使用來自現代通用語言的精心挑選特性來擴展 HLSL 語言，這些特性支援提高開發人員生產力和程式碼品質。

Slang 的一些優點包括：

- **向後相容性**：Slang 與大多數現有的 HLSL 程式碼向後相容
- **參數區塊**：允許著色器參數按更新率進行分組，以利用 Direct3D 12 描述元表和 Vulkan 描述元集 (descriptor sets)
- **介面與泛型**：提供基於前處理器的著色器特化的第一類替代方案
- **自動微分**：大幅簡化著色器中學習導向技術的實作
- **模組系統**：支援真正的單獨編譯和著色器程式碼的語意檢查
- **多平台支援**：同一個編譯器為 DX bytecode、DXIL、SPIR-V、HLSL、GLSL、CUDA 等生成程式碼
- **強大的反射 API**：以一致的格式提供有關著色器參數的繫結 (binding)/位移 (offset)/佈局 (layout) 資訊

### Slang 是為誰設計的？

Slang 的目標是為關心程式碼品質、可移植性和效能的即時圖形開發人員提供盡可能最好的語言。

#### 即時圖形開發人員

Slang 主要面向為終端使用者/用戶端機器建立即時圖形應用程式的開發人員，例如 3D 遊戲和數位內容創作 (DCC) 工具。

#### 從愛好者到專業人士

Slang 語言對於愛好者開發人員來說足夠簡單且熟悉，但也能擴展到建立次世代遊戲渲染器的專業開發團隊的需求。

#### 多平台應用程式開發人員

Slang 系統可為多個作業系統進行建構，支援許多圖形 API，並可與來自多個硬體廠商的 GPU 配合工作。該專案完全開源。

#### 擁有現有 HLSL 投資的開發人員

Slang 的關鍵特性之一是它與現有 HLSL 程式碼的高度相容性。開發人員可以逐步採用 Slang 特性，隨時間推移改善程式碼庫品質。

### 目標與非目標

關鍵設計目標：

- **效能**：使用 Slang 的好處絕不能以犧牲效能為代價
- **生產力**：語言概念在大型程式碼庫中促進更大的開發人員生產力
- **可移植性**：支援各種硬體、圖形 API 和作業系統
- **易於採用**：與現有程式碼相容，具有來自其他語言的熟悉語法
- **可預測性**：程式碼應該執行它看起來要執行的操作，並在各個平台之間保持一致
- **有限範圍**：Slang 是一個語言、編譯器和模組 - 而不是引擎或框架

## 入門指南

### 安裝

開始使用 Slang 最簡單的方法是從 GitHub 存放庫下載二進位發行版本。解壓縮檔案並在 `/bin/windows-x64/release/` 下找到 `slangc.exe`。請注意，`slang.dll` 和 `slang-glslang.dll` 必須位於同一目錄中。

有關從原始碼建構的資訊，請參閱[從原始碼建構](#building-from-source)章節。

### 你的第一個 Slang 著色器

建立一個名為 `hello-world.slang` 的檔案：

```hlsl
// hello-world.slang
StructuredBuffer<float> buffer0;
StructuredBuffer<float> buffer1;
RWStructuredBuffer<float> result;

[shader("compute")]
[numthreads(1,1,1)]
void computeMain(uint3 threadId : SV_DispatchThreadID)
{
    uint index = threadId.x;
    result[index] = buffer0[index] + buffer1[index];
}
```

編譯為 SPIR-V：

```bat
slangc hello-world.slang -target spirv -o hello-world.spv
```

編譯為 GLSL：

```bat
slangc hello-world.slang -target glsl -o hello-world.glsl
```

## 語言特性

### Import 宣告

Slang 引入了 `import` 宣告以實現更好的軟體模組化：

```hlsl
// foo.slang
float4 someFunc(float4 x) { return x; }

// bar.slang
import foo;
float4 someOtherFunc(float4 y) { return someFunc(y); }
```

關鍵細節：

- Import 使用與 `#include` 相同的搜尋路徑來搜尋 `.slang` 檔案
- 同一檔案的多個 import 僅處理一次
- 無自動命名空間（可能發生名稱碰撞）
- 使用 `__exported import` 來重新匯出宣告
- Import 不同於 `#include` - 不共享前處理器巨集

### 顯式參數區塊 (Explicit Parameter Blocks)

Slang 支援使用描述子表格/集 (descriptor tables/sets) 的顯式參數區塊語法：

```hlsl
struct ViewParams
{
    float3 cameraPos;
    float4x4 viewProj;
    TextureCube envMap;
}

ParameterBlock<ViewParams> gViewParams;
```

欄位被分配到暫存器/繫結 (registers/bindings)，以支援分配到單個參數區塊中。

### 介面 (Interfaces)

Slang 支援宣告 `interface`，使用者定義的 `struct` 類型可以實作這些介面：

```hlsl
// 介面定義
struct LightSample { float3 intensity; float3 direction; };

interface ILight
{
    LightSample sample(float3 position);
}

// 實作
struct PointLight : ILight
{
    float3 position;
    float3 intensity;
  
    LightSample sample(float3 hitPos)
    {
        float3 delta = hitPos - position;
        float distance = length(delta);
      
        LightSample sample;
        sample.direction = delta / distance;
        sample.intensity = intensity * falloff(distance);
        return sample;
    }
}
```

### 泛型 (Generics)

Slang 支援使用角括號語法進行泛型宣告：

```hlsl
float4 computeDiffuse<L : ILight>(float4 albedo, float3 P, float3 N, L light)
{
    LightSample sample = light.sample(P);
    float nDotL = max(0, dot(N, sample.direction));
    return albedo * nDotL;
}
```

#### 全域範圍泛型參數

為了與現有的 HLSL 全域宣告保持相容性：

```hlsl
type_param M : IMaterial;
M gMaterial;
```

#### 關聯類型 (Associated Types)

適用於每個實作類型需要選擇自己的中間類型的情況：

```hlsl
interface IMaterial
{
    associatedtype B : IBRDF;
    B evalPattern(float3 position, float2 uv);
}

struct MyCoolMaterial : IMaterial
{
    typedef DisneyBRDF B;
    B evalPattern(float3 position, float2 uv) { ... }
}
```

## 常規特性

### 類型 (Types)

Slang 支援常規的著色語言類型，包括純量 (scalars)、向量 (vectors)、矩陣 (matrices)、陣列 (arrays)、結構 (structures)、列舉 (enumerations) 和資源 (resources)。

#### 純量類型 (Scalar Types)

整數類型：

- `int8_t`, `int16_t`, `int`, `int64_t`
- `uint8_t`, `uint16_t`, `uint`, `uint64_t`

浮點數類型：

- `half` (16 位元)
- `float` (32 位元)
- `double` (64 位元)

布林類型：`bool`
虛無類型：`void`

#### 向量類型 (Vector Types)

向量類型：`vector<T,N>`，其中 T 是純量類型，N 為 2-4
便利名稱：`float3` = `vector<float,3>`

#### 矩陣類型 (Matrix Types)

矩陣類型：`matrix<T,R,C>`，其中 T 是純量，R 和 C 為 2-4
便利名稱：`float3x4` = `matrix<float,3,4>`

#### 陣列類型 (Array Types)

陣列類型 `T[N]` 表示 T 類型的 N 個元素組成的陣列：

```hlsl
int a[3];           // 定長陣列
int a[] = {1,2,3};  // 推導長度
void f(int b[]) {}  // 不定長陣列參數
```

陣列具有 `getCount()` 方法，可傳回長度。

#### 結構類型 (Structure Types)

使用 `struct` 關鍵字的結構類型：

```hlsl
struct MyData
{
    int a;
    float b;
}
```

結構可以使用 `__init` 關鍵字定義建構函式。

## 介面與泛型

### 介面 (Interfaces)

介面定義了一個類型應提供的方法與服務：

```hlsl
interface IFoo
{
    int myMethod(float arg);
}

struct MyType : IFoo
{
    int myMethod(float arg)
    {
        return (int)arg + 1;
    }
}
```

#### 多重介面符合性 (Multiple Interface Conformance)

```hlsl
interface IBar { uint myMethod2(uint2 x); }

struct MyType : IFoo, IBar
{
    int myMethod(float arg) {...}
    uint myMethod2(uint2 x) {...}
}
```

#### 預設實作 (Default Implementations)

```hlsl
interface IFoo
{
    int getVal() { return 0; }  // 預設實作
}

struct MyType : IFoo {}  // 使用預設實作

struct MyType2 : IFoo
{
    override int getVal() { return 1; }  // 顯式覆寫 (override)
}
```

### 泛型 (Generics)

泛型方法可消除共享邏輯的重複程式碼：

```hlsl
int myGenericMethod<T>(T arg) where T : IFoo
{
    return arg.myMethod(1.0);
}

// 使用方式
MyType obj;
int a = myGenericMethod<MyType>(obj); // 顯式類型
int b = myGenericMethod(obj);         // 類型推導
```

#### 泛型數值參數 (Generic Value Parameters)

```hlsl
void g1<let n : int>() { ... }

enum MyEnum { A, B, C }
void g2<let e : MyEnum>() { ... }

void g3<let b : bool>() { ... }
```

#### 替代語法 (Alternative Syntax)

```hlsl
__generic<typename T>
int myGenericMethod(T arg) where T : IFoo { ... }

// 簡化語法
int myGenericMethod<T:IFoo>(T arg) { ... }
```

#### 多重約束 (Multiple Constraints)

```hlsl
struct MyType<T, U>
    where T: IFoo, IBar
    where U : IBaz<T>
{
}
```

#### 選用符合性 (Optional Conformances)

```hlsl
int myGenericMethod<T>(T arg) where optional T: IFoo
{
    if (T is IFoo)
    {
        arg.myMethod(1.0); // 在符合性檢查區塊中為 OK
    }
}
```

### 支援的介面結構 (Supported Interface Constructs)

#### 屬性 (Properties)

```hlsl
interface IFoo
{
    property int count {get; set;}
}
```

#### 泛型方法 (Generic Methods)

```hlsl
interface IFoo
{
    int compute<T>(T val) where T : IBar;
}
```

#### 靜態方法 (Static Methods)

```hlsl
interface IFoo
{
    static int compute(int val);
}
```

## 自動微分 (Automatic Differentiation)

Slang 透過自動微分為可微分程式設計 (differentiable programming) 提供了一流的支援。

### 關鍵特性

- `fwd_diff` 與 `bwd_diff` 運算子，用於前向 (forward) 與後向 (backward) 模式的導數傳遞
- `DifferentialPair<T>` 類型，用於隨輸入傳遞導數
- `IDifferentiable` 與 `IDifferentiablePtrType` 介面，用於可微分類型
- 透過 `[ForwardDerivative]` 與 `[BackwardDerivative]` 自定義導數函式
- 與所有 Slang 特性相容：控制流、泛型、介面等

### 數學背景

前向模式計算雅可比向量積 (Jacobian-vector products)：`<Df(x), v>`
後向模式計算向量雅可比積 (vector-Jacobian products)：`<v^T, Df(x)>`

### 前向模式範例 (Forward-Mode Example)

```hlsl
[Differentiable]
float2 foo(float a, float b) 
{ 
    return float2(a * b * b, a * a);
}

void main()
{
    DifferentialPair<float> dp_a = diffPair(1.0, 1.0);  // 數值與導數
    DifferentialPair<float> dp_b = diffPair(2.4, 0.0);
  
    DifferentialPair<float2> dp_output = fwd_diff(foo)(dp_a, dp_b);
  
    float2 output_p = dp_output.p;  // 原始輸出 (primal output)
    float2 output_d = dp_output.d;  // 導數輸出 (derivative output)
}
```

### 後向模式範例 (Backward-Mode Example)

```hlsl
[Differentiable]
float2 foo(float a, float b) 
{ 
    return float2(a * b * b, a * a);
}

void main()
{
    DifferentialPair<float> dp_a = diffPair(1.0);
    DifferentialPair<float> dp_b = diffPair(2.4);
  
    float2 dL_doutput = float2(1.0, 0.0);  // 輸出導數
  
    bwd_diff(foo)(dp_a, dp_b, dL_doutput);
  
    float dL_da = dp_a.d;  // 計算出的輸入導數
    float dL_db = dp_b.d;
}
```

### 可微分類型系統 (Differentiable Type System)

#### 內建可微分類型

- 純量：`float`, `double`, `half`
- 由可微分純量組成的向量/矩陣
- 陣列：若 `T` 是可微分的，則 `T[n]` 也是
- 元組：若 `T` 是可微分的，則 `Tuple<each T>` 也是

#### 使用者定義的可微分類型

```hlsl
struct MyType : IDifferentiable
{
    float x;
    float y;
}
```

`Differential` 關聯類型帶有相應的導數（通常與原始類型相同）。

### 自定義導數 (Custom Derivatives)

```hlsl
[Differentiable]
[ForwardDerivative(myForwardDerivative)]
[BackwardDerivative(myBackwardDerivative)]
float myFunction(float x) { ... }
```

## 模組與存取控制 (Modules and Access Control)

### 定義模組

一個模組由一個過多個檔案組成，其中主要檔案包含一個 `module` 宣告：

```hlsl
// scene.slang
module scene;

__include "scene-helpers";
```

```hlsl
// scene-helpers.slang
implementing scene;
// ...
```

#### 模組 Include 語意

`__include` 與 `#include` 不同：

1. 檔案之間不共享前處理器狀態
2. 每個檔案僅包含一次
3. 允許循環包含
4. 所有模組檔案皆可存取所有其他實體，無論包含順序為何

#### 模組參考語法 (Module Reference Syntax)

支援識別字與字串字面量語法：

```hlsl
__include dir.file_name;           // 轉換為 "dir/file-name.slang"
__include "dir/file-name.slang";
__include "dir/file-name";
```

### 匯入模組

```hlsl
// MyShader.slang
import YourLibrary;
```

匯入規則：

- 只能匯入主要模組檔案
- 同一模組的多個匯入僅載入一次
- 檔案之間不共享前處理器狀態

### 存取控制

三個可見性級別：

#### `public`

隨處可存取 - 不同的類型、檔案、模組

#### `private`

僅在相同類型內可見：

```hlsl
struct MyType
{
    private int member;
  
    int f() { member = 5; }  // OK
  
    struct ChildType
    {
        int g(MyType t) { return t.member; }  // OK
    }
}

void outerFunc(MyType t)
{
    t.member = 2;  // 錯誤 - 不可見
}
```

#### `internal`

在整個相同模組中可見：

```hlsl
// a.slang
module a;
public struct PS
{
    internal int internalMember;
    public int publicMember;
}
internal void f() { ... }

// m.slang  
module m;
import a;
void main()
{
    f();  // 錯誤 - f 在模組 a 中為 internal
    PS p;
    p.internalMember = 1;  // 錯誤 - 在模組 a 之外不可見
    p.publicMember = 1;    // OK
}
```

預設可見性為 `internal`（介面成員除外，其繼承介面的可見性）。

#### 驗證規則

- 可見性較高的實體不能在簽章中公開可見性較低的實體
- 成員的可見性不能高於其父級
- 類型定義不能為 `private`
- 介面需求不能為 `private`

### 舊有模組相容性 (Legacy Module Compatibility)

沒有 `module` 宣告、`__include` 或可見性修飾符的模組被視為舊有模組，所有符號均為 `public`。

## 功能系統 (Capabilities System)

功能系統有助於管理不同 GPU、圖形 API 與著色器階段 (shader stages) 之間的硬體功能差異。

### 功能原子與需求 (Capability Atoms and Requirements)

功能原子 (Capability atoms) 代表目標、階段、擴充功能與特性：

- `GLSL_460` - GLSL 460 目標
- `compute` - 計算著色器階段
- `_sm_6_7` - 著色器模型 (Shader Model) 6.7 特性
- `SPV_KHR_ray_tracing` - SPIR-V 擴充功能
- `spvShaderClockKHR` - SPIR-V 功能

### 宣告需求

```hlsl
[require(spvShaderClockKHR)]
[require(glsl, GL_EXT_shader_realtime_clock)]
[require(hlsl_nvapi)]
uint2 getClock() {...}
```

這會建立需求：

```
(spvShaderClockKHR | glsl + GL_EXT_shader_realtime_clock | hlsl_nvapi)
```

### 衝突的功能 (Conflicting Capabilities)

某些功能是互斥的：

- 不同的程式碼生成目標 (`hlsl`, `glsl`)
- 不同的著色器階段 (`vertex`, `fragment`)

包含衝突原子的需求是不相容的。

### 父範圍需求 (Parent Scope Requirements)

需求會與父範圍合併：

```hlsl
[require(glsl)]
[require(hlsl)]
struct MyType
{
    [require(hlsl, hlsl_nvapi)]
    [require(spirv)]
    static void method() { ... }  // 需求：glsl | hlsl + hlsl_nvapi | spirv
}
```

### 自動推導 (Automatic Inference)

Slang 會推導 `internal`/`private` 函式的需求：

```hlsl
void myFunc()
{
    if (getClock().x % 1000 == 0)
        discard;  // 需要 fragment 階段
}
// 推導出：(spirv + SPV_KHR_shader_clock + spvShaderClockKHR + fragment | ...)
```

### 目標切換 (Target Switch)

`__target_switch` 引入了析取 (disjunctions)：

```hlsl
void myFunc()
{
    __target_switch
    {
    case spirv: ...;
    case hlsl: ...;
    }
}
// 需求：(spirv | hlsl)
```

### 功能別名 (Capability Aliases)

別名簡化了跨平台需求：

```hlsl
alias sm_6_6 = _sm_6_6
             | glsl_spirv_1_5 + sm_6_5 + GL_EXT_shader_atomic_int64 + atomicfloat2
             | spirv_1_5 + sm_6_5 + GL_EXT_shader_atomic_int64 + atomicfloat2 + SPV_EXT_descriptor_indexing
             | cuda
             | cpp;
```

用法：`[require(sm_6_6)]`

### 驗證 (Validation)

- 公開方法與介面方法需要顯式的功能宣告
- 驗證函式是否使用了超出宣告需求的特性
- 建議但非強制要求進入點 (Entrypoint) 的功能宣告

## 使用 Slang 編譯程式碼

### 概念

#### 來源單元與轉譯單元

來源單元 (檔案/字串) 被分組為轉譯單元。每個轉譯單元在編譯時會產生一個單一模組。

#### 進入點

進入點可以透過以下方式識別：

1. `[shader(...)]` 屬性 (建議使用)
2. 為了相容性的明確進入點選項

#### 目標

目標代表平台與功能：

- 格式：SPIR-V、DXIL 等。
- 設定檔 (Profile)：D3D Shader Model 5.1、GLSL 4.60 等。
- 選用功能：Vulkan 擴充功能
- 程式碼產生選項

#### 配置

參數配置取決於：

- 一起使用的模組與進入點
- 參數的順序
- 特定目標的規則與限制

#### 組合

元件類型 (模組、進入點) 可以被組合成複合體，定義了旨在共同使用的著色器程式碼單元。

#### 連結

解析跨模組引用並產生用於目標程式碼產生的自包含 IR 模組。

#### 核心 (Kernels)

進入點產生核心程式碼。同一個進入點可以針對不同的目標與組合產生不同的核心。

### 使用 `slangc` 進行命令列編譯

#### 簡單範例

```bat
slangc hello-world.slang -target spirv -o hello-world.spv
```

#### 來源檔案與轉譯單元

- 每個輸入檔案都是一個獨立的來源單元
- .slang 檔案被分組到單一轉譯單元
- 每個 .hlsl 檔案都有其自己的轉譯單元

#### 常見選項

- `-target <格式>`: 指定輸出格式 (spirv, dxil, hlsl, glsl, cuda, cpp)
- `-entry <名稱>`: 指定進入點函式名稱
- `-profile <設定檔>`: 指定目標設定檔
- `-o <檔案>`: 指定輸出檔案
- `-D<名稱>[=<值>]`: 定義前置處理器巨集
- `-I<路徑>`: 新增包含搜尋路徑

#### 多個目標

在單次呼叫中針對多個目標進行編譯：

```bat
slangc shader.slang -target spirv -o shader.spv -target dxil -o shader.dxil
```

#### 參數繫結

Slang 提供跨目標的確定性參數繫結。產生的程式碼包含明確的繫結配置，以確保一致的參數位置。

### 使用編譯 API

對於需要執行階段編譯的應用程式：

```cpp
// 建立工作階段 (Session)
Slang::ComPtr<slang::IGlobalSession> globalSession;
slang::createGlobalSession(globalSession.writeRef());

slang::ComPtr<slang::ISession> session;
slang::SessionDesc sessionDesc;
sessionDesc.targetCount = 1;
slang::TargetDesc targetDesc;
targetDesc.format = SLANG_SPIRV;
targetDesc.profile = SLANG_PROFILE_GLSL_450;
sessionDesc.targets = &targetDesc;
globalSession->createSession(sessionDesc, session.writeRef());

// 載入模組
slang::ComPtr<slang::IModule> module;
session->loadModule("myModule", module.writeRef());

// 建立進入點
slang::ComPtr<slang::IEntryPoint> entryPoint;
module->findEntryPointByName("main", entryPoint.writeRef());

// 組合程式
slang::ComPtr<slang::IComponentType> program;
slang::IComponentType* components[] = { module, entryPoint };
session->createCompositeComponentType(components, 2, program.writeRef());

// 編譯
slang::ComPtr<slang::IComponentType> linkedProgram;
program->link(linkedProgram.writeRef());

// 取得核心程式碼
slang::ComPtr<slang::IBlob> kernelCode;
linkedProgram->getEntryPointCode(0, 0, kernelCode.writeRef());
```

## 反射 (Reflection) API

### 為反射進行編譯

```cpp
slang::IComponentType* program = ...;
slang::ProgramLayout* programLayout = program->getLayout(targetIndex);
```

### 類型與變數

#### 變數

`VariableReflection` 代表變數宣告：

```cpp
void printVariable(slang::VariableReflection* variable)
{
    const char* name = variable->getName();
    slang::TypeReflection* type = variable->getType();
  
    print("name: "); printQuotedString(name);
    print("type: "); printType(type);
}
```

#### 類型

`TypeReflection` 代表程式中的類型：

```cpp
void printType(slang::TypeReflection* type)
{
    const char* name = type->getName();
    slang::TypeReflection::Kind kind = type->getKind();
  
    print("name: "); printQuotedString(name);
    print("kind: "); printTypeKind(kind);
  
    switch(type->getKind())
    {
    case slang::TypeReflection::Kind::Scalar:
        print("scalar type: ");
        printScalarType(type->getScalarType());
        break;
      
    case slang::TypeReflection::Kind::Struct:
        print("fields:");
        int fieldCount = type->getFieldCount();
        for (int f = 0; f < fieldCount; f++)
        {
            slang::VariableReflection* field = type->getFieldByIndex(f);
            printVariable(field);
        }
        break;
      
    case slang::TypeReflection::Kind::Array:
        print("element count: ");
        printPossiblyUnbounded(type->getElementCount());
        print("element type: ");
        printType(type->getElementType());
        break;
    }
}
```

### 參數配置

參數配置描述參數如何映射到特定目標的資源：

```cpp
void printParameterLayout(slang::ParameterLayout* parameterLayout)
{
    slang::VariableReflection* variable = parameterLayout->getVariable();
    printVariable(variable);
  
    // 列印繫結資訊
    int bindingRangeCount = parameterLayout->getBindingRangeCount();
    for (int r = 0; r < bindingRangeCount; r++)
    {
        slang::BindingRangeType rangeType = parameterLayout->getBindingRangeType(r);
        int rangeIndex = parameterLayout->getBindingRangeIndex(r);
        int rangeSpace = parameterLayout->getBindingRangeSpace(r);
      
        print("binding: ");
        printBindingRangeType(rangeType);
        printf(" index=%d space=%d", rangeIndex, rangeSpace);
    }
}
```

### 進入點配置

進入點配置提供有關可變輸入/輸出及其特定階段語義的資訊：

```cpp
void printEntryPointLayout(slang::EntryPointLayout* entryPointLayout)
{
    slang::Stage stage = entryPointLayout->getStage();
    print("stage: "); printStage(stage);
  
    // 列印可變參數
    int varyingCount = entryPointLayout->getVaryingParamCount();
    for (int v = 0; v < varyingCount; v++)
    {
        slang::VaryingParameterReflection* varying = 
            entryPointLayout->getVaryingParamByIndex(v);
        printVaryingParameter(varying);
    }
}
```

## 編譯目標

### Direct3D 11

D3D11 使用 DirectX 位元組碼 (DXBC) 格式。支援光柵化與計算管線。

#### 光柵化管線階段

- `vertex` (VS) - 必需
- `hull` (HS) - 選用鑲嵌 (tessellation)
- `domain` (DS) - 選用鑲嵌 (tessellation)
- `geometry` (GS) - 選用
- `fragment`/`pixel` (PS) - 選用

#### 參數傳遞

每個階段都有專用插槽：

- **常數緩衝區 (Constant buffers)**：`b` 暫存器，≤4KB uniform 資料
- **著色器資源檢視 (SRVs)**：`t` 暫存器，唯讀資源
- **未排序存取檢視 (UAVs)**：`u` 暫存器，讀寫資源
- **取樣器 (Samplers)**：`s` 暫存器，紋理取樣狀態

### Direct3D 12

D3D12 使用 DirectX 中間語言 (DXIL) 格式。新增光線追蹤與網格著色器 (mesh shader) 支援。

#### 額外管線階段

**網格著色器 (Mesh Shaders)** (Slang 尚未支援)：

- `amplification` - 決定網格著色器呼叫次數
- `mesh` - 為 meshlets 產生頂點與索引資料

**光線追蹤管線**：

- `raygeneration` - 追蹤光線，類似於計算
- `intersection` - 自定義基元 (primitive) 相交
- `anyhit` - 候選命中接受/拒絕
- `closesthit` - 處理接受的命中
- `miss` - 處理未命中幾何體的光線
- `callable` - 使用者定義的副程式

#### 參數傳遞

使用根簽章 (root signatures)，包含：

- **根常數 (Root constants)**：小量資料的直接參數傳遞
- **描述元資料表 (Descriptor tables)**：資源的描述元組
- **根描述元 (Root descriptors)**：直接描述元繫結

### Vulkan

使用 SPIR-V 中間表示。具有與 D3D12 類似的功能。

#### 主要功能

- 使用描述元集 (Descriptor sets) 而非描述元資料表
- 使用 Push constants 而非根常數
- 廣泛的擴充系統
- 跨供應商標準化

#### Vulkan 特定屬性

```hlsl
[[vk::binding(0, 1)]]
Texture2D myTexture;

[[vk::push_constant]]
cbuffer PushConstants
{
    float4 color;
}

[[vk::shader_record]]
cbuffer ShaderRecord
{
    uint shaderRecordID;
}
```

### CUDA

編譯為 CUDA C++ 或 PTX。支援具有 GPU 特定最佳化的計算工作負載。

#### 主要功能

- 原生指標支援
- 廣泛的數學函式庫
- 協作群組 (Cooperative groups)
- 張量運算

#### 限制

- 無圖形管線階段
- 有限的紋理運算
- 不同的 wave/warp 模型

### Metal

Apple 的圖形 API 與著色語言。

#### 主要功能

- 用於參數傳遞的引數緩衝區 (Argument buffers)
- 基於圖塊 (Tile-based) 的渲染最佳化
- 統一記憶體模型
- iOS/macOS 支援

### CPU/C++

產生用於 CPU 執行的 C++ 程式碼。

#### 主要功能

- 主機端著色器執行
- 偵錯與測試
- 參考實作
- 跨平台部署

#### 限制

- 無 GPU 特定功能
- 有限的平行執行
- 不同的記憶體模型

## 目標相容性

Slang 功能在不同目標間的全面相容性矩陣：

### 資料類型

| 功能 | D3D11 | D3D12 | Vulkan | CUDA | Metal | CPU |
| ----------- | ----- | ----- | ------ | ---- | ----- | --- |
| Half 類型 | No | Yes | Yes | Yes | Yes | No |
| Double 類型 | Yes | Yes | Yes | Yes | No | Yes |
| u/int8_t | No | No | Yes | Yes | Yes | Yes |
| u/int16_t | No | Yes | Yes | Yes | Yes | Yes |
| u/int64_t | No | Yes | Yes | Yes | Yes | Yes |

### 著色器功能

| 功能 | D3D11 | D3D12 | Vulkan | CUDA | Metal | CPU |
| --------------------- | ----- | ----- | ------- | ---- | ----- | --- |
| SM6.0 Wave 內建函式 | No | Yes | Partial | Yes | No | No |
| 光線追蹤 DXR 1.0 | No | Yes | Yes | No | No | No |
| 網格著色器 | No | Yes | Yes | No | Yes | No |
| 鑲嵌 (Tessellation) | Yes | Yes | No | No | No | No |
| 圖形管線 | Yes | Yes | Yes | No | Yes | No |

### 資源功能

| 功能 | D3D11 | D3D12 | Vulkan | CUDA | Metal | CPU |
| ---------------------- | ----- | ----- | ------ | ------- | ----- | ------- |
| 原生無繫結 (Bindless) | No | No | No | Yes | No | Yes |
| 緩衝區界限檢查 | Yes | Yes | Yes | Limited | No | Limited |
| 獨立取樣器 | Yes | Yes | Yes | No | Yes | Yes |
| 不可分割 (Atomics) | Yes | Yes | Yes | Yes | Yes | Yes |

### 平台特定附註

#### Half 類型

- D3D12：包含 half 的 StructuredBuffer 存在問題
- CUDA：需要可使用 cuda_fp16.h

#### 整數類型

- D3D11/D3D12：8/16 位元類型需要特定的著色器模型與 DXIL
- Vulkan：需要明確的算術類型擴充功能

#### Wave 內建函式 (Intrinsics)

- CUDA：初步支援，使用合成的 WaveMask
- 不同的硬體能力會影響可用性

#### 光線追蹤

- Vulkan：使用著色器記錄 (shader records) 而非區域根簽章
- D3D12：完整的 DXR 1.0/1.1 支援

#### 無繫結 (Bindless) 資源

- CUDA：原生支援紋理物件
- 其他目標：需要大量的手動處理

## 命令列參考

### 一般選項

#### `-D<名稱>[=<值>]`

插入前置處理器巨集。如果未指定值，則定義空巨集。

#### `-entry <名稱>`

指定進入點函式名稱。如果指定了階段，則預設為 `main`。允許複數進入點。

#### `-o <檔案>`

指定輸出檔案路徑。

#### `-target <格式>`

指定編譯目標格式：

- `spirv` - 用於 Vulkan 的 SPIR-V
- `dxil` - 用於 D3D12 的 DXIL
- `dxbc` - 用於 D3D11 的 DXBC
- `hlsl` - HLSL 原始碼輸出
- `glsl` - GLSL 原始碼輸出
- `cuda` - CUDA C++ 輸出
- `cpp` - C++ 輸出
- `metal` - Metal 輸出

#### `-profile <設定檔>`

指定目標設定檔/版本：

- `glsl_450`, `glsl_460` - GLSL 版本
- `sm_5_0`, `sm_6_0`, `sm_6_7` - Shader Model 版本

#### `-stage <階段>`

指定著色器階段：

- `vertex`, `fragment`, `compute`
- `hull`, `domain`, `geometry`
- `raygeneration`, `closesthit`, `miss`, `anyhit`, `intersection`, `callable`

### 包含與模組選項

#### `-I<路徑>`

將目錄新增至包含搜尋路徑。

#### `-r <模組>`

引用預編譯模組。

### 最佳化選項

#### `-O<等級>`

設定最佳化等級：

- `-O0` - 無最佳化
- `-O1` - 基本最佳化
- `-O2` - 標準最佳化
- `-O3` - 激進最佳化

#### `-g`

產生偵錯資訊。

#### `-line-directive-mode <模式>`

控制行指示字 (line directive) 產生：

- `none` - 無行指示字
- `default` - 標準行指示字
- `source-map` - 來源對照表 (Source map) 支援

### 特定目標選項

#### Vulkan 選項

#### `-fvk-use-entrypoint-name`

將進入點名稱用於 SPIR-V OpEntryPoint。

#### `-fvk-use-gl-layout`

使用 OpenGL 風格的記憶體配置規則。

#### CUDA 選項

#### `-cuda-sm <版本>`

指定 CUDA 計算能力 (例如，7.0 為 `70`)。

#### CPU 選項

#### `-fpic`

產生與位置無關的程式碼。

### 進階選項

#### `-capability <功能>`

指定編譯所需的特定功能。

#### `-matrix-layout-column-major`

使用行主序 (column-major) 矩陣配置。

#### `-matrix-layout-row-major`

使用列主序 (row-major) 矩陣配置。

#### `-emit-ir`

輸出中間表示 (.slang-module)。

#### `-load-stdlib-from <路徑>`

從指定路徑載入標準函式庫。

#### `-no-stdlib`

不要自動匯入標準函式庫。

## 從原始碼建構

### 先決條件

必需：

- CMake (建議 3.26，最低 3.22)
- 支援 C++17 的 C++ 編譯器 (GCC, Clang, MSVC)
- 相容 CMake 的後端 (Visual Studio, Ninja)
- Python3 (用於 spirv-tools 相依項目)

測試選用：

- CUDA
- OptiX
- NVAPI
- Aftermath
- X11

### 取得原始碼

```bash
git clone https://github.com/shader-slang/slang --recursive
```

### 設定與建構

#### Ninja 建構 (所有平台)

```bash
cmake --preset default
cmake --build --preset releaseWithDebugInfo
```

#### Visual Studio

```bash
cmake --preset vs2022
cmake --build --preset releaseWithDebugInfo
```

可用的預設集 (Presets)：

- `debug` - 偵錯建構
- `release` - 發行建構
- `releaseWithDebugInfo` - 包含偵錯資訊的發行建構

#### 完整工作流程

```bash
cmake --workflow --preset release  # 設定、建構與封裝
```

### WebAssembly 建構

需要 Emscripten SDK：

```bash
# 安裝並啟用 Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

# 為建構平台建構產生器
cmake --workflow --preset generators --fresh
mkdir generators  
cmake --install build --prefix generators --component generators

# 為 WebAssembly 設定與建構
source ../emsdk/emsdk_env
emcmake cmake -DSLANG_GENERATORS_PATH=generators/bin --preset emscripten -G "Ninja"
cmake --build --preset emscripten --target slang-wasm
```

### 測試

```bash
build/Debug/bin/slang-test
```

請參閱 slang-test 文件以取得完整的測試資訊。

### 安裝

```bash
cmake --build . --target install
```

這會安裝 `SlangConfig.cmake` 以支援 `find_package`：

```cmake
find_package(slang REQUIRED PATHS ${CMAKE_INSTALL_PREFIX} NO_DEFAULT_PATH)
target_link_libraries(yourLib PUBLIC slang::slang)
```

### 交叉編譯

對於交叉編譯場景：

1. 為建構平台建構產生器
2. 使用目標平台工具鏈進行設定
3. 為目標平台建構

### CMake 選項

關鍵組態選項：

| 選項 | 預設值 | 描述 |
| ------------------------- | ------- | -------------------------------- |
| `SLANG_ENABLE_TESTS` | ON | 建構測試套件 |
| `SLANG_ENABLE_EXAMPLES` | ON | 建構範例程式 |
| `SLANG_ENABLE_GFX` | ON | 建構圖形抽象層 |
| `SLANG_ENABLE_SLANGRT` | ON | 建構執行階段函式庫 |

## 常見問題 (FAQ)

### 這個專案是如何開始的？

Slang 專案源自於 "Spire" 著色語言研究專案。Slang 吸取了有關高效著色器編譯語言研究的經驗教訓，並將其應用於一個更容易採用且更適合生產使用的系統。

### 為什麼使用 Slang 而不是其他 HLSL 到 GLSL 的轉換器？

雖然 glslang 和 hlsl2glslfork 等工具對於基礎的 HLSL 到 GLSL 轉換很有用，但 Slang 的目標不同。Slang 的目標不是成為「另一個 HLSL 到 GLSL 轉換器」，而是建立一個著色語言與工具鏈，以提高開發者相對於現有 HLSL 的生產力，同時為現有的 HLSL 程式碼提供合理的採用路徑。

如果你只是在尋找 HLSL 到 GLSL 的轉換，現有的工具可能就能滿足你的需求。如果你對具有更好模組化、類型安全性與現代語言功能的更高生產力著色語言感興趣，那麼 Slang 可能值得研究。

### 是什麼讓著色語言更有生產力？

影響 Slang 設計的關鍵研究：

- **Shader Components: Modular and High Performance Shader Development** - 展示了模組化著色器開發的好處
- **A System for Rapid Exploration of Shader Optimization Choices** - 演示了用於著色器最佳化的編譯器技術
- **Spark: Modular, Composable Shaders for Graphics Hardware** - 關於可組合著色器系統的早期研究

核心生產力改進：

- **模組化**：真正的獨立編譯與模組系統
- **類型安全性**：介面與泛型取代了容易出錯的前置處理器駭客手段
- **反射 (Reflection)**：跨目標一致的參數繫結資訊
- **移植性**：單一來源可編譯為多個目標
- **現代功能**：自動微分、參數區塊等。

### 誰正在使用 Slang？

目前的主要使用者：

- **NVIDIA Falcor** - 由 NVIDIA Research 開發的即時渲染框架
- **各大遊戲工作室** - 正在採用於次世代渲染器
- **研究機構** - 圖形與機器學習 (ML) 研究專案
- **獨立開發者** - 愛愛好與商業專案

該實作主要集中在 Falcor 的需求，但其設計旨在廣泛適用。

### 我們難道不快就會全部使用 C/C++ 來寫著色器了嗎？

向文件化的二進位中間語言 (SPIR-V, DXIL) 的轉變為語言創新創造了機會。雖然 C++ 著色器支援很有價值，但 Slang 解決了即時圖形獨有的挑戰，而這些挑戰不會隨著 C++ 自動改善：

- **不同 API 間參數繫結的複雜性**
- **著色器階段語義與驗證**
- **特定目標的最佳化與功能**
- **特定於圖形的類型系統** (紋理、取樣器等)
- **用於基於學習的渲染的自動微分**

Slang 是 C++ 著色器工作的補充，專注於圖形程式設計的領域特定改進。

### 主要限制是什麼？

目前的限制包括：

- **與成熟工具相比，生態系統有限**
- **前沿狀態** - API 與語言變更仍在發生
- **目標覆蓋範圍** - 某些進階功能並非在所有目標上都可用
- **文件** - 仍在擴展對進階主題的覆蓋範圍
- **工具整合** - IDE 支援正在改進但尚未普及

然而，隨著專案的成熟，這些限制正被積極解決。

### 語言與 API 的穩定性如何？

Slang 對於許多使用情境已具備生產就緒性，但仍在發展中：

- **核心語言功能穩定**
- **編譯 API 具有良好的版本控制穩定性**
- **進階功能** (自動微分、功能) 可能會有改進
- **為了 HLSL 相容性，優先考慮回溯相容性**
- **支援漸進式採用** - 可以逐步引入 Slang 功能

該專案遵循語義化版本控制，並為重大變更提供遷移指南。

來源：[Slang Shader 儲存庫文件](https://github.com/shader-slang/slang/tree/master/docs)
