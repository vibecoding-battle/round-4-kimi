const INK = '#202634';
const O = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const O2 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

export const CARD_IMAGES = new Map();
const IMAGE_OBJECTS = new Map();

export function setCardImage(id, url) {
  if (!id || !url) return;
  CARD_IMAGES.set(id, url);
  if (typeof Image !== 'undefined') {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    IMAGE_OBJECTS.set(id, image);
  }
}

export function getCardImage(id) {
  return IMAGE_OBJECTS.get(id) || null;
}

export function hasCardImage(id) {
  return CARD_IMAGES.has(id);
}

export function cardPortraitMarkup(card, className = '') {
  const image = CARD_IMAGES.get(card.id);
  const fallback = cardArtSVG(card, className);
  if (!image) return fallback;
  return `<span class="card-portrait-media ${className}"><span class="card-portrait-fallback">${fallback}</span><img class="card-portrait-img" src="${image}" alt="" draggable="false" loading="lazy" onerror="this.remove()"></span>`;
}

function svg(content) {
  return `<svg class="card-portrait-svg" viewBox="0 0 160 160" aria-hidden="true" focusable="false">${content}</svg>`;
}

function eyes(x, y, gap = 11, color = INK, glow = null) {
  const halo = glow ? `<circle cx="${x - gap}" cy="${y}" r="6" fill="${glow}" opacity=".35"/><circle cx="${x + gap}" cy="${y}" r="6" fill="${glow}" opacity=".35"/>` : '';
  return `${halo}<ellipse cx="${x - gap}" cy="${y}" rx="4.6" ry="5.4" fill="#fff"/><ellipse cx="${x + gap}" cy="${y}" rx="4.6" ry="5.4" fill="#fff"/><circle cx="${x - gap + 1}" cy="${y + 1}" r="2.5" fill="${color}"/><circle cx="${x + gap + 1}" cy="${y + 1}" r="2.5" fill="${color}"/><circle cx="${x - gap - 1}" cy="${y - 2}" r="1" fill="#fff"/><circle cx="${x + gap - 1}" cy="${y - 2}" r="1" fill="#fff"/>`;
}

function skullEyes(x, y, gap = 11, glow = '#9fe8ff') {
  return `<ellipse cx="${x - gap}" cy="${y}" rx="5.6" ry="6.3" fill="#26313d"/><ellipse cx="${x + gap}" cy="${y}" rx="5.6" ry="6.3" fill="#26313d"/><circle cx="${x - gap}" cy="${y}" r="2" fill="${glow}"/><circle cx="${x + gap}" cy="${y}" r="2" fill="${glow}"/><path d="M77 77 L80 82 L83 77 Z" fill="#26313d"/>`;
}

function grin(x, y, width = 14, color = '#41262b') {
  return `<path d="M${x - width} ${y} Q${x} ${y + 10} ${x + width} ${y}" fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round"/>`;
}

function teeth(x, y, width = 11) {
  return `<path d="M${x - width} ${y} Q${x} ${y + 9} ${x + width} ${y}" fill="#f5fbf7" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - width + 3} ${y + 2} v4 M${x} ${y + 4} v4 M${x + width - 3} ${y + 2} v4" stroke="${INK}" stroke-width="1.4"/>`;
}

function weapon(a, x = 112, y = 104, scale = 1) {
  const kind = a.weapon || 'none';
  const metal = a.metal || '#d4dfe6';
  const accent = a.accent || '#ffcf4d';
  const cloth = a.cloth || '#4f6fae';
  let s = '';
  if (kind === 'sword') {
    s += `<g transform="translate(${x} ${y}) scale(${scale}) rotate(18)"><rect x="-4" y="-46" width="9" height="49" rx="3" fill="${metal}" ${O2}/><path d="M-4 -46 L0 -56 L5 -46 Z" fill="${metal}" ${O2}/><rect x="-13" y="1" width="27" height="6" rx="3" fill="${accent}" ${O2}/><rect x="-3" y="7" width="6" height="15" rx="3" fill="#7a4b2b" ${O2}/></g>`;
  } else if (kind === 'axe') {
    s += `<g transform="translate(${x} ${y}) rotate(12)"><rect x="-3" y="-52" width="7" height="66" rx="3" fill="#8a5a33" ${O2}/><path d="M4 -45 C26 -42 31 -25 24 -10 C15 -18 7 -20 -1 -19 Z" fill="${metal}" ${O2}/></g>`;
  } else if (kind === 'spear') {
    s += `<g transform="translate(${x} ${y}) rotate(14)"><rect x="-2" y="-62" width="5" height="78" rx="2" fill="#9a6a3e" ${O2}/><path d="M0 -75 L9 -57 L0 -46 L-9 -57 Z" fill="${metal}" ${O2}/></g>`;
  } else if (kind === 'bow') {
    s += `<g transform="translate(${x - 12} ${y}) rotate(-8)"><path d="M8 -47 C38 -35 38 11 8 28" fill="none" stroke="#8a5a33" stroke-width="6" stroke-linecap="round"/><path d="M8 -46 C28 -33 28 10 8 27" fill="none" stroke="#f0e3c2" stroke-width="2"/><path d="M4 -12 L42 -12" stroke="${metal}" stroke-width="3"/><path d="M42 -12 L33 -17 M42 -12 L33 -7" stroke="${metal}" stroke-width="3" stroke-linecap="round"/></g>`;
  } else if (kind === 'staff') {
    s += `<g transform="translate(${x} ${y}) rotate(8)"><rect x="-3" y="-58" width="6" height="76" rx="3" fill="#7b5238" ${O2}/><circle cx="0" cy="-64" r="12" fill="${accent}" ${O2}/><circle cx="-3" cy="-67" r="4" fill="#fff" opacity=".8"/></g>`;
  } else if (kind === 'hammer') {
    s += `<g transform="translate(${x} ${y}) rotate(10)"><rect x="-3" y="-48" width="7" height="62" rx="3" fill="#7b5238" ${O2}/><rect x="-17" y="-59" width="35" height="22" rx="6" fill="${metal}" ${O2}/></g>`;
  } else if (kind === 'mace') {
    s += `<g transform="translate(${x} ${y}) rotate(14)"><rect x="-3" y="-45" width="6" height="60" rx="3" fill="#5b4a3c" ${O2}/><circle cx="0" cy="-54" r="15" fill="#575d69" ${O2}/><path d="M0 -73 L6 -62 M15 -64 L6 -57 M20 -50 L8 -52 M0 -35 L6 -46 M-15 -64 L-6 -57 M-20 -50 L-8 -52" stroke="#aeb5c0" stroke-width="5" stroke-linecap="round"/></g>`;
  } else if (kind === 'maces') {
    s += `<g transform="translate(${x - 6} ${y}) rotate(20)"><rect x="-3" y="-34" width="6" height="48" rx="3" fill="#4b4f5b" ${O2}/><circle cx="0" cy="-44" r="16" fill="#575d69" ${O2}/><path d="M0 -64 L7 -51 M17 -54 L7 -47 M21 -38 L8 -42 M0 -24 L7 -37 M-17 -54 L-7 -47 M-21 -38 L-8 -42" stroke="#b7bec8" stroke-width="5" stroke-linecap="round"/></g><g transform="translate(39 105) rotate(-20)"><rect x="-3" y="-30" width="6" height="42" rx="3" fill="#4b4f5b" ${O2}/><circle cx="0" cy="-39" r="15" fill="#575d69" ${O2}/><path d="M0 -57 L6 -45 M15 -48 L6 -42 M19 -33 L7 -37 M0 -21 L6 -33 M-15 -48 L-6 -42 M-19 -33 L-7 -37" stroke="#b7bec8" stroke-width="4.5" stroke-linecap="round"/></g>`;
  } else if (kind === 'lance') {
    s += `<g transform="translate(${x} ${y}) rotate(14)"><rect x="-2" y="-76" width="5" height="100" rx="2" fill="#a77646" ${O2}/><path d="M0 -88 L8 -70 L0 -60 L-8 -70 Z" fill="${metal}" ${O2}/><path d="M2 -70 l21 7 l-15 8 Z" fill="${accent}" ${O2}/></g>`;
  } else if (kind === 'pickaxe') {
    s += `<g transform="translate(${x} ${y}) rotate(12)"><rect x="-3" y="-42" width="6" height="56" rx="3" fill="#7b5238" ${O2}/><path d="M-26 -43 Q0 -58 26 -43" fill="none" stroke="${metal}" stroke-width="7" stroke-linecap="round"/></g>`;
  } else if (kind === 'musket') {
    s += `<g transform="translate(${x - 14} ${y}) rotate(-12)"><rect x="-4" y="-8" width="70" height="10" rx="4" fill="#7b4f33" ${O2}/><rect x="37" y="-11" width="35" height="6" rx="3" fill="${metal}" ${O2}/><rect x="-1" y="2" width="9" height="17" rx="3" transform="rotate(18 3 10)" fill="#7b4f33" ${O2}/></g>`;
  } else if (kind === 'cannon') {
    s += `<g transform="translate(${x - 2} ${y + 6}) rotate(-12)"><rect x="-17" y="-24" width="46" height="30" rx="13" fill="#434b59" ${O2}/><circle cx="29" cy="-9" r="15" fill="#2b3240" ${O2}/><circle cx="29" cy="-9" r="9" fill="#59616f"/><path d="M-14 7 h28" stroke="#8d97a5" stroke-width="4"/></g>`;
  } else if (kind === 'blade') {
    s += `<g transform="translate(${x} ${y}) rotate(18)"><path d="M-8 13 L-4 -18 L10 -61 L22 -40 L7 -2 L13 17 Z" fill="${metal}" ${O2}/><path d="M2 -40 L14 -48" stroke="#fff" stroke-width="3" opacity=".6"/></g>`;
  } else if (kind === 'dagger') {
    s += `<g transform="translate(${x} ${y}) rotate(18)"><path d="M-3 8 L-2 -18 L5 -38 L12 -16 L8 9 Z" fill="${metal}" ${O2}/><rect x="-8" y="8" width="18" height="5" rx="2" fill="${accent}" ${O2}/></g>`;
  } else if (kind === 'bomb') {
    s += `<g transform="translate(${x - 2} ${y + 10})"><circle cx="0" cy="0" r="25" fill="#343946" ${O2}/><circle cx="-8" cy="-8" r="7" fill="#565d6a"/><path d="M14 -18 q10 -12 4 -22" fill="none" stroke="#c9a26a" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="-42" r="5" fill="#ffb648"/><path d="M18 -47 v-6 M23 -42 h5 M13 -42 h-5" stroke="#ffb648" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  return s;
}

function shield(a, x = 45, y = 106) {
  return `<g transform="translate(${x} ${y}) rotate(-8)"><path d="M0 -25 C17 -19 25 -12 25 3 C25 21 12 32 0 38 C-12 32 -25 21 -25 3 C-25 -12 -17 -19 0 -25 Z" fill="${a.metal || '#c6d4de'}" ${O2}/><path d="M0 -17 V28 M-14 2 H14" stroke="${a.accent || '#ffcf4d'}" stroke-width="4" stroke-linecap="round"/></g>`;
}

function helmet(a, kind) {
  const metal = a.metal || '#d4dfe6';
  const accent = a.accent || '#ffcf4d';
  const cloth = a.cloth || '#4f6fae';
  switch (kind) {
    case 'knight':
      return `<path d="M53 62 C55 36 69 28 80 28 C91 28 105 36 107 62 L100 62 C98 46 91 39 80 39 C69 39 62 46 60 62 Z" fill="${metal}" ${O2}/><path d="M55 58 H105" stroke="${accent}" stroke-width="5"/><path d="M73 40 V60 M87 40 V60" stroke="${INK}" stroke-width="3"/><path d="M80 33 v13" stroke="${accent}" stroke-width="4"/>`;
    case 'horned':
      return `<path d="M54 58 C54 36 66 27 80 27 C94 27 106 36 106 58 Z" fill="${metal}" ${O2}/><path d="M55 50 C30 45 20 30 26 20 C37 26 52 34 61 41 Z" fill="#e7d9b8" ${O2}/><path d="M105 50 C130 45 140 30 134 20 C123 26 108 34 99 41 Z" fill="#e7d9b8" ${O2}/><path d="M57 56 H103" stroke="${accent}" stroke-width="5"/>`;
    case 'wizard':
      return `<path d="M45 52 C53 31 69 20 83 12 C88 31 100 42 114 53 C95 49 66 50 45 52 Z" fill="${cloth}" ${O2}/><path d="M58 47 Q80 41 104 48" fill="none" stroke="${accent}" stroke-width="5"/><circle cx="83" cy="37" r="4" fill="${accent}"/>`;
    case 'hood':
      return `<path d="M48 66 C48 38 61 26 80 26 C99 26 112 38 112 66 L104 72 C104 50 94 41 80 41 C66 41 56 50 56 72 Z" fill="${cloth}" ${O2}/><path d="M56 60 C50 72 48 84 51 94 L63 90 C58 80 59 69 64 60 Z" fill="${cloth}" ${O2}/><path d="M104 60 C110 72 112 84 109 94 L97 90 C102 80 101 69 96 60 Z" fill="${cloth}" ${O2}/>`;
    case 'tricorn':
      return `<path d="M45 51 C55 41 68 36 80 36 C92 36 105 41 115 51 C104 64 96 68 80 68 C64 68 56 64 45 51 Z" fill="#3e315f" ${O2}/><path d="M46 48 Q80 26 114 48" fill="none" stroke="${accent}" stroke-width="4"/><path d="M100 39 C112 26 123 25 129 29 C121 37 114 45 108 53 Z" fill="${accent}" ${O2}/>`;
    case 'miner':
      return `<path d="M54 52 C54 34 66 26 80 26 C94 26 106 34 106 52 Z" fill="${accent}" ${O2}/><path d="M52 51 H108" stroke="${INK}" stroke-width="4"/><circle cx="80" cy="35" r="6" fill="#fff3b0" ${O2}/><circle cx="80" cy="35" r="10" fill="#fff3b0" opacity=".25"/>`;
    case 'crown':
      return `<path d="M54 48 L58 23 L69 37 L80 17 L91 37 L102 23 L106 48 Z" fill="${accent}" ${O2}/><circle cx="80" cy="30" r="3.5" fill="#ff5d5d"/><circle cx="61" cy="35" r="3" fill="#65d8ff"/><circle cx="99" cy="35" r="3" fill="#65d8ff"/><path d="M56 48 H104" stroke="${INK}" stroke-width="4"/>`;
    case 'prince':
      return `<path d="M53 60 C55 34 68 25 80 25 C92 25 105 34 107 60 Z" fill="${metal}" ${O2}/><path d="M54 51 H106" stroke="${accent}" stroke-width="5"/><path d="M80 20 C78 8 89 3 97 8 C93 17 87 22 84 30 Z" fill="#ff5d5d" ${O2}/><path d="M62 38 L72 45 L80 32 L88 45 L98 38" fill="none" stroke="${accent}" stroke-width="3"/>`;
    case 'dark':
      return `<path d="M52 60 C54 33 67 23 80 23 C93 23 106 33 108 60 Z" fill="#4d4a63" ${O2}/><path d="M52 52 C35 42 31 28 36 18 C47 25 54 33 57 41 Z" fill="#29263a" ${O2}/><path d="M108 52 C125 42 129 28 124 18 C113 25 106 33 103 41 Z" fill="#29263a" ${O2}/><path d="M80 18 C78 7 89 3 97 8 C92 16 87 21 84 29 Z" fill="#ff5d8f" ${O2}/><path d="M57 51 H103" stroke="#8e89a8" stroke-width="4"/>`;
    case 'mega':
      return `<path d="M44 66 C46 30 62 18 80 18 C98 18 114 30 116 66 L104 72 C104 48 96 36 80 36 C64 36 56 48 56 72 Z" fill="${metal}" ${O2}/><path d="M56 54 H104 V68 H56 Z" fill="#3b4050" ${O2}/><path d="M62 58 V65 M70 58 V65 M78 58 V65 M86 58 V65 M94 58 V65" stroke="#9da6b5" stroke-width="3"/><path d="M80 22 C78 8 90 2 99 7 C94 16 88 21 84 28 Z" fill="${accent}" ${O2}/><path d="M48 38 C31 26 28 12 36 3 C47 14 54 24 57 34 Z" fill="#4b505e" ${O2}/><path d="M112 38 C129 26 132 12 124 3 C113 14 106 24 103 34 Z" fill="#4b505e" ${O2}/>`;
    case 'witch':
      return `<path d="M43 54 C53 32 68 20 82 8 C87 29 100 40 117 52 C97 48 64 49 43 54 Z" fill="#3d2859" ${O2}/><path d="M56 48 Q80 40 105 48" fill="none" stroke="${accent}" stroke-width="5"/><path d="M66 58 q14 -8 28 0" fill="none" stroke="#2b1b3e" stroke-width="4"/>`;
    case 'guard':
      return `<path d="M56 50 C58 31 68 24 80 24 C92 24 102 31 104 50 Z" fill="${a.metal || '#9fb2c1'}" ${O2}/><path d="M55 49 H105" stroke="${accent}" stroke-width="4"/><path d="M80 25 V48" stroke="${INK}" stroke-width="3"/>`;
    case 'mohawk':
      return `<path d="M66 37 C68 18 74 14 80 14 C86 14 92 18 94 37 C88 31 83 29 80 29 C77 29 72 31 66 37 Z" fill="#3a2620" ${O2}/><path d="M70 34 C72 20 77 16 80 16 C83 16 88 20 90 34" fill="none" stroke="#5b3c30" stroke-width="4"/>`;
    default:
      return '';
  }
}

function hair(a) {
  if (!a.hair) return '';
  return `<path d="M56 52 C57 35 67 28 80 28 C93 28 103 35 104 52 C97 43 88 40 80 40 C72 40 63 43 56 52 Z" fill="${a.hair}" ${O2}/>`;
}

function beard(a) {
  if (!a.beard) return '';
  return `<path d="M60 72 C63 92 72 101 80 103 C88 101 97 92 100 72 C92 82 84 85 80 85 C76 85 68 82 60 72 Z" fill="${a.beard}" ${O2}/>`;
}

function humanPortrait(a) {
  const skin = a.skin || '#e8b08a';
  const cloth = a.cloth || '#4f6fae';
  const metal = a.metal || '#c9d8e2';
  const accent = a.accent || '#ffcf4d';
  let s = '';
  if (a.mount === 'hog') {
    s += `<g transform="translate(0 18)"><ellipse cx="82" cy="134" rx="49" ry="20" fill="#5c4741" ${O2}/><path d="M114 130 q20 -6 18 -20 q-12 4 -20 12" fill="#5c4741" ${O2}/><path d="M112 128 l8 8 l5 -10" fill="#f0e3c2" ${O2}/><circle cx="113" cy="124" r="2.6" fill="${INK}"/><path d="M41 137 l-8 15 M96 139 l7 14" stroke="#3f312d" stroke-width="7" stroke-linecap="round"/><path d="M55 119 q25 -12 50 0" fill="none" stroke="#3a2b28" stroke-width="5"/></g>`;
  }
  s += `<path d="M55 138 C53 112 58 96 80 94 C102 96 107 112 105 138 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M63 138 L60 149 M97 138 L100 149" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M57 104 L42 126 M103 104 L118 124" stroke="${skin}" stroke-width="9" stroke-linecap="round"/>`;
  if (a.big) {
    s += `<path d="M53 106 C36 104 28 116 30 130 C43 132 52 125 56 113 Z" fill="${metal}" ${O2}/><path d="M107 106 C124 104 132 116 130 130 C117 132 108 125 104 113 Z" fill="${metal}" ${O2}/>`;
  }
  s += `<path d="M62 101 Q80 94 98 101 L96 121 Q80 129 64 121 Z" fill="${metal}" ${O2}/>`;
  s += `<path d="M66 112 h28" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<rect x="63" y="129" width="34" height="10" rx="5" fill="#4a3328" ${O2}/><rect x="76" y="130" width="8" height="8" rx="2" fill="${accent}"/>`;
  s += `<ellipse cx="80" cy="68" rx="26" ry="27" fill="${skin}" ${O2}/>`;
  s += `<ellipse cx="54" cy="70" rx="5" ry="8" fill="${skin}" ${O2}/><ellipse cx="106" cy="70" rx="5" ry="8" fill="${skin}" ${O2}/>`;
  s += eyes(80, 66);
  s += `<path d="M68 57 q6 -4 12 0 M80 57 q6 -4 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  s += grin(80, 82, 11);
  s += hair(a);
  s += beard(a);
  s += helmet(a, a.helmet);
  if (a.shield) s += shield(a);
  s += weapon(a);
  return s;
}

function skeletonPortrait(a) {
  const bone = a.bone || '#e8f1ec';
  const cloth = a.cloth || '#526f86';
  const accent = a.accent || '#9fe8ff';
  let s = `<ellipse cx="80" cy="145" rx="40" ry="9" fill="rgba(8,18,26,.28)"/>`;
  if (a.weapon === 'bomb' && a.big) {
    s += `<g transform="translate(18 76)"><circle cx="30" cy="50" r="34" fill="#303744" ${O2}/><circle cx="18" cy="38" r="9" fill="#555e6b"/><path d="M56 18 q10 -12 4 -24" fill="none" stroke="#c9a26a" stroke-width="5" stroke-linecap="round"/><circle cx="61" cy="-9" r="6" fill="#ffb648"/><path d="M61 -18 v-7 M68 -9 h7 M54 -9 h-7" stroke="#ffb648" stroke-width="4" stroke-linecap="round"/></g>`;
  }
  s += `<path d="M57 138 C55 112 59 99 80 97 C101 99 105 112 103 138 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M62 138 L59 149 M98 138 L101 149" stroke="${bone}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M66 106 h28 M69 114 h22 M72 122 h16" stroke="${bone}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M58 104 L45 122 M102 104 L115 120" stroke="${bone}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<circle cx="80" cy="68" r="28" fill="${bone}" ${O2}/>`;
  s += `<path d="M64 84 Q80 94 96 84 L92 95 Q80 101 68 95 Z" fill="${bone}" ${O2}/>`;
  s += skullEyes(80, 66, 11, accent);
  s += `<path d="M71 84 v7 M78 86 v7 M86 85 v7" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (a.helmet) s += helmet(a, a.helmet);
  if (a.shield) s += shield(a);
  s += weapon(a);
  return s;
}

function goblinPortrait(a) {
  const skin = a.skin || '#69c34f';
  const cloth = a.cloth || '#8a5b32';
  const accent = a.accent || '#ffd166';
  let s = `<ellipse cx="80" cy="145" rx="38" ry="9" fill="rgba(8,18,26,.28)"/>`;
  s += `<path d="M56 139 C54 115 60 101 80 99 C100 101 106 115 104 139 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M63 139 L60 149 M97 139 L100 149" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M58 108 L45 124 M102 108 L115 122" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M66 116 h28" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<ellipse cx="80" cy="69" rx="28" ry="26" fill="${skin}" ${O2}/>`;
  s += `<path d="M55 63 L28 45 L47 77 Z" fill="${skin}" ${O2}/><path d="M105 63 L132 45 L113 77 Z" fill="${skin}" ${O2}/>`;
  s += eyes(80, 65, 12);
  s += `<path d="M72 76 q8 7 17 0" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
  s += teeth(80, 78, 12);
  s += `<path d="M78 78 q2 12 6 16 q4 -6 4 -16" fill="${skin}" ${O2}/>`;
  if (a.helmet) s += helmet(a, a.helmet);
  if (a.shield) s += shield(a);
  s += weapon(a);
  return s;
}

function gargoylePortrait(a) {
  const skin = a.skin || '#5a9bd4';
  const cloth = a.cloth || '#2f5d8f';
  const metal = a.metal || '#a9bfd0';
  const accent = a.accent || '#8ff1ff';
  let s = `<ellipse cx="80" cy="146" rx="44" ry="9" fill="rgba(8,18,26,.3)"/>`;
  s += `<path d="M58 98 C30 82 18 58 24 36 C44 48 57 65 62 81 Z" fill="${cloth}" ${O2}/><path d="M102 98 C130 82 142 58 136 36 C116 48 103 65 98 81 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M44 75 L26 66 M51 88 L33 88 M116 75 L134 66 M109 88 L127 88" stroke="${metal}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<path d="M56 138 C54 112 60 96 80 94 C100 96 106 112 104 138 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M62 138 L58 148 M98 138 L102 148" stroke="${skin}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M58 106 L43 124 M102 106 L117 122" stroke="${skin}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<ellipse cx="80" cy="69" rx="29" ry="27" fill="${skin}" ${O2}/>`;
  s += `<path d="M55 58 C55 37 65 28 80 28 C95 28 105 37 105 58 Z" fill="${metal}" ${O2}/><path d="M56 55 H104" stroke="${accent}" stroke-width="4"/>`;
  s += `<path d="M62 64 h12 v9 H62 Z M86 64 h12 v9 H86 Z" fill="#26313d" ${O2}/><circle cx="68" cy="68" r="2.4" fill="${accent}"/><circle cx="92" cy="68" r="2.4" fill="${accent}"/>`;
  s += `<path d="M67 83 q13 8 26 0" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
  s += `<path d="M68 91 l-3 10 l9 -6 M92 91 l3 10 l-9 -6" fill="#f0e3c2" ${O2}/>`;
  s += weapon(a, 112, 108, 0.9);
  return s;
}

function golemPortrait(a) {
  const skin = a.skin || '#bde7f5';
  const cloth = a.cloth || '#7cc5e8';
  const accent = a.accent || '#e9fdff';
  let s = `<ellipse cx="80" cy="146" rx="48" ry="10" fill="rgba(8,18,26,.28)"/>`;
  s += `<path d="M44 136 C40 102 50 90 80 88 C110 90 120 102 116 136 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M50 112 L34 132 L42 143 L54 130 M110 112 L126 132 L118 143 L106 130" fill="${cloth}" ${O2}/>`;
  s += `<path d="M60 138 L57 149 M100 138 L103 149" stroke="${cloth}" stroke-width="12" stroke-linecap="round"/>`;
  s += `<path d="M52 98 L34 104 L28 94 L46 87 Z" fill="${skin}" ${O2}/><path d="M108 98 L126 104 L132 94 L114 87 Z" fill="${skin}" ${O2}/>`;
  s += `<ellipse cx="80" cy="65" rx="30" ry="27" fill="${skin}" ${O2}/>`;
  s += `<path d="M52 58 L58 42 L70 47 L80 36 L90 47 L102 42 L108 58 Z" fill="${accent}" ${O2}/>`;
  s += `<circle cx="68" cy="66" r="4.5" fill="#22303d"/><circle cx="92" cy="66" r="4.5" fill="#22303d"/><circle cx="68" cy="65" r="1.8" fill="#fff"/><circle cx="92" cy="65" r="1.8" fill="#fff"/>`;
  s += `<path d="M70 82 q10 6 20 0" fill="none" stroke="#3f6f86" stroke-width="3.4" stroke-linecap="round"/>`;
  s += `<path d="M57 98 l-7 18 l11 10 l8 -17 M103 98 l7 18 l-11 10 l-8 -17" fill="${skin}" ${O2}/>`;
  s += `<path d="M64 96 l6 13 l-8 16 M96 96 l-6 13 l8 16 M74 100 l2 22 M86 100 l-2 22" stroke="${accent}" stroke-width="2.2" opacity=".75"/>`;
  return s;
}

function robotPortrait(a) {
  const skin = a.skin || '#4f8bd6';
  const cloth = a.cloth || '#2b4e7c';
  const metal = a.metal || '#9fb7c8';
  const accent = a.accent || '#89f4ff';
  let s = `<ellipse cx="80" cy="146" rx="44" ry="9" fill="rgba(8,18,26,.3)"/>`;
  s += `<path d="M52 138 C50 110 58 96 80 94 C102 96 110 110 108 138 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M58 102 L40 116 L46 132 L60 124 M102 102 L120 116 L114 132 L100 124" fill="${metal}" ${O2}/>`;
  s += `<path d="M62 138 L58 149 M98 138 L102 149" stroke="${metal}" stroke-width="10" stroke-linecap="round"/>`;
  s += `<path d="M64 106 h32 l-4 24 h-24 Z" fill="${skin}" ${O2}/><circle cx="80" cy="117" r="7" fill="${accent}" ${O2}/><circle cx="78" cy="115" r="2" fill="#fff"/>`;
  s += `<path d="M58 92 L70 76 H90 L102 92 Z" fill="${metal}" ${O2}/>`;
  s += `<rect x="58" y="48" width="44" height="36" rx="12" fill="${skin}" ${O2}/>`;
  s += `<rect x="65" y="58" width="12" height="10" rx="3" fill="#22303d"/><rect x="83" y="58" width="12" height="10" rx="3" fill="#22303d"/>`;
  s += `<circle cx="71" cy="63" r="2.5" fill="${accent}"/><circle cx="89" cy="63" r="2.5" fill="${accent}"/>`;
  s += `<path d="M72 74 h16" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  if (a.horns) s += `<path d="M56 49 L40 30 L50 26 L64 44 Z" fill="${metal}" ${O2}/><path d="M104 49 L120 30 L110 26 L96 44 Z" fill="${metal}" ${O2}/>`;
  s += `<path d="M45 54 L33 66" stroke="${metal}" stroke-width="4" stroke-linecap="round"/>`;
  s += weapon(a, 112, 108, 0.9);
  return s;
}

function ghostPortrait(a) {
  const skin = a.skin || '#d9f4ff';
  const cloth = a.cloth || '#5f89a8';
  const accent = a.accent || '#9ff5ff';
  let s = `<ellipse cx="80" cy="145" rx="38" ry="8" fill="rgba(8,18,26,.2)"/>`;
  s += `<path d="M49 138 C42 122 42 95 55 79 C64 68 70 60 80 53 C90 60 96 68 105 79 C118 95 118 122 111 138 C103 146 97 136 90 143 C84 150 75 139 68 144 C59 150 55 143 49 138 Z" fill="${cloth}" opacity=".7" ${O2}/>`;
  s += `<path d="M55 126 C53 100 60 82 80 70 C100 82 107 100 105 126 C98 133 92 125 86 132 C80 138 72 130 66 135 C60 140 58 132 55 126 Z" fill="${skin}" opacity=".85" ${O2}/>`;
  s += `<ellipse cx="80" cy="70" rx="24" ry="24" fill="${skin}" opacity=".92" ${O2}/>`;
  s += `<path d="M58 62 C60 39 71 31 80 31 C89 31 100 39 102 62 C94 51 87 47 80 47 C73 47 66 51 58 62 Z" fill="${cloth}" ${O2}/>`;
  s += eyes(80, 69, 10, '#203441', accent);
  s += `<path d="M72 82 q8 6 16 0" fill="none" stroke="#3d6678" stroke-width="3" stroke-linecap="round"/>`;
  s += `<path d="M58 114 C46 108 39 97 43 88 C53 91 59 99 62 108 Z" fill="${cloth}" opacity=".75" ${O2}/><path d="M102 114 C114 108 121 97 117 88 C107 91 101 99 98 108 Z" fill="${cloth}" opacity=".75" ${O2}/>`;
  s += `<g opacity=".9">${weapon(a, 108, 112, 0.92)}</g>`;
  return s;
}

function spiritPortrait(a) {
  const skin = a.skin || '#ff9b3d';
  const cloth = a.cloth || '#ff5d3a';
  const accent = a.accent || '#ffe27a';
  let s = `<ellipse cx="80" cy="145" rx="28" ry="7" fill="rgba(8,18,26,.24)"/>`;
  s += `<path d="M80 20 C103 46 111 66 108 96 C105 128 94 145 80 145 C66 145 55 128 52 96 C49 66 57 46 80 20 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M80 45 C94 62 99 79 96 100 C93 121 87 133 80 133 C73 133 67 121 64 100 C61 79 66 62 80 45 Z" fill="${skin}"/>`;
  s += `<path d="M76 18 C74 5 84 2 91 6 C86 13 82 18 80 27 Z" fill="${accent}"/>`;
  s += eyes(80, 91, 9, '#532219', accent);
  s += `<path d="M73 105 q7 7 14 0" fill="none" stroke="#6e2b1f" stroke-width="3" stroke-linecap="round"/>`;
  s += `<path d="M56 96 q-14 -10 -10 -24 q13 4 18 16 M104 96 q14 -10 10 -24 q-13 4 -18 16" fill="${cloth}" ${O2}/>`;
  return s;
}

function beastPortrait(a) {
  const skin = a.skin || '#8d314b';
  const cloth = a.cloth || '#4b1a31';
  const accent = a.accent || '#ff9b3d';
  const small = a.small ? 0.86 : 1;
  let s = `<g transform="translate(80 80) scale(${small}) translate(-80 -80)">`;
  s += `<ellipse cx="80" cy="146" rx="44" ry="10" fill="rgba(8,18,26,.3)"/>`;
  s += `<path d="M54 112 C28 96 20 70 28 48 C44 58 56 76 62 94 Z" fill="${cloth}" ${O2}/><path d="M106 112 C132 96 140 70 132 48 C116 58 104 76 98 94 Z" fill="${cloth}" ${O2}/>`;
  s += `<path d="M46 88 L28 80 M56 104 L38 106 M114 88 L132 80 M104 104 L122 106" stroke="${skin}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<path d="M48 140 C44 112 58 94 80 92 C102 94 116 112 112 140 Z" fill="${skin}" ${O2}/>`;
  s += `<path d="M62 140 L56 149 M98 140 L104 149" stroke="${cloth}" stroke-width="10" stroke-linecap="round"/>`;
  s += `<path d="M58 104 L42 118 M102 104 L118 118" stroke="${skin}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<ellipse cx="80" cy="72" rx="34" ry="28" fill="${skin}" ${O2}/>`;
  s += `<path d="M53 55 L48 30 L66 45 Z" fill="#e2d6c2" ${O2}/><path d="M107 55 L112 30 L94 45 Z" fill="#e2d6c2" ${O2}/>`;
  s += eyes(80, 68, 13, '#2a0f16', accent);
  s += `<path d="M64 84 L80 92 L96 84 L90 99 L70 99 Z" fill="${cloth}" ${O2}/><path d="M70 88 l-3 9 M76 89 l-1 10 M84 89 l1 10 M90 88 l3 9" stroke="#f0e3c2" stroke-width="2.4"/>`;
  if (a.lava) s += `<path d="M66 104 l6 13 l-7 12 M94 104 l-6 13 l7 12 M80 108 v20" stroke="${accent}" stroke-width="3" opacity=".8"/>`;
  s += `</g>`;
  return s;
}

function cartPortrait(a) {
  const wood = a.skin || '#a67c52';
  const cloth = a.cloth || '#775638';
  const metal = a.metal || '#aebfc8';
  const accent = a.accent || '#ffb648';
  let s = `<ellipse cx="80" cy="146" rx="48" ry="9" fill="rgba(8,18,26,.28)"/>`;
  s += `<path d="M38 90 L112 84 L124 126 L30 132 Z" fill="${wood}" ${O2}/>`;
  s += `<path d="M42 96 L110 90 M38 110 L118 104 M34 122 L122 116" stroke="${cloth}" stroke-width="4"/>`;
  s += `<circle cx="48" cy="134" r="14" fill="#493a2c" ${O2}/><circle cx="48" cy="134" r="4" fill="${metal}"/><circle cx="108" cy="130" r="14" fill="#493a2c" ${O2}/><circle cx="108" cy="130" r="4" fill="${metal}"/>`;
  s += `<path d="M54 79 L102 62 L120 76 L112 92 L60 102 Z" fill="${metal}" ${O2}/><circle cx="110" cy="76" r="16" fill="#454d5a" ${O2}/><circle cx="110" cy="76" r="9" fill="#202632"/>`;
  s += `<path d="M64 78 L96 71" stroke="${accent}" stroke-width="4"/>`;
  s += `<path d="M40 88 L30 74 L46 70 L52 84" fill="${cloth}" ${O2}/>`;
  return s;
}

function balloonPortrait(a) {
  const skin = a.skin || '#c94f4f';
  const cloth = a.cloth || '#7a2b2b';
  const metal = a.metal || '#c9a26a';
  const accent = a.accent || '#ffb648';
  let s = `<ellipse cx="80" cy="148" rx="32" ry="7" fill="rgba(8,18,26,.25)"/>`;
  s += `<path d="M80 14 C108 14 122 34 118 58 C114 80 96 92 80 94 C64 92 46 80 42 58 C38 34 52 14 80 14 Z" fill="${skin}" ${O2}/>`;
  s += `<path d="M80 14 C92 14 102 28 104 48 C106 70 94 88 80 94 C66 88 54 70 56 48 C58 28 68 14 80 14 Z" fill="${cloth}" opacity=".55"/>`;
  s += `<path d="M52 44 Q80 30 108 44 M48 62 Q80 48 112 62" fill="none" stroke="${accent}" stroke-width="5" opacity=".85"/>`;
  s += `<path d="M68 90 L64 108 M92 90 L96 108 M70 94 L76 112 M90 94 L84 112" stroke="${metal}" stroke-width="3"/>`;
  s += `<path d="M64 110 L96 110 L92 140 L68 140 Z" fill="${metal}" ${O2}/><path d="M66 118 H94 M67 128 H93" stroke="#7a5230" stroke-width="3"/>`;
  s += `<circle cx="80" cy="124" r="8" fill="#2f3540" ${O2}/><path d="M85 117 q6 -8 2 -14" fill="none" stroke="${metal}" stroke-width="3"/><circle cx="88" cy="101" r="3" fill="${accent}"/>`;
  s += `<path d="M80 94 q0 12 6 18" fill="none" stroke="${INK}" stroke-width="2.4" opacity=".5"/>`;
  return s;
}

function buildingPortrait(a) {
  const wood = a.wood || '#8a5b32';
  const metal = a.metal || '#b8c7ce';
  const accent = a.accent || '#ffb648';
  const style = a.style || 'cannon';
  let s = `<ellipse cx="80" cy="147" rx="54" ry="10" fill="rgba(8,18,26,.3)"/>`;
  if (style === 'cannon' || style === 'mortar') {
    s += `<path d="M38 140 L44 104 L116 104 L122 140 Z" fill="${wood}" ${O2}/>`;
    s += `<path d="M44 112 H116 M42 124 H118" stroke="#5e4128" stroke-width="4"/>`;
    if (style === 'cannon') {
      s += `<path d="M52 106 L84 76 L112 84 L90 114 Z" fill="#3f4754" ${O2}/><circle cx="105" cy="85" r="18" fill="#2c333f" ${O2}/><circle cx="105" cy="85" r="11" fill="#1b202a"/><path d="M54 104 L46 94 L58 88 L66 100" fill="${metal}" ${O2}/>`;
    } else {
      s += `<path d="M62 103 L72 62 L96 58 L100 101 Z" fill="#3f4754" ${O2}/><ellipse cx="84" cy="62" rx="18" ry="9" fill="#202632" ${O2}/><circle cx="54" cy="92" r="13" fill="${metal}" ${O2}/><circle cx="54" cy="92" r="5" fill="${wood}"/>`;
    }
    s += `<circle cx="54" cy="131" r="9" fill="${accent}" ${O2}/><circle cx="54" cy="131" r="3.5" fill="#6a4a1f"/>`;
  } else if (style === 'tesla') {
    s += `<path d="M42 140 L48 104 L112 104 L118 140 Z" fill="#4e6170" ${O2}/>`;
    s += `<path d="M58 104 L60 66 L100 66 L102 104 Z" fill="#2f3d4b" ${O2}/>`;
    s += `<rect x="64" y="72" width="32" height="26" rx="8" fill="${metal}" ${O2}/>`;
    s += `<path d="M80 44 L68 74 L82 73 L70 100" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<circle cx="80" cy="50" r="8" fill="${accent}" opacity=".35"/><circle cx="61" cy="82" r="5" fill="${accent}" opacity=".5"/><circle cx="101" cy="88" r="4" fill="${accent}" opacity=".5"/>`;
  } else if (style === 'goblin-hut') {
    s += `<path d="M36 140 L42 104 L118 104 L124 140 Z" fill="${wood}" ${O2}/>`;
    s += `<path d="M34 108 L80 58 L126 108 Z" fill="#3f7d43" ${O2}/><path d="M46 104 L80 70 L114 104" fill="none" stroke="#7ee05d" stroke-width="4"/>`;
    s += `<rect x="68" y="112" width="24" height="28" rx="4" fill="#3b2a1d" ${O2}/>`;
    s += `<circle cx="80" cy="122" r="3" fill="${accent}"/>`;
    s += `<path d="M46 96 L30 82 M114 96 L130 82" stroke="#7ee05d" stroke-width="4" stroke-linecap="round"/>`;
  } else if (style === 'collector') {
    s += `<path d="M38 140 L44 100 L116 100 L122 140 Z" fill="#5b4169" ${O2}/>`;
    s += `<rect x="54" y="50" width="52" height="60" rx="18" fill="${accent}" ${O2}/>`;
    s += `<rect x="62" y="60" width="36" height="42" rx="12" fill="#7c3f9e" ${O2}/>`;
    s += `<path d="M70 72 q12 -10 24 0 q-12 10 -24 0" fill="#f0c7ff" opacity=".8"/>`;
    s += `<path d="M50 112 H110 M46 124 H114" stroke="${metal}" stroke-width="5"/><circle cx="80" cy="58" r="5" fill="#f0c7ff"/>`;
    s += `<path d="M54 100 L42 88 L48 76 M106 100 L118 88 L112 76" stroke="${metal}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  } else if (style === 'barbarian-hut') {
    s += `<path d="M32 140 L40 98 L120 98 L128 140 Z" fill="${wood}" ${O2}/>`;
    s += `<path d="M30 102 L80 54 L130 102 Z" fill="#7d3c2e" ${O2}/><path d="M44 98 L80 68 L116 98" fill="none" stroke="${accent}" stroke-width="4"/>`;
    s += `<rect x="66" y="108" width="28" height="32" rx="4" fill="#3b2a1d" ${O2}/>`;
    s += `<path d="M56 88 L50 64 M104 88 L110 64" stroke="${metal}" stroke-width="6" stroke-linecap="round"/><path d="M52 64 l-9 -12 l17 2 M108 64 l9 -12 l-17 2" fill="${metal}" ${O2}/>`;
  } else if (style === 'bomb-tower') {
    s += `<path d="M40 140 L46 92 L114 92 L120 140 Z" fill="#5b6068" ${O2}/>`;
    s += `<path d="M46 102 H114 M44 116 H116 M42 130 H118" stroke="#3d424b" stroke-width="4"/>`;
    s += `<path d="M50 92 L58 76 L102 76 L110 92 Z" fill="#767d88" ${O2}/>`;
    s += `<circle cx="80" cy="60" r="24" fill="#2f3540" ${O2}/><circle cx="72" cy="52" r="7" fill="#555d6a"/>`;
    s += `<path d="M96 44 q12 -16 4 -30" fill="none" stroke="#c9a26a" stroke-width="4" stroke-linecap="round"/><circle cx="99" cy="10" r="5" fill="${accent}"/>`;
    s += `<path d="M99 4 v-6 M105 10 h6 M93 10 h-6" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<circle cx="60" cy="126" r="6" fill="${accent}" ${O2}/>`;
  } else if (style === 'inferno') {
    s += `<path d="M44 140 L50 88 L110 88 L116 140 Z" fill="#4b3c45" ${O2}/>`;
    s += `<rect x="56" y="52" width="48" height="42" rx="8" fill="#2f2a32" ${O2}/>`;
    s += `<path d="M64 88 V64 q8 -12 16 0 q8 -14 16 0 v24 Z" fill="#ff7a3d" ${O2}/>`;
    s += `<path d="M72 88 V70 q4 -8 8 0 q4 -8 8 0 v18 Z" fill="#ffe36e"/>`;
    s += `<circle cx="80" cy="52" r="5" fill="${accent}"/><path d="M80 40 v-8 M66 46 l-6 -6 M94 46 l6 -6" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<path d="M54 100 H106 M50 112 H110" stroke="#8c7a78" stroke-width="5"/><circle cx="62" cy="124" r="5" fill="${accent}"/><circle cx="98" cy="124" r="5" fill="${accent}"/>`;
  } else if (style === 'tombstone') {
    s += `<ellipse cx="80" cy="140" rx="40" ry="9" fill="#3d443c" opacity=".4"/>`;
    s += `<path d="M48 140 V82 C48 58 63 44 80 44 C97 44 112 58 112 82 V140 Z" fill="#8f958d" ${O2}/>`;
    s += `<path d="M54 140 V84 C54 64 66 52 80 52 C94 52 106 64 106 84 V140 Z" fill="#b8bdb4"/>`;
    s += `<path d="M66 78 H94 M80 66 V94" stroke="#5b625a" stroke-width="5" stroke-linecap="round"/>`;
    s += `<path d="M66 108 h28" stroke="#5b625a" stroke-width="4" stroke-linecap="round"/>`;
    s += `<circle cx="62" cy="122" r="4" fill="${accent}"/><circle cx="98" cy="122" r="4" fill="${accent}"/>`;
    s += `<path d="M44 128 q6 -10 12 0 M104 128 q6 -10 12 0" fill="#4f5b4c" ${O2}/>`;
  } else if (style === 'x-bow') {
    s += `<path d="M36 140 L44 104 L116 104 L124 140 Z" fill="${wood}" ${O2}/>`;
    s += `<path d="M46 110 H114" stroke="#5e4128" stroke-width="4"/>`;
    s += `<path d="M52 96 L30 52 M108 96 L130 52" stroke="#6b4a2d" stroke-width="6" stroke-linecap="round"/>`;
    s += `<path d="M30 52 Q80 34 130 52" fill="none" stroke="${metal}" stroke-width="5" stroke-linecap="round"/>`;
    s += `<path d="M30 52 Q80 70 130 52" fill="none" stroke="#8a5a33" stroke-width="4"/>`;
    s += `<path d="M80 36 V100" stroke="#f0e3c2" stroke-width="2.4"/><path d="M80 32 L86 44 L80 41 L74 44 Z" fill="${accent}" ${O2}/>`;
    s += `<circle cx="80" cy="84" r="9" fill="#4a4f5a" ${O2}/><path d="M80 75 V96 M71 84 H89" stroke="${metal}" stroke-width="3"/>`;
  }
  return s;
}

function spellPortrait(a) {
  const accent = a.accent || '#ffd166';
  const deep = a.deep || '#8a5b32';
  const style = a.style || 'zap';
  let s = `<circle cx="80" cy="80" r="62" fill="${deep}" opacity=".22"/>`;
  if (style === 'zap') {
    s += `<path d="M88 22 L48 84 H74 L62 138 L114 68 H88 Z" fill="${accent}" ${O2}/><path d="M84 36 L60 78 H78 L70 112" fill="none" stroke="#fff" stroke-width="4" opacity=".65"/>`;
    s += `<path d="M34 48 l-10 -10 M128 46 l12 -8 M42 118 l-12 10 M122 116 l12 10" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (style === 'arrows') {
    s += `<g transform="rotate(-18 80 80)"><path d="M28 34 L118 116 M28 66 L108 132 M40 20 L128 94" stroke="#a9763f" stroke-width="6" stroke-linecap="round"/><path d="M118 116 l-18 -2 l8 -14 M108 132 l-19 -4 l10 -13 M128 94 l-19 0 l7 -15" fill="${accent}" ${O2}/><path d="M28 34 l-8 -14 l16 2 M28 66 l-10 -12 l16 0 M40 20 l-3 -16 l13 8" fill="#f0e3c2" ${O2}/></g>`;
  } else if (style === 'fireball') {
    s += `<circle cx="80" cy="86" r="38" fill="#c43b24" ${O2}/><circle cx="80" cy="86" r="29" fill="${accent}"/><circle cx="70" cy="76" r="12" fill="#ffe27a" opacity=".85"/>`;
    s += `<path d="M80 48 C52 24 38 24 24 28 C42 44 50 62 54 72 M80 48 C108 24 122 24 136 28 C118 44 110 62 106 72" fill="${accent}" ${O2}/><path d="M62 34 q-12 -14 -28 -12" fill="none" stroke="#ffe27a" stroke-width="5" stroke-linecap="round"/>`;
  } else if (style === 'rage') {
    s += `<path d="M54 128 L60 62 L100 62 L106 128 Z" fill="#5e2c86" ${O2}/><rect x="64" y="44" width="32" height="20" rx="6" fill="${accent}" ${O2}/><circle cx="80" cy="94" r="22" fill="${accent}" opacity=".35"/><path d="M66 98 q14 -18 28 0 q-14 18 -28 0" fill="#efd2ff"/><path d="M80 66 q18 -18 34 -4 q-16 14 -34 4" fill="${accent}" opacity=".6"/>`;
  } else if (style === 'barrel') {
    s += `<path d="M46 56 Q80 40 114 56 L106 134 Q80 146 54 134 Z" fill="${deep}" ${O2}/><path d="M48 74 H112 M50 116 H110" stroke="#9a7444" stroke-width="6"/><path d="M52 88 Q80 78 108 88 L106 106 Q80 114 54 106 Z" fill="#4a2f1d" ${O2}/>`;
    s += `<circle cx="70" cy="91" r="4" fill="${accent}"/><circle cx="90" cy="91" r="4" fill="${accent}"/><path d="M70 102 q10 6 20 0" fill="none" stroke="${accent}" stroke-width="3"/>`;
  } else if (style === 'freeze') {
    s += `<g stroke="${accent}" stroke-linecap="round" stroke-linejoin="round"><path d="M80 24 V136 M38 52 L122 108 M122 52 L38 108" stroke-width="7"/><path d="M80 42 L66 30 M80 42 L94 30 M80 118 L66 130 M80 118 L94 130 M52 62 L36 66 M58 78 L42 86 M108 62 L124 66 M102 78 L118 86" stroke-width="5"/></g><circle cx="80" cy="80" r="15" fill="#e9fdff" opacity=".85" ${O2}/>`;
  } else if (style === 'mirror') {
    s += `<ellipse cx="80" cy="70" rx="36" ry="44" fill="${accent}" ${O2}/><ellipse cx="80" cy="70" rx="27" ry="35" fill="#cdeeff" ${O2}/><path d="M60 58 C68 46 82 42 96 50" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><rect x="72" y="112" width="16" height="30" rx="6" fill="${deep}" ${O2}/><circle cx="80" cy="70" r="7" fill="#fff" opacity=".8"/>`;
    s += `<path d="M120 36 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" fill="${accent}"/>`;
  } else if (style === 'lightning') {
    s += `<path d="M30 40 Q46 24 66 36 Q82 20 104 34 Q124 28 132 46 Q140 62 124 68 Q112 60 104 70 Q86 62 76 72 Q58 64 48 74 Q30 68 26 54 Z" fill="${deep}" ${O2}/>`;
    s += `<path d="M88 28 L52 88 H76 L64 138 L112 72 H86 Z" fill="${accent}" ${O2}/>`;
    s += `<path d="M84 42 L64 80 H80 L72 112" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>`;
    s += `<path d="M36 92 l-12 10 M128 94 l10 12 M52 126 l-10 12 M116 124 l10 10" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`;
  } else if (style === 'rocket') {
    s += `<path d="M80 16 C96 34 104 54 104 82 L96 112 H64 L56 82 C56 54 64 34 80 16 Z" fill="#d9e0e6" ${O2}/>`;
    s += `<path d="M80 16 C88 32 92 52 92 80 L88 96 H72 L68 80 C68 52 72 32 80 16 Z" fill="${deep}"/>`;
    s += `<circle cx="80" cy="64" r="12" fill="${accent}" ${O2}/><circle cx="80" cy="64" r="6" fill="#7a3c18"/>`;
    s += `<path d="M56 82 L34 112 L62 106 Z" fill="#c0392b" ${O2}/><path d="M104 82 L126 112 L98 106 Z" fill="#c0392b" ${O2}/>`;
    s += `<path d="M64 112 L72 140 L80 124 L88 140 L96 112 Z" fill="${accent}" ${O2}/>`;
    s += `<path d="M72 122 L80 138 L88 122" fill="none" stroke="#fff3b0" stroke-width="3"/>`;
    s += `<circle cx="42" cy="128" r="8" fill="#d9e0e6" opacity=".5"/><circle cx="118" cy="126" r="6" fill="#d9e0e6" opacity=".4"/>`;
  }
  return s;
}

export function cardArtSVG(card) {
  const a = card.art || {};
  let body = '';
  switch (a.kind) {
    case 'human': body = humanPortrait(a); break;
    case 'skeleton': body = skeletonPortrait(a); break;
    case 'goblin': body = goblinPortrait(a); break;
    case 'gargoyle': body = gargoylePortrait(a); break;
    case 'golem': body = golemPortrait(a); break;
    case 'robot': body = robotPortrait(a); break;
    case 'ghost': body = ghostPortrait(a); break;
    case 'spirit': body = spiritPortrait(a); break;
    case 'beast': body = beastPortrait(a); break;
    case 'balloon': body = balloonPortrait(a); break;
    case 'cart': body = cartPortrait(a); break;
    case 'building': body = buildingPortrait(a); break;
    case 'spell': body = spellPortrait(a); break;
    default: body = `<circle cx="80" cy="80" r="40" fill="#63b3ff" ${O}/>`; break;
  }
  const glow = a.accent || '#8ff1ff';
  return svg(`<circle cx="80" cy="82" r="70" fill="${glow}" opacity=".08"/><circle cx="80" cy="116" r="55" fill="${glow}" opacity=".05"/>${body}`);
}

export function drawUnitSprite(ctx, unit, time, teamColor) {
  const a = unit.card.art || {};
  const base = Math.max(0.62, Math.min(2.4, unit.radius / 14));
  const dir = unit.faceX || (unit.team === 0 ? 1 : -1);
  const bob = unit.isStructure || unit.speed === 0 ? 0 : Math.sin(unit.walkCycle || 0) * 1.4;
  const swing = unit.attackFlash > 0 ? Math.sin((1 - unit.attackFlash / 0.2) * Math.PI) : 0;
  ctx.save();
  ctx.scale(dir * base, base);
  if (!unit.isStructure) ctx.translate(0, -bob);
  if (a.kind === 'building' || a.kind === 'cart') {
    drawStructureSprite(ctx, unit, a, teamColor, time);
  } else {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (a.kind === 'human') drawHumanSprite(ctx, unit, a, teamColor, swing);
    else if (a.kind === 'skeleton') drawSkeletonSprite(ctx, unit, a, teamColor, swing);
    else if (a.kind === 'goblin') drawGoblinSprite(ctx, unit, a, teamColor, swing);
    else if (a.kind === 'gargoyle') drawGargoyleSprite(ctx, unit, a, teamColor, swing, time);
    else if (a.kind === 'golem') drawGolemSprite(ctx, unit, a, teamColor);
    else if (a.kind === 'robot') drawRobotSprite(ctx, unit, a, teamColor, swing);
    else if (a.kind === 'ghost') drawGhostSprite(ctx, unit, a, teamColor, swing);
    else if (a.kind === 'spirit') drawSpiritSprite(ctx, unit, a, teamColor);
    else if (a.kind === 'beast') drawBeastSprite(ctx, unit, a, teamColor, time);
    else if (a.kind === 'balloon') drawBalloonSprite(ctx, unit, a, teamColor, time);
    else drawHumanSprite(ctx, unit, a, teamColor, swing);
  }
  ctx.restore();
}

function spriteEyes(ctx, x, y, gap, color = INK) {
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(x - gap, y, 2.4, 2.8, 0, 0, Math.PI * 2); ctx.ellipse(x + gap, y, 2.4, 2.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x - gap + 0.5, y + 0.6, 1.25, 0, Math.PI * 2); ctx.arc(x + gap + 0.5, y + 0.6, 1.25, 0, Math.PI * 2); ctx.fill();
}

function teamBase(ctx, teamColor, r = 11) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 1, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function leg(ctx, x, y, color, swing = 0) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + swing, y + 8);
  ctx.stroke();
}

function humanCanvasBody(ctx, a, teamColor, swing, big) {
  const skin = a.skin || '#e8b08a';
  const cloth = a.cloth || '#4f6fae';
  const metal = a.metal || '#c9d8e2';
  const accent = a.accent || '#ffcf4d';
  const scale = big ? 1.08 : 1;
  ctx.scale(scale, scale);
  if (a.mount === 'hog') {
    ctx.fillStyle = '#5c4741'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, -2, 15, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0e3c2';
    ctx.beginPath(); ctx.moveTo(12, -3); ctx.lineTo(17, 1); ctx.lineTo(13, 3); ctx.fill();
  }
  leg(ctx, -5, -2, cloth, swing * 2);
  leg(ctx, 5, -2, cloth, -swing * 2);
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(-9, -24);
  ctx.quadraticCurveTo(-12, -12, -10, -3);
  ctx.lineTo(10, -3);
  ctx.quadraticCurveTo(12, -12, 9, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.roundRect(-8, -23, 16, 8, 2.5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillRect(-6, -21, 12, 1.8);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(-10, -18, 2.6, 0, Math.PI * 2); ctx.arc(10, -18, 2.6, 0, Math.PI * 2); ctx.fill();
  if (big) {
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.arc(-11, -20, 4.6, 0, Math.PI * 2); ctx.arc(11, -20, 4.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -35, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  spriteEyes(ctx, 0, -36, 4.2);
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(0, -31, 4, 1.2, 0, 0, Math.PI); ctx.fill();
  drawCanvasHelmet(ctx, a, teamColor);
  if (a.shield) {
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.ellipse(-11, -15, 5, 7, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-12, -16, 2, 7);
  }
  drawCanvasWeapon(ctx, a, swing);
}

function drawCanvasHelmet(ctx, a, teamColor) {
  const metal = a.metal || '#c9d8e2';
  const accent = a.accent || '#ffcf4d';
  const cloth = a.cloth || '#4f6fae';
  const kind = a.helmet;
  ctx.fillStyle = metal; ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  if (kind === 'knight' || kind === 'prince') {
    ctx.beginPath(); ctx.arc(0, -37, 11.5, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-9, -37, 18, 2.6);
    if (kind === 'prince') {
      ctx.fillStyle = '#ff5d5d';
      ctx.beginPath(); ctx.moveTo(-2, -48); ctx.quadraticCurveTo(3, -60, 13, -58); ctx.quadraticCurveTo(7, -51, 4, -45); ctx.fill(); ctx.stroke();
    }
  } else if (kind === 'horned') {
    ctx.beginPath(); ctx.arc(0, -37, 11, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e7d9b8';
    ctx.beginPath(); ctx.moveTo(-10, -42); ctx.quadraticCurveTo(-18, -46, -17, -53); ctx.quadraticCurveTo(-11, -48, -7, -45); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -42); ctx.quadraticCurveTo(18, -46, 17, -53); ctx.quadraticCurveTo(11, -48, 7, -45); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-9, -37, 18, 2.4);
  } else if (kind === 'wizard') {
    ctx.fillStyle = cloth;
    ctx.beginPath(); ctx.moveTo(-13, -39); ctx.lineTo(0, -60); ctx.lineTo(13, -39); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-9, -42, 18, 2);
    if (a.beard) {
      ctx.fillStyle = a.beard;
      ctx.beginPath(); ctx.moveTo(-8, -32); ctx.quadraticCurveTo(0, -22, 8, -32); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  } else if (kind === 'hood') {
    ctx.fillStyle = cloth;
    ctx.beginPath(); ctx.arc(0, -37, 12, Math.PI, Math.PI * 2); ctx.lineTo(8, -30); ctx.quadraticCurveTo(0, -26, -8, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'tricorn') {
    ctx.fillStyle = '#3e315f';
    ctx.beginPath(); ctx.moveTo(-14, -41); ctx.quadraticCurveTo(0, -51, 14, -41); ctx.quadraticCurveTo(5, -34, -14, -41); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-8, -42, 16, 1.8);
  } else if (kind === 'miner') {
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -42, 10, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(0, -45, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'mega' || kind === 'dark') {
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.arc(0, -38, 12, Math.PI, Math.PI * 2); ctx.lineTo(10, -27); ctx.lineTo(-10, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3b4050'; ctx.fillRect(-9, -35, 18, 5);
    ctx.fillStyle = teamColor; ctx.fillRect(-8, -34, 16, 1.4);
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(-1, -49); ctx.quadraticCurveTo(2, -60, 12, -58); ctx.quadraticCurveTo(6, -52, 4, -46); ctx.fill(); ctx.stroke();
  } else if (kind === 'crown') {
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(-9, -44); ctx.lineTo(-7, -53); ctx.lineTo(-2, -47); ctx.lineTo(0, -56); ctx.lineTo(3, -47); ctx.lineTo(8, -53); ctx.lineTo(9, -44); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'mohawk') {
    ctx.fillStyle = '#3a2620';
    ctx.beginPath(); ctx.moveTo(-2, -46); ctx.quadraticCurveTo(0, -58, 3, -46); ctx.closePath(); ctx.fill();
  } else if (kind === 'witch') {
    ctx.fillStyle = '#3d2859';
    ctx.beginPath(); ctx.moveTo(-14, -41); ctx.lineTo(2, -61); ctx.lineTo(15, -41); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-10, -42, 20, 2);
  } else if (kind === 'guard') {
    ctx.fillStyle = '#9fb2c1'; ctx.beginPath(); ctx.arc(0, -37, 11.5, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-9, -38, 18, 1.8);
  }
}

function drawCanvasWeapon(ctx, a, swing) {
  const metal = a.metal || '#d4dfe6';
  const accent = a.accent || '#ffcf4d';
  const kind = a.weapon || 'none';
  const ax = 11 + swing * 2;
  const ay = -17 + swing * 3;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(0.35 + swing * 0.6);
  ctx.fillStyle = metal;
  if (kind === 'sword' || kind === 'blade') {
    ctx.beginPath(); ctx.moveTo(-1.5, 3); ctx.lineTo(-1.5, -18); ctx.lineTo(3, -23); ctx.lineTo(2.5, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-5, 3, 9, 2.4);
  } else if (kind === 'axe') {
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -17); ctx.stroke();
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(10, -16, 9, -5); ctx.quadraticCurveTo(4, -10, 0, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'spear' || kind === 'lance') {
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -26); ctx.stroke();
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(3.5, -25); ctx.lineTo(0, -20); ctx.lineTo(-3.5, -25); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (kind === 'lance') { ctx.fillStyle = accent; ctx.fillRect(0, -24, 8, 4); }
  } else if (kind === 'staff') {
    ctx.strokeStyle = '#7b5238'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -22); ctx.stroke();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, -28, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (kind === 'hammer' || kind === 'mace') {
    ctx.strokeStyle = '#7b5238'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -19); ctx.stroke();
    ctx.fillStyle = kind === 'mace' ? '#575d69' : metal;
    ctx.beginPath(); ctx.arc(0, -23, kind === 'mace' ? 6 : 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (kind === 'mace') {
      ctx.strokeStyle = '#b7bec8'; ctx.lineWidth = 1.8;
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + i * 1.2;
        ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 5, -23 + Math.sin(angle) * 5); ctx.lineTo(Math.cos(angle) * 9, -23 + Math.sin(angle) * 9); ctx.stroke();
      }
    }
  } else if (kind === 'maces') {
    ctx.fillStyle = '#575d69';
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 10, -18); ctx.rotate(side * 0.3);
      ctx.beginPath(); ctx.arc(0, -4, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#b7bec8'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 4, -4 + Math.sin(angle) * 4); ctx.lineTo(Math.cos(angle) * 8, -4 + Math.sin(angle) * 8); ctx.stroke();
      }
      ctx.restore();
    }
  } else if (kind === 'bow') {
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(0, -12, 10, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = '#f0e3c2'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(4, -21); ctx.lineTo(4, -3); ctx.stroke();
    ctx.strokeStyle = metal; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(12, -12); ctx.stroke();
  } else if (kind === 'musket' || kind === 'cannon') {
    ctx.fillStyle = '#4b4f5b';
    ctx.fillRect(-3, -13, 20, 5);
    ctx.fillRect(-3, -13, 5, 11);
    ctx.fillStyle = metal; ctx.fillRect(12, -14, 9, 3);
  } else if (kind === 'pickaxe') {
    ctx.strokeStyle = '#7b5238'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(0, 7); ctx.lineTo(0, -18); ctx.stroke();
    ctx.strokeStyle = metal; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -18, 8, -2.7, -0.4); ctx.stroke();
  } else if (kind === 'dagger') {
    ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(2, -11); ctx.lineTo(5, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'bomb') {
    ctx.fillStyle = '#343946'; ctx.beginPath(); ctx.arc(0, -8, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(4, -15); ctx.quadraticCurveTo(8, -22, 4, -26); ctx.stroke();
    ctx.fillStyle = '#ffb648'; ctx.beginPath(); ctx.arc(4, -27, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHumanSprite(ctx, unit, a, teamColor, swing) {
  humanCanvasBody(ctx, a, teamColor, swing, a.big);
}

function drawSkeletonSprite(ctx, unit, a, teamColor, swing) {
  const bone = a.bone || '#e8f1ec';
  const cloth = a.cloth || '#526f86';
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  leg(ctx, -4, -2, bone, swing * 2);
  leg(ctx, 4, -2, bone, -swing * 2);
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.roundRect(-8, -25, 16, 22, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bone;
  for (let i = 0; i < 3; i++) ctx.fillRect(-6, -22 + i * 5, 12, 2);
  ctx.strokeStyle = bone; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(-12, -12); ctx.moveTo(8, -20); ctx.lineTo(12, -12); ctx.stroke();
  ctx.fillStyle = bone;
  ctx.beginPath(); ctx.arc(0, -36, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#26313d';
  ctx.beginPath(); ctx.ellipse(0, -37, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = a.accent || '#9fe8ff';
  ctx.beginPath(); ctx.arc(-3.3, -37, 1.3, 0, Math.PI * 2); ctx.arc(3.3, -37, 1.3, 0, Math.PI * 2); ctx.fill();
  drawCanvasHelmet(ctx, a, teamColor);
  if (a.shield) {
    ctx.fillStyle = a.metal || '#c6d4de';
    ctx.beginPath(); ctx.ellipse(-10, -16, 4.5, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  drawCanvasWeapon(ctx, a, swing);
  if (a.weapon === 'bomb' && a.big) {
    ctx.fillStyle = '#343946'; ctx.beginPath(); ctx.arc(-14, -10, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -18); ctx.quadraticCurveTo(-3, -26, -8, -30); ctx.stroke();
    ctx.fillStyle = '#ffb648'; ctx.beginPath(); ctx.arc(-8, -31, 2.4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGoblinSprite(ctx, unit, a, teamColor, swing) {
  const skin = a.skin || '#69c34f';
  const cloth = a.cloth || '#8a5b32';
  leg(ctx, -4, -2, skin, swing * 2);
  leg(ctx, 4, -2, skin, -swing * 2);
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.roundRect(-7, -22, 14, 19, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -31, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-9, -33); ctx.lineTo(-18, -38); ctx.lineTo(-10, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -33); ctx.lineTo(18, -38); ctx.lineTo(10, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
  spriteEyes(ctx, 0, -32, 3.4);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-4, -27); ctx.quadraticCurveTo(0, -24, 4, -27); ctx.stroke();
  drawCanvasWeapon(ctx, a, swing);
}

function drawGargoyleSprite(ctx, unit, a, teamColor, swing, time) {
  const skin = a.skin || '#5a9bd4';
  const cloth = a.cloth || '#2f5d8f';
  const wing = Math.sin(time * 11 + unit.id) * 2;
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.moveTo(-5, -20); ctx.lineTo(-20, -28 - wing); ctx.lineTo(-13, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -20); ctx.lineTo(20, -28 - wing); ctx.lineTo(13, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.roundRect(-7, -24, 14, 20, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -33, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = a.metal || '#a9bfd0';
  ctx.beginPath(); ctx.arc(0, -35, 10, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#26313d'; ctx.fillRect(-7, -36, 5, 4); ctx.fillRect(2, -36, 5, 4);
  ctx.fillStyle = a.accent || '#8ff1ff'; ctx.fillRect(-6, -35, 2, 1.6); ctx.fillRect(3, -35, 2, 1.6);
  ctx.strokeStyle = '#f0e3c2'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-3, -26); ctx.lineTo(-5, -23); ctx.moveTo(3, -26); ctx.lineTo(5, -23); ctx.stroke();
  drawCanvasWeapon(ctx, a, swing);
}

function drawGolemSprite(ctx, unit, a, teamColor) {
  const skin = a.skin || '#bde7f5';
  const cloth = a.cloth || '#7cc5e8';
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.roundRect(-11, -24, 22, 23, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.roundRect(-14, -18, 7, 17, 3); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(7, -18, 7, 17, 3); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -33, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = a.accent || '#e9fdff';
  ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(-5, -46); ctx.lineTo(0, -42); ctx.lineTo(5, -46); ctx.lineTo(10, -40); ctx.lineTo(7, -33); ctx.lineTo(-7, -33); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#22303d'; ctx.beginPath(); ctx.arc(-3.5, -34, 1.6, 0, Math.PI * 2); ctx.arc(3.5, -34, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = a.accent || '#e9fdff'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(-2, -12); ctx.lineTo(-7, -6); ctx.moveTo(6, -20); ctx.lineTo(2, -12); ctx.lineTo(7, -6); ctx.stroke();
}

function drawRobotSprite(ctx, unit, a, teamColor, swing) {
  const skin = a.skin || '#4f8bd6';
  const cloth = a.cloth || '#2b4e7c';
  const metal = a.metal || '#9fb7c8';
  leg(ctx, -5, -2, metal, swing * 1.5);
  leg(ctx, 5, -2, metal, -swing * 1.5);
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.roundRect(-9, -24, 18, 21, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.roundRect(-7, -20, 14, 9, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = a.accent || '#89f4ff'; ctx.beginPath(); ctx.arc(0, -16, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.roundRect(-11, -21, 5, 12, 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(6, -21, 5, 12, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.roundRect(-8, -40, 16, 13, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#22303d'; ctx.fillRect(-6, -36, 4.5, 4); ctx.fillRect(2, -36, 4.5, 4);
  ctx.fillStyle = a.accent || '#89f4ff'; ctx.fillRect(-5.2, -35, 1.8, 1.8); ctx.fillRect(2.8, -35, 1.8, 1.8);
  if (a.horns) {
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.moveTo(-8, -39); ctx.lineTo(-14, -46); ctx.lineTo(-5, -43); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -39); ctx.lineTo(14, -46); ctx.lineTo(5, -43); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  drawCanvasWeapon(ctx, a, swing);
}

function drawGhostSprite(ctx, unit, a, teamColor, swing) {
  const skin = a.skin || '#d9f4ff';
  const cloth = a.cloth || '#5f89a8';
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(-10, -3);
  ctx.quadraticCurveTo(-12, -22, -8, -30);
  ctx.quadraticCurveTo(0, -40, 8, -30);
  ctx.quadraticCurveTo(12, -22, 10, -3);
  ctx.quadraticCurveTo(7, 2, 4, -2);
  ctx.quadraticCurveTo(0, 3, -4, -2);
  ctx.quadraticCurveTo(-7, 2, -10, -3);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -31, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.arc(0, -34, 9.5, Math.PI, Math.PI * 2); ctx.lineTo(7, -27); ctx.quadraticCurveTo(0, -23, -7, -27); ctx.closePath(); ctx.fill();
  ctx.fillStyle = a.accent || '#9ff5ff';
  ctx.beginPath(); ctx.arc(-3.4, -31, 1.5, 0, Math.PI * 2); ctx.arc(3.4, -31, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  drawCanvasWeapon(ctx, a, swing);
}

function drawSpiritSprite(ctx, unit, a, teamColor) {
  const cloth = a.cloth || '#ff5d3a';
  const skin = a.skin || '#ff9b3d';
  const accent = a.accent || '#ffe27a';
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.quadraticCurveTo(13, -20, 10, -6);
  ctx.quadraticCurveTo(6, 4, 0, 4);
  ctx.quadraticCurveTo(-6, 4, -10, -6);
  ctx.quadraticCurveTo(-13, -20, 0, -34);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(0, -14, 7, 12, 0, 0, Math.PI * 2); ctx.fill();
  spriteEyes(ctx, 0, -16, 3);
  ctx.strokeStyle = '#6e2b1f'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, -10, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.quadraticCurveTo(4, -44, 8, -38); ctx.quadraticCurveTo(3, -36, 2, -30); ctx.fill();
}

function drawBeastSprite(ctx, unit, a, teamColor, time) {
  const skin = a.skin || '#8d314b';
  const cloth = a.cloth || '#4b1a31';
  const accent = a.accent || '#ff9b3d';
  const wing = Math.sin(time * 8 + unit.id) * 2.5;
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(-24, -30 - wing); ctx.lineTo(-15, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -20); ctx.lineTo(24, -30 - wing); ctx.lineTo(15, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(0, -15, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -27, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e2d6c2';
  ctx.beginPath(); ctx.moveTo(-8, -33); ctx.lineTo(-12, -42); ctx.lineTo(-3, -35); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -33); ctx.lineTo(12, -42); ctx.lineTo(3, -35); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(-3.5, -28, 1.5, 0, Math.PI * 2); ctx.arc(3.5, -28, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f0e3c2';
  ctx.beginPath(); ctx.moveTo(-5, -22); ctx.lineTo(-3, -19); ctx.lineTo(-1, -22); ctx.lineTo(1, -19); ctx.lineTo(3, -22); ctx.lineTo(5, -19); ctx.lineTo(3, -24); ctx.lineTo(-3, -24); ctx.closePath(); ctx.fill();
  if (a.lava) {
    ctx.strokeStyle = accent; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-2, -6); ctx.lineTo(-6, 0); ctx.moveTo(6, -12); ctx.lineTo(2, -6); ctx.lineTo(6, 0); ctx.stroke();
  }
}

function drawBalloonSprite(ctx, unit, a, teamColor, time) {
  const skin = a.skin || '#c94f4f';
  const cloth = a.cloth || '#7a2b2b';
  const metal = a.metal || '#c9a26a';
  const accent = a.accent || '#ffb648';
  const sway = Math.sin(time * 3 + unit.id) * 1.6;
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(sway, -34, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.ellipse(sway, -34, 8, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(sway - 13, -40); ctx.quadraticCurveTo(sway, -47, sway + 13, -40); ctx.moveTo(sway - 14, -33); ctx.quadraticCurveTo(sway, -40, sway + 14, -33); ctx.stroke();
  ctx.strokeStyle = metal; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sway - 6, -20); ctx.lineTo(sway - 4, -10); ctx.moveTo(sway + 6, -20); ctx.lineTo(sway + 4, -10); ctx.stroke();
  ctx.fillStyle = metal; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-8, -10, 16, 12, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a5230'; ctx.fillRect(-7, -6, 14, 1.6);
  ctx.fillStyle = '#2f3540';
  ctx.beginPath(); ctx.arc(0, -2, 4.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = metal; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(3, -6); ctx.quadraticCurveTo(7, -12, 5, -17); ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(5, -19, 1.8, 0, Math.PI * 2); ctx.fill();
}

function drawStructureSprite(ctx, unit, a, teamColor, time) {
  const style = a.style || 'cannon';
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  if (style === 'cannon' || style === 'mortar') {
    ctx.fillStyle = a.wood || '#8a5b32';
    ctx.beginPath(); ctx.roundRect(-13, -12, 26, 14, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5e4128'; ctx.fillRect(-11, -8, 22, 2);
    if (style === 'cannon') {
      ctx.fillStyle = '#3f4754';
      ctx.beginPath(); ctx.moveTo(-8, -11); ctx.lineTo(4, -23); ctx.lineTo(14, -19); ctx.lineTo(2, -7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#202632'; ctx.beginPath(); ctx.arc(11, -18, 5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#3f4754';
      ctx.beginPath(); ctx.moveTo(-5, -11); ctx.lineTo(0, -28); ctx.lineTo(9, -27); ctx.lineTo(8, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#202632'; ctx.beginPath(); ctx.ellipse(4, -28, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = a.accent || '#ffb648'; ctx.beginPath(); ctx.arc(-9, -4, 2.4, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'tesla') {
    ctx.fillStyle = '#4e6170'; ctx.beginPath(); ctx.roundRect(-12, -12, 24, 14, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f3d4b'; ctx.beginPath(); ctx.roundRect(-7, -26, 14, 15, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = a.accent || '#8ff1ff';
    ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(-5, -24); ctx.lineTo(1, -24); ctx.lineTo(-3, -16); ctx.stroke();
    ctx.strokeStyle = a.accent || '#8ff1ff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -30, 7 + Math.sin(time * 8) * 1.2, 0, Math.PI * 2); ctx.stroke();
  } else if (style === 'goblin-hut') {
    ctx.fillStyle = a.wood || '#8a5b32'; ctx.beginPath(); ctx.roundRect(-13, -12, 26, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3f7d43'; ctx.beginPath(); ctx.moveTo(-16, -11); ctx.lineTo(0, -30); ctx.lineTo(16, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3b2a1d'; ctx.fillRect(-4, -10, 8, 11);
    ctx.fillStyle = a.accent || '#7ee05d'; ctx.beginPath(); ctx.arc(0, -3, 1.6, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'collector') {
    ctx.fillStyle = '#5b4169'; ctx.beginPath(); ctx.roundRect(-13, -12, 26, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = a.accent || '#c78bff'; ctx.beginPath(); ctx.roundRect(-8, -28, 16, 18, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7c3f9e'; ctx.beginPath(); ctx.roundRect(-5, -24, 10, 11, 4); ctx.fill();
    ctx.fillStyle = '#f0c7ff'; ctx.beginPath(); ctx.arc(0, -22, 2, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'barbarian-hut') {
    ctx.fillStyle = a.wood || '#7b5236'; ctx.beginPath(); ctx.roundRect(-14, -12, 28, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7d3c2e'; ctx.beginPath(); ctx.moveTo(-18, -10); ctx.lineTo(0, -31); ctx.lineTo(18, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3b2a1d'; ctx.fillRect(-4, -10, 8, 11);
    ctx.strokeStyle = a.metal || '#b8c7ce'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-11, -4); ctx.lineTo(-13, -16); ctx.moveTo(11, -4); ctx.lineTo(13, -16); ctx.stroke();
  } else if (style === 'bomb-tower') {
    ctx.fillStyle = '#5b6068'; ctx.beginPath(); ctx.roundRect(-13, -12, 26, 14, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3d424b'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-11, -7); ctx.lineTo(11, -7); ctx.moveTo(-12, -2); ctx.lineTo(12, -2); ctx.stroke();
    ctx.fillStyle = '#2f3540'; ctx.beginPath(); ctx.arc(0, -25, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#555d6a'; ctx.beginPath(); ctx.arc(-4, -29, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(7, -33); ctx.quadraticCurveTo(12, -42, 8, -49); ctx.stroke();
    ctx.fillStyle = a.accent || '#ff8a3d'; ctx.beginPath(); ctx.arc(8, -51, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = a.accent || '#ff8a3d'; ctx.beginPath(); ctx.arc(-9, -4, 1.8, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'inferno') {
    ctx.fillStyle = '#4b3c45'; ctx.beginPath(); ctx.roundRect(-13, -12, 26, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f2a32'; ctx.beginPath(); ctx.roundRect(-9, -30, 18, 19, 3); ctx.fill(); ctx.stroke();
    const flame = 3 + Math.sin(time * 9 + unit.id) * 2;
    ctx.fillStyle = a.accent || '#ff7a3d';
    ctx.beginPath(); ctx.moveTo(-6, -13); ctx.quadraticCurveTo(-9, -25, 0, -33 - flame); ctx.quadraticCurveTo(9, -25, 6, -13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe36e';
    ctx.beginPath(); ctx.moveTo(-2, -14); ctx.quadraticCurveTo(-3, -21, 0, -25 - flame * 0.4); ctx.quadraticCurveTo(3, -21, 2, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = a.accent || '#ff7a3d'; ctx.beginPath(); ctx.arc(-9, -4, 1.8, 0, Math.PI * 2); ctx.arc(9, -4, 1.8, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'tombstone') {
    ctx.fillStyle = '#8f958d';
    ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(-11, -20); ctx.quadraticCurveTo(-11, -31, 0, -31); ctx.quadraticCurveTo(11, -31, 11, -20); ctx.lineTo(11, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b8bdb4'; ctx.beginPath(); ctx.roundRect(-8, -27, 16, 26, 2); ctx.fill();
    ctx.strokeStyle = '#5b625a'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(4, -20); ctx.moveTo(0, -25); ctx.lineTo(0, -13); ctx.moveTo(-4, -7); ctx.lineTo(4, -7); ctx.stroke();
    ctx.fillStyle = a.accent || '#9fe8ff';
    ctx.beginPath(); ctx.arc(-11, 1, 1.5, 0, Math.PI * 2); ctx.arc(11, 1, 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'x-bow') {
    ctx.fillStyle = a.wood || '#7a5636'; ctx.beginPath(); ctx.roundRect(-13, -12, 26, 14, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6b4a2d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-16, -30); ctx.moveTo(8, -10); ctx.lineTo(16, -30); ctx.stroke();
    ctx.strokeStyle = a.metal || '#b8c7ce'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-16, -30); ctx.quadraticCurveTo(0, -38, 16, -30); ctx.stroke();
    ctx.strokeStyle = '#f0e3c2'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-16, -30); ctx.lineTo(16, -30); ctx.moveTo(0, -36); ctx.lineTo(0, -14); ctx.stroke();
    ctx.fillStyle = a.accent || '#ffb648';
    ctx.beginPath(); ctx.moveTo(0, -39); ctx.lineTo(3, -33); ctx.lineTo(-3, -33); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4f5a'; ctx.beginPath(); ctx.arc(0, -16, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

export function drawTowerSprite(ctx, tower, time) {
  const blue = tower.team === 0;
  const stone = tower.hitFlash > 0 ? '#ffffff' : (blue ? '#b8c7d6' : '#d6b4b4');
  const stoneDark = blue ? '#6f8294' : '#8c6a6a';
  const banner = blue ? '#3e8fe0' : '#e04b4b';
  const bannerDark = blue ? '#205b9e' : '#9e2b2b';
  const king = tower.kind === 'king';
  const s = king ? 1.3 : 1;
  ctx.save();
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.fillStyle = 'rgba(10,20,26,.28)';
  ctx.beginPath(); ctx.ellipse(0, 6, 32, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = stoneDark;
  ctx.beginPath(); ctx.roundRect(-24, -22, 48, 28, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = stone;
  ctx.beginPath(); ctx.roundRect(-20, -18, 40, 21, 3); ctx.fill();
  ctx.fillStyle = stoneDark;
  for (let i = 0; i < 4; i++) ctx.fillRect(-18 + i * 10, -22, 5, 4);
  ctx.fillStyle = banner;
  ctx.beginPath(); ctx.moveTo(-17, -18); ctx.lineTo(17, -18); ctx.lineTo(14, 1); ctx.lineTo(0, 6); ctx.lineTo(-14, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bannerDark;
  ctx.beginPath(); ctx.moveTo(-17, -18); ctx.lineTo(-17, -2); ctx.lineTo(-14, 1); ctx.lineTo(-11, -2); ctx.lineTo(-11, -18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(0, -9, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a5a1c';
  ctx.beginPath(); ctx.arc(0, -9, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = stone;
  ctx.beginPath(); ctx.roundRect(-14, -34, 28, 14, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2c3a46';
  ctx.beginPath(); ctx.roundRect(-8, -31, 16, 7, 2); ctx.fill();
  ctx.fillStyle = banner;
  ctx.beginPath(); ctx.moveTo(-1, -47); ctx.lineTo(1, -47); ctx.lineTo(13, -41); ctx.lineTo(1, -36); ctx.lineTo(-1, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (king) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(-7, -49); ctx.lineTo(-5, -57); ctx.lineTo(0, -52); ctx.lineTo(5, -57); ctx.lineTo(7, -49); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3d12';
    ctx.beginPath(); ctx.arc(-3, -52, 1, 0, Math.PI * 2); ctx.arc(3, -52, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function crownSVG(className = '') {
  return `<svg class="crown-svg ${className}" viewBox="0 0 48 34" aria-hidden="true"><path d="M4 27 2 8l11 9L24 3l11 14 11-9-2 19Z" fill="#ffd166" stroke="#7a5210" stroke-width="3" stroke-linejoin="round"/><path d="M6 28h36v4H6Z" fill="#e0a92b" stroke="#7a5210" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="18" r="3.4" fill="#ff5d8f"/><circle cx="12" cy="18" r="2.4" fill="#65d8ff"/><circle cx="36" cy="18" r="2.4" fill="#65d8ff"/></svg>`;
}

export function elixirSVG(className = '') {
  return `<svg class="elixir-svg ${className}" viewBox="0 0 32 36" aria-hidden="true"><path d="M16 2c7 8 12 14 12 20a12 12 0 0 1-24 0C4 16 9 10 16 2Z" fill="#d174ff" stroke="#5d1d82" stroke-width="2.5"/><path d="M16 8c4 5 7 9 7 13a7 7 0 0 1-14 0c0-4 3-8 7-13Z" fill="#f0b6ff" opacity=".7"/></svg>`;
}
