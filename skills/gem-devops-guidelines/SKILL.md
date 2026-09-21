---
name: 'gem-devops-guidelines'
description: '設計或審查基礎架構、部署、CI/CD、Docker、Kubernetes、健康檢查、復原、功能旗標、上線準備程度與行動裝置發布工作流程。適用於 DevOps、平台、容器、管線或發布工作。'
---

# DevOps 指引

僅套用與工作負載/提供者/環境/驗收條件相關的章節。當不適用時，跳過 Docker、Kubernetes、行動裝置、上線、復原、健康、功能旗標、安全性檢查。

## 部署策略

- 滾動更新（預設）：漸進式、零停機替換。
- 藍綠部署：重複環境、不可分割切換、即時復原、2 倍基礎架構。
- 金絲雀：先引導少量 % 流量；需要流量分割。

## Docker

- 固定基礎映像標籤（`node:22-alpine`）；絕不使用 `:latest`。
- 多階段建置 + 非 root 使用者。先複製相依套件以利快取。
- `.dockerignore`：`node_modules`、`.git`、測試。定義 `HEALTHCHECK` + 資源限制。

## Kubernetes

設定啟動、就緒、存活探針，並搭配適合工作負載的初始延遲/閾值。

## CI/CD

- PR：lint -> 類型檢查 -> 單元 -> 整合 -> 預覽。
- Main：建置 -> 預行準備（staging）-> 冒煙 -> 上線。

## 健康與關機

- 簡易：`GET /health` -> `{ "status": "ok" }`。
- 詳細：相依性、正常執行時間、版本。
- 當工作負載需要時，服務必須公開有意義的健康檢查並平關處理 `SIGTERM`。

## 設定

使用環境變數（Twelve-Factor），依環境區分。在啟動時驗證並快速失敗。絕不提交機密或硬式編碼 `NODE_ENV=production`。

## 復原

- Kubernetes：`kubectl rollout undo`。
- Vercel：`vercel rollback`。
- Docker：重新部署前一個固定的映像。

## 功能旗標

- 生命週期：建立 -> 啟用 -> 5% -> 25% -> 50% -> 100% -> 移除旗標 + 停用程式碼。
- 每個旗標必須有負責人、過期時間、復原觸發條件。兩週內移除。

## 檢查清單

- 部署前：測試通過、程式碼審查、環境變數、移轉、復原計畫。
- 部署後：健康正常、已受監控、舊 Pod 已終止、結果已記錄。
- 上線環境：測試通過；無硬式編碼機密；JSON 記錄；有意義的健康狀態；固定版本；已驗證環境變數；資源限制；TLS；CVE 掃描；CORS；速率限制；CSP/HSTS/X-Frame-Options；已測試復原；操作手冊；輪值支援。
- 將安全性/CVE 檢查套用至可執行或安全性敏感的工作負載。

## 行動裝置部署

- EAS：`eas build:configure`；`eas build -p ios|android --profile preview`；`eas update --branch production`；`--auto-submit`。
- Fastlane：iOS `match`/`cert`/`sigh`/`pilot`；Android Gradle/`supply`。
- 憑證置於 env/機密儲存區中，絕不置於 Git。使用 `fastlane match` 自動化 iOS 簽署；Android 使用 `keytool` + Google Play 應用程式簽署。
- TestFlight：內部即時；外部 90 天/100 位測試人員。Google Play：內部/測試版/上線正式版。預期 1–7 天審核。
- 復原：EAS `eas update:rollback`；原生發布 -> 還原建置；商店發布 -> 減少分段推出比例。
