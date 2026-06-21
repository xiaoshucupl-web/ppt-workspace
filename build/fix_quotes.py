# -*- coding: utf-8 -*-
"""
内嵌引号修正工具。
写 lesson_XX.py 时，正文里的强调/引用可直接用普通 ASCII 双引号，
本工具把"字符串内部"的引号转成全角“”，而把 Python 字符串分隔符保持为 ASCII，
从而避免中文引号被误判为分隔符导致语法错误。

判据（状态机）：处于字符串内部时遇到 " ，若其后第一个非空白字符属于
 , ) ] : }  或换行/文件尾，则视为分隔符；否则视为内嵌引号，转全角（成对toggle）。
用法：python3 build/fix_quotes.py build/lesson_07.py
"""
import sys, py_compile


def fix(path):
    src = open(path, encoding="utf-8").read()
    out = []
    in_str = False
    toggle = 0
    n = len(src)

    def nxt(j):
        while j < len(src) and src[j] in " \t":
            j += 1
        return "\n" if j >= len(src) else src[j]

    conv = 0
    i = 0
    while i < n:
        c = src[i]
        if c == '"':
            if not in_str:
                in_str = True
                toggle = 0
                out.append('"')
            else:
                if nxt(i + 1) in ",)]:}\n\r":
                    in_str = False
                    out.append('"')
                else:
                    out.append("“" if toggle % 2 == 0 else "”")
                    toggle += 1
                    conv += 1
        else:
            out.append(c)
        i += 1
    open(path, "w", encoding="utf-8").write("".join(out))
    py_compile.compile(path, doraise=True)
    print("修正内嵌引号 %d 处，语法编译通过：%s" % (conv, path))


if __name__ == "__main__":
    for p in sys.argv[1:]:
        fix(p)
