// batch-export-png.jsx
// 將每個開啟的 Illustrator 文件匯出為 PNG24 檔案到選擇的資料夾。
// 用法：在 Adobe Illustrator 中從「檔案 > 指令碼 > 其他指令碼」執行。

#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("沒有開啟的文件。");
        return;
    }

    var outputFolder = Folder.selectDialog("選擇 PNG 匯出的輸出資料夾");
    if (!outputFolder) return;

    var savedInteraction = app.userInteractionLevel;
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

    try {
        for (var i = app.documents.length - 1; i >= 0; i--) {
            var doc = app.documents[i];
            var fileName = doc.name.replace(/\.[^.]+$/, "");
            var destFile = new File(outputFolder + "/" + fileName + ".png");

            var pngOpts = new ExportOptionsPNG24();
            pngOpts.transparency = true;
            pngOpts.artBoardClipping = true;
            pngOpts.horizontalScale = 100;
            pngOpts.verticalScale = 100;

            doc.exportFile(destFile, ExportType.PNG24, pngOpts);
        }
        alert("已匯出 " + app.documents.length + " 個檔案至：\n" + outputFolder.fsName);
    } catch (e) {
        alert("匯出錯誤：" + e.message);
    } finally {
        app.userInteractionLevel = savedInteraction;
    }
})();
