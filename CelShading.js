import * as THREE from 'three';

function makeGradientMap() {
  const data = new Uint8Array([
    55, 55, 55, 255,
    150, 150, 150, 255,
    255, 255, 255, 255,
  ]);
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

const gradientMap = makeGradientMap();

function convertMaterial(material, cache) {
  if (!material) return material;
  if (Array.isArray(material)) return material.map((m) => convertMaterial(m, cache));
  if (cache.has(material.uuid)) return cache.get(material.uuid);

  // Preserve deliberately transparent/physical effects such as terrarium glass,
  // water, flashlight beams and window glass.
  if (
    material.isMeshPhysicalMaterial ||
    material.transparent ||
    material.opacity < 0.999 ||
    material.blending !== THREE.NormalBlending
  ) {
    cache.set(material.uuid, material);
    return material;
  }

  if (!material.isMeshStandardMaterial && !material.isMeshLambertMaterial && !material.isMeshPhongMaterial) {
    cache.set(material.uuid, material);
    return material;
  }

  const toon = new THREE.MeshToonMaterial({
    color: material.color?.clone?.() ?? new THREE.Color(0x888888),
    map: material.map ?? null,
    gradientMap,
    side: material.side,
    alphaTest: material.alphaTest ?? 0,
  });

  if (material.emissive) {
    toon.emissive.copy(material.emissive);
    toon.emissiveIntensity = material.emissiveIntensity ?? 1;
  }

  toon.name = material.name ? `${material.name} · toon` : 'toon material';
  cache.set(material.uuid, toon);
  return toon;
}

export function applyCelShading(root) {
  const cache = new Map();

  root.traverse((object) => {
    if (!object.isMesh) return;
    object.material = convertMaterial(object.material, cache);
  });
}

export function makeToonMaterial(color, { emissive = 0x000000 } = {}) {
  return new THREE.MeshToonMaterial({
    color,
    emissive,
    gradientMap,
  });
}


export function addCelOutlines(root) {
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0x171a18,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
  });

  const targets = [];
  root.traverse((object) => {
    if (!object.isMesh || !object.geometry || !object.visible) return;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((m) => m?.transparent || m?.isMeshPhysicalMaterial)) return;

    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    object.geometry.boundingBox.getSize(size);

    // Outline meaningful forms, not tiny cage rails, grass, cords or decorative details.
    const longest = Math.max(size.x, size.y, size.z);
    const shortest = Math.min(size.x, size.y, size.z);
    if (longest < 0.22 || shortest < 0.018) return;

    targets.push(object);
  });

  for (const mesh of targets) {
    const edges = new THREE.EdgesGeometry(mesh.geometry, 34);
    const lines = new THREE.LineSegments(edges, outlineMaterial);
    lines.name = 'cel outline';
    lines.renderOrder = 2;
    lines.raycast = () => {};
    mesh.add(lines);
  }
}
