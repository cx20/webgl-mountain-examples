let scene;
let camera;
let renderer;
let controls;
let width = window.innerWidth;
let height = window.innerHeight;

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
        let all = pix[i] + pix[i + 1] + pix[i + 2];
        data[j++] = all / 25;
    }

    return data;
}

let img = new Image();
img.onload = function() {
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff));

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 100, 100);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    // OrbitControls の準備
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true; //true:自動回転する,false:自動回転しない

    // heightMap より標高データを取得
    let data = getHeightData(img);

    // 標高データを元に地形を生成
    let x1 = 128;
    let y1 = 128;
    let x2 = 256;
    let y2 = 256;
    let geometry = new THREE.PlaneGeometry(x1, y1, x2 - 1, y2 - 1);
    for (let i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[i].z = data[i];
    }

    // テクスチャを貼り付け
    let material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture("texture.jpg")
    });
    let plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);

    document.getElementById("webgl").appendChild(renderer.domElement);
    animate();
};

img.src = "heightMap.png";

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update();
    renderer.render(scene, camera);
}