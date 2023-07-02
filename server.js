var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname+'/public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname+'/public/index.html');
});
server.listen(8083, ()=>console.log(`Listening on port 8083`));
const io = require('socket.io')(server);
console.log("io loaded")
io.on('connection', function(socket){
  console.log('A user connected');
  socket.on('PLdata', function(msg){
    console.log(msg);
  });
});
