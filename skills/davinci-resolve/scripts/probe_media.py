"""Read media metadata with ffprobe; writes JSON only to stdout."""

import argparse
import json
from pathlib import Path
import subprocess


def probe(path):
    source = Path(path).expanduser().resolve(strict=True)
    before = source.stat()
    completed = subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams",
         "-of", "json", str(source)],
        check=True, capture_output=True, text=True, timeout=120,
    )
    after = source.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise ValueError("source changed during probe")
    return {"path": str(source), "size": after.st_size,
            "mtime_ns": after.st_mtime_ns, "probe": json.loads(completed.stdout)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+")
    args = parser.parse_args()
    try:
        print(json.dumps([probe(path) for path in args.paths], indent=2))
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        parser.exit(1, str(error) + "\n")
