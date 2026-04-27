# Copilot CLI 已知的 LSP 伺服器

`lsp-setup` 技能的參考資料。每個章節都包含各個作業系統的安裝指令以及即插即用的設定片段。

> **設定片段格式**：下方的每個片段都顯示了要作為值插入頂層 `lspServers` 鍵下的物件。完整的設定檔看起來像這樣：`{ "lspServers": { <在此處放入片段> } }`。在加入多個語言時，請將它們的片段合併為 `lspServers` 下的同級鍵。

---

## TypeScript / JavaScript

**伺服器**：[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)

### 安裝

| 作業系統 | 指令 |
|---------|-------------------------------------------------------|
| 任何     | `npm install -g typescript typescript-language-server` |

### 設定片段

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

需要在 `JAVA_HOME` 或 `$PATH` 中具備 **Java 21+**。

### 安裝

| 作業系統 | 指令 |
|---------|-----------------------------------|
| macOS   | `brew install jdtls`              |
| Linux   | 在發行版套件庫中尋找 `jdtls` 或 `eclipse.jdt.ls`；或者從 https://download.eclipse.org/jdtls/milestones/ 下載 |
| Windows | 從 https://download.eclipse.org/jdtls/milestones/ 下載並將 `bin/` 加入 `PATH` |

在安裝了 Homebrew 的 macOS 上，執行檔會安裝為 `$PATH` 中的 `jdtls`。

### 設定片段

```json
{
  "java": {
    "command": "jdtls",
    "args": [],
    "fileExtensions": {
      ".java": "java"
    }
  }
}
```

> **注意**：`jdtls` 包裝器腳本會內部處理 `--stdio` 模式。如果使用手動安裝，您可能需要直接呼叫啟動器 jar — 詳情請參閱 [jdtls README](https://github.com/eclipse-jdtls/eclipse.jdt.ls#running-from-command-line-with-wrapper-script)。

---

## Python

**伺服器**：[pyright](https://github.com/microsoft/pyright)

### 安裝

| 作業系統 | 指令 |
|---------|----------------------------|
| 任何     | `npm install -g pyright`   |
| 任何     | `pip install pyright`      |

### 設定片段

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
| 任何     | `go install golang.org/x/tools/gopls@latest` |
| macOS   | `brew install gopls`                       |

### 設定片段

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
| 任何     | `rustup component add rust-analyzer` |
| macOS   | `brew install rust-analyzer`   |
| Linux   | 發行版套件或 `rustup` |
| Windows | `rustup component add rust-analyzer` 或從 GitHub releases 下載 |

### 設定片段

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
| macOS   | `brew install llvm`（包含 clangd）或 Xcode 命令列工具 |
| Linux   | `apt install clangd` / `dnf install clang-tools-extra` |
| Windows | 從 https://releases.llvm.org/ 下載 LLVM |

### 設定片段

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
| 任何     | 需要安裝 [.NET SDK](https://dot.net/download) |

### 設定片段

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
| 任何     | `gem install solargraph`  |

### 設定片段

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
| 任何     | `npm install -g intelephense`              |

### 設定片段

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
| macOS   | `brew install kotlin-language-server`             |
| 任何     | 從 GitHub releases 下載並加入 `PATH` |

### 設定片段

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

**伺服器**：[sourcekit-lsp](https://github.com/swiftlang/sourcekit-lsp)（隨 Swift 工具鏈綑綁）

### 安裝

| 作業系統 | 指令 |
|---------|----------------------------------------------------------------|
| macOS   | 隨 Xcode 包含；執行檔位於 `xcrun sourcekit-lsp` |
| Linux   | 隨 Swift 工具鏈包含；從 https://swift.org 安裝 |

### 設定片段

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
| macOS   | `brew install lua-language-server`   |
| Linux   | 從 GitHub releases 下載 |
| Windows | 從 GitHub releases 下載 |

### 設定片段

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
| 任何     | `npm install -g yaml-language-server`        |

### 設定片段

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
| 任何     | `npm install -g bash-language-server`         |

### 設定片段

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
