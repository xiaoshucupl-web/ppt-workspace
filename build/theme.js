// 《法律职业伦理》课件视觉主题 —— "墨蓝与青铜" (Ink & Bronze)
// 深墨蓝取意于法袍与司法的庄重，青铜取意于獬豸、天平与法典的器物质感。

const C = {
  ink:        '13233F',  // 主色：深墨蓝（60-70% 视觉权重）
  inkSoft:    '25395F',  // 次级墨蓝
  inkDeep:    '0B1729',  // 更深，用于分编页
  bronze:     'B08D57',  // 强调色：青铜金
  bronzeLt:   'D9C29B',  // 浅青铜
  bronzeTint: 'F6F1E8',  // 青铜淡底
  crimson:    '8E2C3B',  // 案例 / 警示
  crimsonTint:'F8EFF0',
  teal:       '2F6E6A',  // 比较、域外
  tealTint:   'ECF3F2',
  paper:      'FFFFFF',
  tint:       'F2F4F8',  // 卡片浅底
  tint2:      'E4E9F1',  // 卡片浅底（深一档）
  text:       '1B2430',
  body:       '32404F',
  muted:      '6B7684',
  line:       'D5DBE5',
  white:      'FFFFFF',
};

const F = {
  cn:   '微软雅黑',
  cnB:  '微软雅黑',
  num:  'Arial',   // 阿拉伯数字与英文
};

const W = 13.333, H = 7.5;      // LAYOUT_WIDE
const M = 0.62;                  // 页边距
const CW = W - M * 2;            // 内容区宽度

// ---------- 文本度量：中文按 1 个字宽，西文按 0.55 折算 ----------
function cjkLen(s) {
  let n = 0;
  for (const ch of String(s)) n += /[\x00-\xff]/.test(ch) ? 0.55 : 1;
  return n;
}

function estLines(text, widthIn, fontPt, padIn = 0.16) {
  const usable = Math.max(0.4, widthIn - padIn * 2) * 72;
  const perLine = Math.max(1, Math.floor(usable / fontPt));
  return Math.max(1, Math.ceil(cjkLen(text) / perLine));
}

// 在给定盒子里为一组文本挑一个不溢出的字号
function autoSize(items, widthIn, heightIn, startPt, minPt, lead = 1.42, gapPt = 0, padIn = 0.16) {
  const list = Array.isArray(items) ? items : [items];
  for (let pt = startPt; pt >= minPt; pt -= 0.5) {
    let total = 0;
    for (const t of list) total += estLines(t, widthIn, pt, padIn) * pt * lead + gapPt;
    if (total <= heightIn * 72) return pt;
  }
  return minPt;
}

// 估算一段文本在给定字号下占用的高度（英寸）
function textH(text, widthIn, fontPt, lead = 1.42, padIn = 0.16) {
  return (estLines(text, widthIn, fontPt, padIn) * fontPt * lead) / 72;
}

const shadow = (o = {}) => ({
  type: 'outer', angle: 90, blur: o.blur || 10,
  offset: o.offset === undefined ? 2 : o.offset,
  color: o.color || '9AA6B8', opacity: o.opacity === undefined ? 0.28 : o.opacity,
});

module.exports = { C, F, W, H, M, CW, cjkLen, estLines, autoSize, textH, shadow };
