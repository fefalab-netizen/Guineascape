import * as THREE from 'three';

export class CollisionWorld {
  constructor() {
    this.solids = [];
    this.platforms = [];
  }

  addSolid(min, max, tag = '') {
    const solid = {
      min: new THREE.Vector3(min.x, min.y, min.z),
      max: new THREE.Vector3(max.x, max.y, max.z),
      tag,
      enabled: true,
    };
    this.solids.push(solid);
    return solid;
  }

  addBox(center, size, tag = '') {
    const half = new THREE.Vector3(size.x, size.y, size.z).multiplyScalar(0.5);
    return this.addSolid(
      new THREE.Vector3(center.x, center.y, center.z).sub(half),
      new THREE.Vector3(center.x, center.y, center.z).add(half),
      tag,
    );
  }

  addPlatform({ minX, maxX, minZ, maxZ, y, tag = '' }) {
    const platform = { minX, maxX, minZ, maxZ, y, tag, enabled: true };
    this.platforms.push(platform);
    return platform;
  }

  setEnabled(handle, enabled) {
    if (handle) handle.enabled = enabled;
  }

  intersectsPlayer(position, radius = 0.055, height = 0.14) {
    const playerMinY = position.y;
    const playerMaxY = position.y + height;
    for (const box of this.solids) {
      if (!box.enabled) continue;
      if (playerMaxY <= box.min.y || playerMinY >= box.max.y) continue;
      if (position.x + radius <= box.min.x || position.x - radius >= box.max.x) continue;
      if (position.z + radius <= box.min.z || position.z - radius >= box.max.z) continue;
      return true;
    }
    return false;
  }

  groundBelow(position, maxStep = 0.08) {
    let best = 0;
    for (const p of this.platforms) {
      if (!p.enabled) continue;
      if (position.x < p.minX || position.x > p.maxX || position.z < p.minZ || position.z > p.maxZ) continue;
      if (p.y <= position.y + maxStep && p.y > best) best = p.y;
    }
    return best;
  }
}
