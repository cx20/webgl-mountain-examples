let gui;
let scene;
let camera;
let renderer;
let controls;
let engine;
let showSmoke = false;
let clock = new THREE.Clock();
let width = window.innerWidth - 2;
let height = window.innerHeight - 2;
var MAP = "map_002.jpg"; // 空撮写真
var SMOKE = false;
var ROTATE = true;

Examples =
{
    smoke :
    {
        positionStyle    : Type.CUBE,
        positionBase     : new THREE.Vector3( -4, 15, -9 ), // 噴火口位置
        positionSpread   : new THREE.Vector3( 0, 0, 5 ),   // 広がりの位置

        velocityStyle    : Type.CUBE,
        velocityBase     : new THREE.Vector3( 0, 10, 0 ),  // 基準となる速度
        velocitySpread   : new THREE.Vector3( 5, 10, -5 ),  // 広がりの速度
        accelerationBase : new THREE.Vector3( 5,  0, -5 ), // 煙の勢い
        
        particleTexture : THREE.ImageUtils.loadTexture( 'smokeparticle.png'),
        
        angleBase               : 0,
        angleSpread             : 720,
        angleVelocityBase       : 0,
        angleVelocitySpread     : 720,
        
        sizeTween    : new Tween( [0, 1], [8, 32] ),
        opacityTween : new Tween( [0.8, 2], [0.5, 0] ),
        colorTween   : new Tween( [0.4, 1], [ new THREE.Vector3(0,0,0.8), new THREE.Vector3(0, 0, 1.0) ] ),

        particlesPerSecond : 500,
        particleDeathAge   : 2.0,
        emitterDeathAge    : 60
    }
};

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

let img = new Image();
img.onload = function() {
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff));

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -100, 100);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    // OrbitControls の準備
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.userPan = false;
    controls.userPanSpeed = 0.0;
    controls.maxDistance = 5000.0;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.rotateUp(Math.PI * 0.38);
    controls.autoRotate = ROTATE; //true:自動回転する,false:自動回転しない
    controls.autoRotateSpeed = -2.0; //自動回転する時の速度

    engine = new ParticleEngine();
    engine.setValues( Examples.smoke );
    engine.initialize();

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
        map: THREE.ImageUtils.loadTexture(MAP)
    });
    let plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);

    // GUI
    gui = new dat.GUI();
    let mapSelector = gui.add(window, 'MAP', {
        "通常地図": "map_001.jpg",
        "空撮写真": "map_002.jpg",
        "防災地図": "map_003.jpg",
    });
    let mapSmoke = gui.add(window, 'SMOKE').name('Smoke');
    let mapRotate = gui.add(window, 'ROTATE').name('Rotate');

    mapSelector.onChange(function (value) {
        plane.material.map = THREE.ImageUtils.loadTexture(value);
    });
    
    mapSmoke.onChange(function (value) {
        if ( value ) {
            engine = new ParticleEngine();
            engine.setValues( Examples.smoke );
            engine.initialize();
        } else {
            engine.destroy();
        }

        showSmoke = value;
    });

    mapRotate.onChange(function (value) {
        controls.autoRotate = value;
    });
    

    document.getElementById("webgl").appendChild(renderer.domElement);
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
    let dt = clock.getDelta();
    if ( showSmoke ) {
        engine.update( dt * 0.5 );    
    }
    renderer.render(scene, camera);
}
