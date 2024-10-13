export type position = {
  x: number;
  y: number;
  z: number;
  y_rotation: number;
  gyokaku: number;
};
export type PS = {
  id: string;
  R: string;
  connection: boolean;
};
export type PT = {
  id: string;
  side: number;
  weapon_ids: [number];
  health: number;
  position: position;
  spawn_point: position;
  kill: number;
  death: number;
  alive: boolean;
  siting: boolean;
};
export type RT = {
  Rid: string;
  map: string;
  mode: "deathmatch" | "team_deathmatch";
  PsT: PT[];
};
