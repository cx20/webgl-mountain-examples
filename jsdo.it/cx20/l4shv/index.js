﻿let scene;
let camera;
let theta = 0;

function animate() {
    controls.update();
    requestAnimationFrame( animate );
    render();
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
    camera.position.set(0, -150, 150);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    // 座標軸表示
    let axis = new THREE.AxisHelper(100);
    scene.add(axis);


    let x1 = 128;
    let y1 = 128;
    let x2 = 256;
    let y2 = 256;
    let geometry = new THREE.PlaneGeometry(x1, y1, x2 - 1, y2 - 1);
    let s = (evt.target.response || evt.target.responseText).split("\n");
    let c = 0;
    for (let i = 0; i < y2; i++) {
        let r = s[i].split(",");
        for (let j in r) {
            let h = r[j] == 'e' ? 0 : Number(r[j]);
            geometry.vertices[c].z = h * 1; //高さの強調度を変える場合は、ここの数値を変更する
            c++;
        }
    }
    let material = new THREE.MeshPhongMaterial({
        map: THREE.ImageUtils.loadTexture('texture.png')
    });
    let plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    material = new THREE.MeshBasicMaterial({
        color: 0x444444
    });
    // 底面を追加
    geometry = new THREE.PlaneGeometry(x1, y1, 1, 1);
    for (i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[i].z = -10;
    }
    geometry.vertices[0].y = -(x1 / 2);
    geometry.vertices[1].y = -(y1 / 2);
    geometry.vertices[2].y = x1 / 2;
    geometry.vertices[3].y = y1 / 2;
    scene.add(new THREE.Mesh(geometry, material));
    // 側面1を追加
    material = new THREE.MeshBasicMaterial({
        color: 0xcccccc
    });
    geometry = new THREE.PlaneGeometry(x1, 1, x2 - 1, 1);
    for (i = 0; i < geometry.vertices.length; i++) {
        if ((0 <= i) && (i <= (x2 - 1))) {
            geometry.vertices[i].z = plane.geometry.vertices[(y2 - 1) * x2 + i].z;
        } else {
            geometry.vertices[i].z = -10;
        }
        geometry.vertices[i].y = -(y1 / 2);
    }
    scene.add(new THREE.Mesh(geometry, material));
    // 側面2を追加
    material = new THREE.MeshBasicMaterial({
        color: 0x888888
    });
    geometry = new THREE.PlaneGeometry(y1, 1, y2 - 1, 1);
    for (i = 0; i < geometry.vertices.length; i++) {
        if ((0 <= i) && (i <= (y2 - 1))) {
            geometry.vertices[i].z = plane.geometry.vertices[i * x2].z;
        } else {
            geometry.vertices[i].z = -10;
        }
        geometry.vertices[i].x = -(x1 / 2);
        geometry.vertices[i].y = (y1 / 2) - y1 / (y2 - 1) * (i % y2);
    }
    scene.add(new THREE.Mesh(geometry, material));
    // 側面3を追加
    material = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa
    });
    geometry = new THREE.PlaneGeometry(y1, 1, y2 - 1, 1);
    for (i = 0; i < geometry.vertices.length; i++) {
        if ((0 <= i) && (i <= (y2 - 1))) {
            geometry.vertices[i].z = plane.geometry.vertices[x2 * (y2 - 1 - i) + (x2 - 1)].z;
        } else {
            geometry.vertices[i].z = -10;
        }
        geometry.vertices[i].x = x1 / 2;
        geometry.vertices[i].y = -(y1 / 2) + y1 / (y2 - 1) * (i % y2);
    }
    scene.add(new THREE.Mesh(geometry, material));
    // 側面4を追加
    material = new THREE.MeshBasicMaterial({
        color: 0x666666
    });
    geometry = new THREE.PlaneGeometry(x1, 1, x2 - 1, 1);
    for (i = 0; i < geometry.vertices.length; i++) {
        if ((0 <= i) && (i <= (x2 - 1))) {
            geometry.vertices[i].z = plane.geometry.vertices[x2 - 1 - i].z;
        } else {
            geometry.vertices[i].z = -10;
        }
        geometry.vertices[i].x = x1 / 2 - x1 / (x2 - 1) * (i % x2);
        geometry.vertices[i].y = y1 / 2;
    }
    scene.add(new THREE.Mesh(geometry, material));

    controls = new THREE.TrackballControls(camera);
    document.getElementById('webgl').appendChild(renderer.domElement);
    animate();
}, false);
xhr.open('GET',  'dem.csv', true);
xhr.send(null);

window.onresize = function () {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height); // レンダラ―画面の再設定
    camera.aspect = width / height; // カメラのアスペクト比の再調整
    camera.updateProjectionMatrix();
    animate(); // 再描画
};
