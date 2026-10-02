import * as THREE from 'three';
import { box } from './helpers.js';

export function createRoom(scene, collision) {
  const room = new THREE.Group();
  room.name = 'Huge Bedroom';
  scene.add(room);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb8b3a8, roughness: 1 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x6e5c4b, roughness: 0.95 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe0ddd2, roughness: 0.8 });

  box(room, { name: 'Floor', size: [12, 0.12, 9], position: [0, -0.06, 0], material: floorMat, receiveShadow: true });
  box(room, { name: 'Back wall', size: [12, 4.2, 0.12], position: [0, 2.1, 4.5], material: wallMat });
  box(room, { name: 'Left wall', size: [0.12, 4.2, 9], position: [-6, 2.1, 0], material: wallMat });
  box(room, { name: 'Right wall', size: [0.12, 4.2, 9], position: [6, 2.1, 0], material: wallMat });
  box(room, { name: 'Front wall', size: [12, 4.2, 0.12], position: [0, 2.1, -4.5], material: wallMat });

  // Baseboards exaggerate scale nicely from hamster height.
  box(room, { size: [11.88, 0.16, 0.08], position: [0, 0.08, 4.41], material: trimMat });
  box(room, { size: [0.08, 0.16, 8.8], position: [-5.91, 0.08, 0], material: trimMat });
  box(room, { size: [0.08, 0.16, 8.8], position: [5.91, 0.08, 0], material: trimMat });

  const placeholder = new THREE.MeshStandardMaterial({ color: 0x6e746e, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3d403d, roughness: 0.9 });
  const fabric = new THREE.MeshStandardMaterial({ color: 0x8e8479, roughness: 1 });

  // Bed: deliberately blocky placeholder.
  box(room, { name: 'BED placeholder', size: [3.15, 0.38, 2.25], position: [-2.55, 0.48, 1.95], material: placeholder });
  box(room, { size: [3.25, 0.16, 2.35], position: [-2.55, 0.78, 1.95], material: fabric });
  box(room, { size: [3.2, 1.25, 0.18], position: [-2.55, 0.86, 3.03], material: dark });
  for (const x of [-3.95, -1.15]) for (const z of [1.0, 2.9]) {
    box(room, { size: [0.16, 0.58, 0.16], position: [x, 0.29, z], material: dark });
  }

  // Day 2 route: a blanket hanging from the near edge of the bed to the floor.
  const bedBlanket = box(room, {
    name: 'DAY 2 CLIMBABLE BLANKET',
    size: [0.72, 0.84, 0.08],
    position: [-1.05, 0.42, 1.18],
    color: 0x756b62,
    castShadow: false,
  });
  bedBlanket.rotation.z = -0.05;

  for (let y = 0.10; y < 0.78; y += 0.14) {
    box(room, {
      name: 'DAY 2 BLANKET FOLD',
      size: [0.76, 0.018, 0.095],
      position: [-1.05, y, 1.18],
      color: 0x665d55,
      castShadow: false,
    });
  }

  collision.addClimbable({
    minX: -1.44, maxX: -0.66,
    minY: 0.0, maxY: 0.83,
    minZ: 1.08, maxZ: 1.29,
    topY: 0.86,
    exitX: -1.10,
    exitZ: 1.36,
    tag: 'day2-bed-blanket',
  });

  // Desk and monitor.
  box(room, { name: 'DESK placeholder', size: [2.7, 0.16, 0.86], position: [1.0, 1.16, 3.55], material: placeholder });
  for (const x of [-0.18, 2.18]) for (const z of [3.24, 3.86]) {
    box(room, { size: [0.14, 1.08, 0.14], position: [x, 0.54, z], material: dark });
  }
  box(room, { name: 'MONITOR placeholder', size: [1.2, 0.72, 0.08], position: [1.0, 1.72, 3.89], material: dark });
  box(room, { size: [0.12, 0.45, 0.12], position: [1.0, 1.38, 3.83], material: dark });

  // Wardrobe / closet placeholder.
  box(room, { name: 'WARDROBE placeholder', size: [2.05, 2.7, 0.72], position: [-4.75, 1.35, -2.95], material: placeholder });
  box(room, { size: [0.025, 2.45, 0.03], position: [-4.75, 1.35, -3.32], color: 0x2b2e2b, castShadow: false });

  // Dresser supporting the terrarium.
  box(room, { name: 'TERRARIUM DRESSER', size: [2.3, 1.02, 0.9], position: [3.65, 0.51, 2.72], color: 0x655446 });

  // A small front shelf gives the hamster a safer landing area after leaving the terrarium.
  box(room, {
    name: 'TERRARIUM FRONT LEDGE',
    size: [2.18, 0.10, 0.34],
    position: [3.65, 1.01, 2.12],
    color: 0x5c4b3f,
  });
  box(room, {
    name: 'TERRARIUM FRONT LEDGE lip',
    size: [2.18, 0.045, 0.055],
    position: [3.65, 1.075, 1.965],
    color: 0x493b32,
  });
  for (let i = 0; i < 3; i++) {
    box(room, { size: [2.08, 0.24, 0.04], position: [3.65, 0.3 + i * 0.29, 2.255], color: 0x514338 });
    box(room, { size: [0.22, 0.045, 0.055], position: [3.65, 0.3 + i * 0.29, 2.22], color: 0x222321, metalness: 0.4 });
  }

  // Recovery cloth hanging down the right side of the dresser.
  // It gives the player a believable way back up after falling during testing.
  const recoveryCloth = box(room, {
    name: 'CLIMBABLE DRESSER CLOTH',
    size: [0.12, 1.02, 0.48],
    position: [4.79, 0.51, 2.72],
    color: 0x8a7768,
    castShadow: false,
  });
  recoveryCloth.rotation.z = -0.04;
  for (let y = 0.14; y < 0.96; y += 0.16) {
    box(room, {
      name: 'DRESSER CLOTH GRIP',
      size: [0.15, 0.018, 0.50],
      position: [4.775, y, 2.72],
      color: 0x6f5d50,
      castShadow: false,
    });
  }
  collision.addClimbable({
    minX: 4.70, maxX: 4.88,
    minY: 0.0, maxY: 1.02,
    minZ: 2.43, maxZ: 3.01,
    topY: 1.02,
    exitX: 4.63,
    exitZ: 2.72,
    tag: 'dresser-recovery-cloth',
  });

  // Night 1 hiding spot: a cardboard shoebox with its front open toward the dresser.
  const cardboard = new THREE.MeshStandardMaterial({ color: 0x8b6b45, roughness: 1 });
  const hideCenterX = 3.05;
  const hideCenterZ = 1.72;
  const hideW = 0.72;
  const hideH = 0.24;
  const hideD = 0.58;
  const wall = 0.035;

  box(room, {
    name: 'NIGHT 1 HIDE roof',
    size: [hideW, wall, hideD],
    position: [hideCenterX, hideH, hideCenterZ],
    material: cardboard,
  });
  box(room, {
    name: 'NIGHT 1 HIDE left',
    size: [wall, hideH, hideD],
    position: [hideCenterX - hideW / 2, hideH / 2, hideCenterZ],
    material: cardboard,
  });
  box(room, {
    name: 'NIGHT 1 HIDE right',
    size: [wall, hideH, hideD],
    position: [hideCenterX + hideW / 2, hideH / 2, hideCenterZ],
    material: cardboard,
  });
  box(room, {
    name: 'NIGHT 1 HIDE back',
    size: [hideW, hideH, wall],
    position: [hideCenterX, hideH / 2, hideCenterZ - hideD / 2],
    material: cardboard,
  });
  box(room, {
    name: 'NIGHT 1 HIDE darkness',
    size: [hideW - 0.08, 0.012, hideD - 0.07],
    position: [hideCenterX, 0.008, hideCenterZ],
    color: 0x2a2119,
    castShadow: false,
  });

  collision.addBox(
    new THREE.Vector3(hideCenterX, hideH, hideCenterZ),
    new THREE.Vector3(hideW, wall, hideD),
    'shoebox-roof',
  );
  collision.addBox(
    new THREE.Vector3(hideCenterX - hideW / 2, hideH / 2, hideCenterZ),
    new THREE.Vector3(wall, hideH, hideD),
    'shoebox-left',
  );
  collision.addBox(
    new THREE.Vector3(hideCenterX + hideW / 2, hideH / 2, hideCenterZ),
    new THREE.Vector3(wall, hideH, hideD),
    'shoebox-right',
  );
  collision.addBox(
    new THREE.Vector3(hideCenterX, hideH / 2, hideCenterZ - hideD / 2),
    new THREE.Vector3(hideW, hideH, wall),
    'shoebox-back',
  );

  const hideZone = {
    minX: hideCenterX - hideW / 2 + 0.06,
    maxX: hideCenterX + hideW / 2 - 0.06,
    minZ: hideCenterZ - hideD / 2 + 0.06,
    maxZ: hideCenterZ + hideD / 2 + 0.04,
    maxY: 0.19,
  };

  // Nightstand.
  box(room, { name: 'NIGHTSTAND placeholder', size: [0.86, 0.76, 0.72], position: [-0.55, 0.38, 2.6], material: placeholder });

  // Rug helps sell room scale and gives the floor a landmark.
  box(room, { name: 'RUG placeholder', size: [4.1, 0.018, 2.45], position: [0.25, 0.01, -1.05], color: 0x796f62, castShadow: false });

  // Door block and frame on front wall.
  box(room, { name: 'ROOM DOOR', size: [1.28, 2.5, 0.08], position: [3.95, 1.25, -4.39], color: 0x6b5c4d });
  box(room, { size: [1.5, 0.09, 0.14], position: [3.95, 2.54, -4.34], material: trimMat });
  box(room, { size: [0.09, 2.58, 0.14], position: [3.24, 1.29, -4.34], material: trimMat });
  box(room, { size: [0.09, 2.58, 0.14], position: [4.66, 1.29, -4.34], material: trimMat });

  // Window: clear visual target for later days.
  box(room, { name: 'WINDOW FRAME', size: [2.4, 1.55, 0.08], position: [-1.3, 2.15, 4.39], color: 0xe1ded5 });
  const windowMat = new THREE.MeshPhysicalMaterial({ color: 0x9fc3c8, transparent: true, opacity: 0.34, roughness: 0.12, transmission: 0.12 });
  box(room, { name: 'WINDOW GLASS', size: [2.12, 1.27, 0.035], position: [-1.3, 2.15, 4.33], material: windowMat, castShadow: false });
  box(room, { size: [0.075, 1.27, 0.09], position: [-1.3, 2.15, 4.28], color: 0xe1ded5 });

  // Basic room collision.
  collision.addSolid(new THREE.Vector3(-6.1, -1, -4.62), new THREE.Vector3(-5.86, 5, 4.62), 'wall-left');
  collision.addSolid(new THREE.Vector3(5.86, -1, -4.62), new THREE.Vector3(6.1, 5, 4.62), 'wall-right');
  collision.addSolid(new THREE.Vector3(-6.1, -1, 4.38), new THREE.Vector3(6.1, 5, 4.62), 'wall-back');
  collision.addSolid(new THREE.Vector3(-6.1, -1, -4.62), new THREE.Vector3(6.1, 5, -4.38), 'wall-front');

  // Large placeholder furniture collision volumes.
  collision.addBox(new THREE.Vector3(-2.55, 0.39, 1.95), new THREE.Vector3(3.15, 0.78, 2.25), 'bed');
  collision.addBox(new THREE.Vector3(1.0, 0.58, 3.55), new THREE.Vector3(2.7, 1.16, 0.86), 'desk');
  collision.addBox(new THREE.Vector3(-4.75, 1.35, -2.95), new THREE.Vector3(2.05, 2.7, 0.72), 'wardrobe');
  collision.addBox(new THREE.Vector3(3.65, 0.51, 2.72), new THREE.Vector3(2.3, 1.02, 0.9), 'dresser');
  collision.addBox(new THREE.Vector3(-0.55, 0.38, 2.6), new THREE.Vector3(0.86, 0.76, 0.72), 'nightstand');

  collision.addPlatform({ minX: -6, maxX: 6, minZ: -4.5, maxZ: 4.5, y: 0, tag: 'room-floor' });
  collision.addPlatform({ minX: 2.5, maxX: 4.8, minZ: 2.27, maxZ: 3.17, y: 1.02, tag: 'dresser-top' });
  collision.addPlatform({ minX: 2.56, maxX: 4.74, minZ: 1.95, maxZ: 2.29, y: 1.06, tag: 'terrarium-front-ledge' });

  return {
    room,
    hideZone,
    floorStart: new THREE.Vector3(4.48, 0.002, 2.35),
    terrariumDresserTop: 1.02,
    bedTopZone: {
      minX: -4.0,
      maxX: -1.0,
      minZ: 0.88,
      maxZ: 3.08,
      minY: 0.80,
    },
  };
}
