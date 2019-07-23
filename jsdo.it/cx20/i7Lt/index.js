let csv2img = function(text, height_max){
	//let s = text.split("\n"); // CSV を配列に展開
	//s = s.filter(function(e) { return e !== ""; }); // 空行は除外
    let s = text.split(",");

	let WIDTH = 257;
	let HEIGHT = 257;

	let canvas = document.createElement('canvas');
	canvas.width = WIDTH-1;
	canvas.height = HEIGHT-1;
	let ctx = canvas.getContext("2d");

	let img = ctx.createImageData(WIDTH, HEIGHT);
	let buffer = img.data;
	let x, y, z;
	let data = [];
	// HeightMap 作成処理
	for (let i = 0; i < HEIGHT-1; i++) {
		for (let j = 0; j < WIDTH-1; j++) {
			let h = s[i*WIDTH+j];
			x = j;
			y = i;
			z = Math.floor((h / height_max) * 256); // 256諧調
			let pos = (y * HEIGHT + x) * 4;
			buffer[pos + 0] = z;
			buffer[pos + 1] = z;
			buffer[pos + 2] = z;
			buffer[pos + 3] = 255;
		}
	}
	
	ctx.putImageData(img, 0, 0);
	let result = canvas.toDataURL();
	
	return result;
};

window.addEventListener('DOMContentLoaded', function() {
	// ファイルが指定されたタイミングで、その内容を表示
	document.querySelector("#file").addEventListener('change', function(e) {
		// File APIを利用できるかをチェック
		if (window.File) {
			// 指定されたファイルを取得
			let input = document.querySelector('#file').files[0];
			let height_max = document.getElementById('height_max').value;
			// ファイル読み込みの準備（1）
			let reader = new FileReader();
			// ファイルの読み込みに成功したら、その内容を<div id="result">に反映（2）
			reader.addEventListener('load', function(e) {
				document.getElementById("img1").src = csv2img(reader.result, height_max);
			}, true);
			// ファイルの内容をテキストとして取得（3）
			reader.readAsText(input, 'UTF-8');
		}
	}, true);
});
