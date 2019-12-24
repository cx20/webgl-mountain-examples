let gui;
let scene;
let camera;
let renderer;
let controls;
let arrow;
let clock = new THREE.Clock();
let width = window.innerWidth - 2;
let height = window.innerHeight - 2;
var MAP = "heightMap.png"; // シャクルトンクレーター
var SMOKE = false;
var ROTATE = true;
var MARKER = true;
var WIREFRAME = true;


// heightMap より標高データを取得する
// 参考：http://danni-three.blogspot.jp/2013/09/threejs-heightmaps.html
function getHeightData(img) {
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let context = canvas.getContext("2d");

    let size = img.width * img.height;
    let data = new Float32Array(size);

    context.drawImage(img, 0, 0);

    let imgd = context.getImageData(0, 0, img.width, img.height);
    let pix = imgd.data;

    let j = 0;
    for (let i = 0; i < pix.length; i += 4) {
        let k = 1.5; // 起伏の強調度
        let height = (pix[i] + pix[i + 1] + pix[i + 2])/3 * 1/16 * k;
        data[j++] = height;
    }

    return data;
}

let container;
let img = new Image();
img.onload = function() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

    scene = new THREE.Scene();
    
    scene.add(new THREE.AmbientLight(0xffffff));

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 100, 100);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    // OrbitControls の準備
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = ROTATE; //true:自動回転する,false:自動回転しない

    // heightMap より標高データを取得
    let data = getHeightData(img);

    // 標高データを元に地形を生成
    let scale = 4; // メッシュの細かさを調整
    let x1 = 128;
    let y1 = 128;
    let x2 = 256/scale;
    let y2 = 256/scale;
    let geometry = new THREE.PlaneGeometry(x1, y1, x2 - 1, y2 - 1);
    for (let i = 0; i < geometry.vertices.length; i++) {
        let k = Math.floor(i / x2);
        let j = 256 * k * scale + (i % y2) * scale;
        geometry.vertices[i].z = data[j];
    }

    // テクスチャを貼り付け
    let loader = new THREE.TextureLoader();
    let texture = loader.load(MAP);
    let material = new THREE.MeshPhongMaterial({
        map: texture,
        wireframe: WIREFRAME
    });
    let plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);
    
    // GUI
    gui = new dat.GUI();
    gui.close();
    let mapSelector = gui.add(window, 'MAP', {
        "シャクルトンクレーター": "heightMap.png", // moon_crater_heightmap.png
    });
    let mapRotate = gui.add(window, 'ROTATE').name('Rotate');
    let mapWireframe = gui.add(window, 'WIREFRAME').name('Wireframe');
    
    mapSelector.onChange(function (value) {
        texture = loader.load(value);
        plane.material.map = texture;
    });
    
    mapRotate.onChange(function (value) {
        controls.autoRotate = value;
    });

    mapWireframe.onChange(function (value) {
        plane.material.wireframe = value;
    });

    //document.getElementById("webgl").appendChild(renderer.domElement);
    container.appendChild( renderer.domElement );
    animate();

    window.addEventListener('resize', function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }, false );
};

img.src = "heightMap.png"; // moon_crater_heightmap.png

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update();
    renderer.clear();
    renderer.render(scene, camera);
}
