let gui;
let scene;
let camera;
let renderer;
let controls;
let engine;
let showSmoke = true;
let clock = new THREE.Clock();
let width = window.innerWidth - 2;
let height = window.innerHeight - 2;
var MAP = "map_002.jpg";
var SMOKE = true;
var ROTATE = false;
var WIREFRAME = false;
let emitter, particleGroup;
let emitters = [];

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
        let k = 3.0; // 起伏の強調度
        //let height = (pix[i] + pix[i + 1] + pix[i + 2])/3 * 1/16 * k;
        let height = (pix[i] + pix[i + 1] + pix[i + 2])/3 * 1/16 * k - 10; // 位置調整
        data[j++] = height;
    }

    return data;
}

function initParticles() {
    let loader = new THREE.TextureLoader();
    let texture = loader.load('smokeparticle.png');  // smokeparticle.png

    particleGroup = new SPE.Group({
        texture: {
            value: texture
        },
        maxParticleCount: 1000, 
        blending: THREE.NormalBlending,
        transparent: true
    });

    // 噴火位置付近
    emitters.push( new SPE.Emitter({
        maxAge:       { value: 2 },
        position:     { value: new THREE.Vector3(0, -2, 3),   spread: new THREE.Vector3( 2, 2, 2 ) },
        acceleration: { value: new THREE.Vector3(2, 3, 3),    spread: new THREE.Vector3( 3, 1, 3 ) },
        velocity:     { value: new THREE.Vector3(0, 1, 0),    spread: new THREE.Vector3( 1, 1, 1 ) },
        color:        { value: [ new THREE.Color('#FFFFFF') ] },
        opacity:      { value: 0.5 },
        size:         { value: 10 },
        particleCount: 100
    }));

    // 県道1号線付近
    emitters.push( new SPE.Emitter({
        maxAge:       { value: 1 },
        position:     { value: new THREE.Vector3(-13, -4, 4), spread: new THREE.Vector3( 1, 1, 1 ) },
        acceleration: { value: new THREE.Vector3(1, 1.5, 1),  spread: new THREE.Vector3( 1, 1, 1 ) },
        velocity:     { value: new THREE.Vector3(0, 0, 0),      spread: new THREE.Vector3( 1, 1, 1 ) },
        color:        { value: [ new THREE.Color('#FFFFFF') ] },
        opacity:      { value: 0.5 },
        size:         { value: 2 },
        particleCount: 100
    }));

    emitters.push( new SPE.Emitter({
        maxAge:       { value: 1 },
        position:     { value: new THREE.Vector3(-12, -4, 5), spread: new THREE.Vector3( 1, 1, 1 ) },
        acceleration: { value: new THREE.Vector3(1, 1.5, 1),  spread: new THREE.Vector3( 1, 1, 1 ) },
        velocity:     { value: new THREE.Vector3(0, 0, 0),      spread: new THREE.Vector3( 1, 1, 1 ) },
        color:        { value: [ new THREE.Color('#FFFFFF') ] },
        opacity:      { value: 0.5 },
        size:         { value: 2 },
        particleCount: 100
    }));

    emitters.push( new SPE.Emitter({
        maxAge:       { value: 2 },
        position:     { value: new THREE.Vector3(-11, -4, 6),  spread: new THREE.Vector3( 2, 2, 2 ) },
        acceleration: { value: new THREE.Vector3(1, 1.5, 1.5), spread: new THREE.Vector3( 2, 1, 2 ) },
        velocity:     { value: new THREE.Vector3(0, 0, 0),     spread: new THREE.Vector3( 1, 1, 1 ) },
        color:        { value: [ new THREE.Color('#FFFFFF') ] },
        opacity:      { value: 0.5 },
        size:         { value: 4 },
        particleCount: 200
    }));
}

let img = new Image();
img.onload = function() {
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff));

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    //camera.position.set(0, 50, 100);
    camera.position.set(-80, 20, -10);

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
    let material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture(MAP)
    });
    let plane = new THREE.Mesh(geometry, material);
    
    // 座標回転
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);

    initParticles();
    
    // GUI
    gui = new dat.GUI();
    let mapSelector = gui.add(window, 'MAP', {
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
    let mapSmoke = gui.add(window, 'SMOKE').name('Smoke');
    let mapRotate = gui.add(window, 'ROTATE').name('Rotate');

    mapSelector.onChange(function (value) {
        plane.material.map = THREE.ImageUtils.loadTexture(value);
    });
    
    if ( showSmoke ) {
        for ( let i = 0; i < emitters.length; i++ ) {
            particleGroup.addEmitter( emitters[i] );
        }
        scene.add( particleGroup.mesh );
    }

    mapSmoke.onChange(function (value) {
        if ( value ) {
            for ( let i = 0; i < emitters.length; i++ ) {
                particleGroup.addEmitter( emitters[i] );
            }
            scene.add( particleGroup.mesh );
        } else {
             for ( let i = emitters.length-1; i >= 0; i-- ) {
                particleGroup.removeEmitter( emitters[i] );
            }
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
        particleGroup.tick( dt );
    }
    renderer.render(scene, camera);
}
