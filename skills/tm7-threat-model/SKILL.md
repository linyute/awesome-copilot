---
name: tm7-threat-model
description: '建立與 Microsoft Threat Modeling Tool v7.3+ 相容的有效 Microsoft Threat Modeling Tool (.tm7) 檔案。每當收到建立、產生或修改 .tm7 威脅模型檔案的要求時，或在執行應輸出可在 Microsoft Threat Modeling Tool 中正常開啟之 .tm7 檔案的 STRIDE 威脅模型分析時，請使用此技能。'
---

# Microsoft Threat Modeling Tool (.tm7) 產生器

您為 Microsoft Threat Modeling Tool (v7.3+) 產生**有效的 `.tm7` 檔案**。`.tm7`
檔案**不是**一般的 XML — 它是具有精確命名空間和元素結構的 **WCF `DataContractSerializer`**
文件。如果結構錯誤，該工具將拒絕開啟該檔案，並顯示以下錯誤訊息：

> "File is not an actual threat model or the threat model may be corrupted."

您的工作是將描述的系統（元件、資料儲存庫、外部執行者、資料
流、信任邊界）轉化為圖表加上 STRIDE 威脅，並序列化為下方描述的精確 `.tm7`
格式。

## 工作流程

當被要求產生 `.tm7` 檔案時：

1. **為系統建模。** 辨識元件：
   - **程序**（網頁應用程式、服務、函式）→ `StencilEllipse`, `GE.P`
   - **資料儲存庫**（資料庫、快取、佇列、大型二進位物件 (blob)）→ `StencilParallelLines`, `GE.DS`
   - **外部互動者**（使用者、瀏覽器、協力廠商系統）→ `StencilRectangle`, `GE.EI`
   - **信任邊界** → `BorderBoundary`, `GE.TB`
   - **資料流**連接上述元件 → `Connector`, `GE.DF`
2. **分配一個唯一的底線 UUID**（例如 `148ade68-5c80-40f3-8e1f-4e2cabdb5991`）給每個
   防護網和每個資料流。絕不要使用像 `users-browser` 這樣人類可讀的 ID。
3. **配置座標** (`Left`/`Top`/`Width`/`Height`)，使防護網不會重疊。
4. 針對每次互動**產生 STRIDE 威脅**，並將其放置在 `<ThreatInstances>` 中。
5. 使用本指南中的結構進行**序列化**，鏡像參照 `assets/example-minimal.tm7`。
6. 在傳回檔案之前，對照「常見錯誤」檢查清單進行**驗證**。
7. **寫入檔案時不要有 XML 宣告，也不要進行美化排版縮排**（序列化器發出的是
   單一連續的 XML 串流）。

請務必先開啟 [`assets/example-minimal.tm7`](./assets/example-minimal.tm7) 並進行調整 — 重複使用其精確的
序列化骨架，且僅變更防護網類型、名稱、座標、資料流和威脅。

## 關鍵：序列化格式

TM7 檔案使用 **WCF `DataContractSerializer` XML**，而非標準 XML。

檔案必須以下列精確的根元素開頭 — **不能有 `<?xml?>` 宣告**：

```xml
<ThreatModel xmlns="http://schemas.datacontract.org/2004/07/ThreatModeling.Model" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
```

**絕不使用：**
- `<?xml version="1.0" encoding="utf-8"?>` — 會導致還原序列化失敗。
- `xmlns:xsi` / `xmlns:xsd` — 這些是標準的 XML 命名空間，而非 DataContract 命名空間。
- 發明的元素，例如 `<SecurityGaps>` 或 `<Mitigations>` — 它們並不存在於
  TM7 結構描述中。

> **注意：**`<MetaInformation>`（帶有子元素如 `<Owner>`、`<Contributors>`、
> `<Reviewer>`、`<Assumptions>`、`<ExternalDependencies>`、`<HighLevelSystemDescription>`、
> `<ThreatModelName>`）、`<Notes>` 和 `<KnowledgeBase>` **是**真實結構描述的一部分，且
> 由該工具發出 — 請保留它們（參見下方的結構和 `assets/example-minimal.tm7`）。
> 只是不要發明該工具從未產生的元素。

## 必要的命名空間字首

| 字首 | URI | 用於 |
|--------|-----|----------|
| (預設) | `http://schemas.datacontract.org/2004/07/ThreatModeling.Model` | 根 `ThreatModel` |
| `xmlns:i` | `http://www.w3.org/2001/XMLSchema-instance` | 類型屬性 |
| `xmlns:z` | `http://schemas.microsoft.com/2003/10/Serialization/` | 參照 ID (`z:Id`) |
| `xmlns:a` | `http://schemas.microsoft.com/2003/10/Serialization/Arrays` | 陣列 / 集合 |
| `xmlns:b` | `http://schemas.datacontract.org/2004/07/ThreatModeling.KnowledgeBase` | 防護網屬性 |
| `xmlns:c` | `http://www.w3.org/2001/XMLSchema` | 原始類型值 |

## 檔案結構（正確順序）

完整的工具匯出包含以下順序：`DrawingSurfaceList`、`MetaInformation`、`Notes`、
`ThreatInstances`、`ThreatMetaData`（通常是空的/自我關閉的），然後是大型的通用
`KnowledgeBase` 作為**頂層同級元素**（而非巢狀放置在 `ThreatMetaData` 內），最後是
`Profile`。

```xml
<ThreatModel xmlns="..." xmlns:i="...">
  <DrawingSurfaceList>
    <DrawingSurfaceModel z:Id="i1" xmlns:z="...">
      <GenericTypeId xmlns="...Abstracts">DRAWINGSURFACE</GenericTypeId>
      <Guid xmlns="...Abstracts">{guid}</Guid>
      <Properties xmlns="...Abstracts" xmlns:a="...Arrays">...</Properties>
      <TypeId xmlns="...Abstracts">DRAWINGSURFACE</TypeId>
      <Borders xmlns:a="...Arrays">
        <!-- 防護網元素：程序、資料儲存庫、外部實體、邊界 -->
      </Borders>
      <Lines xmlns:a="...Arrays">
        <!-- 連接上述防護網的資料流線 -->
      </Lines>
      <Notes xmlns:a="...Arrays"/>
    </DrawingSurfaceModel>
  </DrawingSurfaceList>
  <MetaInformation>
    <!-- Owner, Contributors, Reviewer, Assumptions, ThreatModelName, 等 -->
  </MetaInformation>
  <Notes xmlns:a="...Arrays"/>
  <ThreatInstances>
    <!-- 威脅項目 -->
  </ThreatInstances>
  <ThreatMetaData/>
  <KnowledgeBase z:Id="i21" xmlns:a="...ThreatModeling.KnowledgeBase" xmlns:z="...">
    <!-- 通用 SDL 防護網/威脅型錄 — ThreatMetaData 的頂層同級元素 -->
  </KnowledgeBase>
  <Profile>
    <PromptedKb xmlns=""/>
  </Profile>
</ThreatModel>
```

> `<KnowledgeBase>`（通用的 SDL 防護網/威脅型錄）很大，但是是**必要的** —
> 該工具使用它來解析每個防護網的 `TypeId`。它是一個放置在
> `ThreatMetaData` 之後和 `Profile` 之前的**頂層同級元素**，**而非**巢狀在 `ThreatMetaData` 內。請原樣重複使用
> `assets/example-minimal.tm7` 中的內容；僅新增其 `TypeId` 已出現在該
> KnowledgeBase 中的防護網。

## 防護網元素

`<Borders>` 中的每個防護網都包裝在 `<a:KeyValueOfguidanyType>` 中：

```xml
<a:KeyValueOfguidanyType>
  <a:Key>{guid}</a:Key>
  <a:Value z:Id="i2" i:type="StencilEllipse">
    <GenericTypeId xmlns="...Abstracts">GE.P</GenericTypeId>
    <Guid xmlns="...Abstracts">{guid}</Guid>
    <Properties xmlns="...Abstracts">
      <a:anyType i:type="b:HeaderDisplayAttribute" xmlns:b="...KnowledgeBase">
        <b:DisplayName>Web Application</b:DisplayName>
        <b:Name/>
        <b:Value i:nil="true"/>
      </a:anyType>
      <a:anyType i:type="b:StringDisplayAttribute" xmlns:b="...KnowledgeBase">
        <b:DisplayName>Name</b:DisplayName>
        <b:Name/>
        <b:Value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">My Component</b:Value>
      </a:anyType>
      <!-- 超出範圍, 原因, 可配置的屬性 -->
    </Properties>
    <TypeId xmlns="...Abstracts">SE.P.TMCore.WebApp</TypeId>
    <Height xmlns="...Abstracts">100</Height>
    <Left xmlns="...Abstracts">400</Left>
    <StrokeDashArray i:nil="true" xmlns="...Abstracts"/>
    <StrokeThickness xmlns="...Abstracts">1</StrokeThickness>
    <Top xmlns="...Abstracts">200</Top>
    <Width xmlns="...Abstracts">100</Width>
  </a:Value>
</a:KeyValueOfguidanyType>
```

### 防護網圖形類型

| 圖形 | `i:type` | `GenericTypeId` | 描述 |
|-------|----------|-----------------|-------------|
| 程序 (圓形) | `StencilEllipse` | `GE.P` | 程序、網頁應用程式、服務 |
| 資料儲存庫 (平行線) | `StencilParallelLines` | `GE.DS` | 資料庫、儲存庫、快取 |
| 外部互動者 (矩形) | `StencilRectangle` | `GE.EI` | 使用者、外部系統 |
| 信任邊界 | `BorderBoundary` | `GE.TB` | 信任邊界 |

### 常見 `TypeId` 值 (SDL TM 知識庫)

| `TypeId` | 元件 |
|----------|-----------|
| `SE.P.TMCore.WebApp` | Web 應用程式 |
| `SE.P.TMCore.AzureAppServiceWebApp` | Azure App 服務 Web 應用程式 |
| `SE.P.TMCore.AzureEventHub` | Azure 事件中樞 |
| `SE.P.TMCore.DynamicsCRM` | Dynamics CRM |
| `SE.DS.TMCore.SQL` | SQL 資料庫 |
| `SE.DS.TMCore.AzureSQLDB` | Azure SQL 資料庫 |
| `SE.EI.TMCore.Browser` | 瀏覽器 |
| `SE.EI.TMCore.Mobile` | 行動用戶端 |

## 資料流線

`<Lines>` 中的線條也使用 `<a:KeyValueOfguidanyType>`，其中 `i:type="Connector"`：

```xml
<a:KeyValueOfguidanyType>
  <a:Key>{line-guid}</a:Key>
  <a:Value z:Id="i10" i:type="Connector">
    <GenericTypeId xmlns="...Abstracts">GE.DF</GenericTypeId>
    <Guid xmlns="...Abstracts">{line-guid}</Guid>
    <Properties xmlns="...Abstracts">...</Properties>
    <TypeId xmlns="...Abstracts">SE.DF.TMCore.Request</TypeId>
    <HandleX xmlns="...Abstracts">0</HandleX>
    <HandleY xmlns="...Abstracts">0</HandleY>
    <SourceGuid xmlns="...Abstracts">{source-stencil-guid}</SourceGuid>
    <SourceX xmlns="...Abstracts">0</SourceX>
    <SourceY xmlns="...Abstracts">0</SourceY>
    <TargetGuid xmlns="...Abstracts">{target-stencil-guid}</TargetGuid>
    <TargetX xmlns="...Abstracts">0</TargetX>
    <TargetY xmlns="...Abstracts">0</TargetY>
  </a:Value>
</a:KeyValueOfguidanyType>
```

## 屬性屬性類型

屬性使用具型別的 `<a:anyType>` 元素：

| `i:type` | 用途 | 值 |
|----------|---------|-------|
| `b:HeaderDisplayAttribute` | 區段標頭 | `i:nil="true"` |
| `b:StringDisplayAttribute` | 文字值 (名稱、原因) | `i:type="c:string"` |
| `b:BooleanDisplayAttribute` | 布林值 (超出範圍) | `i:type="c:boolean"` |
| `b:ListDisplayAttribute` | 下拉式清單 | 具有 `<b:SelectedIndex>` |

## 威脅執行個體

威脅放置於 `<ThreatInstances>` 中，並使用 `<a:KeyValueOfstringThreatpc_P0_PhOB>`（注意精確的
`PhOB` 後綴）。與防護網不同，威脅的 `<a:Value>` 欄位帶有 **`b:` 前綴**（
`ThreatModeling.KnowledgeBase` 命名空間），且 `<a:Key>` 是常值串接：
`TH<識別碼> + <SourceGuid> + <FlowGuid> + <TargetGuid>`：

```xml
<ThreatInstances xmlns:a="...Arrays">
  <a:KeyValueOfstringThreatpc_P0_PhOB>
    <a:Key>TH117{source-guid}{flow-guid}{target-guid}</a:Key>
    <a:Value xmlns:b="...KnowledgeBase">
      <b:ChangedBy/>
      <b:DrawingSurfaceGuid>{drawing-surface-guid}</b:DrawingSurfaceGuid>
      <b:FlowGuid>{flow-guid}</b:FlowGuid>
      <b:Id>32</b:Id>
      <b:InteractionKey>{source-guid}:{flow-guid}:{target-guid}</b:InteractionKey>
      <b:InteractionString i:nil="true"/>
      <b:ModifiedAt>2025-01-01T00:00:00</b:ModifiedAt>
      <b:Priority>High</b:Priority>
      <b:Properties>
        <a:KeyValueOfstringstring>
          <a:Key>Title</a:Key>
          <a:Value>An adversary may spoof the user and gain access</a:Value>
        </a:KeyValueOfstringstring>
        <a:KeyValueOfstringstring>
          <a:Key>UserThreatCategory</a:Key>
          <a:Value>Spoofing</a:Value>
        </a:KeyValueOfstringstring>
        <a:KeyValueOfstringstring>
          <a:Key>UserThreatShortDescription</a:Key>
          <a:Value>Spoofing is when a process or entity is something other than its claimed identity.</a:Value>
        </a:KeyValueOfstringstring>
        <a:KeyValueOfstringstring>
          <a:Key>PossibleMitigations</a:Key>
          <a:Value>Enable multi-factor authentication and least-privilege access control.</a:Value>
        </a:KeyValueOfstringstring>
        <a:KeyValueOfstringstring>
          <a:Key>Priority</a:Key>
          <a:Value>High</a:Value>
        </a:KeyValueOfstringstring>
        <a:KeyValueOfstringstring>
          <a:Key>SDLPhase</a:Key>
          <a:Value>Design</a:Value>
        </a:KeyValueOfstringstring>
      </b:Properties>
      <b:SourceGuid>{source-stencil-guid}</b:SourceGuid>
      <b:State>Mitigated</b:State>
      <b:StateInformation i:nil="true"/>
      <b:TargetGuid>{target-stencil-guid}</b:TargetGuid>
      <b:Title i:nil="true"/>
      <b:TypeId>TH117</b:TypeId>
      <b:Upgraded>false</b:Upgraded>
      <b:Wide>false</b:Wide>
    </a:Value>
  </a:KeyValueOfstringThreatpc_P0_PhOB>
</ThreatInstances>
```

**每個 GUID 都必須解析：**`SourceGuid` 和 `TargetGuid` 必須等於 `<Borders>` 中真實
防護網的 `<a:Key>` 值，且 `FlowGuid` 必須等於 `<Lines>` 中真實連接線的
`<a:Key>` 值。懸空的參照會產生一個開啟時缺少圖表元素的模型。

針對 `UserThreatCategory` 使用標準 STRIDE 類別：**S**poofing（仿冒）、**T**ampering（竄改）、
**R**epudiation（否認）、**I**nformation Disclosure（資訊洩漏）、**D**enial of Service（阻斷服務）、**E**levation of Privilege（權限提升）。

## 損壞 TM7 檔案的常見錯誤

1. **加入 `<?xml version="1.0"?>` 宣告** — `DataContractSerializer` 不會輸出此宣告。
2. **使用 `xmlns:xsi` / `xmlns:xsd`**，而非 DataContract 命名空間。
3. **使用簡單的元素名稱**，如 `<Border>`、`<Line>`、`<Stencil>` — 您必須使用
   DataContract 包裝器類型，例如 `<a:KeyValueOfguidanyType>`。
4. **發明該工具從未輸出的元素**，如 `<SecurityGaps>` 或 `<Mitigations>` — 這些
   並不存在於結構描述中。（`<MetaInformation>`、`<Notes>` 和 `<KnowledgeBase>` **是**有效的，
   且必須予以保留。）
5. **使用人類可讀的 GUID**，如 `users-browser`，而非真實的 UUID
   （例如 `148ade68-5c80-40f3-8e1f-4e2cabdb5991`）。
6. **懸空參照** — `Line`、威脅 `SourceGuid`/`TargetGuid` 或威脅 `FlowGuid`
   指向並未在 `<Borders>`/`<Lines>` 中實際定義的防護網/資料流 GUID。
   每個參照都必須解析為已包含的元素。
7. **遺失或重複的 `z:Id` 參照屬性** — 每個序列化的物件都需要一個
   `z:Id`，且每個 `z:Id`（例如 `i1`、`i2`、`i10`）在整個檔案中必須是**唯一**的。
   當您複製範本區塊以新增元素時，請務必將其 `z:Id`（以及任何
   巢狀 `z:Id`）重新編號為其他地方未使用過的值；重複使用識別碼會建立重複的 DataContract
   物件識別碼，並導致還原序列化失敗。
8. **子元素缺少 `xmlns`** — 每個 `GenericTypeId`、`Guid`、`Properties`、`TypeId` 等
   都必須攜帶其專善的
   `xmlns="http://schemas.datacontract.org/2004/07/ThreatModeling.Model.Abstracts"`。
9. **美化排版與縮排** — 正確的輸出是單一連續的 XML 串流，
   內容中不包含任何額外的分行或縮排。

## 參考資產

請務必使用此技能目錄中的 [`assets/example-minimal.tm7`](./assets/example-minimal.tm7) 作為結構參考。
它是一個完全合成、經過淨化的匯出檔案（無個人或專案資料），可以在工具中乾淨地開啟：
兩個防護網由一個資料流連接，並附帶一個其每個參照均已解析的 STRIDE 威脅。
請根據使用者的架構調整防護網類型、名稱、屬性、座標、資料流和威脅，
但**絕不**變更序列化格式或命名空間結構，且僅使用已出現在其搭售
`KnowledgeBase` 中的防護網 `TypeId` 值。產生之後，請在腦中比對您的
輸出骨架與範例，以確認每個命名空間、包裝器元素
和 GUID 參照都一致。
