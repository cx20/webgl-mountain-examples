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
let mask_file = "mask_file_008.png";
let lava_file = "lava_file.jpg";
let noise_file = "noise_file.png";
var MAP = "map_015.jpg;mask_file_008.png"; // SAR強度画像(2018年 3月27日??時)
var SMOKE = false;
var ROTATE = false;
var LAVA = false;
let emitter, particleGroup;
let customUniforms;
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
        let k = 3.5; // 起伏の強調度
        let height = (pix[i] + pix[i + 1] + pix[i + 2])/3 * 1/16 * k;
        data[j++] = height;
    }

    return data;
}

function initParticles() {
    let texture = loader.load('smokeparticle.png');  // smokeparticle.png

    particleGroup = new SPE.Group({
        texture: {
            value: texture
        },
        maxParticleCount: 1000, 
        blending: THREE.NormalBlending,
        transparent: true
    });

    emitter = new SPE.Emitter({
        // 寿命
        maxAge: {
            value: 2
        },
        // 位置
        position: {
            value: new THREE.Vector3(0, 18, 0),
            spread: new THREE.Vector3( 0, 0, 5 )
        },
        // 加速度
        acceleration: {
            value: new THREE.Vector3(0, 5, 10),
            spread: new THREE.Vector3( 10, 10, 10 )
        },
        // 速度
        velocity: {
            value: new THREE.Vector3(0, 10, 0),
            spread: new THREE.Vector3(10, 10, 10)
        },
        // 色
        color: {
            value: [ new THREE.Color('#A0A0A0') ]
        },
        // 不透明度
        opacity: {
            value: 0.8
        },
        // サイズ
        size: {
            value: 15
        },
        particleCount: 1000
    });
    
}

let img = new Image();
img.onload = function() {
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff));

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 50, 100);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    // OrbitControls の準備
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = ROTATE; //true:自動回転する,false:自動回転しない
    controls.autoRotateSpeed = -2.0; //自動回転する時の速度

    // heightMap より標高データを取得
    let data = getHeightData(img);

    // 標高データを元に地形を生成
    let x1 = 128;
    let y1 = 128;
    let x2 = 256;
    let y2 = 256;
    let geometry = new THREE.PlaneGeometry(x1, y1, x2 - 1, y2 - 1);
    for (let i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[i].z = data[i] - 30;
    }

    // テクスチャを貼り付け
/*
    let material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture(MAP)
    });
*/
    let imageFiles = MAP.split(";"); 
    let originalTexture = loader.load(imageFiles[0]);
    let maskTexture = loader.load(imageFiles[1]);

    // base image texture for mesh
    let lavaTexture = loader.load(lava_file); // lava.jpg
    lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed         
    let baseSpeed = 0.02;
    // number of times to repeat texture in each direction
    let repeatS = repeatT = 4.0;
    
    // texture used to generate "randomness", distort all other textures
    let noiseTexture = loader.load(noise_file); // cloud.png
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
    // magnitude of noise effect
    let noiseScale = 0.5;
    
    // texture to additively blend with base image texture
    let blendTexture = loader.load(lava_file); // lava.jpg
    blendTexture.wrapS = blendTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed 
    let blendSpeed = 0.01;
    // adjust lightness/darkness of blended texture
    let blendOffset = 0.25;

    // texture to determine normal displacement
    let bumpTexture = noiseTexture;
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed         
    let bumpSpeed   = 0.15;
    // magnitude of normal displacement
    let bumpScale   = 40.0;
    
    // use "this." to create global object
    customUniforms = {
        originalTexture:{ type: "t", value: originalTexture },
        maskTexture:    { type: "t", value: maskTexture },
        baseTexture:    { type: "t", value: lavaTexture },
        baseSpeed:      { type: "f", value: baseSpeed },
        repeatS:        { type: "f", value: repeatS },
        repeatT:        { type: "f", value: repeatT },
        noiseTexture:   { type: "t", value: noiseTexture },
        noiseScale:     { type: "f", value: noiseScale },
        blendTexture:   { type: "t", value: blendTexture },
        blendSpeed:     { type: "f", value: blendSpeed },
        blendOffset:    { type: "f", value: blendOffset },
        bumpTexture:    { type: "t", value: bumpTexture },
        bumpSpeed:      { type: "f", value: bumpSpeed },
        bumpScale:      { type: "f", value: bumpScale },
        alpha:          { type: "f", value: 1.0 },
        time:           { type: "f", value: 1.0 },
        lava:           { type: "i", value: false },
    };

    let material = new THREE.ShaderMaterial({
        uniforms: customUniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragment_shader1').textContent
    });

    let plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);
    scene.position.y = -20.0;

    initParticles();
    
    // GUI
    gui = new dat.GUI();
    let mapSelector = gui.add(window, 'MAP', {
        "通常地図": "map_001.jpg;mask_file_008.png",
        "空撮写真": "map_002.jpg;mask_file_008.png",
        "SAR強度画像(2017年10月31日23時)": "map_003.jpg;mask_file_001.png",
        "SAR強度画像(2018年 3月 6日23時)": "map_004.jpg;mask_file_002.png",
        "SAR強度画像(2018年 3月 7日13時)": "map_005.jpg;mask_file_003.png",
        "SAR強度画像(2018年 3月 9日00時)": "map_006.jpg;mask_file_004.png",
        "SAR強度画像(2018年 3月 9日12時)": "map_007.jpg;mask_file_005.png",
        "SAR強度画像(2018年 3月10日12時)": "map_008.jpg;mask_file_005.png",
        "SAR強度画像(2018年 3月10日23時)": "map_009.jpg;mask_file_005.png",
        "SAR強度画像(2018年 3月12日13時)": "map_010.jpg;mask_file_006.png",
        "SAR強度画像(2018年 3月14日00時)": "map_011.jpg;mask_file_007.png",
        "SAR強度画像(2018年 3月14日12時)": "map_012.jpg;mask_file_007.png",
        "SAR強度画像(2018年 3月15日23時)": "map_013.jpg;mask_file_007.png",
        "SAR強度画像(2018年 3月21日13時)": "map_014.jpg;mask_file_008.png",
        "SAR強度画像(2018年 3月27日??時)": "map_015.jpg;mask_file_008.png",
        "SAR強度画像から判読した地形変化領域": "map_016.jpg;mask_file_008.png", // 3/24 更新
    });
    let mapSmoke = gui.add(window, 'SMOKE').name('Smoke');
    let mapRotate = gui.add(window, 'ROTATE').name('Rotate');
    let mapLava = gui.add(window, 'LAVA').name('Lava');

    mapSelector.onChange(function (value) {
        //plane.material.map = THREE.ImageUtils.loadTexture(value);
        let imageFiles = value.split(";");
        customUniforms.originalTexture.value = loader.load(imageFiles[0]);
        customUniforms.maskTexture.value = loader.load(imageFiles[1]);
    });
    
    if ( showSmoke ) {
        particleGroup.addEmitter( emitter );
        scene.add( particleGroup.mesh );
    }
    mapSmoke.onChange(function (value) {
        if ( value ) {
            particleGroup.addEmitter( emitter );
            scene.add( particleGroup.mesh );
        } else {
            particleGroup.removeEmitter( emitter );
        }
        
        showSmoke = value;
    });
    mapRotate.onChange(function (value) {
        controls.autoRotate = value;
    });

    mapLava.onChange(function (value) {
        customUniforms.lava.value = value;
    });

    //gui.close();

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
        particleGroup.tick( dt );
    }

    let delta = 5 * clock.getDelta();
    customUniforms.time.value += 0.2 * delta;
    customUniforms.time.value += dt;

    renderer.render(scene, camera);
}
