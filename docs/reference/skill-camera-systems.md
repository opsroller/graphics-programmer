*Reference, for anyone looking up what the `camera-systems` skill covers while working.*

# camera-systems

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/camera-systems/SKILL.md`](../../skills/camera-systems/SKILL.md) |
| Loaded when | use when building or tuning a camera - framing, follow behaviour, look-ahead, points of interest, transitions, shake, field of view, aspect ratios and safe areas - or when players report losing track of the action, motion discomfort, or a camera that fights their input. |

## Inputs

Design intent; target aspect ratios and safe areas; touch-control layout; supported accessibility options.

## Outputs

Framing contract per game state; fit rule per axis; follow behaviours; shake settings; debug overlay.

## Quality bar

- Primary elements in frame and above minimum size at every supported aspect ratio, inside safe areas.
- Smoothing identical at 30, 60 and 120 fps.
- No unmotivated motion; shake can be disabled.
- Debug overlay for every non-trivial camera.

## Documentation owed

Reference (parameters, framing contract); explanation (behaviours chosen); how-to if designers tune it. Written in the same PR as the work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
