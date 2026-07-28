import React, { useEffect, useRef, useState } from "react";
import PhaserGame from "../game/PhaserGame.jsx";
import {
  getMusicVolume,
  getSfxVolume,
  playSound,
  playTypewriterSound,
  setMusicVolume,
  setSfxVolume,
} from "../audioSettings.js";
import "./GameScreen.css";

const introTitle =
  "This screen is for your eyes, and your eyes only.";
const introExplanation =
  "Keep your screen hidden from the other player. You each see a different world, so describe what you see and work together.";

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
  const [typedIntroTitle, setTypedIntroTitle] = useState("");
  const [typedIntroExplanation, setTypedIntroExplanation] =
    useState("");
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
    const timers = [];
    const intervals = [];

    const typeText = (text, setText, delay, speed) => {
      const timer = window.setTimeout(() => {
        let character = 0;
        const interval = window.setInterval(() => {
          character += 1;
          const typedCharacter = text[character - 1];

          setText(text.slice(0, character));

          if (/[a-z0-9]/i.test(typedCharacter)) {
            playTypewriterSound(typedCharacter);
          }

          if (character === text.length) {
            window.clearInterval(interval);
          }
        }, speed);

        intervals.push(interval);
      }, delay);

      timers.push(timer);
    };

    if (gameReady && !hasPlayedJoinSound.current) {
      playSound(
        "./assets/audio/UI Sounds/Player Join Sound.wav",
        "playerJoin"
      );
      hasPlayedJoinSound.current = true;
      setTypedIntroTitle("");
      setTypedIntroExplanation("");

      const titleSpeed = 55;
      const explanationSpeed = 42;
      const explanationDelay =
        introTitle.length * titleSpeed + 700;
      const introLength =
        explanationDelay +
        introExplanation.length * explanationSpeed +
        7500;

      typeText(
        introTitle,
        setTypedIntroTitle,
        500,
        titleSpeed
      );
      typeText(
        introExplanation,
        setTypedIntroExplanation,
        explanationDelay,
        explanationSpeed
      );

      const introTimer = window.setTimeout(() => {
        setShowGame(true);
      }, introLength);
      timers.push(introTimer);
    }

    if (!gameReady) {
      hasPlayedJoinSound.current = false;
      setShowGame(false);
      setTypedIntroTitle("");
      setTypedIntroExplanation("");
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      intervals.forEach((interval) =>
        window.clearInterval(interval)
      );
    };
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
        <div className="GameIntroContent">
          <p className="GameIntroTitle">
            {typedIntroTitle}
          </p>
          <p className="GameIntroExplanation">
            {typedIntroExplanation}
          </p>
        </div>
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
