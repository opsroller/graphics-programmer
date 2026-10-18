---
name: web-rendering
description: Use when the game renders in a browser - canvas sizing and device pixel ratio, frame loop and pacing, GPU context loss, browser graphics limits and extensions, texture formats, pointer and gamepad input in a page, background tabs, or a web build that is slow, blurry, or breaks on some browsers.
---

# Rendering for web builds

A web build runs the same game inside a sandbox with stricter limits, more
device variety and a shared main thread. The frontend web developer owns the
page around the canvas; you own everything drawn in it and the input it
receives.

## Method

1. **Size the canvas correctly.**
   - Separate the CSS size (layout) from the drawing-buffer size (pixels).
   - Use the device pixel ratio, but cap it per tier: a 3x phone screen
     triples each axis (9x the pixels). Many games render at a lower
     backbuffer size and upscale.
   - Prefer measuring exact device pixels with a resize observer that reports
     device-pixel content size where available; avoid fractional scaling that
     causes moire.
   - Re-size on resize and orientation change; re-run the camera fit rule
     (see `camera-systems`).
2. **Run the frame loop on the browser's animation-frame callback**, use its
   timestamp for elapsed time, and keep the fixed-step logic from
   `event-presentation`. Expect the callback to stop in background tabs and
   resume with a large gap: clamp the elapsed time and pause the game.
3. **Assume nothing about the GPU.** Query limits and extensions at start and
   fall back gracefully; design to the widely supported minimums (texture
   size, texture units) for the lowest tier. Keep a lower-feature path for
   older graphics API versions if the project supports them.
4. **Avoid synchronous calls in the frame:** error checks, parameter queries,
   shader status checks and pixel readback stall the pipeline. Use them in
   debug builds only; read back asynchronously with fences where needed.
5. **Compile shaders up front**, during loading, ideally with the
   non-blocking compile extension, to avoid first-use hitches.
6. **Handle context loss.** Listen for lost/restored events, stop rendering on
   loss, recreate every GPU resource on restore, and test it with the
   debugging extension that forces a loss. Delete resources you no longer
   need; release probe contexts.
7. **Textures:** compressed formats differ by device; use a universal
   transcodable format or ship per-format variants; mipmap anything
   minified; prefer RGBA8 over RGB8 (RGB is often emulated).
8. **Input in the page:** set `touch-action: none` (or the narrowest value
   that works) on the canvas so the browser does not scroll or zoom; use
   pointer events with capture and cancel handling (see `input-handling`);
   poll the gamepad API once per frame and handle connect/disconnect.
9. **Memory and loading:** budget GPU memory per pixel of canvas, stream
   assets, show progress, and keep the initial download small; coordinate
   compression and hosting with the frontend web developer and devops
   engineer.
10. **Test** on the browser and device matrix in the project profile,
    including at least one low-end phone browser and one with a different
    rendering engine.

## Decision rules

- If it is blurry, check drawing-buffer size against device pixels; if it is
  slow, check whether the drawing buffer is too large first.
- If a feature needs an extension, ship the fallback in the same change.
- If a call returns data to the CPU, it does not belong in the per-frame
  path.

## Quality bar

- Zero graphics API errors in a normal session; only out-of-memory and
  context loss are expected, and both are handled.
- Survives context loss, tab switch, resize and orientation change.
- No page scroll or zoom during play; no stuck input after cancel.
- Holds the tier's frame target in the weakest supported browser/device.

## Failure modes

- Full device-pixel-ratio rendering on high-density phones, overheating them.
- `getError`-style checks left in the release loop.
- Huge time step after returning from a background tab.
- Assuming a desktop extension or texture format exists on phones.
- Losing all textures on context restore.

## Documentation this work needs

Web-specific behaviour (pixel-ratio caps, supported browsers, fallbacks):
**reference**. A procedure for testing a web build across browsers: a
**how-to**. A decision such as the pixel-ratio policy: an **explanation**.
Same PR, one kind per page.
