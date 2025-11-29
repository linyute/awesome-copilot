---
description: 'Azure DevOps Pipeline YAML 檔案的最佳實踐'
applyTo: '**/azure-pipelines.yml, **/azure-pipelines*.yml, **/*.pipeline.yml'
---

# Azure DevOps Pipeline YAML 最佳實踐

## 一般準則

- 始終如一地使用 YAML 語法，並使用正確的縮排（2 個空格）
- 始終為管線、階段、作業和步驟包含有意義的名稱和顯示名稱
- 實施適當的錯誤處理和條件執行
- 使用變數和參數使管線可重用和可維護
- 遵循服務連線和權限的最小權限原則
- 包含全面的日誌記錄和診斷以進行故障排除

## 管線結構

- 使用階段組織複雜的管線，以實現更好的視覺化和控制
- 使用作業對相關步驟進行分組，並在可能的情況下啟用並行執行
- 實施階段和作業之間適當的依賴關係
- 使用範本來實現可重用的管線組件
- 保持管線檔案的重點和模組化 - 將大型管線拆分為多個檔案

## 建置最佳實踐

- 使用特定的代理程式池版本和 VM 映像以保持一致性
- 快取依賴項（npm、NuGet、Maven 等）以提高建置效能
- 實施適當的構件管理，並使用有意義的名稱和保留策略
- 使用建置變數來表示版本號和建置元數據
- 包含程式碼品質門（linting、測試、安全掃描）
- 確保建置可重現且與環境無關

## 測試整合

- 將單元測試作為建置過程的一部分執行
- 以標準格式（JUnit、VSTest 等）發布測試結果
- 包含程式碼覆蓋率報告和品質門
- 在適當的階段實施整合和端到端測試
- 在可用時使用測試影響分析來優化測試執行
- 在測試失敗時快速失敗以提供快速回饋

## 安全考量

- 使用 Azure Key Vault 儲存敏感配置和機密
- 使用變數組實施適當的機密管理
- 使用具有最小所需權限的服務連線
- 啟用安全掃描（依賴項漏洞、靜態分析）
- 為生產部署實施審批門
- 在可能的情況下使用受管識別而不是服務主體

## 部署策略

- 實施適當的環境升級（開發 → 預備 → 生產）
- 使用具有適當環境目標的部署作業
- 在適當的時候實施藍綠或金絲雀部署策略
- 包含回滾機制和健康檢查
- 使用基礎設施即程式碼（ARM、Bicep、Terraform）進行一致的部署
- 為每個環境實施適當的配置管理

## 變數和參數管理

- 使用變數組在管線之間共享配置
- 實施運行時參數以實現靈活的管線執行
- 根據分支或環境使用條件變數
- 保護敏感變數並將其標記為機密
- 記錄變數用途和預期值
- 使用變數範本處理複雜的變數邏輯

## 效能優化

- 在適當的時候使用並行作業和矩陣策略
- 為依賴項和建置輸出實施適當的快取策略
- 當不需要完整歷史記錄時，對 Git 操作使用淺層複製
- 使用多階段建置和層快取優化 Docker 映像建置
- 監控管線效能並優化瓶頸
- 有效利用管線資源觸發器

## 監控與可觀察性

- 在整個管線中包含全面的日誌記錄
- 使用 Azure Monitor 和 Application Insights 進行部署追蹤
- 實施適當的故障和成功通知策略
- 包含部署健康檢查和自動回滾觸發器
- 使用管線分析來識別改進機會
- 記錄管線行為和故障排除步驟

## 範本與可重用性

- 為常見模式建立管線範本
- 使用 extends 範本實現完整的管線繼承
- 實施步驟範本以實現可重用的任務序列
- 使用變數範本處理複雜的變數邏輯
- 適當地版本化範本以確保穩定性
- 記錄範本參數和使用範例

## 分支和觸發策略

- 為不同的分支類型實施適當的觸發器
- 使用路徑篩選器僅在相關檔案更改時觸發建置
- 為 main/master 分支配置適當的 CI/CD 觸發器
- 使用拉取請求觸發器進行程式碼驗證
- 實施排程觸發器以執行維護任務
- 考慮多儲存庫場景的資源觸發器

## 範例結構

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    exclude:
      - docs/*
      - README.md

variables:
  - group: shared-variables
  - name: buildConfiguration
    value: 'Release'

stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: Build
        displayName: 'Build Application'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: UseDotNet@2
            displayName: 'Use .NET SDK'
            inputs:
              version: '8.x'
          
          - task: DotNetCoreCLI@2
            displayName: 'Restore dependencies'
            inputs:
              command: 'restore'
              projects: '**/*.csproj'
          
          - task: DotNetCoreCLI@2
            displayName: 'Build application'
            inputs:
              command: 'build'
              projects: '**/*.csproj'
              arguments: '--configuration $(buildConfiguration) --no-restore'

  - stage: Deploy
    displayName: 'Deploy to Staging'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployToStaging
        displayName: 'Deploy to Staging Environment'
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  displayName: 'Download drop artifact'
                  artifact: drop
                - task: AzureWebApp@1
                  displayName: 'Deploy to Azure Web App'
                  inputs:
                    azureSubscription: 'staging-service-connection'
                    appType: 'webApp'
                    appName: 'myapp-staging'
                    package: '$(Pipeline.Workspace)/drop/**/*.zip'
```

## 應避免的常見反模式

- 直接在 YAML 檔案中硬編碼敏感值
- 使用過於寬泛的觸發器，導致不必要的建置
- 在單一階段中混合建置和部署邏輯
- 未實施適當的錯誤處理和清理
- 使用已棄用的任務版本而沒有升級計劃
- 建立難以維護的單體管線
- 未使用適當的命名約定以提高清晰度
- 忽略管線安全最佳實踐
