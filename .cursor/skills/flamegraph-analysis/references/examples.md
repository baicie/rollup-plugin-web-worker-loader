---
name: flamegraph-examples
description: Real-world flame graph analysis examples: finding bottlenecks, O(n²), GC, lazy loading, regex
---

# Analysis Examples

## Example 1: Hot Function at Top

**Profile shows:**

```
|___________json.parse___________|  (30% of total time)
  |_______main_______|
```

**Interpretation:** `json.parse` is the leaf, consuming 30% of all samples. This is unusual — it's the actual work.

**Diagnosis:** Parse is called on massive JSON payloads.

**Fix:**

```js
// Before: parse on every request
const data = JSON.parse(largePayload)

// After: parse lazily, or cache
const data = useMemo(() => JSON.parse(payload), [key])
```

## Example 2: Deep Call Stack

**Profile shows:**

```
|a||b||c||d||e||f||g||h||i||j|
```

Deep stack (10+ levels). Look at the top to see if it's actually slow.

**Diagnosis:** Middleware chain / decorator pattern / Redux selectors

**Fix:** Flatten if possible. Check each layer for actual work.

## Example 3: O(n²) Algorithm

**Profile shows:**

```
|_______________outer_______________|
  |inner|inner|inner|inner|inner|  (many samples, each small)
```

`inner` appears many times in the same parent → loop inside a loop.

**Fix:**

```js
// Before: O(n²)
for (const a of arr) {
  for (const b of arr) {
    if (a.id === b.id) result.push(a)
  }
}

// After: O(n) with Map
const map = new Map(arr.map(a => [a.id, a]))
for (const a of arr) {
  if (map.has(a.id)) result.push(a)
}
```

## Example 4: GC Pressure

**Profile shows:**

Many small bars across different allocations, or `MarkSweep::Collect` / `GC` visible in native traces.

**Diagnosis:** Creating too many short-lived objects → frequent GC pauses.

**Fix:**

```js
// Before: creates 1000 objects per frame
const points = data.map(d => ({ x: d.x, y: d.y }))

// After: reuse or use typed arrays
const xs = new Float64Array(data.map(d => d.x))
const ys = new Float64Array(data.map(d => d.y))
```

## Example 5: Regex on Every Call

**Profile shows:**

```
|______RegExp.test______|
  |_____process______|
```

**Diagnosis:** Regex compiled inside a function called in a loop.

**Fix:**

```js
// Before: re-compile regex every call
function validate(items) {
  return items.filter(item => /^\w+@\w+\.\w+$/.test(item.email))
}

// After: compile once
const EMAIL_RE = /^\w+@\w+\.\w+$/
function validate(items) {
  return items.filter(item => EMAIL_RE.test(item.email))
}
```

## Example 6: Lazy Loading in Hot Path

**Profile shows:**

```
|____require____|  (20% of time)
  |____init____|
```

`require` (or dynamic `import()`) appearing in a hot path during initial load.

**Fix:** Move `require`/`import` calls to the top level. Use code splitting with `React.lazy` / `loadable` but preload early.

## Example 7: Heavy List Rendering

**Profile shows:**

```
|_______render_______|
  |map|map|map|map|  (many render calls)
```

Excessive re-renders or rendering large lists without virtualization.

**Fix:**

```jsx
// Virtualize large lists
import { FixedSizeList } from 'react-window'

// Or memoize
const Item = React.memo(({ data }) => <div>{data.value}</div>)
```

## Example 8: Before/After Comparison

To validate a fix, generate flame graphs before and after.

```bash
# Before
./flamegraph.pl before.txt > before.svg

# After
./flamegraph.pl after.txt > after.svg

# Diff (requires both profiles from same run length)
./flamegraph.pl --inverted before.txt > b.txt
./flamegraph.pl --inverted after.txt > a.txt
diff -u b.txt a.txt | ./FlameGraph/flamediff.pl > diff.svg
```

A diff graph: red = slower, green = faster.

## Common Bottleneck Signatures

| Signature | Likely Cause |
|-----------|-------------|
| Tall tower, narrow top | Deep recursion / loops |
| Wide middle layer | Hot internal function |
| Many thin bars | GC, event handlers, timers |
| `JSON.parse` / `JSON.stringify` top | Large payload processing |
| `sort` top | Sorting large arrays |
| `RegExp` top | Complex regex on large input |
| `map` / `filter` / `reduce` chain | Functional programming overhead |
| `render` / `update` / `setState` | UI framework overhead |
| `crypto` / `hash` top | Heavy encryption / hashing |
