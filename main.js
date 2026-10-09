import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { CollisionWorld } from './CollisionWorld.js';
import { createRoom } from './createRoom.js';
import { createTerrarium } from './createTerrarium.js';
import { DesktopPlayer } from './DesktopPlayer.js';
import { XRPlayer } from './XRPlayer.js';
import { NightOne } from './NightOne.js';
import { DayTwo } from './DayTwo.js';
import { applyCelShading, addCelOutlines } from './CelShading.js';

const app = document.querySelector('#app');
const startScreen = document.querySelector('#start-screen');
const startDesktop = document.querySelector('#start-desktop');
const promptEl = document.querySelector('#prompt');
const objectiveEl = document.querySelector('#objective');
const toastEl = document.querySelector('#toast');
const crosshair = document.querySelector('#crosshair');
const xrStatusEl = document.querySelector('#xr-status');
const dayPillEl = document.querySelector('.day-pill');
const escapeBannerEl = document.querySelector('#escape-banner');

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

// Render slightly below the display resolution, then let CSS stretch the canvas.
// This gives a subtle pixel texture and lowers GPU fill cost without looking overly chunky.
const DESKTOP_RENDER_SCALE = 0.75;
const XR_RENDER_SCALE = 0.75;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(
  Math.max(1, Math.floor(window.innerWidth * DESKTOP_RENDER_SCALE)),
  Math.max(1, Math.floor(window.innerHeight * DESKTOP_RENDER_SCALE)),
  false,
);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
// WebXR renders to its own framebuffer, so apply the same gentle reduction there.
renderer.xr.setFramebufferScaleFactor(XR_RENDER_SCALE);
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
const hemi = new THREE.HemisphereLight(0xdbe7ee, 0x4d4138, 1.10);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d6, 2.65);
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
const roomMeta = createRoom(scene, collision, interactables);
const terrarium = createTerrarium(scene, collision, interactables);

// Convert opaque environment materials to a lightweight three-band cel-shaded look.
// Transparent glass/water/beam materials are preserved.
applyCelShading(scene);
addCelOutlines(scene);

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
    crosshair.classList.add('interactable');
  } else {
    promptEl.classList.remove('visible');
    crosshair.classList.remove('interactable');
  }
}

function updateObjective() {
  const state = terrarium.getPuzzleState?.();
  if (!state) return;

  if (nightOne?.started && !nightOne.complete) return;
  if (dayTwo?.active || dayTwo?.complete) return;
  if (nightOne?.complete) {
    objectiveEl.textContent = 'Morning. The next route is somewhere across the room.';
    return;
  }

  const p = getActivePlayerPosition?.();
  if (state.open && p && p.y < 0.16) {
    objectiveEl.textContent = 'Objective: stay near cover. Evening is approaching.';
  } else if (state.open) {
    objectiveEl.textContent = 'Objective: climb down the hanging cloth to the bedroom floor.';
  } else if (state.branchReady) {
    objectiveEl.textContent = 'Objective: climb the fallen branch and push up the latch.';
  } else if (state.bowlMoved && !state.cordChewed) {
    objectiveEl.textContent = 'Objective: climb onto the dish and chew through the cord holding the branch.';
  } else {
    objectiveEl.textContent = 'Objective: the latch is too high. Build yourself a way up.';
  }
}

function activateCurrent() {
  if (!currentInteraction) return;
  const message = currentInteraction.action?.({
    playerPosition: getActivePlayerPosition().clone(),
    source: 'desktop',
  });
  if (message) toast(message);
  updateObjective();
}

function interactFromController(controller) {
  controller.getWorldPosition(tmpOrigin);
  controller.getWorldDirection(tmpDirection);
  tmpDirection.negate();
  const item = findInteractionFromRay(tmpOrigin, tmpDirection, 1.0);
  if (item) {
    const message = item.action?.({
      playerPosition: getActivePlayerPosition().clone(),
      source: 'xr',
    });
    if (message) toast(message);
    updateObjective();
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


let audioContext = null;
function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  audioContext?.resume?.();
  nightOne?.setAudioContext(audioContext);
}

function getActivePlayerPosition() {
  return renderer.xr.isPresenting ? xrPlayer.rig.position : desktopPlayer.position;
}

const nightOne = new NightOne({
  scene,
  sun,
  hemi,
  hideZone: roomMeta.hideZone,
  getPlayerPosition: getActivePlayerPosition,
  onMessage: toast,
  onObjective: (message) => {
    objectiveEl.textContent = message;
  },
  onNightLabel: (label) => {
    if (dayPillEl) dayPillEl.textContent = label;
  },
  onCaught: () => {
    if (renderer.xr.isPresenting) xrPlayer.reset();
    else desktopPlayer.reset();
    nightOne.retryFromDay();
    toast('You wake back in the terrarium. Try the escape again.');
    updateObjective();
  },
});


const dayTwo = new DayTwo({
  bedTopZone: roomMeta.bedTopZone,
  nightstandZone: roomMeta.nightstandZone,
  deskTopZone: roomMeta.deskTopZone,
  windowSillZone: roomMeta.windowSillZone,
  routeState: roomMeta.routeState,
  getPlayerPosition: getActivePlayerPosition,
  onMessage: toast,
  onObjective: (message) => {
    objectiveEl.textContent = message;
  },
  onDayLabel: (label) => {
    if (dayPillEl) dayPillEl.textContent = label;
  },
});

let dayTwoDelay = 0;
let escapeBannerShown = false;

function startDesktopPlay() {
  ensureAudio();
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
  ensureAudio();
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

updateObjective();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.04);
  terrarium.update(dt);
  roomMeta.update?.(dt, getActivePlayerPosition());

  const puzzleState = terrarium.getPuzzleState?.();
  const playerPos = getActivePlayerPosition();
  if (
    puzzleState?.open &&
    !nightOne.started &&
    !nightOne.complete &&
    playerPos.y < 0.16
  ) {
    nightOne.begin();
  }
  nightOne.update(dt);

  if (nightOne.complete && !dayTwo.active && !dayTwo.complete) {
    dayTwoDelay += dt;
    if (dayTwoDelay >= 2.5) dayTwo.begin();
  }
  dayTwo.update();

  if (dayTwo.complete && !escapeBannerShown) {
    escapeBannerShown = true;
    if (escapeBannerEl) escapeBannerEl.hidden = false;
  }

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
  renderer.setSize(
    Math.max(1, Math.floor(window.innerWidth * DESKTOP_RENDER_SCALE)),
    Math.max(1, Math.floor(window.innerHeight * DESKTOP_RENDER_SCALE)),
    false,
  );
});
