import React, { Component } from "react";
import axios from "axios";

import AppCamera from "./AppCamera";
import AppButton from "./AppButton";
import AppImage from "./AppImage";

class App extends Component {
  state = {
    passportAspectRatio: 1.414634146,
    croppedPhoto: "",
    croppedBarCode: "",
    timestamp: "",
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
    this.videoRef = document.querySelector("video");
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

  getViewPortInfo = () => {
    const viewPortWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const viewPortHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const viewPortAspectRatio = viewPortWidth / viewPortHeight || 0;

    const isLandscapeMode = viewPortWidth > viewPortHeight;

    return {
      viewPortWidth,
      viewPortHeight,
      viewPortAspectRatio,
      isLandscapeMode,
    }
  };

  getOptimalVideoDimensions = () => {
    const {viewPortHeight, viewPortWidth, viewPortAspectRatio} = this.getViewPortInfo();
    const {passportAspectRatio} = this.state;

    if (viewPortAspectRatio > passportAspectRatio) {
      return {
        height: viewPortHeight,
        width: Math.floor(viewPortHeight * passportAspectRatio),
      };
    } else {
      return {
        width: viewPortWidth,
        height: Math.floor(viewPortWidth / passportAspectRatio),
      };
    }
  };

  initCamera = () => {
    if (!this.videoRef) return;

    if (this.state.croppedPhoto || this.state.croppedBarCode) return;

    const {height: videoH, width: videoW} = this.getOptimalVideoDimensions();

    let photoRectH;
    let photoRectW;
    let photoRectX;
    let photoRectY;
    let barCodeRectH;
    let barCodeRectW;
    let barCodeRectX;
    let barCodeRectY;

    // if (isLandscapeMode) {
    barCodeRectH = videoH * 0.16;
    barCodeRectW = videoW * 0.94;

    barCodeRectX = (videoW - barCodeRectW) / 2;
    barCodeRectY = videoH * 0.78;

    photoRectH = videoH * 0.49;
    photoRectW = videoW * 0.27;

    photoRectX = barCodeRectX;
    photoRectY = videoH * 0.25;
    // } else {
    //   photoRectH = videoH * 0.2;
    //   photoRectW = videoW * 0.34;
    //   photoRectX = videoW * 0.35;
    //   photoRectY = videoH * 0.065;
    //
    //   barCodeRectH = videoH * 0.94;
    //   barCodeRectW = videoW * 0.16;
    //   barCodeRectX = videoW * 0.055;
    //   barCodeRectY = (videoH - barCodeRectH) / 2;
    // }

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
      photoRectW,
      photoRectH,
      photoRectX,
      photoRectY,
      barCodeRectW,
      barCodeRectH,
      barCodeRectX,
      barCodeRectY,
      videoW,
      videoH,
    });
  };

  cropImage = (img, newWidth, newHeight, startX, startY, height, width) => {
    const tnCanvas = document.createElement("canvas");
    const tnCanvasContext = tnCanvas.getContext("2d");
    tnCanvas.width = newWidth;
    tnCanvas.height = newHeight;

    const bufferCanvas = document.createElement("canvas");
    const bufferContext = bufferCanvas.getContext("2d");

    bufferCanvas.width = width;
    bufferCanvas.height = height;
    bufferContext.drawImage(img, 0, 0, width, height);

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

  getRenderedSize = (cWidth, cHeight, width, height, pos) => {
    var oRatio = width / height,
      cRatio = cWidth / cHeight;
    return function() {
      if (oRatio < cRatio) {
        this.width = cWidth;
        this.height = cWidth / oRatio;
      } else {
        this.width = cHeight * oRatio;
        this.height = cHeight;
      }
      this.left = (cWidth - this.width)*(pos/100);
      this.right = this.width + this.left;
      return this;
    }.call({});
  };

  getImgSizeInfo = (img) => {
    return this.getRenderedSize(
      img.width,
      img.height,
      img.naturalWidth,
      img.naturalHeight,
      50,
    )
  };

  onTakePhoto = dataUri => {
    const {
      photoRectW,
      photoRectH,
      photoRectX,
      photoRectY,
      barCodeRectW,
      barCodeRectH,
      barCodeRectX,
      barCodeRectY,
      videoH,
      videoW,
    } = this.state;

    const img = new Image();
    img.style.objectFit = 'cover';
    img.src = dataUri;
    img.width = videoW;
    img.height = videoH;
    img.onload = (e) => {
      const {height, width, left } = this.getImgSizeInfo(e.target);

      const croppedPhoto = this.cropImage(
        e.target,
        photoRectW,
        photoRectH,
        photoRectX + Math.abs(left),
        photoRectY,
        height,
        width
      );
      const croppedBarCode = this.cropImage(
        e.target,
        barCodeRectW,
        barCodeRectH,
        barCodeRectX + Math.abs(left),
        barCodeRectY,
        height,
        width
      );

      const timestamp = Date.now();

      this.setState({croppedPhoto, croppedBarCode, timestamp});
      this.sendToS3(croppedPhoto, `passport_photo_${timestamp}`);
      this.sendToS3(croppedBarCode, `passport_bar_code_${timestamp}`);
    };
  };

  openInNewTab = data => () => {
    const newWindow = window.open();
    newWindow.document.write(`<img src="${data}">`);
  };

  render() {
    const {croppedPhoto, croppedBarCode, timestamp, videoW, videoH, dataUri} = this.state;
    const canShowCamera = !croppedPhoto && !croppedBarCode;

    if (dataUri) {
      return (
        <div className="app">
          <img src={dataUri} width={videoW} alt=""/>
        </div>
      )
    }

    return (
      <div className="app">
        {canShowCamera && (
          <AppCamera
            onTakePhoto={this.onTakePhoto}
            onCameraStart={this.onCameraStart}
            videoHeight={videoH}
            videoWidth={videoW}
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
