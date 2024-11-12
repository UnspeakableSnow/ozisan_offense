<!-- フレーム全体管理 -->
<script setup lang="ts">
import { ref } from "vue";
import login_manager from "./components/login_manager.vue";
import room_access from "./components/room_access.vue";
import graphic_view from "./components/graphic_view.vue";
import type { PS, RT } from "@/@types/types";
import { io } from "socket.io-client";
// const socket = io("http://localhost:8081", {
//   withCredentials: true,
// });
const socket = io("https://ozisan-offense.onrender.com");

const myPS = ref<PS>({
  id: "",
  R: "",
  connection: false,
});
const in_nowRT = ref<RT>();

socket.on("reconnection", (id: string, R: string) => {
  myPS.value.id = id;
  myPS.value.R = R;
  myPS.value.connection = true;
});
socket.on("reconnectionR", (R: RT) => {
  in_nowRT.value = R;
});
socket.on("login_false", (message: string) => {
  alert(message);
  myPS.value = {
    id: "",
    R: "",
    connection: false,
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
</style>

<template>
  <login_manager
    v-if="!myPS.connection"
    :socket="socket"
    @vomit_idAR="(id: string, R: string) => { myPS.id = id; myPS.R = R; myPS.connection = true; }"
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
