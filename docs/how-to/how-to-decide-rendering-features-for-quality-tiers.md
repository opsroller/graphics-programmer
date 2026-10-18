*How-to guide, for a graphics programmer asked which rendering features each quality tier gets.*

# How to decide rendering features for quality tiers

This guide shows you how to turn a requested look and a set of device tiers
into a decided, costed rendering path and feature matrix, usually when a
technical artist's visual target hands the question to you.

1. **Get the question and the wanted look.** If a technical artist ran
   `/technical-artist:visual-target`, its Renderer step gives you the
   question, the tiers and the look per tier. Otherwise write the question
   yourself: which features (lighting, shadows, reflections, volumetrics,
   anti-aliasing, upscaling, post) on which tiers. If a decision is
   already written down, do not decide again: follow
   [How to build a rendering system from a renderer decision](how-to-build-a-rendering-system-from-a-renderer-decision.md).
2. **Check the tiers exist.** Each needs a weakest example device and a
   frame budget in ms. If not, follow
   [How to set frame budgets for device tiers](how-to-set-frame-budgets-for-device-tiers.md)
   first, or pass your proposal as `tiers`.
3. **Run the workflow:**

   ```
   /graphics-programmer:renderer-decision  args: { question: "which GI, shadows and reflections each tier gets", tiers: "desktop high 60 fps, mobile 30 fps, web 30 fps", wants: "realistic lighting with soft GI on desktop; readable and warm on mobile" }
   ```

   Add `run: { mode: "inline" }` when your session must not spawn agents.
4. **Read the status.** `decided` is done. `pending` lists the questions
   only someone else can answer: ask them (engineering-practices
   `peer-coordination`) and run again. `blocked` with `open` means the
   budget does not add up even after one revision: drop a feature on the
   tier named, or agree a lower target with the technical artist.
5. **Replace estimates with measurements** before content production
   scales up. The workflow measures every option it can, one at a time, when
   a target device is reachable; any feature whose `evidence` still says
   `estimate` gets a capture on its weakest device.
6. **Hand the decision back.** Give the technical artist the `decision`
   object. They resume their visual target with it as the `renderer` arg,
   and the `constraints` become rules for content.
7. **Build it.** Follow
   [How to build a rendering system from a renderer decision](how-to-build-a-rendering-system-from-a-renderer-decision.md).

See the [renderer-decision](../reference/workflow-renderer-decision.md)
reference and [platform-scaling](../reference/skill-platform-scaling.md).
