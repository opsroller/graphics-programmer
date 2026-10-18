*Reference landing page, for anyone looking up a part of the graphics-programmer plugin.*

# Reference

These pages describe each part of the plugin as it is. They mirror the
repository: one page for the agent, one per skill, one per workflow.

## Agent

- [graphics-programmer](agent.md): what the agent owns, what it leaves to
  neighbouring roles, and its "never" list.

## Skills

The skills group into three concerns.

**What the player sees**
- [scene-composition](skill-scene-composition.md): scene structure, draw order, lighting for readability.
- [camera-systems](skill-camera-systems.md): framing, follow behaviours, shake, aspect ratios.
- [event-presentation](skill-event-presentation.md): game events as animation, decoupled from logic.

**What the player does**
- [input-handling](skill-input-handling.md): devices to actions, remapping, cancel handling.

**How fast it runs, everywhere**
- [frame-budget-profiling](skill-frame-budget-profiling.md): budgets in ms, count budgets (draw calls, triangles, memory), CPU/GPU bottlenecks, stutter, backends with no GPU timing.
- [platform-scaling](skill-platform-scaling.md): device tiers, quality levers, thermal, mobile GPUs.
- [web-rendering](skill-web-rendering.md): canvas, pixel ratio, context loss, browser input.
- [headless-rendering](skill-headless-rendering.md): rendering in a container or CI with no GPU or display, and what its frame times mean.

## Workflows

| Workflow | Args | Page |
|---|---|---|
| `present-feature` | `{ feature, spec?, kind?, targets?, capture?, perf?: { defer_to?, hook? } }` | [present-feature](workflow-present-feature.md) |
| `investigate-frame-time` | `{ symptom, target, scenario? }` | [investigate-frame-time](workflow-investigate-frame-time.md) |
| `investigate-render-budget` | `{ metric, unit, budget, targets, scenario?, symptom? }` | [investigate-render-budget](workflow-investigate-render-budget.md) |
| `feel-and-perf-check` | `{ scope, targets?, benchmark?: { command?, scenes?, tiers?, resolutions?, runs?, warmup? } }` | [feel-and-perf-check](workflow-feel-and-perf-check.md) |
| `renderer-decision` | `{ question, tiers?, wants?, decision? }` | [renderer-decision](workflow-renderer-decision.md) |
| `implement-renderer-system` | `{ system, spec, plan?, wp?, branch?, pr? }` | [implement-renderer-system](workflow-implement-renderer-system.md) |
| `build-measurement-tool` | `{ tool, spec, targets?, wp?, branch?, pr? }` | [build-measurement-tool](workflow-build-measurement-tool.md) |

## plugin.json fields

| Field | Value |
|---|---|
| `name` | `graphics-programmer` |
| `version` | `0.10.0` |
| `author.name` | `opsroller` |
| `repository` | `https://github.com/opsroller/graphics-programmer` |
| `license` | `GPL-2.0-or-later` |
| `keywords` | `role`, `job-function`, `graphics`, `rendering`, `camera`, `animation`, `input`, `performance`, `profiling`, `mobile`, `web`, `benchmark`, `headless` |

## Sources

The research behind the plugin is listed in [SOURCES.md](../../SOURCES.md).
