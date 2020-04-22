import React from 'react';
import classes from './Home.module.css'
import { Button } from 'antd';

type Props = {
    clickCreateRoom;
    clickJoinRoom;
}

const RoomControl:React.FC<Props> = (props) => {

    return (
        <div>
            <div className={classes.btnContainer}>
                <Button size="large" type="primary" onClick={props.clickCreateRoom}>Create Room</Button>
                <Button size="large" onClick={props.clickJoinRoom}>Join Room</Button>
            </div>
        </div>
    )
}

export default RoomControl;