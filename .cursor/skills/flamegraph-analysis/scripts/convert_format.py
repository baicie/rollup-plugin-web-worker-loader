#!/usr/bin/env python3
"""
convert_format.py — Convert between flame graph profile formats.

Supported conversions:
  - collapsed  <-> speedscope
  - cpuprofile -> speedscope
  - speedscope -> collapsed

Usage:
    python convert_format.py profile.cpuprofile -o out.speedscope.json
    python convert_format.py collapsed.txt -o out.speedscope.json
    python convert_format.py profile.speedscope.json --to collapsed -o out.txt
    python convert_format.py a.speedscope.json b.speedscope.json -o merged.speedscope.json
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------

def parse_collapsed(text: str) -> list[tuple[tuple, int]]:
    """Parse collapsed stack format. Returns list of (stack_tuple, count)."""
    stacks = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.rsplit(" ", 1)
        if len(parts) != 2:
            continue
        stacks.append((tuple(parts[0].split(";")), int(parts[1])))
    return stacks


def parse_speedscope(data: dict) -> list[tuple[tuple, int]]:
    """Parse speedscope JSON. Returns list of (stack_tuple, count)."""
    stacks = []
    frames = data.get("shared", {}).get("frames", [])

    for profile in data.get("profiles", []):
        if profile.get("type") == "sampled":
            for stack_idx, weight in zip(profile.get("samples", []), profile.get("weights", [])):
                if isinstance(stack_idx, list):
                    frame_names = tuple(frames[f]["name"] for f in stack_idx if f < len(frames))
                else:
                    frame_names = (frames[stack_idx]["name"],) if stack_idx < len(frames) else ()
                stacks.append((frame_names, weight))
        elif profile.get("type") == "evented":
            open_stack = []
            for evt in profile.get("events", []):
                frame_idx = evt.get("frame", 0)
                name = frames[frame_idx]["name"] if frame_idx < len(frames) else "?"
                if evt.get("type") == "O":
                    open_stack.append(name)
                elif evt.get("type") == "C" and open_stack:
                    open_stack.pop()
            if open_stack:
                stacks.append((tuple(open_stack), 1))

    return stacks


def parse_cpuprofile(data: dict) -> list[tuple[tuple, int]]:
    """Parse cpuprofile format. Returns list of (stack_tuple, count)."""
    nodes = data.get("nodes", [])
    parent_map = {n["id"]: n.get("parent") for n in nodes}
    stacks = []

    for sample_id in data.get("samples", []):
        frames = []
        cur = sample_id
        visited = set()
        while cur is not None and cur not in visited:
            visited.add(cur)
            node = next((n for n in nodes if n["id"] == cur), None)
            if node:
                frames.append(node.get("callFrame", {}).get("functionName", "?"))
            parent = parent_map.get(cur)
            if parent == cur:
                break
            cur = parent
        frames.reverse()
        stacks.append((tuple(frames), 1))

    return stacks


def read_input(path: Path):
    """Auto-detect format and parse. Returns list of (stack, count)."""
    text = path.read_text(encoding="utf-8", errors="ignore").strip()

    if text.startswith("{"):
        try:
            data = json.loads(text)
            if "$schema" in data or "profiles" in data:
                return parse_speedscope(data)
            elif "nodes" in data:
                return parse_cpuprofile(data)
        except json.JSONDecodeError:
            pass

    return parse_collapsed(text)


# ---------------------------------------------------------------------------

def to_collapsed(stacks: list[tuple[tuple, int]]) -> str:
    """Convert to collapsed stack format."""
    lines = [f"{';'.join(stack)} {count}" for stack, count in stacks]
    return "\n".join(lines)


def to_speedscope(stacks: list[tuple[tuple, int]], name: str = "converted") -> str:
    """Convert to speedscope JSON format."""
    # Build frame index
    frame_map = {}
    frames = []
    for stack, _ in stacks:
        for frame in stack:
            if frame not in frame_map:
                frame_map[frame] = len(frames)
                frames.append({"name": frame})

    # Build sampled profile
    samples = []
    weights = []
    for stack, count in stacks:
        sample = [frame_map[f] for f in stack if f in frame_map]
        samples.append(sample)
        weights.append(count)

    data = {
        "$schema": "https://www.speedscope.app/file-format-schema.json",
        "shared": {"frames": frames},
        "profiles": [{
            "type": "sampled",
            "name": name,
            "unit": "count",
            "startValue": 0,
            "endValue": len(samples),
            "samples": samples,
            "weights": weights,
        }],
        "activeProfileIndex": 0,
    }
    return json.dumps(data, indent=2)


# ---------------------------------------------------------------------------

def merge_profiles(paths: list[Path]) -> list[tuple[tuple, int]]:
    """Merge multiple profiles by summing counts for identical stacks."""
    merged = defaultdict(int)
    for path in paths:
        for stack, count in read_input(path):
            merged[stack] += count
    return [(stack, count) for stack, count in merged.items()]


# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Convert flame graph profile formats.")
    parser.add_argument("input", nargs="+", type=Path, help="Input profile file(s)")
    parser.add_argument("-o", "--output", type=Path, help="Output file (default: stdout)")
    parser.add_argument("--from", dest="from_fmt", choices=["auto", "collapsed", "speedscope", "cpuprofile"],
                        default="auto", help="Input format (default: auto-detect)")
    parser.add_argument("--to", choices=["collapsed", "speedscope"], default="speedscope",
                        help="Output format (default: speedscope)")
    parser.add_argument("--name", default="converted", help="Profile name for speedscope output")
    parser.add_argument("--merge", action="store_true", help="Merge all input files into one output")
    args = parser.parse_args()

    for p in args.input:
        if not p.exists():
            print(f"Error: file not found: {p}", file=sys.stderr)
            sys.exit(1)

    if args.merge:
        stacks = merge_profiles(args.input)
    else:
        stacks = read_input(args.input[0])

    if not stacks:
        print("Error: no stacks found.", file=sys.stderr)
        sys.exit(1)

    if args.to == "collapsed":
        output = to_collapsed(stacks)
    else:
        output = to_speedscope(stacks, name=args.name)

    if args.output:
        args.output.write_text(output)
        print(f"Written: {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
