import React, { useEffect, useRef, useState } from "react";
import IntroVideo from "./screens/IntroVideo.jsx";
import LobbyScreen from "./screens/LobbyScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import EndScreen from "./screens/EndScreen.jsx";
import { createLobby, joinLobby, SERVER_URL } from "./network/colyseusClient.js";
import { getVolume, subscribeAudioSettings } from "./audioSettings.js";

const MUSIC_BASE_VOLUME = 0.2; // music sits quieter than SFX at 100% setting

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
  const audioRef = useRef(null);
  const musicStartedRef = useRef(false);

  const [showIntro, setShowIntro] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [name, setName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState(`Server: ${SERVER_URL}`);

  // Start music on the very first click anywhere in the app
  useEffect(() => {
    const startMusicOnce = () => {
      if (!musicStartedRef.current && audioRef.current) {
        audioRef.current.volume = getVolume() * MUSIC_BASE_VOLUME;
        audioRef.current.play();
        musicStartedRef.current = true;
      }
      window.removeEventListener("click", startMusicOnce);
    };

    window.addEventListener("click", startMusicOnce);
    return () => window.removeEventListener("click", startMusicOnce);
  }, []);

  // Keep music volume in sync with the settings slider, even mid-playback
  useEffect(() => {
    const unsubscribe = subscribeAudioSettings(({ volume }) => {
      if (audioRef.current) {
        audioRef.current.volume = volume * MUSIC_BASE_VOLUME;
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => roomRef.current?.leave();
  }, []);

  function connectToRoom(nextRoom) {
    roomRef.current = nextRoom;
    setRoom(nextRoom);
    setLobbyCode(nextRoom.roomId);
    setStatus("Connected to lobby.");

    const refreshPlayers = () => setPlayers(getPlayers(nextRoom));

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
    setStatus("Left lobby.");

    await activeRoom?.leave();
  }

  function returnHome() {
    setGameOver(false);
    setRoom(null);
    setPlayers([]);
    setStatus(`Server: ${SERVER_URL}`);
  }

  const persistentAudio = (
    <audio ref={audioRef} loop>
      <source src="/assets/audio/MAIN/Menu Loop.wav" type="audio/wav" />
    </audio>
  );

  if (showIntro) {
    return (
      <>
        {persistentAudio}
        <IntroVideo onFinish={() => setShowIntro(false)} />
      </>
    );
  }

  if (gameOver) {
    return (
      <>
        {persistentAudio}
        <EndScreen onReturnHome={returnHome} />
      </>
    );
  }

  if (room) {
    return (
      <>
        {persistentAudio}
        <GameScreen
          room={room}
          players={players}
          status={status}
          onLeave={leave}
          onGameEnd={() => setGameOver(true)}
        />
      </>
    );
  }

  return (
    <>
      {persistentAudio}
      <LobbyScreen
        name={name}
        lobbyCode={lobbyCode}
        status={status}
        onNameChange={setName}
        onLobbyCodeChange={setLobbyCode}
        onCreate={create}
        onJoin={join}
      />
    </>
  );
}