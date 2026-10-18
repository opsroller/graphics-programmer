---
name: rendering-performance
description: Use when profiling or setting budgets for frame time, draw calls, memory or load time.
---

# Rendering performance

- Set budgets per target (frame time, triangles, draw calls, texture
  memory) in the project profile; check the weakest device first.
- Profile before optimising; fix the biggest cost.
- Batch and instance repeated meshes; prefer baked over real-time
  lighting on mobile.
