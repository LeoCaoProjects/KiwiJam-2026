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
import {
  getMixedVolume,
  playSound,
  subscribeAudioSettings,
} from "./audioSettings.js";

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
  let musicSource = "./assets/audio/MAIN/Menu Loop.wav";
  let musicMix = "menuMusic";

  if (gameFinished) {
    musicSource = "./assets/audio/MAIN/Main Gameplay Loop.wav";
    musicMix = "creditsMusic";
  } else if (gameStarted) {
    if (level >= 4) {
      musicSource =
        "./assets/audio/MAIN/Gameplay Loop Creepier.wav";
      musicMix = "creepyMusic";
    } else {
      musicSource =
        "./assets/audio/Main Gameplay Loop Updated Mix 1.wav";
      musicMix = "gameplayMusic";
    }
  }

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
    const unsubscribe = subscribeAudioSettings(() => {
      if (audioRef.current) {
        audioRef.current.volume = getMixedVolume(musicMix);
      }
    });
    return unsubscribe;
  }, [musicMix]);

  useEffect(() => {
    return () => roomRef.current?.leave();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !serverReady) {
      return;
    }

    audio.volume = getMixedVolume(musicMix);
    audio.loop = !gameFinished;
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
  }, [gameFinished, musicMix, musicSource, serverReady]);

  function connectToRoom(nextRoom) {
    roomRef.current = nextRoom;
    setPlayers([]);
    setBlocks([]);
    setRoom(nextRoom);
    setLobbyCode(nextRoom.roomId);
    setLevel(nextRoom.state.level ?? 0);
    setGameFinished(nextRoom.state.finished ?? false);
    setStatus("Connected to lobby.");

    const refreshPlayers = () => setPlayers(getPlayers(nextRoom));
    const refreshBlocks = () => setBlocks(getBlocks(nextRoom));

    nextRoom.onMessage("level", (nextLevel) => {
      playSound(
        "./assets/audio/UI Sounds/Player Join Sound.wav",
        "playerJoin"
      );
      setLevel(nextLevel);
    });

    nextRoom.onMessage("finished", () => {
      playSound(
        "./assets/audio/UI Sounds/Player Join Sound.wav",
        "playerJoin"
      );
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
      const nextRoom = await createLobby();
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
      const nextRoom = await joinLobby(lobbyCode);
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

  const persistentAudio = <audio ref={audioRef} autoPlay />;
  let content;

  if (!serverReady) {
    content = (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
          color: "white",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
          Waking up the game server...
        </p>
        <p style={{ maxWidth: "34rem", margin: 0 }}>
          This may take up to a minute. Don&apos;t refresh. The
          game starts automatically.
        </p>
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
        lobbyCode={lobbyCode}
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
