---
name: caption-qa
description: '依據已發布的標準（Netflix 英文、BBC 字幕指引、DCMP 字幕規範）檢查 SRT 或 WebVTT 字幕的閱讀速度、行長、行數、螢幕停留時間、間隔與重疊，並在改寫文字前先透過重新計時來修正失敗問題。適用於需要對字幕進行品質檢查 (QA)、程式碼檢查 (lint) 或驗證、檢查字幕是否閱讀過快、為 Netflix、廣播或教育傳輸準備字幕，或在 CI 中新增字幕檢查時。'
license: MIT
---

# 字幕品質檢查 (Caption QA)

字幕在傳輸與無障礙審查中常因數字指標未達標而失敗：每秒字元數、每行字元數、螢幕停留時間以及字幕之間的間隔。每個標準發布的限制各自不同，因此在知道字幕用途與發布平台之前，「這些字幕合格嗎？」是沒有標準答案的。本技能會挑選正確的限制標準組合，依據官方標準的定義精確測量每個提示字幕 (cue)，並在不刪減講者原話的情況下修正問題。

## 何時使用此技能

- 使用者持有 `.srt` 或 `.vtt` 檔案，並詢問是否已可交付，或為何平台拒絕該檔案。
- 使用者詢問字幕是否閱讀速度過快，或行數/長度是否過長。
- 字幕即將送往 Netflix、廣播機構或美國教育媒體，必須符合相應規格。
- 使用者希望在 CI 中加入字幕檢查，使不合格的檔案中斷建構。

## 挑選標準

若使用者未指定目標，請採用 Netflix 英文（成人）標準並主動告知。

| 標準 | 閱讀速度 | 行長 | 行數 | 螢幕停留時間 | 字幕間隔 |
|---|---|---|---|---|---|
| Netflix 英文，成人 | 每秒 20 個字元 | 42 個字元 | 2 | 5/6 秒至 7 秒 | 至少 2 幀；小於 0.5 秒的間隔需縮短至 2 幀 |
| Netflix 英文，兒童 | 每秒 17 個字元 | 42 個字元 | 2 | 5/6 秒至 7 秒 | 與成人相同 |
| BBC 字幕指引 | 每分鐘 160-180 字；建議每個字約 0.3 秒 | 37 個字元（廣播）；線上內容為 16:9 畫面的 68% 寬度 | 2 | - | 若保留間隔，至少 1 秒，建議 1.5 秒 |
| DCMP 字幕規範 (美國教育媒體) | 低/中/高級分別為每分鐘 130 / 140 / 160 字 | - | 2 (建議) | 40 幀 (1 秒 10 幀) 至 6 秒 | - |

來源：[Netflix English (USA) Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide)、[Netflix subtitle timing guidelines](https://partnerhelp.netflixstudios.com/hc/en-us/articles/360051554394-Timed-Text-Style-Guide-Subtitle-Timing-Guidelines)、[BBC subtitle guidelines](https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/)、[DCMP Captioning Key: text](https://dcmp.org/learn/597-captioning-key---text) 與 [presentation rate](https://dcmp.org/learn/601-captioning-key---presentation-rate)。BBC 的每字時間與最小間隔屬於指引建議，因此請將其回報為建議事項，而非失敗項目。

## 以一致的方式測量每個提示字幕

- **字元 (Characters)** 是顯示文字中的字母、數字、空格與標點符號。不要計算換行符號、格式標籤 (`<i>`、`<b>`、`{\an8}`) 或提示序號。
- **閱讀速度 (Reading speed)** 為字元數除以持續時間（結束時間減去開始時間），單位為秒。
- **每分鐘字數 (Words a minute)** 為單字數除以持續時間，再乘以 60。單字是指包含字母或數字的一串連續字元，單一破折號不算單字。
- **間隔 (Gap)** 從前一個提示字幕的結束時間算到下一個提示字幕的開始時間。幀數限制取決於影格率：在 24 fps 下 2 幀為 0.083 秒，但在 30 fps 下為 0.067 秒。請詢問影格率，或說明你假設為 24 fps。
- **重疊 (Overlap)**：前一個提示字幕在後一個提示字幕開始之後才結束，在任何標準下均判定為失敗。
- 支援兩種時間戳記格式：`00:00:01,000` (SRT) 與 `00:00:01.000` 或 `01.000` (WebVTT)。略過 WebVTT 的 `NOTE`、`STYLE` 與 `REGION` 區塊，並將時間戳記後的提示設定 (`align:start`) 視為時間行的一部分。

## 工作流程

1. **確認目標**（平台、廣播機構或受眾年齡層），並從表格中選取標準。
2. **測量每個提示字幕**，或執行下方的命令列檢查指令碼並讀取其輸出。
3. **回報**時先顯示統計摘要行（例如「240 個字幕中有 212 個符合 Netflix 英文成人標準」）。接著依規則分組失敗項目，並標註提示編號與時間碼。每一類顯示前幾個問題字幕即可，避免輸出數百行。
4. **保留原話並修正**，順序如下：
   1. 將結束時間延伸至後續間隔中，同時維持最小間隔要求。
   2. 若前一個提示字幕很早就結束，可提早當前提示字幕的開始時間。
   3. 在片語邊界將過長的提示字幕拆分為兩個，每個均需符合最小螢幕停留時間。
   4. 將閃爍字幕（短於最小時間）合併至鄰近字幕中。
   5. 重新斷行：在標點符號後或連接詞、介系詞前斷行，並保持冠詞與名詞、名字與姓氏在同一行。
   6. 僅在使用者要求編輯過（非逐字）的字幕時，才修改文字措辭。
5. 修正後**再次測量**。重新計時可能會產生新的重疊或小於最小值的間隔。

## 參考檢查指令碼

當使用者需要可重複執行的檢查（針對資料夾中的多個檔案，或在 CI 中），請編寫此指令碼，或將其調整至所選標準。此指令碼套用表格中的 Netflix 成人限制，印出每個失敗的字幕，並在有任何字幕失敗時以代碼 1 結束，以便對建構進行閘道把關。它只需要 Python 3。

```python
import re
import sys

# Netflix 英文，成人節目。若使用其他標準請更改這些數值。
LIMITS = {"cps": 20, "cpl": 42, "lines": 2, "min_s": 5 / 6, "max_s": 7, "gap_frames": 2}
FPS = 24
T = r"(?:(\d+):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})"
TIMING = re.compile(T + r"\s*-->\s*" + T)
TAGS = re.compile(r"<[^>]+>|\{\\[^}]*\}")


def seconds(h, m, s, ms):
    return int(h or 0) * 3600 + int(m) * 60 + int(s) + int((ms + "00")[:3]) / 1000


def read_cues(path):
    text = open(path, encoding="utf-8-sig").read().replace("\r\n", "\n")
    for block in re.split(r"\n[ \t]*\n", text):
        lines = block.strip().split("\n")
        for i, line in enumerate(lines[:3]):
            m = TIMING.search(line)
            if m:
                body = [TAGS.sub("", t).rstrip() for t in lines[i + 1:]]
                g = m.groups()
                yield seconds(*g[:4]), seconds(*g[4:]), [t for t in body if t.strip()]
                break


def check(path, lim=LIMITS, fps=FPS):
    cues, failed = list(read_cues(path)), 0
    for n, (start, end, text) in enumerate(cues, 1):
        dur, chars, issues = end - start, sum(len(t) for t in text), []
        if dur > 0 and chars / dur > lim["cps"]:
            issues.append(f"{chars / dur:.1f} characters a second")
        issues += [f"line {j} is {len(t)} characters"
                   for j, t in enumerate(text, 1) if len(t) > lim["cpl"]]
        if len(text) > lim["lines"]:
            issues.append(f"{len(text)} lines")
        if dur < lim["min_s"] or dur > lim["max_s"]:
            issues.append(f"on screen {dur:.2f} s")
        if n < len(cues):
            gap = cues[n][0] - end
            if gap < 0:
                issues.append(f"overlaps the next caption by {-gap:.2f} s")
            elif gap * fps < lim["gap_frames"] - 0.01:
                issues.append(f"gap of {gap * fps:.0f} frames at {fps} fps")
        if issues:
            failed += 1
            print(f"{path} #{n} {start:.3f} -> {end:.3f}: " + "; ".join(issues))
    print(f"{path}: {len(cues) - failed} of {len(cues)} captions pass")
    return failed == 0


if __name__ == "__main__":
    results = [check(p) for p in sys.argv[1:]]
    sys.exit(0 if results and all(results) else 1)
```

以 `python3 check_captions.py captions/*.srt` 執行它。若使用其他標準，請修改 `LIMITS`，並為 BBC 和 DCMP 加入每分鐘字數檢查（單字數除以持續時間，乘以 60）。該指令碼不會檢查建議層級的規則（連接短間隔、BBC 的每字時間）；請另外分開回報這些項目。

在 GitHub Actions 中：

```yaml
- run: python3 check_captions.py captions/*.srt
```

## 常見陷阱

- 符合這些數值並不代表檔案已獲認證。Netflix 與廣播機構還會審查樣式：斜體、講者標籤、音效描述和位置。
- 這些限制標準是在 2026 年 10 月從各標準官方頁面讀取的。在引用限制作為最新依據之前，請先查閱官方來源。
- 僅涵蓋 SRT 與 WebVTT。請先使用 `ffmpeg -i subs.ass subs.srt` 轉換 ASS，這會保留時間軸並將文字包裝在字型標籤中，字元計數會自動忽略這些標籤。
