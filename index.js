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
var player_list = {};

var Player = function (id) {
    var self = {
        x: 250,
        y: 250,
        id: id,
        number: "" + Math.floor(10 * Math.random()),
        pressRight: false,
        pressLeft: false,
        pressUp: false,
        pressDown: false,
        speed: 10,
    }
    self.updatePosition = function () {
        if (self.pressRight)
            self.x += self.speed;
        if (self.pressLeft)
            self.x -= self.speed;
        if (self.pressUp)
            self.y -= self.speed;
        if (self.pressDown)
            self.y += self.speed;
    }
    return self;
}
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    socket.x = 0;
    socket.y = 0;
    socket.number = "" + Math.floor(10 * Math.random());
    SOCKET_LIST[socket.id] = socket;

    var player = Player(socket.id);
    player_list[socket.id] = player;

    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        delete player_list[socket.id];
    });

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
});

setInterval(function () {
    var pack = [];
    for (var i in player_list) {
        var player = player_list[i];
        player.updatePosition();
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }
}, 1000 / 25);