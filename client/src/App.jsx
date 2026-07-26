import React, { useEffect, useRef, useState } from "react";
import IntroVideo from "./screens/IntroVideo.jsx";
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

function getBlocks(room) {
  const blocks = [];

  room.state.blocks.forEach((block, ownerSessionId) => {
    blocks.push({
      ownerSessionId,
      ownerSlot: block.ownerSlot,
      x: block.x,
      y: block.y,
      level: block.level,
      expiresAt: block.expiresAt,
    });
  });

  return blocks;
}

export default function App() {
  const roomRef = useRef(null);
  const audioRef = useRef(null);
  const musicStartedRef = useRef(false);

  const [showIntro, setShowIntro] = useState(true);
  const [name, setName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState(`Server: ${SERVER_URL}`);
  const bothPlayersConnected =
    players.some((player) => player.slot === 1) &&
    players.some((player) => player.slot === 2);
  const gameStarted =
    !showIntro && Boolean(room) && bothPlayersConnected;
  const musicSource = gameStarted
    ? "/assets/audio/Main Gameplay Loop Updated Mix 1.wav"
    : "/assets/audio/MAIN/Menu Loop.wav";
  const musicVolume = gameStarted ? 0.35 : 0.55;

  // Start music on the very first click anywhere in the app
  useEffect(() => {
    const startMusicOnce = () => {
      if (!musicStartedRef.current && audioRef.current) {
        audioRef.current.play().catch(() => {});
        musicStartedRef.current = true;
      }
      window.removeEventListener("click", startMusicOnce);
    };

    window.addEventListener("click", startMusicOnce);
    return () => window.removeEventListener("click", startMusicOnce);
  }, []);

  useEffect(() => {
    return () => roomRef.current?.leave();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = musicVolume;
    audio.src = musicSource;
    audio.load();

    if (musicStartedRef.current) {
      audio.play().catch(() => {});
    } else {
      audio.play()
        .then(() => {
          musicStartedRef.current = true;
        })
        .catch(() => {});
    }
  }, [musicSource, musicVolume]);

  function connectToRoom(nextRoom) {
    roomRef.current = nextRoom;
    setPlayers([]);
    setBlocks([]);
    setRoom(nextRoom);
    setLobbyCode(nextRoom.roomId);
    setLevel(0);
    setStatus("Connected to lobby.");

    const refreshPlayers = () => setPlayers(getPlayers(nextRoom));
    const refreshBlocks = () => setBlocks(getBlocks(nextRoom));

    nextRoom.onMessage("level", (nextLevel) => {
      setLevel(nextLevel);
    });

    nextRoom.state.players.onAdd((player) => {
      player.onChange(refreshPlayers);
      refreshPlayers();
    });

    nextRoom.state.players.onRemove(refreshPlayers);

    nextRoom.state.blocks.onAdd((block) => {
      block.onChange(refreshBlocks);
      refreshBlocks();
    });

    nextRoom.state.blocks.onRemove(refreshBlocks);
    refreshPlayers();
    refreshBlocks();

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
    setBlocks([]);
    setLevel(0);
    setStatus("Left lobby.");

    await activeRoom?.leave();
  }

  const persistentAudio = <audio ref={audioRef} loop autoPlay />;
  let content;

  if (showIntro) {
    content = (
      <IntroVideo onFinish={() => setShowIntro(false)} />
    );
  } else if (room) {
    content = (
      <GameScreen
        room={room}
        players={players}
        blocks={blocks}
        level={level}
        status={status}
        onLeave={leave}
      />
    );
  } else {
    content = (
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

  return (
    <>
      {persistentAudio}
      {content}
    </>
  );
}
