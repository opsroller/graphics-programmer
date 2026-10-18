---
name: event-animation
description: Use when animating game results: moves, clears, falls, spawns, effects.
---

# Event-driven animation

- Play a result's events strictly in order; chain tweens, await each
  phase, lock input until done.
- After playback, the view must equal the game state; assert it in
  debug builds.
- All timings in one constants file, matching the designer's feel
  targets.
- Juice (particles, shake, flashes) supports events, never hides state.
