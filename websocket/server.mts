import http from "http";
import { Server, Socket } from "socket.io";
const server: http.Server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    credentials: true
  }
});
const port = 8081;
server.listen(port, () => console.log("app listening on port " + port));

// player : P
// room : R
// session : S
// status : T
// index : ind
// selected : slctd

// 有効なルーム群
let Rlist: RT[] = [];
//所謂セッション PsT
let PsS: PS[] = [];

function get_start_position(ind: number) {
  const start_positions: position[] = [
    { x: 25, y: 0, z: 0, y_rotation: 0, gyokaku: 0 },
    { x: 12, y: 0, z: 0, y_rotation: 0, gyokaku: 0 },
    { x: 8, y: 0, z: 0, y_rotation: 0, gyokaku: 0 },
    { x: 25, y: 0, z: 7, y_rotation: 0, gyokaku: 0 },
    { x: 12, y: 0, z: 7, y_rotation: 0, gyokaku: 0 },
    { x: 8, y: 0, z: 7, y_rotation: 0, gyokaku: 0 },
    { x: 25, y: 0, z: 14, y_rotation: 0, gyokaku: 0 },
    { x: 12, y: 0, z: 14, y_rotation: 0, gyokaku: 0 },
    { x: 8, y: 0, z: 14, y_rotation: 0, gyokaku: 0 },
  ];
  return start_positions[ind % start_positions.length];
}

Rlist.push({
  Rid: "0",
  PsT: [{
    id: "npc_0",
    side: 0,
    weapon_ids: [0],
    health: 0,
    position: {
      x: 0,
      y: 0,
      z: 0,
      y_rotation: 0,
      gyokaku: 0
    },
    spawn_point: get_start_position(0),
    kill: 0,
    death: 0,
    alive: false,
    siting: false
  }],
  map: "origin",
  mode: "deathmatch",
});
PsS.push({
  id: "npc_0",
  ip: "npc",
  R: "0",
  connection: true,
});

io.on(
  "connection",
  function (socket: {
    handshake: { address: any };
    join: (arg0: string) => void;
    id: any;
    on: (
      arg0: string,
      arg1: {
        (type: any): void;
        (posi: any): void;
        (cam_gyokaku: any): void;
        (data: any): void;
        (T: any): void;
      }
    ) => void;
  }) {
    let ip =
      socket.handshake.address != "::ffff:127.0.0.1"
        ? socket.handshake.address
        : "::1";
    console.log("detection", ip);
    let PSind = PsS.findIndex((d) => d.ip == ip);
    if (PSind != -1) {
      if (
        Rlist.findIndex(
          (d) =>
            d.Rid == PsS[PSind].R &&
            d.PsT.findIndex((p) => p.id == PsS[PSind].id) != -1
        ) != -1
      ) {
        socket.join(PsS[PSind].R);
      } else PsS[PSind].R = "&lobby";
      console.log("reconnected", ip);
      io.to(socket.id).emit("reconnection", PsS[PSind].id, PsS[PSind].R);
    } else {
      console.log("req_connection", ip);
      io.to(socket.id).emit("req_connection");
    }

    socket.on("login", (id: string) => {
      // いづれここでパスワード認証
      PsS.push({
        id: id,
        ip: ip,
        R: "&lobby",
        connection: true,
      });
      let PSind = PsS.findIndex((d) => d.ip == ip);
      if (PSind != -1) {
        socket.join(PsS[PSind].R);
        console.log("login_success", ip);
        io.to(socket.id).emit("login_success", PsS[PSind].id, PsS[PSind].R);
      } else console.error("PsS.pushエラー", PsS);
    });
    socket.on("getRlist", () => {
      console.log("vomitRlist", ip);
      io.to(socket.id).emit("vomitRlist", Rlist);
    });
    socket.on("selectR", (Rid: string) => {
      let PSind = PsS.findIndex((d) => d.ip == ip);
      if (PSind != -1) {
        let slctdRind = Rlist.findIndex((d) => d.Rid == Rid);
        if (slctdRind != -1) {
          if (Rlist[slctdRind].PsT.length < 20) {
            if (Rlist[slctdRind].mode == "deathmatch") {
              Rlist[slctdRind].PsT.push({
                id: PsS[PSind].id,
                side: Rlist[slctdRind].PsT.length,
                weapon_ids: [-1],
                health: 0,
                position: {
                  x: 0,
                  y: 0,
                  z: 0,

                  y_rotation: 0,
                  gyokaku: 0,
                },
                spawn_point: get_start_position(Rlist[slctdRind].PsT.length),
                kill: 0,
                death: 0,
                alive: false,
                siting: false,
              });
              console.log("Rsuccess", ip);
              io.to(socket.id).emit("Rsuccess", Rlist[slctdRind].PsT);
            } else {
              Rlist[slctdRind].PsT.push({
                id: PsS[PSind].id,
                side:
                  Rlist[slctdRind].PsT.filter((d) => d.side == 0).length <=
                  Rlist[slctdRind].PsT.length / 2
                    ? 0
                    : 1,
                weapon_ids: [-1],
                health: 0,
                position: {
                  x: 0,
                  y: 0,
                  z: 0,

                  y_rotation: 0,
                  gyokaku: 0,
                },
                spawn_point: get_start_position(Rlist[slctdRind].PsT.length),
                kill: 0,
                death: 0,
                alive: false,
                siting: false,
              });
              console.log("Rsuccess", ip);
              io.to(socket.id).emit("Rsuccess", Rlist[slctdRind].PsT);
            }
          } else {
            console.log("Rfalse", ip);
            io.to(socket.id).emit(
              "Rfalse",
              "おっと！ルームの人数がいっぱいのようです。"
            );}
        } else{
          console.log("Rfalse", ip);
          io.to(socket.id).emit(
            "Rfalse",
            "おっと！ルームが存在しないようです。"
          );}
      } else {
        console.log("login_false", ip);
        io.to(socket.id).emit("login_false", "ログインしてください。");
      }
    });
    socket.on("syncT", (T: PT) => {
      let PSind = PsS.findIndex((d) => d.ip == ip);
      if (PSind != -1) {
        let slctdRind = Rlist.findIndex((d) => d.Rid == PsS[PSind].R);
        if (slctdRind != -1) {
          let RPsTind = Rlist[slctdRind].PsT.findIndex((d) => d.id == T.id);
          if (RPsTind > 0) {
            Rlist[slctdRind].PsT[RPsTind] = T;
            io.to(socket.id).emit("syncT", Rlist[slctdRind].PsT);
          } else console.error("slctdR.PsTとPsSに整合性の疑義");
        } else{
          console.log("Rfalse", ip);
          io.to(socket.id).emit(
            "Rfalse",
            "おっと！あなたはこのルームに存在しないようです。"
          );}
      } else io.to(socket.id).emit("login_false", "ログインしてください。");
    });
    socket.on("spawn", (T: PT) => {
      let PSind = PsS.findIndex((d) => d.ip == ip);
      if (PSind != -1) {
        let slctdRind = Rlist.findIndex((d) => d.Rid == PsS[PSind].R);
        if (slctdRind != -1) {
          let RPsTind = Rlist[slctdRind].PsT.findIndex(
            (d) => d.id == PsS[PSind].id
          );
          if (RPsTind > 0) {
            Rlist[slctdRind].PsT[RPsTind] = T;
            io.in(Rlist[slctdRind].Rid).emit(
              "spawn",
              Rlist[slctdRind].PsT[RPsTind]
            );
          } else console.error("slctdR.PsTとPsSに整合性の疑義");
        } else
          io.to(socket.id).emit(
            "Rfalse",
            "おっと！あなたはこのルームに存在しないようです。"
          );
      } else io.to(socket.id).emit("login_false", "ログインしてください。");
    });
    socket.on("fire", (arg: { T: PT; weapon_id: number }) => {
      let PSind = PsS.findIndex((d) => d.ip == ip);
      if (PSind != -1) {
        let slctdRind = Rlist.findIndex((d) => d.Rid == PsS[PSind].R);
        if (slctdRind != -1) {
          let RPsTind = Rlist[slctdRind].PsT.findIndex(
            (d) => d.id == PsS[PSind].id
          );
          if (RPsTind > 0) {
            io.to(socket.id).emit("fire", {
              T: arg.T,
              weapon_id: arg.weapon_id,
            });
          } else console.error("slctdR.PsTとPsSに整合性の疑義");
        } else
          io.to(socket.id).emit(
            "Rfalse",
            "おっと！あなたはこのルームに存在しないようです。"
          );
      } else io.to(socket.id).emit("login_false", "ログインしてください。");
    });
    socket.on("disconnect", () => {
      let PSind = PsS.findIndex((d) => d.ip == ip);
      if (PSind != -1) {
        console.log("disconnected", ip);
        PsS[PSind].connection = false;
      }
    });
  }
);
