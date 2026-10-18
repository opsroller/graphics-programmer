*How-to guide, for a graphics programmer asked to build a benchmark, frame-time capture or automated acceptance checks for a build.*

# How to build a benchmark and acceptance checks

This guide takes written budgets and acceptance criteria to a merged tool
that measures a build against them: a repeatable scenario, frame-time
percentiles, checks on captures and a tier feature check.

1. **Find what to measure against.** You need at least one of: frame
   budgets per tier (from
   [How to set frame budgets for device tiers](how-to-set-frame-budgets-for-device-tiers.md)
   or [How to decide rendering features for quality tiers](how-to-decide-rendering-features-for-quality-tiers.md)),
   acceptance criteria from the visual target, or a tier feature table.
   If none exists, get it written first; the tool does not invent
   criteria.
2. **Set up rendering if your machine has no GPU.** In a cloud container
   or CI runner, follow the
   [headless-rendering](../reference/skill-headless-rendering.md) skill
   so the tool can draw real frames there. Expect it to prove the tool
   works, not what anything costs.
3. **Run the workflow:**

   ```
   /graphics-programmer:build-measurement-tool  args: { tool: "benchmark scene and readability checks", spec: "docs/reference/visual-target.md", targets: "desktop-high, mobile, web", wp: "WP-46" }
   ```

   Add `run: { mode: "inline" }` when your session must not spawn agents,
   and send the briefs marked `independent` to a reviewer who did not
   write the tool.
4. **Read the status.** `done` carries a `handoff`, `findings` and
   `next`. `blocked` with `open` lists only failures of the tool: fix
   them, then resume with `run.from` and `run.results`. `unverified` names
   the attack lenses or check that returned nothing: run those steps
   again with `run.only`. It carries no `handoff`
   (`pushed` names the branch), so it cannot be shipped until that rerun
   returns one.
5. **Send the findings.** Each finding is a check failing on today's
   content, with the role that owns it (often the technical artist). Send
   each one to that role (engineering-practices `peer-coordination`); if
   a threshold looks wrong, its owner recalibrates it against captures.
6. **Measure on devices.** Every number in `ran` marked software-rendered
   is not a measurement. Before anyone relies on the budgets, run the
   tool's how-to on each tier's weakest device.
7. **Land it** with the command in `next`: deliver-package with `prior`
   for a work package, otherwise land-pr.

See the [build-measurement-tool](../reference/workflow-build-measurement-tool.md)
reference, [frame-budget-profiling](../reference/skill-frame-budget-profiling.md),
and [About the graphics programmer role](../explanation/about-the-role.md)
for how measuring splits between the graphics programmer and the
technical artist.
