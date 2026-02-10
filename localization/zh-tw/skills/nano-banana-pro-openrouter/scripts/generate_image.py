#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "openai",
# ]
# ///
"""
透過 OpenRouter 使用 openai-python 建立或編輯影像。
"""

import argparse
import base64
import mimetypes
import os
from pathlib import Path

from openai import OpenAI


# 設定
MAX_INPUT_IMAGES = 3
MIME_TO_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
}


def parse_args():
    parser = argparse.ArgumentParser(description="透過 OpenRouter 建立或編輯影像。")
    parser.add_argument("--prompt", required=True, help="描述所需影像的提示詞。")
    parser.add_argument("--filename", required=True, help="輸出檔案名稱（相對於目前工作目錄）。")
    parser.add_argument(
      "--resolution",
      type=str.upper,
      choices=["1K", "2K", "4K"],
      default="1K",
      help="輸出解析度：1K、2K 或 4K。",
    )
    parser.add_argument(
      "--input-image",
      action="append",
      default=[],
      help=f"選用的輸入影像路徑（可重複，最多 {MAX_INPUT_IMAGES} 個）。",
    )
    return parser.parse_args()


def require_api_key():
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit("環境變數中未設定 OPENROUTER_API_KEY。")
    return api_key


def encode_image_to_data_url(path: Path) -> str:
    if not path.exists():
        raise SystemExit(f"找不到輸入影像：{path}")
    mime, _ = mimetypes.guess_type(str(path))
    if not mime:
        mime = "image/png"
    data = path.read_bytes()
    encoded = base64.b64encode(data).decode("utf-8")
    return f"data:{mime};base64,{encoded}"


def build_message_content(prompt: str, input_images: list[str]) -> list[dict]:
    content: list[dict] = [{"type": "text", "text": prompt}]
    for image_path in input_images:
        data_url = encode_image_to_data_url(Path(image_path))
        content.append({"type": "image_url", "image_url": {"url": data_url}})
    return content


def parse_data_url(data_url: str) -> tuple[str, bytes]:
    if not data_url.startswith("data:") or ";base64," not in data_url:
        raise SystemExit("影像 URL 不是 base64 資料 URL。")
    header, encoded = data_url.split(",", 1)
    mime = header[5:].split(";", 1)[0]
    try:
        raw = base64.b64decode(encoded)
    except Exception as e:
        raise SystemExit(f"無法解碼 base64 影像負載：{e}")
    return mime, raw


def resolve_output_path(filename: str, image_index: int, total_count: int, mime: str) -> Path:
    output_path = Path(filename)
    suffix = output_path.suffix

    # 驗證/更正副檔名以符合 MIME 類型
    expected_suffix = MIME_TO_EXT.get(mime, ".png")
    if suffix and suffix.lower() != expected_suffix.lower():
        print(f"警告：檔案副檔名 '{suffix}' 與傳回的 MIME 類型 '{mime}' 不符。改為使用 '{expected_suffix}'。")
        suffix = expected_suffix
    elif not suffix:
        suffix = expected_suffix

    # 單一影像：使用原始主檔名 + 更正後的副檔名
    if total_count <= 1:
        return output_path.with_suffix(suffix)

    # 多個影像：附加編號
    return output_path.with_name(f"{output_path.stem}-{image_index + 1}{suffix}")


def extract_image_url(image: dict | object) -> str | None:
    if isinstance(image, dict):
        return image.get("image_url", {}).get("url") or image.get("url")
    return None


def load_system_prompt():
    """如果 assets/SYSTEM_TEMPLATE 存在且不為空，則從中載入系統提示詞。"""
    script_dir = Path(__file__).parent.parent
    template_path = script_dir / "assets" / "SYSTEM_TEMPLATE"

    if template_path.exists():
        content = template_path.read_text(encoding="utf-8").strip()
        if content:
            return content
    return None


def main():
    args = parse_args()

    if len(args.input_image) > MAX_INPUT_IMAGES:
        raise SystemExit(f"輸入影像過多：{len(args.input_image)} (最多 {MAX_INPUT_IMAGES})。")

    image_size = args.resolution

    client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=require_api_key())

    # 使用選用的系統提示詞建立訊息
    messages = []

    system_prompt = load_system_prompt()
    if system_prompt:
        messages.append({
            "role": "system",
            "content": system_prompt,
        })

    messages.append({
        "role": "user",
        "content": build_message_content(args.prompt, args.input_image),
    })

    response = client.chat.completions.create(
        model="google/gemini-3-pro-image-preview",
        messages=messages,
        extra_body={
            "modalities": ["image", "text"],
            # https://openrouter.ai/docs/guides/overview/multimodal/image-generation#image-configuration-options
            "image_config": {
                # "aspect_ratio": "16:9",
                "image_size": image_size,
            }
        },
    )

    message = response.choices[0].message
    images = getattr(message, "images", None)
    if not images:
        raise SystemExit("API 未傳回任何影像。")

    # 在處理影像前建立一次輸出目錄
    output_base_path = Path(args.filename)
    if output_base_path.parent and str(output_base_path.parent) != '.':
        output_base_path.parent.mkdir(parents=True, exist_ok=True)

    saved_paths = []
    for idx, image in enumerate(images):
        image_url = extract_image_url(image)
        if not image_url:
            raise SystemExit("影像負載缺少 image_url.url。")
        mime, raw = parse_data_url(image_url)
        output_path = resolve_output_path(args.filename, idx, len(images), mime)
        output_path.write_bytes(raw)
        saved_paths.append(output_path.resolve())

    for path in saved_paths:
        print(f"影像已儲存至：{path}")
        print(f"MEDIA: {path}")


if __name__ == "__main__":
    main()
