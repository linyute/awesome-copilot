---
name: legacy-circuit-mockups
description: '使用 HTML5 Canvas 繪圖技術產生麵包板電路模擬圖與視覺圖表。當被要求建立電路佈局、視覺化電子元件放置、繪製麵包板圖表、模擬 6502 建置、產生復古電腦電路圖或設計老式電子專案時使用。支援 555 計時器、W65C02S 微處理器、28C256 EEPROM、W65C22 VIA 晶片、7400 系列邏輯閘、LED、電阻、電容、開關、按鈕、晶體及導線。'
---

# 復古電路模擬圖

這是一項用於為復古計算與電子專案建立麵包板電路模擬圖與視覺圖表的技能。此技能利用 HTML5 Canvas 繪圖機制來渲染互動式電路佈局，具備老式元件如 6502 微處理器、555 計時器 IC、EEPROM 及 7400 系列邏輯閘。

## 何時使用此技能

- 使用者要求「建立麵包板佈局」或「模擬電路」
- 使用者想要視覺化麵包板上的元件放置
- 使用者在建置 6502 電腦時需要視覺參考
- 使用者要求「繪製電路」或「繪製電子圖表」
- 使用者想要建立電子教學視覺效果
- 使用者提到 Ben Eater 教學或復古計算專案
- 使用者要求模擬 555 計時器電路或 LED 專案
- 使用者需要視覺化元件之間的導線連接

## 先決條件

- 從隨附的參考檔案中了解元件腳位（pinouts）
- 麵包板佈局慣例知識（行、列、電源軌）

## 支援的元件

### 微處理器與記憶體

| 元件 | 腳位 | 描述 |
|-----------|------|-------------|
| W65C02S | 40-pin DIP | 具備 16 位元位址匯流排的 8 位元微處理器 |
| 28C256 | 28-pin DIP | 32KB 平行 EEPROM |
| W65C22 | 40-pin DIP | 多功能介面配接器 (VIA) |
| 62256 | 28-pin DIP | 32KB 靜態 RAM |

### 邏輯與計時器 IC

| 元件 | 腳位 | 描述 |
|-----------|------|-------------|
| NE555 | 8-pin DIP | 用於定時與振盪的計時器 IC |
| 7400 | 14-pin DIP | 四路 2 輸入 NAND 閘 |
| 7402 | 14-pin DIP | 四路 2 輸入 NOR 閘 |
| 7404 | 14-pin DIP | 六路反向器 (NOT 閘) |
| 7408 | 14-pin DIP | 四路 2 輸入 AND 閘 |
| 7432 | 14-pin DIP | 四路 2 輸入 OR 閘 |

### 被動與主動元件

| 元件 | 描述 |
|-----------|-------------|
| LED | 發光二極體（各種顏色） |
| 電阻 | 電流限制（可配置數值） |
| 電容 | 濾波與定時（陶瓷/電解） |
| 晶體 | 時脈振盪器 |
| 開關 | 搖頭開關（鎖定式） |
| 按鈕 | 瞬間按鈕 |
| 可變電阻 | 可變電阻器 |
| 光敏電阻 | 光依賴電阻器 |

### 網格系統

```javascript
// 標準麵包板網格：20px 間距
const gridSize = 20;
const cellX = Math.floor(x / gridSize) * gridSize;
const cellY = Math.floor(y / gridSize) * gridSize;
```

### 元件渲染模式

```javascript
// 所有元件遵循此結構：
{
  type: 'component-type',
  x: gridX,
  y: gridY,
  width: componentWidth,
  height: componentHeight,
  rotation: 0,  // 0, 90, 180, 270
  properties: { /* 元件特定資料 */ }
}
```

### 導線連接

```javascript
// 導線連接格式：
{
  start: { x: startX, y: startY },
  end: { x: endX, y: endY },
  color: '#ff0000'  // 導線顏色編碼
}
```

## 逐步工作流

### 建立基礎 LED 電路模擬圖

1. 定義麵包板尺寸與網格
2. 放置電源軌連接 (+5V 與 GND)
3. 加入具備陽極/陰極方向的 LED 元件
4. 放置限流電阻
5. 繪製元件之間的導線連接
6. 加入標籤與註解

### 建立 555 計時器電路

1. 將 NE555 IC 放置於麵包板上（腳位 1-4 在左，5-8 在右）
2. 將腳位 1 (GND) 連接到接地軌
3. 將腳位 8 (Vcc) 連接到電源軌
4. 加入定時電阻與電容
5. 連接觸發 (trigger) 與閾值 (threshold) 接線
6. 將輸出連接到 LED 或其他負載

### 建立 6502 微處理器佈局

1. 將 W65C02S 置中放置於麵包板上
2. 加入 28C256 EEPROM 用於程式儲存
3. 放置 W65C22 VIA 用於 I/O
4. 加入 7400 系列邏輯用於位址解碼
5. 連接位址匯流排 (A0-A15)
6. 連接資料匯流排 (D0-D7)
7. 連接控制訊號 (R/W, PHI2, RESB)
8. 加入重設按鈕與時脈晶體

## 元件腳位快速參考

### 555 計時器 (8-pin DIP)

| 腳位 | 名稱 | 功能 |
|:---:|:-----|:---------|
| 1 | GND | 接地 (0V) |
| 2 | TRIG | 觸發 (< 1/3 Vcc 開始計時) |
| 3 | OUT | 輸出 (提供/吸收 200mA) |
| 4 | RESET | 低電位有效重設 |
| 5 | CTRL | 控制電壓 (以 10nF 旁路) |
| 6 | THR | 閾值 (> 2/3 Vcc 重設) |
| 7 | DIS | 放電 (開集極) |
| 8 | Vcc | 電源 (+4.5V 至 +16V) |

### W65C02S (40-pin DIP) - 關鍵腳位

| 腳位 | 名稱 | 功能 |
|:---:|:-----|:---------|
| 8 | VDD | 電源供應 |
| 21 | VSS | 接地 |
| 37 | PHI2 | 系統時脈輸入 |
| 40 | RESB | 低電位有效重設 |
| 34 | RWB | 讀取/寫入訊號 |
| 9-25 | A0-A15 | 位址匯流排 |
| 26-33 | D0-D7 | 資料匯流排 |

### 28C256 EEPROM (28-pin DIP) - 關鍵腳位

| 腳位 | 名稱 | 功能 |
|:---:|:-----|:---------|
| 14 | GND | 接地 |
| 28 | VCC | 電源供應 |
| 20 | CE | 晶片致能 (低電位有效) |
| 22 | OE | 輸出致能 (低電位有效) |
| 27 | WE | 寫入致能 (低電位有效) |
| 1-10, 21-26 | A0-A14 | 位址輸入 |
| 11-19 | I/O0-I/O7 | 資料匯流排 |

## 公式參考

### 電阻計算

- **歐姆定律：** V = I × R
- **LED 電流：** R = (Vcc - Vled) / Iled
- **功率：** P = V × I = I² × R

### 555 計時器公式

**無穩態模式 (Astable Mode)：**

- 頻率：f = 1.44 / ((R1 + 2×R2) × C)
- 高電位時間：t₁ = 0.693 × (R1 + R2) × C
- 低電位時間：t₂ = 0.693 × R2 × C
- 工作週期 (Duty cycle)：D = (R1 + R2) / (R1 + 2×R2) × 100%

**單穩態模式 (Monostable Mode)：**

- 脈衝寬度：T = 1.1 × R × C

### 電容計算

- 容抗：Xc = 1 / (2πfC)
- 儲存能量：E = ½ × C × V²

## 顏色編碼慣例

### 導線顏色

| 顏色 | 用途 |
|-------|---------|
| 紅色 | +5V / 電源 |
| 黑色 | 接地 |
| 黃色 | 時脈 / 定時 |
| 藍色 | 位址匯流排 |
| 綠色 | 資料匯流排 |
| 橘色 | 控制訊號 |
| 白色 | 一般用途 |

### LED 顏色

| 顏色 | 順向電壓 |
|-------|-----------------|
| 紅色 | 1.8V - 2.2V |
| 綠色 | 2.0V - 2.2V |
| 黃色 | 2.0V - 2.2V |
| 藍色 | 3.0V - 3.5V |
| 白色 | 3.0V - 3.5V |

## 建置範例

### 建置 1 — 單個 LED

**元件：** 紅色 LED、220Ω 電阻、跳線、電源

**步驟：**

1. 將黑色跳線從電源 GND 插入 A5 行
2. 將紅色跳線從電源 +5V 插入 J5 行
3. 放置 LED，將陰極（短腳）與 GND 行對齊
4. 在電源與 LED 陽極之間放置 220Ω 電阻

### 建置 2 — 555 無穩態閃爍器

**元件：** NE555、LED、電阻 (10kΩ, 100kΩ)、電容 (10µF)

**步驟：**

1. 將 555 IC 跨接在中心通道上
2. 將腳位 1 連接到 GND，腳位 8 連接到 +5V
3. 將腳位 4 連接到腳位 8（停用重設）
4. 在腳位 7 與 +5V 之間連接 10kΩ 電阻
5. 在腳位 6 與 7 之間連接 100kΩ 電阻
6. 在腳位 6 與 GND 之間連接 10µF 電容
7. 將腳位 3（輸出）連接到 LED 電路

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| LED 不亮 | 檢查極性（陽極接 +，陰極接 -） |
| 電路沒電 | 驗證電源軌連接 |
| IC 不運作 | 檢查 VCC 與 GND 腳位連接 |
| 555 不振盪 | 驗證閾值/觸發電容接線 |
| 微處理器當機 | 檢查 RESB 在重設脈衝後是否為高電位 (HIGH) |

## 參考資料

詳細的元件規格可在隨附的參考檔案中找到：

- [555.md](references/555.md) - 完整 555 計時器 IC 規格
- [6502.md](references/6502.md) - MOS 6502 微處理器詳細資訊
- [6522.md](references/6522.md) - W65C22 VIA 介面配接器
- [28256-eeprom.md](references/28256-eeprom.md) - AT28C256 EEPROM 規格
- [6C62256.md](references/6C62256.md) - 62256 SRAM 詳細資訊
- [7400-series.md](references/7400-series.md) - TTL 邏輯閘腳位
- [assembly-compiler.md](references/assembly-compiler.md) - 組合語言編譯器規格
- [assembly-language.md](references/assembly-language.md) - 組合語言規格
- [basic-electronic-components.md](references/basic-electronic-components.md) - 電阻、電容、開關
- [breadboard.md](references/breadboard.md) - 麵包板規格
- [common-breadboard-components.md](references/common-breadboard-components.md) - 綜合元件參考
- [connecting-electronic-components.md](references/connecting-electronic-components.md) - 逐步建置指南
- [emulator-28256-eeprom.md](references/emulator-28256-eeprom.md) - 模擬 28256-eeprom 規格
- [emulator-6502.md](references/emulator-6502.md) - 模擬 6502 規格
- [emulator-6522.md](references/emulator-6522.md) - 模擬 6522 規格
- [emulator-6C62256.md](references/emulator-6C62256.md) - 模擬 6C62256 規格
- [emulator-lcd.md](references/emulator-lcd.md) - 模擬 LCD 規格
- [lcd.md](references/lcd.md) - LCD 顯示器介面
- [minipro.md](references/minipro.md) - EEPROM 燒錄器使用方法
- [t48eeprom-programmer.md](references/t48eeprom-programmer.md) - T48 燒錄器參考
