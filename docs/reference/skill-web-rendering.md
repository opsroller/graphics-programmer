*Reference, for anyone looking up what the `web-rendering` skill covers while working.*

# web-rendering

| Field | Value |
|---|---|
| Type | Skill |
| File | [`skills/web-rendering/SKILL.md`](../../skills/web-rendering/SKILL.md) |
| Loaded when | use when the game renders in a browser - canvas sizing and device pixel ratio, frame loop and pacing, GPU context loss, browser graphics limits and extensions, texture formats, pointer and gamepad input in a page, background tabs, or a web build that is slow, blurry, or breaks on some browsers. |

## Inputs

Browser and device matrix from the project profile; tier budgets; the page that hosts the canvas (frontend-web-developer).

## Outputs

Canvas sizing and pixel-ratio policy; browser frame loop; capability queries and fallbacks; context-loss handling; page input setup.

## Quality bar

- Zero graphics API errors in a normal session; out-of-memory and context loss handled.
- Survives context loss, tab switch, resize and orientation change.
- No page scroll or zoom during play; no stuck input.
- Holds the tier target in the weakest supported browser and device.

## Documentation owed

Reference (pixel-ratio caps, browsers, fallbacks); how-to (cross-browser testing); explanation (policy decisions). Written in the same PR as the work, one Diataxis kind per page.

## Related

[Skills index](index.md#skills) · [Agent](agent.md) · [About the role](../explanation/about-the-role.md)
