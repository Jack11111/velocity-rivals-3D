// Runtime production tuning for Velocity Rivals.
// Keep the approved top speed and high-detail foreground car, but front-load
// acceleration and reduce work that does not materially improve the racing view.
const response = await fetch('./main.js?v=visuals-8', { cache: 'no-store' });
if (!response.ok) throw new Error(`Could not load main.js (${response.status})`);
let source = await response.text();

function replaceOnce(from, to, label) {
  if (!source.includes(from)) console.warn(`Velocity tuning pattern not found: ${label}`);
  source = source.replace(from, to);
}

// Keep gameplay tied to real time even if FPS drops below 30.
replaceOnce(
  'const dt = Math.min(0.033, (now - last) / 1000);',
  'const dt = Math.min(0.08, Math.max(0.001, (now - last) / 1000));',
  'frame timing'
);

// Still reaches the same 345 km/h top speed at full throttle, but acceleration
// is much stronger during the first 1-2 seconds instead of using slow smoothstep.
replaceOnce(
  'const launch = throttle * throttle * (3 - 2 * throttle);',
  'const launch = Math.pow(throttle, 0.62);',
  'player launch curve'
);
replaceOnce(
  'const aiLaunch = aiRaw * aiRaw * (3 - 2 * aiRaw);',
  'const aiLaunch = Math.pow(aiRaw, 0.72);',
  'AI launch curve'
);

// Geometry/detail reductions that are effectively invisible at racing distance.
replaceOnce('const segs = 520;', 'const segs = 380;', 'road ribbon segments');
replaceOnce('const segs = 320;', 'const segs = 220;', 'side wall segments');
replaceOnce(
  'for (let i = 0; i < 18; i++) {\n  const island = new THREE.Mesh',
  'for (let i = 0; i < 12; i++) {\n  const island = new THREE.Mesh',
  'island count'
);
replaceOnce(
  'for (let i = 0; i < 24; i++) {\n  addLight(0.03 + i * 0.039, i % 2 ? 1 : -1);\n  addBanner(0.045 + i * 0.038, i % 2 ? -1 : 1);\n}',
  'for (let i = 0; i < 16; i++) {\n  addLight(0.03 + i * 0.058, i % 2 ? 1 : -1);\n  addBanner(0.045 + i * 0.057, i % 2 ? -1 : 1);\n}',
  'roadside lights and banners'
);
replaceOnce(
  'for (let i = 0; i < 100; i++) addPalm((i + 2) / 104, i % 2 ? 1 : -1, 0.58 + Math.random() * 0.62);',
  'for (let i = 0; i < 72; i++) addPalm((i + 2) / 76, i % 2 ? 1 : -1, 0.58 + Math.random() * 0.62);',
  'palm count'
);
replaceOnce(
  'for (let i = 0; i < 60; i++) {\n  const h = 12 + Math.random() * 42;',
  'for (let i = 0; i < 40; i++) {\n  const h = 12 + Math.random() * 42;',
  'city count'
);
replaceOnce(
  'for (let i = 0; i < 28; i++) {\n  const m = new THREE.Mesh(new THREE.ConeGeometry',
  'for (let i = 0; i < 20; i++) {\n  const m = new THREE.Mesh(new THREE.ConeGeometry',
  'mountain count'
);
replaceOnce(
  'for (let i = 0; i < 24; i++) addBoat((i % 2 ? 1 : -1) * (55 + Math.random() * 220), -120 - Math.random() * 700, 0.45 + Math.random() * 0.55);',
  'for (let i = 0; i < 14; i++) addBoat((i % 2 ? 1 : -1) * (55 + Math.random() * 220), -120 - Math.random() * 700, 0.45 + Math.random() * 0.55);',
  'boat count'
);
replaceOnce('for (let i = 0; i < 56; i++) {', 'for (let i = 0; i < 40; i++) {', 'speed streak count');

// Real transmission is expensive and barely visible through the moving car.
// Dark transparent glass keeps the same visual read without the extra pass.
replaceOnce('transmission: 0.3,', 'transmission: 0.0,', 'car glass transmission');

const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
