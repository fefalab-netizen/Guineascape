import * as THREE from 'three';

export class CollisionWorld {
  constructor() {
    this.solids = [];
    this.platforms = [];
    this.climbables = [];
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

  addClimbable({
    minX, maxX, minY, maxY, minZ, maxZ,
    topY,
    exitX = null,
    exitZ = null,
    tag = '',
  }) {
    const climbable = {
      minX, maxX, minY, maxY, minZ, maxZ,
      topY,
      exitX,
      exitZ,
      tag,
      enabled: true,
    };
    this.climbables.push(climbable);
    return climbable;
  }

  setEnabled(handle, enabled) {
    if (handle) handle.enabled = enabled;
  }

  resolvePlayer(position, radius = 0.055, height = 0.14, maxIterations = 5) {
    let moved = false;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let resolvedOne = false;

      for (const box of this.solids) {
        if (!box.enabled) continue;

        const playerMinY = position.y;
        const playerMaxY = position.y + height;
        if (playerMaxY <= box.min.y || playerMinY >= box.max.y) continue;

        const overlapX =
          Math.min(position.x + radius, box.max.x) -
          Math.max(position.x - radius, box.min.x);
        const overlapZ =
          Math.min(position.z + radius, box.max.z) -
          Math.max(position.z - radius, box.min.z);

        if (overlapX <= 0 || overlapZ <= 0) continue;

        const boxCenterX = (box.min.x + box.max.x) * 0.5;
        const boxCenterZ = (box.min.z + box.max.z) * 0.5;
        const epsilon = 0.003;

        if (overlapX < overlapZ) {
          position.x += (position.x >= boxCenterX ? overlapX : -overlapX) + (position.x >= boxCenterX ? epsilon : -epsilon);
        } else {
          position.z += (position.z >= boxCenterZ ? overlapZ : -overlapZ) + (position.z >= boxCenterZ ? epsilon : -epsilon);
        }

        moved = true;
        resolvedOne = true;
        break;
      }

      if (!resolvedOne) break;
    }

    return moved;
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

  findClimbable(position, radius = 0.07) {
    for (const c of this.climbables) {
      if (!c.enabled) continue;
      if (position.y < c.minY - 0.08 || position.y > c.maxY + 0.08) continue;
      if (position.x + radius < c.minX || position.x - radius > c.maxX) continue;
      if (position.z + radius < c.minZ || position.z - radius > c.maxZ) continue;
      return c;
    }
    return null;
  }

  findLedge(position, direction, {
    radius = 0.052,
    bodyHeight = 0.14,
    maxReach = 0.16,
    minRise = 0.035,
    maxRise = 0.24,
  } = {}) {
    const dir = direction.clone();
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) return null;
    dir.normalize();

    const probeDistance = radius + maxReach;
    const probeX = position.x + dir.x * probeDistance;
    const probeZ = position.z + dir.z * probeDistance;

    let best = null;
    let bestRise = Infinity;

    for (const box of this.solids) {
      if (!box.enabled) continue;

      const rise = box.max.y - position.y;
      if (rise < minRise || rise > maxRise || rise >= bestRise) continue;

      const insideX = probeX >= box.min.x - radius * 0.35 && probeX <= box.max.x + radius * 0.35;
      const insideZ = probeZ >= box.min.z - radius * 0.35 && probeZ <= box.max.z + radius * 0.35;
      if (!insideX || !insideZ) continue;

      const candidate = position.clone();
      candidate.x = probeX;
      candidate.z = probeZ;
      candidate.y = box.max.y + 0.002;

      // At exactly the top of the source box it no longer overlaps that box.
      // This also rejects mantles where another object blocks the landing space.
      if (this.intersectsPlayer(candidate, radius, bodyHeight)) continue;

      best = { position: candidate, rise, tag: box.tag };
      bestRise = rise;
    }

    return best;
  }
}
