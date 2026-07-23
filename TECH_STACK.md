# Tech Stack - Kiwijam Multiplayer Game

## Stack

| Layer | Tech | Purpose |
|---|---|---|
| UI | React | Menus, HUD, chat |
| 3D world | Three.js | Rendering, characters, camera |
| Build tool | Vite | Dev server + build for the client |
| Server | Colyseus (Node.js) | Rooms, real-time sync, matchmaking |
| Communication | WebSockets | Client to server messaging (built into Colyseus) |
| Server hosting | Fly.io or Railway | Runs the Colyseus server, free tier |
| Database (optional) | Supabase | Only needed for accounts, saved progress, or leaderboards |
| Client hosting (optional) | itch.io | Hosts the built React/Three.js client |

React + Three.js on the client, talking over WebSockets to a Colyseus server that keeps everything in memory. Database is optional, only add Supabase if you need persistence.

## Directory Tree

```
kiwijam-game/
├── client/
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HUD.jsx
│   │   │   ├── MainMenu.jsx
│   │   │   └── Chat.jsx
│   │   ├── game/
│   │   │   ├── Scene.js
│   │   │   ├── Player.js
│   │   │   └── World.js
│   │   ├── network/
│   │   │   └── colyseusClient.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── rooms/
│   │   │   ├── GameRoom.js
│   │   │   └── schema/
│   │   │       ├── GameState.js
│   │   │       └── Player.js
│   │   └── index.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Running Locally

```bash
# server
cd server
npm install
npm start

# client
cd client
npm install
npm run dev
```

Others on the same wifi connect using your laptop's local IP, e.g. `ws://192.168.1.5:2567`, instead of localhost.

## Deploying the Server

1. Push `server/` to GitHub
2. Deploy to Fly.io or Railway
3. Point `colyseusClient.js` at the new server URL
4. Build the client and upload it to itch.io

If you need persistence (accounts, saved progress, leaderboards), add Supabase and connect to it from the server.
