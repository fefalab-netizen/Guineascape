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
