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

io.sockets.on('connection', function(socket) {
    console.log('socket connected');

    socket.on('hello', function(data) {
        console.log(`welcome ${data.name}`);
    })
});

