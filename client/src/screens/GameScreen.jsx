import React, { useEffect, useRef, useState } from "react";
import PhaserGame from "../game/PhaserGame.jsx";
import {
  getMusicVolume,
  getSfxVolume,
  playSound,
  setMusicVolume,
  setSfxVolume,
} from "../audioSettings.js";
import "./GameScreen.css";

export default function GameScreen({
  room,
  players,
  blocks,
  level,
  status,
  onLeave,
}) {
  const playerOne = players.find((player) => player.slot === 1);
  const playerTwo = players.find((player) => player.slot === 2);
  const gameReady = Boolean(playerOne && playerTwo);
  const hasPlayedJoinSound = useRef(false);
  const [showGame, setShowGame] = useState(false);
  const [showAudioSettings, setShowAudioSettings] =
    useState(false);
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

  const toggleAudioSettings = () => {
    playSound(
      "./assets/audio/UI Sounds/UI Menu Click2.wav",
      "uiClick"
    );
    setShowAudioSettings((current) => !current);
  };

  useEffect(() => {
    let introTimer;

    if (gameReady && !hasPlayedJoinSound.current) {
      playSound(
        "./assets/audio/UI Sounds/Player Join Sound.wav",
        "playerJoin"
      );
      hasPlayedJoinSound.current = true;
      introTimer = window.setTimeout(() => {
        setShowGame(true);
      }, 3000);
    }

    if (!gameReady) {
      hasPlayedJoinSound.current = false;
      setShowGame(false);
    }

    return () => window.clearTimeout(introTimer);
  }, [gameReady]);

  if (gameReady && showGame) {
    return (
      <div className="GameplayView">
        <PhaserGame
          room={room}
          players={players}
          blocks={blocks}
          level={level}
        />

        {showAudioSettings && (
          <div
            className="GameAudioSettings"
            aria-label="Audio settings"
          >
            <p>Audio</p>

            <div className="game-setting-row">
              <label htmlFor="game-music-volume">Music</label>
              <input
                id="game-music-volume"
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

            <div className="game-setting-row">
              <label htmlFor="game-sfx-volume">SFX</label>
              <input
                id="game-sfx-volume"
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

          </div>
        )}

        <button
          type="button"
          className="GameAudioButton"
          aria-label="Open audio settings"
          aria-expanded={showAudioSettings}
          onClick={toggleAudioSettings}
        >
          <img src="./assets/images/volume.png" alt="" />
        </button>
      </div>
    );
  }

  if (gameReady) {
    return (
      <div className="GameIntro">
        <p>You're awake, but not alone</p>
      </div>
    );
  }

  return (
    <div className="GameScreenContainer">
      <h1>Lobby</h1>
      <p>{status}</p>
      <p className="room-code">Lobby Code: <strong>{room.roomId}</strong></p>
      <p>Players connected: {players.length} / 2</p>

      <p className="buttons">
        <button type="button" onClick={() => {
          playSound(
            "./assets/audio/UI Sounds/UI Menu Click.mp3",
            "uiClick"
          );
          onLeave();}}>
          Leave lobby
        </button>
      </p>
    </div>
  );
}
