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
- The machine can render frames, with a GPU or headless (see the
  [headless-rendering skill](../reference/skill-headless-rendering.md)).
  If it cannot, the result is `unverified`; for a feature with no visual
  change, pass `capture: false`.

## Run the workflow

```
/graphics-programmer:present-feature
args: { feature: "item pickup", spec: "docs/reference/specs/item-pickup.md", targets: ["low-tier phone", "desktop"] }
```

- If you omit `targets`, the workflow uses the weakest supported device in
  the project profile and desktop.
- If you omit `spec`, the agent looks for the spec through the project
  profile and stops if there is none.

### Defer perf to a benchmark

When no target device is reachable, name the benchmark or measurement
package that will measure the feature, and the hook to run if one exists:

```
args: { feature: "item pickup", perf: { defer_to: "<benchmark work package>", hook: "<benchmark command>" } }
```

Estimated perf checks then become follow-ups on that package instead of
leaving the run unverified. With no benchmark at all, build one first with
[build-measurement-tool](how-to-build-a-benchmark-and-acceptance-checks.md).

### Present a backdrop

For a non-interactive background element driven by time rather than game
events (a sky, distant scenery, an animated wall), pass `kind: "backdrop"`:

```
args: { feature: "animated sky", kind: "backdrop", targets: ["low-tier phone", "desktop"] }
```

The workflow then needs no logic events and skips the input check; the
look-dev frames sit at fixed times across the loop, and readability checks
that the backdrop does not compete with foreground play. If the work is only
the shader's look, with nothing to wire into the scene, layers, settings or
budget, the result says so: run the technical artist's `author-shader`
instead.

## Read the result

- `status: "done"`: the presentation is built, verified, documented and
  pushed; `handoff` names the branch and head commit. `frames` holds the
  before and after look-dev frames.
- `follow_ups`: perf checks deferred to the benchmark package. Check that
  each is recorded on that package (the handoff step records them where
  the project tracks follow-ups; `next` says if it could not).
- `placeholders`: send the list (key, file, manifest, what final art must
  keep) to the technical artist, who replaces each file and manifest entry
  with no code change.
- `blocked: the event contract is incomplete`: ask the gameplay-programmer
  for the listed fields, then run again.
- `blocked: ... is shader-only work`: hand it to the technical artist
  (`/technical-artist:author-shader`).
- `blocked after N fix rounds`: fix the listed blockers by hand or rerun
  after design changes.
- `status: "unverified"` (or a result starting `unverified:`): a check
  returned nothing, frames were missing, or a check was estimated with
  nothing to defer it to. There is no `handoff`; `pushed` names the branch.
  Rerun the checks `next` lists with `run.only`, pass `perf.defer_to`, or
  measure on the device (see
  [How to fix a frame-time problem](how-to-fix-a-frame-time-problem.md));
  the run that verifies them returns the handoff.

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
