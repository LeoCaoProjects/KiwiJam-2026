import React from "react";
import PhaserGame from "../game/PhaserGame.jsx";

export default function GameScreen({ room, players, level, onLeave }) {
  if (players.length === 2) {
    return <PhaserGame room={room} players={players} level={level} />;
  }

  return (
    <main>
      <p>Lobby code: <strong>{room.roomId}</strong></p>
      <p>
        <button type="button" onClick={onLeave}>Leave lobby</button>
      </p>
    </main>
  );
}
