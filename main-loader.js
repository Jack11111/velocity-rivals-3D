// Runtime production tuning for Velocity Rivals.
// Keep the approved top speed and high-detail foreground car, but front-load
// acceleration, extend the course, add racing feedback, and reduce work that
// does not materially improve the racing view.
const response = await fetch('./main.js?v=visuals-10', { cache: 'no-store' });
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

// Extend the physical course from roughly 930 world units to ~1710.
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

// Edge contact has a real gameplay cost. The car starts losing speed only near
// the outside of the usable steering range and can lose up to ~45% at full rub.
replaceOnce(
  'const playerPace = THREE.MathUtils.lerp(0.004, 0.055, launch) * speedMul;',
  `const edgeContact = THREE.MathUtils.smoothstep(Math.abs(lane), 4.55, 5.15);
  const edgeSpeedFactor = THREE.MathUtils.lerp(1, 0.55, edgeContact);
  const playerPace = THREE.MathUtils.lerp(0.004, 0.030, launch) * speedMul * edgeSpeedFactor;
  if (edgeContact > 0.08) shake = Math.max(shake, 0.045 * edgeContact);`,
  'long-course player pace and edge slowdown'
);
replaceOnce(
  'pace: 0.047 + Math.random() * 0.005,',
  'pace: 0.0255 + Math.random() * 0.003,',
  'long-course AI pace'
);
replaceOnce(
  'const visualSpeed = THREE.MathUtils.lerp(0, 345, launch) * speedMul;',
  'const visualSpeed = THREE.MathUtils.lerp(0, 345, launch) * speedMul * THREE.MathUtils.lerp(1, 0.62, edgeContact);',
  'edge speedometer feedback'
);

// Make the finish unmistakable: full-width checkered road strip plus a large
// FINISH gantry. Canvas textures keep this to only a handful of draw calls.
replaceOnce(
  '[0.12, 0.34, 0.62, 0.89].forEach((t, i) => addPortal(t, i === 2 ? 0xff3f57 : 0x29d6ff));',
  `[0.12, 0.34, 0.62, 0.89].forEach((t, i) => addPortal(t, i === 2 ? 0xff3f57 : 0x29d6ff));

function makeFinishCanvas(width, height, label = false) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const x = c.getContext('2d');
  if (label) {
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, width, height);
    const cell = Math.max(14, Math.floor(height / 4));
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < Math.ceil(width / cell); col++) {
        if ((row + col) % 2 === 0) x.fillStyle = '#101419';
        else x.fillStyle = '#ffffff';
        x.fillRect(col * cell, row * cell, cell, cell);
        x.fillRect(col * cell, height - (row + 1) * cell, cell, cell);
      }
    }
    x.fillStyle = '#0b2447';
    x.font = '900 86px Arial, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('FINISH', width / 2, height / 2);
  } else {
    const cols = 12, rows = 4;
    const cw = width / cols, ch = height / rows;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        x.fillStyle = (r + col) % 2 ? '#ffffff' : '#101419';
        x.fillRect(col * cw, r * ch, cw + 1, ch + 1);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

function addFinishGate() {
  const b = basisAt(0.985);
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(16.5, 5.6),
    new THREE.MeshBasicMaterial({ map: makeFinishCanvas(768, 256), side: THREE.DoubleSide })
  );
  line.position.copy(b.p).addScaledVector(b.normal, 0.095);
  const lineBasis = new THREE.Matrix4().makeBasis(b.right, b.tangent, b.normal);
  line.quaternion.setFromRotationMatrix(lineBasis);
  world.add(line);

  const gate = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x0a68d2, roughness: 0.32, metalness: 0.28 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x54dfff, toneMapped: false });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.75, 8.4, 0.75), postMat);
  const right = left.clone();
  left.position.set(-9.0, 4.2, 0);
  right.position.set(9.0, 4.2, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(18.75, 0.72, 0.8), postMat);
  top.position.set(0, 8.25, 0);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(17.4, 0.09, 0.88), glowMat);
  glow.position.set(0, 7.86, 0.02);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(12.8, 2.45),
    new THREE.MeshBasicMaterial({ map: makeFinishCanvas(1024, 256, true), side: THREE.DoubleSide })
  );
  banner.position.set(0, 6.65, 0.48);
  gate.add(left, right, top, glow, banner);
  gate.position.copy(b.p);
  gate.rotation.y = Math.atan2(b.tangent.x, b.tangent.z);
  world.add(gate);
}
addFinishGate();`,
  'finish line and gantry'
);

// DOM-based podium celebration keeps animating after the race loop stops and is
// much cheaper than adding a large particle simulation to WebGL.
replaceOnce(
  'function showMsg(s) {',
  `function finishCelebration(place) {
  if (place > 3) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = place === 1
    ? ['#ffd43b', '#ffffff', '#55d6ff', '#ff6b6b']
    : place === 2
      ? ['#e8eef5', '#ffffff', '#55d6ff', '#8aa5c1']
      : ['#d8894c', '#ffd2a8', '#ffffff', '#55d6ff'];
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3000;overflow:hidden;';
  const label = document.createElement('div');
  label.textContent = place === 1 ? '1ST PLACE!' : place === 2 ? '2ND PLACE!' : '3RD PLACE!';
  label.style.cssText = 'position:absolute;left:50%;top:34%;transform:translate(-50%,-50%) scale(.72);font:1000 clamp(36px,8vw,88px) Arial,sans-serif;color:white;text-shadow:0 5px 20px rgba(0,0,0,.45);white-space:nowrap;';
  overlay.appendChild(label);
  document.body.appendChild(overlay);
  if (!reduced) {
    label.animate([
      { transform:'translate(-50%,-50%) scale(.72)', opacity:0 },
      { transform:'translate(-50%,-50%) scale(1.12)', opacity:1, offset:.35 },
      { transform:'translate(-50%,-50%) scale(1)', opacity:1, offset:.72 },
      { transform:'translate(-50%,-50%) scale(.96)', opacity:0 }
    ], { duration:1500, easing:'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
    for (let i = 0; i < 42; i++) {
      const bit = document.createElement('i');
      const w = 5 + Math.random() * 7;
      bit.style.cssText = 'position:absolute;top:-18px;width:' + w + 'px;height:' + (w * 1.7) + 'px;background:' + colors[i % colors.length] + ';left:' + (4 + Math.random() * 92) + '%;border-radius:2px;';
      overlay.appendChild(bit);
      const drift = (Math.random() - .5) * 260;
      bit.animate([
        { transform:'translate3d(0,-20px,0) rotate(0deg)', opacity:1 },
        { transform:'translate3d(' + drift + 'px,105vh,0) rotate(' + (360 + Math.random() * 720) + 'deg)', opacity:.9 }
      ], { duration:1150 + Math.random() * 850, delay:Math.random() * 160, easing:'cubic-bezier(.18,.65,.35,1)', fill:'forwards' });
    }
  }
  setTimeout(() => overlay.remove(), reduced ? 850 : 2100);
}

function showMsg(s) {`,
  'podium finish celebration helper'
);

replaceOnce(
  `    const final = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;
    document.querySelector('.title').innerHTML = final === 1 ? 'VICTORY!' : \`FINISHED \${final}/6\`;`,
  `    const final = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;
    if (final <= 3) finishCelebration(final);
    document.querySelector('.title').innerHTML = final === 1 ? 'VICTORY!' : \`FINISHED \${final}/6\`;`,
  'trigger podium celebration'
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
