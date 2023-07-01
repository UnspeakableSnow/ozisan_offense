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
const loadergltf = new GLTFLoader();

// パーティクル
const SIZE=3000;
const vertices = [];
for (let i = 0; i < 2000; i++) {
  const x = SIZE * (Math.random() - 0.5);
  const y = SIZE * (Math.random())+20;
  const z = SIZE * (Math.random() - 0.5);
  vertices.push(x, y, z);  }
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const material = new THREE.PointsMaterial({size: 5,color: 0xffffff,});
const mesh = new THREE.Points(geometry, material);
scene.add(mesh);
const models_dic={0:'./shot_file/desert_eagle_reload_animation.glb', 1:'./shot_file/fn_fal_reload_animation.glb', 2:'./shot_file/g3_reload_animation.glb'}
const positions_dic={1:[10,0,0],2:[10,0,5],3:[12,0,3],4:[8,0,3]}

class PL{
  constructor(ID,model_type){
    this.ID=ID;
    this.model_type=model_type;
    this.model_path=models_dic[String(model_type)];
    this.start_posi=positions_dic[String(this.ID)];
  }
  load(){
    this.model=null;
    this.mixer=null;
    loadergltf.load(this.model_path, this.loading.bind(this), this.loading_txt.bind(this), function ( error ) {console.error( "PL"+String(this.ID)+" : "+error );} );
  }
  loading=( gltf)=>{
    this.model = gltf.scene;
    console.log(this.model_type);
    this.animations = gltf.animations;
    if(this.animations && this.animations.length){ this.mixer = new THREE.AnimationMixer(this.model); }
    scene.add( this.model );
    if (this.model_type==0 || this.model_type==2){
      this.model.scale.set(0.01,0.01,0.01);
    }else if (this.model_type==1){
      this.model.scale.set(0.85,0.85,0.85);
      console.log("p");
    }
    this.model.position.set(this.start_posi[0],this.start_posi[1],this.start_posi[2]);
  }
  loading_txt(xhr){console.log( "PL"+String(this.ID)+" : "+( xhr.loaded / xhr.total * 100 ) + '% 読込済' );}
  reroad(){
    this.animation = this.animations[0];
    this.action = this.mixer.clipAction(this.animation) ;
    this.action.setLoop(THREE.LoopOnce);
    this.action.clampWhenFinished = true;
    this.action.play();}
}


const PL1=new PL(1,2);
PL1.load();

const PL2=new PL(2,1);
PL2.load();

const PL3=new PL(3,0);
PL3.load();

const PL4=new PL(4,1);
PL4.load();


// レティクル
const picloader = new THREE.TextureLoader();
const retexikuru = new THREE.Mesh(new THREE.PlaneGeometry( 0.15,0.15 ),  new THREE.MeshStandardMaterial({map: picloader.load("./shot_file/nc148346.png"), transparent: true,}) );
scene.add( retexikuru );

// 命中判定
// const geometry = new THREE.BoxGeometry( 0.03, 0.03, 20 );
// const material = new THREE.MeshBasicMaterial( {color: 0xFF0000} );
// const atarihantei = new THREE.Mesh( geometry, material );
// scene.add( atarihantei );

// マップ
let model_r = null;
loadergltf.load( './shot_file/de_dust2_-_cs_map-rep.glb', function ( gltf ) {
model_r = gltf.scene;
scene.add( model_r );
model_r.scale.set(2,2,2);
model_r.position.set(0,0,0);
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
let mouseY = 0;
let mouseY_dec = 0;
let y_vel=0;
let touch_grand=true;
let comradi_mov=0;
let comradi=0;
let mousedown=false;
const movescale=0.15;//歩幅
let wasd_down=[false,false,false,false];
let moveto=[0,0];
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
    if(event.key=="r"){y_vel=1;PL1.reroad();}
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
  if(PL1.model!=null){
    // ↓動き
    moveto=[0,0];
    if(wasd_down[0] && !(wasd_down[2])){moveto[1]+=1;if(wasd_down[3]){moveto[0]+=2;}}
    if(wasd_down[1] && !(wasd_down[3])){moveto[1]+=1;moveto[0]+=0.5;}
    if(wasd_down[2] && !(wasd_down[0])){moveto[1]+=1;moveto[0]+=1;}
    if(wasd_down[3] && !(wasd_down[1])){moveto[1]+=1;moveto[0]+=1.5;}
    if(moveto[1]>0){
        PL1.model.position.x+=movescale*Math.sin(PL1.model.rotation.y+(moveto[0]/moveto[1])*Math.PI);
        PL1.model.position.z+=movescale*Math.cos(PL1.model.rotation.y+(moveto[0]/moveto[1])*Math.PI); }
    PL1.model.rotation.y=(comradi+comradi_mov)*2*Math.PI;
    camera.position.x=PL1.model.position.x+Math.sin(PL1.model.rotation.y) *-0.6;
    camera.position.y=PL1.model.position.y+2;
    camera.position.z=PL1.model.position.z+Math.cos(PL1.model.rotation.y) *-0.6;
    camera.lookAt(new THREE.Vector3(PL1.model.position.x, PL1.model.position.y+1.9, PL1.model.position.z));
    retexikuru.position.x=camera.position.x+Math.sin(PL1.model.rotation.y)*1.2;
    retexikuru.position.y=camera.position.y;
    retexikuru.position.z=camera.position.z+Math.cos(PL1.model.rotation.y)*1.2;
    retexikuru.rotation.y=PL1.model.rotation.y+Math.PI;
    // atarihantei.position.x=camera.position.x+Math.sin(PL1.model.rotation.y)*11 ;
    // atarihantei.position.y=camera.position.y;
    // atarihantei.position.z=camera.position.z+Math.cos(PL1.model.rotation.y)*11 ;
    // atarihantei.rotation.y=PL1.model.rotation.y+Math.PI;
    }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
  if(PL1.mixer){PL1.mixer.update(clock.getDelta());}
}
}

//"The Bathroom (Free)" (https://skfb.ly/6ZYYo) by Evan is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
//"After the rain... - VR & Sound" (https://skfb.ly/6uQxu) by Aurélien Martel is licensed under Creative Commons Attribution-NonCommercial (http://creativecommons.org/licenses/by-nc/4.0/).
//"QBZ-95 With Hands And Animations" (https://skfb.ly/oIvHr) by BillyTheKid is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
//"Abandoned Warehouse - Interior Scene" (https://skfb.ly/QQuJ) by Aurélien Martel is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
// "de_dust2 - CS map" (https://skfb.ly/6ACOH) by vrchris is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
// "LOWPOLY | FPS | TDM | GAME | MAP" (https://skfb.ly/oGypy) by Space_One is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).