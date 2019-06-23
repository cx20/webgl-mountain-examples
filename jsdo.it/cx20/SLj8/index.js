﻿var gui;
var scene;
var camera;
var renderer;
var controls;
var engine;
var showSmoke = true;
var clock = new THREE.Clock();
var width = window.innerWidth - 2;
var height = window.innerHeight - 2;
var MAP = "map_002.jpg";
var SMOKE = true;
//var ROTATE = true;
var ROTATE = false;
var WIREFRAME = false;
var emitter, particleGroup;

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
        var k = 3.0; // 起伏の強調度
        var height = (pix[i] + pix[i + 1] + pix[i + 2])/3 * 1/16 * k;
        data[j++] = height;
    }

    return data;
}

function initParticles() {
    var loader = new THREE.TextureLoader();
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
        maxAge: {
            value: 2
        },
        position: {
            value: new THREE.Vector3(0, 8, 3),
            spread: new THREE.Vector3( 2, 2, 2 )
        },
        acceleration: {
            value: new THREE.Vector3(2, 3, -3),
            spread: new THREE.Vector3( 2, 1, 2 )
        },
        velocity: {
            value: new THREE.Vector3(0, 1, 0),
            spread: new THREE.Vector3(1, 1, 1)
        },
        color: {
            //value: [ new THREE.Color('#A0A0A0') ]
            value: [ new THREE.Color('#F0F0F0') ]
        },
        opacity: {
            value: 0.5
        },
        size: {
            value: 5
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
    var material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture(MAP)
    });
    var plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);

    initParticles();
    
    // GUI
    gui = new dat.GUI();
    var mapSelector = gui.add(window, 'MAP', {
        "通常地図": "map_001.jpg",
        "空撮写真": "map_002.jpg",
        "噴火口位置":"map_003.jpg",
        "産総研地質図":"map_004.jpg",
        "警戒が必要な範囲":"map_005.jpg",
        "だいち2号SAR(平成30年4月20日)":"map_006.jpg",
        "だいち2号SAR(平成30年4月21日)":"map_007.jpg",
        "だいち2号SAR(平成30年4月23日)":"map_008.jpg",
        "航空機SAR(平成30年2月26日)":"map_009.jpg",
        "航空機SAR(平成30年4月20日)":"map_010.jpg",
    });
    var mapSmoke = gui.add(window, 'SMOKE').name('Smoke');
    var mapRotate = gui.add(window, 'ROTATE').name('Rotate');
    //var mapWireframe = gui.add(window, 'WIREFRAME').name('Wireframe');

    mapSelector.onChange(function (value) {
        plane.material.map = THREE.ImageUtils.loadTexture(value);
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
/*
    mapWireframe.onChange(function (value) {
        plane.material.wireframe = value;
    });
*/    
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
    renderer.render(scene, camera);
}
