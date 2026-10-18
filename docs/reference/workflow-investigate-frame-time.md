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
| Fix | up to 3 rounds of apply + re-measure (+ revert) | yes, one agent at a time | Highest expected saving first; keeps a change only if p95 improves; stops once within budget |
| Docs | 1 | yes | Planned Diataxis pages with results |
| Docs check | 1 | no | One kind per page, titles, links |

## Results

| Result starts with | Meaning |
|---|---|
| `usage:` | Required args missing |
| `blocked: planning failed` / `blocked: baseline measurement failed` | Agent returned nothing |
| `blocked: no ... device or release-like build is reachable` | Nothing measured; scenario returned |
| `no evidenced cause found` | Diagnosers found nothing on the critical path |
| `blocked: "..." did not help and its revert failed` | Manual revert needed |
| `docs missing` | Docs agent returned nothing |
| `within budget` | p95 at or under budget; kept and tried changes listed |
| `blocked: still over budget` | Top three causes tried; summary lists results |

Hypotheses beyond the top three are logged as not tried. Failed diagnosers
are logged as unverified areas.

Related: [How to fix a frame-time problem](../how-to/how-to-fix-a-frame-time-problem.md) · [index](index.md)
