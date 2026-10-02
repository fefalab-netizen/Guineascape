# Hamster Escape — WebXR room prototype

A GitHub-ready Three.js + WebXR prototype for a first-person hamster escape game.

## What is implemented

- One oversized low-poly bedroom built at real-ish meter scale.
- Hamster-height desktop camera (~10.5 cm eye height).
- Detailed front-opening reptile-style glass terrarium.
- Twin glass doors, frame, vents, mesh top, deep substrate, hide, bowls, branch, plant, basking rock and heat lamp.
- Interactive terrarium latch; doors animate open/closed.
- Desktop movement: WASD, mouse look, jump, run, interaction.
- WebXR: headset-scale world rig, controller-ray interaction, left-stick locomotion and right-stick snap turn.
- Basic collision and floor/platform support.
- Zero-build GitHub Pages deployment workflow.

## Fastest way to try it on GitHub

1. Create a new empty GitHub repository.
2. Upload/push **everything in this folder**, including `.github`.
3. Make sure the default branch is `main`.
4. Open the repository's **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **GitHub Actions**.
6. Open the **Actions** tab. The included workflow publishes `index.html` and `src/` directly.
7. When the deploy finishes, open the GitHub Pages URL.

There is no npm build required for GitHub Pages. The browser uses an import map pinned to `three@0.186.1` from jsDelivr.

## Desktop controls

- `WASD` — move
- `Mouse` — look
- `Shift` — run
- `Space` — jump
- `E` or left click — interact
- `R` — reset inside the terrarium

Walk toward the center latch on the two front glass doors and look directly at it. A prompt will appear.

## WebXR controls

- Left controller stick — move
- Right controller stick — 30° snap turn
- Trigger — interact with the object your controller ray points at

Open the deployed **HTTPS** GitHub Pages URL in a WebXR-capable headset browser and press **ENTER VR**. The player rig scales physical headset movement down so normal human head height reads approximately as hamster eye height in the room.

## Optional local development

The project also includes Vite if you want hot reload:

```bash
npm install
npm run dev
```

Or use any ordinary local static server. Do not double-click `index.html` from the filesystem; ES modules should be served over HTTP.

## Current prototype scope

This is intentionally the **room + terrarium foundation**, not Day 1 gameplay yet. The direct latch interaction is a temporary test interaction. Next we can replace it with the real Day 1 puzzle where the hamster has to manipulate objects inside the enclosure to reach/release the latch.

Suggested next steps:

1. Tune room and hamster scale in VR.
2. Replace direct latch interaction with the Day 1 physical puzzle.
3. Add climbable surfaces / grabbing.
4. Build the terrarium-to-dresser-to-floor descent route.
5. Add day/night lighting.
6. Add the unseen-human system: footsteps, shadows, environmental movement, flashlight and vibration.
7. Add seven-day progression/save state.
