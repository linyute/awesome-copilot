---
description: '.NET WPF 元件與應用程式模式'
applyTo: '**/*.xaml, **/*.cs'
---

## 摘要

本指引協助 GitHub Copilot 建立高品質、易維護且高效能的 WPF 應用程式，採用 MVVM 模式。內容涵蓋 XAML、資料繫結、UI 響應性及 .NET 效能最佳化實踐。

## 理想專案類型

- 使用 C# 與 WPF 的桌面應用程式
- 採用 MVVM（Model-View-ViewModel）設計模式的應用
- 使用 .NET 8.0 或更新版本的專案
- 以 XAML 建構的 UI 元件
- 強調效能與響應性的解決方案

## 目標

- 產生 `INotifyPropertyChanged` 與 `RelayCommand` 樣板程式碼
- 建議 ViewModel 與 View 邏輯清楚分離
- 鼓勵使用 `ObservableCollection<T>`、`ICommand` 及正確繫結
- 推薦效能技巧（如虛擬化、非同步載入）
- 避免 code-behind 邏輯緊密耦合
- 產生可測試的 ViewModel

## 範例提示行為

### ✅ 良好建議
- 「為登入畫面產生 ViewModel，包含使用者名稱、密碼屬性及 LoginCommand」
- 「撰寫 ListView 的 XAML 程式碼片段，使用 UI 虛擬化並繫結至 ObservableCollection」
- 「將 code-behind 的點擊事件重構為 ViewModel 的 RelayCommand」
- 「在 WPF 非同步抓取資料時加入載入中動畫」

### ❌ 避免
- 在 code-behind 建議商業邏輯
- 使用無上下文的靜態事件處理器
- 產生未繫結的緊密耦合 XAML
- 建議 WinForms 或 UWP 的做法

## 建議技術
- C#（.NET 8.0+）
- XAML（MVVM 架構）
- `CommunityToolkit.Mvvm` 或自訂 `RelayCommand` 實作
- 非同步/await，確保 UI 不阻塞
- `ObservableCollection`、`ICommand`、`INotifyPropertyChanged`

## 常見模式
- ViewModel 優先繫結
- 使用 .NET 或第三方容器（如 Autofac、SimpleInjector）進行相依性注入
- XAML 命名慣例（控制項用 PascalCase，繫結用 camelCase）
- 避免繫結時使用魔法字串（請用 `nameof`）

## Copilot 可用指令範例

```csharp
public class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private string userName;

    [ObservableProperty]
    private string password;

    [RelayCommand]
    private void Login()
    {
        // 在此加入登入邏輯
    }
}
```

```xml
<StackPanel>
    <TextBox Text="{Binding UserName, UpdateSourceTrigger=PropertyChanged}" />
    <PasswordBox x:Name="PasswordBox" />
    <Button Content="Login" Command="{Binding LoginCommand}" />
</StackPanel>
```
