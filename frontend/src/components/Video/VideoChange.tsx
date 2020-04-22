import React from 'react'

type Props = {
    onInputChange;
    onClick;
}

const VideoChange: React.FC<Props> = (props) => {
    return (
        <div>
            <input onChange={(e)=>props.onInputChange(e.target.value)}></input>
            <button onClick={props.onClick}>Change Video</button>
        </div>
    )
}

export default VideoChange;