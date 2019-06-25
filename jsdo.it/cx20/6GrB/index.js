let scene;
let camera;
let controls;
let theta = 0;

function animate() {
    requestAnimationFrame( animate );
    update();
    render();
}

function update()
{
    theta += 0.1;

	controls.update();
}

function render() {
    renderer.render(scene, camera);
}

width = window.innerWidth;
height = window.innerHeight;

let xhr = new XMLHttpRequest();
xhr.addEventListener('load', function (evt) {
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff));
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 100, 150);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.autoRotate = true;     //true:自動回転する,false:自動回転しない
    controls.autoRotateSpeed = -2.0;    //自動回転する時の速度

    let x1 = 128;
    let y1 = 128;
    let x2 = 192; // 256;
    let y2 = 192; // 256;
    let geometry = new THREE.PlaneGeometry(x1, y1, x2 - 1, y2 - 1);
    let s = (evt.target.response || evt.target.responseText).split("\n");
    let c = 0;
    for (let i = 0; i < y2; i++) {
        let r = s[i].split(",");
        for (let j in r) {
            let h = r[j] == 'e' ? 0 : Number(r[j]);
            geometry.vertices[c].z = h * 1.5; //高さの強調度を変える場合は、ここの数値を変更する
            c++;
        }
    }
    let material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('texture.png')
    });
    let plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = Math.PI / -2; // 90度回転（地面を上向きに設定）
    scene.add(plane);

    material = new THREE.MeshBasicMaterial({
        color: 0x444444
    });

    document.getElementById('webgl').appendChild(renderer.domElement);
    animate();
}, false);
xhr.open('GET',  'dem.csv', true); // 御嶽山
xhr.send(null);

window.onresize = function () {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height); // レンダラ―画面の再設定
    camera.aspect = width / height; // カメラのアスペクト比の再調整
    camera.updateProjectionMatrix();
    animate(); // 再描画
};