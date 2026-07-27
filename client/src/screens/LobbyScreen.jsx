import React, { useState } from "react";
import "./LobbyScreen.css";
import {
  getMusicVolume,
  getSfxVolume,
  playSound,
  setMusicVolume,
  setSfxVolume,
} from "../audioSettings.js";

export default function LobbyScreen({
  lobbyCode,
  onLobbyCodeChange,
  onCreate,
  onJoin,
}) {
  const [activeView, setActiveView] = useState(null); // null | "join" | "settings"
  const [musicVolume, setMusicVolumeState] = useState(
    getMusicVolume()
  );
  const [sfxVolume, setSfxVolumeState] = useState(
    getSfxVolume()
  );

  const handleMusicVolumeChange = (value) => {
    setMusicVolumeState(value);
    setMusicVolume(value);
  };

  const handleSfxVolumeChange = (value) => {
    setSfxVolumeState(value);
    setSfxVolume(value);
  };

  return (
    <div className="LobbyScreenContainer">
      <button type="button" className="game-title" onClick={() => {
          playSound(
            "./assets/audio/UI Sounds/UI Menu Click2.wav",
            "uiClick"
          );
          setActiveView(null);
        }}
      >
        <img
          src="./assets/images/slightly-diagonal.png"
          alt="Between Us"
        />
      </button>

      <div className="main-menu">

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
                playSound(
                  "./assets/audio/UI Sounds/UI Menu Click2.wav",
                  "uiClick"
                );
                onJoin();
              }}
            >
              Confirm
            </button>
          </div>
        )}

        {activeView === "settings" && (
          <div className="menu-row settings-row">
            <div className="setting-control">
              <label htmlFor="music-volume">Music: </label>
              <input
                id="music-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVolume}
                onChange={(event) =>
                  handleMusicVolumeChange(
                    parseFloat(event.target.value)
                  )
                }
              />
              <span>{Math.round(musicVolume * 100)}%</span>
            </div>

            <div className="setting-control">
              <label htmlFor="sfx-volume">SFX: </label>
              <input
                id="sfx-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sfxVolume}
                onChange={(event) =>
                  handleSfxVolumeChange(
                    parseFloat(event.target.value)
                  )
                }
              />
              <span>{Math.round(sfxVolume * 100)}%</span>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound(
                  "./assets/audio/UI Sounds/UI Menu Click2.wav",
                  "uiClick"
                );
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
                playSound(
                  "./assets/audio/UI Sounds/UI Menu Click2.wav",
                  "uiClick"
                );
                onCreate();
              }}
            >
              Create lobby
            </button>
            <button
              type="button"
              onClick={() => {
                playSound(
                  "./assets/audio/UI Sounds/UI Menu Click2.wav",
                  "uiClick"
                );
                setActiveView("join");
              }}
            >
              Join lobby
            </button>
            <button
              type="button"
              onClick={() => {
                playSound(
                  "./assets/audio/UI Sounds/UI Menu Click2.wav",
                  "uiClick"
                );
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
