#!/usr/bin/env python3
"""
analyze_profile.py — Summarize any flame graph profile format.

Supports: collapsed stack, speedscope JSON, Chrome cpuprofile.

Usage:
    python analyze_profile.py profile.speedscope.json
    python analyze_profile.py profile.cpuprofile
    python analyze_profile.py collapsed_stacks.txt
    python analyze_profile.py --format=collapsed profile.txt
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------

def parse_collapsed(path: Path) -> dict[tuple, int]:
    """Parse Brendan Gregg collapsed stack format. Returns {stack_tuple: count}."""
    stacks = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.rsplit(" ", 1)
        if len(parts) != 2:
            continue
        stack_str, count_str = parts
        frames = tuple(stack_str.split(";"))
        count = int(count_str)
        stacks[frames] = stacks.get(frames, 0) + count
    return stacks


def parse_speedscope(path: Path) -> dict[tuple, int]:
    """Parse speedscope JSON. Returns {stack_tuple: count}."""
    data = json.loads(path.read_text())
    stacks = {}

    for profile in data.get("profiles", []):
        frames = data.get("shared", {}).get("frames", [])

        if profile.get("type") == "sampled":
            for stack_idx, weight in zip(profile.get("samples", []), profile.get("weights", [])):
                if isinstance(stack_idx, list):
                    frame_names = tuple(frames[f]["name"] for f in stack_idx if f < len(frames))
                else:
                    frame_names = (frames[stack_idx]["name"],) if stack_idx < len(frames) else ()
                stacks[frame_names] = stacks.get(frame_names, 0) + weight

        elif profile.get("type") == "evented":
            open_stack = []
            for evt in profile.get("events", []):
                frame_idx = evt.get("frame", 0)
                frame_name = frames[frame_idx]["name"] if frame_idx < len(frames) else "?"
                if evt.get("type") == "O":
                    open_stack.append(frame_name)
                elif evt.get("type") == "C":
                    if open_stack:
                        open_stack.pop()
            if open_stack:
                stacks[tuple(open_stack)] = stacks.get(tuple(open_stack), 0) + 1

    return stacks


def parse_cpuprofile(path: Path) -> dict[tuple, int]:
    """Parse Chrome DevTools cpuprofile format. Returns {stack_tuple: count}."""
    data = json.loads(path.read_text())

    nodes = data.get("nodes", [])
    samples = data.get("samples", [])
    time_deltas = data.get("timeDeltas", [])

    # Build parent map
    parent_map = {}
    for node in nodes:
        nid = node["id"]
        parent_map[nid] = node.get("parent")

    stacks = defaultdict(int)
    for i, sample_id in enumerate(samples):
        # Walk up the tree
        frames = []
        cur = sample_id
        while cur is not None:
            node = next((n for n in nodes if n["id"] == cur), None)
            if node:
                cf = node.get("callFrame", {})
                name = cf.get("functionName", "?")
                frames.append(name)
            parent = parent_map.get(cur)
            if parent == cur:
                break
            cur = parent
        frames.reverse()
        weight = time_deltas[i] if i < len(time_deltas) else 1
        stacks[tuple(frames)] += weight

    return dict(stacks)


# ---------------------------------------------------------------------------

def aggregate(stacks: dict[tuple, int]) -> tuple[dict, dict, int]:
    """Compute self and total times per frame, plus grand total."""
    self_time = defaultdict(int)
    total_time = defaultdict(int)
    grand_total = 0

    for stack, count in stacks.items():
        grand_total += count
        for i, frame in enumerate(stack):
            self_time[frame] += count
        for i in range(len(stack)):
            for j in range(i, len(stack)):
                total_time[stack[j]] += count

    return dict(self_time), dict(total_time), grand_total


def print_report(path: Path, stacks: dict[tuple, int], top_n: int = 20):
    self_time, total_time, total = aggregate(stacks)

    print(f"\n{'='*60}")
    print(f" Profile: {path}")
    print(f" Total samples: {total:,}")
    print(f" Unique stacks: {len(stacks):,}")
    print(f"{'='*60}")

    # Top stacks
    print(f"\n{'TOP HOT STACKS':^60}")
    print(f"{'Rank':<6}{'Count':<10}{'Pct':<8}{'Stack'}")
    print(f"{'-'*6}{'-'*10}{'-'*8}{'-'*36}")
    sorted_stacks = sorted(stacks.items(), key=lambda x: -x[1])[:top_n]
    for rank, (stack, count) in enumerate(sorted_stacks, 1):
        pct = count / total * 100
        stack_str = " ; ".join(stack[-4:])  # show last 4 frames
        if len(stack) > 4:
            stack_str = f"... ; {stack_str}"
        print(f"{rank:<6}{count:<10}{pct:>5.1f}%  {stack_str}")

    # Top frames by self time
    print(f"\n{'TOP FRAMES BY SELF TIME':^60}")
    print(f"{'Rank':<6}{'Self':<10}{'Pct':<8}{'Total':<10}{'Frame'}")
    print(f"{'-'*6}{'-'*10}{'-'*8}{'-'*10}{'-'*26}")
    sorted_self = sorted(self_time.items(), key=lambda x: -x[1])[:top_n]
    for rank, (frame, st) in enumerate(sorted_self, 1):
        pct = st / total * 100
        tt = total_time.get(frame, st)
        print(f"{rank:<6}{st:<10}{pct:>5.1f}%  {tt:<10}{frame}")

    # Frames with highest self/total ratio (pure functions)
    print(f"\n{'TOP FRAMES BY SELF/TOTAL RATIO (>=3 samples)':^60}")
    print(f"{'Rank':<6}{'Self':<10}{'Total':<10}{'Ratio':<8}{'Frame'}")
    print(f"{'-'*6}{'-'*10}{'-'*10}{'-'*8}{'-'*26}")
    candidates = {f: (s, total_time[f]) for f, s in self_time.items()
                  if total_time[f] >= total * 0.01 and s >= 3}
    sorted_ratio = sorted(candidates.items(), key=lambda x: -(x[1][0] / x[1][1] if x[1][1] else 0))[:top_n]
    for rank, (frame, (st, tt)) in enumerate(sorted_ratio, 1):
        ratio = st / tt if tt else 0
        print(f"{rank:<6}{st:<10}{tt:<10}{ratio:>6.1%}  {frame}")


# ---------------------------------------------------------------------------

def detect_format(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore").strip()
    if text.startswith("{"):
        try:
            data = json.loads(text)
            if "$schema" in data or "profiles" in data:
                return "speedscope"
            elif "nodes" in data and "samples" in data:
                return "cpuprofile"
        except json.JSONDecodeError:
            pass
    return "collapsed"


def main():
    parser = argparse.ArgumentParser(description="Summarize flame graph profiles.")
    parser.add_argument("profile", type=Path, help="Profile file (speedscope, cpuprofile, or collapsed stack)")
    parser.add_argument("--format", choices=["speedscope", "cpuprofile", "collapsed"], help="Force format")
    parser.add_argument("--top", type=int, default=20, help="Number of top entries to show (default: 20)")
    args = parser.parse_args()

    if not args.profile.exists():
        print(f"Error: file not found: {args.profile}", file=sys.stderr)
        sys.exit(1)

    fmt = args.format or detect_format(args.profile)
    if fmt == "speedscope":
        stacks = parse_speedscope(args.profile)
    elif fmt == "cpuprofile":
        stacks = parse_cpuprofile(args.profile)
    else:
        stacks = parse_collapsed(args.profile)

    if not stacks:
        print("Error: no stacks found in profile.", file=sys.stderr)
        sys.exit(1)

    print_report(args.profile, stacks, top_n=args.top)


if __name__ == "__main__":
    main()
