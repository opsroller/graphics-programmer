*Reference, for anyone looking up the `feel-and-perf-check` workflow's arguments, phases and results.*

# feel-and-perf-check

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/feel-and-perf-check.js`](../../workflows/feel-and-perf-check.js) |
| Invoke | `/graphics-programmer:feel-and-perf-check` |

## Arguments

| Arg | Required | Type | Default | Meaning |
|---|---|---|---|---|
| `scope` | yes | string | - | Branch or feature to check |
| `targets` | no | string[] | weakest supported device, desktop | Targets measured |
| `benchmark` | no | object | found at Plan | The project's existing benchmark tool and what to run |
| `benchmark.command` | no | string | the tool Plan finds | Command or tool that reports frame-time percentiles |
| `benchmark.scenes` | no | string[] | scenes Plan finds for the scope | Scenes or scenarios to run |
| `benchmark.tiers` | no | string[] | the tool's default | Quality tiers to run |
| `benchmark.resolutions` | no | string[] | the tool's default | Resolutions to run |
| `benchmark.runs` | no | number | 3 | Runs per target, scene, tier and resolution |
| `benchmark.warmup` | no | string | the tool's warm-up | Frames or seconds dropped before sampling |

Missing `scope` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Summary of the change; existing benchmark tool and scenes; docs plan |
| Benchmark | 0 or 1 | no | Runs the benchmark tool per target, scene, tier and resolution; skipped when no tool exists |
| Check | 3 + one per target, parallel | no | feel, readability, input; perf per target judges the benchmark rows (estimates when there are none) |
| Report | 1 | no | One fix list ordered by player-visible impact |
| Docs | 1 | yes | Records measured results in the project docs |
| Docs check | 1 to 5 | fixes only | Up to three independent checks and two fixes; each re-check covers every page touched, pages added by fixes included |

The Benchmark step uses the tool's own output and never times frames by
hand. With no tool, the perf checks estimate (`measured=false`) and the
notes point at `/graphics-programmer:build-measurement-tool`.

### Benchmark row

| Field | Meaning |
|---|---|
| `target`, `scene`, `tier`, `resolution` | What was run |
| `device`, `backend`, `driver` | Where it ran |
| `gpu_timing` | `available`, or `unavailable` when the backend reports no GPU timing (e.g. Metal); CPU frame time then includes the drawable or vsync wait |
| `runs` | Runs averaged into the row |
| `p50_ms`, `p95_ms`, `p99_ms`, `worst_ms` | Frame-time percentiles |
| `frames_over_budget`, `budget_ms` | Against the project budget |
| `measured` | `false` for software renderers, containers or anything other than the target hardware |

## Results

A status line, then the prioritised fix list, the benchmark table (when the
tool ran), unverified areas, areas estimated rather than measured, the docs
state (`docs checked`, `docs problems`, `docs unverified` or `docs missing`)
and notes.

| Status | Meaning |
|---|---|
| `usage:` | `scope` missing |
| `blocked:` | Planning or report failed (raw findings returned), docs missing, or blocking docs issues left after the last check |
| `unverified` | A checker or the benchmark returned nothing or did not run, a perf check was estimated, or the docs checker returned nothing |
| `done` | Every check returned and measured; docs checked with no blocking issue |

Notes list: no benchmark tool found, backends with `gpu_timing:
unavailable` (bound side inferred), and minor docs issues left after the
last check. Minor docs issues never block.

Any failed or unverified step gives a status other than `done`.

Related: [How to check presentation work before marking it done](../how-to/how-to-check-work-before-marking-it-done.md) · [frame-budget-profiling](skill-frame-budget-profiling.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `benchmark`, one per check area (`feel`, `readability`, `input`, and `perf: <target>` per target), `report`, `docs`, `docs check`, `docs fix:<n>`, `docs recheck:<n>`.

Independent steps: `docs check`, `docs recheck:<n>`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
