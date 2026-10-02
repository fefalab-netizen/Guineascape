import * as THREE from 'three';

export class DesktopPlayer {
  constructor({ camera, domElement, collision, spawn, lookTarget }) {
    this.camera = camera;
    this.domElement = domElement;
    this.collision = collision;
    this.spawn = spawn.clone();
    this.position = spawn.clone();
    this.velocityY = 0;
    this.eyeHeight = 0.105;
    this.bodyHeight = 0.14;
    this.radius = 0.052;
    this.speed = 0.62;
    this.runSpeed = 0.95;
    this.jumpSpeed = 0.82;
    this.gravity = 2.75;
    this.climbSpeed = 0.42;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.enabled = true;
    this.grounded = true;
    this.climbing = false;

    const dir = lookTarget.clone().sub(new THREE.Vector3(spawn.x, spawn.y + this.eyeHeight, spawn.z)).normalize();
    this.yaw = Math.atan2(-dir.x, -dir.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));

    this.onKeyDown = (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        if (document.pointerLockElement === this.domElement) this.handleJumpOrMantle();
      }
      if (e.code === 'KeyR') this.reset();
    };
    this.onKeyUp = (e) => this.keys.delete(e.code);
    this.onMouseMove = (e) => {
      if (document.pointerLockElement !== this.domElement) return;
      this.yaw -= e.movementX * 0.0020;
      this.pitch -= e.movementY * 0.0018;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.32, 1.32);
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.syncCamera();
  }

  requestPointerLock() {
    this.domElement.requestPointerLock?.();
  }

  reset() {
    this.position.copy(this.spawn);
    this.velocityY = 0;
    this.grounded = true;
    this.climbing = false;
    this.syncCamera();
  }

  getForwardFlat() {
    return new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).normalize();
  }

  handleJumpOrMantle() {
    const forward = this.getForwardFlat();
    const ledge = this.collision.findLedge(this.position, forward, {
      radius: this.radius,
      bodyHeight: this.bodyHeight,
      maxReach: 0.14,
      minRise: 0.035,
      maxRise: 0.23,
    });

    if (ledge) {
      this.position.copy(ledge.position);
      this.velocityY = 0;
      this.grounded = true;
      this.syncCamera();
      return;
    }

    if (this.grounded) {
      this.velocityY = this.jumpSpeed;
      this.grounded = false;
    }
  }

  tryHorizontal(delta) {
    if (Math.abs(delta.x) > 0) {
      const test = this.position.clone();
      test.x += delta.x;
      if (!this.collision.intersectsPlayer(test, this.radius, this.bodyHeight)) this.position.x = test.x;
    }
    if (Math.abs(delta.z) > 0) {
      const test = this.position.clone();
      test.z += delta.z;
      if (!this.collision.intersectsPlayer(test, this.radius, this.bodyHeight)) this.position.z = test.z;
    }
  }

  updateClimbing(dt) {
    const climbable = this.collision.findClimbable(this.position, this.radius + 0.03);
    const wantsClimb = this.keys.has('Space') || this.keys.has('KeyW');

    if (!climbable || !wantsClimb) {
      this.climbing = false;
      return false;
    }

    this.climbing = true;
    this.velocityY = 0;

    const up = this.keys.has('ShiftLeft') ? this.climbSpeed * 1.35 : this.climbSpeed;
    this.position.y += up * dt;

    if (this.position.y >= climbable.topY - 0.01) {
      this.position.y = climbable.topY + 0.002;
      if (climbable.exitX !== null) this.position.x = climbable.exitX;
      if (climbable.exitZ !== null) this.position.z = climbable.exitZ;
      this.climbing = false;
      this.grounded = true;
    }

    return true;
  }

  update(dt) {
    if (!this.enabled || document.pointerLockElement !== this.domElement) {
      this.syncCamera();
      return;
    }

    const climbingNow = this.updateClimbing(dt);

    const forward = Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'));
    const strafe = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
    const move = new THREE.Vector3(strafe, 0, -forward);
    if (move.lengthSq() > 0) {
      move.normalize();
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const speed = this.keys.has('ShiftLeft') ? this.runSpeed : this.speed;
      this.tryHorizontal(move.multiplyScalar(speed * dt));
    }

    if (!climbingNow) {
      this.velocityY -= this.gravity * dt;
      this.position.y += this.velocityY * dt;

      const ground = this.collision.groundBelow(this.position, 0.075);
      if (this.position.y <= ground) {
        this.position.y = ground;
        this.velocityY = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
      }
    }

    if (this.position.y < -0.7) this.reset();
    this.syncCamera();
  }

  syncCamera() {
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
