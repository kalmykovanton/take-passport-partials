import React, { Component } from "react";
import axios from "axios";

import AppCamera from "./AppCamera";
import AppButton from "./AppButton";
import AppImage from "./AppImage";

class App extends Component {
  state = {
    croppedPhoto: "",
    croppedBarCode: "",
    timestamp: "",
    videoRef: null,
    photoRectW: 0,
    photoRectH: 0,
    photoRectX: 0,
    photoRectY: 0,
    barCodeRectW: 0,
    barCodeRectH: 0,
    barCodeRectX: 0,
    barCodeRectY: 0
  };

  componentDidMount() {
    window.addEventListener("resize", this.initCamera);
  }

  sendToS3 = (data, name) => {
    axios
      .post(process.env.REACT_APP_BE_PATH_TO_UPLOAD, {
        photo: data,
        name
      })
      .then(r => r)
      .catch(e => console.error("UPLOAD ERROR => ", e));
  };

  createPartialFrameOverlay = ({
    selector,
    videoW,
    videoH,
    rectW,
    rectH,
    x,
    y
  }) => {
    const canvasOverlay = document.getElementById(selector);
    canvasOverlay.width = videoW;
    canvasOverlay.height = videoH;
    const ctx = canvasOverlay.getContext("2d");
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(x, y, rectW, rectH);
  };

  initCamera = () => {
    const video = document.querySelector("video");

    if (!video) return;

    const videoW = video.offsetWidth;
    const videoH = video.offsetHeight;
    const isLandscapeMode = video.offsetWidth > video.offsetHeight;

    const photoRectH = isLandscapeMode ? videoH * 0.34 : videoH * 0.2;
    const photoRectW = isLandscapeMode ? videoW * 0.2 : videoW * 0.34;
    const photoRectX = isLandscapeMode ? videoW * 0.07 : videoW * 0.35;
    const photoRectY = isLandscapeMode ? videoH * 0.3 : videoH * 0.065;

    const barCodeRectH = isLandscapeMode ? videoH * 0.16 : videoH * 0.94;
    const barCodeRectW = isLandscapeMode ? videoW * 0.94 : videoW * 0.16;
    const barCodeRectX = isLandscapeMode
      ? (videoW - barCodeRectW) / 2
      : videoW * 0.055;
    const barCodeRectY = isLandscapeMode
      ? videoH * 0.78
      : (videoH - barCodeRectH) / 2;

    this.createPartialFrameOverlay({
      selector: "canvas-photo-frame-overlay",
      videoW,
      videoH,
      rectW: photoRectW,
      rectH: photoRectH,
      x: photoRectX,
      y: photoRectY
    });

    this.createPartialFrameOverlay({
      selector: "canvas-bar-code-frame-overlay",
      videoW,
      videoH,
      rectW: barCodeRectW,
      rectH: barCodeRectH,
      x: barCodeRectX,
      y: barCodeRectY
    });

    this.setState({
      videoRef: video,
      photoRectW,
      photoRectH,
      photoRectX,
      photoRectY,
      barCodeRectW,
      barCodeRectH,
      barCodeRectX,
      barCodeRectY
    });
  };

  cropImage = (img, newWidth, newHeight, startX, startY) => {
    const tnCanvas = document.createElement("canvas");
    const tnCanvasContext = tnCanvas.getContext("2d");
    tnCanvas.width = newWidth;
    tnCanvas.height = newHeight;

    const bufferCanvas = document.createElement("canvas");
    const bufferContext = bufferCanvas.getContext("2d");
    bufferCanvas.width = img.width;
    bufferCanvas.height = img.height;
    bufferContext.drawImage(img, 0, 0, img.width, img.height);

    tnCanvasContext.drawImage(
      bufferCanvas,
      startX,
      startY,
      newWidth,
      newHeight,
      0,
      0,
      newWidth,
      newHeight
    );

    return tnCanvas.toDataURL();
  };

  onCameraStart = setTimeout(this.initCamera, 2000);

  onTakePhoto = dataUri => {
    const {
      videoRef,
      photoRectW,
      photoRectH,
      photoRectX,
      photoRectY,
      barCodeRectW,
      barCodeRectH,
      barCodeRectX,
      barCodeRectY
    } = this.state;

    const img = new Image();
    img.src = dataUri;
    img.width = videoRef.offsetWidth;
    img.height = videoRef.offsetHeight;
    img.onload = () => {
      const croppedPhoto = this.cropImage(
        img,
        photoRectW,
        photoRectH,
        photoRectX,
        photoRectY
      );
      const croppedBarCode = this.cropImage(
        img,
        barCodeRectW,
        barCodeRectH,
        barCodeRectX,
        barCodeRectY
      );

      const timestamp = Date.now();

      this.setState({ croppedPhoto, croppedBarCode, timestamp });
      this.sendToS3(dataUri, `passport_photo_${timestamp}`);
      this.sendToS3(dataUri, `passport_bar_code_${timestamp}`);
    };
  };

  openInNewTab = data => () => {
    const newWindow = window.open();
    newWindow.document.write(`<img src="${data}">`);
  };

  render() {
    const { croppedPhoto, croppedBarCode, timestamp } = this.state;
    const canShowCamera = !croppedPhoto && !croppedBarCode;

    return (
      <div className="app">
        {canShowCamera && (
          <AppCamera
            onTakePhoto={this.onTakePhoto}
            onCameraStart={this.onCameraStart}
          />
        )}
        {croppedPhoto && (
          <React.Fragment>
            <div className="images-wrapper">
              <div
                className="images-wrapper__item"
                style={{ marginRight: "15px" }}
              >
                <AppImage src={croppedPhoto} />
                <AppButton
                  title={`passport_photo_${timestamp}`}
                  onClick={this.openInNewTab(croppedPhoto)}
                />
                <AppImage src={croppedBarCode} />
                <AppButton
                  title={`passport_bar_code_${timestamp}`}
                  onClick={this.openInNewTab(croppedBarCode)}
                />
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default App;
