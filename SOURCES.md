# Sources

*Reference: the research behind this plugin. Each entry: title, link, what it informed.*

## Job postings and levels

- **Senior Graphics Programmer, Mobile (iOS/Android), PlayStation** - https://careers.playstation.com/senior-graphics-programmer-mobile-ios-android/job/5849862004 - mobile responsibilities: bottlenecks in memory, heat and battery; scaling across tiers, resolutions and refresh rates; dynamic resolution, LOD, frame pacing.
- **Senior Rendering Engineer, Mob Entertainment** - https://remotive.com/remote/jobs/software-development/senior-rendering-engineer-6246291 - profiling against platform frame budgets, material complexity budgets with technical artists, performance and fidelity standards docs.
- **Senior Graphics Programmer, Gameloft** - https://hitmarker.net/jobs/gameloft-senior-graphics-programmer-1658358 - CPU/GPU, memory and frame-timing optimisation across platforms; mentoring; senior expectations.
- **Principal Rendering Software Engineer, Electronic Arts** - https://ea.gr8people.com/jobs/159541/principal-rendering-software-engineer?locale=de - CPU/GPU profilers and frame capture, working with art, anticipating problems early; principal-level scope.
- **Principal Software Engineer, Rendering, Riot Games** - https://www.riotgames.com/en/j/8078139 - rendering authority, cross-department best practices, client performance, artist tools; lead-level expectations.

## Books and courses

- **Real-Time Rendering, 4th ed. (Akenine-Moller, Haines, Hoffman)** - https://www.routledge.com/Real-Time-Rendering/Akenine-Moller-Haines-Hoffman/p/book/9781138627000 - pipeline optimisation: locate the bottleneck stage before optimising; culling and acceleration.
- **Real-Time Rendering chapter overview** - https://realtimerendering.com/intro.html - scope of the field (pipeline, transforms, texturing, speed-up techniques, pipeline optimisation, hardware).
- **Advances in Real-Time Rendering in Games, SIGGRAPH 2025 course** - https://advances.realtimerendering.com/s2025/index.html - state of the art and the senior/principal expectation to track research, including low-end mobile lighting.
- **Game Programming Patterns: Event Queue (Robert Nystrom)** - https://gameprogrammingpatterns.com/event-queue.html - decoupling logic from presentation; stale state, feedback loops, global-queue pitfalls.
- **Game Programming Patterns: Decoupling Patterns** - https://gameprogrammingpatterns.com/decoupling-patterns.html - component and event-queue separation of domains.
- **Fix Your Timestep! (Glenn Fiedler)** - https://gafferongames.com/post/fix_your_timestep/ - fixed step, accumulator, interpolated rendering, spiral of death.

## Talks and practitioner write-ups

- **50 Camera Mistakes (John Nesky, GDC 2014)** - https://gdcvault.com/play/1020460/50-Camera - cameras are noticed when they fail; camera review mindset.
- **Video: 50 common game camera mistakes, Game Developer** - https://gamedeveloper.com/design/video-50-common-game-camera-mistakes----and-how-to-fix-them - summary of the talk.
- **Scroll Back: The Theory and Practice of Cameras in Side-Scrollers (Itay Keren)** - https://www.gamedeveloper.com/design/scroll-back-the-theory-and-practice-of-cameras-in-side-scrollers - camera windows, smoothing, snapping, look-ahead, cue and region focus; attention, interaction, comfort.

## Platform and GPU vendor guidance

- **Arm: Best practice principles for mobile game development** - https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/p2-best-practices-mobile-game-development - frame graphs on tile-based GPUs, content payload, profiling with counters.
- **Arm Mali best practices guide (announcement)** - https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/arm-mali-best-practices - shader precision, framebuffer compression, counters-based profiling.
- **Apple: Tailor your apps for Apple GPUs and tile-based deferred rendering** - https://developer.apple.com/tutorials/data/documentation/metal/tailor-your-apps-for-apple-gpus-and-tile-based-deferred-rendering.md - tile memory, bandwidth, load/store, merging passes, hidden-surface removal.
- **Android: Best practices for ADPF** - https://developer.android.com/games/optimize/adpf/best-practices-adpf - thermal-driven adaptive quality in small, independent, clamped steps; long-session testing.
- **Android: Optimize power efficiency** - https://developer.android.com/games/optimize/power - match refresh rate to frame rate, thermal API, game mode preference.
- **Android vitals: Slow sessions** - https://developer.android.com/games/optimize/vitals/slow-session - slow-frame and slow-session thresholds; frame pacing.
- **WebGL Best Practices (Jeff Gilbert)** - https://hackmd.io/@jgilbert/WebGLBestPractices - sync calls, context loss, device pixel ratio, texture formats, shader compile, limits.

## Engine and platform quality settings

- **Epic Games, Scalability reference for Unreal Engine** - https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-reference-for-unreal-engine - quality groups as independent levers (view distance, shadows, GI, reflections, post, effects) with per-level settings; informed the per-feature, per-tier decision in `renderer-decision`.
- **Epic Games, Setting up device profiles in Unreal Engine** - https://dev.epicgames.com/documentation/en-us/unreal-engine/setting-up-device-profiles-in-unreal-engine - mapping device classes to quality settings; tiers chosen by device capability.
- **Godot Engine, Overview of renderers** - https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html - an engine's rendering paths differ in feature set and platform support; the decision starts from which path each target can run.
- **Unity, Quality settings** - https://docs.unity3d.com/2020.3/Documentation/Manual/class-QualitySettings - named quality levels per platform as bundles of independent settings.
- **Android, Performance class** - https://developer.android.com/topic/performance/performance-class - grouping devices by declared capability rather than model name.
- **Apple, Metal feature set tables** - https://developer.apple.com/metal/capabilities/ - feature support varies by GPU family; check support per target before choosing a technique.

## Standards and guidelines

- **W3C Pointer Events Level 3** - https://www.w3.org/TR/pointerevents3/ - unified mouse/touch/pen model, pointer capture, cancel, touch-action, coalesced and predicted events.
- **Game Accessibility Guidelines (basic)** - https://gameaccessibilityguidelines.com/basic/ - remapping, sensitivity, large well-spaced touch targets, same input for UI, flashing, field of view.
- **Diataxis** - https://diataxis.fr/ - documentation structure for this plugin and for the docs steps in its workflows.

Note: the session's web search budget ran out before the W3C Gamepad API
and a few talks (e.g. on screen shake and game juice) could be looked up;
controller guidance relies on the sources above and common practice.
