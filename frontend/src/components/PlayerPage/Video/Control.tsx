import React, { useRef, useState, useEffect, useReducer } from 'react';
import { Slider, Button, Row, Col } from 'antd';

interface Props {
    isPlaying: Boolean;
    toggleVideo: any; //Function called onPlay/Pause
    getCurrentTime: Function;
    videoLength: number;
    seekTo: Function;
}

const useInterval = (callback: Function, delay) => {
    const savedCallback = useRef<Function>();
    savedCallback.current = (e) => (e);

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

const width = 635;

const Control: React.FC<Props> = (props) => {

    const { isPlaying, toggleVideo, getCurrentTime, videoLength, seekTo } = props;
    const [time, setTime] = useState<number>(getCurrentTime());
    let percent = time / videoLength * 100;

    let scrubberStyle = {
        width: width
    }
    let btnIcon = 'caret-right';
    if (isPlaying) {
        btnIcon = 'pause';
    }

    useInterval(() => {
        setTime(getCurrentTime());
    }, 500);

    const playerChange = (percent) => {
        let time = percent / 100 * videoLength;
        seekTo(time, true);
        setTime(time);
    }
    
    return (
        <>
            <Row>
                <Col span={2}>
                    <Button type="primary" icon={btnIcon} onClick={toggleVideo} />
                </Col>
                <Col span={22}>
                    <Slider value={percent} onChange={playerChange} tipFormatter={null} />
                </Col>
            </Row>
        </>
    )


}

export default Control;