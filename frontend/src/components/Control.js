import React, { useRef, useState, useEffect } from 'react';

const width = 640;

const Control = (props) => {

    const {isPlaying, toggleVideo, getCurrentTime, videoLength} = props;
    const [time, setTime] = useState(getCurrentTime());

    let btnText = 'Play';
    let percent = time/videoLength

    if(isPlaying){
        btnText = 'Pause';
    }

    let scrubberStyle = {
        position: "fixed",
        top: "350px",
        width: width,
        height: '40px',
    }

    let btnStyle = {
        position: "fixed",
        top: "360px",
        zIndex: "1000"
    }

    let timeStyle = {
        width: percent*width + 'px',
        height: '100%',
        backgroundColor: 'rgba(0,256,0,0.5)',
    }

    if(isPlaying){
        setTimeout(() => {
            setTime(getCurrentTime());
        }, 500)
    }

    return(
        <>
            <button style={btnStyle} onClick={toggleVideo}>
                {btnText}
            </button>
            <div style={scrubberStyle}>
                <div style={timeStyle}>    
                </div>
            </div>
        </>
    )
}

export default Control;