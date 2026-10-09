import * as THREE from 'three';

export class DesktopPlayer {
  constructor({ camera, domElement, collision, spawn, lookTarget }) {
    this.camera = camera;
    this.domElement = domElement;
    this.collision = collision;
    this.spawn = spawn.clone();
    this.position = spawn.clone();
    this.velocityY = 0;
    this.moveVelocity = new THREE.Vector3();
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
    this.lastSafePosition = this.position.clone();
    this.safeTimer = 0;

    const dir = lookTarget.clone().sub(new THREE.Vector3(spawn.x, spawn.y + this.eyeHeight, spawn.z)).normalize();
    this.yaw = Math.atan2(-dir.x, -dir.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));

    this.onKeyDown = (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
        if (document.pointerLockElement === this.domElement) this.handleJumpOrMantle();
      }
      if (e.code === 'KeyR') this.recoverToLastSafe();
      if (e.code === 'KeyT') this.reset();
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
    this.lastSafePosition.copy(this.spawn);
    this.safeTimer = 0;
    this.syncCamera();
  }

  recoverToLastSafe() {
    this.position.copy(this.lastSafePosition);
    this.velocityY = 0;
    this.grounded = true;
    this.climbing = false;
    this.collision.resolvePlayer(this.position, this.radius, this.bodyHeight);
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
    const tryAxis = (axis, amount) => {
      if (Math.abs(amount) <= 0) return;
      const test = this.position.clone();
      test[axis] += amount;

      if (!this.collision.intersectsPlayer(test, this.radius, this.bodyHeight)) {
        this.position[axis] = test[axis];
        return;
      }

      // Hamsters should naturally scramble over very small lips rather than snagging.
      if (!this.grounded) return;

      const stepUp = 0.025;
      const stepped = test.clone();
      stepped.y += stepUp;
      if (!this.collision.intersectsPlayer(stepped, this.radius, this.bodyHeight)) {
        this.position.copy(stepped);
        this.velocityY = 0;
        this.grounded = true;
      }
    };

    tryAxis('x', delta.x);
    tryAxis('z', delta.z);
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
      if (climbable.exitX !== null) this.position.x = THREE.MathUtils.damp(this.position.x, climbable.exitX, 20, dt);
      if (climbable.exitZ !== null) this.position.z = THREE.MathUtils.damp(this.position.z, climbable.exitZ, 20, dt);
      this.collision.resolvePlayer(this.position, this.radius, this.bodyHeight);
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
    const desired = new THREE.Vector3(strafe, 0, -forward);

    if (desired.lengthSq() > 0) {
      desired.normalize();
      desired.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const speed = this.keys.has('ShiftLeft') ? this.runSpeed : this.speed;
      desired.multiplyScalar(speed);
    }

    const accel = desired.lengthSq() > 0 ? 15 : 22;
    const blend = 1 - Math.exp(-accel * dt);
    this.moveVelocity.lerp(desired, blend);

    if (this.moveVelocity.lengthSq() > 0.000001) {
      this.tryHorizontal(this.moveVelocity.clone().multiplyScalar(dt));
    }

    if (!climbingNow) {
      this.velocityY -= this.gravity * dt;
      const vertical = this.collision.moveVertical(
        this.position,
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

    const resolved = this.collision.resolvePlayer(this.position, this.radius, this.bodyHeight);
    if (resolved) this.velocityY = Math.min(this.velocityY, 0);

    this.safeTimer += dt;
    if (
      this.grounded &&
      !this.climbing &&
      !this.collision.intersectsPlayer(this.position, this.radius, this.bodyHeight) &&
      this.safeTimer >= 0.35
    ) {
      this.lastSafePosition.copy(this.position);
      this.safeTimer = 0;
    }

    if (this.position.y < -0.7) this.recoverToLastSafe();
    this.syncCamera();
  }

  syncCamera() {
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
