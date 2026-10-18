*How-to guide, for someone who already uses the plugin and wants presentation work checked before review.*

# How to check presentation work before marking it done

This guide shows you how to check feel, readability, input and frame time
for finished work with the `feel-and-perf-check` workflow.

## Run the workflow

```
/graphics-programmer:feel-and-perf-check
args: { scope: "feat/item-pickup", targets: ["low-tier phone", "desktop", "web build"] }
```

- `scope` is a branch or a feature name.
- Add a web target if the project ships a web build; the checker then also
  follows `web-rendering`.
- The workflow finds the project's benchmark tool itself. To name it, or
  pick scenes, tiers and resolutions, pass `benchmark`:

  ```
  benchmark: { command: "tools/run-benchmark.sh", tiers: ["low", "high"], resolutions: ["1920x1080"], runs: 3 }
  ```

  If the project has no benchmark tool, build one with
  `/graphics-programmer:build-measurement-tool` first rather than timing
  frames by hand.

## Read the result

- The first line is the status: `done` only if every check returned, every
  perf number was measured and the docs check passed; otherwise
  `unverified` or `blocked`.
- The fix list is ordered by player-visible impact. Fix blockers before
  asking for review.
- Items marked as estimates were not measured on a device; measure them
  before merging.
- `unverified areas` means a checker failed; rerun or check that area by
  hand. `benchmark` there means the tool did not run.
- A note `gpu_timing: unavailable` means that backend reports no GPU time,
  so its CPU frame time includes the drawable or vsync wait; judge it on
  total frame time and treat the bound side as a guess (see
  frame-budget-profiling, "When the backend reports no GPU timing").
- Docs issues are fixed and re-checked up to twice; only blocking issues
  left after the last check block the run, minor ones are listed in notes.
- The measured numbers are recorded in the project's reference docs on the
  same branch.

See the [feel-and-perf-check reference](../reference/workflow-feel-and-perf-check.md).
