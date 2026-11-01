import {
  CARDS,
  PLAYABLE_CARDS,
  DEFAULT_DECK,
  AI_DECKS,
  CARD_ORDER,
  RARITIES,
  DECK_SIZE,
  averageElixir,
  cardCost,
} from './cards.js';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { AudioManager } from './audio.js';
import { setCardImage, cardPortraitMarkup } from './art.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const DECK_STORAGE_KEY = 'nexus-arena-deck-v1';
const DIFFICULTY_STORAGE_KEY = 'nexus-arena-difficulty-v1';
const TYPE_LABELS = { troop: 'TROUPE', building: 'BÂTIMENT', spell: 'SORT' };
const DIFFICULTIES = Object.freeze({
  recrue: { name: 'BOT · RECRUE', letter: 'B', deck: 0 },
  standard: { name: 'ORION', letter: 'O', deck: 1 },
  expert: { name: 'TITAN', letter: 'T', deck: 2 },
});
const RESULT_KICKERS = {
  king: 'TOUR DU ROI DÉTRUITE',
  time: 'TEMPS ÉCOULÉ',
  'overtime-time': 'PROLONGATION TERMINÉE',
  'overtime-tower': 'MORT SUBITE',
  integrity: 'INTÉGRITÉ DES TOURS',
  draw: 'MATCH NUL',
  abandon: 'DUEL ABANDONNÉ',
};

for (const id of PLAYABLE_CARDS) setCardImage(id, `assets/cards/${id}.png`);

const screens = {
  home: $('#home-screen'),
  collection: $('#collection-screen'),
  battle: $('#battle-screen'),
};
const arenaCanvas = $('#arena');
const audio = new AudioManager();
const game = new Game(handleGameEvent);
const renderer = new Renderer(arenaCanvas, game);

const state = {
  deck: loadDeck(),
  difficulty: loadDifficulty(),
  selectedHand: null,
  drag: null,
  pendingAdd: null,
  modalCardId: null,
  modalMode: null,
  filters: { rarity: 'all', type: 'all' },
  matchId: 0,
  resultTimer: null,
  globalToastTimer: null,
  arenaToastTimer: null,
  bannerTimer: null,
  enemyPlayTimer: null,
  lastHandSignature: '',
  lastNextCard: '',
  dragPointerId: null,
};

const elixirSegments = [];
for (let i = 0; i < 10; i++) {
  const segment = document.createElement('span');
  segment.className = 'elixir-seg';
  const fill = document.createElement('i');
  segment.append(fill);
  $('#elixir-bar').append(segment);
  elixirSegments.push(fill);
}

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible */
  }
}

function sanitizeDeck(deck) {
  const seen = new Set();
  return (Array.isArray(deck) ? deck : []).filter((id) => {
    if (!CARDS[id] || CARDS[id].hidden || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, DECK_SIZE);
}

function loadDeck() {
  const raw = readStorage(DECK_STORAGE_KEY, null);
  if (raw === null) return [...DEFAULT_DECK];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitizeDeck(parsed) : [...DEFAULT_DECK];
  } catch {
    return [...DEFAULT_DECK];
  }
}

function loadDifficulty() {
  const stored = readStorage(DIFFICULTY_STORAGE_KEY, 'standard');
  return DIFFICULTIES[stored] ? stored : 'standard';
}

function saveDeck() {
  writeStorage(DECK_STORAGE_KEY, JSON.stringify(state.deck));
}

function saveDifficulty() {
  writeStorage(DIFFICULTY_STORAGE_KEY, state.difficulty);
}

function aiDeck() {
  return AI_DECKS[DIFFICULTIES[state.difficulty].deck] || AI_DECKS[1];
}

function deckIsComplete() {
  return state.deck.length === DECK_SIZE;
}

function setTimer(callback, delay) {
  return window.setTimeout(callback, delay);
}

function showScreen(name) {
  if (name !== 'collection' && state.pendingAdd) {
    state.pendingAdd = null;
    renderDeckDock();
  }
  for (const [screenName, element] of Object.entries(screens)) {
    const active = screenName === name;
    element.classList.toggle('active', active);
    element.setAttribute('aria-hidden', String(!active));
  }
  document.body.dataset.screen = name;
  $$('.nav-item').forEach((item) => {
    const target = name === 'battle' ? 'battle' : name;
    item.classList.toggle('active', item.dataset.nav === target);
  });
  if (name === 'collection') {
    renderCollection();
    renderDeckDock();
    window.scrollTo(0, 0);
  } else if (name === 'home') {
    renderHomeDeck();
    renderDeckDock();
    window.scrollTo(0, 0);
  } else {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => renderer.resize());
  }
}

function renderHomeDeck() {
  $('#home-deck-avg').textContent = state.deck.length ? averageElixir(state.deck).toFixed(1) : '—';
  $('#home-deck-cards').innerHTML = Array.from({ length: DECK_SIZE }, (_, index) => {
    const id = state.deck[index];
    if (!id) {
      return '<button class="mini-card empty" type="button" data-empty="1" aria-label="Emplacement vide, ouvrir la collection">+</button>';
    }
    const card = CARDS[id];
    return `<button class="mini-card" type="button" data-card="${id}" style="--rarity:${RARITIES[card.rarity].color}" aria-label="${card.name}, ${card.cost} élixir">${cardPortraitMarkup(card)}</button>`;
  }).join('');
}

function renderCollection() {
  const grid = $('#card-grid');
  const cards = CARD_ORDER.filter((id) => {
    const card = CARDS[id];
    const rarityMatch = state.filters.rarity === 'all' || card.rarity === state.filters.rarity;
    const typeMatch = state.filters.type === 'all' || card.type === state.filters.type;
    return rarityMatch && typeMatch;
  });
  grid.innerHTML = cards.map((id) => cardTileMarkup(CARDS[id])).join('');
  $('#empty-filter').classList.toggle('hidden', cards.length > 0);
  $('#collection-count').textContent = String(cards.length);
  $('.collection-count span').textContent = `/ ${PLAYABLE_CARDS.length}`;
  $$('#rarity-filters .filter-chip').forEach((button) => {
    const active = button.dataset.rarity === state.filters.rarity;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderDeckDock();
}

function cardTileMarkup(card) {
  const rarity = RARITIES[card.rarity];
  const inDeck = state.deck.includes(card.id);
  const check = inDeck
    ? '<span class="card-check" aria-hidden="true"><svg class="icon"><use href="#i-check"/></svg></span>'
    : '';
  return `<button class="card-tile${inDeck ? ' in-deck' : ''}" type="button" data-card="${card.id}" style="--rarity:${rarity.color};--rarity-deep:${rarity.deep};--rarity-glow:${rarity.glow}" aria-label="${card.name}, ${card.cost} élixir, ${rarity.label}${inDeck ? ', dans votre deck' : ''}">
    <span class="card-cost">${cardCost(card)}</span>${check}
    <span class="card-tile-art">${cardPortraitMarkup(card)}</span>
    <span class="card-nameplate">${card.name}</span>
  </button>`;
}

function renderDeckDock() {
  const dock = $('.deck-dock');
  const replacing = Boolean(state.pendingAdd);
  dock.classList.toggle('replacing', replacing);
  dock.classList.toggle('incomplete', !replacing && !deckIsComplete());
  $('#deck-count').textContent = `${state.deck.length}/${DECK_SIZE}`;
  $('#deck-average').textContent = state.deck.length ? averageElixir(state.deck).toFixed(1) : '—';

  $('#deck-slots').innerHTML = Array.from({ length: DECK_SIZE }, (_, index) => {
    const id = state.deck[index];
    if (!id) {
      return `<div class="deck-slot empty" aria-hidden="true"><svg class="icon"><use href="#i-plus"/></svg></div>`;
    }
    const card = CARDS[id];
    const remove = replacing
      ? ''
      : `<button class="slot-remove" type="button" data-remove="1" aria-label="Retirer ${card.name}">×</button>`;
    return `<div class="deck-slot${replacing ? ' replace-target' : ''}" role="button" tabindex="0" data-slot="${index}" data-card="${id}" style="--rarity:${RARITIES[card.rarity].color}" aria-label="${card.name}${replacing ? ', remplacer par la carte sélectionnée' : ''}">${remove}${cardPortraitMarkup(card)}</div>`;
  }).join('');

  const status = $('#deck-status');
  if (replacing) {
    const card = CARDS[state.pendingAdd];
    status.textContent = `Choisissez la carte à remplacer par ${card.name}`;
  } else if (deckIsComplete()) {
    status.textContent = 'Prêt pour la bataille';
  } else {
    const missing = DECK_SIZE - state.deck.length;
    status.textContent = `${missing} carte${missing > 1 ? 's' : ''} manquante${missing > 1 ? 's' : ''} pour combattre`;
  }
}

function afterDeckChange(message) {
  saveDeck();
  renderHomeDeck();
  renderCollection();
  renderDeckDock();
  if (message) showGlobalToast(message);
}

function addCard(id) {
  const card = CARDS[id];
  if (!card || card.hidden || state.deck.includes(id)) return;
  if (deckIsComplete()) {
    startReplacement(id);
    return;
  }
  state.deck.push(id);
  afterDeckChange(`${card.name} ajouté au deck`);
  audio.play('deploy');
}

function removeCard(id) {
  const index = state.deck.indexOf(id);
  if (index === -1) return;
  const card = CARDS[id];
  state.deck.splice(index, 1);
  afterDeckChange(`${card.name} retiré du deck`);
  audio.play('click');
}

function startReplacement(id) {
  const card = CARDS[id];
  if (!card || card.hidden) return;
  if (state.deck.includes(id)) {
    closeModal();
    return;
  }
  state.pendingAdd = id;
  closeModal();
  showScreen('collection');
  renderDeckDock();
  audio.play('select');
}

function cancelReplacement(notify = true) {
  if (!state.pendingAdd) return;
  state.pendingAdd = null;
  renderDeckDock();
  if (notify) showGlobalToast('Remplacement annulé');
}

function replaceDeckSlot(index) {
  const incoming = state.pendingAdd;
  const outgoing = state.deck[index];
  if (!incoming || !CARDS[incoming] || !outgoing) return;
  state.deck[index] = incoming;
  state.pendingAdd = null;
  afterDeckChange(`${CARDS[incoming].name} remplace ${CARDS[outgoing].name}`);
  audio.play('deploy');
}

function autoDeck() {
  state.pendingAdd = null;
  const current = state.deck.join(',');
  const choices = [DEFAULT_DECK, ...AI_DECKS];
  const choice = choices.find((deck) => deck.join(',') !== current) || DEFAULT_DECK;
  state.deck = sanitizeDeck(choice);
  afterDeckChange('Deck automatique composé');
  audio.play('select');
}

function openCardModal(id) {
  const card = CARDS[id];
  if (!card || card.hidden) return;
  const rarity = RARITIES[card.rarity];
  const inDeck = state.deck.includes(id);
  state.modalCardId = id;
  state.modalMode = inDeck ? 'remove' : deckIsComplete() ? 'replace' : 'add';

  $('#modal-image').style.visibility = 'visible';
  $('#modal-image').src = `assets/cards/${id}.png`;
  $('#modal-image').alt = card.name;
  $('#modal-hero').style.setProperty('--rarity', rarity.color);
  $('#modal-rarity').textContent = rarity.label.toUpperCase();
  $('#modal-type').textContent = TYPE_LABELS[card.type] || card.type.toUpperCase();
  $('#modal-card-name').textContent = card.name;
  $('#modal-cost').textContent = String(cardCost(card));
  $('#modal-role').textContent = card.role;
  $('#modal-description').textContent = card.description;
  $('#modal-stats').innerHTML = cardStats(card);
  $('#modal-action').dataset.mode = state.modalMode;
  $('#modal-action').textContent = state.modalMode === 'remove'
    ? 'RETIRER DU DECK'
    : state.modalMode === 'replace'
      ? 'REMPLACER UNE CARTE'
      : 'AJOUTER AU DECK';

  if (state.modalMode === 'remove') {
    $('#modal-note').textContent = 'Cette carte fait partie de votre deck de combat.';
  } else if (state.modalMode === 'replace') {
    $('#modal-note').textContent = 'Votre deck est complet : choisissez ensuite la carte à remplacer.';
  } else {
    $('#modal-note').textContent = `${state.deck.length}/${DECK_SIZE} cartes sélectionnées.`;
  }

  $('#card-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  audio.play('select');
}

function closeModal() {
  if ($('#card-modal').classList.contains('hidden')) return;
  $('#card-modal').classList.add('hidden');
  state.modalCardId = null;
  state.modalMode = null;
  document.body.style.overflow = '';
}

function cardStats(card) {
  const stats = [];
  if (card.type === 'spell') {
    const spell = card.spell || {};
    if (spell.damage) stats.push([spell.damage, 'DÉGÂTS']);
    if (spell.towerDamage) stats.push([spell.towerDamage, 'DÉGÂTS TOUR']);
    if (spell.radius) stats.push([spell.radius, 'ZONE']);
    if (spell.targets) stats.push([spell.targets, 'CIBLES']);
    if (spell.stun) stats.push([`${spell.stun}s`, 'ÉTOURDISSEMENT']);
    if (spell.duration) stats.push([`${spell.duration}s`, spell.effect === 'freeze' ? 'GEL' : 'DURÉE']);
    if (spell.effect === 'spawn' && spell.count) stats.push([`×${spell.count}`, 'UNITÉS']);
    stats.push([card.cost, 'ÉLIXIR']);
  } else {
    stats.push([card.hp, 'POINTS DE VIE']);
    if (card.damage) stats.push([card.damage, 'DÉGÂTS']);
    if (card.count > 1) stats.push([`×${card.count}`, 'UNITÉS']);
    if (card.range) stats.push([Math.round(card.range), 'PORTÉE']);
    if (card.speed) stats.push([card.speed, 'VITESSE']);
    if (card.hitSpeed) stats.push([`${card.hitSpeed}s`, 'CADENCE']);
    if (card.splashRadius) stats.push([card.splashRadius, 'ZONE']);
    if (card.targetsBuildings) stats.push(['TOURS', 'CIBLES']);
    if (card.lifetime) stats.push([`${card.lifetime}s`, 'DURÉE DE VIE']);
    if (card.spawner) stats.push([`${card.spawner.count} / ${card.spawner.interval}s`, 'INVOCATION']);
    if (card.elixirInterval) stats.push([`${card.elixirInterval}s`, 'PRODUCTION']);
    if (card.deathSpawn) stats.push([`×${card.deathSpawn.count}`, 'MORT']);
    if (card.deathDamage) stats.push([card.deathDamage, 'DÉGÂTS MORTELS']);
  }
  return stats.map(([value, label]) => `<div class="modal-stat"><b>${value}</b><span>${label}</span></div>`).join('');
}

function handleModalAction() {
  const id = state.modalCardId;
  if (!id) return;
  if (state.modalMode === 'remove') {
    closeModal();
    removeCard(id);
  } else if (state.modalMode === 'replace') {
    startReplacement(id);
  } else {
    closeModal();
    addCard(id);
  }
}

function showGlobalToast(message, duration = 1900) {
  const toast = $('#global-toast');
  window.clearTimeout(state.globalToastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  state.globalToastTimer = setTimer(() => toast.classList.remove('show'), duration);
}

function hideGlobalToast() {
  window.clearTimeout(state.globalToastTimer);
  $('#global-toast').classList.remove('show');
}

function hideArenaToast() {
  window.clearTimeout(state.arenaToastTimer);
  $('#arena-toast').classList.remove('show');
}

function hideBanner() {
  window.clearTimeout(state.bannerTimer);
  $('#event-banner').classList.remove('show');
}

function showToast(message, duration = 1500) {
  const toast = $('#arena-toast');
  window.clearTimeout(state.arenaToastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  state.arenaToastTimer = setTimer(() => toast.classList.remove('show'), duration);
}

function showBanner(message, duration = 1900) {
  const banner = $('#event-banner');
  window.clearTimeout(state.bannerTimer);
  banner.textContent = message;
  banner.classList.add('show');
  state.bannerTimer = setTimer(() => banner.classList.remove('show'), duration);
}

function dismissTip() {
  $('#battle-tip').classList.add('dismissed');
}

function showEnemyPlay(card) {
  const element = $('#enemy-play');
  window.clearTimeout(state.enemyPlayTimer);
  element.innerHTML = `<img src="assets/cards/${card.id}.png" alt="" draggable="false" onerror="this.style.visibility='hidden'"><span>${card.name}</span>`;
  element.classList.add('show');
  state.enemyPlayTimer = setTimer(() => element.classList.remove('show'), 1700);
}

function startBattle() {
  if (!deckIsComplete()) {
    audio.play('error');
    showGlobalToast('Composez un deck de 8 cartes avant de combattre');
    showScreen('collection');
    return;
  }

  audio.init();
  audio.play('click');
  state.matchId += 1;
  state.selectedHand = null;
  state.drag = null;
  state.pendingAdd = null;
  state.lastHandSignature = '';
  state.lastNextCard = '';
  window.clearTimeout(state.resultTimer);
  renderer.setSelection(null);
  hideGlobalToast();
  hideArenaToast();
  hideBanner();
  hideBattleOverlays();
  $('#pause-overlay').classList.add('hidden');
  $('#result-overlay').classList.add('hidden');
  $('#enemy-play').classList.remove('show');
  $('#battle-tip').classList.remove('dismissed');
  $('#pause-btn').disabled = true;
  $('#pause-btn').setAttribute('aria-label', 'Mettre en pause');

  showScreen('battle');
  game.setDecks(state.deck, aiDeck());
  game.start(state.difficulty);

  const opponent = DIFFICULTIES[state.difficulty];
  $('#enemy-name').textContent = opponent.name;
  $('.enemy-avatar span').textContent = opponent.letter;
  $('#enemy-state').textContent = game.aiState;
  $('#battle-clock').classList.remove('danger');
  syncHand(true);
  updateBattleUI();
  showBanner('LE DUEL COMMENCE', 1700);
}

function hideBattleOverlays() {
  $('#pause-overlay').classList.add('hidden');
  $('#result-overlay').classList.add('hidden');
}

function leaveBattle(message = '') {
  state.matchId += 1;
  window.clearTimeout(state.resultTimer);
  state.selectedHand = null;
  state.drag = null;
  renderer.setSelection(null);
  hideGlobalToast();
  hideArenaToast();
  hideBanner();
  hideBattleOverlays();
  $('#enemy-play').classList.remove('show');
  $('#pause-btn').disabled = true;
  game.reset(state.deck, aiDeck(), state.difficulty);
  showScreen('home');
  if (message) showGlobalToast(message);
  audio.play('click');
}

function togglePause(force) {
  if (!['running', 'paused'].includes(game.phase)) return;
  const shouldPause = typeof force === 'boolean' ? force : game.phase === 'running';
  if (shouldPause === (game.phase === 'paused')) return;
  game.setPaused(shouldPause);
  $('#pause-overlay').classList.toggle('hidden', !shouldPause);
  $('#pause-btn').setAttribute('aria-label', shouldPause ? 'Reprendre' : 'Mettre en pause');
  cancelSelection(false);
  audio.play('click');
}

function attemptPlacement(point) {
  if (state.selectedHand === null) return false;
  if (!point.inside) {
    showToast('Déployez sur votre terrain');
    return false;
  }
  const result = game.playCard(0, state.selectedHand, point.x, point.y);
  if (!result.ok) {
    showToast(result.reason);
    audio.play('error');
    return false;
  }
  audio.play('deploy');
  cancelSelection(false);
  dismissTip();
  syncHand(true);
  updateBattleUI();
  return true;
}

function selectCard(index) {
  if (!game.running) return;
  const id = game.hands[0][index];
  const card = CARDS[id];
  if (!card) return;
  const cost = game.handCost(0, index);
  if (game.elixir[0] + 0.001 < cost) {
    showToast('Pas assez d’élixir');
    audio.play('error');
    return;
  }
  if (state.selectedHand === index) {
    cancelSelection();
    return;
  }
  state.selectedHand = index;
  renderer.setSelection(id, index);
  syncHand();
  audio.play('select');
}

function cancelSelection(withSound = false) {
  state.selectedHand = null;
  state.drag = null;
  renderer.setSelection(null);
  syncHand();
  if (withSound) audio.play('click');
}

function syncHand(force = false) {
  const signature = game.hands[0].join(',');
  if (force || signature !== state.lastHandSignature) {
    $('#hand').innerHTML = game.hands[0].map((id, index) => {
      const card = CARDS[id];
      const rarity = RARITIES[card.rarity];
      return `<button class="hand-card" type="button" data-index="${index}" style="--rarity:${rarity.color}" aria-label="${card.name}, ${card.cost} élixir">
        <span class="hand-cost">${card.cost}</span>
        <span class="hand-art">${cardPortraitMarkup(card)}</span>
        <span class="hand-nameplate">${card.name}</span>
      </button>`;
    }).join('');
    state.lastHandSignature = signature;
  }

  const next = game.queues[0][0];
  if (force || next !== state.lastNextCard) {
    const nextCard = CARDS[next];
    $('#next-card').innerHTML = nextCard ? cardPortraitMarkup(nextCard) : '';
    state.lastNextCard = next;
  }

  $$('#hand .hand-card').forEach((button, index) => {
    const card = CARDS[game.hands[0][index]];
    const cost = game.handCost(0, index);
    const unaffordable = game.elixir[0] + 0.001 < cost;
    button.disabled = !game.running;
    button.classList.toggle('unaffordable', unaffordable);
    button.classList.toggle('selected', state.selectedHand === index);
    button.setAttribute('aria-pressed', String(state.selectedHand === index));
    button.setAttribute('aria-label', `${card.name}, ${cost} élixir`);
    const costElement = button.querySelector('.hand-cost');
    if (costElement) costElement.textContent = String(cost);
  });
}

function updateBattleUI() {
  const seconds = Math.max(0, Math.ceil(game.timeLeft));
  $('#timer').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  let phase = 'COMBAT';
  if (game.overtime) phase = 'PROLONGATION';
  else if (game.inDoubleElixir) phase = 'ÉLIXIR ×2';
  else if (game.phase === 'paused') phase = 'PAUSE';
  else if (game.phase === 'ended') phase = 'TERMINÉ';
  $('#phase-label').textContent = phase;
  $('#battle-clock').classList.toggle('danger', (game.running || game.phase === 'paused') && seconds <= 30);

  $('#player-crowns').textContent = String(game.getCrowns(0));
  $('#enemy-crowns').textContent = String(game.getCrowns(1));
  $('#enemy-state').textContent = game.phase === 'idle'
    ? 'Prêt pour le duel'
    : game.phase === 'paused'
      ? 'Combat suspendu'
      : game.phase === 'ended'
        ? 'Duel terminé'
        : game.aiState;
  $('#player-state').textContent = game.phase === 'idle'
    ? 'Votre arène'
    : game.phase === 'paused'
      ? 'Combat suspendu'
      : game.phase === 'ended'
        ? 'Duel terminé'
        : 'Défendez vos tours';

  const elixir = game.elixir[0];
  elixirSegments.forEach((fill, index) => {
    fill.style.transform = `scaleX(${Math.max(0, Math.min(1, elixir - index))})`;
  });
  $('#elixir-value').textContent = String(Math.floor(elixir + 0.001));
  $('#elixir-bar').setAttribute('aria-label', `${Math.floor(elixir)} élixir sur 10`);
  $('#pause-btn').disabled = !['running', 'paused'].includes(game.phase);
  syncHand();
}

function bumpCrown(team) {
  const counter = team === 0 ? $('.player-crowns') : $('.enemy-crowns');
  counter.classList.remove('bump');
  void counter.offsetWidth;
  counter.classList.add('bump');
  setTimer(() => counter.classList.remove('bump'), 520);
}

function handleGameEvent(event) {
  switch (event.type) {
    case 'card-played':
      if (event.team === 1) showEnemyPlay(event.card);
      break;
    case 'spell':
      audio.play('spell');
      if (event.team === 1) showEnemyPlay(event.card);
      break;
    case 'spell-impact': {
      const style = event.card?.art?.style;
      if (style === 'lightning') audio.play('lightning');
      else if (style === 'rocket') audio.play('rocket');
      else if (style === 'freeze') audio.play('freeze');
      else if (style === 'rage') audio.play('rage');
      else audio.play('spell-impact');
      break;
    }
    case 'shot':
      audio.play('shot');
      break;
    case 'impact':
      audio.play('impact');
      break;
    case 'melee':
      audio.play('melee');
      break;
    case 'jump':
      audio.play('jump');
      break;
    case 'spawner':
      audio.play('spawn');
      break;
    case 'tower-destroyed': {
      audio.play('tower');
      const own = event.tower.team === 0;
      const label = event.tower.kind === 'king'
        ? 'TOUR DU ROI DÉTRUITE'
        : own ? 'VOTRE TOUR DÉTRUITE' : 'TOUR ADVERSE DÉTRUITE';
      showBanner(label, 2100);
      break;
    }
    case 'crown':
      bumpCrown(event.team);
      audio.play('crown');
      break;
    case 'king-active':
      showToast(event.team === 0 ? 'Votre Tour du Roi entre en jeu' : 'La Tour du Roi adverse est active');
      audio.play('king');
      break;
    case 'double-elixir':
      if (!event.overtime) {
        showBanner('DOUBLE ÉLIXIR', 2200);
        audio.play('double');
      }
      break;
    case 'overtime':
      showBanner('PROLONGATION · ÉLIXIR ×3', 2800);
      audio.play('double');
      break;
    case 'elixir-full':
      showToast('Votre élixir est au maximum');
      audio.play('full');
      break;
    case 'game-over': {
      const matchAtEnd = state.matchId;
      state.selectedHand = null;
      state.drag = null;
      renderer.setSelection(null);
      $('#pause-btn').disabled = true;
      window.clearTimeout(state.resultTimer);
      state.resultTimer = setTimer(() => {
        if (matchAtEnd === state.matchId && game.phase === 'ended') showResult(game.result);
      }, 700);
      break;
    }
  }
}

function showResult(result) {
  if (!result) return;
  const victory = result.winner === 0;
  const draw = result.winner === null;
  const card = $('#result-card');
  card.classList.remove('victory', 'defeat', 'draw');
  card.classList.add(draw ? 'draw' : victory ? 'victory' : 'defeat');

  $('#result-title').textContent = draw ? 'ÉGALITÉ' : victory ? 'VICTOIRE' : 'DÉFAITE';
  $('#result-kicker').textContent = RESULT_KICKERS[result.reason] || 'COMBAT TERMINÉ';
  $('#result-subtitle').textContent = resultSubtitle(result);
  $('#result-player-score').textContent = String(result.playerCrowns);
  $('#result-enemy-score').textContent = String(result.enemyCrowns);
  $('#result-crowns').innerHTML = Array.from({ length: 3 }, (_, index) => (
    `<svg class="icon${index < result.playerCrowns ? '' : ' lost'}" aria-hidden="true"><use href="#i-crown"/></svg>`
  )).join('');
  $('#stat-cards').textContent = String(game.stats[0].cards);
  $('#stat-damage').textContent = Math.round(game.stats[0].damage).toLocaleString('fr-FR');

  hideArenaToast();
  hideBanner();
  $('#pause-overlay').classList.add('hidden');
  $('#result-overlay').classList.remove('hidden');
  $('#pause-btn').disabled = true;
  cancelSelection(false);
  audio.play(draw ? 'double' : victory ? 'victory' : 'defeat');
}

function resultSubtitle(result) {
  const victory = result.winner === 0;
  const draw = result.winner === null;
  if (draw) return 'Aucun camp n’a pris l’avantage. Une revanche s’impose.';
  if (result.reason === 'king') {
    return victory
      ? 'La Tour du Roi adverse est tombée. L’arène est à vous.'
      : 'Votre Tour du Roi s’est effondrée. L’adversaire contrôle l’arène.';
  }
  if (result.reason === 'overtime-tower') {
    return victory
      ? 'Une tour est tombée en prolongation. La victoire est à vous.'
      : 'Une tour est tombée en prolongation. L’adversaire l’emporte.';
  }
  if (result.reason === 'time' || result.reason === 'overtime-time') {
    return victory
      ? 'Le temps est écoulé. Vous menez aux couronnes.'
      : 'Le temps est écoulé. L’adversaire mène aux couronnes.';
  }
  if (result.reason === 'integrity') {
    return victory
      ? 'Égalité aux couronnes : vos tours sont les mieux conservées.'
      : 'Égalité aux couronnes : l’adversaire a préservé ses tours.';
  }
  if (result.reason === 'abandon') return 'Duel abandonné. L’arène vous attend pour la revanche.';
  return victory ? 'Le duel est remporté.' : 'Le duel est terminé.';
}

function handleHandPointerDown(event) {
  const button = event.target.closest('.hand-card[data-index]');
  if (!button || button.disabled || !game.running) return;
  audio.init();
  const point = renderer.worldFromClient(event.clientX, event.clientY);
  renderer.setPointer(point);
  const index = Number(button.dataset.index);
  selectCard(index);
  if (state.selectedHand === index) {
    state.drag = { startX: event.clientX, startY: event.clientY };
    state.dragPointerId = event.pointerId;
  }
}

function handleHandClick(event) {
  const button = event.target.closest('.hand-card[data-index]');
  if (!button || event.detail !== 0) return;
  selectCard(Number(button.dataset.index));
}

function handlePointerMove(event) {
  if (!screens.battle.classList.contains('active')) return;
  if (state.drag && event.pointerId !== state.dragPointerId) return;
  const point = renderer.worldFromClient(event.clientX, event.clientY);
  renderer.setPointer(point);
}

function handlePointerUp(event) {
  if (!state.drag || (state.dragPointerId !== null && event.pointerId !== state.dragPointerId)) return;
  const point = renderer.worldFromClient(event.clientX, event.clientY);
  renderer.setPointer(point);
  state.drag = null;
  state.dragPointerId = null;
  if (point.inside && state.selectedHand !== null) attemptPlacement(point);
}

function handleArenaPointerDown(event) {
  if (!game.running) return;
  audio.init();
  if (state.selectedHand === null) {
    showToast('Sélectionnez d’abord une carte');
    return;
  }
  const point = renderer.worldFromClient(event.clientX, event.clientY);
  renderer.setPointer(point);
  attemptPlacement(point);
}

function handleDeckSlotClick(event) {
  const removeButton = event.target.closest('.slot-remove');
  if (removeButton) {
    const slot = removeButton.closest('.deck-slot[data-card]');
    if (slot && !state.pendingAdd) {
      const id = state.deck[Number(slot.dataset.slot)];
      if (id) removeCard(id);
    }
    return;
  }
  const slot = event.target.closest('.deck-slot[data-card]');
  if (!slot) return;
  const index = Number(slot.dataset.slot);
  if (state.pendingAdd) {
    replaceDeckSlot(index);
    return;
  }
  const id = state.deck[index];
  if (id) openCardModal(id);
}

function handleDeckSlotKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const slot = event.target.closest('.deck-slot[data-card]');
  if (!slot || event.target.closest('.slot-remove')) return;
  event.preventDefault();
  const index = Number(slot.dataset.slot);
  if (state.pendingAdd) replaceDeckSlot(index);
  else if (state.deck[index]) openCardModal(state.deck[index]);
}

function handleGlobalKeydown(event) {
  if (event.key === 'Escape') {
    if (!$('#card-modal').classList.contains('hidden')) closeModal();
    else if (state.pendingAdd) cancelReplacement();
    else if (state.selectedHand !== null) cancelSelection(true);
    else if (!$('#pause-overlay').classList.contains('hidden')) togglePause(false);
    else if (screens.collection.classList.contains('active')) showScreen('home');
    return;
  }

  if (!$('#card-modal').classList.contains('hidden') || event.repeat) return;

  if (event.key >= '1' && event.key <= '4' && screens.battle.classList.contains('active') && game.running) {
    selectCard(Number(event.key) - 1);
  } else if (event.key.toLowerCase() === 'p' && screens.battle.classList.contains('active')) {
    togglePause();
  } else if (event.key.toLowerCase() === 'm') {
    toggleSound();
  }
}

function toggleSound() {
  const muted = audio.toggle();
  $('#sound-btn').classList.toggle('muted', muted);
  $('#sound-btn').setAttribute('aria-label', muted ? 'Activer le son' : 'Couper le son');
  if (!muted) audio.play('click');
}

$('#home-deck-cards').addEventListener('click', (event) => {
  const cardButton = event.target.closest('[data-card]');
  if (cardButton) {
    showScreen('collection');
    openCardModal(cardButton.dataset.card);
    return;
  }
  if (event.target.closest('[data-empty]')) {
    showScreen('collection');
    showGlobalToast('Choisissez une carte pour compléter votre deck');
  }
});

$('#battle-btn').addEventListener('click', startBattle);
$('#edit-deck-btn').addEventListener('click', () => {
  audio.play('click');
  showScreen('collection');
});
$('#collection-back').addEventListener('click', () => {
  state.pendingAdd = null;
  renderDeckDock();
  audio.play('click');
  showScreen('home');
});
$('#auto-deck').addEventListener('click', autoDeck);
$('#reset-filters').addEventListener('click', () => {
  state.filters = { rarity: 'all', type: 'all' };
  $('#rarity-filters').querySelectorAll('.filter-chip').forEach((button) => button.classList.toggle('active', button.dataset.rarity === 'all'));
  $('#type-filter').value = 'all';
  renderCollection();
  audio.play('click');
});

$('#rarity-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-rarity]');
  if (!button) return;
  state.filters.rarity = button.dataset.rarity;
  renderCollection();
  audio.play('click');
});

$('#type-filter').addEventListener('change', (event) => {
  state.filters.type = event.target.value;
  renderCollection();
  audio.play('click');
});

$('#card-grid').addEventListener('click', (event) => {
  const tile = event.target.closest('[data-card]');
  if (!tile) return;
  if (state.pendingAdd) cancelReplacement(false);
  openCardModal(tile.dataset.card);
});

$('#deck-slots').addEventListener('click', handleDeckSlotClick);
$('#deck-slots').addEventListener('keydown', handleDeckSlotKeydown);
$('#modal-close').addEventListener('click', closeModal);
$('#card-modal').addEventListener('click', (event) => {
  if (event.target.closest('[data-close-modal]')) closeModal();
});
$('#modal-action').addEventListener('click', handleModalAction);
$('#modal-image').addEventListener('error', (event) => {
  event.currentTarget.style.visibility = 'hidden';
});

$('#pause-btn').addEventListener('click', () => togglePause());
$('#resume-btn').addEventListener('click', () => togglePause(false));
$('#quit-btn').addEventListener('click', () => leaveBattle('Duel abandonné'));
$('#rematch-btn').addEventListener('click', startBattle);
$('#menu-btn').addEventListener('click', () => leaveBattle());
$('#dismiss-tip').addEventListener('click', dismissTip);
$('#sound-btn').addEventListener('click', toggleSound);

$('#hand').addEventListener('pointerdown', handleHandPointerDown);
$('#hand').addEventListener('click', handleHandClick);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', () => {
  state.drag = null;
  state.dragPointerId = null;
});
arenaCanvas.addEventListener('pointerdown', handleArenaPointerDown);
arenaCanvas.addEventListener('pointerleave', () => {
  if (!state.drag) renderer.setPointer({ x: 0, y: 0, inside: false });
});
arenaCanvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  cancelSelection(true);
});

$$('[data-difficulty]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!DIFFICULTIES[button.dataset.difficulty]) return;
    state.difficulty = button.dataset.difficulty;
    saveDifficulty();
    updateDifficultyButtons();
    audio.play('select');
  });
});

function updateDifficultyButtons() {
  $$('[data-difficulty]').forEach((button) => {
    const active = button.dataset.difficulty === state.difficulty;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

$$('.nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.nav;
    if (target === 'battle') {
      showScreen('home');
      audio.play('click');
    } else if (target === 'collection') {
      showScreen('collection');
      audio.play('click');
    } else {
      showGlobalToast('Boutique, clan et événements arrivent bientôt');
      audio.play('click');
    }
  });
});

$('#profile-btn').addEventListener('click', () => showGlobalToast('Martin · Niveau 13 · 4 862 trophées'));
$$('.resource-add').forEach((button) => {
  button.addEventListener('click', () => {
    const label = button.dataset.resource === 'OR' ? 'd’or' : 'de gemmes';
    showGlobalToast(`Ajout ${label} bientôt disponible`);
    audio.play('click');
  });
});

document.addEventListener('keydown', handleGlobalKeydown);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.phase === 'running') togglePause(true);
});

let lastFrame = performance.now();
let lastUIUpdate = 0;
let accumulator = 0;
const fixedStep = 1 / 60;

function frame(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (game.running) {
    accumulator += delta;
    while (accumulator >= fixedStep) {
      game.step(fixedStep);
      accumulator -= fixedStep;
    }
  } else {
    accumulator = 0;
    if (game.phase === 'ended') game.updateEffects(delta);
  }
  renderer.render(now);
  if (now - lastUIUpdate > 70) {
    updateBattleUI();
    lastUIUpdate = now;
  }
  requestAnimationFrame(frame);
}

renderHomeDeck();
renderCollection();
renderDeckDock();
updateDifficultyButtons();
syncHand(true);
updateBattleUI();
$('#pause-btn').disabled = true;
requestAnimationFrame(frame);

Object.defineProperty(window, '__NEXUS__', {
  value: Object.freeze({
    game,
    renderer,
    startBattle,
    showScreen,
    getDeck: () => [...state.deck],
  }),
  writable: false,
});
