---
name: input-handling
description: Use when mapping mouse, touch, pen, keyboard or controller input to game actions - adding a device, building virtual controls, gestures, remapping, dead zones, picking objects under a pointer - or when input feels laggy, gets stuck, or misses targets.
---

# Input handling

Devices produce raw signals; the game understands **actions**. Keep a thin,
testable layer between them so every action works on every supported device
and the logic never knows which device was used.

## Model

```
raw device events -> device adapters -> action map (bindings) -> actions -> logic
                                         ^ remapping, sensitivity, dead zones
```

- **Actions** are named in game terms ("confirm", "move", "aim", "rotate",
  "pause"). Each has a type: button (pressed/held/released), axis (1D) or
  vector (2D), or pointer target (screen position resolved to a world
  target).
- **Bindings** map device inputs to actions and live in data, so players
  can remap and the project can ship per-platform defaults.
- **Device adapters** normalise each device family; the rest of the code
  never branches on device type except to show the right prompts.

## Method

1. **List actions from the design**, with type and context (gameplay, UI,
   paused). The UI developer uses the same action layer for menus.
2. **Write default bindings** for every supported device family. Every action
   must be reachable on every family (the Game Accessibility Guidelines
   require all UI to be usable with the gameplay input method too).
3. **Pointer input (mouse, touch, pen):** treat them as one pointer stream
   with a type, as the W3C Pointer Events model does:
   - track each contact by its id only while it is active;
   - capture the pointer for drags so moving off the element keeps the drag;
   - treat *cancel* (system gesture, focus loss, device disconnect) as "this
     input is over": release held actions, end drags, reset virtual sticks;
   - use coalesced samples for fast aiming or drawing; use predicted samples
     only for visual feedback, never for game decisions;
   - pick with the camera transform of the frame the player saw.
4. **Touch specifics:** virtual controls and interactive elements large and
   well spaced (a common floor is about 44-48 density-independent pixels or
   roughly 7-10 mm); never placed so the thumb covers primary content;
   distinguish tap, long-press and drag with explicit thresholds (movement
   slop in physical units, hold time in ms).
5. **Controller specifics:** radial dead zone on sticks (scale the remaining
   range back to 0..1 so there is no jump), separate trigger thresholds,
   sensitivity curve per axis, focus navigation for any pointer-only UI.
   Handle connect/disconnect at any time; pause or prompt on disconnect.
6. **Keyboard/mouse specifics:** bind by physical key position where layouts
   differ; never rely on a single key that does not exist on some layouts.
7. **Timing and feel:** sample input once per frame before the logic step;
   buffer short presses (a few frames/ms) so inputs during animations are not
   lost if the design wants that; measure input-to-photon latency on the
   weakest device.
8. **Options:** remapping, sensitivity, toggle-vs-hold for held actions,
   haptics toggle, invert axes, where the project supports them.
9. **Test** each action on each device family, including cancel and
   disconnect paths; unit-test the action map without devices.

## Decision rules

- If code asks "is this a touch device?" to change game rules, stop; route
  through actions. Device checks are for prompts and layout only.
- If two actions share a binding in the same context, resolve by context
  priority, never by order of registration.
- If input is ignored while an animation plays, that must be a deliberate
  design rule with buffering or feedback, not a side effect.

## Quality bar

- Every action works on every supported device family; no action is stuck
  after cancel, focus loss or disconnect.
- Bindings are data; remapping (where supported) persists.
- Touch targets meet the project's minimum size; stick dead zones produce
  no drift and no jump.
- Picking hits what the player saw, including during camera motion.

## Failure modes

- Stuck buttons after a system gesture or alt-tab (cancel not handled).
- Browser or OS scrolling/zooming the game on drag (see `web-rendering`).
- Axial (square) dead zones that make diagonals sticky.
- Tap targets sized in raw pixels, tiny on high-density phones.
- Logic reading device state directly, making tests and remapping impossible.

## Documentation this work needs

New input system or action: **reference** for the action list and default
bindings per device; a **how-to** ("How to add a new input device") if
others will extend it. Same PR, one kind per page.
