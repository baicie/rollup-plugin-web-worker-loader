#!/usr/bin/env python3
"""
diff_profiles.py — Compare two flame graph profiles to find what changed.

Usage:
    python diff_profiles.py baseline.json optimized.json
    python diff_profiles.py before.cpuprofile after.cpuprofile --format=cpuprofile
    python diff_profiles.py a.txt b.txt --format=collapsed --top 50
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------

def parse_profile(path: Path) -> dict[tuple, int]:
    """Parse any supported format into {stack_tuple: count}."""
    text = path.read_text(encoding="utf-8", errors="ignore").strip()

    if text.startswith("{"):
        try:
            data = json.loads(text)
            if "$schema" in data or "profiles" in data:
                return _parse_speedscope(data)
            elif "nodes" in data:
                return _parse_cpuprofile(data)
        except json.JSONDecodeError:
            pass

    return _parse_collapsed(text)


def _parse_collapsed(text: str) -> dict[tuple, int]:
    stacks = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.rsplit(" ", 1)
        if len(parts) != 2:
            continue
        stacks[tuple(parts[0].split(";"))] = stacks.get(tuple(parts[0].split(";")), 0) + int(parts[1])
    return stacks


def _parse_speedscope(data: dict) -> dict[tuple, int]:
    stacks = {}
    frames = data.get("shared", {}).get("frames", [])
    for profile in data.get("profiles", []):
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
                name = frames[frame_idx]["name"] if frame_idx < len(frames) else "?"
                if evt.get("type") == "O":
                    open_stack.append(name)
                elif evt.get("type") == "C" and open_stack:
                    open_stack.pop()
            if open_stack:
                stacks[tuple(open_stack)] = stacks.get(tuple(open_stack), 0) + 1
    return stacks


def _parse_cpuprofile(data: dict) -> dict[tuple, int]:
    nodes = data.get("nodes", [])
    parent_map = {n["id"]: n.get("parent") for n in nodes}
    stacks = defaultdict(int)
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
        stacks[tuple(frames)] += 1
    return dict(stacks)


# ---------------------------------------------------------------------------

def align_normalize(stacks_a: dict, stacks_b: dict) -> tuple[dict, dict]:
    """Align stacks with different total counts by normalizing to percentages."""
    total_a = sum(stacks_a.values()) or 1
    total_b = sum(stacks_b.values()) or 1

    norm_a = {k: v / total_a * 100 for k, v in stacks_a.items()}
    norm_b = {k: v / total_b * 100 for k, v in stacks_b.items()}
    return norm_a, norm_b


def compute_frame_deltas(stacks_a: dict, stacks_b: dict):
    """Compute per-frame delta (B - A) for all frames across both profiles."""
    # Aggregate frame counts from stacks
    frame_a = defaultdict(int)
    frame_b = defaultdict(int)
    total_a = sum(stacks_a.values()) or 1
    total_b = sum(stacks_b.values()) or 1

    for stack, count in stacks_a.items():
        for frame in stack:
            frame_a[frame] += count
    for stack, count in stacks_b.items():
        for frame in stack:
            frame_b[frame] += count

    # Normalize to percentage of total
    all_frames = set(frame_a) | set(frame_b)
    deltas = {}
    for frame in all_frames:
        pct_a = frame_a[frame] / total_a * 100
        pct_b = frame_b[frame] / total_b * 100
        deltas[frame] = (pct_a, pct_b, pct_b - pct_a)

    return deltas


def print_diff(baseline: Path, current: Path, top: int = 30):
    stacks_a = parse_profile(baseline)
    stacks_b = parse_profile(current)

    total_a = sum(stacks_a.values())
    total_b = sum(stacks_b.values())

    print(f"\n{'='*70}")
    print(f" Baseline: {baseline}  ({total_a:,} samples)")
    print(f" Current:  {current}  ({total_b:,} samples)")
    print(f"{'='*70}")

    deltas = compute_frame_deltas(stacks_a, stacks_b)

    # Sort: biggest regressions first (positive delta = more time = regression)
    sorted_deltas = sorted(deltas.items(), key=lambda x: -(x[1][2]))

    print(f"\n{'REGRESSIONS (more time in current)':^70}")
    print(f"{'Frame':<40}{'Baseline%':<12}{'Current%':<12}{'Delta'}")
    print(f"{'-'*40}{'-'*12}{'-'*12}{'-'*8}")
    regressions = [(f, pcts) for f, pcts in sorted_deltas if pcts[2] > 0.1]
    for frame, (pct_a, pct_b, delta) in regressions[:top]:
        sign = "+" if delta > 0 else ""
        print(f"{frame:<40}{pct_a:>8.2f}%  {pct_b:>8.2f}%  {sign}{delta:>5.2f}%")

    print(f"\n{'IMPROVEMENTS (less time in current)':^70}")
    print(f"{'Frame':<40}{'Baseline%':<12}{'Current%':<12}{'Delta'}")
    print(f"{'-'*40}{'-'*12}{'-'*12}{'-'*8}")
    improvements = [(f, pcts) for f, pcts in sorted_deltas if pcts[2] < -0.1]
    improvements.sort(key=lambda x: x[1][2])  # most improved first
    for frame, (pct_a, pct_b, delta) in improvements[:top]:
        print(f"{frame:<40}{pct_a:>8.2f}%  {pct_b:>8.2f}%  {delta:>6.2f}%")

    # Stack-level diff (top changed stacks)
    norm_a, norm_b = align_normalize(stacks_a, stacks_b)
    all_stacks = set(norm_a) | set(norm_b)
    stack_deltas = []
    for stack in all_stacks:
        pa = norm_a.get(stack, 0)
        pb = norm_b.get(stack, 0)
        delta = pb - pa
        if abs(delta) > 0.5:
            stack_deltas.append((stack, pa, pb, delta))

    stack_deltas.sort(key=lambda x: -(x[3]))
    print(f"\n{'TOP CHANGED STACKS':^70}")
    print(f"{'Pct(B)':<10}{'Pct(A)':<10}{'Delta':<8}{'Stack'}")
    print(f"{'-'*10}{'-'*10}{'-'*8}{'-'*42}")
    shown = 0
    for stack, pa, pb, delta in stack_deltas:
        if shown >= top:
            break
        sign = "+" if delta > 0 else ""
        stack_str = " ; ".join(stack[-5:]) if len(stack) > 5 else " ; ".join(stack)
        if len(stack) > 5:
            stack_str = f"... ; {stack_str}"
        print(f"{pb:>7.2f}%  {pa:>7.2f}%  {sign}{delta:>5.2f}%  {stack_str}")
        shown += 1


# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Compare two flame graph profiles.")
    parser.add_argument("baseline", type=Path, help="Baseline profile (before)")
    parser.add_argument("current", type=Path, help="Current profile (after)")
    parser.add_argument("--top", type=int, default=30, help="Number of top changes (default: 30)")
    args = parser.parse_args()

    for p in [args.baseline, args.current]:
        if not p.exists():
            print(f"Error: file not found: {p}", file=sys.stderr)
            sys.exit(1)

    print_diff(args.baseline, args.current, top=args.top)


if __name__ == "__main__":
    main()
