import { ARENA, CARDS } from './cards.js';

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function seededRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function hexPath(ctx, x, y, radius, rotation = Math.PI / 6) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = rotation + i * TAU / 6;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.selection = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.decorations = [];
    const random = seededRandom(84721);
    for (let i = 0; i < 82; i++) {
      this.decorations.push({
        x: 36 + random() * 648,
        y: 48 + random() * 860,
        size: 2 + random() * 6,
        type: random() > 0.76 ? 'crystal' : 'grass',
        shade: random(),
      });
    }
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  worldFromClient(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width * ARENA.width,
      y: (clientY - rect.top) / rect.height * ARENA.height,
      inside: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom,
    };
  }

  setSelection(cardId, point = null) {
    this.selection = cardId ? { cardId, point } : null;
  }

  render(timestamp) {
    const ctx = this.ctx;
    const time = timestamp / 1000;
    const sx = this.canvas.width / ARENA.width;
    const sy = this.canvas.height / ARENA.height;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.clearRect(0, 0, ARENA.width, ARENA.height);
    ctx.save();
    if (this.game.shake > 0 && !this.reducedMotion) {
      const power = this.game.shake * 8;
      ctx.translate((Math.random() - 0.5) * power, (Math.random() - 0.5) * power);
    }
    this.drawArena(time);
    this.drawDeployment(time);
    this.drawSpells(time);

    const entities = [...this.game.towers, ...this.game.units].sort((a, b) => a.y - b.y);
    for (const entity of entities) {
      if (entity.card) this.drawUnit(entity, time);
      else this.drawTower(entity, time);
    }
    this.drawProjectiles();
    this.drawParticles();
    this.drawVignette();
    ctx.restore();
  }

  drawArena(time) {
    const ctx = this.ctx;
    const background = ctx.createLinearGradient(0, 0, 0, ARENA.height);
    background.addColorStop(0, '#0a1a28');
    background.addColorStop(0.5, '#0b202b');
    background.addColorStop(1, '#081a28');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);

    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    ctx.beginPath();
    ctx.roundRect(18, 12, 684, 936, 25);
    ctx.fillStyle = '#0a202a';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const floor = ctx.createLinearGradient(0, 15, 0, 945);
    floor.addColorStop(0, '#29474b');
    floor.addColorStop(0.38, '#274b4c');
    floor.addColorStop(0.62, '#23494a');
    floor.addColorStop(1, '#1d3d45');
    ctx.beginPath();
    ctx.roundRect(22, 16, 676, 928, 22);
    ctx.fillStyle = floor;
    ctx.fill();
    ctx.save();
    ctx.clip();

    const enemyGlow = ctx.createRadialGradient(360, 100, 20, 360, 100, 430);
    enemyGlow.addColorStop(0, 'rgba(255,100,128,.12)');
    enemyGlow.addColorStop(1, 'rgba(255,100,128,0)');
    ctx.fillStyle = enemyGlow;
    ctx.fillRect(20, 15, 680, 450);
    const playerGlow = ctx.createRadialGradient(360, 880, 20, 360, 880, 430);
    playerGlow.addColorStop(0, 'rgba(70,220,255,.11)');
    playerGlow.addColorStop(1, 'rgba(70,220,255,0)');
    ctx.fillStyle = playerGlow;
    ctx.fillRect(20, 510, 680, 435);

    ctx.strokeStyle = 'rgba(186,225,213,.035)';
    ctx.lineWidth = 1;
    for (let x = 32; x < 700; x += 44) {
      ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, 944); ctx.stroke();
    }
    for (let y = 28; y < 944; y += 44) {
      ctx.beginPath(); ctx.moveTo(22, y); ctx.lineTo(698, y); ctx.stroke();
    }

    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(175,210,188,.026)';
    for (const x of ARENA.bridges) {
      ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 900); ctx.stroke();
    }

    for (const item of this.decorations) {
      if (item.y > ARENA.riverTop - 12 && item.y < ARENA.riverBottom + 12) continue;
      if (item.x > 110 && item.x < 610 && item.y > 170 && item.y < 790 && item.type === 'crystal') continue;
      if (item.type === 'grass') {
        ctx.strokeStyle = item.shade > 0.5 ? 'rgba(126,177,144,.18)' : 'rgba(9,41,39,.22)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y + item.size);
        ctx.lineTo(item.x - item.size * 0.5, item.y - item.size * 0.4);
        ctx.moveTo(item.x, item.y + item.size);
        ctx.lineTo(item.x + item.size * 0.65, item.y - item.size * 0.65);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(92,170,163,.15)';
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - item.size);
        ctx.lineTo(item.x + item.size * 0.55, item.y);
        ctx.lineTo(item.x, item.y + item.size * 0.6);
        ctx.lineTo(item.x - item.size * 0.55, item.y);
        ctx.closePath(); ctx.fill();
      }
    }

    this.drawRiver(time);
    ctx.restore();

    ctx.beginPath();
    ctx.roundRect(22, 16, 676, 928, 22);
    ctx.strokeStyle = 'rgba(142,205,207,.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(27, 21, 666, 918, 18);
    ctx.strokeStyle = 'rgba(0,0,0,.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let y = 52; y < 930; y += 55) {
      for (const x of [28, 692]) {
        ctx.fillStyle = 'rgba(115,176,184,.2)';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
      }
    }
  }

  drawRiver(time) {
    const ctx = this.ctx;
    const top = ARENA.riverTop;
    const bottom = ARENA.riverBottom;
    const water = ctx.createLinearGradient(0, top, 0, bottom);
    water.addColorStop(0, '#153e54');
    water.addColorStop(0.45, '#17617a');
    water.addColorStop(1, '#123d54');
    ctx.fillStyle = '#102e36';
    ctx.fillRect(20, top - 7, 680, bottom - top + 14);
    ctx.fillStyle = water;
    ctx.fillRect(20, top, 680, bottom - top);

    ctx.save();
    ctx.beginPath(); ctx.rect(20, top, 680, bottom - top); ctx.clip();
    for (let row = 0; row < 5; row++) {
      ctx.beginPath();
      const baseY = top + 8 + row * 14;
      for (let x = 10; x <= 710; x += 10) {
        const y = baseY + Math.sin(x * 0.025 + time * 1.25 + row) * 2.2;
        if (x === 10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = row % 2 ? 'rgba(89,209,221,.11)' : 'rgba(144,231,230,.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = ((i * 79 + time * 15) % 740) - 10;
      const y = top + 12 + (i * 23 % 51);
      ctx.strokeStyle = 'rgba(170,245,241,.18)';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y); ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(106,150,128,.35)';
    ctx.fillRect(20, top - 4, 680, 4);
    ctx.fillStyle = 'rgba(6,30,34,.5)';
    ctx.fillRect(20, bottom, 680, 5);

    for (const bridgeX of ARENA.bridges) {
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.roundRect(bridgeX - 52, top - 5, 104, 91, 7); ctx.fill();
      const wood = ctx.createLinearGradient(bridgeX - 45, 0, bridgeX + 45, 0);
      wood.addColorStop(0, '#47666a');
      wood.addColorStop(0.5, '#6f8580');
      wood.addColorStop(1, '#3d5d63');
      ctx.fillStyle = wood;
      ctx.beginPath(); ctx.roundRect(bridgeX - 46, top - 10, 92, 92, 5); ctx.fill();
      for (let y = top - 6; y < bottom + 5; y += 12) {
        ctx.fillStyle = (Math.round(y / 12) % 2) ? 'rgba(213,224,190,.075)' : 'rgba(0,0,0,.045)';
        ctx.fillRect(bridgeX - 41, y, 82, 10);
        ctx.strokeStyle = 'rgba(4,25,31,.3)';
        ctx.beginPath(); ctx.moveTo(bridgeX - 42, y + 10); ctx.lineTo(bridgeX + 42, y + 10); ctx.stroke();
      }
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#2b484f';
        ctx.fillRect(bridgeX + side * 44 - 3, top - 12, 6, 96);
        ctx.fillStyle = 'rgba(128,200,197,.35)';
        ctx.fillRect(bridgeX + side * 44 - 2, top - 11, 1, 94);
        for (const y of [top - 8, bottom - 2]) {
          ctx.fillStyle = '#7b9590';
          ctx.beginPath(); ctx.arc(bridgeX + side * 44, y, 4, 0, TAU); ctx.fill();
        }
      }
    }
  }

  drawDeployment(time) {
    if (!this.selection || !this.game.running) return;
    const ctx = this.ctx;
    const card = CARDS[this.selection.cardId];
    if (!card) return;
    ctx.save();
    if (card.type !== 'spell') {
      ctx.fillStyle = 'rgba(80,225,255,.055)';
      ctx.fillRect(35, ARENA.riverBottom + 12, 650, 316);
      for (const lane of [0, 1]) {
        if (!this.game.getTower(1, 'relay', lane).alive) {
          const x = lane === 0 ? 35 : 401;
          ctx.fillRect(x, 270, 284, ARENA.riverTop - 270);
        }
      }
      ctx.setLineDash([8, 9]);
      ctx.lineDashOffset = -time * 15;
      ctx.strokeStyle = 'rgba(100,230,255,.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(42, ARENA.riverBottom + 14); ctx.lineTo(678, ARENA.riverBottom + 14); ctx.stroke();
      ctx.setLineDash([]);
    }
    const point = this.selection.point;
    if (point?.inside) {
      const validity = this.game.canPlace(0, card.id, point.x, point.y);
      const color = validity.ok ? (card.type === 'spell' ? card.color : '#70efff') : '#ff718b';
      const radius = card.type === 'spell' ? card.spellRadius : (card.radius + 12);
      ctx.fillStyle = validity.ok ? 'rgba(100,230,255,.08)' : 'rgba(255,113,139,.08)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.lineDashOffset = -time * 20;
      ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.arc(point.x, point.y, 5, 0, TAU); ctx.fillStyle = color; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(point.x - 13, point.y); ctx.lineTo(point.x - 7, point.y);
      ctx.moveTo(point.x + 7, point.y); ctx.lineTo(point.x + 13, point.y);
      ctx.moveTo(point.x, point.y - 13); ctx.lineTo(point.x, point.y - 7);
      ctx.moveTo(point.x, point.y + 7); ctx.lineTo(point.x, point.y + 13);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSpells(time) {
    const ctx = this.ctx;
    for (const spell of this.game.spells) {
      const progress = 1 - spell.timer / spell.delay;
      const color = spell.card.id === 'comete' ? '#ff879e' : '#75caff';
      ctx.save();
      ctx.translate(spell.x, spell.y);
      ctx.strokeStyle = color;
      ctx.fillStyle = spell.card.id === 'comete' ? 'rgba(255,96,124,.08)' : 'rgba(90,180,255,.09)';
      ctx.lineWidth = 2;
      ctx.setLineDash([9, 7]);
      ctx.lineDashOffset = -time * 30;
      ctx.beginPath(); ctx.arc(0, 0, spell.radius, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(0, 0, spell.radius * (1 - progress * 0.75), 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
      if (spell.card.id === 'comete') {
        const meteorY = -240 * (1 - progress) - 18;
        const gradient = ctx.createLinearGradient(0, meteorY - 80, 0, meteorY + 10);
        gradient.addColorStop(0, 'rgba(255,119,142,0)');
        gradient.addColorStop(1, 'rgba(255,205,163,.7)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 13;
        ctx.beginPath(); ctx.moveTo(30, meteorY - 80); ctx.lineTo(0, meteorY); ctx.stroke();
        ctx.fillStyle = '#ffe0b5';
        ctx.shadowColor = '#ff6c89'; ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.arc(0, meteorY, 10, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawTower(tower, time) {
    const ctx = this.ctx;
    const color = tower.team === 0 ? '#64e6ff' : '#ff718b';
    const dark = tower.team === 0 ? '#17637a' : '#873a54';
    const core = tower.kind === 'core';
    const r = tower.radius;
    ctx.save();
    ctx.translate(tower.x, tower.y);
    if (!tower.alive) {
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(0, 14, r * 1.3, r * 0.55, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#25373d';
      hexPath(ctx, 0, 6, r * 0.9); ctx.fill();
      ctx.fillStyle = '#34494e';
      for (let i = 0; i < 5; i++) {
        const angle = i * 2.1;
        ctx.save(); ctx.translate(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.25);
        ctx.rotate(angle); ctx.fillRect(-7, -5, 14, 10); ctx.restore();
      }
      ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(0, 4, r * 0.45, 0, Math.PI); ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0, r * 0.55, r * 1.35, r * 0.63, 0, 0, TAU); ctx.fill();
    if (core && tower.active) {
      ctx.save(); ctx.rotate(time * 0.3 * (tower.team === 0 ? 1 : -1));
      ctx.strokeStyle = color; ctx.globalAlpha = 0.22; ctx.lineWidth = 2;
      ctx.setLineDash([15, 13]); ctx.beginPath(); ctx.arc(0, 2, r + 16, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#1b333e';
    hexPath(ctx, 0, 9, r * 1.15); ctx.fill();
    ctx.strokeStyle = 'rgba(157,200,207,.18)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#385560';
    hexPath(ctx, 0, 2, r); ctx.fill();
    ctx.fillStyle = '#223f4c';
    hexPath(ctx, 0, -3, r * 0.82); ctx.fill();

    const body = ctx.createLinearGradient(-r, -r, r, r);
    body.addColorStop(0, tower.hitFlash > 0 ? '#ffffff' : '#6b7f86');
    body.addColorStop(0.45, '#405b65');
    body.addColorStop(1, '#263f4b');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -4); ctx.lineTo(-r * 0.48, -r * 0.85);
    ctx.lineTo(r * 0.48, -r * 0.85); ctx.lineTo(r * 0.62, -4);
    ctx.lineTo(r * 0.42, r * 0.25); ctx.lineTo(-r * 0.42, r * 0.25); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(195,224,226,.18)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.roundRect(-r * 0.56, -r * 0.7, r * 1.12, r * 0.36, 4); ctx.fill();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(-r * 0.4, -r * 0.61, r * 0.8, 3);
    ctx.globalAlpha = 1;

    if (core) {
      for (const side of [-1, 0, 1]) {
        ctx.save(); ctx.translate(side * r * 0.48, -r * 0.95 + Math.abs(side) * 7);
        ctx.fillStyle = '#4c6871';
        ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-5, -16); ctx.lineTo(0, -25); ctx.lineTo(5, -16); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = color; ctx.globalAlpha = tower.active ? 0.8 : 0.25;
        ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(0, -20); ctx.lineTo(2, -14); ctx.lineTo(2, 2); ctx.lineTo(-2, 2); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.save(); ctx.translate(0, -r * 0.9);
      ctx.rotate(Math.sin(time * 0.6 + tower.id) * 0.05);
      ctx.fillStyle = '#233c48';
      ctx.beginPath(); ctx.roundRect(-16, -12, 32, 24, 6); ctx.fill();
      ctx.strokeStyle = '#789099'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = color;
      ctx.shadowColor = color; ctx.shadowBlur = tower.attackFlash > 0 ? 20 : 8;
      hexPath(ctx, 0, 0, 8, 0); ctx.fill();
      ctx.restore();
    }

    ctx.shadowColor = color; ctx.shadowBlur = tower.active ? 14 : 3;
    ctx.fillStyle = color;
    ctx.globalAlpha = tower.active ? 1 : 0.38;
    ctx.beginPath(); ctx.arc(0, -r * 0.25, core ? 8 : 6, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.restore();
    this.drawHealthBar(tower, tower.x, tower.y - r - (core ? 48 : 31), core ? 92 : 72, color, true);
  }

  drawUnit(unit, time) {
    const ctx = this.ctx;
    const teamColor = unit.team === 0 ? '#64e6ff' : '#ff718b';
    const spawnScale = unit.spawnTime > 0 ? clamp(1 - unit.spawnTime / 0.65, 0.05, 1) : 1;
    const deathAlpha = unit.alive ? 1 : clamp(unit.deathTimer / 0.45, 0, 1);
    const bob = unit.isStructure || unit.speed === 0 ? 0 : Math.sin(unit.walkCycle) * 1.6;
    const r = unit.radius;
    ctx.save();
    ctx.translate(unit.x, unit.y);
    ctx.globalAlpha = deathAlpha;
    if (unit.spawnTime > 0) {
      ctx.strokeStyle = teamColor; ctx.globalAlpha = 0.6 * deathAlpha;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 5, r * 1.7 * spawnScale, r * 0.8 * spawnScale, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = deathAlpha;
    }
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0, r * 0.65 + (unit.flying ? 18 : 0), r * 1.05, r * 0.43, 0, 0, TAU); ctx.fill();
    if (unit.slowTimer > 0 && unit.alive) {
      ctx.strokeStyle = '#7fb8ff'; ctx.globalAlpha = 0.65; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, r * 0.55, r * 1.25, r * 0.55, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.translate(0, unit.flying ? -18 - Math.sin(time * 4 + unit.id) * 3 : bob);
    ctx.scale(spawnScale, spawnScale);
    if (unit.attackFlash > 0) ctx.translate(0, unit.team === 0 ? -3 : 3);
    if (unit.hitFlash > 0) {
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 18;
    }
    const draw = this[`draw_${unit.card.id}`];
    if (draw) draw.call(this, ctx, unit, teamColor, time);
    ctx.restore();
    if (unit.alive && unit.spawnTime <= 0) {
      this.drawHealthBar(unit, unit.x, unit.y - r - (unit.flying ? 35 : 15), Math.max(30, r * 2), teamColor, false);
    }
  }

  unitBodyGradient(ctx, r, unit, teamColor) {
    const gradient = ctx.createLinearGradient(-r, -r, r, r);
    gradient.addColorStop(0, unit.hitFlash > 0 ? '#ffffff' : '#a5b9bd');
    gradient.addColorStop(0.42, unit.team === 0 ? '#416878' : '#78505f');
    gradient.addColorStop(1, '#203743');
    return gradient;
  }

  draw_gardien(ctx, unit, color) {
    const r = unit.radius;
    ctx.strokeStyle = '#172b36'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const step = Math.sin(unit.walkCycle) * 4;
    ctx.beginPath(); ctx.moveTo(-7, 9); ctx.lineTo(-8 + step, 20); ctx.moveTo(7, 9); ctx.lineTo(8 - step, 20); ctx.stroke();
    ctx.fillStyle = this.unitBodyGradient(ctx, r, unit, color);
    ctx.beginPath(); ctx.roundRect(-13, -12, 26, 29, 8); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1c3341'; ctx.beginPath(); ctx.arc(0, -14, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-8, -17, 16, 4);
    ctx.fillStyle = '#2e596a';
    ctx.beginPath(); ctx.moveTo(-21, -8); ctx.lineTo(-10, -13); ctx.lineTo(-7, 9); ctx.lineTo(-16, 16); ctx.lineTo(-23, 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.stroke();
    ctx.strokeStyle = '#d3f5f5'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(15, 7); ctx.lineTo(23, -15); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 2, 4, 0, TAU); ctx.fill();
  }

  draw_volt(ctx, unit, color, time) {
    const r = unit.radius;
    ctx.fillStyle = this.unitBodyGradient(ctx, r, unit, color);
    ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(16, -3); ctx.lineTo(11, 19); ctx.lineTo(-11, 19); ctx.lineTo(-16, -3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a98bff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#172b3a'; ctx.beginPath(); ctx.arc(0, -12, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c0a7ff'; ctx.fillRect(-7, -14, 14, 3);
    ctx.strokeStyle = '#9eb7c1'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(15, 15); ctx.lineTo(21, -20); ctx.stroke();
    ctx.fillStyle = '#c3a6ff'; ctx.shadowColor = '#aa83ff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(22, -23, 5 + Math.sin(time * 5) * 0.7, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 2, 4, 0, TAU); ctx.fill();
  }

  draw_essaim(ctx, unit, color, time) {
    const r = unit.radius;
    ctx.strokeStyle = '#283b42'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(side * 6, i * 5); ctx.lineTo(side * (13 + Math.sin(time * 10 + i) * 2), i * 7 + 3); ctx.stroke();
      }
    }
    ctx.fillStyle = this.unitBodyGradient(ctx, r, unit, color);
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e4ba58'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#26363d'; ctx.beginPath(); ctx.arc(0, -7, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(-3, -8, 1.7, 0, TAU); ctx.arc(3, -8, 1.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#f8d67c'; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, 9); ctx.stroke();
  }

  draw_atlas(ctx, unit, color) {
    const r = unit.radius;
    const step = Math.sin(unit.walkCycle) * 3;
    ctx.fillStyle = '#263b44';
    ctx.beginPath(); ctx.roundRect(-20 + step, 9, 16, 20, 4); ctx.roundRect(4 - step, 9, 16, 20, 4); ctx.fill();
    ctx.fillStyle = this.unitBodyGradient(ctx, r, unit, color);
    ctx.beginPath(); ctx.moveTo(-22, -15); ctx.lineTo(-10, -27); ctx.lineTo(13, -25); ctx.lineTo(24, -10); ctx.lineTo(18, 16); ctx.lineTo(-18, 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7e8e8d'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#354c55';
    ctx.beginPath(); ctx.roundRect(-34, -13, 14, 31, 5); ctx.roundRect(20, -13, 14, 31, 5); ctx.fill();
    ctx.strokeStyle = '#9a684e'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#172c35'; ctx.beginPath(); ctx.roundRect(-12, -19, 24, 10, 3); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-8, -16, 16, 3);
    ctx.shadowColor = '#ff9f68'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffab70'; hexPath(ctx, 0, 1, 8, 0); ctx.fill();
    ctx.shadowBlur = 0;
  }

  draw_aeron(ctx, unit, color, time) {
    ctx.fillStyle = 'rgba(105,238,197,.16)';
    ctx.beginPath(); ctx.ellipse(-24, -2, 18, 5, -0.2, 0, TAU); ctx.ellipse(24, -2, 18, 5, 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    const wing = 4 + Math.sin(time * 16) * 2;
    ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-32, -10 - wing); ctx.lineTo(-21, 5); ctx.lineTo(-6, 6);
    ctx.moveTo(6, -4); ctx.lineTo(32, -10 - wing); ctx.lineTo(21, 5); ctx.lineTo(6, 6); ctx.stroke();
    ctx.fillStyle = this.unitBodyGradient(ctx, 15, unit, color);
    ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(11, -4); ctx.lineTo(7, 15); ctx.lineTo(0, 21); ctx.lineTo(-7, 15); ctx.lineTo(-11, -4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, -3, 5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }

  draw_bastion(ctx, unit, color, time) {
    const r = unit.radius;
    ctx.fillStyle = '#1c3540'; hexPath(ctx, 0, 8, r * 1.15); ctx.fill();
    ctx.fillStyle = this.unitBodyGradient(ctx, r, unit, color); hexPath(ctx, 0, 1, r); ctx.fill();
    ctx.strokeStyle = '#5e8ba5'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1a303e'; ctx.beginPath(); ctx.roundRect(-13, -22, 26, 29, 5); ctx.fill();
    ctx.strokeStyle = color; ctx.stroke();
    let angle = unit.team === 0 ? -Math.PI / 2 : Math.PI / 2;
    if (unit.target) angle = Math.atan2(unit.target.y - unit.y, unit.target.x - unit.x);
    ctx.save(); ctx.translate(0, -17); ctx.rotate(angle);
    ctx.fillStyle = '#567382'; ctx.beginPath(); ctx.roundRect(-6, -6, 30, 12, 4); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(14, -3, 12, 6); ctx.restore();
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8 + Math.sin(time * 4) * 2;
    ctx.beginPath(); ctx.arc(0, -17, 6, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }

  drawHealthBar(entity, x, y, width, color, numeric) {
    const ctx = this.ctx;
    const ratio = clamp(entity.hp / entity.maxHp, 0, 1);
    const height = numeric ? 8 : 5;
    ctx.save();
    ctx.fillStyle = 'rgba(3,12,20,.82)';
    ctx.beginPath(); ctx.roundRect(x - width / 2 - 2, y - 2, width + 4, height + 4, 3); ctx.fill();
    ctx.fillStyle = '#253540'; ctx.fillRect(x - width / 2, y, width, height);
    if (ratio > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x - width / 2, y, width * ratio, height);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - width / 2, y, width * ratio, 1);
    }
    if (numeric) {
      ctx.font = '600 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(226,241,247,.9)';
      ctx.shadowColor = '#07121c'; ctx.shadowBlur = 3;
      ctx.fillText(Math.ceil(entity.hp).toString(), x, y - 5);
    }
    ctx.restore();
  }

  drawProjectiles() {
    const ctx = this.ctx;
    for (const projectile of this.game.projectiles) {
      ctx.save();
      for (let i = projectile.trail.length - 1; i >= 0; i--) {
        const point = projectile.trail[i];
        ctx.globalAlpha = (projectile.trail.length - i) / projectile.trail.length * 0.18;
        ctx.fillStyle = projectile.color;
        ctx.beginPath(); ctx.arc(point.x, point.y, projectile.radius * 0.7, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowColor = projectile.color; ctx.shadowBlur = 12;
      ctx.fillStyle = '#e8ffff';
      ctx.beginPath(); ctx.arc(projectile.x, projectile.y, projectile.radius, 0, TAU); ctx.fill();
      ctx.strokeStyle = projectile.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const particle of this.game.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = particle.color;
      ctx.fillStyle = particle.color;
      if (particle.kind === 'ring') {
        const progress = 1 - alpha;
        ctx.lineWidth = 4 * alpha;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * (0.25 + progress * 0.85), 0, TAU); ctx.stroke();
      } else if (particle.kind === 'slash') {
        ctx.translate(particle.x, particle.y); ctx.rotate(particle.angle);
        ctx.lineWidth = 4 * alpha;
        ctx.beginPath(); ctx.arc(0, 0, particle.size, -1.2, 0.7); ctx.stroke();
      } else {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(Math.atan2(particle.vy, particle.vx));
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size * 1.7, particle.size);
      }
      ctx.restore();
    }
  }

  drawVignette() {
    const ctx = this.ctx;
    const vignette = ctx.createRadialGradient(360, 480, 320, 360, 480, 650);
    vignette.addColorStop(0, 'rgba(1,9,16,0)');
    vignette.addColorStop(1, 'rgba(1,9,16,.27)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  }
}
