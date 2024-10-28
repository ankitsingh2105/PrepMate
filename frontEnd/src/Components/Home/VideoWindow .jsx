import React from "react";
import Draggable from "react-draggable";
import './VideoWindow.css'; // import a css file for styling

const VideoWindow = () => {
  return (
    <Draggable bounds="parent">
      <div className="video-container">
        <div className="video-header">Drag me around</div>
        <div style={{widows : "100px" , height : "100px"}}>
            op
        </div>
      </div>
    </Draggable>
  );
};

export default VideoWindow;
