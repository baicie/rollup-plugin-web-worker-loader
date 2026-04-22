#!/usr/bin/env python3
"""
top_hot_paths.py — Find the hottest call paths from a profile.

Walks up/down the call stack to show bottlenecks at each level.
Works with: collapsed stack, speedscope JSON, Chrome cpuprofile.

Usage:
    python top_hot_paths.py profile.speedscope.json --depth 3 --top 30
    python top_hot_paths.py profile.cpuprofile --depth 5
    python top_hot_paths.py collapsed.txt --show=callers
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

    return _parse_collapsed(text, path)


def _parse_collapsed(text: str, path: Path = None) -> dict[tuple, int]:
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

def build_tree(stacks: dict[tuple, int]) -> dict:
    """Build a tree: {frame: {child_frame: total_count}}."""
    tree = defaultdict(lambda: defaultdict(int))
    for stack, count in stacks.items():
        for i in range(len(stack)):
            parent = stack[i - 1] if i > 0 else "<entry>"
            tree[parent][stack[i]] += count
    return dict(tree)


def show_paths(stacks: dict[tuple, int], depth: int = 4, top: int = 15, show: str = "callees"):
    """Show hot paths, optionally walking up (callers) or down (callees)."""
    tree = build_tree(stacks)
    total = sum(stacks.values())

    grand = defaultdict(int)
    for stack, count in stacks.items():
        for frame in stack:
            grand[frame] += count

    if show == "callers":
        # Walk UP: for each frame, find who calls it
        caller_tree = defaultdict(lambda: defaultdict(int))
        for stack, count in stacks.items():
            for i, frame in enumerate(stack):
                if i + 1 < len(stack):
                    caller_tree[frame][stack[i + 1]] += count  # parent (caller) -> child (this frame)
                else:
                    caller_tree[frame]["<root>"] += count
        tree = {k: dict(v) for k, v in caller_tree.items()}

    # Sort by total time
    sorted_frames = sorted(grand.items(), key=lambda x: -x[1])[:top]

    print(f"\n{'='*70}")
    print(f" Top {top} frames — showing {show} (depth={depth})")
    print(f" Total samples: {total:,}")
    print(f"{'='*70}")

    for frame, total_count in sorted_frames:
        pct = total_count / total * 100
        print(f"\n{pct:>5.1f}%  {total_count:>8,}  {frame}")
        print(f"{'─'*70}")

        callees = tree.get(frame, {})
        sorted_callees = sorted(callees.items(), key=lambda x: -x[1])[:depth]
        for child, child_count in sorted_callees:
            child_pct = child_count / total * 100
            bar = "█" * int(child_pct / total * 60)
            print(f"    {child_pct:>4.1f}%  {child_count:>7,}  {bar} {child}")


def show_stack_trees(stacks: dict[tuple, int], top: int = 10):
    """Show top complete stack trees."""
    total = sum(stacks.values())
    sorted_stacks = sorted(stacks.items(), key=lambda x: -x[1])[:top]

    print(f"\n{'='*70}")
    print(f" Top {top} complete call stacks")
    print(f"{'='*70}")

    for rank, (stack, count) in enumerate(sorted_stacks, 1):
        pct = count / total * 100
        print(f"\n#{rank}  {pct:>5.1f}%  {count:,} samples")
        for depth, frame in enumerate(stack):
            indent = "  " * depth
            print(f"  {indent}{indent}{frame}")


# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Find hottest call paths.")
    parser.add_argument("profile", type=Path, help="Profile file")
    parser.add_argument("--depth", type=int, default=4, help="Max callee/caller depth (default: 4)")
    parser.add_argument("--top", type=int, default=15, help="Number of top frames (default: 15)")
    parser.add_argument("--show", choices=["callees", "callers"], default="callees",
                        help="Walk down to callees or up to callers (default: callees)")
    parser.add_argument("--stacks", action="store_true", help="Show complete stack trees instead")
    args = parser.parse_args()

    if not args.profile.exists():
        print(f"Error: file not found: {args.profile}", file=sys.stderr)
        sys.exit(1)

    stacks = parse_profile(args.profile)
    if not stacks:
        print("Error: no stacks found.", file=sys.stderr)
        sys.exit(1)

    if args.stacks:
        show_stack_trees(stacks, top=args.top)
    else:
        show_paths(stacks, depth=args.depth, top=args.top, show=args.show)


if __name__ == "__main__":
    main()
