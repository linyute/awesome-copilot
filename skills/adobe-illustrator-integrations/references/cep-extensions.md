# 用於 Illustrator 的 CEP 擴充功能

CEP 擴充功能是一個 HTML 與 JavaScript 面板，在 Illustrator 內部嵌入式 Chromium (CEF) 中執行，並呼叫宿主應用程式中的 ExtendScript。Illustrator 2026 (30.x) 隨附 CEP 12.1，因此執行階段為 `CSXS` 12，且偵錯設定位於 `CSXS.12` 下。請檢查您的 Illustrator 隨附的版本：在 Windows 安裝目錄中的 `CEPHtmlEngine` 資料夾內包含具版本號的 `CEPHtmlEngine.exe`。

CEP 即將逐步淘汰（Marketplace 於 2028 年 12 月停止接受 Illustrator 的新 CEP 提交，CEP 自 2028 年 12 月起預設停用，並於 2029 年 12 月起正式移除）。請將繪圖邏輯保留在純 ExtendScript 中，以便日後轉移到 UXP。

## 資料夾配置

```text
com.example.gridtool/
  CSXS/
    manifest.xml        擴充功能、主機、執行階段與面板定義
  index.html            面板 UI
  css/panel.css
  js/
    CSInterface.js      來自 Adobe-CEP/CEP-Resources/CEP_12.x (請勿編輯)
    panel.js            UI 邏輯；透過 CSInterface 呼叫主機
  jsx/
    host.jsx            載入至 Illustrator 的 ExtendScript (ScriptPath)
  assets/               圖示與主機指令碼置入的檔案
  .debug                僅供開發使用；封裝前請移除
```

從 [Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources) 的 `CEP_12.x` 資料夾取得 `CSInterface.js`。`CEPEngine_extensions.js` 內建於 CEP 中，切勿隨附打包。

## manifest.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   ExtensionBundleId="com.example.gridtool"
                   ExtensionBundleVersion="1.0.0"
                   Version="12.0">
  <ExtensionList>
    <Extension Id="com.example.gridtool.panel" Version="1.0.0"/>
  </ExtensionList>
  <ExecutionEnvironment>
    <HostList>
      <!-- Illustrator 2025 (29.x) 至後續任何 2x/3x 版本；[ ] 為包含邊界 -->
      <Host Name="ILST" Version="[29.0,99.9]"/>
    </HostList>
    <LocaleList>
      <Locale Code="All"/>
    </LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="12.0"/>
    </RequiredRuntimeList>
  </ExecutionEnvironment>
  <DispatchInfoList>
    <Extension Id="com.example.gridtool.panel">
      <DispatchInfo>
        <Resources>
          <MainPath>./index.html</MainPath>
          <ScriptPath>./jsx/host.jsx</ScriptPath>
        </Resources>
        <Lifecycle>
          <AutoVisible>true</AutoVisible>
        </Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>Grid Tool</Menu>
          <Geometry>
            <Size><Height>520</Height><Width>320</Width></Size>
            <MinSize><Height>360</Height><Width>260</Width></MinSize>
          </Geometry>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>
</ExtensionManifest>
```

- `Host Name="ILST"` 為 Illustrator。`[` `]` 內的範圍為包含；`)` 則使上限為排除。
- `Menu` 是在視窗 > 擴充功能下顯示的名稱。
- 對於對話方塊樣式的視窗，`Type` 也可以是 `ModalDialog` 或 `Modeless`。
- 僅在舊版 Illustrator 必須載入面板時才調低 `RequiredRuntime`，並在每個版本上進行測試。

## 面板至主機的呼叫

面板在 Chromium 中執行現代 JavaScript。主機則執行 ExtendScript，其規格為 ES3：沒有 `let`、`const`、箭頭函式、樣板常值或內建的 `JSON`。

`js/panel.js`：

```javascript
const cs = new CSInterface();

function drawGrid(settings) {
  // JSON.stringify 輸出為合法的 ES3 物件常值；跳脫 U+2028 與 U+2029，
  // 它們在 JSON 字串中合法，但在 ES3 字串常值中不合法。
  const literal = JSON.stringify(settings)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return new Promise((resolve) => {
    cs.evalScript(`gridTool.draw(${literal})`, (result) => {
      if (result === 'EvalScript error.') {
        resolve({ ok: false, message: 'Host script error. Check jsx/host.jsx for ES3 syntax.' });
        return;
      }
      resolve(parseHostResult(result));
    });
  });
}

function parseHostResult(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return { ok: false, message: String(text) };
  }
}
```

`jsx/host.jsx`：

```javascript
// 僅限 ES3。每個公開函式都會傳回面板可透過 JSON.parse 剖析的字串。
var gridTool = (function () {
  // JSON 字串常值：跳脫反斜線、引號以及所有控制字元。
  function quote(value) {
    return '"' + String(value).replace(/[\\"\u0000-\u001f]/g, function (ch) {
      if (ch === '\\' || ch === '"') { return '\\' + ch; }
      return '\\u' + ('000' + ch.charCodeAt(0).toString(16)).slice(-4);
    }) + '"';
  }

  function result(ok, message) {
    return '{"ok":' + (ok ? 'true' : 'false') + ',"message":' + quote(message) + '}';
  }

  function toInt(value, min, max) {
    if (typeof value !== 'number' && typeof value !== 'string') { return null; }
    var n = Number(value);
    if (!isFinite(n) || Math.floor(n) !== n || n < min || n > max) { return null; }
    return n;
  }

  function draw(settings) {
    try {
      if (!settings) { return result(false, 'No settings received.'); }
      var rows = toInt(settings.rows, 1, 20);
      var cols = toInt(settings.cols, 1, 10);
      if (rows === null || cols === null) { return result(false, 'Rows must be 1 to 20 and columns 1 to 10.'); }

      var doc = app.documents.length ? app.activeDocument : app.documents.add();
      var layer = doc.layers.add();
      layer.name = 'Grid Tool';
      // 繪圖程式碼放這裡 (參閱 adobe-illustrator-scripting 技能)。
      return result(true, 'Drew ' + rows + ' x ' + cols + '.');
    } catch (e) {
      return result(false, 'Line ' + e.line + ': ' + e.message);
    }
  }

  return { draw: draw };
}());
```

防止大多數面板錯誤的規則：

- 在面板中進行驗證以獲得即時回饋，並在主機中再次驗證，主機絕不可向外拋出超過 `evalScript` 的例外狀況。
- 從主機傳回字串。物件回傳時會變成 `[object Object]`。
- `EvalScript error.` 表示主機指令碼編譯失敗或拋出錯誤；請先單獨測試該 `.jsx`。
- 隨附於擴充功能中的檔案路徑：在面板中透過 `cs.getSystemPath(SystemPath.EXTENSION)` 取得擴充功能資料夾，並將其傳遞給主機。

## 開發模式

未簽署的擴充功能僅在應用程式使用的 CSXS 版本設定了 `PlayerDebugMode` 時才會載入。

Windows (依使用者，字串值)：

```bat
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

macOS：

```bash
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

之後重新啟動 Illustrator（在 macOS 上，若設定未生效請登出後再重新登入）。僅在開發機器上進行此設定，並可透過 `reg delete "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /f` 或 `defaults delete com.adobe.CSXS.12 PlayerDebugMode` 將其移除。

## 安裝資料夾

| 範圍 | Windows | macOS |
| --- | --- | --- |
| 目前使用者 | `C:\Users\<user>\AppData\Roaming\Adobe\CEP\extensions\` | `~/Library/Application Support/Adobe/CEP/extensions/` |
| 所有使用者 | `C:\Program Files\Common Files\Adobe\CEP\extensions\` (以及 `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`) | `/Library/Application Support/Adobe/CEP/extensions/` |

開發期間，請將擴充功能資料夾複製或連結至個別使用者資料夾中。寫入所有使用者資料夾需要系統管理員權限。

## 偵錯

在擴充功能根目錄新增 `.debug`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
  <Extension Id="com.example.gridtool.panel">
    <HostList>
      <Host Name="ILST" Port="8088"/>
    </HostList>
  </Extension>
</ExtensionList>
```

開啟面板，然後在 Chromium 瀏覽器中瀏覽至 `http://localhost:8088` 以使用 DevTools。連接埠必須介於 1024 到 65534 之間，且每個擴充功能必須獨一無二。主機 `.jsx` 請另外使用 VS Code ExtendScript Debugger 進行偵錯。

## 封裝與簽署

從 [Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources) 的 `ZXPSignCMD` 資料夾取得 `ZXPSignCmd`。

```bash
# 用於測試的自我簽署憑證 (請將 .p12 及其密碼排除在存放庫之外)
ZXPSignCmd -selfSignedCert US CA "Acme Corp" "Acme Grid Tool" "$CERT_PASSWORD" acme-cert.p12

# 附帶時間戳記進行簽署，使簽章效期超過憑證本身
ZXPSignCmd -sign com.example.gridtool gridtool-1.0.0.zxp acme-cert.p12 "$CERT_PASSWORD" -tsa http://time.certum.pl/

# 檢查套件
ZXPSignCmd -verify gridtool-1.0.0.zxp -certinfo
```

簽署前：移除 `.debug`、不需要的 `node_modules`、`.DS_Store` 檔案以及符號連結 (以真實檔案取代)。Adobe 2024 年 11 月已知問題：請在其目標作業系統上簽署 ZXP（macOS ZXP 在 macOS 上簽署，Windows ZXP 在 Windows 上簽署）。

## 安裝 ZXP

Adobe 的 Unified Plugin Installer Agent (UPIA) 隨附於 Creative Cloud 桌面應用程式中。

Windows：

```bat
"C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe" /install "C:\Users\<user>\Downloads\gridtool-1.0.0.zxp"
"...\UnifiedPluginInstallerAgent.exe" /list all
"...\UnifiedPluginInstallerAgent.exe" /remove com.example.gridtool
```

macOS：該 agent 位於 `/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/`。請先使用 `/help` 執行其二進位檔案，以檢視對應版本的選項語法。

Extension Manager CC 與 `ExManCmd` 已終止支援；請改用 UPIA 或 Adobe Marketplace。

## 發布散布

- 透過 Developer Distribution 入口網站發布至 Adobe Marketplace (Adobe Exchange)：[Developer Distribution guides](https://developer.adobe.com/developer-distribution/creative-cloud/docs/guides/)
- 直接下載已簽署的 ZXP，並在文件中附上 UPIA 安裝步驟（參閱 publishing-docs.md）

## 常見問題

| 徵狀 | 可能原因 | 解決方式 |
| --- | --- | --- |
| 視窗 > 擴充功能中找不到面板 | Host 範圍排除了此 Illustrator 版本，或資料夾未放在 extensions 資料夾中 | 擴大 `Host Version`，檢查資料夾路徑與 `ExtensionBundleId`（在 Photoshop 中，CEP 面板位於視窗 > 擴充功能 (舊版)） |
| 面板為空白或無法載入 | 未簽署且未針對此 CSXS 版本設定 `PlayerDebugMode` | 在正確的 `CSXS.<n>` 機碼下設定，或簽署 ZXP |
| `EvalScript error.` | 主機 `.jsx` 語法錯誤 (通常是 ES5+ 語法) 或未攔截的拋出例外 | 單獨執行 `host.jsx`，保持其為 ES3，並將進入點包裝在 `try` 中 |
| 主機傳回 `undefined` | 函式名稱錯誤，或 `ScriptPath` 未載入 | 檢查 `ScriptPath`，可在載入時呼叫 `$.evalFile` 作為遞補措施 |
| ZXP 已安裝但面板為空白 | 簽章問題 (包含符號連結、在其他作業系統上簽署) | 在目標作業系統上重新簽署，且不包含符號連結 |
