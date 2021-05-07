const express = require('express');
const usernameGenerator  = require('username-generator');
const cors = require('cors');
const path = require('path');
const app = express();
const youtube = require('./services/youtube');
// const youtube = require('./services/youtube-mock');
const jws = require('jws');
//config
app.use(cors());
app.use(express.json());
require('dotenv').config();
const JWS_SECRET = process.env.JWS_SECRET;

const server = app.listen(8080, () => {
    console.log('socket listening on port 8080')
});


app.listen(5000);
const io = require('socket.io')(server);

const generateID = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const resources = {
    rooms: {},
    usersOnline: { },
    createRoom : (roomId, hostUserId = null) => {
        resources.rooms[roomId] = {
            users : [], // [userId1, userId2, userId3]
            hostUserId: hostUserId,
            count : 0
        };
    }
}

const userUtils = {
    addFriend: (userId, friendUserId, callback) => {
        if (userId !== friendUserId) {
            const usersOnline = resources.usersOnline;
            const friends = usersOnline[userId].profile.friends; // friends of userId
            const userFriendIds = friends.map(friend => friend.userId);
            if (usersOnline[friendUserId] && !userFriendIds.includes(friendUserId)) {
                const friendUserProfile = usersOnline[friendUserId].profile;
                friends.push({
                    userId: friendUserProfile.userId,
                    name: friendUserProfile.name
                })
                callback && callback(true);
            }
        }
        callback && callback(false);
    },
    getSignedProfile: (userId) => {
        const profile = resources.usersOnline[userId].profile;
        return userUtils.signProfile(profile);
    },
    signProfile: (profile) => {
        const signature = jws.sign({
            header: { alg: 'HS256' },
            payload: profile,
            secret: JWS_SECRET,
        });
        return signature;
        //return JSON.stringify(profile);
    },
    parseProfile: (signed) => {
        const decoded = jws.decode(signed);
        return JSON.parse(decoded.payload);
        //return JSON.parse(signed);
    },
    createProfile: () => {
        let userId = generateID(12);
        return {
            userId: userId,
            name: usernameGenerator.generateUsername(),
            friends: []
        };
    },
    leaveRoom: (userId) => {
        const roomId = resources.usersOnline[userId].roomId;
        const room = resources.rooms[roomId];
        if (!room) return;
        
        room.users = room.users.filter(usrId => usrId !== userId);
        io.to(roomId).emit('userleft', userId);
        const socket = io.sockets.sockets[resources.usersOnline[userId].socketId];
        if (socket){
            socket.leave(roomId);
        }
        if (room.users.length === 0) {
            console.log('deleting room: ' + roomId);
            delete resources.rooms[roomId];
        } else if (room.hostUserId === userId) {
            room.hostUserId = room.users[0];
            console.log('old host is ' + userId);
            console.log('new host is ' + room.hostUserId);
        }
    }
}

app.get('/videos/search', (req, res) => {
    let { q, pageToken } = req.query;
    youtube.search(q, pageToken).then(response => {
        res.send(response);
    });
});
app.use(express.static('public'));
app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/room/create', (req, res) => {
    let roomId = null;
    while(!roomId || resources.rooms[roomId]){
        roomId = generateID(8)
    }
    resources.createRoom(roomId);
    res.send({
        id:roomId
    });
});

app.post('/room/checkid', (req,res) => {
    let id = req.body.id;
    let exists = false;
    if(resources.rooms[id]){
        exists = true;
    }
    res.send({
        exists
    });
});


io.on('connection', (socket) => {
    console.log('connection');
    const socketId = socket.id;
    const {usersOnline, rooms} = resources;
    let userId;

    socket.on('init', (data, fn) => {
        let profile;
        const response = {friendsOnline: [], name: ''};

        if (data.profile) {
            profile = userUtils.parseProfile(data.profile);
            if (usersOnline[profile.userId]){
                //already connected
                fn({error: 'Seems like you already have glooo opened in another window!'});
                socket.disconnect(true);
                return;
            }
            profile.friends.forEach((friend) => {
                if (usersOnline[friend.userId]) {
                    if (usersOnline[friend.userId].profile.name !== friend.name) {
                        friend.name = usersOnline[friend.userId].profile.name
                    }
                   
                    const initUser = usersOnline[friend.userId].profile.friends.find((friend) => friend.userId === profile.userId);
                    if (initUser.name !== profile.name) {
                        initUser.name = profile.name
                        io.to(usersOnline[friend.userId].socketId).emit('profilechange', userUtils.getSignedProfile(friend.userId));
                    }
                    response.friendsOnline.push(friend.userId);
                    io.to(usersOnline[friend.userId].socketId).emit('friendonline', profile.userId);
                }
            });
        }
        else {
            profile = userUtils.createProfile();
            response.profile = userUtils.signProfile(profile);
        }
        usersOnline[profile.userId] = {socketId, profile, roomId: null};
        userId = profile.userId;
        socket.emit('profilechange', userUtils.getSignedProfile(userId));
        response.name = profile.name;
        
        fn(response);
    });
    
    socket.on('join', (data, fn) => {
        const roomId = data.roomId;
        socket.join(roomId);
        //create in server. Will assume room always exists.
        if(!rooms[roomId]) resources.createRoom(roomId, userId);
        usersOnline[userId].roomId = roomId;
        
        let room = rooms[roomId];

        if (room.users.length > 0) {
            //notify new user join
            const userProfile = usersOnline[userId].profile;
            socket.to(roomId).broadcast.emit('userjoin', {userId: userProfile.userId,name: userProfile.name});

            let friendAdded = false;
            room.users.forEach(roomUserId => {
                userUtils.addFriend(userId, roomUserId);
                userUtils.addFriend(roomUserId, userId, (added) => {
                    if (added) {
                        friendAdded = true
                        io.to(usersOnline[userId].socketId).emit('friendonline', roomUserId);
                        io.to(usersOnline[roomUserId].socketId).emit('friendonline', userId);
                        io.to(usersOnline[roomUserId].socketId).emit('profilechange', userUtils.getSignedProfile(roomUserId));
                    }
                });
            })
            if (friendAdded) {
                socket.emit('profilechange', userUtils.getSignedProfile(userId));
            }
        }
        else {
            room.hostUserId = userId;
        }
        room.users.push(userId);
        
        let response = {
            users: room.users.map(id => {
                const {userId, name} = usersOnline[id].profile;
                return {
                    userId, 
                    name
                }
            }),
            host: room.hostUserId === userId,
            socketId: socketId
        };

        fn(response);
    });

    socket.on('leave', () => {
        userUtils.leaveRoom(userId);
    });

    socket.on('friendinvite', ({friendUserId, roomId}) => {
        if (usersOnline[friendUserId]) {
            io.to(usersOnline[friendUserId].socketId).emit('friendinvite', {friendUserId: userId, roomId});
        }
    });

    socket.on('namechange', ({name}) => {
        let user = usersOnline[userId];
        user.profile.name = name;
        console.log(user);
        socket.emit('profilechange', userUtils.getSignedProfile(userId));
    })

    //respond to timerequest
    socket.on('timeresponse', (data) => {
        let client = io.to(usersOnline[data.id].socketId);
        client.emit('timeresponse', {time: data.time, isPlaying: data.isPlaying, videoId: data.videoId});
    });

    socket.on('timerequest', (data) => {
        const roomId = usersOnline[userId].roomId;
        const {hostUserId} = rooms[roomId];
        io.to(usersOnline[hostUserId].socketId).emit('timerequest', data);
    });

    socket.on('pause', () => {
        const roomId = usersOnline[userId].roomId;
        socket.to(roomId).broadcast.emit('pause');
    });

    socket.on('play', (data) => {
        const roomId = usersOnline[userId].roomId;
        socket.to(roomId).broadcast.emit('play', data);
    });

    socket.on('seek', (data) => {
        const roomId = usersOnline[userId].roomId;
        socket.to(roomId).broadcast.emit('seek', data);
    });

    socket.on('cuevideo', (data) => {
        const roomId = usersOnline[userId].roomId;
        socket.to(roomId).broadcast.emit('cuevideo', data);
    });

    //Chat
    socket.on('chat', (data) => {
        const roomId = usersOnline[userId].roomId;
        data.id = generateID(8);
        io.in(roomId).emit('chat', data);
    });
    
    socket.on('disconnect', () => {
        console.log('disconnect');
        
        if (usersOnline[userId]) {
            const friends = usersOnline[userId].profile.friends;
            friends.forEach((friend) => {
                if (usersOnline[friend.userId]) {
                    io.to(usersOnline[friend.userId].socketId).emit('friendoffline', userId);
                }
            });
            userUtils.leaveRoom(userId);
            delete resources.usersOnline[userId];
        }   
    });
});
