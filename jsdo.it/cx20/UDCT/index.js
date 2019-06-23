let gui;
let scene;
let camera;
let renderer;
let controls;
let arrow;
let clock = new THREE.Clock();
let width = window.innerWidth - 2;
let height = window.innerHeight - 2;
var MAP = "map_002.jpg"; // 空撮写真
var SMOKE = false;
var ROTATE = true;
var MARKER = true;
var WIREFRAME = false;
var TRANSPARENT = true;
let loader = new THREE.TextureLoader();

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
    
    arrow = new THREE.ArrowHelper( new THREE.Vector3(0, -1, 0).normalize(), new THREE.Vector3(40, 35, 20), 35, 0xff0000 );
    scene.add( arrow );
    
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
    let material = new THREE.MeshPhongMaterial({
        map: loader.load(MAP),
        transparent: TRANSPARENT,        // 半透明合成のパラメータ
        blending: THREE.NormalBlending,  // 半透明合成の方法
        opacity: 0.5,                    // 透明度
        wireframe: WIREFRAME
    });
    let plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);
    
    let cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 2, 16),
        new THREE.MeshLambertMaterial( { color: 0xffff00, wireframe: true } )
    );
    cylinder.position.x = 40;
    cylinder.position.y = 0;
    cylinder.position.z = 20;
    scene.add( cylinder );

    // GUI
    gui = new dat.GUI();
    gui.close();
    let mapSelector = gui.add(window, 'MAP', {
        "通常地図": "map_001.png",
        "空撮写真": "map_002.jpg"
    });
    let mapRotate = gui.add(window, 'ROTATE').name('Rotate');
    let mapMarker = gui.add(window, 'MARKER').name('Marker');
    let mapWireframe = gui.add(window, 'WIREFRAME').name('Wireframe');
    let mapTransparent = gui.add(window, 'TRANSPARENT').name('Transparent');
    
    mapSelector.onChange(function (value) {
        plane.material.map = loader.load(value);
    });
    
    mapRotate.onChange(function (value) {
        controls.autoRotate = value;
    });

    mapMarker.onChange(function (value) {
        arrow.visible = value;
    });
    
    mapWireframe.onChange(function (value) {
        plane.material.wireframe = value;
    });

    mapTransparent.onChange(function (value) {
        plane.material.transparent = value;
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

img.src = "heightMap.png"; // heightMap.png

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update();
    renderer.clear();
    renderer.render(scene, camera);
}
