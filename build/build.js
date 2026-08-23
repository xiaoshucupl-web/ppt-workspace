// 生成《法律职业伦理》课件
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const { C, F, W, H, M } = require('./theme');
const { RENDER } = require('./layouts');
const course = require('./course');

const ONLY = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);
const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(__dirname, 'out', ONLY.length ? `preview-${ONLY.join('-')}.pptx` : '法律职业伦理-课件.pptx');

const DARK = new Set(['cover', 'part', 'lesson', 'quote', 'summary', 'end']);

// 直引号 -> 中文弯引号（成对交替）
function curl(str) {
  let dq = true, sq = true;
  return str
    .replace(/\*\*(.+?)\*\*/g, '$1')   // 幻灯片不支持行内加粗，去除标记（整条加粗用 b:true）
    .replace(/"/g, () => { const c = dq ? '“' : '”'; dq = !dq; return c; })
    .replace(/(?<![A-Za-z])'(?![A-Za-z])/g, () => { const c = sq ? '‘' : '’'; sq = !sq; return c; });
}
function deepCurl(v) {
  if (typeof v === 'string') return curl(v);
  if (Array.isArray(v)) return v.map(deepCurl);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = deepCurl(v[k]);
    return o;
  }
  return v;
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = course.teacher;
  pres.title = course.title;
  pres.subject = course.title + ' 课程课件（24课时）';

  let n = 0;
  const add = async (d0, ctx) => {
    const d = deepCurl(d0);
    const fn = RENDER[d.t];
    if (!fn) throw new Error('unknown slide type: ' + d.t + ' @ ' + JSON.stringify(d).slice(0, 120));
    const s = pres.addSlide();
    await fn(s, d);
    n++;
    // 右上角页码指示（浅色页）
    if (!DARK.has(d.t) && ctx && ctx.tag) {
      s.addText(ctx.tag, {
        x: W - M - 1.95, y: 0.46, w: 1.95, h: 0.28, margin: 0, align: 'right',
        fontSize: 11, color: C.muted, fontFace: F.cn,
      });
    }
    if (d.note) s.addNotes(String(d.note));
    return s;
  };

  // ---- 封面
  await add({
    t: 'cover', title: course.title, sub: course.sub, teacher: course.teacher,
    org: course.org, meta: course.meta,
    eyebrow: '法学专业核心必修课',
  });

  // ---- 课程总览
  await add({
    t: 'toc', kicker: '课程总览 · COURSE MAP', title: '五编二十四课时',
    items: course.parts.map((p) => `${p.label}　${p.title}　（第 ${p.lessons[0]}—${p.lessons[p.lessons.length - 1]} 课时，共 ${p.lessons.length} 课时）`),
  }, { tag: '课程总览' });

  const files = [];
  for (const p of course.parts) {
    for (const L of p.lessons) {
      const f = path.join(__dirname, 'slides', `L${String(L).padStart(2, '0')}.js`);
      if (fs.existsSync(f)) files.push([p, L, f]);
    }
  }

  const seenPart = new Set();
  for (const [p, L, f] of files) {
    if (ONLY.length && !ONLY.includes(L)) continue;
    if (!seenPart.has(p.num)) {
      seenPart.add(p.num);
      await add({
        t: 'part', num: p.num, label: p.label, title: p.title, sub: p.sub,
        items: p.lessons.map((x) => `第${x}课时　${course.lessons[x]}`),
      });
    }
    const data = require(f);
    let i = 0;
    for (const d of data.slides) {
      i++;
      await add(d, { tag: `第${L}课时 · ${String(i).padStart(2, '0')}` });
    }
    process.stdout.write(`  第${L}课时: ${data.slides.length} 页\n`);
  }

  // ---- 结束页
  if (!ONLY.length) {
    await add({
      t: 'end', title: '谢谢各位同学！',
      sub: '法律人的技艺可以习得，法律人的良知必须守护。',
      foot: '《法律职业伦理》· 24课时　|　主讲：' + course.teacher,
    });
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await pres.writeFile({ fileName: OUT });
  console.log(`\n✓ ${OUT}  共 ${n} 页`);
})().catch((e) => { console.error(e); process.exit(1); });
