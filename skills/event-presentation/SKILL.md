---
name: event-presentation
description: Use when turning game events or state changes into animation and effects - spawns, moves, hits, removals, score changes, transitions - or when presentation and logic are tangled (logic waits on animations, animations decide outcomes, motion stutters or changes with frame rate).
---

# Event presentation

Game logic decides **what happened**. Presentation shows it, **in order,
with feel**, and never changes the outcome. The logic can run headless, in
tests, or ten times faster; the picture always tells the same story.

## The contract

Agree this with the gameplay programmer and write it down (reference doc):

- **Events, not peeking.** Logic publishes events that describe what
  happened ("entity 12 moved from A to B", "entity 7 removed, reason X",
  "score +50"). Each event carries all the data presentation needs,
  captured at send time, because the world may have changed by the time it
  plays (stale-state pitfall, *Game Programming Patterns*, Event Queue).
- **Ordering and grouping.** Events have a sequence number, and a group or
  step id for things that happen "at the same time" in rule terms.
- **One direction.** Presentation subscribes; it never calls back into rules
  and never sends events while handling one (feedback loops). Player intent
  goes back to logic only as input actions (see `input-handling`).
- **Logic does not wait.** Logic may run ahead of the picture. If the design
  needs input locked until an animation finishes, that is an explicit
  presentation-side "busy" state that gates *input*, not logic.

## Method

1. **Inventory events** from the design spec and the logic's event list.
   For each: what the player must perceive, the feel target (duration,
   easing, anticipation, impact, follow-through), and whether it may be
   skipped.
2. **Build a presentation queue.** Incoming events are appended; a player
   consumes them in order:
   - events in the same group play in parallel;
   - groups play in sequence, optionally overlapping by a set lead-in;
   - each item is a small "beat" (tween, sprite/skeletal clip, particle, camera
     cue, sound cue) with data-driven timing.
3. **Map events to beats in data**, not in scattered code: a table from
   event type to beat recipe, with durations and curves the designer can
   tune.
4. **Make time explicit.**
   - Animate on elapsed time with easing curves, never per-frame constants.
   - For continuous simulation, run logic on a fixed timestep with an
     accumulator and render the interpolated state between the previous and
     current step (`alpha = accumulator / dt`; slerp rotations). This keeps
     simulation deterministic and motion smooth at any refresh rate (Glenn
     Fiedler, *Fix Your Timestep*).
   - Cap simulation steps per frame to avoid the spiral of death.
5. **Support speed controls:** fast-forward (time scale), skip-to-end (apply
   every pending beat's final state immediately) and reduced motion (shorter
   or no tweens, no shake or flashes). The final visual state after skip must
   equal the state after full playback.
6. **Reconcile.** After the queue drains, the view must match logic state.
   In debug builds, assert it (compare view positions/flags with logic state)
   and log any drift.
7. **Pool and budget.** Reuse effect and node objects; avoid per-event
   allocation; give particle counts and simultaneous effects a per-tier cap
   (see `platform-scaling`).
8. **Verify feel**: record timings of each beat and compare with targets;
   play the sequence at 30/60/120 fps and with skip and reduced motion.

## Decision rules

- If presentation needs data the event does not carry, add it to the event;
  never read live logic state to fill the gap.
- If an animation must "know" whether a rule fired, the event list is
  incomplete: ask the gameplay programmer.
- If many identical events arrive together, aggregate them in presentation
  (one bigger effect) rather than stacking N copies.
- If the queue grows without bound (logic far ahead), shorten beats or
  time-compress the backlog; never drop events silently.

## Quality bar

- Running logic with presentation disabled gives identical outcomes.
- Skip, fast-forward and reduced motion never change the outcome or leave
  the view out of sync.
- Motion is frame-rate independent; no visible stutter from simulation and
  render rates differing.
- Every beat's timing lives in data and matches the feel targets.

## Checklist

- [ ] Event contract written (fields, ordering, groups)
- [ ] Event -> beat table in data
- [ ] Queue with group-parallel, sequence-serial playback
- [ ] Fixed-step + interpolation where simulation is continuous
- [ ] Skip / fast-forward / reduced motion
- [ ] Debug reconciliation check
- [ ] Pools and per-tier caps

## Failure modes

- Logic `await`s an animation, so tests need a renderer and speed-up breaks.
- Animation callbacks that apply rules ("on tween complete, remove entity
  and add score").
- Reading the live board/world in a handler and animating to where things
  are *now*, not where the event said.
- Feedback loops: a handler emits an event that triggers itself.
- Per-frame lerp constants that make motion faster on 120 Hz screens.

## Documentation this work needs

New presentation system: **reference** for the event contract and the
event-to-beat table; an **explanation** of the decoupling and timing
choices. New event types: update the reference. Same PR, one kind per page.
