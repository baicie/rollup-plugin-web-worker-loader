---
name: flamegraph-analysis
description: Analyze flame graphs and flame charts to identify performance bottlenecks. Use when profiling code, optimizing performance, reading CPU profiler output, or interpreting speedscope/cpuprofile/perf/flamegraph.pl output.
metadata:
  version: "2026.4.22"
---

# Flame Graph Analysis

Flame graphs visualize stack traces to show where time is spent. They reveal bottlenecks, hot paths, and deep call stacks at a glance.

## Topics

| Topic | Description | Reference |
|-------|-------------|-----------|
| Data Formats | Collapsed stack, speedscope JSON, Chrome cpuprofile | [formats](references/formats.md) |
| Reading Guide | How to interpret width, height, colors, plateaus | [reading](references/reading.md) |
| Tools | flamegraph.pl, speedscope, perf, Chrome DevTools | [tools](references/tools.md) |
| Examples | Real-world profile analysis walkthroughs | [examples](references/examples.md) |

## Quick Reference

### Flame Graph vs Flame Chart

| | Flame Graph | Flame Chart |
|--|------------|-------------|
| X-axis | **Population** (frequency of samples) | **Time** (chronological execution) |
| Sorting | Alphabetical, merges identical stacks | Temporal order, preserves call sequence |
| Purpose | Identify "hot" code paths | Understand execution timeline |
| Tools | `flamegraph.pl`, speedscope | Chrome DevTools Performance tab |

### Key Interpretation Rules

1. **Wider bar = more samples** (proportional to time spent)
2. **Top of stack (plateau)** = leaf function doing actual work
3. **Tall narrow tower** = deep call stack (recursion, excessive abstraction)
4. **Self time**: time spent in function itself; **Total time**: includes all children
5. **Base of wide tower** = root cause; investigate from leaf upward

### Common Patterns

| Pattern | Meaning | Action |
|---------|---------|--------|
| Wide flat top bar | Leaf function is the bottleneck | Optimize that function |
| Very tall narrow column | Deep recursion or abstraction | Reduce call depth |
| Wide bar in middle layer | Hot internal function | Check why it's called so often |
| Many small variations | High variance, not a clear bottleneck | Statistical noise |

### Supported Formats

- `speedscope.json` — speedscope interactive viewer
- `*.cpuprofile` — Chrome DevTools / Node.js inspector
- `perf.data` — Linux `perf` profiler
- Collapsed stack (flamegraph.pl input)
- Google Trace Event Format

View any of these at [https://speedscope.app](https://speedscope.app) for interactive exploration.

## Analysis Workflow

```
1. Load profile in speedscope.app (or open in DevTools)
2. Identify the widest bars — these consume the most time
3. Focus on top-of-stack plateaus (leaf nodes) first
4. Calculate Self vs Total time: bottleneck = large Self time
5. Trace back up the call stack to find the root cause
6. Compare before/after profiles to validate fixes
```

## Python Scripts

Located in `scripts/`. All scripts auto-detect format (speedscope JSON, cpuprofile, collapsed stack).

| Script | Purpose | Key Flags |
|--------|---------|-----------|
| `analyze_profile.py` | Summarize profile: top stacks, top frames by self/total time | `--top N`, `--format` |
| `top_hot_paths.py` | Walk call tree: show callees or callers for hot frames | `--depth N`, `--show callers\|callees`, `--stacks` |
| `diff_profiles.py` | Compare baseline vs current: regressions and improvements | `--top N` |
| `convert_format.py` | Convert between formats or merge multiple profiles | `--to collapsed\|speedscope`, `--merge` |

**Examples:**

```bash
# Summarize a profile
python scripts/analyze_profile.py profile.speedscope.json

# Find callers of the hottest function
python scripts/top_hot_paths.py profile.cpuprofile --show callers --depth 5

# Compare before vs after optimization
python scripts/diff_profiles.py before.json after.json --top 50

# Convert cpuprofile to speedscope
python scripts/convert_format.py profile.cpuprofile -o out.speedscope.json

# Merge multiple profiles
python scripts/convert_format.py a.json b.json c.json --merge -o merged.json
```
