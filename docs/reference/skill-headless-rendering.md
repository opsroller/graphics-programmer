*Reference, for anyone looking up what the `headless-rendering` skill covers while working.*

# headless-rendering

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/headless-rendering/SKILL.md`](../../skills/headless-rendering/SKILL.md) |
| Loaded when | use when the engine must draw real frames on a machine with no GPU or no display, such as a cloud container or CI runner - running a self-test, benchmark, capture or screenshot there, getting the engine binary, software Vulkan or OpenGL (Mesa lavapipe, llvmpipe), a virtual display (Xvfb), falling back to an OpenGL renderer, and knowing what frame times from a software renderer do and do not mean. |
| Referenced by | [build-measurement-tool](workflow-build-measurement-tool.md), [implement-renderer-system](workflow-implement-renderer-system.md), [renderer-decision](workflow-renderer-decision.md), [feel-and-perf-check](workflow-feel-and-perf-check.md), [investigate-frame-time](workflow-investigate-frame-time.md) |

## Inputs

The engine version and build flavour the project pins; the renderer
backends it supports; the window or capture size the run needs.

## Outputs

A repeatable script or CI job that installs the engine binary (cached,
checksum-verified, never committed), a software Vulkan or OpenGL driver
and a virtual display, runs the engine on a named backend with a verified
window size, and records engine version, backend, adapter, resolution and
whether frames were software-rendered.

## What software-rendered numbers mean

| Number | Use |
|---|---|
| Frame, CPU and GPU time | Not a measurement; label it "software renderer, not a measurement" |
| GPU timer queries | Usually missing; report "no GPU timing", not 0 ms |
| Draw calls, primitives, active features | Real: checks against sub-budgets and tier feature lists |
| Captures | Layout, framing and coarse readability; confirm look-critical results on a GPU |
| Start-up, settings read-back, determinism | Real: self-tests and CI smoke runs |

## Quality bar

- Every run records engine version, backend, adapter, resolution and software rendering.
- The setup is a script or CI job a fresh machine can run.
- No software frame time reaches a budget table or performance claim.
- Captures are checked for size and content before anyone judges them.

## Related skills

What to capture and how to judge a look from captures: the
technical-artist plugin's look-dev capture skill. Measuring on devices:
[frame-budget-profiling](skill-frame-budget-profiling.md).

## Documentation owed

How-to (rendering without a GPU for this project); reference (packages,
versions, variables, what each run reports); explanation (why software
numbers are not measurements, if needed). Written in the same PR as the
work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
