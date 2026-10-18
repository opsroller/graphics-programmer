*How-to guide, for a graphics programmer setting up or revising a project's performance targets.*

# How to set frame budgets for device tiers

This guide shows you how to define device tiers and frame-time budgets for a
project that must run from low-end phones to desktop.

1. **Collect the supported devices** from the project profile. If there is
   no list, ask the project-manager for the minimum supported device per
   platform.
2. **Group them into tiers** (for example low, mid, high, desktop, web) by
   measured capability: run the project's standard scenario on one example
   device per group.
3. **Pick a target frame rate per tier** with the game-designer. Convert it
   to milliseconds (30 fps = 33.3 ms, 60 fps = 16.7 ms, 120 fps = 8.3 ms).
4. **Reserve headroom**: plan to use about 80-85% of the frame time.
5. **Split each budget** into CPU and GPU, then into sub-budgets: draw
   calls, visible triangles, overdraw layers, full-screen passes, texture
   memory, per-frame allocations.
6. **Agree asset-level budgets** with the technical-artist from those
   sub-budgets.
7. **Choose default quality levers per tier** following `platform-scaling`.
8. **Write the result** in the project's reference docs ("Device tiers and
   quality settings") and link it from the project profile.
9. **Verify** each tier with a 15-minute soak on its weakest example device.

See the [platform-scaling](../reference/skill-platform-scaling.md) and
[frame-budget-profiling](../reference/skill-frame-budget-profiling.md)
reference pages.
