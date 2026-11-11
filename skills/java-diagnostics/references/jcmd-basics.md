# jps 與 jcmd 基礎（安全指令屬於第 1 級；請注意敏感輸出警告）

```bash
jps -l                       # 列出 JVM 的 PID 與 main 類別/JAR（不含引數）
jcmd <pid> help              # 該 JVM 支援的指令
jcmd <pid> VM.version
jcmd <pid> VM.flags          # 生效的 -XX 旗標（不含 -D 屬性）
jcmd <pid> VM.uptime
```

預設情況下**請勿**執行下列指令：它們可能會印出透過 `-D` 屬性或程式引數傳入的憑證、權杖、連線字串或其他密鑰，且輸出會進入對話紀錄中：

- `jps -v`、`jps -lv`、`jps -m` 以及未加引數的單純 `jcmd`（不帶引數時它也會印出每個 JVM 的 main 類別與引數）
- 針對 Java 行程執行 `jcmd <pid> VM.system_properties`、`jcmd <pid> VM.command_line`、`jinfo`、`ps aux` / `ps -ef` / `/proc/<pid>/cmdline`

執行前需先取得使用者同意（明確分級：第 3 級，敏感輸出）。優先僅讀取所需的特定屬性（例如 `jcmd <pid> VM.system_properties | grep '^java.version'`），並在顯示或分享任何輸出前遮蔽密鑰數值。

- 請以與目標 JVM 相同的作業系統使用者身分，在同一主機上（或在同一個容器內）執行。不同的使用者/容器會失敗並顯示「Unable to open socket file」或「process not found」。
- `jcmd` 優於 `jstack`/`jmap`/`jinfo`（這些是較舊的單一用途工具）。
- `-XX:+DisableAttachMechanism` 會阻斷 attach；`-XX:+StartAttachListener` 會強制啟動 listener。
- 在可能的情況下，工具版本應符合（或新於）目標 JDK 主要版本。

## 崩潰或當機

- 崩潰會寫入 `hs_err_pid<pid>.log`（路徑由 `-XX:ErrorFile` 設定）。請優先檢視「Problematic frame」與執行緒區段。
- `jhsdb`（第 3 級）可附加至卡住的行程或 core 檔案：`jhsdb jstack --pid <pid>` 或 `jhsdb jstack --exe <java> --core <core>`。附加期間它會暫停行程並需要相符的 JDK；core 檔案包含堆積資料，因此請比照堆積傾印妥善處理。
