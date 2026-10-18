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

- `status: "done"`: the presentation is built, verified, documented and
  pushed; `handoff` names the branch and head commit.
- `blocked: the event contract is incomplete`: ask the gameplay-programmer
  for the listed fields, then run again.
- `blocked after N fix rounds`: fix the listed blockers by hand or rerun
  after design changes.
- `status: "unverified"` (or a result starting `unverified:`): a check returned nothing or a perf check was estimated
  because no device was reachable. Rerun the listed checks, or measure on
  the device, before merging (see
  [How to fix a frame-time problem](how-to-fix-a-frame-time-problem.md)).

## Ship it

For a work package, pass the whole result as `prior` so it ships without
being built again:

```
/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }
```

With no work package, land the branch instead:
`/engineering-practices:land-pr { branch: "<handoff.branch>" }`. The
result's `next` names both.

See the [present-feature reference](../reference/workflow-present-feature.md)
for phases and outputs.
