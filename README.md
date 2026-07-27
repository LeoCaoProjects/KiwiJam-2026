# Between Us

A two-player cooperative platformer made for KiwiJam 2026. The
frontend uses React and Phaser, and the multiplayer server uses
Colyseus and Node.js.

## Install

Requires Node.js 18 or newer.

```bash
cd server
npm install

cd ../client
npm install
```

## Run locally

Start the server:

```bash
cd server
npm start
```

Start the client in a second terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in two browser windows. Create a lobby
in one window, then enter its lobby code in the other.

## Project structure

```text
kiwijam-game/
|-- client/
|   |-- public/assets/   Game levels, art, audio and video
|   `-- src/             React and Phaser source
|-- server/
|   `-- src/             Colyseus server source
|-- source-assets/       Preserved editor files and unused media
`-- README.md
```

The client uses localhost automatically during local development. To
connect through a local network, create `client/.env` and set:

```env
VITE_SERVER_IP=192.168.1.5
VITE_SERVER_PORT=2567
```

For a deployed client, set `VITE_SERVER_URL` in the hosting platform
to the secure WebSocket URL of the deployed server.
