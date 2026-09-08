// Runtime production tuning for Velocity Rivals.
// Keep the approved top speed and high-detail foreground car, but front-load
// acceleration, extend the course, and reduce work that does not materially
// improve the racing view.
const response = await fetch('./main.js?v=visuals-9', { cache: 'no-store' });
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

// Still reaches the same 345 km/h displayed top speed at full throttle, but
// acceleration is much stronger during the first 1-2 seconds.
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

// Extend the physical course from roughly 930 world units to ~1710. This
// preserves the current coastal visual language but provides a much longer run.
replaceOnce(
`const points = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -78),
  new THREE.Vector3(-24, 2, -150),
  new THREE.Vector3(-56, 5, -220),
  new THREE.Vector3(-31, 8, -292),
  new THREE.Vector3(28, 6, -360),
  new THREE.Vector3(66, 3, -435),
  new THREE.Vector3(49, 1, -512),
  new THREE.Vector3(-14, 2, -590),
  new THREE.Vector3(-58, 4, -668),
  new THREE.Vector3(-20, 6, -750),
  new THREE.Vector3(38, 3, -835),
  new THREE.Vector3(4, 0, -930)
];`,
`const points = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -78),
  new THREE.Vector3(-24, 2, -150),
  new THREE.Vector3(-56, 5, -220),
  new THREE.Vector3(-31, 8, -292),
  new THREE.Vector3(28, 6, -360),
  new THREE.Vector3(66, 3, -435),
  new THREE.Vector3(49, 1, -512),
  new THREE.Vector3(-14, 2, -590),
  new THREE.Vector3(-58, 4, -668),
  new THREE.Vector3(-20, 6, -750),
  new THREE.Vector3(38, 3, -835),
  new THREE.Vector3(4, 0, -930),
  new THREE.Vector3(-42, 4, -1015),
  new THREE.Vector3(-72, 7, -1100),
  new THREE.Vector3(-35, 4, -1190),
  new THREE.Vector3(35, 2, -1280),
  new THREE.Vector3(76, 5, -1370),
  new THREE.Vector3(42, 8, -1460),
  new THREE.Vector3(-22, 5, -1545),
  new THREE.Vector3(-55, 2, -1625),
  new THREE.Vector3(0, 0, -1710)
];`,
  'extended track path'
);

// Normalized progress is slower because the physical course is now much longer.
// Physical ground speed/perceived 345 km/h stays close to the current build,
// while a clean run grows from about 20 seconds to roughly 35 seconds.
replaceOnce(
  'const playerPace = THREE.MathUtils.lerp(0.004, 0.055, launch) * speedMul;',
  'const playerPace = THREE.MathUtils.lerp(0.004, 0.030, launch) * speedMul;',
  'long-course player pace'
);
replaceOnce(
  'pace: 0.047 + Math.random() * 0.005,',
  'pace: 0.0255 + Math.random() * 0.003,',
  'long-course AI pace'
);

// Expand the cheap background volumes so scenery continues through the new
// second half of the course without increasing object counts.
replaceOnce('new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1500)', 'new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 3200)', 'camera far plane');
replaceOnce('new THREE.SphereGeometry(1100, 40, 24)', 'new THREE.SphereGeometry(2300, 40, 24)', 'sky radius');
replaceOnce('new THREE.PlaneGeometry(1600, 1700)', 'new THREE.PlaneGeometry(1800, 2600)', 'water extent');
replaceOnce('water.position.set(130, -4.4, -475);', 'water.position.set(130, -4.4, -800);', 'water position');
replaceOnce('-70 - i * 50 + Math.random() * 25', '-70 - i * 120 + Math.random() * 40', 'island distribution');
replaceOnce('-150 - Math.random() * 690', '-150 - Math.random() * 1450', 'city distribution');
replaceOnce('-300 - Math.random() * 620', '-300 - Math.random() * 1300', 'mountain distribution');
replaceOnce('-90 - Math.random() * 820', '-90 - Math.random() * 1500', 'cloud distribution');
replaceOnce('-120 - Math.random() * 700', '-120 - Math.random() * 1400', 'boat distribution');

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
  'for (let i = 0; i < 14; i++) addBoat((i % 2 ? 1 : -1) * (55 + Math.random() * 220), -120 - Math.random() * 1400, 0.45 + Math.random() * 0.55);',
  'boat count'
);
replaceOnce('for (let i = 0; i < 56; i++) {', 'for (let i = 0; i < 40; i++) {', 'speed streak count');

// Real transmission is expensive and barely visible through the moving car.
replaceOnce('transmission: 0.3,', 'transmission: 0.0,', 'car glass transmission');

const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
