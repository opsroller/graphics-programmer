---
name: headless-rendering
description: Use when the engine must draw real frames on a machine with no GPU or no display, such as a cloud container or CI runner - running a self-test, benchmark, capture or screenshot there, getting the engine binary, software Vulkan or OpenGL (Mesa lavapipe, llvmpipe), a virtual display (Xvfb), falling back to an OpenGL renderer, and knowing what frame times from a software renderer do and do not mean.
---

# Rendering on a machine with no GPU or display

Cloud containers and CI runners usually have no GPU and no screen. The
engine can still draw real frames there with a software rasterizer on the
CPU and a virtual display. That is good enough to prove the renderer
**works** (it starts, draws, applies settings, writes captures). It is
never good enough to prove the renderer is **fast**.

What to capture and how to judge a look from the captures is the technical
artist's look-dev capture skill; this skill gets the frames out of the
machine. Measuring cost on real devices is `frame-budget-profiling`.

## Method

1. **Find out what the machine has** before installing anything. Record
   the answers with the run:
   - A GPU: a vendor tool (`nvidia-smi`), render nodes (`ls /dev/dri`).
   - Vulkan: `vulkaninfo --summary` names each device; `llvmpipe` means
     software.
   - OpenGL: `glxinfo -B` (needs a display) or `eglinfo`; `llvmpipe`
     means software.
   - A display: `$DISPLAY` (X11) or `$WAYLAND_DISPLAY` set and reachable.
   - CPU cores and memory (`nproc`, `free -m`): software rendering is
     bound by them.
2. **Get the engine binary the project pins**, never "latest":
   - Take the version from the project profile or the build config, and
     the exact build flavour (editor or runtime, the language/scripting
     variant, the architecture).
   - Download it from the engine's official release location, check it
     against the published checksum, and unpack it in a cache outside the
     repository (for example `~/.cache/<engine>/<version>/`). Reuse the
     cache on the next run; never commit the binary.
   - Export templates or platform SDKs only when the run exports a build.
   - Downloads go through the machine's proxy settings; if one is
     refused, say which host and stop rather than fetching from a mirror
     nobody vetted.
   - A tool used only to build or test is not shipped, but if it ends up
     in the repository or a release it needs a provenance entry
     (engineering-practices `provenance`).
3. **Install a software renderer** with the system package manager, using
   the names your distribution gives:
   - Vulkan: the Mesa Vulkan drivers package (lavapipe, for example
     `mesa-vulkan-drivers`) and the Vulkan loader and tools
     (`libvulkan1`, `vulkan-tools`). If several drivers are installed,
     select lavapipe with `VK_DRIVER_FILES` (older loaders:
     `VK_ICD_FILENAMES`) pointing at its ICD JSON.
   - OpenGL: the Mesa DRI and GL/EGL packages (llvmpipe, for example
     `libgl1-mesa-dri`, `libegl1`). `LIBGL_ALWAYS_SOFTWARE=1` forces
     llvmpipe when a GPU driver is present but unusable.
   - Confirm with `vulkaninfo --summary` / `glxinfo -B` that the device is
     the one you meant. Lavapipe and llvmpipe support a recent but not
     complete feature set; check the extensions the renderer needs.
4. **Give it a display, or know that it has none.**
   - An engine's own headless or server mode often skips rendering
     entirely (a dummy renderer: no pixels, no GPU timings). Use it for
     imports, unit tests and logic, never for captures or render checks.
   - For real frames, run under a virtual X server:
     `xvfb-run -a -s "-screen 0 <W>x<H>x24" <command>`, with the screen at
     least as large as the window you ask for. Use the engine's offscreen
     or surfaceless mode instead where it has one that really renders.
   - Set the window size the way the engine actually honours it. Some
     versions ignore a command-line resolution flag and need a config
     override (a project or user settings file) written before the run
     and removed after it.
5. **Pick the renderer backend deliberately.**
   - Try the project's main backend first (often Vulkan on lavapipe).
   - If it cannot start (missing extension, crash in the driver), fall
     back to the engine's OpenGL or compatibility renderer and say so.
     A fallback run proves the fallback path only: features the main
     backend has and the fallback lacks are untested.
   - Pass the backend explicitly on the command line, so a run never
     silently uses another one.
6. **Verify every run before trusting it:**
   - The log or the tool's report names the adapter and backend that
     actually ran (`llvmpipe`, `lavapipe`, the API version).
   - Captures are the size you asked for and not blank, black or one
     flat colour.
   - No graphics validation or driver errors; warnings are read, not
     skipped.
   - The process exited by itself, with the status you expected.
7. **Budget the time.** Software rendering is one to two orders of
   magnitude slower than a GPU. Use small windows, few frames and short
   captures; put a timeout on every run; allow for shader compiles in the
   first frames. Long benchmarks belong on devices.
8. **Make it repeatable.** Write the steps as a script or a CI job, not as
   commands someone retypes. The pipeline itself belongs to the devops
   engineer: propose the smallest change (engineering-practices
   `peer-coordination`).

## What software frame times mean

| Number | Means on a software renderer | Use it for |
|---|---|---|
| Frame, CPU and "GPU" time in ms | Shared CPU cores rasterising: noisy, contended, and with a cost profile unlike any GPU (fill rate, bandwidth and tiling behave differently) | Nothing about budgets or tiers. At most a smoke signal that something got pathologically slower, re-checked on a device |
| GPU timer queries | Often unsupported or zero; when present they time CPU work | Report "no GPU timing" rather than 0 ms |
| Draw calls, primitives, visible nodes, active features | The same as on a GPU for the same scene and settings | Real checks: counts against sub-budgets, feature lists against tiers |
| Captures (pixels) | Close to a GPU's but not identical: precision, filtering and missing extensions differ | Layout, framing, composition and coarse readability; confirm look-critical results on a GPU |
| Pass/fail of start-up, settings read-back, determinism | Real | Self-tests and CI smoke runs |

## Decision rules

- A frame time from a software renderer is never a measurement. Label it
  "software renderer, not a measurement" wherever it appears, and never
  write it into budget or tier docs.
- If a check needs pixels, it needs a real display or offscreen surface:
  the engine's headless mode will not do.
- If the main backend will not start, fall back and say what the fallback
  leaves untested; do not quietly ship a result as if the main backend
  ran.
- If the machine has a GPU after all, prefer it, and still record which
  device ran.

## Quality bar

- Every run records engine version, backend, adapter, resolution and
  whether frames were software-rendered.
- The setup is a script or CI job that a fresh machine can run.
- No software frame time reaches a budget table or a performance claim.
- Captures are verified for size and content before anyone judges them.

## Failure modes

- Using the engine's headless mode for captures and getting black or no
  images.
- Downloading "latest" instead of the pinned engine version.
- A window larger than the virtual screen, so captures are cropped.
- A command-line resolution flag the engine ignores, so captures come out
  at the default size.
- The OpenGL fallback ran and the result was reported as the Vulkan path.
- Quoting lavapipe frame times as a tier's cost.

## Documentation this work needs

The commands to render in a container or CI for this project: a
**how-to** ("How to run the renderer without a GPU"). The packages,
versions, variables and what each run reports: **reference**. Why
software numbers are not measurements, if the project needs it said:
an **explanation**. Same PR, one kind per page.
