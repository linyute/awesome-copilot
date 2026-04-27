---
description: "GNU Make Makefile 的最佳編寫實務"
applyTo: "**/Makefile, **/makefile, **/*.mk, **/GNUmakefile"
---

# Makefile 開發指令

編寫簡潔、可維護且具可攜性 GNU Make Makefile 的指令。這些指令基於 [GNU Make 手冊](https://www.gnu.org/software/make/manual/)。

## 一般原則

- 撰寫遵循 GNU Make 慣例、清晰且可維護的 makefile
- 使用具描述性的目標 (target) 名稱，清楚指出其用途
- 將預設目標 (第一個目標) 保持為最常見的建構操作
- 撰寫規則與配方 (recipes) 時，優先考慮可讀性，而非簡潔
- 新增註解以解釋複雜規則、變數或非明顯的行為

## 命名慣例

- 將 makefile 命名為 `Makefile` (建議，具備可見性) 或 `makefile`
- 僅在與其他 make 實作不相容的 GNU Make 特有功能時，才使用 `GNUmakefile`
- 使用標準變數名稱：`objects`, `OBJECTS`, `objs`, `OBJS`, `obj` 或 `OBJ` 供物件檔案清單使用
- 內建變數名稱請使用大寫 (例如 `CC`, `CFLAGS`, `LDFLAGS`)
- 使用反映動作的描述性目標名稱 (例如 `clean`, `install`, `test`)

## 檔案結構

- 將預設目標 (主要建構目標) 置於 makefile 的第一個規則
- 將相關目標邏輯分組
- 在規則之前的 makefile 頂端定義變數
- 使用 `.PHONY` 宣告不代表檔案的目標
- Makefile 結構順序：變數，接著是規則，最後是 phony 目標

```makefile
# 變數
CC = gcc
CFLAGS = -Wall -g
objects = main.o utils.o

# 預設目標
all: program

# 規則
program: $(objects)
	$(CC) -o program $(objects)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Phony 目標
.PHONY: clean all
clean:
	rm -f program $(objects)
```

## 變數與替換

- 使用變數以避免重複並改善可維護性
- 使用 `:=` (簡單擴充) 進行立即評估，使用 `=` 進行遞迴擴充
- 使用 `?=` 設定可被覆寫的預設值
- 使用 `+=` 附加至既有變數
- 引用變數請使用 `$(VARIABLE)` 而非 `$VARIABLE` (單字元除外)
- 在配方中使用自動變數 (`$@`, `$<`, `$^`, `$?`, `$*`) 以讓規則更通用

```makefile
# 簡單擴充 (立即評估)
CC := gcc

# 遞迴擴充 (使用時評估)
CFLAGS = -Wall $(EXTRA_FLAGS)

# 條件式賦值
PREFIX ?= /usr/local

# 附加至變數
CFLAGS += -g
```

## 規則與先決條件 (Prerequisites)

- 清楚分離目標、先決條件與配方
- 針對標準編譯使用隱式規則 (例如 `.c` 轉 `.o`)
- 以邏輯順序列出先決條件 (一般先決條件在前，僅順序先決條件在後)
- 針對目錄與不應觸發重建的相依性，使用僅順序先決條件 (order-only prerequisites，在 `|` 之後)
- 包含所有實際相依性以確保正確重建
- 避免目標間的循環相依
- 記住僅順序先決條件會從 `$^` 等自動變數中省略，若有需要請明確引用

以下範例顯示將物件編譯至 `obj/` 目錄的模式規則。目錄本身被列為僅順序先決條件，因此在編譯前會被建立，但其時間戳記變更時不會強制重新編譯。

```makefile
# 一般先決條件
program: main.o utils.o
	$(CC) -o $@ $^

# 僅順序先決條件 (目錄建立)
obj/%.o: %.c | obj
	$(CC) $(CFLAGS) -c $< -o $@

obj:
	mkdir -p obj
```

## 配方與指令

- 每個配方行皆須以 **Tab 字元** 開頭 (而非空格)，除非已變更 `.RECIPEPREFIX`
- 在適當時使用 `@` 前綴抑制指令回音
- 在特定指令上使用 `-` 前綴忽略錯誤 (請謹慎使用)
- 必須同時執行時，在同一行結合相關指令並使用 `&&` 或 `;`
- 保持配方可讀；使用反斜線續行來斷開長指令
- 在配方中需要時使用 Shell 條件判斷與迴圈

```makefile
# 靜默指令
clean:
	@echo "正在清理..."
	@rm -f $(objects)

# 忽略錯誤
.PHONY: clean-all
clean-all:
	-rm -rf build/
	-rm -rf dist/

# 具正確續行的多行配方
install: program
	install -d $(PREFIX)/bin && \
		install -m 755 program $(PREFIX)/bin
```

## Phony 目標

- 永遠使用 `.PHONY` 宣告 phony 目標，以避免與同名檔案衝突
- 使用 phony 目標處理如 `clean`, `install`, `test`, `all` 等動作
- 將 phony 目標宣告置於其規則定義附近或 makefile 結尾

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

- 針對通用轉換使用模式規則 (`%.o: %.c`)
- 在適當時利用內建隱式規則 (GNU Make 知道如何編譯 `.c` 轉 `.o`)
- 覆寫隱式規則變數 (如 `CC`, `CFLAGS`) 而非重寫規則
- 僅在內建規則不足時，才定義自訂模式規則

```makefile
# 透過設定變數來使用內建隱式規則
CC = gcc
CFLAGS = -Wall -O2

# 特殊案例的自訂模式規則
%.pdf: %.md
	pandoc $< -o $@
```

## 分割長行

- 使用反斜線-換行 (`\`) 分割長行以提升可讀性
- 請注意在非配方內容中，反斜線-換行會被轉換為單一空格
- 在配方中，反斜線-換行會為 Shell 保留續行
- 避免反斜線後存在尾隨空格

### 分割而不新增空格

若需分割行且不新增空格，可使用特殊技術：插入 `$ ` (貨幣符號-空格) 後接反斜線-換行。`$ ` 參考一個具單空格名稱的變數，該變數不存在且會展開為空，有效地連接兩行而不插入空格。

```makefile
# 連接字串而不新增空格
# 下列建立值 "oneword"
var := one$ \
       word

# 等同於:
# var := oneword
```

```makefile
# 變數定義分割於多行
sources = main.c \
          utils.c \
          parser.c \
          handler.c

# 具長指令的配方
build: $(objects)
	$(CC) -o program $(objects) \
	      $(LDFLAGS) \
	      -lm -lpthread
```

## 包含其他 Makefiles

- 使用 `include` 指令在 makefile 間共用通用定義
- 使用 `-include` (或 `sinclude`) 包含選擇性的 makefile 而不會報錯
- 將 `include` 指令置於可能影響被包含檔案的變數定義之後
- 使用 `include` 處理共用變數、模式規則或通用目標

```makefile
# 包含通用設定
include config.mk

# 包含選擇性的本地設定
-include local.mk
```

## 條件指令

- 針對平台或設定特定的規則使用條件指令 (`ifeq`, `ifneq`, `ifdef`, `ifndef`)
- 將條件指令置於 makefile 層級，而非配方內 (配方內請使用 Shell 條件判斷)
- 保持條件判斷簡單且說明清楚

```makefile
# 平台特定設定
ifeq ($(OS),Windows_NT)
    EXE_EXT = .exe
else
    EXE_EXT =
endif

program: main.o
	$(CC) -o program$(EXE_EXT) main.o
```

## 自動先決條件

- 自動產生標頭檔相依性，而非手動維護
- 使用編譯器旗標 (如 `-MMD` 與 `-MP`) 產生包含相依性的 `.d` 檔案
- 使用 `-include $(deps)` 包含生成的相依性檔案，以避免檔案不存在時發生錯誤

```makefile
objects = main.o utils.o
deps = $(objects:.o=.d)

# 包含相依性檔案
-include $(deps)

# 透過自動相依性生成進行編譯
%.o: %.c
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@
```

## 錯誤處理與偵錯

- 使用 `$(error text)` 或 `$(warning text)` 函式進行建構期間的診斷
- 使用 `make -n` (乾跑) 測試 makefile 以查看指令而不執行
- 使用 `make -p` 列印規則與變數資料庫進行偵錯
- 在 makefile 開頭驗證必要變數與工具

```makefile
# 檢查必要工具
ifeq ($(shell which gcc),)
    $(error "gcc 未安裝或未在 PATH 中")
endif

# 驗證必要變數
ifndef VERSION
    $(error VERSION 未定義)
endif
```

## Clean 目標

- 永遠提供 `clean` 目標以移除生成檔案
- 將 `clean` 宣告為 phony，以避免與名為 "clean" 的檔案衝突
- 若檔案不存在，使用 `-` 前綴搭配 `rm` 指令以忽略錯誤
- 考慮獨立的 `clean` (移除物件) 與 `distclean` (移除所有生成檔案) 目標

```makefile
.PHONY: clean distclean

clean:
	-rm -f $(objects)
	-rm -f $(deps)

distclean: clean
	-rm -f program config.mk
```

## 可攜性考量

- 若需要與其他 make 實作的互攜性，請避免使用 GNU Make 特有功能
- 使用標準 Shell 指令 (偏好 POSIX Shell 建構)
- 使用 `make -B` 測試以強制重建所有目標
- 紀錄所使用的任何平台特定需求或 GNU Make 擴充功能

## 效能優化

- 針對不需要遞迴擴充的變數使用 `:=` (較快)
- 避免不必要使用 `$(shell ...)` (會建立子處理序)
- 有效排列先決條件 (最常變動的檔案放最後)
- 確保目標不衝突下，安全使用並行建構 (`make -j`)

## 文件編寫與註解

- 新增標頭註解以解釋 makefile 用途
- 紀錄非明顯的變數設定及其影響
- 在註解中包含使用範例或目標
- 為複雜規則或平台特定變通方案新增行內註解

```makefile
# 構建範例應用程式的 Makefile
#
# 用法:
#   make          - 建構程式
#   make clean    - 移除生成檔案
#   make install  - 安裝至 $(PREFIX)
#
# 變數:
#   CC       - C 編譯器 (預設: gcc)
#   PREFIX   - 安裝字首 (預設: /usr/local)

# 編譯器與旗標
CC ?= gcc
CFLAGS = -Wall -Wextra -O2

# 安裝目錄
PREFIX ?= /usr/local
```

## 特殊目標

- 非檔案目標使用 `.PHONY`
- 使用 `.PRECIOUS` 保留中間檔案
- 使用 `.INTERMEDIATE` 將檔案標記為中間檔案 (自動刪除)
- 使用 `.SECONDARY` 防止中間檔案刪除
- 若配方失敗，使用 `.DELETE_ON_ERROR` 移除目標
- 節制使用 `.SILENT` 抑制所有配方的回音

```makefile
# 不要刪除中間檔案
.SECONDARY:

# 若配方失敗則刪除目標
.DELETE_ON_ERROR:

# 保留特定檔案
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

- 絕對不要在配方行以空格而非 Tab 開頭
- 避免硬編碼檔案清單 (儘可能使用萬用字元或函式生成)
- 不要使用 `$(shell ls ...)` 取得檔案清單 (改用 `$(wildcard ...)`)
- 避免在配方中使用複雜 Shell 指令碼 (改移至獨立指令碼檔案)
- 不要忘記將 phony 目標宣告為 `.PHONY`
- 避免目標間的循環相依
- 除非絕對必要，否則不要使用遞迴 make (`$(MAKE) -C subdir`)
