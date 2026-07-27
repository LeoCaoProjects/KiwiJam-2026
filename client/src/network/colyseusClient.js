import { Client } from "colyseus.js";

const serverIp = import.meta.env.VITE_SERVER_IP?.trim();
const serverPort = import.meta.env.VITE_SERVER_PORT || "2567";
const serverHost = serverIp || "localhost";
const serverProtocol =
  window.location.protocol === "https:" ? "wss" : "ws";
const deployedServerUrl =
  "wss://between-us-server.onrender.com";
const SERVER_URL = (
  import.meta.env.VITE_SERVER_URL ||
  (
    window.location.protocol === "https:"
      ? deployedServerUrl
      : `${serverProtocol}://${serverHost}:${serverPort}`
  )
).replace(/\/+$/, "");
const SERVER_HTTP_URL = SERVER_URL
  .replace(/^wss:/, "https:")
  .replace(/^ws:/, "http:");

const client = new Client(SERVER_URL);

export async function isServerReady() {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    75000
  );

  try {
    const response = await fetch(
      `${SERVER_HTTP_URL}/health?time=${Date.now()}`,
      {
        cache: "no-store",
        signal: controller.signal,
      }
    );

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function createLobby() {
  return client.create("game_room");
}

export function joinLobby(lobbyCode) {
  return client.joinById(lobbyCode.trim());
}

export { client, SERVER_URL };
