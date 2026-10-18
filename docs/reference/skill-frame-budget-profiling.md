*Reference, for anyone looking up what the `frame-budget-profiling` skill covers while working.*

# frame-budget-profiling

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/frame-budget-profiling/SKILL.md`](../../skills/frame-budget-profiling/SKILL.md) |
| Loaded when | use when setting frame-time budgets, profiling CPU or GPU cost, chasing stutter, hitches or a frame-rate regression, or before claiming any presentation work is fast enough. |

## Inputs

Target frame rates and device tiers; a release-like build; target hardware.

## Outputs

Budgets in ms and sub-budgets per tier; repeatable scenario; before/after reports with median, p95, p99, bound side. On a backend with no GPU timing (e.g. Metal): `gpu_timing: unavailable`, budgets judged on total frame time (uncapped where possible), GPU cost from the platform GPU profiler, bound side marked inferred.

## Quality bar

- Budget per tier written and agreed.
- Every performance claim has device, build, scenario and percentiles.
- Weakest device holds target for a 15+ minute soak.
- No unexplained frames over budget in the standard scenario.

## Documentation owed

Reference (budgets, scenario); how-to (profiling procedure); explanation (trade-off decisions). Written in the same PR as the work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
