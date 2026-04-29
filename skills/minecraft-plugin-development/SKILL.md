---
name: 'minecraft-plugin-development'
description: '在建構或修改適用於 Paper、Spigot 或 Bukkit 的 Minecraft 伺服器外掛程式時使用此技能，包含 plugin.yml 設定、命令、監聽器、排程器、玩家狀態、團隊或競技場系統、持久化進度、經濟或個人檔案資料、設定檔、Adventure 文字以及版本安全的 API 用法。針對「建構 Minecraft 外掛程式」、「增加 Paper 命令」、「修復 Bukkit 監聽器」、「建立 plugin.yml」、「實作小遊戲機制」、「增加特長 (Perk) 或任務系統」或「偵錯伺服器外掛程式行為」等請求觸發。'
---

# Minecraft 外掛程式開發

在 Paper、Spigot 和 Bukkit 生態系統中進行 Minecraft 伺服器外掛程式工作時，請使用此技能。

此技能對於重度遊戲玩法的外掛程式特別有用，例如戰鬥系統、波次或 Boss 戰、對戰或團隊模式、競技場、工具包 (Kit) 系統、基於冷卻時間的能力、計分板以及由設定驅動的遊戲規則。

如需參考取自真實 Paper 外掛程式的紮實實作模式，請根據需要載入以下文件：

- [`references/project-patterns.md`](references/project-patterns.md)：查看在真實遊戲外掛程式中常見的高階架構模式。
- [`references/bootstrap-registration.md`](references/bootstrap-registration.md)：了解 `onEnable`、命令連接、監聽器註冊和關閉預期。
- [`references/state-sessions-and-phases.md`](references/state-sessions-and-phases.md)：了解玩家工作階段 (Session) 建模、遊戲階段、比賽狀態和重新連線安全邏輯。
- [`references/config-data-and-async.md`](references/config-data-and-async.md)：了解設定管理員、資料庫支援的玩家資料、異步排清和 UI 重新整理任務。
- [`references/maps-heroes-and-feature-modules.md`](references/maps-heroes-and-feature-modules.md)：了解地圖輪替、英雄或職業系統，以及模組化功能成長。
- [`references/minigame-instance-flow.md`](references/minigame-instance-flow.md)：了解競技場執行個體、倒數計時、戰利品重新整理、波次系統、可見性隔離和實體對遊戲的所有權。
- [`references/persistent-progression-and-events.md`](references/persistent-progression-and-events.md)：了解具有個人檔案、特長 (Perks)、增益 (Buffs)、任務、經濟、自訂領域事件和擴充註冊表的長期執行 PvP 伺服器。
- [`references/build-test-and-runtime-validation.md`](references/build-test-and-runtime-validation.md)：了解 Maven 或 Gradle 打包、陰影 (Shaded) 相依性、產生的資源、軟相依性、設定驗證命令和首輪伺服器測試計畫。

## 範圍

- 包含範圍：Paper、Spigot、Bukkit 外掛程式開發。
- 包含範圍：`plugin.yml`、命令、Tab 補全、監聽器、排程器、設定、權限、Adventure 文字、玩家狀態、小遊戲流程、競技場執行個體、地圖副本、戰利品、波次、持久化個人檔案、特長、增益、任務、經濟以及 PvP/PvE 遊戲迴圈。
- 包含範圍：基於 Java 的伺服器外掛程式架構、偵錯、重構和功能實作。
- 預設排除範圍：Fabric 模組 (Mods)、Forge 模組、用戶端模組、Bedrock 附加元件 (Add-ons)。

如果使用者提到「Minecraft 外掛程式」但技術堆疊不明確，請先確認專案是 Paper/Spigot/Bukkit 還是模組堆疊。

## 預設工作風格

當此技能觸發時：

1. 識別伺服器 API 和目標版本。
2. 識別建構系統和 Java 版本。
3. 檢查 `plugin.yml`、主外掛程式類別以及命令或監聽器註冊。
4. 在編輯程式碼前規劃遊戲流程：
   - 玩家生命週期
   - 遊戲階段
   - 計時器和排程任務
   - 團隊、競技場或比賽狀態
   - 設定與持久化
5. 進行最小程度的連貫變更，保持註冊、設定和執行階段行為一致。

如果外掛程式是重度遊戲玩法或具備狀態的，請在編輯前閱讀 [`references/project-patterns.md`](references/project-patterns.md) 和 [`references/state-sessions-and-phases.md`](references/state-sessions-and-phases.md)。

如果任務涉及競技場隔離、地圖執行個體、箱子或資源補給、怪物波次生成、路徑投票、觀戰者可見性或特定遊戲的聊天，也請閱讀 [`references/minigame-instance-flow.md`](references/minigame-instance-flow.md)。

如果任務涉及持久化玩家進度、個人檔案儲存、經濟獎勵、特長、增益、任務、自訂戰鬥事件或長期執行的共享 PvP 伺服器，也請閱讀 [`references/persistent-progression-and-events.md`](references/persistent-progression-and-events.md)。

如果任務涉及建構檔案、`plugin.yml` Metadata、陰影相依性、產生的資源輸出、部署到測試伺服器、選用的外掛程式整合或發佈驗證，也請閱讀 [`references/build-test-and-runtime-validation.md`](references/build-test-and-runtime-validation.md)。

## 專案探索檢查表

若存在以下項，請先檢查：

- `plugin.yml`
- `pom.xml`、`build.gradle` 或 `build.gradle.kts`
- 擴充 `JavaPlugin` 的外掛程式主類別
- 命令執行器 (Command executors) 和 Tab 補全器
- 監聽器類別
- `config.yml`、訊息、工具包 (Kits)、競技場或自訂 YAML 檔案的設定引導程式碼
- 產生的資源輸出，例如 `target/classes`、`build/resources` 或複製的外掛程式 jar 檔案
- 透過 Bukkit 排程器 API 使用的排程器
- 任何玩家資料、團隊狀態、競技場狀態或比賽狀態容器

## 核心規則

### 偏好儲存庫中的具體伺服器 API

- 如果專案已經以 Paper API 為目標，請繼續使用 Paper 優先的 API，除非明確要求通用 Bukkit 相容性，否則不要降級。
- 不要假設某個 API 存在於所有版本中。請先檢查現有的相依性和周圍的程式碼風格。

### 保持註冊同步

增加命令、權限或監聽器時，請在同一次變更中更新相關的註冊點：

- `plugin.yml`
- `onEnable` 中的外掛程式啟動註冊
- 程式碼中的任何權限檢查
- 任何相關的設定或訊息鍵值

### 尊重主執行緒邊界

- 不要從異步 (Async) 任務觸發世界狀態、實體、背包、計分板或大多數 Bukkit API 物件，除非該 API 明確允許。
- 針對外部 I/O、繁重計算或資料庫工作使用異步任務，然後在套用遊戲玩法變更前切換回主執行緒。

### 將遊戲玩法建模為狀態，而非分散的布林值

對於遊戲外掛程式，偏好使用明確的狀態物件而非重複的旗標：

- 比賽或遊戲階段
- 玩家角色或職業
- 冷卻狀態
- 團隊成員身分
- 競技場分配
- 存活、淘汰、觀戰或排隊狀態

當功能影響重度比賽的小遊戲或持續對戰玩法時，請在修復症狀前先尋找隱藏的狀態轉換。

對於多競技場外掛程式，請隔離每個遊戲的可見性、聊天接收者、計分板、戰利品和實體所有權。不要讓一個競技場意外地觀察或變更另一個競技場。

### 偏好由設定驅動的數值

當功能包含傷害、冷卻、獎勵、時長、訊息、地圖設定或切換開關時：

- 偏好由設定支援的數值，而非硬編碼
- 提供合理的預設值
- 保持鍵名穩定且易讀
- 驗證或清理缺失的數值

### 謹慎處理重新載入 (Reload) 行為

- 除非程式碼已經很好地支援，否則避免承諾安全的熱載入 (Hot reload)。
- 在設定重新載入時，確保記憶體內快取、排程任務和遊戲狀態得到一致的處理。

## 實作模式

### 命令

對於新命令：

- 將命令加入 `plugin.yml`
- 實作執行器和所需的 Tab 補全
- 在轉型為 `Player` 前驗證發送者類型
- 分離解析、權限檢查和遊戲邏輯
- 針對無效用法發送清晰的玩家端回饋

最小化註冊結構：

```yaml
commands:
  arena:
    description: 加入或離開競技場
    usage: /arena <join|leave>
```

```java
@Override
public void onEnable() {
    ArenaCommand command = new ArenaCommand(gameService);
    PluginCommand arena = getCommand("arena");
    if (arena != null) {
        arena.setExecutor(command);
        arena.setTabCompleter(command);
    }
}
```

### 監聽器

對於事件監聽器：

- 提早防護並提早返回
- 檢查目前的玩家、競技場或遊戲階段是否應處理該事件
- 避免在頻繁觸發的事件（如移動、傷害或互動洗版）中執行昂貴的工作
- 在可行之處集中處理重複的檢查

### 排程任務

對於計時器、回合、倒數計時、冷卻或定期檢查：

- 當需要取消功能時，請儲存任務控制代碼
- 在外掛程式停用以及比賽或競技場結束時取消任務
- 除非明確打算，否則避免為同一個遊戲疑慮啟動多個重疊任務
- 偏好使用一個具權威性的遊戲迴圈，而非許多鬆散協調的重複任務
- 確保倒數或補給任務在遊戲離開預期狀態時自我取消

主執行緒交接結構：

```java
Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
    PlayerData data = repository.load(playerId);
    Bukkit.getScheduler().runTask(plugin, () -> {
        Player player = Bukkit.getPlayer(playerId);
        if (player != null && player.isOnline()) {
            scoreboard.update(player, data);
        }
    });
});
```

### 玩家與比賽狀態

對於每位玩家或每場比賽的狀態：

- 明確定義所有權
- 在退出、踢出、死亡、比賽結束和外掛程式停用時進行清理
- 避免因以 `Player` 為鍵的過時映射表而導致記憶體外洩
- 除非嚴格需要活的玩家物件，否則偏好使用 `UUID` 進行持久追蹤

### 文字與訊息

當專案使用 Adventure 或 MiniMessage 時：

- 遵循現有的格式化方式
- 無特殊原因請避免混用舊版顏色代碼和 Adventure 樣式
- 當訊息面向遊戲玩法時，保持訊息範本可配置

## 高風險區域

編輯以下內容時請格外小心：

- 傷害處理和自訂戰鬥邏輯
- 死亡、重生、觀戰和淘汰流程
- 競技場加入和離開流程
- 計分板或 Boss 血量條更新
- 背包異動和工具包分配
- 異步資料庫或檔案存取
- 經濟、任務、特長和個人檔案異動
- 自訂事件發送或擴充註冊表
- 版本敏感的 API 呼叫
- `onDisable` 中的關閉和清理
- 跨競技場的可見性、聊天和廣播隔離
- 地圖複製、卸載和資料夾刪除邏輯
- 怪物、NPC、拋射物或臨時實體的所有權
- 箱子或資源補給系統

## 輸出預期

在實作或修訂外掛程式程式碼時：

- 產生可執行的 Java 程式碼，而非虛擬碼，除非使用者要求僅進行設計。
- 提到任何對 `plugin.yml`、設定檔、建構檔案或資源的必要更新。
- 明確指出版本假設。
- 若存在執行緒安全或 API 相容性風險，請指出。
- 保留專案現有的慣例和資料夾結構。

當請求的變更涉及外掛程式啟動、異步資料、比賽流程、職業系統或輪替地圖時，請在編輯前諮詢相應的參考檔案。

## 驗證檢查表

在結束前，盡可能驗證以下項：

- 命令、監聽器或功能已正確註冊
- `plugin.yml` 與實作的行為一致
- 匯入和 API 類型與目標伺服器堆疊相符
- 排程器使用安全
- 程式碼中引用的設定鍵值存在或具備預設值
- 存在比賽結束、玩家退出和外掛程式停用的狀態清理路徑
- 每個競技場的聊天、可見性、計分板和廣播皆已隔離
- 臨時世界、怪物、任務和產生的資源已清理乾淨
- 無明顯的空值、轉型或生命週期風險

## 常見陷阱

- 在未檢查的情況下將 `CommandSender` 轉型為 `Player`
- 從異步任務更新 Bukkit 狀態
- 忘記註冊監聽器或在 `plugin.yml` 中宣告命令
- 使用 `Player` 物件作為長生命週期的映射鍵（使用 `UUID` 更安全）
- 在回合、競技場或外掛程式關閉後仍保留重複執行的任務
- 硬編碼應存在於設定中的遊戲玩法常數
- 在以 Spigot 為目標的外掛程式中使用僅限 Paper 的 API
- 將重新載入視為無代價，儘管具狀態的外掛程式常在重新載入時損壞
- 跨不相關的遊戲執行個體進行廣播、顯示玩家或套用計分板更改
- 在箱子/容器方塊的區塊可用前載入或異動它們
- 忘記從所屬遊戲中註銷產生的怪物或臨時實體
- 編輯 `target/classes` 或 `build/resources` 下產生的檔案，而非 `src/main/resources` 下的原始檔案

## 建議的回應結構

對於重大的請求，請按以下結構組織工作：

1. 目前外掛程式背景和假設
2. 遊戲玩法或生命週期影響
3. 程式碼變更
4. 必要的註冊或設定更新
5. 驗證與剩餘風險

對於小型請求，保持回答簡潔，但仍需提到任何必要的 `plugin.yml`、設定或生命週期更新。
