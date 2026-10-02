import * as THREE from 'three';

export class DesktopPlayer {
  constructor({ camera, domElement, collision, spawn, lookTarget }) {
    this.camera = camera;
    this.domElement = domElement;
    this.collision = collision;
    this.spawn = spawn.clone();
    this.position = spawn.clone(); // feet position
    this.velocityY = 0;
    this.eyeHeight = 0.105;
    this.bodyHeight = 0.14;
    this.radius = 0.052;
    this.speed = 0.62;
    this.runSpeed = 0.95;
    this.jumpSpeed = 0.82;
    this.gravity = 2.75;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.enabled = true;
    this.grounded = true;

    const dir = lookTarget.clone().sub(new THREE.Vector3(spawn.x, spawn.y + this.eyeHeight, spawn.z)).normalize();
    this.yaw = Math.atan2(-dir.x, -dir.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));

    this.onKeyDown = (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
      if (e.code === 'KeyR') this.reset();
      if (e.code === 'Space' && this.grounded && document.pointerLockElement === this.domElement) {
        this.velocityY = this.jumpSpeed;
        this.grounded = false;
      }
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
    this.syncCamera();
  }

  tryHorizontal(delta) {
    if (Math.abs(delta.x) > 0) {
      const test = this.position.clone(); test.x += delta.x;
      if (!this.collision.intersectsPlayer(test, this.radius, this.bodyHeight)) this.position.x = test.x;
    }
    if (Math.abs(delta.z) > 0) {
      const test = this.position.clone(); test.z += delta.z;
      if (!this.collision.intersectsPlayer(test, this.radius, this.bodyHeight)) this.position.z = test.z;
    }
  }

  update(dt) {
    if (!this.enabled || document.pointerLockElement !== this.domElement) {
      this.syncCamera();
      return;
    }

    const forward = Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'));
    const strafe = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
    const move = new THREE.Vector3(strafe, 0, -forward);
    if (move.lengthSq() > 0) {
      move.normalize();
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const speed = this.keys.has('ShiftLeft') ? this.runSpeed : this.speed;
      this.tryHorizontal(move.multiplyScalar(speed * dt));
    }

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

    if (this.position.y < -1.5) this.reset();
    this.syncCamera();
  }

  syncCamera() {
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
