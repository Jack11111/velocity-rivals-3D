// UI copy for the auto-accelerating steering control model.
const tip = document.querySelector('.tip');
const subtitle = document.querySelector('#menu .subtitle');

if (tip) {
  const coarse = matchMedia('(pointer: coarse)').matches || innerWidth <= 820;
  tip.textContent = coarse ? 'DRAG TO STEER' : 'A / D TO STEER · SPACE FOR ITEM';
  tip.setAttribute('aria-label', coarse ? 'Drag left and right to steer' : 'Use A and D to steer and Space to use an item');
}

if (subtitle) {
  subtitle.textContent = 'Acceleration is automatic. Steer left and right to dodge traffic and hazards, collect pickups, stay off the track edges, and line up attacks.';
}

const style = document.createElement('style');
style.textContent = `
.tip{animation:vr-steer-tip 1.25s ease-in-out 3}
@keyframes vr-steer-tip{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.055)}}
@media (prefers-reduced-motion:reduce){.tip{animation:none}}
`;
document.head.appendChild(style);
