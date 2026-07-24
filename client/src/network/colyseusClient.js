import { Client } from "colyseus.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "ws://localhost:2567";

const client = new Client(SERVER_URL);

export function createLobby(playerName) {
  return client.create("game_room", { name: playerName });
}

export function joinLobby(lobbyCode, playerName) {
  return client.joinById(lobbyCode.trim(), { name: playerName });
}

export { client, SERVER_URL };
