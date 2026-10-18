*Reference, for anyone looking up the `renderer-decision` workflow's arguments, phases and results.*

# renderer-decision

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/renderer-decision.js`](../../workflows/renderer-decision.js) |
| Invoke | `/graphics-programmer:renderer-decision` |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `question` | yes | string | What must be decided, e.g. which global illumination, shadows and reflections each tier gets |
| `tiers` | no | string | Tier names, weakest devices and frame-time targets, or the docs page that has them; taken from the project when omitted |
| `wants` | no | string | The look the visual target asks for per tier; taken from the visual target docs when omitted |

Missing `question` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Tiers with frame budgets (ms), engine rendering paths per platform, up to eight candidate options, whether costs can be measured, docs plan |
| Evaluate | 1 per option, parallel | no | Platform support, estimated cost in ms per tier (labelled "estimate"), effect on the image, what it asks of art; no on-device captures, so parallel runs cannot interfere |
| Measure | 1, only when Plan says the targets are measurable | no (probe scenes only outside the project tree) | Captures each option on each tier's weakest device one at a time (median, p95) and replaces its estimate; options it could not capture keep their estimate |
| Decide | 1 (2 if the check fails) | no | Rendering path per tier and a feature matrix: technique per tier, cost, evidence, fallback; constraints for art |
| Check | 1 (2 if it finds problems) | no | Sums feature costs per tier against the frame budget; every feature has a fallback and evidence |
| Docs | 2 | yes | Writes the planned Diataxis pages, then checks one kind per page and that the numbers match |

## Decision shape

The Decide step returns the same object the technical-artist `visual-target`
workflow expects from its Renderer step, so either workflow can use the
other's answer.

| Field | Type | Meaning |
|---|---|---|
| `status` | `"decided"` or `"pending"` | `pending` when something outside the role must be answered first |
| `renderer` | string | Rendering path or backend per tier, and why |
| `features[]` | array | `feature`, `perTier`, `costMs`, `evidence` (`"estimate"` when not measured), `fallback` |
| `constraints` | string[] | What art content must respect on each tier |
| `openQuestions` | string[] | Present with `pending` |

## Results (`status`)

| Status | Meaning |
|---|---|
| `decided` | Returns `decision`, `perTierTotals`, `unevaluated` (empty), `docProblems` (empty), `next` |
| `pending` | Returns `decision` and `openQuestions`; nothing documented |
| `blocked` | Planning blocked, no options, decision or docs writer returned nothing, the budget check still fails after one revision (`open`), or docs problems remain |
| `unverified` | Decided and documented, but an option's evaluation returned nothing (`unevaluated`), or the budget check returned nothing |
| `done-docs-unverified` | The docs check returned nothing |

The workflow writes docs to the working tree but does not commit, push or open a PR. Every result that gets as far as Docs carries `next`, saying to ship the changes with `/engineering-practices:deliver-package` or `/engineering-practices:small-change`.

Related: [How to decide rendering features for quality tiers](../how-to/how-to-decide-rendering-features-for-quality-tiers.md) · [platform-scaling](skill-platform-scaling.md) · [index](index.md)

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `evaluate:<option>` (one per option named in the plan), `measure`, `decide:1`, `check:1`, and when the first check finds problems `decide:2`, `check:2`; then `docs`, `docs check`, `docs fix` and `docs recheck` (when the docs check finds problems).

Independent steps: `check:1`, `check:2`, `docs check`, `docs recheck`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
