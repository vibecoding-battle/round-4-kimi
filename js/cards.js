export const ARENA = Object.freeze({
  width: 720,
  height: 960,
  riverTop: 444,
  riverBottom: 516,
  bridges: [174, 546],
  matchTime: 180,
  overtimeTime: 60,
  elixirRate: 1 / 2.65,
});

export const CARDS = Object.freeze({
  gardien: {
    id: 'gardien', name: 'Gardien', cost: 3, type: 'unit', role: 'Corps à corps',
    description: 'Un combattant fiable qui ouvre la voie et encaisse les dégâts.',
    color: '#64e6ff', hp: 980, damage: 112, speed: 52, range: 31, aggro: 190,
    attackRate: 1.05, radius: 18, count: 1, canHitAir: false,
  },
  volt: {
    id: 'volt', name: 'Volt', cost: 4, type: 'unit', role: 'Tir à distance',
    description: 'Projette des éclats d’énergie à distance, au sol comme dans les airs.',
    color: '#b799ff', hp: 480, damage: 142, speed: 44, range: 170, aggro: 220,
    attackRate: 1.3, radius: 16, count: 1, canHitAir: true, projectileSpeed: 430,
  },
  essaim: {
    id: 'essaim', name: 'Essaim', cost: 2, type: 'unit', role: '3 unités rapides',
    description: 'Trois machineries agiles. Idéales pour encercler une cible isolée.',
    color: '#ffd166', hp: 165, damage: 52, speed: 82, range: 23, aggro: 175,
    attackRate: 0.68, radius: 10, count: 3, canHitAir: false,
  },
  atlas: {
    id: 'atlas', name: 'Atlas', cost: 5, type: 'unit', role: 'Colosse de siège',
    description: 'Une masse blindée qui ignore les unités et fonce sur les structures.',
    color: '#ff9f68', hp: 2300, damage: 210, speed: 32, range: 37, aggro: 0,
    attackRate: 1.45, radius: 25, count: 1, canHitAir: false, targetsBuildings: true,
  },
  comete: {
    id: 'comete', name: 'Comète', cost: 4, type: 'spell', role: 'Frappe de zone',
    description: 'Une frappe orbitale dévastatrice. Touche aussi les tours, avec des dégâts réduits.',
    color: '#ff718b', spellDamage: 460, structureDamage: 230, spellRadius: 86, delay: 0.85,
  },
  aeron: {
    id: 'aeron', name: 'Aéron', cost: 3, type: 'unit', role: 'Unité volante',
    description: 'Survole la rivière et attaque à distance. Redoutable contre les troupes terrestres.',
    color: '#77f2c2', hp: 440, damage: 105, speed: 70, range: 95, aggro: 215,
    attackRate: 1, radius: 15, count: 1, canHitAir: true, flying: true, projectileSpeed: 400,
  },
  bastion: {
    id: 'bastion', name: 'Bastion', cost: 4, type: 'building', role: 'Défense · 30 s',
    description: 'Une tourelle temporaire qui attire les assaillants et couvre votre territoire.',
    color: '#63b3ff', hp: 1350, damage: 105, speed: 0, range: 185, aggro: 185,
    attackRate: 0.9, radius: 24, count: 1, canHitAir: true, projectileSpeed: 500, lifetime: 30,
  },
  pulse: {
    id: 'pulse', name: 'Pulse', cost: 2, type: 'spell', role: 'Choc ralentissant',
    description: 'Une impulsion de zone qui blesse et ralentit les ennemis pendant 2,8 secondes.',
    color: '#76a9ff', spellDamage: 155, structureDamage: 80, spellRadius: 96, delay: 0.25,
    slowDuration: 2.8, slowFactor: 0.48,
  },
});

export const DECK = Object.freeze(['gardien', 'essaim', 'volt', 'aeron', 'atlas', 'comete', 'bastion', 'pulse']);

export function cardArt(id) {
  const common = 'fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
  const shapes = {
    gardien: `<path ${common} d="M60 15 78 24v19c0 17-8 27-18 32-10-5-18-15-18-32V24Z"/><path ${common} d="m49 47 11 10 13-19"/>`,
    volt: `<path ${common} d="m67 10-25 38h20l-7 29 27-41H62Z"/><circle ${common} cx="60" cy="44" r="34" opacity=".3"/>`,
    essaim: `<path ${common} d="m38 35 10-9 10 9v17l-10 9-10-9Zm25-13 9-8 9 8v15l-9 8-9-8Zm5 34 9-8 9 8v15l-9 8-9-8Z"/><path ${common} d="M32 34 25 27m7 26-8 6m55-36 8-7m-7 51 9 7" opacity=".65"/>`,
    atlas: `<path ${common} d="m39 27 21-13 22 13-4 24-18 10-19-10Z"/><path ${common} d="m41 54-13 9 5 14 19-5m28-18 13 9-5 14-19-5M50 61l-3 16m23-16 3 16"/><path ${common} d="m52 35 8-5 9 5-9 7Z"/>`,
    comete: `<path ${common} d="M82 14C54 17 36 32 28 60m22-46C38 23 27 37 23 51"/><path ${common} d="m78 35 12 10-2 16-14 8-15-6-4-16 10-13Z"/><path ${common} d="m68 45 8 4-1 8-8 3-6-5 2-7Z"/>`,
    aeron: `<path ${common} d="m60 33 12 12-12 24-12-24Z"/><path ${common} d="m48 40-27-15-9 8 30 25m30-18 27-15 9 8-30 25M48 61l-14 9m38-9 14 9"/><circle ${common} cx="60" cy="47" r="5"/>`,
    bastion: `<path ${common} d="M36 73h48M42 72V42h36v30M49 42V27h22v15M55 27V15h10v12"/><path ${common} d="m60 15 20-7M51 53h18v10H51Z"/>`,
    pulse: `<circle ${common} cx="60" cy="45" r="10"/><circle ${common} cx="60" cy="45" r="25" opacity=".7"/><path ${common} d="M60 5v8m0 64v8M20 45h8m64 0h8M32 17l6 6m44 44 6 6m0-56-6 6M38 67l-6 6" opacity=".8"/>`,
  };
  return `<svg viewBox="0 0 120 88" aria-hidden="true" focusable="false">${shapes[id] || ''}</svg>`;
}
