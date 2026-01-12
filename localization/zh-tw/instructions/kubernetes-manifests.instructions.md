---
applyTo: 'k8s/**/*.yaml,k8s/**/*.yml,manifests/**/*.yaml,manifests/**/*.yml,deploy/**/*.yaml,deploy/**/*.yml,charts/**/templates/**/*.yaml,charts/**/templates/**/*.yml'
description: 'Kubernetes YAML manifest 的最佳實踐，包括標記慣例、安全上下文 (Security Context)、Pod 安全、資源管理、探針和驗證指令'
---

# Kubernetes Manifests 指示

## 您的任務

建立具備生產環境水準的 Kubernetes manifest，優先考慮安全性、可靠性和卓越營運，並使用一致的標籤、適當的資源管理以及全面的健康檢查。

## 標記慣例 (Labeling Conventions)

**必要標籤**（Kubernetes 推薦）：
- `app.kubernetes.io/name`：應用程式名稱
- `app.kubernetes.io/instance`：實例識別碼
- `app.kubernetes.io/version`：版本
- `app.kubernetes.io/component`：元件角色
- `app.kubernetes.io/part-of`：應用程式群組
- `app.kubernetes.io/managed-by`：管理工具

**額外標籤**：
- `environment`：環境名稱
- `team`：擁有團隊
- `cost-center`：用於計費

**有用的註解 (Annotations)**：
- 文件和所有權說明
- 監控：`prometheus.io/scrape`, `prometheus.io/port`, `prometheus.io/path`
- 變更追蹤：git commit、部署日期

## 安全上下文 (SecurityContext) 預設值

**Pod 層級**：
- `runAsNonRoot: true`
- `runAsUser` 和 `runAsGroup`：特定 ID
- `fsGroup`：檔案系統群組
- `seccompProfile.type: RuntimeDefault`

**容器層級**：
- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true`（對可寫目錄使用 tmpfs 掛載）
- `capabilities.drop: [ALL]`（僅新增所需的權限）

## Pod 安全標準

使用 Pod 安全准入 (Pod Security Admission)：
- **Restricted**（生產環境推薦）：強制執行安全強化
- **Baseline**：最低安全要求
- 在 Namespace 層級套用

## 資源請求 (Requests) 與限制 (Limits)

**務必定義**：
- Requests：保證最小值（用於排程）
- Limits：允許的最大值（防止資源耗盡）

**QoS 類別**：
- **Guaranteed**：requests == limits（最適合關鍵應用程式）
- **Burstable**：requests < limits（靈活的資源使用）
- **BestEffort**：未定義資源（生產環境應避免）

## 健康探針 (Health Probes)

**Liveness**：重新啟動不健康的容器
**Readiness**：控制流量路由
**Startup**：保護啟動緩慢的應用程式

為每種探針設定適當的延遲、週期、逾時和閾值。

## 滾動更新策略 (Rollout Strategies)

**部署策略**：
- `RollingUpdate` 配合 `maxSurge` 和 `maxUnavailable`
- 將 `maxUnavailable` 設為 `0` 以實現零停機時間

**高可用性 (High Availability)**：
- 至少 2-3 個複本 (replicas)
- Pod 中斷預算 (Pod Disruption Budget, PDB)
- 反親和性 (Anti-affinity) 規則（跨節點/區域分散）
- 針對變動負載使用水平 Pod 自動擴展器 (HPA)

## 驗證指令

**部署前**：
- `kubectl apply --dry-run=client -f manifest.yaml`
- `kubectl apply --dry-run=server -f manifest.yaml`
- `kubeconform -strict manifest.yaml`（Schema 驗證）
- `helm template ./chart | kubeconform -strict`（適用於 Helm）

**政策驗證**：
- OPA Conftest, Kyverno, 或 Datree

## 滾動更新與復原 (Rollout & Rollback)

**部署**：
- `kubectl apply -f manifest.yaml`
- `kubectl rollout status deployment/NAME`

**復原 (Rollback)**：
- `kubectl rollout undo deployment/NAME`
- `kubectl rollout undo deployment/NAME --to-revision=N`
- `kubectl rollout history deployment/NAME`

**重新啟動**：
- `kubectl rollout restart deployment/NAME`

## Manifest 檢查清單

- [ ] 標籤：套用標準標籤
- [ ] 註解：文件和監控說明
- [ ] 安全：設定 runAsNonRoot, readOnlyRootFilesystem, 移除 capabilities
- [ ] 資源：定義 Requests 和 Limits
- [ ] 探針：設定 Liveness, Readiness, Startup
- [ ] 映像檔：使用特定標籤（絕不使用 :latest）
- [ ] 複本：生產環境至少 2-3 個
- [ ] 策略：RollingUpdate 配合適當的 surge/unavailable
- [ ] PDB：為生產環境定義
- [ ] 反親和性：為 HA 配置
- [ ] 優雅關閉：設定 terminationGracePeriodSeconds
- [ ] 驗證：通過 Dry-run 和 kubeconform 測試
- [ ] 秘密 (Secrets)：使用 Secrets 資源，而非 ConfigMaps
- [ ] 網路政策 (NetworkPolicy)：最小權限存取（如果適用）

## 最佳實踐摘要

1. 使用標準標籤和註解
2. 始終以非 root 使用者執行並移除 capabilities
3. 定義資源請求與限制
4. 實作所有三種探針類型
5. 將映像檔標籤固定到特定版本
6. 為 HA 配置反親和性
7. 設定 Pod 中斷預算 (PDB)
8. 使用零停機時間的滾動更新
9. 在套用前驗證 manifest
10. 儘可能啟用唯讀根檔案系統
