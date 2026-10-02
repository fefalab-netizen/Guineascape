import * as THREE from 'three';

export class NightOne {
  constructor({
    scene,
    sun,
    hemi,
    hideZone,
    getPlayerPosition,
    onMessage,
    onObjective,
    onNightLabel,
    onCaught,
  }) {
    this.scene = scene;
    this.sun = sun;
    this.hemi = hemi;
    this.hideZone = hideZone;
    this.getPlayerPosition = getPlayerPosition;
    this.onMessage = onMessage;
    this.onObjective = onObjective;
    this.onNightLabel = onNightLabel;
    this.onCaught = onCaught;

    this.state = 'day';
    this.time = 0;
    this.started = false;
    this.complete = false;
    this.audio = null;
    this.lastFootstep = -99;
    this.flashlightPhase = 0;

    this.dayBackground = new THREE.Color(0x9fa69f);
    this.nightBackground = new THREE.Color(0x12171c);
    this.dayFog = new THREE.Color(0x9fa69f);
    this.nightFog = new THREE.Color(0x12171c);

    this.flashTarget = new THREE.Object3D();
    this.scene.add(this.flashTarget);

    this.flashlight = new THREE.SpotLight(0xd9ecff, 0, 6.5, Math.PI / 10, 0.55, 1.35);
    this.flashlight.position.set(3.8, 2.65, -3.7);
    this.flashlight.target = this.flashTarget;
    this.flashlight.castShadow = false;
    this.scene.add(this.flashlight);

    this.shadowWall = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 2.7),
      new THREE.MeshBasicMaterial({
        color: 0x020303,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.shadowWall.position.set(4.8, 1.45, -4.32);
    this.shadowWall.rotation.y = Math.PI;
    this.scene.add(this.shadowWall);
  }

  setAudioContext(ctx) {
    this.audio = ctx;
  }

  thump(intensity = 1) {
    if (!this.audio || this.audio.state !== 'running') return;
    const now = this.audio.currentTime;
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(56, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16 * intensity, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain).connect(this.audio.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  clickSound() {
    if (!this.audio || this.audio.state !== 'running') return;
    const now = this.audio.currentTime;
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(210, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    osc.connect(gain).connect(this.audio.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  begin() {
    if (this.started || this.complete) return;
    this.started = true;
    this.state = 'warning';
    this.time = 0;
    this.onNightLabel?.('EVENING');
    this.onMessage?.('A car door slams somewhere outside. The humans are home.');
    this.onObjective?.('Find somewhere low and dark to hide before they enter.');
    this.clickSound();
  }

  isHidden() {
    const p = this.getPlayerPosition();
    const z = this.hideZone;
    return (
      p.x >= z.minX &&
      p.x <= z.maxX &&
      p.z >= z.minZ &&
      p.z <= z.maxZ &&
      p.y <= z.maxY
    );
  }

  fail() {
    if (this.state === 'failed' || this.complete) return;
    this.state = 'failed';
    this.flashlight.intensity = 8;
    this.onMessage?.('The light stops on you. Heavy footsteps rush closer.');
    this.onObjective?.('Caught. Returning to the terrarium...');
    this.thump(1.3);
    setTimeout(() => this.onCaught?.(), 1200);
  }

  finish() {
    if (this.complete) return;
    this.complete = true;
    this.state = 'complete';
    this.flashlight.intensity = 0;
    this.shadowWall.material.opacity = 0;
    this.onNightLabel?.('MORNING');
    this.onMessage?.('The footsteps fade. You survived your first night.');
    this.onObjective?.('Night 1 complete. Day 2 will begin from here.');
  }

  updateLighting(dt) {
    const darkness = THREE.MathUtils.clamp(
      this.state === 'day' ? 0 : this.time / 8,
      0,
      1,
    );

    this.sun.intensity = THREE.MathUtils.lerp(2.2, 0.16, darkness);
    this.hemi.intensity = THREE.MathUtils.lerp(1.45, 0.25, darkness);
    this.scene.background.copy(this.dayBackground).lerp(this.nightBackground, darkness);
    if (this.scene.fog) {
      this.scene.fog.color.copy(this.dayFog).lerp(this.nightFog, darkness);
      this.scene.fog.near = THREE.MathUtils.lerp(4.5, 2.8, darkness);
      this.scene.fog.far = THREE.MathUtils.lerp(13.5, 9.0, darkness);
    }
  }

  update(dt) {
    if (!this.started || this.complete || this.state === 'failed') return;

    this.time += dt;
    this.updateLighting(dt);

    if (this.state === 'warning') {
      if (this.time > 4.5 && this.time - this.lastFootstep > 1.4) {
        this.lastFootstep = this.time;
        this.thump(0.65);
      }

      if (this.time >= 10) {
        this.state = 'entry';
        this.time = 0;
        this.onNightLabel?.('NIGHT 1');
        this.onMessage?.('The bedroom door opens.');
        this.onObjective?.('Stay hidden. Do not let the search light find you.');
        this.shadowWall.material.opacity = 0.34;
        this.clickSound();
      }
      return;
    }

    if (this.state === 'entry') {
      if (this.time - this.lastFootstep > 1.05) {
        this.lastFootstep = this.time;
        this.thump(0.8);
      }

      const approach = THREE.MathUtils.clamp(this.time / 5.5, 0, 1);
      this.shadowWall.position.x = THREE.MathUtils.lerp(4.8, 3.65, approach);
      this.shadowWall.material.opacity = THREE.MathUtils.lerp(0.34, 0.52, approach);

      if (this.time >= 5.5) {
        this.state = 'search';
        this.time = 0;
        this.flashlight.intensity = 5.2;
        this.onMessage?.('A flashlight clicks on.');
      }
      return;
    }

    if (this.state === 'search') {
      this.flashlightPhase += dt;

      const sweep = (Math.sin(this.flashlightPhase * 0.95) + 1) * 0.5;
      const zSweep = (Math.sin(this.flashlightPhase * 0.57 + 1.8) + 1) * 0.5;
      this.flashTarget.position.set(
        THREE.MathUtils.lerp(-4.2, 4.7, sweep),
        0.08,
        THREE.MathUtils.lerp(-2.4, 3.3, zSweep),
      );

      if (this.time - this.lastFootstep > 1.6) {
        this.lastFootstep = this.time;
        this.thump(0.5);
      }

      // Night 1 is forgiving: the player only gets caught if they remain exposed
      // once the search has been active for a moment.
      if (this.time > 2.0 && !this.isHidden()) {
        this.fail();
        return;
      }

      if (this.time >= 7.5) {
        this.state = 'tank-check';
        this.time = 0;
        this.flashlight.intensity = 2.4;
        this.flashTarget.position.set(3.65, 1.2, 2.72);
        this.onMessage?.('The beam leaves the floor. Glass taps above you.');
        this.onObjective?.('Stay hidden until the human leaves.');
        this.clickSound();
      }
      return;
    }

    if (this.state === 'tank-check') {
      if (this.time === 0 || this.time - this.lastFootstep > 1.35) {
        this.lastFootstep = this.time;
        this.thump(0.45);
      }

      const pulse = 0.5 + 0.5 * Math.sin(this.time * 4.5);
      this.flashlight.intensity = 1.6 + pulse * 1.4;

      if (this.time >= 6.0) {
        this.state = 'exit';
        this.time = 0;
        this.flashlight.intensity = 0;
        this.onMessage?.('The room goes quiet.');
      }
      return;
    }

    if (this.state === 'exit') {
      if (this.time - this.lastFootstep > 1.1 && this.time < 4.2) {
        this.lastFootstep = this.time;
        this.thump(THREE.MathUtils.lerp(0.55, 0.18, this.time / 4.2));
      }
      this.shadowWall.material.opacity = THREE.MathUtils.lerp(0.42, 0, THREE.MathUtils.clamp(this.time / 4, 0, 1));

      if (this.time >= 5.0) this.finish();
    }
  }
}
