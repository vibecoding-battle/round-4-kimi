import { ARENA, CARDS, DECK } from './cards.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const random = (min, max) => min + Math.random() * (max - min);

const AI_PRESETS = {
  recrue: { think: 1.3, attackAt: 8.4, variation: 0.45 },
  standard: { think: 0.75, attackAt: 7.1, variation: 0.22 },
  expert: { think: 0.42, attackAt: 5.8, variation: 0.08 },
};

export class Game {
  constructor(onEvent = () => {}) {
    this.onEvent = onEvent;
    this.difficulty = 'standard';
    this.reset();
  }

  reset(difficulty = this.difficulty) {
    this.difficulty = AI_PRESETS[difficulty] ? difficulty : 'standard';
    this.phase = 'idle';
    this.elapsed = 0;
    this.overtimeElapsed = 0;
    this.overtime = false;
    this.result = null;
    this.elixir = [5, 5];
    this.elixirFullNotified = [false, false];
    this.hands = [DECK.slice(0, 4), ['essaim', 'gardien', 'aeron', 'volt']];
    this.queues = [DECK.slice(4), ['atlas', 'bastion', 'comete', 'pulse']];
    this.units = [];
    this.towers = [];
    this.projectiles = [];
    this.spells = [];
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.nextId = 1;
    this.aiTimer = 1.4;
    this.aiState = 'Analyse du terrain';
    this.stats = [{ cards: 0, damage: 0 }, { cards: 0, damage: 0 }];
    this.createTowers();
  }

  start(difficulty = this.difficulty) {
    this.reset(difficulty);
    this.phase = 'running';
    this.emit('match-start', { difficulty: this.difficulty });
  }

  createTowers() {
    for (const team of [0, 1]) {
      const flip = team === 1;
      const coreY = flip ? 92 : 868;
      const relayY = flip ? 230 : 730;
      this.towers.push(this.makeStructure(team, 'core', 360, coreY, null));
      this.towers.push(this.makeStructure(team, 'relay', 155, relayY, 0));
      this.towers.push(this.makeStructure(team, 'relay', 565, relayY, 1));
    }
  }

  makeStructure(team, kind, x, y, lane) {
    const core = kind === 'core';
    return {
      id: this.nextId++, team, kind, lane, x, y,
      radius: core ? 43 : 34,
      hp: core ? 3600 : 2200,
      maxHp: core ? 3600 : 2200,
      damage: core ? 115 : 88,
      range: core ? 195 : 175,
      attackRate: core ? 1 : 0.85,
      attackCooldown: random(0, 0.3),
      projectileSpeed: 520,
      canHitAir: true,
      isStructure: true,
      alive: true,
      active: !core,
      attackFlash: 0,
      hitFlash: 0,
    };
  }

  emit(type, detail = {}) {
    this.onEvent({ type, ...detail });
  }

  get running() { return this.phase === 'running'; }
  get doubleElixir() { return this.overtime || this.elapsed >= 120; }
  get timeLeft() {
    return Math.max(0, this.overtime ? ARENA.overtimeTime - this.overtimeElapsed : ARENA.matchTime - this.elapsed);
  }

  getTower(team, kind, lane = null) {
    return this.towers.find((tower) => tower.team === team && tower.kind === kind && (lane === null || tower.lane === lane));
  }

  getCrowns(team) {
    return this.towers.filter((tower) => tower.team !== team && !tower.alive).length;
  }

  getIntegrity(team) {
    const towers = this.towers.filter((tower) => tower.team === team);
    return towers.reduce((sum, tower) => sum + tower.hp / tower.maxHp, 0) / towers.length;
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

    const regen = ARENA.elixirRate * (this.doubleElixir ? 2 : 1) * dt;
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
    if (this.running) this.resolveSeparation();
    this.updateEffects(dt);
    if (this.running) this.updateAI(dt);
    this.checkClock();
  }

  checkClock() {
    if (!this.running || this.timeLeft > 0) return;
    if (!this.overtime) {
      const player = this.getCrowns(0);
      const enemy = this.getCrowns(1);
      if (player !== enemy) {
        this.finish(player > enemy ? 0 : 1, 'time');
      } else {
        this.overtime = true;
        this.overtimeElapsed = 0;
        this.emit('overtime');
      }
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
    this.result = {
      winner,
      reason,
      playerCrowns: this.getCrowns(0),
      enemyCrowns: this.getCrowns(1),
      elapsed: this.elapsed,
    };
    this.emit('game-over', { result: this.result });
  }

  canPlace(team, cardId, x, y) {
    const card = CARDS[cardId];
    if (!card) return { ok: false, reason: 'Carte inconnue' };
    if (x < 38 || x > ARENA.width - 38 || y < 55 || y > ARENA.height - 45) {
      return { ok: false, reason: 'Cible hors de l’arène' };
    }
    if (card.type === 'spell') return { ok: true };
    let allowed = false;
    if (team === 0) {
      allowed = y >= ARENA.riverBottom + 16 && y <= 842;
      if (!allowed && y >= 268 && y < ARENA.riverTop) {
        const lane = x < ARENA.width / 2 ? 0 : 1;
        const laneCenter = lane === 0 ? 174 : 546;
        allowed = Math.abs(x - laneCenter) < 145 && !this.getTower(1, 'relay', lane).alive;
      }
    } else {
      allowed = y >= 118 && y <= ARENA.riverTop - 16;
      if (!allowed && y > ARENA.riverBottom && y <= 692) {
        const lane = x < ARENA.width / 2 ? 0 : 1;
        const laneCenter = lane === 0 ? 174 : 546;
        allowed = Math.abs(x - laneCenter) < 145 && !this.getTower(0, 'relay', lane).alive;
      }
    }
    if (!allowed) return { ok: false, reason: 'Déployez sur votre territoire' };
    if (this.towers.some((tower) => tower.alive && Math.hypot(x - tower.x, y - tower.y) < tower.radius + 34)) {
      return { ok: false, reason: 'Trop proche d’une structure' };
    }
    if (card.type === 'building' && this.units.some((unit) => unit.alive && unit.isStructure && Math.hypot(x - unit.x, y - unit.y) < 65)) {
      return { ok: false, reason: 'Emplacement déjà occupé' };
    }
    return { ok: true };
  }

  playCard(team, handIndex, x, y, ignoreCost = false) {
    if (!this.running) return { ok: false, reason: 'Le duel n’est pas actif' };
    const cardId = this.hands[team][handIndex];
    const card = CARDS[cardId];
    if (!card) return { ok: false, reason: 'Carte indisponible' };
    if (!ignoreCost && this.elixir[team] + 0.0001 < card.cost) {
      return { ok: false, reason: 'Pas assez d’élixir' };
    }
    const placement = this.canPlace(team, cardId, x, y);
    if (!placement.ok) return placement;

    if (!ignoreCost) this.elixir[team] -= card.cost;
    this.stats[team].cards++;
    this.hands[team][handIndex] = this.queues[team].shift();
    this.queues[team].push(cardId);

    if (card.type === 'spell') {
      this.spells.push({
        id: this.nextId++, team, card, x, y, radius: card.spellRadius,
        timer: card.delay, delay: card.delay, impacted: false,
      });
      this.emit('spell', { team, card, x, y });
    } else {
      const offsets = card.count === 3 ? [[-22, 10], [22, 10], [0, -18]] : [[0, 0]];
      for (const [ox, oy] of offsets) this.spawnUnit(team, card, x + ox, y + oy);
      this.emit('deploy', { team, card, x, y });
    }
    return { ok: true, card };
  }

  spawnUnit(team, card, x, y) {
    const unit = {
      id: this.nextId++, team, card, kind: card.type === 'building' ? 'building' : 'unit',
      x, y, radius: card.radius, hp: card.hp, maxHp: card.hp,
      damage: card.damage, speed: card.speed, range: card.range,
      attackRate: card.attackRate, attackCooldown: random(0.1, 0.35),
      canHitAir: card.canHitAir, flying: !!card.flying,
      targetsBuildings: !!card.targetsBuildings,
      isStructure: card.type === 'building', alive: true,
      spawnTime: card.type === 'building' ? 0.65 : 0.45,
      lifetime: card.lifetime || null, maxLifetime: card.lifetime || null,
      target: null, retarget: 0, attackFlash: 0, hitFlash: 0,
      slowTimer: 0, slowFactor: 1, walkCycle: random(0, Math.PI * 2),
      facing: team === 0 ? -1 : 1,
    };
    this.units.push(unit);
    this.burst(x, y, team === 0 ? '#64e6ff' : '#ff718b', 12, 65);
    return unit;
  }

  updateUnits(dt) {
    for (const unit of this.units) {
      if (!unit.alive) continue;
      unit.attackFlash = Math.max(0, unit.attackFlash - dt);
      unit.hitFlash = Math.max(0, unit.hitFlash - dt);
      if (unit.spawnTime > 0) {
        unit.spawnTime -= dt;
        continue;
      }
      if (unit.isStructure) {
        unit.lifetime -= dt;
        unit.hp -= (unit.maxHp / unit.maxLifetime) * dt;
        if (unit.lifetime <= 0 || unit.hp <= 0) {
          this.destroyUnit(unit, false);
          continue;
        }
      }
      unit.attackCooldown -= dt;
      unit.retarget -= dt;
      unit.slowTimer = Math.max(0, unit.slowTimer - dt);
      unit.walkCycle += dt * unit.speed * 0.09;

      if (unit.retarget <= 0 || !this.validTarget(unit, unit.target)) {
        unit.target = this.acquireTarget(unit);
        unit.retarget = random(0.18, 0.3);
      }
      const target = unit.target;
      if (!target) continue;
      const dist = distance(unit, target);
      const inRange = dist <= unit.range + target.radius;
      if (inRange) {
        if (unit.attackCooldown <= 0) this.attack(unit, target);
      } else if (!unit.isStructure) {
        this.moveUnit(unit, target, dt);
      }
    }
    this.units = this.units.filter((unit) => unit.alive || unit.deathTimer > 0);
    for (const unit of this.units) if (!unit.alive) unit.deathTimer -= dt;
  }

  validTarget(unit, target) {
    if (!target || !target.alive || target.team === unit.team) return false;
    if (target.flying && !unit.canHitAir) return false;
    if (unit.targetsBuildings && !target.isStructure) return false;
    return true;
  }

  acquireTarget(unit) {
    const opponents = this.units.filter((other) => this.validTarget(unit, other));
    if (!unit.targetsBuildings) {
      let nearest = null;
      let best = Infinity;
      for (const other of opponents) {
        const dist = distance(unit, other) - other.radius;
        if (dist < unit.card.aggro && dist < best) {
          best = dist;
          nearest = other;
        }
      }
      if (nearest) return nearest;
    }
    const structures = [
      ...this.towers.filter((tower) => tower.alive && tower.team !== unit.team),
      ...opponents.filter((other) => other.isStructure),
    ];
    structures.sort((a, b) => {
      const aWeight = distance(unit, a) + (a.kind === 'core' && this.towers.some((t) => t.team === a.team && t.kind === 'relay' && t.alive) ? 80 : 0);
      const bWeight = distance(unit, b) + (b.kind === 'core' && this.towers.some((t) => t.team === b.team && t.kind === 'relay' && t.alive) ? 80 : 0);
      return aWeight - bWeight;
    });
    return structures[0] || null;
  }

  moveUnit(unit, target, dt) {
    let destination = target;
    if (!unit.flying) destination = this.bridgeWaypoint(unit, target);
    let dx = destination.x - unit.x;
    let dy = destination.y - unit.y;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const slow = unit.slowTimer > 0 ? unit.slowFactor : 1;
    const speed = unit.speed * slow;
    unit.x += dx * speed * dt;
    unit.y += dy * speed * dt;
    unit.facing = dy < -0.1 ? -1 : 1;
    unit.x = clamp(unit.x, 34 + unit.radius, ARENA.width - 34 - unit.radius);
    unit.y = clamp(unit.y, 50 + unit.radius, ARENA.height - 40 - unit.radius);
  }

  bridgeWaypoint(unit, target) {
    const top = ARENA.riverTop;
    const bottom = ARENA.riverBottom;
    const crossingUp = unit.y > bottom && target.y < top;
    const crossingDown = unit.y < top && target.y > bottom;
    if (!crossingUp && !crossingDown) return target;
    const bridge = ARENA.bridges.reduce((best, x) => Math.abs(x - unit.x) < Math.abs(best - unit.x) ? x : best, ARENA.bridges[0]);
    if (crossingUp) {
      if (unit.y > bottom + 14 && Math.abs(unit.x - bridge) > 7) return { x: bridge, y: bottom + 12 };
      return { x: bridge, y: top - 24 };
    }
    if (unit.y < top - 14 && Math.abs(unit.x - bridge) > 7) return { x: bridge, y: top - 12 };
    return { x: bridge, y: bottom + 24 };
  }

  updateTowers(dt) {
    for (const tower of this.towers) {
      if (!tower.alive) continue;
      tower.attackCooldown -= dt;
      tower.attackFlash = Math.max(0, tower.attackFlash - dt);
      tower.hitFlash = Math.max(0, tower.hitFlash - dt);
      if (tower.kind === 'core' && !tower.active) continue;
      let target = null;
      let best = Infinity;
      for (const unit of this.units) {
        if (!unit.alive || unit.team === tower.team || unit.spawnTime > 0.25) continue;
        const dist = distance(tower, unit);
        if (dist <= tower.range + unit.radius && dist < best) {
          target = unit;
          best = dist;
        }
      }
      if (target && tower.attackCooldown <= 0) this.attack(tower, target);
    }
  }

  attack(attacker, target) {
    attacker.attackCooldown = attacker.attackRate;
    attacker.attackFlash = 0.2;
    const teamColor = attacker.team === 0 ? '#64e6ff' : '#ff718b';
    if (attacker.projectileSpeed || attacker.card?.projectileSpeed) {
      this.projectiles.push({
        id: this.nextId++, team: attacker.team, x: attacker.x, y: attacker.y - (attacker.isStructure ? 16 : 5),
        target, speed: attacker.projectileSpeed || attacker.card.projectileSpeed,
        damage: attacker.damage, radius: attacker.kind === 'core' ? 7 : 5,
        color: attacker.card?.color || teamColor, alive: true, trail: [],
      });
      this.emit('shot', { x: attacker.x, y: attacker.y, kind: attacker.card?.id || attacker.kind });
    } else {
      this.dealDamage(target, attacker.damage, attacker.team);
      this.slash(target.x, target.y, teamColor);
      this.emit('melee', { x: target.x, y: target.y, kind: attacker.card?.id });
    }
  }

  updateProjectiles(dt) {
    for (const projectile of this.projectiles) {
      if (!projectile.alive) continue;
      if (!projectile.target.alive) {
        projectile.alive = false;
        continue;
      }
      projectile.trail.unshift({ x: projectile.x, y: projectile.y });
      if (projectile.trail.length > 5) projectile.trail.pop();
      const dx = projectile.target.x - projectile.x;
      const dy = projectile.target.y - projectile.target.radius * 0.25 - projectile.y;
      const dist = Math.hypot(dx, dy);
      const step = projectile.speed * dt;
      if (dist <= step + projectile.target.radius * 0.45) {
        this.dealDamage(projectile.target, projectile.damage, projectile.team);
        this.burst(projectile.target.x, projectile.target.y, projectile.color, 6, 45);
        projectile.alive = false;
        this.emit('impact', { x: projectile.target.x, y: projectile.target.y, soft: true });
      } else {
        projectile.x += dx / dist * step;
        projectile.y += dy / dist * step;
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);
  }

  updateSpells(dt) {
    for (const spell of this.spells) {
      spell.timer -= dt;
      if (spell.timer > 0 || spell.impacted) continue;
      spell.impacted = true;
      const targets = [...this.units, ...this.towers];
      for (const target of targets) {
        if (!target.alive || target.team === spell.team) continue;
        if (distance(spell, target) <= spell.radius + target.radius) {
          const damage = target.isStructure ? spell.card.structureDamage : spell.card.spellDamage;
          this.dealDamage(target, damage, spell.team);
          if (spell.card.slowDuration && !target.isStructure) {
            target.slowTimer = Math.max(target.slowTimer, spell.card.slowDuration);
            target.slowFactor = spell.card.slowFactor;
          }
        }
      }
      if (spell.card.id === 'comete') {
        this.burst(spell.x, spell.y, '#ff8b9f', 36, 180);
        this.ring(spell.x, spell.y, '#ffd2b0', spell.radius);
        this.shake = 0.45;
      } else {
        this.burst(spell.x, spell.y, '#77baff', 24, 125);
        this.ring(spell.x, spell.y, '#8bd8ff', spell.radius);
        this.shake = 0.18;
      }
      this.emit('spell-impact', { card: spell.card, x: spell.x, y: spell.y });
    }
    this.spells = this.spells.filter((spell) => !spell.impacted);
  }

  dealDamage(target, amount, sourceTeam) {
    if (!target.alive) return;
    const actual = Math.min(target.hp, amount);
    target.hp -= amount;
    target.hitFlash = 0.13;
    this.stats[sourceTeam].damage += actual;
    if (target.kind === 'core' && !target.active) {
      target.active = true;
      this.emit('core-active', { team: target.team });
    }
    if (target.hp <= 0) {
      target.hp = 0;
      if (this.towers.includes(target)) this.destroyTower(target, sourceTeam);
      else this.destroyUnit(target, true);
    }
  }

  destroyUnit(unit, violent) {
    if (!unit.alive) return;
    unit.alive = false;
    unit.deathTimer = 0.45;
    unit.target = null;
    this.burst(unit.x, unit.y, unit.card.color, violent ? 12 : 6, violent ? 90 : 40);
  }

  destroyTower(tower, sourceTeam) {
    if (!tower.alive) return;
    tower.alive = false;
    tower.hp = 0;
    this.burst(tower.x, tower.y, tower.team === 0 ? '#64e6ff' : '#ff718b', 45, 210);
    this.ring(tower.x, tower.y, '#ffffff', 90);
    this.shake = 0.7;
    this.emit('tower-destroyed', { tower, sourceTeam });
    if (tower.kind === 'core') {
      this.finish(sourceTeam, 'core');
      return;
    }
    const core = this.getTower(tower.team, 'core');
    if (core && !core.active) {
      core.active = true;
      this.emit('core-active', { team: tower.team });
    }
    if (this.overtime) this.finish(sourceTeam, 'sudden-death');
  }

  resolveSeparation() {
    const active = this.units.filter((unit) => unit.alive && !unit.isStructure && unit.spawnTime <= 0);
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
    this.aiTimer = preset.think * random(0.85, 1.2);
    const team = 1;
    const hand = this.hands[team];
    const playable = (id) => hand.includes(id) && this.elixir[team] >= CARDS[id].cost;
    const threats = this.units.filter((unit) => unit.alive && unit.team === 0 && !unit.isStructure && unit.y < 535);

    if (playable('comete')) {
      const cluster = this.bestSpellCluster(team, CARDS.comete);
      const finishingTower = this.towers.find((tower) => tower.team === 0 && tower.alive && tower.hp <= CARDS.comete.structureDamage && this.elixir[team] >= 4);
      if (finishingTower && (finishingTower.kind === 'core' || this.getCrowns(1) >= this.getCrowns(0))) {
        this.tryAIPlay('comete', finishingTower.x, finishingTower.y);
        return;
      }
      if (cluster && (cluster.count >= 3 || (cluster.value >= 760 && this.difficulty !== 'recrue'))) {
        this.tryAIPlay('comete', cluster.x, cluster.y);
        this.aiState = 'Frappe orbitale';
        return;
      }
    }

    if (playable('pulse') && threats.length >= 2) {
      const cluster = this.bestSpellCluster(team, CARDS.pulse);
      if (cluster && cluster.count >= 2 && cluster.y < 540) {
        this.tryAIPlay('pulse', cluster.x, cluster.y);
        this.aiState = 'Contre-attaque';
        return;
      }
    }

    if (threats.length) {
      threats.sort((a, b) => {
        const aTower = Math.min(...this.towers.filter((t) => t.team === 1 && t.alive).map((t) => distance(a, t)));
        const bTower = Math.min(...this.towers.filter((t) => t.team === 1 && t.alive).map((t) => distance(b, t)));
        return aTower - bTower;
      });
      const threat = threats[0];
      let priorities;
      if (threat.flying) priorities = ['volt', 'aeron', 'bastion', 'pulse'];
      else if (threat.card.id === 'atlas') priorities = ['essaim', 'bastion', 'gardien', 'volt'];
      else if (threat.card.id === 'essaim') priorities = ['volt', 'aeron', 'gardien', 'bastion'];
      else priorities = ['gardien', 'volt', 'essaim', 'aeron', 'bastion'];
      if (this.difficulty === 'recrue' && Math.random() < 0.35) priorities.reverse();
      const choice = priorities.find((id) => playable(id));
      if (choice) {
        const card = CARDS[choice];
        const distanceBehind = card.range > 100 || card.type === 'building' ? 105 : 48;
        const x = clamp(threat.x + random(-28, 28) * (1 + preset.variation), 70, 650);
        const y = clamp(threat.y - distanceBehind, 150, 405);
        if (this.tryAIPlay(choice, x, y)) {
          this.aiState = `Défense ${threat.card.name}`;
          return;
        }
      }
    }

    const ownTank = this.units.find((unit) => unit.alive && unit.team === 1 && unit.card.id === 'atlas');
    if (ownTank && this.elixir[team] >= 3) {
      const support = ['volt', 'aeron', 'gardien'].find((id) => playable(id));
      if (support) {
        if (this.tryAIPlay(support, ownTank.x + random(-35, 35), clamp(ownTank.y + 85, 150, 420))) {
          this.aiState = 'Soutien de l’assaut';
          return;
        }
      }
    }

    const attackThreshold = preset.attackAt - (this.doubleElixir ? 1.3 : 0);
    if (this.elixir[team] >= attackThreshold || (this.elapsed > 145 && this.elixir[team] >= 5)) {
      const lane = this.weakestLane(0);
      const laneX = ARENA.bridges[lane];
      const priorities = this.difficulty === 'expert'
        ? ['atlas', 'volt', 'aeron', 'gardien', 'essaim']
        : ['atlas', 'gardien', 'aeron', 'volt', 'essaim', 'bastion'];
      let choice = priorities.find((id) => playable(id));
      if (!choice && this.elixir[team] >= 8) choice = hand.find((id) => CARDS[id].type !== 'spell' && playable(id));
      if (choice) {
        const card = CARDS[choice];
        const x = clamp(laneX + random(-55, 55) * (1 + preset.variation), 85, 635);
        const y = card.id === 'atlas' ? 370 : random(340, 410);
        if (this.tryAIPlay(choice, x, y)) this.aiState = `Assaut voie ${lane === 0 ? 'gauche' : 'droite'}`;
      }
    } else {
      this.aiState = this.elixir[team] > 8 ? 'Prépare son assaut' : 'Accumule de l’élixir';
    }
  }

  tryAIPlay(cardId, x, y) {
    const index = this.hands[1].indexOf(cardId);
    if (index < 0) return false;
    const attempts = [[x, y], [x + 45, y], [x - 45, y], [x, y - 40], [x, y + 40]];
    for (const [ax, ay] of attempts) {
      const spell = CARDS[cardId].type === 'spell';
      const result = this.playCard(1, index, clamp(ax, 60, 660), clamp(ay, spell ? 60 : 125, spell ? 900 : 420));
      if (result.ok) return true;
    }
    return false;
  }

  bestSpellCluster(team, card) {
    const targets = this.units.filter((unit) => unit.alive && unit.team !== team && !unit.isStructure);
    let best = null;
    for (const target of targets) {
      const nearby = targets.filter((other) => distance(target, other) <= card.spellRadius);
      const value = nearby.reduce((sum, unit) => sum + Math.min(unit.hp, card.spellDamage) + unit.maxHp * 0.2, 0);
      if (!best || value > best.value) {
        best = {
          x: nearby.reduce((sum, unit) => sum + unit.x, 0) / nearby.length,
          y: nearby.reduce((sum, unit) => sum + unit.y, 0) / nearby.length,
          count: nearby.length, value,
        };
      }
    }
    return best;
  }

  weakestLane(team) {
    const left = this.getTower(team, 'relay', 0);
    const right = this.getTower(team, 'relay', 1);
    if (!left.alive) return 0;
    if (!right.alive) return 1;
    return left.hp === right.hp ? (Math.random() < 0.5 ? 0 : 1) : (left.hp < right.hp ? 0 : 1);
  }

  burst(x, y, color, count = 10, speed = 70) {
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const velocity = random(speed * 0.3, speed);
      const life = random(0.25, 0.65);
      this.particles.push({
        kind: 'particle', x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity - 15,
        life, maxLife: life, size: random(2, 5), color, gravity: 85,
      });
    }
    if (this.particles.length > 450) this.particles.splice(0, this.particles.length - 450);
  }

  ring(x, y, color, radius) {
    this.particles.push({ kind: 'ring', x, y, life: 0.45, maxLife: 0.45, size: radius, color });
  }

  slash(x, y, color) {
    this.particles.push({ kind: 'slash', x, y, life: 0.18, maxLife: 0.18, size: 25, color, angle: random(-1, 1) });
  }

  updateEffects(dt) {
    for (const particle of this.particles) {
      particle.life -= dt;
      if (particle.kind === 'particle') {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += particle.gravity * dt;
        particle.vx *= 0.985;
      }
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
    this.shake = Math.max(0, (this.shake || 0) - dt);
  }
}
