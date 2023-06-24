import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
window.addEventListener('DOMContentLoaded', init);
let width = window.innerWidth;let height = window.innerHeight;
function init() {
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#myCanvas')});
renderer.setSize(width, height);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
camera.position.set(0, 200, 0);

// GLTF形式のモデルデータを読み込む 狼
const loadergltf = new GLTFLoader();
let model = null;
loadergltf.load( 'file/wolf.glb', function ( gltf ) {
model = gltf.scene;
scene.add( model );
model.scale.set(50,50,50);
console.log('成功' );
}, function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% 読込済' );
}, function ( error ) {
console.error( error );
} );

// GLTF形式のモデルデータを読み込む 部屋
let model_r = null;
loadergltf.load( 'file/the_bathroom_free.glb', function ( gltf ) {
model_r = gltf.scene;
scene.add( model_r );
model_r.scale.set(200,200,200);
console.log('成功' );
}, function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% 読込済' );
}, function ( error ) {
console.error( error );
} );

const directionalLight = new THREE.DirectionalLight(0xFFFFFF);// 平行光源
directionalLight.position.set(1, 0.5, 1);
scene.add(directionalLight);// シーンに追加

let mouseX = 0;
let mouseX_dec = 0;
let comradi_mov=0;
let comradi=0;
let mousedown=false;
const movescale=5;
document.addEventListener("mousemove", (event) => {
    if(mouseX_dec==0){mouseX_dec=event.pageX;}
    if(mousedown){mouseX = (event.pageX-mouseX_dec)/ window.innerWidth;}
    if(event.pageX/window.innerWidth<0.02 || 0.98<event.pageX/window.innerWidth){mousedown=false;}
});
document.body.addEventListener('keydown',(event) => {
    if(model!=null){
        if (event.key === 'w' ) {
            model.position.x+=movescale;
        }else if(event.key === 's'){
            model.position.x-=movescale;
        }else if(event.key === 'd'){
            model.position.z+=movescale;
        }else if(event.key === 'a'){
            model.position.z-=movescale;
        }
    }
});
document.body.addEventListener('mousedown',(event) => {mousedown=true;mouseX_dec=0;comradi+=comradi_mov;comradi_mov=0;mouseX=0;});
document.body.addEventListener('mouseup',(event) => {mousedown=false;});
window.addEventListener('resize',(event) => {
    const width = window.innerWidth;const height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);renderer.setSize(width, height);camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

tick();
// 毎フレーム時に実行されるループイベントです
function tick() {
  comradi_mov += (mouseX-comradi_mov)*0.06;
  if(model==null){
    camera.position.x = Math.sin((comradi+comradi_mov)*4*Math.PI) * -500;
    camera.position.z = Math.cos((comradi+comradi_mov)*4*Math.PI) * 500;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }else{
    camera.position.x = model.position.x+Math.sin((comradi+comradi_mov)*4*Math.PI) * -500;
    camera.position.z = model.position.z+Math.cos((comradi+comradi_mov)*4*Math.PI) * 500;
    camera.lookAt(new THREE.Vector3(model.position.x, 0, model.position.z));  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
}

//"The Bathroom (Free)" (https://skfb.ly/6ZYYo) by Evan is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
//"After the rain... - VR & Sound" (https://skfb.ly/6uQxu) by Aurélien Martel is licensed under Creative Commons Attribution-NonCommercial (http://creativecommons.org/licenses/by-nc/4.0/).
//"QBZ-95 With Hands And Animations" (https://skfb.ly/oIvHr) by BillyTheKid is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
