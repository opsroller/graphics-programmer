*How-to guide, for a graphics programmer adding support for a new input device family to a project.*

# How to add an input device

This guide shows you how to support a new device family (for example a
controller on a project that only had touch) without touching game logic.

1. **List the actions** the game already defines, from the project's input
   reference page.
2. **Write default bindings** for the new device for every action. If an
   action has no natural binding, raise it with the game-designer; every
   action must be reachable.
3. **Add a device adapter** that normalises the device's raw input into the
   existing action types (button, axis, vector, pointer target).
4. **Apply device-specific handling** from `input-handling`:
   - controllers: radial dead zone, trigger thresholds, connect/disconnect,
     focus navigation for pointer-only UI (with the ui-developer);
   - touch: target sizes, tap/long-press/drag thresholds, cancel handling;
   - mouse/pen: pointer capture for drags, cancel handling.
5. **Add on-screen prompts** for the new device; this is the only place code
   may branch on device type.
6. **Test** every action, plus cancel, focus loss and disconnect.
7. **Update the input reference page** with the new bindings in the same PR.

See the [input-handling reference](../reference/skill-input-handling.md).
