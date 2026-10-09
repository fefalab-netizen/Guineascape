import * as THREE from 'three';
import { box, cylinder } from './helpers.js';

const GLASS_COLOR = 0xbcd9d2;

export function createTerrarium(scene, collision, interactables) {
  const group = new THREE.Group();
  group.name = 'Detailed Front-Opening Terrarium';
  group.position.set(3.65, 1.02, 2.72);
  scene.add(group);

  const W = 1.34;
  const H = 0.72;
  const D = 0.72;
  const frame = 0.035;
  const bottom = 0.055;
  const frontZ = -D / 2;
  const backZ = D / 2;
  const doorGap = 0.012;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x202321, roughness: 0.58, metalness: 0.12 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: GLASS_COLOR,
    transparent: true,
    opacity: 0.20,
    roughness: 0.06,
    metalness: 0,
    transmission: 0.28,
    thickness: 0.012,
    side: THREE.DoubleSide,
  });
  glassMat.depthWrite = false;

  const substrateMat = new THREE.MeshStandardMaterial({ color: 0xb69562, roughness: 1 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5b3d2b, roughness: 1 });
  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x7b817b, roughness: 0.78 });

  // Bottom plinth and substrate.
  box(group, { name: 'Terrarium bottom', size: [W, bottom, D], position: [0, bottom / 2, 0], material: frameMat });
  box(group, { name: 'Deep substrate', size: [W - 0.06, 0.095, D - 0.06], position: [0, bottom + 0.0475, 0], material: substrateMat });

  // Rear + side glass panels.
  box(group, { name: 'Back glass', size: [W - frame * 2, H - frame * 2, 0.012], position: [0, H / 2, backZ], material: glassMat, castShadow: false });
  box(group, { name: 'Left glass', size: [0.012, H - frame * 2, D - frame * 2], position: [-W / 2, H / 2, 0], material: glassMat, castShadow: false });
  box(group, { name: 'Right glass', size: [0.012, H - frame * 2, D - frame * 2], position: [W / 2, H / 2, 0], material: glassMat, castShadow: false });

  // Black structural frame: base/top rails, vertical corners, front divider lip.
  box(group, { size: [W + 0.035, frame, D + 0.035], position: [0, H - frame / 2, 0], material: frameMat });
  box(group, { size: [W + 0.035, frame, frame], position: [0, frame / 2, frontZ], material: frameMat });
  for (const x of [-W / 2, W / 2]) {
    for (const z of [frontZ, backZ]) {
      box(group, { size: [frame, H, frame], position: [x, H / 2, z], material: frameMat });
    }
  }

  // Mesh top. Rather than a shader texture, use many thin rails for a low-poly readable grille.
  const meshY = H + 0.004;
  for (let x = -W / 2 + 0.07; x <= W / 2 - 0.07; x += 0.075) {
    box(group, { size: [0.009, 0.008, D - 0.07], position: [x, meshY, 0], material: frameMat, castShadow: false });
  }
  for (let z = -D / 2 + 0.06; z <= D / 2 - 0.06; z += 0.075) {
    box(group, { size: [W - 0.07, 0.008, 0.009], position: [0, meshY + 0.001, z], material: frameMat, castShadow: false });
  }

  // Front ventilation strip under the doors.
  box(group, { size: [W - 0.09, 0.095, 0.025], position: [0, 0.115, frontZ - 0.007], material: frameMat });
  for (let x = -W / 2 + 0.08; x < W / 2 - 0.08; x += 0.045) {
    box(group, { size: [0.019, 0.05, 0.009], position: [x, 0.115, frontZ - 0.023], color: 0x090b0a, castShadow: false });
  }

  // Twin front-opening doors.
  const doorBottom = 0.17;
  const doorHeight = H - doorBottom - 0.055;
  const doorWidth = (W - frame * 2 - doorGap) / 2;

  const leftPivot = new THREE.Group();
  const rightPivot = new THREE.Group();
  leftPivot.position.set(-W / 2 + frame, doorBottom, frontZ - 0.012);
  rightPivot.position.set(W / 2 - frame, doorBottom, frontZ - 0.012);
  group.add(leftPivot, rightPivot);

  function buildDoor(pivot, side) {
    const sign = side === 'left' ? 1 : -1;
    const panelCenterX = sign * doorWidth / 2;
    const y = doorHeight / 2;
    box(pivot, { name: `${side} front glass`, size: [doorWidth - 0.022, doorHeight - 0.03, 0.012], position: [panelCenterX, y, 0], material: glassMat, castShadow: false });
    box(pivot, { size: [doorWidth, 0.025, 0.028], position: [panelCenterX, 0.0125, 0], material: frameMat });
    box(pivot, { size: [doorWidth, 0.025, 0.028], position: [panelCenterX, doorHeight - 0.0125, 0], material: frameMat });
    box(pivot, { size: [0.025, doorHeight, 0.028], position: [sign * (doorWidth - 0.0125), y, 0], material: frameMat });
    box(pivot, { size: [0.025, doorHeight, 0.028], position: [0, y, 0], material: frameMat });

    // Hinges make the front read as doors rather than sliding panes.
    for (const hingeY of [0.13, doorHeight - 0.13]) {
      box(pivot, { size: [0.045, 0.075, 0.055], position: [0, hingeY, -0.025], color: 0x151715 });
    }
  }
  buildDoor(leftPivot, 'left');
  buildDoor(rightPivot, 'right');

  // Center latch assembly.
  const latch = new THREE.Group();
  latch.name = 'Terrarium door latch';
  latch.position.set(0, doorBottom + doorHeight * 0.52, frontZ - 0.065);
  group.add(latch);
  box(latch, { name: 'Latch body', size: [0.10, 0.075, 0.065], position: [0, 0, 0], color: 0x2b2e2c, metalness: 0.25 });
  const latchTab = box(latch, { name: 'Latch tab', size: [0.11, 0.026, 0.045], position: [0, 0.045, -0.01], color: 0x666a67, metalness: 0.4 });
  latchTab.rotation.z = -0.16;

  // Interior hide: built as real walls + roof so the hamster can physically crawl inside.
  const hide = new THREE.Group();
  hide.position.set(-0.37, bottom + 0.12, 0.16);
  group.add(hide);
  box(hide, { name: 'Hide roof', size: [0.38, 0.045, 0.28], position: [0, 0.15, 0], material: woodMat });
  box(hide, { name: 'Hide left wall', size: [0.045, 0.15, 0.28], position: [-0.1675, 0.075, 0], material: woodMat });
  box(hide, { name: 'Hide right wall', size: [0.045, 0.15, 0.28], position: [0.1675, 0.075, 0], material: woodMat });
  box(hide, { name: 'Hide back wall', size: [0.29, 0.15, 0.045], position: [0, 0.075, 0.1175], material: woodMat });
  const hideEntrance = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.078, 0.012, 18),
    new THREE.MeshStandardMaterial({ color: 0x17120e, roughness: 1 }),
  );
  hideEntrance.rotation.x = Math.PI / 2;
  hideEntrance.position.set(0.08, 0.072, -0.145);
  hide.add(hideEntrance);

  // Stone-like food dish.
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.045, 18), ceramicMat);
  dish.position.set(0.34, bottom + 0.11, 0.13);
  dish.castShadow = dish.receiveShadow = true;
  group.add(dish);
  const dishInner = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.11, 0.012, 18), new THREE.MeshStandardMaterial({ color: 0x382c20, roughness: 1 }));
  dishInner.position.set(0.34, bottom + 0.137, 0.13);
  group.add(dishInner);

  // Water dish.
  const waterDish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 18), ceramicMat);
  waterDish.position.set(0.38, bottom + 0.105, -0.15);
  waterDish.castShadow = waterDish.receiveShadow = true;
  group.add(waterDish);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.008, 18), new THREE.MeshPhysicalMaterial({ color: 0x8cb8c2, transparent: true, opacity: 0.65, roughness: 0.1 }));
  water.position.set(0.38, bottom + 0.13, -0.15);
  group.add(water);

  // Climbing branch, angled across the enclosure.
  const branch = cylinder(group, { radius: 0.035, height: 0.70, position: [-0.06, bottom + 0.28, 0.08], rotation: [0.22, 0, 1.02], material: woodMat, radialSegments: 9 });
  branch.name = 'Climbing branch';
  cylinder(group, { radius: 0.018, height: 0.28, position: [-0.19, bottom + 0.34, 0.02], rotation: [0.18, 0.2, -0.68], material: woodMat, radialSegments: 8 });

  const cordMat = new THREE.MeshStandardMaterial({ color: 0xc8a36a, roughness: 1 });
  const branchCord = cylinder(group, {
    radius: 0.012,
    height: 0.16,
    position: [-0.27, bottom + 0.49, -0.06],
    rotation: [0.05, 0.1, 0.18],
    material: cordMat,
    radialSegments: 7,
  });
  branchCord.name = 'Branch retaining cord';

  // Basking rock / platform.
  box(group, { name: 'Basking rock', size: [0.27, 0.09, 0.22], position: [0.04, bottom + 0.115, 0.23], color: 0x77736a });

  // Simple fake plant using low-poly stems/leaves.
  const plant = new THREE.Group();
  plant.position.set(-0.48, bottom + 0.09, -0.22);
  group.add(plant);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const stem = cylinder(plant, { radius: 0.007, height: 0.22 + (i % 2) * 0.05, position: [0, 0.10, 0], rotation: [Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35], color: 0x55704b, radialSegments: 6 });
    stem.castShadow = false;
  }

  // A warm lamp above the terrarium reinforces enclosure identity.
  const lamp = new THREE.SpotLight(0xffd89b, 13, 2.1, Math.PI / 5, 0.7, 1.5);
  lamp.position.set(0.18, 1.14, 0.06);
  lamp.target.position.set(0.06, 0.12, 0.04);
  lamp.castShadow = false;
  group.add(lamp, lamp.target);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 0.18, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x242624, side: THREE.DoubleSide, roughness: 0.65 }),
  );
  lampShade.position.set(0.18, 0.91, 0.06);
  group.add(lampShade);

  // Day 1 puzzle state.
  let bowlMoved = false;
  let cordChewed = false;
  const dishStartPosition = dish.position.clone();
  const dishInnerStartPosition = dishInner.position.clone();
  const dishReadyPosition = new THREE.Vector3(0.02, bottom + 0.11, -0.19);
  const dishInnerReadyPosition = new THREE.Vector3(0.02, bottom + 0.137, -0.19);
  let branchReady = false;
  let escaped = false;
  let bowlPlatform = null;
  let branchClimbable = null;
  const branchStartPosition = branch.position.clone();
  const branchStartRotation = branch.rotation.clone();
  const branchReadyPosition = new THREE.Vector3(0.02, bottom + 0.31, -0.16);
  const branchReadyRotation = new THREE.Euler(0.10, 0.0, 1.43);

  // Collision in WORLD coordinates.
  const worldBaseY = group.position.y;
  const worldFrontZ = group.position.z + frontZ;
  const worldBackZ = group.position.z + backZ;
  const worldLeftX = group.position.x - W / 2;
  const worldRightX = group.position.x + W / 2;
  const insideFloor = worldBaseY + bottom + 0.095;

  const localToWorld = (x, y, z) =>
    new THREE.Vector3(group.position.x + x, group.position.y + y, group.position.z + z);

  function addLocalSolid(center, size, tag) {
    return collision.addBox(
      localToWorld(center.x, center.y, center.z),
      new THREE.Vector3(size.x, size.y, size.z),
      tag,
    );
  }

  function updateLocalSolid(handle, center, size) {
    const worldCenter = localToWorld(center.x, center.y, center.z);
    const halfX = size.x * 0.5;
    const halfY = size.y * 0.5;
    const halfZ = size.z * 0.5;
    handle.min.set(worldCenter.x - halfX, worldCenter.y - halfY, worldCenter.z - halfZ);
    handle.max.set(worldCenter.x + halfX, worldCenter.y + halfY, worldCenter.z + halfZ);
  }

  function updateLocalPlatform(handle, center, halfX, halfZ, topY) {
    const worldCenter = localToWorld(center.x, 0, center.z);
    handle.minX = worldCenter.x - halfX;
    handle.maxX = worldCenter.x + halfX;
    handle.minZ = worldCenter.z - halfZ;
    handle.maxZ = worldCenter.z + halfZ;
    handle.y = group.position.y + topY;
  }

  collision.addPlatform({
    minX: worldLeftX + 0.055, maxX: worldRightX - 0.055,
    minZ: worldFrontZ + 0.055, maxZ: worldBackZ - 0.055,
    y: insideFloor, tag: 'terrarium-substrate',
  });

  // The mesh lid is visually open, but physically it is still a cage roof.
  collision.addSolid(
    new THREE.Vector3(worldLeftX - 0.015, worldBaseY + H - 0.025, worldFrontZ - 0.015),
    new THREE.Vector3(worldRightX + 0.015, worldBaseY + H + 0.035, worldBackZ + 0.015),
    'terrarium-mesh-roof',
  );

  // Interior shelter collision mirrors the actual open-front geometry.
  addLocalSolid(
    new THREE.Vector3(-0.37, bottom + 0.27, 0.16),
    new THREE.Vector3(0.38, 0.045, 0.28),
    'terrarium-hide-roof',
  );
  addLocalSolid(
    new THREE.Vector3(-0.5375, bottom + 0.195, 0.16),
    new THREE.Vector3(0.045, 0.15, 0.28),
    'terrarium-hide-left',
  );
  addLocalSolid(
    new THREE.Vector3(-0.2025, bottom + 0.195, 0.16),
    new THREE.Vector3(0.045, 0.15, 0.28),
    'terrarium-hide-right',
  );
  addLocalSolid(
    new THREE.Vector3(-0.37, bottom + 0.195, 0.2775),
    new THREE.Vector3(0.29, 0.15, 0.045),
    'terrarium-hide-back',
  );

  // Basking rock and water dish are real obstacles and standable landmarks.
  addLocalSolid(
    new THREE.Vector3(0.04, bottom + 0.115, 0.23),
    new THREE.Vector3(0.25, 0.09, 0.20),
    'terrarium-rock',
  );
  collision.addPlatform({
    minX: group.position.x - 0.075,
    maxX: group.position.x + 0.155,
    minZ: group.position.z + 0.14,
    maxZ: group.position.z + 0.32,
    y: worldBaseY + bottom + 0.16,
    tag: 'terrarium-rock-top',
  });

  addLocalSolid(
    new THREE.Vector3(0.38, bottom + 0.105, -0.15),
    new THREE.Vector3(0.22, 0.04, 0.22),
    'terrarium-water-dish',
  );
  collision.addPlatform({
    minX: group.position.x + 0.28,
    maxX: group.position.x + 0.48,
    minZ: group.position.z - 0.25,
    maxZ: group.position.z - 0.05,
    y: worldBaseY + bottom + 0.125,
    tag: 'terrarium-water-dish-top',
  });

  // Food dish collider moves with the animated puzzle object.
  const dishCollider = addLocalSolid(
    dish.position,
    new THREE.Vector3(0.24, 0.045, 0.24),
    'terrarium-food-dish',
  );
  const dishTopPlatform = collision.addPlatform({
    minX: 0, maxX: 0, minZ: 0, maxZ: 0, y: insideFloor,
    tag: 'terrarium-food-dish-top',
  });
  updateLocalPlatform(dishTopPlatform, dish.position, 0.105, 0.105, dish.position.y + 0.027);

  collision.addSolid(
    new THREE.Vector3(worldLeftX - 0.015, worldBaseY, group.position.z - D / 2),
    new THREE.Vector3(worldLeftX + 0.025, worldBaseY + H, group.position.z + D / 2),
    'terrarium-left-glass',
  );
  collision.addSolid(
    new THREE.Vector3(worldRightX - 0.025, worldBaseY, group.position.z - D / 2),
    new THREE.Vector3(worldRightX + 0.015, worldBaseY + H, group.position.z + D / 2),
    'terrarium-right-glass',
  );
  collision.addSolid(
    new THREE.Vector3(worldLeftX, worldBaseY, worldBackZ - 0.025),
    new THREE.Vector3(worldRightX, worldBaseY + H, worldBackZ + 0.015),
    'terrarium-back-glass',
  );

  const leftDoorCollider = collision.addSolid(
    new THREE.Vector3(group.position.x - W / 2 + frame, worldBaseY + doorBottom, worldFrontZ - 0.03),
    new THREE.Vector3(group.position.x, worldBaseY + doorBottom + doorHeight, worldFrontZ + 0.03),
    'terrarium-left-door',
  );
  const rightDoorCollider = collision.addSolid(
    new THREE.Vector3(group.position.x, worldBaseY + doorBottom, worldFrontZ - 0.03),
    new THREE.Vector3(group.position.x + W / 2 - frame, worldBaseY + doorBottom + doorHeight, worldFrontZ + 0.03),
    'terrarium-right-door',
  );

  // The food dish itself is the first movable step.
  bowlPlatform = dishTopPlatform;

  // The branch becomes a climbable route only after it is pulled into place.
  branchClimbable = collision.addClimbable({
    minX: group.position.x - 0.19,
    maxX: group.position.x + 0.19,
    minY: insideFloor + 0.02,
    maxY: insideFloor + 0.24,
    minZ: worldFrontZ + 0.04,
    maxZ: worldFrontZ + 0.36,
    topY: insideFloor + 0.22,
    exitX: group.position.x,
    exitZ: worldFrontZ + 0.16,
    tag: 'puzzle-branch',
  });
  collision.setEnabled(branchClimbable, false);

  const bowlInteraction = {
    object: dish,
    prompt: 'E / trigger — push the heavy food dish toward the doors',
    distance: 0.42,
    action: ({ playerPosition } = {}) => {
      if (bowlMoved) return 'The dish is already wedged beneath the front branch.';
      if (playerPosition && playerPosition.y > insideFloor + 0.12) {
        return 'You need to be down in the bedding to get your weight behind the dish.';
      }
      bowlMoved = true;
      bowlInteraction.prompt = 'The dish is in position.';
      cordInteraction.prompt = 'E / trigger — chew through the cord holding the branch';
      branchInteraction.prompt = 'The cord is holding the branch. Chew it through.';
      return 'The stone dish scrapes across the bedding. It can work as a step.';
    },
  };

  const cordInteraction = {
    object: branchCord,
    prompt: 'The cord is too high to reach from the bedding.',
    distance: 0.34,
    action: ({ playerPosition } = {}) => {
      if (!bowlMoved) return 'You need something to stand on. The heavy food dish could fit underneath.';
      if (cordChewed) return 'The cord is already chewed through.';
      if (!playerPosition || playerPosition.y < insideFloor + 0.045) {
        return 'Still too high. Climb onto the food dish first.';
      }
      cordChewed = true;
      branchCord.visible = false;
      branchReady = true;
      collision.setEnabled(branchClimbable, true);
      latchInteraction.prompt = 'E / trigger — push up the terrarium latch';
      return 'You gnaw through the cord. SNAP — the branch drops onto the dish and becomes a ramp.';
    },
  };

  const branchInteraction = {
    object: branch,
    prompt: 'The branch is tied up out of reach.',
    distance: 0.44,
    action: ({ playerPosition } = {}) => {
      if (!bowlMoved) return 'It is tied too high. Push something underneath first.';
      if (!cordChewed) return 'The cord is holding it up. Climb onto the dish and chew through the cord.';
      return 'The loose branch is now your ramp to the latch.';
    },
  };

  let open = false;
  let target = 0;

  const latchInteraction = {
    object: latch,
    prompt: 'The latch is too high to reach.',
    distance: 0.40,
    action: ({ playerPosition } = {}) => {
      if (!branchReady) return 'The latch is still out of reach. Build a way up first.';
      if (open) return 'The terrarium doors are already open.';
      if (!playerPosition || playerPosition.y < insideFloor + 0.145) {
        return 'Your paws cannot reach it yet. Climb higher on the branch.';
      }
      open = true;
      escaped = true;
      target = 1;
      collision.setEnabled(leftDoorCollider, false);
      collision.setEnabled(rightDoorCollider, false);
      latchInteraction.prompt = 'The latch is open.';
      return 'CLICK. Both glass doors swing outward. Day 1 escape route unlocked.';
    },
  };

  interactables.push(bowlInteraction, cordInteraction, branchInteraction, latchInteraction);

  function update(dt) {
    const speed = 3.2;
    const current = leftPivot.userData.openT ?? 0;
    const next = THREE.MathUtils.damp(current, target, speed, dt);
    leftPivot.userData.openT = next;
    rightPivot.userData.openT = next;
    leftPivot.rotation.y = next * -1.42;
    rightPivot.rotation.y = next * 1.42;
    latch.rotation.z = next * 0.55;

    const dishTarget = bowlMoved ? dishReadyPosition : dishStartPosition;
    const dishInnerTarget = bowlMoved ? dishInnerReadyPosition : dishInnerStartPosition;
    const dishBlend = 1 - Math.exp(-7 * dt);
    dish.position.lerp(dishTarget, dishBlend);
    dishInner.position.lerp(dishInnerTarget, dishBlend);
    updateLocalSolid(
      dishCollider,
      dish.position,
      new THREE.Vector3(0.24, 0.045, 0.24),
    );
    updateLocalPlatform(
      dishTopPlatform,
      dish.position,
      0.105,
      0.105,
      dish.position.y + 0.027,
    );

    const branchTargetPos = branchReady ? branchReadyPosition : branchStartPosition;
    branch.position.lerp(branchTargetPos, 1 - Math.exp(-5 * dt));
    const targetEuler = branchReady ? branchReadyRotation : branchStartRotation;
    branch.rotation.x = THREE.MathUtils.damp(branch.rotation.x, targetEuler.x, 5, dt);
    branch.rotation.y = THREE.MathUtils.damp(branch.rotation.y, targetEuler.y, 5, dt);
    branch.rotation.z = THREE.MathUtils.damp(branch.rotation.z, targetEuler.z, 5, dt);
  }

  return {
    group,
    update,
    getSpawn() {
      return new THREE.Vector3(group.position.x + 0.02, insideFloor + 0.002, group.position.z - 0.10);
    },
    getLookTarget() {
      return new THREE.Vector3(group.position.x, insideFloor + 0.12, worldFrontZ - 0.25);
    },
    getPuzzleState() {
      return { bowlMoved, cordChewed, branchReady, open, escaped };
    },
  };
}
