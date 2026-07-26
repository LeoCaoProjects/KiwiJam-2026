import { Client } from "colyseus.js";

const serverIp = import.meta.env.VITE_SERVER_IP?.trim();
const serverPort = import.meta.env.VITE_SERVER_PORT || "2567";
const serverHost = serverIp || "localhost";
const serverProtocol =
  window.location.protocol === "https:" ? "wss" : "ws";
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  `${serverProtocol}://${serverHost}:${serverPort}`;

const client = new Client(SERVER_URL);

export function createLobby(playerName) {
  return client.create("game_room", { name: playerName });
}

export function joinLobby(lobbyCode, playerName) {
  return client.joinById(lobbyCode.trim(), { name: playerName });
}

export { client, SERVER_URL };
