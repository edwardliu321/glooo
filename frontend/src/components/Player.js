import React, {useState, useRef, useEffect} from 'react';
import YouTube from 'react-youtube';
import SocketIOClient from 'socket.io-client'
import classes from './Player.module.css'
import Control from './Control'

const opts = {
    height: '390',
    width: '640',
    playerVars: {
        autoplay: 1,
        controls: 0
    }
}
const socketEndpoint = 'http://localhost/';
const Player = (props) => {
    const [isPlaying, setPlaying] = useState(true);
    let ref = useRef({socket: null, player: null});
    let socket = ref.current.socket;
    let player = ref.current.player;

    const playerBtnClick = () => {
        let playerState = player.getPlayerState();
        if (playerState === 1) {
            pauseVideo(true);
        }
        else if (playerState === 2) {
            playVideo({}, true);
        }
    }

    const playerReady = (event) => {
        ref.current.player = event.target;
        player = ref.current.player;

        ref.current.socket = SocketIOClient(socketEndpoint);
        socket = ref.current.socket;

        pauseVideo();
        
        socket.on('connect', () => {
            let roomId = props.match.params.roomId;
            socket.emit('join', { roomId });
        });
        socket.on('pause', () => {
            pauseVideo(false);
        });
        socket.on('play', (data) => {
            playVideo(data.time, false);
        });
        socket.on('seek', (data) => {
            seekTo(data.time, false);
        });
        
    }

    const pauseVideo = (emit) => {
        player.pauseVideo();
        setPlaying(false);
        if(emit){
            socket.emit('pause');
        }
    }

    const playVideo = (time, emit) => {
        if(time) player.seekTo(time);
        player.playVideo();
        setPlaying(true);
        if(emit){
            socket.emit('play', {time : getCurrentTime()});
        }
    }

    const seekTo = (time, emit) => {
        player.seekTo(time)
        if(emit){
            socket.emit('seek', {time});
        }
    }

    const getCurrentTime = () => {
        return player.getCurrentTime();
    }
    
    
    let control = null;

    if(player){
        control = (
        <Control 
        isPlaying={isPlaying}
        toggleVideo={playerBtnClick}
        videoLength={player.getDuration()}
        getCurrentTime={getCurrentTime}
        seekTo={seekTo}
        >
        </Control>
        )
    }

    

    return (
        <div className="player">
                <YouTube videoId="2g811Eo7K8U"
                opts={opts}
                onReady={playerReady}/>
                {control}         
        </div>
    )
}

export default Player;