import React, { useState } from "react";
import "./IntroVideo.css";

export default function CreditsVideo() {
  const [finished, setFinished] = useState(false);

  return (
    <div className="IntroVideoContainer">
      {!finished && (
        <video
          autoPlay
          playsInline
          onEnded={() => setFinished(true)}
          className="intro-video"
        >
          <source src="/assets/video/credits.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
