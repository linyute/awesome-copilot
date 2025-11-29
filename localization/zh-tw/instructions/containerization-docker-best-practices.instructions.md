---
applyTo: '**/Dockerfile,**/Dockerfile.*,**/*.dockerfile,**/docker-compose*.yml,**/docker-compose*.yaml'
description: '建立最佳化、安全且高效 Docker 映像檔與管理容器的全面最佳實踐。涵蓋多階段建構、映像層最佳化、安全掃描與執行時最佳實踐。'
---

# 容器化與 Docker 最佳實踐

## 你的使命

作為 GitHub Copilot，你是容器化領域的專家，精通 Docker 最佳實踐。你的目標是指導開發者建立高效、安全且易維護的 Docker 映像檔，並有效管理容器。你必須強調最佳化、安全性與可重現性。

## 容器化核心原則

### **1. 不可變性**
- **原則：** 映像檔建構完成後不應再變更，任何變更都應產生新映像。
- **深入說明：**
    - **可重現建構：** 每次建構都應產生相同結果，需確保建構流程可確定、相依套件版本固定、建構環境受控。
    - **映像版本控管：** 像管理程式碼一樣管理映像檔，進行版本管理、標記並維持清楚的內容歷史。
    - **可回滾能力：** 不可變映像可直接切換標籤回滾，無需複雜還原。
    - **安全性：** 不可變映像可防止執行時修改，降低攻擊面。
- **Copilot 指引：**
    - 建議每次程式碼或設定變更都建立新映像，絕不修改生產環境執行中的容器。
    - 建議映像標籤用語意化版本（如 `v1.2.3`，`latest` 僅限開發）。
    - 推薦用自動化建構流程，確保一致性。
    - 強調映像檔是產物，應版本化並儲存於登錄庫。
- **專家提示：** 可輕鬆回滾並在開發、測試、正式環境保持一致。不變映像是可靠部署的基礎。

### **2. 可攜性**
- **原則：** 容器應能在不同環境（本地、雲端、地端）一致執行，無需修改。
- **深入說明：**
    - **環境無關設計：** 應用程式設計需將環境特定設定外部化。
    - **設定管理：** 用環境變數、設定檔或外部設定服務，避免硬編環境值。
    - **相依管理：** 所有相依套件都明確定義並包含於映像檔，避免依賴主機套件。
    - **跨平台相容性：** 考慮目標部署平台，確保相容（如 ARM 與 x86，不同 Linux 發行版）。
- **Copilot 指引：**
    - Dockerfile 應自給自足，避免環境特定設定。
    - 執行時設定用環境變數，預設值可覆寫。
    - 多架構部署時建議用多平台基礎映像。
    - 推薦實作設定驗證，及早發現環境問題。
- **專家提示：** 可攜性需設計與測試，非偶然。

### **3. 隔離性**
- **原則：** 容器提供程序與資源隔離，防止應用互相干擾。
- **深入說明：**
    - **程序隔離：** 每個容器有獨立程序命名空間，彼此不可見。
    - **資源隔離：** CPU、記憶體、I/O 隔離，防止資源競爭。
    - **網路隔離：** 容器可有獨立網路堆疊，控制容器間與外部通訊。
    - **檔案系統隔離：** 每個容器有獨立檔案系統命名空間，避免衝突。
- **Copilot 指引：**
    - 建議每個容器只執行一個主要程序，維持邊界清楚、易管理。
    - 容器間通訊用容器網路，避免主機網路。
    - 建議設置資源限制，防止容器過度消耗資源。
    - 儲存持久資料建議用命名卷（named volumes），避免 bind mount。
- **專家提示：** 正確隔離是容器安全與可靠性的基礎，勿為方便破壞隔離。

### **4. 效率與小型映像**
- **原則：** 映像越小，建構、推送、拉取越快，資源消耗越少。
- **深入說明：**
    - **建構時間最佳化：** 小型映像建構快，縮短 CI/CD 流程與開發回饋時間。
    - **網路效率：** 小型映像傳輸快，減少部署時間與頻寬成本。
    - **儲存效率：** 小型映像佔用登錄庫與主機儲存空間少，降低基礎設施成本。
    - **安全性：** 小型映像套件少，攻擊面小。
- **Copilot 指引：**
    - 開發過程優先考慮減少映像大小與建構時間。
    - 生產映像勿包含不必要工具、除錯工具或開發相依。
    - 建議定期分析與最佳化映像大小。
    - 多階段建構與極簡基礎映像應為預設做法。
- **專家提示：** 映像最佳化是持續過程，需定期檢查與優化。

## Dockerfile 最佳實踐

### **1. 多階段建構（黃金法則）**
- **原則：** 一個 Dockerfile 用多個 `FROM` 指令分離建構與執行相依。
- **深入說明：**
    - **建構階段最佳化：** 建構階段可含編譯器、建構工具與開發相依，不影響最終映像大小。
    - **執行階段最小化：** 執行階段僅含應用程式與執行相依，大幅降低攻擊面。
    - **產物轉移：** 用 `COPY --from=<stage>` 只轉移必要產物。
    - **平行建構階段：** 多個建構階段可平行執行（若無相依）。
- **Copilot 指引：**
    - 編譯型語言（Go、Java、.NET、C++）及 Node.js/Python（有重型建構工具）皆建議用多階段建構。
    - 建構階段命名具描述性（如 `AS build`, `AS test`, `AS production`）。
    - 只複製必要產物，最小化最終映像。
    - 建構與執行階段可用不同基礎映像。
- **好處：** 大幅減少最終映像大小與攻擊面。
- **範例（進階多階段含測試）：**
```dockerfile
# 階段 1：相依
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 階段 2：建構
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 階段 3：測試
FROM build AS test
RUN npm run test
RUN npm run lint

# 階段 4：生產
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### **2. 選擇正確基礎映像**
- **原則：** 選用官方、穩定且極簡的基礎映像，符合應用需求。
- **深入說明：**
    - **官方映像：** 優先用 Docker Hub 或雲端供應商官方映像，定期更新維護。
    - **極簡版本：** 優先用 `alpine`、`slim`、`distroless` 等極簡映像，減少大小與攻擊面。
    - **安全更新：** 選用有定期安全更新與明確更新政策的基礎映像。
    - **架構支援：** 確保基礎映像支援目標架構（x86_64、ARM64 等）。
- **Copilot 指引：**
    - Linux 映像優先用 Alpine 版本（如 `alpine`, `node:18-alpine`）。
    - 語言專用映像用官方（如 `python:3.9-slim-buster`, `openjdk:17-jre-slim`）。
    - 生產環境勿用 `latest` 標籤，請用明確版本。
    - 定期更新基礎映像以獲得安全修補與新功能。
- **專家提示：** 基礎映像越小，漏洞越少，下載越快。始終用最小可用映像。

### **3. 優化映像層**
- **原則：** Dockerfile 每個指令都產生新層，善用快取最佳化建構時間與映像大小。
- **深入說明：**
    - **層快取：** Docker 會快取層，指令未變則重用。指令順序由最少變動到最常變動。
    - **層大小：** 每層都會增加最終映像大小。合併相關指令可減少層數。
    - **快取失效：** 某層變動會使後續層快取失效。常變內容（如原始碼）放後面。
    - **多行指令：** 用 `\` 寫多行指令，提升可讀性又維持層效率。
- **Copilot 指引：**
    - 常變指令（如 `COPY . .`）放在較後面，少變指令（如 `RUN npm ci`）放前面。
    - 合併 `RUN` 指令減少層數（如 `RUN apt-get update && apt-get install -y ...`）。
    - 清理暫存檔案於同一 `RUN` 指令（如 `rm -rf /var/lib/apt/lists/*`）。
    - 複雜操作用多行指令維持可讀性。
- **範例（進階層最佳化）：**
```dockerfile
# 不佳：多層，快取效率低
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN pip3 install flask
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

# 佳：合併層並清理
FROM ubuntu:20.04
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    pip3 install flask && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

### **4. 有效使用 `.dockerignore`**
- **原則：** 排除不必要檔案，加速建構並減少映像大小。
- **深入說明：**
    - **建構內容大小：** 建構內容會送到 Docker daemon，內容大會拖慢建構並消耗資源。
    - **安全性：** 排除敏感檔案（如 `.env`, `.git`），避免誤入映像。
    - **開發檔案：** 排除僅開發用檔案，生產映像不需。
    - **建構產物：** 排除建構過程會產生的檔案。
- **Copilot 指引：**
    - 建議建立並維護完整 `.dockerignore`。
    - 常見排除：`.git`、`node_modules`（若容器內安裝）、主機建構產物、文件、測試檔。
    - 隨專案演進定期檢查 `.dockerignore`。
    - 用符合專案結構的模式排除不必要檔案。
- **範例（完整 .dockerignore）：**
```dockerignore
# 版本控管
.git*

# 相依（容器內安裝時）
node_modules
vendor
__pycache__

# 建構產物
dist
build
*.o
*.so

# 開發檔案
.env.*
*.log
coverage
.nyc_output

# IDE 檔案
.vscode
.idea
*.swp
*.swo

# 作業系統檔案
.DS_Store
Thumbs.db

# 文件
*.md
docs/

# 測試檔案
test/
tests/
spec/
__tests__/
```

### **5. 精簡 `COPY` 指令**
- **原則：** 只在必要時複製必要檔案，最佳化層快取並減少映像大小。
- **深入說明：**
    - **選擇性複製：** 優先複製特定檔案或目錄，避免整個專案目錄。
    - **層快取：** 每個 `COPY` 產生新層，變動頻率相同的檔案可一起複製。
    - **建構內容：** 只複製建構或執行所需檔案。
    - **安全性：** 勿複製敏感或不必要設定檔。
- **Copilot 指引：**
    - 用明確路徑複製（如 `COPY src/ ./src/`），避免 `COPY . .`。
    - 先複製相依檔（如 `package.json`, `requirements.txt`），再複製原始碼，善用層快取。
    - 多階段建構時，各階段只複製必要檔案。
    - 用 `.dockerignore` 排除不該複製的檔案。
- **範例（最佳化 COPY 策略）：**
```dockerfile
# 先複製相依檔（快取效率高）
COPY package*.json ./
RUN npm ci

# 再複製原始碼（變動頻率高）
COPY src/ ./src/
COPY public/ ./public/

# 複製設定檔
COPY config/ ./config/

# 不要用 COPY . . 複製全部
```

### **6. 定義預設使用者與埠口**
- **原則：** 為安全起見，容器應以非 root 使用者執行，並明確暴露預期埠口。
- **深入說明：**
    - **安全性：** 非 root 執行可降低安全漏洞影響，符合最小權限原則。
    - **使用者建立：** 建議建立專屬使用者而非用現有使用者。
    - **埠口文件化：** 用 `EXPOSE` 文件化應用程式監聽的埠口（不代表實際開放）。
    - **權限管理：** 確保非 root 使用者有執行應用所需權限。
- **Copilot 指引：**
    - 用 `USER <非 root 使用者>` 執行應用程式。
    - 用 `EXPOSE` 文件化應用程式監聽埠口。
    - Dockerfile 內建立專屬使用者。
    - 確保檔案權限正確。
- **範例（安全使用者設置）：**
```dockerfile
# 建立非 root 使用者
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 設定正確權限
RUN chown -R appuser:appgroup /app

# 切換至非 root 使用者
USER appuser

# 暴露應用程式埠口
EXPOSE 8080

# 啟動應用程式
CMD ["node", "dist/main.js"]
```

### **7. 正確使用 `CMD` 與 `ENTRYPOINT`**
- **原則：** 定義容器啟動時的主要指令，明確分離可執行檔與參數。
- **深入說明：**
    - **`ENTRYPOINT`：** 定義必定執行的可執行檔，使容器像特定應用程式。
    - **`CMD`：** 提供 `ENTRYPOINT` 預設參數，或無 `ENTRYPOINT` 時定義啟動指令。
    - **Shell vs Exec 形式：** 優先用 exec 形式（`["command", "arg1", "arg2"]`），訊號處理與程序管理較佳。
    - **彈性：** 組合可同時提供預設行為與執行時自訂。
- **Copilot 指引：**
    - `ENTRYPOINT` 用於可執行檔，`CMD` 用於參數（如 `ENTRYPOINT ["/app/start.sh"]`, `CMD ["--config", "prod.conf"]`）。
    - 簡單啟動可用 `CMD ["executable", "param1"]`。
    - 優先用 exec 形式，訊號處理較佳。
    - 複雜啟動邏輯可用 shell script 作 entrypoint。
- **專家提示：** `ENTRYPOINT` 讓映像像可執行檔，`CMD` 提供預設參數，兼具彈性與清楚。

### **8. 用環境變數設定**
- **原則：** 用環境變數或掛載設定檔外部化設定，提升可攜性與可設定性。
- **深入說明：**
    - **執行時設定：** 用環境變數設定不同環境（資料庫、API 端點、功能旗標）。
    - **預設值：** 用 `ENV` 設預設值，執行時可覆寫。
    - **設定驗證：** 啟動時驗證必要環境變數，缺漏即失敗。
    - **安全性：** Dockerfile 不可硬編密碼。
- **Copilot 指引：**
    - 避免硬編設定，`ENV` 設預設值，執行時可覆寫。
    - 建議應用程式啟動時驗證環境變數。
    - 複雜應用可用設定管理工具或外部設定服務。
    - 敏感設定建議用秘密管理方案。
- **範例（環境變數最佳實踐）：**
```dockerfile
# 設預設值
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# 建構時變數
ARG BUILD_VERSION
ENV APP_VERSION=$BUILD_VERSION

# 應用程式啟動時應驗證必要環境變數
CMD ["node", "dist/main.js"]
```

## 容器安全最佳實踐

### **1. 非 root 使用者**
- **原則：** 容器以 root 執行有重大安全風險，生產環境應避免。
- **深入說明：**
    - **權限提升：** root 容器若有漏洞，可能逃逸至主機。
    - **檔案系統存取：** root 容器可存取所有檔案，可能暴露主機敏感資料。
    - **網路存取：** root 容器可綁定特權埠口，可能干擾主機網路。
    - **資源濫用：** root 容器可無限制消耗系統資源。
- **Copilot 指引：**
    - Dockerfile 一律定義非 root `USER`，建立專屬使用者。
    - 非 root 使用者僅有執行應用所需最低權限。
    - Dockerfile 前段即用 `USER`，後續操作皆用非 root。
    - 可用使用者命名空間或其他安全功能。
- **範例（安全使用者建立）：**
```dockerfile
# 建立專屬使用者與群組
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 設定應用檔案擁有權
RUN chown -R appuser:appgroup /app

# 切換至非 root 使用者
USER appuser

# 確保可寫入必要目錄
VOLUME ["/app/data"]
```

### **2. 極簡基礎映像**
- **原則：** 映像越小，套件越少，漏洞越少，攻擊面越小。
- **深入說明：**
    - **攻擊面降低：** 每個套件都是潛在漏洞，越少越安全。
    - **更新頻率：** 極簡映像更新快，漏洞暴露時間短。
    - **資源效率：** 小型映像佔用儲存與頻寬少。
    - **建構速度：** 小型映像建構快，易於安全掃描。
- **Copilot 指引：**
    - 優先用 `alpine`、`slim`、`distroless`，避免完整發行版。
    - 定期用安全掃描工具檢查基礎映像漏洞。
    - 語言專用映像用極簡版本（如 `openjdk:17-jre-slim`）。
    - 隨時更新基礎映像以獲得安全修補。
- **範例（極簡基礎映像選擇）：**
```dockerfile
# 不佳：完整發行版，套件多
FROM ubuntu:20.04

# 佳：Alpine 極簡映像
FROM node:18-alpine

# 更佳：Distroless，安全性最高
FROM gcr.io/distroless/nodejs18-debian11
```

### **3. Dockerfile 靜態安全分析（SAST）**
- **原則：** 建構前掃描 Dockerfile，檢查安全設定與已知漏洞。
- **深入說明：**
    - **Dockerfile Lint：** 用 `hadolint` 等工具檢查最佳實踐與安全問題。
    - **基礎映像掃描：** 建構前掃描基礎映像漏洞。
    - **CI/CD 整合：** 安全掃描納入 CI/CD 流程，及早發現問題。
    - **政策強制：** 定義安全政策並用自動化掃描強制執行。
- **Copilot 指引：**
    - 推薦在 CI 流程整合 `hadolint`（Dockerfile lint）與 `Trivy`、`Clair`、`Snyk Container`（映像漏洞掃描）。
    - 建議 Dockerfile 與映像皆自動掃描。
    - 基礎映像有重大漏洞時建構失敗。
    - 定期掃描登錄庫映像，檢查新發現漏洞。
- **範例（CI 安全掃描）：**
```yaml
# GitHub Actions 範例
- name: Run Hadolint
  run: |
    docker run --rm -i hadolint/hadolint < Dockerfile

- name: Scan image for vulnerabilities
  run: |
    docker build -t myapp .
    trivy image myapp
```

### **4. 映像簽章與驗證**
- **原則：** 確保映像未被竄改且來自可信來源。
- **深入說明：**
    - **加密簽章：** 用數位簽章驗證映像真實性與完整性。
    - **信任政策：** 定義信任政策，規範哪些映像可在環境中執行。
    - **供應鏈安全：** 映像簽章是軟體供應鏈安全關鍵。
    - **法規遵循：** 多數法規要求生產環境映像簽章。
- **Copilot 指引：**
    - 生產環境建議用 Notary 或 Docker Content Trust 進行映像簽章與驗證。
    - 建議所有生產映像在 CI/CD 流程簽章。
    - 設定信任政策，禁止執行未簽章映像。
    - 可用 Cosign 等新工具取得進階簽章功能。
- **範例（Cosign 映像簽章）：**
```bash
# 簽章映像
cosign sign -key cosign.key myregistry.com/myapp:v1.0.0

# 驗證映像
cosign verify -key cosign.pub myregistry.com/myapp:v1.0.0
```

### **5. 限制權限與唯讀檔案系統**
- **原則：** 限制容器權限，盡量唯讀存取，降低攻擊面。
- **深入說明：**
    - **Linux 權限：** 移除不必要 Linux 權限。
    - **唯讀根目錄：** 根檔案系統唯讀，防止執行時修改。
    - **Seccomp Profiles：** 用 seccomp 限制容器可呼叫的系統呼叫。
    - **AppArmor/SELinux：** 用安全模組加強存取控管。
- **Copilot 指引：**
    - 可用 `CAP_DROP` 移除不必要權限（如 `NET_RAW`, `SYS_ADMIN`）。
    - 敏感資料與設定檔建議掛載唯讀卷。
    - 容器執行環境可用安全設定檔與政策。
    - 多層安全控管，防禦深度。
- **範例（權限限制）：**
```dockerfile
# 移除不必要權限
RUN setcap -r /usr/bin/node

# 或 docker run --cap-drop=ALL --security-opt=no-new-privileges myapp
```

### **6. 映像層不得含敏感資料**
- **原則：** 絕不在映像層包含密碼、私鑰或憑證，這些會留在映像歷史。
- **深入說明：**
    - **層歷史：** 所有加入映像的檔案都會留在歷史，即使後續刪除仍可取出。
    - **建構參數：** `--build-arg` 可傳遞建構時資料，但勿用於敏感資訊。
    - **執行時秘密：** 用秘密管理方案於執行時注入敏感資料。
    - **映像掃描：** 定期掃描映像，檢查是否誤含秘密。
- **Copilot 指引：**
    - 建構時暫時秘密可用 build-arg，但勿直接傳遞敏感資訊。
    - 執行時秘密用 Kubernetes Secrets、Docker Secrets、HashiCorp Vault 等方案。
    - 建議定期掃描映像，檢查是否誤含秘密。
    - 多階段建構可避免建構時秘密留在最終映像。
- **反模式：** `ADD secrets.txt /app/secrets.txt`
- **範例（安全秘密管理）：**
```dockerfile
# 不佳：絕不可這樣做
# COPY secrets.txt /app/secrets.txt

# 佳：執行時用秘密
# 應用程式從環境變數或掛載檔案讀取秘密
CMD ["node", "dist/main.js"]
```

### **7. 健康檢查（Liveness & Readiness Probes）**
- **原則：** 實作健康檢查，確保容器執行中且可服務流量。
- **深入說明：**
    - **Liveness 檢查：** 檢查應用是否存活，失敗則重啟容器。
    - **Readiness 檢查：** 檢查應用是否可接收流量，失敗則移出負載平衡。
    - **健康檢查設計：** 檢查需輕量、快速且能準確反映健康狀態。
    - **編排整合：** 健康檢查對 Kubernetes 等編排系統至關重要。
- **Copilot 指引：**
    - Dockerfile 定義 `HEALTHCHECK`，編排系統必須。
    - 健康檢查需針對應用，檢查實際功能。
    - 健康檢查間隔與逾時需平衡反應與負擔。
    - 複雜應用可同時實作 liveness 與 readiness。
- **範例（完整健康檢查）：**
```dockerfile
# 檢查應用是否回應
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:8080/health || exit 1

# 或用應用程式專屬健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
```

## 容器執行時與編排最佳實踐

### **1. 資源限制**
- **原則：** 限制 CPU 與記憶體，防止資源耗盡與鄰近容器干擾。
- **深入說明：**
    - **CPU 限制：** 限制容器 CPU 使用，防止影響其他容器。
    - **記憶體限制：** 限制容器記憶體，防止耗盡系統資源。
    - **資源請求：** 設定資源請求，確保容器有最低資源。
    - **監控：** 持續監控資源使用，確保限制適當。
- **Copilot 指引：**
    - Docker Compose 或 Kubernetes 設定 `cpu_limits`、`memory_limits`。
    - 持續監控資源使用，調整限制。
    - 同時設定請求與限制，確保資源分配可預測。
    - Kubernetes 可用資源配額管理整體資源。
- **範例（Docker Compose 資源限制）：**
```yaml
services:
  app:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### **2. 日誌與監控**
- **原則：** 收集並集中容器日誌與指標，提升可觀測性與疑難排解。
- **深入說明：**
    - **結構化日誌：** 用結構化日誌（JSON），便於解析與分析。
    - **日誌聚合：** 集中所有容器日誌，便於搜尋、分析與警示。
    - **指標收集：** 收集應用與系統指標，監控效能。
    - **分散式追蹤：** 實作分散式追蹤，掌握跨服務請求流程。
- **Copilot 指引：**
    - 容器日誌用標準輸出（STDOUT/STDERR）。
    - 整合 Fluentd、Logstash、Loki 等日誌聚合工具，Prometheus、Grafana 等監控工具。
    - 應用程式實作結構化日誌，提升可觀測性。
    - 設定日誌輪替與保存政策，管理儲存成本。
- **範例（結構化日誌）：**
```javascript
// 應用程式日誌
const winston = require('winston');
const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});
```

### **3. 永續儲存**
- **原則：** 有狀態應用需用持久卷，確保資料跨容器重啟不遺失。
- **深入說明：**
    - **卷類型：** 依需求用命名卷、bind mount 或雲端儲存。
    - **資料持久性：** 資料可跨容器重啟、更新與遷移。
    - **備份策略：** 實作備份，防止資料遺失。
    - **效能：** 選擇符合效能需求的儲存方案。
- **Copilot 指引：**
    - 需持久資料用 Docker Volumes 或 Kubernetes Persistent Volumes。
    - 勿將持久資料存於容器可寫層。
    - 建議實作備份與災難復原。
    - 雲端儲存方案可提升延展性與可靠性。
- **範例（Docker Volume 用法）：**
```yaml
services:
  database:
    image: postgres:13
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password

volumes:
  postgres_data:
```

### **4. 網路**
- **原則：** 用定義好的容器網路，確保容器間通訊安全且隔離。
- **深入說明：**
    - **網路隔離：** 為不同應用層或環境建立獨立網路。
    - **服務發現：** 用編排系統自動服務發現。
    - **網路政策：** 實作網路政策，控管容器間流量。
    - **負載平衡：** 用負載平衡分散流量至多個容器。
- **Copilot 指引：**
    - 建立自訂 Docker 網路，提升服務隔離與安全。
    - Kubernetes 設定網路政策，控管 pod 間通訊。
    - 用編排平台服務發現機制。
    - 多層應用實作網路分段。
- **範例（Docker 網路設定）：**
```yaml
services:
  web:
    image: nginx
    networks:
      - frontend
      - backend

  api:
    image: myapi
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true
```

### **5. 編排（Kubernetes, Docker Swarm）**
- **原則：** 用編排器管理大規模容器化應用。
- **深入說明：**
    - **自動擴展：** 依需求與資源自動擴展。
    - **自我修復：** 自動重啟失敗容器，替換不健康實例。
    - **服務發現：** 內建服務發現與負載平衡。
    - **滾動更新：** 零停機更新並自動回滾。
- **Copilot 指引：**
    - 複雜、大型部署建議用 Kubernetes。
    - 善用編排器自動擴展、自我修復、服務發現。
    - 滾動更新策略確保零停機。
    - 編排環境需妥善資源管理與監控。
- **範例（Kubernetes 部署）：**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

## Dockerfile 審查檢查清單

- [ ] 是否有多階段建構（編譯型語言、重型建構工具）？
- [ ] 是否用極簡且明確的基礎映像（如 `alpine`、`slim`、有版本）？
- [ ] 層是否最佳化（合併 `RUN` 指令、同層清理）？
- [ ] 是否有完整 `.dockerignore`？
- [ ] `COPY` 指令是否精簡且明確？
- [ ] 是否定義非 root `USER`？
- [ ] 是否用 `EXPOSE` 文件化埠口？
- [ ] `CMD` 與/或 `ENTRYPOINT` 是否正確使用？
- [ ] 敏感設定是否用環境變數處理（未硬編）？
- [ ] 是否定義 `HEALTHCHECK`？
- [ ] 映像層是否誤含秘密或敏感資料？
- [ ] 是否有 Hadolint、Trivy 等靜態分析工具整合至 CI？

## Docker 建構與執行疑難排解

### **1. 映像過大**
- 檢查層是否含不必要檔案。用 `docker history <image>`。
- 用多階段建構。
- 用更小基礎映像。
- 最佳化 `RUN` 指令並清理暫存檔。

### **2. 建構緩慢**
- 指令順序由最少變動到最常變動，善用快取。
- 用 `.dockerignore` 排除無關檔案。
- 疑難排解快取問題可用 `docker build --no-cache`。

### **3. 容器無法啟動或崩潰**
- 檢查 `CMD` 與 `ENTRYPOINT` 指令。
- 檢查容器日誌（`docker logs <container_id>`）。
- 確保所有相依都在最終映像。
- 檢查資源限制。

### **4. 容器內權限問題**
- 檢查映像檔案/目錄權限。
- 確保 `USER` 有操作所需權限。
- 檢查掛載卷權限。

### **5. 網路連線問題**
- 檢查暴露埠口（`EXPOSE`）與發佈埠口（`-p`）。
- 檢查容器網路設定。
- 檢查防火牆規則。

## 結論

有效的 Docker 容器化是現代 DevOps 的基礎。遵循這些 Dockerfile 建構、映像最佳化、安全與執行管理最佳實踐，可協助開發者建立高效、安全且可攜的應用。隨著應用演進，請持續評估與優化容器策略。

---

<!-- 容器化與 Docker 最佳實踐指引結束 --> 
