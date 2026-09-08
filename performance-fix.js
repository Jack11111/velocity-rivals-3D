import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

// Velocity Rivals performance layer.
// Runs before main.js so the existing gameplay can stay unchanged while the
// expensive rendering/asset paths are replaced with cheaper equivalents.

// 1) Cap render resolution. 1.8x DPR was extremely expensive on Retina/4K.
const originalSetPixelRatio = THREE.WebGLRenderer.prototype.setPixelRatio;
THREE.WebGLRenderer.prototype.setPixelRatio = function (ratio) {
  const cap = matchMedia('(max-width: 820px)').matches ? 1.05 : 1.25;
  return originalSetPixelRatio.call(this, Math.min(ratio || 1, cap));
};

// 2) Disable real-time shadow maps. The scene has hundreds of objects and the
// shadow pass was rendering them again every frame. Reflections/materials stay.
const originalRendererRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  if (this.shadowMap) this.shadowMap.enabled = false;
  return originalRendererRender.call(this, scene, camera);
};

// 3) Render the scene once per frame instead of the former render+bloom passes.
// This preserves ACES tone mapping/PBR but removes the largest post-FX cost.
const originalComposerRender = EffectComposer.prototype.render;
EffectComposer.prototype.render = function (deltaTime) {
  const renderPass = this.passes?.find(p => p?.scene && p?.camera);
  if (!renderPass) return originalComposerRender.call(this, deltaTime);
  this.renderer.setRenderTarget(null);
  this.renderer.render(renderPass.scene, renderPass.camera);
};

// 4) Use the high-detail 14 MB FBX only for the player's large foreground car.
// Opponents are small on screen, so lightweight sports cars are visually close
// at race distance but massively cheaper to render.
const AI_URLS = [
  'https://raw.githubusercontent.com/Arslan12216775/kenney_car-kit/master/Models/GLB%20format/sedan-sports.glb',
  'https://raw.githubusercontent.com/Arslan12216775/kenney_car-kit/master/Models/GLB%20format/hatchback-sports.glb',
  'https://raw.githubusercontent.com/Arslan12216775/kenney_car-kit/master/Models/GLB%20format/race.glb'
];
const gltfLoader = new GLTFLoader();
const loadGLB = url => new Promise((resolve, reject) => gltfLoader.load(url, g => resolve(g.scene), undefined, reject));
let aiBases = [];
try {
  aiBases = await Promise.all(AI_URLS.map(loadGLB));
} catch (err) {
  console.warn('Performance AI cars could not preload; keeping original cars.', err);
}

const inheritedFbxLoad = FBXLoader.prototype.load;
FBXLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  return inheritedFbxLoad.call(this, url, object => {
    object.userData.velocityHeavyCarSource = true;
    object.userData.velocityCloneCount = 0;
    onLoad?.(object);
  }, onProgress, onError);
};

const originalClone = THREE.Object3D.prototype.clone;
THREE.Object3D.prototype.clone = function (recursive = true) {
  if (this.userData?.velocityHeavyCarSource && aiBases.length) {
    const n = (this.userData.velocityCloneCount || 0) + 1;
    this.userData.velocityCloneCount = n;
    // clone #1 is player; #2-#6 are AI opponents.
    if (n > 1) return originalClone.call(aiBases[(n - 2) % aiBases.length], true);
  }
  return originalClone.call(this, recursive);
};

// 5) Batch the hundreds of curb blocks and lane dashes into InstancedMesh draw
// calls. Also prune distant palm/cloud decoration that is visually redundant.
const inheritedAdd = THREE.Object3D.prototype.add;
const batches = new Map();
let batchTimer = null;
let palmGroupCount = 0;
let cloudCount = 0;

function almost(a, b, eps = 0.003) { return Math.abs((a ?? 0) - b) < eps; }
function batchKey(object) {
  if (!object?.isMesh || object.isInstancedMesh || object.geometry?.type !== 'BoxGeometry') return null;
  const p = object.geometry.parameters || {};
  const curb = almost(p.width, 2.1) && almost(p.height, 0.16) && almost(p.depth, 1.35);
  const dash = almost(p.width, 0.16) && almost(p.height, 0.026) && almost(p.depth, 3.0);
  if (!curb && !dash) return null;
  const mat = Array.isArray(object.material) ? object.material[0] : object.material;
  const color = mat?.color?.getHexString?.() || 'none';
  return `${curb ? 'curb' : 'dash'}:${color}`;
}

function scheduleBatchFlush() {
  clearTimeout(batchTimer);
  batchTimer = setTimeout(() => {
    for (const entry of batches.values()) {
      if (!entry.items.length) continue;
      const mesh = new THREE.InstancedMesh(entry.geometry, entry.material, entry.items.length);
      entry.items.forEach((item, i) => mesh.setMatrixAt(i, item.matrix));
      mesh.instanceMatrix.needsUpdate = true;
      inheritedAdd.call(entry.parent, mesh);
      entry.items.length = 0;
    }
  }, 80);
}

THREE.Object3D.prototype.add = function (...objects) {
  const keep = [];
  for (const object of objects) {
    const key = batchKey(object);
    if (key) {
      object.updateMatrix();
      if (!batches.has(key)) batches.set(key, {
        parent: this,
        geometry: object.geometry,
        material: object.material,
        items: []
      });
      batches.get(key).items.push({ matrix: object.matrix.clone() });
      scheduleBatchFlush();
      continue;
    }

    // Palm groups in main.js contain one trunk plus nine capsule leaves.
    if (object?.isGroup && object.children?.length >= 8) {
      const capsuleChildren = object.children.filter(c => c.geometry?.type === 'CapsuleGeometry');
      const hasPalmTrunk = object.children.some(c => c.geometry?.type === 'CylinderGeometry');
      if (hasPalmTrunk && capsuleChildren.length >= 6) {
        palmGroupCount++;
        if (palmGroupCount % 3 !== 0) continue; // keep about one third
        // Four leaves are enough at racing distance.
        capsuleChildren.slice(4).forEach(c => object.remove(c));
      }
    }

    if (object?.isSprite) {
      cloudCount++;
      if (cloudCount % 2 === 0) continue;
    }
    keep.push(object);
  }
  if (keep.length) return inheritedAdd.apply(this, keep);
  return this;
};
