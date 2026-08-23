// 幻灯片版式库
const { C, F, W, H, M, CW, autoSize, textH, estLines, shadow } = require('./theme');
const { icon } = require('./icons');

const rr = 'roundRect';
const HW = CW - 2.05; // 页眉可用宽度（右上角留给页码指示）
const BOT = 0.52;     // 内容区下边距

// ---------------------------------------------------------------- 通用页眉
function head(s, o) {
  let y = 0.44;
  if (o.kicker) {
    s.addText(o.kicker, {
      x: M, y, w: HW, h: 0.26, margin: 0,
      fontSize: 12.5, bold: true, color: C.bronze, fontFace: F.cn, charSpacing: 1.2,
    });
    y += 0.30;
  }
  if (o.title) {
    const pt = autoSize([o.title], HW, 0.82, 28, 19, 1.2, 0, 0);
    const h = Math.max(0.5, textH(o.title, HW, pt, 1.2, 0));
    s.addText(o.title, {
      x: M, y, w: HW, h, margin: 0, valign: 'top',
      fontSize: pt, bold: true, color: C.text, fontFace: F.cnB,
    });
    y += h + 0.20;
  }
  return Math.max(y, 1.28);
}

// 按内容自然高度排布若干行，并挑选合适字号
function layoutRows(specs, widthIn, availIn, gapIn, o = {}) {
  const minRow = o.minRow || 0.50, padY = o.padY === undefined ? 0.34 : o.padY;
  const headDelta = o.headDelta === undefined ? 2 : o.headDelta;
  const n = specs.length || 1;
  for (let bp = o.maxB || 15; bp >= (o.minB || 9); bp -= 0.5) {
    const hp = Math.min(o.maxH || 16, bp + headDelta);
    const hs = specs.map((sp) => {
      const hh = sp.h ? textH(sp.h, widthIn, hp, 1.28, 0) : 0;
      const bh = sp.b ? textH(sp.b, widthIn, bp, 1.45, 0) : 0;
      return Math.max(minRow, hh + (sp.h && sp.b ? 0.08 : 0) + bh + padY);
    });
    const total = hs.reduce((a, b) => a + b, 0) + gapIn * (n - 1);
    if (total <= availIn) {
      const add = Math.min((availIn - total) / n, o.maxGrow === undefined ? 0.30 : o.maxGrow);
      const hs2 = hs.map((h) => h + add);
      return { hp, bp, heights: hs2, total: hs2.reduce((a, b) => a + b, 0) + gapIn * (n - 1) };
    }
  }
  const bp = o.minB || 9, hp = Math.min(o.maxH || 16, bp + headDelta);
  const h = (availIn - gapIn * (n - 1)) / n;
  return { hp, bp, heights: specs.map(() => h), total: availIn };
}

// 青铜圆形徽标
function badgeNum(s, x, y, d, txt, fill = C.bronze, col = C.white, fs = null) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  s.addText(String(txt), {
    x, y, w: d, h: d, margin: 0, align: 'center', valign: 'middle',
    fontSize: fs || Math.round(d * 34), bold: true, color: col, fontFace: F.num,
  });
}

async function badgeIcon(s, x, y, d, name, fill = C.bronze, col = C.white) {
  s.addShape('ellipse', { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  const p = d * 0.30;
  s.addImage({ data: await icon(name, col, 256), x: x + p, y: y + p, w: d - p * 2, h: d - p * 2 });
}

function panel(s, x, y, w, h, fill = C.tint, opts = {}) {
  s.addShape(rr, {
    x, y, w, h, rectRadius: opts.radius === undefined ? 0.10 : opts.radius,
    fill: { color: fill },
    line: opts.line ? { color: opts.line, width: 1 } : { color: fill },
    shadow: opts.shadow === false ? undefined : shadow({ blur: 9, offset: 2, opacity: 0.16 }),
  });
}

// ================================================================ 封面
async function cover(s, d) {
  s.background = { color: C.ink };
  for (const [cx, cy, dd, tr] of [[10.9, 1.55, 4.6, 88], [10.9, 1.55, 3.2, 82], [10.9, 1.55, 1.9, 74]]) {
    s.addShape('ellipse', {
      x: cx - dd / 2, y: cy - dd / 2, w: dd, h: dd,
      fill: { color: C.ink }, line: { color: C.bronze, width: 1, transparency: tr },
    });
  }
  s.addImage({ data: await icon('scale', C.bronze, 512), x: 9.85, y: 0.5, w: 2.1, h: 2.1 });
  s.addText(d.eyebrow || '', {
    x: M + 0.05, y: 1.85, w: 8.6, h: 0.32, margin: 0,
    fontSize: 15, bold: true, color: C.bronzeLt, fontFace: F.cn, charSpacing: 3,
  });
  s.addText(d.title, {
    x: M, y: 2.28, w: 9.0, h: 1.5, margin: 0, valign: 'top',
    fontSize: 60, bold: true, color: C.white, fontFace: F.cnB, charSpacing: 2,
  });
  s.addText(d.sub || '', {
    x: M + 0.05, y: 3.90, w: 9.0, h: 0.5, margin: 0,
    fontSize: 18, color: C.bronzeLt, fontFace: F.cn,
  });
  let mx = M + 0.05;
  (d.meta || []).forEach((t) => {
    const w = 0.42 + t.length * 0.185;
    s.addShape(rr, { x: mx, y: 4.64, w, h: 0.46, rectRadius: 0.23, fill: { color: C.inkSoft }, line: { color: C.inkSoft } });
    s.addText(t, { x: mx, y: 4.64, w, h: 0.46, margin: 0, align: 'center', valign: 'middle', fontSize: 13, color: C.bronzeLt, fontFace: F.cn });
    mx += w + 0.18;
  });
  s.addText(d.teacher || '', { x: M + 0.05, y: 5.74, w: 6.0, h: 0.44, margin: 0, fontSize: 24, bold: true, color: C.white, fontFace: F.cnB });
  s.addText(d.org || '', { x: M + 0.05, y: 6.22, w: 6.0, h: 0.34, margin: 0, fontSize: 14, color: C.muted, fontFace: F.cn });
}

// ================================================================ 编扉页
async function part(s, d) {
  s.background = { color: C.inkDeep };
  s.addText(String(d.num).padStart(2, '0'), {
    x: M, y: 0.75, w: 3.2, h: 2.0, margin: 0,
    fontSize: 130, bold: true, color: C.bronze, fontFace: F.num, transparency: 25,
  });
  s.addText(d.label || '', { x: M + 0.06, y: 2.72, w: 6, h: 0.34, margin: 0, fontSize: 14.5, bold: true, color: C.bronze, fontFace: F.cn, charSpacing: 3 });
  const tp = autoSize([d.title], 8.0, 1.3, 42, 28, 1.18, 0, 0);
  const th = textH(d.title, 8.0, tp, 1.18, 0);
  s.addText(d.title, { x: M, y: 3.10, w: 8.0, h: th, margin: 0, valign: 'top', fontSize: tp, bold: true, color: C.white, fontFace: F.cnB, charSpacing: 1 });
  if (d.sub) s.addText(d.sub, { x: M + 0.04, y: 3.24 + th, w: 8.0, h: 0.9, margin: 0, fontSize: 15, color: C.bronzeLt, fontFace: F.cn, lineSpacing: 24 });
  const items = d.items || [];
  const bx = 8.95, bw = W - bx - M;
  panel(s, bx, 1.30, bw, H - 2.6, C.ink, { shadow: false, radius: 0.12 });
  s.addText('本编课时', { x: bx + 0.34, y: 1.62, w: bw - 0.68, h: 0.3, margin: 0, fontSize: 12.5, bold: true, color: C.bronze, fontFace: F.cn, charSpacing: 2 });
  const pt = autoSize(items, bw - 1.05, H - 3.60, 13.5, 9.5, 1.5, 10);
  let y = 2.06;
  items.forEach((t, i) => {
    const h = textH(t, bw - 1.05, pt, 1.45, 0);
    s.addText(String(i + 1), { x: bx + 0.32, y, w: 0.34, h: 0.26, margin: 0, fontSize: pt - 1, bold: true, color: C.bronze, fontFace: F.num });
    s.addText(t, { x: bx + 0.70, y, w: bw - 1.02, h, margin: 0, valign: 'top', fontSize: pt, color: C.tint2, fontFace: F.cn, lineSpacing: pt * 1.45 });
    y += h + 0.15;
  });
}

// ================================================================ 课时扉页
async function lesson(s, d) {
  s.background = { color: C.ink };
  s.addShape('ellipse', { x: 10.4, y: -1.5, w: 5.6, h: 5.6, fill: { color: C.inkSoft }, line: { color: C.inkSoft } });
  const kw = d.kw || [];
  const kwH = kw.length ? 1.45 : 0;
  const blockBot = H - BOT - kwH - (kw.length ? 0.34 : 0);

  const tp = autoSize([d.title], 10.2, 2.0, 42, 26, 1.18, 0, 0);
  const th = textH(d.title, 10.2, tp, 1.18, 0);
  const sh = d.sub ? textH(d.sub, 10.2, 15, 1.55, 0) : 0;
  const blockH = 0.42 + th + (d.sub ? sh + 0.30 : 0);
  let y = Math.max(1.10, (blockBot - blockH) / 2);

  s.addText('第' + d.num + '课时', { x: M, y, w: 5, h: 0.34, margin: 0, fontSize: 16, bold: true, color: C.bronze, fontFace: F.cn, charSpacing: 3 });
  y += 0.46;
  s.addText(d.title, { x: M, y, w: 10.2, h: th, margin: 0, valign: 'top', fontSize: tp, bold: true, color: C.white, fontFace: F.cnB, charSpacing: 1 });
  y += th + 0.28;
  if (d.sub) s.addText(d.sub, { x: M + 0.04, y, w: 10.2, h: sh, margin: 0, valign: 'top', fontSize: 15, color: C.bronzeLt, fontFace: F.cn, lineSpacing: 23 });

  if (kw.length) {
    const n = kw.length, gap = 0.22, cw = (CW - gap * (n - 1)) / n;
    const ky = H - BOT - kwH;
    for (let i = 0; i < n; i++) {
      const x = M + i * (cw + gap);
      panel(s, x, ky, cw, kwH, C.inkSoft, { shadow: false });
      await badgeIcon(s, x + 0.30, ky + (kwH - 0.44) / 2, 0.44, kw[i].icon || 'lightbulb', C.bronze, C.ink);
      const pt = autoSize([kw[i].t], cw - 1.14, kwH - 0.30, 14, 10, 1.42);
      s.addText(kw[i].t, { x: x + 0.86, y: ky + 0.14, w: cw - 1.14, h: kwH - 0.28, margin: 0, valign: 'middle', fontSize: pt, color: C.tint2, fontFace: F.cn, lineSpacing: pt * 1.42 });
    }
  }
}

// ================================================================ 目录
async function toc(s, d) {
  s.background = { color: C.paper };
  const top = head(s, { kicker: d.kicker || '本课时结构', title: d.title || '内容导航' });
  const items = d.items || [];
  const half = Math.ceil(items.length / 2);
  const colW = (CW - 0.5) / 2;
  const avail = H - top - BOT;
  const L = layoutRows(items.map((t) => ({ b: t })), colW - 0.95, avail, 0.16,
    { maxB: 15, minB: 10, padY: 0.30, minRow: 0.52, maxGrow: 0.22 });
  for (let c = 0; c < 2; c++) {
    const list = items.slice(c * half, (c + 1) * half);
    const x = M + c * (colW + 0.5);
    let y = top + Math.max(0, (avail - L.heights.slice(c * half, (c + 1) * half).reduce((a, b) => a + b, 0) - 0.16 * (list.length - 1)) / 2);
    list.forEach((t, i) => {
      const idx = c * half + i;
      const rh = L.heights[idx];
      panel(s, x, y, colW, rh, C.tint, { shadow: false, radius: 0.08 });
      const dd = Math.min(0.40, rh - 0.14);
      badgeNum(s, x + 0.18, y + (rh - dd) / 2, dd, idx + 1, C.bronze, C.white, Math.round(dd * 35));
      const th = textH(t, colW - 0.95, L.bp, 1.45, 0);
      s.addText(t, { x: x + 0.74, y: y + (rh - th) / 2, w: colW - 0.92, h: th, margin: 0, valign: 'top', fontSize: L.bp, color: C.body, fontFace: F.cn, lineSpacing: L.bp * 1.45 });
      y += rh + 0.16;
    });
  }
}

// ================================================================ 章节间隔页
async function section(s, d) {
  s.background = { color: C.tint };
  s.addShape('ellipse', { x: M, y: H / 2 - 1.05, w: 2.10, h: 2.10, fill: { color: C.ink }, line: { color: C.ink } });
  s.addText(String(d.num || '1'), {
    x: M, y: H / 2 - 1.05, w: 2.10, h: 2.10, margin: 0, align: 'center', valign: 'middle',
    fontSize: 62, bold: true, color: C.bronze, fontFace: F.num,
  });
  const tw = W - (M + 2.55) - M;
  const tp = autoSize([d.title], tw, 1.35, 36, 23, 1.2, 0, 0);
  const th = textH(d.title, tw, tp, 1.2, 0);
  const sh = d.sub ? textH(d.sub, tw, 15, 1.5, 0) : 0;
  const y = H / 2 - (th + (d.sub ? sh + 0.24 : 0)) / 2;
  s.addText(d.title, { x: M + 2.55, y, w: tw, h: th, margin: 0, valign: 'top', fontSize: tp, bold: true, color: C.text, fontFace: F.cnB });
  if (d.sub) s.addText(d.sub, { x: M + 2.57, y: y + th + 0.20, w: tw, h: sh, margin: 0, valign: 'top', fontSize: 15, color: C.muted, fontFace: F.cn, lineSpacing: 23 });
}

// ================================================================ 要点面板
async function bullets(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const ph = H - top - BOT;
  panel(s, M, top, CW, ph, C.tint, { shadow: false });
  if (d.icon) {
    s.addImage({ data: await icon(d.icon, C.inkSoft, 512), x: W - M - 2.15, y: top + ph - 2.05, w: 1.70, h: 1.70, transparency: 94 });
  }
  const iw = CW - 1.10;
  let y = top + 0.36;
  if (d.lead) {
    const lp = autoSize([d.lead], iw, 1.1, 16.5, 13, 1.5);
    const lh = textH(d.lead, iw, lp, 1.5, 0);
    s.addText(d.lead, { x: M + 0.55, y, w: iw, h: lh, margin: 0, valign: 'top', fontSize: lp, bold: true, color: C.ink, fontFace: F.cnB, lineSpacing: lp * 1.5 });
    y += lh + 0.28;
  }
  const items = d.items || [];
  const avail = top + ph - 0.34 - y;
  const texts = items.map((t) => (typeof t === 'object' ? t.t : t));
  const pt = autoSize(texts, iw - 0.30, avail, 16, 10, 1.5, 9);
  const paras = items.map((t, i) => {
    const o = typeof t === 'object' ? t : { t };
    const l2 = o.lvl === 2;
    return {
      text: o.t,
      options: {
        bullet: { code: l2 ? '25AB' : '25A0', indent: 18 }, indentLevel: l2 ? 1 : 0,
        fontSize: l2 ? pt - 1 : pt, bold: !!o.b, color: l2 ? C.muted : C.body,
        fontFace: F.cn, lineSpacing: pt * 1.5, paraSpaceAfter: 8, breakLine: i < items.length - 1,
      },
    };
  });
  if (paras.length) s.addText(paras, { x: M + 0.55, y, w: iw, h: avail, margin: 0, valign: 'top' });
}

// ================================================================ 编号行
async function rows(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const items = d.items || [];
  const avail = H - top - BOT;
  const gap = 0.16, tw = CW - 1.34;
  const L = layoutRows(items, tw, avail, gap, { maxB: 15, minB: 9, maxH: 16.5, padY: 0.40, minRow: 0.62 });
  let y = top + Math.max(0, (avail - L.total) / 2);
  for (let i = 0; i < items.length; i++) {
    const it = items[i], rh = L.heights[i];
    panel(s, M, y, CW, rh, i % 2 === 0 ? C.tint : C.paper, { shadow: false, radius: 0.08, line: i % 2 === 0 ? null : C.line });
    const dd = Math.min(0.56, rh - 0.22);
    if (it.icon) await badgeIcon(s, M + 0.30, y + (rh - dd) / 2, dd, it.icon, C.ink, C.bronze);
    else badgeNum(s, M + 0.30, y + (rh - dd) / 2, dd, i + 1, C.ink, C.bronze, Math.round(dd * 32));
    const hh = it.h ? textH(it.h, tw, L.hp, 1.28, 0) : 0;
    const bh = it.b ? textH(it.b, tw, L.bp, 1.45, 0) : 0;
    let ty = y + (rh - (hh + (it.h && it.b ? 0.08 : 0) + bh)) / 2;
    if (it.h) { s.addText(it.h, { x: M + 1.06, y: ty, w: tw, h: hh, margin: 0, valign: 'top', fontSize: L.hp, bold: true, color: C.ink, fontFace: F.cnB, lineSpacing: L.hp * 1.28 }); ty += hh + 0.08; }
    if (it.b) s.addText(it.b, { x: M + 1.06, y: ty, w: tw, h: bh, margin: 0, valign: 'top', fontSize: L.bp, color: C.body, fontFace: F.cn, lineSpacing: L.bp * 1.45 });
    y += rh + gap;
  }
}

// ================================================================ 卡片网格
async function cards(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const items = d.items || [];
  const n = items.length;
  const perRow = n <= 3 ? n : (n === 4 ? 2 : 3);
  const nRows = Math.ceil(n / perRow);
  const gx = 0.26, gy = 0.24;
  const cw = (CW - gx * (perRow - 1)) / perRow;
  const availH = H - top - BOT;
  const maxCH = (availH - gy * (nRows - 1)) / nRows;
  const iw = cw - 0.70;
  const hasBadge = items.some((i) => i.icon) || d.numbered !== false;
  const badgeH = hasBadge ? 0.68 : 0;
  // 选字号，使最高的卡片不超过 maxCH
  let hp = 17, bp = 14.5;
  for (bp = 14.5; bp >= 9; bp -= 0.5) {
    hp = Math.min(17, bp + 2.5);
    const need = Math.max(...items.map((it) => 0.32 + badgeH
      + (it.h ? textH(it.h, iw, hp, 1.25, 0) + 0.14 : 0)
      + (it.b ? textH(it.b, iw, bp, 1.5, 0) : 0) + 0.30));
    if (need <= maxCH) break;
  }
  const heights = [];
  for (let r = 0; r < nRows; r++) {
    const grp = items.slice(r * perRow, (r + 1) * perRow);
    heights.push(Math.min(maxCH, Math.max(...grp.map((it) => 0.32 + badgeH
      + (it.h ? textH(it.h, iw, hp, 1.25, 0) + 0.14 : 0)
      + (it.b ? textH(it.b, iw, bp, 1.5, 0) : 0) + 0.30)) + 0.10));
  }
  const totalH = heights.reduce((a, b) => a + b, 0) + gy * (nRows - 1);
  const y0 = top + Math.max(0, (availH - totalH) / 2);
  const tones = [[C.tint, C.ink], [C.bronzeTint, C.bronze], [C.tealTint, C.teal], [C.crimsonTint, C.crimson]];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / perRow), c = i % perRow;
    const ch = heights[r];
    const x = M + c * (cw + gx);
    const y = y0 + heights.slice(0, r).reduce((a, b) => a + b, 0) + gy * r;
    const tone = tones[(d.tone === 'mono' ? 0 : i) % tones.length];
    panel(s, x, y, cw, ch, tone[0], { shadow: false, radius: 0.10 });
    let cy = y + 0.32;
    if (items[i].icon) { await badgeIcon(s, x + 0.35, cy, 0.50, items[i].icon, tone[1], C.white); cy += badgeH; }
    else if (d.numbered !== false) { badgeNum(s, x + 0.35, cy, 0.50, i + 1, tone[1], C.white, 17); cy += badgeH; }
    if (items[i].h) {
      const hh = textH(items[i].h, iw, hp, 1.25, 0);
      s.addText(items[i].h, { x: x + 0.35, y: cy, w: iw, h: hh, margin: 0, valign: 'top', fontSize: hp, bold: true, color: C.ink, fontFace: F.cnB, lineSpacing: hp * 1.25 });
      cy += hh + 0.14;
    }
    if (items[i].b) s.addText(items[i].b, { x: x + 0.35, y: cy, w: iw, h: y + ch - 0.24 - cy, margin: 0, valign: 'top', fontSize: bp, color: C.body, fontFace: F.cn, lineSpacing: bp * 1.5 });
  }
}

// ================================================================ 法条
async function law(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const list = d.items || [{ src: d.src, text: d.text }];
  const n = list.length;
  const noteH = d.note ? 0 : 0;
  let availH = H - top - BOT;
  const gap = 0.20;
  const tw = CW - 0.86;
  // 释义框高度按内容计算
  let nh = 0, np = 13.5;
  if (d.note) {
    np = autoSize([d.note], tw, 0.95, 14, 9.5, 1.45);
    nh = textH(d.note, tw, np, 1.45, 0) + 0.72;
    availH -= nh + 0.20;
  }
  // 选字号使各条自然高度总和不超过可用高度
  let tp = 15.5, heights = [];
  for (tp = 15.5; tp >= 9; tp -= 0.5) {
    heights = list.map((it) => 0.72 + textH(it.text || '', tw, tp, 1.5, 0) + 0.32);
    const tot = heights.reduce((a, b) => a + b, 0) + gap * (n - 1);
    if (tot <= availH) break;
  }
  let total = heights.reduce((a, b) => a + b, 0) + gap * (n - 1);
  if (total < availH) { const add = Math.min((availH - total) / n, 0.35); heights = heights.map((h) => h + add); total = heights.reduce((a, b) => a + b, 0) + gap * (n - 1); }
  let y = top + Math.max(0, (availH - total) / 2);
  for (let i = 0; i < n; i++) {
    const it = list[i], bh = heights[i];
    panel(s, M, y, CW, bh, C.bronzeTint, { shadow: false });
    s.addShape(rr, { x: M + 0.34, y: y + 0.26, w: 0.62, h: 0.30, rectRadius: 0.15, fill: { color: C.bronze }, line: { color: C.bronze } });
    s.addText('法条', { x: M + 0.34, y: y + 0.26, w: 0.62, h: 0.30, margin: 0, align: 'center', valign: 'middle', fontSize: 10.5, bold: true, color: C.white, fontFace: F.cn });
    const sp = autoSize([it.src || ''], CW - 1.55, 0.32, 15, 10.5, 1.2);
    s.addText(it.src || '', { x: M + 1.08, y: y + 0.24, w: CW - 1.50, h: 0.34, margin: 0, valign: 'middle', fontSize: sp, bold: true, color: C.ink, fontFace: F.cnB });
    s.addText(it.text || '', { x: M + 0.43, y: y + 0.70, w: tw, h: bh - 0.94, margin: 0, valign: 'top', fontSize: tp, color: C.body, fontFace: F.cn, lineSpacing: tp * 1.5 });
    y += bh + gap;
  }
  if (d.note) {
    const ny = H - BOT - nh;
    panel(s, M, ny, CW, nh, C.tint, { shadow: false });
    s.addText('释义', { x: M + 0.36, y: ny + 0.18, w: 0.9, h: 0.26, margin: 0, fontSize: 11.5, bold: true, color: C.bronze, fontFace: F.cn, charSpacing: 1 });
    s.addText(d.note, { x: M + 0.36, y: ny + 0.48, w: tw, h: nh - 0.62, margin: 0, valign: 'top', fontSize: np, color: C.body, fontFace: F.cn, lineSpacing: np * 1.45 });
  }
}

// ================================================================ 案例
async function kase(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const qs = d.q || [];
  const hasQ = qs.length > 0;
  const qw = hasQ ? 4.35 : 0;
  const fw = CW - (hasQ ? qw + 0.26 : 0);
  const fh = H - top - BOT;
  panel(s, M, top, fw, fh, C.crimsonTint, { shadow: false });
  s.addShape(rr, { x: M + 0.34, y: top + 0.28, w: 0.76, h: 0.30, rectRadius: 0.15, fill: { color: C.crimson }, line: { color: C.crimson } });
  s.addText(d.badge || '案例', { x: M + 0.34, y: top + 0.28, w: 0.76, h: 0.30, margin: 0, align: 'center', valign: 'middle', fontSize: 10.5, bold: true, color: C.white, fontFace: F.cn });
  if (d.name) {
    const np = autoSize([d.name], fw - 1.60, 0.34, 15.5, 11, 1.2);
    s.addText(d.name, { x: M + 1.22, y: top + 0.26, w: fw - 1.58, h: 0.36, margin: 0, valign: 'middle', fontSize: np, bold: true, color: C.crimson, fontFace: F.cnB });
  }
  const y = top + 0.78;
  const tw = fw - 0.86;
  const paras = Array.isArray(d.facts) ? d.facts : [d.facts || ''];
  const fp = autoSize(paras, tw, top + fh - 0.32 - y, 15, 9, 1.52, 8);
  s.addText(paras.map((t, i) => ({
    text: t, options: { fontSize: fp, color: C.body, fontFace: F.cn, lineSpacing: fp * 1.52, paraSpaceAfter: 8, breakLine: i < paras.length - 1 },
  })), { x: M + 0.43, y, w: tw, h: top + fh - 0.32 - y, margin: 0, valign: 'top' });

  if (hasQ) {
    const qx = M + fw + 0.26;
    panel(s, qx, top, qw, fh, C.ink, { shadow: false });
    s.addText(d.qTitle || '讨论问题', { x: qx + 0.34, y: top + 0.30, w: qw - 0.68, h: 0.30, margin: 0, fontSize: 13, bold: true, color: C.bronze, fontFace: F.cn, charSpacing: 1.5 });
    const iw = qw - 1.10;
    const L = layoutRows(qs.map((t) => ({ b: t })), iw, fh - 1.10, 0.16, { maxB: 14, minB: 9, padY: 0.18, minRow: 0.34, maxGrow: 0.20 });
    let qy = top + 0.80;
    qs.forEach((t, i) => {
      const rh = L.heights[i];
      const th = textH(t, iw, L.bp, 1.5, 0);
      badgeNum(s, qx + 0.34, qy + (rh - 0.30) / 2, 0.30, i + 1, C.bronze, C.ink, 11);
      s.addText(t, { x: qx + 0.74, y: qy + (rh - th) / 2, w: iw, h: th, margin: 0, valign: 'top', fontSize: L.bp, color: C.tint2, fontFace: F.cn, lineSpacing: L.bp * 1.5 });
      qy += rh + 0.16;
    });
  }
}

// ================================================================ 对照
async function compare(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const cols = d.cols || [d.left, d.right].filter(Boolean);
  const n = cols.length, gap = 0.26;
  const cw = (CW - gap * (n - 1)) / n;
  const availH = H - top - BOT;
  const iw = cw - 0.80;
  let pt = 14.5, need = 0;
  for (pt = 14.5; pt >= 9; pt -= 0.5) {
    need = Math.max(...cols.map((c) => (c.items || [])
      .reduce((a, t) => a + textH(t, iw - 0.25, pt, 1.5, 0) + 8 / 72, 0)));
    if (need + 1.32 <= availH) break;
  }
  const ch = Math.min(availH, Math.max(availH * 0.55, need + 1.32));
  const y0 = top + Math.max(0, (availH - ch) / 2);
  const tones = [[C.tint, C.ink], [C.bronzeTint, C.bronze], [C.tealTint, C.teal], [C.crimsonTint, C.crimson]];
  for (let i = 0; i < n; i++) {
    const x = M + i * (cw + gap);
    const tone = tones[i % tones.length];
    panel(s, x, y0, cw, ch, tone[0], { shadow: false });
    s.addShape(rr, { x: x + 0.30, y: y0 + 0.28, w: cw - 0.60, h: 0.56, rectRadius: 0.10, fill: { color: tone[1] }, line: { color: tone[1] } });
    const hp = autoSize([cols[i].h], cw - 0.80, 0.52, 16, 10.5, 1.2);
    s.addText(cols[i].h, { x: x + 0.30, y: y0 + 0.28, w: cw - 0.60, h: 0.56, margin: 0, align: 'center', valign: 'middle', fontSize: hp, bold: true, color: C.white, fontFace: F.cnB });
    const its = cols[i].items || [];
    s.addText(its.map((t, k) => ({
      text: t, options: { bullet: { code: '25A0', indent: 16 }, fontSize: pt, color: C.body, fontFace: F.cn, lineSpacing: pt * 1.5, paraSpaceAfter: 8, breakLine: k < its.length - 1 },
    })), { x: x + 0.40, y: y0 + 1.00, w: cw - 0.80, h: ch - 1.26, margin: 0, valign: 'top' });
  }
}

// ================================================================ 流程
async function steps(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const items = d.items || [];
  const n = items.length;
  const avail = H - top - BOT;
  if (!d.vertical && n <= 5) {
    const gap = 0.22, cw = (CW - gap * (n - 1)) / n;
    const iw = cw - 0.56;
    const hp = autoSize(items.map((i) => i.h), iw, 0.68, 16, 11, 1.25);
    let bp = 13.5, need = 0;
    for (bp = 13.5; bp >= 9; bp -= 0.5) {
      need = Math.max(...items.map((it) => 1.06 + textH(it.h, iw, hp, 1.25, 0) + 0.10 + (it.b ? textH(it.b, iw, bp, 1.5, 0) : 0) + 0.28));
      if (need <= avail) break;
    }
    const ch = Math.min(avail, Math.max(avail * 0.6, need));
    const y0 = top + Math.max(0, (avail - ch) / 2);
    for (let i = 0; i < n; i++) {
      const x = M + i * (cw + gap);
      panel(s, x, y0, cw, ch, C.tint, { shadow: false });
      badgeNum(s, x + cw / 2 - 0.29, y0 + 0.30, 0.58, i + 1, C.ink, C.bronze, 21);
      const hh = textH(items[i].h, iw, hp, 1.25, 0);
      s.addText(items[i].h, { x: x + 0.28, y: y0 + 1.06, w: iw, h: hh, margin: 0, align: 'center', valign: 'top', fontSize: hp, bold: true, color: C.ink, fontFace: F.cnB, lineSpacing: hp * 1.25 });
      if (items[i].b) s.addText(items[i].b, { x: x + 0.28, y: y0 + 1.16 + hh, w: iw, h: y0 + ch - 0.24 - (y0 + 1.16 + hh), margin: 0, valign: 'top', fontSize: bp, color: C.body, fontFace: F.cn, lineSpacing: bp * 1.5 });
    }
  } else if (d.cols === 2 || n >= 6) {
    // 双栏：条目较多时每栏可用高度翻倍，字号得以保持可读
    const half = Math.ceil(n / 2);
    const gap = 0.14, gapX = 0.32, cw = (CW - gapX) / 2, tw = cw - 1.14;
    let hp = 15, bp = 13.5, hs = [];
    for (bp = 13.5; bp >= 9; bp -= 0.5) {
      hp = Math.min(15, bp + 2);
      hs = items.map((sp) => Math.max(0.52, textH(sp.h, tw, hp, 1.28, 0)
        + (sp.b ? 0.07 + textH(sp.b, tw, bp, 1.45, 0) : 0) + 0.30));
      const c1 = hs.slice(0, half).reduce((a, b) => a + b, 0) + gap * (half - 1);
      const c2 = hs.slice(half).reduce((a, b) => a + b, 0) + gap * (n - half - 1);
      if (Math.max(c1, c2) <= avail) break;
    }
    for (let c = 0; c < 2; c++) {
      const list = items.slice(c * half, c === 0 ? half : n);
      const hsC = hs.slice(c * half, c === 0 ? half : n);
      const colTotal = hsC.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
      const x = M + c * (cw + gapX);
      let y = top + Math.max(0, (avail - colTotal) / 2);
      list.forEach((it, k) => {
        const idx = c * half + k, rh = hsC[k];
        panel(s, x, y, cw, rh, idx % 2 ? C.paper : C.tint, { shadow: false, radius: 0.08, line: idx % 2 ? C.line : null });
        const dd = Math.min(0.50, rh - 0.18);
        badgeNum(s, x + 0.28, y + (rh - dd) / 2, dd, idx + 1, C.ink, C.bronze, Math.round(dd * 31));
        const hh = textH(it.h, tw, hp, 1.28, 0);
        const bh = it.b ? textH(it.b, tw, bp, 1.45, 0) : 0;
        let ty = y + (rh - (hh + (it.b ? bh + 0.07 : 0))) / 2;
        s.addText(it.h, { x: x + 0.96, y: ty, w: tw, h: hh, margin: 0, valign: 'top', fontSize: hp, bold: true, color: C.ink, fontFace: F.cnB, lineSpacing: hp * 1.28 });
        if (it.b) s.addText(it.b, { x: x + 0.96, y: ty + hh + 0.07, w: tw, h: bh, margin: 0, valign: 'top', fontSize: bp, color: C.body, fontFace: F.cn, lineSpacing: bp * 1.45 });
        y += rh + gap;
      });
    }
  } else {
    const gap = 0.13, tw = CW - 1.28;
    const L = layoutRows(items, tw, avail, gap, { maxB: 14.5, minB: 9, maxH: 15.5, padY: 0.34, minRow: 0.56 });
    let y = top + Math.max(0, (avail - L.total) / 2);
    for (let i = 0; i < n; i++) {
      const rh = L.heights[i];
      panel(s, M, y, CW, rh, i % 2 ? C.paper : C.tint, { shadow: false, radius: 0.08, line: i % 2 ? C.line : null });
      const dd = Math.min(0.52, rh - 0.18);
      badgeNum(s, M + 0.30, y + (rh - dd) / 2, dd, i + 1, C.ink, C.bronze, Math.round(dd * 31));
      const hh = textH(items[i].h, tw, L.hp, 1.28, 0);
      const bh = items[i].b ? textH(items[i].b, tw, L.bp, 1.45, 0) : 0;
      let ty = y + (rh - (hh + (items[i].b ? bh + 0.07 : 0))) / 2;
      s.addText(items[i].h, { x: M + 1.02, y: ty, w: tw, h: hh, margin: 0, valign: 'top', fontSize: L.hp, bold: true, color: C.ink, fontFace: F.cnB, lineSpacing: L.hp * 1.28 });
      if (items[i].b) s.addText(items[i].b, { x: M + 1.02, y: ty + hh + 0.07, w: tw, h: bh, margin: 0, valign: 'top', fontSize: L.bp, color: C.body, fontFace: F.cn, lineSpacing: L.bp * 1.45 });
      y += rh + gap;
    }
  }
}

// ================================================================ 引言
async function quote(s, d) {
  s.background = { color: C.ink };
  const tw = CW - 1.6;
  const pt = autoSize([d.text], tw, 3.0, 32, 16, 1.5);
  const th = textH(d.text, tw, pt, 1.5, 0);
  const blockH = 0.86 + 0.5 + th + 0.42 + (d.by ? 0.44 : 0) + (d.src ? 0.40 : 0);
  let y = Math.max(1.0, (H - blockH) / 2);
  s.addImage({ data: await icon('quote', C.bronze, 256), x: M + 0.1, y, w: 0.82, h: 0.82 });
  y += 1.18;
  s.addText(d.text, { x: M + 0.8, y, w: tw, h: th, margin: 0, valign: 'top', fontSize: pt, color: C.white, fontFace: F.cnB, lineSpacing: pt * 1.5 });
  y += th + 0.40;
  if (d.by) { s.addText('—— ' + d.by, { x: M + 0.84, y, w: tw, h: 0.4, margin: 0, fontSize: 17, bold: true, color: C.bronze, fontFace: F.cn }); y += 0.44; }
  if (d.src) s.addText(d.src, { x: M + 0.84, y, w: tw, h: 0.38, margin: 0, fontSize: 13, color: C.muted, fontFace: F.cn });
}

// ================================================================ 数字看板
async function stat(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const items = d.items || [];
  const n = items.length;
  const gap = 0.26, cw = (CW - gap * (n - 1)) / n;
  const availH = H - top - BOT - (d.foot ? 0.55 : 0);
  const sw = cw - 0.70;
  let lp = 16, sp = 13, need = 0;
  for (sp = 13; sp >= 9; sp -= 0.5) {
    lp = Math.min(16, sp + 3);
    need = Math.max(...items.map((it) => 0.38 + 1.10 + 0.16
      + textH(it.l, sw, lp, 1.3, 0) + 0.22 + (it.s ? textH(it.s, sw, sp, 1.45, 0) : 0) + 0.34));
    if (need <= availH) break;
  }
  const ch = Math.min(availH, Math.max(2.5, need));
  const y0 = top + Math.max(0, (availH - ch) / 2);
  const tones = [[C.ink, C.bronze], [C.bronzeTint, C.bronze], [C.tealTint, C.teal], [C.crimsonTint, C.crimson]];
  for (let i = 0; i < n; i++) {
    const x = M + i * (cw + gap);
    const tone = tones[i % tones.length];
    const dark = i === 0;
    panel(s, x, y0, cw, ch, dark ? C.ink : tone[0], { shadow: false });
    // 数字与中文单位分开排版，避免中文回退到西文字体
    const raw = String(items[i].n);
    const m = raw.match(/^([\d.,+%\-—/]+)\s*(.*)$/);
    const numPart = m ? m[1] : raw, unit = m ? m[2] : '';
    const np = Math.min(58, Math.max(26, (sw * 72 * 1.35) / Math.max(2, numPart.length + unit.length * 1.6)));
    const runs = [{ text: numPart, options: { fontSize: np, bold: true, color: dark ? C.bronze : tone[1], fontFace: F.num } }];
    if (unit) runs.push({ text: unit, options: { fontSize: Math.round(np * 0.52), bold: true, color: dark ? C.bronze : tone[1], fontFace: F.cnB } });
    s.addText(runs, { x: x + 0.2, y: y0 + 0.36, w: cw - 0.4, h: 1.12, margin: 0, align: 'center', valign: 'middle' });
    let cy = y0 + 1.62;
    const lh = textH(items[i].l, sw, lp, 1.3, 0);
    s.addText(items[i].l, { x: x + 0.35, y: cy, w: sw, h: lh, margin: 0, align: 'center', valign: 'top', fontSize: lp, bold: true, color: dark ? C.white : C.ink, fontFace: F.cnB, lineSpacing: lp * 1.3 });
    cy += lh + 0.22;
    if (items[i].s) s.addText(items[i].s, { x: x + 0.35, y: cy, w: sw, h: y0 + ch - 0.2 - cy, margin: 0, align: 'center', valign: 'top', fontSize: sp, color: dark ? C.tint2 : C.body, fontFace: F.cn, lineSpacing: sp * 1.45 });
  }
  if (d.foot) s.addText(d.foot, { x: M, y: H - 0.72, w: CW, h: 0.34, margin: 0, fontSize: 11.5, color: C.muted, fontFace: F.cn });
}

// ================================================================ 讨论题
async function discuss(s, d) {
  s.background = { color: C.paper };
  const top = head(s, { kicker: d.kicker || '课堂研讨', title: d.title || '思考与讨论' });
  const items = (d.items || []).map((i) => (typeof i === 'object' ? i.t : i));
  const avail = H - top - BOT;
  const gap = 0.16, tw = CW - 1.28;
  const L = layoutRows(items.map((t) => ({ b: t })), tw, avail, gap, { maxB: 16, minB: 10, padY: 0.34, minRow: 0.60 });
  let y = top + Math.max(0, (avail - L.total) / 2);
  for (let i = 0; i < items.length; i++) {
    const rh = L.heights[i];
    panel(s, M, y, CW, rh, C.tealTint, { shadow: false, radius: 0.09 });
    const dd = Math.min(0.50, rh - 0.20);
    badgeNum(s, M + 0.32, y + (rh - dd) / 2, dd, i + 1, C.teal, C.white, Math.round(dd * 30));
    const th = textH(items[i], tw, L.bp, 1.5, 0);
    s.addText(items[i], { x: M + 1.02, y: y + (rh - th) / 2, w: tw, h: th, margin: 0, valign: 'top', fontSize: L.bp, color: C.text, fontFace: F.cn, lineSpacing: L.bp * 1.5 });
    y += rh + gap;
  }
}

// ================================================================ 小结
async function summary(s, d) {
  s.background = { color: C.ink };
  s.addText(d.kicker || '本课小结', { x: M, y: 0.52, w: CW, h: 0.3, margin: 0, fontSize: 12.5, bold: true, color: C.bronze, fontFace: F.cn, charSpacing: 2 });
  const tp = autoSize([d.title || '要点回顾'], CW, 0.7, 30, 21, 1.2, 0, 0);
  s.addText(d.title || '要点回顾', { x: M, y: 0.86, w: CW, h: 0.62, margin: 0, valign: 'top', fontSize: tp, bold: true, color: C.white, fontFace: F.cnB });
  const items = (d.items || []).map((i) => (typeof i === 'object' ? i.t : i));
  const top = 1.74;
  const avail = H - top - BOT;
  const gap = 0.15, tw = CW - 1.16;
  const L = layoutRows(items.map((t) => ({ b: t })), tw, avail, gap, { maxB: 16, minB: 10, padY: 0.32, minRow: 0.56, maxGrow: 0.22 });
  let y = top + Math.max(0, (avail - L.total) / 2);
  for (let i = 0; i < items.length; i++) {
    const rh = L.heights[i];
    panel(s, M, y, CW, rh, C.inkSoft, { shadow: false, radius: 0.08 });
    const dd = Math.min(0.44, rh - 0.18);
    await badgeIcon(s, M + 0.32, y + (rh - dd) / 2, dd, 'check', C.bronze, C.ink);
    const th = textH(items[i], tw, L.bp, 1.5, 0);
    s.addText(items[i], { x: M + 0.96, y: y + (rh - th) / 2, w: tw, h: th, margin: 0, valign: 'top', fontSize: L.bp, color: C.tint2, fontFace: F.cn, lineSpacing: L.bp * 1.5 });
    y += rh + gap;
  }
}

// ================================================================ 表格
async function tableS(s, d) {
  s.background = { color: C.paper };
  const top = head(s, d);
  const nCols = (d.head || []).length || 1;
  const colW = d.colW || new Array(nCols).fill(CW / nCols);
  const avail = H - top - BOT - (d.foot ? 0.50 : 0);
  const body = d.rows || [];
  // 选字号：使表格自然高度不超过可用高度
  let fs = 13, hh = 0.5, heights = [];
  for (fs = 13; fs >= 8; fs -= 0.5) {
    hh = Math.max(0.40, textH((d.head || []).join(''), CW, fs + 0.5, 1.3, 0) * 0 + (fs + 0.5) * 1.3 / 72 + 0.24);
    heights = body.map((r) => Math.max(0.34, Math.max(...r.map((t, ci) =>
      textH(String(t), colW[ci] - 0.16, fs, 1.4, 0))) + 0.22));
    if (hh + heights.reduce((a, b) => a + b, 0) <= avail) break;
  }
  const headRow = (d.head || []).map((t) => ({
    text: t, options: { bold: true, color: C.white, fill: { color: C.ink }, fontFace: F.cnB, fontSize: fs + 0.5, align: 'center', valign: 'middle' },
  }));
  const bodyRows = body.map((r, ri) => r.map((t, ci) => ({
    text: String(t),
    options: {
      color: ci === 0 ? C.ink : C.body, bold: ci === 0, fontFace: F.cn, fontSize: fs,
      fill: { color: ri % 2 ? C.paper : C.tint }, valign: 'middle', align: 'left',
    },
  })));
  const tblH = hh + heights.reduce((a, b) => a + b, 0);
  const ty = top + Math.max(0, (avail - tblH) / 2);
  s.addTable([headRow, ...bodyRows], {
    x: M, y: ty, w: CW, colW,
    rowH: [hh, ...heights],
    border: { type: 'solid', color: C.line, pt: 0.75 },
    autoPage: false, margin: 0.06,
  });
  if (d.foot) {
    s.addText(d.foot, { x: M, y: Math.min(H - 0.60, ty + tblH + 0.18), w: CW, h: 0.32, margin: 0, fontSize: 11, color: C.muted, fontFace: F.cn });
  }
}

// ================================================================ 结束页
async function end(s, d) {
  s.background = { color: C.ink };
  for (const [dd, tr] of [[5.4, 88], [3.8, 80]]) {
    s.addShape('ellipse', { x: W / 2 - dd / 2, y: H / 2 - dd / 2 - 0.35, w: dd, h: dd, fill: { color: C.ink }, line: { color: C.bronze, width: 1, transparency: tr } });
  }
  s.addImage({ data: await icon('scale', C.bronze, 512), x: W / 2 - 0.75, y: 1.62, w: 1.5, h: 1.5 });
  s.addText(d.title || '谢谢各位同学！', { x: M, y: 3.46, w: CW, h: 0.9, margin: 0, align: 'center', fontSize: 40, bold: true, color: C.white, fontFace: F.cnB, charSpacing: 2 });
  s.addText(d.sub || '', { x: M, y: 4.44, w: CW, h: 0.5, margin: 0, align: 'center', fontSize: 17, color: C.bronzeLt, fontFace: F.cn });
  if (d.foot) s.addText(d.foot, { x: M, y: 5.30, w: CW, h: 0.7, margin: 0, align: 'center', fontSize: 13, color: C.muted, fontFace: F.cn, lineSpacing: 21 });
}

const RENDER = {
  cover, part, lesson, toc, section, bullets, rows, cards,
  law, case: kase, compare, steps, quote, stat, discuss, summary, table: tableS, end,
};

module.exports = { RENDER };
