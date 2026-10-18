*How-to guide, for someone who already uses the plugin and has a slow, stuttering or overheating build.*

# How to fix a frame-time problem

This guide shows you how to find and fix the cause of a low frame rate,
stutter or overheating on one target, using the `investigate-frame-time`
workflow.

## Run the workflow

```
/graphics-programmer:investigate-frame-time
args: { symptom: "drops below 30 fps when the settings menu opens", target: "low-tier phone", scenario: "open settings from the main screen ten times" }
```

- Give one target per run. For several targets, run once per target, worst
  first.
- If you have no reproduction, omit `scenario`; the agent defines one.

## Read the result

- `within budget`: the kept changes are committed with before/after
  numbers; open the PR.
- `blocked: still over budget`: the top three evidenced causes were tried;
  the summary lists what helped and what was reverted. Renegotiate the
  budget with the game-designer and project-manager, or schedule the
  remaining causes.
- `blocked: no ... device or release-like build is reachable`: get a
  device or a build first; numbers from an editor do not count.
- `unverified: within budget, but ...`: the numbers look good but a step
  failed (a re-measure, a diagnoser, or the docs check). A change whose
  re-measure failed has already been reverted. Rerun, or check the listed
  step by hand, before opening the PR.
- `blocked: the apply agent ... returned nothing`: inspect the branch for a
  partial change before running again.

## If you need to profile by hand

Follow the `frame-budget-profiling` skill: fixed scenario, release-like
build, median/p95/p99, CPU or GPU bound, one change per measurement, a
15-minute soak on the weakest phone.

See the [investigate-frame-time reference](../reference/workflow-investigate-frame-time.md).
