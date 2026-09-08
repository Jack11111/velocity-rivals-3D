// Load main.js with one runtime timing correction. The original render loop
// capped frame delta at 33 ms, which made the entire race run in slow motion
// whenever rendering fell below about 30 FPS. Keep safety clamping, but allow
// up to 80 ms so gameplay time remains close to real time on slower devices.
const response = await fetch('./main.js?v=visuals-7', { cache: 'no-store' });
if (!response.ok) throw new Error(`Could not load main.js (${response.status})`);
let source = await response.text();
source = source.replace(
  'const dt=Math.min(.033,(now-last)/1000);',
  'const dt=Math.min(.08,Math.max(.001,(now-last)/1000));'
);
const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
