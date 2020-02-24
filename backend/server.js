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

const resources = {
    rooms: {}
}

io.on('connection', (socket) => {
    let roomId = '';
    let userId = getRandomID();
    let rooms = resources.rooms;
    console.log('connect');
    socket.on('join', (data, fn) => {
        roomId = data.roomId;
        socket.join(roomId);

        if (rooms[roomId]) {
            let room = rooms[roomId];
            room.push({
                id: userId,
                host: false
            });
            //notify new user join
            socket.to(roomId).broadcast.emit('userjoin', { id: userId });
            console.log(rooms[roomId]);
        }
        else {
            //initialize new room
            rooms[roomId] = [{
                id: userId,
                host: true
            }];
        }
        let response = {
            users: rooms[roomId],
            time: 0 //todo
        }
        fn(response);
    });
    socket.on('pause', () => {
        socket.to(roomId).broadcast.emit('pause');
        console.log('pause in ' + roomId);
    });
    socket.on('play', (data) => {
        socket.to(roomId).broadcast.emit('play', data);
        console.log('play in ' + roomId);
    });
    socket.on('seek', (data) => {
        socket.to(roomId).broadcast.emit('seek', data);
        console.log('seek in ' + roomId);
    });
    socket.on('disconnect', () => {
        //user leaves
        let room = rooms[roomId];
        if (!room) return;
        for (let i = 0; i < room.length; i++) {
            if (room[i].id === userId) {
                //remove user
                room.splice(i, 1);
                socket.to(roomId).broadcast.emit('userleft', { id: userId });
                break;
            }
        }
        if (room.length == 0) {
            //delete empty room
            delete rooms[roomId];
            return;
        }
        if(!room[0].host){
            room[0].host = true;
        }
    });
});

const getRandomID = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}