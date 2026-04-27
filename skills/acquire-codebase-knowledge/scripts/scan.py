#!/usr/bin/env python3
"""
scan.py — 為 acquire-codebase-knowledge 技能收集專案探索資訊。
在專案根目錄執行。

用法：python3 scan.py [選項]

選項：
  --output FILE   將輸出寫入 FILE 而非標準輸出
  --help          顯示此訊息並結束

離開狀態碼：
  0  成功
  1  用法錯誤
"""

import os
import sys
import argparse
import subprocess
import json
from pathlib import Path
from typing import List, Set
import re

TREE_LIMIT = 200
TREE_MAX_DEPTH = 3
TODO_LIMIT = 60
MANIFEST_PREVIEW_LINES = 80
RECENT_COMMITS_LIMIT = 20
CHURN_LIMIT = 20

EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
    "__pycache__", ".venv", "venv", ".tox", "target", "vendor",
    "coverage", ".nyc_output", "generated", ".cache", ".turbo",
    ".yarn", ".pnp", "bin", "obj"
}

MANIFESTS = [
    # JavaScript/Node.js
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb",
    "deno.json", "deno.jsonc",
    # Python
    "requirements.txt", "Pipfile", "Pipfile.lock", "pyproject.toml", "setup.py", "setup.cfg",
    "poetry.lock", "pdm.lock", "uv.lock",
    # Go
    "go.mod", "go.sum",
    # Rust
    "Cargo.toml", "Cargo.lock",
    # Java/Kotlin
    "pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts",
    "gradle.properties",
    # PHP/Composer
    "composer.json", "composer.lock",
    # Ruby
    "Gemfile", "Gemfile.lock", "*.gemspec",
    # Elixir
    "mix.exs", "mix.lock",
    # Dart/Flutter
    "pubspec.yaml", "pubspec.lock",
    # .NET/C#
    "*.csproj", "*.sln", "*.slnx", "global.json", "packages.config",
    # Swift
    "Package.swift", "Package.resolved",
    # Scala
    "build.sbt", "scala-cli.yml",
    # Haskell
    "*.cabal", "stack.yaml", "cabal.project", "cabal.project.local",
    # OCaml
    "dune-project", "opam", "opam.lock",
    # Nim
    "*.nimble", "nim.cfg",
    # Crystal
    "shard.yml", "shard.lock",
    # R
    "DESCRIPTION", "renv.lock",
    # Julia
    "Project.toml", "Manifest.toml",
    # 建構系統
    "CMakeLists.txt", "Makefile", "GNUmakefile",
    "SConstruct", "build.xml",
    "BUILD", "BUILD.bazel", "WORKSPACE", "bazel.lock",
    "justfile", ".justfile", "Taskfile.yml",
    "tox.ini", "Vagrantfile"
]

ENTRY_CANDIDATES = [
    # JavaScript/Node.js/TypeScript
    "src/index.ts", "src/index.js", "src/index.mjs",
    "src/main.ts", "src/main.js", "src/main.py",
    "src/app.ts", "src/app.js",
    "src/server.ts", "src/server.js",
    "index.ts", "index.js", "app.ts", "app.js",
    "lib/index.ts", "lib/index.js",
    # Go
    "main.go", "cmd/main.go", "cmd/*/main.go",
    # Python
    "main.py", "app.py", "server.py", "run.py", "cli.py",
    "src/main.py", "src/__main__.py",
    # .NET/C#
    "Program.cs", "src/Program.cs", "Main.cs",
    # Java
    "Main.java", "Application.java", "App.java",
    "src/main/java/Main.java",
    # Kotlin
    "Main.kt", "Application.kt", "App.kt",
    # Rust
    "src/main.rs", "src/lib.rs",
    # Swift
    "main.swift", "Package.swift", "Sources/main.swift",
    # Ruby
    "app.rb", "main.rb", "lib/app.rb",
    # PHP
    "index.php", "app.php", "public/index.php",
    # Go
    "cmd/*/main.go",
    # Scala
    "src/main/scala/Main.scala",
    # Haskell
    "Main.hs", "app/Main.hs",
    # Clojure
    "src/core.clj", "-main.clj",
    # Elixir
    "lib/application.ex", "mix.exs",
]

LINT_FILES = [
    ".eslintrc", ".eslintrc.json", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.yml", ".eslintrc.yaml",
    "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs",
    ".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.yml",
    "prettier.config.js", "prettier.config.mjs",
    ".editorconfig",
    "tsconfig.json", "tsconfig.base.json", "tsconfig.build.json",
    ".golangci.yml", ".golangci.yaml",
    "setup.cfg", ".flake8", ".pylintrc", "mypy.ini",
    ".rubocop.yml", "phpcs.xml", "phpstan.neon",
    "biome.json", "biome.jsonc"
]

ENV_TEMPLATES = [".env.example", ".env.template", ".env.sample", ".env.defaults", ".env.local.example"]

SOURCE_EXTS = [
    "ts", "tsx", "js", "jsx", "mjs", "cjs",
    "py", "go", "java", "kt", "rb", "php",
    "rs", "cs", "cpp", "c", "h", "ex", "exs",
    "swift", "scala", "clj", "cljs", "lua",
    "vim", "vim", "hs", "ml", "ml", "nim", "cr",
    "r", "jl", "groovy", "gradle", "xml", "json"
]

MONOREPO_FILES = ["pnpm-workspace.yaml", "lerna.json", "nx.json", "rush.json", "turbo.json", "moon.yml"]
MONOREPO_DIRS = ["packages", "apps", "libs", "services", "modules"]

CI_CD_CONFIGS = {
    ".github/workflows": "GitHub Actions",
    ".gitlab-ci.yml": "GitLab CI",
    "Jenkinsfile": "Jenkins",
    ".circleci/config.yml": "CircleCI",
    ".travis.yml": "Travis CI",
    "azure-pipelines.yml": "Azure Pipelines",
    "appveyor.yml": "AppVeyor",
    ".drone.yml": "Drone CI",
    ".woodpecker.yml": "Woodpecker CI",
    "bitbucket-pipelines.yml": "Bitbucket Pipelines"
}

CONTAINER_FILES = [
    "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
    ".dockerignore", "Dockerfile.*",
    "k8s", "kustomization.yaml", "Chart.yaml",
    "Vagrantfile", "podman-compose.yml"
]

SECURITY_CONFIGS = [
    ".snyk", "security.txt", "SECURITY.md",
    ".dependabot.yml", ".whitesource",
    "sbom.json", "sbom.spdx", ".bandit.yaml"
]

PERFORMANCE_MARKERS = [
    "benchmark", "bench", "perf.data", ".prof",
    "k6.js", "locustfile.py", "jmeter.jmx"
]


def parse_args():
    """解析命令列引數。"""
    parser = argparse.ArgumentParser(
        description="掃描目前目錄（專案根目錄）並輸出 "
                    "acquire-codebase-knowledge 技能的探索資訊。",
        add_help=True
    )
    parser.add_argument(
        "--output",
        type=str,
        help="將輸出寫入檔案而非標準輸出"
    )
    return parser.parse_args()


def should_exclude(path: Path) -> bool:
    """檢查路徑是否應從掃描中排除。"""
    return any(part in EXCLUDE_DIRS for part in path.parts)


def get_directory_tree(max_depth: int = TREE_MAX_DEPTH) -> List[str]:
    """取得最多至 max_depth 的目錄樹。"""
    files = []

    def walk(path: Path, depth: int):
        if depth > max_depth or should_exclude(path):
            return
        try:
            for item in sorted(path.iterdir()):
                if should_exclude(item):
                    continue
                rel_path = item.relative_to(Path.cwd())
                files.append(str(rel_path))
                if item.is_dir():
                    walk(item, depth + 1)
        except (PermissionError, OSError):
            pass

    walk(Path.cwd(), 0)
    return files[:TREE_LIMIT]


def find_manifest_files() -> List[str]:
    """尋找符合模式的 manifest 檔案。"""
    found = []
    for pattern in MANIFESTS:
        if "*" in pattern:
            # 處理 glob 模式
            for path in Path.cwd().glob(pattern):
                if path.is_file() and not should_exclude(path):
                    found.append(path.name)
        else:
            path = Path.cwd() / pattern
            if path.is_file():
                found.append(pattern)
    return sorted(set(found))


def read_file_preview(filepath: Path, max_lines: int = MANIFEST_PREVIEW_LINES) -> str:
    """讀取檔案並限制行數。"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()

        if not lines:
            return "未找到。"

        preview = ''.join(lines[:max_lines])
        if len(lines) > max_lines:
            preview += f"\n[已截斷] 顯示總計 {len(lines)} 行中的前 {max_lines} 行。"
        return preview
    except Exception as e:
        return f"[讀取檔案時發生錯誤：{e}]"


def find_entry_points() -> List[str]:
    """尋找進入點候選。"""
    found = []
    for candidate in ENTRY_CANDIDATES:
        if Path(candidate).exists():
            found.append(candidate)
    return found


def find_lint_config() -> List[str]:
    """尋找 linting 和格式化設定檔案。"""
    found = []
    for filename in LINT_FILES:
        if Path(filename).exists():
            found.append(filename)
    return found


def find_env_templates() -> List[tuple]:
    """尋找環境變數範本。"""
    found = []
    for filename in ENV_TEMPLATES:
        path = Path(filename)
        if path.exists():
            found.append((filename, path))
    return found


def search_todos() -> List[str]:
    """搜尋 TODO/FIXME/HACK 註解。"""
    todos = []
    patterns = ["TODO", "FIXME", "HACK"]
    exclude_dirs_str = "|".join(EXCLUDE_DIRS | {"test", "tests", "__tests__", "spec", "__mocks__", "fixtures"})

    try:
        for root, dirs, files in os.walk(Path.cwd()):
            # 從 dirs 中移除排除的目錄，防止 os.walk 進入
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and d not in {"test", "tests", "__tests__", "spec", "__mocks__", "fixtures"}]

            for file in files:
                # 檢查副檔名
                ext = Path(file).suffix.lstrip('.')
                if ext not in SOURCE_EXTS:
                    continue

                filepath = Path(root) / file
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                        for line_num, line in enumerate(f, 1):
                            for pattern in patterns:
                                if pattern in line:
                                    rel_path = filepath.relative_to(Path.cwd())
                                    todos.append(f"{rel_path}:{line_num}: {line.strip()}")
                except Exception:
                    pass
    except Exception:
        pass

    return todos[:TODO_LIMIT]


def get_git_commits() -> List[str]:
    """取得最近的 git 提交。"""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "-n", str(RECENT_COMMITS_LIMIT)],
            capture_output=True,
            text=True,
            cwd=Path.cwd()
        )
        if result.returncode == 0:
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        return []
    except Exception:
        return []


def get_git_churn() -> List[str]:
    """取得過去 90 天內高變動頻率的檔案。"""
    try:
        result = subprocess.run(
            ["git", "log", "--since=90 days ago", "--name-only", "--pretty=format:"],
            capture_output=True,
            text=True,
            cwd=Path.cwd()
        )
        if result.returncode == 0:
            files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
            # 統計出現次數
            from collections import Counter
            counts = Counter(files)
            churn = sorted(counts.items(), key=lambda x: x[1], reverse=True)
            return [f"{count:4d} {filename}" for filename, count in churn[:CHURN_LIMIT]]
        return []
    except Exception:
        return []


def is_git_repo() -> bool:
    """檢查目前目錄是否為 git 儲存庫。"""
    try:
        subprocess.run(
            ["git", "rev-parse", "--git-dir"],
            capture_output=True,
            cwd=Path.cwd(),
            timeout=2
        )
        return True
    except Exception:
        return False


def detect_monorepo() -> List[str]:
    """偵測 monorepo 信號。"""
    signals = []

    for filename in MONOREPO_FILES:
        if Path(filename).exists():
            signals.append(f"偵測到 Monorepo 工具：{filename}")

    for dirname in MONOREPO_DIRS:
        if Path(dirname).is_dir():
            signals.append(f"找到子套件目錄：{dirname}/")

    # 檢查 package.json workspaces
    if Path("package.json").exists():
        try:
            with open("package.json", 'r') as f:
                content = f.read()
                if '"workspaces"' in content:
                    signals.append("package.json 含有 'workspaces' 欄位 (npm/yarn workspaces monorepo)")
        except Exception:
            pass

    return signals


def detect_ci_cd_pipelines() -> List[str]:
    """偵測 CI/CD 管線設定。"""
    pipelines = []

    for config_path, pipeline_name in CI_CD_CONFIGS.items():
        path = Path(config_path)
        if path.is_file():
            pipelines.append(f"CI/CD: {pipeline_name}")
        elif path.is_dir():
            # 檢查目錄中的工作流檔案
            try:
                if list(path.glob("*.yml")) or list(path.glob("*.yaml")):
                    pipelines.append(f"CI/CD: {pipeline_name}")
            except Exception:
                pass

    return pipelines


def detect_containers() -> List[str]:
    """偵測容器化與協調設定。"""
    containers = []

    for config in CONTAINER_FILES:
        path = Path(config)
        if path.is_file():
            if "Dockerfile" in config:
                containers.append("容器：找到 Docker")
            elif "docker-compose" in config:
                containers.append("協調：找到 Docker Compose")
            elif config.endswith(".yaml") or config.endswith(".yml"):
                containers.append(f"容器/協調：{config}")
        elif path.is_dir():
            if config in ["k8s", "kubernetes"]:
                containers.append("協調：找到 Kubernetes 設定")
            try:
                if list(path.glob("*.yml")) or list(path.glob("*.yaml")):
                    containers.append(f"容器/協調：{config}/ 目錄已找到")
            except Exception:
                pass

    return containers


def detect_security_configs() -> List[str]:
    """偵測安全性與合規性設定。"""
    security = []

    for config in SECURITY_CONFIGS:
        if Path(config).exists():
            config_name = config.replace(".yml", "").replace(".yaml", "").lstrip(".")
            security.append(f"安全性：{config_name}")

    return security


def detect_performance_markers() -> List[str]:
    """偵測效能測試與分析標記。"""
    performance = []

    for marker in PERFORMANCE_MARKERS:
        if Path(marker).exists():
            performance.append(f"效能：找到 {marker}")
        else:
            # 檢查目錄
            try:
                if Path(marker).is_dir():
                    performance.append(f"效能：{marker}/ 目錄已找到")
            except Exception:
                pass

    return performance


def collect_code_metrics() -> dict:
    """收集程式碼指標：依副檔名統計檔案數、總行數 (LOC)。"""
    metrics = {
        "total_files": 0,
        "by_extension": {},
        "by_language": {},
        "total_lines": 0,
        "largest_files": []
    }

    # 語言對映
    lang_map = {
        "ts": "TypeScript", "tsx": "TypeScript/React", "js": "JavaScript",
        "jsx": "JavaScript/React", "py": "Python", "go": "Go",
        "java": "Java", "kt": "Kotlin", "rs": "Rust",
        "cs": "C#", "rb": "Ruby", "php": "PHP",
        "swift": "Swift", "scala": "Scala", "ex": "Elixir",
        "cpp": "C++", "c": "C", "h": "C Header",
        "clj": "Clojure", "lua": "Lua", "hs": "Haskell"
    }

    file_sizes = []

    try:
        for root, dirs, files in os.walk(Path.cwd()):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                filepath = Path(root) / file
                ext = filepath.suffix.lstrip('.')

                if not ext or ext in {"pyc", "o", "a", "so"}:
                    continue

                try:
                    size = filepath.stat().st_size
                    file_sizes.append((filepath.relative_to(Path.cwd()), size))

                    metrics["total_files"] += 1
                    metrics["by_extension"][ext] = metrics["by_extension"].get(ext, 0) + 1

                    lang = lang_map.get(ext, "其他")
                    metrics["by_language"][lang] = metrics["by_language"].get(lang, 0) + 1

                    # 統計文字檔行數
                    if ext in SOURCE_EXTS and size < 1_000_000:  # 跳過超大檔案
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                metrics["total_lines"] += len(f.readlines())
                        except Exception:
                            pass
                except Exception:
                    pass

        # 前 10 個最大的檔案
        file_sizes.sort(key=lambda x: x[1], reverse=True)
        metrics["largest_files"] = [
            f"{str(f)}: {s/1024:.1f}KB" for f, s in file_sizes[:10]
        ]

    except Exception:
        pass

    return metrics


def print_section(title: str, content: List[str], output_file=None) -> None:
    """列印帶有標題和內容的區段。"""
    lines = [f"\n=== {title} ==="]

    if isinstance(content, list):
        lines.extend(content if content else ["未找到。"])
    elif isinstance(content, str):
        lines.append(content)

    text = '\n'.join(lines) + '\n'

    if output_file:
        output_file.write(text)
    else:
        print(text, end='')


def main():
    """主要進入點。"""
    args = parse_args()

    output_file = None
    if args.output:
        output_dir = Path(args.output).parent
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file = open(args.output, 'w', encoding='utf-8')
        print(f"正在將輸出寫入：{args.output}", file=sys.stderr)

    try:
        # 目錄樹
        print_section(
            f"目錄樹 (最大深度 {TREE_MAX_DEPTH}，僅限原始碼檔案)",
            get_directory_tree(),
            output_file
        )

        # Stack 偵測
        manifests = find_manifest_files()
        if manifests:
            manifest_content = [""]
            for manifest in manifests:
                manifest_path = Path(manifest)
                manifest_content.append(f"--- {manifest} ---")
                if manifest == "bun.lockb":
                    manifest_content.append("[二進位 lock 檔案 — 請參閱 package.json 以取得依賴項目詳情。]")
                else:
                    manifest_content.append(read_file_preview(manifest_path))
            print_section("Stack 偵測 (manifest 檔案)", manifest_content, output_file)
        else:
            print_section("Stack 偵測 (manifest 檔案)", ["在專案根目錄中未找到可辨識的 manifest 檔案。"], output_file)

        # 進入點
        entries = find_entry_points()
        if entries:
            entry_content = [f"找到：{e}" for e in entries]
            print_section("進入點", entry_content, output_file)
        else:
            print_section("進入點", ["未找到常見的進入點。請檢查上方 manifest 檔案中的 'main' 或 'scripts.start'。"], output_file)

        # Linting 設定
        lint = find_lint_config()
        if lint:
            lint_content = [f"找到：{l}" for l in lint]
            print_section("LINTING 與格式化設定", lint_content, output_file)
        else:
            print_section("LINTING 與格式化設定", ["在專案根目錄中未找到 linting 或格式化設定檔案。"], output_file)

        # 環境變數範本
        envs = find_env_templates()
        if envs:
            env_content = []
            for filename, filepath in envs:
                env_content.append(f"--- {filename} ---")
                env_content.append(read_file_preview(filepath))
            print_section("環境變數範本", env_content, output_file)
        else:
            print_section("環境變數範本", ["未找到 .env.example 或 .env.template。請透過搜尋程式碼和設定中的環境變數讀取來識別所需的環境變數。"], output_file)

        # TODOs
        todos = search_todos()
        if todos:
            print_section("TODO / FIXME / HACK (僅限生產程式碼，排除測試目錄)", todos, output_file)
        else:
            print_section("TODO / FIXME / HACK (僅限生產程式碼，排除測試目錄)", ["未找到。"], output_file)

        # Git 資訊
        if is_git_repo():
            commits = get_git_commits()
            if commits:
                print_section("GIT 最近提交 (最後 20 筆)", commits, output_file)
            else:
                print_section("GIT 最近提交 (最後 20 筆)", ["未找到任何提交。"], output_file)

            churn = get_git_churn()
            if churn:
                print_section("高變動頻率檔案 (過去 90 天，前 20 名)", churn, output_file)
            else:
                print_section("高變動頻率檔案 (過去 90 天，前 20 名)", ["未找到。"], output_file)
        else:
            print_section("GIT 最近提交 (最後 20 筆)", ["並非 git 儲存庫或尚無任何提交。"], output_file)
            print_section("高變動頻率檔案 (過去 90 天，前 20 名)", ["並非 git 儲存庫。"], output_file)

        # Monorepo 偵測
        monorepo = detect_monorepo()
        if monorepo:
            print_section("MONOREPO 信號", monorepo, output_file)
        else:
            print_section("MONOREPO 信號", ["未偵測到 monorepo 信號。"], output_file)

        # 程式碼指標
        metrics = collect_code_metrics()
        metrics_output = [
            f"掃描檔案總數：{metrics['total_files']}",
            f"總程式碼行數：{metrics['total_lines']}",
            ""
        ]
        if metrics["by_language"]:
            metrics_output.append("依語言統計檔案：")
            for lang, count in sorted(metrics["by_language"].items(), key=lambda x: x[1], reverse=True):
                metrics_output.append(f"  {lang}：{count}")
        if metrics["largest_files"]:
            metrics_output.append("")
            metrics_output.append("前 10 個最大的檔案：")
            metrics_output.extend(metrics["largest_files"])
        print_section("程式碼指標", metrics_output, output_file)

        CD Detection/CD 偵測
        ci_cd = detect_ci_cd_pipelines()
        if ci_cd:
            print_section("CI/CD 管線", ci_cd, output_file)
        else:
            print_section("CI/CD 管線", ["未偵測到 CI/CD 管線。"], output_file)

        # 容器偵測
        containers = detect_containers()
        if containers:
            print_section("容器與協調", containers, output_file)
        else:
            print_section("容器與協調", ["未偵測到容器化設定。"], output_file)

        # 安全性設定
        security = detect_security_configs()
        if security:
            print_section("安全性與合規性", security, output_file)
        else:
            print_section("安全性與合規性", ["未偵測到安全性設定。"], output_file)

        # 效能標記
        performance = detect_performance_markers()
        if performance:
            print_section("效能與測試", performance, output_file)
        else:
            print_section("效能與測試", ["未偵測到效能測試設定。"], output_file)

        # 結束訊息
        final_msg = "\n=== 掃描完成 ===\n"
        if output_file:
            output_file.write(final_msg)
        else:
            print(final_msg, end='')

        return 0

    except Exception as e:
        print(f"錯誤：{e}", file=sys.stderr)
        return 1

    finally:
        if output_file:
            output_file.close()


if __name__ == "__main__":
    sys.exit(main())
