import React from "react";
import PhaserGame from "../game/PhaserGame.jsx";

export default function GameScreen({ room, players, status, onLeave }) {
  const playerOne = players.find((player) => player.slot === 1);
  const playerTwo = players.find((player) => player.slot === 2);

  return (
    <main>
      <h1>Two Player Lobby</h1>
      <p>{status}</p>
      <p>Share this lobby code with Player 2: <strong>{room.roomId}</strong></p>
      <p>Players connected: {players.length} / 2</p>

      <ul>
        <li>Player 1: {playerOne?.name || "waiting"}</li>
        <li>Player 2: {playerTwo?.name || "waiting"}</li>
      </ul>

      <fieldset>
        <PhaserGame players={players} />
      </fieldset>

      <p>
        <button type="button" onClick={onLeave}>Leave lobby</button>
      </p>
    </main>
  );
}
