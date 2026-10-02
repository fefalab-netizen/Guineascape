import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { CollisionWorld } from './CollisionWorld.js';
import { createRoom } from './createRoom.js';
import { createTerrarium } from './createTerrarium.js';
import { DesktopPlayer } from './DesktopPlayer.js';
import { XRPlayer } from './XRPlayer.js';

const app = document.querySelector('#app');
const startScreen = document.querySelector('#start-screen');
const startDesktop = document.querySelector('#start-desktop');
const promptEl = document.querySelector('#prompt');
const objectiveEl = document.querySelector('#objective');
const toastEl = document.querySelector('#toast');
const crosshair = document.querySelector('#crosshair');
const xrStatusEl = document.querySelector('#xr-status');

window.__HAMSTER_STARTED__ = true;

async function updateXRStatus() {
  if (!xrStatusEl) return;
  if (!window.isSecureContext) {
    xrStatusEl.textContent = 'VR requires HTTPS. GitHub Pages will provide it automatically.';
    return;
  }
  if (!('xr' in navigator)) {
    xrStatusEl.textContent = 'WebXR is not exposed by this browser. Desktop mode can still be used.';
    return;
  }
  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr');
    xrStatusEl.textContent = supported
      ? 'VR detected — use the ENTER VR button at the lower-left.'
      : 'This browser reports that immersive VR is unavailable. Desktop mode can still be used.';
  } catch (error) {
    xrStatusEl.textContent = `WebXR check failed: ${error?.message ?? error}`;
  }
}
updateXRStatus();

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
app.appendChild(renderer.domElement);

const vrButton = VRButton.createButton(renderer, {
  optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
});
vrButton.id = 'VRButton';
document.body.appendChild(vrButton);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fa69f);
scene.fog = new THREE.Fog(0x9fa69f, 4.5, 13.5);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.012, 30);

// Lighting intentionally soft/simple for a low-poly prototype.
scene.add(new THREE.HemisphereLight(0xdbe7ee, 0x57483d, 1.45));
const sun = new THREE.DirectionalLight(0xfff0d6, 2.2);
sun.position.set(-3.5, 6.5, -2.5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -7;
sun.shadow.camera.right = 7;
sun.shadow.camera.top = 6;
sun.shadow.camera.bottom = -6;
scene.add(sun);

const collision = new CollisionWorld();
const interactables = [];
createRoom(scene, collision);
const terrarium = createTerrarium(scene, collision, interactables);

const spawn = terrarium.getSpawn();
const desktopPlayer = new DesktopPlayer({
  camera,
  domElement: renderer.domElement,
  collision,
  spawn,
  lookTarget: terrarium.getLookTarget(),
});

const raycaster = new THREE.Raycaster();
const tmpOrigin = new THREE.Vector3();
const tmpDirection = new THREE.Vector3();
let currentInteraction = null;
let toastTimer = null;

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2700);
}

function findInteractionFromRay(origin, direction, maxDistance = 0.7) {
  raycaster.set(origin, direction);
  raycaster.far = maxDistance;
  let best = null;
  let bestDistance = Infinity;

  for (const item of interactables) {
    const hits = raycaster.intersectObject(item.object, true);
    if (hits.length && hits[0].distance <= (item.distance ?? maxDistance) && hits[0].distance < bestDistance) {
      best = item;
      bestDistance = hits[0].distance;
    }
  }
  return best;
}

function updateDesktopInteraction() {
  camera.getWorldPosition(tmpOrigin);
  camera.getWorldDirection(tmpDirection);
  currentInteraction = findInteractionFromRay(tmpOrigin, tmpDirection, 0.7);
  if (currentInteraction && document.pointerLockElement === renderer.domElement) {
    promptEl.textContent = currentInteraction.prompt;
    promptEl.classList.add('visible');
  } else {
    promptEl.classList.remove('visible');
  }
}

function activateCurrent() {
  if (!currentInteraction) return;
  const message = currentInteraction.action?.();
  if (message) toast(message);
  objectiveEl.textContent = 'Objective: get through the front opening and look at the huge room.';
}

function interactFromController(controller) {
  controller.getWorldPosition(tmpOrigin);
  controller.getWorldDirection(tmpDirection);
  tmpDirection.negate();
  const item = findInteractionFromRay(tmpOrigin, tmpDirection, 1.0);
  if (item) {
    const message = item.action?.();
    if (message) toast(message);
  }
}

const xrPlayer = new XRPlayer({
  renderer,
  camera,
  scene,
  spawn,
  collision,
  interact: interactFromController,
});

function startDesktopPlay() {
  startScreen.classList.add('hidden');
  desktopPlayer.requestPointerLock();
}
startDesktop.addEventListener('click', startDesktopPlay);
renderer.domElement.addEventListener('click', () => {
  if (!renderer.xr.isPresenting && startScreen.classList.contains('hidden')) {
    if (document.pointerLockElement !== renderer.domElement) desktopPlayer.requestPointerLock();
    else activateCurrent();
  }
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyE') activateCurrent();
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  crosshair.style.opacity = locked ? '1' : '0.35';
});

renderer.xr.addEventListener('sessionstart', () => {
  startScreen.classList.add('hidden');
  crosshair.style.display = 'none';
  promptEl.classList.remove('visible');
  desktopPlayer.enabled = false;
  toast('VR mode: left stick moves, right stick snap-turns, trigger interacts.');
});
renderer.xr.addEventListener('sessionend', () => {
  desktopPlayer.enabled = true;
  desktopPlayer.reset();
  camera.position.copy(desktopPlayer.position);
  crosshair.style.display = '';
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.04);
  terrarium.update(dt);
  if (renderer.xr.isPresenting) {
    xrPlayer.update(dt);
  } else {
    desktopPlayer.update(dt);
    updateDesktopInteraction();
  }
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
