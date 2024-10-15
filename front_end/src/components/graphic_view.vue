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

  window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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
        this.model.scale.set(108, 108, 108);
      } else if (this.PT.weapon_ids.main == "fn_fal") {
        this.model.scale.set(9180, 9180, 9180);
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

      if (this.PT.siting) {
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

      if (
        this.PT.velocity.x + this.PT.velocity.y + this.PT.velocity.z <
        0.00002
      ) {
        this.PT.position.x += this.PT.velocity.x;
        this.PT.position.y += this.PT.velocity.y;
        this.PT.position.z += this.PT.velocity.z;
        this.model.position.set(
          this.PT.position.x,
          this.PT.position.y,
          this.PT.position.z
        );
      }
      if (this.PT.velocity.x + this.PT.velocity.y + this.PT.velocity.z > 0.1) {
        this.anim_change("walk");
        poseflag = false;
      }
      this.PT.position.x_rotation += this.PT.velocity.x_rotation;
      this.PT.position.y_rotation += this.PT.velocity.y_rotation;
      this.PT.position.z_rotation += this.PT.velocity.z_rotation;
      this.model.position.set(
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
      this.PT.siting = false;
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
          this.action.setLoop(THREE.LoopRepeat, -1);
        }
        this.action.clampWhenFinished = true;
        this.action.play();
      }
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
  camera.position.set(0, 0, +500);

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
  let fovcos = 0;

  let PCs = [];
  in_nowRT.value.PsT.forEach((PT) => {
    PCs.push(new PCins(PT));
  });

  loaded.value = true;
  tick();
  function tick() {
    boxs.forEach((box) => {
      box.rotation.y += 0.05;
    });
    fovcos += 0.01;
    camera.fov = (Math.cos(fovcos) + 1) * 10 + 30;
    camera.updateProjectionMatrix();
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
