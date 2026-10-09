# Guineascape / Hamster Escape — WebXR prototype

A browser + WebXR first-person escape game played from hamster scale inside one oversized bedroom.

The current prototype focuses on the first playable slice:

- Day 1 terrarium escape puzzle
- dresser landing and climb-down route
- floor exploration and hiding
- Night 1 unseen-human encounter
- visible flashlight stealth
- Day 2 blanket route onto the bed
- desktop + WebXR locomotion
- 75% internal render scale for performance and a subtle pixel look

## Current gameplay

### Day 1 — escape the terrarium

1. The front latch is too high.
2. Push the food dish toward the front of the enclosure.
3. Climb onto the dish.
4. Chew through the cord holding the branch up.
5. The branch drops into a climbable ramp.
6. Climb the branch and push up the latch.
7. Exit onto the dresser ledge.

### Night 1

After reaching the bedroom floor:

- evening begins
- footsteps approach
- the human enters as a large dark presence
- a visible flashlight beam sweeps the room
- hiding inside the cardboard shelter protects you
- the flashlight only catches you when its visible floor pool actually remains on you long enough
- survive until the human checks the enclosure and leaves

### Day 2

Use the hanging blanket to climb from the floor onto the bed.

## Desktop controls

- **WASD** — move
- **Mouse** — look
- **Shift** — run
- **Space** — jump / mantle
- **W or Space** against climbable surfaces — climb
- **E / left click** — interact
- **R** — recover to the most recent safe grounded position
- **T** — return to the terrarium test spawn

## VR controls

Open the GitHub Pages HTTPS URL in a WebXR-capable headset browser.

- Left stick — move / climb when pushing forward against a climbable surface
- Right stick — 30° snap turn
- Trigger — interact along the controller ray

## Running on GitHub Pages

This repository is currently designed to run directly as static ES modules from GitHub Pages.

The root contains:

- `index.html`
- `main.js`
- game modules such as `DesktopPlayer.js`, `NightOne.js`, etc.
- `style.css`

Three.js is loaded through the import map in `index.html`.

Use the repository's GitHub Pages HTTPS URL. WebXR requires a secure context.

## Performance

The prototype intentionally renders at **75% internal resolution** and stretches the canvas to full size with CSS. This reduces GPU load and gives the game a mild pixel-textured look without becoming aggressively low-resolution.

## Third-party prototype asset

Night 1 uses **CesiumMan** from KhronosGroup/glTF-Sample-Assets as a temporary dark human silhouette.

- Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMan
- Model credit: © 2017 Cesium
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)

The model is loaded from the upstream repository at runtime.
