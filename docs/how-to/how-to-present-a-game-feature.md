*How-to guide, for someone who already uses the plugin and needs a feature's presentation built end to end.*

# How to present a game feature

This guide shows you how to build the scene, camera, animation and input for
a feature whose design spec and logic events already exist, using the
`present-feature` workflow.

## Before you run it

- The design spec states the feel targets (timings, easing, what must be
  readable).
- The logic publishes the feature's events. If it does not, the workflow
  stops with a list of missing event fields; take that list to the
  gameplay-programmer.

## Run the workflow

```
/graphics-programmer:present-feature
args: { feature: "item pickup", spec: "docs/reference/specs/item-pickup.md", targets: ["low-tier phone", "desktop"] }
```

- If you omit `targets`, the workflow uses the weakest supported device in
  the project profile and desktop.
- If you omit `spec`, the agent looks for the spec through the project
  profile and stops if there is none.

## Read the result

- `done:` the presentation is built, verified and documented on the work
  branch. Open the PR as described in `engineering-practices`.
- `blocked: the event contract is incomplete`: ask the gameplay-programmer
  for the listed fields, then run again.
- `blocked after N fix rounds`: fix the listed blockers by hand or rerun
  after design changes.
- Lines marked *estimated, not measured* mean no device was reachable;
  measure on the device before merging (see
  [How to fix a frame-time problem](how-to-fix-a-frame-time-problem.md)).

See the [present-feature reference](../reference/workflow-present-feature.md)
for phases and outputs.
