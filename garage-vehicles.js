// Velocity Rivals Garage vehicle artwork.
// Lightweight original SVG renders keep the garage visual without loading extra 3D assets.
const CAR_META = {
  apex: { name:'Apex S1', color:'#0877ff', type:'coupe' },
  volt: { name:'Volt RS', color:'#7138ff', type:'ev' },
  driftline: { name:'Driftline GT', color:'#18b5d0', type:'tuner' },
  iron: { name:'Iron V8', color:'#272d37', type:'muscle' },
  nova: { name:'Nova X', color:'#f13d4e', type:'super' },
  tempest: { name:'Tempest R', color:'#f1a51f', type:'gt' },
  phantom: { name:'Phantom ZX', color:'#20c66f', type:'hyper' },
  'velocity-one': { name:'Velocity One', color:'#ff6b24', type:'future' }
};

const PAINT_COLORS = {
  factory: null,
  midnight:'#11151d',
  arctic:'#e9f4ff',
  crimson:'#e52d45',
  electric:'#16a7ff',
  gold:'#f4b525'
};

function activeColor(id) {
  const factory = CAR_META[id]?.color || '#0877ff';
  const paint = window.VRProgress?.state?.selectedPaint || 'factory';
  return PAINT_COLORS[paint] || factory;
}

function bodyPath(type) {
  const paths = {
    coupe:'M40 68 C50 55 72 48 96 45 L126 27 C143 18 174 18 193 28 L216 49 C227 53 238 59 242 69 L238 81 L26 81 L27 72 Z',
    ev:'M29 69 C45 56 70 50 101 47 L127 29 C145 18 177 19 196 31 L224 52 C234 56 241 63 244 71 L239 81 L24 81 L23 74 Z',
    tuner:'M27 70 C42 58 69 51 97 48 L121 32 C136 21 166 20 184 29 L207 47 L234 55 C240 59 244 65 245 72 L238 81 L22 81 L22 74 Z',
    muscle:'M24 70 C39 61 62 56 90 54 L112 38 C129 26 163 26 181 36 L205 53 L237 59 C243 63 246 69 244 75 L238 81 L20 81 L20 74 Z',
    super:'M23 71 C36 57 66 49 102 46 L132 25 C149 14 185 16 204 31 L229 55 C238 59 244 65 246 72 L239 81 L19 81 L19 75 Z',
    gt:'M28 70 C43 57 70 50 102 47 L127 28 C145 17 177 18 197 31 L222 52 C233 56 240 63 243 71 L238 81 L23 81 L22 75 Z',
    hyper:'M18 72 C31 55 62 47 103 45 L137 23 C154 13 190 15 208 31 L232 56 C240 61 245 67 246 73 L238 81 L16 81 L15 76 Z',
    future:'M17 72 C29 56 57 48 98 45 L134 22 C154 10 192 13 211 30 L235 55 C243 61 247 67 247 73 L239 81 L15 81 L14 76 Z'
  };
  return paths[type] || paths.coupe;
}

function detailMarkup(type) {
  if (type === 'muscle') return `<path d="M91 52 L116 38 L178 38 L199 52" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="3"/><rect x="190" y="47" width="28" height="5" rx="2.5" fill="#111820"/>`;
  if (type === 'tuner') return `<rect x="205" y="40" width="30" height="5" rx="2.5" fill="#111820"/><rect x="211" y="36" width="3" height="9" fill="#111820"/><rect x="229" y="36" width="3" height="9" fill="#111820"/><path d="M47 68 L219 68" stroke="rgba(255,255,255,.35)" stroke-width="3"/>`;
  if (type === 'future') return `<path d="M107 46 L143 24 L196 29 L218 48" fill="none" stroke="#7df6ff" stroke-width="3"/><path d="M57 67 L220 67" stroke="#7df6ff" stroke-width="2" opacity=".8"/><circle cx="226" cy="61" r="4" fill="#7df6ff"/>`;
  if (type === 'hyper') return `<path d="M52 65 L210 65" stroke="rgba(255,255,255,.45)" stroke-width="2"/><path d="M201 46 L229 51" stroke="#111820" stroke-width="5"/><path d="M126 47 L143 27 L196 31" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="3"/>`;
  if (type === 'ev') return `<path d="M112 47 L139 29 L190 32 L211 48" fill="rgba(15,31,48,.65)"/><path d="M59 67 L217 67" stroke="rgba(112,222,255,.75)" stroke-width="2"/>`;
  if (type === 'super') return `<path d="M118 45 L143 25 L196 30 L219 50" fill="rgba(12,28,42,.72)"/><path d="M204 45 L233 51" stroke="#151c24" stroke-width="5"/>`;
  if (type === 'gt') return `<path d="M110 47 L139 28 L190 32 L213 49" fill="rgba(12,28,42,.7)"/><path d="M65 67 L218 67" stroke="rgba(255,255,255,.35)" stroke-width="2"/>`;
  return `<path d="M108 47 L137 28 L189 31 L211 49" fill="rgba(12,28,42,.72)"/><path d="M69 67 L214 67" stroke="rgba(255,255,255,.3)" stroke-width="2"/>`;
}

function vehicleSvg(id, color, large = false) {
  const meta = CAR_META[id] || CAR_META.apex;
  const uid = `vr-${id.replace(/[^a-z0-9]/gi,'')}-${large?'lg':'sm'}`;
  const accent = meta.type === 'future' ? '#73f1ff' : '#e8f6ff';
  return `<svg class="vr-vehicle-svg ${large?'large':''}" viewBox="0 0 260 110" role="img" aria-label="${meta.name}">
    <defs>
      <linearGradient id="${uid}-paint" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset=".58" stop-color="${color}" stop-opacity=".86"/><stop offset="1" stop-color="#08111e"/></linearGradient>
      <linearGradient id="${uid}-glass" x1="0" x2="1"><stop offset="0" stop-color="#88d9ff" stop-opacity=".62"/><stop offset="1" stop-color="#0b1d31" stop-opacity=".88"/></linearGradient>
      <filter id="${uid}-shadow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse cx="135" cy="88" rx="105" ry="11" fill="#000" opacity=".34" filter="url(#${uid}-shadow)"/>
    <g>
      <circle cx="67" cy="80" r="17" fill="#090d13"/><circle cx="67" cy="80" r="9" fill="#637180"/><circle cx="67" cy="80" r="4" fill="#101722"/>
      <circle cx="205" cy="80" r="17" fill="#090d13"/><circle cx="205" cy="80" r="9" fill="#637180"/><circle cx="205" cy="80" r="4" fill="#101722"/>
      <path d="${bodyPath(meta.type)}" fill="url(#${uid}-paint)" stroke="rgba(255,255,255,.2)" stroke-width="1.4"/>
      <path d="M104 47 L132 28 C148 18 174 19 190 29 L211 48 Z" fill="url(#${uid}-glass)" stroke="rgba(255,255,255,.22)" stroke-width="1"/>
      <path d="M29 72 C65 68 204 67 240 70" fill="none" stroke="${accent}" stroke-opacity=".32" stroke-width="2"/>
      ${detailMarkup(meta.type)}
      <rect x="31" y="70" width="13" height="5" rx="2.5" fill="#d9f6ff" opacity=".95"/><rect x="226" y="70" width="10" height="5" rx="2.5" fill="#ff3b34" opacity=".95"/>
    </g>
  </svg>`;
}

function selectedId() { return window.VRProgress?.state?.selectedCar || document.querySelector('.vr-car.selected')?.dataset.car || 'apex'; }

function enhanceGarage() {
  const overlay = document.getElementById('vr-garage-overlay');
  if (!overlay) return;
  overlay.querySelectorAll('.vr-car').forEach(card => {
    const id = card.dataset.car;
    const swatch = card.querySelector('.vr-swatch');
    if (!id || !swatch || swatch.dataset.vehicleReady === '1') return;
    swatch.dataset.vehicleReady = '1';
    swatch.innerHTML = vehicleSvg(id, CAR_META[id]?.color || '#0877ff', false);
    swatch.style.background = 'radial-gradient(circle at 50% 85%, rgba(65,154,231,.25), rgba(4,23,50,.62) 66%, rgba(1,12,28,.88))';
  });
  const perfBox = overlay.querySelector('.vr-garage-lower .vr-box:first-child');
  if (perfBox) {
    let preview = perfBox.querySelector('.vr-selected-vehicle');
    if (!preview) {
      preview = document.createElement('div');
      preview.className = 'vr-selected-vehicle';
      perfBox.insertBefore(preview, perfBox.firstChild);
    }
    const id = selectedId();
    const meta = CAR_META[id] || CAR_META.apex;
    preview.innerHTML = `<div class="vr-showroom-label">SELECTED VEHICLE</div>${vehicleSvg(id, activeColor(id), true)}<div class="vr-showroom-name">${meta.name}</div>`;
  }
}

function injectGarageVehicleStyles() {
  if (document.getElementById('vr-garage-vehicle-style')) return;
  const style = document.createElement('style');
  style.id = 'vr-garage-vehicle-style';
  style.textContent = `.vr-swatch{height:78px!important;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:2px 5px;box-sizing:border-box}.vr-vehicle-svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 5px 7px rgba(0,0,0,.28))}.vr-car.locked .vr-vehicle-svg{filter:grayscale(.55) brightness(.62) drop-shadow(0 4px 6px rgba(0,0,0,.22))}.vr-car.selected .vr-swatch{box-shadow:inset 0 0 0 1px rgba(92,220,255,.55),0 0 18px rgba(48,184,255,.18)}.vr-selected-vehicle{position:relative;min-height:190px;margin:-2px -2px 14px;border-radius:15px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 78%,rgba(39,142,221,.35),rgba(4,27,62,.72) 58%,rgba(2,16,38,.92));border:1px solid rgba(255,255,255,.09)}.vr-selected-vehicle:after{content:'';position:absolute;left:14%;right:14%;bottom:23px;height:1px;background:linear-gradient(90deg,transparent,rgba(93,220,255,.7),transparent)}.vr-selected-vehicle .vr-vehicle-svg.large{width:min(92%,520px);height:142px;margin-top:12px;z-index:1}.vr-showroom-label{position:absolute;top:11px;left:13px;font-size:9px;font-weight:1000;letter-spacing:.12em;color:#8eeaff;opacity:.92}.vr-showroom-name{position:absolute;right:14px;bottom:10px;font-size:12px;font-weight:1000;letter-spacing:.04em;color:#fff;z-index:2}@media(max-width:720px){.vr-swatch{height:66px!important}.vr-selected-vehicle{min-height:150px}.vr-selected-vehicle .vr-vehicle-svg.large{height:112px}.vr-showroom-name{font-size:10px}}`;
  document.head.appendChild(style);
}

function bootGarageVehicles() {
  injectGarageVehicleStyles();
  const observer = new MutationObserver(() => requestAnimationFrame(enhanceGarage));
  observer.observe(document.body, { childList:true, subtree:true });
  enhanceGarage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootGarageVehicles, { once:true });
else bootGarageVehicles();