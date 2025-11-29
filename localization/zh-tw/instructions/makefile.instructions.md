---
description: "編寫 GNU Make Makefiles 的最佳實踐"
applyTo: "**/Makefile, **/makefile, **/*.mk, **/GNUmakefile"
---

# Makefile 開發說明

編寫清晰、可維護且可移植的 GNU Make Makefiles 的說明。這些說明基於 [GNU Make 手冊](https://www.gnu.org/software/make/manual/)。

## 一般原則

- 編寫遵循 GNU Make 慣例的清晰且可維護的 makefile
- 使用描述性目標名稱，清楚表明其用途
- 將預設目標（第一個目標）作為最常見的建構操作
- 在編寫規則和配方時，優先考慮可讀性而非簡潔性
- 添加註釋以解釋複雜規則、變數或不明顯的行為

## 命名慣例

- 將您的 makefile 命名為 `Makefile`（建議提高可見性）或 `makefile`
- 僅將 `GNUmakefile` 用於與其他 make 實作不相容的 GNU Make 特定功能
- 對於物件檔案列表，使用標準變數名稱：`objects`、`OBJECTS`、`objs`、`OBJS`、`obj` 或 `OBJ`
- 內建變數名稱（例如 `CC`、`CFLAGS`、`LDFLAGS`）使用大寫
- 使用描述性目標名稱來反映其動作（例如 `clean`、`install`、`test`）

## 檔案結構

- 將預設目標（主要建構目標）作為 makefile 中的第一個規則
- 邏輯上將相關目標分組
- 在規則之前在 makefile 頂部定義變數
- 使用 `.PHONY` 宣告不代表檔案的目標
- 結構化 makefile：變數，然後是規則，然後是 phony 目標

```makefile
# Variables
CC = gcc
CFLAGS = -Wall -g
objects = main.o utils.o

# Default goal
all: program

# Rules
program: $(objects)
	$(CC) -o program $(objects)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Phony targets
.PHONY: clean all
clean:
	rm -f program $(objects)
```

## 變數與替換

- 使用變數以避免重複並提高可維護性
- 使用 `:=`（簡單展開）定義變數以立即評估，使用 `=` 進行遞歸展開
- 使用 `?=` 設定可覆寫的預設值
- 使用 `+=` 將內容附加到現有變數
- 使用 `$(VARIABLE)` 而不是 `$VARIABLE` 引用變數（除非是單個字元）
- 在配方中使用自動變數（`$@`、`$<`、`$^`、`$?`、`$*`）使規則更通用

```makefile
# Simple expansion (evaluates immediately)
CC := gcc

# Recursive expansion (evaluates when used)
CFLAGS = -Wall $(EXTRA_FLAGS)

# Conditional assignment
PREFIX ?= /usr/local

# Append to variable
CFLAGS += -g
```

## 規則與先決條件

- 清楚地分離目標、先決條件和配方
- 對於標準編譯使用隱式規則（例如，`.c` 到 `.o`）
- 以邏輯順序列出先決條件（正常先決條件在僅順序先決條件之前）
- 對於不應觸發重建的目錄和依賴項，使用僅順序先決條件（在 `|` 之後）
- 包含所有實際依賴項以確保正確重建
- 避免目標之間的循環依賴
- 請記住，僅順序先決條件會從 `$^` 等自動變數中省略，因此如有需要請明確引用它們

下面的範例顯示了一個模式規則，它將物件編譯到 `obj/` 目錄中。目錄本身被列為僅順序先決條件，因此它在編譯之前建立，但當其時間戳更改時不會強制重新編譯。

```makefile
# Normal prerequisites
program: main.o utils.o
	$(CC) -o $@ $^

# Order-only prerequisites (directory creation)
obj/%.o: %.c | obj
	$(CC) $(CFLAGS) -c $< -o $@

obj:
	mkdir -p obj
```

## 配方與命令

- 除非 `.RECIPEPREFIX` 更改，否則每個配方行都以**tab 字元**（而不是空格）開頭
- 適當時使用 `@` 前綴抑制命令回顯
- 對於特定命令，使用 `-` 前綴忽略錯誤（謹慎使用）
- 當相關命令必須一起執行時，使用 `&&` 或 `;` 將它們組合在同一行
- 保持配方可讀；使用反斜杠續行將長命令斷開為多行
- 需要時在配方中使用 shell 條件語句和循環

```makefile
# Silent command
clean:
	@echo "Cleaning up..."
	@rm -f $(objects)

# Ignore errors
.PHONY: clean-all
clean-all:
	-rm -rf build/
	-rm -rf dist/

# Multi-line recipe with proper continuation
install: program
	install -d $(PREFIX)/bin && \
		install -m 755 program $(PREFIX)/bin
```

## Phony 目標

- 始終使用 `.PHONY` 宣告 phony 目標，以避免與同名檔案衝突
- 將 phony 目標用於 `clean`、`install`、`test`、`all` 等動作
- 將 phony 目標宣告放置在其規則定義附近或 makefile 的末尾

```makefile
.PHONY: all clean test install

all: program

clean:
	rm -f program $(objects)

test: program
	./run-tests.sh

install: program
	install -m 755 program $(PREFIX)/bin
```

## 模式規則與隱式規則

- 使用模式規則（`%.o: %.c`）進行通用轉換
- 適當時利用內建隱式規則（GNU Make 知道如何將 `.c` 編譯為 `.o`）
- 覆寫隱式規則變數（例如 `CC`、`CFLAGS`），而不是重寫規則
- 僅在內建規則不足時定義自訂模式規則

```makefile
# Use built-in implicit rules by setting variables
CC = gcc
CFLAGS = -Wall -O2

# Custom pattern rule for special cases
%.pdf: %.md
	pandoc $< -o $@
```

## 分割長行

- 使用反斜杠換行符（`\`）分割長行以提高可讀性
- 請注意，在非配方上下文中，反斜杠換行符會轉換為單個空格
- 在配方中，反斜杠換行符會保留 shell 的行續行
- 避免反斜杠後面的尾隨空格

### 不添加空格的分割

如果您需要在不添加空格的情況下分割一行，可以使用一種特殊技術：插入 `$ `（美元空格），然後是反斜杠換行符。`$ ` 指的是一個單空格名稱的變數，它不存在並展開為空，有效地連接行而不插入空格。

```makefile
# Concatenate strings without adding whitespace
# The following creates the value "oneword"
var := one$ \
       word

# This is equivalent to:
# var := oneword
```

```makefile
# Variable definition split across lines
sources = main.c \
          utils.c \
          parser.c \
          handler.c

# Recipe with long command
build: $(objects)
	$(CC) -o program $(objects) \
	      $(LDFLAGS) \
	      -lm -lpthread
```

## 包含其他 Makefiles

- 使用 `include` 指令在 makefile 之間共享通用定義
- 使用 `-include`（或 `sinclude`）包含可選 makefile 而不產生錯誤
- 將 `include` 指令放置在可能影響包含檔案的變數定義之後
- 將 `include` 用於共享變數、模式規則或通用目標

```makefile
# Include common settings
include config.mk

# Include optional local configuration
-include local.mk
```

## 條件指令

- 使用條件指令（`ifeq`、`ifneq`、`ifdef`、`ifndef`）用於平台或配置特定的規則
- 將條件語句放置在 makefile 層級，而不是配方中（在配方中使用 shell 條件語句）
- 保持條件語句簡單且文件齊全

```makefile
# Platform-specific settings
ifeq ($(OS),Windows_NT)
    EXE_EXT = .exe
else
    EXE_EXT =
endif

program: main.o
	$(CC) -o program$(EXE_EXT) main.o
```

## 自動先決條件

- 自動生成標頭依賴項，而不是手動維護它們
- 使用編譯器標誌（例如 `-MMD` 和 `-MP`）生成帶有依賴項的 `.d` 檔案
- 使用 `-include $(deps)` 包含生成的依賴項檔案，以避免在它們不存在時出錯

```makefile
objects = main.o utils.o
deps = $(objects:.o=.d)

# Include dependency files
-include $(deps)

# Compile with automatic dependency generation
%.o: %.c
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@
```

## 錯誤處理與偵錯

- 使用 `$(error text)` 或 `$(warning text)` 函式進行建構時診斷
- 使用 `make -n`（空運行）測試 makefile，以查看命令而不執行
- 使用 `make -p` 列印規則和變數資料庫以進行偵錯
- 在 makefile 開頭驗證所需的變數和工具

```makefile
# Check for required tools
ifeq ($(shell which gcc),)
    $(error "gcc is not installed or not in PATH")
endif

# Validate required variables
ifndef VERSION
    $(error VERSION is not defined)
endif
```

## 清理目標

- 始終提供 `clean` 目標以刪除生成的檔案
- 將 `clean` 宣告為 phony 以避免與名為「clean」的檔案衝突
- 對於 `rm` 命令，使用 `-` 前綴以忽略檔案不存在時的錯誤
- 考慮單獨的 `clean`（刪除物件）和 `distclean`（刪除所有生成的檔案）目標

```makefile
.PHONY: clean distclean

clean:
	-rm -f $(objects)
	-rm -f $(deps)

distclean: clean
	-rm -f program config.mk
```

## 可移植性考量

- 如果需要可移植到其他 make 實作，請避免使用 GNU Make 特定功能
- 使用標準 shell 命令（優先使用 POSIX shell 結構）
- 使用 `make -B` 測試以強制重建所有目標
- 文件化任何平台特定要求或使用的 GNU Make 擴展

## 效能優化

- 對於不需要遞歸展開的變數使用 `:=`（更快）
- 避免不必要地使用 `$(shell ...)`，這會建立子進程
- 有效地排序先決條件（最常更改的檔案放在最後）
- 安全地使用並行建構（`make -j`），確保目標不衝突

## 文件與註釋

- 添加標頭註釋以解釋 makefile 的用途
- 文件化不明顯的變數設定及其效果
- 在註釋中包含使用範例或目標
- 為複雜規則或平台特定解決方案添加內聯註釋

```makefile
# Makefile for building the example application
#
# Usage:
#   make          - Build the program
#   make clean    - Remove generated files
#   make install  - Install to $(PREFIX)
#
# Variables:
#   CC       - C compiler (default: gcc)
#   PREFIX   - Installation prefix (default: /usr/local)

# Compiler and flags
CC ?= gcc
CFLAGS = -Wall -Wextra -O2

# Installation directory
PREFIX ?= /usr/local
```

## 特殊目標

- 對於非檔案目標使用 `.PHONY`
- 使用 `.PRECIOUS` 保留中間檔案
- 使用 `.INTERMEDIATE` 將檔案標記為中間檔案（自動刪除）
- 使用 `.SECONDARY` 防止刪除中間檔案
- 如果配方失敗，使用 `.DELETE_ON_ERROR` 刪除目標
- 使用 `.SILENT` 抑制所有配方的回顯（謹慎使用）

```makefile
# Don't delete intermediate files
.SECONDARY:

# Delete targets if recipe fails
.DELETE_ON_ERROR:

# Preserve specific files
.PRECIOUS: %.o
```

## 常見模式

### 標準專案結構

```makefile
CC = gcc
CFLAGS = -Wall -O2
objects = main.o utils.o parser.o

.PHONY: all clean install

all: program

program: $(objects)
	$(CC) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean: 
	-rm -f program $(objects)

install: program
	install -d $(PREFIX)/bin
	install -m 755 program $(PREFIX)/bin
```

### 管理多個程式

```makefile
programs = prog1 prog2 prog3

.PHONY: all clean

all: $(programs)

prog1: prog1.o common.o
	$(CC) -o $@ $^

prog2: prog2.o common.o
	$(CC) -o $@ $^

prog3: prog3.o
	$(CC) -o $@ $^

clean:
	-rm -f $(programs) *.o
```

## 應避免的反模式

- 不要用空格而不是 tab 字元開始配方行
- 避免硬編碼檔案列表，因為它們可以使用萬用字元或函式生成
- 不要使用 `$(shell ls ...)` 獲取檔案列表（改用 `$(wildcard ...)`）
- 避免在配方中使用複雜的 shell 腳本（移至單獨的腳本檔案）
- 不要忘記將 phony 目標宣告為 `.PHONY`
- 避免目標之間的循環依賴
- 除非絕對必要，否則不要使用遞歸 make（`$(MAKE) -C subdir`）
