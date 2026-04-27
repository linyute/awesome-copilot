#!/usr/bin/env python3

import asyncio
from copilot import (
    CopilotClient,
    SessionConfig,
    MessageOptions,
    SessionEvent,
    PermissionHandler,
)

# ============================================================================
# 主要應用程式
# ============================================================================

async def main():
    print("=== 無障礙報告產生器 ===\n")

    url = input("輸入要分析的網址: ").strip()

    if not url:
        print("未提供網址。正在結束。")
        return

    # 確保網址包含協定
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    print(f"\n分析中: {url}")
    print("請稍候...\n")

    # 使用 Playwright MCP 伺服器建立 Copilot 用戶端
    client = CopilotClient()
    await client.start()

    session = await client.create_session(SessionConfig(
        model="claude-opus-4.6",
        streaming=True,
        mcp_servers={
            "playwright": {
                "type": "local",
                "command": "npx",
                "args": ["@playwright/mcp@latest"],
                "tools": ["*"],
            }
        },
        on_permission_request=PermissionHandler.approve_all))

    done = asyncio.Event()

    # 設定串流事件處理
    def handle_event(event: SessionEvent):
        if event.type.value == "assistant.message_delta":
            print(event.data.delta_content or "", end="", flush=True)
        elif event.type.value == "session.idle":
            done.set()
        elif event.type.value == "session.error":
            print(f"\n錯誤: {event.data.message}")
            done.set()

    session.on(handle_event)

    prompt = f"""
    使用 Playwright MCP 伺服器分析此網頁的無障礙性: {url}
    
    請:
    1. 使用 playwright-browser_navigate 導航至該網址
    2. 使用 playwright-browser_snapshot 進行無障礙快照
    3. 分析快照並提供詳細的無障礙報告
    
    格式化報告，嚴格遵循此結構及 Emoji 指示符:

    📊 無障礙報告: [網頁標題] (domain.com)

    ✅ 表現良好的項目
    | 類別 | 狀態 | 詳細資訊 |
    |----------|--------|---------|
    | 語言 | ✅ 通過 | lang="en-US" 設定正確 |
    | 網頁標題 | ✅ 通過 | "[Title]" 具有描述性 |
    | 標題階層 | ✅ 通過 | 單一 H1，正確的 H2/H3 結構 |
    | 圖片 | ✅ 通過 | 所有 X 張圖片皆有 alt 文字 |
    | 視埠 | ✅ 通過 | 允許捏合縮放 (無 user-scalable=no) |
    | 連結 | ✅ 通過 | 無模糊的「點擊這裡」連結 |
    | 減少動畫 | ✅ 通過 | 支援 prefers-reduced-motion |
    | 自動播放媒體 | ✅ 通過 | 無自動播放的音訊/影片 |

    ⚠️ 發現的問題
    | 嚴重程度 | 問題 | WCAG 準則 | 建議 |
    |----------|-------|----------------|----------------|
    | 🔴 高 | 無 <main> 地標 | 1.3.1, 2.4.1 | 將主要內容包裝在 <main> 元素中 |
    | 🔴 高 | 無跳過導覽連結 | 2.4.1 | 在頂部新增「跳至內容」連結 |
    | 🟡 中 | 焦點輪廓被停用 | 2.4.7 | 預設輪廓為 none - 確保存在可見的 :focus 樣式 |
    | 🟡 中 | 觸控目標太小 | 2.5.8 | 導覽連結高 37px (低於 44px 最小值) |

    📋 統計摘要
    - 連結總數: X
    - 標題總數: X (1× H1，層級正確)
    - 可聚焦元素: X
    - 發現的地標: banner ✅, navigation ✅, main ❌, footer ✅

    ⚙️ 優先建議
    - 新增 <main> 地標 - 將頁面內容包裝在 <main role="main"> 中以利螢幕閱讀器導覽
    - 新增跳過連結 - 在開始處建立隱藏連結: <a href="#main-content" class="skip-link">跳至內容</a>
    - 增加觸控目標 - 為導覽連結和標籤新增內距以符合 44×44px 最小值
    - 驗證焦點樣式 - 測試鍵盤導覽；新增可見的 :focus 或 :focus-visible 輪廓

    使用 ✅ 表示通過，🔴 表示高嚴重性問題，🟡 表示中等嚴重性，❌ 表示缺失項目。
    包含來自網頁分析的實際結果 - 不要只是複製範例。
    """

    await session.send(MessageOptions(prompt=prompt))
    await done.wait()

    print("\n\n=== 報告完成 ===\n")

    # 提示使用者產生測試
    generate_tests = input("您想要產生 Playwright 無障礙測試嗎? (y/n): ").strip().lower()

    if generate_tests in ("y", "yes"):
        done.clear()

        detect_language_prompt = """
        分析目前的目錄，以偵測此專案中使用的主要程式語言。
        尋找專案檔案，如 package.json, *.csproj, pom.xml, requirements.txt, go.mod 等。
        
        僅回傳偵測到的語言名稱 (例如 "TypeScript", "JavaScript", "C#", "Python", "Java")
        以及說明您偵測到它的簡短原因。
        若未偵測到任何專案，建議預設使用 "TypeScript" 作為 Playwright 測試。
        """

        print("\n正在偵測專案語言...\n")
        await session.send(MessageOptions(prompt=detect_language_prompt))
        await done.wait()

        language = input("\n\n確認測試使用的語言 (或輸入其他語言): ").strip()
        if not language:
            language = "TypeScript"

        done.clear()

        test_generation_prompt = f"""
        根據您剛剛為 {url} 產生的無障礙報告，建立 {language} 的 Playwright 無障礙測試。
        
        測試應執行以下操作:
        1. 驗證報告中的所有無障礙檢查
        2. 測試發現的問題 (確保它們得到修復)
        3. 包含以下測試:
           - 頁面具有正確的 lang 屬性
           - 頁面具有描述性標題
           - 標題階層正確 (單一 H1，正確的巢狀結構)
           - 所有圖片都有 alt 文字
           - 無自動播放媒體
           - 存在地標區域 (banner, nav, main, footer)
           - 存在「跳至內容」導覽連結且可運作
           - 焦點指標可見
           - 觸控目標符合最小尺寸要求
        4. 使用 Playwright 的無障礙測試功能
        5. 包含解釋每個測試的有用註解
        
        輸出可儲存並執行的完整測試檔案。
        如果您需要驗證任何網頁詳細資料，請使用 Playwright MCP 伺服器工具。
        """

        print("\n正在產生無障礙測試...\n")
        await session.send(MessageOptions(prompt=test_generation_prompt))
        await done.wait()

        print("\n\n=== 測試已產生 ===")

    await session.destroy()
    await client.stop()

if __name__ == "__main__":
    asyncio.run(main())
