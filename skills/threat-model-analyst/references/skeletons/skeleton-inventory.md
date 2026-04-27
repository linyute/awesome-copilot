# 骨幹: threat-inventory.json

> **⛔ 使用下方顯示的精確欄位名稱。常見錯誤：`display_name` (錯誤→`display`)、`category` (錯誤→`stride_category`)、`name` (錯誤→`title`)。**
> **⛔ 下方的範本僅為了可讀性而顯示在程式碼區塊中 — 請勿在產出的檔案中包含程式碼區塊圍欄。`.json` 檔案必須在第 1 行以 `{` 開頭。**

---

```json
{
  "schema_version": "[FILL: 獨立版為 1.0，增量版為 1.1]",
  "report_folder": "[FILL: threat-model-YYYYMMDD-HHmmss]",
  "commit": "[FILL: 短 SHA]",
  "commit_date": "[FILL: 提交日期 UTC]",
  "branch": "[FILL]",
  "repository": "[FILL: 遠端 URL]",
  "analysis_timestamp": "[FILL: UTC 時間戳記]",
  "model": "[FILL]",

  "components": [
    [重複：依 ID 排序]
    {
      "id": "[FILL: PascalCase]",
      "display": "[FILL: 顯示名稱 — 而非 display_name]",
      "type": "[FILL: process / external_service / data_store / external_interactor]",
      "tmt_type": "[FILL: 來自 tmt-element-taxonomy.md 的 SE.P.TMCore.* / SE.EI.TMCore.* / SE.DS.TMCore.*]",
      "boundary": "[FILL: 邊界 ID]",
      "boundary_kind": "[FILL: MachineBoundary / NetworkBoundary / ClusterBoundary / ProcessBoundary / PrivilegeBoundary / SandboxBoundary]",
      "aliases": [],
      "source_files": ["[FILL: 相對路徑]"],
      "source_directories": ["[FILL: 相對目錄]"],
      "fingerprint": {
        "component_type": "[FILL: process / external_service / data_store / external_interactor]",
        "boundary_kind": "[FILL: MachineBoundary / NetworkBoundary / ClusterBoundary / ProcessBoundary / PrivilegeBoundary / SandboxBoundary]",
        "source_files": ["[FILL: 相對路徑]"],
        "source_directories": ["[FILL: 相對目錄 — 對於處理程序 (process) 類型，此項不得為空]"],
        "class_names": ["[FILL]"],
        "namespace": "[FILL]",
        "config_keys": [],
        "api_routes": [],
        "dependencies": [],
        "inbound_from": ["[FILL: 傳送資料到此元件的元件 ID]"],
        "outbound_to": ["[FILL: 此元件傳送資料到的元件 ID]"],
        "protocols": ["[FILL: gRPC / HTTPS / SQL / 等]"]
      },
      "sidecars": ["[FILL: 同時部署的 sidecar 名稱，或空陣列]"]
    }
    [結束重複]
  ],

  "boundaries": [
    [重複：依 ID 排序]
    {
      "id": "[FILL: PascalCase 邊界 ID]",
      "display": "[FILL]",
      "kind": "[FILL: MachineBoundary / NetworkBoundary / ClusterBoundary / ProcessBoundary / PrivilegeBoundary / SandboxBoundary]",
      "aliases": [],
      "contains": ["[FILL: 元件 ID]"],
      "contains_fingerprint": "[FILL: 排序後並以垂直線分隔的元件 ID]"
    }
    [結束重複]
  ],

  "flows": [
    [重複：依 ID 排序]
    {
      "id": "[FILL: DF_Source_to_Target]",
      "from": "[FILL: 來源元件 ID]",
      "to": "[FILL: 目標元件 ID]",
      "protocol": "[FILL]",
      "description": "[FILL: 最多 1 句]"
    }
    [結束重複]
  ],

  "threats": [
    [重複：依 ID 排序，然後依 identity_key.component_id 排序]
    {
      "id": "[FILL: T##.X]",
      "title": "[FILL: 簡短標題 — 必填]",
      "description": "[FILL: 1 句 — 必填]",
      "stride_category": "[FILL: S/T/R/I/D/E/A — 單一字母，而非全名]",
      "tier": [FILL: 1/2/3],
      "prerequisites": "[FILL]",
      "status": "[FILL: Open/Mitigated/Platform]",
      "mitigation": "[FILL: 1 句或留空]",
      "identity_key": {
        "component_id": "[FILL: PascalCase — 必須在 identity_key 內，而非頂層]",
        "data_flow_id": "[FILL: DF_Source_to_Target]",
        "stride_category": "[FILL: S/T/R/I/D/E/A]",
        "attack_surface": "[FILL: 攻擊面的簡短描述]"
      }
    }
    [結束重複]
  ],

  "findings": [
    [重複：依 ID 排序，然後依 identity_key.component_id 排序]
    {
      "id": "[FILL: FIND-##]",
      "title": "[FILL]",
      "severity": "[FILL: Critical/Important/Moderate/Low]",
      "cvss_score": [FILL: N.N],
      "cvss_vector": "[FILL: CVSS:4.0/AV:...]",
      "cwe": "[FILL: CWE-###]",
      "owasp": "[FILL: A##:2025]",
      "tier": [FILL: 1/2/3],
      "effort": "[FILL: Low/Medium/High]",
      "related_threats": ["[FILL: T##.X]"],
      "evidence_files": ["[FILL: 相對路徑]"],
      "component": "[FILL: 顯示名稱]",
      "identity_key": {
        "component_id": "[FILL: PascalCase]",
        "vulnerability": "[FILL: CWE-###]",
        "attack_surface": "[FILL: file:key 或端點]"
      }
    }
    [結束重複]
  ],

  "metrics": {
    "total_components": [FILL],
    "total_boundaries": [FILL],
    "total_flows": [FILL],
    "total_threats": [FILL],
    "total_findings": [FILL],
    "threats_by_tier": { "T1": [FILL], "T2": [FILL], "T3": [FILL] },
    "findings_by_tier": { "T1": [FILL], "T2": [FILL], "T3": [FILL] },
    "threats_by_stride": { "S": [FILL], "T": [FILL], "R": [FILL], "I": [FILL], "D": [FILL], "E": [FILL], "A": [FILL] },
    "findings_by_severity": { "Critical": [FILL], "Important": [FILL], "Moderate": [FILL], "Low": [FILL] }
  }
}
```

**強制性欄位名稱合規性：**
- `"display"` — 而非 `"display_name"`, `"name"`
- `"stride_category"` — 而非 `"category"` — 單一字母 (S/T/R/I/D/E/A)
- `"title"` 與 `"description"` — 每個威脅皆為必填
- `identity_key.component_id` — 元件連結位於 identity_key 內部，而非頂層
- 在寫入之前，以決定性方式對所有陣列進行排序
