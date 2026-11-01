import { ARENA, CARDS, DECK_SIZE, cardCost, AI_DECKS } from './cards.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const random = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const TAU = Math.PI * 2;

const AI_PRESETS = {
  recrue: { think: 1.35, defend: 0.3, attackAt: 8.6, spread: 34, spellValue: 1200 },
  standard: { think: 0.78, defend: 0.62, attackAt: 7.1, spread: 22, spellValue: 900 },
  expert: { think: 0.5, defend: 0.86, attackAt: 6.2, spread: 12, spellValue: 700 },
};

const CROWN_POSITIONS = Array.from({ length: 10 }, (_, i) => i);

export class Game {
  constructor(onEvent = () => {}) {
    this.onEvent = onEvent;
    this.difficulty = 'standard';
    this.playerDeck = [];
    this.aiDeck = [];
    this.reset();
  }

  setDecks(playerDeck, aiDeck) {
    this.playerDeck = this.sanitizeDeck(playerDeck);
    this.aiDeck = this.sanitizeDeck(aiDeck || pick(AI_DECKS));
    this.reset();
  }

  sanitizeDeck(deck) {
    const seen = new Set();
    const clean = (Array.isArray(deck) ? deck : []).filter((id) => {
      if (!CARDS[id] || CARDS[id].hidden || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, DECK_SIZE);
    const fallback = ['knight', 'archers', 'fireball', 'arrows', 'giant', 'musketeer', 'mini-pekka', 'cannon'];
    while (clean.length < DECK_SIZE) {
      const id = fallback.find((candidate) => !seen.has(candidate));
      if (!id) break;
      clean.push(id);
      seen.add(id);
    }
    return clean;
  }

  reset(playerDeck = this.playerDeck, aiDeck = this.aiDeck, difficulty = this.difficulty) {
    this.difficulty = AI_PRESETS[difficulty] ? difficulty : 'standard';
    this.playerDeck = this.sanitizeDeck(playerDeck?.length ? playerDeck : this.playerDeck);
    this.aiDeck = this.sanitizeDeck(aiDeck?.length ? aiDeck : (this.aiDeck?.length ? this.aiDeck : pick(AI_DECKS)));
    this.phase = 'idle';
    this.elapsed = 0;
    this.overtimeElapsed = 0;
    this.overtime = false;
    this.result = null;
    this.crowns = [0, 0];
    this.elixir = [5, 5];
    this.elixirFullNotified = [false, false];
    const playerCycle = this.shuffle(this.playerDeck);
    const aiCycle = this.shuffle(this.aiDeck);
    this.hands = [playerCycle.slice(0, 4), aiCycle.slice(0, 4)];
    this.queues = [playerCycle.slice(4), aiCycle.slice(4)];
    this.decks = [this.playerDeck, this.aiDeck];
    this.units = [];
    this.towers = [];
    this.projectiles = [];
    this.spells = [];
    this.deathBombs = [];
    this.pendingSpawns = [];
    this.pendingImpacts = [];
    this.particles = [];
    this.shake = 0;
    this.nextId = 1;
    this.aiTimer = 1.2;
    this.aiState = 'Observe l’arène';
    this.lastPlayed = [null, null];
    this.stats = [{ cards: 0, damage: 0 }, { cards: 0, damage: 0 }];
    this.doubleElixirAnnounced = false;
    this.jumpTrails = [];
    this.createTowers();
  }

  shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  start(difficulty = this.difficulty) {
    this.reset(this.playerDeck, this.aiDeck, difficulty);
    this.phase = 'running';
    this.emit('match-start', { difficulty: this.difficulty, playerDeck: this.playerDeck, aiDeck: this.aiDeck });
  }

  createTowers() {
    for (const team of [0, 1]) {
      const positions = team === 0 ? ARENA.towerPositions.player : ARENA.towerPositions.enemy;
      this.towers.push(this.makeTower(team, 'king', positions.king[0], positions.king[1], null));
      this.towers.push(this.makeTower(team, 'princess', positions.left[0], positions.left[1], 0));
      this.towers.push(this.makeTower(team, 'princess', positions.right[0], positions.right[1], 1));
    }
  }

  makeTower(team, kind, x, y, lane) {
    const king = kind === 'king';
    return {
      id: this.nextId++, team, kind, lane, x, y,
      radius: king ? 46 : 32,
      hp: king ? 4000 : 2400,
      maxHp: king ? 4000 : 2400,
      damage: king ? 120 : 90,
      range: king ? 275 : 245,
      hitSpeed: king ? 1 : 0.8,
      attackCooldown: random(0.1, 0.5),
      projectileSpeed: 640,
      projectileKind: king ? 'cannonball' : 'arrow',
      isStructure: true,
      isTower: true,
      active: !king,
      alive: true,
      attackFlash: 0,
      hitFlash: 0,
      spawned: true,
    };
  }

  emit(type, detail = {}) {
    this.onEvent({ type, ...detail });
  }

  get running() { return this.phase === 'running'; }
  get timeLeft() {
    return Math.max(0, this.overtime ? ARENA.overtimeTime - this.overtimeElapsed : ARENA.matchTime - this.elapsed);
  }
  get inDoubleElixir() { return this.overtime || this.timeLeft <= 60; }
  get elixirMultiplier() { return this.overtime ? 3 : this.timeLeft <= 60 ? 2 : 1; }

  getTower(team, kind, lane = null) {
    return this.towers.find((tower) => tower.team === team && tower.kind === kind && (lane === null || tower.lane === lane));
  }

  getCrowns(team) {
    return this.crowns[team];
  }

  getIntegrity(team) {
    const towers = this.towers.filter((tower) => tower.team === team);
    return towers.reduce((sum, tower) => sum + Math.max(0, tower.hp) / tower.maxHp, 0) / towers.length;
  }

  setPaused(paused) {
    if (paused && this.phase === 'running') {
      this.phase = 'paused';
      this.emit('pause');
    } else if (!paused && this.phase === 'paused') {
      this.phase = 'running';
      this.emit('resume');
    }
  }

  step(dt) {
    if (!this.running) return;
    this.elapsed += dt;
    if (this.overtime) this.overtimeElapsed += dt;

    if (this.inDoubleElixir && !this.doubleElixirAnnounced) {
      this.doubleElixirAnnounced = true;
      this.emit('double-elixir', { overtime: this.overtime });
    }

    const regen = ARENA.elixirRate * this.elixirMultiplier * dt;
    for (const team of [0, 1]) {
      this.elixir[team] = Math.min(10, this.elixir[team] + regen);
      if (this.elixir[team] >= 9.99 && !this.elixirFullNotified[team]) {
        this.elixirFullNotified[team] = true;
        if (team === 0) this.emit('elixir-full');
      } else if (this.elixir[team] < 9.5) {
        this.elixirFullNotified[team] = false;
      }
    }

    this.updateSpells(dt);
    if (this.running) this.updateUnits(dt);
    if (this.running) this.updateTowers(dt);
    if (this.running) this.updateProjectiles(dt);
    if (this.running) this.updatePending(dt);
    if (this.running) this.resolveSeparation();
    this.updateEffects(dt);
    if (this.running) this.updateAI(dt);
    this.checkClock();
  }

  checkClock() {
    if (!this.running || this.timeLeft > 0) return;
    if (!this.overtime) {
      if (this.crowns[0] !== this.crowns[1]) {
        this.finish(this.crowns[0] > this.crowns[1] ? 0 : 1, 'time');
      } else {
        this.overtime = true;
        this.overtimeElapsed = 0;
        this.doubleElixirAnnounced = false;
        this.emit('overtime');
      }
      return;
    }
    if (this.crowns[0] !== this.crowns[1]) {
      this.finish(this.crowns[0] > this.crowns[1] ? 0 : 1, 'overtime-time');
      return;
    }
    const playerIntegrity = this.getIntegrity(0);
    const enemyIntegrity = this.getIntegrity(1);
    if (Math.abs(playerIntegrity - enemyIntegrity) < 0.0001) this.finish(null, 'draw');
    else this.finish(playerIntegrity > enemyIntegrity ? 0 : 1, 'integrity');
  }

  finish(winner, reason) {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    if (winner !== null && reason === 'king') {
      this.crowns[winner] = 3;
    }
    this.result = {
      winner,
      reason,
      playerCrowns: this.crowns[0],
      enemyCrowns: this.crowns[1],
      elapsed: this.elapsed,
    };
    this.emit('game-over', { result: this.result });
  }

  canPlace(team, cardId, x, y, options = {}) {
    const card = CARDS[cardId];
    if (!card) return { ok: false, reason: 'Carte inconnue' };
    if (x < 28 || x > ARENA.width - 28 || y < 34 || y > ARENA.height - 30) {
      return { ok: false, reason: 'Hors de l’arène' };
    }
    const isSpell = card.type === 'spell';
    const anywhere = isSpell || card.deployAnywhere || options.anywhere;
    if (anywhere) return { ok: true };
    if (y > ARENA.riverTop - 8 && y < ARENA.riverBottom + 8) {
      return { ok: false, reason: 'Impossible de déployer dans l’eau' };
    }
    let allowed = false;
    if (team === 0) {
      allowed = y >= ARENA.riverBottom + 18 && y <= 908;
      if (!allowed) {
        const lane = x < ARENA.width / 2 ? 0 : 1;
        const princess = this.getTower(1, 'princess', lane);
        allowed = !princess.alive && y >= 180 && y < ARENA.riverTop;
      }
    } else {
      allowed = y <= ARENA.riverTop - 18 && y >= 52;
      if (!allowed) {
        const lane = x < ARENA.width / 2 ? 0 : 1;
        const princess = this.getTower(0, 'princess', lane);
        allowed = !princess.alive && y > ARENA.riverBottom && y <= 780;
      }
    }
    if (!allowed) return { ok: false, reason: team === 0 ? 'Déployez sur votre terrain' : 'Hors zone de déploiement' };
    const clearance = (card.radius || 14) + 18;
    if (this.towers.some((tower) => tower.alive && Math.hypot(x - tower.x, y - tower.y) < tower.radius + clearance)) {
      return { ok: false, reason: 'Trop proche d’une tour' };
    }
    if (card.type === 'building' && this.units.some((unit) => unit.alive && unit.isStructure && Math.hypot(x - unit.x, y - unit.y) < (unit.radius + card.radius + 8))) {
      return { ok: false, reason: 'Emplacement occupé' };
    }
    if (card.type === 'troop' && this.units.some((unit) => unit.alive && unit.isStructure && Math.hypot(x - unit.x, y - unit.y) < unit.radius + 8)) {
      return { ok: false, reason: 'Emplacement occupé' };
    }
    return { ok: true };
  }

  handCost(team, index) {
    const id = this.hands[team]?.[index];
    const card = CARDS[id];
    return cardCost(card, this.lastPlayed[team]);
  }

  playCard(team, handIndex, x, y, options = {}) {
    if (!this.running && !options.force) return { ok: false, reason: 'Le combat n’est pas actif' };
    const cardId = this.hands[team]?.[handIndex];
    const card = CARDS[cardId];
    if (!card) return { ok: false, reason: 'Carte indisponible' };
    const mirrored = card.id === 'mirror';
    const mirrorTargetId = mirrored ? this.lastPlayed[team] : null;
    const mirrorTarget = mirrorTargetId ? CARDS[mirrorTargetId] : null;
    if (mirrored && (!mirrorTarget || mirrorTarget.id === 'mirror')) {
      return { ok: false, reason: 'Aucune carte à copier' };
    }
    const actualCard = mirrored ? mirrorTarget : card;
    const cost = mirrored ? mirrorTarget.cost + 1 : card.cost;
    if (!options.free && this.elixir[team] + 0.001 < cost) {
      return { ok: false, reason: 'Pas assez d’élixir' };
    }
    const placement = this.canPlace(team, actualCard.id, x, y, { anywhere: options.anywhere || actualCard.deployAnywhere });
    if (!placement.ok) return placement;

    if (!options.free) this.elixir[team] -= cost;
    this.stats[team].cards++;
    if (!options.noCycle) {
      const played = this.hands[team][handIndex];
      this.hands[team][handIndex] = this.queues[team].shift() || played;
      this.queues[team].push(played);
    }
    if (card.id !== 'mirror') this.lastPlayed[team] = card.id;
    else if (options.force) this.lastPlayed[team] = card.id;

    this.deploy(team, actualCard, x, y, { mirrored, deployTime: options.deployTime });
    this.emit('card-played', { team, card: actualCard, cost, mirrored, x, y });
    return { ok: true, card: actualCard, cost, mirrored };
  }

  deploy(team, card, x, y, options = {}) {
    if (card.type === 'spell') {
      this.castSpell(team, card, x, y, options);
      return;
    }
    if (card.type === 'building') {
      this.spawnUnit(team, card.id, x, y, { deployTime: options.deployTime });
      this.burst(x, y, team === 0 ? '#65c7ff' : '#ff7a7a', 14, 70);
      this.ring(x, y, '#ffffff', 34);
      this.emit('deploy', { team, card, x, y });
      return;
    }
    const entries = card.composition
      ? card.composition.flatMap(([id, count]) => Array.from({ length: count }, () => id))
      : Array.from({ length: card.count || 1 }, () => card.id);
    const offsets = this.formation(entries.length, card.radius || 14, card.flying);
    entries.forEach((id, index) => {
      const [ox, oy] = offsets[index] || [0, 0];
      this.spawnUnit(team, id, x + ox, y + oy, { deployTime: options.deployTime });
    });
    if (card.spawnDamage) {
      const delay = (options.deployTime ?? card.deployTime ?? 1) + 0.05;
      this.pendingImpacts.push({
        team, x, y, timer: delay,
        damage: card.spawnDamage,
        radius: card.spawnRadius || 90,
        card,
      });
    }
    this.burst(x, y, team === 0 ? '#65c7ff' : '#ff7a7a', 12, 65);
    this.ring(x, y, team === 0 ? '#8fe3ff' : '#ffb0b0', 28);
    this.emit('deploy', { team, card, x, y });
  }

  formation(count, radius, flying) {
    if (count <= 1) return [[0, 0]];
    const spacing = Math.max(radius * 2.1, 16);
    if (count === 2) return [[-spacing * 0.42, 0], [spacing * 0.42, 0]];
    if (count === 3) return [[-spacing * 0.62, spacing * 0.2], [spacing * 0.62, spacing * 0.2], [0, -spacing * 0.55]];
    if (count === 4) return [[-spacing * 0.55, spacing * 0.45], [spacing * 0.55, spacing * 0.45], [-spacing * 0.55, -spacing * 0.45], [spacing * 0.55, -spacing * 0.45]];
    if (count === 6) {
      return Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * TAU - Math.PI / 2;
        return [Math.cos(angle) * spacing * 0.75, Math.sin(angle) * spacing * 0.6];
      });
    }
    if (count > 6) {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      return Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return [(col - (cols - 1) / 2) * spacing * 0.72, (row - (rows - 1) / 2) * spacing * 0.62];
      });
    }
    return [[0, 0]];
  }

  spawnUnit(team, cardId, x, y, options = {}) {
    const card = CARDS[cardId];
    if (!card) return null;
    const deploy = options.deployTime ?? card.deployTime ?? 0.8;
    const unit = {
      id: this.nextId++, team, card, kind: card.type === 'building' ? 'building' : 'troop',
      x: clamp(x, 30 + (card.radius || 12), ARENA.width - 30 - (card.radius || 12)),
      y: clamp(y, 42 + (card.radius || 12), ARENA.height - 38 - (card.radius || 12)),
      radius: card.radius || 12,
      hp: card.hp, maxHp: card.hp,
      shield: card.shield || 0, maxShield: card.shield || 0,
      damage: card.damage || 0, speed: card.speed || 0,
      range: card.range || 30, minRange: card.minRange || 0,
      hitSpeed: card.hitSpeed || 1,
      attackCooldown: random(0.15, 0.45),
      canHitAir: !!card.canHitAir,
      flying: !!card.flying,
      targetsBuildings: !!card.targetsBuildings,
      splashRadius: card.splashRadius || 0,
      projectileSpeed: card.projectileSpeed || 0,
      projectileKind: this.projectileKind(card),
      isStructure: card.type === 'building',
      alive: true,
      spawnTime: deploy,
      lifetime: card.lifetime || 0,
      maxLifetime: card.lifetime || 0,
      target: null,
      retarget: 0,
      attackFlash: 0,
      hitFlash: 0,
      slowTimer: 0, slowFactor: 1,
      stunTimer: 0, frozenTimer: 0, rageTimer: 0,
      chargeTimer: 0, charged: false,
      jumpCooldown: random(1, 2),
      jumpState: null,
      burrowTimer: card.burrow || 0,
      stealth: !!card.stealth,
      stealthTimer: 0,
      rampTime: 0,
      rampTarget: null,
      spawnerTimer: card.spawner ? (card.spawner.first ?? 1.2) : 0,
      elixirTimer: card.elixirInterval ? (card.elixirInterval * 0.55) : 0,
      walkCycle: random(0, TAU),
      faceX: team === 0 ? 1 : -1,
      deathTimer: 0,
      deployTeam: team,
      slowOnDeath: card.deathSlow || null,
    };
    this.units.push(unit);
    return unit;
  }

  projectileKind(card) {
    if (card.art?.kind === 'goblin' && card.art?.weapon === 'spear') return 'spear';
    if (card.art?.kind === 'human' && card.art?.weapon === 'musket') return 'bullet';
    if (card.art?.kind === 'human' && card.art?.weapon === 'bow') return 'arrow';
    if (card.id === 'wizard' || card.id === 'baby-dragon') return 'fireball';
    if (card.id === 'witch') return 'magic';
    if (card.id === 'bomber') return 'bomb';
    if (card.id === 'tesla' || card.id === 'inferno-tower') return 'electric';
    if (card.id === 'mortar') return 'mortar';
    if (card.id === 'cannon' || card.id === 'bomb-tower') return 'cannonball';
    return 'arrow';
  }

  enemyTeam(team) { return team === 0 ? 1 : 0; }

  isTargetable(unit) {
    if (!unit || !unit.alive) return false;
    if (unit.burrowTimer > 0) return false;
    if (unit.spawnTime > 0.18) return false;
    if (unit.stealth && unit.stealthTimer <= 0) return false;
    return true;
  }

  validTarget(unit, target) {
    if (!target || !target.alive || target.team === unit.team) return false;
    if (target.isTower && target.kind === 'king' && !target.active) return true;
    if (target.flying && !unit.canHitAir) return false;
    if (target.isStructure && target.kind !== 'tower' && !this.isTargetable(target)) return false;
    if (!target.isTower && !this.isTargetable(target)) return false;
    if (unit.targetsBuildings && !target.isStructure) return false;
    return true;
  }

  acquireTarget(unit) {
    if (unit.isStructure && unit.speed === 0 && !unit.targetsBuildings) {
      return this.acquireDefenseTarget(unit);
    }
    if (unit.targetsBuildings) {
      const structures = [
        ...this.towers.filter((tower) => tower.alive && tower.team !== unit.team),
        ...this.units.filter((other) => other.alive && other.isStructure && other.team !== unit.team),
      ];
      return this.nearest(unit, structures);
    }
    const enemyBuildings = this.units.filter((other) => other.alive && other.isStructure && other.team !== unit.team && this.isTargetable(other));
    const buildingInSight = this.nearest(unit, enemyBuildings.filter((other) => distance(unit, other) <= 285));
    if (buildingInSight) return buildingInSight;
    const enemies = this.units.filter((other) => !other.isStructure && this.validTarget(unit, other));
    const sight = unit.card.sight || 215;
    const nearest = this.nearest(unit, enemies.filter((other) => distance(unit, other) - other.radius <= sight));
    if (nearest) return nearest;
    return this.acquireTowerTarget(unit);
  }

  nearest(unit, list) {
    let best = null;
    let bestDistance = Infinity;
    for (const other of list) {
      const d = distance(unit, other) - (other.radius || 0);
      if (d < bestDistance) {
        bestDistance = d;
        best = other;
      }
    }
    return best;
  }

  acquireTowerTarget(unit) {
    const towers = this.towers.filter((tower) => tower.alive && tower.team !== unit.team);
    if (!towers.length) return null;
    const enemyTeam = this.enemyTeam(unit.team);
    const anyPrincess = this.towers.some((tower) => tower.team === enemyTeam && tower.kind === 'princess' && tower.alive);
    let best = null;
    let bestScore = Infinity;
    for (const tower of towers) {
      let score = distance(unit, tower);
      if (tower.kind === 'king' && anyPrincess) score += 220;
      if (tower.kind === 'princess' && !unit.flying) {
        const laneBonus = Math.abs(unit.x - tower.x) * 0.35;
        score += laneBonus;
      }
      if (score < bestScore) {
        bestScore = score;
        best = tower;
      }
    }
    return best;
  }

  acquireDefenseTarget(unit) {
    let enemies = this.units.filter((other) => !other.isStructure && this.validTarget(unit, other));
    if (unit.card.id === 'mortar') {
      enemies = enemies.concat(this.towers.filter((tower) => tower.alive && tower.team !== unit.team));
    }
    const inRange = enemies.filter((other) => {
      const d = distance(unit, other);
      return d <= unit.range + other.radius && d >= (unit.minRange || 0);
    });
    return this.nearest(unit, inRange);
  }

  updateUnits(dt) {
    for (const unit of this.units) {
      if (!unit.alive) continue;
      unit.attackFlash = Math.max(0, unit.attackFlash - dt);
      unit.hitFlash = Math.max(0, unit.hitFlash - dt);
      unit.slowTimer = Math.max(0, unit.slowTimer - dt);
      unit.stunTimer = Math.max(0, unit.stunTimer - dt);
      unit.frozenTimer = Math.max(0, unit.frozenTimer - dt);
      unit.rageTimer = Math.max(0, unit.rageTimer - dt);
      unit.jumpCooldown = Math.max(0, unit.jumpCooldown - dt);
      unit.stealthTimer = Math.max(0, unit.stealthTimer - dt);
      if (unit.spawnTime > 0) {
        unit.spawnTime -= dt;
        continue;
      }
      if (unit.burrowTimer > 0) {
        unit.burrowTimer = Math.max(0, unit.burrowTimer - dt);
        if (unit.burrowTimer === 0) {
          this.burst(unit.x, unit.y, unit.team === 0 ? '#8fe3ff' : '#ffb0b0', 14, 75);
          this.ring(unit.x, unit.y, '#ffffff', 24);
        }
        continue;
      }
      if (unit.jumpState) {
        this.updateJump(unit, dt);
        continue;
      }
      if (unit.frozenTimer > 0 || unit.stunTimer > 0) continue;
      if (unit.isStructure) {
        if (unit.maxLifetime > 0) {
          unit.lifetime -= dt;
          if (unit.lifetime <= 0) {
            this.destroyUnit(unit, false);
            continue;
          }
        }
        if (unit.card.elixirInterval) {
          unit.elixirTimer -= dt;
          if (unit.elixirTimer <= 0) {
            unit.elixirTimer = unit.card.elixirInterval;
            this.elixir[unit.team] = Math.min(10, this.elixir[unit.team] + (unit.card.elixirAmount || 1));
            this.floatElixir(unit.x, unit.y - 34, unit.team);
            this.emit('elixir-collected', { team: unit.team });
          }
        }
        if (unit.card.spawner) {
          unit.spawnerTimer -= dt;
          if (unit.spawnerTimer <= 0) {
            unit.spawnerTimer = unit.card.spawner.interval;
            const spawn = unit.card.spawner;
            const direction = unit.team === 0 ? -1 : 1;
            for (let i = 0; i < spawn.count; i++) {
              const off = spawn.count === 1 ? 0 : (i - (spawn.count - 1) / 2) * (spawn.spread || 26);
              const child = this.spawnUnit(unit.team, spawn.cardId, unit.x + off, unit.y + direction * 22, { deployTime: 0.3 });
              if (child) child.y = clamp(child.y, 46, ARENA.height - 46);
            }
            this.emit('spawner', { unit, x: unit.x, y: unit.y });
          }
        }
      }
      unit.attackCooldown -= dt;
      unit.retarget -= dt;
      if (unit.retarget <= 0 || !this.validTarget(unit, unit.target)) {
        unit.target = this.acquireTarget(unit);
        unit.retarget = random(0.18, 0.34);
      }
      const target = unit.target;
      if (!target) continue;
      const dist = distance(unit, target);
      const reach = unit.range + target.radius;
      if (unit.stealth) {
        if (dist <= reach + 10) unit.stealthTimer = Math.max(unit.stealthTimer, 1.8);
      }
      if (unit.card.jump && !unit.isStructure && unit.jumpCooldown <= 0 && dist > 70 && dist < 195) {
        this.beginJump(unit, target);
        continue;
      }
      if (unit.card.ramp) {
        if (target === unit.rampTarget && dist <= reach) unit.rampTime += dt;
        else {
          unit.rampTime = 0;
          unit.rampTarget = target;
        }
      }
      if (dist <= reach && dist >= (unit.minRange || 0)) {
        unit.chargeTimer = Math.max(0, unit.chargeTimer - dt * 2.2);
        if (unit.attackCooldown <= 0) this.attack(unit, target);
      } else if (!unit.isStructure) {
        this.moveUnit(unit, target, dt);
      }
    }
    this.units = this.units.filter((unit) => unit.alive || unit.deathTimer > 0);
    for (const unit of this.units) {
      if (!unit.alive) unit.deathTimer -= dt;
    }
  }

  beginJump(unit, target) {
    unit.target = target;
    unit.jumpState = {
      x0: unit.x, y0: unit.y, x1: target.x, y1: target.y,
      t: 0, duration: 0.42, targetId: target.id,
    };
    unit.stealthTimer = 1.2;
    this.emit('jump', { unit, x: target.x, y: target.y });
  }

  updateJump(unit, dt) {
    const jump = unit.jumpState;
    jump.t += dt / jump.duration;
    const t = Math.min(1, jump.t);
    unit.x = jump.x0 + (jump.x1 - jump.x0) * t;
    unit.y = jump.y0 + (jump.y1 - jump.y0) * t;
    unit.jumpHeight = Math.sin(t * Math.PI) * 46;
    unit.faceX = jump.x1 >= jump.x0 ? 1 : -1;
    if (t >= 1) {
      unit.jumpState = null;
      unit.jumpHeight = 0;
      unit.jumpCooldown = unit.card.jump.cooldown || 5;
      this.dealAreaDamage(unit.team, unit.x, unit.y, unit.card.jump.radius, unit.card.jump.damage, { includeTowers: false, source: unit });
      this.burst(unit.x, unit.y, unit.team === 0 ? '#7fdcff' : '#ffb0b0', 24, 130);
      this.ring(unit.x, unit.y, '#ffffff', unit.card.jump.radius);
      this.shake = Math.max(this.shake, 0.25);
      this.emit('impact', { x: unit.x, y: unit.y, heavy: true });
    }
  }

  moveUnit(unit, target, dt) {
    if (unit.isStructure) return;
    const slow = unit.slowTimer > 0 ? unit.slowFactor : 1;
    const rage = unit.rageTimer > 0 ? 1.38 : 1;
    let speed = unit.speed * slow * rage;
    if (unit.chargeTimer > 0.9 && unit.card.charge) {
      unit.charged = true;
      speed *= unit.card.charge.speed || 1.6;
    }
    const destination = this.waypoint(unit, target);
    let dx = destination.x - unit.x;
    let dy = destination.y - unit.y;
    const length = Math.hypot(dx, dy) || 1;
    if (length < 4 && destination !== target) {
      dx = target.x - unit.x;
      dy = target.y - unit.y;
    }
    dx /= length;
    dy /= length;
    unit.x += dx * speed * dt;
    unit.y += dy * speed * dt;
    if (Math.abs(dx) > 0.08) unit.faceX = dx > 0 ? 1 : -1;
    unit.walkCycle += dt * speed * 0.13;
    unit.chargeTimer += dt;
    unit.x = clamp(unit.x, 28 + unit.radius, ARENA.width - 28 - unit.radius);
    unit.y = clamp(unit.y, 42 + unit.radius, ARENA.height - 36 - unit.radius);
  }

  waypoint(unit, target) {
    if (unit.flying || unit.card.jumpRiver) {
      return target;
    }
    const top = ARENA.riverTop;
    const bottom = ARENA.riverBottom;
    const crossingUp = unit.y > bottom - 2 && target.y < top + 2;
    const crossingDown = unit.y < top + 2 && target.y > bottom - 2;
    if (!crossingUp && !crossingDown) return target;
    const bridge = ARENA.bridges.reduce((best, x) => Math.abs(x - unit.x) < Math.abs(best - unit.x) ? x : best, ARENA.bridges[0]);
    if (crossingUp) {
      if (unit.y > bottom + 8 && Math.abs(unit.x - bridge) > 9) return { x: bridge, y: bottom + 8 };
      return { x: bridge, y: top - 28 };
    }
    if (unit.y < top - 8 && Math.abs(unit.x - bridge) > 9) return { x: bridge, y: top - 8 };
    return { x: bridge, y: bottom + 28 };
  }

  attack(attacker, target) {
    const rageRate = attacker.rageTimer > 0 ? 0.72 : 1;
    attacker.attackCooldown = attacker.hitSpeed * rageRate;
    attacker.attackFlash = 0.2;
    attacker.stealthTimer = attacker.stealth ? 1.8 : attacker.stealthTimer;
    const teamColor = attacker.team === 0 ? '#65c7ff' : '#ff7a7a';
    let damage = attacker.damage;
    if (attacker.charged && attacker.card.charge) {
      damage *= attacker.card.charge.damage || 1.8;
      attacker.charged = false;
      attacker.chargeTimer = 0;
      this.ring(target.x, target.y, '#ffd166', 32);
    } else if (attacker.card.charge) {
      attacker.chargeTimer = 0;
    }
    if (attacker.card.ramp) {
      const ramp = attacker.card.ramp;
      damage *= 1 + Math.min(ramp.max - 1, attacker.rampTime * ramp.rate);
    }
    if (attacker.card.suicide) {
      this.dealAreaDamage(attacker.team, attacker.x, attacker.y, attacker.splashRadius || 60, damage, { includeTowers: false, source: attacker, air: true });
      this.burst(attacker.x, attacker.y, '#ff9b3d', 24, 140);
      this.ring(attacker.x, attacker.y, '#ffd166', attacker.splashRadius || 60);
      this.destroyUnit(attacker, false);
      this.emit('spell-impact', { card: attacker.card, x: attacker.x, y: attacker.y, small: true });
      return;
    }
    if (attacker.projectileSpeed && !attacker.isStructure) {
      this.projectiles.push({
        id: this.nextId++, team: attacker.team,
        x: attacker.x, y: attacker.y - 12,
        target, damage,
        speed: attacker.projectileSpeed,
        radius: target.isTower ? 4 : 5,
        kind: attacker.projectileKind || 'arrow',
        splashRadius: attacker.splashRadius || 0,
        color: attacker.card.art?.accent || teamColor,
        canHitAir: !!attacker.card.canHitAir,
        alive: true,
        sourceTeam: attacker.team,
        sourceId: attacker.id,
      });
      this.emit('shot', { x: attacker.x, y: attacker.y, kind: attacker.projectileKind || attacker.card.id });
      return;
    }
    if (attacker.isStructure && attacker.projectileSpeed) {
      this.projectiles.push({
        id: this.nextId++, team: attacker.team,
        x: attacker.x, y: attacker.y - 30,
        target, damage,
        speed: attacker.projectileSpeed,
        radius: 5,
        kind: attacker.projectileKind || 'arrow',
        splashRadius: 0,
        color: teamColor,
        canHitAir: true,
        alive: true,
        sourceTeam: attacker.team,
      });
      this.emit('shot', { x: attacker.x, y: attacker.y, kind: attacker.projectileKind || 'tower' });
      return;
    }
    if (attacker.splashRadius) {
      this.dealAreaDamage(attacker.team, target.x, target.y, attacker.splashRadius, damage, { includeTowers: false, source: attacker, air: !!attacker.canHitAir });
      this.slash(target.x, target.y, teamColor);
    } else {
      this.dealDamage(target, damage, attacker.team);
      this.slash(target.x, target.y, teamColor);
    }
    if (attacker.stealth) attacker.stealthTimer = 1.8;
    this.emit('melee', { x: target.x, y: target.y, kind: attacker.card.id });
  }

  updateTowers(dt) {
    for (const tower of this.towers) {
      if (!tower.alive) continue;
      tower.attackCooldown -= dt;
      tower.attackFlash = Math.max(0, tower.attackFlash - dt);
      tower.hitFlash = Math.max(0, tower.hitFlash - dt);
      if (!tower.active) continue;
      let target = null;
      let best = Infinity;
      for (const unit of this.units) {
        if (!unit.alive || unit.team === tower.team || !this.isTargetable(unit)) continue;
        const d = distance(tower, unit);
        if (d <= tower.range + unit.radius && d < best) {
          best = d;
          target = unit;
        }
      }
      if (target && tower.attackCooldown <= 0) {
        tower.attackCooldown = tower.hitSpeed;
        tower.attackFlash = 0.2;
        this.projectiles.push({
          id: this.nextId++, team: tower.team,
          x: tower.x, y: tower.y - (tower.kind === 'king' ? 44 : 30),
          target, damage: tower.damage,
          speed: tower.projectileSpeed,
          radius: tower.kind === 'king' ? 6 : 4,
          kind: tower.projectileKind,
          splashRadius: 0,
          color: tower.team === 0 ? '#8fe3ff' : '#ffb0b0',
          canHitAir: true,
          alive: true,
          sourceTeam: tower.team,
        });
        this.emit('shot', { x: tower.x, y: tower.y, kind: 'tower' });
      }
    }
  }

  updateProjectiles(dt) {
    for (const projectile of this.projectiles) {
      if (!projectile.alive) continue;
      let target = projectile.target;
      if (!target || !target.alive) {
        if (projectile.splashRadius) {
          this.dealAreaDamage(projectile.team, projectile.x, projectile.y, projectile.splashRadius, projectile.damage, { includeTowers: false, air: !!projectile.canHitAir });
          this.burst(projectile.x, projectile.y, projectile.color, 8, 60);
        }
        projectile.alive = false;
        continue;
      }
      const dy = target.y - target.radius * 0.2 - projectile.y;
      const dx = target.x - projectile.x;
      const dist = Math.hypot(dx, dy);
      const step = projectile.speed * dt;
      if (dist <= step + target.radius * 0.45) {
        if (projectile.splashRadius) {
          this.dealAreaDamage(projectile.team, target.x, target.y, projectile.splashRadius, projectile.damage, { includeTowers: false, sourceTeam: projectile.team, air: !!projectile.canHitAir });
          this.burst(target.x, target.y, projectile.color, 9, 80);
        } else {
          this.dealDamage(target, projectile.damage, projectile.team);
        }
        projectile.alive = false;
        this.emit('impact', { x: target.x, y: target.y });
      } else {
        projectile.x += dx / dist * step;
        projectile.y += dy / dist * step;
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);
  }

  castSpell(team, card, x, y, options = {}) {
    const spell = card.spell;
    if (!spell) return;
    if (spell.effect === 'mirror') return;
    this.spells.push({
      id: this.nextId++, team, card, x, y,
      radius: spell.radius || 70,
      timer: spell.delay || 0.4,
      delay: spell.delay || 0.4,
      impacted: false,
      options,
    });
    this.emit('spell', { team, card, x, y });
  }

  updateSpells(dt) {
    for (const spell of this.spells) {
      spell.timer -= dt;
      if (spell.timer > 0 || spell.impacted) continue;
      spell.impacted = true;
      this.impactSpell(spell);
    }
    this.spells = this.spells.filter((spell) => !spell.impacted);
  }

  impactSpell(spell) {
    const { card, team, x, y } = spell;
    const effect = card.spell;
    const color = card.art?.accent || '#ffd166';
    if (effect.effect === 'damage') {
      this.dealAreaDamage(team, x, y, spell.radius, effect.damage, {
        includeTowers: true,
        towerDamage: effect.towerDamage,
        air: effect.air,
        sourceTeam: team,
      });
      if (effect.stun) {
        for (const target of [...this.units, ...this.towers]) {
          if (target.alive && target.team !== team && distance(spell, target) <= spell.radius + target.radius) {
            target.stunTimer = Math.max(target.stunTimer || 0, effect.stun);
          }
        }
      }
      if (effect.knockback) {
        for (const unit of this.units) {
          if (!unit.alive || unit.team === team || unit.isStructure) continue;
          if (distance(spell, unit) > spell.radius + unit.radius) continue;
          const angle = Math.atan2(unit.y - y, unit.x - x) || random(0, TAU);
          unit.x = clamp(unit.x + Math.cos(angle) * effect.knockback, 32, ARENA.width - 32);
          unit.y = clamp(unit.y + Math.sin(angle) * effect.knockback, 42, ARENA.height - 36);
        }
      }
      this.burst(x, y, color, effect.effect === 'damage' && card.cost >= 4 ? 30 : 18, 150);
      this.ring(x, y, color, spell.radius);
      this.shake = Math.max(this.shake, card.cost >= 4 ? 0.35 : 0.16);
    } else if (effect.effect === 'lightning') {
      const targets = [...this.units, ...this.towers]
        .filter((target) => target.alive && target.team !== team)
        .filter((target) => distance(spell, target) <= spell.radius + target.radius)
        .filter((target) => !target.isTower || target.kind !== 'king' || target.active)
        .sort((a, b) => b.hp - a.hp)
        .slice(0, effect.targets || 3);
      for (const target of targets) {
        const amount = target.isTower && effect.towerDamage != null ? effect.towerDamage : effect.damage;
        this.dealDamage(target, amount, team);
        if (effect.stun) target.stunTimer = Math.max(target.stunTimer || 0, effect.stun);
        this.lightningBolt(target.x, 34, target.x + random(-8, 8), target.y - 10);
        this.burst(target.x, target.y - 20, '#ffe36e', 13, 120);
        this.ring(target.x, target.y, '#ffe36e', 34);
      }
      this.shake = Math.max(this.shake, 0.32);
      this.ring(x, y, '#ffe36e', spell.radius);
      this.burst(x, y, '#fff3b0', 22, 140);
      spell.hitCount = targets.length;
    } else if (effect.effect === 'freeze') {
      for (const target of [...this.units, ...this.towers]) {
        if (target.alive && target.team !== team && distance(spell, target) <= spell.radius + target.radius) {
          target.frozenTimer = Math.max(target.frozenTimer || 0, effect.duration);
        }
      }
      this.ring(x, y, '#bdf6ff', spell.radius);
      this.burst(x, y, '#bdf6ff', 24, 90);
    } else if (effect.effect === 'rage') {
      for (const unit of this.units) {
        if (!unit.alive || unit.team !== team) continue;
        if (distance(spell, unit) <= spell.radius + unit.radius) unit.rageTimer = Math.max(unit.rageTimer, effect.duration);
      }
      this.ring(x, y, '#e3b6ff', spell.radius);
      this.burst(x, y, '#d58bff', 22, 90);
    } else if (effect.effect === 'spawn') {
      const spawnCard = CARDS[effect.cardId];
      if (spawnCard) {
        const count = effect.count || 1;
        const offsets = this.formation(count, spawnCard.radius || 10, spawnCard.flying);
        offsets.forEach(([ox, oy], index) => {
          if (index < count) this.spawnUnit(team, effect.cardId, x + ox, y + oy, { deployTime: 0.35 });
        });
      }
      this.ring(x, y, color, 42);
      this.burst(x, y, color, 16, 80);
    }
    this.emit('spell-impact', { card, x, y, radius: spell.radius, targets: spell.hitCount || 0 });
  }

  dealAreaDamage(team, x, y, radius, damage, options = {}) {
    const includeTowers = options.includeTowers !== false;
    const targets = [...this.units, ...(includeTowers ? this.towers : [])];
    for (const target of targets) {
      if (!target.alive || target.team === team) continue;
      if (!target.isTower && !this.isTargetable(target)) continue;
      if (target.flying && options.air === false) continue;
      if (distance({ x, y }, target) > radius + (target.radius || 0)) continue;
      const amount = target.isTower && options.towerDamage != null ? options.towerDamage : damage;
      this.dealDamage(target, amount, team);
    }
  }

  dealDamage(target, amount, sourceTeam) {
    if (!target.alive || amount <= 0) return;
    let remaining = amount;
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, remaining);
      target.shield -= absorbed;
      remaining -= absorbed;
      if (absorbed > 0) this.burst(target.x, target.y - 10, '#d9e6ef', 4, 40);
    }
    if (remaining <= 0) return;
    const actual = Math.min(target.hp, remaining);
    target.hp -= remaining;
    target.hitFlash = 0.14;
    if (this.stats[sourceTeam]) this.stats[sourceTeam].damage += actual;
    if (target.isTower && target.kind === 'king' && !target.active) {
      target.active = true;
      this.emit('king-active', { team: target.team });
    }
    if (target.hp <= 0) {
      target.hp = 0;
      if (target.isTower) this.destroyTower(target, sourceTeam);
      else this.destroyUnit(target, true);
    }
  }

  destroyUnit(unit, violent) {
    if (!unit.alive) return;
    unit.alive = false;
    unit.deathTimer = 0.5;
    unit.target = null;
    const color = unit.card.art?.accent || (unit.team === 0 ? '#65c7ff' : '#ff7a7a');
    this.burst(unit.x, unit.y, color, violent ? 10 : 5, violent ? 80 : 40);
    const card = unit.card;
    if (card.deathSlow) {
      for (const enemy of this.units) {
        if (!enemy.alive || enemy.team === unit.team || enemy.isStructure) continue;
        if (distance(unit, enemy) <= card.deathSlow.radius + enemy.radius) {
          enemy.slowTimer = Math.max(enemy.slowTimer, card.deathSlow.duration);
          enemy.slowFactor = Math.min(enemy.slowFactor, card.deathSlow.factor);
        }
      }
      this.ring(unit.x, unit.y, '#bdf6ff', card.deathSlow.radius);
    }
    if (card.deathDamage) {
      this.deathBombs.push({ x: unit.x, y: unit.y, team: unit.team, damage: card.deathDamage, radius: card.deathRadius || 90, timer: 0.45, maxTimer: 0.45 });
    }
    if (card.deathSpawn) {
      this.pendingSpawns.push({
        team: unit.team,
        cardId: card.deathSpawn.cardId,
        count: card.deathSpawn.count || 1,
        spread: card.deathSpawn.spread || 32,
        x: unit.x, y: unit.y,
        timer: 0.25,
      });
    }
    this.emit('unit-destroyed', { unit, card });
  }

  destroyTower(tower, sourceTeam) {
    if (!tower.alive) return;
    tower.alive = false;
    tower.hp = 0;
    this.burst(tower.x, tower.y, tower.team === 0 ? '#8fe3ff' : '#ffb0b0', 45, 220);
    this.ring(tower.x, tower.y, '#ffffff', 100);
    this.shake = 0.8;
    this.emit('tower-destroyed', { tower, sourceTeam });
    if (tower.kind === 'king') {
      this.crowns[sourceTeam] = 3;
      this.finish(sourceTeam, 'king');
      return;
    }
    this.crowns[sourceTeam] = Math.min(3, this.crowns[sourceTeam] + 1);
    this.emit('crown', { team: sourceTeam, crowns: this.crowns[sourceTeam] });
    const king = this.getTower(tower.team, 'king');
    if (king && !king.active) {
      king.active = true;
      this.emit('king-active', { team: tower.team });
    }
    if (this.overtime) {
      this.finish(sourceTeam, 'overtime-tower');
    }
  }

  updatePending(dt) {
    for (const bomb of this.deathBombs) {
      bomb.timer -= dt;
      if (bomb.timer <= 0 && !bomb.done) {
        bomb.done = true;
        this.dealAreaDamage(bomb.team, bomb.x, bomb.y, bomb.radius, bomb.damage, { includeTowers: true, sourceTeam: bomb.team });
        this.burst(bomb.x, bomb.y, '#ffb648', 34, 190);
        this.ring(bomb.x, bomb.y, '#ffd166', bomb.radius);
        this.shake = Math.max(this.shake, 0.35);
        this.emit('impact', { x: bomb.x, y: bomb.y, heavy: true });
      }
    }
    this.deathBombs = this.deathBombs.filter((bomb) => !bomb.done);
    for (const impact of this.pendingImpacts) {
      impact.timer -= dt;
      if (impact.timer <= 0 && !impact.done) {
        impact.done = true;
        this.dealAreaDamage(impact.team, impact.x, impact.y, impact.radius, impact.damage, { includeTowers: true, air: true, sourceTeam: impact.team });
        this.burst(impact.x, impact.y, '#65c7ff', 28, 165);
        this.ring(impact.x, impact.y, '#ffe7a8', impact.radius);
        this.shake = Math.max(this.shake, 0.45);
        this.emit('impact', { x: impact.x, y: impact.y, heavy: true });
      }
    }
    this.pendingImpacts = this.pendingImpacts.filter((impact) => !impact.done);
    for (const spawn of this.pendingSpawns) {
      spawn.timer -= dt;
      if (spawn.timer <= 0 && !spawn.done) {
        spawn.done = true;
        const offsets = this.formation(spawn.count, 11, false);
        offsets.forEach(([ox, oy]) => this.spawnUnit(spawn.team, spawn.cardId, spawn.x + ox, spawn.y + oy, { deployTime: 0.25 }));
        this.emit('spawner', { x: spawn.x, y: spawn.y });
      }
    }
    this.pendingSpawns = this.pendingSpawns.filter((spawn) => !spawn.done);
  }

  resolveSeparation() {
    const active = this.units.filter((unit) => unit.alive && !unit.isStructure && unit.spawnTime <= 0 && unit.burrowTimer <= 0);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        if (!!a.flying !== !!b.flying) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const minimum = (a.radius + b.radius) * 0.78;
        if (dist < minimum) {
          const push = (minimum - dist) * 0.22;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }

  updateAI(dt) {
    this.aiTimer -= dt;
    if (this.aiTimer > 0) return;
    const preset = AI_PRESETS[this.difficulty];
    this.aiTimer = preset.think * random(0.86, 1.16);
    const team = 1;
    const hand = this.hands[team];
    const affordable = (id) => hand.includes(id) && this.elixir[team] >= cardCost(CARDS[id], this.lastPlayed[team]) - 0.001;
    const threats = this.units
      .filter((unit) => unit.alive && unit.team === 0 && !unit.isStructure && unit.spawnTime <= 0)
      .filter((unit) => unit.y < ARENA.riverTop + 130);
    const grouped = this.bestSpellCluster(team);

    const spellChoice = this.aiSpellChoice(grouped, preset);
    if (spellChoice) {
      const index = hand.indexOf(spellChoice.id);
      if (index >= 0 && this.tryAIPlay(index, spellChoice.x, spellChoice.y)) {
        this.aiState = `Sort ${spellChoice.name}`;
        return;
      }
    }

    if (threats.length) {
      threats.sort((a, b) => {
        const aDanger = this.aiThreatScore(a);
        const bDanger = this.aiThreatScore(b);
        return bDanger - aDanger;
      });
      const threat = threats[0];
      const counters = this.aiCounterList(threat);
      const choice = counters.find((id) => affordable(id));
      if (choice && Math.random() < preset.defend + (this.elixir[team] >= 8 ? 0.12 : 0)) {
        const card = CARDS[choice];
        const nearTower = this.nearestTowerForAI(threat);
        const behind = card.range > 100 || card.type === 'building' ? 100 : 55;
        let x = threat.x + random(-preset.spread, preset.spread);
        let y = threat.y - behind;
        if (nearTower) {
          const towardTower = Math.atan2(nearTower.y - threat.y, nearTower.x - threat.x);
          x = threat.x + Math.cos(towardTower) * 60 + random(-preset.spread, preset.spread);
          y = threat.y + Math.sin(towardTower) * 60 + (card.range > 100 ? -20 : 8);
        }
        x = clamp(x, 52, ARENA.width - 52);
        y = clamp(y, 120, ARENA.riverTop - 30);
        if (this.tryAIPlay(hand.indexOf(choice), x, y, { anywhere: false })) {
          this.aiState = `Défense ${card.name}`;
          return;
        }
      }
      if (threats.length >= 4 && Math.random() < 0.4) {
        const splash = this.bestSplashCard(affordable);
        if (splash) { this.aiState = 'Nettoyage'; return; }
      }
      if (Math.random() < 0.96 - preset.defend) {
        this.aiState = 'Défense prudente';
        return;
      }
    }

    const ownPush = this.units.find((unit) => unit.alive && unit.team === 1 && unit.card.targetsBuildings && unit.y < 600);
    if (ownPush && this.elixir[team] >= 3) {
      const support = ['musketeer', 'wizard', 'archers', 'mini-pekka', 'valkyrie', 'baby-dragon', 'witch', 'goblins']
        .find((id) => affordable(id));
      if (support) {
        const index = hand.indexOf(support);
        if (this.tryAIPlay(index, clamp(ownPush.x + random(-30, 30), 60, 660), clamp(ownPush.y - 80, 120, 430))) {
          this.aiState = 'Soutien de push';
          return;
        }
      }
    }

    const attackThreshold = preset.attackAt - (this.inDoubleElixir ? 1.4 : 0);
    if (this.elixir[team] >= attackThreshold || (this.elapsed > 145 && this.elixir[team] >= 4.5)) {
      const lane = this.weakestLane(0);
      const laneX = ARENA.bridges[lane];
      const winConditions = ['giant', 'hog-rider', 'golem', 'balloon', 'mega-knight', 'pekka', 'giant-skeleton', 'prince', 'x-bow', 'mortar'];
      const choice = winConditions.find((id) => affordable(id))
        || ['valkyrie', 'barbarians', 'mini-pekka', 'knight', 'musketeer', 'archers', 'bomber', 'minions']
          .find((id) => affordable(id));
      if (choice) {
        const card = CARDS[choice];
        const x = clamp(laneX + random(-42, 42) * (1 + preset.spread / 50), 70, 650);
        const y = card.type === 'building' ? random(300, 360) : random(350, 410);
        if (this.tryAIPlay(hand.indexOf(choice), x, y)) {
          this.aiState = `Assaut ${lane === 0 ? 'gauche' : 'droit'}`;
          return;
        }
      }
    }

    if (this.elixir[team] >= 9.4) {
      const cheap = hand
        .map((id, index) => ({ id, index, card: CARDS[id] }))
        .filter(({ id, card }) => card && affordable(id) && cardCost(card, this.lastPlayed[team]) <= 4 && card.type !== 'spell')
        .sort((a, b) => a.card.cost - b.card.cost)[0];
      if (cheap) {
        const lane = this.weakestLane(0);
        if (this.tryAIPlay(cheap.index, clamp(ARENA.bridges[lane] + random(-50, 50), 70, 650), random(330, 400))) {
          this.aiState = 'Cycle en réserve';
        }
      }
    } else {
      this.aiState = this.elixir[team] > 8 ? 'Prépare l’assaut' : 'Accumule l’élixir';
    }
  }

  aiThreatScore(unit) {
    const targetTower = this.nearestTowerForAI(unit);
    const proximity = targetTower ? 700 - Math.min(700, distance(unit, targetTower)) : 0;
    return unit.maxHp * 0.03 + unit.damage * (unit.card.count || 1) * 0.14 + proximity * 0.55 + (unit.flying ? 40 : 0);
  }

  aiCounterList(threat) {
    const list = [];
    if (threat.flying) list.push('baby-dragon', 'musketeer', 'archers', 'wizard', 'tesla', 'inferno-tower', 'spear-goblins', 'witch', 'minions');
    if ((threat.card.count || 1) >= 3 || threat.card.id === 'skeleton-army') {
      list.push('wizard', 'valkyrie', 'bomber', 'arrows', 'fireball', 'mega-knight', 'zap', 'witch', 'baby-dragon', 'bomb-tower');
    }
    if (threat.maxHp >= 1700) {
      list.push('mini-pekka', 'pekka', 'skeleton-army', 'prince', 'mega-knight', 'inferno-tower');
    }
    if (threat.card.range > 130) list.push('knight', 'mini-pekka', 'valkyrie', 'hog-rider', 'prince');
    list.push('cannon', 'tesla', 'knight', 'archers', 'musketeer', 'mini-pekka', 'valkyrie', 'goblins', 'skeleton-army', 'bomber', 'minions');
    return [...new Set(list)];
  }

  nearestTowerForAI(unit) {
    let best = null;
    let bestDist = Infinity;
    for (const tower of this.towers) {
      if (tower.team !== 1 || !tower.alive) continue;
      const d = distance(unit, tower);
      if (d < bestDist) { bestDist = d; best = tower; }
    }
    return best;
  }

  bestSplashCard(affordable) {
    const ids = ['wizard', 'valkyrie', 'bomber', 'baby-dragon', 'arrows', 'fireball', 'mega-knight', 'bomb-tower'];
    const id = ids.find((candidate) => affordable(candidate));
    return id || null;
  }

  aiSpellChoice(cluster, preset) {
    if (!cluster) return null;
    const team = 1;
    const affordable = (id) => this.hands[team].includes(id) && this.elixir[team] >= CARDS[id].cost;
    const finishingTower = this.towers.find((tower) => tower.team === 0 && tower.alive && tower.hp <= (CARDS.fireball.spell.towerDamage || 170) && this.elixir[team] >= 4);
    if (affordable('fireball') && finishingTower) {
      return { id: 'fireball', name: 'Boule de Feu', x: finishingTower.x, y: finishingTower.y };
    }
    if (affordable('fireball') && cluster.value >= preset.spellValue && cluster.count >= 2) {
      return { id: 'fireball', name: 'Boule de Feu', x: cluster.x, y: cluster.y };
    }
    if (affordable('arrows') && cluster.count >= 4 && cluster.value >= preset.spellValue * 0.5) {
      return { id: 'arrows', name: 'Flèches', x: cluster.x, y: cluster.y };
    }
    if (affordable('zap') && cluster.count >= 4) {
      return { id: 'zap', name: 'Foudre', x: cluster.x, y: cluster.y };
    }
    return null;
  }

  bestSpellCluster(team) {
    const targets = this.units.filter((unit) => unit.alive && unit.team !== team && !unit.isStructure && this.isTargetable(unit));
    if (!targets.length) return null;
    let best = null;
    for (const target of targets) {
      const nearby = targets.filter((other) => distance(target, other) <= 90);
      if (nearby.length < 2) continue;
      const value = nearby.reduce((sum, unit) => sum + Math.min(unit.hp, 450) + unit.maxHp * 0.18, 0);
      if (!best || value > best.value) {
        best = {
          x: nearby.reduce((sum, unit) => sum + unit.x, 0) / nearby.length,
          y: nearby.reduce((sum, unit) => sum + unit.y, 0) / nearby.length,
          count: nearby.length,
          value,
        };
      }
    }
    return best;
  }

  tryAIPlay(handIndex, x, y, options = {}) {
    if (handIndex < 0) return false;
    const attempts = [[x, y], [x + 42, y], [x - 42, y], [x, y - 36], [x, y + 36], [x + 70, y], [x - 70, y]];
    for (const [ax, ay] of attempts) {
      const card = CARDS[this.hands[1][handIndex]];
      const isSpell = card?.type === 'spell';
      const result = this.playCard(1, handIndex, clamp(ax, 46, ARENA.width - 46), clamp(ay, isSpell ? 60 : 110, isSpell ? 900 : ARENA.riverTop - 36));
      if (result.ok) return true;
    }
    return false;
  }

  weakestLane(team) {
    const left = this.getTower(team, 'princess', 0);
    const right = this.getTower(team, 'princess', 1);
    if (!left.alive) return 0;
    if (!right.alive) return 1;
    return left.hp === right.hp ? (Math.random() < 0.5 ? 0 : 1) : (left.hp < right.hp ? 0 : 1);
  }

  floatElixir(x, y, team) {
    this.particles.push({ kind: 'text', x, y, life: 0.8, maxLife: 0.8, text: '+1', color: team === 0 ? '#e3b6ff' : '#ffb0b0' });
  }

  burst(x, y, color, count = 10, speed = 70) {
    for (let i = 0; i < count; i++) {
      const angle = random(0, TAU);
      const velocity = random(speed * 0.25, speed);
      const life = random(0.24, 0.6);
      this.particles.push({
        kind: 'particle', x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 18,
        life, maxLife: life,
        size: random(2, 5),
        color,
        gravity: 90,
      });
    }
    if (this.particles.length > 520) this.particles.splice(0, this.particles.length - 520);
  }

  ring(x, y, color, radius) {
    this.particles.push({ kind: 'ring', x, y, life: 0.5, maxLife: 0.5, size: radius, color });
  }

  lightningBolt(x1, y1, x2, y2) {
    const points = [];
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const jitter = i === 0 || i === steps ? 0 : random(-16, 16);
      points.push([
        x1 + (x2 - x1) * t + jitter,
        y1 + (y2 - y1) * t + (i === 0 || i === steps ? 0 : random(-8, 8)),
      ]);
    }
    this.particles.push({ kind: 'bolt', points, life: 0.28, maxLife: 0.28, color: '#ffe36e' });
  }

  slash(x, y, color) {
    this.particles.push({ kind: 'slash', x, y, life: 0.18, maxLife: 0.18, size: 24, color, angle: random(-1, 1) });
  }

  updateEffects(dt) {
    for (const particle of this.particles) {
      particle.life -= dt;
      if (particle.kind === 'particle') {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += particle.gravity * dt;
        particle.vx *= 0.985;
      } else if (particle.kind === 'text') {
        particle.y -= dt * 26;
      }
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
    this.shake = Math.max(0, (this.shake || 0) - dt);
  }
}
