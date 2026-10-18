*Reference, for anyone looking up what the `platform-scaling` skill covers while working.*

# platform-scaling

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/platform-scaling/SKILL.md`](../../skills/platform-scaling/SKILL.md) |
| Loaded when | use when one renderer must serve devices from low-end mobile to desktop - defining device tiers and quality settings, adding dynamic resolution or adaptive quality, handling thermal throttling and battery, matching refresh rates, or optimising for tile-based mobile GPUs. |

## Inputs

Supported device list; measured cost of each quality lever; platform thermal and refresh-rate facilities.

## Outputs

Tier definitions; independent quality levers with per-tier defaults; runtime adaptation (dynamic resolution, thermal); mobile render-pass load/store choices.

## Quality bar

- Each tier holds its target on its weakest example device in a soak test.
- Quality changes gradual and per lever.
- Low tier keeps the readable set intact.
- Mobile render passes have explicit load/store choices.

## Documentation owed

Reference (tiers and levers); explanation (scaling strategy); how-to (adding a device or tier). Written in the same PR as the work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
