import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { joinGameRoom, SERVER_URL } from "./network/colyseusClient.js";

export default function App() {
  const canvasRef = useRef(null);
  const [threeStatus, setThreeStatus] = useState("checking");
  const [serverStatus, setServerStatus] = useState("checking");
  const [serverDetail, setServerDetail] = useState(`Trying ${SERVER_URL}`);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);

    renderer.setSize(320, 180, false);
    renderer.setClearColor(0x050505, 1);
    camera.position.z = 3;

    const triangle = new THREE.Mesh(
      new THREE.CircleGeometry(0.75, 3),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc, wireframe: true })
    );

    scene.add(triangle);
    renderer.render(scene, camera);
    setThreeStatus("connected");

    return () => {
      renderer.dispose();
      triangle.geometry.dispose();
      triangle.material.dispose();
    };
  }, []);

  useEffect(() => {
    let room;
    let cancelled = false;

    async function checkServer() {
      try {
        room = await joinGameRoom("Setup Test");
        if (cancelled) {
          room.leave();
          return;
        }

        setServerStatus("connected");
        setServerDetail(`Joined game_room as ${room.sessionId}`);
      } catch (error) {
        setServerStatus("not connected");
        setServerDetail(error?.message || "Could not join game_room");
      }
    }

    checkServer();

    return () => {
      cancelled = true;
      room?.leave();
    };
  }, []);

  return (
    <main>
      <h1>Setup Test</h1>

      <p>React: connected</p>
      <p>Three.js: {threeStatus}</p>
      <p>Server: {serverStatus}</p>
      <p>{serverDetail}</p>

      <p>This canvas is the Three.js component.</p>
      <canvas ref={canvasRef} width="320" height="180" />
    </main>
  );
}
