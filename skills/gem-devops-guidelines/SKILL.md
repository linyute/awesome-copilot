---
name: 'gem-devops-guidelines'
description: '設計或審查基礎設施、部署、CI/CD、Docker、Kubernetes、健康檢查、復原、特性旗標 (feature flags)、生產就緒與行動發布工作流程。用於 DevOps、平台、容器、管線或發布任務。'
---

# DevOps 指引

## 部署策略

- 滾動更新 (Rolling，預設)：漸進式、零停機時間替換。
- 藍綠部署 (Blue-green)：重複的環境、不可部分完成的切換 (atomic cutover)、即時復原、2 倍基礎設施。
- 金絲雀發布 (Canary)：先路由小百分比流量；需要流量分割能力。

## Docker

- 固定特定基礎映像檔標籤（例如 `node:22-alpine`）；絕不使用 `:latest`。
- 使用多階段建構與非 root 使用者。先複製相依性以利快取。
- `.dockerignore`：`node_modules`、`.git`、測試。定義 `HEALTHCHECK` 與資源限制。

## Kubernetes

設定啟動 (startup)、就緒 (readiness) 與存活 (liveness) 探針，並搭配適合工作負載的初始延遲與門檻值。

## CI/CD

- PR：lint → 型別檢查 → 單元測試 → 整合測試 → 預覽。
- Main：建構 → staging → 冒煙測試 → 正式環境。

## 健全度與關機

- 簡易：`GET /health` → `{ "status": "ok" }`。
- 詳細：相依性、正常運作時間 (uptime)、版本。
- 當工作負載需要時，服務必須公開有意義的健康狀態並優雅地處理 `SIGTERM`。

## 設定

使用環境變數（Twelve-Factor），依環境區隔。在啟動時驗證並快速失敗。絕不提交機密資訊或硬編碼 `NODE_ENV=production`。

## 復原

Kubernetes：`kubectl rollout undo`。Vercel：`vercel rollback`。Docker：重新部署先前固定的映像檔。

## 特性旗標

- 生命週期：建立 → 啟用 → 5% → 25% → 50% → 100% → 移除旗標與無用程式碼。
- 每個旗標必須擁有負責人、到期日與復原觸發條件。在兩週內移除。

## 檢核清單

- 部署前（適用時）：通過測試、程式碼審查、環境變數、資料庫移轉、復原計畫。
- 部署後服務：健康、受監控、舊 Pod 已終止、結果已記錄。
- 正式環境服務：通過測試；無硬編碼機密；JSON 日誌；有意義的健康狀態；固定版本；驗證過的環境變數；資源限制；TLS；CVE 掃描；CORS；速率限制；CSP/HSTS/X-Frame-Options；測試過的復原；操作手冊 (runbook)；值班安排。
- 對可執行或安全性敏感的工作負載套用安全性/CVE 檢查。

## 行動端部署

- EAS：`eas build:configure`；`eas build -p ios|android --profile preview`；`eas update --branch production`；`--auto-submit`。
- Fastlane：iOS `match`/`cert`/`sigh`/`pilot`；Android Gradle/`supply`。
- 將憑證保留在環境/機密儲存區中，絕不可放在 Git。使用 `fastlane match` 自動化 iOS 開發/發發布簽署；Android 使用 `keytool` 與 Google Play 應用程式簽署。
- TestFlight：內部即時；外部 90 天/100 名測試者。Google Play：內部/測試版/正式發布。預計需要 1–7 天審查期。
- 復原：EAS `eas update:rollback`；原生發布 → 復原建構；商店發布 → 調降階段性推出百分比。
