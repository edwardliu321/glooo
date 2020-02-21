import React, { Component } from 'react';
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
const btnStye = {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '15px 32px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px'
}
const socketEndpoint = 'http://localhost/'


class Player extends Component {
    player = null;
    socket = null;
    state = {
        btnText: '',
        btnStyle: btnStye
    }
    componentDidMount() {
        this.socket = SocketIOClient(socketEndpoint);
        let socket = this.socket;

        socket.on('connect', () => {
            let { roomId } = this.props.match.params;
            socket.emit('join', { roomId });
        });
        socket.on('pause', () => {
            this.pauseVideo();
        });
        socket.on('play', (data) => {
            this.playVideo(data);
        });
    }

    render() {
        return (
            <div className="player">
                <YouTube videoId="2g811Eo7K8U" 
                opts={opts} 
                onReady={this.playerReady} />
                <button
                    style={this.state.btnStye}
                    onClick={this.playerBtnClick}
                >
                    {this.state.btnText}
                </button>
            </div>
        );
    }

    playerBtnClick = () => {
        let playerState = this.player.getPlayerState();
        if (playerState === 1) {
            this.pauseVideo();
            this.socket.emit('pause');

        }
        else if (playerState === 2) {
            this.playVideo();
            this.socket.emit('play', { time: this.player.getCurrentTime() });
        }
    }
    playerReady = (event) => {
        this.player = event.target;
        this.pauseVideo();
    }
    
    pauseVideo = () => {
        this.player.pauseVideo();
        this.setState({ btnText: 'Play' });
    }
    playVideo = (data) => {
        if(data) this.player.seekTo(data.time);
        this.player.playVideo();
        this.setState({ btnText: 'Pause' });
    }
}

export default Player;