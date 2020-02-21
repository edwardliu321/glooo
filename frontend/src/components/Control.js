import React, { useRef, useState, useEffect } from 'react';

const Control = (props) => {

    const {isPlaying, pauseVideo, playVideo, getCurrentTime, videoLength} = props;
    const [time, setTime] = useState(getCurrentTime());

    let btnText = 'Play';
    let percent = Math.round(time/videoLength*100)

    if(isPlaying){
        btnText = 'Pause';
    }

    let scrubberStyle = {
        position: "fixed",
        width: '640px',
        height: '40px',
    }

    let timeStyle = {
        width: percent + '%',
        height: '100%',
        backgroundColor: 'green',
    }

    if(isPlaying){
        setTimeout(() => {
            setTime(getCurrentTime());
        }, 50)
    }

    return(
        <>
            <button onClick={isPlaying ? pauseVideo : playVideo}>
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