import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import SocketIOClient from 'socket.io-client'
import { message, Button, Row, Col } from 'antd'
import config from '../config';

const opts = {
    height: '390',
    width: '640',
    playerVars: {
        autoplay: 1
    }
}
//const socketEndpoint = 'http://localhost:8080/';
//const socketEndpoint = 'https://glooo.io/';
const socketEndpoint = config.socketEndpoint;

const Player = (props) => {

    //******** States and Refs *********/

    const [isPlaying, setPlaying] = useState(null);
    const [userList, setUsers] = useState([]);
    
    let ref = useRef({ socket: null, player: null, userId: null, videoId: null, newVideoId: null, requireTime: true, isHost: false, actionQueue:{} });

    let { socket, player, actionQueue }= ref.current;
    document.test = actionQueue;
    
    function pushAction(action, data){
        actionQueue[action] = data;
    }

    function popAction(action){
        //console.log('try pop ' + action);
        if (actionQueue[action]){
            delete actionQueue[action];
            return true;
        }
        return false
    }

    //******** Socket Logic *********/
    const playerReady = (event) => {
        ref.current.player = event.target;
        player = ref.current.player;
        let list = userList;

        ref.current.socket = SocketIOClient(socketEndpoint);
        socket = ref.current.socket;

        //** On Connect **/
        socket.on('connect', () => {
            let roomId = props.match.params.roomId;
            socket.emit('join', { roomId }, (data) => {
                console.log("join data ", data);
                ref.current.userId = data.userId;
                setUsers(data.users);
                if (data.host) {
                    ref.current.isHost = true;
                    ref.current.requireTime = false;
                    //pauseVideo();
                    //if(data.videoId){
                        //default
                        //cueVideoById(data.videoId, false);
                    //}
                }
                else {
                    if(data.videoId) 
                        cueVideoById(data.videoId, false);
                    else
                        ref.current.requireTime = false;
                }
                //socket.emit()
                message.success(`Joined room "${roomId}"`);
            });
        });

        //** Syncronizing Players **/
        socket.on('pause', () => {
            console.log('recieve pause');
            pushAction('pause');
            pauseVideo();
        });
        socket.on('play', (data) => {
            console.log('recieve play');
            let {time} = data;
            pushAction(`play`);
            playVideo(time);
        });
        
        //** Handling Video Changes **/
        socket.on('cuevideo', (data) => {
            cueVideoById(data.videoId,false);
        })

        //** Handling User Join/Leave **/
        socket.on('timerequest', (data) => {
            console.log("request");
            socket.emit('timeresponse', { 
                id: data.id,
                isPlaying: player.getPlayerState() === 1, 
                time: player.getCurrentTime(),
                videoId: ref.current.videoId
            })
        })
        socket.on('userjoin', (data) => {
            console.log(list)
            setUsers((userList) => {
                return [...userList, data]
            });
            message.info("A user has joined!")
        });
        socket.on('userleft', (data) => {
            setUsers((userList) => {
                let newUserList = [...userList]
                return newUserList.filter((user) => user.id !== data.id)
            })
            message.warning("A user has left.")
        })
    }


    //******** Player Controls Functions *********/

    const playerBtnClick = () => {
        let playerState = player.getPlayerState();
        if (playerState === 1) {
            pauseVideo(true);
        }
        else {
            playVideo(null, true);
        }
    }
    const cueVideoById = (videoId, emit) => {
        if (videoId === ref.current.videoId) return;
        console.log(videoId);
        player.loadVideoById(videoId);
        // console.log('duration ', player.getDuration());
        if(emit){
            socket.emit('cuevideo', {videoId});
        }
    }

    const pauseVideo = (emit) => {
        player.pauseVideo();
    }

    const playVideo = (time) => {
        player.seekTo(time);
        player.playVideo();
    }

    const seekTo = (time, emit) => {
        player.seekTo(time)
    }

    const getCurrentTime = () => {
        return player.getCurrentTime();
    }

    const playerStateChanged =(e) =>{
        let x = player.getDuration();
        let videoId = player.getVideoData()['video_id'];
        let playerState = player.getPlayerState();
        
        if(x > 0 && ref.current.videoId !== videoId){
            console.log('video load');
            
            ref.current.videoId = videoId;
            if(ref.current.requireTime) { 
                socket.emit('timerequest', { id: ref.current.userId} );
                ref.current.requireTime = false;
            }
            //If video changes and already in room
            else{
                setPlaying(null); //force state change
                pauseVideo();
                seekTo(0);
            }
        }
        else if (playerState === YouTube.PlayerState.PLAYING || playerState === YouTube.PlayerState.PAUSED){
            console.log('before------------------');
            console.log(actionQueue);
            if (playerState === YouTube.PlayerState.PLAYING){
                //let time = player.getCurrentTime();
                if (!popAction(`play`)){
                    console.log('emit play');
                    socket.emit('play', { time: getCurrentTime() });
                }
            }
            else if (playerState === YouTube.PlayerState.PAUSED){
                if (!popAction(`pause`)){
                    console.log('emit pause');
                    socket.emit('pause');
                }
            }
            console.log('after-------------------');
            console.log(actionQueue);
        }


    }
    //******** Conditional Renders *********/

    let users = userList.map((user) => {
        return (
            <li key={user.id}>
                {user.name}
                { ref.current.userId === user.id ? '*' : '' }
            </li>
        )
    })
    let control = null;
    let youtube = null;

    return (
        <>
            <div>
                <input onChange={(e)=>ref.current.newVideoId=e.target.value}></input>
                <button onClick={()=>cueVideoById(ref.current.newVideoId,true)}>Change Video</button>
            </div>
            <div className="player">
                <YouTube
                    opts={opts}
                    onReady={playerReady}
                    onStateChange={playerStateChanged} 
                />
 
                <h4>Count: {userList.length}</h4>
                <ul>
                    {users}
                </ul>
            </div>
        </>
    )
}

export default Player;
