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
const PLstartPositions=[[10,0,0,0],[7,0,0,0],[10,0,7,0],[7,0,-7,0],[7,0,14,0],[7,0,-14,0],[-7,0,14,0],[-7,0,-14,0]];

ipToID.set("0",PLs.length);
var startposi=PLstartPositions[PLs.length%PLstartPositions.length];
PLs.push(["0",PLs.length,1,100,startposi]);

io.on('connection', function(socket){
  var ip= socket.handshake.address;
  if(ip=="::ffff:127.0.0.1")ip="::1";
  console.log('connected',ip);
  var room="0";
  if(! ipToID.has(ip)){
    ipToID.set(ip,PLs.length);
    var startposi=PLstartPositions[PLs.length%PLstartPositions.length];
    PLs.push([room,PLs.length,-1,100,startposi]);
    io.to(room).emit('PLnull', PLs[ipToID.get(ip)]);
  }
  var ID= ipToID.get(ip);
  socket.join(room);
  if(PLs[ID][2]==-1) io.to(socket.id).emit('reqType', null);
  else io.to(socket.id).emit('adopt', [ID, PLs]);

  socket.on('setType',(type)=>{
      PLs[ID][2]=type;
    if(type!=null && type>=0 && 3>type){
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
    PLs[data[0]][3]=data[1]
    io.to(room).emit('downHP', data);
  });
});
