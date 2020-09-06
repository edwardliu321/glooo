import React, { Component, useRef, useState, useEffect } from 'react';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";
import Player from './components/Player';
import Home from './components/Home';
import jws from 'jws';
import 'antd/dist/antd.css'
import config from './config';
import SocketIOClient from 'socket.io-client'

const {socketEndpoint, gloooTokenKey} = config;

const parseProfile = (profile) => {
    console.log(profile);
    const decoded = jws.decode(profile);
    return JSON.parse(decoded.payload);
}

const App = ({}) => {
    const [profile, setProfile] = useState(null);
    const [friendsOnline, setFriendsOnline] = useState([]);
    const socketRef = useRef();
    

    useEffect(() => {
        socketRef.current = SocketIOClient(socketEndpoint);
        const socket = socketRef.current;
        // TODO - local storage

        socket.on('connect', () => {
            const newProfile = localStorage.getItem(gloooTokenKey);
            socket.emit('init', {profile: newProfile}, ({friendsOnline}) => {
                console.log(friendsOnline);
                setFriendsOnline(friendsOnline);
            });
        });

        socket.on('profilechange', (signedProfile) => {
            localStorage.setItem(gloooTokenKey, signedProfile);
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
    }, []);

    return (
            profile &&
            <Router>
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/video/:roomId" render ={(props) => <Player {...props} profile={profile} friendsOnline={friendsOnline} socket={socketRef.current}/>} />
                </Switch>
            </Router>
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
