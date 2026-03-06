# minipro 晶片燒錄公用程式規格

## 1. 概述

**minipro** 是一款開源的命令列公用程式，用於使用支援的通用燒錄器（例如 **T48**、**TL866II Plus** 及相容型號）對各式各樣的 **EEPROM、Flash、EPROM、SRAM、GAL 與邏輯元件**進行**程式化、讀取、抹除與驗證**。

它被廣泛用於 **Linux**、**macOS** 與 **Windows** 環境，特別是在**復古計算**、**韌體開發**與**電子原型設計**領域。

---

## 2. 支援的燒錄器

| 燒錄器 | 註記 |
| ------------ | -------------------------- |
| T48 | 完全支援 (建議使用) |
| TL866II Plus | 完全支援 |
| TL866A / CS | 有限支援 / 舊式支援 |

---

## 3. 支援的元件類型

### 3.1 記憶體元件

* 平行 EEPROM (例如 AT28C256)
* Flash 記憶體 (29xxx 系列)
* EPROM (27xxx 系列)
* SRAM (僅限讀取/驗證)

### 3.2 邏輯與 PLD

* GAL16V8 / GAL22V10
* PAL 元件 (有限支援)

### 3.3 其他元件

* 部分微控制器 (視元件而定)
* 邏輯 IC 測試 (精選型號)

---

## 4. 安裝

### 4.1 Linux

```bash
sudo apt install minipro
```

或從原始碼編譯：

```bash
git clone https://github.com/vdudouyt/minipro.git
make
sudo make install
```

### 4.2 Windows

* 透過 MSYS2 或預編譯的執行檔安裝
* 需要 libusb 驅動程式 (WinUSB)

---

## 5. 基本指令語法

```bash
minipro [options]
```

常用選項：

| 選項 | 描述 |
| ------------- | ---------------------- |
| `-p <device>` | 選擇目標元件 |
| `-r <file>` | 將元件內容讀取至檔案 |
| `-w <file>` | 將檔案寫入至元件 |
| `-e` | 抹除元件 |
| `-v` | 驗證內容 |
| `-I` | 元件資訊 |
| `-l` | 列出支援的元件 |

---

## 6. 常見燒錄操作

### 6.1 列出支援的元件

```bash
minipro -l
```

### 6.2 識別元件

```bash
minipro -p AT28C256 -I
```

### 6.3 讀取晶片

```bash
minipro -p AT28C256 -r rom_dump.bin
```

### 6.4 寫入晶片

```bash
minipro -p AT28C256 -w rom.bin
```

### 6.5 僅進行驗證

```bash
minipro -p AT28C256 -v rom.bin
```

---

## 7. 燒錄 EEPROM (以 AT28C256 為例)

```bash
minipro -p AT28C256 -w monitor.bin
```

* 系統會自動處理軟體資料保護 (Software Data Protection)
* 寫入週期延遲由內部管理
* 程式化後會執行驗證

---

## 8. 燒錄 Flash 記憶體

```bash
minipro -p SST39SF040 -e -w firmware.bin
```

* Flash 元件需要抹除步驟
* 系統會自動處理區段抹除 (Sector erase)

---

## 9. EPROM 操作

```bash
minipro -p 27C256 -r eprom.bin
```

* 重新程式化前需要紫外線 (UV) 抹除
* minipro 在寫入前會驗證是否為空白狀態

---

## 10. GAL 燒錄

```bash
minipro -p GAL22V10 -w logic.jed
```

* 使用 JEDEC 檔案
* 支援讀取、寫入與驗證
* 熔絲圖 (Fuse maps) 可透過 `-I` 檢視

---

## 11. 錯誤處理與訊息

| 訊息 | 意義 |
| ---------------------- | -------------------------- |
| `Device not found` | 元件選擇不正確 |
| `Verification failed` | 資料不符 |
| `Chip protected` | 已啟用寫入保護 |
| `Overcurrent detected` | 插入錯誤或接線錯誤 |

---

## 12. 安全與最佳實踐

* 務必確認元件在 ZIF 插槽中的方向
* 使用正確的元件識別碼 (`-p`)
* 操作期間請勿熱插拔晶片
* 對於 PLCC、SOP、TSOP 封裝，請使用轉接板

---

## 13. 典型復古計算工作流

1. 組合 ROM 映像
2. 使用 minipro + T48 燒錄 EEPROM
3. 驗證內容
4. 將晶片安裝至 SBC
5. 測試系統啟動

---

## 14. 限制

* 並非支援所有元件
* 某些微控制器需要專有工具
* 不支援在線燒錄 (In-circuit programming, ISP)

---

## 15. 參考資料

* <https://gitlab.com/DavidGriffith/minipro>
* <https://www.hadex.cz/spec/m545b.pdf>
* <https://github.com/mikeroyal/Firmware-Guide>
* <https://mike42.me/blog/2021-08-a-first-look-at-programmable-logic>
* <https://retrocomputingforum.com/>

---
