*How-to guide, for someone who already uses the plugin and has a scene over its draw-call, triangle or memory budget.*

# How to bring a scene within a count budget

This guide shows you how to find and cut what pushes a scene over a counted
budget (draw calls, triangles, memory, texture memory) on one or more
targets, using the `investigate-render-budget` workflow.

## Run the workflow

```
/graphics-programmer:investigate-render-budget
args: { metric: "draw calls", unit: "calls", budget: 150, targets: ["low-tier phone", "desktop"], scenario: "busiest scene, fixed camera" }
```

- Take the budget from the project's sub-budgets per tier. For different
  budgets per tier, run once per budget.
- Counts can be taken on a machine with no GPU, through a software renderer
  set to each target's quality settings (see the
  [headless-rendering skill](../reference/skill-headless-rendering.md)).
  Times cannot: for a frame-time budget, use
  [How to fix a frame-time problem](how-to-fix-a-frame-time-problem.md).

## Read the result

- `status: "done"`: every target is within budget; the summary gives the
  counts per target and the split by render pass (or by memory category).
  Ship it with `/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }`,
  or with land-pr when there is no work package; `next` names both.
- `blocked: still over budget`: the top three evidenced causes in the
  dominant passes were tried. Renegotiate the budget with the technical
  artist and project manager, or schedule the remaining causes.
- `blocked: the baseline on ... has no split`: make the counter report the
  metric per pass or category, then run again.
- `status: "unverified"`: within budget, but a step failed or a count was
  estimated (for example texture memory on a software renderer that lacks
  the target's compressed formats). There is no `handoff`; `pushed` names
  the branch. Rerun the listed steps, or count that target on a device.

See the [investigate-render-budget reference](../reference/workflow-investigate-render-budget.md).
