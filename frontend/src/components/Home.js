import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import classes from './Home.module.css'
import config from '../config'
import { Button, message, Modal, Input, Typography, Space, Row, Col, Divider } from 'antd';
import Layout, { Header } from 'antd/lib/layout/layout';
import { GithubOutlined } from '@ant-design/icons';

const { Text } = Typography
const axios = require('axios')

const Home = (props) => {

    const history = useHistory();
    const [modalVisible, setModalVisible] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [roomError, setRoomError] = useState(false);
    const [joiningRoom, setJoiningRoom] = useState(false);
    
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
            .then((res) => history.push('/v/' + res.data.id))
            .catch(err => console.log(err))
    }
    const joinRoom = () => {
        if (!roomId) return;
        let id = roomId;
        setJoiningRoom(true);
        axios.post(config.serverEndpoint + '/room/checkid', {id})
            .then(res => {
                if (res.data.exists) history.push('/v/' + id);
                else {
                    setRoomError(true);
                }
            })
            .finally(() => {
                setJoiningRoom(false);
            })
    }

    return (
        <div>
            <Row justify='end' style={{
                paddingTop:'10px',
                marginRight:'30px'
            }}>
                <a target='_blank' href='https://github.com/edwardliu321/glooo' style={{
                    color:'black'
                }}>
                <GithubOutlined style={{ fontSize:30 }}/>
                </a>
            </Row>
            <Row justify='center'>
                <h1 style={{
                    fontSize:150,
                    marginBottom:0
                }}>
                    Glooo.io
                </h1>
                
            </Row>
            <Row justify='center'>
                <h3 style={{
                }}>
                    Watch YouTube with friends!
                </h3>
                
            </Row>
            <Row justify='center' style={{marginTop:80}}>
                <Col span={6}>
                    <Row justify='center'>
                        {/* <Button size="large" onClick={openModal}>Join Room</Button> */}
                        <Col span={18}>
                            <Input.Search placeholder="Room ID" value={roomId} onChange={onIDChange} enterButton="Join" size="large" onSearch={joinRoom} loading={joiningRoom} />
                            {
                                roomError && 
                                    <Text type="danger" style={{fontWeight:'bold'}}>This room doesn't exist!</Text>
                            }
                        </Col>
                    </Row>
                    <Divider dashed>
                        OR
                    </Divider>
                    <Row justify='center'>
                        <Button size="large" type="primary" onClick={createRoom}>Create Room</Button>
                    </Row>
                </Col>
            </Row>
            <Modal
                    title={"Enter Room Id"}
                    visible={modalVisible}
                    onOk={joinRoom}
                    okText={"Join"}
                    onCancel={closeModal}
                >
                    <Input size="large" value={roomId} onChange={onIDChange} placeholder="Room Id"/>
                    {
                        roomError && 
                            <Text type="danger">Invalid Room ID</Text>
                    }
            </Modal>
        </div>
    )
}


export default Home;
