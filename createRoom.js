import * as THREE from 'three';
import { box } from './helpers.js';

export function createRoom(scene, collision, interactables = []) {
  const room = new THREE.Group();
  room.name = 'Huge Bedroom';
  scene.add(room);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb8b3a8, roughness: 1 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x6e5c4b, roughness: 0.95 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe0ddd2, roughness: 0.8 });

  box(room, { name: 'Floor', size: [12, 0.12, 9], position: [0, -0.06, 0], material: floorMat, receiveShadow: true });
  // Back wall is split around a real window opening so the final route can pass outside.
  box(room, { name: 'Back wall left', size: [3.5, 4.2, 0.12], position: [-4.25, 2.1, 4.5], material: wallMat });
  box(room, { name: 'Back wall right', size: [6.1, 4.2, 0.12], position: [2.95, 2.1, 4.5], material: wallMat });
  box(room, { name: 'Back wall below window', size: [2.4, 1.375, 0.12], position: [-1.3, 0.6875, 4.5], material: wallMat });
  box(room, { name: 'Back wall above window', size: [2.4, 1.275, 0.12], position: [-1.3, 3.5625, 4.5], material: wallMat });
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
    size: [2.18, 0.10, 0.50],
    position: [3.65, 1.01, 2.13],
    color: 0x5c4b3f,
  });
  box(room, {
    name: 'TERRARIUM FRONT LEDGE lip',
    size: [2.18, 0.045, 0.055],
    position: [3.65, 1.075, 1.895],
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

  // Bed-to-nightstand connection: a paperback partly bridges the tiny gap.
  const bridgeBook = box(room, {
    name: 'BED NIGHTSTAND BOOK BRIDGE',
    size: [0.62, 0.075, 0.32],
    position: [-0.86, 0.82, 2.58],
    color: 0x8b4f3d,
  });
  bridgeBook.rotation.z = -0.08;
  collision.addPlatform({
    minX: -1.15, maxX: -0.52,
    minZ: 2.40, maxZ: 2.76,
    y: 0.84,
    tag: 'bed-nightstand-book',
  });

  // A dangling charger cable turns the nightstand into the route up to the desk.
  const chargerMat = new THREE.MeshStandardMaterial({ color: 0x262829, roughness: 0.72 });
  const chargerCable = box(room, {
    name: 'DESK CHARGER CABLE',
    size: [0.055, 0.53, 0.055],
    position: [-0.22, 1.00, 3.07],
    material: chargerMat,
    castShadow: false,
  });
  chargerCable.rotation.z = 0.06;
  for (let y = 0.80; y <= 1.20; y += 0.10) {
    box(room, {
      name: 'CHARGER CABLE GRIP',
      size: [0.085, 0.014, 0.085],
      position: [-0.22, y, 3.07],
      color: 0x454849,
      castShadow: false,
    });
  }
  collision.addClimbable({
    minX: -0.31, maxX: -0.13,
    minY: 0.72, maxY: 1.24,
    minZ: 2.98, maxZ: 3.16,
    topY: 1.25,
    exitX: -0.18,
    exitZ: 3.28,
    tag: 'nightstand-desk-cable',
  });

  // Desk clutter gives the desk top scale and creates a readable route landmark.
  box(room, {
    name: 'DESK BOOK STACK 1',
    size: [0.55, 0.10, 0.38],
    position: [0.36, 1.30, 3.46],
    color: 0x486176,
  });
  box(room, {
    name: 'DESK BOOK STACK 2',
    size: [0.46, 0.09, 0.33],
    position: [0.40, 1.395, 3.46],
    color: 0x73594c,
  });
  collision.addPlatform({
    minX: 0.08, maxX: 0.65,
    minZ: 3.26, maxZ: 3.66,
    y: 1.35,
    tag: 'desk-book-1',
  });
  collision.addPlatform({
    minX: 0.16, maxX: 0.64,
    minZ: 3.29, maxZ: 3.63,
    y: 1.44,
    tag: 'desk-book-2',
  });

  // Rug helps sell room scale and gives the floor a landmark.
  box(room, { name: 'RUG placeholder', size: [4.1, 0.018, 2.45], position: [0.25, 0.01, -1.05], color: 0x796f62, castShadow: false });

  // Door block and frame on front wall.
  box(room, { name: 'ROOM DOOR', size: [1.28, 2.5, 0.08], position: [3.95, 1.25, -4.39], color: 0x6b5c4d });
  box(room, { size: [1.5, 0.09, 0.14], position: [3.95, 2.54, -4.34], material: trimMat });
  box(room, { size: [0.09, 2.58, 0.14], position: [3.24, 1.29, -4.34], material: trimMat });
  box(room, { size: [0.09, 2.58, 0.14], position: [4.66, 1.29, -4.34], material: trimMat });

  // Final window route. The sill is reachable from the desk by the hanging curtain cord.
  box(room, { name: 'WINDOW FRAME TOP', size: [2.48, 0.10, 0.12], position: [-1.3, 2.94, 4.39], color: 0xe1ded5 });
  box(room, { name: 'WINDOW FRAME BOTTOM', size: [2.48, 0.10, 0.22], position: [-1.3, 1.36, 4.33], color: 0xe1ded5 });
  box(room, { name: 'WINDOW FRAME LEFT', size: [0.10, 1.58, 0.12], position: [-2.50, 2.15, 4.39], color: 0xe1ded5 });
  box(room, { name: 'WINDOW FRAME RIGHT', size: [0.10, 1.58, 0.12], position: [-0.10, 2.15, 4.39], color: 0xe1ded5 });
  box(room, { name: 'WINDOW CENTER BAR', size: [0.075, 1.48, 0.09], position: [-1.3, 2.15, 4.28], color: 0xe1ded5 });

  const windowMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fc3c8,
    transparent: true,
    opacity: 0.28,
    roughness: 0.10,
    transmission: 0.18,
    depthWrite: false,
  });
  const windowGlass = box(room, {
    name: 'WINDOW GLASS',
    size: [2.10, 1.22, 0.035],
    position: [-1.3, 2.15, 4.31],
    material: windowMat,
    castShadow: false,
  });

  // Exterior sill makes the final step readable and prevents an instant fall after escaping.
  box(room, {
    name: 'EXTERIOR WINDOW SILL',
    size: [2.30, 0.10, 0.46],
    position: [-1.3, 1.31, 4.57],
    color: 0xc8c5bb,
  });

  // Day 6 route: a thick braided curtain pull slopes from the desk edge to the sill.
  // It is deliberately generous because this is a traversal route, not a precision test.
  const cordMat = new THREE.MeshStandardMaterial({ color: 0xb8a27c, roughness: 0.95 });
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 1.27, 3.91),
    new THREE.Vector3(-0.28, 1.31, 4.01),
    new THREE.Vector3(-0.40, 1.37, 4.10),
    new THREE.Vector3(-0.54, 1.43, 4.17),
  ]);
  const curtainCord = new THREE.Mesh(
    new THREE.TubeGeometry(cordCurve, 14, 0.018, 7, false),
    cordMat,
  );
  curtainCord.name = 'WINDOW CURTAIN PULL';
  curtainCord.castShadow = true;
  curtainCord.receiveShadow = true;
  room.add(curtainCord);

  const cordKnot = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 8, 6),
    cordMat,
  );
  cordKnot.name = 'WINDOW CURTAIN PULL KNOT';
  cordKnot.position.set(-0.54, 1.43, 4.17);
  room.add(cordKnot);

  collision.addClimbable({
    minX: -0.66, maxX: -0.08,
    minY: 1.20, maxY: 1.48,
    minZ: 3.86, maxZ: 4.22,
    topY: 1.41,
    exitX: -0.58,
    exitZ: 4.17,
    tag: 'desk-window-curtain-pull',
  });

  // Paperclip tool: actual nested wire shape resting on a sticky note so it reads at hamster scale.
  const stickyNote = box(room, {
    name: 'PAPERCLIP STICKY NOTE',
    size: [0.16, 0.006, 0.12],
    position: [0.78, 1.258, 3.38],
    color: 0xd6bd62,
    castShadow: false,
  });
  stickyNote.rotation.y = -0.10;

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc9ced1,
    roughness: 0.34,
    metalness: 0.72,
  });
  const paperclip = new THREE.Group();
  paperclip.name = 'PAPERCLIP TOOL';
  paperclip.position.set(0.78, 1.267, 3.38);
  paperclip.rotation.y = -0.22;
  room.add(paperclip);

  const clipPoints = [
    new THREE.Vector3(-0.030, 0, 0.012),
    new THREE.Vector3(0.018, 0, 0.012),
    new THREE.Vector3(0.030, 0, 0.006),
    new THREE.Vector3(0.033, 0, -0.006),
    new THREE.Vector3(0.025, 0, -0.015),
    new THREE.Vector3(-0.022, 0, -0.015),
    new THREE.Vector3(-0.032, 0, -0.008),
    new THREE.Vector3(-0.032, 0, 0.003),
    new THREE.Vector3(-0.024, 0, 0.009),
    new THREE.Vector3(0.012, 0, 0.009),
  ];
  const clipCurve = new THREE.CatmullRomCurve3(clipPoints, false, 'centripetal', 0.45);
  const clipWire = new THREE.Mesh(
    new THREE.TubeGeometry(clipCurve, 30, 0.0022, 7, false),
    metalMat,
  );
  clipWire.name = 'PAPERCLIP WIRE';
  clipWire.rotation.x = Math.PI / 2;
  paperclip.add(clipWire);

  const windowLatch = new THREE.Group();
  windowLatch.name = 'WINDOW LATCH';
  windowLatch.position.set(-1.02, 1.485, 4.235);
  room.add(windowLatch);
  box(windowLatch, {
    name: 'WINDOW LATCH BODY',
    size: [0.24, 0.065, 0.08],
    position: [0, 0, 0],
    color: 0x4c4f4f,
    metalness: 0.55,
  });
  const latchLever = box(windowLatch, {
    name: 'WINDOW LATCH LEVER',
    size: [0.15, 0.030, 0.042],
    position: [0.025, 0.050, -0.012],
    color: 0x9aa0a0,
    metalness: 0.65,
  });

  const routeState = {
    paperclipTaken: false,
    windowUnlatched: false,
    windowOpened: false,
    escaped: false,
  };
  let windowOpenTarget = 0;

  const windowGlassCollider = collision.addSolid(
    new THREE.Vector3(-2.36, 1.535, 4.287),
    new THREE.Vector3(-0.24, 2.765, 4.334),
    'window-glass',
  );

  const isOnWindowSill = (playerPosition) => (
    playerPosition &&
    playerPosition.x >= -2.38 &&
    playerPosition.x <= -0.18 &&
    playerPosition.z >= 4.06 &&
    playerPosition.z <= 4.235 &&
    playerPosition.y >= 1.35
  );

  const paperclipInteraction = {
    object: paperclip,
    distance: 0.28,
    prompt: 'E / trigger — take the paperclip',
    action: ({ playerPosition } = {}) => {
      if (routeState.paperclipTaken) return 'You already have the paperclip.';
      if (!playerPosition || playerPosition.y < 1.18) return 'You need to reach the desk first.';
      routeState.paperclipTaken = true;
      paperclip.visible = false;
      paperclipInteraction.prompt = 'Paperclip collected.';
      return 'You hook the paperclip in your teeth. It might fit a small latch.';
    },
  };

  const latchInteraction = {
    object: windowLatch,
    distance: 0.50,
    prompt: 'E / trigger — work the window latch',
    action: ({ playerPosition } = {}) => {
      if (!isOnWindowSill(playerPosition)) return 'You need solid footing on the windowsill first.';
      if (!routeState.paperclipTaken) return 'Your paws cannot get under the latch. Something thin and metal could.';
      if (routeState.windowUnlatched) return 'The latch is already released.';
      routeState.windowUnlatched = true;
      latchLever.rotation.z = 0.78;
      latchInteraction.prompt = 'The latch is released.';
      windowInteraction.prompt = 'E / trigger — push the window open';
      return 'The paperclip slips underneath. CLICK — the window latch releases.';
    },
  };

  const windowInteraction = {
    object: windowGlass,
    distance: 0.48,
    prompt: 'The window is locked.',
    action: ({ playerPosition } = {}) => {
      if (!routeState.windowUnlatched) return 'The window will not move while the latch is locked.';
      if (!isOnWindowSill(playerPosition)) return 'You need leverage from the sill.';
      if (routeState.windowOpened) return 'The window is already open.';
      routeState.windowOpened = true;
      windowOpenTarget = 1;
      collision.setEnabled(windowGlassCollider, false);
      windowInteraction.prompt = 'The window is open.';
      return 'You lean into the glass. It slides upward, spilling cold air into the room.';
    },
  };

  interactables.push(paperclipInteraction, latchInteraction, windowInteraction);

  collision.addPlatform({
    minX: -2.45, maxX: -0.15,
    minZ: 4.06, maxZ: 4.235,
    y: 1.41,
    tag: 'window-inner-sill',
  });
  collision.addPlatform({
    minX: -2.45, maxX: -0.15,
    minZ: 4.42, maxZ: 4.80,
    y: 1.36,
    tag: 'window-outer-sill',
  });

  // Small exterior landing visible through the final window.
  const outsideGround = box(room, {
    name: 'OUTSIDE LANDING',
    size: [4.8, 0.16, 3.2],
    position: [-1.3, 1.18, 5.85],
    color: 0x3f5b38,
    roughness: 1,
  });
  outsideGround.receiveShadow = true;

  // Chunky grass blades keep the low-poly look and sell the hamster scale.
  for (let i = 0; i < 42; i++) {
    const col = i % 7;
    const row = Math.floor(i / 7);
    const x = -3.25 + col * 0.62 + (row % 2) * 0.09;
    const z = 4.85 + row * 0.43;
    const h = 0.20 + ((i * 17) % 7) * 0.025;
    const blade = box(room, {
      name: 'OUTSIDE GRASS',
      size: [0.045, h, 0.055],
      position: [x, 1.30 + h / 2, z],
      color: i % 3 === 0 ? 0x58764a : 0x48683f,
      castShadow: false,
    });
    blade.rotation.z = ((i % 5) - 2) * 0.07;
  }

  // A simple dark horizon gives the escape a visual destination.
  box(room, {
    name: 'OUTSIDE HORIZON',
    size: [8.0, 3.4, 0.12],
    position: [-1.3, 2.3, 7.42],
    color: 0x1d2824,
    castShadow: false,
  });

  // Basic room collision.
  collision.addSolid(new THREE.Vector3(-6.1, -1, -4.62), new THREE.Vector3(-5.86, 5, 4.62), 'wall-left');
  collision.addSolid(new THREE.Vector3(5.86, -1, -4.62), new THREE.Vector3(6.1, 5, 4.62), 'wall-right');
  collision.addSolid(new THREE.Vector3(-6.1, -1, 4.38), new THREE.Vector3(-2.50, 5, 4.62), 'wall-back-left');
  collision.addSolid(new THREE.Vector3(-0.10, -1, 4.38), new THREE.Vector3(6.1, 5, 4.62), 'wall-back-right');
  collision.addSolid(new THREE.Vector3(-2.50, -1, 4.38), new THREE.Vector3(-0.10, 1.27, 4.62), 'wall-back-window-bottom');
  collision.addSolid(new THREE.Vector3(-2.50, 2.93, 4.38), new THREE.Vector3(-0.10, 5, 4.62), 'wall-back-window-top');
  collision.addSolid(new THREE.Vector3(-6.1, -1, -4.62), new THREE.Vector3(6.1, 5, -4.38), 'wall-front');

  // Furniture collision follows the visible shapes rather than using oversized solid blocks.
  // Bed frame/mattress leaves the space underneath open as a future crawl route.
  collision.addSolid(
    new THREE.Vector3(-4.18, 0.27, 0.77),
    new THREE.Vector3(-0.92, 0.86, 3.13),
    'bed-frame',
  );
  for (const x of [-3.95, -1.15]) for (const z of [1.0, 2.9]) {
    collision.addBox(new THREE.Vector3(x, 0.29, z), new THREE.Vector3(0.18, 0.58, 0.18), 'bed-leg');
  }

  // Desk is a tabletop plus four legs, so the hamster can actually run underneath it.
  collision.addBox(new THREE.Vector3(1.0, 1.16, 3.55), new THREE.Vector3(2.72, 0.18, 0.88), 'desk-top');
  for (const x of [-0.18, 2.18]) for (const z of [3.24, 3.86]) {
    collision.addBox(new THREE.Vector3(x, 0.54, z), new THREE.Vector3(0.16, 1.08, 0.16), 'desk-leg');
  }

  collision.addBox(new THREE.Vector3(-4.75, 1.35, -2.95), new THREE.Vector3(2.05, 2.7, 0.72), 'wardrobe');
  collision.addBox(new THREE.Vector3(3.65, 0.51, 2.72), new THREE.Vector3(2.3, 1.02, 0.9), 'dresser');
  collision.addBox(new THREE.Vector3(-0.55, 0.38, 2.6), new THREE.Vector3(0.86, 0.76, 0.72), 'nightstand');

  collision.addPlatform({ minX: -6, maxX: 6, minZ: -4.5, maxZ: 4.5, y: 0, tag: 'room-floor' });
  collision.addPlatform({ minX: -3.7, maxX: 1.1, minZ: 4.55, maxZ: 7.35, y: 1.26, tag: 'outside-ground' });
  collision.addPlatform({ minX: -4.18, maxX: -0.92, minZ: 0.77, maxZ: 3.13, y: 0.86, tag: 'bed-top' });
  collision.addPlatform({ minX: -0.36, maxX: 2.36, minZ: 3.10, maxZ: 4.00, y: 1.25, tag: 'desk-top' });
  collision.addPlatform({ minX: -0.98, maxX: -0.12, minZ: 2.24, maxZ: 2.96, y: 0.76, tag: 'nightstand-top' });
  collision.addPlatform({ minX: 2.5, maxX: 4.8, minZ: 2.27, maxZ: 3.17, y: 1.02, tag: 'dresser-top' });
  collision.addPlatform({ minX: 2.56, maxX: 4.74, minZ: 1.88, maxZ: 2.39, y: 1.06, tag: 'terrarium-front-ledge' });

  function update(dt, playerPosition = null) {
    const targetY = routeState.windowOpened ? 2.92 : 2.15;
    windowGlass.position.y = THREE.MathUtils.damp(windowGlass.position.y, targetY, 4.2, dt);

    if (
      routeState.windowOpened &&
      playerPosition &&
      playerPosition.y >= 1.26 &&
      playerPosition.x >= -2.40 &&
      playerPosition.x <= -0.20 &&
      playerPosition.z > 4.48
    ) {
      routeState.escaped = true;
    }
  }

  return {
    room,
    update,
    routeState,
    hideZone,
    floorStart: new THREE.Vector3(4.48, 0.002, 2.35),
    terrariumDresserTop: 1.02,
    bedTopZone: {
      minX: -4.0,
      maxX: -0.90,
      minZ: 0.78,
      maxZ: 3.12,
      minY: 0.80,
    },
    nightstandZone: {
      minX: -0.96,
      maxX: -0.14,
      minZ: 2.25,
      maxZ: 2.96,
      minY: 0.70,
    },
    deskTopZone: {
      minX: -0.34,
      maxX: 2.34,
      minZ: 3.12,
      maxZ: 3.98,
      minY: 1.18,
    },
    windowSillZone: {
      minX: -2.42,
      maxX: -0.18,
      minZ: 4.12,
      maxZ: 4.46,
      minY: 1.32,
    },
  };
}
