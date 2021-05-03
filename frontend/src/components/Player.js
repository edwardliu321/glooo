import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { message, Button, Row, Col, Input, Card, Comment, Form, Spin, Avatar, Drawer, List, Divider, notification, Badge } from 'antd'
import config from '../config';
import { UserOutlined, LoadingOutlined, ProfileFilled, CopyOutlined, UserSwitchOutlined } from '@ant-design/icons';
import axios from 'axios';
import Linkify from 'react-linkify';
import './Player.css';
import { Link } from 'react-router-dom';

const opts = {
    width: '853',
    height: '480',
    playerVars: {
        autoplay: 1
    }
}

message.config({
    top:'90%',
    maxCount:1
})

const {serverEndpoint} = config;

const Player = ({socket, match, profile, friendsOnline}) => {
    /******** States and Refs *********/
    const roomId = match.params.roomId;

    const [userList, setUsers] = useState([]);
    const [chatList, setChatList] = useState([]);
    const [chatBoxText, setChatBoxText] = useState(null);
    const [currentVideoId, setCurrentVideoId] = useState(null);
    const [videoIdText, setVideoIdText] = useState(null);
    const [loading, setLoading] = useState(true);
    const [videoList, setVideoList] = useState([]);
    const [loadingVideoList, setLoadingVideoList] = useState(false);
    const [videoBrowseSearch, setVideoBrowseSearch] = useState();
    const [showBrowseVideo, setShowBrowseVideo] = useState(false);
    const [showFriendsList, setShowFriendsList] = useState(false);

    const ref = useRef({ player: null, socketId: null, isHost: false, actionQueue: {}, chatBottom: null, videoSearchData: {} });
    let { player, actionQueue } = ref.current;

    const chatRef = useRef();
    const userListRef = useRef();

    useEffect(() => {
        return () => {
            socket.emit('leave');
            message.destroy();
        };
    }, []);

    useEffect(() => {
        userListRef.current = userList;
    }, [userList])
    
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
        finally {
            return id;
        }
    }

    function sendChat() {
        if (!chatBoxText) return;
        let chatData = {
            content: chatBoxText,
            author: profile.name
        };
        chatRef.current.scrollTop = 0;
        socket.emit('chat', chatData);
        setChatBoxText(null);
    }

    function chatKeyDown(e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    }

    function handleSearch(){
        if (!videoBrowseSearch || !videoBrowseSearch.trim()) return;
        setLoadingVideoList(true);
        axios.get(`${serverEndpoint}/videos/search?q=${videoBrowseSearch}`)
        .then(response => {
            let { items, nextPageToken, totalResults } = response.data;
            setVideoList(items.filter(x => x.videoId));
            ref.current.videoSearchData = {
                q: videoBrowseSearch,
                nextPageToken,
                totalResults
            };
        }).catch(e => {
            console.log(e);
        }).then(() => {
            setLoadingVideoList(false);
        })
    }

    function selectBrowseVideo(e, videoId){
        e.preventDefault();
        setShowBrowseVideo(false);
            cueVideoById(videoId, true);
    }

    function openNameForm(){
        notification.open({
            message: 'Notification Title',
            description:(
                <Input size="large" placeholder="Display Name" />
            ),
            duration: 0,
        })
    }

    const announceUserJoined = (name) => {
        const announcement = {
            type:'announcement',
            content:<span>Welcome, <strong>{name}</strong></span>
        }
        setChatList((chatlist) => {
            return [announcement, ...chatlist];
        });
    }

    const announceUserLeft = (name) => {
        const announcement = {
            type:'announcement',
            content:<span><strong>{name}</strong> has left</span>
        }
        setChatList((chatlist) => {
            return [announcement, ...chatlist];
        });
    }

    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href);
        message.success('Invite link copied');
    }

    /******** Socket Logic *********/
    const playerReady = (event) => {
        ref.current.player = event.target;
        player = ref.current.player;
        player.playVideo();
        //socketRef.current = SocketIOClient(socketEndpoint)
       
        socket.emit('join', { roomId }, (data) => {
            console.log("join data ", data);
            ref.current.socketId = data.socketId;
            setUsers(data.users);
            if (data.host) {
                ref.current.isHost = true;
            }
            else {
                socket.emit('timerequest', {id: profile.userId})
            }
            if (ref.current.isHost){
                message.success(`Created room "${roomId}"`);
            }
            else{
                message.success(`Joined room "${roomId}"`);
            }
            
            announceUserJoined(profile.name);

            setLoading(false);
        });

        //** Syncronizing Players **/
        socket.off('pause');
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
        socket.off('play');
        socket.on('play', (data) => {
            console.log('recieve play');
            let { time } = data;
            pushAction(`play`);
            playVideo(time);
        });

        /** Handling Video Changes **/
        socket.off('cuevideo');
        socket.on('cuevideo', (data) => {
            cueVideoById(data.videoId, false);
        })

        /** Handling User Join/Leave **/
        socket.off('timerequest');
        socket.on('timerequest', (data) => {
            console.log('timerequest')
            
            const videoId = player.getVideoData()['video_id'];
            socket.emit('timeresponse', {
                id: data.id,
                isPlaying: player.getPlayerState() === 1,
                time: player.getCurrentTime(),
                videoId: videoId
            })
        });

        socket.off('timeresponse');
        socket.on('timeresponse', (data) => {
            let {time,isPlaying, videoId} = data;
            cueVideoById(videoId, false, time);
        });

        socket.off('userjoin');
        socket.on('userjoin', (user) => {
            setUsers((userList) => {
                return [...userList, user];
            });
            announceUserJoined(user.name);
        });

        socket.off('userleft');
        socket.on('userleft', (userLeftId) => {
            const leftUser =  userListRef.current.find(user => user.userId === userLeftId);
            setUsers((userList) => {
                let newUserList = [...userList];
                return newUserList.filter((user) => user.userId !== userLeftId);
            });
            announceUserLeft(leftUser.name);
        })

        //chat
        socket.off('chat');
        socket.on('chat', (data) => {
            let stickToBottom = false;
            if (chatRef.current.scrollTop >= 0){
                //chat is at bottom
                stickToBottom = true;
            }
            setChatList((chatlist) => {
                return [data, ...chatlist];
            });
            if (stickToBottom){
                chatRef.current.scrollTop = 0;
            }
        });
    }

    function inviteFriend(friendUserId){
        socket.emit('friendinvite', {friendUserId, roomId})
    }

    /******** Player Controls Functions *********/

    const cueVideoById = (videoIdSearch, emit, time) => {
        console.log(videoIdSearch)
        if (!videoIdSearch) return;
        setVideoIdText(videoIdSearch);
        let videoId = parseVideoId(videoIdSearch);
        console.log(videoId);
        console.log(currentVideoId);
        
        if (videoId === currentVideoId) return;
        player.loadVideoById(videoId, time ?? 0);
        setCurrentVideoId(videoId);
        if (emit) {
            socket.emit('cuevideo', { videoId: videoIdSearch });
        }
    }

    const pauseVideo = (emit) => {
        player.pauseVideo();
    }

    const playVideo = (time) => {
        if (time !== null && time !== undefined) player.seekTo(time);
        player.playVideo();
      
    }

    const getCurrentTime = () => {
        return player.getCurrentTime();
    }

    const playerStateChanged = (e) => {
        let x = player.getDuration();
        let playerState = player.getPlayerState();
        console.log(x)
        if (playerState === YouTube.PlayerState.PLAYING || playerState === YouTube.PlayerState.PAUSED) {
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

    return (
        <>
            <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 50 }} spin />}>
                <Row>
                    <Col span={4}>
                        <div style={{
                            marginTop:'15px',
                            paddingLeft:'40px'
                        }}>
                            <Link to='/' style={{color:'black'}}>
                            <h1>
                                Glooo
                            </h1>
                            </Link>
                        </div>
                    </Col>
                    <Col span={15}>
                        <Row style={{ marginTop: "20px" }}>
                            <Col span={17}>
                                <Input.Search
                                    placeholder="Paste URL or Video Id"
                                    value={videoIdText}
                                    onChange={(e) => setVideoIdText(e.target.value)}
                                    onSearch={() => cueVideoById(videoIdText, true)}
                                    size="large"
                                />
                            </Col>
                            <Col span={1}/>
                            {/* <Col span={3}>
                                <Button 
                                    size="large" 
                                    shape='round'
                                    onClick={() => setShowBrowseVideo(true)}
                                >
                                    Browse
                                </Button>
                            </Col> */}
                            <Col span={3}>
                                <Button 
                                    size="large" 
                                    shape='round'
                                    onClick={() => setShowFriendsList(true)}
                                >
                                    Friends
                                </Button>
                            </Col>
                            <Col span={3}>
                                <Button 
                                    size="large" 
                                    shape='round'
                                    onClick={copyRoomLink}
                                    icon={<CopyOutlined />}
                                >
                                    Invite
                                </Button>
                            </Col>
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
                        </div>
                    </Col>
                    <Col span={5} >
                        <Card title="Chat"
                            extra={
                                <>
                                    <Button size='large' shape='round'>
                                        <UserOutlined />
                                        {userList.length}
                                    </Button>
                                </>
                            }
                            style={{ height: '100vh' }} >
                            <div ref={chatRef} style={{ overflowY: 'scroll', height: '65vh', flexDirection:'column-reverse', display:'flex' }} className="hideScroll">
                                {
                                    chatList.map((c,i) => (
                                        c.type === 'announcement' ?
                                        <div key={i}>
                                            {c.content}
                                        </div>
                                        :
                                        <Comment
                                            key={c.id}
                                            author={c.author}
                                            content={
                                                <p>
                                                    <Linkify
                                                        componentDecorator={(href, text, key) => (
                                                                <a href={href} key={key} target="_blank">
                                                                    {text}
                                                                </a>
                                                            )
                                                        }
                                                    >
                                                        {c.content}
                                                    </Linkify>
                                                </p>

                                            }
                                        />
                                    ))
                                }
                                {

                                }
                            </div>
                            <div style={{ paddingTop:'70px' }}>
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
            </Spin>

            <Drawer 
                title="Friends List"
                width={720}
                onClose={() => setShowFriendsList(false)}
                visible={showFriendsList}
                placement="right"
            >
                { 
                    profile.friends.filter(x => friendsOnline.includes(x.userId)).map(({name, userId}) => {
                        return(
                            <Row justify='space-between'>
                                <Badge status="success" text={name} />
                                    <Button 
                                        type="primary" 
                                        onClick={() => {
                                            inviteFriend(userId);
                                        }}
                                    >
                                        Invite
                                    </Button>   
                            </Row> 
                        )
                    }) 
                }
                { 
                    profile.friends.filter(x => !friendsOnline.includes(x.userId)).map(({name, userId}) => {
                        return(
                            <Row justify='space-between'>
                                <Badge status="default" text={name} />
                            </Row> 
                        )
                    }) 
                }
            </Drawer>

            <Drawer
                title="Browse"
                width={720}
                onClose={() => {setShowBrowseVideo(false)}}
                visible={showBrowseVideo}
                placement="left"
            >
            
            <Row gutter={16}>
                <Col span={24}>
                    <Input.Search
                        placeholder="Search"
                        value={videoBrowseSearch}
                        onChange={(e) => setVideoBrowseSearch(e.target.value)}
                        onSearch={handleSearch}
                        size="large"
                    />
                </Col>
            </Row>

            {
                videoList.length > 0 && <Divider />
            }
            <Row gutter={24}>
                <Col span={24}>
                    <List
                        itemLayout="vertical"
                        dataSource={videoList}
                        loading={loadingVideoList}
                        locale={{emptyText:' '}}
                        size="large"
                        renderItem={item => (
                            <>
                            <a href='#' style={{color:'inherit'}} onClick={e => selectBrowseVideo(e, item.videoId)}>
                                <List.Item
                                    key={item.videoId}
                                    extra={
                                        <img
                                            alt={item.title}
                                            width={250}
                                            src={item.videoThumbnail}
                                        />
                                    }
                                >
                                    <List.Item.Meta 
                                        avatar={<Avatar src={item.channelThumbnail}/>}
                                        title={item.title}
                                        description={item.channelTitle}
                                    />
                                    <p>{item.description.substring(0,100)}{item.description.length > 100 ? '...' : ''}</p>
                                </List.Item>
                            </a>
                            </>
                        )}
                    >
                    </List>
                </Col>
            </Row>
            </Drawer>
        </>
    )
}

export default Player;