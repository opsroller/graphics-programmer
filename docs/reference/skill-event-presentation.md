*Reference, for anyone looking up what the `event-presentation` skill covers while working.*

# event-presentation

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/event-presentation/SKILL.md`](../../skills/event-presentation/SKILL.md) |
| Loaded when | use when turning game events or state changes into animation and effects - spawns, moves, hits, removals, score changes, transitions - or when presentation and logic are tangled (logic waits on animations, animations decide outcomes, motion stutters or changes with frame rate). |

## Inputs

Logic event list and data; design feel targets; per-tier effect caps.

## Outputs

Event contract; event-to-beat table in data; presentation queue; fixed-step interpolation where needed; skip, fast-forward and reduced motion.

## Quality bar

- Logic run with presentation disabled gives identical outcomes.
- Skip, fast-forward and reduced motion never change outcome or leave the view out of sync.
- Motion frame-rate independent.
- Beat timings in data, matching feel targets.

## Documentation owed

Reference (event contract, event-to-beat table); explanation (decoupling and timing choices). Written in the same PR as the work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
