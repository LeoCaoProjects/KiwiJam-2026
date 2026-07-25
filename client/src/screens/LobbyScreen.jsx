import React, { useState } from "react";
import "./LobbyScreen.css";
import '@picocss/pico/css/pico.min.css';
import '../index.css';

const playSound = (path, volume = 0.5) => {
  const sfx = new Audio(path);
  sfx.volume = volume;
  sfx.play();
};

export default function LobbyScreen({
  name,
  lobbyCode,
  status,
  onNameChange,
  onLobbyCodeChange,
  onCreate,
  onJoin,
}) {
  const [activeView, setActiveView] = useState(null); // null | "create" | "join"

  return (
    <div className="LobbyScreenContainer">
      <h1 className="game-title" onClick={() => {
          playSound("/assets/audio/UI Sounds/UI Menu Click2.wav", 0.6);
          setActiveView(null);
        }}
      >
        BETWEEN<br/>US
      </h1>

      <div className="main-menu">

        {activeView === "create" && (
          <div className="menu-row">
            <label htmlFor="name">Your Name: </label>
            <input
              id="name"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                playSound("/assets/audio/UI Sounds/Confirm menu sound.mp3", 1);
                onCreate();
              }}
            >
              Confirm
            </button>
          </div>
        )}

        {activeView === "join" && (
          <div className="menu-row">
            <label htmlFor="lobby-code">Lobby code: </label>
            <input
              id="lobby-code"
              value={lobbyCode}
              onChange={(event) => onLobbyCodeChange(event.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                playSound("/assets/audio/UI Sounds/Confirm menu sound.mp3", 1);
                onJoin();
              }}
            >
              Confirm
            </button>
          </div>
        )}

        {activeView === null && (
          <>
            <button
              type="button"
              onClick={() => {
                playSound("/assets/audio/UI Sounds/UI Menu Click2.wav", 0.6);
                setActiveView("create");
              }}
            >
              Create lobby
            </button>
            <button
              type="button"
              onClick={() => {
                playSound("/assets/audio/UI Sounds/UI Menu Click2.wav", 0.6);
                setActiveView("join");
              }}
            >
              Join lobby
            </button>
            <button
              type="button"
              onClick={() => {
                playSound("/assets/audio/UI Sounds/UI Menu Click2.wav", 0.6);
              }}
            >
              Settings
            </button>
          </>
        )}

      </div>
    </div>
  );
}