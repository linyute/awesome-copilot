---
description: '審查與編寫 devcontainer.json、Dev Container Features 和 Codespaces 生命週期設定的十二條具備出處之規則。每條規則皆引用 Dev Container 規格、參考 CLI 原始碼或官方廠商文件，陳述具體的修正方式，且僅需讀取檔案而無需執行指令。'
applyTo: '**/devcontainer.json,**/.devcontainer.json,**/.devcontainer/**,**/devcontainer-feature.json'
---

# Dev Container 設定

審查與編寫 `devcontainer.json`、Dev Container Features 以及 GitHub Codespaces 與參考 CLI 所依據之生命週期設定的十二條規則。每條規則皆陳述其主張、應留意的內容以及具體的變更，並連結其來源出處，以便查證主張而非盲目採信。

此處的每條規則都是一項讀取任務。有些僅需 `devcontainer.json`；有些還需讀取 Feature 的 `devcontainer-feature.json` 或其 `install.sh`；有些則讀取儲存庫中持有的其他內容 —— Codespaces 預建（prebuild）或 CI 設定、Dockerfile 步驟、校正擁有權的指令碼。皆不需要建構映像檔、啟動容器或安裝 `devcontainer` CLI —— 這正是使其可用於完全無法執行指令之程式碼審查的原因。

有兩條規則容易被過度套用。在針對 `remoteEnv` 中的秘密（secrets）或 `updateRemoteUserUID` 提出任何標示之前，請先閱讀標記為**不要回報**的段落。

## 檔案告訴你的事，以及沒告訴你的事

在執行階段，`devcontainer.json` 會與烘焙至映像檔中的 `devcontainer.metadata` 標籤合併，且規格的 image-metadata 章節指出：「當順序有影響時，會以 devcontainer.json 為最後考量。」

因此，檔案中**存在**的值會在該合併中勝出並可予以採信。檔案中**不存在**的值仍可能由映像檔標籤提供，單憑該檔案無法得知其不存在。請說明檔案陳述了什麼，並說明標籤可能在何處仍會變更它。不要將生命週期指令、`waitFor`、`remoteEnv`、`containerEnv`、`mounts`、`remoteUser`、`containerUser`、`updateRemoteUserUID` 或 `userEnvProbe` 的缺失回報為該行為不存在的證明。

**若某個屬性可免於該注意事項，請從正向標記中判讀 —— 絕不要從缺失中推斷。** 屬性參考為每個可儲存的屬性加上標記：「標有 🏷️ 的 Metadata 屬性除了 `devcontainer.json` 之外，亦可儲存於 `devcontainer.metadata` **容器映像檔標籤**中。」*未標記的列*證明該屬性無法儲存於標籤中。**完全沒有列出**的屬性則是來源未提及的項目，而沉默並不代表免疫。不要透過將一個清單減去另一個清單來取得免疫性：image-metadata 文件聲明其自身的列舉是開放的 ——「隨著我們為 dev container 設定與 feature metadata 新增更多屬性，我們可以新增至這些清單中。」—— 且開放清單的補集並非既定事實。

以此方式解讀，在下述規則所推論的屬性中，`features`、`overrideFeatureInstallOrder` 和 `appPort` 具有未標記的列，並被證明無法儲存於標籤中。頂層的 `extensions`、`settings` 和 `devPort` 是 VS Code 結構描述屬性，在參考資料中完全沒有列出：雙向皆未經證實，因此請勿稱其對標籤免疫。

這對下方的已棄用屬性規則毫無影響，因為保護它的不是免疫性而是**方向**。它僅回報在設定中能*看見*的鍵，而在檔案中存在的值會在合併中勝出 —— 因此這三個未經證實的名稱可能會使其遺漏發現，但絕不會產生錯誤報告。這使發現具備合理性；但這並未使該規則對標籤免疫，兩者並非同一件事。請將相同的測試套用至此處的每條規則：回報檔案所陳述的內容，並說明標籤可能在何處仍會變更它。

來源：<https://containers.dev/implementors/spec/>、<https://containers.dev/implementors/json_reference/> 與 <https://github.com/devcontainers/spec/blob/main/docs/specs/image-metadata.md>

## 生命週期指令

### 可快取的設定屬於 `onCreateCommand` 或 `updateContentCommand`，絕不屬於 `postCreateCommand`

Codespaces 預建執行「直到並包含 `devcontainer.json` 檔案中任何 `onCreateCommand` 與 `updateContentCommand` 指令的設定作業。在建立預建的過程中不會執行任何 `postCreateCommand` 指令。」參考 CLI 的 `--prebuild` 旗標行為相同：它在 `updateContentCommand` 之後停止並重新執行它。因此遺留在 `postCreateCommand` 中的相依性安裝絕不會被烘焙至預建中，並在每次 codespace 啟動時重新付出成本。

尋找 `postCreateCommand` 中昂貴且可快取的工作 —— `npm ci`、`npm install`、`yarn install`、`pnpm install`、`pip install`、`poetry install`、`bundle install`、`go mod download`、`cargo fetch`、`apt-get install`、`make`、`gradle`、`mvn` —— 同時 `onCreateCommand` 和 `updateContentCommand` 不存在或微不足道。逐項檢查物件形式，而非僅檢查字串形式。

**修正方式：** 將可快取的部分移至 `onCreateCommand`，參考資料將其描述為雲端服務在「快取或預建容器時」所使用。「這意味著它通常無法存取使用者範圍的資產或秘密」，或移至 `updateContentCommand`，這些服務「也會定期執行...以重新整理快取或預建的容器」。在 `postCreateCommand` 中僅保留需要指派之使用者自身憑證或權限的工作。

**範圍。** 這只會對實際使用預建的專案產生成本 —— Codespaces 預建設定，或呼叫 `devcontainer up --prebuild` 的 CI 工作。從未進行預建的儲存庫在 `postCreateCommand` 中安裝相依性並沒有錯。請據實說明而非回報為缺陷。

來源：<https://docs.github.com/en/codespaces/prebuilding-your-codespaces/about-github-codespaces-prebuilds> 與 <https://containers.dev/implementors/json_reference/>

### `waitFor` 僅接受剛好五個值，且 `postAttachCommand` 並非其中之一

基礎結構描述確立了列舉：`"enum": [ "initializeCommand", "onCreateCommand", "updateContentCommand", "postCreateCommand", "postStartCommand" ]`，描述為「在 UI 啟動時於背景繼續執行之前所要等待的使用者指令。預設為 \"updateContentCommand\"。」

這五個字串以外的任何值都是無效的。`postAttachCommand` 是人們常選的值，因為它是真實的生命週期掛鉤，且是列舉中唯一缺失的值。在一般工作流程中沒有任何機制會捕捉這個錯誤：參考 CLI 會剖析並合併設定，但不會針對 JSON 結構描述進行驗證，因此無效的 `waitFor` 會不受阻礙地傳遞給工具，而結構描述註冊僅會在編輯器階段產生波浪底線。（後者機制未見於任何文件說明；其可經由檢驗查證 —— 請將其視為背景知識，而非引述資料。）

**修正方式：** 從這五個值中選擇。若意圖為「封鎖直到我的設定完成」，則該值為 `postCreateCommand`，而非 `postAttachCommand`。若意圖是使用預設值，請刪除該屬性。請注意預設值所隱含的意義：`postCreateCommand` 在工具回報成功後於背景執行，因此緩慢的 `postCreateCommand` 並非當結。

來源：<https://github.com/devcontainers/spec/blob/main/schemas/devContainer.base.schema.json>

### 生命週期掛鉤接受字串、陣列或物件 —— 且物件項目為平行執行

規格將每個生命週期指令碼擴充為物件形式：「`object` 的鍵將是指令的唯一名稱，而值將是 `string` 或 `array` 指令。... 在該生命週期步驟中，`object` 中的每個項目都將平行執行。」

在套用任何其他生命週期規則之前，請先確定每個掛鉤使用這三種形式中的哪一種。字串透過 `/bin/sh` 執行，因此使用 `&&` 串接。陣列直接執行而無 shell，因此 `["npm start && npm test"]` 是一個 argv，而 `&&` 是逐字引數而非運算子。物件會同時執行每個項目：標示彼此之間假定具有順序關係的項目，例如一個項目建立目錄或資料庫，而另一個項目寫入其中。相同來源補充說明「每個指令都必須成功結束，該階段才會被視為成功」，因此單一平行項目失敗即導致整個階段失敗。

**修正方式：** 僅對真正獨立的工作使用物件形式。若項目必須具備先後順序，請將它們放在以 `&&` 連接的單一字串中，或放在由掛鉤呼叫的單一指令碼中。當引數必須逐字保留且不經過 shell 剖析時，請刻意使用陣列形式 —— 而非出於意外。

來源：<https://github.com/devcontainers/spec/blob/main/docs/specs/parallel-lifecycle-script-execution.md>

## 秘密與環境

### `remoteEnv` 預設會寫入映像檔 metadata 標籤中，因此其中的字面憑證可被任何能提取映像檔的人讀取

參考 CLI 定義了一個隱藏旗標：`'omit-config-remote-env-from-metadata': { type: 'boolean', default: false, hidden: true, description: 'Omit remoteEnv from devcontainer.json for container metadata label' }`。

*omit* 旗標上的 `default: false` 是 CLI 明確陳述省略功能處於關閉狀態 —— 除非你另有要求，否則 `remoteEnv` **會**被寫入 `devcontainer.metadata` 標籤中。`hidden: true` 更進一步說明：此旗標不會出現在 `--help` 中，因此操作員無法透過詢問工具來發現此行為。

**由值決定，而非鍵決定。無論鍵名稱為何，都不要**以任何嚴重性回報其值為替換參考 —— 帶有或不帶有 `:default` 的 `${localEnv:NAME}` 或 `${containerEnv:NAME}` —— 的項目。該字面值絕不會進入檔案，也絕不會到達映像檔標籤，而這正是本規則的整個主題。`"GITHUB_TOKEN": "${localEnv:GITHUB_TOKEN}"` 正是下方修正方式所規定的形式；標示它與規則本身的救濟措施互相矛盾。形似秘密的鍵名稱 —— `TOKEN`、`SECRET`、`KEY`、`PASSWORD`、`PASSWD`、`CREDENTIAL`、`_PAT` —— 是讀取其值的理由，絕非自行構成回報的理由。

回報外觀類似憑證的字面值：長而不透明的字串、可識別的前置詞（例如 `sk_`、`ghp_`、`github_pat_`、`AKIA`、`xoxb-`、`glpat-`）、PEM 標頭或內嵌密碼的連線字串。不要回報明顯非憑證的字面值 —— 環境名稱、連接埠、路徑、主機或不帶憑證的 URL。在字面值確實模稜兩可的情況下，讓鍵名稱決定方向：在形似秘密的鍵下，回報它，因為在 `PASSWORD` 下像 `hunter2` 這樣的短且低熵值仍然是一項發現，除非它是像 `changeme` 或 `<your-key-here>` 這樣明顯的預留位置；在任何其他鍵下，描述你所看到的內容，而非斷言發生洩漏。

對於字面值而言，`containerEnv` 比 `remoteEnv` 更糟，因為它會變成 Dockerfile 的 `ENV` 並烘焙至圖層中。請將相同的值測試（絕非鍵名稱測試）套用至在映像檔歷史紀錄中可見的 `build.args`。

**修正方式：** 在頂層 `secrets` 屬性下宣告名稱，以便設定能記載所需項目 —— 該屬性僅為宣告性質，不會插入任何內容 —— 並在執行階段於 `up` 或 `run-user-commands` 上透過 `--secrets-file <json>` 傳遞該值。若值必須留在 `remoteEnv` 中，請透過 `${localEnv:NAME}` 進行間接引用，以免字面值被提交，並請記住標籤仍會記錄該參考。**請勿將秘密檔案置於儲存庫中：** 工作區內的路徑距離透過 `git add .` 提交本規則旨在保護的秘密僅一步之遙。請將其置於使用者的家目錄下，或者，若必須存放在目錄樹中，請在同一變更中將其新增至 `.gitignore` 並使用 `git check-ignore` 進行驗證。

來源：<https://github.com/devcontainers/cli/blob/main/src/spec-node/devContainersSpecCLI.ts>

### `userEnvProbe` 決定生命週期環境能看見哪些 shell 啟動檔案

該屬性「指出用於 \"探測\" 要包含在 `devcontainer.json` 支援服務 / 工具程序中之使用者環境變數所使用的 shell 類型：`none`、`interactiveShell`、`loginShell` 或 `loginInteractiveShell`（預設）。」

`"none"` 是高訊號值：完全不會讀取任何啟動檔案，因此 Feature 或 Dockerfile 透過 `~/.bashrc` 或 `/etc/profile.d` 放入 `PATH` 的任何內容對生命週期指令皆不可見，即使同一容器中的互動式終端機能找到它。`"loginShell"` 與 `"interactiveShell"` 各自僅讀取一半的檔案 —— 同一頁面指出「bash 互動式 shell 通常會包含在 `/etc/bash.bashrc` 與 `~/.bashrc` 中設定的變數，而登入 shell 通常包含來自 `/etc/profile` 與 `~/.profile` 的變數。將此屬性設定為 `loginInteractiveShell` 將取得來自所有四個檔案的變數。」每當生命週期指令對明顯已安裝的工具失敗並顯示「找不到指令」時，請懷疑此規則。

**修正方式：** 偏好使用預設的 `loginInteractiveShell` 並刪除明確的 `userEnvProbe`，除非有特定需求依賴於縮小範圍。在環境完全不能依賴 shell 啟動檔案的情況下，請在 `containerEnv`（對容器中的每個程序可見）或 `remoteEnv`（僅對工具程序可見 —— 在將任何機密內容放入此處之前，請參閱上述秘密規則）中設定變數，或在生命週期指令中透過絕對路徑呼叫該工具。

來源：<https://containers.dev/implementors/json_reference/>

## Dev Container Features

### `overrideFeatureInstallOrder` 無法重新排序相依性邊緣

Features 規格明確指出：該屬性「絕不能影響由相依性圖形所定義的相依性關係...且應僅在基於回合的排序步驟中進行評估...在此屬性中，直到 Feature 的所有相依性（無論軟性或硬性）都安裝完畢之前，無法 \"提前引進\" 該 Feature。」

對照 `features` 中所列 Features 的 `dependsOn` 與 `installsAfter` 邊緣來審視 `overrideFeatureInstallOrder`。標示試圖將 Feature 置於其所相依項目之前的項目：所請求的順序將會以靜默方式不被採用。來自同一頁面的機制為該屬性將 `roundPriority` 指派給「符合該屬性中所提供 Feature 識別碼（省略版本）的所有節點」—— 優先權僅在回合*內*重新排序，絕不會將節點移入較早的回合中。同時標示列於此處但不在所安裝 Features 之中的識別碼；同一頁面說明工具對此「可能會使相依性解析步驟失敗」。

**修正方式：** 若排序是真實需求，請在 Feature 自身的 `dependsOn`（硬性、遞迴、可包含選項與鎖定版本）或 `installsAfter`（軟性、非遞迴、若指定的 Feature 未另外安裝則予以忽略）中表示。僅使用 `overrideFeatureInstallOrder` 來打破圖形未定之同分狀態。

來源：<https://containers.dev/implementors/features/>

### Feature 相依性解析僅在從 `devcontainer.json` 建立時進行一次 —— 且 Features 必須具備等冪性

引述自相依性規格：「對於後續從映像檔建立（或繼續執行 dev container），**不會**重新計算相依性樹狀結構。... 由於具有不同選項的兩個 Features 會被視為不同，單一 Feature 可能會被安裝超過一次。Features 應具備等冪性。」

有兩種徵兆。第一，從先前建構的 dev container 映像檔以 `FROM` 開頭的設定，並預期 Feature 版本升級或變更的 `dependsOn` 會生效：它不會生效，因為*已解析*的 Feature 組合在首次建立時已凍結至 `devcontainer.metadata` 標籤中。第二，以不同選項參照兩次的同一 Feature —— 直接在 `features` 中參照，或一次直接參照且一次被另一 Feature 的 `dependsOn` 引進 —— 這將會安裝兩次。若你負責編寫 Features，請檢視 `install.sh` 是否有非等冪步驟：未加防護地附加到 `PATH`、`~/.bashrc` 或 `/etc/profile.d`、未加檢查的 `useradd`、無條件的 `git clone`。

**修正方式：** 若要套用變更後的相依性，請從 `devcontainer.json` 重新建立，而非從映像檔重新建構 —— 來源說明必須刪除映像檔或 dev container 並重新建立。在編寫的 Feature 中，讓每個步驟皆可重新執行：使用標記 grep 防護附加操作、使用 `install -D`、在建立使用者前進行檢查，並使下載操作覆寫而非附加。

來源：<https://github.com/devcontainers/spec/blob/main/docs/specs/feature-dependencies.md>

### Feature 的 `install.sh` 以 root 執行，因此請從 `_REMOTE_USER` 讀取最終使用者，而非寫死使用者

「每個 Feature 的 `install.sh` 指令碼在容器映像檔建構期間應以 `root` 執行。... `_REMOTE_USER` 和 `_CONTAINER_USER` 環境變數會傳遞給 Features 指令碼，其中 `_CONTAINER_USER` 為容器的使用者」。家目錄有其專屬變數：「這兩位使用者的家目錄資料夾會作為 `_REMOTE_USER_HOME` 與 `_CONTAINER_USER_HOME` 環境變數傳遞給 Feature 指令碼。」

在編寫的 `install.sh` 中，標示寫死的 `vscode`、`node`、`codespace` 或 `root` 使用者名稱，並標示任何寫入計算為 `/home/$USER` 或 `~` 之家目錄的操作。在使用 Features 時，可見的徵兆是工作區或家目錄下的檔案由 `root` 擁有，導致 `remoteUser` 無法寫入。

**修正方式：** 從 `_REMOTE_USER` 讀取使用者，若無則降級回 `_CONTAINER_USER`（規格指出未設定 `remoteUser` 時兩者相等），並從 `_REMOTE_USER_HOME` 讀取家目錄。對於使用者範圍的工作，以 `su "$_REMOTE_USER" -c '...'` 放棄權限，或在以 root 寫入後執行 `chown -R "$_REMOTE_USER" "$_REMOTE_USER_HOME/<path>"`。絕不要假設基礎映像檔中存在 `sudo`。

來源：<https://containers.dev/implementors/features/>

## 使用者、擁有權與 UID

### 為避開繫結掛載效能懲罰所掛載的具名磁碟區以 root 擁有權啟動，需要明確的 `chown`

效能指引直接表明：「新增 `postCreateCommand` 以更新所掛載資料夾的擁有者，因為它可能已以 root 身分掛載」。

尋找具有 `type=volume` 的 `mounts` 項目 —— 通常是 `source=${localWorkspaceFolderBasename}-node_modules,target=${containerWorkspaceFolder}/node_modules,type=volume` —— 或是帶有 `type=volume` 的 `workspaceMount`，且該設定同時設定了非 root 的 `remoteUser` 或 `containerUser`。當沒有 `postCreateCommand` 對該目標進行 chown 時標示它。此失敗是在首次寫入掛載目錄時的權限錯誤，而非建構失敗，因此發現較晚。同一頁面指出若「你將在容器中以 `root` 身分執行，則不需要」此步驟 —— 在此 root 容器並非問題發現。

**修正方式：** 將擁有權修正新增至 `postCreateCommand`，指定與 `remoteUser` 相同的使用者，例如 `"postCreateCommand": "sudo chown node node_modules"`。若整個目錄樹都位於磁碟區上，則必須同時設定 `workspaceMount` 與 `workspaceFolder` —— 參考資料針對兩者分別說明其「需要同時設定 `workspaceFolder`」與「需要設定 `workspaceMount`」。請注意基於 `mounts` 的最佳化僅適用於本機：Codespaces 會忽略 Docker 通訊端以外的繫結掛載，因此請驗證設定在該處仍可正常運作。（該 Codespaces 限制未見於此處引述的任何文件；請將其視為可查證的背景知識，而非引述資料。）

來源：<https://code.visualstudio.com/remote/advancedcontainers/improve-performance>

### `updateRemoteUserUID` 在 Linux 上預設為 true —— 且缺失的屬性並非缺陷

參考資料指出：「在 Linux 上，若指定了 `containerUser` 或 `remoteUser`，則使用者的 UID/GID 將會更新以符合本機使用者的 UID/GID，以避免繫結掛載的權限問題。預設為 `true`。」

**不要回報缺失的 `updateRemoteUserUID`。** 其預設為 true，且在 Linux 工作站上，該預設值正是維持繫結掛載檔案可寫入的原因。設定 `remoteUser` 或 `containerUser` 且未設定 `updateRemoteUserUID` 的設定是正常且正確的情況：對此不要回報任何內容。

該預設值僅在兩種情況下會產生成本，且在有任何內容可回報之前，必須在儲存庫中可見其中一種情況。

1. **管線指定了建構未產生的映像檔。** 當預設值在 Linux 上生效時，參考 CLI 會衍生出第二個帶有 `-uid` 字尾的映像檔（在 CLI 原始碼 `src/spec-node/containerFeatures.ts` 中可見；未有文件說明，因此請將其視為經由檢驗查證而非引述資料），因此鎖定、標記、發佈或掃描特定 `--image-name` 的工作流程並非操作在實際執行的映像檔上。僅在有此類工作流程的證據時回報：傳遞 `--image-name` 的 CI 呼叫、設定 `imageName` 或 `push` 的 `devcontainers/ci` 步驟，或有文件說明的預建映像檔標籤。
2. **僅限 Linux 的擁有權問題被掩蓋。** 該步驟不適用於 macOS 或 Windows 主機，因此讓 Mac 上的權限看起來正確的擁有權解決方案可能隱藏了 Linux 上的不同行為。僅在確實存在此類解決方案時回報。下述形式僅為範例，並非詳盡清單 —— 請依意圖判讀，即為校正檔案擁有權或權限而存在的步驟：`chown` 或 `chmod`、`sudo` 擁有權步驟、`install -o`、`setfacl`，或名稱表明如此的指令碼。僅*規避*擁有權不符而不變更擁有權的步驟 —— 例如 `git config --global --add safe.directory` —— 並非此徵兆，也不構成問題發現。

若兩種徵兆皆不存在，則本規則僅供參考：其解釋了一項預設值，而預設值生效並不構成問題發現。

**修正方式：** 在 CI 中，由於主機 UID 無關緊要且額外的建構純屬成本，請將其關閉。`devcontainers/ci` action 公開了 `skipContainerUserIdUpdate`，其記載為「對於非 root 的 Dev Containers（即指定了 `remoteUser`），該 action 會嘗試使容器使用者 UID 與 GID 符合主機使用者的 UID 與 GID。將此設為 true 以略過此步驟」。CLI 等效項為 `--update-remote-user-uid-default never`。在 Linux 本機上，請保持開啟。僅在容器 UID 必須在所有地方保持固定時，才在設定中設定 `"updateRemoteUserUID": false`。

來源：<https://containers.dev/implementors/json_reference/> 與 <https://github.com/devcontainers/ci>

## 已棄用的屬性

### 頂層的 `extensions`、`settings` 與 `devPort` 應屬於 `customizations.vscode`，且 `appPort` 已被 `forwardPorts` 取代

VS Code 結構描述將頂層屬性標記為：`"deprecated": true, "deprecationMessage": "Use 'customizations/vscode/extensions' instead"`，對 `settings` 和 `devPort` 具有相同的形式。

該對應項目位於**頂層**屬性上。結構描述還定義了 `customizations.vscode.extensions`，其開頭相同但不帶有棄用標記 —— 在結構描述中搜尋 `"extensions"` 會先找到錯誤的項目，因此請針對 `deprecated` 對應進行比對，而非屬性名稱。另外，標示 `appPort`；參考資料對其說明為：「在多數情況下，我們建議使用新的 \[forwardPorts 屬性\](#general-devcontainerjson-properties)。此屬性接受容器執行時應於本機發佈的連接埠或連接埠陣列。」這些屬於棄用而非功能損壞 —— 舊有的鍵仍可運作 —— 因此請將其作為現代化建議回報。

**修正方式：** 將 `extensions` 和 `settings` 原封不動移至 `customizations.vscode` 下，並將 `devPort` 移至 `customizations.vscode.devPort`。相同命名空間現在也容納了 `mcp`，在該結構描述中描述為「Model Context Protocol 伺服器設定」—— 將 Model Context Protocol 伺服器設定放在該處，而非自行發明頂層鍵。將 `appPort` 替換為 `forwardPorts`，除非連接埠必須*發佈*在所有介面上而非轉送，在這種情況下請保留 `appPort` 並說明原因。請記住 `customizations` 是一個開放命名空間：規格僅指出每個工具「應使用具有唯一名稱的 JSON 物件子屬性」，因此其下的未知鍵不一定有錯。

來源：<https://github.com/microsoft/vscode/blob/main/extensions/configuration-editing/schemas/devContainer.vscode.schema.json> 與 <https://containers.dev/implementors/json_reference/>

## 廠商專屬：在 dev container 中執行 Claude Code

**此規則並非 Dev Container 規格的一部分。** 下方每項機械性主張皆陳述於 Anthropic 自己的文件中，但規格中沒有任何內容要求其中的任何部分，且從未執行 Claude Code 的 dev container 並不因缺少它而存在缺陷。僅將此規則套用至安裝或執行 Claude Code 的設定，絕不要將其作為規格呈現。

廠商文件說明：「因為容器以非 root 使用者執行 Claude Code 並將指令執行限制在容器內，所以你可以傳遞 `--dangerously-skip-permissions` 以進行無人值守作業。當以 root 啟動時，CLI 會拒絕此旗標，因此請確認 `remoteUser` 設定為非 root 帳號。」

接著檢查三件事。第一，`remoteUser` 已設定且非 `root`。第二，存在指向 `~/.claude` 的 `mounts` 項目**以及**指向相同路徑的 `CLAUDE_CONFIG_DIR` 的 `containerEnv` 項目 —— 同一頁面說明「僅掛載 `~/.claude` 磁碟區無法保持登入狀態」，因為 OAuth 帳號檔案位於該目錄之外，而沒有相符環境變數的磁碟區是常見的不完整設定。第三，若設定執行參考輸出防火牆，該頁面說明它「透過 `runArgs` 新增 `NET_ADMIN` 與 `NET_RAW` 功能」—— 沒有這些功能的防火牆指令碼將在啟動時失敗。

**修正方式：** 設定非 root 的 `remoteUser` 並新增驗證掛載的兩部分，替換為該使用者的實際家目錄：

```json
{
  "remoteUser": "node",
  "mounts": ["source=claude-code-config-${devcontainerId},target=/home/node/.claude,type=volume"],
  "containerEnv": { "CLAUDE_CONFIG_DIR": "/home/node/.claude" }
}
```

磁碟區名稱中的 `${devcontainerId}` 可隔離個別專案的狀態；移除它可在跨儲存庫間共用單一登入。若 `containerEnv` 已存在，請將鍵新增至其中，而非新增第二個物件。對於防火牆，請新增 `"runArgs": ["--cap-add=NET_ADMIN", "--cap-add=NET_RAW"]`。將 `anthropics/claude-code` 參考設定視為實作範例而非維護的基礎映像檔，且不要將主機秘密（例如 `~/.ssh`）掛載至容器中。

來源：<https://code.claude.com/docs/en/devcontainer>

## 出處與限制

這十二條規則中有十一條由 Dev Container 規格、參考 CLI 原始碼或官方廠商文件陳述，並適用於任何 dev container。第十二條 —— Claude Code 規則 —— 雖有廠商文件記錄，但取決於規格未提及的工具，這正是它在上方獨立成區的原因。有三個段落就地標記為經由檢驗查證而非引述資料：參考 CLI 缺乏 JSON 結構描述驗證、Codespaces 繫結掛載限制，以及衍生的 `-uid` 映像檔名稱。此處引述的所有其他內容皆於 2026-09-01 在其連結來源閱讀，且每個連結皆有效。

尚未對這些規則中的任何一條衡量偽陽性率（false-positive rate），因此皆未帶有嚴重性標籤。上方的排序純屬編輯編排。回報設定所陳述的內容以及來源對其說明；不要附加無人衡量過的信心指數。
