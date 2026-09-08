import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const $ = id => document.getElementById(id);
const game = $('game');
const rankEl = $('rank');
const progressEl = $('progress');
const speedEl = document.querySelector('#speed b');
const itemBtn = $('item');
const msgEl = $('message');
const menu = $('menu');
const playBtn = $('play');
const loadingEl = $('loading');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa8d6ee, 0.0026);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.domElement.style.touchAction = 'none';
game.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.2, 0.35, 0.9);
composer.addPass(bloom);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(1100, 40, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x2d91ee) },
      horizonColor: { value: new THREE.Color(0xbfe9ff) },
      sunColor: { value: new THREE.Color(0xfff1cb) }
    },
    vertexShader: `
      varying vec3 vPos;
      void main(){
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 sunColor;
      varying vec3 vPos;
      void main(){
        vec3 n = normalize(vPos);
        float h = clamp(n.y * .8 + .22, 0.0, 1.0);
        vec3 c = mix(horizonColor, topColor, pow(h,.72));
        float glow = pow(max(dot(n, normalize(vec3(-.35,.72,.58))),0.0), 80.0);
        c += sunColor * glow * .28;
        gl_FragColor = vec4(c,1.0);
      }`
  })
);
scene.add(sky);

scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x466b50, 1.55));
const sun = new THREE.DirectionalLight(0xfff1d2, 3.5);
sun.position.set(-75, 105, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.bias = -0.00012;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x66baff, 0.7);
fill.position.set(55, 35, -65);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.45);
rim.position.set(-30, 18, -35);
scene.add(rim);

const world = new THREE.Group();
scene.add(world);

const points = [
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
];
const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.32);

function basisAt(t) {
  t = THREE.MathUtils.clamp(t, 0, 1);
  const p = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
  const normal = new THREE.Vector3().crossVectors(right, tangent).normalize();
  return { p, tangent, right, normal };
}

function orient(obj, b) {
  obj.lookAt(obj.position.clone().add(b.tangent));
}

function makeAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#292f38';
  x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const v = 35 + Math.random() * 28;
    x.fillStyle = `rgba(${v},${v + 2},${v + 5},${0.06 + Math.random() * 0.09})`;
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const w = 0.5 + Math.random() * 2.2;
    const h = 0.5 + Math.random() * 1.4;
    x.fillRect(px, py, w, h);
  }
  x.strokeStyle = 'rgba(255,255,255,.025)';
  x.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    x.beginPath();
    x.moveTo(Math.random() * 512, 0);
    x.lineTo(Math.random() * 512, 512);
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

function buildRibbon(width, material, y = 0.02, uvScale = 1) {
  const segs = 520;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const b = basisAt(i / segs);
    const center = b.p.clone().addScaledVector(b.normal, y);
    const l = center.clone().addScaledVector(b.right, -width / 2);
    const r = center.clone().addScaledVector(b.right, width / 2);
    pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
    uv.push(0, (i / segs) * uvScale, 1, (i / segs) * uvScale);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.receiveShadow = true;
  world.add(m);
  return m;
}

const asphalt = makeAsphaltTexture();
const roadMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  map: asphalt,
  roughness: 0.72,
  metalness: 0.02,
  clearcoat: 0.06,
  clearcoatRoughness: 0.9
});
const shoulderMat = new THREE.MeshStandardMaterial({ color: 0xe7edf2, roughness: 0.74, metalness: 0.02 });
buildRibbon(20.6, shoulderMat, 0.006, 1);
buildRibbon(16.6, roadMat, 0.035, 95);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(1600, 1700),
  new THREE.MeshPhysicalMaterial({
    color: 0x058ed4,
    roughness: 0.18,
    metalness: 0.04,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18
  })
);
water.rotation.x = -Math.PI / 2;
water.position.set(130, -4.4, -475);
world.add(water);

const islandMat = new THREE.MeshStandardMaterial({ color: 0x3c9750, roughness: 0.95 });
for (let i = 0; i < 18; i++) {
  const island = new THREE.Mesh(new THREE.CylinderGeometry(24 + Math.random() * 34, 30 + Math.random() * 36, 3.5, 20), islandMat);
  island.position.set((i % 2 ? 1 : -1) * (75 + Math.random() * 180), -2.6, -70 - i * 50 + Math.random() * 25);
  island.scale.z = 1.3 + Math.random() * 1.8;
  island.receiveShadow = true;
  world.add(island);
}

const curbRed = new THREE.MeshPhysicalMaterial({ color: 0xf13b4d, roughness: 0.32, clearcoat: 0.45 });
const curbWhite = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.34, clearcoat: 0.38 });
const curbGeo = new THREE.BoxGeometry(2.1, 0.16, 1.35);
for (let i = 0; i < 225; i++) {
  const b = basisAt(i / 224);
  for (const side of [-1, 1]) {
    const c = new THREE.Mesh(curbGeo, i % 2 ? curbRed : curbWhite);
    c.position.copy(b.p).addScaledVector(b.right, side * 8.55).addScaledVector(b.normal, 0.11);
    orient(c, b);
    c.castShadow = c.receiveShadow = true;
    world.add(c);
  }
}

function buildSideWall(side) {
  const segs = 320;
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const b = basisAt(i / segs);
    const base = b.p.clone().addScaledVector(b.right, side * 10.0).addScaledVector(b.normal, 0.08);
    const top = base.clone().addScaledVector(b.normal, 1.05);
    pos.push(base.x, base.y, base.z, top.x, top.y, top.z);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const wall = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({
    color: 0x077bf0,
    roughness: 0.22,
    metalness: 0.12,
    clearcoat: 0.7,
    clearcoatRoughness: 0.16,
    side: THREE.DoubleSide
  }));
  wall.castShadow = wall.receiveShadow = true;
  world.add(wall);
}
buildSideWall(-1);
buildSideWall(1);

const laneMat = new THREE.MeshBasicMaterial({ color: 0xf7f8fa });
const laneGeo = new THREE.BoxGeometry(0.16, 0.026, 3.0);
for (let i = 4; i < 230; i += 4) {
  const b = basisAt(i / 232);
  for (const l of [-2.75, 2.75]) {
    const d = new THREE.Mesh(laneGeo, laneMat);
    d.position.copy(b.p).addScaledVector(b.right, l).addScaledVector(b.normal, 0.075);
    orient(d, b);
    world.add(d);
  }
}

function addLight(t, side) {
  const b = basisAt(t);
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x26384d, metalness: 0.62, roughness: 0.24 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.5, 10), poleMat);
  pole.position.y = 3.75;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.12), poleMat);
  arm.position.set(side * 0.56, 7.35, 0);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.38), new THREE.MeshBasicMaterial({ color: 0xfff3cf, toneMapped: false }));
  lamp.position.set(side * 1.1, 7.25, 0);
  g.add(pole, arm, lamp);
  g.position.copy(b.p).addScaledVector(b.right, side * 13.2);
  world.add(g);
}

function addBanner(t, side) {
  const b = basisAt(t);
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 7.2, 10), new THREE.MeshStandardMaterial({ color: 0x283748, metalness: 0.55, roughness: 0.28 }));
  pole.position.y = 3.6;
  const flag = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.0, 0.1), new THREE.MeshPhysicalMaterial({ color: 0x076fe5, roughness: 0.17, clearcoat: 0.72 }));
  flag.position.set(side * 0.9, 5.45, 0);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.8, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(side * 0.9, 5.45, 0.07);
  g.add(pole, flag, arrow);
  g.position.copy(b.p).addScaledVector(b.right, side * 13.0);
  world.add(g);
}

for (let i = 0; i < 24; i++) {
  addLight(0.03 + i * 0.039, i % 2 ? 1 : -1);
  addBanner(0.045 + i * 0.038, i % 2 ? -1 : 1);
}

function addPalm(t, side, s = 1) {
  const b = basisAt(t);
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.25, 5.6, 10),
    new THREE.MeshStandardMaterial({ color: 0x805c38, roughness: 0.92 })
  );
  trunk.position.y = 2.8;
  trunk.rotation.z = (Math.random() - 0.5) * 0.08;
  g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x208d4e, roughness: 0.8 });
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 2.55, 5, 8), leafMat);
    leaf.position.y = 5.75;
    leaf.rotation.z = Math.PI / 2.55;
    leaf.rotation.y = i * Math.PI * 2 / 9;
    leaf.translateX(1.45);
    g.add(leaf);
  }
  g.position.copy(b.p).addScaledVector(b.right, side * (15 + Math.random() * 13));
  g.scale.setScalar(s);
  world.add(g);
}
for (let i = 0; i < 100; i++) addPalm((i + 2) / 104, i % 2 ? 1 : -1, 0.58 + Math.random() * 0.62);

const cityWhite = new THREE.MeshPhysicalMaterial({ color: 0xdce8ef, roughness: 0.55, metalness: 0.04 });
const cityBlue = new THREE.MeshPhysicalMaterial({ color: 0x9fc8e0, roughness: 0.52, metalness: 0.08 });
for (let i = 0; i < 60; i++) {
  const h = 12 + Math.random() * 42;
  const w = 5 + Math.random() * 10;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * (0.68 + Math.random() * 0.35)), i % 3 ? cityWhite : cityBlue);
  tower.position.set(105 + Math.random() * 185, h / 2 - 3.7, -150 - Math.random() * 690);
  tower.castShadow = true;
  world.add(tower);
  if (i % 4 === 0) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.7, w * 0.72), new THREE.MeshBasicMaterial({ color: 0xe9fbff }));
    cap.position.copy(tower.position);
    cap.position.y += h / 2 + 0.35;
    world.add(cap);
  }
}

const mountainMats = [
  new THREE.MeshStandardMaterial({ color: 0x527aa4, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x638cb0, roughness: 1 }),
  new THREE.MeshStandardMaterial({ color: 0x769cbc, roughness: 1 })
];
for (let i = 0; i < 28; i++) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(28 + Math.random() * 42, 55 + Math.random() * 72, 8), mountainMats[i % 3]);
  m.position.set(-340 + i * 29, -4, -300 - Math.random() * 620);
  m.rotation.y = Math.random() * Math.PI;
  m.scale.z = 0.7 + Math.random() * 1.25;
  world.add(m);
}

const cloudTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 192, 192);
  for (const [cx, cy, r] of [[58, 92, 44], [94, 74, 52], [132, 94, 42], [98, 112, 50]]) {
    const g = x.createRadialGradient(cx, cy, 6, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,.98)');
    g.addColorStop(0.58, 'rgba(255,255,255,.78)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 192, 192);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
})();
for (let i = 0; i < 28; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.86 }));
  s.scale.set(34 + Math.random() * 48, 18 + Math.random() * 18, 1);
  s.position.set(-300 + Math.random() * 600, 62 + Math.random() * 50, -90 - Math.random() * 820);
  world.add(s);
}

function addBoat(x, z, s = 1) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 8.5), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 0.55 }));
  hull.position.y = 0.25;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.1, 2.7), new THREE.MeshPhysicalMaterial({ color: 0xeaf7ff, roughness: 0.22, transmission: 0.08 }));
  cabin.position.set(0, 1.05, -0.7);
  g.add(hull, cabin);
  g.position.set(x, -3.35, z);
  g.scale.setScalar(s);
  g.rotation.y = Math.random() * Math.PI * 2;
  world.add(g);
}
for (let i = 0; i < 24; i++) addBoat((i % 2 ? 1 : -1) * (55 + Math.random() * 220), -120 - Math.random() * 700, 0.45 + Math.random() * 0.55);

function addPortal(t, accent = 0x25d6ff) {
  const b = basisAt(t);
  const g = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x0a67ca, roughness: 0.24, metalness: 0.2, clearcoat: 0.65 });
  const glow = new THREE.MeshBasicMaterial({ color: accent, toneMapped: false });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.95, 8.6, 0.95), metal);
  const right = left.clone();
  const top = new THREE.Mesh(new THREE.BoxGeometry(20.8, 0.95, 0.95), metal);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.12, 1.0), glow);
  left.position.set(-9.35, 4.3, 0);
  right.position.set(9.35, 4.3, 0);
  top.position.set(0, 8.6, 0);
  strip.position.set(0, 8.6, 0.52);
  g.add(left, right, top, strip);
  g.position.copy(b.p);
  g.rotation.y = Math.atan2(b.tangent.x, b.tangent.z);
  world.add(g);
}
[0.12, 0.34, 0.62, 0.89].forEach((t, i) => addPortal(t, i === 2 ? 0xff3f57 : 0x29d6ff));

for (let j = 0; j < 13; j++) {
  const t = 0.46 + j * 0.0092;
  const b = basisAt(t);
  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(9.45, 0.12, 8, 56),
    new THREE.MeshBasicMaterial({ color: j % 2 ? 0x20caff : 0xff4459, toneMapped: false })
  );
  hoop.position.copy(b.p).addScaledVector(b.normal, 8.6);
  hoop.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.tangent.clone().normalize());
  world.add(hoop);
}

const pickupMat = new THREE.MeshPhysicalMaterial({
  color: 0x5ee7ff,
  emissive: 0x168caf,
  emissiveIntensity: 2.2,
  roughness: 0.08,
  metalness: 0.15,
  clearcoat: 1
});
const pickups = [];
for (let i = 0; i < 14; i++) {
  const t = 0.08 + i * 0.061;
  const b = basisAt(t);
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.92), pickupMat);
  const lane = [-4.2, 0, 4.2][i % 3];
  mesh.castShadow = true;
  mesh.position.copy(b.p).addScaledVector(b.right, lane).addScaledVector(b.normal, 1.15);
  world.add(mesh);
  pickups.push({ mesh, t, lane, taken: false });
}

const particleGeo = new THREE.SphereGeometry(0.1, 7, 5);
const particles = [];
function burst(pos, color, count = 22, spread = 5) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false });
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(particleGeo, mat);
    m.position.copy(pos);
    world.add(m);
    particles.push({
      m,
      v: new THREE.Vector3((Math.random() - 0.5) * spread, Math.random() * 3, (Math.random() - 0.5) * spread),
      life: 0.7 + Math.random() * 0.5
    });
  }
}

const speedFx = new THREE.Group();
camera.add(speedFx);
scene.add(camera);
const streakMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.11, depthTest: false, toneMapped: false });
const streaks = [];
for (let i = 0; i < 56; i++) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.011, 2.4 + Math.random() * 3.8), streakMat);
  s.position.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, -5 - Math.random() * 22);
  speedFx.add(s);
  streaks.push(s);
}

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
const CAR_FBX = 'https://raw.githubusercontent.com/MirageYM/3DModels/master/SportsCar/Subdiv_Car.fbx';
const FALLBACK_GLB = 'https://raw.githubusercontent.com/Arslan12216775/kenney_car-kit/master/Models/GLB%20format/sedan-sports.glb';
const CAR_COLORS = [0x0877ff, 0x7138ff, 0x18b5d0, 0x12161d, 0xf13d4e, 0xf1a51f];
let player, ais = [];

function asPhysicalMaterial(source, tint) {
  const name = (source?.name || '').toLowerCase();
  const srcColor = source?.color ? source.color.clone() : new THREE.Color(0xffffff);
  const brightness = srcColor.r + srcColor.g + srcColor.b;
  const isGlass = name.includes('glass') || name.includes('window') || name.includes('windshield');
  const isTire = name.includes('tire') || name.includes('tyre') || name.includes('rubber');
  const isWheel = name.includes('wheel') || name.includes('rim');
  const isChrome = name.includes('chrome') || name.includes('metal') || name.includes('exhaust');
  const isInterior = name.includes('interior') || name.includes('seat') || name.includes('dash') || name.includes('steer');

  if (isGlass) {
    return new THREE.MeshPhysicalMaterial({
      color: 0x10293d,
      roughness: 0.06,
      metalness: 0.05,
      transmission: 0.3,
      transparent: true,
      opacity: 0.75,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide
    });
  }
  if (isTire) return new THREE.MeshStandardMaterial({ color: 0x090b0f, roughness: 0.88, metalness: 0.03 });
  if (isWheel || isChrome) return new THREE.MeshStandardMaterial({ color: 0xb8c2cc, roughness: 0.18, metalness: 0.9 });
  if (isInterior || brightness < 0.4) return new THREE.MeshStandardMaterial({ color: 0x11151b, roughness: 0.55, metalness: 0.12 });

  const paint = new THREE.MeshPhysicalMaterial({
    color: tint,
    roughness: 0.16,
    metalness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.045,
    sheen: 0.65,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.2
  });
  if (source?.map) paint.map = source.map;
  return paint;
}

function styleCar(root, index) {
  const tint = new THREE.Color(CAR_COLORS[index % CAR_COLORS.length]);
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    const src = Array.isArray(o.material) ? o.material : [o.material];
    const mats = src.map(m => asPhysicalMaterial(m, tint));
    o.material = Array.isArray(o.material) ? mats : mats[0];
  });
}

function addCarDetails(wrapper) {
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x090c12, roughness: 0.24, metalness: 0.48, clearcoat: 0.65 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xff2f25, toneMapped: false });
  const wing = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.11, 0.42), dark);
  wing.position.set(0, 1.55, 2.45);
  wrapper.add(wing);
  for (const x of [-1.2, 1.2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.14), dark);
    post.position.set(x, 1.3, 2.38);
    wrapper.add(post);
  }
  for (const x of [-0.95, 0.95]) {
    const light = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.065, 10, 24), glow);
    light.position.set(x, 0.86, 2.82);
    light.rotation.x = Math.PI / 2;
    wrapper.add(light);
  }
}

function normalizeCar(model, index) {
  const wrapper = new THREE.Group();
  const car = model;
  styleCar(car, index);
  car.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(car);
  let size = box.getSize(new THREE.Vector3());

  if (size.x > size.z) {
    car.rotation.y += Math.PI / 2;
    car.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(car);
    size = box.getSize(new THREE.Vector3());
  }

  const scale = 5.2 / Math.max(size.x, size.z);
  car.scale.multiplyScalar(scale);
  car.rotation.y += Math.PI;
  car.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(car);
  const center = box.getCenter(new THREE.Vector3());
  car.position.x -= center.x;
  car.position.z -= center.z;
  car.position.y -= box.min.y;

  wrapper.add(car);
  addCarDetails(wrapper);
  return wrapper;
}

async function loadBaseCar() {
  try {
    loadingEl.textContent = 'Loading high-detail sports car…';
    return await new Promise((resolve, reject) => fbxLoader.load(CAR_FBX, resolve, undefined, reject));
  } catch (err) {
    console.warn('High-detail FBX failed; falling back to GLB', err);
    loadingEl.textContent = 'Loading fallback sports car…';
    const gltf = await new Promise((resolve, reject) => gltfLoader.load(FALLBACK_GLB, resolve, undefined, reject));
    return gltf.scene;
  }
}

async function loadCars() {
  const base = await loadBaseCar();
  player = normalizeCar(base.clone(true), 0);
  world.add(player);
  ais = [];
  for (let i = 1; i < 6; i++) {
    const mesh = normalizeCar(base.clone(true), i);
    world.add(mesh);
    ais.push({
      mesh,
      t: 0.015 + (i - 1) * 0.009,
      lane: [-4, 3, -1.5, 4, -3][i - 1],
      pace: 0.047 + Math.random() * 0.005,
      stun: 0,
      spin: 0,
      speedScale: 1,
      phase: i * 1.7
    });
  }
}

let running = false;
let targetLane = 0;
let lane = 0;
let playerT = 0;
let boost = 0;
let currentItem = null;
let last = performance.now();
let dragging = false;
let dragX = 0;
let dragLane = 0;
let missiles = [];
let mines = [];
let shake = 0;
let raceTime = 0;
let throttle = 0;
let accelerating = false;
let braking = false;
let leftHeld = false;
let rightHeld = false;

function showMsg(s) {
  msgEl.textContent = s;
  msgEl.classList.add('show');
  clearTimeout(showMsg.t);
  showMsg.t = setTimeout(() => msgEl.classList.remove('show'), 800);
}

function setItem(v) {
  currentItem = v;
  itemBtn.disabled = !v || !running;
  itemBtn.textContent = v === 'rocket' ? '🚀' : v === 'boost' ? '⚡' : v === 'mine' ? '💣' : '?';
}

function placeCar(mesh, t, laneValue) {
  const b = basisAt(t);
  const p = b.p.clone().addScaledVector(b.right, laneValue).addScaledVector(b.normal, 0.13);
  mesh.position.copy(p);
  mesh.rotation.y = Math.atan2(b.tangent.x, b.tangent.z);
  mesh.rotation.z = -Math.asin(THREE.MathUtils.clamp(b.tangent.y, -1, 1)) * 0.32;
}

function reset() {
  playerT = 0;
  lane = targetLane = 0;
  boost = 0;
  raceTime = 0;
  throttle = 0;
  accelerating = false;
  braking = false;
  leftHeld = false;
  rightHeld = false;
  shake = 0;
  setItem(null);
  pickups.forEach(p => { p.taken = false; p.mesh.visible = true; });
  ais.forEach((a, i) => {
    a.t = 0.015 + i * 0.009;
    a.stun = 0;
    a.spin = 0;
    a.speedScale = 1;
  });
  missiles.forEach(x => world.remove(x.mesh));
  missiles = [];
  mines.forEach(x => world.remove(x.mesh));
  mines = [];
  running = true;
  menu.style.display = 'none';
  showMsg('HOLD TO ACCELERATE');
}

function useItem() {
  if (!running || !currentItem) return;
  const item = currentItem;
  setItem(null);

  if (item === 'boost') {
    boost = 1.7;
    showMsg('TURBO!');
    burst(player.position, 0x55dfff, 30, 6);
    return;
  }

  if (item === 'mine') {
    const b = basisAt(playerT);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.22, 18),
      new THREE.MeshStandardMaterial({ color: 0xe44343, emissive: 0x5f0909, emissiveIntensity: 1.5 })
    );
    m.position.copy(b.p).addScaledVector(b.right, lane).addScaledVector(b.normal, 0.18);
    world.add(m);
    mines.push({ mesh: m, t: playerT, lane, life: 14 });
    showMsg('MINE DROPPED');
    return;
  }

  const target = ais.filter(a => a.t > playerT).sort((a, b) => a.t - b.t)[0];
  if (!target) {
    showMsg('NO TARGET');
    return;
  }
  const m = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.62, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xffcc3d, emissive: 0xff5a00, emissiveIntensity: 2.6 })
  );
  m.rotation.x = Math.PI / 2;
  m.position.copy(player.position);
  world.add(m);
  missiles.push({ mesh: m, target, life: 3 });
  showMsg('ROCKET!');
}

itemBtn.addEventListener('click', e => {
  e.stopPropagation();
  useItem();
});
playBtn.addEventListener('click', reset);

renderer.domElement.addEventListener('pointerdown', e => {
  if (!running) return;
  dragging = true;
  accelerating = true;
  braking = false;
  dragX = e.clientX;
  dragLane = targetLane;
  renderer.domElement.setPointerCapture?.(e.pointerId);
});

renderer.domElement.addEventListener('pointermove', e => {
  if (!dragging) return;
  targetLane = THREE.MathUtils.clamp(
    dragLane + (e.clientX - dragX) / Math.max(innerWidth, 300) * 16,
    -5.2,
    5.2
  );
});

const endPointer = () => {
  dragging = false;
  accelerating = false;
};
renderer.domElement.addEventListener('pointerup', endPointer);
renderer.domElement.addEventListener('pointercancel', endPointer);

window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'ArrowUp' || e.code === 'KeyW') accelerating = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') braking = true;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftHeld = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') rightHeld = true;
  if (e.code === 'Space' && !e.repeat) useItem();
}, { passive: false });

window.addEventListener('keyup', e => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') accelerating = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') braking = false;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftHeld = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') rightHeld = false;
});
window.addEventListener('blur', () => {
  accelerating = braking = leftHeld = rightHeld = dragging = false;
});

function update(dt) {
  raceTime += dt;

  if (leftHeld) targetLane = Math.max(-5.2, targetLane - dt * 7.2);
  if (rightHeld) targetLane = Math.min(5.2, targetLane + dt * 7.2);

  if (accelerating) throttle = Math.min(1, throttle + dt / 5);
  else if (braking) throttle = Math.max(0, throttle - dt * 0.48);
  else throttle = Math.max(0, throttle - dt * 0.12);

  const launch = throttle * throttle * (3 - 2 * throttle);
  const aiRaw = THREE.MathUtils.clamp(raceTime / 5, 0, 1);
  const aiLaunch = aiRaw * aiRaw * (3 - 2 * aiRaw);
  const speedMul = boost > 0 ? 1.22 : 1;
  if (boost > 0) boost -= dt;

  const playerPace = THREE.MathUtils.lerp(0.004, 0.055, launch) * speedMul;
  playerT = Math.min(1, playerT + dt * playerPace);

  lane += (targetLane - lane) * Math.min(1, dt * 16);
  placeCar(player, playerT, lane);

  const turnAmount = THREE.MathUtils.clamp((targetLane - lane) * 2.1, -1, 1);
  const trackRoll = -Math.asin(THREE.MathUtils.clamp(basisAt(playerT).tangent.y, -1, 1)) * 0.32;
  player.rotation.z += (trackRoll - turnAmount * 0.16 - player.rotation.z) * Math.min(1, dt * 13);

  ais.forEach(a => {
    if (a.speedScale < 1) a.speedScale = Math.min(1, a.speedScale + dt * 0.4);
    const impact = a.stun > 0 ? 0.72 : 1;
    const aiPace = THREE.MathUtils.lerp(a.pace * 0.38, a.pace, aiLaunch);
    a.t = Math.min(1, a.t + dt * aiPace * a.speedScale * impact);
    if (a.stun > 0) {
      a.stun -= dt;
      a.spin += dt * 10;
    }
    const aiLane = a.lane + Math.sin(a.t * 80 + a.phase) * 1.05;
    placeCar(a.mesh, a.t, aiLane);
    if (a.stun > 0) a.mesh.rotation.y += a.spin;
  });

  pickups.forEach(p => {
    p.mesh.rotation.x += dt * 2.5;
    p.mesh.rotation.y += dt * 3.5;
    if (!p.taken && Math.abs(p.t - playerT) < 0.018 && Math.abs(p.lane - lane) < 1.8) {
      p.taken = true;
      p.mesh.visible = false;
      if (!currentItem) {
        const r = Math.random();
        setItem(r < 0.47 ? 'rocket' : r < 0.75 ? 'boost' : 'mine');
        showMsg('ITEM READY');
        burst(player.position, 0x65e6ff, 18, 3);
      }
    }
  });

  missiles.forEach(m => {
    m.life -= dt;
    const tp = m.target.mesh.position;
    m.mesh.position.lerp(tp, 0.32);
    const dir = tp.clone().sub(m.mesh.position).normalize();
    m.mesh.position.addScaledVector(dir, dt * 260);
    m.mesh.rotation.z += dt * 22;
    if (m.mesh.position.distanceTo(tp) < 2.6) {
      m.target.stun = 1.2;
      m.target.speedScale = Math.min(m.target.speedScale, 0.18);
      m.life = 0;
      shake = 0.55;
      showMsg('DIRECT HIT!');
      burst(tp, 0xffb532, 34, 7);
    }
  });
  for (let i = missiles.length - 1; i >= 0; i--) {
    if (missiles[i].life <= 0) {
      world.remove(missiles[i].mesh);
      missiles.splice(i, 1);
    }
  }

  mines.forEach(m => {
    m.life -= dt;
    ais.forEach(a => {
      if (m.life > 0 && Math.abs(a.t - m.t) < 0.018 && Math.abs(a.lane - m.lane) < 2) {
        a.stun = 1.1;
        a.speedScale = Math.min(a.speedScale, 0.28);
        m.life = 0;
        burst(m.mesh.position, 0xff5a44, 28, 6);
      }
    });
  });
  for (let i = mines.length - 1; i >= 0; i--) {
    if (mines[i].life <= 0) {
      world.remove(mines[i].mesh);
      mines.splice(i, 1);
    }
  }

  particles.forEach(p => {
    p.life -= dt;
    p.m.position.addScaledVector(p.v, dt);
    p.v.y -= 4.8 * dt;
    p.m.material.opacity = Math.max(0, p.life / 0.8);
  });
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) {
      world.remove(particles[i].m);
      particles.splice(i, 1);
    }
  }

  const visualSpeed = THREE.MathUtils.lerp(0, 345, launch) * speedMul;
  speedEl.textContent = Math.round(visualSpeed);
  rankEl.textContent = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;
  progressEl.style.width = (playerT * 100).toFixed(1) + '%';

  const b = basisAt(playerT);
  const cameraDistance = THREE.MathUtils.lerp(8.8, 10.4, launch);
  const cameraHeight = THREE.MathUtils.lerp(5.25, 6.25, launch);
  const behind = b.p.clone()
    .addScaledVector(b.tangent, -cameraDistance)
    .addScaledVector(b.normal, cameraHeight)
    .addScaledVector(b.right, lane * 0.06);

  const roadBuzz = 0.018 * launch + (boost > 0 ? 0.025 : 0);
  behind.x += (Math.random() - 0.5) * roadBuzz;
  behind.y += (Math.random() - 0.5) * roadBuzz;

  if (shake > 0) {
    behind.x += (Math.random() - 0.5) * shake;
    behind.y += (Math.random() - 0.5) * shake;
    shake = Math.max(0, shake - dt * 1.9);
  }

  camera.position.lerp(behind, 1 - Math.pow(0.000018, dt));
  camera.lookAt(
    b.p.clone()
      .addScaledVector(b.tangent, THREE.MathUtils.lerp(33, 45, launch))
      .addScaledVector(b.normal, 0.9)
  );

  const targetFov = THREE.MathUtils.lerp(72, 84, launch) + (boost > 0 ? 6 : 0);
  camera.fov += (targetFov - camera.fov) * dt * 9;
  camera.updateProjectionMatrix();

  streakMat.opacity = 0.012 + 0.14 * launch + (boost > 0 ? 0.075 : 0);
  streaks.forEach(s => {
    s.position.z += dt * (15 + visualSpeed * 0.14);
    if (s.position.z > -1) {
      s.position.z = -24 - Math.random() * 12;
      s.position.x = (Math.random() - 0.5) * 9;
      s.position.y = (Math.random() - 0.5) * 5;
    }
  });

  if (playerT >= 1) {
    running = false;
    accelerating = braking = leftHeld = rightHeld = false;
    setItem(null);
    const final = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;
    document.querySelector('.title').innerHTML = final === 1 ? 'VICTORY!' : `FINISHED ${final}/6`;
    document.querySelector('.subtitle').textContent =
      final === 1
        ? 'First place. Smart item timing and clean lines won the race.'
        : 'Use pickups more aggressively and save turbo for overtakes.';
    playBtn.textContent = 'RACE AGAIN';
    menu.style.display = 'flex';
  }
}

function animate(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (running) update(dt);
  else if (player) {
    player.rotation.y += dt * 0.06;
    streakMat.opacity = 0.008;
  }
  composer.render();
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

(async () => {
  try {
    await loadCars();
    placeCar(player, 0, 0);
    ais.forEach(a => placeCar(a.mesh, a.t, a.lane));
    const b = basisAt(0);
    camera.position.copy(b.p).addScaledVector(b.tangent, -8.8).addScaledVector(b.normal, 5.25);
    camera.lookAt(b.p.clone().addScaledVector(b.tangent, 33));
    playBtn.disabled = false;
    playBtn.textContent = 'START RACE';
    loadingEl.textContent = 'Ready';
  } catch (err) {
    console.error(err);
    loadingEl.textContent = 'Could not load vehicle assets. Check internet access.';
    playBtn.textContent = 'ASSET LOAD FAILED';
  }
})();

requestAnimationFrame(animate);
