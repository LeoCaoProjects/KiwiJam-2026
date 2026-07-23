import * as THREE from "three";

export class PlayerMesh {
  constructor(scene, { color = 0xff5555, name = "Player" } = {}) {
    const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const material = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 1, 0);
    scene.add(this.mesh);
    this.name = name;
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y + 1, z);
  }

  setRotationY(rotationY) {
    this.mesh.rotation.y = rotationY;
  }

  destroy(scene) {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
