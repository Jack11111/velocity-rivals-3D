import * as THREE from 'three';

// Lightweight missile presentation layer. It decorates only the small rocket
// objects created by main.js, so the effect has negligible cost during normal
// racing and does not change missile speed, targeting, damage, or collision.

const inheritedAdd = THREE.Object3D.prototype.add;
const liveMissiles = new Set();
const launchFlashes = [];

const missileBodyMat = new THREE.MeshStandardMaterial({
  color: 0xf6f8ff,
  emissive: 0xff5a00,
  emissiveIntensity: 1.15,
  roughness: 0.24,
  metalness: 0.7
});
const darkMat = new THREE.MeshStandardMaterial({
  color: 0x202735,
  roughness: 0.34,
  metalness: 0.62
});
const flameMat = new THREE.MeshBasicMaterial({
  color: 0xff8b24,
  transparent: true,
  opacity: 0.95,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false
});
const hotCoreMat = new THREE.MeshBasicMaterial({
  color: 0xfff3a8,
  transparent: true,
  opacity: 0.92,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false
});

function near(a, b, eps = 0.015) {
  return Math.abs((a ?? 0) - b) < eps;
}

function isGameMissile(object) {
  if (!object?.isMesh || object.geometry?.type !== 'CapsuleGeometry') return false;
  const p = object.geometry.parameters || {};
  return near(p.radius, 0.18) && near(p.length, 0.62);
}

function makeTrailMaterial(opacity) {
  return new THREE.MeshBasicMaterial({
    color: 0xff6a1a,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
}

function addLaunchFlash(parent, position) {
  if (!parent) return;

  const group = new THREE.Group();
  group.position.copy(position);

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffc04d,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff7130,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });

  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), flashMat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.065, 6, 18), ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(flash, ring);

  inheritedAdd.call(parent, group);
  launchFlashes.push({ group, flashMat, ringMat, born: performance.now() / 1000 });
}

function decorateMissile(missile, parent) {
  if (missile.userData.velocityMissileFx) return;

  missile.material = missileBodyMat;

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.34, 10), missileBodyMat);
  nose.position.y = 0.46;

  const finGeo = new THREE.BoxGeometry(0.34, 0.18, 0.045);
  const finA = new THREE.Mesh(finGeo, darkMat);
  const finB = finA.clone();
  finA.position.set(0.22, -0.34, 0);
  finB.position.set(-0.22, -0.34, 0);

  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.72, 8), flameMat);
  flame.position.y = -0.74;
  flame.rotation.z = Math.PI;

  const hotCore = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.46, 8), hotCoreMat);
  hotCore.position.y = -0.63;
  hotCore.rotation.z = Math.PI;

  const trail = [];
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 + i * 0.025, 6, 5),
      makeTrailMaterial(0.46 - i * 0.075)
    );
    puff.position.y = -1.0 - i * 0.31;
    puff.scale.y = 1.55 + i * 0.22;
    trail.push(puff);
    missile.add(puff);
  }

  missile.add(nose, finA, finB, flame, hotCore);
  missile.userData.velocityMissileFx = {
    born: performance.now() / 1000,
    flame,
    hotCore,
    trail,
    baseScale: missile.scale.clone()
  };

  liveMissiles.add(missile);
  addLaunchFlash(parent, missile.position);
}

THREE.Object3D.prototype.add = function (...objects) {
  for (const object of objects) {
    if (isGameMissile(object)) decorateMissile(object, this);
  }
  return inheritedAdd.apply(this, objects);
};

function animate(nowMs) {
  const now = nowMs / 1000;

  for (const missile of [...liveMissiles]) {
    if (!missile.parent) {
      liveMissiles.delete(missile);
      continue;
    }

    const fx = missile.userData.velocityMissileFx;
    const age = now - fx.born;
    const ignition = Math.min(1, age / 0.16);
    const pulse = 0.88 + Math.sin(now * 44) * 0.16;

    // The rocket visibly snaps out of the launcher instead of simply appearing.
    const s = 0.48 + ignition * 0.52;
    missile.scale.copy(fx.baseScale).multiplyScalar(s);

    fx.flame.scale.set(0.9 + pulse * 0.18, 0.82 + pulse * 0.55, 0.9 + pulse * 0.18);
    fx.hotCore.scale.set(0.82 + pulse * 0.12, 0.9 + pulse * 0.38, 0.82 + pulse * 0.12);

    fx.trail.forEach((puff, i) => {
      const wobble = Math.sin(now * 32 + i * 1.7) * 0.035;
      puff.position.x = wobble;
      puff.scale.x = puff.scale.z = 0.85 + pulse * 0.18 + i * 0.08;
    });
  }

  for (let i = launchFlashes.length - 1; i >= 0; i--) {
    const f = launchFlashes[i];
    const age = now - f.born;
    const t = Math.min(1, age / 0.18);
    f.group.scale.setScalar(0.65 + t * 2.5);
    f.flashMat.opacity = (1 - t) * 0.9;
    f.ringMat.opacity = (1 - t) * 0.72;
    if (t >= 1) {
      f.group.parent?.remove(f.group);
      f.flashMat.dispose();
      f.ringMat.dispose();
      f.group.traverse(o => o.geometry?.dispose?.());
      launchFlashes.splice(i, 1);
    }
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
