---
name: scene-composition
description: Use when building or changing a scene, camera or lighting setup.
---

# Scene composition

- Camera framing serves readability: the play area fills the screen at
  the smallest target resolution, nothing important is occluded.
- Lighting: one key, soft fill, ambient from the environment; check
  contrast between every pair of gameplay-relevant colours.
- Pool frequently spawned objects. Map game coordinates to world space
  in one function.
- Placeholders by manifest name until art lands, so swapping in real
  assets needs no code change.
