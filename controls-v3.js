// Velocity Rivals control model v3.
// Layered after controls-v2: keep auto acceleration and lateral gameplay, but
// remove automatic curve-following. The player now has to steer through bends.
const inheritedFetch = window.fetch.bind(window);
let patchedMain = false;

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) console.warn(`Velocity manual steering patch not found: ${label}`);
  return source.replace(from, to);
}

window.fetch = async function vrManualSteeringFetch(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (patchedMain || !url.includes('main.js')) return inheritedFetch(input, init);

  patchedMain = true;
  const response = await inheritedFetch(input, init);
  if (!response.ok) return response;
  let source = await response.text();

  source = replaceOnce(
    source,
    'let contactCooldown = 0;',
    `let contactCooldown = 0;\nlet manualSteer = 0;\nlet playerYaw = 0;\nlet playerYawReady = false;`,
    'manual heading state'
  );

  source = replaceOnce(
    source,
    `  laneVelocity = 0;\n  playerSpeedFactor = 1;\n  contactCooldown = 0;`,
    `  laneVelocity = 0;\n  playerSpeedFactor = 1;\n  contactCooldown = 0;\n  manualSteer = 0;\n  playerYawReady = false;`,
    'manual heading reset'
  );

  source = replaceOnce(
    source,
    `  showMsg('DRAG TO STEER');`,
    `  showMsg('STEER THROUGH TURNS');`,
    'manual steering tutorial cue'
  );

  // Touch drag becomes a steering-angle command rather than a requested lane.
  source = replaceOnce(
    source,
    `renderer.domElement.addEventListener('pointermove', e => {\n  if (!dragging) return;\n  targetLane = THREE.MathUtils.clamp(\n    dragLane + (e.clientX - dragX) / Math.max(innerWidth, 300) * 16,\n    -5.2,\n    5.2\n  );\n});`,
    `renderer.domElement.addEventListener('pointermove', e => {\n  if (!dragging) return;\n  const steeringRange = Math.max(64, Math.min(innerWidth * 0.22, 180));\n  manualSteer = THREE.MathUtils.clamp((e.clientX - dragX) / steeringRange, -1, 1);\n});`,
    'touch steering input'
  );

  source = replaceOnce(
    source,
    `const endPointer = () => {\n  dragging = false;\n};`,
    `const endPointer = () => {\n  dragging = false;\n  manualSteer = 0;\n};`,
    'touch steering release'
  );

  source = replaceOnce(
    source,
    `window.addEventListener('blur', () => {\n  leftHeld = rightHeld = dragging = false;\n});`,
    `window.addEventListener('blur', () => {\n  leftHeld = rightHeld = dragging = false;\n  manualSteer = 0;\n});`,
    'manual steering blur reset'
  );

  // Maintain an independent world heading. Road curvature no longer rotates the
  // player for free. If the road bends and the player does not steer, the car
  // continues on its heading and drifts toward the outside edge.
  source = replaceOnce(
    source,
    `  const playerPace = THREE.MathUtils.lerp(0.004, 0.055, launch) * speedMul;`,
    `  const manualBasis = basisAt(playerT);\n  const roadYaw = Math.atan2(manualBasis.tangent.x, manualBasis.tangent.z);\n  if (!playerYawReady) {\n    playerYaw = roadYaw;\n    playerYawReady = true;\n  }\n  const steering = THREE.MathUtils.clamp((rightHeld ? 1 : 0) - (leftHeld ? 1 : 0) + manualSteer, -1, 1);\n  const turnRate = THREE.MathUtils.lerp(0.70, 1.18, launch);\n  playerYaw -= steering * turnRate * dt;\n  if (playerYaw > Math.PI) playerYaw -= Math.PI * 2;\n  if (playerYaw < -Math.PI) playerYaw += Math.PI * 2;\n  const headingDir = new THREE.Vector3(Math.sin(playerYaw), 0, Math.cos(playerYaw)).normalize();\n  const headingForward = THREE.MathUtils.clamp(headingDir.dot(manualBasis.tangent), 0.12, 1);\n  const headingLateral = THREE.MathUtils.clamp(headingDir.dot(manualBasis.right), -1, 1);\n\n  const playerPace = THREE.MathUtils.lerp(0.004, 0.055, launch) * speedMul;`,
    'manual world heading'
  );

  source = replaceOnce(
    source,
    `  playerT = Math.min(1, playerT + dt * playerPace);`,
    `  playerT = Math.min(1, playerT + dt * playerPace * headingForward);`,
    'forward progress from heading'
  );

  // Replace lane-centering steering with heading-derived lateral motion. The
  // guard rail only prevents leaving the simulation entirely; it does not steer.
  source = replaceOnce(
    source,
    `  const desiredLaneSpeed = THREE.MathUtils.clamp((targetLane - lane) * 5.6, -10.5, 10.5);\n  laneVelocity += (desiredLaneSpeed - laneVelocity) * Math.min(1, dt * 6.8);\n  lane += laneVelocity * dt;\n  if (lane < -5.25 || lane > 5.25) laneVelocity *= 0.42;\n  lane = THREE.MathUtils.clamp(lane, -5.28, 5.28);\n  placeCar(player, playerT, lane);`,
    `  const lateralTarget = headingLateral * THREE.MathUtils.lerp(6.5, 21.5, launch);\n  laneVelocity += (lateralTarget - laneVelocity) * Math.min(1, dt * 5.4);\n  lane += laneVelocity * dt;\n  if (lane < -6.25 || lane > 6.25) laneVelocity *= 0.24;\n  lane = THREE.MathUtils.clamp(lane, -6.35, 6.35);\n  placeCar(player, playerT, lane);\n  player.rotation.y = playerYaw;`,
    'manual curve steering physics'
  );

  source = replaceOnce(
    source,
    `  const turnAmount = THREE.MathUtils.clamp((targetLane - lane) * 2.1, -1, 1);`,
    `  const turnAmount = steering;`,
    'visual steering bank'
  );

  // Collision shoves now alter actual heading rather than an unused lane target.
  source = replaceOnce(
    source,
    `      targetLane = THREE.MathUtils.clamp(targetLane + shove * 1.2, -5.2, 5.2);`,
    `      playerYaw -= shove * 0.10;`,
    'hazard heading shove'
  );
  source = replaceOnce(
    source,
    `      targetLane = THREE.MathUtils.clamp(targetLane + shove * 0.85, -5.2, 5.2);`,
    `      playerYaw -= shove * 0.075;`,
    'car contact heading shove'
  );

  // Chase camera follows the player's heading instead of the road tangent, so
  // turning is visually and mechanically fully player-controlled.
  source = replaceOnce(
    source,
    `  const behind = b.p.clone()\n    .addScaledVector(b.tangent, -cameraDistance)\n    .addScaledVector(b.normal, cameraHeight)\n    .addScaledVector(b.right, lane * 0.06);`,
    `  const cameraHeading = new THREE.Vector3(Math.sin(playerYaw), 0, Math.cos(playerYaw)).normalize();\n  const behind = player.position.clone()\n    .addScaledVector(cameraHeading, -cameraDistance)\n    .addScaledVector(b.normal, cameraHeight);`,
    'manual heading chase camera'
  );

  source = replaceOnce(
    source,
    `  camera.lookAt(\n    b.p.clone()\n      .addScaledVector(b.tangent, THREE.MathUtils.lerp(33, 45, launch))\n      .addScaledVector(b.normal, 0.9)\n  );`,
    `  camera.lookAt(\n    player.position.clone()\n      .addScaledVector(cameraHeading, THREE.MathUtils.lerp(33, 45, launch))\n      .addScaledVector(b.normal, 0.9)\n  );`,
    'manual heading camera target'
  );

  return new Response(source, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};