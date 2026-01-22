# 使用 AT28C256 EEPROM 的 6502 組合語言

這是一份實用的規格，用於編寫預計儲存在單板電腦 (SBC) 與復古系統中的 **AT28C256 (32 KB) 平行 EEPROM** 並從中執行的 **6502/65C02 組合語言程式**。

---

## 1. 範圍與假設

此文件假設：

* 使用 **6502 系列 CPU** (6502, 65C02 或相容型號)
* 程式碼儲存在 **AT28C256 (32K x 8) EEPROM** 中
* 記憶體映射 I/O (例如 6522 VIA)
* 重設與中斷向量位於 EEPROM 中
* 外部 RAM 映射在其他位置 (例如 62256 SRAM)

---

## 2. AT28C256 EEPROM 概述

| 參數 | 數值 |
| -------------- | ------------------- |
| 容量 | 32 KB (32768 位元組) |
| 位址線 | A0-A14 |
| 資料線 | D0-D7 |
| 存取時間 | ~150 ns |
| 電源電壓 | 5 V |
| 封裝 | DIP-28 / PLCC |

### 典型記憶體映射表用法

| 位址範圍 | 用途 |
| ------------- | ----------------------- |
| `$8000-$FFFF` | EEPROM (程式碼 + 向量) |
| `$FFFA-$FFFF` | 中斷向量 |

---

## 3. 6502 記憶體映射表範例

```
$0000-$00FF  零頁 (RAM)
$0100-$01FF  堆疊
$0200-$7FFF  RAM / I/O
$8000-$FFFF  AT28C256 EEPROM
```

---

## 4. 重設與中斷向量

6502 從**記憶體頂端**讀取向量：

| 向量 | 位址 | 描述 |
| ------- | ------------- | ---------------------- |
| NMI | `$FFFA-$FFFB` | 不可屏蔽中斷 |
| RESET | `$FFFC-$FFFD` | 重設進入點 |
| IRQ/BRK | `$FFFE-$FFFF` | 可屏蔽中斷 |

### 向量定義範例

```asm
        .org $FFFA
        .word nmi_handler
        .word reset
        .word irq_handler
```

---

## 5. 組合語言程式結構

### 典型佈局

```asm
        .org $8000

reset:
        sei             ; 停用 IRQ
        cld             ; 清除十進位模式
        ldx #$FF
        txs             ; 初始化堆疊

main:
        jmp main
```

---

## 6. 核心 6502 指令

### 暫存器

| 暫存器 | 用途 |
| -------- | ---------------- |
| A | 累加器 |
| X, Y | 索引暫存器 |
| SP | 堆疊指標 |
| PC | 程式計數器 |
| P | 處理器狀態 |

### 常見指令

| 指令 | 功能 |
| ----------- | ---------------------- |
| LDA/STA | 載入/儲存累加器 |
| LDX/LDY | 載入索引暫存器 |
| JMP/JSR | 跳躍 / 副程式 |
| RTS | 從副程式回傳 |
| BEQ/BNE | 條件分支 |
| SEI/CLI | 停用/啟用 IRQ |

---

## 7. 定址模式 (常見)

| 模式 | 範例 | 註記 |
| --------- | ------------- | ------------ |
| 立即 (Immediate) | `LDA #$01` | 常數 |
| 零頁 (Zero Page) | `LDA $00` | 速度快 |
| 絕對 (Absolute) | `LDA $8000` | 完整位址 |
| 索引 (Indexed) | `LDA $2000,X` | 表格 |
| 間接 (Indirect) | `JMP ($FFFC)` | 向量 |

---

## 8. 編寫用於 EEPROM 執行的程式碼

### 關鍵考量因素

* 程式碼在**執行時為唯讀**
* 不建議使用自我修改程式碼 (Self-modifying code)
* 將跳躍表與常數放置在 EEPROM 中
* 使用 RAM 處理變數與堆疊

### 零頁變數範例

```asm
counter = $00

        lda #$00
        sta counter
```

---

## 9. 定時與效能

* EEPROM 存取時間必須符合 CPU 時脈需求
* AT28C256 可輕鬆支援 ~1 MHz
* 更快的時脈可能需要等待狀態 (wait states) 或 ROM 陰影 (shadowing)

---

## 10. 範例：簡易 LED 切換 (記憶體映射 I/O)

```asm
PORTB = $6000
DDRB  = $6002

        .org $8000
reset:
        sei
        ldx #$FF
        txs

        lda #$FF
        sta DDRB

loop:
        lda #$FF
        sta PORTB
        jsr delay
        lda #$00
        sta PORTB
        jsr delay
        jmp loop
```

---

## 11. 組合與燒錄工作流

1. 編寫原始碼 (`.asm`)
2. 組合為二進位檔
3. 填補或重新定位至 `$8000`
4. 透過 T48 / minipro 燒錄 AT28C256
5. 插入 EEPROM 並重設 CPU

---

## 12. 組合語言編譯器指示語 (常見)

| 指示語 | 用途 |
| ---------- | --------------------------- |
| `.org` | 設定程式起始點 |
| `.byte` | 定義位元組 |
| `.word` | 定義字組 (小端序) |
| `.include` | 包含檔案 |
| `.equ` | 常數定義 |

---

## 13. 常見錯誤

| 問題 | 結果 |
| -------------------------- | ------------------ |
| 缺少向量 | CPU 在重設時當機 |
| 錯誤的 `.org` | 程式碼未執行 |
| 在 ROM 中使用 RAM 位址 | 崩潰 |
| 堆疊未初始化 | 未定義行為 |

---

## 14. 參考連結

* [https://www.masswerk.at/6502/6502_instruction_set.html](https://www.masswerk.at/6502/6502_instruction_set.html)
* [https://www.nesdev.org/wiki/6502](https://www.nesdev.org/wiki/6502)
* [https://www.westerndesigncenter.com/wdc/documentation](https://www.westerndesigncenter.com/wdc/documentation)
* [https://en.wikipedia.org/wiki/MOS_Technology_6502](https://en.wikipedia.org/wiki/MOS_Technology_6502)

---

**文件範圍：** 儲存在 AT28C256 EEPROM 中的 6502 組合語言
**讀者對象：** 復古計算、SBC 設計者、嵌入式愛好者
**狀態：** 穩定參考文件
