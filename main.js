import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const $=id=>document.getElementById(id);
const game=$('game'),rankEl=$('rank'),progressEl=$('progress'),speedEl=document.querySelector('#speed b'),itemBtn=$('item'),msgEl=$('message'),menu=$('menu'),playBtn=$('play'),loadingEl=$('loading');

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xaed9f0,.0036);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.1,1200);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.85));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.94;
renderer.domElement.style.touchAction='none';
game.appendChild(renderer.domElement);

const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.03).texture;
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.15,.35,.92);
composer.addPass(bloom);

const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,18),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x4aaeff)},bottom:{value:new THREE.Color(0xdff7ff)}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 vP;void main(){float h=clamp(normalize(vP).y*.72+.28,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.72)),1.);}'}));
scene.add(sky);
scene.add(new THREE.HemisphereLight(0xeaf8ff,0x4b6b4f,1.65));
const sun=new THREE.DirectionalLight(0xfff2d8,3.25);sun.position.set(-65,95,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;sun.shadow.bias=-.00012;scene.add(sun);
const fill=new THREE.DirectionalLight(0x72bfff,.65);fill.position.set(45,28,-55);scene.add(fill);

const world=new THREE.Group();scene.add(world);
const points=[new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-72),new THREE.Vector3(-22,2,-140),new THREE.Vector3(-54,5,-208),new THREE.Vector3(-30,8,-280),new THREE.Vector3(25,6,-347),new THREE.Vector3(62,3,-418),new THREE.Vector3(44,1,-490),new THREE.Vector3(-13,2,-565),new THREE.Vector3(-53,4,-640),new THREE.Vector3(-18,6,-720),new THREE.Vector3(33,3,-800),new THREE.Vector3(0,0,-890)];
const curve=new THREE.CatmullRomCurve3(points,false,'catmullrom',.33);
function basisAt(t){t=THREE.MathUtils.clamp(t,0,1);const p=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize(),up=new THREE.Vector3(0,1,0),right=new THREE.Vector3().crossVectors(tangent,up).normalize(),normal=new THREE.Vector3().crossVectors(right,tangent).normalize();return{p,tangent,right,normal}}
function orient(o,b){o.lookAt(o.position.clone().add(b.tangent))}
function ribbon(width,material,y=.02){const segs=420,pos=[],idx=[];for(let i=0;i<=segs;i++){const b=basisAt(i/segs),c=b.p.clone().addScaledVector(b.normal,y),l=c.clone().addScaledVector(b.right,-width/2),r=c.clone().addScaledVector(b.right,width/2);pos.push(l.x,l.y,l.z,r.x,r.y,r.z)}for(let i=0;i<segs;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.receiveShadow=true;world.add(m);return m}

const shoulderMat=new THREE.MeshStandardMaterial({color:0xdce4eb,roughness:.72,metalness:.02});
const roadMat=new THREE.MeshPhysicalMaterial({color:0x252b34,roughness:.57,metalness:.05,clearcoat:.08,clearcoatRoughness:.8});
ribbon(19.2,shoulderMat,.006);ribbon(16.2,roadMat,.03);

const waterMat=new THREE.MeshPhysicalMaterial({color:0x0b8fd7,roughness:.22,metalness:.05,clearcoat:.65,clearcoatRoughness:.16,transparent:true,opacity:.94});
const water=new THREE.Mesh(new THREE.PlaneGeometry(1300,1500),waterMat);water.rotation.x=-Math.PI/2;water.position.set(300,-4.2,-450);world.add(water);
const land=new THREE.Mesh(new THREE.PlaneGeometry(1250,1500),new THREE.MeshStandardMaterial({color:0x3f9658,roughness:1}));land.rotation.x=-Math.PI/2;land.position.set(-380,-.38,-450);land.receiveShadow=true;world.add(land);

const curbRed=new THREE.MeshPhysicalMaterial({color:0xe83948,roughness:.38,clearcoat:.28}),curbWhite=new THREE.MeshPhysicalMaterial({color:0xf7f8f8,roughness:.42,clearcoat:.22}),curbGeo=new THREE.BoxGeometry(2.15,.15,1.4);
for(let i=0;i<205;i++){const b=basisAt(i/204);for(const side of[-1,1]){const m=new THREE.Mesh(curbGeo,i%2?curbRed:curbWhite);m.position.copy(b.p).addScaledVector(b.right,side*8.35).addScaledVector(b.normal,.1);orient(m,b);m.castShadow=m.receiveShadow=true;world.add(m)}}
const dashMat=new THREE.MeshBasicMaterial({color:0xf5f7fa}),dashGeo=new THREE.BoxGeometry(.14,.025,2.8);
for(let i=3;i<205;i+=3){const b=basisAt(i/205);for(const l of[-2.7,2.7]){const d=new THREE.Mesh(dashGeo,dashMat);d.position.copy(b.p).addScaledVector(b.right,l).addScaledVector(b.normal,.07);orient(d,b);world.add(d)}}

const barrierMat=new THREE.MeshPhysicalMaterial({color:0x0877df,roughness:.34,metalness:.12,clearcoat:.34,clearcoatRoughness:.35}),barrierGeo=new THREE.BoxGeometry(1.2,.85,.55);
for(let i=0;i<250;i++){const b=basisAt(i/249);for(const side of[-1,1]){const m=new THREE.Mesh(barrierGeo,barrierMat);m.position.copy(b.p).addScaledVector(b.right,side*9.7).addScaledVector(b.normal,.4);orient(m,b);m.castShadow=true;world.add(m)}}

function arch(t,accent=0x31d7ff){const b=basisAt(t),g=new THREE.Group(),mat=new THREE.MeshPhysicalMaterial({color:0x0968cc,roughness:.28,metalness:.18,clearcoat:.38}),glow=new THREE.MeshBasicMaterial({color:accent,toneMapped:false}),l=new THREE.Mesh(new THREE.BoxGeometry(.85,8,.85),mat),r=l.clone(),top=new THREE.Mesh(new THREE.BoxGeometry(20,.85,.85),mat),strip=new THREE.Mesh(new THREE.BoxGeometry(13,.11,.92),glow);l.position.set(-9.1,4,0);r.position.set(9.1,4,0);top.position.set(0,8,0);strip.position.set(0,8,.47);g.add(l,r,top,strip);g.position.copy(b.p);g.rotation.y=Math.atan2(b.tangent.x,b.tangent.z);world.add(g)}
[.13,.36,.62,.87].forEach(t=>arch(t));
for(let j=0;j<13;j++){const t=.43+j*.011;if(t>.57)break;const b=basisAt(t),hoop=new THREE.Mesh(new THREE.TorusGeometry(10.2,.12,8,48,Math.PI),new THREE.MeshBasicMaterial({color:j%2?0x13b8ff:0xff4256,toneMapped:false}));hoop.rotation.z=Math.PI;hoop.position.copy(b.p).addScaledVector(b.normal,.12);hoop.rotation.y=Math.atan2(b.tangent.x,b.tangent.z);world.add(hoop)}

function banner(t,side){const b=basisAt(t),g=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,7.5,10),new THREE.MeshStandardMaterial({color:0x283748,metalness:.5,roughness:.35})),flag=new THREE.Mesh(new THREE.BoxGeometry(1.6,3.8,.1),new THREE.MeshPhysicalMaterial({color:0x076fe3,roughness:.22,clearcoat:.4}));pole.position.y=3.75;flag.position.set(side*.85,5.35,0);g.add(pole,flag);g.position.copy(b.p).addScaledVector(b.right,side*13.2);world.add(g)}
for(let i=0;i<28;i++)banner(.018+i*.035,i%2?1:-1);

function palm(t,side,s=.9){const b=basisAt(t),g=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.23,5.5,10),new THREE.MeshStandardMaterial({color:0x7f5b39,roughness:.9}));trunk.position.y=2.75;g.add(trunk);for(let i=0;i<8;i++){const leaf=new THREE.Mesh(new THREE.CapsuleGeometry(.13,2.5,4,8),new THREE.MeshStandardMaterial({color:0x238d50,roughness:.82}));leaf.position.y=5.7;leaf.rotation.z=Math.PI/2.7;leaf.rotation.y=i*Math.PI/4;leaf.translateX(1.45);g.add(leaf)}g.position.copy(b.p).addScaledVector(b.right,side*(15+Math.random()*9));g.scale.setScalar(s);world.add(g)}
for(let i=0;i<78;i++)palm((i+2)/82,i%2?1:-1,.55+Math.random()*.55);

const mountainMat=new THREE.MeshStandardMaterial({color:0x527a9c,roughness:1});
for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(28+Math.random()*28,48+Math.random()*48,7),mountainMat);m.position.set(-270+i*34,-2,-270-Math.random()*500);m.rotation.y=Math.random()*Math.PI;world.add(m)}
const cityMat=new THREE.MeshPhysicalMaterial({color:0xd9e5ee,roughness:.62,metalness:.04});
for(let i=0;i<44;i++){const h=10+Math.random()*30,w=4+Math.random()*8;const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w*.78),cityMat);b.position.set(95+Math.random()*150,h/2-3,-180-Math.random()*560);world.add(b)}
const cloudTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,8,64,64,60);g.addColorStop(0,'rgba(255,255,255,.92)');g.addColorStop(.55,'rgba(255,255,255,.66)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
for(let i=0;i<30;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,transparent:true,depthWrite:false,opacity:.8}));s.scale.set(28+Math.random()*35,12+Math.random()*14,1);s.position.set(-260+Math.random()*520,55+Math.random()*45,-110-Math.random()*760);world.add(s)}

const pickupMat=new THREE.MeshPhysicalMaterial({color:0x50e1ff,emissive:0x1e9ec4,emissiveIntensity:2.2,roughness:.08,metalness:.15,clearcoat:.9}),pickups=[];
for(let i=0;i<14;i++){const t=.08+i*.061,b=basisAt(t),mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.92),pickupMat),lane=[-4.2,0,4.2][i%3];mesh.castShadow=true;mesh.position.copy(b.p).addScaledVector(b.right,lane).addScaledVector(b.normal,1.15);world.add(mesh);pickups.push({mesh,t,lane,taken:false})}

const particleGeo=new THREE.SphereGeometry(.1,7,5),particles=[];
function burst(pos,color,count=22,spread=5){const mat=new THREE.MeshBasicMaterial({color,transparent:true,toneMapped:false});for(let i=0;i<count;i++){const m=new THREE.Mesh(particleGeo,mat);m.position.copy(pos);world.add(m);particles.push({m,v:new THREE.Vector3((Math.random()-.5)*spread,Math.random()*3,(Math.random()-.5)*spread),life:.7+Math.random()*.5})}}
const speedFx=new THREE.Group();camera.add(speedFx);scene.add(camera);const streakMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthTest:false,toneMapped:false}),streaks=[];
for(let i=0;i<60;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.011,.011,2.6+Math.random()*4),streakMat);s.position.set((Math.random()-.5)*9,(Math.random()-.5)*5,-4-Math.random()*22);speedFx.add(s);streaks.push(s)}

const loader=new GLTFLoader();
const CAR_URL='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/GLB/CarConcept.glb';
const FALLBACK_URL='https://raw.githubusercontent.com/Arslan12216775/kenney_car-kit/master/Models/GLB%20format/race.glb';
const colors=[0x0877ff,0x7d3cff,0x00a9c4,0x161b22,0xe83e4d,0xf0a51d];
let player,ais=[];
function tintCar(root,index){const tint=new THREE.Color(colors[index%colors.length]);root.traverse(o=>{const n=(o.name||'').toLowerCase();if(n.includes('khronos')||n.includes('logo')){o.visible=false;return}if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];const replaced=mats.map(mat=>{if(!mat)return mat;const m=mat.clone();const mn=(m.name||'').toLowerCase();const glass=mn.includes('glass')||m.transmission>0.05||m.transparent;const tire=mn.includes('tire')||mn.includes('tyre')||mn.includes('rubber');const chrome=mn.includes('chrome')||mn.includes('metal')||m.metalness>.8;if(!glass&&!tire&&!chrome&&m.color){const bright=m.color.r+m.color.g+m.color.b;if((m.clearcoat||0)>.15||mn.includes('paint')||mn.includes('body')||bright>1.05)m.color.lerp(tint,.72)}return m});o.material=Array.isArray(o.material)?replaced:replaced[0]});return root}
function normalizeCar(root,index){const wrapper=new THREE.Group();const car=tintCar(root,index);car.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(car),size=box.getSize(new THREE.Vector3());const scale=5.05/Math.max(size.x,size.z);car.scale.setScalar(scale);car.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(car);const center=box.getCenter(new THREE.Vector3());car.position.x-=center.x;car.position.z-=center.z;car.position.y-=box.min.y;car.rotation.y=Math.PI;wrapper.add(car);wrapper.userData.model=car;return wrapper}
async function loadBaseCar(){try{return (await new Promise((res,rej)=>loader.load(CAR_URL,g=>res(g.scene),undefined,rej)))}catch(e){console.warn('Primary PBR car failed, using fallback',e);return await new Promise((res,rej)=>loader.load(FALLBACK_URL,g=>res(g.scene),undefined,rej))}}
async function loadCars(){const base=await loadBaseCar();player=normalizeCar(SkeletonUtils.clone(base),0);world.add(player);ais=[];for(let i=1;i<6;i++){const mesh=normalizeCar(SkeletonUtils.clone(base),i);world.add(mesh);ais.push({mesh,t:.015+(i-1)*.009,lane:[-4,3,-1.5,4,-3][i-1],pace:.047+Math.random()*.005,stun:0,spin:0,speedScale:1,phase:i*1.7})}}

let running=false,targetLane=0,lane=0,playerT=0,boost=0,currentItem=null,last=performance.now(),dragging=false,dragX=0,dragLane=0,missiles=[],mines=[],shake=0,raceTime=0,throttle=0,accelerating=false,braking=false,leftHeld=false,rightHeld=false;
function showMsg(s){msgEl.textContent=s;msgEl.classList.add('show');clearTimeout(showMsg.t);showMsg.t=setTimeout(()=>msgEl.classList.remove('show'),800)}
function setItem(v){currentItem=v;itemBtn.disabled=!v||!running;itemBtn.textContent=v==='rocket'?'🚀':v==='boost'?'⚡':v==='mine'?'💣':'?'}
function placeCar(mesh,t,laneValue){const b=basisAt(t),p=b.p.clone().addScaledVector(b.right,laneValue).addScaledVector(b.normal,.13);mesh.position.copy(p);mesh.rotation.y=Math.atan2(b.tangent.x,b.tangent.z);mesh.rotation.z=-Math.asin(THREE.MathUtils.clamp(b.tangent.y,-1,1))*.35}
function reset(){playerT=0;lane=targetLane=0;boost=0;raceTime=0;throttle=0;accelerating=false;braking=false;leftHeld=false;rightHeld=false;shake=0;setItem(null);pickups.forEach(p=>{p.taken=false;p.mesh.visible=true});ais.forEach((a,i)=>{a.t=.015+i*.009;a.stun=0;a.spin=0;a.speedScale=1});missiles.forEach(x=>world.remove(x.mesh));missiles=[];mines.forEach(x=>world.remove(x.mesh));mines=[];running=true;menu.style.display='none';showMsg('HOLD TO ACCELERATE')}
function useItem(){if(!running||!currentItem)return;const item=currentItem;setItem(null);if(item==='boost'){boost=1.7;showMsg('TURBO!');burst(player.position,0x55dfff,30,6)}else if(item==='mine'){const b=basisAt(playerT),m=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.22,18),new THREE.MeshStandardMaterial({color:0xe44343,emissive:0x5f0909,emissiveIntensity:1.5}));m.position.copy(b.p).addScaledVector(b.right,lane).addScaledVector(b.normal,.18);world.add(m);mines.push({mesh:m,t:playerT,lane,life:14});showMsg('MINE DROPPED')}else{const target=ais.filter(a=>a.t>playerT).sort((a,b)=>a.t-b.t)[0];if(!target){showMsg('NO TARGET');return}const m=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.62,4,8),new THREE.MeshStandardMaterial({color:0xffcc3d,emissive:0xff5a00,emissiveIntensity:2.6}));m.rotation.x=Math.PI/2;m.position.copy(player.position);world.add(m);missiles.push({mesh:m,target,life:3});showMsg('ROCKET!')}}
itemBtn.addEventListener('click',e=>{e.stopPropagation();useItem()});playBtn.addEventListener('click',reset);
renderer.domElement.addEventListener('pointerdown',e=>{if(!running)return;dragging=true;accelerating=true;braking=false;dragX=e.clientX;dragLane=targetLane;renderer.domElement.setPointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;targetLane=THREE.MathUtils.clamp(dragLane+(e.clientX-dragX)/Math.max(innerWidth,300)*16,-5.2,5.2)});
const endPointer=()=>{dragging=false;accelerating=false};renderer.domElement.addEventListener('pointerup',endPointer);renderer.domElement.addEventListener('pointercancel',endPointer);
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)||['KeyW','KeyA','KeyS','KeyD'].includes(e.code))e.preventDefault();if(e.code==='ArrowUp'||e.code==='KeyW')accelerating=true;if(e.code==='ArrowDown'||e.code==='KeyS')braking=true;if(e.code==='ArrowLeft'||e.code==='KeyA')leftHeld=true;if(e.code==='ArrowRight'||e.code==='KeyD')rightHeld=true;if(e.code==='Space'&&!e.repeat)useItem()},{passive:false});
window.addEventListener('keyup',e=>{if(e.code==='ArrowUp'||e.code==='KeyW')accelerating=false;if(e.code==='ArrowDown'||e.code==='KeyS')braking=false;if(e.code==='ArrowLeft'||e.code==='KeyA')leftHeld=false;if(e.code==='ArrowRight'||e.code==='KeyD')rightHeld=false});
window.addEventListener('blur',()=>{accelerating=false;braking=false;leftHeld=false;rightHeld=false;dragging=false});

function update(dt){raceTime+=dt;if(leftHeld)targetLane=Math.max(-5.2,targetLane-dt*7.2);if(rightHeld)targetLane=Math.min(5.2,targetLane+dt*7.2);if(accelerating)throttle=Math.min(1,throttle+dt/5);else if(braking)throttle=Math.max(0,throttle-dt*.48);else throttle=Math.max(0,throttle-dt*.12);const launch=throttle*throttle*(3-2*throttle),aiRaw=THREE.MathUtils.clamp(raceTime/5,0,1),aiLaunch=aiRaw*aiRaw*(3-2*aiRaw),speedMul=boost>0?1.22:1;if(boost>0)boost-=dt;const playerPace=THREE.MathUtils.lerp(.004,.055,launch)*speedMul;playerT=Math.min(1,playerT+dt*playerPace);lane+=(targetLane-lane)*Math.min(1,dt*16);placeCar(player,playerT,lane);const turnAmount=THREE.MathUtils.clamp((targetLane-lane)*2.1,-1,1),trackRoll=-Math.asin(THREE.MathUtils.clamp(basisAt(playerT).tangent.y,-1,1))*.35;player.rotation.z+=(trackRoll-turnAmount*.17-player.rotation.z)*Math.min(1,dt*13);
ais.forEach(a=>{if(a.speedScale<1)a.speedScale=Math.min(1,a.speedScale+dt*.4);const impact=a.stun>0?.72:1,aiPace=THREE.MathUtils.lerp(a.pace*.38,a.pace,aiLaunch);a.t=Math.min(1,a.t+dt*aiPace*a.speedScale*impact);if(a.stun>0){a.stun-=dt;a.spin+=dt*10}const aiLane=a.lane+Math.sin(a.t*80+a.phase)*1.05;placeCar(a.mesh,a.t,aiLane);if(a.stun>0)a.mesh.rotation.y+=a.spin});
pickups.forEach(p=>{p.mesh.rotation.x+=dt*2.5;p.mesh.rotation.y+=dt*3.5;if(!p.taken&&Math.abs(p.t-playerT)<.018&&Math.abs(p.lane-lane)<1.8){p.taken=true;p.mesh.visible=false;if(!currentItem){const r=Math.random();setItem(r<.47?'rocket':r<.75?'boost':'mine');showMsg('ITEM READY');burst(player.position,0x65e6ff,18,3)}}});
missiles.forEach(m=>{m.life-=dt;const tp=m.target.mesh.position;m.mesh.position.lerp(tp,.32);const dir=tp.clone().sub(m.mesh.position).normalize();m.mesh.position.addScaledVector(dir,dt*260);m.mesh.rotation.z+=dt*22;if(m.mesh.position.distanceTo(tp)<2.6){m.target.stun=1.2;m.target.speedScale=Math.min(m.target.speedScale,.18);m.life=0;shake=.55;showMsg('DIRECT HIT!');burst(tp,0xffb532,34,7)}});for(let i=missiles.length-1;i>=0;i--)if(missiles[i].life<=0){world.remove(missiles[i].mesh);missiles.splice(i,1)}
mines.forEach(m=>{m.life-=dt;ais.forEach(a=>{if(m.life>0&&Math.abs(a.t-m.t)<.018&&Math.abs(a.lane-m.lane)<2){a.stun=1.1;a.speedScale=Math.min(a.speedScale,.28);m.life=0;burst(m.mesh.position,0xff5a44,28,6)}})});for(let i=mines.length-1;i>=0;i--)if(mines[i].life<=0){world.remove(mines[i].mesh);mines.splice(i,1)}
particles.forEach(p=>{p.life-=dt;p.m.position.addScaledVector(p.v,dt);p.v.y-=4.8*dt;p.m.material.opacity=Math.max(0,p.life/.8)});for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0){world.remove(particles[i].m);particles.splice(i,1)}
const visualSpeed=THREE.MathUtils.lerp(0,345,launch)*speedMul;speedEl.textContent=Math.round(visualSpeed);rankEl.textContent=[playerT,...ais.map(a=>a.t)].sort((a,b)=>b-a).indexOf(playerT)+1;progressEl.style.width=(playerT*100).toFixed(1)+'%';const b=basisAt(playerT),cameraDistance=THREE.MathUtils.lerp(8.6,10.7,launch),cameraHeight=THREE.MathUtils.lerp(5.1,6.5,launch),behind=b.p.clone().addScaledVector(b.tangent,-cameraDistance).addScaledVector(b.normal,cameraHeight).addScaledVector(b.right,lane*.065),roadBuzz=.022*launch+(boost>0?.03:0);behind.x+=(Math.random()-.5)*roadBuzz;behind.y+=(Math.random()-.5)*roadBuzz;if(shake>0){behind.x+=(Math.random()-.5)*shake;behind.y+=(Math.random()-.5)*shake;shake=Math.max(0,shake-dt*1.9)}camera.position.lerp(behind,1-Math.pow(.000018,dt));camera.lookAt(b.p.clone().addScaledVector(b.tangent,THREE.MathUtils.lerp(32,46,launch)).addScaledVector(b.normal,.85));const targetFov=THREE.MathUtils.lerp(74,86,launch)+(boost>0?6:0);camera.fov+=(targetFov-camera.fov)*dt*9;camera.updateProjectionMatrix();streakMat.opacity=.015+.16*launch+(boost>0?.08:0);streaks.forEach(s=>{s.position.z+=dt*(16+visualSpeed*.15);if(s.position.z>-1){s.position.z=-24-Math.random()*12;s.position.x=(Math.random()-.5)*9;s.position.y=(Math.random()-.5)*5}});if(playerT>=1){running=false;accelerating=false;braking=false;leftHeld=false;rightHeld=false;setItem(null);const final=[playerT,...ais.map(a=>a.t)].sort((a,b)=>b-a).indexOf(playerT)+1;document.querySelector('.title').innerHTML=final===1?'VICTORY!':'FINISHED '+final+'/6';document.querySelector('.subtitle').textContent=final===1?'First place. Smart item timing and clean lines won the race.':'Use pickups more aggressively and save turbo for overtakes.';playBtn.textContent='RACE AGAIN';menu.style.display='flex'}}

function animate(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(running)update(dt);else if(player){player.rotation.y+=dt*.08;streakMat.opacity=.01}composer.render();requestAnimationFrame(animate)}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
(async()=>{try{loadingEl.textContent='Loading high-detail PBR vehicles…';await loadCars();placeCar(player,0,0);ais.forEach(a=>placeCar(a.mesh,a.t,a.lane));const b=basisAt(0);camera.position.copy(b.p).addScaledVector(b.tangent,-8.6).addScaledVector(b.normal,5.1);camera.lookAt(b.p.clone().addScaledVector(b.tangent,32));playBtn.disabled=false;playBtn.textContent='START RACE';loadingEl.textContent='Ready'}catch(err){console.error(err);loadingEl.textContent='Could not load vehicle assets. Check internet access.';playBtn.textContent='ASSET LOAD FAILED'}})();
requestAnimationFrame(animate);
