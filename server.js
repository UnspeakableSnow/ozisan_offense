var express = require('express');
const { start } = require('repl');
var app = express();
var server = require('http').createServer(app);
var port=8080;
const io = require('socket.io')(server, {
  cors: {
      origin: "http://localhost:8081",
      methods: ["GET", "POST"],
      transports: ['websocket', 'polling'],
      credentials: true
  },
  allowEIO3: true
});
app.use(express.static(__dirname+'/public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname+'/public/index.html');
});
server.listen(port, ()=>console.log(`Listening on port`, port));

ipToID= new Map([]);
PLs=[];
const PLstartPositions=[[25,0,0,0],[12,0,0,0],[25,0,7,0],[12,0,-7,0],[12,0,14,0],[12,0,-14,0],[8,0,14,0],[8,0,-14,0]];

ipToID.set("0",PLs.length);
var startposi=PLstartPositions[PLs.length%PLstartPositions.length];
PLs.push(["0",PLs.length,1,10,startposi,0,false]);

io.on('connection', function(socket){
  var ip= socket.handshake.address;
  if(ip=="::ffff:127.0.0.1")ip="::1";
  console.log('connected',ip);
  var room="0";
  if(! ipToID.has(ip)){
    ipToID.set(ip,PLs.length);
    PLs.push([room,PLs.length,-1,10,[0,0,0,0],0,false]); //部屋、ID、type、HP、posi、score、siting
    io.to(room).emit('PLnull', PLs[ipToID.get(ip)]);
  }
  var ID= ipToID.get(ip);
  var startposi=PLstartPositions[ID%PLstartPositions.length];
  socket.join(room);
  if(PLs[ID][2]==-1) io.to(socket.id).emit('reqType', null);
  else io.to(socket.id).emit('adopt', [ID, PLs]);

  socket.on('setType',(type)=>{
    if(type!=null && type>=0 && 3>type){
      PLs[ID][2]=type;
      console.log(ip,"selected",type);
      io.to(room).emit('append', PLs[ID]);
      io.to(socket.id).emit('adopt', [ID,PLs]);
    }else io.to(socket.id).emit('reqType', null);
  });

  socket.on('updata', function(posi){
    PLs[ID][4]=posi;
    io.to(room).emit('downdata', [ID,posi]);
  });

  socket.on('shot', function(cam_gyokaku){
    io.to(room).emit('creBul', [ID,cam_gyokaku]);
  });
  socket.on('upHP', function(data){
    PLs[data[0]][3]=data[1];
    if(PLs[data[0]][3]<=0){
      io.to(room).emit('deth', [data[0],PLstartPositions[data[0]%PLstartPositions.length]]);
      PLs[ID][5]++;
      io.to(room).emit('downscore', [ID,PLs[ID][5]]);
    }
    else  io.to(room).emit('downHP', data);
  });

  socket.on('upsit', function(status){
    PLs[ID][6]=status[0];
    io.to(room).emit('dowsit', [ID,status[0],status[1]]);
  });
});
