const http = require("http");
const express = require("express");
const { Server } = require("colyseus");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const { GameRoom } = require("./rooms/GameRoom");

const port = Number(process.env.PORT || 2567);
const host = process.env.SERVER_HOST || "0.0.0.0";

const app = express();
app.use(express.json());

// simple health check, useful when deployed to Fly.io/Railway
app.get("/", (req, res) => {
  res.send("Kiwijam Colyseus server is running.");
});

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
});

gameServer.define("game_room", GameRoom);

gameServer.listen(port, host).then(() => {
  console.log(`Colyseus server listening on port ${port}`);
});
