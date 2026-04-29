// create-color-grid.jsx
// 建立彩色矩形網格，用以示範 Illustrator 指令碼中的
// 路徑建立、顏色操作和圖層組織。
// 用法：在 Adobe Illustrator 中從「檔案 > 指令碼 > 其他指令碼」執行。

#target illustrator

(function () {
    var doc = app.documents.add();
    var layer = doc.layers.add();
    layer.name = "顏色網格";

    var columns = 5;
    var rows = 4;
    var cellSize = 72;  // 1 英吋
    var gap = 10;
    var startX = 72;
    var startY = doc.height - 72;

    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < columns; col++) {
            var x = startX + col * (cellSize + gap);
            var y = startY - row * (cellSize + gap);

            var rect = layer.pathItems.rectangle(y, x, cellSize, cellSize);

            var color = new RGBColor();
            color.red = Math.round((col / (columns - 1)) * 255);
            color.green = Math.round((row / (rows - 1)) * 255);
            color.blue = Math.round(128 + Math.random() * 127);

            rect.fillColor = color;
            rect.stroked = false;
        }
    }

    app.redraw();
})();
