# Hamster Escape — WebXR room prototype v2

A small Three.js/WebXR prototype for the hamster escape game. The room uses simple placeholder geometry; the reptile-style front-opening terrarium is more detailed because it is the player's starting environment.

## Important: what was fixed in v2

The first archive deployed the raw `src/` folder directly to GitHub Pages even though the project contained a Vite-only CSS import (`import './style.css'`). That can stop the module graph before the game initializes, producing a blank/non-working page on both desktop and VR.

**v2 fixes that architecture:** GitHub Actions now installs the dependencies, runs Vite, and deploys the compiled `dist/` folder.

The page also has a visible startup-error panel. If the app ever crashes during boot, it should show the actual JavaScript error instead of silently staying blank.

## What is implemented

- 12 m × 9 m stylized bedroom at hamster scale.
- Desktop first-person camera around 10.5 cm above the hamster's feet.
- Bed, desk, monitor, wardrobe, dresser, nightstand, rug, room door and window placeholders.
- Detailed reptile-style terrarium with:
  - twin front-opening glass doors
  - door frames and hinges
  - working center latch
  - side/back glass
  - vent strip
  - mesh top
  - substrate
  - hide
  - food and water dishes
  - climbing branches
  - fake plant
  - basking rock
  - heat lamp
- Basic collisions, gravity, jumping and resetting.
- Desktop pointer-lock controls.
- WebXR entry button, headset-scale rig, controller-ray interaction, left-stick locomotion and right-stick snap turning.

## Easiest way to test it

### GitHub Pages

1. Create a new empty GitHub repository.
2. Upload **the contents of this folder**, not the outer ZIP/folder itself.
3. Make sure these items appear at the repository root:
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `src/`
   - `.github/`
4. Make sure the default branch is `main`.
5. Go to **Settings → Pages**.
6. Under **Build and deployment → Source**, choose **GitHub Actions**.
7. Open the **Actions** tab and wait for **Build and deploy to GitHub Pages** to finish successfully.
8. Open the Pages URL printed by the deployment.

The production site must be opened through the GitHub Pages `https://...` address for WebXR. Do not use the GitHub source-file preview URL.

### Local desktop development

You need Node.js installed:

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

Do **not** test by double-clicking `index.html`; this is a module-based web app and should be served over HTTP/HTTPS.

## Desktop controls

- `WASD` — move
- `Mouse` — look
- `Shift` — run
- `Space` — jump
- `E` or left click — interact
- `R` — respawn inside the terrarium

Press **Play on desktop** and allow the browser to capture the mouse. Walk toward the center latch between the two glass doors. When the interaction prompt appears, press `E`.

## VR controls

Open the **same GitHub Pages HTTPS URL** in a WebXR-capable headset browser.

- Left stick — move
- Right stick — 30° snap turn
- Trigger — interact along the controller ray

The start panel now reports whether that browser exposes `immersive-vr`. If supported, the Three.js **ENTER VR** button appears in the lower-left.

## If it still fails

Look for one of these two things and send it back to ChatGPT:

1. The red/black **prototype crashed while starting** box and its exact error text.
2. A failed step in **GitHub → Actions → Build and deploy to GitHub Pages**.

That gives us an exact failure instead of guessing.
