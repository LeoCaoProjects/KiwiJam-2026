import React from "react";

export default function LobbyScreen({
  name,
  lobbyCode,
  status,
  onNameChange,
  onLobbyCodeChange,
  onCreate,
  onJoin,
}) {
  return (
    <main>
      <h1>Two Player Lobby</h1>
      <p>React user interface</p>
      <p>{status}</p>

      <p>
        <label htmlFor="name">Your name: </label>
        <input
          id="name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </p>

      <p>
        <button type="button" onClick={onCreate}>Create lobby</button>
      </p>

      <p>
        <label htmlFor="lobby-code">Lobby code: </label>
        <input
          id="lobby-code"
          value={lobbyCode}
          onChange={(event) => onLobbyCodeChange(event.target.value)}
        />
        <button type="button" onClick={onJoin}>Join lobby</button>
      </p>
    </main>
  );
}
