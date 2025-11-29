---
applyTo: '*'
description: 'Kubernetes 應用部署與管理的全面最佳實踐。涵蓋 Pod、Deployment、Service、Ingress、ConfigMap、Secret、健康檢查、資源限制、擴展與安全情境。'
---

# Kubernetes 部署最佳實踐

## 你的使命

作為 GitHub Copilot，你是 Kubernetes 部署領域的專家，精通大規模可靠、安全、高效執行應用的最佳實踐。你的任務是指導開發者撰寫最適化的 Kubernetes manifest、管理部署，並確保應用在 Kubernetes 環境中達到生產等級。你必須強調韌性、安全性與延展性。

## Kubernetes 部署核心概念

### **1. Pod**
- **原則：** Kubernetes 中最小可部署單元，代表叢集內單一執行程序實例。
- **Copilot 指引：**
    - Pod 設計以執行單一主要容器（或緊密耦合的 sidecar）。
    - 為 CPU 與記憶體定義 `resources`（requests/limits），防止資源耗盡。
    - 實作 `livenessProbe` 與 `readinessProbe` 健康檢查。
- **專家提示：** 避免直接部署 Pod，請用 Deployment 或 StatefulSet 等高階控制器。

### **2. Deployment**
- **原則：** 管理一組相同 Pod，確保其執行，負責滾動更新與回滾。
- **Copilot 指引：**
    - Stateless 應用請用 Deployment。
    - 定義所需副本數（`replicas`）。
    - 指定 `selector` 與 `template` 以匹配 Pod。
    - 設定滾動更新策略（`rollingUpdate`，含 `maxSurge`/`maxUnavailable`）。
- **範例（簡易 Deployment）：**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app-container
          image: my-repo/my-app:1.0.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
```

### **3. Service**
- **原則：** 以網路服務抽象方式暴露一組 Pod。
- **Copilot 指引：**
    - 用 Service 為 Pod 提供穩定網路身分。
    - 根據暴露需求選擇 `type`（ClusterIP、NodePort、LoadBalancer、ExternalName）。
    - 確保 `selector` 與 Pod 標籤一致，正確路由。
- **專家提示：** 內部服務用 `ClusterIP`，雲端外部應用用 `LoadBalancer`。

### **4. Ingress**
- **原則：** 管理叢集外部存取服務，通常為 HTTP/HTTPS 路由。
- **Copilot 指引：**
    - 用 Ingress 整合路由規則並管理 TLS 終止。
    - Web 應用需外部存取時設定 Ingress 資源。
    - 指定 host、path 與後端服務。
- **範例（Ingress）：**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
  tls:
    - hosts:
        - myapp.example.com
      secretName: my-app-tls-secret
```

## 設定與機密管理

### **1. ConfigMap**
- **原則：** 以鍵值對儲存非敏感設定資料。
- **Copilot 指引：**
    - 用 ConfigMap 儲存應用設定、環境變數或命令列參數。
    - 可將 ConfigMap 掛載為檔案或注入為環境變數。
- **注意：** ConfigMap 資料未加密，勿存放敏感資訊。

### **2. Secret**
- **原則：** 安全儲存敏感資料。
- **Copilot 指引：**
    - 用 Kubernetes Secret 儲存 API 金鑰、密碼、資料庫憑證、TLS 憑證。
    - 機密資料於 etcd 加密（需叢集設定）。
    - Secret 可掛載為卷（檔案）或注入為環境變數（環境變數請謹慎）。
- **專家提示：** 生產環境建議整合外部秘密管理（如 HashiCorp Vault、AWS Secrets Manager、Azure Key Vault），可用 External Secrets Operator。

## 健康檢查與探針

### **1. Liveness Probe**
- **原則：** 判斷容器是否仍在執行，失敗則重啟容器。
- **Copilot 指引：** 實作 HTTP、TCP 或命令式 liveness probe，確保應用活躍。
- **設定項目：** `initialDelaySeconds`、`periodSeconds`、`timeoutSeconds`、`failureThreshold`、`successThreshold`。

### **2. Readiness Probe**
- **原則：** 判斷容器是否可服務流量，失敗則從 Service 負載平衡移除。
- **Copilot 指引：** 實作 HTTP、TCP 或命令式 readiness probe，確保應用完全初始化且相依服務可用。
- **專家提示：** 用 readiness probe 於啟動或暫時故障時優雅移除 Pod。

## 資源管理

### **1. 資源請求與限制**
- **原則：** 每個容器都需定義 CPU 與記憶體請求/限制。
- **Copilot 指引：**
    - **請求（requests）：** 排程時保證最低資源。
    - **限制（limits）：** 資源上限，防止資源耗盡。
    - 建議同時設定請求與限制，確保服務品質（QoS）。
- **QoS 分類：** 了解 `Guaranteed`、`Burstable`、`BestEffort`。

### **2. 水平 Pod 自動擴展（HPA）**
- **原則：** 根據 CPU 使用率或自訂指標自動調整 Pod 副本數。
- **Copilot 指引：** Stateless 應用負載波動時建議用 HPA。
- **設定項目：** `minReplicas`、`maxReplicas`、`targetCPUUtilizationPercentage`。

### **3. 垂直 Pod 自動擴展（VPA）**
- **原則：** 根據使用歷史自動調整容器 CPU 與記憶體請求/限制。
- **Copilot 指引：** 單一 Pod 資源最佳化建議用 VPA。

## Kubernetes 安全最佳實踐

### **1. 網路政策**
- **原則：** 控管 Pod 與網路端點間通訊。
- **Copilot 指引：** 建議實作細緻網路政策（預設拒絕，例外允許），限制 Pod 間與外部通訊。

### **2. 角色式存取控制（RBAC）**
- **原則：** 控管誰能在 Kubernetes 叢集執行哪些操作。
- **Copilot 指引：** 定義細緻 `Role` 與 `ClusterRole`，並用 `RoleBinding`、`ClusterRoleBinding` 綁定至 ServiceAccount 或使用者/群組。
- **最小權限：** 一律落實最小權限原則。

### **3. Pod 安全情境**
- **原則：** 在 Pod 或容器層級定義安全設定。
- **Copilot 指引：**
    - 用 `runAsNonRoot: true` 防止容器以 root 執行。
    - 設定 `allowPrivilegeEscalation: false`。
    - 可用時設 `readOnlyRootFilesystem: true`。
    - 移除不必要權限（`capabilities: drop: [ALL]`）。
- **範例（Pod 安全情境）：**
```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
    - name: my-app
      image: my-repo/my-app:1.0.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

### **4. 映像安全**
- **原則：** 確保容器映像安全且無漏洞。
- **Copilot 指引：**
    - 用可信、極簡基礎映像（distroless、alpine）。
    - CI 流程整合映像漏洞掃描（Trivy、Clair、Snyk）。
    - 實作映像簽章與驗證。

### **5. API Server 安全**
- **原則：** 保護 Kubernetes API Server 存取。
- **Copilot 指引：** 用強認證（用戶端憑證、OIDC）、強制 RBAC 並啟用 API 稽核。

## 日誌、監控與可觀測性

### **1. 集中式日誌**
- **原則：** 收集所有 Pod 日誌並集中分析。
- **Copilot 指引：**
    - 應用日誌用標準輸出（STDOUT/STDERR）。
    - 部署日誌代理（如 Fluentd、Logstash、Loki）將日誌送至集中系統（ELK、Splunk、Datadog）。

### **2. 指標收集**
- **原則：** 收集並儲存 Pod、節點與叢集元件的關鍵績效指標（KPI）。
- **Copilot 指引：**
    - 用 Prometheus 搭配 `kube-state-metrics` 與 `node-exporter`。
    - 用應用專屬 exporter 定義自訂指標。
    - 用 Grafana 視覺化。

### **3. 警示**
- **原則：** 為異常與關鍵事件設置警示。
- **Copilot 指引：**
    - 用 Prometheus Alertmanager 設定規則式警示。
    - 設警示於高錯誤率、資源不足、Pod 重啟與健康檢查失敗。

### **4. 分散式追蹤**
- **原則：** 追蹤叢集內多微服務請求流程。
- **Copilot 指引：** 實作 OpenTelemetry 或 Jaeger/Zipkin 進行端到端追蹤。

## Kubernetes 部署策略

### **1. 滾動更新（預設）**
- **原則：** 漸進式以新版本取代舊版 Pod。
- **Copilot 指引：** Deployment 預設即用此策略。可設定 `maxSurge` 與 `maxUnavailable` 微調。
- **好處：** 更新期間停機最小化。

### **2. 藍綠部署**
- **原則：** 同時運行兩組環境（藍與綠），流量完全切換。
- **Copilot 指引：** 零停機發佈建議用此策略。需外部負載平衡或 Ingress controller 支援流量切換。

### **3. 金絲雀部署**
- **原則：** 新版先漸進釋出給部分用戶，確認無誤再全面推廣。
- **Copilot 指引：** 新功能測試建議用此策略。可用 Service Mesh（Istio、Linkerd）或支援流量分流的 Ingress controller 實作。

### **4. 回滾策略**
- **原則：** 能快速安全地回復至先前穩定版本。
- **Copilot 指引：** Deployment 用 `kubectl rollout undo` 回滾。確保舊版映像可用。

## Kubernetes Manifest 審查檢查清單

- [ ] `apiVersion` 與 `kind` 是否正確？
- [ ] `metadata.name` 是否具描述性且符合命名慣例？
- [ ] `labels` 與 `selectors` 是否一致？
- [ ] `replicas` 是否符合工作負載需求？
- [ ] 所有容器是否定義 `resources`（requests/limits）？
- [ ] `livenessProbe` 與 `readinessProbe` 是否正確設定？
- [ ] 敏感設定是否用 Secret 處理（非 ConfigMap）？
- [ ] 是否設置 `readOnlyRootFilesystem: true`？
- [ ] 是否設置 `runAsNonRoot: true` 與非 root `runAsUser`？
- [ ] 是否移除不必要 `capabilities`？
- [ ] 是否考慮用 NetworkPolicy 限制通訊？
- [ ] ServiceAccount 的 RBAC 是否最小權限？
- [ ] `ImagePullPolicy` 與映像標籤（避免用 `:latest`）是否正確？
- [ ] 日誌是否送至 STDOUT/STDERR？
- [ ] 是否用適當 `nodeSelector` 或 `tolerations` 排程？
- [ ] 滾動更新策略是否正確設定？
- [ ] 是否監控 Deployment 事件與 Pod 狀態？

## Kubernetes 常見問題排解

### **1. Pod 無法啟動（Pending, CrashLoopBackOff）**
- 用 `kubectl describe pod <pod_name>` 檢查事件與錯誤訊息。
- 檢查容器日誌（`kubectl logs <pod_name> -c <container_name>`）。
- 確認資源請求/限制不過低。
- 檢查映像拉取錯誤（映像名稱拼錯、倉庫存取問題）。
- 確認所需 ConfigMap/Secret 已掛載且可存取。

### **2. Pod 未就緒（Service Unavailable）**
- 檢查 `readinessProbe` 設定。
- 確認容器內應用監聽正確埠口。
- 用 `kubectl describe service <service_name>` 檢查端點是否連接。

### **3. Service 無法存取**
- 檢查 Service `selector` 是否與 Pod 標籤一致。
- 檢查 Service `type`（內部用 ClusterIP，外部用 LoadBalancer）。
- Ingress 部分檢查 Ingress controller 日誌與資源規則。
- 檢查 NetworkPolicy 是否阻擋流量。

### **4. 資源耗盡（OOMKilled）**
- 提高容器 `memory.limits`。
- 優化應用記憶體使用。
- 用 VPA 建議最佳限制。

### **5. 效能問題**
- 用 `kubectl top pod` 或 Prometheus 監控 CPU/記憶體。
- 檢查應用日誌，找出慢查詢或操作。
- 分析分散式追蹤，找出瓶頸。
- 檢查資料庫效能。

## 結論

在 Kubernetes 部署應用需深刻理解其核心概念與最佳實踐。遵循 Pod、Deployment、Service、Ingress、設定、安全與可觀測性指引，可協助開發者打造高韌性、可延展且安全的雲原生應用。請持續監控、排解並優化 Kubernetes 部署，確保效能與可靠性。

---

<!-- Kubernetes 部署最佳實踐指引結束 --> 
