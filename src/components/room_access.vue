<!-- ルーム選択画面 -->
<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { Socket } from "socket.io-client";
import type { RT } from "@/@types/types";

const props = defineProps<{
  socket: Socket;
}>();
const emits = defineEmits<{
  (e: "vomit_RT", RT: RT): void;
}>();

const selectRid = ref("");
const select_map = ref("origin");
const select_mode = ref("deathmatch");
const Rs = ref<RT[]>([]);
const select_weapon = ref<{ main: "desert_eagle" | "fn_fal" | "g3" }>({
  main: "desert_eagle",
});
props.socket.emit("getRs");
props.socket.on("vomitRs", (vomited_Rs: RT[]) => {
  console.log(vomited_Rs);
  Rs.value = vomited_Rs;
});
props.socket.on("Rsuccess", (RT: RT) => {
  emits("vomit_RT", RT);
  console.log(RT);
});
function createR(selectRid: string, select_map: string, select_mode: string) {
  if (selectRid != "") {
    props.socket.emit("createR", {
      Rid: selectRid,
      map: select_map,
      mode: select_mode,
    });
  } else {
    alert("Ridは入力必須です。");
  }
}
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
h3 {
  margin: 5px 0;
}
button,
form {
  width: 90%;
  border-radius: 1em;
  text-align: center;
  position: relative;
  margin: 0.5em 5%;
}
form {
  border: solid 2px #0ff;
  padding: 5px;
}
#createRform {
  display: flex;
  justify-content: center;
}
#createRoptions {
  padding: 4px;
  text-align: left;
  margin: 0 10px;
}
</style>

<template>
  <div class="frame">
    <form @submit.prevent="createR(selectRid, select_map, select_mode)">
      <div id="createRform">
        <h3>部屋を作る</h3>
        <div id="createRoptions">
          Rid:<input type="text" v-model="selectRid" /><br />
          select_map:<select
            name="select_map"
            id="select_map"
            v-model="select_map"
          >
            <option value="origin">origin</option>
          </select>
          <br />
          select_mode:<select
            name="select_mode"
            id="select_mode"
            v-model="select_mode"
          >
            <option value="deathmatch">deathmatch</option>
            <option value="team_deathmatch">team_deathmatch</option>
          </select>
        </div>
        <input type="submit" />
      </div>
    </form>
    <form @submit.prevent="">
      <label for="desert_eagle">
        <input
          type="radio"
          name="select_weapon_main"
          v-model="select_weapon.main"
          value="desert_eagle"
          id="desert_eagle"
          checked
        />desert_eagle</label
      >
      <label for="fn_fal">
        <input
          type="radio"
          v-model="select_weapon.main"
          name="select_weapon_main"
          value="fn_fal"
          id="fn_fal"
        />fn_fal
      </label>
      <label for="g3">
        <input
          type="radio"
          v-model="select_weapon.main"
          name="select_weapon_main"
          value="g3"
          id="g3"
        />g3
      </label>
      <!-- ここにグレネードなど他の武器を足す -->
    </form>
    <button
      v-for="(R, i) in Rs"
      :key="i"
      @click="props.socket.emit('selectR', R.Rid, select_weapon)"
    >
      <p class="bottom_population_text">{{ R.PTs.length }}/20</p>
      <p class="bottom_map_text">{{ R.map }}</p>
      <p class="bottom_main_text">{{ R.Rid }}</p>
      <p class="bottom_mode_text">{{ R.mode }}</p>
    </button>
  </div>
</template>
