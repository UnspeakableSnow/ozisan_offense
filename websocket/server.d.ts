type position = {
  x: number;
  y: number;
  z: number;
  x_rotation: number;
  y_rotation: number;
  z_rotation: number;
};
type PS = {
  id: string;
  ip: string;
  R: string;
  connection: boolean;
};
type PT = {
  id: string;
  side: number;
  weapon_ids: { main: "desert_eagle" | "fn_fal" | "g3" };
  health: number;
  position: position;
  velocity: position;
  spawn_point: position;
  kill: number;
  death: number;
  alive: boolean;
  siting: boolean;
  running: boolean;
};
type RT = {
  Rid: string;
  map: string;
  mode: "deathmatch" | "team_deathmatch";
  PsT: PT[];
};
