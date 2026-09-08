// Velocity Rivals persistent progression + garage system.
// Data is intentionally local-first so the game works on static GitHub Pages.
const STORAGE_KEY = 'velocity-rivals-progress-v1';

const CARS = [
  { id:'apex', name:'Apex S1', unlock:1, price:0, color:0x0877ff, speed:1.000, accel:1.000, handling:1.000, armor:1.000, boost:1.000 },
  { id:'volt', name:'Volt RS', unlock:2, price:900, color:0x7138ff, speed:1.015, accel:1.050, handling:1.020, armor:0.990, boost:1.050 },
  { id:'driftline', name:'Driftline GT', unlock:4, price:1600, color:0x18b5d0, speed:1.025, accel:1.025, handling:1.080, armor:0.990, boost:1.020 },
  { id:'iron', name:'Iron V8', unlock:6, price:2400, color:0x272d37, speed:1.030, accel:0.990, handling:0.965, armor:1.120, boost:1.000 },
  { id:'nova', name:'Nova X', unlock:8, price:3500, color:0xf13d4e, speed:1.050, accel:1.080, handling:1.040, armor:0.970, boost:1.080 },
  { id:'tempest', name:'Tempest R', unlock:11, price:5000, color:0xf1a51f, speed:1.060, accel:1.055, handling:1.080, armor:1.025, boost:1.070 },
  { id:'phantom', name:'Phantom ZX', unlock:15, price:7500, color:0x20c66f, speed:1.075, accel:1.090, handling:1.065, armor:1.055, boost:1.100 },
  { id:'velocity-one', name:'Velocity One', unlock:20, price:12000, color:0xff6b24, speed:1.090, accel:1.100, handling:1.090, armor:1.080, boost:1.120 }
];

const PAINTS = [
  { id:'factory', name:'Factory', price:0, color:null },
  { id:'midnight', name:'Midnight', price:250, color:0x11151d },
  { id:'arctic', name:'Arctic', price:300, color:0xe9f4ff },
  { id:'crimson', name:'Crimson', price:350, color:0xe52d45 },
  { id:'electric', name:'Electric', price:400, color:0x16a7ff },
  { id:'gold', name:'Gold', price:650, color:0xf4b525 }
];

const DEFAULT_STATE = {
  version: 1,
  coins: 400,
  xp: 0,
  trophies: 0,
  streak: 0,
  race: 1,
  totalRaces: 0,
  selectedCar: 'apex',
  ownedCars: ['apex'],
  upgrades: { apex: { engine:0, tires:0, armor:0, nitro:0 } },
  ownedPaints: ['factory'],
  selectedPaint: 'factory',
  stars: {},
  daily: null
};

function cloneDefault() { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    const parsed = JSON.parse(raw);
    return {
      ...cloneDefault(),
      ...parsed,
      ownedCars: Array.isArray(parsed.ownedCars) ? parsed.ownedCars : ['apex'],
      ownedPaints: Array.isArray(parsed.ownedPaints) ? parsed.ownedPaints : ['factory'],
      upgrades: parsed.upgrades || { apex:{engine:0,tires:0,armor:0,nitro:0} },
      stars: parsed.stars || {}
    };
  } catch { return cloneDefault(); }
}
let state = loadState();
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function playerLevel() { return 1 + Math.floor(state.xp / 350); }
function selectedCar() { return CARS.find(c => c.id === state.selectedCar) || CARS[0]; }
function upgradesFor(id = state.selectedCar) {
  if (!state.upgrades[id]) state.upgrades[id] = { engine:0, tires:0, armor:0, nitro:0 };
  return state.upgrades[id];
}
function selectedPaint() { return PAINTS.find(p => p.id === state.selectedPaint) || PAINTS[0]; }
function carColor() {
  const paint = selectedPaint();
  return paint.color == null ? selectedCar().color : paint.color;
}
function getMods() {
  const car = selectedCar();
  const up = upgradesFor();
  return {
    speed: car.speed + up.engine * 0.008,
    acceleration: car.accel + up.engine * 0.018,
    handling: car.handling + up.tires * 0.025,
    armor: car.armor + up.armor * 0.035,
    boost: car.boost + up.nitro * 0.025,
    boostDuration: 1 + up.nitro * 0.06
  };
}
function raceDifficulty() {
  const levelPressure = Math.min(0.085, Math.max(0, state.race - 1) * 0.006);
  return 1 + levelPressure + (state.race % 5 === 0 ? 0.025 : 0);
}
function rankName(trophies = state.trophies) {
  if (trophies >= 1800) return 'VELOCITY ELITE';
  if (trophies >= 1200) return 'DIAMOND';
  if (trophies >= 800) return 'PLATINUM';
  if (trophies >= 450) return 'GOLD';
  if (trophies >= 200) return 'SILVER';
  return 'BRONZE';
}

function localDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dailySpec() {
  const key = localDateKey();
  const n = [...key].reduce((a,c) => a + c.charCodeAt(0), 0) % 4;
  return [
    { type:'top3', label:'Finish in the Top 3', target:1, reward:400 },
    { type:'pickups', label:'Collect 5 pickups', target:5, reward:350 },
    { type:'hits', label:'Land 2 combat hits', target:2, reward:450 },
    { type:'win', label:'Win a race', target:1, reward:500 }
  ][n];
}
function ensureDaily() {
  const date = localDateKey();
  const spec = dailySpec();
  if (!state.daily || state.daily.date !== date || state.daily.type !== spec.type) {
    state.daily = { date, type:spec.type, progress:0, claimed:false };
    save();
  }
  return { ...spec, ...state.daily };
}
ensureDaily();

let raceStats = null;
let boundPlayer = null;
let lastReward = null;
let previousRank = 8;

function startRace() {
  raceStats = { overtakes:0, pickups:0, hits:0, contact:false, startRace:state.race };
  previousRank = 8;
  clearRewardSummary();
  refreshUI();
}
function event(type, amount = 1) {
  if (!raceStats) return;
  if (type === 'pickup') raceStats.pickups += amount;
  else if (type === 'hit') raceStats.hits += amount;
  else if (type === 'overtake') raceStats.overtakes += amount;
  else if (type === 'contact') raceStats.contact = true;
}
function updateDailyFromRace(final, stats) {
  const daily = ensureDaily();
  if (state.daily.claimed) return 0;
  if (daily.type === 'top3' && final <= 3) state.daily.progress = Math.max(state.daily.progress, 1);
  if (daily.type === 'win' && final === 1) state.daily.progress = Math.max(state.daily.progress, 1);
  if (daily.type === 'pickups') state.daily.progress += stats.pickups;
  if (daily.type === 'hits') state.daily.progress += stats.hits;
  state.daily.progress = Math.min(daily.target, state.daily.progress);
  if (state.daily.progress >= daily.target) {
    state.daily.claimed = true;
    state.coins += daily.reward;
    return daily.reward;
  }
  return 0;
}
function finishRace(final) {
  if (!raceStats) raceStats = { overtakes:0, pickups:0, hits:0, contact:false, startRace:state.race };
  const finishedRace = raceStats.startRace || state.race;
  const placementCoins = [150,110,85,65,55,45,40,35][Math.max(0, Math.min(7, final-1))];
  const placementXp = [220,190,170,150,140,130,120,110][Math.max(0, Math.min(7, final-1))];
  const cleanBonus = raceStats.contact ? 0 : 25;
  const activityCoins = raceStats.overtakes * 5 + raceStats.hits * 10 + raceStats.pickups * 2;
  const championship = finishedRace % 5 === 0;
  const championshipBonus = championship && final <= 3 ? 250 : 0;
  if (final <= 3) state.streak = Math.min(99, state.streak + 1); else state.streak = 0;
  const streakMultiplier = 1 + Math.min(5, state.streak) * 0.10;
  const earnedCoins = Math.round((placementCoins + cleanBonus + activityCoins + championshipBonus) * streakMultiplier);
  const earnedXp = placementXp + raceStats.overtakes * 4 + raceStats.hits * 8 + raceStats.pickups * 2;
  const trophyDelta = [30,22,16,8,4,0,-6,-10][Math.max(0, Math.min(7, final-1))];
  const stars = final === 1 ? 3 : final <= 3 ? 2 : 1;

  state.coins += earnedCoins;
  state.xp += earnedXp;
  state.trophies = Math.max(0, state.trophies + trophyDelta);
  state.stars[finishedRace] = Math.max(state.stars[finishedRace] || 0, stars);
  state.totalRaces += 1;
  const dailyReward = updateDailyFromRace(final, raceStats);
  state.race = finishedRace + 1;

  lastReward = { final, earnedCoins, earnedXp, trophyDelta, stars, championship, championshipBonus, dailyReward, ...raceStats };
  raceStats = null;
  save();
  refreshUI();
  setTimeout(renderRewardSummary, 30);
}

function upgradeCost(type) {
  const carIndex = Math.max(0, CARS.findIndex(c => c.id === state.selectedCar));
  const level = upgradesFor()[type] || 0;
  return Math.round(240 * (1 + carIndex * 0.32) * Math.pow(level + 1, 1.42) / 10) * 10;
}

function applyPlayerPaint() {
  if (!boundPlayer) return;
  const c = carColor();
  boundPlayer.traverse?.(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m?.userData?.vrPaint && m.color) {
        m.color.setHex(c);
        m.needsUpdate = true;
      }
    }
  });
}
function bindPlayer(player) { boundPlayer = player; applyPlayerPaint(); }

function purchaseOrSelectCar(id) {
  const car = CARS.find(c => c.id === id);
  if (!car) return;
  if (playerLevel() < car.unlock) return;
  if (!state.ownedCars.includes(id)) {
    if (state.coins < car.price) return;
    state.coins -= car.price;
    state.ownedCars.push(id);
  }
  state.selectedCar = id;
  upgradesFor(id);
  state.selectedPaint = 'factory';
  save();
  applyPlayerPaint();
  refreshUI();
  renderGarage();
}
function buyUpgrade(type) {
  const up = upgradesFor();
  if (!(type in up) || up[type] >= 5) return;
  const cost = upgradeCost(type);
  if (state.coins < cost) return;
  state.coins -= cost;
  up[type] += 1;
  save();
  refreshUI();
  renderGarage();
}
function buyOrSelectPaint(id) {
  const paint = PAINTS.find(p => p.id === id);
  if (!paint) return;
  if (!state.ownedPaints.includes(id)) {
    if (state.coins < paint.price) return;
    state.coins -= paint.price;
    state.ownedPaints.push(id);
  }
  state.selectedPaint = id;
  save();
  applyPlayerPaint();
  refreshUI();
  renderGarage();
}

window.VRProgress = {
  get state(){ return state; },
  getMods,
  getCarColor: carColor,
  getRaceDifficulty: raceDifficulty,
  startRace,
  event,
  finishRace,
  bindPlayer,
  refreshUI
};

function injectStyles() {
  if (document.getElementById('vr-progress-style')) return;
  const style = document.createElement('style');
  style.id = 'vr-progress-style';
  style.textContent = `
  .panel{max-height:90vh;overflow:auto}
  #vr-profile{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0 12px}
  .vr-chip{padding:8px 5px;border-radius:12px;background:rgba(2,25,60,.45);border:1px solid rgba(255,255,255,.15);font-size:10px;font-weight:900}
  .vr-chip b{display:block;font-size:15px;margin-top:2px}
  #vr-daily{padding:10px 12px;margin:0 0 8px;text-align:left;border-radius:14px;background:linear-gradient(135deg,rgba(14,105,198,.58),rgba(9,43,94,.64));border:1px solid rgba(255,255,255,.18)}
  #vr-daily strong{font-size:11px;letter-spacing:.06em}#vr-roadmap{display:flex;align-items:center;justify-content:center;gap:5px;margin:0 0 12px}.vr-node{min-width:38px;padding:6px 5px;border-radius:10px;background:rgba(2,25,60,.45);border:1px solid rgba(255,255,255,.13);font-size:9px;font-weight:900;text-align:center}.vr-node.current{outline:2px solid #5ddcff}.vr-node.champ{background:rgba(255,194,54,.17)}.vr-node .s{display:block;color:#ffd43b;font-size:10px;letter-spacing:-1px;margin-top:2px}.vr-daily-row{display:flex;justify-content:space-between;gap:8px;margin-top:4px;font-size:11px}.vr-daily-bar{height:5px;background:rgba(255,255,255,.16);border-radius:8px;overflow:hidden;margin-top:7px}.vr-daily-bar i{display:block;height:100%;background:#74e65d;border-radius:8px}
  #vr-reward{margin-top:12px;padding:12px;border-radius:15px;background:rgba(4,27,64,.72);border:1px solid rgba(255,255,255,.2);text-align:left;font-size:11px;line-height:1.5}
  #vr-reward .vr-big{font-size:17px;font-weight:1000;color:#fff}.vr-stars{color:#ffd43b;letter-spacing:2px;font-size:17px}
  #garage{cursor:pointer!important;opacity:1!important;color:#fff!important;background:rgba(6,42,93,.66)!important}
  #vr-garage-overlay{position:fixed;inset:0;z-index:4500;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,15,35,.72);backdrop-filter:blur(9px)}
  #vr-garage-overlay.open{display:flex}
  .vr-garage{width:min(960px,96vw);max-height:92vh;overflow:auto;color:#fff;border-radius:24px;padding:18px;background:linear-gradient(155deg,#123c70,#071d3e);box-shadow:0 30px 90px rgba(0,0,0,.48);border:1px solid rgba(255,255,255,.22)}
  .vr-garage-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.vr-garage-head h2{margin:0;font-size:25px}.vr-close{border:0;width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.12);color:#fff;font-size:20px;cursor:pointer}
  .vr-car-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.vr-car{padding:12px;border-radius:17px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);cursor:pointer;text-align:left}.vr-car.selected{outline:2px solid #5ddcff;background:rgba(38,145,232,.16)}.vr-car.locked{opacity:.56}.vr-swatch{height:48px;border-radius:12px;margin-bottom:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.35)}.vr-car h3{font-size:13px;margin:0 0 4px}.vr-car small{font-size:10px;opacity:.75}.vr-car .vr-price{font-size:11px;font-weight:900;margin-top:7px}
  .vr-garage-lower{display:grid;grid-template-columns:1.1fr .9fr;gap:12px;margin-top:14px}.vr-box{padding:13px;border-radius:17px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13)}.vr-box h3{margin:0 0 10px;font-size:14px}.vr-stat{display:grid;grid-template-columns:74px 1fr 38px;align-items:center;gap:7px;font-size:10px;margin:6px 0}.vr-statbar{height:7px;border-radius:8px;background:rgba(255,255,255,.12);overflow:hidden}.vr-statbar i{height:100%;display:block;background:#5cd9ff;border-radius:8px}
  .vr-upgrade{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid rgba(255,255,255,.08);font-size:11px}.vr-upgrade:first-of-type{border-top:0}.vr-upgrade button,.vr-action{border:0;border-radius:10px;padding:7px 9px;font-weight:900;background:#fff;color:#082858;cursor:pointer}.vr-upgrade button:disabled,.vr-action:disabled{opacity:.42;cursor:default}
  .vr-paints{display:flex;flex-wrap:wrap;gap:7px}.vr-paint{width:38px;height:38px;border-radius:12px;border:2px solid rgba(255,255,255,.22);cursor:pointer;position:relative}.vr-paint.selected{outline:2px solid #fff;outline-offset:2px}.vr-paint.locked:after{content:'🪙';position:absolute;inset:auto -4px -7px auto;font-size:11px;background:#092957;border-radius:7px;padding:1px 3px}
  .vr-rankline{font-size:11px;opacity:.82;margin-top:5px}
  @media(max-width:720px){#vr-profile{grid-template-columns:repeat(2,1fr)}.vr-car-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.vr-garage-lower{grid-template-columns:1fr}.vr-garage{padding:13px}.vr-swatch{height:38px}}
  `;
  document.head.appendChild(style);
}

function setupUI() {
  injectStyles();
  const panel = document.querySelector('#menu .panel');
  const subtitle = panel?.querySelector('.subtitle');
  const play = document.getElementById('play');
  const garage = document.getElementById('garage');
  if (panel && subtitle && !document.getElementById('vr-profile')) {
    subtitle.insertAdjacentHTML('afterend', `<div id="vr-profile"></div><div id="vr-daily"></div><div id="vr-roadmap"></div>`);
  }
  if (garage) {
    garage.disabled = false;
    garage.removeAttribute('title');
    garage.addEventListener('click', openGarage);
  }
  if (!document.getElementById('vr-garage-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'vr-garage-overlay';
    overlay.innerHTML = `<div class="vr-garage"><div class="vr-garage-head"><div><h2>GARAGE</h2><div class="vr-rankline" id="vr-garage-wallet"></div></div><button class="vr-close" aria-label="Close garage">×</button></div><div id="vr-garage-content"></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.vr-close').addEventListener('click', closeGarage);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeGarage(); });
  }
  play?.addEventListener('click', () => { clearRewardSummary(); });
  setupObservers();
  refreshUI();
}

function refreshUI() {
  const coins = state.coins.toLocaleString();
  const level = playerLevel();
  const profile = document.getElementById('vr-profile');
  if (profile) profile.innerHTML = `
    <div class="vr-chip">COINS<b>🪙 ${coins}</b></div>
    <div class="vr-chip">DRIVER<b>LV ${level}</b></div>
    <div class="vr-chip">RANK<b>${rankName()}</b></div>
    <div class="vr-chip">STREAK<b>🔥 ×${Math.min(state.streak,5)}</b></div>`;

  const right = document.querySelector('.rightHud');
  if (right) {
    const resources = [...right.querySelectorAll('.resource')];
    if (resources[0]) resources[0].innerHTML = `<span class="icon">🪙</span><b>${coins}</b>`;
    if (resources[1]) resources[1].innerHTML = `<span class="icon">🏆</span><b>${state.trophies}</b>`;
    if (resources[2]) resources[2].innerHTML = `<span class="icon">🔥</span><b>×${Math.min(state.streak,5)}</b>`;
  }

  const raceLabel = document.querySelector('.level');
  if (raceLabel) raceLabel.textContent = state.race % 5 === 0 ? `CHAMPIONSHIP ${state.race}` : `LEVEL ${state.race}`;
  const roadmap = document.getElementById('vr-roadmap');
  if (roadmap) {
    const cycleStart = Math.floor((state.race - 1) / 5) * 5 + 1;
    roadmap.innerHTML = Array.from({ length:5 }, (_,i) => {
      const r = cycleStart + i;
      const stars = state.stars[r] || 0;
      const current = r === state.race ? ' current' : '';
      const champ = r % 5 === 0 ? ' champ' : '';
      return `<div class="vr-node${current}${champ}">${r % 5 === 0 ? '🏁 ' : ''}${r}<span class="s">${stars ? '★'.repeat(stars) : '· · ·'}</span></div>`;
    }).join('');
  }
  const dailyEl = document.getElementById('vr-daily');
  const daily = ensureDaily();
  if (dailyEl) {
    const pct = daily.claimed ? 100 : Math.min(100, daily.progress / daily.target * 100);
    dailyEl.innerHTML = `<strong>DAILY CHALLENGE</strong><div class="vr-daily-row"><span>${daily.label}</span><b>${daily.claimed ? 'COMPLETE' : `${daily.progress}/${daily.target}`}</b></div><div class="vr-daily-row"><span>${daily.claimed ? 'Reward claimed' : 'Reward'}</span><b>🪙 ${daily.reward}</b></div><div class="vr-daily-bar"><i style="width:${pct}%"></i></div>`;
  }
  const garage = document.getElementById('garage');
  if (garage) garage.textContent = `🏎️ GARAGE · ${state.ownedCars.length}/${CARS.length}`;
  if (document.getElementById('vr-garage-overlay')?.classList.contains('open')) renderGarage();
}

function statPct(v, min=.94, max=1.18) { return Math.max(7, Math.min(100, (v-min)/(max-min)*100)); }
function renderGarage() {
  const root = document.getElementById('vr-garage-content');
  if (!root) return;
  const level = playerLevel();
  const selected = selectedCar();
  const mods = getMods();
  const up = upgradesFor();
  const wallet = document.getElementById('vr-garage-wallet');
  if (wallet) wallet.textContent = `🪙 ${state.coins.toLocaleString()} · Driver Lv ${level} · ${rankName()} ${state.trophies} 🏆`;
  const cards = CARS.map(car => {
    const owned = state.ownedCars.includes(car.id);
    const unlocked = level >= car.unlock;
    const selectedNow = state.selectedCar === car.id;
    const color = `#${car.color.toString(16).padStart(6,'0')}`;
    let price = selectedNow ? 'SELECTED' : owned ? 'OWNED · SELECT' : unlocked ? `🪙 ${car.price.toLocaleString()}` : `UNLOCKS LV ${car.unlock}`;
    return `<button class="vr-car ${selectedNow?'selected':''} ${unlocked?'':'locked'}" data-car="${car.id}" ${unlocked?'':'disabled'}><div class="vr-swatch" style="background:linear-gradient(135deg,${color},#101722)"></div><h3>${car.name}</h3><small>SPD ${Math.round(car.speed*100)} · ACC ${Math.round(car.accel*100)} · HDL ${Math.round(car.handling*100)}</small><div class="vr-price">${price}</div></button>`;
  }).join('');

  const upgradeRow = (type,label) => {
    const lvl = up[type] || 0;
    const cost = upgradeCost(type);
    return `<div class="vr-upgrade"><span><b>${label}</b><br><small>Level ${lvl}/5</small></span><button data-upgrade="${type}" ${lvl>=5 || state.coins<cost ? 'disabled':''}>${lvl>=5?'MAX':`🪙 ${cost}`}</button></div>`;
  };

  const paints = PAINTS.map(p => {
    const owned = state.ownedPaints.includes(p.id);
    const selectedP = state.selectedPaint === p.id;
    const c = p.color == null ? selected.color : p.color;
    return `<button class="vr-paint ${selectedP?'selected':''} ${owned?'':'locked'}" data-paint="${p.id}" title="${p.name}${owned?'':` · ${p.price} coins`}" style="background:#${c.toString(16).padStart(6,'0')}"></button>`;
  }).join('');

  root.innerHTML = `<div class="vr-car-grid">${cards}</div><div class="vr-garage-lower"><div class="vr-box"><h3>${selected.name} · PERFORMANCE</h3>
    <div class="vr-stat"><span>Speed</span><div class="vr-statbar"><i style="width:${statPct(mods.speed)}%"></i></div><b>${Math.round(mods.speed*100)}</b></div>
    <div class="vr-stat"><span>Acceleration</span><div class="vr-statbar"><i style="width:${statPct(mods.acceleration)}%"></i></div><b>${Math.round(mods.acceleration*100)}</b></div>
    <div class="vr-stat"><span>Handling</span><div class="vr-statbar"><i style="width:${statPct(mods.handling)}%"></i></div><b>${Math.round(mods.handling*100)}</b></div>
    <div class="vr-stat"><span>Armor</span><div class="vr-statbar"><i style="width:${statPct(mods.armor)}%"></i></div><b>${Math.round(mods.armor*100)}</b></div>
    <div class="vr-stat"><span>Nitro</span><div class="vr-statbar"><i style="width:${statPct(mods.boost)}%"></i></div><b>${Math.round(mods.boost*100)}</b></div></div>
    <div class="vr-box"><h3>UPGRADES</h3>${upgradeRow('engine','ENGINE · speed + acceleration')}${upgradeRow('tires','TIRES · handling')}${upgradeRow('armor','ARMOR · collision resistance')}${upgradeRow('nitro','NITRO · stronger + longer turbo')}<h3 style="margin-top:12px">PAINT</h3><div class="vr-paints">${paints}</div></div></div>`;

  root.querySelectorAll('[data-car]').forEach(el => el.addEventListener('click', () => purchaseOrSelectCar(el.dataset.car)));
  root.querySelectorAll('[data-upgrade]').forEach(el => el.addEventListener('click', () => buyUpgrade(el.dataset.upgrade)));
  root.querySelectorAll('[data-paint]').forEach(el => el.addEventListener('click', () => buyOrSelectPaint(el.dataset.paint)));
}
function openGarage() { renderGarage(); document.getElementById('vr-garage-overlay')?.classList.add('open'); }
function closeGarage() { document.getElementById('vr-garage-overlay')?.classList.remove('open'); }

function clearRewardSummary() { document.getElementById('vr-reward')?.remove(); }
function renderRewardSummary() {
  if (!lastReward) return;
  const panel = document.querySelector('#menu .panel');
  if (!panel || document.getElementById('vr-reward')) return;
  const r = lastReward;
  const div = document.createElement('div');
  div.id = 'vr-reward';
  const trophyText = r.trophyDelta >= 0 ? `+${r.trophyDelta}` : `${r.trophyDelta}`;
  div.innerHTML = `<div class="vr-big">RACE REWARDS</div><div class="vr-stars">${'★'.repeat(r.stars)}${'☆'.repeat(3-r.stars)}</div><div>🪙 +${r.earnedCoins} coins · XP +${r.earnedXp} · 🏆 ${trophyText}</div><div>Overtakes ${r.overtakes} · Hits ${r.hits} · Pickups ${r.pickups}${r.contact?'':' · Clean +25'}</div>${r.championshipBonus?`<div>🏁 Championship bonus included: +${r.championshipBonus} base coins</div>`:''}${r.dailyReward?`<div>✅ Daily challenge complete: +${r.dailyReward} coins</div>`:''}<div>Next: ${state.race % 5 === 0 ? `CHAMPIONSHIP ${state.race}` : `LEVEL ${state.race}`} · ${rankName()} ${state.trophies} 🏆</div>`;
  const loading = document.getElementById('loading');
  panel.insertBefore(div, loading || null);
  const play = document.getElementById('play');
  if (play) play.textContent = state.race % 5 === 0 ? 'START CHAMPIONSHIP' : 'NEXT RACE';
}

let observersReady = false;
function setupObservers() {
  if (observersReady) return;
  observersReady = true;
  const rankEl = document.getElementById('rank');
  if (rankEl) new MutationObserver(() => {
    const rank = Number(rankEl.textContent) || 8;
    if (raceStats && rank < previousRank) event('overtake', previousRank-rank);
    previousRank = rank;
  }).observe(rankEl, { childList:true, characterData:true, subtree:true });
  const msg = document.getElementById('message');
  if (msg) new MutationObserver(() => {
    const t = msg.textContent || '';
    if (t.includes('CAR CONTACT') || t.includes('OBSTACLE HIT')) event('contact');
  }).observe(msg, { childList:true, characterData:true, subtree:true });
}

// Patch the already-layered main.js response without touching renderer-heavy code.
// This adds progression hooks and car stat multipliers while leaving main-loader
// free to apply its long-track / edge / finish optimizations afterward.
const inheritedFetch = window.fetch.bind(window);
let patchedMain = false;
function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) console.warn(`Velocity progression patch not found: ${label}`);
  return source.replace(from, to);
}
window.fetch = async function vrProgressFetch(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (patchedMain || !url.includes('main.js')) return inheritedFetch(input, init);
  patchedMain = true;
  const response = await inheritedFetch(input, init);
  if (!response.ok) return response;
  let source = await response.text();

  source = replaceOnce(source,
    `  if (source?.map) paint.map = source.map;\n  return paint;`,
    `  if (source?.map) paint.map = source.map;\n  paint.userData.vrPaint = true;\n  return paint;`,
    'paint tagging');
  source = replaceOnce(source,
    `  const tint = new THREE.Color(CAR_COLORS[index % CAR_COLORS.length]);`,
    `  const tint = new THREE.Color(index === 0 ? (window.VRProgress?.getCarColor?.() ?? CAR_COLORS[0]) : CAR_COLORS[index % CAR_COLORS.length]);`,
    'selected car paint');
  source = replaceOnce(source,
    `  world.add(player);\n  ais = [];`,
    `  world.add(player);\n  window.VRProgress?.bindPlayer?.(player);\n  ais = [];`,
    'bind player');
  source = replaceOnce(source,
    `function reset() {\n  playerT = 0;`,
    `function reset() {\n  window.VRProgress?.startRace?.();\n  playerT = 0;`,
    'race start hook');
  source = replaceOnce(source,
    `  throttle = Math.min(1, throttle + dt / 4.2);`,
    `  throttle = Math.min(1, throttle + dt * (window.VRProgress?.getMods?.().acceleration || 1) / 4.2);`,
    'engine acceleration');
  source = replaceOnce(source,
    `  const speedMul = (boost > 0 ? 1.22 : 1) * playerSpeedFactor;`,
    `  const vrMods = window.VRProgress?.getMods?.() || { speed:1, boost:1 };\n  const speedMul = (boost > 0 ? 1.22 * vrMods.boost : 1) * playerSpeedFactor * vrMods.speed;`,
    'car speed and nitro');
  source = replaceOnce(source,
    `  const turnRate = THREE.MathUtils.lerp(0.70, 1.18, launch);`,
    `  const turnRate = THREE.MathUtils.lerp(0.70, 1.18, launch) * (window.VRProgress?.getMods?.().handling || 1);`,
    'handling stat');
  source = replaceOnce(source,
    `    boost = 1.7;`,
    `    boost = 1.7 * (window.VRProgress?.getMods?.().boostDuration || 1);`,
    'nitro duration');
  source = replaceOnce(source,
    `      playerSpeedFactor = Math.min(playerSpeedFactor, 0.54);`,
    `      const vrArmor = window.VRProgress?.getMods?.().armor || 1;\n      playerSpeedFactor = Math.min(playerSpeedFactor, Math.min(0.76, 0.54 + Math.max(0, vrArmor - 1) * 0.72));`,
    'armor hazard resistance');
  source = replaceOnce(source,
    `      playerSpeedFactor = Math.min(playerSpeedFactor, 0.70);`,
    `      const vrArmorContact = window.VRProgress?.getMods?.().armor || 1;\n      playerSpeedFactor = Math.min(playerSpeedFactor, Math.min(0.86, 0.70 + Math.max(0, vrArmorContact - 1) * 0.62));`,
    'armor traffic resistance');
  source = replaceOnce(source,
    `    const aiPace = THREE.MathUtils.lerp(a.pace * 0.38, a.pace, aiLaunch);`,
    `    const aiPace = THREE.MathUtils.lerp(a.pace * 0.38, a.pace, aiLaunch) * (window.VRProgress?.getRaceDifficulty?.() || 1);`,
    'level difficulty');
  source = replaceOnce(source,
    `      p.taken = true;\n      p.mesh.visible = false;`,
    `      p.taken = true;\n      window.VRProgress?.event?.('pickup');\n      p.mesh.visible = false;`,
    'pickup stat');
  source = replaceOnce(source,
    `      showMsg('DIRECT HIT!');`,
    `      window.VRProgress?.event?.('hit');\n      showMsg('DIRECT HIT!');`,
    'missile hit stat');
  source = replaceOnce(source,
    `        a.speedScale = Math.min(a.speedScale, 0.28);\n        m.life = 0;`,
    `        a.speedScale = Math.min(a.speedScale, 0.28);\n        window.VRProgress?.event?.('hit');\n        m.life = 0;`,
    'mine hit stat');
  source = replaceOnce(source,
    `    document.querySelector('.title').innerHTML = final === 1 ? 'VICTORY!' : \`FINISHED \${final}/8\`;`,
    `    window.VRProgress?.finishRace?.(final);\n    document.querySelector('.title').innerHTML = final === 1 ? 'VICTORY!' : \`FINISHED \${final}/8\`;`,
    'finish rewards');

  return new Response(source, { status:response.status, statusText:response.statusText, headers:response.headers });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupUI, { once:true });
else setupUI();
