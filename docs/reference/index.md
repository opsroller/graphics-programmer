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
- [frame-budget-profiling](skill-frame-budget-profiling.md): budgets in ms, CPU/GPU bottlenecks, stutter.
- [platform-scaling](skill-platform-scaling.md): device tiers, quality levers, thermal, mobile GPUs.
- [web-rendering](skill-web-rendering.md): canvas, pixel ratio, context loss, browser input.

## Workflows

| Workflow | Args | Page |
|---|---|---|
| `present-feature` | `{ feature, spec?, targets? }` | [present-feature](workflow-present-feature.md) |
| `investigate-frame-time` | `{ symptom, target, scenario? }` | [investigate-frame-time](workflow-investigate-frame-time.md) |
| `feel-and-perf-check` | `{ scope, targets? }` | [feel-and-perf-check](workflow-feel-and-perf-check.md) |
| `renderer-decision` | `{ question, tiers?, wants? }` | [renderer-decision](workflow-renderer-decision.md) |

## plugin.json fields

| Field | Value |
|---|---|
| `name` | `graphics-programmer` |
| `version` | `0.3.0` |
| `author.name` | `opsroller` |
| `repository` | `https://github.com/opsroller/graphics-programmer` |
| `license` | `GPL-2.0-or-later` |
| `keywords` | `role`, `job-function`, `graphics`, `rendering`, `camera`, `animation`, `input`, `performance`, `profiling`, `mobile`, `web` |

## Sources

The research behind the plugin is listed in [SOURCES.md](../../SOURCES.md).
