require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const roomRouter = require('./routes/room');
const app = express();
const port = process.env.PORT || 5000;

//config
app.use(cors());
app.use(express.json());
app.use('/room', roomRouter);
app.use(express.static(path.join(__dirname, '../frontend/scripts')));


//Connects backend server to mongoDB server
const uri = process.env.ATLAS_URI;
//mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});

app.get('/:id', (req,res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "index.html"))
});

//Listens on port 5000 and 80(for sockets)
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
const server = app.listen(80, () => {
    console.log('listening on port 80')
});

const io = require('socket.io')(server);


let rooms = {};

io.on('connection', (socket) => {
    let roomId = '';
    
    socket.on('join', (data) => {
        roomId = data.roomId;
        if(!rooms[roomId]) rooms[roomId] = {people: 1, pause: 0, play: 0}
        else rooms[roomId].people++;
        console.log(rooms[roomId]);
        socket.join(roomId);
    });
    socket.on('pause', (data) => {
        let room = rooms[roomId];
        room.pause++;
        if(room.pause < room.people && room.pause > 1) {return}
        if(room.pause === room.people) {room.pause = 0; return}
        socket.to(roomId).broadcast.emit('pause');
        console.log('pause in ' + roomId);
    });
    socket.on('play', (data) => {
        let room = rooms[roomId];
        room.play++;
        if(room.play < room.people && room.play > 1) {return}
        if(room.play === room.people) {room.play = 0; return}
        socket.to(roomId).broadcast.emit('play', data);
        console.log('play in ' + roomId);
    });
    socket.on('disconnect', () => {
        rooms[roomId].people--;
        console.log(rooms[roomId]);
    });
});