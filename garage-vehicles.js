// Velocity Rivals Garage vehicle artwork.
// Detailed original SVG showroom renders keep the garage polished without loading extra 3D assets.
const CAR_META = {
  apex: { name:'Apex S1', color:'#0877ff', type:'coupe', accent:'#7edcff' },
  volt: { name:'Volt RS', color:'#7138ff', type:'ev', accent:'#91f4ff' },
  driftline: { name:'Driftline GT', color:'#18b5d0', type:'tuner', accent:'#78f2ff' },
  iron: { name:'Iron V8', color:'#272d37', type:'muscle', accent:'#ffb64d' },
  nova: { name:'Nova X', color:'#f13d4e', type:'super', accent:'#ff93a0' },
  tempest: { name:'Tempest R', color:'#f1a51f', type:'gt', accent:'#ffe08a' },
  phantom: { name:'Phantom ZX', color:'#20c66f', type:'hyper', accent:'#9affcf' },
  'velocity-one': { name:'Velocity One', color:'#ff6b24', type:'future', accent:'#71f5ff' }
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

function clampByte(v) { return Math.max(0, Math.min(255, Math.round(v))); }
function tint(hex, amount) {
  const raw = hex.replace('#','');
  const n = parseInt(raw.length === 3 ? raw.split('').map(c => c+c).join('') : raw, 16);
  const r = clampByte((n >> 16) + amount);
  const g = clampByte(((n >> 8) & 255) + amount);
  const b = clampByte((n & 255) + amount);
  return `#${((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1)}`;
}

function profile(type) {
  return {
    coupe:  { roofY:43, roofL:105, roofR:188, hoodY:74, noseY:91, rearY:93, wheelR:24, frontX:238, rearX:84, spoiler:false, low:false },
    ev:     { roofY:40, roofL:102, roofR:190, hoodY:72, noseY:90, rearY:92, wheelR:23, frontX:239, rearX:84, spoiler:false, low:false },
    tuner:  { roofY:46, roofL:109, roofR:184, hoodY:76, noseY:91, rearY:94, wheelR:24, frontX:237, rearX:82, spoiler:true,  low:false },
    muscle: { roofY:50, roofL:111, roofR:181, hoodY:78, noseY:92, rearY:95, wheelR:25, frontX:236, rearX:82, spoiler:false, low:false },
    super:  { roofY:39, roofL:117, roofR:190, hoodY:70, noseY:87, rearY:95, wheelR:25, frontX:241, rearX:83, spoiler:true,  low:true  },
    gt:     { roofY:43, roofL:108, roofR:189, hoodY:73, noseY:89, rearY:94, wheelR:24, frontX:239, rearX:83, spoiler:true,  low:false },
    hyper:  { roofY:35, roofL:121, roofR:195, hoodY:67, noseY:84, rearY:96, wheelR:26, frontX:243, rearX:82, spoiler:true,  low:true  },
    future: { roofY:32, roofL:126, roofR:200, hoodY:64, noseY:82, rearY:97, wheelR:27, frontX:244, rearX:80, spoiler:true,  low:true  }
  }[type] || profile('coupe');
}

function aeroMarkup(type, accent) {
  if (type === 'tuner') return `<path d="M64 94 L205 94" stroke="${accent}" stroke-width="3" opacity=".78"/><path d="M42 80 L75 78" stroke="#101722" stroke-width="7" stroke-linecap="round"/><path d="M39 70 L71 70" stroke="#101722" stroke-width="5" stroke-linecap="round"/><path d="M46 70 L46 81 M65 70 L65 79" stroke="#101722" stroke-width="3"/>`;
  if (type === 'muscle') return `<path d="M146 72 L176 70 L188 76 L157 78 Z" fill="#111820"/><path d="M50 100 L220 99" stroke="${accent}" stroke-width="2" opacity=".55"/><rect x="209" y="89" width="24" height="7" rx="3" fill="#101722"/>`;
  if (type === 'super') return `<path d="M55 99 L216 97" stroke="${accent}" stroke-width="2.5" opacity=".64"/><path d="M210 66 L248 73" stroke="#0b111a" stroke-width="6" stroke-linecap="round"/>`;
  if (type === 'gt') return `<path d="M53 98 L220 97" stroke="${accent}" stroke-width="2.5" opacity=".65"/><path d="M206 67 L244 72" stroke="#0c121a" stroke-width="6" stroke-linecap="round"/><path d="M208 59 L244 62" stroke="#0c121a" stroke-width="5" stroke-linecap="round"/>`;
  if (type === 'hyper') return `<path d="M51 100 L222 96" stroke="${accent}" stroke-width="3" opacity=".8"/><path d="M221 63 L256 69" stroke="#0a0f16" stroke-width="7" stroke-linecap="round"/><path d="M213 56 L251 58" stroke="#0a0f16" stroke-width="5" stroke-linecap="round"/>`;
  if (type === 'future') return `<path d="M48 101 L226 96" stroke="${accent}" stroke-width="3.2" opacity=".92"/><path d="M135 54 L167 37 L205 44" fill="none" stroke="${accent}" stroke-width="3" opacity=".8"/><path d="M224 60 L259 66" stroke="#071018" stroke-width="7" stroke-linecap="round"/><circle cx="264" cy="79" r="4" fill="${accent}" filter="url(#glow)"/>`;
  if (type === 'ev') return `<path d="M53 99 L220 96" stroke="${accent}" stroke-width="2.8" opacity=".72"/><rect x="210" y="82" width="28" height="4" rx="2" fill="${accent}" opacity=".9"/>`;
  return `<path d="M55 99 L217 97" stroke="${accent}" stroke-width="2" opacity=".48"/>`;
}

function wheelMarkup(cx, cy, r, uid) {
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r+2}" fill="#05080d"/>
    <circle cx="${cx}" cy="${cy}" r="${r-5}" fill="url(#${uid}-rim)" stroke="#7f8b98" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.max(7,r-13)}" fill="#111923"/>
    <g stroke="#aebbc8" stroke-width="2" opacity=".9">
      <path d="M${cx} ${cy-r+7} L${cx} ${cy+r-7}"/><path d="M${cx-r+7} ${cy} L${cx+r-7} ${cy}"/>
      <path d="M${cx-r+10} ${cy-r+10} L${cx+r-10} ${cy+r-10}"/><path d="M${cx+r-10} ${cy-r+10} L${cx-r+10} ${cy+r-10}"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="5" fill="#556370" stroke="#e0e8ef" stroke-width="1"/>
  </g>`;
}

function vehicleSvg(id, color, large = false) {
  const meta = CAR_META[id] || CAR_META.apex;
  const p = profile(meta.type);
  const uid = `vr-${id.replace(/[^a-z0-9]/gi,'')}-${large?'lg':'sm'}`;
  const light = tint(color, 48);
  const mid = tint(color, -12);
  const dark = tint(color, -72);
  const accent = meta.accent;
  const rearWheelY = 128;
  const frontWheelY = 125;

  const body = `M31 ${p.rearY+25} C43 ${p.rearY+3},66 ${p.rearY-5},101 ${p.rearY-7} L${p.roofL} ${p.roofY+22} C${p.roofL+13} ${p.roofY+4},${p.roofL+33} ${p.roofY},${p.roofL+50} ${p.roofY} L${p.roofR} ${p.roofY+5} C${p.roofR+13} ${p.roofY+10},${p.roofR+25} ${p.hoodY-7},${p.roofR+31} ${p.hoodY} L257 ${p.noseY} C274 ${p.noseY+5},284 ${p.noseY+14},287 ${p.noseY+27} L281 127 L257 135 L49 137 L26 129 Z`;
  const side = `M37 104 C73 93,126 90,193 89 L256 ${p.noseY+7} L278 112 L268 132 L55 136 L31 126 Z`;
  const hood = `M191 ${p.hoodY-3} L257 ${p.noseY} L276 105 L218 100 L175 84 Z`;
  const windshield = `M${p.roofL+12} ${p.roofY+23} L${p.roofL+31} ${p.roofY+5} L${p.roofR-3} ${p.roofY+9} L${p.roofR+15} ${p.hoodY-5} Z`;
  const sideWindow = `M${p.roofL+8} ${p.roofY+24} L${p.roofL+30} ${p.roofY+7} L${p.roofL+49} ${p.roofY+7} L${p.roofL+43} ${p.hoodY-3} Z`;
  const frontWindow = `M${p.roofL+52} ${p.roofY+7} L${p.roofR-4} ${p.roofY+10} L${p.roofR+12} ${p.hoodY-5} L${p.roofL+47} ${p.hoodY-3} Z`;

  return `<svg class="vr-vehicle-svg ${large?'large':''}" viewBox="0 0 320 175" role="img" aria-label="${meta.name}">
    <defs>
      <linearGradient id="${uid}-paint" x1=".1" x2=".95" y1="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".28" stop-color="${color}"/><stop offset=".7" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <linearGradient id="${uid}-side" x1="0" x2="1"><stop offset="0" stop-color="${mid}"/><stop offset=".65" stop-color="${dark}"/><stop offset="1" stop-color="#060b12"/></linearGradient>
      <linearGradient id="${uid}-glass" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#9be1ff" stop-opacity=".78"/><stop offset=".35" stop-color="#2f668a" stop-opacity=".8"/><stop offset="1" stop-color="#08131f" stop-opacity=".96"/></linearGradient>
      <radialGradient id="${uid}-rim"><stop offset="0" stop-color="#e9eff5"/><stop offset=".42" stop-color="#8593a0"/><stop offset="1" stop-color="#2d3742"/></radialGradient>
      <linearGradient id="${uid}-head" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${accent}"/></linearGradient>
      <filter id="${uid}-shadow" x="-20%" y="-100%" width="150%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="${uid}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>

    <ellipse cx="160" cy="145" rx="126" ry="18" fill="#000" opacity=".38" filter="url(#${uid}-shadow)"/>

    ${wheelMarkup(p.rearX, rearWheelY, p.wheelR, uid)}
    ${wheelMarkup(p.frontX, frontWheelY, p.wheelR+1, uid)}

    <path d="${body}" fill="url(#${uid}-paint)" stroke="rgba(255,255,255,.24)" stroke-width="1.5"/>
    <path d="${side}" fill="url(#${uid}-side)" opacity=".86"/>
    <path d="${hood}" fill="${tint(color,18)}" opacity=".76" stroke="rgba(255,255,255,.16)" stroke-width="1"/>

    <path d="${windshield}" fill="url(#${uid}-glass)" stroke="rgba(210,242,255,.34)" stroke-width="1.2"/>
    <path d="${sideWindow}" fill="url(#${uid}-glass)" stroke="rgba(210,242,255,.28)" stroke-width="1"/>
    <path d="${frontWindow}" fill="url(#${uid}-glass)" stroke="rgba(210,242,255,.28)" stroke-width="1"/>

    <path d="M${p.roofL+50} ${p.roofY+3} L${p.roofL+45} ${p.hoodY-2}" stroke="rgba(255,255,255,.18)" stroke-width="1"/>
    <path d="M53 105 C104 94,184 91,245 96" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="2" opacity=".6"/>
    <path d="M63 117 C111 112,171 111,221 111" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>

    <path d="M260 ${p.noseY+11} L282 ${p.noseY+20} L277 ${p.noseY+30} L254 ${p.noseY+24} Z" fill="url(#${uid}-head)" filter="url(#${uid}-glow)" opacity=".94"/>
    <path d="M266 113 L283 116 L277 126 L258 124 Z" fill="#070b11" stroke="#27313c" stroke-width="1"/>
    <path d="M261 128 L278 127 L271 133 L255 134 Z" fill="#05080d"/>
    <rect x="267" y="119" width="11" height="3" rx="1.5" fill="${accent}" opacity=".58"/>

    <path d="M38 110 L50 107 L49 118 L34 121 Z" fill="#ff4b42" opacity=".92"/>
    <path d="M48 136 L258 133" stroke="#070a0f" stroke-width="6" opacity=".8"/>
    <path d="M58 132 L95 130 M213 128 L247 128" stroke="${accent}" stroke-width="2" opacity=".62"/>

    ${aeroMarkup(meta.type, accent)}

    <path d="M150 75 L163 72 L174 76" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5"/>
    <circle cx="213" cy="92" r="3.6" fill="#dbe8f3" opacity=".85"/>
    <path d="M209 93 l8 -2" stroke="#0c1824" stroke-width="1.2"/>
    <g transform="translate(247 104)"><path d="M0 0 l6 2 -6 2 -6 -2 z" fill="${accent}" opacity=".9"/><path d="M0 -1 v6" stroke="#fff" stroke-width=".8" opacity=".8"/></g>
  </svg>`;
}

function selectedId() { return window.VRProgress?.state?.selectedCar || document.querySelector('.vr-car.selected')?.dataset.car || 'apex'; }

function enhanceGarage() {
  const overlay = document.getElementById('vr-garage-overlay');
  if (!overlay) return;

  overlay.querySelectorAll('.vr-car').forEach(card => {
    const id = card.dataset.car;
    const swatch = card.querySelector('.vr-swatch');
    if (!id || !swatch) return;
    const expectedKey = `${id}:${window.VRProgress?.state?.selectedPaint || 'factory'}:${card.classList.contains('selected')}`;
    if (swatch.dataset.vehicleKey === expectedKey) return;
    swatch.dataset.vehicleKey = expectedKey;
    const cardColor = card.classList.contains('selected') ? activeColor(id) : (CAR_META[id]?.color || '#0877ff');
    swatch.innerHTML = vehicleSvg(id, cardColor, false);
    swatch.style.background = 'radial-gradient(circle at 52% 78%, rgba(72,164,236,.28), rgba(5,29,63,.68) 60%, rgba(2,14,31,.94))';
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
    preview.innerHTML = `<div class="vr-showroom-label">SELECTED VEHICLE</div>${vehicleSvg(id, activeColor(id), true)}<div class="vr-showroom-footer"><span>${meta.name}</span><b>${meta.type.toUpperCase()}</b></div>`;
  }
}

function injectGarageVehicleStyles() {
  if (document.getElementById('vr-garage-vehicle-style')) return;
  const style = document.createElement('style');
  style.id = 'vr-garage-vehicle-style';
  style.textContent = `
    .vr-swatch{height:102px!important;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:2px 5px;box-sizing:border-box;position:relative}
    .vr-swatch:before{content:'';position:absolute;left:8%;right:8%;bottom:11px;height:1px;background:linear-gradient(90deg,transparent,rgba(115,225,255,.42),transparent)}
    .vr-vehicle-svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 8px 10px rgba(0,0,0,.32));position:relative;z-index:1}
    .vr-car.locked .vr-vehicle-svg{filter:grayscale(.7) brightness(.48) drop-shadow(0 5px 7px rgba(0,0,0,.25))}
    .vr-car.selected .vr-swatch{box-shadow:inset 0 0 0 1px rgba(92,220,255,.62),0 0 22px rgba(48,184,255,.22)}
    .vr-selected-vehicle{position:relative;min-height:268px;margin:-2px -2px 15px;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 70%,rgba(42,147,226,.38),rgba(4,28,64,.78) 55%,rgba(2,15,35,.96));border:1px solid rgba(255,255,255,.1)}
    .vr-selected-vehicle:before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.05) 45%,transparent 63%);pointer-events:none}
    .vr-selected-vehicle:after{content:'';position:absolute;left:12%;right:12%;bottom:34px;height:1px;background:linear-gradient(90deg,transparent,rgba(93,220,255,.78),transparent)}
    .vr-selected-vehicle .vr-vehicle-svg.large{width:min(96%,620px);height:210px;margin-top:15px;z-index:1}
    .vr-showroom-label{position:absolute;top:13px;left:15px;font-size:9px;font-weight:1000;letter-spacing:.14em;color:#8eeaff;opacity:.95;z-index:3}
    .vr-showroom-footer{position:absolute;left:15px;right:15px;bottom:10px;display:flex;justify-content:space-between;align-items:center;z-index:3;font-size:12px;font-weight:1000;letter-spacing:.04em;color:#fff}
    .vr-showroom-footer b{font-size:9px;letter-spacing:.12em;color:#86dfff;opacity:.9}
    @media(max-width:720px){
      .vr-swatch{height:82px!important}.vr-selected-vehicle{min-height:205px}.vr-selected-vehicle .vr-vehicle-svg.large{height:155px}.vr-showroom-footer{font-size:10px}.vr-showroom-footer b{font-size:8px}
    }
  `;
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