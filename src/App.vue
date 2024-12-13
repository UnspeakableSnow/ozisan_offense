<!-- フレーム全体管理 -->
<script setup lang="ts">
import { ref } from "vue";
import login_manager from "./components/login_manager.vue";
import room_access from "./components/room_access.vue";
import graphic_view from "./components/graphic_view.vue";
import type { PS, RT } from "@/@types/types";
import { io } from "socket.io-client";
// const socket = io("http://192.168.11.17:8081", {
const socket = io("https://ozisan-offense.onrender.com", {
  withCredentials: true,
});

const myPS = ref<PS>({
  id: "",
  R: "",
  connection: false,
  ip: "",
});
const in_nowRT = ref<RT>();
const req_connection_got = ref<boolean>(false);

socket.on("reconnection", (id: string, R: string) => {
  myPS.value.id = id;
  myPS.value.R = R;
  myPS.value.connection = true;
});
socket.on("reconnectionR", (R: RT) => {
  in_nowRT.value = R;
});
socket.on("req_connection", (id: string, R: string) => {
  req_connection_got.value = true;
});
socket.on("login_false", (message: string) => {
  alert(message);
  myPS.value = {
    id: "",
    R: "",
    connection: false,
    ip: "",
  };
});
socket.on("Rfalse", (message: string) => {
  alert(message);
  myPS.value.R = "&lobby";
});
</script>

<style scoped>
body {
  border: double 10px #f0f;
}
#req_connection_got {
  position: absolute;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  z-index: 1;
  user-select: none;
  pointer-events: none;
}
</style>

<template>
  <h1 v-if="!req_connection_got" id="req_connection_got">
    サーバーとの接続に時間がかかっています...
  </h1>
  <login_manager
    v-if="!myPS.connection && req_connection_got"
    :socket="socket"
    @vomitPS="(PS: PS) => { myPS = PS; }"
  />
  <room_access
    v-else-if="myPS.R == '&lobby'"
    :socket="socket"
    @vomit_RT="(RT: RT) => { myPS.R = RT.Rid; in_nowRT = RT; }"
  />
  <graphic_view
    v-else-if="myPS.R.charAt(0) != '&' && in_nowRT"
    :socket="socket"
    :in_nowRT="in_nowRT"
    :id="myPS.id"
  />
</template>
