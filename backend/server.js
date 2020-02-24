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

const createRoom = (roomId) => {
    resources.rooms[roomId] = {
        users : [],
        count : 0
    };
}

io.on('connection', (socket) => {
    let roomId = '';
    let rooms = resources.rooms;
    let userId = socket.id;
    console.log('connection');
    socket.on('join', (data, fn) => {
        roomId = data.roomId;
        socket.join(roomId);
        console.log(userId + ' has joined');
        //create in server. Will assume room always exists.
        if(!rooms[roomId]) createRoom(roomId);
        let room = rooms[roomId];
        room.count++;
        let user = {
            id: userId,
            name: 'User ' + room.count,
            host : false
        };
        if (room.users.length > 0) {
            //join existing room
            room.users.push(user);
            //notify new user join
            socket.to(roomId).broadcast.emit('userjoin', { id: userId, name: user.name });
            
            //request to obtain time from host
            let hostUser = room.users.find((x) => x.host);
            socket.to(hostUser.id).emit('timerequest', {id: userId});
        }
        else {
            //initialize new room
            user.host = true;
            room.users.push(user);
        }
        console.log(rooms);
        
        let response = {
            users: room.users,
            host: user.host,
            userId: userId
        };
        fn(response);
    });


    //respond to timerequest
    socket.on('timeresponse', (data) => {
        console.log('time response')
        let client = socket.to(data.id);
        if(data.isPlaying) {
           client.emit('play', {time: data.time});
        }
        else {
            client.emit('seekpause', {time: data.time});
        }
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
        for (let i = 0; i < room.users.length; i++) {
            if (room.users[i].id === userId) {
                //remove user
                room.users.splice(i, 1);
                socket.to(roomId).broadcast.emit('userleft', { id: userId });
                break;
            }
        }
        if (room.users.length === 0) {
            //delete empty room (no users)
            console.log('deleting room: ' + roomId);
            delete rooms[roomId];
            return;
        }

        //reassign host to next user
        if(!room.users[0].host){
            room.users[0].host = true;
        }
    });
});