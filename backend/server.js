const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const roomRouter = require('./routes/room');
require('dotenv').config();
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(80);

const port = process.env.PORT || 5000;

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

app.get('/', (req,res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "index.html"))
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        let { roomId } = data;
        socket.join(roomId);
        console.log(roomId);
    });
    socket.on('pause', (data) => {
        socket.broadcast.emit('pause');
        console.log('pause');
    });
    socket.on('play', (data) => {
        socket.broadcast.emit('play', data);
        console.log('play');
    });
});