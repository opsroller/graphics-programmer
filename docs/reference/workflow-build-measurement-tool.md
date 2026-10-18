*Reference, for anyone looking up the `build-measurement-tool` workflow's arguments, phases and results.*

# build-measurement-tool

| Field | Value |
|---|---|
| Type | Workflow |
| File | [`workflows/build-measurement-tool.js`](../../workflows/build-measurement-tool.js) |
| Invoke | `/graphics-programmer:build-measurement-tool` |
| Skills used | frame-budget-profiling, platform-scaling, headless-rendering, web-rendering (browser targets); engineering-practices project-onboarding, provenance, peer-coordination, git-workflow |

Builds a tool that measures a build against budgets and acceptance
criteria that already exist: for example a benchmark scene with a
repeatable worst-case scenario, frame-time percentile capture, automated
acceptance checks on captures (readability, contrast, colour-blind
separation) and a check of the active rendering features against a tier
table. It never sets a budget, a criterion or a threshold value: budgets
come from [renderer-decision](workflow-renderer-decision.md) or the
project profile, criteria and thresholds from their owner (usually the
technical artist's visual target).

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `tool` | yes | string | What the tool measures, e.g. `benchmark scene and readability checks` |
| `spec` | yes | string | Where the budgets, acceptance criteria or tier feature tables are written: docs paths or sections |
| `targets` | no | string | Devices or tiers to run it on. Default: the targets and tiers in the project profile |
| `wp` | no | string | Work package id. Goes into the PR body as `Refs:` and makes `next` point at deliver-package |
| `branch` | no | string | Existing branch to work on; its open PR is reused |
| `pr` | no | string | Existing PR to work on, with its head branch |

Missing `tool` or `spec` returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Reads the spec. Plans the scenario (deterministic, with drift detection, warm-up and capture lengths), per-frame samples and their engine APIs, statistics, a versioned report with device and build info, one check per criterion or tier row (method, threshold, owner, known-bad input), manual criteria, each place it runs, test cases, `AMBIGUOUS:` items with defaults and doc kinds. Blocks when nothing says what to measure |
| Build | 1 | yes | Failing tests first in one test file: statistics, scenario, each check on a known-good and a known-bad input. Engine-free parts stay engine-free; in-engine parts follow the profile's rules for engine-side code; thresholds are named options. Adds a CI smoke run. Commits |
| Run | 1 | no | Runs the tool end to end wherever it can, including this machine through [headless-rendering](skill-headless-rendering.md). Checks failing on current content become `findings`; crashes, bad reports or drift become problems for Fix |
| Attack | 4, parallel, independent | no | Lenses: measurement validity, check correctness, tier coverage, environments. Each returns failing test code |
| Fix | 0-1 | yes | Adds all returned tests in one edit and fixes the tool and any Run problems. Only `failing` or a red suite blocks |
| Docs | 1 | yes | Reference for files, scenario, samples, report fields and checks with thresholds and owners; a how-to per place it runs, saying what numbers from there do not mean |
| Check | 1, independent | no | Runs the suite and the CI smoke command, confirms every check has a good and a bad input test and a sourced threshold, and each touched page holds one kind |
| Hand off | 1 | no (pushes) | Pushes the branch; opens a draft PR if none is open. Does not mark it ready, request review or merge |

## Content failures are findings

A check that fails on the game as it is today is the tool working. It
never blocks the tool's PR: it is returned in `findings` with the role
that owns the content, and `next` says to send it there. Tuning a
threshold is its owner's call, not a change to the tool's logic.

## Software-rendered runs

Runs on a machine with no GPU (a cloud container, a CI runner) prove the
tool works: it starts, plays the scenario without drift, writes a valid
report and runs its checks. Their frame times are labelled "software
renderer, not a measurement" and never compared with budgets. See
[headless-rendering](skill-headless-rendering.md).

## Results

| Field | Meaning |
|---|---|
| `status` | `done`; `unverified` (an Attack lens returned nothing, or the check agent failed); `blocked` with `open` or `reason`, plus `findings` and `notes`. `open` holds only failures of the tool |
| `cases` | Number of cases planned |
| `checks`, `manual` | Criteria with an automated check; criteria left manual and why |
| `ambiguous` | Defaults taken, as named options |
| `attackTestsAdded` | Tests added from the Attack phase |
| `unverifiedLenses` | Attack lenses whose agent failed |
| `commands` | Commands that run the tool and its checks |
| `ran` | Each run: where, whether software-rendered, report path, summary |
| `findings` | Checks failing on current content, each with the owning role |
| `docs`, `undocumented` | Pages touched; changes left undocumented and why |
| `notes` | Informational notes by step. Never blocking |
| `handoff` | `{ from, branch, pr, head_sha, tests_pass, docs, undocumented, non_original, notes }`, the object engineering-practices deliver-package takes as `prior` |
| `next` | Send findings to their owners, if any; then with `wp`: deliver-package with `prior` set to this result, then land-pr. Without: land-pr |

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, `run`, `attack:measurement-validity`, `attack:check-correctness`, `attack:tier-coverage`, `attack:environments`, `fix`, `docs`, `check`, `handoff`.

Independent steps: the four `attack:` steps and `check`. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not do the work (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

Related: [How to build a benchmark and acceptance checks](../how-to/how-to-build-a-benchmark-and-acceptance-checks.md) · [headless-rendering](skill-headless-rendering.md) · [frame-budget-profiling](skill-frame-budget-profiling.md) · [index](index.md)
