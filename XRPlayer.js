import * as THREE from 'three';

export class XRPlayer {
  constructor({ renderer, camera, scene, spawn, collision, interact }) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.collision = collision;
    this.interact = interact;
    this.hamsterScale = 0.07;
    this.speed = 0.72;
    this.climbSpeed = 0.38;
    this.gravity = 2.6;
    this.velocityY = 0;
    this.moveVelocity = new THREE.Vector3();
    this.radius = 0.055;
    this.bodyHeight = 0.14;
    this.snapLatch = false;
    this.enabled = false;
    this.grounded = true;

    this.rig = new THREE.Group();
    this.rig.name = 'XR hamster rig';
    this.spawn = spawn.clone();
    this.lastSafePosition = this.spawn.clone();
    this.safeTimer = 0;
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
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
      );
      line.name = 'XR interaction ray';
      controller.add(line);
      controller.addEventListener('selectstart', () => this.interact(controller));
    });

    renderer.xr.addEventListener('sessionstart', () => {
      this.enabled = true;
      this.velocityY = 0;
      this.grounded = true;
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

  reset() {
    this.rig.position.copy(this.spawn);
    this.velocityY = 0;
    this.grounded = true;
    this.lastSafePosition.copy(this.spawn);
    this.safeTimer = 0;
  }

  recoverToLastSafe() {
    this.rig.position.copy(this.lastSafePosition);
    this.velocityY = 0;
    this.grounded = true;
    this.collision.resolvePlayer(this.rig.position, this.radius, this.bodyHeight);
  }

  tryMove(delta) {
    const tryAxis = (axis, amount) => {
      if (Math.abs(amount) <= 0) return;
      const test = this.rig.position.clone();
      test[axis] += amount;

      if (!this.collision.intersectsPlayer(test, this.radius, this.bodyHeight)) {
        this.rig.position[axis] = test[axis];
        return;
      }

      if (!this.grounded) return;

      const stepUp = 0.025;
      const stepped = test.clone();
      stepped.y += stepUp;
      if (!this.collision.intersectsPlayer(stepped, this.radius, this.bodyHeight)) {
        this.rig.position.copy(stepped);
        this.velocityY = 0;
        this.grounded = true;
      }
    };

    tryAxis('x', delta.x);
    tryAxis('z', delta.z);
  }

  update(dt) {
    if (!this.enabled) return;
    const session = this.renderer.xr.getSession();
    if (!session) return;

    const sources = [...session.inputSources];
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

      const ax = Math.abs(gp.axes[gp.axes.length - 2]) > 0.14
        ? gp.axes[gp.axes.length - 2]
        : 0;
      const ay = Math.abs(gp.axes[gp.axes.length - 1]) > 0.14
        ? gp.axes[gp.axes.length - 1]
        : 0;

      if (source.handedness === 'left') {
        moveX = ax;
        moveY = ay;
      } else if (source.handedness === 'right') {
        turn = ax;
      }
    }

    const climbable = this.collision.findClimbable(this.rig.position, this.radius + 0.04);
    const wantsClimb = moveY < -0.25;

    if (climbable && wantsClimb) {
      this.velocityY = 0;
      this.rig.position.y += this.climbSpeed * dt;

      if (this.rig.position.y >= climbable.topY - 0.01) {
        this.rig.position.y = climbable.topY + 0.002;
        if (climbable.exitX !== null) this.rig.position.x = THREE.MathUtils.damp(this.rig.position.x, climbable.exitX, 18, dt);
        if (climbable.exitZ !== null) this.rig.position.z = THREE.MathUtils.damp(this.rig.position.z, climbable.exitZ, 18, dt);
        this.collision.resolvePlayer(this.rig.position, this.radius, this.bodyHeight);
        this.grounded = true;
      }
    } else {
      const desired = right
        .multiplyScalar(moveX)
        .add(forward.multiplyScalar(-moveY));

      if (desired.lengthSq() > 1) desired.normalize();
      desired.multiplyScalar(this.speed);

      const accel = desired.lengthSq() > 0.0001 ? 12 : 18;
      const blend = 1 - Math.exp(-accel * dt);
      this.moveVelocity.lerp(desired, blend);
      this.tryMove(this.moveVelocity.clone().multiplyScalar(dt));

      this.velocityY -= this.gravity * dt;
      const vertical = this.collision.moveVertical(
        this.rig.position,
        this.velocityY * dt,
        this.radius,
        this.bodyHeight,
      );

      if (vertical.grounded) {
        this.velocityY = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
      }

      if (vertical.hitCeiling && this.velocityY > 0) this.velocityY = 0;
    }

    this.rig.position.x = THREE.MathUtils.clamp(this.rig.position.x, -5.75, 5.75);
    this.rig.position.z = THREE.MathUtils.clamp(this.rig.position.z, -4.25, 4.25);

    const resolved = this.collision.resolvePlayer(this.rig.position, this.radius, this.bodyHeight);
    if (resolved) this.velocityY = Math.min(this.velocityY, 0);

    this.safeTimer += dt;
    if (
      this.grounded &&
      !this.collision.intersectsPlayer(this.rig.position, this.radius, this.bodyHeight) &&
      this.safeTimer >= 0.35
    ) {
      this.lastSafePosition.copy(this.rig.position);
      this.safeTimer = 0;
    }

    if (this.rig.position.y < -0.7) this.recoverToLastSafe();

    if (Math.abs(turn) > 0.72 && !this.snapLatch) {
      this.rig.rotation.y += -Math.sign(turn) * THREE.MathUtils.degToRad(30);
      this.snapLatch = true;
    }
    if (Math.abs(turn) < 0.28) this.snapLatch = false;
  }
}
