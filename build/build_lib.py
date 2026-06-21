# -*- coding: utf-8 -*-
"""
《法律文书写作》课程 —— PPT 课件 + Word 逐字讲稿 生成库
------------------------------------------------------------------
设计目标：
  1. 每一讲以"数据"形式描述（幻灯片清单 + 逐字稿清单），由本库统一渲染，
     保证 24 讲版式、配色、字体一致，可批量重建。
  2. 中文字体在 PPT / Word 中均显式写入 eastAsia 字形，避免方块乱码。
  3. 版式稳重（法学课程：深蓝 + 暗金），信息密度高，单页可容纳较多内容。
用法见各 lesson_XX.py。
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

import docx
from docx.shared import Pt as DPt, RGBColor as DRGB, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn as dqn

# ----------------------------- 配色 -----------------------------
NAVY  = RGBColor(0x14, 0x2A, 0x47)   # 主深蓝
BLUE  = RGBColor(0x20, 0x53, 0x8C)   # 标题蓝
STEEL = RGBColor(0x3C, 0x6B, 0xA5)   # 次级蓝
GOLD  = RGBColor(0xB6, 0x86, 0x2C)   # 暗金（强调）
GREY  = RGBColor(0x3E, 0x3E, 0x3E)   # 正文灰黑
LGREY = RGBColor(0x86, 0x86, 0x86)   # 浅灰
LIGHT = RGBColor(0xEE, 0xF1, 0xF6)   # 浅蓝底
CARD  = RGBColor(0xF7, 0xF3, 0xE8)   # 米色卡片（范文/案例）
CARDL = RGBColor(0xEC, 0xF1, 0xF8)   # 蓝灰卡片（要点）
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK   = RGBColor(0x20, 0x20, 0x20)

H_FONT = "微软雅黑"   # 标题字体
B_FONT = "微软雅黑"   # 正文字体
KAI    = "楷体"       # 范文/引文

SW = Inches(13.333)   # 16:9
SH = Inches(7.5)

# ----------------------------- PPT 基础工具 -----------------------------
def _cjk(run, font):
    """把 latin / eastAsia / cs 三种字形都写成同一中文字体。"""
    run.font.name = font
    rPr = run._r.get_or_add_rPr()
    for tag in ("a:ea", "a:cs"):
        e = rPr.find(qn(tag))
        if e is None:
            e = rPr.makeelement(qn(tag), {})
            rPr.append(e)
        e.set("typeface", font)


def _run(p, text, font=B_FONT, size=18, bold=False, color=INK, italic=False):
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    _cjk(r, font)
    return r


def _para(tf, first=False):
    return tf.paragraphs[0] if first and not tf.paragraphs[0].runs else tf.add_paragraph()


def _box(slide, l, t, w, h, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = Pt(4); tf.margin_right = Pt(4)
    tf.margin_top = Pt(2); tf.margin_bottom = Pt(2)
    return tb, tf


def _rect(slide, l, t, w, h, fill, line=None, line_w=1.0):
    sp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    sp.fill.solid(); sp.fill.fore_color.rgb = fill
    if line is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = line; sp.line.width = Pt(line_w)
    sp.shadow.inherit = False
    return sp


def _blank(prs):
    # layout 6 通常为纯空白
    idx = 6 if len(prs.slide_layouts) > 6 else len(prs.slide_layouts) - 1
    return prs.slides.add_slide(prs.slide_layouts[idx])


def _page_header(slide, kicker, title, page_no):
    """内容页统一页眉：顶部色条 + 章节眉 + 标题。"""
    _rect(slide, 0, 0, SW, Inches(0.16), GOLD)
    _rect(slide, 0, Inches(0.16), SW, Inches(1.06), NAVY)
    # kicker
    _, tf = _box(slide, Inches(0.55), Inches(0.22), Inches(11.5), Inches(0.32))
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
    _run(p, kicker, H_FONT, 13, False, RGBColor(0xCF, 0xD8, 0xE6))
    # title
    _, tf = _box(slide, Inches(0.55), Inches(0.52), Inches(12.2), Inches(0.66))
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
    _run(p, title, H_FONT, 26, True, WHITE)
    # page number
    _, tf = _box(slide, Inches(12.4), Inches(7.02), Inches(0.8), Inches(0.34))
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.RIGHT
    _run(p, str(page_no), H_FONT, 11, False, LGREY)
    # footer line
    _rect(slide, Inches(0.55), Inches(7.0), Inches(10.0), Pt(1.2), RGBColor(0xD8, 0xDD, 0xE6))
    _, tf = _box(slide, Inches(0.55), Inches(7.02), Inches(8.0), Inches(0.34))
    p = tf.paragraphs[0]
    _run(p, "法律文书写作", H_FONT, 10, False, LGREY)


# ----------------------------- 幻灯片类型 -----------------------------
def slide_title(prs, course, lesson_tag, title, subtitle, teacher, meta_line):
    s = _blank(prs)
    _rect(s, 0, 0, SW, SH, NAVY)
    _rect(s, 0, Inches(2.55), SW, Inches(0.06), GOLD)
    _rect(s, Inches(0.9), Inches(0.8), Inches(0.14), Inches(1.4), GOLD)
    _, tf = _box(s, Inches(1.2), Inches(0.85), Inches(11), Inches(0.6))
    _run(tf.paragraphs[0], course, H_FONT, 20, False, RGBColor(0xBF, 0xCC, 0xDD))
    _, tf = _box(s, Inches(1.2), Inches(1.45), Inches(11), Inches(0.6))
    _run(tf.paragraphs[0], lesson_tag, H_FONT, 22, True, GOLD)
    _, tf = _box(s, Inches(1.15), Inches(2.7), Inches(11.2), Inches(1.7))
    for i, line in enumerate(title if isinstance(title, list) else [title]):
        p = _para(tf, i == 0); p.line_spacing = 1.1
        _run(p, line, H_FONT, 40, True, WHITE)
    _, tf = _box(s, Inches(1.2), Inches(4.7), Inches(11), Inches(0.8))
    _run(tf.paragraphs[0], subtitle, H_FONT, 19, False, RGBColor(0xD7, 0xDE, 0xE8))
    _rect(s, Inches(1.2), Inches(5.95), Inches(6.0), Pt(1.4), RGBColor(0x44, 0x5A, 0x77))
    _, tf = _box(s, Inches(1.2), Inches(6.15), Inches(11), Inches(0.5))
    _run(tf.paragraphs[0], teacher, H_FONT, 16, False, RGBColor(0xC8, 0xD2, 0xE0))
    _, tf = _box(s, Inches(1.2), Inches(6.6), Inches(11), Inches(0.5))
    _run(tf.paragraphs[0], meta_line, H_FONT, 13, False, RGBColor(0x8F, 0x9D, 0xB2))
    return s


def slide_section(prs, no, title, points=None):
    s = _blank(prs)
    _rect(s, 0, 0, SW, SH, LIGHT)
    _rect(s, 0, 0, Inches(4.1), SH, NAVY)
    _rect(s, Inches(4.1), 0, Inches(0.06), SH, GOLD)
    _, tf = _box(s, Inches(0.5), Inches(2.5), Inches(3.2), Inches(1.2))
    _run(tf.paragraphs[0], no, H_FONT, 96, True, GOLD)
    _, tf = _box(s, Inches(4.6), Inches(2.7), Inches(8.2), Inches(1.4), MSO_ANCHOR.MIDDLE)
    for i, line in enumerate(title if isinstance(title, list) else [title]):
        p = _para(tf, i == 0); p.line_spacing = 1.1
        _run(p, line, H_FONT, 34, True, NAVY)
    if points:
        _, tf = _box(s, Inches(4.6), Inches(4.4), Inches(8.0), Inches(2.2))
        for i, pt in enumerate(points):
            p = _para(tf, i == 0); p.line_spacing = 1.25; p.space_after = Pt(4)
            _run(p, "▍ ", H_FONT, 15, False, GOLD)
            _run(p, pt, B_FONT, 16, False, GREY)
    return s


def _emit_items(tf, items, base=18):
    """items: list of (level, text, style)。
       level 0/1/2；style: h=强调金, n=正文, s=次级灰, q=引文楷体, t=小标题蓝。"""
    sizes = {0: base + 2, 1: base, 2: base - 2}
    marks = {0: "■ ", 1: "● ", 2: "— "}
    mcol  = {0: BLUE, 1: GOLD, 2: STEEL}
    for i, it in enumerate(items):
        if len(it) == 3:
            lv, text, st = it
        else:
            lv, text = it; st = "n"
        p = _para(tf, i == 0)
        p.line_spacing = 1.22
        p.space_after = Pt(6 if lv == 0 else 3)
        p.level = lv
        if st == "t":
            _run(p, text, H_FONT, sizes[lv] + 1, True, BLUE)
            continue
        indent = "    " * lv
        if st != "q":
            _run(p, indent + marks[lv], H_FONT, sizes[lv], True, mcol[lv])
        if st == "h":
            _run(p, text, B_FONT, sizes[lv], True, GOLD)
        elif st == "s":
            _run(p, text, B_FONT, sizes[lv], False, LGREY)
        elif st == "q":
            _run(p, indent + text, KAI, sizes[lv], False, GREY)
        else:
            _run(p, text, B_FONT, sizes[lv], False, INK)


def slide_content(prs, kicker, title, items, page_no, note=None, base=18):
    s = _blank(prs)
    _page_header(s, kicker, title, page_no)
    h = Inches(5.25) if note else Inches(5.55)
    _, tf = _box(s, Inches(0.6), Inches(1.45), Inches(12.1), h)
    _emit_items(tf, items, base=base)
    if note:
        _rect(s, Inches(0.6), Inches(6.05), Inches(12.1), Inches(0.82), CARDL)
        _rect(s, Inches(0.6), Inches(6.05), Inches(0.1), Inches(0.82), GOLD)
        _, tf = _box(s, Inches(0.85), Inches(6.12), Inches(11.7), Inches(0.7), MSO_ANCHOR.MIDDLE)
        p = tf.paragraphs[0]
        _run(p, "提示  ", H_FONT, 14, True, GOLD)
        _run(p, note, B_FONT, 14, False, GREY)
    return s


def slide_two_col(prs, kicker, title, lh, litems, rh, ritems, page_no, lcolor=BLUE, rcolor=GOLD):
    s = _blank(prs)
    _page_header(s, kicker, title, page_no)
    colw = Inches(5.95)
    for x, hd, items, c in ((Inches(0.6), lh, litems, lcolor),
                            (Inches(6.78), rh, ritems, rcolor)):
        _rect(s, x, Inches(1.5), colw, Inches(0.5), c)
        _, tf = _box(s, x + Inches(0.15), Inches(1.55), colw - Inches(0.3), Inches(0.42), MSO_ANCHOR.MIDDLE)
        _run(tf.paragraphs[0], hd, H_FONT, 16, True, WHITE)
        _rect(s, x, Inches(2.0), colw, Inches(4.85), LIGHT)
        _, tf = _box(s, x + Inches(0.2), Inches(2.12), colw - Inches(0.4), Inches(4.6))
        _emit_items(tf, items, base=16)
    return s


def slide_example(prs, kicker, title, label, lines, page_no, source=None):
    """范文 / 案例 卡片页。lines: list[str] 或 list[(text,style)]，style: t=小标题, q=引文, n。"""
    s = _blank(prs)
    _page_header(s, kicker, title, page_no)
    _rect(s, Inches(0.6), Inches(1.5), Inches(2.5), Inches(0.46), GOLD)
    _, tf = _box(s, Inches(0.7), Inches(1.54), Inches(2.3), Inches(0.4), MSO_ANCHOR.MIDDLE)
    _run(tf.paragraphs[0], label, H_FONT, 15, True, WHITE)
    _rect(s, Inches(0.6), Inches(2.0), Inches(12.1), Inches(4.75), CARD)
    _rect(s, Inches(0.6), Inches(2.0), Inches(0.1), Inches(4.75), GOLD)
    _, tf = _box(s, Inches(0.95), Inches(2.18), Inches(11.6), Inches(4.45))
    for i, ln in enumerate(lines):
        if isinstance(ln, tuple):
            text, st = ln
        else:
            text, st = ln, "q"
        p = _para(tf, i == 0); p.line_spacing = 1.3; p.space_after = Pt(3)
        if st == "t":
            _run(p, text, H_FONT, 16, True, BLUE)
        elif st == "n":
            _run(p, text, B_FONT, 15, False, GREY)
        else:
            _run(p, text, KAI, 16, False, INK)
    if source:
        _, tf = _box(s, Inches(0.95), Inches(6.78), Inches(11.6), Inches(0.3))
        _run(tf.paragraphs[0], source, B_FONT, 11, False, LGREY)
    return s


def slide_table(prs, kicker, title, headers, rows, page_no, widths=None, note=None):
    s = _blank(prs)
    _page_header(s, kicker, title, page_no)
    nrows, ncols = len(rows) + 1, len(headers)
    top = Inches(1.55)
    height = Inches(4.9) if note else Inches(5.2)
    gtbl = s.shapes.add_table(nrows, ncols, Inches(0.6), top, Inches(12.1), height).table
    gtbl.first_row = True
    if widths:
        total = sum(widths)
        for j, wgt in enumerate(widths):
            gtbl.columns[j].width = Inches(12.1 * wgt / total)
    for j, htext in enumerate(headers):
        c = gtbl.cell(0, j)
        c.fill.solid(); c.fill.fore_color.rgb = NAVY
        c.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf = c.text_frame; tf.word_wrap = True
        p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
        _run(p, htext, H_FONT, 14, True, WHITE)
    for i, row in enumerate(rows, start=1):
        for j, val in enumerate(row):
            c = gtbl.cell(i, j)
            c.fill.solid(); c.fill.fore_color.rgb = WHITE if i % 2 else LIGHT
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf = c.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER if j == 0 else PP_ALIGN.LEFT
            _run(p, val, B_FONT, 12.5, False, INK)
    if note:
        _, tf = _box(s, Inches(0.6), Inches(6.62), Inches(12.1), Inches(0.4))
        _run(tf.paragraphs[0], note, B_FONT, 12, False, LGREY)
    return s


def slide_closing(prs, kicker, title, items, page_no, tail=None):
    s = _blank(prs)
    _page_header(s, kicker, title, page_no)
    _, tf = _box(s, Inches(0.6), Inches(1.5), Inches(12.1), Inches(4.7))
    _emit_items(tf, items, base=18)
    if tail:
        _rect(s, Inches(0.6), Inches(6.2), Inches(12.1), Inches(0.75), NAVY)
        _, tf = _box(s, Inches(0.9), Inches(6.27), Inches(11.5), Inches(0.62), MSO_ANCHOR.MIDDLE)
        p = tf.paragraphs[0]
        _run(p, "思考  ", H_FONT, 15, True, GOLD)
        _run(p, tail, B_FONT, 15, False, WHITE)
    return s


# ----------------------------- 幻灯片调度 -----------------------------
def build_deck(meta, slides, out_path):
    prs = Presentation()
    prs.slide_width = SW
    prs.slide_height = SH
    page = 0
    for sp in slides:
        page += 1                      # 页码＝PowerPoint 实际页序（含封面/分节页）
        t = sp["type"]
        if t == "title":
            slide_title(prs, meta["course"], sp["tag"], sp["title"], sp["subtitle"],
                        meta["teacher"], sp.get("meta", ""))
        elif t == "section":
            slide_section(prs, sp["no"], sp["title"], sp.get("points"))
        else:
            kicker = sp.get("kicker", meta["kicker"])
            if t == "content":
                slide_content(prs, kicker, sp["title"], sp["items"], page,
                              sp.get("note"), sp.get("base", 18))
            elif t == "two_col":
                slide_two_col(prs, kicker, sp["title"], sp["lh"], sp["litems"],
                              sp["rh"], sp["ritems"], page)
            elif t == "example":
                slide_example(prs, kicker, sp["title"], sp.get("label", "范文"),
                              sp["lines"], page, sp.get("source"))
            elif t == "table":
                slide_table(prs, kicker, sp["title"], sp["headers"], sp["rows"], page,
                            sp.get("widths"), sp.get("note"))
            elif t == "closing":
                slide_closing(prs, kicker, sp["title"], sp["items"], page, sp.get("tail"))
            else:
                raise ValueError("未知幻灯片类型: " + t)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    prs.save(out_path)
    return len(slides)


# ----------------------------- Word 逐字讲稿 -----------------------------
def _dfont(run, font, size, bold=False, color=None):
    run.font.name = font
    run.font.size = DPt(size)
    run.font.bold = bold
    if color is not None:
        if not isinstance(color, DRGB):
            color = DRGB.from_string(str(color))   # 兼容 pptx 的 RGBColor
        run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rf = rpr.get_or_add_rFonts()
    rf.set(dqn("w:eastAsia"), font)


def _dpara(doc, align=None, before=0, after=4, line=1.5, indent_cm=None):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = DPt(before); pf.space_after = DPt(after)
    pf.line_spacing = line
    if align is not None:
        p.alignment = align
    if indent_cm is not None:
        pf.first_line_indent = Cm(indent_cm)
    return p


def build_script(meta, script_blocks, out_path):
    """
    script_blocks: list of dict:
      {"ref": "片1-2", "h": "小节标题", "paras": [..文本段..], "kind": "note"/None}
    kind=note 渲染为灰底提示（教学操作提示，不朗读）。
    """
    doc = docx.Document()
    # 默认样式
    st = doc.styles["Normal"]
    st.font.name = "仿宋"; st.font.size = DPt(14)
    st.element.rPr.rFonts.set(dqn("w:eastAsia"), "仿宋")
    sec = doc.sections[0]
    sec.left_margin = Cm(2.6); sec.right_margin = Cm(2.6)
    sec.top_margin = Cm(2.4); sec.bottom_margin = Cm(2.4)

    # 封面标题
    p = _dpara(doc, WD_ALIGN_PARAGRAPH.CENTER, before=6, after=2, line=1.2)
    _dfont(p.add_run(meta["course"]), "黑体", 15, True, RGBColor(0x20, 0x53, 0x8C))
    p = _dpara(doc, WD_ALIGN_PARAGRAPH.CENTER, after=2, line=1.2)
    _dfont(p.add_run(meta["lesson_tag"] + "  逐字讲稿"), "黑体", 20, True, RGBColor(0x14, 0x2A, 0x47))
    p = _dpara(doc, WD_ALIGN_PARAGRAPH.CENTER, after=10, line=1.2)
    title = meta["title"] if isinstance(meta["title"], str) else "  ".join(meta["title"])
    _dfont(p.add_run(title), "黑体", 16, True, RGBColor(0x14, 0x2A, 0x47))

    # 信息栏
    info = [
        ("对应教材", meta.get("textbook", "")),
        ("课时", meta.get("period", "")),
        ("本讲要点", meta.get("objective", "")),
        ("配套课件", meta.get("deck", "")),
    ]
    for k, v in info:
        if not v:
            continue
        p = _dpara(doc, after=2, line=1.3)
        _dfont(p.add_run("【%s】" % k), "黑体", 12, True, RGBColor(0xB6, 0x86, 0x2C))
        _dfont(p.add_run(v), "仿宋", 12, False, RGBColor(0x3E, 0x3E, 0x3E))

    # 分隔线
    p = _dpara(doc, after=8, line=1.0)
    _dfont(p.add_run("—" * 38), "宋体", 11, False, RGBColor(0xB0, 0xB0, 0xB0))

    wordcount = 0
    for blk in script_blocks:
        kind = blk.get("kind")
        if blk.get("h"):
            p = _dpara(doc, before=10, after=4, line=1.3)
            _dfont(p.add_run("◆ " + blk["h"]), "黑体", 14.5, True, RGBColor(0x20, 0x53, 0x8C))
            if blk.get("ref"):
                _dfont(p.add_run("　（对应幻灯片 " + blk["ref"] + "）"), "黑体", 10.5, False, RGBColor(0x86, 0x86, 0x86))
        elif blk.get("ref"):
            p = _dpara(doc, before=6, after=2, line=1.2)
            _dfont(p.add_run("〔幻灯片 " + blk["ref"] + "〕"), "黑体", 10.5, False, RGBColor(0x86, 0x86, 0x86))
        for para in blk.get("paras", []):
            wordcount += len(para)
            if kind == "note":
                pp = _dpara(doc, after=3, line=1.4, indent_cm=0)
                _dfont(pp.add_run("〔教学提示〕"), "黑体", 11.5, True, RGBColor(0xB6, 0x86, 0x2C))
                _dfont(pp.add_run(para), "楷体", 12.5, False, RGBColor(0x5A, 0x5A, 0x5A))
            else:
                pp = _dpara(doc, after=5, line=1.6, indent_cm=0.74)
                _dfont(pp.add_run(para), "仿宋", 14, False, RGBColor(0x22, 0x22, 0x22))

    # 字数统计脚注
    p = _dpara(doc, before=12, after=2, line=1.2)
    _dfont(p.add_run("（本讲讲稿正文约 %d 字）" % wordcount), "楷体", 11, False, RGBColor(0x86, 0x86, 0x86))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    doc.save(out_path)
    return wordcount


# ----------------------------- 一键渲染 -----------------------------
def render(meta, slides, script_blocks, deck_path, script_path):
    n = build_deck(meta, slides, deck_path)
    w = build_script(meta, script_blocks, script_path)
    print("  PPT  : %-52s %2d 页" % (os.path.basename(deck_path), n))
    print("  讲稿 : %-52s 约 %d 字" % (os.path.basename(script_path), w))
    return n, w
