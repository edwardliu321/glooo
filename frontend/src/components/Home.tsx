import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import classes from './Home.module.css'
import config from '../config'
import { Button, message, Modal, Input, Typography } from 'antd';

const { Text } = Typography
const axios = require('axios')

const Home = () => {

    const history = useHistory();
    const [modalVisible, setModalVisible] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [roomError, setRoomError] = useState(false);
    
    const openModal = () => {
        setModalVisible(true);   
    }
    const closeModal = () => {
        setModalVisible(false);
    }
    const onIDChange = (e) => {
        console.log(e.target);
        let text = e.target.value;
        setRoomId(text);
    }
    
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
                else {
                    setRoomError(true);
                }
            })
            .catch(err => console.log(err))
    }


    let roomErrorMessageHtml;
    if(roomError) {
        roomErrorMessageHtml = (
        <Text type="danger">Invalid Room ID</Text>
        );
    }
    

    return (
        <div>
            <div>
                <div className={classes.btnContainer}>
                    <Button size="large" type="primary" onClick={createRoom}>Create Room</Button>
                    <Button size="large" onClick={openModal}>Join Room</Button>
                </div>
            </div>
            <Modal
                    title={"Enter Room Id"}
                    visible={modalVisible}
                    onOk={joinRoom}
                    okText={"Join"}
                    onCancel={closeModal}
                >
                    <Input size="large" value={roomId} onChange={onIDChange} placeholder="Room Id"/>
                    {roomErrorMessageHtml}
            </Modal>
        </div>
    )
}


export default Home;
