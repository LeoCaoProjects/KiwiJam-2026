# Kiwijam Game

Multiplayer 3D game built for Kiwijam. React + Three.js client, Colyseus (Node.js) server.

## Tech Stack

- Client: React + Three.js, built with Vite
- Server: Colyseus (Node.js), real-time state sync over WebSockets
- Database: none required, optional Supabase if we need accounts/leaderboards later
- Server hosting: Fly.io or Railway
- Client hosting: itch.io

See `TECH_STACK.md` for full details.

## Setup

Requires Node.js 18+ installed.

```bash
# install server deps
cd server
npm install

# install client deps
cd ../client
npm install
```

## Running Locally (solo dev)

Open two terminals.

```bash
# terminal 1: server
cd server
npm start
```

```bash
# terminal 2: client
cd client
npm run dev
```

Open the client URL Vite prints (usually `http://localhost:5173`).

## Testing Multiplayer on the Same Wifi

One person runs the server (`npm start` in `server/`), everyone else:

1. Find that person's local IP (e.g. `192.168.1.5`, run `ipconfig` on Windows or `ifconfig`/`ip a` on Mac/Linux)
2. Create a `.env` file in `client/` with:
   ```
   VITE_SERVER_URL=ws://192.168.1.5:2567
   ```
3. Run `npm run dev` in `client/` as normal, then open the printed URL

Everyone on the same wifi network can now join the same game.

## Project Structure

```
kiwijam-game/
├── client/      React + Three.js frontend
├── server/      Colyseus backend
├── TECH_STACK.md
└── README.md
```

## Controls

WASD or arrow keys to move.

## Deploying (optional, after the jam)

1. Push `server/` to GitHub
2. Deploy to Fly.io or Railway
3. Set `VITE_SERVER_URL` in the client to the deployed server's URL (use `wss://` not `ws://`)
4. Run `npm run build` in `client/` and upload the `dist/` folder to itch.io
