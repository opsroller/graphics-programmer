*Reference, for anyone looking up what the `graphics-programmer` agent does and does not do.*

# graphics-programmer agent

| Field | Value |
|---|---|
| Type | Subagent |
| File | [`agents/graphics-programmer.md`](../../agents/graphics-programmer.md) |
| Base | Loads `engineering-practices` and follows `project-onboarding` before any task |

## Owns

| Area | Skill |
|---|---|
| Scenes, layers, draw order, lighting for readability | [scene-composition](skill-scene-composition.md) |
| Cameras: framing, follow, transitions, shake, aspect ratios | [camera-systems](skill-camera-systems.md) |
| Game events presented as animation, decoupled from logic | [event-presentation](skill-event-presentation.md) |
| Mouse, touch, pen, keyboard, controller to actions | [input-handling](skill-input-handling.md) |
| Frame-time budgets, CPU/GPU profiling, stutter | [frame-budget-profiling](skill-frame-budget-profiling.md) |
| Device tiers, quality levers, thermal, mobile GPU rules | [platform-scaling](skill-platform-scaling.md) |
| Rendering path and features per quality tier, costed with fallbacks | [platform-scaling](skill-platform-scaling.md), [renderer-decision](workflow-renderer-decision.md) |
| Engine-side rendering systems that apply a decision, such as quality tiers | [platform-scaling](skill-platform-scaling.md), [implement-renderer-system](workflow-implement-renderer-system.md) |
| Rendering and input in web builds | [web-rendering](skill-web-rendering.md) |

## Does not own

| Area | Owner |
|---|---|
| Game rules, systems, state | gameplay-programmer |
| Feel targets, camera intent, specs | game-designer |
| Material/shader look, in-game 3D assets, asset budgets, pipeline, the visual target per tier | technical-artist |
| Menus, HUD, localization, UI accessibility | ui-developer |
| 2D identity, palette, icons | graphic-designer |
| Sound | sound-designer |
| Web page around the build, hosting | frontend-web-developer |
| Builds, CI, releases | devops-engineer |
| PR review | code-reviewer |

## Never

- Game rules, random rolls or outcomes in presentation code; logic waiting on animation.
- Performance quoted from editor, debug or desktop builds for phone targets.
- Average FPS without frame time.
- Hard-coded device names, asset paths or bindings outside the places the project names.
- Vendor-specific paths without a fallback.
- Shake, flashing or rapid motion without a reduce/disable option.
