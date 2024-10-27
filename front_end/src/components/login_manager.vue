<!-- ログイン処理 -->
<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { Socket } from "socket.io-client";

const props = defineProps<{
  socket: Socket;
}>();
const emits = defineEmits<{
  (e: "vomit_idAR", id: string, R: string): void;
}>();

const id = ref("");

props.socket.on("login_success", (id: string, R: string) => {
  emits("vomit_idAR", id, R);
});
</script>

<style scoped>
label,
input {
  margin: 10px;
}
</style>

<template>
  <h2>ログイン（ダミー）</h2>
  <form class="frame" @submit.prevent="socket.emit('login', id)">
    <label>IDを入力してください：</label>
    <input type="text" v-model="id" />
    <input type="submit" />
  </form>
</template>
