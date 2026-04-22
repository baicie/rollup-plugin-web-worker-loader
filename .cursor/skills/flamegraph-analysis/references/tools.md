---
name: flamegraph-tools
description: Tools for flame graph generation and viewing: flamegraph.pl, speedscope, perf, Chrome DevTools
---

# Tools

## speedscope

Interactive web-based profile viewer. Supports multiple formats.

**URL:** [https://speedscope.app](https://speedscope.app)

Drag & drop any supported file format. No installation needed.

### View Modes

| Mode | Description |
|------|-------------|
| **Flamegraph** | Sorted by frequency, best for finding hot paths |
| **Heavy (top-down)** | Same order as flamegraph, sorted by weight |
| **Left-heavy** | Aggregates identical stacks, best for call counts |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate up/down stack |
| `←` / `→` | Navigate between frames |
| `Enter` | Expand/collapse frame |
| `space` | Zoom to selected |
| `?` | Help |

## flamegraph.pl (Brendan Gregg)

Original Perl script. Generates SVG flame graphs from collapsed stacks.

### Installation

```bash
git clone https://github.com/brendangregg/FlameGraph
cd FlameGraph
```

### Basic Usage

```bash
# From collapsed stacks
./flamegraph.pl stacks.txt > out.svg

# With options
./flamegraph.pl --title="CPU Profile" --colors=hot stacks.txt > out.svg

# Inverted (icicle graph, top-down)
./flamegraph.pl --inverted stacks.txt > out.svg

# Compare two profiles
./flamegraph.pl --diff=base.txt new.txt > diff.svg

# Limit to functions matching a pattern
./flamegraph.pl --minwidth=5 --title="JS Only" stacks.txt > out.svg
```

### Color Options

| Flag | Palette | Best for |
|------|---------|----------|
| `--colors=hot` | Red gradient | CPU profiles |
| `--colors=mem` | Blue gradient | Memory allocations |
| `--colors=io` | Green gradient | I/O operations |
| `--colors=pause` | Purple gradient | GC / pause times |
| `--colors=wakeup` | Orange gradient | Wakeup events |

### Demos

```bash
# Count stack frequency
./func-cnt.pl stacks.txt | sort -rn | head -20

# Find functions with most descendants
./inverted.pl stacks.txt | ./flamegraph.pl > out.svg
```

## perf (Linux)

Kernel-level profiler for system-wide CPU analysis.

### Installation

```bash
# Debian/Ubuntu
sudo apt install linux-tools-common linux-tools-generic

# RHEL/CentOS
sudo yum install perf
```

### Recording

```bash
# CPU-wide profiling (root)
sudo perf record -F 99 -a -g -- sleep 30

# Record a specific process
sudo perf record -F 99 -p <pid> -g -- sleep 30

# Record with call graph (user-space only)
perf record -g -- node server.js

# Record until Ctrl+C
sudo perf record -a -g
```

`-F 99` = 99 Hz sampling rate (99 samples/sec). Higher = more overhead, more detail.

### Analysis

```bash
# Text summary
sudo perf report

# Generate collapsed stacks
perf script --input=perf.data > stacks.txt

# Pipe directly to flamegraph
perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > out.svg
```

### Useful Flags

```bash
--call-graph dwarf        # Accurate call graphs (no frame pointers needed)
--call-graph fp            # Faster but requires frame pointers
--no-buildid-cache         # Skip cache, faster
```

## Chrome DevTools

### Recording a Profile

1. Open DevTools (`Cmd+Opt+I`)
2. Go to **Performance** tab
3. Click **Record** (or `Cmd+E`)
4. Perform actions
5. Click **Stop**

### Recording JS CPU Profile

1. Open DevTools → **Memory** tab
2. Select **CPU profile** type
3. Click **Record** or take **heap snapshot**
4. For long-running: use **Console** → `console.profile('label')`

### CPU Profiler (Dedicated)

1. DevTools → **JavaScript Profiler** panel (or Performance → JS Profiler)
2. Select **Call tree** or **Heavy (Bottom Up)** view
3. Click **Start** / **Stop**

### Node.js

```bash
# Method 1: Inspector
node --inspect server.js
# Open chrome://inspect → Profiles → Record

# Method 2: Built-in profiler
node --prof server.js
node --prof-process isolate-*.log > processed.txt
```

## Vtune (Intel)

For detailed CPU analysis on Intel processors.

```bash
vtune -collect=cpu:u -k sample-interval=1 node app.js
vtune -report=gui
```

## Pyroscope

Continuous profiling server. Supports Go, Python, Ruby, Go, Java, .NET, Node.js.

```bash
# Docker
docker run -p 4040:4040 pyroscope/pyroscope server

# Agent
pyroscope exec -server-address=http://localhost:4040 node app.js
```
