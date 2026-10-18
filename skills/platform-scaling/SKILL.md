---
name: platform-scaling
description: Use when one renderer must serve devices from low-end mobile to desktop - defining device tiers and quality settings, adding dynamic resolution or adaptive quality, handling thermal throttling and battery, matching refresh rates, or optimising for tile-based mobile GPUs.
---

# Scaling across devices

Build for the **weakest supported device first**, then add quality where
the hardware has headroom. Scale with many small, independent levers, not
one coarse preset switch.

## Method

1. **Define tiers** in the project profile: for each tier, example devices,
   target frame rate, render scale, budget, and which features are on.
   Base tiers on measured capability (GPU class, memory, sustained
   performance), not on marketing names.
2. **List quality levers** and measure the cost of each on the weakest
   device: render resolution scale, shadow quality, particle caps, post
   effects, LOD distances, texture resolution, MSAA, view distance,
   simultaneous effects. Rank by cost saved per visible loss.
3. **Choose defaults per tier** from that ranking. Keep every lever
   independent and data-driven.
4. **Adapt at runtime** where the platform allows:
   - dynamic resolution: lower render scale when GPU time nears budget, raise
     it slowly when there is headroom (hysteresis);
   - thermal: read the platform's thermal headroom or state and ease load
     *before* severe throttling, in small increments, clamped to ranges that
     suit the content (Android ADPF guidance warns that generic ranges made
     buildings vanish in one sample);
   - change one lever at a time and spread visual changes over several
     frames;
   - respect user choices: an on-by-default "dynamic performance" toggle and
     the OS battery/performance preference where exposed.
5. **Match the display:** target a frame rate the device can sustain and set
   the display refresh to match it where the platform allows; rendering at 60
   on a 120 Hz panel without pacing wastes power and can judder.
6. **Test across tiers and vendors**: high, mid, low, several GPU vendors;
   baseline without adaptation, then with it; long sessions (15+ minutes).

## Mobile GPU rules (tile-based renderers)

Most mobile GPUs bin geometry into screen tiles and shade each tile in fast
on-chip memory before writing to device memory (Arm, Apple guidance). The
expensive resource is **memory bandwidth**, which also costs heat and
battery.

- **Render-pass load/store:** clear or don't-care on load; don't store
  attachments you will not read (depth, stencil, multisample); use memoryless
  or transient attachments where the API supports them; invalidate after use.
- **Fewer passes, fewer round trips:** each extra render target switch writes
  tiles out and reads them back. Merge passes when possible.
- **Overdraw:** opaque first, front to back; keep blended and alpha-tested
  (discard) surfaces small, because they defeat hidden-surface removal.
  Trim transparent quads to the visible shape.
- **Full-screen effects** cost every pixel; prefer cheaper combined passes,
  lower-resolution buffers, or none on low tiers.
- **Textures:** compress with a format supported on the target (or a
  universal transcoded format), use mipmaps for anything minified, size to
  the on-screen footprint.
- **Shaders:** use reduced precision where the result allows; move work from
  fragment to vertex where it varies smoothly.
- **Geometry:** LODs and culling; the tiler pays for every submitted vertex.

## Desktop and high tiers

Spend headroom on what improves readability and feel first (resolution,
anti-aliasing, frame rate), then on richness (shadows, effects). Support
arbitrary window sizes and aspect ratios; high refresh rates expose any
frame-rate-dependent motion (see `event-presentation`).

## Quality bar

- Each tier holds its target on its weakest example device in a soak test.
- Quality changes are gradual and per-lever; no popping preset jumps.
- Low tier keeps the readable set intact (see `scene-composition`).
- Mobile render passes have explicit load/store choices.

## Failure modes

- Building on a desktop GPU and "optimising for mobile later".
- One global Low/Medium/High switch with nothing in between.
- Dynamic resolution without hysteresis, oscillating every second.
- Storing depth and multisample attachments every frame on mobile.
- Lowering quality so far on low tier that gameplay elements disappear.

## Deciding rendering features per tier

When someone asks which rendering features (lighting, shadows,
reflections, volumetrics, anti-aliasing, upscaling, post) each tier gets,
often from a technical artist's visual target, run the
`renderer-decision` workflow: list realistic options, cost each on the
weakest device of each tier, decide per tier with a fallback for every
feature, and check the sums fit the frame budget before anyone builds
content for it. Label any cost you did not measure as an estimate.

## Documentation this work needs

Tier definitions and levers: **reference** ("Device tiers and quality
settings"). Choices between scaling strategies: an **explanation**. A
procedure for adding a new device or tier: a **how-to**. Same PR, one kind
per page.
