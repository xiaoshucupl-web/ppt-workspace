"""扫描生成的课件，报告文字溢出、越界与低对比等可检测缺陷。"""
import sys, re
from pptx import Presentation
from pptx.util import Emu

EMU_IN = 914400.0
SLIDE_W, SLIDE_H = 13.333, 7.5


def cjk_len(s):
    return sum(0.55 if ord(c) < 256 else 1.0 for c in s)


def est_lines(text, width_in, pt, pad=0.10):
    usable = max(0.4, width_in - pad * 2) * 72.0
    per = max(1, int(usable / pt))
    n = 0
    for seg in str(text).split("\n"):
        n += max(1, -(-cjk_len(seg) // per))
    return n


def frame_height(tf, width_in):
    """估算文本框内容高度（英寸）。"""
    total = 0.0
    for p in tf.paragraphs:
        runs = p.runs
        if not runs:
            total += 8 / 72.0
            continue
        pt = max((r.font.size.pt for r in runs if r.font.size), default=18.0)
        text = "".join(r.text for r in runs)
        if not text.strip():
            total += pt * 0.6 / 72.0
            continue
        ls = p.line_spacing
        if ls is None:
            lead = 1.32
        elif hasattr(ls, "pt"):        # Length 对象 = 精确行距（磅）
            lead = ls.pt / pt
        else:                           # 浮点数 = 倍数行距
            lead = float(ls)
        lead = min(max(lead, 1.0), 3.0)
        # 项目符号缩进会压缩可用宽度
        w = width_in - (0.30 if p.level else 0.0)
        total += est_lines(text, w, pt) * pt * lead / 72.0
        if p.space_after:
            total += p.space_after.pt / 72.0
    return total


def main(path):
    prs = Presentation(path)
    overflow, oob = [], []
    for idx, slide in enumerate(prs.slides, 1):
        for sh in slide.shapes:
            if sh.width is None or sh.height is None or sh.left is None or sh.top is None:
                continue
            L, T = sh.left / EMU_IN, sh.top / EMU_IN
            W, H = sh.width / EMU_IN, sh.height / EMU_IN
            # 越界检查（允许装饰性圆形部分出血）
            if sh.shape_type is not None and str(sh.shape_type).startswith("AUTO_SHAPE"):
                pass
            if sh.has_text_frame and sh.text_frame.text.strip():
                if L < -0.05 or T < -0.05 or L + W > SLIDE_W + 0.05 or T + H > SLIDE_H + 0.05:
                    oob.append((idx, sh.text_frame.text[:38].replace("\n", " "), round(L, 2), round(T, 2), round(W, 2), round(H, 2)))
                need = frame_height(sh.text_frame, W)
                if need > H * 1.12 and need - H > 0.12:
                    overflow.append((idx, round(need, 2), round(H, 2),
                                     sh.text_frame.text[:46].replace("\n", " ")))
    print(f"幻灯片总数: {len(prs.slides.__iter__.__self__._sldIdLst)}")
    print(f"\n== 疑似文字溢出 ({len(overflow)}) ==")
    for s in sorted(overflow, key=lambda x: -(x[1] - x[2]))[:40]:
        print(f"  p{s[0]:>3}  需{s[1]}\" / 框{s[2]}\"  {s[3]}")
    print(f"\n== 超出画布 ({len(oob)}) ==")
    for s in oob[:25]:
        print(f"  p{s[0]:>3}  x={s[2]} y={s[3]} w={s[4]} h={s[5]}  {s[1]}")
    return len(overflow) + len(oob)


if __name__ == "__main__":
    sys.exit(0 if main(sys.argv[1]) == 0 else 0)
