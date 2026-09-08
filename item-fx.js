import * as THREE from 'three';

const itemBtn = document.getElementById('item');
const msgEl = document.getElementById('message');

const style = document.createElement('style');
style.textContent = `
#item{overflow:visible;isolation:isolate;transition:transform .15s ease,filter .15s ease,box-shadow .15s ease}
#item:not(:disabled):active{transform:scale(.94)}
#item[data-kind="boost"]{background:radial-gradient(circle at 45% 38%,#77f5ff 0,#1aa8ff 24%,#0d4fbd 64%,#08265f 100%);box-shadow:0 0 0 2px rgba(255,255,255,.72),0 0 26px rgba(70,220,255,.78),0 14px 34px rgba(5,32,78,.42)}
#item[data-kind="mine"]{background:radial-gradient(circle at 48% 38%,#ff845c 0,#e44535 26%,#8b1518 64%,#32080d 100%);box-shadow:0 0 0 2px rgba(255,255,255,.7),0 0 24px rgba(255,72,54,.52),0 14px 34px rgba(5,32,78,.42)}
.vr-item-icon{width:58%;height:58%;display:block;margin:auto;filter:drop-shadow(0 3px 6px rgba(0,0,0,.32))}
.vr-bolt-ring{transform-origin:50% 50%;animation:vr-ring-spin 1.15s linear infinite}
.vr-bolt-core{animation:vr-bolt-pulse .72s ease-in-out infinite alternate}
.vr-mine-ring{transform-origin:50% 50%;animation:vr-mine-pulse .82s ease-in-out infinite alternate}
.vr-mine-led{animation:vr-led .46s ease-in-out infinite alternate}
@keyframes vr-ring-spin{to{transform:rotate(360deg)}}
@keyframes vr-bolt-pulse{to{filter:drop-shadow(0 0 8px #fff);transform:scale(1.08)}}
@keyframes vr-mine-pulse{to{transform:scale(1.08);opacity:.58}}
@keyframes vr-led{to{opacity:.25}}
.vr-boost-flash{position:fixed;inset:0;pointer-events:none;z-index:2500;background:linear-gradient(90deg,rgba(0,194,255,.32),transparent 16%,transparent 84%,rgba(0,194,255,.32));mix-blend-mode:screen;animation:vr-boost-flash .5s ease-out forwards}
@keyframes vr-boost-flash{0%{opacity:0}28%{opacity:1}100%{opacity:0}}
.vr-hit-toast{position:fixed;left:50%;top:27%;transform:translate(-50%,-50%) scale(.82);pointer-events:none;z-index:2600;padding:9px 15px;border-radius:999px;background:rgba(72,7,10,.84);border:1px solid rgba(255,155,90,.82);color:#fff;font:1000 13px/1 system-ui,sans-serif;letter-spacing:.09em;text-shadow:0 2px 5px rgba(0,0,0,.5);animation:vr-hit-toast .95s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes vr-hit-toast{0%{opacity:0;transform:translate(-50%,-50%) scale(.72)}28%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}72%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-65%) scale(.96)}}
@media (prefers-reduced-motion:reduce){.vr-bolt-ring,.vr-bolt-core,.vr-mine-ring,.vr-mine-led{animation:none}}
`;
document.head.appendChild(style);

const BOOST_ICON = `
<svg class="vr-item-icon" viewBox="0 0 64 64" aria-hidden="true">
  <circle class="vr-bolt-ring" cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="3" stroke-dasharray="7 8"/>
  <circle cx="32" cy="32" r="20" fill="rgba(3,31,92,.5)" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
  <path class="vr-bolt-core" d="M37 8 18 36h12l-4 20 20-30H34z" fill="#fff7a8" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

const MINE_ICON = `
<svg class="vr-item-icon" viewBox="0 0 64 64" aria-hidden="true">
  <g class="vr-mine-ring" fill="none" stroke="rgba(255,220,180,.72)" stroke-width="3"><circle cx="32" cy="32" r="27" stroke-dasharray="4 6"/></g>
  <g fill="#261216" stroke="#ffb18a" stroke-width="2">
    <path d="M32 14c9 0 16 7 16 16v8H16v-8c0-9 7-16 16-16Z"/>
    <rect x="13" y="36" width="38" height="9" rx="4.5"/>
    <path d="M17 23 9 18M47 23l8-5M15 33H6M49 33h9" stroke-linecap="round"/>
  </g>
  <circle class="vr-mine-led" cx="32" cy="28" r="5" fill="#ff3b30" stroke="#ffd0c8" stroke-width="2"/>
</svg>`;

function syncItemIcon() {
  if (!itemBtn) return;
  const raw = itemBtn.textContent.trim();
  if (raw === '⚡') {
    itemBtn.dataset.kind = 'boost';
    itemBtn.innerHTML = BOOST_ICON;
    itemBtn.setAttribute('aria-label', 'Use lightning boost');
  } else if (raw === '💣') {
    itemBtn.dataset.kind = 'mine';
    itemBtn.innerHTML = MINE_ICON;
    itemBtn.setAttribute('aria-label', 'Drop bomb');
  } else if (raw === '?' || raw === '🚀') {
    delete itemBtn.dataset.kind;
    itemBtn.removeAttribute('aria-label');
  }
}

if (itemBtn) {
  new MutationObserver(syncItemIcon).observe(itemBtn, { childList: true, subtree: true, characterData: true });
  syncItemIcon();
}

function boostFlash() {
  const old = document.querySelector('.vr-boost-flash');
  old?.remove();
  const flash = document.createElement('div');
  flash.className = 'vr-boost-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 560);
}

if (msgEl) {
  let lastMsg = '';
  new MutationObserver(() => {
    const text = msgEl.textContent.trim();
    if (text === lastMsg) return;
    lastMsg = text;
    if (text === 'TURBO!') boostFlash();
  }).observe(msgEl, { childList: true, subtree: true, characterData: true });
}

const mineState = new Set();
const explosionState = new Set();
const previousAdd = THREE.Object3D.prototype.add;
const previousRemove = THREE.Object3D.prototype.remove;

function isMineMesh(o) {
  if (!o?.isMesh || o.geometry?.type !== 'CylinderGeometry') return false;
  const p = o.geometry.parameters || {};
  return Math.abs((p.radiusTop ?? 0) - 0.62) < 0.02 && Math.abs((p.height ?? 0) - 0.22) < 0.02;
}

function armMine(mine) {
  if (mine.userData.vrMineEnhanced) return;
  mine.userData.vrMineEnhanced = true;
  mine.userData.vrMineBorn = performance.now();
  mine.userData.vrMineTargetY = mine.position.y;

  mine.material = new THREE.MeshPhysicalMaterial({
    color: 0x281419,
    roughness: 0.28,
    metalness: 0.68,
    clearcoat: 0.75,
    emissive: 0x3d0508,
    emissiveIntensity: 0.35
  });

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4b37, transparent: true, opacity: 0.72, toneMapped: false });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff5a45, toneMapped: false });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101319, roughness: 0.42, metalness: 0.74 });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.045, 6, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.13;
  ring.userData.vrMineRing = true;
  previousAdd.call(mine, ring);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dark);
  dome.position.y = 0.14;
  previousAdd.call(mine, dome);

  const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), coreMat);
  led.position.y = 0.43;
  led.userData.vrMineLed = true;
  previousAdd.call(mine, led);

  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.36, 6), dark);
    spike.position.set(Math.cos(a) * 0.57, 0.15, Math.sin(a) * 0.57);
    spike.rotation.z = Math.PI / 2;
    spike.rotation.y = -a;
    previousAdd.call(mine, spike);
  }

  mine.position.y += 1.05;
  mine.scale.setScalar(0.55);
  mineState.add(mine);
}

function hitToast() {
  const t = document.createElement('div');
  t.className = 'vr-hit-toast';
  t.textContent = 'BOMB HIT · SLOWED';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1000);
}

function explodeMine(parent, mine) {
  const pos = mine.getWorldPosition(new THREE.Vector3());
  const g = new THREE.Group();
  g.position.copy(pos);

  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.95, toneMapped: false, depthWrite: false });
  const hotMat = new THREE.MeshBasicMaterial({ color: 0xff4d24, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false });
  const smokeMat = new THREE.MeshBasicMaterial({ color: 0x4a2324, transparent: true, opacity: 0.48, depthWrite: false });

  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), flashMat);
  flash.userData.vrFlash = true;
  previousAdd.call(g, flash);

  for (let j = 0; j < 2; j++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58 + j * 0.22, 0.08, 6, 28), j ? hotMat.clone() : flashMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    ring.userData.vrShock = j;
    previousAdd.call(g, ring);
  }

  for (let i = 0; i < 9; i++) {
    const spark = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.32), i % 2 ? flashMat.clone() : hotMat.clone());
    const dir = new THREE.Vector3((Math.random() - .5) * 2, 0.45 + Math.random() * 1.2, (Math.random() - .5) * 2).normalize();
    spark.userData.vrSparkVel = dir.multiplyScalar(5 + Math.random() * 5);
    previousAdd.call(g, spark);
  }

  for (let i = 0; i < 3; i++) {
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.28 + i * 0.08, 7, 5), smokeMat.clone());
    smoke.position.set((Math.random() - .5) * .5, .35 + Math.random() * .5, (Math.random() - .5) * .5);
    smoke.userData.vrSmoke = true;
    previousAdd.call(g, smoke);
  }

  previousAdd.call(parent, g);
  explosionState.add({ group: g, age: 0 });
  hitToast();
}

THREE.Object3D.prototype.add = function (...objects) {
  const out = previousAdd.apply(this, objects);
  for (const o of objects) if (isMineMesh(o)) armMine(o);
  return out;
};

THREE.Object3D.prototype.remove = function (...objects) {
  for (const o of objects) {
    if (o?.userData?.vrMineEnhanced) {
      const age = performance.now() - (o.userData.vrMineBorn || 0);
      mineState.delete(o);
      const menuVisible = document.getElementById('menu')?.style.display !== 'none';
      if (age > 250 && age < 13200 && !menuVisible) explodeMine(this, o);
    }
  }
  return previousRemove.apply(this, objects);
};

let last = performance.now();
function tick(now) {
  const dt = Math.min(.05, Math.max(.001, (now - last) / 1000));
  last = now;

  for (const mine of [...mineState]) {
    if (!mine.parent) { mineState.delete(mine); continue; }
    const age = (now - mine.userData.vrMineBorn) / 1000;
    const targetY = mine.userData.vrMineTargetY;
    if (age < .34) {
      const p = Math.min(1, age / .34);
      const bounce = Math.sin(p * Math.PI) * .2;
      mine.position.y = THREE.MathUtils.lerp(targetY + 1.05, targetY, p) + bounce;
      const s = THREE.MathUtils.lerp(.55, 1, Math.min(1, p * 1.35));
      mine.scale.setScalar(s);
      mine.rotation.y += dt * 6.5;
    } else {
      mine.position.y = targetY;
      mine.scale.setScalar(1);
      mine.rotation.y += dt * .75;
    }
    const pulse = 1 + .16 * (.5 + .5 * Math.sin(age * 9));
    mine.traverse(c => {
      if (c.userData?.vrMineRing) {
        c.scale.setScalar(pulse);
        c.material.opacity = .42 + .34 * (.5 + .5 * Math.sin(age * 9));
      }
      if (c.userData?.vrMineLed) c.scale.setScalar(.72 + .5 * (.5 + .5 * Math.sin(age * 14)));
    });
  }

  for (const fx of [...explosionState]) {
    fx.age += dt;
    const p = Math.min(1, fx.age / .72);
    fx.group.children.forEach(c => {
      if (c.userData?.vrFlash) {
        c.scale.setScalar(1 + p * 5.2);
        c.material.opacity = Math.max(0, 1 - p * 1.35);
      } else if (c.userData?.vrShock !== undefined) {
        const delay = c.userData.vrShock * .12;
        const q = THREE.MathUtils.clamp((fx.age - delay) / .48, 0, 1);
        c.scale.setScalar(1 + q * 5.4);
        c.material.opacity = Math.max(0, .82 * (1 - q));
      } else if (c.userData?.vrSparkVel) {
        c.position.addScaledVector(c.userData.vrSparkVel, dt);
        c.userData.vrSparkVel.y -= 8.5 * dt;
        c.material.opacity = Math.max(0, 1 - p);
      } else if (c.userData?.vrSmoke) {
        c.position.y += dt * 1.35;
        c.scale.multiplyScalar(1 + dt * 1.7);
        c.material.opacity = Math.max(0, .5 * (1 - p));
      }
    });
    if (fx.age >= .78) {
      fx.group.parent?.remove(fx.group);
      explosionState.delete(fx);
    }
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
