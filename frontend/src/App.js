import React, { Component, useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route, useHistory, Redirect } from "react-router-dom";
import Player from './components/Player';
import Home from './components/Home';
import { notification, Button, Input, Row, Col } from 'antd'
import jws from 'jws';
import 'antd/dist/antd.css'
import config from './config';
import SocketIOClient from 'socket.io-client'

const { socketEndpoint, gloooTokenKey } = config;

const parseProfile = (profile) => {
    const decoded = jws.decode(profile);
    return JSON.parse(decoded.payload);
}

const App = ({ }) => {
    const [profile, setProfile] = useState();
    const [friendsOnline, setFriendsOnline] = useState([]);
    const notificationNameRef = useRef();
    const socketRef = useRef();
    const history = useHistory();
    const profileRef = useRef();

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    useEffect(() => {
        socketRef.current = SocketIOClient(socketEndpoint);
        const socket = socketRef.current;
        const initialNameNotificationKey = 'initialNameNotification';
        const submitNotificationNameChange =() => {
            const name = notificationNameRef.current.state.value;
            if (name){
                socket.emit('namechange', { name: name });
            }
            notification.close(initialNameNotificationKey);
        }
    
        socket.on('connect', () => {
            const newProfile = localStorage.getItem(gloooTokenKey);
            socket.emit('init', { profile: newProfile }, ({ friendsOnline, name }) => {
                console.log(friendsOnline);
                setFriendsOnline(friendsOnline);
                if (!newProfile) {
                    //show modal
                    const btn = (
                        <Button type="primary" size="small" onClick={submitNotificationNameChange}>
                            Confirm
                        </Button>
                    );
                    notification.open({
                        key: initialNameNotificationKey,
                        message: 'First time here?',
                        duration: 0,
                        description: (
                            <>
                                What should we call you?
                                <Input placeholder={name} onPressEnter={submitNotificationNameChange} ref={notificationNameRef}/>
                            </>
                        ),
                        btn
                    })
                }
            });
        });

        socket.on('profilechange', (signedProfile) => {
            localStorage.setItem(gloooTokenKey, signedProfile);
            console.log(parseProfile(signedProfile));
            setProfile(parseProfile(signedProfile));
        })

        socket.on('friendonline', (friendUserId) => {
            console.log(friendUserId);
            setFriendsOnline([...friendsOnline, friendUserId]);
        })

        socket.on('friendoffline', (friendUserId) => {
            const newFriendsOnline = friendsOnline.filter(userId => userId !== friendUserId);
            setFriendsOnline(newFriendsOnline);
        })

        socket.on('friendinvite', ({ friendUserId, roomId }) => {
            console.log('invite received', friendUserId);
            onFriendInvite(friendUserId, roomId);
        })
    }, []);

    const acceptFriendInvite = (roomId) => {
        console.log('accepted');
        window.location.assign(`/video/${roomId}`);
    }

    const onFriendInvite = (friendUserId, roomId) => {
        const friendName = profileRef.current.friends.find((friend) => friend.userId === friendUserId).name;
        const key = `open${Date.now()}`;
        const btn = (
            <Button type="primary" size="small" onClick={() => {
                acceptFriendInvite(roomId);
                notification.close(key);
            }}>
                Confirm
            </Button>
        );
        notification.open({
            message: 'Notification Title',
            description:
                `${friendName} has invited you!`,
            btn,
            key
        });
    }
    //window.profile = profile;
    return (
        profile ?
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/video/:roomId" render={(props) => <Redirect to={`/v/${props.match.params.roomId}`} />} />
                <Route path="/v/:roomId" render={(props) => <Player {...props} profile={profile} friendsOnline={friendsOnline} socket={socketRef.current} />} />
            </Switch>
            :
            <>
            </>
    )
}

// class App extends Component {
//   render() {
//     return (
//         <Router>
//           <Switch>
//             <Route path="/video/:roomId" component={Player} />
//           </Switch>
//         </Router>
//
//     );
//   }
// }
export default App;
