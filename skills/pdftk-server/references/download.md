# 下載 (Download)

PDFtk 為 Windows 提供了一個安裝程式。許多 Linux 發行版提供了 PDFtk 套件，您可以使用其套件管理器進行下載與安裝。

## Microsoft Windows

使用以下指令下載適用於 Windows 10 和 11 的 PDFtk Server 安裝程式：

```bash
winget install --id PDFLabs.PDFtk.Server
```

然後執行安裝程式：

```bash
.\pdftk_server-2.02-win-setup.exe
```

安裝完成後，開啟命令提示字元，輸入 `pdftk` 並按 Enter。PDFtk 將會顯示簡短的用法資訊。

## Linux

在基於 Debian/Ubuntu 的發行版上：

```bash
sudo apt-get install pdftk
```

在基於 Red Hat/Fedora 的發行版上：

```bash
sudo dnf install pdftk
```

## PDFtk Server GPL 授權 (PDFtk Server GPL License)

PDFtk Server (pdftk) 並非公有領域軟體。它可以根據其 [GNU 通用公眾授權條款 (GPL) 第 2 版](https://www.pdflabs.com/docs/pdftk-license/gnu_general_public_license_2.txt) 免費安裝與使用。PDFtk 使用了第三方函式庫。這些函式庫的 **授權與原始碼在「第三方材料 (Third-Party Materials)」中說明**。

## PDFtk Server 再分發授權 (PDFtk Server Redistribution License)

如果您計畫將 PDFtk Server 作為您自身軟體的一部分進行分發，您將需要一份 PDFtk Server 再分發授權。除非您的軟體是根據 GPL 或其他相容授權向大眾授權，否則此規則不適用。

商業再分發授權允許您根據授權條款，將無限數量的 PDFtk Server 二進位檔案作為一個獨立商業產品的一部分進行分發。請閱讀完整授權內容：

[PDFtk Server 再分發授權 (PDF)](https://pdflabs.onfastspring.com/pdftk-server)

目前售價為 $995 美元：

[PDFtk Server 再分發授權](https://www.pdflabs.com/docs/pdftk-license/)

## 從原始碼建構 PDFtk Server (Build PDFtk Server from Source)

PDFtk Server 可以從其原始碼進行編譯。已知 PDFtk Server 可以在 [Debian](https://packages.debian.org/search?keywords=pdftk)、[Ubuntu Linux](https://packages.ubuntu.com/search?keywords=pdftk)、[FreeBSD](https://www.freshports.org/print/pdftk/)、Slackware Linux、SuSE、Solaris 和 [HP-UX](http://hpux.connect.org.uk/hppd/hpux/Text/pdftk-1.45/) 上編譯並執行。

下載並解壓縮原始碼：

```bash
curl -LO https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk-2.02-src.zip
unzip pdftk-2.02-src.zip
```

在 `license_gpl_pdftk/readme.txt` 中查看 [pdftk 授權資訊](https://www.pdflabs.com/docs/pdftk-license/)。

查看為您的平台提供的 Makefile，並確認 `TOOLPATH` 和 `VERSUFF` 符合您的 gcc/gcj/libgcj 安裝情況。如果您執行 `apropos gcc` 並傳回類似 `gcc-4.5` 的內容，請將 `VERSUFF` 設定為 `-4.5`。`TOOLPATH` 可能不需要設定。

切換到 `pdftk` 子目錄並執行：

```bash
cd pdftk
make -f Makefile.Debian
```

請根據需要替換為您平台的 Makefile 檔案名稱。

PDFtk 已使用 gcc/gcj/libgcj 版本 3.4.5、4.4.1、4.5.0 和 4.6.3 進行建構。由於缺少 libgcj 功能，PDFtk 1.4x 無法在 gcc 3.3.5 上建構。如果您使用的是 gcc 3.3 或更舊版本，請嘗試改為建構 [pdftk 1.12](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk-1.12.tar.gz)。
