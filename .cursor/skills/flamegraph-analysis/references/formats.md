---
name: flamegraph-formats
description: Flame graph data formats: collapsed stack, speedscope JSON, cpuprofile, perf, Google Trace Event
---

# Data Formats

## 1. Collapsed Stack Format (Brendan Gregg)

Simple, line-based. Used by `flamegraph.pl`.

```
stack;trace;frame  sample_count
main;App.render;Component.update 5
main;App.render;Component.update 5
main;App.render;Component.calculate 4
main;App.render;helper;calculate 3
```

- Each line = one stack trace (most recent frame last, root first)
- Frames separated by `;`
- Space then integer = weight (sample count)
- To generate: use `$PROGRAM --dtrace` or `$PROGRAM --perf` or custom instrumentation

## 2. Speedscope JSON (`speedscope.json`)

Interactive viewer format. Schema at `https://www.speedscope.app/file-format-schema.json`.

### File Structure

```json
{
  "$schema": "https://www.speedscope.app/file-format-schema.json",
  "shared": {
    "frames": [
      { "name": "main", "file": "index.js", "line": 1, "col": 0 }
    ]
  },
  "profiles": [
    {
      "type": "sampled",
      "name": "CPU",
      "unit": "milliseconds",
      "startValue": 0,
      "endValue": 100,
      "samples": [[0], [0, 1], [0, 2]],
      "weights": [10, 20, 15]
    }
  ],
  "activeProfileIndex": 0
}
```

### Two Profile Types

**`sampled`** — periodic sampling. `samples` is array of stacks (frame indices), `weights` is sample count per stack.

```json
{
  "type": "sampled",
  "unit": "milliseconds",
  "startValue": 0,
  "endValue": 1000,
  "samples": [[0, 1, 2], [0, 1, 3], [0, 4]],
  "weights": [10, 5, 15]
}
```

**`evented`** — explicit open/close events (O/C). Useful for async/await timelines.

```json
{
  "type": "evented",
  "unit": "microseconds",
  "startValue": 0,
  "endValue": 1000,
  "events": [
    { "type": "O", "at": 0, "frame": 0 },
    { "type": "O", "at": 10, "frame": 1 },
    { "type": "C", "at": 50, "frame": 1 },
    { "type": "C", "at": 60, "frame": 0 }
  ]
}
```

### Value Units

`speedscope` supports: `none`, `nanoseconds`, `microseconds`, `milliseconds`, `seconds`, `bytes`

### Frame Object

```json
{ "name": "funcName", "file": "file.js", "line": 10, "col": 5 }
```

All fields optional. `name` is required.

## 3. Chrome DevTools CPU Profile (`*.cpuprofile`)

Node.js `--inspect` / Chrome DevTools format.

```json
{
  "nodes": [
    { "id": 1, "callFrame": { "functionName": "main", "url": "index.js", "lineNumber": 0 } },
    { "id": 2, "callFrame": { "functionName": "render", "url": "app.js", "lineNumber": 5 }, "parent": 1 }
  ],
  "startTime": 0,
  "endTime": 1000,
  "samples": [1, 2, 1, 2, 1],
  "timeDeltas": [10, 5, 10, 5, 10]
}
```

- `nodes`: function definitions with `callFrame` (functionName, url, lineNumber, columnNumber)
- `samples`: node IDs in execution order
- `timeDeltas`: microseconds since last sample

## 4. perf (Linux)

Linux profiler output. Convert with `perf script --input=perf.data --output=stacks.txt`.

```bash
# Generate
sudo perf record -F 99 -a -g -- sleep 30
perf script --input=perf.data > stacks.txt

# Visualize with flamegraph.pl
git clone https://github.com/brendangregg/FlameGraph
./FlameGraph/stackcollapse-perf.pl stacks.txt | ./FlameGraph/flamegraph.pl > out.svg
```

## 5. Google Trace Event Format

Used by `chrome://tracing`. Supported events: `B` (begin), `E` (end), `X` (complete), `M` (metadata).

```json
[
  { "name": "funcA", "cat": "PERF", "ts": 1000, "ph": "B" },
  { "name": "funcA", "cat": "PERF", "ts": 1500, "ph": "E" },
  { "name": "funcB", "cat": "PERF", "ts": 1200, "dur": 500, "ph": "X" }
]
```

## Converting Between Formats

| From | To | Tool |
|------|----|------|
| perf | collapsed stack | `stackcollapse-perf.pl` |
| perf | speedscope | `speedscope --input=perf.data` |
| cpuprofile | speedscope | speedscope.app (drag & drop) |
| collapsed | flamegraph SVG | `flamegraph.pl` |
| any | speedscope | [speedscope.app](https://speedscope.app) (drag & drop) |

## Node.js Profiling

```bash
# Profile a running process
node --inspect server.js
# Then open chrome://inspect, click "Profile", or use:
node --prof server.js
node --prof-process --preprocess -j isolate*.log | ~/FlameGraph/flamegraph.pl > out.svg
```
