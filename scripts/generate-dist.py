#!/usr/bin/env python3
"""Generate per-agent files from portable rule markdown.

Cursor gets always-on .mdc files. Codex concatenation is a later PR.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

FRONTMATTER_RE = re.compile(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n)?(.*)\Z", re.DOTALL)
ALWAYS_APPLY_RE = re.compile(r"^alwaysApply\s*:")
README_NAMES = {"readme.md"}


def parse_rule(text: str) -> tuple[str | None, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return None, text
    return match.group(1), match.group(2)


def cursor_frontmatter(raw: str | None) -> str:
    lines: list[str] = []
    if raw:
        for line in raw.splitlines():
            if ALWAYS_APPLY_RE.match(line):
                continue
            lines.append(line)
    lines.append("alwaysApply: true")
    return "---\n" + "\n".join(lines) + "\n---\n"


def render_cursor_rule(text: str) -> str:
    frontmatter, body = parse_rule(text)
    body = body.lstrip("\n")
    if body and not body.endswith("\n"):
        body += "\n"
    return cursor_frontmatter(frontmatter) + ("\n" + body if body else "\n")


def generate_cursor_rules(source_dir: Path, dest_dir: Path) -> list[Path]:
    if not source_dir.is_dir():
        raise FileNotFoundError(f"rules directory not found: {source_dir}")

    dest_dir.mkdir(parents=True, exist_ok=True)
    for old in dest_dir.glob("*.mdc"):
        old.unlink()

    written: list[Path] = []
    for src in sorted(source_dir.glob("*.md")):
        if src.name.lower() in README_NAMES:
            continue
        dest = dest_dir / f"{src.stem}.mdc"
        dest.write_text(render_cursor_rule(src.read_text(encoding="utf-8")), encoding="utf-8")
        written.append(dest)
    return written


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Repository root (default: parent of scripts/)",
    )
    parser.add_argument(
        "--cursor-out",
        type=Path,
        default=None,
        help="Cursor rules output directory (default: <root>/dist/cursor/rules)",
    )
    args = parser.parse_args(argv)

    root = args.root.resolve()
    cursor_out = (args.cursor_out or root / "dist" / "cursor" / "rules").resolve()
    written = generate_cursor_rules(root / "rules", cursor_out)
    print(f"Wrote {len(written)} Cursor rule(s) to {cursor_out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
