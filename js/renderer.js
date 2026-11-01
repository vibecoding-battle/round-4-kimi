import { ARENA, CARDS } from './cards.js';
import { drawUnitSprite, drawTowerSprite } from './art.js';

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const TEAMS = [
  { main: '#4cb8ff', deep: '#14558f', light: '#c4efff', glow: 'rgba(76,184,255,.34)', stone: '#b9cad7', stoneDark: '#63788a', banner: '#3e8fe0', bannerDark: '#1d5b9e' },
  { main: '#ff6a6a', deep: '#8f1f1f', light: '#ffd0d0', glow: 'rgba(255,106,106,.34)', stone: '#d8bcbc', stoneDark: '#8a6262', banner: '#e04b4b', bannerDark: '#9e2b2b' },
];

function seededRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
}

function ellipseShadow(ctx, x, y, rx, ry, alpha = 0.28) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  gradient.addColorStop(0, `rgba(18,32,20,${alpha})`);
  gradient.addColorStop(0.7, `rgba(18,32,20,${alpha * 0.5})`);
  gradient.addColorStop(1, 'rgba(18,32,20,0)');
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / Math.max(rx, 1));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(rx, 1), 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx, x, y, r, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / points;
    const radius = i % 2 === 0 ? r : r * 0.38;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function spellGlyph(ctx, card, size) {
  const art = card.art || {};
  const accent = art.accent || '#ffd166';
  const deep = art.deep || '#734f2a';
  const style = art.style || 'zap';
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (style === 'fireball') {
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, size);
    gradient.addColorStop(0, '#fff4c2');
    gradient.addColorStop(0.45, accent);
    gradient.addColorStop(1, deep);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2b1b16';
    ctx.lineWidth = size * 0.12;
    ctx.stroke();
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.arc(-size * 0.25, -size * 0.28, size * 0.28, 0, TAU);
    ctx.fill();
  } else if (style === 'arrows') {
    ctx.strokeStyle = '#8a5a32';
    ctx.lineWidth = size * 0.16;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.75, i * size * 0.5 + size * 0.65);
      ctx.lineTo(size * 0.7, i * size * 0.5 - size * 0.65);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(size * 0.85, i * size * 0.5 - size * 0.85);
      ctx.lineTo(size * 0.45, i * size * 0.5 - size * 0.65);
      ctx.lineTo(size * 0.8, i * size * 0.5 - size * 0.35);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'zap' || style === 'lightning') {
    ctx.fillStyle = accent;
    ctx.strokeStyle = style === 'lightning' ? '#7a5210' : '#20415f';
    ctx.lineWidth = size * 0.12;
    ctx.beginPath();
    ctx.moveTo(size * 0.15, -size);
    ctx.lineTo(-size * 0.55, size * 0.1);
    ctx.lineTo(-size * 0.05, size * 0.1);
    ctx.lineTo(-size * 0.3, size);
    ctx.lineTo(size * 0.7, -size * 0.2);
    ctx.lineTo(size * 0.18, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (style === 'lightning') {
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.moveTo(size * 0.02, -size * 0.7);
      ctx.lineTo(-size * 0.28, size * 0.02);
      ctx.stroke();
    }
  } else if (style === 'rocket') {
    ctx.fillStyle = '#d9e0e6';
    ctx.strokeStyle = '#303844';
    ctx.lineWidth = size * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.42, -size * 0.5, size * 0.48, size * 0.3, size * 0.32, size * 0.55);
    ctx.lineTo(-size * 0.32, size * 0.55);
    ctx.bezierCurveTo(-size * 0.48, size * 0.3, -size * 0.42, -size * 0.5, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, -size * 0.12, size * 0.22, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(-size * 0.32, size * 0.55); ctx.lineTo(-size * 0.72, size);
    ctx.lineTo(-size * 0.18, size * 0.86); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.32, size * 0.55); ctx.lineTo(size * 0.72, size);
    ctx.lineTo(size * 0.18, size * 0.86); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb648';
    ctx.beginPath();
    ctx.moveTo(-size * 0.18, size * 0.58); ctx.lineTo(0, size * 1.15);
    ctx.lineTo(size * 0.18, size * 0.58); ctx.closePath(); ctx.fill();
  } else if (style === 'freeze') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.14;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.moveTo(-size * 0.55, -size * 0.5);
      ctx.lineTo(size * 0.55, size * 0.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#e9fdff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.28, 0, TAU);
    ctx.fill();
  } else if (style === 'rage') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, -0.4, Math.PI * 1.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.38, Math.PI * 0.6, Math.PI * 2.1);
    ctx.stroke();
    ctx.fillStyle = '#efd2ff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.2, 0, TAU);
    ctx.fill();
  } else if (style === 'barrel') {
    ctx.fillStyle = '#6b4429';
    ctx.strokeStyle = '#2f1e12';
    ctx.lineWidth = size * 0.1;
    roundRect(ctx, -size * 0.65, -size * 0.9, size * 1.3, size * 1.8, size * 0.3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#9a7444';
    ctx.lineWidth = size * 0.1;
    ctx.beginPath();
    ctx.moveTo(-size * 0.62, -size * 0.45);
    ctx.lineTo(size * 0.62, -size * 0.45);
    ctx.moveTo(-size * 0.62, size * 0.45);
    ctx.lineTo(size * 0.62, size * 0.45);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.05, size * 0.1, 0, TAU);
    ctx.arc(size * 0.2, -size * 0.05, size * 0.1, 0, TAU);
    ctx.fill();
  } else if (style === 'mirror') {
    const gradient = ctx.createLinearGradient(-size, -size, size, size);
    gradient.addColorStop(0, '#f5fdff');
    gradient.addColorStop(0.45, accent);
    gradient.addColorStop(1, '#648fbf');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#31506f';
    ctx.lineWidth = size * 0.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.62, size * 0.86, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = size * 0.09;
    ctx.beginPath();
    ctx.moveTo(-size * 0.32, size * 0.4);
    ctx.quadraticCurveTo(-size * 0.5, -size * 0.1, size * 0.28, -size * 0.35);
    ctx.stroke();
  } else {
    ctx.fillStyle = accent;
    ctx.strokeStyle = deep;
    ctx.lineWidth = size * 0.12;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.8, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.selection = null;
    this.pointer = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time = 0;
    this.decorations = [];
    this.buildDecorations();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    if (canvas.parentElement) this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  buildDecorations() {
    const random = seededRandom(41077);
    for (let i = 0; i < 135; i++) {
      const x = 30 + random() * 660;
      const y = 34 + random() * 890;
      if (y > ARENA.riverTop - 16 && y < ARENA.riverBottom + 16) continue;
      this.decorations.push({
        x, y,
        type: random() > 0.82 ? 'flower' : random() > 0.9 ? 'stone' : 'tuft',
        size: 2 + random() * 5,
        tone: random(),
        phase: random() * TAU,
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (width > 0 && height > 0 && (this.canvas.width !== width || this.canvas.height !== height)) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  worldFromClient(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * ARENA.width;
    const y = (clientY - rect.top) / rect.height * ARENA.height;
    return {
      x,
      y,
      inside: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom,
    };
  }

  setSelection(cardId, handIndex = null) {
    this.selection = cardId ? { cardId, handIndex, point: this.pointer } : null;
  }

  setPointer(point) {
    this.pointer = point;
    if (this.selection) this.selection.point = point;
  }

  actualCard() {
    if (!this.selection) return null;
    const card = CARDS[this.selection.cardId];
    if (!card) return null;
    if (card.id === 'mirror') {
      const target = this.game.lastPlayed?.[0];
      return target ? CARDS[target] : card;
    }
    return card;
  }

  selectionValid(point) {
    if (!this.selection || !point?.inside) return false;
    const card = this.actualCard();
    if (!card) return false;
    const cost = this.selection.handIndex != null ? this.game.handCost(0, this.selection.handIndex) : card.cost;
    if (this.game.elixir[0] + 0.001 < cost) return false;
    return this.game.canPlace(0, card.id, point.x, point.y, { anywhere: card.deployAnywhere }).ok;
  }

  render(timestamp) {
    if (!this.game || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const sx = this.canvas.width / ARENA.width;
    const sy = this.canvas.height / ARENA.height;
    const ctx = this.ctx;
    const time = timestamp / 1000;
    this.time = time;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.clearRect(0, 0, ARENA.width, ARENA.height);
    ctx.save();
    if (this.game.shake > 0 && !this.reducedMotion) {
      const power = this.game.shake * 9;
      ctx.translate((Math.random() - 0.5) * power, (Math.random() - 0.5) * power);
    }
    this.drawArena(time);
    this.drawPlatforms(time);
    this.drawRubble();
    this.drawDeploymentZone(time);
    this.drawSpellCasts(time);

    const entities = [
      ...this.game.towers.filter((tower) => tower.alive),
      ...this.game.units,
    ].sort((a, b) => a.y - b.y);
    for (const entity of entities) {
      if (entity.isTower) this.drawTower(entity, time);
      else this.drawUnit(entity, time);
    }
    this.drawTowerBars();
    this.drawProjectiles(time);
    this.drawEffects(time);
    this.drawSelectionGhost(time);
    this.drawVignette(time);
    ctx.restore();
  }

  drawArena(time) {
    const ctx = this.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, ARENA.height);
    sky.addColorStop(0, '#18334a');
    sky.addColorStop(1, '#0a1826');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);

    const grass = ctx.createLinearGradient(0, 12, 0, ARENA.height - 12);
    grass.addColorStop(0, '#76c64e');
    grass.addColorStop(0.48, '#71c049');
    grass.addColorStop(0.52, '#6cbb45');
    grass.addColorStop(1, '#67b541');
    roundRect(ctx, 10, 10, 700, 940, 20);
    ctx.fillStyle = grass;
    ctx.fill();
    ctx.save();
    roundRect(ctx, 10, 10, 700, 940, 20);
    ctx.clip();

    for (let y = 14; y < 950; y += 46) {
      ctx.fillStyle = Math.floor((y - 14) / 46) % 2 === 0 ? 'rgba(255,255,255,.045)' : 'rgba(20,70,10,.035)';
      ctx.fillRect(12, y, 696, 46);
    }

    const topGlow = ctx.createRadialGradient(360, 80, 20, 360, 80, 380);
    topGlow.addColorStop(0, 'rgba(255,92,92,.15)');
    topGlow.addColorStop(1, 'rgba(255,92,92,0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(10, 10, 700, 440);
    const bottomGlow = ctx.createRadialGradient(360, 880, 20, 360, 880, 380);
    bottomGlow.addColorStop(0, 'rgba(73,184,255,.15)');
    bottomGlow.addColorStop(1, 'rgba(73,184,255,0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(10, 510, 700, 440);

    this.drawPaths();
    this.drawDecorations(time);
    this.drawRiver(time);
    this.drawBridges(time);
    this.drawArenaBorder();
    this.drawTeamGate(time);
    ctx.restore();
  }

  drawPaths() {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(202,184,129,.22)';
    ctx.lineWidth = 58;
    for (const lane of ARENA.lanes) {
      ctx.beginPath();
      ctx.moveTo(lane, 430);
      ctx.lineTo(lane, 540);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lane, 530);
      ctx.bezierCurveTo(lane, 610, 360 + (lane - 360) * 0.2, 660, 360, 760);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lane, 430);
      ctx.bezierCurveTo(lane, 350, 360 + (lane - 360) * 0.2, 300, 360, 200);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(229,214,164,.18)';
    ctx.lineWidth = 34;
    for (const lane of ARENA.lanes) {
      ctx.beginPath();
      ctx.moveTo(lane, 440);
      ctx.lineTo(lane, 520);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDecorations(time) {
    const ctx = this.ctx;
    for (const item of this.decorations) {
      const sway = this.reducedMotion ? 0 : Math.sin(time * 1.6 + item.phase) * 1.2;
      if (item.type === 'flower') {
        const color = item.tone > 0.5 ? '#ffe36e' : '#ffb3d1';
        ctx.strokeStyle = '#3e7d2e';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y + 3);
        ctx.lineTo(item.x + sway, item.y - 3);
        ctx.stroke();
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
          const angle = i * TAU / 5 + item.phase;
          ctx.beginPath();
          ctx.arc(item.x + sway + Math.cos(angle) * 2.2, item.y - 3 + Math.sin(angle) * 2.2, 1.8, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.arc(item.x + sway, item.y - 3, 1.1, 0, TAU);
        ctx.fill();
      } else if (item.type === 'stone') {
        ctx.fillStyle = 'rgba(90,103,96,.35)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y, item.size * 1.2, item.size * 0.7, 0.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(220,231,222,.16)';
        ctx.beginPath();
        ctx.ellipse(item.x - 1, item.y - 1, item.size * 0.6, item.size * 0.3, 0.2, 0, TAU);
        ctx.fill();
      } else {
        ctx.strokeStyle = item.tone > 0.5 ? 'rgba(47,111,31,.5)' : 'rgba(105,170,58,.58)';
        ctx.lineWidth = 1.4;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(item.x + i * 2.1, item.y + 3);
          ctx.quadraticCurveTo(item.x + i * 2.1 + sway, item.y - item.size * 0.5, item.x + i * 2.1 + sway * 1.6, item.y - item.size);
          ctx.stroke();
        }
      }
    }
  }

  drawRiver(time) {
    const ctx = this.ctx;
    const top = ARENA.riverTop;
    const bottom = ARENA.riverBottom;
    ctx.save();
    const water = ctx.createLinearGradient(0, top, 0, bottom);
    water.addColorStop(0, '#2d9ed1');
    water.addColorStop(0.35, '#207fbd');
    water.addColorStop(0.68, '#176aa9');
    water.addColorStop(1, '#2d94ca');
    ctx.fillStyle = water;
    ctx.fillRect(10, top, 700, bottom - top);

    const shine = ctx.createLinearGradient(0, top, 0, bottom);
    shine.addColorStop(0, 'rgba(163,237,255,.24)');
    shine.addColorStop(0.35, 'rgba(163,237,255,0)');
    shine.addColorStop(0.8, 'rgba(22,75,120,.22)');
    shine.addColorStop(1, 'rgba(143,226,255,.16)');
    ctx.fillStyle = shine;
    ctx.fillRect(10, top, 700, bottom - top);

    ctx.lineCap = 'round';
    for (let row = 0; row < 4; row++) {
      const y = top + 14 + row * 16;
      ctx.strokeStyle = row % 2 === 0 ? 'rgba(199,247,255,.32)' : 'rgba(199,247,255,.16)';
      ctx.lineWidth = row % 2 === 0 ? 2.2 : 1.2;
      ctx.beginPath();
      for (let x = 16; x <= 704; x += 28) {
        const wave = Math.sin((x * 0.045) + time * 1.4 + row * 1.7) * 3.4;
        if (x === 16) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const x = 26 + (i * 47 + Math.sin(time * 0.7 + i) * 9) % 664;
      const y = top + 10 + (i * 23) % 52;
      ctx.fillStyle = 'rgba(224,253,255,.38)';
      ctx.beginPath();
      ctx.ellipse(x, y, 9 + (i % 3) * 4, 1.2, 0, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = '#725c3e';
    ctx.fillRect(10, top - 7, 700, 9);
    ctx.fillStyle = '#a88e63';
    ctx.fillRect(10, top - 7, 700, 4);
    ctx.fillStyle = '#5b4932';
    ctx.fillRect(10, bottom - 2, 700, 9);
    ctx.fillStyle = '#a88e63';
    ctx.fillRect(10, bottom + 2, 700, 3);
    for (let x = 20; x < 704; x += 34) {
      ctx.fillStyle = 'rgba(80,65,44,.55)';
      ctx.beginPath();
      ctx.ellipse(x, top - 3 + (x % 3), 7, 3, 0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(225,206,160,.45)';
      ctx.beginPath();
      ctx.ellipse(x + 9, bottom + 3 + (x % 4), 6, 2.4, -0.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  drawBridges(time) {
    const ctx = this.ctx;
    for (const bridge of ARENA.bridges) {
      const top = 426;
      const height = 108;
      const width = 84;
      ctx.save();
      ctx.translate(bridge, top);
      ctx.fillStyle = 'rgba(14,45,30,.24)';
      ctx.beginPath();
      ctx.ellipse(6, height - 6, 56, 15, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#5b4129';
      roundRect(ctx, -width / 2, 0, width, height, 7);
      ctx.fill();
      ctx.strokeStyle = '#332316';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#a77845';
      roundRect(ctx, -width / 2 + 5, 4, width - 10, height - 10, 5);
      ctx.fill();
      for (let y = 10; y < height - 10; y += 11) {
        ctx.fillStyle = y % 22 === 0 ? '#8a5e35' : '#b98a53';
        ctx.fillRect(-width / 2 + 6, y, width - 12, 7);
        ctx.fillStyle = 'rgba(255,230,178,.18)';
        ctx.fillRect(-width / 2 + 6, y, width - 12, 2);
        ctx.fillStyle = 'rgba(54,32,16,.4)';
        ctx.fillRect(-width / 2 + 6, y + 6, width - 12, 1);
      }
      ctx.strokeStyle = '#3c2a1a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-width / 2 + 3, 6);
      ctx.lineTo(-width / 2 + 3, height - 5);
      ctx.moveTo(width / 2 - 3, 6);
      ctx.lineTo(width / 2 - 3, height - 5);
      ctx.stroke();
      ctx.strokeStyle = '#c8ab77';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-width / 2 + 10, 8);
      ctx.lineTo(-width / 2 + 10, height - 6);
      ctx.moveTo(width / 2 - 10, 8);
      ctx.lineTo(width / 2 - 10, height - 6);
      ctx.stroke();
      for (const [px, py] of [[-width / 2 + 1, 3], [width / 2 - 1, 3], [-width / 2 + 1, height - 4], [width / 2 - 1, height - 4]]) {
        ctx.fillStyle = '#6a4b2c';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#332316';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#d4b47a';
        ctx.beginPath();
        ctx.arc(px - 1, py - 1, 2.2, 0, TAU);
        ctx.fill();
      }
      const glint = (Math.sin(time * 1.8 + bridge) + 1) / 2;
      ctx.fillStyle = `rgba(255,231,174,${0.08 + glint * 0.08})`;
      ctx.fillRect(-width / 2 + 8, 10, width - 16, 4);
      ctx.restore();
    }
  }

  drawArenaBorder() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(28,50,35,.55)';
    ctx.lineWidth = 20;
    roundRect(ctx, 10, 10, 700, 940, 20);
    ctx.stroke();
    ctx.strokeStyle = '#8f7a52';
    ctx.lineWidth = 13;
    roundRect(ctx, 10, 10, 700, 940, 20);
    ctx.stroke();
    ctx.strokeStyle = '#c1a873';
    ctx.lineWidth = 5;
    roundRect(ctx, 16, 16, 688, 928, 17);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(63,92,49,.7)';
    ctx.lineWidth = 2;
    roundRect(ctx, 22, 22, 676, 916, 14);
    ctx.stroke();
    for (let x = 32; x < 696; x += 43) {
      for (const y of [9, 951]) {
        ctx.fillStyle = 'rgba(216,195,151,.5)';
        ctx.beginPath();
        ctx.ellipse(x, y, 11, 3.4, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawTeamGate(time) {
    const ctx = this.ctx;
    for (const team of [0, 1]) {
      const y = team === 0 ? 942 : 18;
      const colors = TEAMS[team];
      ctx.save();
      const glow = ctx.createLinearGradient(0, y - 24, 0, y + 24);
      glow.addColorStop(0, 'rgba(255,255,255,0)');
      glow.addColorStop(0.5, colors.glow);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(24, y - 24, 672, 48);
      ctx.strokeStyle = 'rgba(255,255,255,.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 13]);
      ctx.lineDashOffset = -time * 16 * (team === 0 ? 1 : -1);
      ctx.beginPath();
      ctx.moveTo(26, y);
      ctx.lineTo(694, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  drawPlatforms(time) {
    const ctx = this.ctx;
    for (const tower of this.game.towers) {
      if (!tower.alive) continue;
      const team = TEAMS[tower.team];
      const king = tower.kind === 'king';
      const radius = king ? 66 : 48;
      ellipseShadow(ctx, tower.x + 4, tower.y + 6, radius * 1.1, radius * 0.42, 0.3);
      ctx.save();
      ctx.translate(tower.x, tower.y);
      ctx.scale(1, 0.42);
      const stone = ctx.createRadialGradient(-8, -10, 4, 0, 0, radius + 8);
      stone.addColorStop(0, '#d9d2bb');
      stone.addColorStop(0.65, '#a99c7d');
      stone.addColorStop(1, '#6d6452');
      ctx.fillStyle = stone;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#4f4a3b';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = team.main;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius - 8, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
      if (king && tower.active) {
        const pulse = (Math.sin(time * 3.2) + 1) / 2;
        ctx.strokeStyle = `rgba(255,220,110,${0.2 + pulse * 0.35})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(tower.x, tower.y + 4, radius + 10 + pulse * 5, (radius + 10) * 0.42, 0, 0, TAU);
        ctx.stroke();
      }
    }
  }

  drawTower(tower, time) {
    const ctx = this.ctx;
    const team = TEAMS[tower.team];
    ctx.save();
    ctx.translate(tower.x, tower.y);
    ctx.fillStyle = 'rgba(19,39,25,.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2, tower.kind === 'king' ? 42 : 31, 9, 0, 0, TAU);
    ctx.fill();
    drawTowerSprite(ctx, tower, time);
    if (tower.hitFlash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,255,255,${tower.hitFlash * 2.5})`;
      ctx.beginPath();
      ctx.arc(0, -18, tower.kind === 'king' ? 34 : 25, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (tower.kind === 'king' && tower.active) {
      ctx.strokeStyle = team.light;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 4, 40, 10, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawRubble() {
    const ctx = this.ctx;
    for (const tower of this.game.towers) {
      if (tower.alive) continue;
      const king = tower.kind === 'king';
      const radius = king ? 58 : 42;
      ctx.save();
      ctx.translate(tower.x, tower.y);
      ellipseShadow(ctx, 0, 6, radius, 15, 0.3);
      ctx.fillStyle = 'rgba(48,38,29,.35)';
      ctx.beginPath();
      ctx.ellipse(0, 2, radius * 0.9, 18, 0, 0, TAU);
      ctx.fill();
      const stones = king ? 9 : 6;
      for (let i = 0; i < stones; i++) {
        const angle = i * 2.4;
        const distance = 6 + (i % 3) * 9;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance * 0.45 + 2;
        ctx.fillStyle = i % 2 === 0 ? '#8c8574' : '#6d6759';
        ctx.strokeStyle = '#4c483e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 7, y - 6, 12 + (i % 3) * 4, 9 + (i % 2) * 3, 3);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = tower.team === 0 ? 'rgba(76,184,255,.5)' : 'rgba(255,106,106,.5)';
      ctx.beginPath();
      ctx.moveTo(-3, -34);
      ctx.lineTo(3, -34);
      ctx.lineTo(1, -8);
      ctx.lineTo(-1, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawTowerBars() {
    const ctx = this.ctx;
    for (const tower of this.game.towers) {
      if (!tower.alive || tower.kind === 'king') continue;
      const width = 76;
      const height = 12;
      const x = tower.x - width / 2;
      const y = tower.y - 76;
      const ratio = clamp(tower.hp / tower.maxHp, 0, 1);
      ctx.save();
      roundRect(ctx, x - 3, y - 3, width + 6, height + 6, 6);
      ctx.fillStyle = 'rgba(18,23,34,.78)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      roundRect(ctx, x, y, width, height, 4);
      ctx.fillStyle = 'rgba(20,27,38,.85)';
      ctx.fill();
      const fill = ctx.createLinearGradient(x, y, x, y + height);
      const team = TEAMS[tower.team];
      fill.addColorStop(0, team.light);
      fill.addColorStop(0.45, team.main);
      fill.addColorStop(1, team.deep);
      roundRect(ctx, x + 1.5, y + 1.5, Math.max(0, (width - 3) * ratio), height - 3, 3);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.36)';
      roundRect(ctx, x + 2.5, y + 2, Math.max(0, (width - 5) * ratio), 2.6, 1.3);
      ctx.fill();
      ctx.restore();
    }
  }

  drawUnit(unit, time) {
    if (!unit.alive && unit.deathTimer <= 0) return;
    const ctx = this.ctx;
    const team = TEAMS[unit.team];
    const radius = unit.radius || 12;
    const flying = !!unit.flying;
    const burrow = (unit.burrowTimer || 0) > 0;
    const spawn = clamp((unit.spawnTime || 0) / Math.max(0.001, unit.card.deployTime || 0.8), 0, 1);
    const death = unit.alive ? 1 : clamp((unit.deathTimer || 0) / 0.5, 0, 1);
    const jump = unit.jumpHeight || 0;
    const hover = flying ? 18 + Math.sin(time * 3 + unit.id) * 1.5 : 0;
    const drawY = unit.y - hover - jump;
    const alpha = (unit.alive ? 1 : death) * (unit.stealth && unit.stealthTimer <= 0 ? 0.28 : 1) * (1 - spawn * 0.35);
    if (burrow) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#6b4d32';
      ctx.beginPath();
      ctx.ellipse(unit.x, unit.y + 1, radius * 1.35, radius * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#8a6543';
      ctx.beginPath();
      ctx.ellipse(unit.x - 2, unit.y - 1, radius * 0.8, radius * 0.34, 0, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const angle = time * 5 + i * 2.1;
        ctx.fillStyle = 'rgba(214,186,137,.7)';
        ctx.beginPath();
        ctx.arc(unit.x + Math.cos(angle) * radius * 0.9, unit.y - 3 + Math.sin(angle) * radius * 0.35, 2.2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ellipseShadow(ctx, unit.x, unit.y + (flying ? 3 : 2), radius * (flying ? 0.7 : 0.95), radius * (flying ? 0.24 : 0.34), 0.3);
    if (flying && unit.alive) {
      ctx.strokeStyle = team.glow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(unit.x, unit.y + 2, radius * 0.7, radius * 0.25, 0, 0, TAU);
      ctx.stroke();
    }
    if (spawn > 0) {
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = team.light;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(unit.x, unit.y + 3, radius * (0.8 + (1 - spawn) * 0.6), radius * 0.34, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = team.glow;
      ctx.beginPath();
      ctx.ellipse(unit.x, unit.y + 1, radius * 1.25, radius * 0.46, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = alpha;
    }
    if (unit.chargeTimer > 0.7 && unit.card.charge && unit.alive) {
      ctx.strokeStyle = 'rgba(255,220,120,.5)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 3; i++) {
        const offset = 12 + i * 9;
        ctx.beginPath();
        ctx.moveTo(unit.x - (unit.faceX || 1) * offset, drawY - 8 - i * 4);
        ctx.lineTo(unit.x - (unit.faceX || 1) * (offset + 18), drawY - 8 - i * 4);
        ctx.stroke();
      }
    }
    ctx.save();
    ctx.translate(unit.x, drawY + 1);
    drawUnitSprite(ctx, unit, time, team.main);
    ctx.restore();
    if (unit.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(191,244,255,.28)';
      ctx.strokeStyle = 'rgba(218,252,255,.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(unit.x, drawY - radius * 1.3, radius * 1.35, radius * 1.9, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const angle = i * TAU / 4 + 0.3;
        ctx.beginPath();
        ctx.moveTo(unit.x + Math.cos(angle) * radius * 1.4, drawY - radius * 1.3 + Math.sin(angle) * radius * 1.8);
        ctx.lineTo(unit.x + Math.cos(angle) * radius * 1.7, drawY - radius * 1.3 + Math.sin(angle) * radius * 2.2);
        ctx.stroke();
      }
    }
    if (unit.rageTimer > 0) {
      ctx.strokeStyle = 'rgba(207,125,255,.6)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(unit.x, drawY - radius * 1.25, radius * 1.35, radius * 1.8, 0, 0, TAU);
      ctx.stroke();
    }
    if (unit.stunTimer > 0) {
      for (let i = 0; i < 3; i++) {
        const angle = time * 3.5 + i * TAU / 3;
        const x = unit.x + Math.cos(angle) * radius * 1.25;
        const y = drawY - radius * 2.45 + Math.sin(angle) * 4;
        ctx.fillStyle = '#ffe36e';
        drawStar(ctx, x, y, 4.2, 3);
        ctx.fill();
      }
    }
    if (unit.slowTimer > 0) {
      ctx.fillStyle = 'rgba(143,241,255,.6)';
      for (let i = 0; i < 3; i++) {
        const x = unit.x - radius + (i * radius * 0.9);
        const y = drawY - radius * 0.8 - ((time * 16 + i * 7) % 14);
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, TAU);
        ctx.fill();
      }
    }
    if (!unit.isStructure) {
      const barWidth = clamp(radius * 2.4, 24, 58);
      const barY = drawY - radius * 1.9 - (flying ? 18 : 14);
      this.drawHealthBar(unit, unit.x - barWidth / 2, barY, barWidth, 6, team);
      if (unit.shield > 0) {
        ctx.fillStyle = 'rgba(219,242,255,.9)';
        roundRect(ctx, unit.x - barWidth / 2, barY - 5, barWidth, 3, 1.5);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawHealthBar(target, x, y, width, height, team) {
    const ctx = this.ctx;
    const ratio = clamp(target.hp / target.maxHp, 0, 1);
    ctx.save();
    roundRect(ctx, x - 1.5, y - 1.5, width + 3, height + 3, 3);
    ctx.fillStyle = 'rgba(16,23,34,.78)';
    ctx.fill();
    roundRect(ctx, x, y, width, height, 2);
    ctx.fillStyle = 'rgba(20,26,36,.85)';
    ctx.fill();
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, team.light);
    gradient.addColorStop(0.5, team.main);
    gradient.addColorStop(1, team.deep);
    roundRect(ctx, x + 0.8, y + 0.8, Math.max(0, (width - 1.6) * ratio), height - 1.6, 1.5);
    ctx.fillStyle = ratio < 0.28 ? (Math.sin(this.time * 14) > 0 ? '#ff8c5d' : '#ff4d4d') : gradient;
    ctx.fill();
    ctx.restore();
  }

  drawProjectiles(time) {
    const ctx = this.ctx;
    for (const projectile of this.game.projectiles) {
      const target = projectile.target;
      const tx = target ? target.x : projectile.x;
      const ty = target ? target.y - (target.radius || 0) * 0.2 : projectile.y;
      const angle = Math.atan2(ty - projectile.y, tx - projectile.x);
      const team = TEAMS[projectile.team];
      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(angle);
      if (projectile.kind === 'cannonball') {
        ctx.fillStyle = 'rgba(20,26,36,.5)';
        ctx.beginPath();
        ctx.ellipse(-10, 0, 9, 2.4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#333b48';
        ctx.strokeStyle = '#151b25';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius + 2, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.38)';
        ctx.beginPath();
        ctx.arc(-1.7, -1.7, 1.8, 0, TAU);
        ctx.fill();
      } else if (projectile.kind === 'fireball' || projectile.kind === 'wizard') {
        const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, 11);
        gradient.addColorStop(0, '#fff6c9');
        gradient.addColorStop(0.4, '#ffb648');
        gradient.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 11 + Math.sin(time * 20) * 1.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, TAU);
        ctx.fill();
      } else if (projectile.kind === 'musket' || projectile.kind === 'bullet') {
        ctx.strokeStyle = 'rgba(255,245,190,.65)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, TAU);
        ctx.fill();
      } else if (projectile.kind === 'electric') {
        ctx.strokeStyle = '#bff7ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-5, -4);
        ctx.lineTo(0, 2);
        ctx.lineTo(6, -3);
        ctx.lineTo(13, 0);
        ctx.stroke();
      } else if (projectile.kind === 'bomb') {
        ctx.fillStyle = '#313845';
        ctx.strokeStyle = '#171d27';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius + 1, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#c9a26a';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(3, -projectile.radius);
        ctx.quadraticCurveTo(8, -projectile.radius - 5, 5, -projectile.radius - 9);
        ctx.stroke();
        ctx.fillStyle = '#ffb648';
        ctx.beginPath();
        ctx.arc(5, -projectile.radius - 10, 2, 0, TAU);
        ctx.fill();
      } else if (projectile.kind === 'magic') {
        const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
        gradient.addColorStop(0, '#f0d5ff');
        gradient.addColorStop(0.5, '#b56cff');
        gradient.addColorStop(1, 'rgba(130,60,220,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 9 + Math.sin(time * 16) * 1.4, 0, TAU);
        ctx.fill();
      } else if (projectile.kind === 'mortar') {
        ctx.fillStyle = '#3d4450';
        ctx.strokeStyle = '#171d27';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,205,215,.35)';
        ctx.beginPath();
        ctx.arc(-8, 0, 3, 0, TAU);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#e9dfc2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(2, 0);
        ctx.stroke();
        ctx.fillStyle = team.main;
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(1, -4);
        ctx.lineTo(1, 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-6, -2.5);
        ctx.moveTo(-12, 0);
        ctx.lineTo(-6, 2.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawSpellCasts(time) {
    const ctx = this.ctx;
    for (const spell of this.game.spells) {
      const style = spell.card.art?.style || 'zap';
      const progress = clamp(1 - spell.timer / Math.max(0.001, spell.delay), 0, 1);
      const accent = spell.card.art?.accent || '#ffd166';
      const x = spell.x;
      const y = spell.y;
      ctx.save();
      ctx.globalAlpha = 0.22 + progress * 0.55;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 8]);
      ctx.lineDashOffset = -time * 20;
      ctx.beginPath();
      ctx.arc(x, y, spell.radius, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      const fill = ctx.createRadialGradient(x, y, 4, x, y, spell.radius);
      fill.addColorStop(0, `${accent}55`);
      fill.addColorStop(1, `${accent}00`);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, spell.radius, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (style === 'fireball') {
        const py = y - (1 - progress) * 280;
        const size = 15 + progress * 9;
        ctx.save();
        ctx.translate(x, py);
        spellGlyph(ctx, spell.card, size);
        ctx.fillStyle = 'rgba(255,148,54,.22)';
        ctx.beginPath();
        ctx.ellipse(0, 16, size * 0.7, 26, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (style === 'arrows') {
        for (let i = 0; i < 7; i++) {
          const px = x + (i - 3) * 22;
          const py = y - (1 - progress) * (250 + (i % 3) * 35);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(0.42);
          ctx.strokeStyle = '#5b402b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(10, 0);
          ctx.stroke();
          ctx.fillStyle = '#e9dfc2';
          ctx.beginPath();
          ctx.moveTo(13, 0);
          ctx.lineTo(6, -4);
          ctx.lineTo(6, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      } else if (style === 'barrel') {
        const py = y - (1 - progress) * 230;
        ctx.save();
        ctx.translate(x, py);
        ctx.rotate(progress * 6);
        spellGlyph(ctx, spell.card, 18);
        ctx.restore();
      } else if (style === 'lightning') {
        for (let i = 0; i < 3; i++) {
          const angle = progress * 4 + i * TAU / 3;
          const px = x + Math.cos(angle) * spell.radius * 0.45;
          const py = y + Math.sin(angle) * spell.radius * 0.3;
          ctx.strokeStyle = `${accent}${i === 0 ? 'cc' : '88'}`;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(px, py - 120);
          ctx.lineTo(px - 8, py - 76);
          ctx.lineTo(px + 5, py - 58);
          ctx.lineTo(px - 5, py - 26);
          ctx.lineTo(px, py);
          ctx.stroke();
        }
        ctx.save();
        ctx.translate(x, y - (1 - progress) * 160);
        spellGlyph(ctx, spell.card, 17);
        ctx.restore();
      } else if (style === 'rocket') {
        const py = y - (1 - progress) * 300;
        ctx.save();
        ctx.translate(x, py);
        ctx.rotate(Math.PI * 0.08);
        spellGlyph(ctx, spell.card, 19);
        ctx.fillStyle = 'rgba(220,228,238,.3)';
        for (let i = 1; i <= 4; i++) {
          ctx.beginPath();
          ctx.arc(0, i * 24, 7 + i * 2, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      } else if (style === 'freeze') {
        for (let i = 0; i < 8; i++) {
          const angle = i * TAU / 8 + progress * 2;
          const r = spell.radius * (0.35 + progress * 0.6);
          ctx.fillStyle = 'rgba(218,252,255,.65)';
          drawStar(ctx, x + Math.cos(angle) * r, y + Math.sin(angle) * r, 4.5, 3);
          ctx.fill();
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = 0.55;
        spellGlyph(ctx, spell.card, 12);
        ctx.restore();
      } else if (style === 'rage') {
        ctx.strokeStyle = 'rgba(221,161,255,.6)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(x, y, spell.radius * (0.3 + i * 0.16) + Math.sin(time * 3 + i) * 5, 0, TAU);
          ctx.stroke();
        }
      } else {
        ctx.save();
        ctx.translate(x, y - (1 - progress) * 120);
        ctx.globalAlpha = 0.9;
        spellGlyph(ctx, spell.card, 16);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  drawEffects(time) {
    const ctx = this.ctx;
    for (const effect of this.game.particles) {
      const life = clamp(effect.life / effect.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = life;
      if (effect.kind === 'particle') {
        ctx.fillStyle = effect.color;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, Math.max(0.8, effect.size * life), 0, TAU);
        ctx.fill();
      } else if (effect.kind === 'ring') {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 1 + life * 4;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.size * (1.12 - life * 0.95), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = life * 0.25;
        ctx.fillStyle = effect.color;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.size * (1.12 - life * 0.95), 0, TAU);
        ctx.fill();
      } else if (effect.kind === 'slash') {
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 5 * life + 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.size * (1.4 - life * 0.3), effect.angle - 0.8, effect.angle + 0.8);
        ctx.stroke();
      } else if (effect.kind === 'bolt') {
        const flicker = 0.55 + Math.sin(this.time * 60 + effect.maxLife * 20) * 0.2;
        ctx.globalAlpha = life * flicker;
        ctx.strokeStyle = 'rgba(255,255,210,.35)';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        effect.points.forEach(([px, py], index) => {
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 2.6;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.globalAlpha = life;
        ctx.fillStyle = effect.color;
        for (const [px, py] of [effect.points[0], effect.points[effect.points.length - 1]]) {
          ctx.beginPath();
          ctx.arc(px, py, 5 * life, 0, TAU);
          ctx.fill();
        }
      } else if (effect.kind === 'text') {
        ctx.font = '700 20px "Lilita One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(32,22,52,.8)';
        ctx.strokeText(effect.text, effect.x, effect.y);
        ctx.fillStyle = effect.color;
        ctx.fillText(effect.text, effect.x, effect.y);
      }
      ctx.restore();
    }
  }

  drawDeploymentZone(time) {
    if (!this.selection) return;
    const ctx = this.ctx;
    const card = this.actualCard();
    if (!card) return;
    const isSpell = card.type === 'spell';
    const anywhere = isSpell || card.deployAnywhere;
    const zones = [];
    if (anywhere) {
      zones.push({ x: 18, y: 18, w: 684, h: 924 });
    } else {
      const enemyLeft = this.game.getTower(1, 'princess', 0);
      const enemyRight = this.game.getTower(1, 'princess', 1);
      zones.push({ x: 20, y: ARENA.riverBottom + 10, w: 680, h: 894 - ARENA.riverBottom });
      if (enemyLeft && !enemyLeft.alive) zones.push({ x: 20, y: 170, w: 340, h: ARENA.riverTop - 170 });
      if (enemyRight && !enemyRight.alive) zones.push({ x: 360, y: 170, w: 340, h: ARENA.riverTop - 170 });
    }
    ctx.save();
    for (const zone of zones) {
      const gradient = ctx.createLinearGradient(zone.x, zone.y, zone.x, zone.y + zone.h);
      gradient.addColorStop(0, 'rgba(89,198,255,.18)');
      gradient.addColorStop(1, 'rgba(89,198,255,.04)');
      roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.save();
      roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
      ctx.clip();
      ctx.strokeStyle = 'rgba(155,231,255,.12)';
      ctx.lineWidth = 12;
      for (let x = -ARENA.height; x < ARENA.width + ARENA.height; x += 46) {
        const offset = (time * 26) % 46;
        ctx.beginPath();
        ctx.moveTo(x + offset, zone.y);
        ctx.lineTo(x + offset - zone.h, zone.y + zone.h);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(175,241,255,.65)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -time * 18;
      roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawSelectionGhost(time) {
    if (!this.selection || !this.pointer?.inside) return;
    const card = this.actualCard();
    if (!card) return;
    const ctx = this.ctx;
    const point = this.pointer;
    const valid = this.selectionValid(point);
    const color = valid ? '#8ff4ff' : '#ff5d5d';
    const radius = card.type === 'spell' ? (card.spell?.radius || 70) : (card.radius || 22);
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -time * 24;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 7, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = valid ? 'rgba(117,231,255,.16)' : 'rgba(255,93,93,.17)';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 6, 0, TAU);
    ctx.fill();
    if (card.type === 'spell') {
      ctx.save();
      ctx.translate(point.x, point.y);
      spellGlyph(ctx, card, Math.min(30, radius * 0.34));
      ctx.globalAlpha = 0.85;
      ctx.restore();
    } else {
      const fake = {
        x: point.x, y: point.y, team: 0, id: 0,
        card, radius, faceX: 1, walkCycle: 0, attackFlash: 0, hitFlash: 0,
        speed: 0, isStructure: card.type === 'building',
      };
      ctx.globalAlpha = valid ? 0.58 : 0.32;
      drawUnitSprite(ctx, fake, time, valid ? TEAMS[0].main : '#ff8a8a');
      ctx.globalAlpha = 1;
      if (card.type === 'building') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(point.x, point.y + 3, radius * 1.25, radius * 0.44, 0, 0, TAU);
        ctx.stroke();
      }
    }
    if (!valid) {
      ctx.strokeStyle = '#ff5d5d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(point.x - 8, point.y - 38);
      ctx.lineTo(point.x + 8, point.y - 22);
      ctx.moveTo(point.x + 8, point.y - 38);
      ctx.lineTo(point.x - 8, point.y - 22);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawVignette(time) {
    const ctx = this.ctx;
    const vignette = ctx.createRadialGradient(360, 480, 220, 360, 480, 690);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.72, 'rgba(4,16,24,.08)');
    vignette.addColorStop(1, 'rgba(4,16,24,.38)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, ARENA.width, ARENA.height);
    if (this.game.overtime) {
      const pulse = (Math.sin(time * 3) + 1) / 2;
      const edge = ctx.createRadialGradient(360, 480, 280, 360, 480, 690);
      edge.addColorStop(0, 'rgba(120,0,0,0)');
      edge.addColorStop(0.75, `rgba(190,20,30,${0.06 + pulse * 0.08})`);
      edge.addColorStop(1, `rgba(230,30,40,${0.2 + pulse * 0.12})`);
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, ARENA.width, ARENA.height);
    }
    if (this.game.doubleElixir && !this.game.overtime && this.game.running) {
      const glow = ctx.createRadialGradient(360, 480, 300, 360, 480, 690);
      glow.addColorStop(0, 'rgba(180,90,255,0)');
      glow.addColorStop(1, 'rgba(180,90,255,.12)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, ARENA.width, ARENA.height);
    }
  }
}
