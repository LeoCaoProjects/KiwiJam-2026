# Tech Stack

| Layer | Technology | Current purpose |
|---|---|---|
| Interface | React | Lobby inputs, buttons, and status labels |
| 2D game | Phaser | Two-player game frame |
| Client build | Vite | Development server and production build |
| Multiplayer server | Colyseus on Node.js | Two-player rooms and synchronized player state |
| Communication | WebSockets | Client-to-server communication through Colyseus |

## Current Source Structure

```text
client/src/
|-- screens/
|   |-- LobbyScreen.jsx
|   `-- GameScreen.jsx
|-- game/
|   |-- scenes/
|   |   `-- GameScene.js
|   |-- levels/
|   |   |-- LevelLoader.js
|   |   `-- levelList.js
|   |-- objects/
|   |   |-- Player.js
|   |   `-- BuildBlock.js
|   `-- PhaserGame.jsx
|-- network/
|   `-- colyseusClient.js
|-- App.jsx
`-- main.jsx

server/src/
|-- rooms/
|   |-- schema/
|   |   |-- GameState.js
|   |   |-- Player.js
|   |   `-- Block.js
|   `-- GameRoom.js
`-- index.js
```

React displays the plain lobby UI. Phaser renders the two black player dots. Colyseus creates rooms for exactly two clients and synchronizes their state over WebSockets.
