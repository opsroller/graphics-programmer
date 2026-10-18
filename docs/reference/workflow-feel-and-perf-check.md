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

The prioritised fix list, followed by: unverified areas (checkers that
returned nothing), areas estimated rather than measured, and the docs state
(`docs checked`, `docs problems`, `docs unverified` or `docs missing`). If
the report agent fails, the raw findings are returned instead.

Related: [How to check presentation work before marking it done](../how-to/how-to-check-work-before-marking-it-done.md) · [index](index.md)
