# Graphics Programmer

Graphics programmer: builds what the player sees in real time: scenes, camera, lighting, animation driven by game events, input, and rendering performance.

This plugin is a **job function**, not a project. It says how the job is done; the project it works on says with which tools, in its `CLAUDE.md` and project profile.

## Skills

| Skill | Use when |
|---|---|
| `scene-composition` | Use when building or changing a scene, camera or lighting setup. |
| `event-animation` | Use when animating game results: moves, clears, falls, spawns, effects. |
| `input-handling` | Use when mapping touch, mouse, keyboard or gamepad input to game actions. |
| `rendering-performance` | Use when profiling or setting budgets for frame time, draw calls, memory or load time. |

## Workflows

Multi-agent workflows (Claude Code Workflow scripts in `workflows/`).

| Workflow | Does |
|---|---|
| `/graphics-programmer:feel-and-perf-check` | Check presentation against feel targets and frame budgets per target device, in parallel |

## Agent

`agents/graphics-programmer.md` defines the role as a subagent.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install graphics-programmer@opsroller
```

Versioned on its own with semver tags (`v0.1.0`). Changes follow Conventional Commits.
