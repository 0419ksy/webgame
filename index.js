const express = require('express');
const app = express();
const server = require('http').Server(app);

app.use('/client', express.static(__dirname + '/client'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
})

server.listen(8888, function () {
    console.log('start at 8888');
})

var io = require('socket.io')(server, {});

var SOCKET_LIST = {};

var Entity = function () {
    var self = {
        x: 250,
        y: 250,
        spdX : 0,
        spdY: 0,
        id:"",
    }
    self.update = function() {
        self.updatePosition();
    }
    self.updatePosition = function () {
        self.x += self.spdX;
        self.y += self.spdY;
    }

    return self;
}

var Player = function (id) {
    var self = Entity();
    self.id= id;
    self.number="" + Math.floor(10 * Math.random());
    self. pressRight= false;
    self.pressLeft= false;
    self.pressUp=false;
    self.pressDown= false;
    self.speed= 5;

    var super_update = self.update;

    self.update = function () {
        self.updateSpeed();
        super_update();
    }

        
    self.updateSpeed = function () {
        if (self.pressRight)
            self.spdX = self.speed;
        else if (self.pressLeft)
            self.spdX = -self.speed;
        else
            self.spdX = 0;
        
        if (self.pressUp)
            self.spdY = -self.speed;
        else if (self.pressDown)
            self.spdY = self.speed;
        else
            self.spdY = 0;
    }
    Player.list[id] = self;
    return self;
}
Player.list = {};

Player.onConnect = function (socket) {
    var player = Player(socket.id);

    socket.on('keyPress', function (data) {
        if (data.inputId === 'left')
            player.pressLeft = data.state;
        if (data.inputId === 'right')
        player.pressRight = data.state;
        if (data.inputId === 'up')
            player.pressUp = data.state;
        if (data.inputId === 'down')
        player.pressDown = data.state;
    });
}

Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
}

Player.update = function () {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();

        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }

    return pack;
}

var Bullet = function(angle){
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;
   
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();
    }
    Bullet.list[self.id] = self;
    return self;
}
Bullet.list = {};
 
Bullet.update = function(){
    if(Math.random() < 0.1){
        Bullet(Math.random()*360);
    }
   
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        pack.push({
            x:bullet.x,
            y:bullet.y,
        });    
    }
    return pack;
}

var DEBUG = true;

io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
   
    Player.onConnect(socket);
   
    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMsgToServer',function(data){
        var playerName = ("" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
        }
    });
   
    socket.on('evalServer',function(data){
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);     
    });

});

setInterval(function () {
    var pack =  {
        player: Player.update(),
        bullet:Bullet.update(),
    }

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }
}, 1000 / 25);