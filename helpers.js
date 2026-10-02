import * as THREE from 'three';

export function box(scene, {
  name = 'box',
  size = [1, 1, 1],
  position = [0, 0, 0],
  color = 0x888888,
  roughness = 0.8,
  metalness = 0,
  material = null,
  castShadow = true,
  receiveShadow = true,
} = {}) {
  const geometry = new THREE.BoxGeometry(...size);
  const mat = material ?? new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  scene.add(mesh);
  return mesh;
}

export function cylinder(scene, {
  radius = 0.1,
  height = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = 0x888888,
  radialSegments = 12,
  material = null,
} = {}) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
  const mat = material ?? new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
