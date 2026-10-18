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
| Handoff | 1 | yes | Commits everything the run wrote on a feature branch (cut from the default branch if needed), pushes, runs the project's checks on the pushed head; opens no PR |

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

Once the handoff passes, the result is an object:

| Output | Type | Meaning |
|---|---|---|
| `status` | string | `done` (every check returned and measured, docs checked) or `unverified` (a Verify check returned nothing or a perf check was estimated) |
| `summary` | string | The text result: starts with `done:` or `unverified:` and lists what is unverified |
| `build` | string | Build agent's summary of files changed |
| `docs` | object | `pages` touched and `undocumented` changes |
| `unverified` | string[] | Verify checks that returned nothing |
| `estimated` | string[] | Perf checks estimated rather than measured |
| `handoff` | object | What deliver-package takes as `prior`; see Handoff |
| `next` | string | How to ship it: deliver-package for a work package, land-pr otherwise |

Any failed or unverified step gives a status other than `done`. Checks that
crash are listed as unverified, never dropped.

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the presentation ships
without being built again: `from` (`graphics-programmer:present-feature`),
`branch`, `pr`, `head_sha`, `tests_pass`, `docs`, `undocumented`, `notes`
(unverified and estimated checks, if any). With no work package, land the
branch with land-pr instead; `next` names both.

Related: [How to present a game feature](../how-to/how-to-present-a-game-feature.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, one per area (`feel`, `input`, `readability`, and `perf: <target>` per target; `<area> round <n>` from the second round), `fix round <round>`, `docs`, `docs check`, `handoff`.

Independent steps: every area check (`feel`, `input`, `readability`, `perf: <target>`, and `<area> round <n>` in later rounds), `docs check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
