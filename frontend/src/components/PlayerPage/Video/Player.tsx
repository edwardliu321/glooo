import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import SocketIOClient from 'socket.io-client'
import classes from './Player.module.css'
import Control from './Control'
import UserList from '../Users/UserList'
import User from '../Users/user.type';
import { message, Button, Row, Col } from 'antd'
import config from '../../../config'
import VideoChange from './VideoChange';

const opts = {
    height: '390',
    width: '640',
    playerVars: {
        autoplay: 1,
        controls: 0
    }
}
//const socketEndpoint = 'http://localhost:8080/';
//const socketEndpoint = 'https://glooo.io/';
const socketEndpoint = config.socketEndpoint;

type Props = {
    match: {params: {roomId: string}}
}

const Player : React.FC<Props> = (props) => {

    //******** States and Refs *********/

    const [isPlaying, setPlaying] = useState(null);
    const [userList, setUsers] = useState<User[]>([]);
    
    let ref = useRef({ socket: null, player: null, userId: null, videoId: null, newVideoId: null, requireTime: true, isHost: false});

    let socket = ref.current.socket;
    let player = ref.current.player;

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
            pauseVideo(false);
        });
        socket.on('play', (data) => {
            playVideo(data.time, false);
        });
        socket.on('seek', (data) => {
            seekTo(data.time, false);
        });
        socket.on('seekpause', (data) => {
            seekTo(data.time, false);
            pauseVideo(false);
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
        setPlaying(false);
        if (emit) {
            socket.emit('pause');
        }
    }

    const playVideo = (time, emit) => {
        if (time) player.seekTo(time);
        player.playVideo();
        setPlaying(true);
        if (emit) {
            socket.emit('play', { time: getCurrentTime() });
        }
    }

    const seekTo = (time, emit) => {
        player.seekTo(time)
        if (emit) {
            socket.emit('seek', { time });
        }
    }

    const getCurrentTime = () => {
        return player.getCurrentTime();
    }

    const playerStateChanged =(e) =>{
        console.log("state change: ", player.getDuration());
        console.log("vidId: ", player.getVideoData()['video_id']);
        let x = player.getDuration();
        let videoId = player.getVideoData()['video_id'];
        console.log(ref.current.videoId);
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
                pauseVideo(false);
                seekTo(0, false);
            }
        }
    }
    //******** Conditional Renders *********/

    let control = null;
    let youtube = null;

    if (player) {
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
        <>
            <VideoChange 
                onInputChange={(newId: string) => ref.current.newVideoId = newId}
                onClick={()=>cueVideoById(ref.current.newVideoId,true)}
            >
            </VideoChange>
            <div className="player">
                <YouTube
                    opts={opts}
                    onReady={playerReady}
                    onStateChange={playerStateChanged} />
                <Row>
                    <Col span={10}>
                        {control}
                    </Col>
                </Row>
                <UserList userList={userList} currentUserId={ref.current.userId}></UserList>
            </div>
        </>
    )
}

export default Player;