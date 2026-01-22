# 6502 SBC 組合語言編譯與 ROM 建構規格

## 概述

此文件定義了為單板電腦 (SBC) 編譯 **6502 組合語言**的完整規格，該單板電腦包含：

* **MOS 6502 CPU**
* **MOS 6522 VIA**
* **AS6C62256 (32 KB SRAM)**
* **AT28C256 (32 KB EEPROM / ROM)**
* **DFRobot FIT0127 (相容 HD44780 的 16x2 LCD)**

重點在於**工具鏈行為、記憶體佈局、ROM 建構與韌體慣例**，而非電氣接線。

---

## 目標系統架構

### 記憶體映射表 (標準)

```
$0000-$00FF  零頁 (RAM)
$0100-$01FF  堆疊 (RAM)
$0200-$7FFF  一般 RAM (AS6C62256)
$8000-$8FFF  6522 VIA I/O 空間
$9000-$FFFF  ROM (AT28C256)
```

> 位址解碼可能會鏡像元件；組合語言編譯器假設採用此標準佈局。

---

## ROM 組織 (AT28C256)

| 位址 | 用途 |
| ----------- | -------------------- |
| $9000-$FFEF | 程式碼 + 資料 |
| $FFF0-$FFF9 | 選配的系統資料 |
| $FFFA-$FFFB | NMI 向量 |
| $FFFC-$FFFD | 重設 (RESET) 向量 |
| $FFFE-$FFFF | IRQ/BRK 向量 |

ROM 映像大小：**32,768 位元組**

---

## 重設與啟動慣例

重設時：

1. CPU 從 `$FFFC` 擷取重設向量
2. 程式碼初始化堆疊指標
3. 初始化零頁變數
4. 設定 VIA
5. 初始化 LCD
6. 進入主程式

---

## 組合語言編譯器需求

組合語言編譯器 **必須** 支援：

* `.org` 絕對定址
* 符號標籤 (Symbolic labels)
* 二進位輸出 (`.bin`)
* 小端序 (Little-endian) 字組發送
* 零頁最佳化

建議的組合語言編譯器：

* **ca65** (cc65 工具鏈)
* **vasm6502**
* **64tass**

---

## 組合語言原始碼結構

```asm
;---------------------------
; 重設向量進入點
;---------------------------
        .org $9000
RESET:
        sei
        cld
        ldx #$FF
        txs
        jsr init_via
        jsr init_lcd
MAIN:
        jsr lcd_print
        jmp MAIN
```

---

## 向量表定義

```asm
        .org $FFFA
        .word nmi_handler
        .word RESET
        .word irq_handler
```

---

## 6522 VIA 程式設計模型

### 暫存器映射表 (基底 = $8000)

| 偏移量 | 暫存器 |
| ------ | -------- |
| $0 | ORB |
| $1 | ORA |
| $2 | DDRB |
| $3 | DDRA |
| $4 | T1CL |
| $5 | T1CH |
| $6 | T1LL |
| $7 | T1LH |
| $8 | T2CL |
| $9 | T2CH |
| $B | ACR |
| $C | PCR |
| $D | IFR |
| $E | IER |

---

## LCD 介面慣例

### LCD 接線假設

| LCD | VIA |
| ----- | ------- |
| D4-D7 | PB4-PB7 |
| RS | PA0 |
| E | PA1 |
| R/W | GND |

假設為 4 位元模式。

---

## LCD 初始化序列

```asm
lcd_init:
        lda #$33
        jsr lcd_cmd
        lda #$32
        jsr lcd_cmd
        lda #$28
        jsr lcd_cmd
        lda #$0C
        jsr lcd_cmd
        lda #$06
        jsr lcd_cmd
        lda #$01
        jsr lcd_cmd
        rts
```

---

## LCD 指令/資料介面

| 操作 | RS | 資料 |
| --------- | -- | --------------- |
| 指令 | 0 | 指令內容 |
| 資料 | 1 | ASCII 字元 |

---

## 零頁使用慣例

| 位址 | 用途 |
| ------- | ------------ |
| $00-$0F | 暫存區 (Scratch) |
| $10-$1F | LCD 常式 |
| $20-$2F | VIA 狀態 |
| $30-$FF | 使用者定義 |

---

## RAM 使用 (AS6C62256)

* 堆疊使用分頁 `$01`
* 假設所有 RAM 皆為揮發性
* 無 ROM 陰影 (shadowing)

---

## 建構管線

### 步驟 1：組合 (Assemble)

```bash
ca65 main.asm -o main.o
```

### 步驟 2：連結 (Link)

```bash
ld65 -C rom.cfg main.o -o rom.bin
```

### 步驟 3：填充 (Pad) ROM

確保 `rom.bin` 正好為 **32768 位元組**。

---

## EEPROM 燒錄

* 目標元件：**AT28C256**
* 燒錄器：**MiniPro / T48**
* 寫入後進行驗證

---

## 模擬器預期行為

模擬器必須：

* 將 ROM 載入至 `$9000-$FFFF`
* 模擬 VIA I/O 副作用
* 渲染 LCD 輸出
* 遵循重設向量

---

## 測試檢查清單

* 重設向量執行
* VIA 暫存器寫入
* LCD 顯示正確文字
* 堆疊操作有效
* ROM 映像映射正確

---

## 參考資料

* [MOS 6502 Programming Manual](http://archive.6502.org/datasheets/synertek_programming_manual.pdf)
* [MOS 6522 VIA Datasheet](http://archive.6502.org/datasheets/mos_6522_preliminary_nov_1977.pdf)
* [AT28C256 Datasheet](https://ww1.microchip.com/downloads/aemDocuments/documents/MPD/ProductDocuments/DataSheets/AT28C256-Industrial-Grade-256-Kbit-Paged-Parallel-EEPROM-Data-Sheet-DS20006386.pdf)
* [HD44780 LCD Datasheet](https://www.futurlec.com/LED/LCD16X2BLa.shtml)
* [cc65 工具鏈文件](https://cc65.github.io/doc/cc65.html)

---

## 備註

此規格刻意設計為**端對端**：從組合語言原始碼到 EEPROM 映像，再到執行的硬體或模擬器。它定義了一個穩定的合約，使 ROM、模擬器與真實 SBC 的行為一致。
