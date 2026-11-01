export const ARENA = Object.freeze({
  width: 720,
  height: 960,
  riverTop: 444,
  riverBottom: 516,
  bridges: [180, 540],
  lanes: [180, 540],
  matchTime: 180,
  overtimeTime: 60,
  elixirRate: 1 / 2.8,
  deployTop: 160,
  deployBottom: 900,
  towerPositions: {
    player: { king: [360, 874], left: [180, 728], right: [540, 728] },
    enemy: { king: [360, 86], left: [180, 232], right: [540, 232] },
  },
});

export const RARITIES = Object.freeze({
  common: { label: 'Commune', color: '#b9d4ee', deep: '#5f83a6', glow: '#d9ecff' },
  rare: { label: 'Rare', color: '#ffb648', deep: '#b56b12', glow: '#ffd88a' },
  epic: { label: 'Épique', color: '#c78bff', deep: '#7738bb', glow: '#e3c1ff' },
  legendary: { label: 'Légendaire', color: '#ff77d4', deep: '#b22c86', glow: '#ffc4ee' },
});

export const DECK_SIZE = 8;

const HIDDEN = { hidden: true };

export const CARDS = Object.freeze({
  skeletons: {
    id: 'skeletons', name: 'Squelettes', cost: 1, rarity: 'common', type: 'troop',
    role: 'Nuée · 3 unités', description: 'Trois petits squelettes pour retarder, distraire et encercler.',
    hp: 90, damage: 90, count: 3, speed: 76, range: 30, hitSpeed: 1, radius: 9,
    deployTime: 0.8, art: { kind: 'skeleton', bone: '#e8f1ec', cloth: '#526f86', accent: '#9fe8ff', weapon: 'sword' },
  },
  'skeleton-army': {
    id: 'skeleton-army', name: 'Armée de Squelettes', cost: 3, rarity: 'epic', type: 'troop',
    role: 'Nuée · 15 unités', description: 'Une marée d’os qui noie les gros attaquants sous le nombre.',
    hp: 90, damage: 90, count: 15, speed: 72, range: 30, hitSpeed: 1, radius: 8,
    deployTime: 1, art: { kind: 'skeleton', bone: '#e8f1ec', cloth: '#556f84', accent: '#9fe8ff', weapon: 'sword' },
  },
  'spear-goblins': {
    id: 'spear-goblins', name: 'Lanciers Gobelins', cost: 2, rarity: 'common', type: 'troop',
    role: 'Distance · 3 unités', description: 'Trois lanciers qui harcèlent à distance, au sol comme dans les airs.',
    hp: 130, damage: 70, count: 3, speed: 76, range: 165, hitSpeed: 1.3, radius: 10,
    canHitAir: true, projectileSpeed: 520, deployTime: 0.8,
    art: { kind: 'goblin', skin: '#69c34f', cloth: '#8a5b32', accent: '#ffd166', weapon: 'spear' },
  },
  goblins: {
    id: 'goblins', name: 'Gobelins', cost: 2, rarity: 'common', type: 'troop',
    role: 'Nuée · 3 unités', description: 'Trois gobelins rapides qui submergent les cibles isolées.',
    hp: 170, damage: 100, count: 3, speed: 82, range: 30, hitSpeed: 1, radius: 10,
    deployTime: 0.8, art: { kind: 'goblin', skin: '#69c34f', cloth: '#8a5b32', accent: '#ffd166', weapon: 'dagger' },
  },
  minions: {
    id: 'minions', name: 'Sbires', cost: 3, rarity: 'common', type: 'troop',
    role: 'Volant · 3 unités', description: 'Trois sbires volants qui attaquent vite et couvrent les airs.',
    hp: 230, damage: 100, count: 3, speed: 82, range: 44, hitSpeed: 1, radius: 10,
    flying: true, canHitAir: true, deployTime: 0.9,
    art: { kind: 'gargoyle', skin: '#6e8cff', cloth: '#3e4cae', metal: '#c9d6ff', accent: '#a9f1ff', wings: true },
  },
  'minion-horde': {
    id: 'minion-horde', name: 'Horde de Sbires', cost: 5, rarity: 'common', type: 'troop',
    role: 'Volant · 6 unités', description: 'Six sbires déchaînés. Une nuée redoutable si elle atteint sa cible.',
    hp: 230, damage: 100, count: 6, speed: 82, range: 44, hitSpeed: 1, radius: 10,
    flying: true, canHitAir: true, deployTime: 1,
    art: { kind: 'gargoyle', skin: '#6e8cff', cloth: '#3e4cae', metal: '#c9d6ff', accent: '#a9f1ff', wings: true },
  },
  knight: {
    id: 'knight', name: 'Chevalier', cost: 3, rarity: 'common', type: 'troop',
    role: 'Corps à corps · Robuste', description: 'Un combattant équilibré, fiable en attaque comme en défense.',
    hp: 1450, damage: 160, count: 1, speed: 56, range: 32, hitSpeed: 1.1, radius: 15,
    deployTime: 0.9, art: { kind: 'human', skin: '#e8b08a', hair: '#f0c14b', cloth: '#4569b8', metal: '#d6e2ea', accent: '#ffcf4d', helmet: 'knight', weapon: 'sword' },
  },
  archers: {
    id: 'archers', name: 'Archères', cost: 3, rarity: 'common', type: 'troop',
    role: 'Distance · 2 unités', description: 'Deux archères qui visent aussi bien les troupes aériennes que terrestres.',
    hp: 300, damage: 90, count: 2, speed: 56, range: 195, hitSpeed: 1.2, radius: 11,
    canHitAir: true, projectileSpeed: 600, deployTime: 0.8,
    art: { kind: 'human', skin: '#f0b39b', hair: '#ff7ab8', cloth: '#6f5bc4', metal: '#d9e6ef', accent: '#ff9ad5', helmet: 'hood', weapon: 'bow' },
  },
  bomber: {
    id: 'bomber', name: 'Bombardier', cost: 3, rarity: 'common', type: 'troop',
    role: 'Distance · Dégâts de zone', description: 'Il lance des bombes qui explosent au sol et punissent les groupes serrés.',
    hp: 450, damage: 220, count: 1, speed: 50, range: 170, hitSpeed: 1.9, radius: 13,
    projectileSpeed: 380, splashRadius: 68, canHitAir: false, deployTime: 0.9,
    art: { kind: 'skeleton', bone: '#e8f1ec', cloth: '#3e536a', accent: '#ffb648', weapon: 'bomb', big: true },
  },
  'baby-dragon': {
    id: 'baby-dragon', name: 'Bébé Dragon', cost: 4, rarity: 'epic', type: 'troop',
    role: 'Volant · Zone', description: 'Un jeune dragon volant qui crache des flammes sur les groupes, au sol comme dans les airs.',
    hp: 1150, damage: 160, count: 1, speed: 44, range: 170, hitSpeed: 1.6, radius: 16,
    flying: true, canHitAir: true, splashRadius: 72, projectileSpeed: 380, deployTime: 1,
    art: { kind: 'beast', skin: '#7fd4f0', cloth: '#3c7fb5', accent: '#ffd166', wings: true, small: true },
  },
  'mega-knight': {
    id: 'mega-knight', name: 'Méga Chevalier', cost: 7, rarity: 'legendary', type: 'troop',
    role: 'Tank · Impact · Saut', description: 'Il s’écrase sur l’arène, saute sur les tireurs et frappe en zone avec ses masses.',
    hp: 3600, damage: 250, count: 1, speed: 52, range: 56, hitSpeed: 1.5, radius: 26,
    splashRadius: 92, spawnDamage: 500, spawnRadius: 100, deployTime: 1.3,
    jump: { range: 190, min: 65, cooldown: 5.5, radius: 85, damage: 320 },
    art: { kind: 'human', skin: '#b58263', hair: '#22222c', cloth: '#313445', metal: '#6b7180', accent: '#55c8ff', helmet: 'mega', weapon: 'maces', big: true },
  },
  prince: {
    id: 'prince', name: 'Prince', cost: 5, rarity: 'epic', type: 'troop',
    role: 'Charge · Dégâts lourds', description: 'Sa lance gagne en puissance après une longue course. Redoutable en contre.',
    hp: 1900, damage: 260, count: 1, speed: 60, range: 42, hitSpeed: 1.3, radius: 18,
    charge: { after: 1.2, speed: 1.85, damage: 2 }, deployTime: 1,
    art: { kind: 'human', skin: '#efb08a', hair: '#6b4128', cloth: '#a83d3d', metal: '#ffd166', accent: '#ff5d5d', helmet: 'prince', weapon: 'lance' },
  },
  valkyrie: {
    id: 'valkyrie', name: 'Valkyrie', cost: 4, rarity: 'rare', type: 'troop',
    role: 'Mêlée · Dégâts de zone', description: 'Sa hache tournoie et frappe toutes les unités autour d’elle.',
    hp: 1800, damage: 200, count: 1, speed: 56, range: 36, hitSpeed: 1.4, radius: 17,
    splashRadius: 62, deployTime: 0.9,
    art: { kind: 'human', skin: '#f0b08c', hair: '#ff8a3c', cloth: '#a55a3a', metal: '#c4d3d8', accent: '#ffbf5c', helmet: 'horned', weapon: 'axe' },
  },
  musketeer: {
    id: 'musketeer', name: 'Mousquetaire', cost: 4, rarity: 'rare', type: 'troop',
    role: 'Distance · Anti-aérien', description: 'Une tireuse d’élite à longue portée qui abat les cibles aériennes.',
    hp: 700, damage: 180, count: 1, speed: 52, range: 235, hitSpeed: 1.1, radius: 13,
    canHitAir: true, projectileSpeed: 760, deployTime: 0.9,
    art: { kind: 'human', skin: '#f1b69b', hair: '#7b4a67', cloth: '#56459e', metal: '#d4e0e7', accent: '#c896ff', helmet: 'tricorn', weapon: 'musket' },
  },
  wizard: {
    id: 'wizard', name: 'Sorcier', cost: 5, rarity: 'rare', type: 'troop',
    role: 'Distance · Zone', description: 'Ses boules de feu embrasent les groupes de troupes et les cibles aériennes.',
    hp: 700, damage: 200, count: 1, speed: 50, range: 195, hitSpeed: 1.3, radius: 14,
    canHitAir: true, splashRadius: 70, projectileSpeed: 470, deployTime: 1,
    art: { kind: 'human', skin: '#e8ab85', hair: '#b55b2a', cloth: '#4a4da8', metal: '#d7dfe7', accent: '#ff9c3d', helmet: 'wizard', weapon: 'staff' },
  },
  giant: {
    id: 'giant', name: 'Géant', cost: 5, rarity: 'rare', type: 'troop',
    role: 'Tank · Cible les bâtiments', description: 'Une montagne de muscles qui absorbe les coups et défonce les tours.',
    hp: 3200, damage: 220, count: 1, speed: 42, range: 40, hitSpeed: 1.4, radius: 25,
    targetsBuildings: true, deployTime: 1.2,
    art: { kind: 'human', skin: '#d79a6c', hair: '#6b4b32', cloth: '#8b5d3a', metal: '#c8a36a', accent: '#ffb648', helmet: 'none', weapon: 'fist', big: true },
  },
  golem: {
    id: 'golem', name: 'Golem', cost: 8, rarity: 'epic', type: 'troop',
    role: 'Tank · Éclate en golemites', description: 'Un colosse de pierre qui ignore les troupes et se brise en deux golemites en mourant.',
    hp: 5200, damage: 300, count: 1, speed: 34, range: 44, hitSpeed: 2.5, radius: 28,
    targetsBuildings: true, deployTime: 1.6,
    deathSpawn: { cardId: 'golemite', count: 2, spread: 38 },
    art: { kind: 'golem', skin: '#c7c3b5', cloth: '#8a8578', accent: '#ffd166' },
  },
  balloon: {
    id: 'balloon', name: 'Ballon', cost: 5, rarity: 'epic', type: 'troop',
    role: 'Volant · Siège · Explosif', description: 'Un ballon qui fonce sur les tours et lâche une bombe dévastatrice en éclatant.',
    hp: 1600, damage: 600, count: 1, targetsBuildings: true, speed: 46, range: 42, hitSpeed: 2.4, radius: 22,
    flying: true, deployTime: 1.2, deathDamage: 350, deathRadius: 110,
    art: { kind: 'balloon', skin: '#c94f4f', cloth: '#7a2b2b', metal: '#c9a26a', accent: '#ffb648' },
  },
  'giant-skeleton': {
    id: 'giant-skeleton', name: 'Squelette Géant', cost: 6, rarity: 'epic', type: 'troop',
    role: 'Tank · Bombe mortelle', description: 'Il avance lentement puis explose en mourant, infligeant d’énormes dégâts de zone.',
    hp: 3200, damage: 300, count: 1, speed: 46, range: 42, hitSpeed: 1.6, radius: 25,
    targetsBuildings: true, deathDamage: 900, deathRadius: 100, deployTime: 1.3,
    art: { kind: 'skeleton', bone: '#d9e7e2', cloth: '#3c4b58', accent: '#ffb648', weapon: 'bomb', big: true },
  },
  'mini-pekka': {
    id: 'mini-pekka', name: 'Mini P.E.K.K.A', cost: 4, rarity: 'rare', type: 'troop',
    role: 'Mêlée · Dégâts énormes', description: 'Un robot compact dont chaque coup punit les tanks les plus épais.',
    hp: 1200, damage: 400, count: 1, speed: 76, range: 32, hitSpeed: 1.6, radius: 16,
    deployTime: 1, art: { kind: 'robot', skin: '#4f8bd6', cloth: '#2b4e7c', metal: '#9fb7c8', accent: '#89f4ff', weapon: 'blade' },
  },
  pekka: {
    id: 'pekka', name: 'P.E.K.K.A', cost: 7, rarity: 'epic', type: 'troop',
    role: 'Mêlée · Colosse', description: 'Une armure vivante dont les coups uniques broient les tanks et les tours.',
    hp: 4000, damage: 750, count: 1, speed: 48, range: 42, hitSpeed: 1.8, radius: 24,
    deployTime: 1.4, art: { kind: 'robot', skin: '#6d6bb8', cloth: '#2f2d5c', metal: '#9b9ad0', accent: '#ff77d4', weapon: 'blade', horns: true },
  },
  'hog-rider': {
    id: 'hog-rider', name: 'Chevaucheur de Sanglier', cost: 4, rarity: 'rare', type: 'troop',
    role: 'Siège · Très rapide', description: 'Il saute la rivière et fonce droit sur les tours au volant de son sanglier.',
    hp: 1400, damage: 240, count: 1, speed: 96, range: 34, hitSpeed: 1.2, radius: 18,
    targetsBuildings: true, jumpRiver: true, deployTime: 0.9,
    art: { kind: 'human', skin: '#9a6244', hair: '#2e211c', cloth: '#6d4a35', metal: '#a8b6bc', accent: '#ffb648', helmet: 'mohawk', weapon: 'hammer', mount: 'hog' },
  },
  barbarians: {
    id: 'barbarians', name: 'Barbares', cost: 5, rarity: 'common', type: 'troop',
    role: 'Corps à corps · 4 unités', description: 'Quatre guerriers hargneux qui écrasent tout sur leur passage.',
    hp: 550, damage: 140, count: 4, speed: 56, range: 32, hitSpeed: 1.3, radius: 16,
    deployTime: 1, art: { kind: 'human', skin: '#d99a6c', hair: '#ffd166', cloth: '#7f5b3d', metal: '#b8c5ca', accent: '#ffb648', helmet: 'horned', weapon: 'axe' },
  },
  witch: {
    id: 'witch', name: 'Sorcière', cost: 5, rarity: 'epic', type: 'troop',
    role: 'Distance · Invoque des squelettes', description: 'Elle attaque à distance et invoque régulièrement de petits squelettes.',
    hp: 800, damage: 120, count: 1, speed: 50, range: 165, hitSpeed: 1.3, radius: 15,
    canHitAir: true, splashRadius: 45, projectileSpeed: 430, deployTime: 1,
    spawner: { cardId: 'skeletons', count: 3, interval: 7, first: 1.4, spread: 28 },
    art: { kind: 'human', skin: '#a9c8a6', hair: '#3b2456', cloth: '#6f3c99', metal: '#d2b3ff', accent: '#b06bff', helmet: 'witch', weapon: 'staff' },
  },
  cannon: {
    id: 'cannon', name: 'Canon', cost: 3, rarity: 'common', type: 'building',
    role: 'Bâtiment · Défense sol', description: 'Une tourelle économique qui découpe les attaquants terrestres.',
    hp: 1000, damage: 120, range: 220, hitSpeed: 0.9, lifetime: 30, radius: 27,
    projectileSpeed: 560, canHitAir: false, deployTime: 1, targetsBuildings: false,
    art: { kind: 'building', style: 'cannon', wood: '#8d623d', metal: '#b8c7ce', accent: '#ffb648' },
  },
  tesla: {
    id: 'tesla', name: 'Tesla', cost: 4, rarity: 'common', type: 'building',
    role: 'Bâtiment · Anti-air', description: 'Une bobine électrique qui frappe au sol comme dans les airs.',
    hp: 1000, damage: 150, range: 195, hitSpeed: 1, lifetime: 35, radius: 25,
    canHitAir: true, projectileSpeed: 900, projectileKind: 'electric', deployTime: 1,
    art: { kind: 'building', style: 'tesla', wood: '#4e6170', metal: '#b8c7ce', accent: '#8ff1ff' },
  },
  'bomb-tower': {
    id: 'bomb-tower', name: 'Tour à Bombes', cost: 4, rarity: 'rare', type: 'building',
    role: 'Bâtiment · Zone · Sol', description: 'Elle bombarde les troupes terrestres à moyenne portée. Parfaite contre les nuées.',
    hp: 1300, damage: 220, range: 210, hitSpeed: 1.6, lifetime: 35, radius: 29,
    projectileSpeed: 420, projectileKind: 'cannonball', splashRadius: 70, canHitAir: false, deployTime: 1,
    art: { kind: 'building', style: 'bomb-tower', wood: '#7a5636', metal: '#aebfc8', accent: '#ff8a3d' },
  },
  'inferno-tower': {
    id: 'inferno-tower', name: 'Tour Inferno', cost: 5, rarity: 'rare', type: 'building',
    role: 'Bâtiment · Anti-tank', description: 'Son rayon chauffe progressivement et finit par liquéfier les plus gros tanks.',
    hp: 1500, damage: 40, range: 220, hitSpeed: 0.4, lifetime: 40, radius: 27,
    canHitAir: true, projectileSpeed: 1200, projectileKind: 'electric',
    ramp: { rate: 1.9, max: 8 }, deployTime: 1,
    art: { kind: 'building', style: 'inferno', wood: '#4b3c45', metal: '#8c7a78', accent: '#ff7a3d' },
  },
  'goblin-hut': {
    id: 'goblin-hut', name: 'Cabane Gobeline', cost: 5, rarity: 'rare', type: 'building',
    role: 'Bâtiment · Invoque', description: 'Une cabane qui envoie régulièrement des lanciers gobelins se battre.',
    hp: 1300, lifetime: 45, radius: 29, deployTime: 1,
    spawner: { cardId: 'spear-goblins', count: 1, interval: 4.5, first: 1.2, spread: 24 },
    art: { kind: 'building', style: 'goblin-hut', wood: '#8a5b32', metal: '#b8c7ce', accent: '#7ee05d' },
  },
  mortar: {
    id: 'mortar', name: 'Mortier', cost: 4, rarity: 'common', type: 'building',
    role: 'Bâtiment · Siège · Zone', description: 'Il bombarde de loin et peut cibler les tours adverses. Angle mort rapproché.',
    hp: 1000, damage: 200, range: 340, minRange: 120, hitSpeed: 2, lifetime: 30, radius: 28,
    splashRadius: 68, projectileSpeed: 300, canHitAir: false, deployTime: 1,
    art: { kind: 'building', style: 'mortar', wood: '#6f5a44', metal: '#aeb7b8', accent: '#ffb648' },
  },
  'elixir-collector': {
    id: 'elixir-collector', name: "Collecteur d'Élixir", cost: 6, rarity: 'rare', type: 'building',
    role: 'Bâtiment · Économie', description: 'Il produit de l’élixir supplémentaire tant qu’il reste en vie. Investissement risqué.',
    hp: 900, lifetime: 70, radius: 29, deployTime: 1,
    elixirInterval: 8.5, elixirAmount: 1,
    art: { kind: 'building', style: 'collector', wood: '#6b4a79', metal: '#d0c6de', accent: '#c78bff' },
  },
  'barbarian-hut': {
    id: 'barbarian-hut', name: 'Cabane de Barbares', cost: 7, rarity: 'rare', type: 'building',
    role: 'Bâtiment · Invoque', description: 'Une hutte fortifiée qui libère des barbares pour défendre votre territoire.',
    hp: 1600, lifetime: 50, radius: 31, deployTime: 1.1,
    spawner: { cardId: 'barbarians', count: 1, interval: 9, first: 1.5, spread: 30 },
    art: { kind: 'building', style: 'barbarian-hut', wood: '#7b5236', metal: '#b8c7ce', accent: '#ffb648' },
  },
  tombstone: {
    id: 'tombstone', name: 'Pierre Tombale', cost: 3, rarity: 'rare', type: 'building',
    role: 'Bâtiment · Invoque', description: 'Elle libère des squelettes sans relâche et en invoque quatre de plus en se brisant.',
    hp: 500, lifetime: 30, radius: 24, deployTime: 1,
    spawner: { cardId: 'skeletons', count: 1, interval: 3.5, first: 1.1, spread: 20 },
    deathSpawn: { cardId: 'skeletons', count: 4, spread: 24 },
    art: { kind: 'building', style: 'tombstone', wood: '#6d6a62', metal: '#b8c7ce', accent: '#9fe8ff' },
  },
  'x-bow': {
    id: 'x-bow', name: 'Arbalète', cost: 6, rarity: 'epic', type: 'building',
    role: 'Bâtiment · Siège · Longue portée', description: 'Une arbalète automatique qui verrouille les tours adverses à très longue portée.',
    hp: 1300, damage: 60, range: 340, hitSpeed: 0.3, lifetime: 40, radius: 26,
    targetsBuildings: true, projectileSpeed: 900, projectileKind: 'arrow', deployTime: 1.2,
    art: { kind: 'building', style: 'x-bow', wood: '#7a5636', metal: '#b8c7ce', accent: '#ffb648' },
  },
  zap: {
    id: 'zap', name: 'Éclair', cost: 2, rarity: 'common', type: 'spell',
    role: 'Sort · Zone · Étourdit', description: 'Une décharge instantanée qui blesse légèrement et étourdit tout un groupe.',
    spell: { damage: 200, towerDamage: 80, radius: 72, delay: 0.25, effect: 'damage', stun: 0.6 },
    art: { kind: 'spell', style: 'zap', accent: '#8ff1ff', deep: '#2d6eae' },
  },
  arrows: {
    id: 'arrows', name: 'Flèches', cost: 3, rarity: 'common', type: 'spell',
    role: 'Sort · Zone · Anti-nuée', description: 'Une volée de flèches qui nettoie les petites troupes, même volantes.',
    spell: { damage: 250, towerDamage: 100, radius: 124, delay: 0.9, effect: 'damage', air: true },
    art: { kind: 'spell', style: 'arrows', accent: '#ffd166', deep: '#8a5b32' },
  },
  fireball: {
    id: 'fireball', name: 'Boule de Feu', cost: 4, rarity: 'rare', type: 'spell',
    role: 'Sort · Zone · Impact', description: 'Une boule de feu qui frappe les groupes et repousse légèrement les survivants.',
    spell: { damage: 450, towerDamage: 170, radius: 76, delay: 0.7, effect: 'damage', knockback: 52, air: true },
    art: { kind: 'spell', style: 'fireball', accent: '#ff9b3d', deep: '#b53626' },
  },
  rocket: {
    id: 'rocket', name: 'Fusée', cost: 6, rarity: 'rare', type: 'spell',
    role: 'Sort · Dégâts massifs', description: 'Une roquette lente mais dévastatrice. Parfaite pour achever une tour ou un tank.',
    spell: { damage: 1200, towerDamage: 400, radius: 80, delay: 1.1, effect: 'damage', knockback: 58, air: true },
    art: { kind: 'spell', style: 'rocket', accent: '#ffb648', deep: '#4a4f5c' },
  },
  lightning: {
    id: 'lightning', name: 'Foudre', cost: 6, rarity: 'epic', type: 'spell',
    role: 'Sort · 3 cibles · Étourdit', description: 'Trois éclairs frappent les cibles les plus résistantes de la zone et les étourdissent.',
    spell: { damage: 700, towerDamage: 250, radius: 170, delay: 1, effect: 'lightning', targets: 3, stun: 0.5 },
    art: { kind: 'spell', style: 'lightning', accent: '#ffe36e', deep: '#4a6fb5' },
  },
  freeze: {
    id: 'freeze', name: 'Gel', cost: 4, rarity: 'epic', type: 'spell',
    role: 'Sort · Gèle une zone', description: 'Glace les troupes et les tours prises dans la zone. Aucun dégât, mais un contrôle total.',
    spell: { radius: 96, delay: 0.45, effect: 'freeze', duration: 4 },
    art: { kind: 'spell', style: 'freeze', accent: '#9df1ff', deep: '#2f6da8' },
  },
  rage: {
    id: 'rage', name: 'Rage', cost: 2, rarity: 'epic', type: 'spell',
    role: 'Sort · Accélère les alliés', description: 'Un nuage violet qui accélère les déplacements et les attaques de vos troupes.',
    spell: { radius: 104, delay: 0.35, effect: 'rage', duration: 6 },
    art: { kind: 'spell', style: 'rage', accent: '#d58bff', deep: '#65328f' },
  },
  'goblin-barrel': {
    id: 'goblin-barrel', name: 'Baril Gobelin', cost: 3, rarity: 'epic', type: 'spell',
    role: 'Sort · Invoque 3 gobelins', description: 'Un baril largué n’importe où qui libère trois gobelins prêts à frapper.',
    spell: { radius: 58, delay: 0.85, effect: 'spawn', cardId: 'goblins', count: 3, spawnSpread: 26 },
    art: { kind: 'spell', style: 'barrel', accent: '#7ee05d', deep: '#5a3a22' },
  },
  mirror: {
    id: 'mirror', name: 'Miroir', cost: 1, rarity: 'epic', type: 'spell',
    role: 'Sort · Copie la dernière carte', description: 'Rejoue votre dernière carte pour 1 élixir de plus. Ne copie pas le Miroir.',
    spell: { radius: 60, delay: 0.35, effect: 'mirror' },
    dynamicCost: true,
    art: { kind: 'spell', style: 'mirror', accent: '#b8e6ff', deep: '#4b6e9a' },
  },

  golemite: {
    ...HIDDEN, id: 'golemite', name: 'Golemite', cost: 0, rarity: 'epic', type: 'troop',
    hp: 1200, damage: 100, count: 1, speed: 35, range: 36, hitSpeed: 2.5, radius: 15,
    targetsBuildings: true,
    art: { kind: 'golem', skin: '#c7c3b5', cloth: '#8a8578', accent: '#ffd166', small: true },
  },
});

export const PLAYABLE_CARDS = Object.freeze(
  Object.values(CARDS).filter((card) => !card.hidden).map((card) => card.id),
);

export const DEFAULT_DECK = Object.freeze([
  'mega-knight', 'fireball', 'knight', 'minions', 'arrows', 'archers', 'goblins', 'zap',
]);

export const AI_DECKS = Object.freeze([
  ['giant', 'musketeer', 'mini-pekka', 'knight', 'archers', 'fireball', 'arrows', 'cannon'],
  ['pekka', 'wizard', 'valkyrie', 'hog-rider', 'musketeer', 'zap', 'fireball', 'cannon'],
  ['golem', 'baby-dragon', 'mega-knight', 'witch', 'arrows', 'zap', 'goblins', 'tesla'],
]);

export const CARD_ORDER = Object.freeze(
  [...PLAYABLE_CARDS].sort((a, b) => {
    const cardA = CARDS[a];
    const cardB = CARDS[b];
    const order = { troop: 0, building: 1, spell: 2 };
    return cardA.cost - cardB.cost || order[cardA.type] - order[cardB.type] || cardA.name.localeCompare(cardB.name, 'fr');
  }),
);

export function getCard(id) {
  return CARDS[id] || null;
}

export function cardCost(card, lastPlayed = null) {
  if (!card) return 0;
  if (card.id === 'mirror') {
    const target = lastPlayed ? CARDS[lastPlayed] : null;
    return target && target.id !== 'mirror' ? target.cost + 1 : card.cost;
  }
  return card.cost;
}

export function averageElixir(deck) {
  if (!deck?.length) return 0;
  const total = deck.reduce((sum, id) => sum + (CARDS[id]?.cost || 0), 0);
  return Math.round((total / deck.length) * 10) / 10;
}

export function isPlayableCard(card) {
  return !!card && !card.hidden;
}
