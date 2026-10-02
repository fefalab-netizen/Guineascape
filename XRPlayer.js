import * as THREE from 'three';

export class XRPlayer {
  constructor({ renderer, camera, scene, spawn, collision, interact }) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.collision = collision;
    this.interact = interact;
    this.hamsterScale = 0.07; // ~1.7 m human eye becomes ~12 cm hamster eye.
    this.speed = 0.72;
    this.snapLatch = false;
    this.enabled = false;

    this.rig = new THREE.Group();
    this.rig.name = 'XR hamster rig';
    // Desktop uses an unscaled rig at the world origin. On XR session start
    // we move/scale this rig so real head movement becomes hamster-sized.
    this.spawn = spawn.clone();
    this.rig.position.set(0, 0, 0);
    this.rig.scale.setScalar(1);
    scene.add(this.rig);
    this.rig.add(camera);

    this.controllers = [renderer.xr.getController(0), renderer.xr.getController(1)];
    this.controllers.forEach((controller, index) => {
      controller.userData.index = index;
      this.rig.add(controller);
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1.5),
      ]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      line.name = 'XR interaction ray';
      controller.add(line);
      controller.addEventListener('selectstart', () => this.interact(controller));
    });

    renderer.xr.addEventListener('sessionstart', () => {
      this.enabled = true;
      this.rig.position.copy(this.spawn);
      this.rig.rotation.set(0, 0, 0);
      this.rig.scale.setScalar(this.hamsterScale);
      this.camera.position.set(0, 0, 0);
      this.camera.rotation.set(0, 0, 0);
    });
    renderer.xr.addEventListener('sessionend', () => {
      this.enabled = false;
      this.rig.position.set(0, 0, 0);
      this.rig.rotation.set(0, 0, 0);
      this.rig.scale.setScalar(1);
    });
  }

  update(dt) {
    if (!this.enabled) return;
    const session = this.renderer.xr.getSession();
    if (!session) return;

    const sources = [...session.inputSources];
    if (!sources.length) return;

    const xrCamera = this.renderer.xr.getCamera(this.camera);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(xrCamera.quaternion);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    let moveX = 0;
    let moveY = 0;
    let turn = 0;

    for (const source of sources) {
      const gp = source.gamepad;
      if (!gp || gp.axes.length < 2) continue;
      const ax = Math.abs(gp.axes[gp.axes.length - 2]) > 0.14 ? gp.axes[gp.axes.length - 2] : 0;
      const ay = Math.abs(gp.axes[gp.axes.length - 1]) > 0.14 ? gp.axes[gp.axes.length - 1] : 0;
      if (source.handedness === 'left') {
        moveX = ax; moveY = ay;
      } else if (source.handedness === 'right') {
        turn = ax;
      }
    }

    const delta = right.multiplyScalar(moveX).add(forward.multiplyScalar(-moveY)).multiplyScalar(this.speed * dt);
    // The rig itself is in world space; physical head movement is scaled separately by rig scale.
    this.rig.position.add(delta);

    // Keep locomotion inside broad room bounds for this first prototype.
    this.rig.position.x = THREE.MathUtils.clamp(this.rig.position.x, -5.75, 5.75);
    this.rig.position.z = THREE.MathUtils.clamp(this.rig.position.z, -4.25, 4.25);

    if (Math.abs(turn) > 0.72 && !this.snapLatch) {
      this.rig.rotation.y += -Math.sign(turn) * THREE.MathUtils.degToRad(30);
      this.snapLatch = true;
    }
    if (Math.abs(turn) < 0.28) this.snapLatch = false;
  }
}
