import React from "react";
import Camera, { FACING_MODES } from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";

const AppCamera = ({ onTakePhoto, onCameraStart }) => (
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
      onTakePhoto={onTakePhoto}
      onCameraStart={onCameraStart}
      idealFacingMode={FACING_MODES.ENVIRONMENT}
      isImageMirror={false}
    />
  </div>
);

export default AppCamera;
