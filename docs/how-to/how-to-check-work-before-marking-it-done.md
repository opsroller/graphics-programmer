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

## Read the result

- The fix list is ordered by player-visible impact. Fix blockers before
  asking for review.
- Items marked as estimates were not measured on a device; measure them
  before merging.
- `unverified areas` means a checker failed; rerun or check that area by
  hand.
- The measured numbers are recorded in the project's reference docs on the
  same branch.

See the [feel-and-perf-check reference](../reference/workflow-feel-and-perf-check.md).
