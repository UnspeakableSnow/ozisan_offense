type position = {
  x: number;
  y: number;
  z: number;
  y_rotation: number;
  elevation_angle: number;
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
  sitting: boolean;
  running: boolean;
};
type RT = {
  Rid: string;
  map: "origin";
  mode: "deathmatch" | "team_deathmatch";
  PTs: PT[];
  nPTs: PT[];
};
