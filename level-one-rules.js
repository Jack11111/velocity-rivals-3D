// Level 1 rules for Velocity Rivals.
// Keep the first race focused on manual steering, traffic, pickups, track edges,
// and item timing. Fixed road barricades are introduced only in later levels.
const inheritedFetch = window.fetch.bind(window);
let patchedMain = false;

window.VELOCITY_LEVEL = 1;

window.fetch = async function vrLevelOneRulesFetch(input, init) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (patchedMain || !url.includes('main.js')) return inheritedFetch(input, init);

  patchedMain = true;
  const response = await inheritedFetch(input, init);
  if (!response.ok) return response;

  let source = await response.text();
  const hazardPattern = /const hazardLayout = \[[\s\S]*?\];/;
  if (hazardPattern.test(source)) {
    source = source.replace(
      hazardPattern,
      `const hazardLayout = []; // Level 1: no fixed in-track barricades.`
    );
  } else {
    console.warn('Velocity Level 1 rule could not find the road hazard layout.');
  }

  return new Response(source, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
};
