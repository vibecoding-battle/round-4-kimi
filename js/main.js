import { CARDS, DECK } from './cards.js';
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { AudioManager } from './audio.js';
import { cardArt } from './cards.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#arena');
const audio = new AudioManager();
const game = new Game(handleGameEvent);
const renderer = new Renderer(canvas, game);
const handElement = $('#hand');
const inspector = $('#card-inspector');
const briefingMarkup = inspector.innerHTML;
let difficulty = 'standard';
let selectedHand = null;
let drag = null;
let lastHandSignature = '';
let lastNextCard = '';
let suppressClickUntil = 0;
let toastTimer = null;
let bannerTimer = null;
let announcedDouble = false;
let helpPausedGame = false;
let matchNumber = 0;

const elixirPips = [];
for (let i = 0; i < 10; i++) {
  const pip = document.createElement('span');
  pip.className = 'elixir-pip';
  const fill = document.createElement('i');
  pip.append(fill);
  $('#elixir-bar').append(pip);
  elixirPips.push(fill);
}

$('#deck-pips').innerHTML = DECK.map((id) => {
  const card = CARDS[id];
  return `<button style="--card-color:${card.color}" data-card="${id}" data-cost="${card.cost}" aria-label="${card.name}, ${card.cost} élixir" title="${card.name} · ${card.role}">${cardArt(id)}</button>`;
}).join('');

function cardMarkup(id, index = null) {
  const card = CARDS[id];
  return `<button class="game-card" style="--card-color:${card.color}" data-index="${index ?? ''}" data-card="${id}" aria-label="${card.name}, coût ${card.cost}. ${card.description}">
    ${index !== null ? `<span class="card-key">${index + 1}</span>` : ''}<span class="card-cost">${card.cost}</span>
    <span class="card-art">${cardArt(id)}</span><span class="card-name">${card.name}</span>
  </button>`;
}

function syncHand(force = false) {
  const signature = game.hands[0].join(',');
  if (force || signature !== lastHandSignature) {
    handElement.innerHTML = game.hands[0].map((id, index) => cardMarkup(id, index)).join('');
    lastHandSignature = signature;
  }
  const next = game.queues[0][0];
  if (force || next !== lastNextCard) {
    $('#next-card').innerHTML = cardMarkup(next);
    $('#next-card .game-card').removeAttribute('data-index');
    $('#next-card .game-card').setAttribute('tabindex', '-1');
    lastNextCard = next;
  }
  const buttons = handElement.querySelectorAll('.game-card');
  buttons.forEach((button, index) => {
    const card = CARDS[game.hands[0][index]];
    button.disabled = !game.running || game.elixir[0] + 0.001 < card.cost;
    button.classList.toggle('selected', selectedHand === index);
    button.setAttribute('aria-pressed', selectedHand === index ? 'true' : 'false');
  });
}

function selectCard(index) {
  if (!game.running) return;
  const id = game.hands[0][index];
  const card = CARDS[id];
  if (!card) return;
  if (game.elixir[0] + 0.001 < card.cost) {
    showToast('Pas assez d’élixir');
    audio.play('error');
    return;
  }
  selectedHand = selectedHand === index ? null : index;
  if (selectedHand === null) {
    renderer.setSelection(null);
    showBriefing();
  } else {
    renderer.setSelection(id, renderer.selection?.point || null);
    showInspector(card);
    audio.play('select');
  }
  syncHand();
}

function cancelSelection() {
  selectedHand = null;
  drag = null;
  renderer.setSelection(null);
  showBriefing();
  syncHand();
}

function attemptPlacement(point) {
  if (selectedHand === null || !point.inside) return false;
  const result = game.playCard(0, selectedHand, point.x, point.y);
  if (!result.ok) {
    showToast(result.reason);
    audio.play('error');
    return false;
  }
  audio.play('deploy');
  cancelSelection();
  dismissTutorial();
  return true;
}

function showBriefing() {
  inspector.classList.remove('card-mode');
  inspector.innerHTML = briefingMarkup;
}

function showInspector(card) {
  inspector.classList.add('card-mode');
  inspector.style.setProperty('--card-color', card.color);
  let stats;
  if (card.type === 'spell') {
    stats = [[`${card.spellDamage}`, 'Dégâts'], [`${card.spellRadius}`, 'Zone'], [`${card.cost}`, 'Élixir']];
  } else {
    stats = [[`${card.hp}`, 'Vitalité'], [`${card.damage}`, 'Dégâts'], [`${card.range}`, 'Portée']];
  }
  inspector.innerHTML = `<div class="panel-heading"><span>CARTE SÉLECTIONNÉE</span><span class="tiny-label">${card.type.toUpperCase()}</span></div>
    <div class="inspect-art">${cardArt(card.id)}</div><div class="inspect-title"><h2>${card.name}</h2><b>◆ ${card.cost}</b></div>
    <div class="inspect-role">${card.role}</div><p class="inspect-desc">${card.description}</p>
    <div class="inspect-stats">${stats.map(([value, label]) => `<span><b>${value}</b>${label}</span>`).join('')}</div>`;
}

function showToast(message, duration = 1500) {
  const toast = $('#arena-toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function showBanner(message, duration = 1800) {
  const banner = $('#event-banner');
  clearTimeout(bannerTimer);
  banner.textContent = message;
  banner.classList.add('show');
  bannerTimer = setTimeout(() => banner.classList.remove('show'), duration);
}

function dismissTutorial() {
  $('#tutorial-tip').classList.add('dismissed');
}

function addLog(message, team = 0) {
  const log = $('#battle-log');
  log.querySelector('.log-empty')?.remove();
  const totalSeconds = Math.floor(game.elapsed);
  const time = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
  const entry = document.createElement('div');
  entry.className = `log-entry ${team === 1 ? 'enemy' : ''}`;
  const avatar = document.createElement('span');
  avatar.textContent = team === 1 ? 'O7' : 'NV';
  const content = document.createElement('div');
  const paragraph = document.createElement('p');
  paragraph.innerHTML = message;
  const timestamp = document.createElement('time');
  timestamp.textContent = time;
  content.append(paragraph, timestamp);
  entry.append(avatar, content);
  log.prepend(entry);
  while (log.children.length > 5) log.lastElementChild.remove();
}

function startMatch() {
  audio.init();
  audio.play('click');
  matchNumber++;
  announcedDouble = false;
  selectedHand = null;
  drag = null;
  renderer.setSelection(null);
  $('#battle-log').innerHTML = '';
  game.start(difficulty);
  $('#start-overlay').classList.add('hidden');
  $('#result-overlay').classList.add('hidden');
  $('#pause-overlay').classList.add('hidden');
  $('#help-overlay').classList.add('hidden');
  $('#pause-btn').disabled = false;
  $('#tutorial-tip').classList.remove('dismissed');
  showBriefing();
  syncHand(true);
  updateUI();
  showBanner('LE DUEL COMMENCE', 1700);
}

function returnToMenu() {
  matchNumber++;
  cancelSelection();
  game.reset(difficulty);
  $('#result-overlay').classList.add('hidden');
  $('#pause-overlay').classList.add('hidden');
  $('#start-overlay').classList.remove('hidden');
  $('#pause-btn').disabled = true;
  $('#battle-log').innerHTML = '<div class="log-empty"><span class="scan-icon"></span><p>Aucune activité.<br>Le flux s’activera au lancement.</p></div>';
  $('#ai-state').textContent = 'En attente du duel';
  updateUI();
}

function togglePause(force) {
  if (!['running', 'paused'].includes(game.phase)) return;
  const shouldPause = typeof force === 'boolean' ? force : game.phase === 'running';
  game.setPaused(shouldPause);
  $('#pause-overlay').classList.toggle('hidden', !shouldPause);
  $('#pause-btn').setAttribute('aria-label', shouldPause ? 'Reprendre' : 'Mettre en pause');
  cancelSelection();
  audio.play('click');
}

function openHelp() {
  helpPausedGame = game.phase === 'running';
  if (helpPausedGame) game.setPaused(true);
  cancelSelection();
  $('#help-overlay').classList.remove('hidden');
  audio.play('click');
}

function closeHelp() {
  $('#help-overlay').classList.add('hidden');
  if (helpPausedGame && game.phase === 'paused') game.setPaused(false);
  helpPausedGame = false;
  audio.play('click');
}

function showResult(result) {
  const victory = result.winner === 0;
  const draw = result.winner === null;
  const card = $('#result-overlay .result-card');
  card.classList.toggle('victory', victory);
  card.classList.toggle('defeat', !victory && !draw);
  card.classList.toggle('draw', draw);
  $('#result-title').textContent = draw ? 'ÉGALITÉ' : victory ? 'VICTOIRE' : 'DÉFAITE';
  $('#result-kicker').textContent = result.reason === 'core' ? 'NOYAU DÉTRUIT' : result.reason === 'sudden-death' ? 'MORT SUBITE' : 'DUEL TERMINÉ';
  const subtitles = {
    core: victory ? 'Le noyau adverse est hors ligne. Superbe offensive, commandant.' : 'Votre noyau a été détruit. Recomposez votre stratégie.',
    time: victory ? 'Le temps est écoulé. Votre supériorité territoriale fait la différence.' : 'Le temps est écoulé. ORA-7 conserve l’avantage territorial.',
    'sudden-death': victory ? 'Une structure suffisait. Vous avez saisi l’ouverture.' : 'ORA-7 a frappé le premier en mort subite.',
    integrity: victory ? 'Vos structures sont les mieux conservées après la mort subite.' : 'ORA-7 a mieux préservé ses structures.',
    abandon: 'Duel abandonné. L’arène vous attend pour la revanche.',
    draw: 'Aucun camp n’a pris l’avantage. Une revanche s’impose.',
  };
  $('#result-subtitle').textContent = subtitles[result.reason] || (victory ? 'Le duel est remporté.' : 'Le duel est terminé.');
  $('#result-player-score').textContent = result.playerCrowns;
  $('#result-enemy-score').textContent = result.enemyCrowns;
  $('#stat-cards').textContent = game.stats[0].cards;
  $('#stat-damage').textContent = Math.round(game.stats[0].damage).toLocaleString('fr-FR');
  $('#result-overlay').classList.remove('hidden');
  $('#pause-overlay').classList.add('hidden');
  $('#pause-btn').disabled = true;
  cancelSelection();
  audio.play(draw ? 'double' : victory ? 'victory' : 'defeat');
}

function handleGameEvent(event) {
  switch (event.type) {
    case 'match-start':
      addLog('<strong>Connexion établie.</strong> Le duel est lancé.');
      break;
    case 'deploy':
      addLog(`<strong>${event.card.name}</strong> déployé par ${event.team === 0 ? 'NOVA' : 'ORA-7'}.`, event.team);
      break;
    case 'spell':
      audio.play('spell');
      addLog(`<strong>${event.card.name}</strong> ${event.card.id === 'comete' ? 'verrouille une zone' : 'est déclenché'}.`, event.team);
      break;
    case 'spell-impact':
      audio.play(event.card.id === 'comete' ? 'comet' : 'pulse');
      break;
    case 'shot':
      audio.play('shot');
      break;
    case 'impact':
      audio.play('impact');
      break;
    case 'melee':
      audio.play('melee');
      break;
    case 'tower-destroyed': {
      audio.play('tower');
      const ownTower = event.tower.team === 0;
      const structure = event.tower.kind === 'core' ? 'NOYAU' : 'RELAIS';
      showBanner(ownTower ? `${structure} ALLIÉ DÉTRUIT` : `${structure} ADVERSE DÉTRUIT`, 2200);
      addLog(`<strong>${structure.toLowerCase()} ${ownTower ? 'allié' : 'adverse'} détruit.</strong>`, ownTower ? 1 : 0);
      break;
    }
    case 'core-active':
      addLog(`<strong>Noyau ${event.team === 0 ? 'allié' : 'adverse'} activé.</strong> Ses défenses sont en ligne.`, event.team);
      break;
    case 'overtime':
      showBanner('MORT SUBITE · PROCHAINE TOUR GAGNE', 3000);
      audio.play('double');
      addLog('<strong>Mort subite.</strong> La prochaine tour décidera du duel.');
      break;
    case 'elixir-full':
      audio.play('full');
      showToast('Votre élixir est au maximum');
      break;
    case 'game-over': {
      const thisMatch = matchNumber;
      setTimeout(() => {
        if (thisMatch === matchNumber && game.phase === 'ended') showResult(event.result);
      }, 750);
      break;
    }
  }
}

function updateUI() {
  const seconds = Math.max(0, Math.ceil(game.timeLeft));
  $('#timer').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  $('#phase-label').textContent = game.overtime ? 'MORT SUBITE' : game.doubleElixir ? '2× ÉLIXIR' : 'DUEL';
  $('.match-clock').classList.toggle('danger', game.running && seconds <= 30);
  $('#player-crowns').textContent = game.getCrowns(0);
  $('#enemy-crowns').textContent = game.getCrowns(1);
  $('#ai-state').textContent = game.phase === 'idle' ? 'En attente du duel' : game.phase === 'ended' ? 'Duel terminé' : game.aiState;
  $('#difficulty-badge').textContent = difficulty.toUpperCase();

  for (let i = 0; i < 10; i++) {
    const fill = Math.max(0, Math.min(1, game.elixir[0] - i));
    elixirPips[i].style.transform = `scaleX(${fill})`;
  }
  $('#elixir-value').textContent = Math.floor(game.elixir[0] + 0.001);
  $('#elixir-bar').setAttribute('aria-label', `${Math.floor(game.elixir[0])} élixir sur 10`);
  for (const [lane, id] of [[0, 'left'], [1, 'right']]) {
    const tower = game.getTower(1, 'relay', lane);
    const ratio = Math.max(0, tower.hp / tower.maxHp);
    $(`#enemy-${id}-hp`).style.width = `${ratio * 100}%`;
    $(`#enemy-${id}-value`).textContent = `${Math.ceil(ratio * 100)}%`;
  }
  const core = game.getTower(1, 'core');
  const coreRatio = Math.max(0, core.hp / core.maxHp);
  $('#enemy-core-hp').style.width = `${coreRatio * 100}%`;
  $('#enemy-core-value').textContent = `${Math.ceil(coreRatio * 100)}%`;
  syncHand();
}

handElement.addEventListener('pointerdown', (event) => {
  const button = event.target.closest('.game-card[data-index]');
  if (!button || button.disabled || !game.running) return;
  event.preventDefault();
  audio.init();
  const index = Number(button.dataset.index);
  if (selectedHand === index) {
    cancelSelection();
    return;
  }
  selectCard(index);
  if (selectedHand === index) {
    drag = { index, startX: event.clientX, startY: event.clientY, pointerId: event.pointerId };
  }
});

handElement.addEventListener('click', (event) => {
  const button = event.target.closest('.game-card[data-index]');
  if (!button || performance.now() < suppressClickUntil || event.detail !== 0) return;
  selectCard(Number(button.dataset.index));
});

window.addEventListener('pointermove', (event) => {
  if (!renderer.selection) return;
  const point = renderer.worldFromClient(event.clientX, event.clientY);
  if (point.inside || drag) renderer.selection.point = point;
  else renderer.selection.point = null;
});

window.addEventListener('pointerup', (event) => {
  if (!drag) return;
  const point = renderer.worldFromClient(event.clientX, event.clientY);
  if (point.inside) attemptPlacement(point);
  drag = null;
  suppressClickUntil = performance.now() + 250;
});

canvas.addEventListener('pointerdown', (event) => {
  if (!game.running) return;
  event.preventDefault();
  audio.init();
  const point = renderer.worldFromClient(event.clientX, event.clientY);
  if (selectedHand === null) {
    showToast('Sélectionnez d’abord une carte');
    return;
  }
  renderer.selection.point = point;
  attemptPlacement(point);
});

canvas.addEventListener('pointerleave', () => {
  if (!drag && renderer.selection) renderer.selection.point = null;
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  cancelSelection();
});

$('#deck-pips').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-card]');
  if (button) {
    showInspector(CARDS[button.dataset.card]);
    audio.play('select');
  }
});

$('#tutorial-tip button').addEventListener('click', dismissTutorial);
$('#start-btn').addEventListener('click', startMatch);
$('#rematch-btn').addEventListener('click', startMatch);
$('#menu-btn').addEventListener('click', returnToMenu);
$('#pause-btn').addEventListener('click', () => togglePause());
$('#resume-btn').addEventListener('click', () => togglePause(false));
$('#quit-btn').addEventListener('click', () => game.finish(1, 'abandon'));
$('#help-btn').addEventListener('click', openHelp);
$('#close-help').addEventListener('click', closeHelp);
$('#help-ok').addEventListener('click', closeHelp);
$('#help-overlay').addEventListener('click', (event) => {
  if (event.target === $('#help-overlay')) closeHelp();
});
$('#sound-btn').addEventListener('click', () => {
  const muted = audio.toggle();
  $('#sound-btn').classList.toggle('muted', muted);
  $('#sound-btn').setAttribute('aria-label', muted ? 'Activer le son' : 'Couper le son');
  if (!muted) audio.play('click');
});

document.querySelectorAll('[data-difficulty]').forEach((button) => {
  button.addEventListener('click', () => {
    difficulty = button.dataset.difficulty;
    document.querySelectorAll('[data-difficulty]').forEach((other) => other.classList.toggle('active', other === button));
    $('#difficulty-badge').textContent = difficulty.toUpperCase();
    audio.play('select');
  });
});

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const helpOpen = !$('#help-overlay').classList.contains('hidden');
  if (event.key >= '1' && event.key <= '4' && game.running && !helpOpen) {
    selectCard(Number(event.key) - 1);
  } else if (event.key.toLowerCase() === 'p' && !helpOpen) {
    togglePause();
  } else if (event.key.toLowerCase() === 'm') {
    $('#sound-btn').click();
  } else if (event.key === 'Escape') {
    if (!$('#help-overlay').classList.contains('hidden')) closeHelp();
    else if (selectedHand !== null) cancelSelection();
    else togglePause();
  }
});

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
  if (game.doubleElixir && !announcedDouble && !game.overtime && game.running) {
    announcedDouble = true;
    showBanner('DOUBLE ÉLIXIR', 2200);
    audio.play('double');
    addLog('<strong>Double élixir.</strong> Le rythme du duel s’intensifie.');
  }
  renderer.render(now);
  if (now - lastUIUpdate > 60) {
    updateUI();
    lastUIUpdate = now;
  }
  requestAnimationFrame(frame);
}

syncHand(true);
updateUI();
requestAnimationFrame(frame);

Object.defineProperty(window, '__NEXUS__', { value: Object.freeze({ game, startMatch }), writable: false });
