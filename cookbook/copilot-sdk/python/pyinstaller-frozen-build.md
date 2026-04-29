# 使用 PyInstaller 部署 Copilot SDK 應用程式

使用 PyInstaller (或 Nuitka) 將 Copilot SDK 應用程式封裝成獨立的可執行檔。

## 問題

當您使用 PyInstaller 凍結 (freeze) Python SDK 應用程式時，會有三件事失效：

1. **CLI 二進位檔案解析** — SDK 透過 `__file__` 定位其 CLI，在凍結建構中這會指向 PYZ 封存檔內部。
2. **SSL 憑證** — 在 macOS 上，凍結的應用程式找不到系統 CA 憑證，因此 CLI 子程序會導致 TLS 交握失敗。
3. **執行權限** — 從封存檔解壓縮時，組合的 CLI 二進位檔案可能會遺失其 `+x` 位元。

## 解決方案

透過搜尋 SDK 的正常位置和 PyInstaller 的 `_MEIPASS` 暫存目錄來解析 CLI 路徑。藉由將 `certifi` 的 CA 套件注入環境來修復 SSL。在啟動前恢復 Unix 上的執行權限。

```python
"""Copilot SDK 應用程式的凍結建構相容性。"""
import os, sys
from pathlib import Path
from copilot import CopilotClient, SubprocessConfig


def resolve_cli_path() -> str | None:
    """在凍結建構中尋找 Copilot CLI 二進位檔案。"""
    candidates = []
    binary = "copilot.exe" if sys.platform == "win32" else "copilot"

    # 1. SDK 的正常解析
    try:
        import copilot as pkg
        candidates.append(Path(pkg.__file__).parent / "bin" / binary)
    except Exception:
        pass

    # 2. PyInstaller _MEIPASS 備案
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        meipass = Path(sys._MEIPASS)
        candidates.append(meipass / "copilot" / "bin" / binary)
        candidates.append(meipass.parent / "copilot" / "bin" / binary)

    for c in candidates:
        if c.exists():
            # 在 Unix 上恢復執行權限 (在封存解壓縮過程中遺失)
            if sys.platform != "win32" and not os.access(str(c), os.X_OK):
                os.chmod(str(c), c.stat().st_mode | 0o755)
            return str(c)
    return None


def ensure_ssl_certs():
    """為 CLI 子程序設定 SSL 環境變數 (macOS 凍結建構)。"""
    if os.environ.get("SSL_CERT_FILE"):
        return
    try:
        import certifi
        ca = certifi.where()
        if Path(ca).is_file():
            os.environ["SSL_CERT_FILE"] = ca
            os.environ["REQUESTS_CA_BUNDLE"] = ca
            os.environ.setdefault("NODE_EXTRA_CA_CERTS", ca)
    except ImportError:
        pass  # CLI 將使用平台預設值


async def create_frozen_client():
    """建立在正常建構和凍結建構中都能運作的 CopilotClient。"""
    ensure_ssl_certs()
    kwargs = {"log_level": "info", "use_stdio": True}
    if getattr(sys, "frozen", False):
        cli = resolve_cli_path()
        if cli:
            kwargs["cli_path"] = cli
    client = CopilotClient(SubprocessConfig(**kwargs), auto_start=True)
    await client.start()
    return client
```

## PyInstaller Spec

在您的 `.spec` 檔案中包含 SDK 的二進位目錄，以便 PyInstaller 對其進行組合：

```python
from PyInstaller.utils.hooks import collect_data_files

data += collect_data_files('copilot', include_py_files=False)
```

## 提示

- **在乾淨的機器上測試凍結建構** — `_MEIPASS` 解壓縮的行為與您的開發環境不同。
- 在您的需求清單中**固定 `certifi`**，以便 CA 套件始終可用。
- **Nuitka** 使用不同的解壓縮模型 (`--include-package-data=copilot`)，但相同的 `resolve_cli_path` 邏輯仍然有效。

## 可執行的範例

請參閱 [`recipe/pyinstaller_frozen_build.py`](recipe/pyinstaller_frozen_build.py) 以取得完整的工作範例。
