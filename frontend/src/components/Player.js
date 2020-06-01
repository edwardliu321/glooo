import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import SocketIOClient from 'socket.io-client'
import { message, Button, Row, Col, Input, Card, Comment, Form } from 'antd'
import config from '../config';
import { UserOutlined } from '@ant-design/icons';
import If from '../helpers/If';

const opts = {
    width: '853',
    height: '480',
    playerVars: {
        autoplay: 1
    }
}


//const socketEndpoint = 'http://localhost:8080/';
//const socketEndpoint = 'https://glooo.io/';
const socketEndpoint = config.socketEndpoint;

const Player = (props) => {

    //******** States and Refs *********/
    const [name, setName] = useState(null);
    const [userList, setUsers] = useState([]);
    const [chatList, setChatList] = useState([]);
    const [chatBoxText, setChatBoxText] = useState(null);
    const [currentVideoId, setCurrentVideoId] = useState(null);
    const [videoIdText, setVideoIdText] = useState(null);
    let ref = useRef({ socket: null, player: null, userId: null, requireTime: true, isHost: false, actionQueue: {}, chatBottom: null });
    let { socket, player, actionQueue } = ref.current;

    document.test = actionQueue;
    function pushAction(action) {
        actionQueue[action] = true;
    }

    function popAction(action) {
        //console.log('try pop ' + action);
        if (actionQueue[action]) {
            delete actionQueue[action];
            return true;
        }
        return false
    }

    function parseVideoId(search) {
        let id = search;
        try {
            let url = new URL(id);
            id = url.searchParams.get("v") || id;
        }
        catch{ }
        finally {
            return id;
        }
    }

    function sendChat() {
        if (!chatBoxText) return;
        let chatData = {
            content: chatBoxText,
            author: name
        };
        socket.emit('chat', chatData);
        setChatBoxText(null);
    }

    function chatKeyDown(e){
        if(e.which === 13 && !e.shiftKey){
            e.preventDefault(); 
            sendChat();
        } 
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
                setName(data.name);
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
                    if (data.videoId)
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
            if (player.getPlayerState() !== YouTube.PlayerState.PAUSED) {
                pushAction('pause');
                pauseVideo();
            }
            else {
                console.log('ignored pause');
            }
        });
        socket.on('play', (data) => {
            console.log('recieve play');
            let { time } = data;
            pushAction(`play`);
            playVideo(time);
        });

        //** Handling Video Changes **/
        socket.on('cuevideo', (data) => {
            cueVideoById(data.videoId, false);
        })

        //** Handling User Join/Leave **/
        socket.on('timerequest', (data) => {
            console.log("request");
            socket.emit('timeresponse', {
                id: data.id,
                isPlaying: player.getPlayerState() === 1,
                time: player.getCurrentTime(),
                videoId: currentVideoId
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

        //chat
        socket.on('chat', (data) => {
            setChatList((chatlist) => {
                ref.current.chatBottom.scrollIntoView({ behavior: 'smooth' });
                return [...chatlist, data];
            });
        });
    }


    //******** Player Controls Functions *********/

    const cueVideoById = (videoIdSearch, emit) => {
        console.log(videoIdSearch)
        if (!videoIdSearch ) return;
        setVideoIdText(videoIdSearch);
        let videoId = parseVideoId(videoIdSearch);
        console.log(videoId);
        console.log(currentVideoId);

        if (videoId === currentVideoId) return;
        player.loadVideoById(videoId);
        setCurrentVideoId(videoId);
        if (emit) {
            socket.emit('cuevideo', { videoId:videoIdSearch });
        }
    }

    const pauseVideo = (emit) => {
        player.pauseVideo();
    }

    const playVideo = (time) => {
        if (time !== null && time !== undefined) player.seekTo(time);
        player.playVideo();
    }

    const seekTo = (time, emit) => {
        player.seekTo(time)
    }

    const getCurrentTime = () => {
        return player.getCurrentTime();
    }

    const playerStateChanged = (e) => {
        let x = player.getDuration();
        let videoId = player.getVideoData()['video_id'];
        let playerState = player.getPlayerState();

        if (x > 0 && currentVideoId !== videoId) {
            console.log('video load');

            setCurrentVideoId(videoId);
            if (ref.current.requireTime) {
                socket.emit('timerequest', { id: ref.current.userId });
                ref.current.requireTime = false;
            }
            //If video changes and already in room
            else {
                pauseVideo();
                seekTo(0);
            }
        }
        else if (playerState === YouTube.PlayerState.PLAYING || playerState === YouTube.PlayerState.PAUSED) {
            console.log('before------------------');
            console.log(actionQueue);
            if (playerState === YouTube.PlayerState.PLAYING) {
                //let time = player.getCurrentTime();
                if (!popAction(`play`)) {
                    console.log('emit play');
                    socket.emit('play', { time: getCurrentTime() });
                }
            }
            else if (playerState === YouTube.PlayerState.PAUSED) {
                if (!popAction(`pause`)) {
                    console.log('emit pause');
                    socket.emit('pause');
                }
            }
            console.log('after-------------------');
            console.log(actionQueue);
        }
    }
    //******** Conditional Renders *********/

    // let users = userList.map((user) => {
    //     return (
    //         <li key={user.id}>
    //             {user.name}
    //             {ref.current.userId === user.id ? '*' : ''}
    //         </li>
    //     )
    // })
    return (
        <>
            <Row>
                <Col span={4} />
                <Col span={15}>
                    <Row style={{ marginTop: "70px" }}>
                        <Col span={17}>
                            <Input.Search
                                placeholder="Search"
                                value={videoIdText}
                                onChange={(e) => setVideoIdText(e.target.value)}
                                onSearch={() => cueVideoById(videoIdText, true)}
                                size="large"
                            />
                        </Col>
                        {/* <Col span={8} /> */}
                    </Row>
                    <div style={{ display: currentVideoId ? '' : 'none' }}>
                        <Row style={{ marginTop: "50px" }}>
                            <Col span={24}>
                                <YouTube
                                    opts={opts}
                                    onReady={playerReady}
                                    onStateChange={playerStateChanged}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <UserOutlined /> {userList.length}
                            </Col>
                        </Row>
                    </div>
                </Col>
                <Col span={5} >
                    <Card title="Glooo Chat" extra={<a href="#">Users</a>} style={{ height: '100vh' }} >
                        <div style={{ overflowY: 'scroll', height: '75vh' }} className="hideScroll">
                            {
                                chatList.map(c =>
                                    <Comment
                                        key={c.id}
                                        author={c.author}
                                        content={
                                            <p>
                                                {c.content}
                                            </p>
                                        }
                                    />
                                )
                            }
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <br></br>
                            <div ref={el => ref.current.chatBottom = el}>
                            </div>
                        </div>
                        <div style={{ marginRight: '20px' }}>
                            <Form.Item>
                                <Input.TextArea
                                    onChange={e => setChatBoxText(e.target.value)}
                                    value={chatBoxText}
                                    placeholder={'Say something!'}
                                    rows={2} maxLength={200} style={{ resize: 'none' }} 
                                    onKeyDown={chatKeyDown}    
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button onClick={(sendChat)} type="primary" style={{ float: 'right' }}>
                                    Chat
                            </Button>
                            </Form.Item>
                        </div>
                    </Card>
                </Col>
            </Row>

        </>
    )
}

export default Player;
