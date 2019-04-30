import React, { Fragment } from 'react';
import CameraPhoto, { FACING_MODES } from 'jslib-html5-camera-photo';

class Camera extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.cameraPhoto = null;
    this.videoRef = React.createRef();
  }

  componentDidMount () {
    this.cameraPhoto = new CameraPhoto(this.videoRef.current);
    this.startCamera();
  }

  startCamera () {
    const idealFacingMode = FACING_MODES.ENVIRONMENT;
    const idealResolution = { width: 1920, height: 1080 };
    this.cameraPhoto.startCamera(idealFacingMode, idealResolution);
  }

  takePhoto = () => {
    const { onTakePhoto } = this.props;
    const config = { sizeFactor: 1 };
    onTakePhoto(this.cameraPhoto.getDataUri(config));
  };

  render () {
    const { videoWidth, videoHeight } = this.props;
    return (
      <Fragment>
        <video
          ref={this.videoRef}
          width={videoWidth}
          height={videoHeight}
          playsInline
          autoPlay={true}
        />
        <span className="take-photo" onClick={this.takePhoto} />
      </Fragment>
    );
  }
}

export default Camera;
