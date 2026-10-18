*Reference, for anyone looking up what the `input-handling` skill covers while working.*

# input-handling

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/input-handling/SKILL.md`](../../skills/input-handling/SKILL.md) |
| Loaded when | use when mapping mouse, touch, pen, keyboard or controller input to game actions - adding a device, building virtual controls, gestures, remapping, dead zones, picking objects under a pointer - or when input feels laggy, gets stuck, or misses targets. |

## Inputs

Design action list; supported device families; accessibility options the project supports.

## Outputs

Action map with types and contexts; default bindings per device family in data; device adapters; tests.

## Quality bar

- Every action works on every supported device family; no stuck input after cancel, focus loss or disconnect.
- Bindings are data; remapping persists where supported.
- Touch targets meet the project minimum; no stick drift or jump.
- Picking hits what the player saw.

## Documentation owed

Reference (actions, default bindings); how-to if others will add devices. Written in the same PR as the work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
