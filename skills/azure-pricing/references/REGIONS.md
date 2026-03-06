# Azure 區域名稱參考 (Azure Region Names Reference)

Azure 零售價格 API 要求 `armRegionName` 值必須為全小寫且不含空格。請使用此對照表將常見的區域名稱對應至其 API 值。

## 區域對照表 (Region Mapping)

| 顯示名稱 | armRegionName |
|-------------|---------------|
| 美國東部 (East US) | `eastus` |
| 美國東部 2 (East US 2) | `eastus2` |
| 美國中部 (Central US) | `centralus` |
| 美國北中部 (North Central US) | `northcentralus` |
| 美國南中部 (South Central US) | `southcentralus` |
| 美國西中部 (West Central US) | `westcentralus` |
| 美國西部 (West US) | `westus` |
| 美國西部 2 (West US 2) | `westus2` |
| 美國西部 3 (West US 3) | `westus3` |
| 加拿大中部 (Canada Central) | `canadacentral` |
| 加拿大東部 (Canada East) | `canadaeast` |
| 巴西南部 (Brazil South) | `brazilsouth` |
| 北歐 (North Europe) | `northeurope` |
| 西歐 (West Europe) | `westeurope` |
| 英國南部 (UK South) | `uksouth` |
| 英國西部 (UK West) | `ukwest` |
| 法國中部 (France Central) | `francecentral` |
| 法國南部 (France South) | `francesouth` |
| 德國西中部 (Germany West Central) | `germanywestcentral` |
| 德國北部 (Germany North) | `germanynorth` |
| 瑞士北部 (Switzerland North) | `switzerlandnorth` |
| 瑞士西部 (Switzerland West) | `switzerlandwest` |
| 挪威東部 (Norway East) | `norwayeast` |
| 挪威西部 (Norway West) | `norwaywest` |
| 瑞典中部 (Sweden Central) | `swedencentral` |
| 義大利北部 (Italy North) | `italynorth` |
| 波蘭中部 (Poland Central) | `polandcentral` |
| 西班牙中部 (Spain Central) | `spaincentral` |
| 東亞 (East Asia) | `eastasia` |
| 東南亞 (Southeast Asia) | `southeastasia` |
| 日本東部 (Japan East) | `japaneast` |
| 日本西部 (Japan West) | `japanwest` |
| 澳洲東部 (Australia East) | `australiaeast` |
| 澳洲東南部 (Australia Southeast) | `australiasoutheast` |
| 澳洲中部 (Australia Central) | `australiacentral` |
| 韓國中部 (Korea Central) | `koreacentral` |
| 韓國南部 (Korea South) | `koreasouth` |
| 印度中部 (Central India) | `centralindia` |
| 印度南部 (South India) | `southindia` |
| 印度西部 (West India) | `westindia` |
| 阿聯北部 (UAE North) | `uaenorth` |
| 阿聯中部 (UAE Central) | `uaecentral` |
| 南非北部 (South Africa North) | `southafricanorth` |
| 南非西部 (South Africa West) | `southafricawest` |
| 卡達中部 (Qatar Central) | `qatarcentral` |

## 轉換規則

1. 移除所有空格
2. 轉換為小寫
3. 範例：
   - "East US" → `eastus`
   - "West Europe" → `westeurope`
   - "Southeast Asia" → `southeastasia`
   - "South Central US" → `southcentralus`

## 常見別名

使用者可能會以非正式的方式提及區域。請將這些名稱對應至正確的 `armRegionName`：

| 使用者說法 | 對應至 |
|-----------|---------|
| "US East" (美東), "Virginia" (維吉尼亞) | `eastus` |
| "US West" (美西), "California" (加州) | `westus` |
| "Europe" (歐洲), "EU" | `westeurope`（預設） |
| "UK" (英國), "London" (倫敦) | `uksouth` |
| "Asia" (亞洲), "Singapore" (新加坡) | `southeastasia` |
| "Japan" (日本), "Tokyo" (東京) | `japaneast` |
| "Australia" (澳洲), "Sydney" (雪梨) | `australiaeast` |
| "India" (印度), "Mumbai" (孟買) | `centralindia` |
| "Korea" (韓國), "Seoul" (首爾) | `koreacentral` |
| "Brazil" (巴西), "São Paulo" (聖保羅) | `brazilsouth` |
| "Canada" (加拿大), "Toronto" (多倫多) | `canadacentral` |
| "Germany" (德國), "Frankfurt" (法蘭克福) | `germanywestcentral` |
| "France" (法國), "Paris" (巴黎) | `francecentral` |
| "Sweden" (瑞典), "Stockholm" (斯德哥爾摩) | `swedencentral` |
