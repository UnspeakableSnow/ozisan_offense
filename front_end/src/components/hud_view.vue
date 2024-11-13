<script setup lang="ts">
import { defineProps } from "vue";
import { PT } from "@/@types/types";
const props = defineProps<{
  hud_data: { PT: PT; ammo: number; reloading_progress: number };
  debug_data: (string | number)[][];
}>();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#debug_bar {
  position: absolute;
  top: 10vh;
  left: 0;
  z-index: 1;
  background-color: #000;
  user-select: none;
}
#reticle,
#cycle_icon {
  position: absolute;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  z-index: 1;
  user-select: none;
  pointer-events: none;
}
#youdead div {
  position: absolute;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
  text-align: center;
  justify-content: center;
  user-select: none;
  pointer-events: none;
}
#youdead div h1 {
  margin: 0;
}
#youdead {
  position: absolute;
  font-family: serif;
  font-size: 4vw;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f005;
}
#main_hud {
  position: absolute;
  top: 1vh;
  left: 1vw;
  border-radius: 5px;
  padding: 10px;
  background-color: #f0f5;
  z-index: 1;
}
</style>

<template>
  <div id="debug_bar">
    <p v-for="(d, i) in props.debug_data" :key="i">{{ d[0] }}：{{ d[1] }}</p>
  </div>
  <div id="youdead" v-if="props.hud_data.PT.alive">
    <div>
      <h1>You Dead!</h1>
      <p>press "f" to respawn</p>
    </div>
  </div>
  <p id="main_hud" v-if="props.hud_data.PT">
    health : {{ props.hud_data.PT.health }}<br />
    ammo : {{ props.hud_data.ammo }}<br />
    {{
      Math.floor(Math.cos(props.hud_data.reloading_progress * 15) * 100) / 200 +
      0.5
    }}
  </p>
  <img src="@/assets/nc148346.png" alt="" id="reticle" />
  <img
    src="@/assets/cycle_icon.png"
    alt=""
    id="cycle_icon"
    :style="
      'opacity: ' +
      (props.hud_data.reloading_progress > 0
        ? Math.floor(Math.cos(props.hud_data.reloading_progress * 15) * 100) /
            200 +
          0.5
        : 0) +
      ';'
    "
  />
</template>
