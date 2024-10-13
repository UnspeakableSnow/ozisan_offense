import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
window.addEventListener('DOMContentLoaded', init);
let width = window.innerWidth;let height = window.innerHeight;
let printscore = document.getElementById('score');
let printHP = document.getElementById('HP');
let printAmmunition = document.getElementById('ammunition');

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
  constructor(ID,type,HP,startposition,score){
    this.ID=ID;
    this.type=type;
    this.statuses=0;  // リロード|セミオート|run|しゃがみ|モデルロード|ロード直後のbef_start
    switch(this.type){
      case 0:  // デザートイーグル
        this.rensha=1;
        this.Maxammu=7;
        this.damage=3;
        this.bul_speed=460;
        this.statuses|=0b10000;
      break;
      case 1:  // fal
        this.rensha=0.091;
        this.Maxammu=20;
        this.damage=0.6;
        this.bul_speed=823;
      break;
      case 2:  // G3
        this.rensha=0.1;
        this.Maxammu=30;
        this.damage=0.5;
        this.bul_speed=790;
      break;
      default:
        this.rensha=0.1;
        this.Maxammu=100;
        this.damage=1;
        this.bul_speed=823;
      break;
    }
    this.shot_sound = new Audio('shot_file/submachinegun.mp3');
    this.reload_sound = new Audio('shot_file/pompaction.mp3');
    this.noshot_sound = new Audio('shot_file/pompaction_none.mp3');
    this.model_path=models_dic[String(type)];
    this.HP=HP;
    this.realposi=startposition;
    this.score=score;
    this.renshan=0;
    this.nowspeed=1;
    this.modelloadcompd=0;
    this.repopcount=2;
    this.shotcount=2;
    this.ammunition=0;
    this.model=null;
    this.mixer=null;
    if(type==-1) return -1;
    loadergltf.load(this.model_path, this.loading.bind(this), ()=>{}, function ( error ) {console.error( error );} );
  }
  loading=( gltf)=>{
    this.model = gltf.scene;
    this.animations = new Map([]);
    if(gltf.animations.length>0){
      gltf.animations.forEach(col => {  // アニメーションをnameインデックスに
        this.animations.set(col.name,col);    });
      this.mixer = new THREE.AnimationMixer(this.model);}
    scene.add(this.model);
    if (this.type==0 || this.type==2){
      this.model.scale.set(0.01,0.01,0.01);
    }else if (this.type==1){
      this.model.scale.set(0.85,0.85,0.85);
    }
    if(this.model){this.statuses|=0b10;}
    console.log(this.animations.keys())
  }
  bef_start(){
    this.reload();  // モデル生成時のポーズバグ
    this.statuses|=0b1;  }

  reload(){
    this.anim_change("reload");
    this.statuses|=0b100000;
    if(this.shot_sound.readyState === 4){
      this.reload_sound.pause();
      this.reload_sound.currentTime=0;
      this.reload_sound.play();
    }
    this.ammunition=this.Maxammu;  }

  update(){
    if(!(this.statuses&0b10)) return -1;
    if(!(this.statuses&0b1))this.bef_start();
    if(this.repopcount>0)this.repopcount-=time_delta;
    if(this.shotcount>=0)this.shotcount-=time_delta;
    if(this.repopcount<0)this.repopcount=0;
    var poseflag=true;
    
    if(!(this.statuses&0b100)){
      if(this.statuses&0b1000)  this.nowspeed+=(2-this.nowspeed)*0.1;
      else this.nowspeed+=(0.8-this.nowspeed)*0.2;
    }else{
      this.nowspeed+=(0.3-this.nowspeed)*0.03;
      this.anim_change("sit");
      poseflag=false;
    }
    if(Math.ceil(this.repopcount**2/5+this.repopcount*5)%2) this.model.visible=false;
    else this.model.visible=true;
    var movedist=((this.model.position.x-this.realposi[0])**2+ (this.model.position.y-this.realposi[1])**2+ (this.model.position.z-this.realposi[2])**2);
    if(movedist>0.00002){
      this.model.position.x+=(this.realposi[0]-this.model.position.x)*0.3;
      this.model.position.y+=(this.realposi[1]-this.model.position.y)*0.3;
      this.model.position.z+=(this.realposi[2]-this.model.position.z)*0.3;
    }
    if(movedist>0.1){
      this.anim_change("walk");
      poseflag=false;
    }
    this.model.rotation.y = this.realposi[3];

    if(this.animation && this.animation.name=="reload" && this.action._loopCount<1) poseflag=false;
    if(poseflag) this.anim_change("pose");
    if(this.mixer)this.mixer.update(time_delta);
  }
  
  shot(){
    if(gamemode<2) return -1;
    if(this.shotcount<0){
      if(this.ammunition>0){
        socket.emit('shot', cam_gyokaku);
        this.shotcount=this.rensha;
        this.ammunition--;
        if(this.shot_sound.readyState === 4){
          this.shot_sound.pause();
          this.shot_sound.currentTime=0;
          this.shot_sound.play();
        }
      }else{
        if(this.noshot_sound.readyState === 4){
          this.noshot_sound.pause();
          this.noshot_sound.currentTime=0;
          this.noshot_sound.play();
        }
        this.shotcount=this.rensha;
      }
    }
  }
  
  deth(posi){
    this.repopcount=3;
    this.shotcount=2;
    this.statuses^=0b1;
    socket.emit('upHP',[this.ID, 10]);
    this.realposi=posi;  }
  
  sitstand(to,mode){
    if(to){
      this.statuses|=0b100;
      this.statuses&=(~0b1000);  // しゃがんだら強制ダッシュ解除
    }
    else  this.statuses&=(~0b100);
  }
  run(mode){
    if(mode && !(this.statuses&0b100))  this.statuses|=0b1000;
    else  this.statuses&=(~0b1000);
  }
  anim_change(mode){
    if((!(this.animation) || this.animation.name!=mode) && this.animations.has(mode)){
      this.mixer.stopAllAction();
      if(this.action) this.action.reset();
      this.animation = this.animations.get(mode);
      this.action = this.mixer.clipAction(this.animation) ;
      this.action.setLoop(THREE.LoopRepeat);
      this.action.clampWhenFinished = true;
      this.action.play();
    }else if((!(this.animation) || this.animation.name!=mode) && mode=="reload" && this.animations.has("KeptYouWaitingHuh?")){  // アニメーションを作ってないfal用
      this.mixer.stopAllAction();
      if(this.action) this.action.reset();
      this.animation = this.animations.get("KeptYouWaitingHuh?");
      this.action = this.mixer.clipAction(this.animation) ;
      this.action.setLoop(THREE.LoopOnce);
      this.action.clampWhenFinished = true;
      this.action.play();
    }
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
    this.bullet.position.x=PL[this.PLID].realposi[0]+Math.cos(this.bul_gyokaku)*Math.sin(this.vec)*-0.5;
    if(PL[this.PLID].statuses&0b100)  this.bullet.position.y=PL[this.PLID].realposi[1]+1+Math.sin(cam_gyokaku) *-0.5;
    else  this.bullet.position.y=PL[this.PLID].realposi[1]+1.7+Math.sin(cam_gyokaku) *-0.5;
    this.bullet.position.z=PL[this.PLID].realposi[2]+Math.cos(this.bul_gyokaku)*Math.cos(this.vec)*-0.5;
    this.bullet.rotation.y=this.vec;
    scene.add( this.bullet );

    this.speed=PL[this.PLID].bul_speed/2;
    this.counter=200;
    this.damage=PL[this.PLID].damage;
  }
  move(){
    for(var i=0;i<this.speed*time_delta;i+=0.01){  // バレットの当たり判定
    var kx= this.bullet.position.x+Math.cos(this.bul_gyokaku)*Math.sin(this.vec)*i;
    var ky= this.bullet.position.y+Math.sin(this.bul_gyokaku)*i;
    var kz= this.bullet.position.z+Math.cos(this.bul_gyokaku)*Math.cos(this.vec)*i;
    PL.forEach(col => {
      if(col.type==-1 || col.repopcount>0 || this.counter<0) return -1;
      if(col.ID!=this.PLID && ky-col.realposi[1]>0 && ky-col.realposi[1]<1.9){
        var dist=(kx-col.realposi[0])**2 + (kz-col.realposi[2])**2;
        if(dist<0.15){
          console.log(col.ID);
          this.counter=-1;
          if(this.PLID==myID)socket.emit("upHP",[col.ID,col.HP-this.damage]);
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



function camset(mode,ID){
  switch(mode){
    case 0:
      if(!PL[ID].model) return -1;
      if(cam_gyokaku-mouseY*0.05<0.4 &&cam_gyokaku-mouseY*0.05>-0.2){cam_gyokaku-=mouseY*0.05;}
      camera.position.x=PL[ID].model.position.x+Math.cos(cam_gyokaku)*Math.sin(PL[ID].realposi[3]) *-0.6;
      if(PL[ID].statuses&0b100)  camera.position.y=PL[ID].model.position.y+1+Math.sin(cam_gyokaku) *-0.6;
      else  camera.position.y=PL[ID].model.position.y+1.7+Math.sin(cam_gyokaku) *-0.6;
      camera.position.z=PL[ID].model.position.z+Math.cos(cam_gyokaku)*Math.cos(PL[ID].realposi[3]) *-0.6;

      if(PL[ID].statuses&0b100)  camera.lookAt(new THREE.Vector3(PL[ID].model.position.x, PL[ID].model.position.y+0.95, PL[ID].model.position.z));
      else camera.lookAt(new THREE.Vector3(PL[ID].model.position.x, PL[ID].model.position.y+1.7, PL[ID].model.position.z));

      printscore.textContent=PL[ID].score;
      printHP.textContent=PL[ID].HP;
      printAmmunition.textContent=PL[ID].ammunition;
      break;
  }
}


// マップ
let maploadcompd=0;
let model_r = null;
loadergltf.load( './shot_file/de_dust2_-_cs_map-rep.glb', function ( gltf ) {
  model_r = gltf.scene;
  scene.add( model_r );
  model_r.scale.set(3.5,3.5,3.5);
  model_r.position.set(0,0,0);
  maploadcompd=1
}, function ( xhr ) {
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
let mousedown=false;
let moveto=[0,0];
let clock = new THREE.Clock();
let time_delta=0;
let setupPL=0;
document.addEventListener("mousemove", (event) => {mouseX=event.pageX/width-0.5;mouseY=event.pageY/height-0.5;});
document.addEventListener("mouseleave", (event) => {mouseX=0;mouseY=0;});
document.body.addEventListener('keydown',(event) => { // キーを押したか
  if(gamemode<2) return -1;
  if(event.key=="w"){wasd_down[0]=true;}
  if(event.key=="a"){wasd_down[1]=true;}
  if(event.key=="s"){wasd_down[2]=true;}
  if(event.key=="d"){wasd_down[3]=true;}
  if(event.key=="r"){PL[myID].reload();}
  if(event.key=="z"){socket.emit('upsit', [!(PL[myID].statuses&0b100),moveto[1]>0]);}
  if(event.shiftKey){PL[myID].run(!(PL[myID].statuses&0b1000));}
});
document.body.addEventListener('keyup',(event) => { // キーを放したか
  if(event.key=="w"){wasd_down[0]=false;}
  if(event.key=="a"){wasd_down[1]=false;}
  if(event.key=="s"){wasd_down[2]=false;}
  if(event.key=="d"){wasd_down[3]=false;}
});
document.body.addEventListener('mousedown',(event) => {
  mousedown=true;  });
  document.body.addEventListener('mouseup',(event) => {
    if(gamemode==2 && PL[myID].statuses&0b10000)  PL[myID].shotcount=-1;
    mousedown=false;  });
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
socket.on('PLnull', (loc)=>{if(gamemode<1) return -1; PL.push(new PL_ins(loc[1],loc[2],loc[3],loc[4],loc[5]))});
socket.on('append', (loc)=>{
  if(gamemode<1) return -1;
  if(PL.length>loc[1]) PL.splice( loc[1], 1, new PL_ins(loc[1],loc[2],loc[3],loc[4],loc[5]));
  else console.error("なんかおかしい");
});
socket.on('creBul', (data)=>{
  if(gamemode==2)bullet_obj.push(new bullet_ins(data[0],data[1]));
});
socket.on('downdata', function(loc){if(PL[loc[0]])PL[loc[0]].realposi=loc[1];});
socket.on('downHP', function(loc){PL[loc[0]].HP=loc[1];});
socket.on('downscore', function(loc){PL[loc[0]].score=loc[1]; console.log(loc[0],"score",PL[loc[0]].score);});
socket.on('dowsit', function(loc){PL[loc[0]].sitstand(loc[1],loc[2])});
socket.on('deth', function(loc){PL[loc[0]].deth(loc[1]);});

tick();
function tick() {
time_delta=clock.getDelta();
switch(gamemode){
  case 0:
    break;
  case 1:
    if(PL.length==0){setupPL.forEach(col=> {PL.push(new PL_ins(col[1],col[2],col[3],col[4],col[5]));});}
    var totalcompd = PL.reduce(function(sum, element){return sum + element.modelloadcompd;}, 0);
    var compper=(maploadcompd+totalcompd)/(1+PL.length);
    console.log("load compd:",compper);
    if(compper=1){
      gamemode=2;
      var style = document.createElement('style');
      style.innerHTML = `#myCanvas, #gameUI{animation: fadein-anim 1s linear forwards;}`;
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
        if(moveto[1]>0 && PL[myID].repopcount<=1){
          PL[myID].realposi[0]+=movescale*PL[myID].nowspeed*Math.sin(PL[myID].realposi[3]+(moveto[0]/moveto[1])*Math.PI);
          PL[myID].realposi[2]+=movescale*PL[myID].nowspeed*Math.cos(PL[myID].realposi[3]+(moveto[0]/moveto[1])*Math.PI); }
        PL[myID].realposi[3]-=mouseX*0.08;
        socket.emit('updata', PL[myID].realposi);
      }
      if(mousedown)PL[myID].shot();
      camset(0,myID);
    break;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
}
