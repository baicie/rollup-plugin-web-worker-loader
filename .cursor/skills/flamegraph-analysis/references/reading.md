---
name: flamegraph-reading
description: How to read flame graphs: interpreting width, height, colors, plateaus, self vs total time
---

# Reading Flame Graphs

## Axes

| Axis | Meaning |
|------|---------|
| **X-axis** | Width = proportion of samples / time. Sorted alphabetically in flame graphs, chronologically in flame charts. |
| **Y-axis** | Stack depth. Top = leaf functions. Bottom = entry point (main, _start). |

## Width — Time Spent

**The single most important signal.**

- **Wider bar** = more samples = more time spent in that function
- Width is proportional across all siblings (same parent level)
- Width can exceed parent (when multiple children are wide) — this is normal

### Width Interpretation

```
|___________main___________|  (100% total samples, root)
  |__A__||__B__||__C__|    (A=40%, B=35%, C=25%)
    |D|  |__E__|  |F|      (D=15%, E=20%, F=10%)
         |G|                (G=10% of total, but 50% of B's time)
```

## Height — Stack Depth

- Higher = deeper in call stack
- Deep stacks indicate: recursion, high-order functions, middleware chains
- Tall narrow towers = not necessarily a problem (just deep), but look for wide tops

## Self vs Total Time

This distinction is critical for finding the actual bottleneck.

| Metric | Definition | What it reveals |
|--------|-----------|-----------------|
| **Total Time** | Time in function + time in all callees | How expensive the entire function subtree is |
| **Self Time** | Time spent directly in the function | Actual work done by this function itself |

**The formula:** `Total Time = Self Time + Sum(Children Time)`

### Example

```
render: Total=80ms, Self=5ms
  ├── calculate: Total=40ms, Self=30ms
  │     └── compute: Total=10ms, Self=10ms
  └── format: Total=35ms, Self=35ms
```

- `render` has high Total (80ms) but low Self (5ms) — it's a thin wrapper
- `calculate` is expensive — but its child `compute` is NOT (10ms)
- `format` is genuinely expensive — 35ms of Self time

**Rule:** Large Total + small Self → children are the bottleneck.
**Rule:** Large Self → that function is the bottleneck.

## Colors

Colors are typically cosmetic, but some conventions exist:

| Color scheme | Used by | Meaning |
|-------------|---------|---------|
| Hue by library | Default flamegraph.pl | Color varies by package |
| Red = JavaScript | Chrome DevTools | Hot (active) code |
| Yellow = native | Chrome DevTools | V8 / native code |
| Green = idle | Chrome DevTools | Browser idle time |
| Purple = rendering | Chrome DevTools | Layout, paint |

**In flamegraph.pl**, colors are assigned by hash of the function name — identical functions get identical colors, making it easy to spot patterns across the graph.

## Plateaus — The Key to Finding Bottlenecks

A **plateau** is a wide, flat-topped bar at the top of a tower. This is the leaf function — the function doing actual work.

```
|________________________topFunc________________________|  ← wide plateau = bottleneck
  |___a___|  |___b___|  |___c___|  |___d___|           ← different call paths
```

**Look for flat tops at the widest layer.** The bottleneck is at the leaf, not the caller.

### Tricky Cases

**Case 1: Many narrow towers**

```
|a|  |b|  |c|  |d|  |e|
```

High variance — no single hot path. Often indicates GC pressure, timer callbacks, or I/O.

**Case 2: Widest bar in middle layer**

```
|_______________main_______________|
  |_____A_____|  |_____B_____|
    |C|            |D|
```

If `A` and `B` are wide but `C` and `D` are thin, the bottleneck is inside `A` and `B` themselves (their self time).

**Case 3: Single tower, root is widest**

Usually means one call site dominates. Check who calls it.

## Investigating a Bottleneck

```
1. Identify widest bar (highest self time at top)
2. Note the function name
3. Trace downward to see all callers
4. Ask: Why is this function called so often?
   - Called in a loop?     → Move work out of loop
   - Redundant calls?      → Cache (memoize)
   - Expensive primitive?  → Use faster alternative
   - O(n²) algorithm?      → Optimize to O(n log n) or O(n)
   - Blocking I/O?         → Make async
```
