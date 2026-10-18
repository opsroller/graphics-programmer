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

Missing `scope` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Summary of the change; docs plan |
| Check | 3 + one per target, parallel | no | feel, readability, input, perf per target |
| Report | 1 | no | One fix list ordered by player-visible impact |
| Docs | 1 | yes | Records measured results in the project docs |
| Docs check | 1 | no | One kind per page, titles, links |

## Results

A status line, then the prioritised fix list, unverified areas (checkers
that returned nothing), areas estimated rather than measured, and the docs
state (`docs checked`, `docs problems`, `docs unverified` or `docs missing`).

| Status | Meaning |
|---|---|
| `usage:` | `scope` missing |
| `blocked:` | Planning or report failed (raw findings returned), docs missing, or docs check found problems |
| `unverified` | A checker returned nothing, a perf check was estimated, or the docs checker returned nothing |
| `done` | Every check returned and measured; docs checked |

Any failed or unverified step gives a status other than `done`.

Related: [How to check presentation work before marking it done](../how-to/how-to-check-work-before-marking-it-done.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, one per check area (`feel`, `readability`, `input`, and `perf: <target>` per target), `report`, `docs`, `docs check`.

Independent steps: `docs check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
