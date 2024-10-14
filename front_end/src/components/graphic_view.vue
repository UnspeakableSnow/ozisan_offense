<!-- ゲーム画面表示、ゲーム内データストリーム管理 -->
<script setup lang="ts">
import { onMounted } from "vue";
import hud_view from "./hud_view.vue";
import deathmatch_data_stream from "./deathmatch_data_stream.vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Socket } from "socket.io-client";
const width = 960;
const height = 540;

onMounted(() => {
  console.log("loaded");
  const canvas = document.getElementById("main_canvas") as HTMLCanvasElement;
  console.log(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  const scene = new THREE.Scene();
  const loadergltf = new GLTFLoader();

  const camera = new THREE.PerspectiveCamera(45, width / height);
  camera.position.set(0, 0, +1000);

  const geometry = new THREE.BoxGeometry(400, 400, 400);
  const material = new THREE.MeshNormalMaterial();
  const box = new THREE.Mesh(geometry, material);
  scene.add(box);

  tick();
  function tick() {
    box.rotation.y += 0.01;
    renderer.render(scene, camera); // レンダリング
    requestAnimationFrame(tick);
  }
});
</script>

<style scoped>
label,
input {
  margin: 10px;
}
</style>

<template>
  <hud_view />
  <canvas id="main_canvas" />
  <deathmatch_data_stream />
</template>
