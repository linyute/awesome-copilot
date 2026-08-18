# Power Platform Architect 外掛程式
![banner](https://i.imgur.com/rIJLfiL.png)
這是一個適用於 GitHub Copilot 的外掛程式，扮演 **Microsoft Power Platform 資深解決方案架構師**的角色。提供業務需求、使用案例描述，甚至是會議記錄逐字稿，它就能產生量身打造的技術架構，包含元件建議以及選用的 Mermaid.js 圖表。

## 安裝
```bash
copilot plugin install power-platform-architect@awesome-copilot
```

## 示範
*按一下下方圖片以觀看此 agent skill 的快速示範！*

[![link](https://i.imgur.com/UnImFhl.png)](https://youtu.be/tn4jEpZ6jiw)

## 包含內容
### Skills
| Skill | 描述 |
| --- | --- |
| `power-platform-architect` | 根據業務需求產生功能性 Power Platform 架構 |

## 運作方式
此 skill 引導 agent 進行結構化的多階段流程（雖然輸出會無縫呈現給使用者）：

1. **需求分析** — 掃描所提供的資料以找出專案關係人、資料來源、安全性需求及功能性要求。記錄目前的（「現況」）流程並識別阻礙點。
2. **後續問題** — agent 會提出釐清問題以填補落差（例如：「這是供行動現場工作人員還是桌面後勤使用者使用？」、「觸發此流程的條件為何？」）。若使用者無法回答，則會做出合理假設。
3. **元件建議** — 僅選取在解決方案中發揮實際作用的 Power Platform 元件，並說明每個元件所扮演的角色。它遵循內建的決策架構（例如：外部存取 → Power Pages、資料儲存 → Dataverse、對話式介面 → Copilot Studio）。
4. **架構敘述** — 提供以業務流程為導向的架構建議，敘述資料如何在系統中流動的「故事」、哪些元件處理每個步驟，以及哪些使用者群體在每個點進行互動。
5. **架構圖（選用）** — 根據要求產生視覺化架構的 Mermaid.js 圖表，儲存至 `.md` 檔案，並指引使用者前往 [mermaid.ai/live/edit](https://mermaid.ai/live/edit) 進行轉譯。

您只需做一件事：**提供問題陳述**！您甚至可以提供描述問題/需求的會議記錄逐字稿：

![example](https://i.imgur.com/IH1JsPZ.jpeg)

此 skill 涵蓋完整的 Power Platform 生態系統：**Power Apps**（Canvas、Model-Driven、Code Apps）、**Power Pages**、**Copilot Studio**、**Power Automate**（雲端與桌面流程）、**AI Builder**、**Dataverse**、**Power BI**、**連接器**以及**閘道**。

## 範例提示詞
- *"檢閱我們探索會議的這份逐字稿，並告訴我該如何建構。"*
- *"針對這個人資入職培訓使用案例，我應該使用哪些 Power Platform 元件？"*
- *"為連接至 SQL 並使用核准流程的 Power Apps 解決方案產生架構圖。"*

## 範例輸出架構圖（於 [mermaid](https://mermaid.js.org/) 中轉譯）
![example](https://i.imgur.com/eR1Og3W.png)

## 範例輸出架構摘要
```
Solution Architecture — End-to-End Process

1. Application Submission (Residents & Contractors → Power Pages)

Residents and solar contractors visit the Evergreen County Solar Permit Portal (Power Pages). The portal presents a
guided application form with required fields, document upload slots (site plan, electrical diagrams, signed
checklist), and fee acknowledgment. Built-in form validation prevents submission if mandatory fields are blank or
required attachments are missing — this is the first line of defense against incomplete applications.

For walk-in or mailed applications, Marcus's team enters the data directly into the Model-Driven App, which enforces
the same required-field rules.

All submitted applications land in Dataverse with a status of Submitted.

2. Automated Completeness Check (Power Automate + AI Builder)

Upon submission, a Power Automate cloud flow (automated trigger: new record created) fires immediately. It performs
a programmatic completeness check — verifying all required attachments are present, fee acknowledgment is recorded,
and applicant details are complete.

For uploaded documents, AI Builder's Document Processing model scans the site plan and signed forms to verify that
signature fields are not blank and key data areas are populated. This catches the subtle defects Marcus described —
"referenced but not included" attachments and illegible or unsigned documents.

 - If complete: The permit status advances to Under Review and the flow routes it to the assigned plan reviewer 
(Jim's team).
 - If incomplete: The status is set to Incomplete, and Power Automate sends an automated email notification to the 
applicant via the Outlook connector detailing exactly what's missing. The applicant can log back into the Power 
Pages portal to upload corrections. No staff time is consumed.

3. Plan Review & Approval (Jim's Team → Model-Driven App)

The assigned plan reviewer opens the permit in the Model-Driven App, which surfaces all applicant data, documents,
and the AI validation results in a single view. The reviewer evaluates the application and either:

 - Approves → Power Automate advances the status to Approved – Pending Inspection and notifies the applicant via 
email that their permit is approved and an inspection will be scheduled.
 - Requests Revisions → Status set to Revisions Requested, the applicant is emailed with specific feedback, and they
 resubmit through the portal.
 - Denies → Status set to Denied with documented reasoning; applicant is notified.

4. Inspection Scheduling & Field Work (Sarah's Team → Canvas App Mobile)

Once a permit reaches Approved – Pending Inspection, Marcus's team schedules an inspection date via the Model-Driven
App. The applicant is notified of the date through an automated email.

Before leaving the office, Sarah opens the Canvas App on her phone/tablet and reviews her day's inspection queue.
Each permit shows its live status — if a fee issue surfaced or the applicant requested a reschedule, Sarah sees it
immediately and can reroute to a ready site. No more wasted 40-minute drives.

On-site, Sarah uses the Canvas App to:

 - Complete a structured inspection checklist (roof mounts, junction boxes, conduit, serial plates)
 - Capture photos directly through the app — each photo is automatically linked to the permit record in Dataverse at
 the moment it's taken (no more manual matching from a memory card)
 - Record pass/fail results and notes

Results sync to Dataverse in real time. The moment Sarah submits, the office has the inspection outcome — not days
later.

5. Permit Issuance or Corrective Action (Power Automate)

When Sarah submits inspection results:

 - Pass → Power Automate sets status to Permit Issued, generates a confirmation, and notifies the applicant that 
their solar installation is approved.
 - Fail → Status set to Inspection Failed – Corrections Required, with Sarah's notes and photos attached. The 
applicant is notified of required corrections and can schedule a re-inspection through the portal.

6. Self-Service Status Tracking (Residents & Contractors → Power Pages)

At any point in this process, residents and contractors can log into the Power Pages portal and see their permit's
current status, what stage it's in, whether payment has been recorded, and what the next step is. This directly
addresses the top three phone questions Marcus cited:

 1. ✅ "Did you receive my check?" → Payment status visible on portal
 2. ✅ "What is the status of my permit?" → Live stage tracking
 3. ✅ "When is the inspector coming?" → Scheduled date displayed

7. Live Analytics & Audit Readiness (Elena & Jim → Power BI)

A Power BI dashboard connects directly to Dataverse and provides:

 - Time-to-Permit metrics (average, median, by stage)
 - Backlog heatmap — how many permits are sitting in each stage right now
 - Inspection throughput — inspections completed per day/week, pass/fail rates
 - "Green Energy" permit counts by quarter — the exact metric the County Auditor requests
 - Incomplete application rate trends — tracking whether the portal validation is reducing the 40% defect rate

Elena can answer Board and Auditor questions on demand with live data — no staff time diverted to manual counting.

-------------------------------------------------------------------------------------------------------------------

Summary

This architecture replaces the disconnected paper-based process with a single integrated data backbone (Dataverse)
that every stakeholder touches through the right interface for their role:

┌──────────────────────────┬─────────────────────┬──────────────────────────┐
│ Audience                 │ Interface           │ Purpose                  │
├──────────────────────────┼─────────────────────┼──────────────────────────┤
│ Residents & Contractors  │ Power Pages Portal  │ Submit, track, resubmit  │
├──────────────────────────┼─────────────────────┼──────────────────────────┤
│ Marcus (Intake)          │ Model-Driven App    │ Review, schedule, manage │
├──────────────────────────┼─────────────────────┼──────────────────────────┤
│ Jim (Planning/Review)    │ Model-Driven App    │ Approve/reject permits   │
├──────────────────────────┼─────────────────────┼──────────────────────────┤
│ Sarah (Field Inspectors) │ Canvas App (Mobile) │ Inspect, capture, submit │
├──────────────────────────┼─────────────────────┼──────────────────────────┤
│ Elena & Jim (Leadership) │ Power BI Dashboards │ Monitor, report, audit   │
└──────────────────────────┴─────────────────────┴──────────────────────────┘

The expected impact directly addresses Elena's four strategic needs and Jim's prediction: cut the backlog in half
without hiring a single new person.
```

## 來源
由 Microsoft 資深 AI 解決方案工程師 [Tim Hanewich](https://timh.ai) 建立。

## 授權
MIT
