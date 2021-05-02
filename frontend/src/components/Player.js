import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { message, Button, Row, Col, Input, Card, Comment, Form, Spin, Avatar, Drawer, List, Divider, notification, Badge } from 'antd'
import config from '../config';
import { UserOutlined, LoadingOutlined, ProfileFilled } from '@ant-design/icons';
import axios from 'axios';
import Linkify from 'react-linkify';
import './Player.css';

const opts = {
    width: '853',
    height: '480',
    playerVars: {
        autoplay: 1
    }
}


const {serverEndpoint} = config;

const Player = ({socket, match, profile, friendsOnline}) => {

    /******** States and Refs *********/
    const roomId = match.params.roomId;

    const [name, setName] = useState(null);
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
    let ref = useRef({ player: null, socketId: null, isHost: false, actionQueue: {}, chatBottom: null, videoSearchData: {} });
    let { player, actionQueue } = ref.current;

    window.player = player;
    function pushAction(action) {
        actionQueue[action] = true;
    }

    useEffect(() => {
        return () => {
            socket.emit('leave');
        };
    }, []);

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

    // function loadMoreVideos(){
    //     console.log('load more');
    //     setVideoList(old => {
    //         return [...old, ...old];
    //     });
    //     return;
    //     axios.get(`${serverEndpoint}/videos/search?q=${ref.current.videoSearchData.q}&pageToken=${ref.current.videoSearchData.nextPageToken}`)
    //     .then(response => {
    //         let { items, nextPageToken } = response.data;
    //         setVideoList(old => {
    //             return [...old, ...items];
    //         });
    //         ref.current.videoSearchData.nextPageToken = nextPageToken;
    //     });
    // }

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
            setName(data.name);
            if (data.host) {
                ref.current.isHost = true;
            }
            else {
                socket.emit('timerequest', {id: profile.userId})
            }
            message.success(`Joined room "${roomId}"`);

            setLoading(false);
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

        /** Handling Video Changes **/
        socket.on('cuevideo', (data) => {
            cueVideoById(data.videoId, false);
        })

       
        /** Handling User Join/Leave **/
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

        socket.on('timeresponse', (data) => {
            let {time,isPlaying, videoId} = data;
            cueVideoById(videoId, false, time);
        });

        socket.on('userjoin', (user) => {
            setUsers((userList) => {
                return [...userList, user];
            });
            message.info(`${user.name} has joined!`);
        });
        socket.on('userleft', (userLeftId) => {
            const leftUser = userList.find(user => user.userId === userLeftId);
            setUsers((userList) => {
                let newUserList = [...userList];
                return newUserList.filter((user) => user.userId !== userLeftId);
            })
            message.warning(`${leftUser.name} has left.`);
        })

        //chat
        socket.on('chat', (data) => {
            setChatList((chatlist) => {
                return [data, ...chatlist];
            });
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

    const seekTo = (time, emit) => {
        player.seekTo(time)
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
                            paddingTop:10,
                            paddingLeft:40
                        }}>
                            <a href='/' style={{color:'black'}}>
                            <h1>
                                Glooo
                            </h1>
                            </a>
                        </div>
                    </Col>
                    <Col span={15}>
                        <Row style={{ marginTop: "70px" }}>
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
                            <div style={{ overflowY: 'scroll', height: '65vh', flexDirection:'column-reverse', display:'flex' }} className="hideScroll">
                                {
                                    chatList.map(c =>
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
                                    )
                                }
                            </div>
                            <div style={{ marginRight: '20px', paddingTop:'70px' }}>
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
                    profile.friends.map(({name, userId}) => {
                        return(
                            <Row justify='space-between'>
                                <Badge status={friendsOnline.includes(userId) ? "success" : "default"} text={name} />
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
                    }) }
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