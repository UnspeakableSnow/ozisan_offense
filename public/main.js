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
camera.position.set(0, 0, 0);

// PL
const loadergltf = new GLTFLoader();
let model = null;
loadergltf.load( './shot_file/qbz-95_with_hands_and_animations.glb', function ( gltf ) {
model = gltf.scene;
const animations = gltf.animations;

if(animations && animations.length) {
    mixer = new THREE.AnimationMixer(model);
    let i=2;
    let animation = animations[i];
    let action = mixer.clipAction(animation) ;
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = true;
    action.play();}
scene.add( model );
model.position.set(10,0,60);
console.log('成功' );
}, function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% 読込済' );
}, function ( error ) {
console.error( error );
} );

// マップ
let model_r = null;
loadergltf.load( './shot_file/after_the_rain..._-_vr__sound-n.glb', function ( gltf ) {
model_r = gltf.scene;
scene.add( model_r );
model_r.position.set(0,-2,0);
console.log('成功' );
}, function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% 読込済' );
}, function ( error ) {
console.error( error );
} );

const light = new THREE.HemisphereLight(0x888888, 0x505000, 1.0);
scene.add(light);

let mouseX = 0;
let mouseX_dec = 0;
let comradi_mov=0;
let comradi=0;
let mousedown=false;
const movescale=0.2;//歩幅
let wasd_down=[false,false,false,false];
let moveto=[0,0];
let mixer;
let clock = new THREE.Clock();
document.addEventListener("mousemove", (event) => {
    if(mouseX_dec==0){mouseX_dec=event.pageX;}
    if(mousedown){mouseX = (event.pageX-mouseX_dec)/ window.innerWidth;}
    if(event.pageX/window.innerWidth<0.02 || 0.98<event.pageX/window.innerWidth){mousedown=false;}
});
document.body.addEventListener('keydown',(event) => { // キーを押したか
    if(event.key=="w"){wasd_down[0]=true;}
    if(event.key=="a"){wasd_down[1]=true;}
    if(event.key=="s"){wasd_down[2]=true;}
    if(event.key=="d"){wasd_down[3]=true;}
});
document.body.addEventListener('keyup',(event) => { // キーを放したか
    if(event.key=="w"){wasd_down[0]=false;}
    if(event.key=="a"){wasd_down[1]=false;}
    if(event.key=="s"){wasd_down[2]=false;}
    if(event.key=="d"){wasd_down[3]=false;}
});
document.body.addEventListener('mousedown',(event) => {mousedown=true;mouseX_dec=0;comradi+=comradi_mov;comradi_mov=0;mouseX=0;});
document.body.addEventListener('mouseup',(event) => {mousedown=false;});
window.addEventListener('resize',(event) => {
    const width = window.innerWidth;const height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);renderer.setSize(width, height);camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

tick();
function tick() {
  comradi_mov += (mouseX-comradi_mov)*0.1;
  if(model!=null){
    // ↓動き
    moveto=[0,0];
    if (wasd_down[0] && !(wasd_down[2])) {moveto[1]+=1;if(wasd_down[3]){moveto[0]+=2;}}
    if(wasd_down[1] && !(wasd_down[3])){moveto[1]+=1;moveto[0]+=0.5;}
    if(wasd_down[2] && !(wasd_down[0])){moveto[1]+=1;moveto[0]+=1;}
    if(wasd_down[3] && !(wasd_down[1])){moveto[1]+=1;moveto[0]+=1.5;}
    if(moveto[1]>0){
        model.position.x+=movescale*Math.sin(model.rotation.y+(moveto[0]/moveto[1])*Math.PI);
        model.position.z+=movescale*Math.cos(model.rotation.y+(moveto[0]/moveto[1])*Math.PI);  }
    model.rotation.y=(comradi+comradi_mov)*2*Math.PI;
    camera.position.x=model.position.x+Math.sin(model.rotation.y) *-0.5;
    camera.position.y=model.position.y+0.18;
    camera.position.z=model.position.z+Math.cos(model.rotation.y) *-0.5;
    camera.lookAt(new THREE.Vector3(model.position.x, 0.18, model.position.z));
    }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
  if(mixer){mixer.update(clock.getDelta());}
}
}

//"The Bathroom (Free)" (https://skfb.ly/6ZYYo) by Evan is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
//"After the rain... - VR & Sound" (https://skfb.ly/6uQxu) by Aurélien Martel is licensed under Creative Commons Attribution-NonCommercial (http://creativecommons.org/licenses/by-nc/4.0/).
//"QBZ-95 With Hands And Animations" (https://skfb.ly/oIvHr) by BillyTheKid is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
//"Abandoned Warehouse - Interior Scene" (https://skfb.ly/QQuJ) by Aurélien Martel is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).