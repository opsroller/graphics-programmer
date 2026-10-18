*Reference, for anyone looking up what the `scene-composition` skill covers while working.*

# scene-composition

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/scene-composition/SKILL.md`](../../skills/scene-composition/SKILL.md) |
| Loaded when | use when building or changing a scene - its node/entity structure, layers and draw order, lighting, background and foreground, or anything that affects whether the play area reads clearly on the smallest supported screen. |

## Inputs

Design spec (readable set, feel targets); project profile (targets, resolutions, budget); technical-artist asset budgets.

## Outputs

Scene structure; documented layer and draw order; budget estimate and measurement on the weakest target.

## Quality bar

- Readable set identifiable in grayscale at the smallest supported resolution.
- Primary elements never occluded by decoration, effects or touch controls.
- Draw-call, overdraw and memory estimates met on the weakest target, measured.
- Every optional effect switchable per quality tier.

## Documentation owed

Reference (layer order, node roles, budgets); explanation if a design choice was made. Written in the same PR as the work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
