import React, { useRef, useState, useEffect, useReducer } from 'react';
import { Slider, Button, Row, Col } from 'antd';


const useInterval = (callback, delay) => {
    const savedCallback = useRef();

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

const Control = (props) => {

    const { isPlaying, toggleVideo, getCurrentTime, videoLength, seekTo } = props;
    const [time, setTime] = useState(getCurrentTime());
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