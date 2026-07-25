import React, { useEffect, useRef, useState } from "react";
import LobbyScreen from "./screens/LobbyScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import { createLobby, joinLobby, SERVER_URL } from "./network/colyseusClient.js";

function getPlayers(room) {
  const players = [];

  room.state.players.forEach((player, sessionId) => {
    players.push({
      sessionId,
      name: player.name,
      slot: player.slot,
      x: player.x,
      y: player.y,
    });
  });

  return players.sort((a, b) => a.slot - b.slot);
}

export default function App() {
  const roomRef = useRef(null);
  const [name, setName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState(`Server: ${SERVER_URL}`);

  useEffect(() => {
    return () => roomRef.current?.leave();
  }, []);

  function connectToRoom(nextRoom) {
    roomRef.current = nextRoom;
    setRoom(nextRoom);
    setLobbyCode(nextRoom.roomId);
    setLevel(0);
    setStatus("Connected to lobby.");

    const refreshPlayers = () => setPlayers(getPlayers(nextRoom));

    nextRoom.onMessage("level", (nextLevel) => {
      setLevel(nextLevel);
    });

    nextRoom.state.players.onAdd((player) => {
      player.onChange(refreshPlayers);
      refreshPlayers();
    });

    nextRoom.state.players.onRemove(refreshPlayers);
    refreshPlayers();

    nextRoom.onLeave(() => {
      if (roomRef.current === nextRoom) {
        setStatus("Disconnected from lobby.");
      }
    });
  }

  async function create() {
    setStatus("Creating lobby...");

    try {
      const nextRoom = await createLobby(name.trim());
      connectToRoom(nextRoom);
    } catch (error) {
      setStatus(error.message || "Could not create lobby.");
    }
  }

  async function join() {
    if (!lobbyCode.trim()) {
      setStatus("Enter a lobby code first.");
      return;
    }

    setStatus("Joining lobby...");

    try {
      const nextRoom = await joinLobby(lobbyCode, name.trim());
      connectToRoom(nextRoom);
    } catch (error) {
      setStatus(error.message || "Could not join that lobby.");
    }
  }

  async function leave() {
    const activeRoom = roomRef.current;

    roomRef.current = null;
    setRoom(null);
    setPlayers([]);
    setLevel(0);
    setStatus("Left lobby.");

    await activeRoom?.leave();
  }

  if (room) {
    return (
      <GameScreen
        room={room}
        players={players}
        level={level}
        onLeave={leave}
      />
    );
  }

  return (
    <LobbyScreen
      name={name}
      lobbyCode={lobbyCode}
      status={status}
      onNameChange={setName}
      onLobbyCodeChange={setLobbyCode}
      onCreate={create}
      onJoin={join}
    />
  );
}
