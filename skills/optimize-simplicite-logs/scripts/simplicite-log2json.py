import argparse
import re
import json
import sys

# 可用的欄位清單
VALID_FIELDS = [
    "timestamp", "app", "level", "endpoint", "contextPath", "event", 
    "user", "class", "function", "rowId", "body"
]

def validate_fields(value):
    """驗證使用者提供的欄位是否在可用欄位清單中。"""
    fields = [f.strip() for f in value.split(",")]
    for f in fields:
        if f not in VALID_FIELDS:
            raise argparse.ArgumentTypeError(f"無效的欄位：{f}。可用欄位：{', '.join(VALID_FIELDS)}")
    return fields

def parse_args():
    """解析指令列引數。"""
    parser = argparse.ArgumentParser(
        prog="simplicite-log2json",
        description="解析 Simplicité 紀錄 (logs) 並輸出 JSON。"
    )
    parser.add_argument("input", help="輸入的 .txt 紀錄檔案路徑")
    parser.add_argument("-o", "--output", help="輸出檔案路徑 (預設為標準輸出 stdout)", metavar="FILE")
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--include", help=f"欲包含的欄位 (以逗號分隔)。可用欄位：{', '.join(VALID_FIELDS)}", type=validate_fields, metavar="FIELDS", action="append")
    group.add_argument("--exclude", help=f"欲排除的欄位 (以逗號分隔)。可用欄位：{', '.join(VALID_FIELDS)}", type=validate_fields, metavar="FIELDS", action="append")
    
    return parser.parse_args()

def parse_log_entry(text, log_regex):
    """根據正規表示式解析單一紀錄項目。"""
    match = log_regex.match(text)
    if match:
        return {
            "timestamp": match.group("timestamp") or "",
            "app": match.group("app") or "",
            "level": match.group("level") or "",
            "endpoint": match.group("endpoint") or "",
            "contextPath": match.group("contextPath") or "",
            "event": match.group("event") or "",
            "user": match.group("user") or "",
            "class": match.group("class") or "",
            "function": match.group("function") or "",
            "rowId": match.group("rowId") or "",
            "body": match.group("body") or "",
        }
    return None

def filter_entry(entry, include, exclude):
    """根據包含或排除清單過濾紀錄項目的欄位。"""
    filtered = {}
    for k, v in entry.items():
        if include is not None and k not in include:
            continue
        if exclude is not None and k in exclude:
            continue
        filtered[k] = v
    return filtered

def main():
    args = parse_args()
    
    # 處理可能的多個 --include 或 --exclude 引數
    include_fields = [item for sublist in args.include for item in sublist] if args.include else None
    exclude_fields = [item for sublist in args.exclude for item in sublist] if args.exclude else None

    # 用於匹配 Simplicité 紀錄格式的正規表示式
    log_regex = re.compile(r"^(?P<timestamp>.*?)\|(?P<app>SIMPLICITE)\|(?P<level>.+?)\|\|(?P<endpoint>.*?)\|(?P<contextPath>.*?)\|(?P<event>.*?)\|(?P<user>.*?)\|(?P<class>.*?)\|(?P<function>.*?)\|(?P<rowId>.*?)\|(?P<body>.*)$", re.DOTALL)
    # 用於識別新紀錄項目起始時間戳記的正規表示式
    timestamp_re = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}")
    
    entries = []
    buffer = []
    processed = 0
    skipped = 0
    
    try:
        with open(args.input, "r", encoding="utf-8") as f:
            for line in f:
                line_stripped = line.rstrip('\n')
                
                # 如果該行以時間戳記開始，代表是一個新的紀錄項目
                if timestamp_re.match(line_stripped):
                    if buffer:
                        # 處理緩衝區中的前一個紀錄項目
                        entry_text = '\n'.join(buffer)
                        entry = parse_log_entry(entry_text, log_regex)
                        if entry:
                            entries.append(entry)
                            processed += 1
                        else:
                            skipped += 1
                        buffer = []
                
                buffer.append(line_stripped)
                
            # 處理最後一個紀錄項目
            if buffer:
                entry_text = '\n'.join(buffer)
                entry = parse_log_entry(entry_text, log_regex)
                if entry:
                    entries.append(entry)
                    processed += 1
                else:
                    skipped += 1
    except Exception as e:
        sys.stderr.write(f"無法開啟輸入檔案：{e}\n")
        sys.exit(1)
        
    # 套用欄位過濾
    filtered = [filter_entry(entry, include_fields, exclude_fields) for entry in entries]
    json_str = json.dumps(filtered, indent=2, ensure_ascii=False)
    
    # 輸出結果
    if args.output:
        try:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(json_str)
        except Exception as e:
            sys.stderr.write(f"無法建立輸出檔案：{e}\n")
            sys.exit(1)
    else:
        print(json_str)
        
    sys.stderr.write(f"已處理：{processed} 條項目，已跳過：{skipped} 條項目\n")

if __name__ == "__main__":
    main()
