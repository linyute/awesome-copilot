---
name: 'image-manipulation-image-magick'
description: '使用 ImageMagick 處理和操作影像。支援調整大小、格式轉換、批次處理以及擷取影像 Metadata。適用於處理影像、建立縮圖、調整桌布大小或執行批次影像操作。'
compatibility: '需要安裝 ImageMagick 且在 PATH 中可使用 `magick`。提供 PowerShell (Windows) 和 Bash (Linux/macOS) 的跨平台範例。'
---

# 使用 ImageMagick 進行影像操作

此技能可在 Windows、Linux 和 macOS 系統上，使用 ImageMagick 執行影像處理和操作任務。

## 何時使用此技能

當您需要執行以下操作時，請使用此技能：

- 調整影像大小 (單一或批次)
- 獲取影像尺寸和 Metadata
- 在影像格式之間進行轉換
- 建立縮圖
- 針對不同的螢幕尺寸處理桌布
- 根據特定標準批次處理多個影像

## 先決條件

- 系統已安裝 ImageMagick
- **Windows**: 使用 PowerShell，且 ImageMagick 可作為 `magick` 使用 (或位於 `C:\Program Files\ImageMagick-*\magick.exe`)
- **Linux/macOS**: 使用 Bash，且透過套件管理員 (`apt`、`brew` 等) 安裝 ImageMagick

## 核心功能

### 1. 影像資訊

- 獲取影像尺寸 (寬度 x 高度)
- 擷取詳細 Metadata (格式、色彩空間等)
- 辨識影像格式

### 2. 調整影像大小

- 調整單一影像大小
- 批次調整多個影像大小
- 建立特定尺寸的縮圖
- 維持長寬比

### 3. 批次處理

- 根據尺寸處理影像
- 篩選並處理特定的檔案類型
- 對多個檔案套用轉換

## 使用範例

### 範例 0：解析 `magick` 執行檔

**PowerShell (Windows):**
```powershell
# 偏好使用 PATH 中的 ImageMagick
$magick = (Get-Command magick -ErrorAction SilentlyContinue)?.Source

# 備案：Program Files 下常見的安裝路徑
if (-not $magick) {
    $magick = Get-ChildItem "C:\Program Files\ImageMagick-*\magick.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $magick) {
    throw "找不到 ImageMagick。請安裝它及/或將 'magick' 加入 PATH。"
}
```

**Bash (Linux/macOS):**
```bash
# 檢查 PATH 中是否可使用 magick
if ! command -v magick &> /dev/null; then
    echo "找不到 ImageMagick。請使用您的套件管理員進行安裝："
    echo "  Ubuntu/Debian: sudo apt install imagemagick"
    echo "  macOS: brew install imagemagick"
    exit 1
fi
```

### 範例 1：獲取影像尺寸

**PowerShell (Windows):**
```powershell
# 針對單一影像
& $magick identify -format "%wx%h" path/to/image.jpg

# 針對多個影像
Get-ChildItem "path/to/images/*" | ForEach-Object {
    $dimensions = & $magick identify -format "%f: %wx%h`n" $_.FullName
    Write-Host $dimensions
}
```

**Bash (Linux/macOS):**
```bash
# 針對單一影像
magick identify -format "%wx%h" path/to/image.jpg

# 針對多個影像
for img in path/to/images/*; do
    magick identify -format "%f: %wx%h\n" "$img"
done
```

### 範例 2：調整影像大小

**PowerShell (Windows):**
```powershell
# 調整單一影像大小
& $magick input.jpg -resize 427x240 output.jpg

# 批次調整影像大小
Get-ChildItem "path/to/images/*" | ForEach-Object {
    & $magick $_.FullName -resize 427x240 "path/to/output/thumb_$($_.Name)"
}
```

**Bash (Linux/macOS):**
```bash
# 調整單一影像大小
magick input.jpg -resize 427x240 output.jpg

# 批次調整影像大小
for img in path/to/images/*; do
    filename=$(basename "$img")
    magick "$img" -resize 427x240 "path/to/output/thumb_$filename"
done
```

### 範例 3：獲取詳細影像資訊

**PowerShell (Windows):**
```powershell
# 獲取影像的詳細資訊
& $magick identify -verbose path/to/image.jpg
```

**Bash (Linux/macOS):**
```bash
# 獲取影像的詳細資訊
magick identify -verbose path/to/image.jpg
```

### 範例 4：根據尺寸處理影像

**PowerShell (Windows):**
```powershell
Get-ChildItem "path/to/images/*" | ForEach-Object {
    $dimensions = & $magick identify -format "%w,%h" $_.FullName
    if ($dimensions) {
        $width,$height = $dimensions -split ','
        if ([int]$width -eq 2560 -or [int]$height -eq 1440) {
            Write-Host "正在處理 $($_.Name)"
            & $magick $_.FullName -resize 427x240 "path/to/output/thumb_$($_.Name)"
        }
    }
}
```

**Bash (Linux/macOS):**
```bash
for img in path/to/images/*; do
    dimensions=$(magick identify -format "%w,%h" "$img")
    if [[ -n "$dimensions" ]]; then
        width=$(echo "$dimensions" | cut -d',' -f1)
        height=$(echo "$dimensions" | cut -d',' -f2)
        if [[ "$width" -eq 2560 || "$height" -eq 1440 ]]; then
            filename=$(basename "$img")
            echo "正在處理 $filename"
            magick "$img" -resize 427x240 "path/to/output/thumb_$filename"
        fi
    fi
done
```

## 準則

1. **務必將檔案路徑加上引號** - 針對可能包含空格的檔案路徑，請使用引號括起來
2. **使用 `&` 運算子 (PowerShell)** - 在 PowerShell 中，使用 `&` 來呼叫 magick 執行檔
3. **將路徑儲存在變數中 (PowerShell)** - 將 ImageMagick 路徑指派給 `$magick` 變數，使程式碼更簡潔
4. **包裝在迴圈中** - 處理多個檔案時，請使用 `ForEach-Object` (PowerShell) 或 `for` 迴圈 (Bash)
5. **優先驗證尺寸** - 在處理前先檢查影像尺寸，以避免不必要的作業
6. **使用適當的縮放旗標** - 考慮使用 `!` 來強制指定精確尺寸，或使用 `^` 來指定最小尺寸

## 常見模式

### PowerShell 模式

#### 模式：儲存 ImageMagick 路徑

```powershell
$magick = (Get-Command magick).Source
```

#### 模式：將尺寸獲取為變數

```powershell
$dimensions = & $magick identify -format "%w,%h" $_.FullName
$width,$height = $dimensions -split ','
```

#### 模式：條件處理

```powershell
if ([int]$width -gt 1920) {
    & $magick $_.FullName -resize 1920x1080 $outputPath
}
```

#### 模式：建立縮圖

```powershell
& $magick $_.FullName -resize 427x240 "thumbnails/thumb_$($_.Name)"
```

### Bash 模式

#### 模式：檢查 ImageMagick 安裝情況

```bash
command -v magick &> /dev/null || { echo "需要 ImageMagick"; exit 1; }
```

#### 模式：將尺寸獲取為變數

```bash
dimensions=$(magick identify -format "%w,%h" "$img")
width=$(echo "$dimensions" | cut -d',' -f1)
height=$(echo "$dimensions" | cut -d',' -f2)
```

#### 模式：條件處理

```bash
if [[ "$width" -gt 1920 ]]; then
    magick "$img" -resize 1920x1080 "$outputPath"
fi
```

#### 模式：建立縮圖

```bash
filename=$(basename "$img")
magick "$img" -resize 427x240 "thumbnails/thumb_$filename"
```

## 限制

- 大型批次作業可能會耗費大量記憶體
- 某些複雜的操作可能需要額外的 ImageMagick 委派 (delegates)
- 在較舊的 Linux 系統上，請使用 `convert` 代替 `magick` (ImageMagick 6.x 與 7.x 的差異)
