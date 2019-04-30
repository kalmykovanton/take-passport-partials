import React from "react";
import Camera from "./Camera.js";

const AppCamera = ({ onTakePhoto, onCameraStart, videoHeight, videoWidth}) => (
  <div>
    <canvas
      className="canvas-partial-frame-overlay"
      id="canvas-photo-frame-overlay"
    />
    <canvas
      className="canvas-partial-frame-overlay"
      id="canvas-bar-code-frame-overlay"
    />
    <Camera
      videoHeight={videoHeight}
      videoWidth={videoWidth}
      onTakePhoto={onTakePhoto}
      onCameraStart={onCameraStart}
      isImageMirror={false}
    />
  </div>
);

export default AppCamera;
