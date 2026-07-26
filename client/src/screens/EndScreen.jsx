import React from "react";

const playSound = (path, volume = 0.5) => {
  const sfx = new Audio(path);
  sfx.volume = volume;
  sfx.play();
};

export default function EndScreen({ onReturnHome }) {
  return (
    <div className="EndScreenContainer">
      <h1>The End</h1>
      <h2>Credits</h2>
      <ul>
        <li>Game Developer: </li>
        <li>Map Developers: </li>
        <li>CEO: </li>
        <li>Music Developer: </li>
      </ul>

      <button
        type="button"
        onClick={() => {
          playSound("/assets/audio/UI Sounds/UI Menu Click.mp3", 1);
          onReturnHome();
        }}
      >
        Return to Menu
      </button>
    </div>
  );
}