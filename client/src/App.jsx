import React, { useEffect, useRef, useState } from "react";
import IntroVideo from "./screens/IntroVideo.jsx";
import CreditsVideo from "./screens/CreditsVideo.jsx";
import LobbyScreen from "./screens/LobbyScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import {
  createLobby,
  isServerReady,
  joinLobby,
  SERVER_URL,
} from "./network/colyseusClient.js";
import { getVolume, subscribeAudioSettings } from "./audioSettings.js";

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

  const [serverReady, setServerReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [name, setName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [level, setLevel] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [status, setStatus] = useState(`Server: ${SERVER_URL}`);
  const bothPlayersConnected =
    players.some((player) => player.slot === 1) &&
    players.some((player) => player.slot === 2);
  const gameStarted =
    !showIntro && Boolean(room) && bothPlayersConnected;
  let musicSource = "/assets/audio/MAIN/Menu Loop.wav";

  if (gameStarted) {
    musicSource =
      level >= 4
        ? "/assets/audio/MAIN/Gameplay Loop Creepier.wav"
        : "/assets/audio/Main Gameplay Loop Updated Mix 1.wav";
  }

  const musicVolume = gameStarted ? 0.35 : 0.55;

  useEffect(() => {
    let cancelled = false;
    let retryTimer;

    async function checkServer() {
      const ready = await isServerReady();

      if (cancelled) {
        return;
      }

      if (ready) {
        setServerReady(true);
        return;
      }

      retryTimer = window.setTimeout(checkServer, 2000);
    }

    checkServer();

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, []);

  // Start music on the very first click anywhere in the app
  useEffect(() => {
    if (!serverReady) {
      return;
    }

    const startMusicOnce = () => {
      if (!musicStartedRef.current && audioRef.current) {
        audioRef.current.play().catch(() => {});
        musicStartedRef.current = true;
      }
      window.removeEventListener("click", startMusicOnce);
    };

    window.addEventListener("click", startMusicOnce);
    return () => window.removeEventListener("click", startMusicOnce);
  }, [serverReady]);

  // Keep music volume in sync with the settings slider, even mid-playback
  useEffect(() => {
    const unsubscribe = subscribeAudioSettings(({ volume }) => {
      if (audioRef.current) {
        audioRef.current.volume = volume * musicVolume;
      }
    });
    return unsubscribe;
  }, [musicVolume]);

  useEffect(() => {
    return () => roomRef.current?.leave();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !serverReady) {
      return;
    }

    if (gameFinished) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    audio.volume = musicVolume * getVolume();
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
  }, [gameFinished, musicSource, musicVolume, serverReady]);

  function connectToRoom(nextRoom) {
    roomRef.current = nextRoom;
    setPlayers([]);
    setBlocks([]);
    setRoom(nextRoom);
    setLobbyCode(nextRoom.roomId);
    setLevel(0);
    setGameFinished(false);
    setStatus("Connected to lobby.");

    const refreshPlayers = () => setPlayers(getPlayers(nextRoom));
    const refreshBlocks = () => setBlocks(getBlocks(nextRoom));

    nextRoom.onMessage("level", (nextLevel) => {
      setLevel(nextLevel);
    });

    nextRoom.onMessage("finished", () => {
      setGameFinished(true);
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
    setGameFinished(false);
    setStatus("Left lobby.");

    await activeRoom?.leave();
  }

  const persistentAudio = <audio ref={audioRef} loop autoPlay />;
  let content;

  if (!serverReady) {
    content = (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
          color: "white",
        }}
      >
        Server is loading...
      </div>
    );
  } else if (gameFinished) {
    content = <CreditsVideo />;
  } else if (showIntro) {
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
