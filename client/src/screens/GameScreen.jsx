import React, { useEffect, useRef, useState } from "react";
import PhaserGame from "../game/PhaserGame.jsx";
import "./GameScreen.css";

const playSound = (path, volume = 0.5) => {
  const sfx = new Audio(path);
  sfx.volume = volume;
  sfx.play();
};

export default function GameScreen({ room, players, status, onLeave }) {
  const playerOne = players.find((player) => player.slot === 1);
  const playerTwo = players.find((player) => player.slot === 2);

  const [lobbyReady, setLobbyReady] = useState("notReady");
  const hasPlayedJoinSound = useRef(false);

  useEffect(() => {
    if (players.length === 2 && !hasPlayedJoinSound.current) {
      playSound("/assets/audio/UI Sounds/Player Join Sound.wav", 1);
      hasPlayedJoinSound.current = true;
      setLobbyReady("ready");
    }

    if (players.length < 2) {
      hasPlayedJoinSound.current = false;
      setLobbyReady("notReady");
    }
  }, [players]);

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

        {lobbyReady === "ready" && (
            <button
              type="button"
              onClick={() => {
                playSound("/assets/audio/UI Sounds/Confirm menu sound.mp3", 1);
              }}
            >
              Play
            </button>
        )}
      </p>
    </div>
  );
}