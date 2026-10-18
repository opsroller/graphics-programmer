*Reference, for anyone looking up the `investigate-frame-time` workflow's arguments, phases and results.*

# investigate-frame-time

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/investigate-frame-time.js`](../../workflows/investigate-frame-time.js) |
| Invoke | `/graphics-programmer:investigate-frame-time` |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `symptom` | yes | string | What is wrong, as observed |
| `target` | yes | string | One device or tier from the project profile |
| `scenario` | no | string | Reproduction steps; the agent defines one if omitted |

Missing `symptom` or `target` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Scenario, budget (ms), build, device reachability, docs plan |
| Measure | 1 | no | Baseline: median, p95, p99, worst, frames over budget, CPU and GPU ms |
| Diagnose | 4, parallel | no | cpu, gpu, pacing, memory; evidenced causes with expected saving (ms) |
| Fix | up to 3 rounds of apply + re-measure (+ revert) | yes, one agent at a time | Highest expected saving first; keeps a change only if p95 improves; reverts and stops if a re-measure fails; stops once within budget |
| Docs | 1 | yes | Planned Diataxis pages with results |
| Docs check | 1 | no | One kind per page, titles, links |

## Results

| Result starts with | Meaning |
|---|---|
| `usage:` | Required args missing |
| `blocked: planning failed` / `blocked: baseline measurement failed` | Agent returned nothing |
| `blocked: no ... device or release-like build is reachable` | Nothing measured; scenario returned |
| `no evidenced cause found:` | Every diagnoser returned and none found a cause on the critical path |
| `unverified:` (no cause) | No cause found, but a diagnoser returned nothing |
| `blocked: the apply agent ... returned nothing` | Possible partial change on the branch; stop and inspect |
| `blocked: "..." did not help and its revert failed` / `blocked: re-measuring ... failed and its revert failed` | Manual revert needed |
| `blocked: docs missing` | Docs agent returned nothing |
| `unverified: within budget, but ...` | p95 at or under budget, but a re-measure failed (change reverted, loop stopped), a diagnoser returned nothing, or docs were not verified |
| `within budget` | p95 at or under budget, every step returned, docs checked |
| `blocked: still over budget` | Top three causes tried; summary lists results |

Any failed or unverified step gives a status other than `within budget`.
Hypotheses beyond the top three are logged as not tried.

Related: [How to fix a frame-time problem](../how-to/how-to-fix-a-frame-time-problem.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, one per area (`baseline`, `cpu`, `gpu`, `pacing`, `memory`), `apply: <area>`, `revert unmeasured: <area>`, `revert: <area>`, `docs`, `docs check`.

Independent steps: `docs check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
