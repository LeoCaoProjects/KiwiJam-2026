import React from "react";
import "./IntroVideo.css";

export default function IntroVideo({ onFinish }) {
  return (
    <div className="IntroVideoContainer">
      <video
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
        className="intro-video"
      >
        <source src="/assets/video/Loading.mp4" type="video/mp4" />
      </video>
    </div>
  );
}