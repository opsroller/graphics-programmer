---
name: scene-composition
description: Use when building or changing a scene - its node/entity structure, layers and draw order, lighting, background and foreground, or anything that affects whether the play area reads clearly on the smallest supported screen.
---

# Scene composition

A scene is composed for **readability first, beauty second, cost always**.
The player must be able to see, at a glance and on the smallest supported
screen, everything the rules say matters.

## Inputs you need

- The design spec: what the player must see and distinguish (pieces, threats,
  targets, interactive objects) and the feel targets.
- The project profile: target devices, resolutions, aspect ratios, frame
  budget, where scenes and assets live, naming rules.
- The technical artist's asset budgets (triangles, texture memory, material
  count) for the scene.

## Method

1. **List the readable set.** Write down every element the player must
   identify. Rank them: primary (gameplay-critical), secondary (context),
   decoration. This list drives every later decision.
2. **Structure the scene graph by update and draw needs, not by art folders.**
   - Separate static from dynamic content; static content can be batched,
     baked or cached.
   - Group by material/state where the engine batches by state; fewer state
     changes means fewer draw calls.
   - Keep the presentation tree a view of game state: nodes are created,
     moved and destroyed by the presentation layer in response to events,
     never by inspecting rules (see `event-presentation`).
3. **Fix the layer and draw order.** Background, play area, gameplay
   effects, foreground decoration, then UI (owned by ui-developer). For each
   layer state: opaque or blended, sorted or not, depth-tested or not.
   - Draw opaque front-to-back where the GPU benefits; draw blended
     back-to-front.
   - Keep blended and alpha-tested surfaces small; they cost fill rate and
     defeat hidden-surface removal on tile-based mobile GPUs
     (see `platform-scaling`).
4. **Light for reading.** Primary elements get the strongest value contrast
   against their background. Check in grayscale: if gameplay elements merge
   in grayscale, they will merge for some players. Do not rely on hue alone
   to separate gameplay categories; add shape, outline or pattern.
5. **Compose for the camera.** Agree the framing with `camera-systems`: what
   is always in view, what may leave the frame, and the safe area. Nothing
   primary lives within platform safe-area insets or under touch controls.
6. **Budget the scene.** Estimate draw calls, visible triangles, overdraw
   layers and texture memory against the budget before polishing; measure
   on the weakest target with `frame-budget-profiling`.
7. **Polish within budget.** Add decoration, particles and post effects only
   while the readable set stays readable and the budget holds. Every polish
   item should be switchable per quality tier.

## Decision rules

- If a decorative element ever overlaps a primary element during play,
  move it, fade it, or put it behind.
- If two gameplay categories differ only by colour, add a second cue.
- If a full-screen effect (bloom, blur, vignette, full-screen overlay) is
  wanted on mobile, measure it first; full-screen passes cost bandwidth on
  every pixel.
- Prefer one larger draw over many small ones (atlases, instancing, static
  batching) when the engine supports it.
- Prefer baked or cached lighting for content that does not move.

## Quality bar

- The readable set is identifiable in a grayscale screenshot at the smallest
  supported resolution.
- Primary elements are never occluded by decoration, effects or touch
  controls.
- The scene meets its draw-call, overdraw and memory estimates on the weakest
  target, measured.
- Every optional effect has a quality-tier switch.

## Checklist

- [ ] Readable set written and ranked
- [ ] Static vs dynamic separated; batching opportunities used
- [ ] Layer and draw order documented (opaque/blended, sort rules)
- [ ] Grayscale and colour-vision check done
- [ ] Safe areas and touch-control zones respected
- [ ] Budget estimate, then measurement on weakest target
- [ ] Optional effects tier-switchable

## Failure modes

- **Beauty-first scenes:** gorgeous screenshots where the player cannot find
  the important piece in motion.
- **Folder-shaped hierarchies:** a scene tree mirroring the art folders,
  making batching and culling impossible.
- **Overdraw stacks:** several full-screen blended layers (fog, glow,
  vignette, particles) that the weakest GPU cannot fill.
- **Logic in the view:** scene scripts that check rules ("if matched then
  destroy") instead of reacting to events.

## Documentation this work needs

New or restructured scene: **reference** for its layer order, node roles and
budgets; an **explanation** ("About the <scene> composition") if a design
choice was made between alternatives. Classify with the compass, update in
the same PR, one kind per page.
