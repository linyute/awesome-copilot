// find-replace-text.jsx
// 在作用中文件的所有文字框內尋找並取代文字。
// 用法：在 Adobe Illustrator 中從「檔案 > 指令碼 > 其他指令碼」執行。

#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("沒有開啟的文件。");
        return;
    }

    var doc = app.activeDocument;

    var findStr = prompt("尋找文字：", "");
    if (findStr === null || findStr === "") return;

    var replaceStr = prompt("取代為：", "");
    if (replaceStr === null) return;

    var count = 0;
    for (var i = 0; i < doc.textFrames.length; i++) {
        var tf = doc.textFrames[i];
        var original = tf.contents;
        if (original.indexOf(findStr) !== -1) {
            tf.contents = original.split(findStr).join(replaceStr);
            count++;
        }
    }

    alert("已在 " + count + " 個文字框中取代文字。");
})();
