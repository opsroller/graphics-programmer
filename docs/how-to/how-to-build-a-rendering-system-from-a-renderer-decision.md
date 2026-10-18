*How-to guide, for a graphics programmer asked to build an engine-side rendering system, such as quality tiers, from a decision that already exists.*

# How to build a rendering system from a renderer decision

This guide takes a written renderer decision (tiers, the technique each
feature gets per tier, fallbacks, costs) to a merged system that applies
it in the engine, with tests and a headless self-test.

1. **Find the decision.** It is usually a reference page written by
   `/graphics-programmer:renderer-decision` or by a technical artist's
   `/technical-artist:visual-target`. If there is none, follow
   [How to decide rendering features for quality tiers](how-to-decide-rendering-features-for-quality-tiers.md)
   first.
2. **Check it and get an implementation plan** without deciding again:

   ```
   /graphics-programmer:renderer-decision  args: { question: "which GI, shadows and reflections each tier gets", decision: "docs/reference/visual-target.md" }
   ```

   `planned` returns `implementationPlan`: the engine setting and value
   per tier and feature, the systems to build in order, the tests, the
   self-test and the budget. `needs-revision` lists `problems`: ask the
   decision's owner to fix them (engineering-practices `peer-coordination`)
   and run this step again.
3. **Build each system in order**, starting with the one `next` names:

   ```
   /graphics-programmer:implement-renderer-system  args: { system: "quality tiers", spec: "docs/reference/visual-target.md", plan: <implementationPlan>, wp: "WP-45" }
   ```

   Add `run: { mode: "inline" }` when your session must not spawn agents,
   and send the briefs marked `independent` to a reviewer who did not
   write the code.
4. **Read the status.** `done` carries a `handoff` and `next`. `blocked`
   with `open` lists only failures: fix them, then resume with `run.from`
   and `run.results`. `unverified` names the attack lenses or check that
   returned nothing: run those steps again with `run.only`.
5. **Replace estimates.** If `measured` says `estimate`, capture each tier
   on its weakest device before content production relies on the budget.
6. **Land it** with the command in `next`: deliver-package with `prior`
   for a work package, otherwise land-pr.

See the [implement-renderer-system](../reference/workflow-implement-renderer-system.md)
and [renderer-decision](../reference/workflow-renderer-decision.md)
references, and [About the graphics programmer role](../explanation/about-the-role.md)
for how the decision and the build split between roles.
