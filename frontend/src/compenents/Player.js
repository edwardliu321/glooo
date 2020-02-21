import React, { Component, useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import SocketIOClient from 'socket.io-client'

const opts = {
    height: '390',
    width: '640',
    playerVars: {
        autoplay: 1,
        controls: 0
    }
}

let btnStye = {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '15px 32px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px'
}

const socketEndpoint = 'http://localhost/';

const Player = (props) => {

    const [isPlaying, setPlaying] = useState(false);
    let ref = useRef({socket: null, player: null});
    let socket = ref.current.socket;
    let player = ref.current.player;


    const playerBtnClick = () => {
        let playerState = player.getPlayerState();
        if (playerState === 1) {
            pauseVideo();
            socket.emit('pause');
        }
        else if (playerState === 2) {
            playVideo();
            socket.emit('play', { time: player.getCurrentTime() });
        }
    }
    const playerReady = (event) => {
        ref.current.player = event.target;
        player = ref.current.player;
        pauseVideo();

        ref.current.socket = SocketIOClient(socketEndpoint);
        socket = ref.current.socket;
        socket.on('connect', () => {
            let roomId = props.match.params.roomId;
            socket.emit('join', { roomId });
        });
        socket.on('pause', () => {
            pauseVideo();
        });
        socket.on('play', (data) => {
            playVideo(data);
        });
    }
    const pauseVideo = () => {
        player.pauseVideo();
        setPlaying(false);
    }
    const playVideo = (data) => {
        if(data) player.seekTo(data.time);
        player.playVideo();
        setPlaying(true);
    }

    let btnText = 'Play';

    if(isPlaying){
        btnText = 'Pause';
    }

    return (
        <div className="player">
                <YouTube videoId="2g811Eo7K8U" 
                opts={opts} 
                onReady={playerReady} />
                <button
                    style={btnStye}
                    onClick={playerBtnClick}
                    >
                    {btnText}
                </button>
            </div>
    )
}

export default Player;