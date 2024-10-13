<!-- ルーム選択画面 -->
<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { Socket } from "socket.io-client";
import { RT, PT } from "@/types";

const props = defineProps<{
  socket: Socket;
}>();
const emits = defineEmits<{
  (e: "vomit_R", R: string): void;
}>();

const Rlist = ref<RT[]>([]);
props.socket.emit("getRlist");
props.socket.on("vomitRlist", (vomited_Rlist: RT[]) => {
  Rlist.value = vomited_Rlist;
});
props.socket.on("Rsuccess", (PsT: PT[]) => {
  // emits("vomit_R", );
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.bottom_main_text {
  margin: 0.6em;
  font-size: 1.5em;
  font-family: Arial, Helvetica, sans-serif;
  text-align: center;
}
.bottom_population_text {
  margin: 0;
  position: absolute;
  left: 0.8em;
  top: 0.3em;
  font-size: 1em;
}
.bottom_map_text {
  margin: 0;
  position: absolute;
  right: 0.8em;
  top: 0.3em;
  font-size: 1em;
}
.bottom_mode_text {
  margin: 0;
  font-size: 1em;
}
button {
  width: 90%;
  border-radius: 1em;
  text-align: center;
  position: relative;
  margin: 0.5em 5%;
}
</style>

<template>
  <div class="frame">
    {{ Rlist }}
  </div>
  <div class="frame">
    <button
      v-for="(R, i) in Rlist"
      :key="i"
      @click="props.socket.emit('selectR', R.Rid)"
    >
      <p class="bottom_population_text">{{ R.PsT.length }}/20</p>
      <p class="bottom_map_text">{{ R.map }}</p>
      <p class="bottom_main_text">{{ R.Rid }}</p>
      <p class="bottom_mode_text">{{ R.mode }}</p>
    </button>
  </div>
</template>
