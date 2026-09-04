#!/usr/bin/env bash
# 使用本機類神經 TTS（Kyutai pocket-tts）將純文字簡報轉換為 MP3。
#
# 使用方式: tts.sh <input.txt> <output.mp3> [voice.safetensors]
#
# 僅使用 CPU，且在首次下載模型後完全可離線執行，因此在 Apple Silicon Mac
# 與 Linux 雲端代理程式容器上的執行效果完全相同。不會傳送任何文字
# 至任何雲端 TTS 服務。
#
# 引擎解析順序：
#   1. 已存在於 PATH 中的 pocket-tts（例如 `brew install pocket-tts`）
#   2. 位於 $SPEAK_TTS_HOME 的快取虛擬環境（預設為 ~/.cache/speak-summary/venv）
#   3. 建立該虛擬環境並執行 `pip install pocket-tts`
# 設定 SPEAK_TTS_BIN 指向特定的 pocket-tts 二進位檔以略過上述所有步驟。
set -euo pipefail

IN="${1:?使用方式: tts.sh <input.txt> <output.mp3> [voice.safetensors]}"
OUT="${2:?使用方式: tts.sh <input.txt> <output.mp3> [voice.safetensors]}"
VOICE="${3:-}"

TTS_HOME="${SPEAK_TTS_HOME:-$HOME/.cache/speak-summary/venv}"

# pocket-tts 支援 Python >=3.10,<3.15。系統的 python3 通常不在
# 該範圍內，因此主動搜尋可用的直譯器而非盲目假設。
find_python() {
  for c in python3.14 python3.13 python3.12 python3.11 python3.10 python3; do
    p="$(command -v "$c" 2>/dev/null)" || continue
    "$p" -c 'import sys; raise SystemExit(0 if (3,10) <= sys.version_info < (3,15) else 1)' 2>/dev/null \
      && { echo "$p"; return 0; }
  done
  return 1
}

resolve_tts() {
  if [ -n "${SPEAK_TTS_BIN:-}" ]; then echo "$SPEAK_TTS_BIN"; return; fi
  if command -v pocket-tts >/dev/null 2>&1; then command -v pocket-tts; return; fi
  if [ -x "$TTS_HOME/bin/pocket-tts" ]; then echo "$TTS_HOME/bin/pocket-tts"; return; fi

  PY="$(find_python)" || {
    cat >&2 <<'MSG'
找不到合適的 Python。pocket-tts 需要 Python >=3.10 且 <3.15。
請安裝合適版本（例如 'brew install python@3.14' 或 'apt-get install -y python3.12-venv'），
或自行安裝 pocket-tts 並將 SPEAK_TTS_BIN 指向該二進位檔。
MSG
    exit 1
  }

  echo "找不到 pocket-tts；正在使用 $PY 於 $TTS_HOME 建立虛擬環境（僅需執行一次，約數分鐘）..." >&2
  "$PY" -m venv "$TTS_HOME" >&2 || { echo "建立虛擬環境失敗（是否已安裝 venv 模組？）。" >&2; exit 1; }
  "$TTS_HOME/bin/pip" install --quiet --upgrade pip >&2
  "$TTS_HOME/bin/pip" install --quiet pocket-tts >&2 || { echo "安裝 pocket-tts 失敗。" >&2; exit 1; }
  [ -x "$TTS_HOME/bin/pocket-tts" ] || { echo "pocket-tts 安裝完成但找不到二進位檔。" >&2; exit 1; }
  echo "$TTS_HOME/bin/pocket-tts"
}

TTS="$(resolve_tts)"
[ -x "$TTS" ] || { echo "TTS 引擎不可執行: $TTS" >&2; exit 1; }

# 編碼器：優先使用 ffmpeg；若無則回退至 macOS 的 afconvert（AAC 格式，.m4a）。
ENCODER=""
if command -v ffmpeg >/dev/null 2>&1; then ENCODER="ffmpeg"
elif command -v afconvert >/dev/null 2>&1; then ENCODER="afconvert"
else
  echo "需要 ffmpeg 來編碼音訊。請透過 'brew install ffmpeg' 或 'apt-get install -y ffmpeg' 安裝。" >&2
  exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# pocket-tts 在極長的輸入下品質會下降，因此在句子邊界處切分成約 600 字元的區塊，
# 分別進行語音合成，隨後再串接。
python3 - "$IN" "$WORK" <<'PY'
import re, sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text()
work = pathlib.Path(sys.argv[2])

# 移除會被朗讀為噪音的 Markdown 標記。
src = re.sub(r'```.*?```', ' ', src, flags=re.S)          # 圍欄程式碼區塊
src = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', src)        # 連結 -> 標籤
src = re.sub(r'^\s*#{1,6}\s*', '', src, flags=re.M)       # 標題
src = re.sub(r'^\s*[-*+]\s+', '', src, flags=re.M)        # 項目符號
src = re.sub(r'[*_`>|~]+', '', src)                       # 強調/程式碼/表格分隔線
src = re.sub(r'https?://\S+', '', src)                    # 純 URL
src = re.sub(r'[ \t]+', ' ', src)
src = re.sub(r'\n{2,}', '\n\n', src).strip()

MAX = 600
chunks, cur = [], ""
for sent in re.split(r'(?<=[.!?])\s+|\n\n', src):
    sent = sent.strip()
    if not sent:
        continue
    # 長度超過 MAX 的單一句子，最後手段是在逗號處進行切分。
    while len(sent) > MAX:
        cut = sent.rfind(',', 0, MAX)
        cut = cut if cut > MAX // 2 else sent.rfind(' ', 0, MAX)
        cut = cut if cut > 0 else MAX
        if cur:
            chunks.append(cur); cur = ""
        chunks.append(sent[:cut].strip())
        sent = sent[cut:].strip(' ,')
    if len(cur) + len(sent) + 1 > MAX:
        if cur:
            chunks.append(cur)
        cur = sent
    else:
        cur = f"{cur} {sent}".strip()
if cur:
    chunks.append(cur)

if not chunks:
    raise SystemExit("在輸入中找不到可朗讀的文字。")

for i, c in enumerate(chunks):
    (work / f"chunk_{i:04d}.txt").write_text(c)
PY

N=0
for f in "$WORK"/chunk_*.txt; do
  IDX="$(basename "$f" .txt)"
  ARGS=(generate --quiet --text "$(cat "$f")" --output-path "$WORK/$IDX.wav")
  [ -n "$VOICE" ] && ARGS+=(--voice "$VOICE")
  N=$((N+1))
  echo "  正在合成區塊 $N ..." >&2
  "$TTS" "${ARGS[@]}" >/dev/null
  echo "file '$WORK/$IDX.wav'" >> "$WORK/list.txt"
done

mkdir -p "$(dirname "$OUT")"

if [ "$ENCODER" = "ffmpeg" ]; then
  ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$WORK/list.txt" \
    -c:a libmp3lame -b:a 96k -ar 24000 -ac 1 "$OUT"
else
  # afconvert 無法直接串接，因此先合併 WAV，再編碼為 AAC。
  python3 - "$WORK" "$WORK/joined.wav" <<'PY'
import sys, wave, pathlib
work, out = pathlib.Path(sys.argv[1]), sys.argv[2]
parts = sorted(work.glob("chunk_*.wav"))
with wave.open(parts[0], 'rb') as w0:
    params = w0.getparams()
with wave.open(out, 'wb') as o:
    o.setparams(params)
    for p in parts:
        with wave.open(str(p), 'rb') as w:
            o.writeframes(w.readframes(w.getnframes()))
PY
  OUT="${OUT%.mp3}.m4a"
  afconvert -f m4af -d aac -b 96000 "$WORK/joined.wav" "$OUT"
  echo "注意: 未安裝 ffmpeg；改為寫入 AAC (.m4a) 而非 MP3。" >&2
fi

SIZE="$(du -h "$OUT" | cut -f1)"
echo "已寫入 $OUT ($SIZE, 共 $N 個區塊)"
