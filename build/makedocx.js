// 由 lecture/*.md 生成《法律职业伦理》讲稿 Word 文档
const fs = require('fs');
const path = require('path');
const D = require('docx');
const course = require('./course');

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, TableOfContents,
  Header, Footer, PageNumber, LevelFormat, convertInchesToTwip,
} = D;

const CN = '宋体';        // 正文
const CNH = '黑体';       // 标题
const CNQ = '楷体';       // 引文（法条）
const INK = '13233F';
const BRONZE = '8A6A34';
const GREY = '5A6472';

// ---------------------------------------------------------------- 行内解析
// 支持 **加粗**，其余按普通文本处理
function runs(text, base = {}) {
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    out.push(new TextRun({ text: m[1], bold: true, ...base }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  if (!out.length) out.push(new TextRun({ text: '', ...base }));
  return out;
}

const BODY = { font: CN, size: 24 };            // 12pt
const SPACING = { line: 360, before: 60, after: 120 }; // 1.5 倍行距

function para(text, opts = {}) {
  return new Paragraph({
    children: runs(text, opts.run || BODY),
    spacing: opts.spacing || SPACING,
    indent: opts.indent,
    alignment: opts.alignment,
    border: opts.border,
    shading: opts.shading,
    bullet: opts.bullet,
    numbering: opts.numbering,
    style: opts.style,
    keepNext: opts.keepNext,
  });
}

// ---------------------------------------------------------------- 表格
function mdTable(lines) {
  const rowsRaw = lines
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c) || c === ''));
  if (!rowsRaw.length) return [];
  const nCols = Math.max(...rowsRaw.map((r) => r.length));
  const total = convertInchesToTwip(6.1);
  const colW = new Array(nCols).fill(Math.floor(total / nCols));
  colW[0] = total - colW[1] * (nCols - 1);

  const rows = rowsRaw.map((cells, ri) => new TableRow({
    tableHeader: ri === 0,
    children: Array.from({ length: nCols }, (_, ci) => new TableCell({
      width: { size: colW[ci], type: WidthType.DXA },
      shading: ri === 0
        ? { type: ShadingType.CLEAR, fill: INK, color: 'auto' }
        : (ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F2F4F8', color: 'auto' } : undefined),
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        children: runs(cells[ci] || '', ri === 0
          ? { font: CNH, size: 21, bold: true, color: 'FFFFFF' }
          : { font: CN, size: 21 }),
        spacing: { line: 280, before: 20, after: 20 },
      })],
    })),
  }));
  return [new Table({ rows, columnWidths: colW, width: { size: total, type: WidthType.DXA } }),
    new Paragraph({ text: '', spacing: { after: 120 } })];
}

// ---------------------------------------------------------------- Markdown -> docx
function convert(md, lessonNo) {
  const out = [];
  const lines = md.split('\n');
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === '' || line === '---') { i++; continue; }

    // 表格
    if (line.startsWith('|')) {
      const block = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { block.push(lines[i]); i++; }
      out.push(...mdTable(block));
      continue;
    }

    // 标题
    if (line.startsWith('#')) {
      const level = (line.match(/^#+/) || ['#'])[0].length;
      const text = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      if (level === 1) {
        out.push(new Paragraph({ children: [new PageBreak()] }));
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text, font: CNH, size: 40, bold: true, color: INK })],
          spacing: { before: 240, after: 300 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRONZE, space: 8 } },
        }));
      } else if (level === 2) {
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text, font: CNH, size: 30, bold: true, color: INK })],
          spacing: { before: 360, after: 180 },
          keepNext: true,
        }));
      } else {
        out.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text, font: CNH, size: 26, bold: true, color: '24365C' })],
          spacing: { before: 260, after: 140 },
          keepNext: true,
        }));
      }
      i++; continue;
    }

    // 引用块（法条、引文）
    if (line.startsWith('>')) {
      const block = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        block.push(lines[i].trim().replace(/^>\s?/, '')); i++;
      }
      const inner = block.filter((t) => t.trim() !== '');
      inner.forEach((t, k) => {
        out.push(new Paragraph({
          children: runs(t, { font: CNQ, size: 23, color: '1B2430' }),
          spacing: { line: 340, before: k === 0 ? 140 : 40, after: k === inner.length - 1 ? 160 : 40 },
          indent: { left: convertInchesToTwip(0.35), right: convertInchesToTwip(0.2) },
          shading: { type: ShadingType.CLEAR, fill: 'F6F1E8', color: 'auto' },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: BRONZE, space: 8 } },
        }));
      });
      continue;
    }

    // 列表
    const li = line.match(/^([-*])\s+(.*)$/);
    const ol = line.match(/^(\d+)\.\s+(.*)$/);
    if (li || ol) {
      const text = (li ? li[2] : ol[2]);
      out.push(new Paragraph({
        children: runs(text, BODY),
        spacing: { line: 340, before: 40, after: 80 },
        indent: { left: convertInchesToTwip(0.45), hanging: convertInchesToTwip(0.22) },
        numbering: li
          ? { reference: 'bul', level: 0 }
          : { reference: `ord-${lessonNo}`, level: 0 },
      }));
      i++; continue;
    }

    // 普通段落
    out.push(new Paragraph({
      children: runs(line, BODY),
      spacing: SPACING,
      indent: { firstLine: convertInchesToTwip(0.32) },
    }));
    i++;
  }
  return out;
}

// ---------------------------------------------------------------- 组装
(async () => {
  const dir = path.join(__dirname, 'lecture');
  const files = fs.readdirSync(dir).filter((f) => /^L\d\d\.md$/.test(f)).sort();
  if (!files.length) throw new Error('no lecture files');

  const body = [];

  // 封面
  body.push(new Paragraph({ text: '', spacing: { before: 2600 } }));
  body.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: course.title, font: CNH, size: 76, bold: true, color: INK })],
    spacing: { after: 240 },
  }));
  body.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '课程讲稿（全二十四课时）', font: CNH, size: 34, color: BRONZE })],
    spacing: { after: 900 },
  }));
  [['课程性质', '法学专业核心必修课'], ['总学时', '24 课时 / 2 学分'],
   ['主讲教师', course.teacher], ['开课单位', '法学院']].forEach(([k, v]) => {
    body.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: k + '　', font: CN, size: 24, color: GREY }),
        new TextRun({ text: v, font: CNH, size: 24, bold: true, color: '1B2430' }),
      ],
      spacing: { after: 160 },
    }));
  });

  // 使用说明
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: '使用说明', font: CNH, size: 40, bold: true, color: INK })],
    spacing: { before: 240, after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRONZE, space: 8 } },
  }));
  [
    '本讲稿为《法律职业伦理》课程二十四课时的逐字讲稿，与同名课件（共549页幻灯片）配套使用。每一课时的讲稿开头列有教学目标、重点、难点、对应课件页码与建议时间分配。',
    '讲稿按"讲授语体"写成，可直接照读，亦可作为备课底稿自行删改。文中以引用块标示的内容为法条原文与经典引文，建议在课堂上原文照念，以强化学生对规范文本的敏感度。',
    '课程共分五编：第一编总论（第1—4课时）、第二编法官职业伦理（第5—8课时）、第三编检察官职业伦理（第9—11课时）、第四编律师职业伦理（第12—21课时）、第五编其他法律职业与伦理责任（第22—24课时）。',
    '每一课时末尾设有课堂研讨题与要点回顾，可用作课后作业、随堂讨论或者期末复习提纲。',
    '本讲稿所引法律、行政法规、司法解释与行业规范，均以撰写时的现行有效文本为准，其中包括2025年修订、自2026年3月1日起施行的《仲裁法》，2024年修订、自2025年1月1日起施行的《反洗钱法》，以及《关于进一步规范律师服务收费的意见》（司发通〔2021〕87号）等新近变动。规范时有修订，授课前请核对最新文本。',
  ].forEach((t) => body.push(para(t, { indent: { firstLine: convertInchesToTwip(0.32) } })));

  // 目录
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: '目　　录', font: CNH, size: 40, bold: true, color: INK })],
    spacing: { before: 240, after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRONZE, space: 8 } },
  }));
  body.push(new Paragraph({
    children: [new TextRun({ text: '（在 Word 中按 Ctrl+A 后按 F9 可更新页码）', font: CN, size: 20, color: GREY })],
    spacing: { after: 200 },
  }));
  body.push(new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-2' }));

  // 各课时
  const numbering = [{
    reference: 'bul',
    levels: [{
      level: 0, format: LevelFormat.BULLET, text: '●', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: convertInchesToTwip(0.45), hanging: convertInchesToTwip(0.22) } } },
    }],
  }];

  for (const f of files) {
    const no = parseInt(f.slice(1, 3), 10);
    numbering.push({
      reference: `ord-${no}`,
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: convertInchesToTwip(0.45), hanging: convertInchesToTwip(0.22) } } },
      }],
    });
    const md = fs.readFileSync(path.join(dir, f), 'utf8');
    body.push(...convert(md, no));
  }

  const doc = new Document({
    creator: course.teacher,
    title: course.title + ' 讲稿',
    description: '《法律职业伦理》二十四课时课程讲稿',
    numbering: { config: numbering },
    styles: {
      default: {
        document: { run: { font: CN, size: 24 }, paragraph: { spacing: SPACING } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },           // A4
          margin: { top: 1440, bottom: 1440, left: 1418, right: 1418 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: '《法律职业伦理》课程讲稿', font: CN, size: 18, color: GREY })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D5DBE5', space: 4 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '— ', font: CN, size: 18, color: GREY }),
              new TextRun({ children: [PageNumber.CURRENT], font: CN, size: 18, color: GREY }),
              new TextRun({ text: ' —', font: CN, size: 18, color: GREY }),
            ],
          })],
        }),
      },
      children: body,
    }],
  });

  const out = path.join(__dirname, 'out', '法律职业伦理-讲稿.docx');
  fs.writeFileSync(out, await Packer.toBuffer(doc));
  const chars = files.reduce((a, f) => a + fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s/g, '').length, 0);
  console.log(`✓ ${out}\n  ${files.length} 课时，正文约 ${chars.toLocaleString()} 字`);
})().catch((e) => { console.error(e); process.exit(1); });
