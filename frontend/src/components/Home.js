import React, { useState, useRef, useEffect } from 'react';
import classes from './Home.module.css'

const Home = (props) => {
    const createRoom = () => {
        axios.post(config.serverEndpoint + '/room/create')
            .then((res) => history.push('/video/' + res.data.id))
            .catch(err => console.log(err))
    }
    const joinRoom = () => {
        let id = roomId;
        axios.post(config.serverEndpoint + '/room/checkid', {id})
            .then(res => {
                if (res.data.exists) history.push('/video/' + id);
                else message.error('Invalid Room Id');
            })
            .catch(err => console.log(err))
    }

    return (
        <div>
            <h1 className={classes.text}>Hello</h1>
        </div>
    )
}


export default Home;
