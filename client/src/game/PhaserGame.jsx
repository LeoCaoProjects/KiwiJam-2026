import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

export default function PhaserGame({ room, players, level }) {
  const parentRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const scene = new GameScene(room, players, level);
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: 1280,
      height: 704,
      transparent: true,
      pixelArt: true,
      parent: parentRef.current,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 800 },
        },
      },
      scene,
    });

    return () => {
      sceneRef.current = null;
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setPlayers(players);
  }, [players]);

  useEffect(() => {
    sceneRef.current?.setLevel(level);
  }, [level]);

  return (
    <div
      ref={parentRef}
      style={{ width: "100%", height: "calc(100vh - 16px)" }}
    />
  );
}
