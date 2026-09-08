// Velocity Rivals field-size layer.
// Runs after the existing gameplay patches and expands the field from six to
// eight total cars while keeping the additional opponents on the lightweight
// AI asset path supplied by performance-fix.js.
const inheritedFetch = window.fetch.bind(window);
let patchedMain = false;

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) console.warn(`Velocity field-size patch not found: ${label}`);
  return source.replace(from, to);
}

window.fetch = async function vrFieldSizeFetch(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (patchedMain || !url.includes('main.js')) return inheritedFetch(input, init);

  patchedMain = true;
  const response = await inheritedFetch(input, init);
  if (!response.ok) return response;
  let source = await response.text();

  source = replaceOnce(
    source,
    'const CAR_COLORS = [0x0877ff, 0x7138ff, 0x18b5d0, 0x12161d, 0xf13d4e, 0xf1a51f];',
    'const CAR_COLORS = [0x0877ff, 0x7138ff, 0x18b5d0, 0x12161d, 0xf13d4e, 0xf1a51f, 0x20c66f, 0xff6b24];',
    'eight car colors'
  );

  source = replaceOnce(
    source,
    'for (let i = 1; i < 6; i++) {',
    'for (let i = 1; i < 8; i++) {',
    'seven AI opponents'
  );

  source = replaceOnce(
    source,
    'lane: [-4, 3, -1.5, 4, -3][i - 1],',
    'lane: [-4.2, 3.1, -1.45, 4.25, -3.05, 1.5, -4.7][i - 1],',
    'eight-car starting lanes'
  );

  // Update the result denominator here and pre-wire the podium trigger. The
  // production loader adds finishCelebration() later in the assembled source.
  source = replaceOnce(
    source,
    `    const final = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;\n    document.querySelector('.title').innerHTML = final === 1 ? 'VICTORY!' : \`FINISHED \${final}/6\`;`,
    `    const final = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;\n    if (final <= 3) finishCelebration(final);\n    document.querySelector('.title').innerHTML = final === 1 ? 'VICTORY!' : \`FINISHED \${final}/8\`;`,
    'eight-car finish result'
  );

  return new Response(source, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};
