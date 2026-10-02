import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb';

export class HumanPresence {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'Unseen Human Presence';
    this.root.visible = false;
    this.root.position.set(4.25, 0, -4.0);
    scene.add(this.root);

    this.mixer = null;
    this.model = null;
    this.loaded = false;

    this.fallback = this.makeFallback();
    this.root.add(this.fallback);

    this.load();
  }

  makeFallback() {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x030303 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.92, 0.34), mat);
    torso.position.y = 1.15;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), mat);
    head.position.y = 1.82;
    g.add(head);

    for (const x of [-0.18, 0.18]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.95, 0.23), mat);
      leg.position.set(x, 0.48, 0);
      g.add(leg);
    }

    return g;
  }

  load() {
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        this.model = gltf.scene;
        this.model.name = 'CesiumMan shadow human';
        this.model.scale.setScalar(1.75);
        this.model.rotation.y = Math.PI;
        this.model.position.set(0, 0, 0);

        const shadowMat = new THREE.MeshStandardMaterial({
          color: 0x080909,
          roughness: 1,
          metalness: 0,
        });

        this.model.traverse((child) => {
          if (!child.isMesh) return;
          child.material = shadowMat;
          child.castShadow = true;
          child.receiveShadow = false;
        });

        if (gltf.animations?.length) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
          action.timeScale = 0.55;
        }

        this.root.remove(this.fallback);
        this.root.add(this.model);
        this.loaded = true;
      },
      undefined,
      () => {
        // Keep the primitive fallback if the external model cannot load.
      },
    );
  }

  setVisible(visible) {
    this.root.visible = visible;
  }

  setPose({ x, z, rotationY = 0 }) {
    this.root.position.x = x;
    this.root.position.z = z;
    this.root.rotation.y = rotationY;
  }

  update(dt) {
    this.mixer?.update(dt);
  }
}
