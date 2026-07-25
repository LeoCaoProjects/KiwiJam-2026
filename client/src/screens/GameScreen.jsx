import React, { useEffect, useRef } from "react";
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
  level,
  status,
  onLeave,
}) {
  const playerOne = players.find((player) => player.slot === 1);
  const playerTwo = players.find((player) => player.slot === 2);
  const hasPlayedJoinSound = useRef(false);

  useEffect(() => {
    if (players.length === 2 && !hasPlayedJoinSound.current) {
      playSound("/assets/audio/UI Sounds/Player Join Sound.wav", 1);
      hasPlayedJoinSound.current = true;
    }

    if (players.length < 2) {
      hasPlayedJoinSound.current = false;
    }
  }, [players]);

  if (players.length === 2) {
    return (
      <PhaserGame
        room={room}
        players={players}
        level={level}
      />
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

      <fieldset>
        <PhaserGame room={room} players={players} />
      </fieldset>

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
