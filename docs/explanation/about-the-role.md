*Explanation, for anyone who wants to understand what a graphics programmer does and why this plugin works the way it does.*

# About the graphics programmer role

## What the job is

A graphics programmer (also called a rendering engineer, or graphics
engineer in some studios) owns the path from game state to pixels and from
the player's hands back to game actions, under a hard time limit: one frame.
Job postings from large and small studios describe the same core: build and
maintain real-time rendering systems, find and fix bottlenecks in rendering,
memory, heat and battery, keep the game stable and fast from flagship to
low-end hardware, design systems that scale across performance tiers,
resolutions and refresh rates, and work closely with technical artists and
designers to reach the visual goal within budget.

In smaller teams the same person also owns cameras, input, and the code that
turns game events into animation, because those systems sit at the same
seam: between what the game *is* and what the player *perceives*. This
plugin keeps those responsibilities together for that reason.

## Why presentation is decoupled from logic

The most important rule in the role is that presentation never decides
outcomes. This comes from long practice in game architecture: Robert
Nystrom's *Game Programming Patterns* describes event queues as a way to
decouple *when* something happens from *when* it is processed, and warns of
the pitfalls (stale state, feedback loops, global queues). Glenn Fiedler's
*Fix Your Timestep* shows why simulation should step at a fixed rate while
rendering interpolates between steps.

The payoff is large. Logic can be tested without a renderer, run faster than
real time, replayed and networked. Presentation can be skipped, sped up or
reduced for accessibility without changing the result. The cost is a little
more ceremony: events must carry their data, and the presentation layer
needs a queue. That trade is almost always worth it; the alternative,
animations that apply rules on completion, is one of the most common sources
of desync bugs.

## Why budgets are in milliseconds, measured on the weakest device

Frame rate is a reciprocal and averages hide hitches; frame time adds up and
percentiles show the stutter players actually feel. *Real-Time Rendering*
(Akenine-Moller, Haines, Hoffman) frames optimisation as finding the
pipeline's slowest stage before changing anything, which is why the
profiling skill insists on identifying the bound side first.

The weakest device matters because mobile GPUs are not small desktop GPUs.
Arm's and Apple's guidance both describe tile-based rendering, where the
scarce resource is memory bandwidth, which also costs heat and battery.
Android's own guidance asks games to watch thermal headroom, match refresh
rate to frame rate, and test sessions of fifteen minutes or more, because a
phone that holds 60 fps for one minute may not hold it for ten.

## Why so much attention to cameras and input

John Nesky's GDC talk on camera mistakes starts from the observation that
cameras are most noticeable when they fail. Itay Keren's survey of
side-scroller cameras gives a shared vocabulary (camera windows, look-ahead,
cue focus, region focus) and three needs a camera must balance: attention,
interaction and comfort. Input is the other half of feel: the W3C Pointer
Events model treats mouse, touch and pen as one stream with explicit
cancellation, and the Game Accessibility Guidelines ask for remapping,
adjustable sensitivity and large touch targets. A role that owns both
cameras and input can make them agree, for example by picking with the same
transform that drew the frame.

## Boundaries with neighbouring roles

- **gameplay-programmer** owns rules and state and publishes events; the
  graphics programmer consumes them. The event contract is the shared
  interface and both sides sign it.
- **game-designer** sets feel targets and camera intent; the graphics
  programmer implements them and reports deltas in numbers.
- **technical-artist** owns how materials and assets look and their asset
  budgets; the graphics programmer owns the render pipeline and the frame
  budget those budgets come from. Shaders sit on the seam: material looks
  belong to the technical artist, pipeline passes to the graphics
  programmer.
- **ui-developer** builds menus and HUD on top of the same input actions.
- **frontend-web-developer** owns the page around a web build; the graphics
  programmer owns what happens inside the canvas.

## Quality bars, and the trade-offs behind them

The plugin's bars are strict on purpose: target frame rate held on the
weakest device in a long session; outcomes identical with presentation
disabled; every action on every device; readability in grayscale at the
smallest screen. Each one trades some convenience for robustness. Measuring
on a real phone is slower than reading an editor counter, but editor numbers
routinely mislead. Data-driven timings are more work than constants, but
they let designers tune feel without a programmer. Small, independent
quality levers are more code than three presets, but they avoid the jarring
jumps and over-aggressive scaling that Android's adaptive-performance
guidance warns about.

## How the role grows

Career ladders and postings show a consistent progression:

- **Junior:** implements presentation features and fixes within existing
  systems and budgets, with guidance; learns to profile on device.
- **Mid-level:** owns a system (camera, input layer, an effect pipeline)
  end to end; profiles independently; explains constraints to artists.
- **Senior:** designs systems that scale across tiers and platforms, sets
  budgets, debugs across GPU vendors, mentors through code review, writes the
  performance and fidelity standards.
- **Principal / lead:** the team's rendering authority; sets rendering
  strategy across projects, coordinates with other departments, anticipates
  technical risk early, and keeps up with research such as the SIGGRAPH
  *Advances in Real-Time Rendering* course.

The tools change at every level and every studio. The method in this plugin
(contracts, measurement, budgets, readability) does not, which is why it
names tools only as examples.

See [SOURCES.md](../../SOURCES.md) for the full list of sources.
