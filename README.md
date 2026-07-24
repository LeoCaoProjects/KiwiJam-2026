# Kiwijam Game

Minimal two-player 2D lobby. The client uses React and Phaser. The server uses Colyseus on Node.js.

See [GAME_JAM_GUIDE.md](GAME_JAM_GUIDE.md) for the planned directory layout, explanation of every file, Tiled level-building workflow, multiplayer architecture and 48-hour development plan.

## Setup

Requires Node.js 18 or newer.

```bash
cd server
npm install

cd ../client
npm install
```

## Run Locally

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

Open `http://localhost:5173` in two browser windows. Create a lobby in one window, then enter its lobby code in the other.

## Project Structure

```text
kiwijam-game/
|-- client/      React and Phaser frontend
|-- server/      Colyseus backend
|-- TECH_STACK.md
`-- README.md
```

For another computer on the same network, set `VITE_SERVER_URL` in `client/.env` to the server computer's address, such as `ws://192.168.1.5:2567`.
