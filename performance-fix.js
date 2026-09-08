import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

// Velocity Rivals performance-first rendering layer.
// Preserve the high-detail foreground car and core track presentation, while
// spending substantially less GPU/CPU time on resolution, shadows, post-FX,
// distant opponents and repeated scenery.

const isMobile = matchMedia('(max-width: 820px)').matches;
const maxPixelRatio = isMobile ? 0.98 : 1.12;
const minPixelRatio = isMobile ? 0.72 : 0.78;

// 1) Cap Retina/4K render resolution, then adapt it to measured frame time.
const originalSetPixelRatio = THREE.WebGLRenderer.prototype.setPixelRatio;
THREE.WebGLRenderer.prototype.setPixelRatio = function (ratio) {
  return originalSetPixelRatio.call(this, Math.min(ratio || 1, maxPixelRatio));
};

const perfStates = new WeakMap();
const originalRendererRender = THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  // Hundreds of scene objects made shadow-map rendering disproportionately
  // expensive. The materials/environment still provide depth and reflections.
  if (this.shadowMap) this.shadowMap.enabled = false;

  const now = performance.now();
  let state = perfStates.get(this);
  if (!state) {
    state = { last: now, avgMs: 16.7, frames: 0, coolDown: 0 };
    perfStates.set(this, state);
  } else {
    const elapsed = now - state.last;
    state.last = now;
    if (elapsed > 1 && elapsed < 180) state.avgMs = state.avgMs * 0.94 + elapsed * 0.06;
    state.frames++;

    // Adjust at most every ~90 rendered frames to avoid visible oscillation.
    if (state.frames >= 90) {
      state.frames = 0;
      const current = this.getPixelRatio();
      let next = current;
      if (state.avgMs > 23.5 && current > minPixelRatio) {
        next = Math.max(minPixelRatio, current - 0.10);
        state.coolDown = 2;
      } else if (state.avgMs < 16.2 && state.coolDown <= 0 && current < maxPixelRatio) {
        next = Math.min(maxPixelRatio, current + 0.04);
      } else if (state.coolDown > 0) {
        state.coolDown--;
      }
      if (Math.abs(next - current) > 0.01) originalSetPixelRatio.call(this, next);
    }
  }

  return originalRendererRender.call(this, scene, camera);
};

// 2) Render once per frame. Keep ACES/PBR, remove the extra bloom/composer pass.
const originalComposerRender = EffectComposer.prototype.render;
EffectComposer.prototype.render = function (deltaTime) {
  const renderPass = this.passes?.find(p => p?.scene && p?.camera);
  if (!renderPass) return originalComposerRender.call(this, deltaTime);
  this.renderer.setRenderTarget(null);
  this.renderer.render(renderPass.scene, renderPass.camera);
};

// 3) Keep the large high-detail FBX for the player's foreground car only.
// Lightweight sports-car GLBs are enough for the five smaller AI opponents.
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
    if (n > 1) return originalClone.call(aiBases[(n - 2) % aiBases.length], true);
  }
  return originalClone.call(this, recursive);
};

// 4) Batch repeated curb/lane meshes and aggressively thin decoration that is
// visually redundant at racing speed.
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
      mesh.frustumCulled = true;
      inheritedAdd.call(entry.parent, mesh);
      entry.items.length = 0;
    }
  }, 60);
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

    // Main.js palm groups: one trunk + capsule leaves. Keep about one quarter
    // and only four leaves per retained palm. At racing speed the silhouette is
    // nearly unchanged, but the draw-call savings are large.
    if (object?.isGroup && object.children?.length >= 8) {
      const capsuleChildren = object.children.filter(c => c.geometry?.type === 'CapsuleGeometry');
      const hasPalmTrunk = object.children.some(c => c.geometry?.type === 'CylinderGeometry');
      if (hasPalmTrunk && capsuleChildren.length >= 6) {
        palmGroupCount++;
        if (palmGroupCount % 4 !== 0) continue;
        capsuleChildren.slice(4).forEach(c => object.remove(c));
      }
    }

    // Clouds are decorative sprites. Keep one in three.
    if (object?.isSprite) {
      cloudCount++;
      if (cloudCount % 3 !== 1) continue;
    }

    keep.push(object);
  }
  if (keep.length) return inheritedAdd.apply(this, keep);
  return this;
};
