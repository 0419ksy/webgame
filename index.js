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

io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
   
    Player.onConnect(socket);
   
    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });


});

setInterval(function () {
    var pack =  {
        player: Player.update(),
    }

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }
}, 1000 / 25);