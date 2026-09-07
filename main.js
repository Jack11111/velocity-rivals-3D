
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const game = document.getElementById('game');
const rankEl = document.getElementById('rank');
const progressEl = document.getElementById('progress');
const speedEl = document.querySelector('#speed b');
const itemBtn = document.getElementById('item');
const msgEl = document.getElementById('message');
const menu = document.getElementById('menu');
const playBtn = document.getElementById('play');
const loadingEl = document.getElementById('loading');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x78b8e8);
scene.fog = new THREE.FogExp2(0x9cc7e4, 0.0085);

const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, .1, 550);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
game.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd9eeff,0x50633c,2.5));
const sun = new THREE.DirectionalLight(0xfff1d4,4.1);
sun.position.set(-45,70,25); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-55; sun.shadow.camera.right=55; sun.shadow.camera.top=55; sun.shadow.camera.bottom=-55;
scene.add(sun);

const loader = new GLTFLoader();

const CAR_BASE = 'https://raw.githubusercontent.com/Arslan12216775/kenney_car-kit/master/Models/GLB%20format/';
const CAR_URLS = [
  CAR_BASE+'race.glb',
  CAR_BASE+'race-future.glb',
  CAR_BASE+'sedan-sports.glb',
  CAR_BASE+'hatchback-sports.glb',
  CAR_BASE+'suv-luxury.glb',
  CAR_BASE+'sedan.glb'
];

function loadGLB(url){
  return new Promise((resolve,reject)=>loader.load(url,g=>resolve(g.scene),undefined,reject));
}

const world = new THREE.Group();
scene.add(world);

const points = [
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(0,0,-65),
  new THREE.Vector3(-20,2,-125),
  new THREE.Vector3(-48,4,-180),
  new THREE.Vector3(-25,7,-245),
  new THREE.Vector3(22,5,-300),
  new THREE.Vector3(54,2,-365),
  new THREE.Vector3(38,0,-430),
  new THREE.Vector3(-10,1,-495),
  new THREE.Vector3(-45,3,-555),
  new THREE.Vector3(-18,5,-625),
  new THREE.Vector3(27,2,-690),
  new THREE.Vector3(0,0,-770)
];
const curve = new THREE.CatmullRomCurve3(points,false,'catmullrom',.35);

function basisAt(t){
  const p = curve.getPointAt(THREE.MathUtils.clamp(t,0,1));
  const tangent = curve.getTangentAt(THREE.MathUtils.clamp(t,0,1)).normalize();
  const up = new THREE.Vector3(0,1,0);
  const right = new THREE.Vector3().crossVectors(tangent,up).normalize();
  const normal = new THREE.Vector3().crossVectors(right,tangent).normalize();
  return {p,tangent,right,normal};
}

function buildRibbon(width, color, yOffset=0, edgeOffset=0){
  const segs=300, pos=[], idx=[];
  for(let i=0;i<=segs;i++){
    const t=i/segs,b=basisAt(t);
    const c=b.p.clone().addScaledVector(b.normal,yOffset);
    const l=c.clone().addScaledVector(b.right,-width/2-edgeOffset);
    const r=c.clone().addScaledVector(b.right,width/2+edgeOffset);
    pos.push(l.x,l.y,l.z,r.x,r.y,r.z);
  }
  for(let i=0;i<segs;i++){
    const a=i*2,b=a+1,c=a+2,d=a+3;
    idx.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({color,roughness:.84,metalness:.03,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,m); mesh.receiveShadow=true; world.add(mesh); return mesh;
}
buildRibbon(17.4,0xf4f1e9,.005);
buildRibbon(16.6,0xd54246,.01);
buildRibbon(15.5,0x303842,.02);

const grass = new THREE.Mesh(new THREE.PlaneGeometry(520,950),new THREE.MeshStandardMaterial({color:0x4e9a54,roughness:1}));
grass.rotation.x=-Math.PI/2; grass.position.set(0,-.22,-385); grass.receiveShadow=true; world.add(grass);

function addBarrier(side){
  const mat=new THREE.MeshStandardMaterial({color:0x1682d6,roughness:.52,metalness:.12});
  for(let i=0;i<110;i++){
    const t=i/109,b=basisAt(t);
    const m=new THREE.Mesh(new THREE.BoxGeometry(2.4,.7,.48),mat);
    const p=b.p.clone().addScaledVector(b.right,side*9.1).addScaledVector(b.normal,.34);
    m.position.copy(p);
    m.lookAt(p.clone().add(b.tangent));
    m.castShadow=true; world.add(m);
  }
}
addBarrier(-1); addBarrier(1);

function addTree(t,side,scale=1){
  const b=basisAt(t),g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,2.5,8),new THREE.MeshStandardMaterial({color:0x70503a,roughness:1}));
  trunk.position.y=1.25;g.add(trunk);
  const c1=new THREE.Mesh(new THREE.IcosahedronGeometry(1.7,1),new THREE.MeshStandardMaterial({color:0x267b46,roughness:.95}));
  c1.position.y=3.1;c1.scale.set(1,1.35,1);g.add(c1);
  const p=b.p.clone().addScaledVector(b.right,side*(13+Math.random()*16));
  g.position.copy(p);g.scale.setScalar(scale); world.add(g);
}
for(let i=0;i<95;i++)addTree((i+2)/100,i%2?1:-1,.65+Math.random()*.7);

function addGrandstand(t,side){
  const b=basisAt(t),g=new THREE.Group();
  const baseMat=new THREE.MeshStandardMaterial({color:0xd8dde4,roughness:.62});
  const roofMat=new THREE.MeshStandardMaterial({color:0x136dba,roughness:.4,metalness:.1});
  for(let k=0;k<4;k++){
    const row=new THREE.Mesh(new THREE.BoxGeometry(9,.45,2.2),baseMat);
    row.position.set(0,.45+k*.45,k*.75);g.add(row);
  }
  const roof=new THREE.Mesh(new THREE.BoxGeometry(10,.28,4),roofMat);roof.position.set(0,3.2,1.4);g.add(roof);
  const p=b.p.clone().addScaledVector(b.right,side*20);
  g.position.copy(p); g.rotation.y=Math.atan2(b.tangent.x,b.tangent.z)+(side<0?Math.PI:0); world.add(g);
}
[.12,.31,.56,.78].forEach((t,i)=>addGrandstand(t,i%2?1:-1));

function addArch(t){
  const b=basisAt(t),g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x1476bf,metalness:.18,roughness:.38});
  const left=new THREE.Mesh(new THREE.BoxGeometry(.9,7,.9),mat),right=left.clone(),top=new THREE.Mesh(new THREE.BoxGeometry(18,.9,.9),mat);
  left.position.set(-8.4,3.5,0);right.position.set(8.4,3.5,0);top.position.set(0,7,0);
  g.add(left,right,top);
  g.position.copy(b.p);g.rotation.y=Math.atan2(b.tangent.x,b.tangent.z);world.add(g);
}
[.18,.47,.73,.95].forEach(addArch);

const pickupMat=new THREE.MeshPhysicalMaterial({color:0x55dbff,emissive:0x178bb2,emissiveIntensity:2.6,roughness:.13,metalness:.15,transmission:.08});
const pickups=[];
for(let i=0;i<14;i++){
  const t=.08+i*.061,b=basisAt(t),mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.9),pickupMat);
  mesh.castShadow=true;
  const lane=[-4.2,0,4.2][i%3];
  mesh.position.copy(b.p).addScaledVector(b.right,lane).addScaledVector(b.normal,1.1);
  world.add(mesh);pickups.push({mesh,t,lane,taken:false});
}

const particleGeo=new THREE.SphereGeometry(.09,6,4);
const particles=[];
function burst(pos,color,count=22,spread=5){
  const mat=new THREE.MeshBasicMaterial({color,transparent:true});
  for(let i=0;i<count;i++){
    const m=new THREE.Mesh(particleGeo,mat);m.position.copy(pos);world.add(m);
    particles.push({m,v:new THREE.Vector3((Math.random()-.5)*spread,Math.random()*3,(Math.random()-.5)*spread),life:.7+Math.random()*.5});
  }
}

let cars=[],player,ais=[];
function prepModel(model){
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.envMapIntensity=1.2}}});
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
  const s=4.2/Math.max(size.x,size.z); model.scale.setScalar(s);
  const box2=new THREE.Box3().setFromObject(model);
  model.position.y-=box2.min.y;
  return model;
}

async function loadCars(){
  const models=await Promise.all(CAR_URLS.map(loadGLB));
  cars=models.map(prepModel);
  player=cars[0];world.add(player);
  ais=cars.slice(1).map((mesh,i)=>({mesh,t:.015+i*.009,lane:[-4,3,-1.5,4,-3][i],speed:.0205+Math.random()*.0022,stun:0,spin:0,speedScale:1,phase:i*1.7}));
  ais.forEach(a=>world.add(a.mesh));
}

let running=false,targetLane=0,lane=0,playerT=0,boost=0,currentItem=null,last=performance.now(),dragging=false,dragX=0,dragLane=0,missiles=[],mines=[],shake=0,raceTime=0;

function showMsg(s){
  msgEl.textContent=s;msgEl.classList.add('show');clearTimeout(showMsg.t);showMsg.t=setTimeout(()=>msgEl.classList.remove('show'),800);
}
function setItem(v){
  currentItem=v;itemBtn.disabled=!v||!running;
  itemBtn.textContent=v==='rocket'?'🚀':v==='boost'?'⚡':v==='mine'?'💣':'?';
}
function placeCar(mesh,t,laneValue){
  const b=basisAt(t),p=b.p.clone().addScaledVector(b.right,laneValue).addScaledVector(b.normal,.12);
  mesh.position.copy(p);
  mesh.rotation.y=Math.atan2(b.tangent.x,b.tangent.z);
  mesh.rotation.z=-Math.asin(THREE.MathUtils.clamp(b.tangent.y,-1,1))*.4;
}
function reset(){
  playerT=0;lane=targetLane=0;boost=0;raceTime=0;setItem(null);shake=0;
  pickups.forEach(p=>{p.taken=false;p.mesh.visible=true});
  ais.forEach((a,i)=>{a.t=.015+i*.009;a.stun=0;a.spin=0;a.speedScale=1});
  missiles.forEach(x=>world.remove(x.mesh));missiles=[];
  mines.forEach(x=>world.remove(x.mesh));mines=[];
  running=true;menu.style.display='none';showMsg('GO!');
}
function useItem(){
  if(!running||!currentItem)return;
  const item=currentItem;setItem(null);
  if(item==='boost'){boost=2.1;showMsg('TURBO!');burst(player.position,0x55dfff,30,6);}
  else if(item==='mine'){
    const b=basisAt(playerT),m=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.22,18),new THREE.MeshStandardMaterial({color:0xe44343,emissive:0x5f0909,emissiveIntensity:1.5}));
    m.position.copy(b.p).addScaledVector(b.right,lane).addScaledVector(b.normal,.18);world.add(m);mines.push({mesh:m,t:playerT,lane,life:14});showMsg('MINE DROPPED');
  }else{
    const target=ais.filter(a=>a.t>playerT).sort((a,b)=>a.t-b.t)[0];
    if(!target){showMsg('NO TARGET');return}
    const m=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.62,4,8),new THREE.MeshStandardMaterial({color:0xffcc3d,emissive:0xff5a00,emissiveIntensity:3.8}));
    m.rotation.x=Math.PI/2;m.position.copy(player.position);world.add(m);missiles.push({mesh:m,target,life:3});showMsg('ROCKET!');
  }
}
itemBtn.addEventListener('click',useItem);
playBtn.addEventListener('click',reset);

renderer.domElement.addEventListener('pointerdown',e=>{if(!running)return;dragging=true;dragX=e.clientX;dragLane=targetLane;renderer.domElement.setPointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;targetLane=THREE.MathUtils.clamp(dragLane+(e.clientX-dragX)/Math.max(innerWidth,300)*16,-5.2,5.2)});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')targetLane=Math.max(-5.2,targetLane-.8);if(e.key==='ArrowRight')targetLane=Math.min(5.2,targetLane+.8);if(e.code==='Space')useItem()});

function update(dt){
  raceTime+=dt;
  // This version runs 10x faster than the previous build.
  // The race now ramps from 500x to 2500x the original prototype pace.
  const launchSpeedFactor=1+4*(1-Math.exp(-raceTime*1.8));
  const raceSpeedFactor=launchSpeedFactor*500;
  const speedMul=boost>0?1.38:1;
  if(boost>0)boost-=dt;
  playerT=Math.min(1,playerT+dt*.022*raceSpeedFactor*speedMul);
  lane+=(targetLane-lane)*Math.min(1,dt*13);
  placeCar(player,playerT,lane);

  // Lean into steering input. The tilt is deliberately subtle (~9 degrees max)
  // so it reads as weight transfer without making the car look like a motorcycle.
  const turnAmount=THREE.MathUtils.clamp((targetLane-lane)*1.8,-1,1);
  const trackRoll=-Math.asin(THREE.MathUtils.clamp(basisAt(playerT).tangent.y,-1,1))*.4;
  const targetRoll=trackRoll-turnAmount*.16;
  player.rotation.z+=(targetRoll-player.rotation.z)*Math.min(1,dt*10);

  ais.forEach(a=>{
    if(a.speedScale<1)a.speedScale=Math.min(1,a.speedScale+dt*.34);
    const impactAnimScale=a.stun>0?.72:1;
    a.t=Math.min(1,a.t+dt*a.speed*raceSpeedFactor*a.speedScale*impactAnimScale);
    if(a.stun>0){a.stun-=dt;a.spin+=dt*10}
    const aiLane=a.lane+Math.sin(a.t*60+a.phase)*1.1;
    placeCar(a.mesh,a.t,aiLane);
    if(a.stun>0)a.mesh.rotation.y+=a.spin;
  });

  pickups.forEach(p=>{
    p.mesh.rotation.x+=dt*1.5;p.mesh.rotation.y+=dt*2.4;
    if(!p.taken&&Math.abs(p.t-playerT)<.05&&Math.abs(p.lane-lane)<1.7){
      p.taken=true;p.mesh.visible=false;
      if(!currentItem){const r=Math.random();setItem(r<.47?'rocket':r<.75?'boost':'mine');showMsg('ITEM READY');burst(player.position,0x65e6ff,18,3)}
    }
  });

  missiles.forEach(m=>{
    m.life-=dt;
    const tp=m.target.mesh.position;
    m.mesh.position.lerp(tp,.30);
    const dir=tp.clone().sub(m.mesh.position).normalize();m.mesh.position.addScaledVector(dir,dt*1200);
    m.mesh.rotation.z+=dt*18;
    if(m.mesh.position.distanceTo(tp)<2.4){m.target.stun=1.4;m.target.speedScale=Math.min(m.target.speedScale,.18);m.life=0;shake=.38;showMsg('DIRECT HIT!');burst(tp,0xffb532,34,7)}
  });
  for(let i=missiles.length-1;i>=0;i--)if(missiles[i].life<=0){world.remove(missiles[i].mesh);missiles.splice(i,1)}

  mines.forEach(m=>{m.life-=dt;ais.forEach(a=>{if(m.life>0&&Math.abs(a.t-m.t)<.04&&Math.abs(a.lane-m.lane)<2.0){a.stun=1.2;a.speedScale=Math.min(a.speedScale,.28);m.life=0;burst(m.mesh.position,0xff5a44,28,6)}})});
  for(let i=mines.length-1;i>=0;i--)if(mines[i].life<=0){world.remove(mines[i].mesh);mines.splice(i,1)}

  particles.forEach(p=>{p.life-=dt;p.m.position.addScaledVector(p.v,dt);p.v.y-=4.8*dt;p.m.material.opacity=Math.max(0,p.life/.8)});
  for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0){world.remove(particles[i].m);particles.splice(i,1)}

  const ranks=[playerT,...ais.map(a=>a.t)].sort((a,b)=>b-a);
  rankEl.textContent=ranks.indexOf(playerT)+1;
  progressEl.style.width=(playerT*100).toFixed(1)+'%';
  speedEl.textContent=Math.round(245*raceSpeedFactor*speedMul);

  const b=basisAt(playerT);
  const highSpeed=(launchSpeedFactor-1)/4;
  const cameraDistance=THREE.MathUtils.lerp(10.8,15.2,highSpeed);
  const cameraHeight=THREE.MathUtils.lerp(4.5,5.4,highSpeed);
  const behind=b.p.clone().addScaledVector(b.tangent,-cameraDistance).addScaledVector(b.normal,cameraHeight).addScaledVector(b.right,lane*.14);
  if(shake>0){behind.x+=(Math.random()-.5)*shake;behind.y+=(Math.random()-.5)*shake;shake=Math.max(0,shake-dt*1.6)}
  camera.position.lerp(behind,1-Math.pow(.00018,dt));
  const look=b.p.clone().addScaledVector(b.tangent,THREE.MathUtils.lerp(24,38,highSpeed)).addScaledVector(b.normal,1.0);
  camera.lookAt(look);
  const normalFov=THREE.MathUtils.lerp(78,96,highSpeed);
  const targetFov=boost>0?Math.min(104,normalFov+6):normalFov;
  camera.fov+=(targetFov-camera.fov)*dt*8;camera.updateProjectionMatrix();

  if(playerT>=1){
    running=false;setItem(null);
    const final=[playerT,...ais.map(a=>a.t)].sort((a,b)=>b-a).indexOf(playerT)+1;
    document.querySelector('.title').innerHTML=final===1?'VICTORY!':'FINISHED '+final+'/6';
    document.querySelector('.subtitle').textContent=final===1?'First place. Smart item timing and clean lines won the race.':'Use pickups more aggressively and save turbo for overtakes.';
    playBtn.textContent='RACE AGAIN';menu.style.display='flex';
  }
}

function animate(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(running)update(dt);
  else if(player){player.rotation.y+=dt*.1}
  renderer.render(scene,camera);requestAnimationFrame(animate);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

(async()=>{
  try{
    loadingEl.textContent='Loading polished car models…';
    await loadCars();
    placeCar(player,0,0);ais.forEach(a=>placeCar(a.mesh,a.t,a.lane));
    const b=basisAt(0);camera.position.copy(b.p).addScaledVector(b.tangent,-10.8).addScaledVector(b.normal,4.5);camera.lookAt(b.p.clone().addScaledVector(b.tangent,24));
    playBtn.disabled=false;playBtn.textContent='START RACE';loadingEl.textContent='Ready';
  }catch(err){
    console.error(err);
    loadingEl.textContent='Could not load remote CC0 car assets. Check internet access.';
    playBtn.textContent='ASSET LOAD FAILED';
  }
})();
requestAnimationFrame(animate);
