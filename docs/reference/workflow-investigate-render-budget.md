*Reference, for anyone looking up the `investigate-render-budget` workflow's arguments, phases and results.*

# investigate-render-budget

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/investigate-render-budget.js`](../../workflows/investigate-render-budget.js) |
| Invoke | `/graphics-programmer:investigate-render-budget` |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `metric` | yes | string | The counted metric, e.g. draw calls, triangles, memory, texture memory |
| `unit` | yes | string | Its unit, e.g. calls, triangles, MB |
| `budget` | yes | number | The most the metric may reach on every target, in `unit` |
| `targets` | yes | string or string[] | Devices or tiers from the project profile |
| `scenario` | no | string | Reproduction steps; the agent defines one if omitted |
| `symptom` | no | string | What was seen, as observed |

Missing `metric`, `unit`, a positive `budget` or `targets` returns the usage
string. A time unit (ms, s, fps and the like) returns a `usage:` line naming
[investigate-frame-time](workflow-investigate-frame-time.md) instead.

## Where counts come from

| Number | On a device | On a software renderer (no GPU) |
|---|---|---|
| Draw calls, triangles or primitives | Measured | Measured, with the target's exact quality settings |
| Memory as the engine accounts it | Measured | Measured, except textures in a compressed format the software driver lacks (stored decompressed): `measured: false` |
| Any time (frame, CPU, GPU) | Not taken by this workflow | Never a measurement ([headless-rendering](skill-headless-rendering.md)) |

## Breakdown

Every count is split into parts that add up to the total.

| Metric | Split by |
|---|---|
| Draw calls, triangles | Render pass: opaque, transparent, shadow, post, UI, and any other pass the renderer has |
| Memory | Category: textures (by format), meshes, render targets, buffers, shaders |

Diagnosis runs on the target furthest over budget, on its largest part and
any other part holding a quarter or more of its total (at most three).

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Scenario, counter, where each target is counted, whether anything can count it, docs plan |
| Measure | 1 per target, parallel | no | Baseline: total, breakdown, renderer, measured |
| Diagnose | 1 per dominant part, parallel | no | Evidenced causes with expected saving in `unit`; flags changes the player can see |
| Fix | up to 3 rounds of apply + re-count on every target (+ revert) | yes, one agent at a time | Highest expected saving first; keeps a change only if the worst target drops and no target rises; reverts and stops if a re-count fails; stops once every target is within budget |
| Docs | 1 | yes | Planned Diataxis pages with counts, renderer, settings and breakdown |
| Docs check | 1 to 5 | fixes only | Up to three independent checks and two fixes, only while a blocking issue remains; each re-check covers every page touched, pages added by fixes included, and confirms the last check's issues and anything a fix left (left items keep their severity); minor issues go to notes, blocking ones left at the end block |
| Handoff | 1 | yes | Commits and pushes the branch (cut from the default branch if needed), runs the project's checks on the pushed head; opens no PR |

## Results

| Result starts with | Meaning |
|---|---|
| `usage:` | Required args missing, or the unit is a time |
| `blocked: planning failed` / `blocked: baseline count failed on every target` | Agent returned nothing |
| `blocked: nothing reachable can count ...` | Nothing counted; scenario returned |
| `blocked: the baseline on ... has no split` | The counter gave no breakdown by pass or category |
| `no evidenced cause found:` | Over budget; every diagnoser returned and none found a cause |
| `unverified:` (no cause) | Over budget, no cause found, but a diagnoser returned nothing |
| `blocked: the apply agent ... returned nothing` | Possible partial change on the branch; stop and inspect |
| `blocked: "..." did not help and its revert failed` / `blocked: re-counting ... failed and its revert failed` | Manual revert needed |
| `blocked: still over budget` | Top three causes tried; summary lists results |
| `blocked: docs missing` / `blocked: docs problems` | Docs agent returned nothing, or blocking docs issues left after the last check |
| `blocked: handoff step returned nothing` / `blocked: checks fail on <branch>` | Not pushed, or the project's checks fail on the pushed head |

After the handoff step the result is an object.

| Output | Type | Meaning |
|---|---|---|
| `status` | string | `done` (every target within budget and measured, every step returned, docs checked) or `unverified` (within budget, but a baseline or re-count failed, a count was not measured, a diagnoser returned nothing, or the docs checker returned nothing) |
| `summary` | string | Starts with `within budget` or `unverified:`; baseline and current counts per target, the breakdown, kept and tried changes |
| `docs` | object | `pages` touched and `undocumented` changes |
| `unverified` | string[] | What is unverified |
| `notes` | string[] | Minor docs issues left after the last check |
| `handoff` | object | Only when `status` is `done`: what engineering-practices deliver-package takes as `prior`: `from` (`graphics-programmer:investigate-render-budget`), `branch`, `pr`, `head_sha`, `tests_pass`, `docs`, `undocumented`, `notes` |
| `pushed` | object | Only when `status` is `unverified`: `{ branch, pr, head_sha }` |
| `next` | string | `done`: ship with deliver-package or land-pr. `unverified`: rerun the missing steps |

An `unverified` run returns no `handoff`, so deliver-package cannot ship it
as checked. Any failed or unverified step gives a status other than `done`.
Hypotheses beyond the top three are logged as not tried.

Related: [How to bring a scene within a count budget](../how-to/how-to-bring-a-scene-within-a-count-budget.md) · [frame-budget-profiling](skill-frame-budget-profiling.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `baseline: <target>`, `diagnose: <part>`, `apply:<round>`, `re-count:<round>: <target>`, `revert uncounted:<round>`, `revert:<round>`, `docs`, `docs check`, `docs fix:<n>`, `docs recheck:<n>`, `handoff`.

Independent steps: `docs check`, `docs recheck:<n>`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
