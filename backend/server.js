require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose');
// const path = require('path');
const app = express();
// const port = process.env.PORT || 5000;

//config
app.use(cors());
app.use(express.json());


//Connects backend server to mongoDB server
// const uri = process.env.ATLAS_URI;
//mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true });
// const connection = mongoose.connection;
// connection.once('open', () => {
//     console.log("MongoDB database connection established successfully");
// });

const server = app.listen(80, () => {
    console.log('listening on port 80')
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    let roomId = '';
    console.log('connect')
    socket.on('join', (data) => {
        roomId = data.roomId;
        socket.join(roomId);

    });
    socket.on('pause', (data) => {
        socket.to(roomId).broadcast.emit('pause');
        console.log('pause in ' + roomId);
    });
    socket.on('play', (data) => {
        socket.to(roomId).broadcast.emit('play', data);
        console.log('play in ' + roomId);
    });
    socket.on('disconnect', () => {
    });
});