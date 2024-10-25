<!-- ゲーム画面表示、ゲーム内データストリーム管理 -->
<script setup lang="ts">
import { onMounted, defineProps, ref } from "vue";
import hud_view from "./hud_view.vue";
import type { RT, PT } from "@/@types/types";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Socket } from "socket.io-client";
let width = window.innerWidth;
let height = window.innerHeight;
const models_dic = {
  desert_eagle: "/game_assets/desert_eagle_reload_animation.glb",
  fn_fal: "/game_assets/fn_fal_reload_animation.glb",
  g3: "/game_assets/g3_reload_animation.glb",
};
const loaded = ref(false);
const props = defineProps<{
  in_nowRT: RT;
  socket: Socket;
  id: string;
}>();
const in_nowRT = ref(props.in_nowRT);

onMounted(async () => {
  console.log(in_nowRT);
  let fovcos = 0;
  let wasd_down = 0;
  let mouse_down = false;
  const clock = new THREE.Clock();
  const move_scale = 85;
  let PCs: PCins[] = [];
  let bullets: bullet_ins[] = [];

  window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  document.body.addEventListener("keydown", (event) => {
    if (
      PCs &&
      PCs.every((PC) => {
        PC.model;
      })
    )
      return -1;
    if (event.key == "w") {
      wasd_down |= 0b1000;
    }
    if (event.key == "a") {
      wasd_down |= 0b0100;
    }
    if (event.key == "s") {
      wasd_down |= 0b0010;
    }
    if (event.key == "d") {
      wasd_down |= 0b0001;
    }
    if (event.key == "r") {
      if (PCs[myPCind]) PCs[myPCind].reload();
    }
    if (event.key == "z") {
      if (PCs[myPCind]) PCs[myPCind].PT.sitting = !PCs[myPCind].PT.sitting;
    }
    if (event.shiftKey) {
      if (PCs[myPCind]) PCs[myPCind].PT.running = !PCs[myPCind].PT.running;
    }
  });
  document.body.addEventListener("keyup", (event) => {
    if (event.key == "w") {
      wasd_down &= 0b0111;
    }
    if (event.key == "a") {
      wasd_down &= 0b1011;
    }
    if (event.key == "s") {
      wasd_down &= 0b1101;
    }
    if (event.key == "d") {
      wasd_down &= 0b1110;
    }
  });
  document.body.addEventListener("mousedown", () => {
    mouse_down = true;
  });
  document.body.addEventListener("mouseup", () => {
    mouse_down = false;
    if (PCs[myPCind]) PCs[myPCind].rensha_cool_time = 0;
  });

  props.socket.on("syncT", (RPsT: PT[]) => {
    if (PCs)
      RPsT.forEach((newPT) => {
        const PCind = PCs.findIndex((PC) => PC.PT.id === newPT.id);
        if (PCind != -1) PCs[PCind].PT = newPT;
      });
  });
  props.socket.on("fire", (data: { T: PT; weapon_id: string }) => {
    bullets.push(new bullet_ins(data.T));
    console.log(bullets);
  });

  // プレイヤーキャラクターインスタンス
  class PCins {
    PT: PT;
    semi_auto: boolean;
    reload_time: number;
    reloading_time: number;
    rensha: number;
    rensha_cool_time: number;
    max_ammo: number;
    ammo: number;
    damage: number;
    bul_speed: number;
    repopcount: number;
    shot_sound: HTMLAudioElement;
    reload_sound: HTMLAudioElement;
    noshot_sound: HTMLAudioElement;
    model_path: string;
    gltf: any;
    model: THREE.Object3D | undefined;
    mixer: THREE.AnimationMixer | undefined;
    animations: Map<string, THREE.AnimationClip>;
    now_animation: THREE.AnimationClip | undefined;
    action: THREE.AnimationAction | undefined;
    constructor(PT: PT) {
      this.PT = PT;
      switch (this.PT.weapon_ids.main) {
        case "desert_eagle": // デザートイーグル
          this.rensha = 1;
          this.max_ammo = 7;
          this.damage = 3;
          this.bul_speed = 460;
          this.semi_auto = true;
          this.reload_time = 3.5;
          break;
        case "fn_fal": // fal
          this.rensha = 0.091;
          this.max_ammo = 20;
          this.damage = 0.6;
          this.bul_speed = 823;
          this.semi_auto = false;
          this.reload_time = 2.5;
          break;
        case "g3": // G3
          this.rensha = 0.1;
          this.max_ammo = 30;
          this.damage = 0.5;
          this.bul_speed = 790;
          this.semi_auto = false;
          this.reload_time = 5.5;
          break;
      }
      this.model = undefined;
      this.shot_sound = new Audio("/game_assets/submachinegun.mp3");
      this.reload_sound = new Audio("/game_assets/pompaction.mp3");
      this.noshot_sound = new Audio("/game_assets/pompaction_none.mp3");
      this.model_path = models_dic[this.PT.weapon_ids.main];
      this.animations = new Map([]);
      this.reloading_time = 0;
      this.rensha_cool_time = 0;
      this.repopcount = 2;
      this.ammo = 0;
      this.mixer = undefined;
      this.init();
    }

    async init() {
      this.gltf = await loadergltf.loadAsync(this.model_path);
      this.model = this.gltf.scene;
      if (!this.model) throw Error(this.model_path + "ロード失敗");
      if (this.gltf.animations.length > 0) {
        this.gltf.animations.forEach((col: THREE.AnimationClip) => {
          // アニメーションをnameインデックスに
          this.animations.set(col.name, col);
        });
        this.mixer = new THREE.AnimationMixer(this.model);
      }
      scene.add(this.model);
      if (
        this.PT.weapon_ids.main == "desert_eagle" ||
        this.PT.weapon_ids.main == "g3"
      ) {
        this.model.scale.set(1.08, 1.08, 1.08);
      } else if (this.PT.weapon_ids.main == "fn_fal") {
        this.model.scale.set(91.8, 91.8, 91.8);
      }
      console.log(this.PT.id, this.animations.keys());
      if (props.id == this.PT.id) this.spawn();
      else this.update(1);
    }

    reload() {
      if (this.reloading_time < 0) {
        this.anim_change("reload");
        this.reloading_time = this.reload_time;
        if (this.shot_sound.readyState === 4) {
          this.reload_sound.pause();
          this.reload_sound.currentTime = 0;
          this.reload_sound.play();
        }
        this.ammo = this.max_ammo;
      }
    }

    update(time_delta: number) {
      if (!this.model) return -1;
      if (this.repopcount >= 0) this.repopcount -= time_delta;
      if (this.rensha_cool_time >= 0) this.rensha_cool_time -= time_delta;
      let poseflag = true;

      if (this.PT.sitting) {
        this.anim_change("sit");
        poseflag = false;
        //   if (this.statuses & 0b1000) this.nowspeed += (2 - this.nowspeed) * 0.1;
        //   else this.nowspeed += (0.8 - this.nowspeed) * 0.2;
        // } else {
        //   this.nowspeed += (0.3 - this.nowspeed) * 0.03;
      }

      if (
        (this.repopcount > 0 &&
          Math.ceil(this.repopcount ** 2 / 5 + this.repopcount * 5) % 2) ||
        !this.PT.alive
      )
        this.model.visible = false;
      else this.model.visible = true;

      this.PT.position.x += this.PT.velocity.x * time_delta;
      this.PT.position.y += this.PT.velocity.y * time_delta;
      this.PT.position.z += this.PT.velocity.z * time_delta;
      this.model.position.set(
        this.PT.position.x,
        this.PT.position.y,
        this.PT.position.z
      );
      if (
        this.PT.velocity.x ** 2 +
          this.PT.velocity.y ** 2 +
          this.PT.velocity.z ** 2 >
        0.1
      ) {
        this.anim_change("walk");
        poseflag = false;
      }
      this.PT.position.x_rotation += this.PT.velocity.x_rotation * time_delta;
      this.PT.position.y_rotation += this.PT.velocity.y_rotation * time_delta;
      this.PT.position.z_rotation += this.PT.velocity.z_rotation * time_delta;
      this.model.rotation.set(
        this.PT.position.x_rotation,
        this.PT.position.y_rotation,
        this.PT.position.z_rotation
      );
      this.PT.velocity.x_rotation /= 0.1;
      this.PT.velocity.y_rotation /= 0.1;
      this.PT.velocity.z_rotation /= 0.1;

      if (this.reloading_time < 0) poseflag = false;
      if (poseflag) this.anim_change("pose");
      if (this.mixer) this.mixer.update(time_delta);
    }

    shot() {
      if (props.id != this.PT.id) throw Error("不正な入力");
      if (!loaded.value) return -1;
      if (this.rensha_cool_time < 0) {
        if (this.ammo > 0) {
          props.socket.emit("fire", {
            T: this.PT,
            weapon_id: this.PT.weapon_ids.main,
          });
          this.rensha_cool_time = this.rensha;
          this.ammo--;
          if (this.shot_sound.readyState === 4) {
            this.shot_sound.pause();
            this.shot_sound.currentTime = 0;
            this.shot_sound.play();
          }
        } else {
          // 空打ち
          this.rensha_cool_time = this.rensha;
          if (this.noshot_sound.readyState === 4) {
            this.noshot_sound.pause();
            this.noshot_sound.currentTime = 0;
            this.noshot_sound.play();
          }
        }
      }
    }

    spawn() {
      if (props.id != this.PT.id) throw Error("不正な入力");
      this.repopcount = 3;
      this.rensha_cool_time = 2;
      this.PT.alive = true;
      this.PT.health = 10;
      this.PT.death++;
      this.PT.position = this.PT.spawn_point;
      this.PT.sitting = false;
      this.PT.running = false;
      props.socket.emit("spawn", this.PT);
    }
    anim_change(mode: string) {
      if (
        (!this.now_animation || this.now_animation.name != mode) &&
        this.mixer
      ) {
        if (mode == "reload" && this.animations.has("KeptYouWaitingHuh?")) {
          // アニメーションを作ってないfalは離脱
          this.mixer.stopAllAction();
          if (this.action) this.action.reset();
          this.now_animation = this.animations.get("KeptYouWaitingHuh?");
          if (!this.now_animation) return -1;
          this.action = this.mixer.clipAction(this.now_animation);
          this.action.setLoop(THREE.LoopOnce, 1);
          this.action.clampWhenFinished = true;
          this.action.play();
        } else {
          this.mixer.stopAllAction();
          if (this.action) this.action.reset();
          this.now_animation = this.animations.get(mode);
          if (!this.now_animation) return -1;
          this.action = this.mixer.clipAction(this.now_animation);
          this.action.setLoop(THREE.LoopRepeat, 999999);
        }
        this.action.clampWhenFinished = true;
        this.action.play();
      }
    }
  }
  function kia_bullet(bullet_id: number) {
    let target_bullet_ind = bullets.findIndex((b) => b.bullet_id === bullet_id);
    if (target_bullet_ind !== -1) {
      scene.remove(bullets[target_bullet_ind].bullet);
      bullets.splice(target_bullet_ind, 1);
    } else {
      console.error("error kia bullet", bullets.length);
    }
  }
  class bullet_ins {
    bullet: THREE.Mesh<
      THREE.BoxGeometry,
      THREE.MeshBasicMaterial,
      THREE.Object3DEventMap
    >;
    bullet_id: number;
    Pid: string;
    vec: THREE.Vector3 | undefined;
    speed: number | undefined;
    counter: number | undefined;
    damage: number | undefined;
    constructor(T: PT) {
      this.bullet = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 6),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      this.Pid = T.id;
      this.bullet_id = Math.random();
      const PT = T;
      const PC = PCs.find((PC) => PC.PT.id === T.id);
      if (!PC) {
        kia_bullet(this.bullet_id);
        return;
      }
      this.vec = new THREE.Vector3(
        PT.position.x_rotation,
        PT.position.y_rotation,
        PT.position.z_rotation
      );
      this.bullet.position.set(
        PT.position.x +
          Math.cos(this.vec.x) *
            Math.sin(this.vec.y) *
            Math.sin(this.vec.z) *
            -50,
        PT.position.y +
          170 +
          Math.sin(this.vec.x) *
            Math.cos(this.vec.y) *
            Math.sin(this.vec.z) *
            -50,
        PT.position.z +
          Math.sin(this.vec.x) *
            Math.sin(this.vec.y) *
            Math.cos(this.vec.z) *
            -50
      );
      this.bullet.rotation.set(this.vec.x, this.vec.y, this.vec.z);
      scene.add(this.bullet);

      this.speed = PC.bul_speed * 50;
      this.counter = 20000;
      this.damage = PC.damage;
    }
    move(time_delta: number) {
      if (!this.counter || !this.speed || !this.vec) return;
      this.counter -= this.speed * time_delta;
      if (this.counter < 0) {
        kia_bullet(this.bullet_id);
        return;
      }
      this.bullet.position.x +=
        Math.sin(this.vec.x) *
        Math.cos(this.vec.y) *
        Math.cos(this.vec.z) *
        this.speed *
        time_delta;
      this.bullet.position.y +=
        Math.cos(this.vec.x) *
        Math.sin(this.vec.y) *
        Math.cos(this.vec.z) *
        this.speed *
        time_delta;
      this.bullet.position.z +=
        Math.cos(this.vec.x) *
        Math.cos(this.vec.y) *
        Math.cos(this.vec.z) *
        this.speed *
        time_delta;
      console.log(
        Math.cos(this.vec.x) * Math.cos(this.vec.y) * Math.cos(this.vec.z)
      );
    }
  }
  // function camset(ID: number) {
  //   if (!PL[ID].model) return -1;
  //   if (
  //     cam_gyokaku - mouseY * 0.05 < 0.4 &&
  //     cam_gyokaku - mouseY * 0.05 > -0.2
  //   ) {
  //     cam_gyokaku -= mouseY * 0.05;
  //   }
  //   camera.position.x =
  //     PL[ID].model.position.x +
  //     Math.cos(cam_gyokaku) * Math.sin(PL[ID].realposi[3]) * -0.6;
  //   if (PL[ID].statuses & 0b100)
  //     camera.position.y =
  //       PL[ID].model.position.y + 1 + Math.sin(cam_gyokaku) * -0.6;
  //   else
  //     camera.position.y =
  //       PL[ID].model.position.y + 1.7 + Math.sin(cam_gyokaku) * -0.6;
  //   camera.position.z =
  //     PL[ID].model.position.z +
  //     Math.cos(cam_gyokaku) * Math.cos(PL[ID].realposi[3]) * -0.6;

  //   if (PL[ID].statuses & 0b100)
  //     camera.lookAt(
  //       new THREE.Vector3(
  //         PL[ID].model.position.x,
  //         PL[ID].model.position.y + 0.95,
  //         PL[ID].model.position.z
  //       )
  //     );
  //   else
  //     camera.lookAt(
  //       new THREE.Vector3(
  //         PL[ID].model.position.x,
  //         PL[ID].model.position.y + 1.7,
  //         PL[ID].model.position.z
  //       )
  //     );

  //   printscore.textContent = PL[ID].score;
  //   printHP.textContent = PL[ID].HP;
  //   printAmmunition.textContent = PL[ID].ammunition;
  // }

  const canvas = document.getElementById("main_canvas");
  if (canvas == null) throw Error("main_canvas検知不能");
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  const scene = new THREE.Scene();
  const loadergltf = new GLTFLoader();

  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
  camera.position.set(0, 0, 500);

  const light = new THREE.HemisphereLight(0x888888, 0x505000, 1.0);
  scene.add(light);

  let boxs: THREE.Object3D<THREE.Object3DEventMap>[] = [];
  for (let i = 0; i < 30; i++) {
    boxs.push(
      new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.MeshNormalMaterial()
      )
    );
    boxs[boxs.length - 1].position.set(
      (Math.random() - 0.5) * 400,
      (Math.random() - 0.5) * 400,
      (Math.random() - 0.5) * 400
    );
    scene.add(boxs[boxs.length - 1]);
  }

  in_nowRT.value.PsT.forEach((PT) => {
    PCs.push(new PCins(PT));
  });
  const myPCind = PCs.findIndex((PC) => PC.PT.id === props.id);

  loaded.value = true;
  tick();
  function tick() {
    let time_delta = clock.getDelta();
    boxs.forEach((box) => {
      box.rotation.y += 0.05;
    });
    PCs.forEach((PC) => {
      PC.update(time_delta);
    });
    bullets.forEach((bullet) => {
      bullet.move(time_delta);
    });
    if (wasd_down > 0) {
      const wasd_down_list = [...Array(4)].map((_, i) =>
        wasd_down & (1 << i) ? [0.5, 1, 1.5, 2][i] : 0
      );
      const wasd_down_count = wasd_down_list.reduce(
        (sum: number, e: number) => {
          if (e > 0) sum++;
          return sum;
        },
        0
      );
      const move_rad =
        wasd_down_list.reduce((sum: number, e: number) => {
          return sum + e;
        }, 0) * 180;
      if (wasd_down_count < 3) {
        if (PCs[myPCind]) {
          PCs[myPCind].PT.velocity.x =
            Math.sin((Math.PI * move_rad) / 180) * move_scale;
          PCs[myPCind].PT.velocity.z =
            Math.cos((Math.PI * move_rad) / 180) * move_scale;
        }
      }
    } else {
      PCs[myPCind].PT.velocity.x *= 0.5;
      PCs[myPCind].PT.velocity.z *= 0.5;
    }
    if (mouse_down) {
      props.socket.emit("fire", {
        T: PCs[myPCind].PT,
        weapon_id: PCs[myPCind].PT.weapon_ids.main,
      });
    }
    props.socket.emit("syncT", PCs[myPCind].PT);
    fovcos += 0.01;
    camera.fov = (Math.cos(fovcos) + 1) * 5 + 40;
    camera.updateProjectionMatrix();
    if (PCs[myPCind].model) camera.lookAt(PCs[myPCind].model.position);
    renderer.render(scene, camera); // レンダリング
    requestAnimationFrame(tick);
  }
});
</script>

<style scoped>
img {
  position: absolute;
  z-index: 2;
  width: 60%;
  left: 20%;
  top: 20%;
}
hud_view {
  position: absolute;
  z-index: 1;
}
canvas {
  position: absolute;
  top: 0;
  z-index: 0;
  overflow: hidden;
}
deathmatch_data_stream {
  display: none;
}
</style>

<template>
  <img src="../assets/ozisanoffense_logo.png" alt="title_wall" v-if="!loaded" />
  <hud_view />
  <canvas id="main_canvas" />
</template>
