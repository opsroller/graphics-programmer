---
name: camera-systems
description: Use when building or tuning a camera - framing, follow behaviour, look-ahead, points of interest, transitions, shake, field of view, aspect ratios and safe areas - or when players report losing track of the action, motion discomfort, or a camera that fights their input.
---

# Camera systems

"Cameras are most noticeable when they fail" (John Nesky, GDC 2014). A good
camera serves three needs at once (Itay Keren, *Scroll Back*):

- **Attention:** show what the player needs to see now.
- **Interaction:** show where the player is going and what their input will
  affect; never contradict the controls.
- **Comfort:** no sudden, unpredictable or unmotivated motion.

## Inputs you need

- Design intent: genre, what must always be on screen, pacing, any
  cinematic moments.
- Target aspect ratios and resolutions; platform safe areas; where touch
  controls sit.
- Accessibility options the project supports (shake toggle, reduced motion,
  field-of-view setting).

## Method

1. **Write the framing contract.** For each game state: what must be fully
   in frame, what may be partly in frame, minimum on-screen size of primary
   elements, and the safe area. Fixed-board games may need only a fit rule.
2. **Choose the fit rule for aspect ratios.** Decide per axis: fit the play
   area (letterbox or extend the background), or fill and crop decoration
   only. Test the narrowest and widest supported ratios plus the platform
   safe-area insets. Never crop primary content.
3. **Pick follow behaviours from the standard toolkit**, simplest first:
   - *Fixed / fit-to-board:* nothing moves; for single-screen play.
   - *Camera window:* camera moves only when the target pushes the edge of a
     window; stops jitter from small movements.
   - *Smoothing:* close a fraction of the distance each frame; make it
     frame-rate independent (exponential decay on elapsed time), and check it
     does not fall behind fast targets.
   - *Snapping / platform snapping:* recentre on meaningful events (landing,
     turn end), not on every movement.
   - *Look-ahead / forward focus:* bias the frame toward the direction of
     travel or intent; switch sides with hysteresis so it does not flip.
   - *Cue focus / attractors:* pull toward points of interest (threats,
     goals) with weighted influence.
   - *Region focus / zones:* blend the target with an anchor per area.
4. **Drive the camera from presentation state, after logic and animation
   update,** so it frames what will actually be drawn this frame. Order:
   input -> logic step(s) -> presentation/animation -> camera -> render.
5. **Transitions:** ease in and out; prefer cuts to long whip-pans; never
   move the camera during precise player input without cause.
6. **Shake and impact:** use shake sparingly for impact; keep amplitude and
   duration in data; decay smoothly; always provide a setting to reduce or
   disable it (Game Accessibility Guidelines). Shake the view, never the
   logic coordinates used for input picking.
7. **Field of view (3D):** choose a default suited to the viewing distance
   (phone in hand vs desktop monitor vs TV) and offer adjustment where the
   project supports it.
8. **Debug view:** draw the window, look-ahead target, attractors and safe
   area as an overlay toggle; tuning a camera without it is guesswork.

## Decision rules

- If the camera moves while the player is not moving, there must be a
  reason the player can see.
- If players overshoot or lose the target, reduce smoothing lag or widen
  look-ahead before adding more behaviours.
- If two behaviours fight (look-ahead vs attractor), give them explicit
  weights and a priority, never two independent writers.
- Input picking (screen to world) must use the same camera transform that
  rendered the frame the player saw.

## Quality bar

- Primary elements stay in frame and above minimum size at every supported
  aspect ratio, inside safe areas.
- Smoothing behaves the same at 30, 60 and 120 fps.
- No unmotivated motion; shake can be disabled.
- Debug overlay exists for every non-trivial camera.

## Failure modes

- Frame-rate-dependent lerp (`pos += (target - pos) * 0.1` per frame).
- Look-ahead that flips back and forth on small input changes.
- Camera updated before animation, so it trails one frame and jitters.
- Cropping gameplay on tall or wide phones; UI or controls covering the
  play area.
- Shake that moves the hit-test transform, making taps miss.

## Documentation this work needs

New camera: **reference** for its parameters and framing contract; an
**explanation** of the chosen behaviours and the alternatives rejected; a
**how-to** ("How to tune the camera") if designers will tune it themselves.
Same PR, one kind per page.
