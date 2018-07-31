const express = require('express');
const app = express();

app.listen(8888, function() {
    console.log('start at 8888');
});

app.get('/', function (req, res) {
    res.send('Hello');
})