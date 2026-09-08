// Velocity Rivals control model v2.
// Intercept the base game module once and convert it from hold-to-accelerate
// into an auto-accelerating, lateral-steering arcade racer.
const nativeFetch = window.fetch.bind(window);
let patchedMain = false;

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) console.warn(`Velocity controls patch not found: ${label}`);
  return source.replace(from, to);
}

window.fetch = async function vrControlsFetch(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (patchedMain || !url.includes('main.js')) return nativeFetch(input, init);

  patchedMain = true;
  const response = await nativeFetch(input, init);
  if (!response.ok) return response;
  let source = await response.text();

  // New player movement state. Track curvature remains assisted; only lateral
  // positioning is player-controlled.
  source = replaceOnce(
    source,
    'let rightHeld = false;',
    `let rightHeld = false;\nlet laneVelocity = 0;\nlet playerSpeedFactor = 1;\nlet contactCooldown = 0;`,
    'lateral movement state'
  );

  // Lightweight roadway hazards. They are intentionally sparse and low-poly so
  // they add decisions without hurting the performance-first render budget.
  source = replaceOnce(
    source,
    'function showMsg(s) {',
    `const hazards = [];\nconst hazardLayout = [\n  [0.145, 0], [0.215, -3.35], [0.285, 3.35], [0.375, 0],\n  [0.455, -3.55], [0.535, 3.5], [0.625, 0], [0.705, -3.3],\n  [0.785, 3.4], [0.865, 0], [0.93, -3.45]\n];\n\nfunction addRoadHazard(t, laneValue, index) {\n  const b = basisAt(t);\n  const g = new THREE.Group();\n  const dark = new THREE.MeshStandardMaterial({ color: 0x18202a, roughness: 0.62, metalness: 0.28 });\n  const orange = new THREE.MeshStandardMaterial({ color: 0xff6b28, emissive: 0x6b1907, emissiveIntensity: 0.45, roughness: 0.42 });\n  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });\n  const glow = new THREE.MeshBasicMaterial({ color: 0xffa52d, transparent: true, opacity: 0.42, toneMapped: false, depthWrite: false });\n\n  const base = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.28, 0.78), dark);\n  base.position.y = 0.18;\n  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.62, 0.24), orange);\n  bar.position.y = 0.68;\n  g.add(base, bar);\n  for (const x of [-0.72, 0, 0.72]) {\n    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.66, 0.255), white);\n    stripe.position.set(x, 0.68, 0);\n    stripe.rotation.z = 0.28;\n    g.add(stripe);\n  }\n  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.045, 5, 28), glow);\n  ring.rotation.x = Math.PI / 2;\n  ring.position.y = 0.06;\n  g.add(ring);\n\n  g.position.copy(b.p).addScaledVector(b.right, laneValue).addScaledVector(b.normal, 0.08);\n  g.rotation.y = Math.atan2(b.tangent.x, b.tangent.z);\n  world.add(g);\n  hazards.push({ mesh: g, ring, t, lane: laneValue, hit: false, phase: index * 0.77 });\n}\n\nhazardLayout.forEach((h, i) => addRoadHazard(h[0], h[1], i));\n\nfunction showMsg(s) {`,
    'road hazards'
  );

  // Reset steering momentum, contact penalty and hazards for each race.
  source = replaceOnce(
    source,
    `  shake = 0;\n  setItem(null);`,
    `  shake = 0;\n  laneVelocity = 0;\n  playerSpeedFactor = 1;\n  contactCooldown = 0;\n  hazards.forEach(h => { h.hit = false; h.mesh.visible = true; });\n  setItem(null);`,
    'reset steering and hazards'
  );
  source = replaceOnce(
    source,
    `  showMsg('HOLD TO ACCELERATE');`,
    `  showMsg('DRAG TO STEER');`,
    'race start cue'
  );

  // Touch starts steering only. Acceleration is automatic from race start.
  source = replaceOnce(
    source,
    `  dragging = true;\n  accelerating = true;\n  braking = false;\n  dragX = e.clientX;`,
    `  dragging = true;\n  dragX = e.clientX;`,
    'pointer auto acceleration removal'
  );
  source = replaceOnce(
    source,
    `const endPointer = () => {\n  dragging = false;\n  accelerating = false;\n};`,
    `const endPointer = () => {\n  dragging = false;\n};`,
    'pointer release steering only'
  );

  // Desktop control is A/D or arrows for steering and Space for the item.
  // W/S are intentionally ignored because speed is now automatic.
  source = replaceOnce(
    source,
    `  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {\n    e.preventDefault();\n  }\n  if (e.code === 'ArrowUp' || e.code === 'KeyW') accelerating = true;\n  if (e.code === 'ArrowDown' || e.code === 'KeyS') braking = true;`,
    `  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || ['KeyA', 'KeyD'].includes(e.code)) {\n    e.preventDefault();\n  }`,
    'desktop steering controls'
  );
  source = replaceOnce(
    source,
    `  if (e.code === 'ArrowUp' || e.code === 'KeyW') accelerating = false;\n  if (e.code === 'ArrowDown' || e.code === 'KeyS') braking = false;\n  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftHeld = false;`,
    `  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftHeld = false;`,
    'desktop key release controls'
  );
  source = replaceOnce(
    source,
    `window.addEventListener('blur', () => {\n  accelerating = braking = leftHeld = rightHeld = dragging = false;\n});`,
    `window.addEventListener('blur', () => {\n  leftHeld = rightHeld = dragging = false;\n});`,
    'blur controls'
  );

  // Auto acceleration: the race starts moving immediately and builds toward the
  // same approved 345 km/h top speed without requiring a hold gesture.
  source = replaceOnce(
    source,
    `  if (accelerating) throttle = Math.min(1, throttle + dt / 5);\n  else if (braking) throttle = Math.max(0, throttle - dt * 0.48);\n  else throttle = Math.max(0, throttle - dt * 0.12);`,
    `  throttle = Math.min(1, throttle + dt / 4.2);`,
    'automatic acceleration'
  );

  // Contact penalties recover smoothly and affect both real and displayed speed
  // through speedMul; main-loader can still layer edge slowdown on top.
  source = replaceOnce(
    source,
    `  const speedMul = boost > 0 ? 1.22 : 1;\n  if (boost > 0) boost -= dt;`,
    `  playerSpeedFactor = Math.min(1, playerSpeedFactor + dt * 0.58);\n  contactCooldown = Math.max(0, contactCooldown - dt);\n  const speedMul = (boost > 0 ? 1.22 : 1) * playerSpeedFactor;\n  if (boost > 0) boost -= dt;`,
    'collision speed recovery'
  );

  // Steering has lateral momentum rather than snapping to the finger/target.
  source = replaceOnce(
    source,
    `  lane += (targetLane - lane) * Math.min(1, dt * 16);\n  placeCar(player, playerT, lane);`,
    `  const desiredLaneSpeed = THREE.MathUtils.clamp((targetLane - lane) * 5.6, -10.5, 10.5);\n  laneVelocity += (desiredLaneSpeed - laneVelocity) * Math.min(1, dt * 6.8);\n  lane += laneVelocity * dt;\n  if (lane < -5.25 || lane > 5.25) laneVelocity *= 0.42;\n  lane = THREE.MathUtils.clamp(lane, -5.28, 5.28);\n  placeCar(player, playerT, lane);\n\n  hazards.forEach(h => {\n    if (!h.mesh.visible) return;\n    const pulse = 1 + 0.08 * Math.sin(raceTime * 7 + h.phase);\n    h.ring.scale.setScalar(pulse);\n    h.ring.material.opacity = 0.3 + 0.16 * (0.5 + 0.5 * Math.sin(raceTime * 7 + h.phase));\n    if (!h.hit && contactCooldown <= 0 && Math.abs(h.t - playerT) < 0.0105 && Math.abs(h.lane - lane) < 1.45) {\n      h.hit = true;\n      playerSpeedFactor = Math.min(playerSpeedFactor, 0.54);\n      const shove = lane <= h.lane ? -1 : 1;\n      laneVelocity += shove * 5.8;\n      targetLane = THREE.MathUtils.clamp(targetLane + shove * 1.2, -5.2, 5.2);\n      contactCooldown = 0.48;\n      shake = Math.max(shake, 0.34);\n      burst(player.position, 0xff8b32, 18, 4.5);\n      showMsg('OBSTACLE HIT · SLOWED');\n      setTimeout(() => { h.mesh.visible = false; }, 90);\n    }\n  });`,
    'lateral momentum and hazard collision'
  );

  // Opponent cars now behave like physical obstacles instead of ghost traffic.
  source = replaceOnce(
    source,
    `    placeCar(a.mesh, a.t, aiLane);\n    if (a.stun > 0) a.mesh.rotation.y += a.spin;`,
    `    placeCar(a.mesh, a.t, aiLane);\n    if (a.stun > 0) a.mesh.rotation.y += a.spin;\n    if (contactCooldown <= 0 && Math.abs(a.t - playerT) < 0.0105 && Math.abs(aiLane - lane) < 1.55) {\n      const shove = lane <= aiLane ? -1 : 1;\n      playerSpeedFactor = Math.min(playerSpeedFactor, 0.70);\n      laneVelocity += shove * 4.6;\n      targetLane = THREE.MathUtils.clamp(targetLane + shove * 0.85, -5.2, 5.2);\n      a.speedScale = Math.min(a.speedScale, 0.82);\n      contactCooldown = 0.42;\n      shake = Math.max(shake, 0.18);\n      showMsg('CAR CONTACT');\n    }`,
    'car-to-car collision'
  );

  // Rockets require lateral alignment with a car ahead. If the player is not
  // lined up, the item is preserved so they can reposition and try again.
  source = replaceOnce(
    source,
    `  const target = ais.filter(a => a.t > playerT).sort((a, b) => a.t - b.t)[0];\n  if (!target) {\n    showMsg('NO TARGET');\n    return;\n  }`,
    `  const target = ais\n    .filter(a => a.t > playerT && a.t - playerT < 0.13)\n    .map(a => ({ a, visualLane: a.lane + Math.sin(a.t * 80 + a.phase) * 1.05 }))\n    .filter(x => Math.abs(x.visualLane - lane) < 2.35)\n    .sort((x, y) => x.a.t - y.a.t)[0]?.a;\n  if (!target) {\n    setItem('rocket');\n    showMsg('LINE UP TARGET');\n    return;\n  }`,
    'missile alignment targeting'
  );

  return new Response(source, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};
