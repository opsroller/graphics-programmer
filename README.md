# graphics-programmer

A Claude Code role plugin for the **graphics programmer** job function: the
person who makes a game readable, responsive and smooth on every target, from
low-end phones to desktop and the browser. It covers scene composition,
cameras, presenting game events as animation (kept separate from game
logic), input across mouse, touch and controller, frame-time budgets and
CPU/GPU profiling, scaling across devices, rendering for web builds,
building benchmarks and acceptance checks, and rendering on machines with
no GPU such as cloud containers and CI.

The plugin says *how* to do the job well. Each project says *with what*
(engine, devices, budgets, paths) in its own `CLAUDE.md` and profile, which
the agent reads first through `engineering-practices`.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install graphics-programmer@opsroller
```

## Documentation

The docs follow [Diataxis](https://diataxis.fr): four kinds, each for a
different need.

- **Learning the plugin?** Start with the tutorial
  [Build your first presented event](docs/tutorials/first-task.md). It walks
  one event from contract to measured, documented animation.
- **Doing a job?** The how-to guides cover the six workflows and two common
  tasks:
  [present a game feature](docs/how-to/how-to-present-a-game-feature.md),
  [fix a frame-time problem](docs/how-to/how-to-fix-a-frame-time-problem.md),
  [check work before marking it done](docs/how-to/how-to-check-work-before-marking-it-done.md),
  [set frame budgets for device tiers](docs/how-to/how-to-set-frame-budgets-for-device-tiers.md),
  [decide rendering features for quality tiers](docs/how-to/how-to-decide-rendering-features-for-quality-tiers.md),
  [build a rendering system from a renderer decision](docs/how-to/how-to-build-a-rendering-system-from-a-renderer-decision.md),
  [build a benchmark and acceptance checks](docs/how-to/how-to-build-a-benchmark-and-acceptance-checks.md),
  [add an input device](docs/how-to/how-to-add-an-input-device.md).
- **Looking something up?** The [reference](docs/reference/index.md)
  describes the agent, each of the eight skills and each workflow's
  arguments and results. Research sources are in [SOURCES.md](SOURCES.md).
- **Want the background?** [About the graphics programmer role](docs/explanation/about-the-role.md)
  explains the job, its boundaries with neighbouring roles, the reasoning
  behind its quality bars, and how the role grows from junior to principal.

## License

Copyright (C) 2026 the contributors. Licensed under the GNU General Public License v2.0 or later (`GPL-2.0-or-later`); see `LICENSE`.
