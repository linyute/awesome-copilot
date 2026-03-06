# WinUI 3 開發外掛程式 (WinUI 3 Development Plugin)

WinUI 3 與 Windows App SDK 開發代理程式、指引與遷移指南。防止常見的 UWP API 誤用，並為桌面 Windows 應用程式引導正確的 WinUI 3 模式。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install winui3-development@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/winui3-development:winui3-migration-guide` | 具備 API 對應與前後程式碼片段的 UWP 轉 WinUI 3 遷移參考 |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `winui3-expert` | WinUI 3 與 Windows App SDK 開發的專家代理程式。防止常見的 UWP 轉 WinUI 3 API 錯誤，引導 XAML 控制項、MVVM 模式、視窗化、執行緒、應用程式生命週期、對話方塊與部署。 |

## 關鍵功能 (Key Features)

- **UWP→WinUI 3 API 遷移規則** — 防止最常見的程式碼產生錯誤
- **執行緒指引** — 使用 DispatcherQueue 取代 CoreDispatcher
- **視窗化模式** — 使用 AppWindow 取代 CoreWindow/ApplicationView
- **對話方塊/選擇器模式** — 具備 XamlRoot 的 ContentDialog，以及具備視窗控制代碼互通性 (window handle interop) 的選擇器
- **MVVM 最佳實務** — CommunityToolkit.Mvvm、編譯繫結 (compiled bindings)、相依性注入
- **遷移查核表** — 移植 UWP 應用程式的逐步指南

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
