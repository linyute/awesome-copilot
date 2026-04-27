# Skeleton: 0.1-architecture.md

> **⛔ 逐字複製下方的範本內容（不包括外部程式碼區塊）。取代 `[FILL]` 預留位置。切勿新增/重新命名/重新排序章節。**
> **⛔ 「核心元件」表格欄位必須精確為：`Component | Type | Description`。切勿將其重新命名為 `Role`、`Change`、`Function`。**
> **⛔ 「技術棧」表格欄位必須精確為：`Layer | Technologies`（2 欄）。切勿新增 `Version` 欄位，或將 `Layer` 重新命名為 `Category`。**
> **⛔ 「安全性基礎設施清單」和「儲存庫結構」章節是強制性的 — 切勿省略。**

---

````markdown
# 架構總覽

## 系統用途

[FILL-PROSE: 2-4 句 — 這是什麼系統，它解決了什麼問題，使用者是誰]

## 核心元件

| Component | Type | Description |
|-----------|------|-------------|
[REPEAT: 每個元件一行]
| [FILL: PascalCase 名稱] | [FILL: Process / Data Store / External Service / External Interactor] | [FILL: 一行描述] |
[END-REPEAT]

<!-- ⛔ 表格後檢查：驗證核心元件：
  1. 每個元件都有 PascalCase 名稱（非 kebab-case 或 snake_case）
  2. 類型為以下之一：Process / Data Store / External Service / External Interactor
  3. 列數與下方元件圖中的節點數量相符
  若有任何檢查失敗 → 立即修正。 -->

## 元件圖

```mermaid
[FILL: 使用 service/external/datastore 樣式的架構圖 — 非 DFD 圓圈]
```

## 熱門案例

[REPEAT: 3-5 個案例。前 3 個必須包含循序圖。]

### 案例 [FILL: N]: [FILL: 標題]

[FILL-PROSE: 2-3 句描述]

```mermaid
sequenceDiagram
    [FILL: 參與者, 訊息, alt/opt 區塊]
```

[END-REPEAT]

<!-- ⛔ 章節後檢查：驗證熱門案例：
  1. 至少列出 3 個案例
  2. 前 3 個案例必須有 sequenceDiagram 區塊
  3. 每個循序圖都有參與者線條和訊息箭頭
  若有任何檢查失敗 → 立即修正。 -->

## 技術棧

| Layer | Technologies |
|-------|--------------|
| Languages | [FILL] |
| Frameworks | [FILL] |
| Data Stores | [FILL] |
| Infrastructure | [FILL] |
| Security | [FILL] |

<!-- ⛔ 表格後檢查：驗證技術棧的所有 5 行皆已填寫。若 Security 行為空，請列出在程式碼中找到的安全性相關函式庫/框架。 -->

## 部署模型

[FILL-PROSE: 部署描述 — 連接埠、協定、繫結位址、網路暴露、拓撲（單機 / 叢集 / 多層級）]

**部署分類：** `[FILL: 以下之一 LOCALHOST_DESKTOP | LOCALHOST_SERVICE | AIRGAPPED | K8S_SERVICE | NETWORK_SERVICE]`

<!-- ⛔ 部署分類規則：
  LOCALHOST_DESKTOP — 單一處理程序主控台/GUI 應用程式，無網路監聽器（或僅限 localhost），單一使用者工作站。禁止 T1。
  LOCALHOST_SERVICE — 僅繫結至 127.0.0.1 的守護程序/服務。禁止 T1。
  AIRGAPPED — 無網際網路連線。針對源自網路的攻擊，禁止 T1。
  K8S_SERVICE — 具有 ClusterIP 或 LoadBalancer 的 Kubernetes Deployment/StatefulSet。允許 T1。
  NETWORK_SERVICE — 公開 API、雲端端點、對向網際網路。允許 T1。
  此分類對所有後續先決條件和層級分配具有約束力。 -->

### 元件暴露表格

| Component | Listens On | Auth Required | Reachability | Min Prerequisite | Derived Tier |
|-----------|------------|---------------|--------------|------------------|-------------|
[REPEAT: 核心元件表格中每個元件一行]
| [FILL: 元件名稱] | [FILL: 連接埠/位址或 "N/A — no listener"] | [FILL: Yes (機制) / No] | [FILL: 以下之一：External / Internal Only / Localhost Only / No Listener] | [FILL: 封閉列舉之一 — 請參閱下方規則] | [FILL: T1 / T2 / T3] |
[END-REPEAT]

<!-- ⛔ 暴露表格規則：
  1. 核心元件中的每個元件必須有一行。
  2. "Listens On" = 來自程式碼的實際繫結位址（例如 "127.0.0.1:8080", "0.0.0.0:443", "N/A — no listener"）。
  3. "Reachability" 必須為這 4 個值之一（封閉列舉）：
     - `External` — 可從公開網際網路或不信任的網路存取
     - `Internal Only` — 僅在私人網路（K8s 叢集、VNet 等）內可存取
     - `Localhost Only` — 繫結至 127.0.0.1 或具名管道，僅限同主機
     - `No Listener` — 不接受連入連線（僅連出、主控台 I/O、函式庫）
  4. "Min Prerequisite" 必須為這些值之一（封閉列舉）：
     - `None` — 僅在 Reachability = External 且 Auth Required = No 時有效
     - `Authenticated User` — Reachability = External 且 Auth Required = Yes
     - `Internal Network` — Reachability = Internal Only 且 Auth Required = No
     - `Privileged User` — 需要管理員/營運人員角色
     - `Local Process Access` — Reachability = Localhost Only（同主機處理程序可連線）
     - `Host/OS Access` — Reachability = No Listener（需要檔案系統、主控台或偵錯存取權限）
     - `Admin Credentials` — 需要管理員認證 + 主機存取權限
     - `Physical Access` — 需要實體接觸
     ⛔ 禁止使用的值：`Application Access`, `Host Access`（定義模糊 — 請改用 `Local Process Access` 或 `Host/OS Access`）
  5. "Derived Tier" 是根據 Min Prerequisite 機械式決定的：
     - `None` → T1
     - `Authenticated User`, `Privileged User`, `Internal Network`, `Local Process Access` → T2
     - `Host/OS Access`, `Admin Credentials`, `Physical Access`, `{Component} Compromise`, 或任何 `A + B` → T3
  6. 此元件的任何威脅或發現，其先決條件不得低於 Min Prerequisite。
  7. 此元件的任何威脅或發現，其層級不得高於 Derived Tier（數字越小越高級）。
  8. 此表格是先決條件底線和層級上限的唯一事實來源。STRIDE 和發現必須遵守此表格。 -->

## 安全性基礎設施清單

| Component | Security Role | Configuration | Notes |
|-----------|---------------|---------------|-------|
[REPEAT: 在程式碼中找到的每個安全性相關元件一行]
| [FILL] | [FILL] | [FILL] | [FILL] |
[END-REPEAT]

## 儲存庫結構

| Directory | Purpose |
|-----------|---------|
[REPEAT: 每個核心目錄一行]
| [FILL: path/] | [FILL] |
[END-REPEAT]
````
