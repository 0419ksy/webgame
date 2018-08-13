const express = require('express');
const app = express();
const server = require('http').Server(app);

app.use('/client', express.static(__dirname + '/client'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
})

server.listen(8888, function() {
    console.log('start at 8888');
})

var io = require('socket.io') (server, {});

var SOCKET_LIST = {};

io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    socket.x = 0;
    socket.y = 0;
    socket.number = "" + Math.floor(10 * Math.random());
    SOCKET_LIST[socket.id] = socket;

    socket.on('disconnect', function() {
        delete SOCKET_LIST[socket.id];
    });
});

setInterval(function() {
    var pack = [];
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.x++;
        socket.y++;
        pack.push({
            x:socket.x,
            y:socket.y,
            number: socket.number
        });
    }
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }
}, 1000/25);