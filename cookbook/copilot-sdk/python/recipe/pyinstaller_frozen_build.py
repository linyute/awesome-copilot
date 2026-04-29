"""
PyInstaller / 凍結建構相容性
=========================================
示範如何建立一個在 PyInstaller (或 Nuitka) 凍結可執行檔中正常運作的 CopilotClient。

正常執行：
    python pyinstaller_frozen_build.py

使用 PyInstaller 建構：
    pyinstaller --onefile pyinstaller_frozen_build.py

需求：
    pip install copilot-sdk certifi
"""

import asyncio
import os
import sys
from pathlib import Path

from copilot import CopilotClient, SubprocessConfig


# ---------------------------------------------------------------------------
# CLI 二進位檔案解析
# ---------------------------------------------------------------------------

def resolve_cli_path() -> str | None:
    """在凍結建構中尋找 Copilot CLI 二進位檔案。

    首先搜尋 SDK 的標準位置，然後回退到
    PyInstaller 的 _MEIPASS 暫存目錄。
    """
    candidates: list[Path] = []
    binary = "copilot.exe" if sys.platform == "win32" else "copilot"

    # 1. SDK 的正常解析 (在非凍結建構中運作)
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


# ---------------------------------------------------------------------------
# SSL 憑證設定
# ---------------------------------------------------------------------------

def ensure_ssl_certs():
    """將 certifi 的 CA 套件注入環境。

    在 macOS 凍結建構上，系統憑證儲存區是無法存取的，
    因此除非我們設定這些變數，否則 CLI 子程序會導致 TLS 交握失敗。
    """
    if os.environ.get("SSL_CERT_FILE"):
        return  # 已經設定

    try:
        import certifi
        ca = certifi.where()
        if Path(ca).is_file():
            os.environ["SSL_CERT_FILE"] = ca
            os.environ["REQUESTS_CA_BUNDLE"] = ca
            os.environ.setdefault("NODE_EXTRA_CA_CERTS", ca)
    except ImportError:
        pass  # CLI 將回退到平台預設值


# ---------------------------------------------------------------------------
# 用戶端處理站
# ---------------------------------------------------------------------------

async def create_frozen_client() -> CopilotClient:
    """建立一個在正常建構和凍結建構中都能運作的 CopilotClient。"""
    ensure_ssl_certs()

    kwargs: dict = {"log_level": "info", "use_stdio": True}

    if getattr(sys, "frozen", False):
        cli = resolve_cli_path()
        if cli:
            kwargs["cli_path"] = cli
            print(f"[frozen] 使用 CLI 路徑：{cli}")
        else:
            print("[frozen] 警告：無法找到 Copilot CLI 二進位檔案")

    client = CopilotClient(SubprocessConfig(**kwargs), auto_start=True)
    await client.start()
    return client


# ---------------------------------------------------------------------------
# 示範
# ---------------------------------------------------------------------------

async def main():
    frozen = getattr(sys, "frozen", False)
    print(f"以 {'凍結' if frozen else '正常'} Python 程序執行中")

    client = await create_frozen_client()
    try:
        session = await client.create_session()
        response = await session.send_message(
            "如果您能看到這則訊息，請說 'Hello from a frozen build!'"
        )
        print(f"回覆：{response}")
    finally:
        await client.stop()


if __name__ == "__main__":
    asyncio.run(main())
