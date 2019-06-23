var gui;
var scene;
var camera;
var renderer;
var controls;
var engine;
var showSmoke = false;
var clock = new THREE.Clock();
var width = window.innerWidth - 2;
var height = window.innerHeight - 2;
var mask_file = "mask_file_008.png";
var lava_file = "lava_file.jpg";
var noise_file = "noise_file.png";
var MAP = "map_015.jpg;mask_file_008.png"; // SAR強度画像(2018年 3月27日??時)
var SMOKE = false;
var ROTATE = false;
var LAVA = false;
var emitter, particleGroup;
var customUniforms;
var loader = new THREE.TextureLoader();

// heightMap より標高データを取得する
// 参考：http://danni-three.blogspot.jp/2013/09/threejs-heightmaps.html
function getHeightData(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var context = canvas.getContext("2d");

    var size = img.width * img.height;
    var data = new Float32Array(size);

    context.drawImage(img, 0, 0);

    var imgd = context.getImageData(0, 0, img.width, img.height);
    var pix = imgd.data;

    var j = 0;
    for (var i = 0; i < pix.length; i += 4) {
        var k = 3.5; // 起伏の強調度
        var height = (pix[i] + pix[i + 1] + pix[i + 2])/3 * 1/16 * k;
        data[j++] = height;
    }

    return data;
}

function initParticles() {
    var texture = loader.load('smokeparticle.png');  // smokeparticle.png

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

var img = new Image();
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
    var data = getHeightData(img);

    // 標高データを元に地形を生成
    var x1 = 128;
    var y1 = 128;
    var x2 = 256;
    var y2 = 256;
    var geometry = new THREE.PlaneGeometry(x1, y1, x2 - 1, y2 - 1);
    for (var i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[i].z = data[i] - 30;
    }

    // テクスチャを貼り付け
/*
    var material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture(MAP)
    });
*/
    var imageFiles = MAP.split(";"); 
    var originalTexture = loader.load(imageFiles[0]);
    var maskTexture = loader.load(imageFiles[1]);

    // base image texture for mesh
    var lavaTexture = loader.load(lava_file); // lava.jpg
    lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed         
    var baseSpeed = 0.02;
    // number of times to repeat texture in each direction
    var repeatS = repeatT = 4.0;
    
    // texture used to generate "randomness", distort all other textures
    var noiseTexture = loader.load(noise_file); // cloud.png
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
    // magnitude of noise effect
    var noiseScale = 0.5;
    
    // texture to additively blend with base image texture
    var blendTexture = loader.load(lava_file); // lava.jpg
    blendTexture.wrapS = blendTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed 
    var blendSpeed = 0.01;
    // adjust lightness/darkness of blended texture
    var blendOffset = 0.25;

    // texture to determine normal displacement
    var bumpTexture = noiseTexture;
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping; 
    // multiplier for distortion speed         
    var bumpSpeed   = 0.15;
    // magnitude of normal displacement
    var bumpScale   = 40.0;
    
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

    var material = new THREE.ShaderMaterial({
        uniforms: customUniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragment_shader1').textContent
    });

    var plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);
    scene.position.y = -20.0;

    initParticles();
    
    // GUI
    gui = new dat.GUI();
    var mapSelector = gui.add(window, 'MAP', {
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
    var mapSmoke = gui.add(window, 'SMOKE').name('Smoke');
    var mapRotate = gui.add(window, 'ROTATE').name('Rotate');
    var mapLava = gui.add(window, 'LAVA').name('Lava');

    mapSelector.onChange(function (value) {
        //plane.material.map = THREE.ImageUtils.loadTexture(value);
        var imageFiles = value.split(";");
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
    var dt = clock.getDelta();
    if ( showSmoke ) {
        particleGroup.tick( dt );
    }

    var delta = 5 * clock.getDelta();
    customUniforms.time.value += 0.2 * delta;
    customUniforms.time.value += dt;

    renderer.render(scene, camera);
}
