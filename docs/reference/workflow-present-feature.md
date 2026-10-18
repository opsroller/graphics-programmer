*Reference, for anyone looking up the `present-feature` workflow's arguments, phases and results.*

# present-feature

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/present-feature.js`](../../workflows/present-feature.js) |
| Invoke | `/graphics-programmer:present-feature` |

## Arguments

| Arg | Required | Type | Default | Meaning |
|---|---|---|---|---|
| `feature` | yes | string | - | Short name of the feature to present |
| `spec` | no | string | found via project profile | Path to the design spec |
| `targets` | no | string[] | weakest supported device, desktop | Targets measured in Verify |
| `capture` | no | boolean | `true` | Capture look-dev frames before and after; `false` for a feature with no visual change |
| `perf.defer_to` | no | string | found by Plan, or none | Benchmark or measurement package (work package id or tool) that measures the feature on real targets; a perf check estimated here becomes a follow-up on it |
| `perf.hook` | no | string | found by Plan, or none | Existing measurement command, benchmark scene or profiler markers the perf checks run |

Missing `feature` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Event contract, beats, scene, camera, input actions, budget impact, files, look-dev frames, visual acceptance checks, measurement hook and deferral target, placeholder art, docs plan (compass), contract gaps |
| Before | 1, when capturing | frames only | Captures the look-dev frames on the base commit (technical-artist `lookdev-capture`, `headless-rendering`) |
| Build | 1 | yes | Implements the plan, placeholders behind manifest keys, measurement markers; commits |
| Capture | 1 per round, when capturing | frames only | Captures the same frames on the working tree |
| Verify | 3 to 5 + one per target, parallel | no | feel, input, readability, look (when frames exist), art hookup (when there are placeholders), perf per target |
| Fix | 1 per round, max 2 rounds | yes | Applies all open blockers in one pass |
| Docs | 1 | yes | Writes the planned Diataxis pages on the same branch |
| Docs check | 1 | no | One kind per page, titles, links, coverage |
| Handoff | 1 | yes | Commits everything the run wrote on a feature branch (cut from the default branch if needed), records perf follow-ups where the project tracks them, pushes, runs the project's checks on the pushed head; opens no PR |

## Checks

| Area | Judges | Counts as measured when |
|---|---|---|
| `feel` | Beat timing and easing against the spec; skip, fast-forward, reduced motion | always |
| `input` | Every action on every device family; cancel, focus loss, disconnect; touch targets | always |
| `readability` | The readable set at the smallest resolution and extreme aspect ratios, in greyscale. Runs the project's visual acceptance checks on the after frames when they exist (failing criteria are blockers, thresholds never change); otherwise judges by eye and says the criteria are unchecked by script | frames were captured, or `capture: false` |
| `look` | Independent before/after look review of every frame and its greyscale copy against the spec, art direction and visual target | frames were captured |
| `art hookup` | Every visual asset loads by manifest key; every placeholder is registered, marked and named by the convention; what final art must keep is documented | always |
| `perf: <target>` | Frame time (median, p95, p99) against the budget, through `perf.hook` when there is one | a real device run; software-renderer or container numbers and estimates are not |

A `perf` check that is not measured becomes a **follow-up** when there is a
deferral target (`perf.defer_to`, or one Plan found): the run can be `done`,
the follow-up is listed in `follow_ups` and the handoff, and Handoff records
it where the project tracks follow-ups for that package. Without one, and
for any other area not measured, the run is `unverified`.

## Placeholder art

Plan lists one placeholder per visual asset whose final art does not exist
yet: `{ key, path, manifest, stands_for }`.

| Field | Meaning |
|---|---|
| `key` | Stable manifest key the code loads the asset by; final art keeps it |
| `path` | Placeholder file, named by the project's asset naming convention with a placeholder marker; fallback `<key>.placeholder.<ext>` |
| `manifest` | The project's asset manifest, or an override manifest next to the feature's presentation data when the project has none |
| `stands_for` | What final art must keep for the code to work: bounds, pivot, material slots, animation or marker names |

The technical artist replaces a placeholder by changing its file and
manifest entry, with no code change. The list goes in the reference docs,
the result's `placeholders` and the handoff.

## Results

| Result starts with | Meaning |
|---|---|
| `usage:` | `feature` missing |
| `blocked: planning failed` | Plan agent returned nothing |
| `blocked: the event contract is incomplete` | Lists event fields to request from the gameplay-programmer |
| `blocked: build agent returned nothing` | No changes confirmed |
| `blocked: fix agent returned nothing` / `blocked after N fix rounds` | Lists open blockers; nothing proceeds to docs |
| `blocked: docs agent returned nothing` / `blocked: docs check failed` | Work not done without docs |
| `unverified: docs checker returned nothing` | Built and documented, docs not checked; no handoff |
| `blocked: handoff step returned nothing` | The work may not be committed or pushed |
| `blocked: checks fail on <branch>` | The project's checks fail on the pushed head; names the problem |

After the handoff step the result is an object.

| Output | Type | Meaning |
|---|---|---|
| `status` | string | `done` (every check returned and measured, or its perf deferred to a named package; docs checked) or `unverified` (a Verify check returned nothing, frames were missing, or a check was not measured with nothing to defer it to) |
| `summary` | string | The text result: starts with `done:` or `unverified:` and lists what is unverified, deferred and placeholder |
| `build` | string | Build agent's summary of files changed |
| `docs` | object | `pages` touched and `undocumented` changes |
| `unverified` | string[] | Verify checks that returned nothing, and missing after frames |
| `estimated` | string[] | Checks not measured and not deferred |
| `follow_ups` | string[] | Perf checks deferred to the benchmark or measurement package |
| `placeholders` | object[] | Placeholder art; see Placeholder art |
| `frames` | object | `before` and `after` frame files with what each shows |
| `notes` | string[] | Why frames were not captured, if they were not |
| `handoff` | object | Only when `status` is `done`: what deliver-package takes as `prior`; see Handoff |
| `pushed` | object | Only when `status` is `unverified`: `{ branch, pr, head_sha }` the work was pushed to |
| `next` | string | `done`: send placeholders to the technical artist, record unrecorded follow-ups, then ship with deliver-package for a work package or land-pr otherwise. `unverified`: the checks to rerun with `run.only` |

Any failed or unverified step gives a status other than `done`. Checks that
crash are listed as unverified, never dropped.

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the presentation ships
without being built again: `from` (`graphics-programmer:present-feature`),
`branch`, `pr`, `head_sha`, `tests_pass`, `docs`, `undocumented`,
`follow_ups`, `placeholders`, and `notes` (one line per follow-up and per
placeholder, which deliver-package carries into the PR). With no work
package, land the branch with land-pr instead; `next` names both.

An `unverified` run returns no `handoff`, so deliver-package cannot ship it
as checked: rerun the missing checks (or name a deferral target for perf)
and that run returns one.

Related: [How to present a game feature](../how-to/how-to-present-a-game-feature.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `capture before`, `build`, `capture` (`capture round <n>` from the second round), one per area (`feel`, `input`, `readability`, `look`, `art hookup`, and `perf: <target>` per target; `<area> round <n>` from the second round), `fix round <round>`, `docs`, `docs check`, `handoff`.

Independent steps: every area check (`feel`, `input`, `readability`, `look`, `art hookup`, `perf: <target>`, and `<area> round <n>` in later rounds), `docs check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
