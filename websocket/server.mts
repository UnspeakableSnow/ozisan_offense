import http from "http";
import { Server, Socket } from "socket.io";
const server: http.Server = http.createServer();
const socketOptions = {
  cors: {
    origin: "http://192.168.11.17:8080",
    // origin: "https://",
    credentials: true
  },
};
const io = new Server(server, socketOptions);

const port = 8081;
server.listen(port, () => console.log("app listening on port " + port));

// player : P
// room : R
// session : S
// status : T
// index : ind
// selected : slctd

// 有効なルーム群
const Rs: RT[] = [];
//所謂セッション PTs
const PSs: PS[] = [];

function makePT(id: string, side: number, ind: number) {
  const start_positions: position[] = [
    { x: 2500, y: 0, z: 0,    y_rotation: 0, elevation_angle: 0 },
    { x: 1200, y: 0, z: 0,    y_rotation: 0, elevation_angle: 0 },
    { x: 800,  y: 0, z: 0,    y_rotation: 0, elevation_angle: 0 },
    { x: 2500, y: 0, z: 700,  y_rotation: 0, elevation_angle: 0 },
    { x: 1200, y: 0, z: 700,  y_rotation: 0, elevation_angle: 0 },
    { x: 800,  y: 0, z: 700,  y_rotation: 0, elevation_angle: 0 },
    { x: 2500, y: 0, z: 1400, y_rotation: 0, elevation_angle: 0 },
    { x: 1200, y: 0, z: 1400, y_rotation: 0, elevation_angle: 0 },
    { x: 800,  y: 0, z: 1400, y_rotation: 0, elevation_angle: 0 },
  ];
  const PTdata: PT = {
    id: id,
    side: side,
    weapon_ids: { main: "desert_eagle" },
    health: 0,
    position: start_positions[ind % start_positions.length],
    velocity: {
      x: 0,
      y: 0,
      z: 0,
      y_rotation: 0,
      elevation_angle: 0,
    },
    spawn_point: start_positions[ind % start_positions.length],
    kill: 0,
    death: -1,
    alive: true,
    sitting: false,
    running: false,
  };
  return PTdata;
}

io.on(
  "connection",
  function (socket: Socket) {
    console.log(socket.id);
    const got_address = typeof socket.handshake.headers["true-client-ip"] === "string" ? socket.handshake.headers["true-client-ip"] : "::ffff:127.0.0.1";
    const ip = got_address != "::ffff:127.0.0.1" ? got_address : "::1";
    let id: string | undefined;
    // const PSind = PSs.findIndex((d) => d.ip === ip);
    // if (PSind != -1) {
    //   const reconnectRind = Rs.findIndex(
    //     (d) => d.Rid === PSs[PSind].R && d.PTs.findIndex((p) => p.id === PSs[PSind].id) != -1
    //   );
    //   if (reconnectRind != -1) {
    //     socket.join(PSs[PSind].R);
    //     io.to(socket.id).emit("reconnectionR", Rs[reconnectRind]);
    //   } else PSs[PSind].R = "&lobby";
    //   console.log("reconnected", ip);
    //   io.to(socket.id).emit("reconnection", PSs[PSind].id, PSs[PSind].R);
    // } else {
    //   console.log("req_connection", ip);
    //   io.to(socket.id).emit("req_connection");
    // }
    console.log("req_connection", ip);
    io.to(socket.id).emit("req_connection");

    socket.on("login", (got_id: string) => {
      // いづれここでパスワード認証
      if (PSs.findIndex((PS) => PS.id === got_id) === -1) {
        PSs.push({
          id: got_id,
          ip: ip,
          R: "&lobby",
          connection: true,
        });
      }
      const PSind = PSs.findIndex((PS) => PS.id === got_id);
      if (PSind !== -1) {
        PSs[PSind].connection = true;
        socket.join(PSs[PSind].R);
        console.log("change_room", PSs[PSind].id, "to", PSs[PSind].R, " rooms is", socket.rooms);
        id = PSs[PSind].id;
        console.log("login_success", id);
        io.to(socket.id).emit("login_success", PSs[PSind]);
        if (PSs[PSind].R.charAt(0) !== "&") {
          const reconnectRind = Rs.findIndex(
            (R) => R.Rid === PSs[PSind].R && R.PTs.findIndex((PT) => PT.id === id) != -1
          );
          if (reconnectRind !== -1) {
            io.to(socket.id).emit("reconnectionR", Rs[reconnectRind]);
          } else {
            socket.leave(PSs[PSind].R);
            PSs[PSind].R = "&lobby"
            socket.join(PSs[PSind].R);
            io.to(socket.id).emit("Rfalse", "以前のマッチは終了しました。");
          }
        }
      } else console.error("PSs.pushエラー", PSs);
    });
    socket.on("getRs", () => {
      if (id) {
        console.log("vomitRs", id);
        io.to(socket.id).emit("vomitRs", Rs);
      }
    });
    socket.on("createR", (arg: { Rid: string, map: string, mode: string }) => {
      const PSind = PSs.findIndex((PS) => PS.id === id);
      if (PSind != -1) {
        if (PSs[PSind].R.charAt(0) === "&" || Rs.findIndex((R) => R.Rid === PSs[PSind].R) === -1) {
          const slctdRind = Rs.findIndex((d) => d.Rid === arg.Rid);
          if (slctdRind === -1 && arg.map === "origin" && (arg.mode === "deathmatch" || arg.mode === "team_deathmatch")) {
            const npcsT:PT[] = []
            for (let i = 0; i < 13; i++){
              npcsT.push(makePT("npc_" + npcsT.length.toString(), npcsT.length, npcsT.length));
            }
            Rs.push({
              Rid: arg.Rid,
              map: arg.map,
              mode: arg.mode,
              PTs: [],
              nPTs: npcsT
            });
            io.emit("vomitRs", Rs);
          } else {
            console.log("重複Rfalse", id, arg);
            io.to(socket.id).emit("Rfalse", "重複したid、存在しないmap、modeを検出");
          }
        } else {
          io.to(socket.id).emit("Rfalse", "ブラウザを更新してください。");
        }
      } else {
        console.log("login_false", ip);
        io.to(socket.id).emit("login_false", "ログインしてください。");
      }
    });
    socket.on("selectR", (Rid: string) => {
      const PSind = PSs.findIndex((PS) => PS.id === id);
      if (PSind != -1) {
        if (PSs[PSind].R.charAt(0) === "&" || Rs.findIndex((R) => R.Rid === PSs[PSind].R) === -1) {
          const slctdRind = Rs.findIndex((d) => d.Rid === Rid);
          if (slctdRind != -1) {
            if (Rs[slctdRind].PTs.length < 20) {
              if (Rs[slctdRind].mode === "deathmatch") {
                Rs[slctdRind].PTs.push(
                  makePT(PSs[PSind].id, Rs[slctdRind].PTs.length, Rs[slctdRind].PTs.length)
                );
              } else {
                Rs[slctdRind].PTs.push(
                  makePT(
                    PSs[PSind].id,
                    Rs[slctdRind].PTs.filter((PT) => PT.side === 0).length <=
                      Rs[slctdRind].PTs.length / 2
                      ? 0
                      : 1,
                    Rs[slctdRind].PTs.length
                  )
                );
              }
              socket.leave(PSs[PSind].R);
              PSs[PSind].R = Rid;
              console.log("change_room", PSs[PSind].id, "to", PSs[PSind].R, " rooms is", socket.rooms);
              socket.join(PSs[PSind].R);

              Rs[slctdRind].nPTs.splice(0, 1);
              console.log("Rsuccess", id);
              io.to(socket.id).emit("Rsuccess", Rs[slctdRind]);
              
            } else {
              console.log("Rfalse", id);
              io.to(socket.id).emit("Rfalse", "おっと！ルームの人数がいっぱいのようです。");
            }
          } else {
            console.log("Rfalse", id);
            io.to(socket.id).emit("Rfalse", "おっと！ルームが存在しないようです。");
          }
        } else {
          io.to(socket.id).emit("Rsuccess", PSs[PSind]);
          console.log("doubleRselect", id);
        }
      } else {
        console.log("login_false", ip);
        io.to(socket.id).emit("login_false", "ログインしてください。");
      }
    });
    socket.on("syncT", (arg: {time: number ,PT: PT}) => {
      const PSind = PSs.findIndex((PS) => PS.id === id);
      if (PSind != -1) {
        const slctdRind = Rs.findIndex((d) => d.Rid === PSs[PSind].R);
        if (slctdRind != -1) {
          const RPTsind = Rs[slctdRind].PTs.findIndex((d) => d.id === id);
          if (RPTsind != -1) {
            Rs[slctdRind].PTs[RPTsind] = arg.PT;
            io.to(socket.id).emit("syncT", {PTs: Rs[slctdRind].PTs, nPTs:Rs[slctdRind].nPTs, time:arg.time});
          } else console.error("slctdR.PTsとPSsに整合性の疑義");
        } else {
          console.log("Rfalse", id);
          io.to(socket.id).emit("Rfalse", "おっと！あなたはこのルームに存在しないようです。");
        }
      } else io.to(socket.id).emit("login_false", "ログインしてください。");
    });
    socket.on("npc_syncT", (T: PT) => {
      const PSind = PSs.findIndex((PS) => PS.id === id);
      if (PSind != -1) {
        const slctdRind = Rs.findIndex((d) => d.Rid === PSs[PSind].R);
        if (slctdRind != -1) {
          const RnPTsind = Rs[slctdRind].nPTs.findIndex((d) => d.id === T.id);
          if (RnPTsind != -1) {
            Rs[slctdRind].nPTs[RnPTsind] = T;
          } else console.error("slctdR.PTsとPSsに整合性の疑義");
        } else {
          console.log("Rfalse", id);
          io.to(socket.id).emit("Rfalse", "おっと！あなたはこのルームに存在しないようです。");
        }
      } else io.to(socket.id).emit("login_false", "ログインしてください。");
    });
    socket.on("spawn", (T: PT) => {
      const PSind = PSs.findIndex((PS) => PS.id === id);
      if (PSind != -1) {
        if (PSs[PSind].id === T.id) {
          const slctdRind = Rs.findIndex((d) => d.Rid === PSs[PSind].R);
          if (slctdRind != -1) {
            const RPTsind = Rs[slctdRind].PTs.findIndex((d) => d.id === PSs[PSind].id);
            if (RPTsind != -1) {
              Rs[slctdRind].PTs[RPTsind] = T;
              Rs[slctdRind].PTs[RPTsind].position = Rs[slctdRind].PTs[RPTsind].spawn_point;
              io.to(Rs[slctdRind].Rid).emit("spawn", Rs[slctdRind].PTs[RPTsind]);
            } else console.error("slctdR.PTsとPSsに整合性の疑義");
          } else io.to(socket.id).emit("Rfalse", "おっと！あなたはこのルームに存在しないようです。");
        }
      } else io.to(socket.id).emit("login_false", "ログインしてください。");
    });
    socket.on("fire", (arg: { T: PT; weapon_id: string; ammo_is: boolean; }) => {
      const PSind = PSs.findIndex((PS) => PS.id === id);
      if (PSind != -1) {
        const slctdRind = Rs.findIndex((d) => d.Rid === PSs[PSind].R);
        if (slctdRind != -1) {
          const RPTsind = Rs[slctdRind].PTs.findIndex((PT) => PT.id === id);
          if (RPTsind != -1) {
            io.to(PSs[PSind].R).emit("fire", {
              T: arg.T,
              weapon_id: arg.weapon_id,
              ammo_is: arg.ammo_is,
            });
          } else console.error("slctdR.PTsとPSsに整合性の疑義");
        } else io.to(socket.id).emit("Rfalse", "おっと！あなたはこのルームに存在しないようです。");
      } else io.to(socket.id).emit("login_false", "ログインしてください。");
    });
    socket.on("disconnect", () => {
      const PSind = PSs.findIndex((PS) => PS.id === id);
      if (PSind != -1) {
        console.log("disconnected", id);
        PSs[PSind].connection = false;
      }
    });
  }
);
