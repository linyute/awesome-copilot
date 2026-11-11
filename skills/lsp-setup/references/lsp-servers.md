# Copilot CLI 的已知 LSP 伺服器

`lsp-setup` 技能的參考資料。每個小節包含各作業系統的安裝指令以及現成可用的設定程式碼片段。

> **設定程式碼片段格式**：下方每個片段顯示插入於最頂層 `lspServers` 鍵下作為值（value）的物件。完整的設定檔範例如下：`{ "lspServers": { <此處填入片段> } }`。當新增多種語言時，將其片段合併為 `lspServers` 下的同級鍵。

---

## TypeScript / JavaScript

**伺服器**：[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)

### 安裝

| 作業系統 | 指令 |
|---------|-------------------------------------------------------|
| 任何 | `npm install -g typescript typescript-language-server` |

### 設定程式碼片段

```json
{
  "typescript": {
    "command": "typescript-language-server",
    "args": ["--stdio"],
    "fileExtensions": {
      ".ts": "typescript",
      ".tsx": "typescriptreact",
      ".js": "javascript",
      ".jsx": "javascriptreact"
    }
  }
}
```

---

## Java

**伺服器**：[Eclipse JDT Language Server (jdtls)](https://github.com/eclipse-jdtls/eclipse.jdt.ls)

jdtls 本身需要位於 `JAVA_HOME` 或 `$PATH` 上的近期 JDK（目前版本需為 **21 或更新版本**）。這與專案的目標 JDK 無關：只要安裝了符合專案 `release`/`toolchain` 的 JDK，執行於 JDK 21+ 上的 jdtls 就能分析 Java 17 專案。Java LSP 是選用的；編譯、測試或執行時期診斷均不強制需要它。

### 安裝

| 作業系統 | 指令 |
|---------|-----------------------------------|
| macOS | `brew install jdtls` |
| Linux | `brew install jdtls`（Linux 上的 Homebrew）、發行版套件（若有），或從 https://download.eclipse.org/jdtls/milestones/ 下載發行版本，將其解壓縮並將其 `bin/` 加入 `PATH` |
| Windows | 從 https://download.eclipse.org/jdtls/milestones/ 下載、解壓縮，並將 `bin\` 加入 `PATH`（或使用 WSL 搭配 Linux 步驟） |

Windows 附註：`bin/jdtls` wrapper 為 Python 3.9+ 指令碼，沒有 `.exe`/`.cmd` 副檔名，因此 Windows 無法直接從 `PATH` 啟動 `jdtls`。請使用 WSL，或將 LSP `command` 設定為 `python`，並將無副檔名的 `bin\jdtls` 啟動程式完整路徑作為第一個引數，後面接著其他引數（旁邊的 `jdtls.py` 僅為實作模組；直接執行它不會有任何動作），或如 jdtls README 所述直接啟動伺服器 JAR。

Wrapper 指令碼（`jdtls` 啟動程式，需要 Python 3 並會匯入 `jdtls.py`）預設透過 stdio 通訊，因此不需要 `--stdio` 引數。

### 設定程式碼片段

存放庫層級 `.github/lsp.json`（無絕對路徑；資料目錄相對於專案）：

```json
{
  "lspServers": {
    "java": {
      "command": "jdtls",
      "args": [
        "--jvm-arg=-Xmx2G",
        "-data", ".jdtls-workspace"
      ],
      "fileExtensions": {
        ".java": "java"
      }
    }
  }
}
```

將 `.jdtls-workspace/` 新增至 `.gitignore`。已在 macOS 上使用 Homebrew jdtls 1.61.0 驗證：接受 `--jvm-arg=-Xmx2G -data .jdtls-workspace`，伺服器可在 stdio 上回應 `initialize`，並在 Quarkus 專案上回應 `documentSymbol`（Copilot CLI 1.0.95 的 `copilot lsp list` 會載入此 `.github/lsp.json` 形式，這也符合 GitHub 文件的欄位表格：必要的 `command`、`args`、`fileExtensions`，以及選用的 `env`、`rootUri`、`initializationOptions`、`requestTimeoutMs`、`initializationTimeoutMs`；未在此進行實際的 `lsp` 工具呼叫）。請執行 `jdtls --help` 確認您的 wrapper 版本支援 `--jvm-arg` 與 `-data`；若不支援，請移除這些旗標並使用單純的 `"args": []` 形式。

Maven（`pom.xml`）與 Gradle（`build.gradle[.kts]`）專案會自動匯入。有關專案匯入、疑難排解、效能、Lombok/註解處理，以及各 `lsp` 操作為 Java 提供的功能，請參閱 [java-jdtls.md](java-jdtls.md)。

---

## Python

**伺服器**：[pyright](https://github.com/microsoft/pyright)

### 安裝

| 作業系統 | 指令 |
|---------|----------------------------|
| 任何 | `npm install -g pyright` |
| 任何 | `pip install pyright` |

### 設定程式碼片段

```json
{
  "python": {
    "command": "pyright-langserver",
    "args": ["--stdio"],
    "fileExtensions": {
      ".py": "python"
    }
  }
}
```

---

## Go

**伺服器**：[gopls](https://github.com/golang/tools/tree/master/gopls)

### 安裝

| 作業系統 | 指令 |
|---------|--------------------------------------------|
| 任何 | `go install golang.org/x/tools/gopls@latest` |
| macOS | `brew install gopls` |

### 設定程式碼片段

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "fileExtensions": {
      ".go": "go"
    }
  }
}
```

---

## Rust

**伺服器**：[rust-analyzer](https://github.com/rust-lang/rust-analyzer)

### 安裝

| 作業系統 | 指令 |
|---------|--------------------------------|
| 任何 | `rustup component add rust-analyzer` |
| macOS | `brew install rust-analyzer` |
| Linux | 發行版套件或 `rustup` |
| Windows | `rustup component add rust-analyzer` 或從 GitHub releases 下載 |

### 設定程式碼片段

```json
{
  "rust": {
    "command": "rust-analyzer",
    "args": [],
    "fileExtensions": {
      ".rs": "rust"
    }
  }
}
```

---

## C / C++

**伺服器**：[clangd](https://clangd.llvm.org/)

### 安裝

| 作業系統 | 指令 |
|---------|----------------------------------------|
| macOS | `brew install llvm`（包含 clangd）或 Xcode 命令列工具 |
| Linux | `apt install clangd` / `dnf install clang-tools-extra` |
| Windows | 從 https://releases.llvm.org/ 下載 LLVM |

### 設定程式碼片段

```json
{
  "cpp": {
    "command": "clangd",
    "args": ["--background-index"],
    "fileExtensions": {
      ".c": "c",
      ".h": "c",
      ".cpp": "cpp",
      ".cxx": "cpp",
      ".cc": "cpp",
      ".hpp": "cpp",
      ".hxx": "cpp"
    }
  }
}
```

---

## C# (.NET)

**伺服器**：[Roslyn Language Server](https://github.com/dotnet/roslyn)（透過 `dotnet dnx`）

### 安裝

| 作業系統 | 指令 |
|---------|----------------------------------------------------------------|
| 任何 | 需要安裝 [.NET SDK](https://dot.net/download) |

### 設定程式碼片段

```json
{
  "csharp": {
    "command": "dotnet",
    "args": ["dnx", "roslyn-language-server", "--yes", "--prerelease", "--", "--stdio", "--autoLoadProjects"],
    "fileExtensions": {
      ".cs": "csharp"
    }
  }
}
```

---

## Ruby

**伺服器**：[solargraph](https://github.com/castwide/solargraph)

### 安裝

| 作業系統 | 指令 |
|---------|---------------------------|
| 任何 | `gem install solargraph` |

### 設定程式碼片段

```json
{
  "ruby": {
    "command": "solargraph",
    "args": ["stdio"],
    "fileExtensions": {
      ".rb": "ruby",
      ".rake": "ruby",
      ".gemspec": "ruby"
    }
  }
}
```

---

## PHP

**伺服器**：[intelephense](https://github.com/bmewburn/vscode-intelephense)

### 安裝

| 作業系統 | 指令 |
|---------|--------------------------------------------|
| 任何 | `npm install -g intelephense` |

### 設定程式碼片段

```json
{
  "php": {
    "command": "intelephense",
    "args": ["--stdio"],
    "fileExtensions": {
      ".php": "php"
    }
  }
}
```

---

## Kotlin

**伺服器**：[kotlin-language-server](https://github.com/fwcd/kotlin-language-server)

### 安裝

| 作業系統 | 指令 |
|---------|---------------------------------------------------|
| macOS | `brew install kotlin-language-server` |
| 任何 | 從 GitHub releases 下載並新增至 `PATH` |

### 設定程式碼片段

```json
{
  "kotlin": {
    "command": "kotlin-language-server",
    "args": [],
    "fileExtensions": {
      ".kt": "kotlin",
      ".kts": "kotlin"
    }
  }
}
```

---

## Swift

**伺服器**：[sourcekit-lsp](https://github.com/swiftlang/sourcekit-lsp)（隨附於 Swift 工具鏈）

### 安裝

| 作業系統 | 指令 |
|---------|----------------------------------------------------------------|
| macOS | 隨附於 Xcode；二進位檔位於 `xcrun sourcekit-lsp` |
| Linux | 隨附於 Swift 工具鏈；請從 https://swift.org 安裝 |
| Windows | 隨附於 Swift 工具鏈；請從 https://swift.org 安裝 |

### 設定程式碼片段

```json
{
  "swift": {
    "command": "sourcekit-lsp",
    "args": [],
    "fileExtensions": {
      ".swift": "swift"
    }
  }
}
```

> 在 macOS 上，您可能需要使用完整路徑：`/usr/bin/sourcekit-lsp` 或將 `command` 設為 `xcrun` 並搭配 `args: ["sourcekit-lsp"]`。

---

## Lua

**伺服器**：[lua-language-server](https://github.com/LuaLS/lua-language-server)

### 安裝

| 作業系統 | 指令 |
|---------|--------------------------------------|
| macOS | `brew install lua-language-server` |
| Linux | 從 GitHub releases 下載 |
| Windows | 從 GitHub releases 下載 |

### 設定程式碼片段

```json
{
  "lua": {
    "command": "lua-language-server",
    "args": [],
    "fileExtensions": {
      ".lua": "lua"
    }
  }
}
```

---

## YAML

**伺服器**：[yaml-language-server](https://github.com/redhat-developer/yaml-language-server)

### 安裝

| 作業系統 | 指令 |
|---------|----------------------------------------------|
| 任何 | `npm install -g yaml-language-server` |

### 設定程式碼片段

```json
{
  "yaml": {
    "command": "yaml-language-server",
    "args": ["--stdio"],
    "fileExtensions": {
      ".yaml": "yaml",
      ".yml": "yaml"
    }
  }
}
```

---

## Bash / Shell

**伺服器**：[bash-language-server](https://github.com/bash-lsp/bash-language-server)

### 安裝

| 作業系統 | 指令 |
|---------|-----------------------------------------------|
| 任何 | `npm install -g bash-language-server` |

### 設定程式碼片段

```json
{
  "bash": {
    "command": "bash-language-server",
    "args": ["start"],
    "fileExtensions": {
      ".sh": "shellscript",
      ".bash": "shellscript",
      ".zsh": "shellscript"
    }
  }
}
```
