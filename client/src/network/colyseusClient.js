import { Client } from "colyseus.js";

// During the jam: point this at whichever laptop is running the shared server,
// e.g. "ws://192.168.1.5:2567". Defaults to localhost for solo dev/testing.
// After deploying, swap this for your Fly.io/Railway server URL,
// e.g. "wss://your-app.fly.dev"
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "ws://localhost:2567";

const client = new Client(SERVER_URL);

export async function joinGameRoom(playerName) {
  const room = await client.joinOrCreate("game_room", { name: playerName });
  return room;
}

export { client, SERVER_URL };
