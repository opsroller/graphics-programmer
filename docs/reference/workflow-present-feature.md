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

Missing `feature` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Event contract, beats, scene, camera, input actions, budget impact, files, docs plan (compass), contract gaps |
| Build | 1 | yes | Implements the plan; commits |
| Verify | 3 + one per target, parallel | no | feel, input, readability, perf per target |
| Fix | 1 per round, max 2 rounds | yes | Applies all open blockers in one pass |
| Docs | 1 | yes | Writes the planned Diataxis pages on the same branch |
| Docs check | 1 | no | One kind per page, titles, links, coverage |

## Results

| Result starts with | Meaning |
|---|---|
| `usage:` | `feature` missing |
| `blocked: planning failed` | Plan agent returned nothing |
| `blocked: the event contract is incomplete` | Lists event fields to request from the gameplay-programmer |
| `blocked: build agent returned nothing` | No changes confirmed |
| `blocked: fix agent returned nothing` / `blocked after N fix rounds` | Lists open blockers; nothing proceeds to docs |
| `blocked: docs agent returned nothing` / `blocked: docs check failed` | Work not done without docs |
| `unverified:` | Built and documented, but a Verify check returned nothing, a perf check was estimated rather than measured, or the docs checker returned nothing; lists which |
| `done:` | Built, every check returned and measured, docs checked |

Any failed or unverified step gives a status other than `done`. Checks that
crash are listed as unverified, never dropped.

Related: [How to present a game feature](../how-to/how-to-present-a-game-feature.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, one per area (`feel`, `input`, `readability`, and `perf: <target>` per target; `<area> round <n>` from the second round), `fix round <round>`, `docs`, `docs check`.

Independent steps: every area check (`feel`, `input`, `readability`, `perf: <target>`, and `<area> round <n>` in later rounds), `docs check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
