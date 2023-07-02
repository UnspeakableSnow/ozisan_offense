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
const loadergltf = new GLTFLoader();

// パーティクル
const SIZE=3000;
const vertices = [];
for (var i = 0; i < 2000; i++) {
  const x = SIZE * (Math.random() - 0.5);
  const y = SIZE * (Math.random())+20;
  const z = SIZE * (Math.random() - 0.5);
  vertices.push(x, y, z);  }
const mesh = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)), new THREE.PointsMaterial({size: 5,color: 0xffffff,}));
scene.add(mesh);
const models_dic={0:'./shot_file/desert_eagle_reload_animation.glb', 1:'./shot_file/fn_fal_reload_animation.glb', 2:'./shot_file/g3_reload_animation.glb'}
const positions_dic={0:[10,0,0],1:[10,0,5],2:[12,0,3],3:[8,0,3]}
const myID=parseInt(Math.random()*4);
console.log(myID);

class PL_ins{
  constructor(ID,model_type){
    this.ID=ID;
    this.model_type=model_type;
    this.model_path=models_dic[String(model_type)];
    this.start_posi=positions_dic[String(this.ID)];
  }
  load(){
    this.model=null;
    this.mixer=null;
    loadergltf.load(this.model_path, this.loading.bind(this), this.loading_txt.bind(this), function ( error ) {console.error( error );} );
  }
  loading=( gltf)=>{
    this.model = gltf.scene;
    this.animations = gltf.animations;
    if(this.animations && this.animations.length){ this.mixer = new THREE.AnimationMixer(this.model); }
    scene.add( this.model );
    if (this.model_type==0 || this.model_type==2){
      this.model.scale.set(0.01,0.01,0.01);
    }else if (this.model_type==1){
      this.model.scale.set(0.85,0.85,0.85);
    }
    this.model.position.x=-1000;
  }
  loading_txt(xhr){console.log( "PL"+String(this.ID)+" : "+( xhr.loaded / xhr.total * 100 ) + '% 読込済' );}
  bef_start(){
    this.model.position.set(this.start_posi[0],this.start_posi[1],this.start_posi[2]);
    this.reroad();
  }
  reroad(){
    if(this.action){this.action.reset();}
    this.animation = this.animations[0];
    this.action = this.mixer.clipAction(this.animation) ;
    this.action.setLoop(THREE.LoopOnce);
    this.action.clampWhenFinished = true;
    this.action.play();}
}

const PL=[new PL_ins(0,1),new PL_ins(1,1),new PL_ins(2,2),new PL_ins(3,0)]
for(var i=0;i<PL.length;i++){
  PL[i].load(); }


// レティクル
const picloader = new THREE.TextureLoader();
const retexikuru = new THREE.Mesh(new THREE.PlaneGeometry( 0.15,0.15 ),  new THREE.MeshStandardMaterial({map: picloader.load("./shot_file/nc148346.png"), transparent: true,}) );
scene.add( retexikuru );

// 弾
class bullet_ins{
  constructor(PLID){
    this.bullet = new THREE.Mesh( new THREE.BoxGeometry( 0.03, 0.03, 0.06 ), new THREE.MeshBasicMaterial( {color: 0xFF0000} ) );
    this.PLID=PLID;
    this.vec=PL[this.PLID].model.rotation.y;
    this.bul_gyokaku=cam_gyokaku;
    this.bullet.position.x=PL[this.PLID].model.position.x+Math.cos(this.bul_gyokaku)*Math.sin(this.vec)*0.5
    this.bullet.position.y=PL[this.PLID].model.position.y+1.9+Math.sin(this.bul_gyokaku) *0.5;
    this.bullet.position.z=PL[this.PLID].model.position.z+Math.cos(this.bul_gyokaku)*Math.cos(this.vec)*0.5;
    this.bullet.rotation.y=this.vec;
    scene.add( this.bullet );
    this.speed=20;
    this.counter=200;
    this.Ray = new THREE.Raycaster(this.bullet.position, new THREE.Vector3(Math.cos(this.bul_gyokaku)*Math.sin(this.vec),Math.sin(this.bul_gyokaku),Math.cos(this.bul_gyokaku)*Math.cos(this.vec)), 0, this.speed*ani_delta);
    this.intersects = this.Ray.intersectObjects(scene.children);
    if(this.intersects.length > 0){console.log(this.intersects);}
  }
  move(){
    this.counter--;
    if(this.counter<0){scene.remove(this.bullet);return -1;}
    this.Ray.set(this.bullet.position, new THREE.Vector3(Math.cos(this.bul_gyokaku)*Math.sin(this.vec),Math.sin(this.bul_gyokaku),Math.cos(this.bul_gyokaku)*Math.cos(this.vec)));
    this.intersects = this.Ray.intersectObjects(scene.children);
    if(this.intersects.length > 0){this.intersects[0].object.material.color.set( 0xff0000 );scene.remove(this.bullet);return -1;}
    this.bullet.position.x+=Math.cos(this.bul_gyokaku)*Math.sin(this.vec)*this.speed*ani_delta;
    this.bullet.position.y+=Math.sin(this.bul_gyokaku) *this.speed*ani_delta;
    this.bullet.position.z+=Math.cos(this.bul_gyokaku)*Math.cos(this.vec)*this.speed*ani_delta;
    return 0;
  }
}
let bullet_obj=[]


// マップ
let model_r = null;
loadergltf.load( './shot_file/de_dust2_-_cs_map-rep.glb', function ( gltf ) {
model_r = gltf.scene;
scene.add( model_r );
model_r.scale.set(2,2,2);
model_r.position.set(0,0,0);
console.log('map : 成功' );
}, function ( xhr ) {
      console.log( "map : "+( xhr.loaded / xhr.total * 100 ) + '% 読込済' );
}, function ( error ) {
console.error( error );
} );

const light = new THREE.HemisphereLight(0x888888, 0x505000, 1.0);
scene.add(light);

let mouseX = 0;
let mouseY = 0;
let cam_gyokaku=0;
let y_vec=0;
let touch_grand=true;
const movescale=0.15;//歩幅
let wasd_down=[false,false,false,false];
let moveto=[0,0];
let clock = new THREE.Clock();
let ani_delta=0;
let PLmoveRay = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, movescale);
document.addEventListener("mousemove", (event) => {
  if(event.pageX/width<0.05 || 0.95<event.pageX/width || 0.05>event.pageY/height || 0.95<event.pageY/height){mouseX=0;mouseY=0;}
  else{mouseX=event.pageX/width-0.5;mouseY=event.pageY/height-0.5;}
});
document.body.addEventListener('keydown',(event) => { // キーを押したか
  if(event.key=="w"){wasd_down[0]=true;}
  if(event.key=="a"){wasd_down[1]=true;}
  if(event.key=="s"){wasd_down[2]=true;}
  if(event.key=="d"){wasd_down[3]=true;}
  if(event.key=="r"){PL[myID].reroad();}
});
document.body.addEventListener('keyup',(event) => { // キーを放したか
  if(event.key=="w"){wasd_down[0]=false;}
  if(event.key=="a"){wasd_down[1]=false;}
  if(event.key=="s"){wasd_down[2]=false;}
  if(event.key=="d"){wasd_down[3]=false;}
});
document.body.addEventListener('mousedown',(event) => {bullet_obj.push(new bullet_ins(myID));});
window.addEventListener('resize',(event) => {
    width = window.innerWidth;height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);renderer.setSize(width, height);camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

tick();
function tick() {
  if(PL[myID].model!=null){
    ani_delta=clock.getDelta()
    for(var i=0;i<PL.length;i++){
      if(PL[i].model!=null && PL[i].model.position.x==-1000){PL[i].bef_start() }
      if(PL[i].mixer){PL[i].mixer.update(ani_delta);}}
    // ↓八方移動方角計算、移動
    moveto=[0,0];
    if(wasd_down[0] && !(wasd_down[2])){moveto[1]+=1;if(wasd_down[3]){moveto[0]+=2;}}
    if(wasd_down[1] && !(wasd_down[3])){moveto[1]+=1;moveto[0]+=0.5;}
    if(wasd_down[2] && !(wasd_down[0])){moveto[1]+=1;moveto[0]+=1;}
    if(wasd_down[3] && !(wasd_down[1])){moveto[1]+=1;moveto[0]+=1.5;}
    if(moveto[1]>0){
      PLmoveRay.set(new THREE.Vector3(PL[myID].model.position.x+Math.sin(PL[myID].model.rotation.y) *-0.6,PL[myID].model.position.y,PL[myID].model.position.z+Math.cos(PL[myID].model.rotation.y) *-0.6),
        new THREE.Vector3(Math.sin(PL[myID].model.rotation.y+(moveto[0]/moveto[1])*Math.PI),0,Math.sin(PL[myID].model.rotation.y+(moveto[0]/moveto[1])*Math.PI)));
      var intersects = PLmoveRay.intersectObjects(scene.children);
      if(intersects.length > 0){console.log(intersects);}
      PL[myID].model.position.x+=movescale*Math.sin(PL[myID].model.rotation.y+(moveto[0]/moveto[1])*Math.PI);
      PL[myID].model.position.z+=movescale*Math.cos(PL[myID].model.rotation.y+(moveto[0]/moveto[1])*Math.PI); }
    PL[myID].model.rotation.y-=mouseX*0.05;
    if(cam_gyokaku-mouseY*0.05<0.4 &&cam_gyokaku-mouseY*0.05>-0.2){cam_gyokaku-=mouseY*0.05;}
    camera.position.x=PL[myID].model.position.x+Math.cos(cam_gyokaku)*Math.sin(PL[myID].model.rotation.y) *-0.6;
    camera.position.y=PL[myID].model.position.y+2+Math.sin(cam_gyokaku) *-0.6;
    camera.position.z=PL[myID].model.position.z+Math.cos(cam_gyokaku)*Math.cos(PL[myID].model.rotation.y) *-0.6;
    camera.lookAt(new THREE.Vector3(PL[myID].model.position.x, PL[myID].model.position.y+1.9, PL[myID].model.position.z));
    retexikuru.position.x=camera.position.x+Math.cos(cam_gyokaku)*Math.sin(PL[myID].model.rotation.y)*1.2;
    retexikuru.position.y=camera.position.y+Math.sin(cam_gyokaku) *1.2;
    retexikuru.position.z=camera.position.z+Math.cos(cam_gyokaku)*Math.cos(PL[myID].model.rotation.y)*1.2;
    retexikuru.rotation.y=PL[myID].model.rotation.y+Math.PI;
    var skkiped=0;
    for(var i=0;i<bullet_obj.length;i++){var DelF=bullet_obj[i-skkiped].move();if(DelF==-1){bullet_obj.splice(i+skkiped,1);skkiped++;}}
    console.log("to connect");
    // var socket=io();
    // socket.emit('PLdata', PL[myID]);
    // socket.on('PLdata', function(redata){PL[redata.ID]=redata;});
    }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
}

//"The Bathroom (Free)" (https://skfb.ly/6ZYYo) by Evan is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
//"Abandoned Warehouse - Interior Scene" (https://skfb.ly/QQuJ) by Aurélien Martel is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
// "de_dust2 - CS map" (https://skfb.ly/6ACOH) by vrchris is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
// "LOWPOLY | FPS | TDM | GAME | MAP" (https://skfb.ly/oGypy) by Space_One is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
// "Desert Eagle Reload Animation" (https://skfb.ly/6SNAK) by Stavich is licensed under Creative Commons Attribution-NonCommercial (http://creativecommons.org/licenses/by-nc/4.0/).
// "G3 Reload Animation" (https://skfb.ly/6SSFz) by Stavich is licensed under Creative Commons Attribution-NonCommercial (http://creativecommons.org/licenses/by-nc/4.0/).
// "FN FAL Reload Animation" (https://skfb.ly/6VUVA) by Stavich is licensed under CC Attribution-NonCommercial-NoDerivs (http://creativecommons.org/licenses/by-nc-nd/4.0/).