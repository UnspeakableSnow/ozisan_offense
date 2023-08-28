import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
window.addEventListener('DOMContentLoaded', init);
let width = window.innerWidth;let height = window.innerHeight;

function init() {
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#myCanvas')});
renderer.setSize(width, height);
const models_dic={0:'./shot_file/desert_eagle_reload_animation.glb', 1:'./shot_file/fn_fal_reload_animation.glb', 2:'./shot_file/g3_reload_animation.glb'}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
const loadergltf = new GLTFLoader();
const socket=io();
let gamemode=0;

// 星空
const SIZE=3000;
const vertices = [];
for (var i = 0; i < 2000; i++) {
  const x = SIZE * (Math.random() - 0.5);
  const y = SIZE * (Math.random())+20;
  const z = SIZE * (Math.random() - 0.5);
  vertices.push(x, y, z);  }
const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)), new THREE.PointsMaterial({size: 5,color: 0xffffff,}));
scene.add(stars);
let myID=0;

class PL_ins{
  constructor(ID,type,HP,startposition){
    this.ID=ID;
    this.type=type;
    this.model_path=models_dic[String(type)];
    this.HP=HP
    this.realposi=startposition;
    this.modelloadcompd=0;
    this.statuses=0;  // モデルロード|ロード直後のbef_start
    this.model=null;
    this.mixer=null;
    if(type==-1) return -1;
    loadergltf.load(this.model_path, this.loading.bind(this), this.loading_txt.bind(this), function ( error ) {console.error( error );} );
  }
  loading=( gltf)=>{
    this.model = gltf.scene;
    this.animations = gltf.animations;
    if(this.animations && this.animations.length){ this.mixer = new THREE.AnimationMixer(this.model); }
    scene.add(this.model);
    if (this.type==0 || this.type==2){
      this.model.scale.set(0.01,0.01,0.01);
    }else if (this.type==1){
      this.model.scale.set(0.85,0.85,0.85);
    }
    if(this.model){this.statuses|=0b10;}
  }
  loading_txt(xhr){this.modelloadcompd=0;}
  bef_start(){
    this.reroad()
    this.statuses|=0b1;  }

  reroad(){
    if(this.action){this.action.reset();}
    if(!this.animations)return 1;
    this.animation = this.animations[0];
    this.action = this.mixer.clipAction(this.animation) ;
    this.action.setLoop(THREE.LoopOnce);
    this.action.clampWhenFinished = true;
    this.action.play();  }

  update(){
    if(!(this.statuses&0b10)) return -1;
    if(!(this.statuses&0b1))this.bef_start();
    if(((this.model.position.x-this.realposi[0])**2+ (this.model.position.y-this.realposi[1])**2+ (this.model.position.z-this.realposi[2])**2)>0.00002){
      this.model.position.x+=(this.realposi[0]-this.model.position.x)*0.3;
      this.model.position.y+=(this.realposi[1]-this.model.position.y)*0.3;
      this.model.position.z+=(this.realposi[2]-this.model.position.z)*0.3;
    }
    if((this.model.rotation.y-this.realposi[3])**2>0) this.model.rotation.y=this.realposi[3];
    if(this.mixer)this.mixer.update(time_delta);
  }
}

let PL=[];

// 弾
class bullet_ins{
  constructor(PLID,bul_gyokaku){
    this.bullet = new THREE.Mesh( new THREE.BoxGeometry( 0.03, 0.03, 0.06 ), new THREE.MeshBasicMaterial( {color: 0xFF0000} ) );
    this.PLID=PLID;
    this.vec=PL[this.PLID].realposi[3];
    this.bul_gyokaku=bul_gyokaku;
    this.bullet.position.x=PL[this.PLID].realposi[0]+Math.cos(this.bul_gyokaku)*Math.sin(this.vec)*0.5;
    this.bullet.position.y=PL[this.PLID].realposi[1]+1.985+Math.sin(this.bul_gyokaku) *0.5;
    this.bullet.position.z=PL[this.PLID].realposi[2]+Math.cos(this.bul_gyokaku)*Math.cos(this.vec)*0.5;
    this.bullet.rotation.y=this.vec;
    scene.add( this.bullet );
    this.speed=20;
    this.counter=200;
  }
  move(){
    for(var i=0;i<this.speed*time_delta;i+=0.01){  // バレットの当たり判定
    var kx= this.bullet.position.x+Math.cos(this.bul_gyokaku)*Math.sin(this.vec)*i;
    var ky= this.bullet.position.y+Math.sin(this.bul_gyokaku)*i;
    var kz= this.bullet.position.z+Math.cos(this.bul_gyokaku)*Math.cos(this.vec)*i;
    PL.forEach(col => {
      if(col.type==-1 || this.counter<0) return -1;
      if(col.ID!=this.PLID && ky-col.realposi[1]>0 && ky-col.realposi[1]<1.9){
        var dist=(kx-col.realposi[0])**2 + (kz-col.realposi[2])**2;
        if(dist<0.15){
          console.log(col.ID);
          this.counter=-1;
          if(this.PLID==myID)socket.emit("upHP",[col.ID,col.HP-1]);
          scene.remove(this.bullet);
          return -1;  }
    }  });  }
    this.counter-=this.speed*time_delta;
    if(this.counter<0){scene.remove(this.bullet);return -1;}
    this.bullet.position.x+=Math.cos(this.bul_gyokaku)*Math.sin(this.vec)*this.speed*time_delta;
    this.bullet.position.y+=Math.sin(this.bul_gyokaku)*this.speed*time_delta;
    this.bullet.position.z+=Math.cos(this.bul_gyokaku)*Math.cos(this.vec)*this.speed*time_delta;
    return 0;
  }
}
let bullet_obj=[];


// レティクル
const picloader = new THREE.TextureLoader();
const retexikuru = new THREE.Mesh(new THREE.PlaneGeometry( 0.15,0.15 ),  new THREE.MeshStandardMaterial({map: picloader.load("./shot_file/nc148346.png"), transparent: true,}) );
scene.add( retexikuru );

// HPバー
const HPbar = new THREE.Mesh(new THREE.PlaneGeometry( 0.3,0.02 ),  new THREE.MeshStandardMaterial({color: 0x00ff00}) );
scene.add( HPbar );


function camset(mode,ID){
  switch(mode){
    case 0:
      if(!PL[ID].model) return -1;
      if(cam_gyokaku-mouseY*0.05<0.4 &&cam_gyokaku-mouseY*0.05>-0.2){cam_gyokaku-=mouseY*0.05;}
      camera.position.x=PL[ID].model.position.x+Math.cos(cam_gyokaku)*Math.sin(PL[ID].model.rotation.y) *-0.6;
      camera.position.y=PL[ID].model.position.y+2+Math.sin(cam_gyokaku) *-0.6;
      camera.position.z=PL[ID].model.position.z+Math.cos(cam_gyokaku)*Math.cos(PL[ID].model.rotation.y) *-0.6;
      camera.lookAt(new THREE.Vector3(PL[ID].model.position.x, PL[ID].model.position.y+1.9, PL[ID].model.position.z));
      retexikuru.position.x=camera.position.x+Math.cos(cam_gyokaku)*Math.sin(PL[ID].model.rotation.y)*1.2;
      retexikuru.position.y=camera.position.y+Math.sin(cam_gyokaku) *1.2;
      retexikuru.position.z=camera.position.z+Math.cos(cam_gyokaku)*Math.cos(PL[ID].model.rotation.y)*1.2;
      retexikuru.rotation.y=PL[ID].model.rotation.y+Math.PI;
      HPbar.position.x=camera.position.x+Math.cos(cam_gyokaku)*Math.sin(PL[ID].model.rotation.y)*1.2;
      HPbar.position.y=camera.position.y+Math.sin(cam_gyokaku) *1.2+0.2;
      HPbar.position.z=camera.position.z+Math.cos(cam_gyokaku)*Math.cos(PL[ID].model.rotation.y)*1.2;
      HPbar.rotation.y=PL[ID].model.rotation.y+Math.PI;
      HPbar.scale.x=PL[ID].HP/100;
      break;
  }
}


// マップ
let maploadcompd=0;
let model_r = null;
loadergltf.load( './shot_file/de_dust2_-_cs_map-rep.glb', function ( gltf ) {
model_r = gltf.scene;
scene.add( model_r );
model_r.scale.set(2,2,2);
model_r.position.set(0,0,0);
console.log('map : 成功' );
}, function ( xhr ) {
      // console.log( "map : "+( xhr.loaded / xhr.total * 100 ) + '% 読込済' );
      maploadcompd=xhr.loaded/xhr.total;
}, function ( error ) {
console.error( error );
} );

const light = new THREE.HemisphereLight(0x888888, 0x505000, 1.0);
scene.add(light);

let mouseX = 0;
let mouseY = 0;
let cam_gyokaku=0;
// let y_vec=0;
// let touch_grand=true;
const movescale=0.15;//歩幅
let wasd_down=[false,false,false,false];
let moveto=[0,0];
let clock = new THREE.Clock();
let time_delta=0;
let setupPL=0;
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
document.body.addEventListener('mousedown',(event) => {
  if(gamemode==2)socket.emit('shot', cam_gyokaku);});
window.addEventListener('resize',(event) => {
    width = window.innerWidth;height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

socket.on('reqType', ()=>{socket.emit('setType', Number(prompt('武器を選択')));});
socket.on('adopt', (setupdata)=>{
  myID=setupdata[0];
  setupPL=setupdata[1];
  gamemode=1;
});
socket.on('PLnull', (loc)=>{if(gamemode<1) return -1; PL.push(new PL_ins(loc[1],loc[2],loc[3],loc[4]))});
socket.on('append', (loc)=>{
  if(gamemode<1) return -1;
  if(PL.length>loc[1]) PL.splice( loc[1], 1, new PL_ins(loc[1],loc[2],loc[3],loc[4]));
  else console.error("なんかおかしい");
});
socket.on('creBul', (data)=>{
  if(gamemode==2)bullet_obj.push(new bullet_ins(data[0],data[1]));
});
socket.on('downdata', function(loc){PL[loc[0]].realposi=loc[1];});
socket.on('downHP', function(loc){PL[loc[0]].HP=loc[1];});

tick();
function tick() {
time_delta=clock.getDelta();
switch(gamemode){
  case 0:
    break;
  case 1:
    if(PL.length==0){setupPL.forEach(col=> {PL.push(new PL_ins(col[1],col[2],col[3],col[4]));});}
    var totalcompd = PL.reduce(function(sum, element){return sum + element.modelloadcompd;}, 0);
    var compper=(maploadcompd+totalcompd)/(1+PL.length);
    console.log("load compd:",compper);
    if(compper=1){
      gamemode=2;
      var style = document.createElement('style');
      style.innerHTML = `#myCanvas{animation: fadein-anim 1s linear forwards;}`;
      document.body.appendChild(style);
    }
    break;
  case 2:
    for(var i=0;i<PL.length;i++){PL[i].update();}
    var skkiped=0;
    for(var i=0;i<bullet_obj.length;i++){var DelF=bullet_obj[i-skkiped].move();if(DelF==-1){bullet_obj.splice(i+skkiped,1);skkiped++;}}
  
      // ↓八方移動方角計算、移動
      moveto=[0,0];
      if(wasd_down[0] && !(wasd_down[2])){moveto[1]+=1;if(wasd_down[3]){moveto[0]+=2;}}
      if(wasd_down[1] && !(wasd_down[3])){moveto[1]+=1;moveto[0]+=0.5;}
      if(wasd_down[2] && !(wasd_down[0])){moveto[1]+=1;moveto[0]+=1;}
      if(wasd_down[3] && !(wasd_down[1])){moveto[1]+=1;moveto[0]+=1.5;}
      if(PL[myID].statuses&0b10){
        if(moveto[1]>0){
          PL[myID].realposi[0]+=movescale*Math.sin(PL[myID].model.rotation.y+(moveto[0]/moveto[1])*Math.PI);
          PL[myID].realposi[2]+=movescale*Math.cos(PL[myID].model.rotation.y+(moveto[0]/moveto[1])*Math.PI); }
        PL[myID].realposi[3]-=mouseX*0.05;
        socket.emit('updata', PL[myID].realposi);
      }
      camset(0,myID);
    break;
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