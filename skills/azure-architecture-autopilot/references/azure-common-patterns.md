# Azure 常用模式 (穩定)

此檔案僅包含在各項 Azure 服務中重複出現的**近乎不可變模式**。
API 版本、SKU 與區域等動態資訊不包含在此處 → 請參閱 `azure-dynamic-sources.md`。

---

## 1. 網路隔離模式

### 私人端點 (Private Endpoint) 三件式元件組合

所有使用 PE 的服務必須設定這三件式元件組合：

1. **私人端點 (Private Endpoint)** — 放置於 pe-subnet 中
2. **私人 DNS 區域 (Private DNS Zone)** + **VNet 連結 (VNet Link)** (`registrationEnabled: false`)
3. **DNS 區域群組 (DNS Zone Group)** — 連結至 PE

> 如果缺少其中任何一項，即使存在 PE，DNS 解析也會失敗，導致連線失敗。

### PE 子網路必要設定

```bicep
resource peSubnet 'Microsoft.Network/virtualNetworks/subnets' = {
  properties: {
    addressPrefix: peSubnetPrefix              // ← CIDR 作為參數 — 防止與現有網路衝突
    privateEndpointNetworkPolicies: 'Disabled'  // ← 必要項目。否則 PE 部署會失敗
  }
}
```

### publicNetworkAccess 模式

使用 PE 的服務必須包含：
```bicep
properties: {
  publicNetworkAccess: 'Disabled'
  networkAcls: {
    defaultAction: 'Deny'
  }
}
```

---

## 2. 安全性模式

### Key Vault

```bicep
properties: {
  enableRbacAuthorization: true    // 請勿使用存取政策 (Access Policy) 模式
  enableSoftDelete: true
  softDeleteRetentionInDays: 90
  enablePurgeProtection: true
}
```

### 受控識別 (Managed Identity)

當 AI 服務存取其他資源時：
```bicep
identity: {
  type: 'SystemAssigned'  // 或 'UserAssigned'
}
```

### 敏感資訊

- 使用 `@secure()` 裝飾器
- 不要將純文字儲存在 `.bicepparam` 檔案中
- 使用 Key Vault 參考

---

## 3. 命名慣例 (基於 CAF)

```
rg-{project}-{env}          資源群組 (Resource Group)
vnet-{project}-{env}        虛擬網路 (Virtual Network)
st{project}{env}             儲存體帳號 (Storage Account) (無特殊字元，僅限小寫字母與數字)
kv-{project}-{env}           Key Vault
srch-{project}-{env}         AI Search
foundry-{project}-{env}      Cognitive Services (Foundry)
```

> 防止名稱衝突：建議使用 `uniqueString(resourceGroup().id)`
> ```bicep
> param storageName string = 'st${uniqueString(resourceGroup().id)}'
> ```

---

## 4. Bicep 模組結構

```
<project>/
├── main.bicep              # 協調 (Orchestration) — 模組呼叫 + 參數傳遞
├── main.bicepparam         # 環境特定數值 (不含敏感資訊)
└── modules/
    ├── network.bicep           # VNet, 子網路
    ├── <service>.bicep         # 各個服務的模組
    ├── keyvault.bicep          # Key Vault
    └── private-endpoints.bicep # 所有 PE + DNS 區域 + VNet 連結
```

### 相依性管理 (Dependency Management)

```bicep
// ✅ 正確做法：透過資源參考建立隱含相依性
resource project '...' = {
  properties: {
    parentId: foundry.id  // 參考 foundry → 自動先部署 foundry
  }
}

// ❌ 避免做法：顯式 dependsOn (僅在必要時使用)
```

---

## 5. PE Bicep 常用範本

```bicep
// ── 私人端點 (Private Endpoint) ──
resource pe 'Microsoft.Network/privateEndpoints@<fetch>' = {
  name: 'pe-${serviceName}'
  location: location
  properties: {
    subnet: { id: peSubnetId }
    privateLinkServiceConnections: [{
      name: 'pls-${serviceName}'
      properties: {
        privateLinkServiceId: serviceId
        groupIds: ['<groupId>']  // ← 視服務而定。請參閱 service-gotchas.md
      }
    }]
  }
}

// ── 私人 DNS 區域 (Private DNS Zone) ──
resource dnsZone 'Microsoft.Network/privateDnsZones@<fetch>' = {
  name: '<dnsZoneName>'  // ← 視服務而定
  location: 'global'
}

// ── VNet 連結 ──
resource vnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@<fetch>' = {
  parent: dnsZone
  name: '${dnsZone.name}-link'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnetId }
    registrationEnabled: false  // ← 必須為 false
  }
}

// ── DNS 區域群組 (DNS Zone Group) ──
resource dnsGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@<fetch>' = {
  parent: pe
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [{
      name: 'config'
      properties: { privateDnsZoneId: dnsZone.id }
    }]
  }
}
```

> `@<fetch>`：部署前請務必從 MS 文件核實最新的穩定 API 版本。
