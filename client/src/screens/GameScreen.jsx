import React, { useEffect, useRef, useState } from "react";
import PhaserGame from "../game/PhaserGame.jsx";
import "./GameScreen.css";

const playSound = (path, volume = 0.5) => {
  const sfx = new Audio(path);
  sfx.volume = volume;
  sfx.play();
};

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

  useEffect(() => {
    let introTimer;

    if (gameReady && !hasPlayedJoinSound.current) {
      playSound("/assets/audio/UI Sounds/Player Join Sound.wav", 0.3);
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
      <PhaserGame
        room={room}
        players={players}
        blocks={blocks}
        level={level}
      />
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

      <ul className="player-list">
        <li>Player 1: {playerOne?.name || "waiting"}</li>
        <li>Player 2: {playerTwo?.name || "waiting"}</li>
      </ul>

      <p className="buttons">
        <button type="button" onClick={() => {
          playSound("/assets/audio/UI Sounds/UI Menu Click.mp3", 1);
          onLeave();}}>
          Leave lobby
        </button>
      </p>
    </div>
  );
}
