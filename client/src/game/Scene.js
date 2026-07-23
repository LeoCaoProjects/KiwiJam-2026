import * as THREE from "three";
import { createWorld } from "./World.js";
import { PlayerMesh } from "./Player.js";

export function initScene(container, room, mySessionId) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(
    70,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 8, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  createWorld(scene);

  // map of sessionId -> PlayerMesh
  const players = new Map();

  function addPlayer(sessionId, playerState) {
    const isMe = sessionId === mySessionId;
    const mesh = new PlayerMesh(scene, {
      color: isMe ? 0x55ff55 : 0xff5555,
      name: playerState.name,
    });
    mesh.setPosition(playerState.x, playerState.y, playerState.z);
    players.set(sessionId, mesh);
  }

  function removePlayer(sessionId) {
    const mesh = players.get(sessionId);
    if (mesh) {
      mesh.destroy(scene);
      players.delete(sessionId);
    }
  }

  // initial players already in the room
  room.state.players.forEach((playerState, sessionId) => {
    addPlayer(sessionId, playerState);
  });

  // react to players joining/leaving after we connect
  room.state.players.onAdd((playerState, sessionId) => {
    addPlayer(sessionId, playerState);
    playerState.onChange(() => {
      const mesh = players.get(sessionId);
      if (mesh) {
        mesh.setPosition(playerState.x, playerState.y, playerState.z);
        mesh.setRotationY(playerState.rotationY);
      }
    });
  });

  room.state.players.onRemove((_playerState, sessionId) => {
    removePlayer(sessionId);
  });

  // local movement input, WASD / arrow keys
  const keys = {};
  window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

  const localPos = { x: 0, y: 0, z: 0 };
  const speed = 6; // units per second

  function handleResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener("resize", handleResize);

  let lastTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    let moved = false;
    if (keys["w"] || keys["arrowup"]) {
      localPos.z -= speed * dt;
      moved = true;
    }
    if (keys["s"] || keys["arrowdown"]) {
      localPos.z += speed * dt;
      moved = true;
    }
    if (keys["a"] || keys["arrowleft"]) {
      localPos.x -= speed * dt;
      moved = true;
    }
    if (keys["d"] || keys["arrowright"]) {
      localPos.x += speed * dt;
      moved = true;
    }

    if (moved) {
      room.send("move", { x: localPos.x, y: localPos.y, z: localPos.z });
      // move our own mesh immediately (client-side prediction), server will confirm
      const myMesh = players.get(mySessionId);
      if (myMesh) myMesh.setPosition(localPos.x, localPos.y, localPos.z);

      // simple follow camera
      camera.position.x = localPos.x;
      camera.position.z = localPos.z + 12;
      camera.lookAt(localPos.x, 0, localPos.z);
    }

    renderer.render(scene, camera);
  }

  animate();

  return {
    dispose() {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
