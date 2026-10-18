*Reference, for anyone looking up the `implement-renderer-system` workflow's arguments, phases and results.*

# implement-renderer-system

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/implement-renderer-system.js`](../../workflows/implement-renderer-system.js) |
| Invoke | `/graphics-programmer:implement-renderer-system` |
| Skills used | platform-scaling, frame-budget-profiling, headless-rendering (machines with no GPU or display), web-rendering (browser targets); engineering-practices project-onboarding, provenance, peer-coordination, git-workflow |

Builds one engine-side rendering system from a decision that already
exists: for example a quality-tier system that applies a profile per tier
to the renderer, adaptive resolution, a post stack or a lighting setup. It
never decides tiers or features; that is
[renderer-decision](workflow-renderer-decision.md).

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `system` | yes | string | Name of the system, e.g. `quality tiers` |
| `spec` | yes | string | The decision or spec to implement: a docs path or section holding tiers, the technique per feature per tier, fallbacks and costs |
| `plan` | no | object or string | The `implementationPlan` from `renderer-decision` run with `decision`; Plan starts from it |
| `wp` | no | string | Work package id. Goes into the PR body as `Refs:` and makes `next` point at deliver-package |
| `branch` | no | string | Existing branch to work on; its open PR is reused |
| `pr` | no | string | Existing PR to work on, with its head branch |

Missing `system` or `spec` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Reads the decision; maps each tier and feature to an engine setting or API from the engine's docs; case list, public interface, one headless self-test, cost budget per tier, whether it can be measured, `AMBIGUOUS:` items with defaults, doc kinds via the compass. Blocks when the spec holds no decision |
| Build | 1 | yes | Failing tests in one test file and the self-test, then code in the language and location the project profile names for engine-side code, with per-tier values in data. Measures cost per tier (or labels it estimate). Commits |
| Attack | 4, parallel, independent | no | Lenses: tier fidelity, fallbacks and platforms, runtime lifecycle, cost. Each returns failing test code |
| Fix | 0-1 | yes | Adds all returned tests in one edit and fixes the code. Runs only if tests were returned. Only `failing` or a red suite blocks |
| Docs | 1 | yes | Writes the planned pages; the reference lists the interface, each tier's settings, fallbacks, self-test and cost per tier |
| Check | 1, independent | no | Runs the suite and the self-test, checks cost against budget and settings against the decision, and each touched page holds one kind. Only `problems` blocks; an estimated cost is a note |
| Hand off | 1 | no (pushes) | Pushes the branch; updates the body of the open PR (`pr`, or one already open for the branch), and opens a draft PR only if none is open. The body lists docs pages as path and Diataxis kind. Does not mark it ready, request review or merge |

## Headless self-test

One command the Plan names and Build adds to the test suite. It starts the
engine without a window (or in the project's offscreen mode), applies every
tier in turn, reads each setting back, prints what it checked and exits
non-zero on any mismatch. It runs wherever the suite runs; if CI needs a
change in a path another role owns, Build makes the smallest change and
says so in `notes`. On a machine with no GPU or display, the self-test
renders per [headless-rendering](skill-headless-rendering.md), and a cost
measured there is labelled `estimate`.

## Results

| Field | Meaning |
|---|---|
| `status` | `done`; `unverified` (an Attack lens returned nothing, or the check agent failed); `blocked` with `open` or `reason`, and `notes`. `open` holds only failures |
| `cases` | Number of cases planned |
| `ambiguous` | Defaults taken, as named values in the tier data |
| `attackTestsAdded` | Tests added from the Attack phase |
| `unverifiedLenses` | Attack lenses whose agent failed |
| `selfTest` | The self-test command |
| `measured` | Cost per tier, measured or labelled estimate |
| `docs`, `undocumented` | Pages touched; changes left undocumented and why |
| `notes` | Informational notes by step. Never blocking |
| `handoff` | `{ from, branch, pr, head_sha, tests_pass, docs, undocumented, non_original, notes }`, the object engineering-practices deliver-package takes as `prior`. Only when `status` is `done`: an `unverified` result has no `handoff`, so deliver-package cannot ship it as checked |
| `pushed` | `{ branch, pr, head_sha }`, only when `status` is `unverified`: where the work was pushed. `next` names the `run.only` labels to rerun; that run returns the handoff |
| `next` | With `wp`: deliver-package with `prior` set to this result, then land-pr. Without: land-pr, which marks the PR ready, asks the code reviewer and squash-merges |

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, `attack:tier-fidelity`, `attack:fallbacks-and-platforms`, `attack:runtime-lifecycle`, `attack:cost`, `fix`, `docs`, `check`, `handoff`.

Independent steps: the four `attack:` steps and `check`. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not do the work (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

Related: [How to build a rendering system from a renderer decision](../how-to/how-to-build-a-rendering-system-from-a-renderer-decision.md) · [renderer-decision](workflow-renderer-decision.md) · [platform-scaling](skill-platform-scaling.md) · [index](index.md)
