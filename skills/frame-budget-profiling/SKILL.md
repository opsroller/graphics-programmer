---
name: frame-budget-profiling
description: Use when setting frame-time or count budgets (draw calls, triangles, memory), profiling CPU or GPU cost, chasing stutter, hitches or a frame-rate regression, or before claiming any presentation work is fast enough.
---

# Frame-time budgets and profiling

Performance is a budget in **milliseconds per frame**, measured on the
**weakest supported device**, in a **release-like build**, for **long
enough to see heat**. Everything else is guessing.

## Budgets

1. **Frame time from the target rate:** 60 fps = 16.7 ms, 30 fps = 33.3 ms,
   120 fps = 8.3 ms. Plan to use about 80-85% of it so spikes, OS work and
   thermal drop have headroom.
2. **Split the budget** between CPU (logic, presentation, scene traversal,
   draw submission) and GPU (vertex, fragment, post, presentation to screen).
   They run in parallel; the frame costs roughly the larger of the two plus
   any sync between them.
3. **Write sub-budgets** the team can act on: draw calls, visible triangles,
   overdraw layers, full-screen passes, texture memory, per-frame
   allocations, loading time. Agree asset-level numbers with the technical
   artist; they derive from this budget.
4. **Record the budget per device tier** in the project's reference docs.

## Method: find the bottleneck, then fix only it

This follows the pipeline-optimisation approach of *Real-Time Rendering*:
the slowest stage sets the frame time, so locate it before optimising.

1. **Reproduce** on target hardware with a fixed scenario (same scene,
   camera path, input replay) so runs are comparable. Disable debug overlays
   and logging that would skew results.
2. **Measure frame time** over the scenario: median, 95th/99th percentile,
   worst frame, and count of frames over budget. Average FPS hides hitches.
3. **CPU-bound or GPU-bound?**
   - Compare CPU frame time with GPU frame time from a profiler.
   - Quick tests: shrink the render resolution (if frame time drops, fragment
     or bandwidth bound); skip draw submission or freeze logic (if it drops,
     CPU bound); vary one stage at a time.
4. **Drill into the bound side** with the right category of tool:
   - CPU: a sampling or instrumented profiler; look for per-frame
     allocations and garbage collection, redundant scene traversal, many small
     draws, synchronous waits on the GPU.
   - GPU: a frame capture/debugger to inspect passes, draw calls, overdraw and
     state changes; GPU vendor counters for bandwidth, shader cycles and
     tile load/store traffic on mobile.
5. **Form one hypothesis, change one thing, re-measure** with the same
   scenario. Keep the change only if the numbers move.
6. **Soak test**: 15+ minutes on the weakest phone to see thermal throttling
   and sustained frame time, not just the first minute.
7. **Report** before/after: device, build, scenario, median/p95/p99, bound
   side, change made.

## When the backend reports no GPU timing

Some graphics backends expose no GPU timestamps to the engine (Metal in
several engines, some web and mobile drivers). There, the engine's GPU
time reads zero or is missing, and its **CPU frame time includes the wait
for a drawable, vsync or present**: a GPU-bound frame shows up as a long
"CPU" frame. To judge a budget anyway:

1. **Record `gpu_timing: unavailable`** with every number from that
   backend, so nobody reads its CPU time as CPU work.
2. **Judge the budget on total frame time** percentiles (p50/p95/p99,
   worst), not the CPU/GPU split. Measure **uncapped** (vsync off, no frame
   cap) where the platform allows it; a capped run only shows whether the
   target rate holds, not the headroom.
3. **Get GPU cost from the platform's own tools** when one is reachable:
   the OS GPU profiler or frame capture (for Metal, Xcode Instruments' Metal
   System Trace or a GPU frame capture; for the web, the browser's
   performance panel). Record which tool gave the number.
4. **Infer the bound side** with the quick tests above (shrink render
   resolution, freeze logic, skip draw submission) and mark it **inferred**,
   naming the test. Engine-side CPU markers around logic and draw
   submission, which exclude the wait, give the real CPU share.
5. **Do not subtract a guessed wait** from CPU time or report the wait as
   CPU cost.

## Count budgets (draw calls, triangles, memory)

A sub-budget that counts something, not time, is checked the same way:
fixed scenario, baseline, one change per re-count.

1. **Count where the target's settings run.** Draw calls, triangles and
   memory as the engine accounts it are the same on a software renderer as
   on a GPU for the same scene and settings, so a machine with no GPU can
   count them (`headless-rendering` skill). It cannot time them: its frame
   times are never measurements. Textures in a compressed format the
   software driver lacks are stored decompressed there; take texture memory
   for those from the engine's own accounting or a device.
2. **Split the count by render pass** (opaque, transparent, shadow, post,
   UI and any other the renderer has) or, for memory, by category
   (textures by format, meshes, render targets, buffers). The parts add up
   to the total.
3. **Cut the pass that dominates first**: batching, instancing and
   material merges for opaque; sorting and fewer layers for transparent;
   fewer casters, cascades or distance for shadow; merged passes for post;
   atlases and batch-friendly order for UI; sizes, formats and mips for
   texture memory.
4. **Report** target, renderer, quality settings, total and the split,
   before and after. Workflow: `investigate-render-budget`.

## Hitches and stutter (frame pacing)

- A steady 30 can feel better than an unsteady 45. Look at frame-to-frame
  variation, not just the mean.
- Common causes: shader compilation or asset loading on first use, garbage
  collection spikes, presenting frames out of step with the display refresh,
  thermal throttling. Fixes: warm up shaders and pools during loading, avoid
  per-frame allocations, use the platform's frame pacing facility, cap the
  frame rate to what the device can hold.
- Store-level vitals often define slow frames (one Android vitals metric
  counts a frame as slow above 50 ms, and a session as slow when over 25% of
  frames are slow); treat these as floors, not targets.

## Decision rules

- No optimisation without a capture showing it is on the critical path.
- Measure on device; editor, debug and desktop numbers do not transfer to
  phones.
- If GPU-bound on mobile, suspect bandwidth first (resolution, overdraw,
  full-screen passes, uncompressed textures, render target load/store).
- If CPU-bound, suspect draw-call count and per-frame allocation first.
- A budget regression blocks the change until it is fixed or the budget is
  explicitly renegotiated.

## Quality bar

- Budget per tier written down and agreed.
- Every performance claim has device, build, scenario and percentiles.
- Weakest device holds the target rate for a 15+ minute soak.
- No unexplained frames over budget in the standard scenario.

## Checklist

- [ ] Budget (ms) and sub-budgets per tier
- [ ] Count budgets split by render pass or memory category
- [ ] Repeatable scenario on target hardware, release-like build
- [ ] Median, p95, p99, worst; frames over budget
- [ ] Bound side identified with evidence (marked inferred when the backend has no GPU timing)
- [ ] One change per measurement
- [ ] Soak test for thermal behaviour
- [ ] Before/after report

## Failure modes

- Optimising what is easy to see rather than what is on the critical path.
- Quoting average FPS from a desktop editor.
- Reading CPU frame time as CPU work on a backend with no GPU timing, where it includes the drawable or vsync wait.
- Testing for one minute on a cool phone.
- Micro-optimising shaders while the frame is CPU-bound on draw submission.

## Documentation this work needs

New or changed budgets: update **reference** (budgets per tier, scenario
definition). A repeatable profiling procedure for this project: a **how-to**
("How to profile on the weakest device"). A performance trade-off decision:
an **explanation**. Same PR, one kind per page.
