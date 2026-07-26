import React, { useState } from "react";
import "./LobbyScreen.css";
import '@picocss/pico/css/pico.min.css';
import '../index.css';
import { getVolume, setVolume, getVfxEnabled, setVfxEnabled, playSound } from "../audioSettings.js";

export default function LobbyScreen({
  name,
  lobbyCode,
  status,
  onNameChange,
  onLobbyCodeChange,
  onCreate,
  onJoin,
}) {
  const [activeView, setActiveView] = useState(null); // null | "create" | "join" | "settings"
  const [volume, setVolumeState] = useState(getVolume());
  const [vfxEnabled, setVfxEnabledState] = useState(getVfxEnabled());

  const handleVolumeChange = (value) => {
    setVolumeState(value);
    setVolume(value);
  };

  const handleVfxToggle = () => {
    const next = !vfxEnabled;
    setVfxEnabledState(next);
    setVfxEnabled(next);
  };

  return (
    <div className="LobbyScreenContainer">
      <h1
        className="game-title"
        onClick={() => {
          playSound("/assets/audio/UI Sounds/UI Menu Click2.wav", 0.6);
          setActiveView(null);
        }}
      >
        BETWEEN<br />US
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

        {activeView === "settings" && (
          <div className="menu-row settings-row">
            <label htmlFor="volume">Volume: </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(event) => handleVolumeChange(parseFloat(event.target.value))}
            />
            <span>{Math.round(volume * 100)}%</span>

            <label htmlFor="vfx-toggle">Button SFX: </label>
            <input
              id="vfx-toggle"
              type="checkbox"
              checked={vfxEnabled}
              onChange={handleVfxToggle}
            />

            <button
              type="button"
              onClick={() => {
                playSound("/assets/audio/UI Sounds/UI Menu Click2.wav", 0.6);
                setActiveView(null);
              }}
            >
              Back
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
                setActiveView("settings");
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