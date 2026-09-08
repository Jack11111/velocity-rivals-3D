import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// The current sports-car FBX is authored with the opposite forward axis
// from the track coordinate system. Rotate the imported source once before
// main.js performs its normal per-car setup.
const originalLoad = FBXLoader.prototype.load;
FBXLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  return originalLoad.call(
    this,
    url,
    object => {
      if (!object.userData.velocityForwardAxisFixed) {
        object.rotation.y += Math.PI;
        object.userData.velocityForwardAxisFixed = true;
      }
      onLoad?.(object);
    },
    onProgress,
    onError
  );
};

// The spoiler and rear-light accents are added by main.js in wrapper-local
// coordinates. Mirror those exact rear-detail offsets so they stay at the
// back of the car after correcting the FBX forward axis.
const originalAdd = THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add = function (...objects) {
  for (const object of objects) {
    if (!object?.isMesh || !object.geometry) continue;

    if (object.geometry.type === 'BoxGeometry') {
      const p = object.geometry.parameters || {};
      const isWing = Math.abs((p.width ?? 0) - 3.1) < 0.001 && Math.abs((p.height ?? 0) - 0.11) < 0.001 && Math.abs((p.depth ?? 0) - 0.42) < 0.001;
      const isWingPost = Math.abs((p.width ?? 0) - 0.1) < 0.001 && Math.abs((p.height ?? 0) - 0.52) < 0.001 && Math.abs((p.depth ?? 0) - 0.14) < 0.001;
      if ((isWing || isWingPost) && object.position.z > 0) object.position.z *= -1;
    }

    if (object.geometry.type === 'TorusGeometry') {
      const p = object.geometry.parameters || {};
      const isRearLamp = Math.abs((p.radius ?? 0) - 0.2) < 0.001 && Math.abs((p.tube ?? 0) - 0.065) < 0.001;
      if (isRearLamp && object.position.z > 0) object.position.z *= -1;
    }
  }
  return originalAdd.apply(this, objects);
};
