import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

export default function PhaserGame({ room, players }) {
  const parentRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const scene = new GameScene(room, players);
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      width: 320,
      height: 180,
      transparent: true,
      parent: parentRef.current,
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

  return <div ref={parentRef} />;
}
