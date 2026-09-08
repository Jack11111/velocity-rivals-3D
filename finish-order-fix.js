// Velocity Rivals finish-order correctness patch.
// Cars are clamped to t=1 at the finish. Sorting raw progress values and using
// indexOf(playerT) makes every t=1 tie look like first place. Instead, when the
// player is at the line, count AI cars that have already reached the line.
const inheritedFetch = window.fetch.bind(window);
let patchedMain = false;

function replaceAllExact(source, from, to, label) {
  if (!source.includes(from)) console.warn(`Velocity finish-order patch not found: ${label}`);
  return source.split(from).join(to);
}

window.fetch = async function vrFinishOrderFetch(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (patchedMain || !url.includes('main.js')) return inheritedFetch(input, init);

  patchedMain = true;
  const response = await inheritedFetch(input, init);
  if (!response.ok) return response;
  let source = await response.text();

  source = replaceAllExact(
    source,
    `rankEl.textContent = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;`,
    `rankEl.textContent = playerT >= 1 - 1e-9\n    ? 1 + ais.filter(a => a.t >= 1 - 1e-9).length\n    : 1 + ais.filter(a => a.t > playerT + 1e-7).length;`,
    'live race position'
  );

  source = replaceAllExact(
    source,
    `const final = [playerT, ...ais.map(a => a.t)].sort((a, b) => b - a).indexOf(playerT) + 1;`,
    `const final = 1 + ais.filter(a => a.t >= 1 - 1e-9).length;`,
    'final race position'
  );

  return new Response(source, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};
